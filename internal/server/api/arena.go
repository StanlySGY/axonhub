package api

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gin-contrib/sse"
	"github.com/gin-gonic/gin"
	"go.uber.org/fx"

	"github.com/looplj/axonhub/internal/ent"
	"github.com/looplj/axonhub/internal/ent/model"
	"github.com/looplj/axonhub/internal/log"
	"github.com/looplj/axonhub/internal/objects"
	"github.com/looplj/axonhub/internal/pkg/xerrors"
	"github.com/looplj/axonhub/internal/server/biz"
	"github.com/looplj/axonhub/internal/server/orchestrator"
	"github.com/looplj/axonhub/llm"
	"github.com/looplj/axonhub/llm/httpclient"
	"github.com/looplj/axonhub/llm/transformer"
	openaitransformer "github.com/looplj/axonhub/llm/transformer/openai"
)

type ArenaResponseError struct {
	Status int `json:"-"`
	Error  struct {
		Code    int    `json:"code,omitempty"`
		Message string `json:"message"`
	} `json:"error"`
}

type ArenaHandlersParams struct {
	fx.In

	ChannelService  *biz.ChannelService
	ModelService    *biz.ModelService
	RequestService  *biz.RequestService
	SystemService   *biz.SystemService
	UsageLogService *biz.UsageLogService
	HttpClient      *httpclient.HttpClient
}

type ArenaHandlers struct {
	ChannelService             *biz.ChannelService
	ModelService               *biz.ModelService
	ChatCompletionOrchestrator *orchestrator.ChatCompletionOrchestrator
}

func NewArenaHandlers(params ArenaHandlersParams) *ArenaHandlers {
	return &ArenaHandlers{
		ChannelService: params.ChannelService,
		ModelService:   params.ModelService,
		ChatCompletionOrchestrator: orchestrator.NewChatCompletionOrchestrator(
			params.ChannelService,
			params.ModelService,
			params.RequestService,
			params.HttpClient,
			openaitransformer.NewInboundTransformer(),
			params.SystemService,
			params.UsageLogService,
		),
	}
}

type ArenaCompareChannel struct {
	ChannelID string `json:"channel_id"`
	Model     string `json:"model"`
}

type ArenaCompareRequest struct {
	Channels []ArenaCompareChannel `json:"channels"`

	Messages []llm.Message `json:"messages"`

	Temperature *float64 `json:"temperature,omitempty"`
	MaxTokens   *int64   `json:"max_tokens,omitempty"`

	System string `json:"system,omitempty"`
}

type arenaChannelResolved struct {
	Index        int    `json:"index"`
	ChannelGID   string `json:"channel_id"`
	ChannelIntID int    `json:"channel_int_id"`
	Model        string `json:"model"`
}

type arenaUsageJSON struct {
	PromptTokens     int64 `json:"prompt_tokens"`
	CompletionTokens int64 `json:"completion_tokens"`
	TotalTokens      int64 `json:"total_tokens"`

	CachedTokens int64 `json:"cached_tokens,omitempty"`

	PromptTokensDetails *struct {
		CachedTokens      int64 `json:"cached_tokens,omitempty"`
		WriteCachedTokens int64 `json:"write_cached_tokens,omitempty"`
	} `json:"prompt_tokens_details,omitempty"`
}

type ArenaChannelMetrics struct {
	TTFTMs    *int64 `json:"ttft_ms,omitempty"`
	LatencyMs int64  `json:"latency_ms"`

	PromptTokens     int64 `json:"prompt_tokens,omitempty"`
	CompletionTokens int64 `json:"completion_tokens,omitempty"`
	TotalTokens      int64 `json:"total_tokens,omitempty"`

	EstimatedCost float64 `json:"estimated_cost,omitempty"`
}

type arenaChunkEnvelope struct {
	ChannelIndex int             `json:"channel_index"`
	ChannelID    string          `json:"channel_id"`
	ChannelIntID int             `json:"channel_int_id"`
	Model        string          `json:"model"`
	Chunk        json.RawMessage `json:"chunk"`
}

type arenaErrorEnvelope struct {
	ChannelIndex int                `json:"channel_index"`
	ChannelID    string             `json:"channel_id"`
	ChannelIntID int                `json:"channel_int_id"`
	Model        string             `json:"model"`
	Error        ArenaResponseError `json:"error"`
}

type arenaMetricsEnvelope struct {
	ChannelIndex int                 `json:"channel_index"`
	ChannelID    string              `json:"channel_id"`
	ChannelIntID int                 `json:"channel_int_id"`
	Model        string              `json:"model"`
	Metrics      ArenaChannelMetrics `json:"metrics"`
}

type arenaMetaEnvelope struct {
	Channels []arenaChannelResolved `json:"channels"`
}

type arenaSSE struct {
	Event string
	Data  []byte
}

func (handlers *ArenaHandlers) Compare(c *gin.Context) {
	ctx := c.Request.Context()

	var req ArenaCompareRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		JSONError(c, http.StatusBadRequest, err)
		return
	}

	if len(req.Channels) == 0 {
		JSONError(c, http.StatusBadRequest, errors.New("channels is required"))
		return
	}
	if len(req.Messages) == 0 {
		JSONError(c, http.StatusBadRequest, errors.New("messages is required"))
		return
	}

	resolved, err := resolveArenaChannels(req.Channels)
	if err != nil {
		JSONError(c, http.StatusBadRequest, err)
		return
	}

	c.Header("Content-Type", sse.ContentType)
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Access-Control-Allow-Origin", "*")
	c.Status(http.StatusOK)
	c.Writer.Flush()

	events := make(chan arenaSSE, 256)
	var wg sync.WaitGroup

	if b, mErr := json.Marshal(arenaMetaEnvelope{Channels: resolved}); mErr == nil {
		writeSSE(c, "meta", b)
	}

	baseMessages := buildMessagesWithSystem(req.System, req.Messages)

	for _, ch := range resolved {
		wg.Add(1)
		go func(ch arenaChannelResolved) {
			defer wg.Done()
			handlers.runChannelCompare(ctx, events, ch, baseMessages, req)
		}(ch)
	}

	go func() {
		wg.Wait()
		close(events)
	}()

	for {
		select {
		case <-ctx.Done():
			return
		case ev, ok := <-events:
			if !ok {
				writeSSE(c, "done", []byte(`{}`))
				return
			}

			if ok := writeSSE(c, ev.Event, ev.Data); !ok {
				return
			}
		}
	}
}

func (handlers *ArenaHandlers) runChannelCompare(
	ctx context.Context,
	events chan<- arenaSSE,
	ch arenaChannelResolved,
	baseMessages []llm.Message,
	req ArenaCompareRequest,
) {
	start := time.Now()

	streamTrue := true
	llmReq := &llm.Request{
		Model:       ch.Model,
		Messages:    baseMessages,
		Temperature: req.Temperature,
		MaxTokens:   req.MaxTokens,
		Stream:      &streamTrue,
	}

	body, err := json.Marshal(llmReq)
	if err != nil {
		handlers.emitChannelError(ctx, events, ch, handlers.HandleError(err))
		return
	}

	httpReq := &httpclient.Request{
		Method: "POST",
		Path:   "/v1/chat/completions",
		Headers: http.Header{
			"Content-Type": []string{"application/json"},
		},
		Body: body,
	}

	processor := handlers.ChatCompletionOrchestrator.WithChannelSelector(
		orchestrator.NewSpecifiedChannelSelector(handlers.ChannelService, objects.GUID{ID: ch.ChannelIntID}),
	)

	result, err := processor.Process(ctx, httpReq)
	if err != nil {
		handlers.emitChannelError(ctx, events, ch, handlers.HandleError(err))
		return
	}

	var (
		firstTokenAt *time.Time
		lastUsage    *arenaUsageJSON
	)

	if result.ChatCompletion != nil {
		resp := result.ChatCompletion
		if len(resp.Body) > 0 {
			now := time.Now()
			firstTokenAt = &now

			handlers.emitChannelChunk(ctx, events, ch, json.RawMessage(resp.Body))

			lastUsage = extractUsageFromJSON(resp.Body)
		}

		handlers.emitChannelMetrics(ctx, events, ch, start, firstTokenAt, lastUsage)
		return
	}

	if result.ChatCompletionStream == nil {
		handlers.emitChannelError(ctx, events, ch, handlers.HandleError(errors.New("empty response")))
		return
	}

	defer func() {
		if cerr := result.ChatCompletionStream.Close(); cerr != nil {
			log.Error(ctx, "Error closing arena stream", log.Cause(cerr))
		}
	}()

	for {
		select {
		case <-ctx.Done():
			return
		default:
			if !result.ChatCompletionStream.Next() {
				if streamErr := result.ChatCompletionStream.Err(); streamErr != nil {
					handlers.emitChannelError(ctx, events, ch, handlers.HandleError(streamErr))
				}
				handlers.emitChannelMetrics(ctx, events, ch, start, firstTokenAt, lastUsage)
				return
			}

			cur := result.ChatCompletionStream.Current()
			if cur == nil {
				continue
			}

			if bytes.Equal(bytes.TrimSpace(cur.Data), []byte("[DONE]")) {
				continue
			}

			if firstTokenAt == nil {
				now := time.Now()
				firstTokenAt = &now
			}

			if u := extractUsageFromJSON(cur.Data); u != nil {
				lastUsage = u
			}

			handlers.emitChannelChunk(ctx, events, ch, json.RawMessage(cur.Data))
		}
	}
}

func buildMessagesWithSystem(system string, messages []llm.Message) []llm.Message {
	if system == "" {
		return messages
	}

	sys := system
	out := make([]llm.Message, 0, len(messages)+1)
	out = append(out, llm.Message{
		Role: "system",
		Content: llm.MessageContent{
			Content: &sys,
		},
	})
	out = append(out, messages...)

	return out
}

func resolveArenaChannels(channels []ArenaCompareChannel) ([]arenaChannelResolved, error) {
	if len(channels) == 0 {
		return nil, errors.New("channels is empty")
	}

	resolved := make([]arenaChannelResolved, 0, len(channels))
	for i, ch := range channels {
		if ch.ChannelID == "" {
			return nil, fmt.Errorf("channels[%d].channel_id is required", i)
		}
		if ch.Model == "" {
			return nil, fmt.Errorf("channels[%d].model is required", i)
		}

		gid, err := objects.ParseGUID(ch.ChannelID)
		if err != nil {
			return nil, fmt.Errorf("channels[%d].channel_id invalid: %w", i, err)
		}
		if gid.Type != ent.TypeChannel {
			return nil, fmt.Errorf("channels[%d].channel_id must be %s", i, ent.TypeChannel)
		}

		resolved = append(resolved, arenaChannelResolved{
			Index:        i,
			ChannelGID:   ch.ChannelID,
			ChannelIntID: gid.ID,
			Model:        ch.Model,
		})
	}

	return resolved, nil
}

func (handlers *ArenaHandlers) emitChannelChunk(ctx context.Context, events chan<- arenaSSE, ch arenaChannelResolved, chunk json.RawMessage) {
	env := arenaChunkEnvelope{
		ChannelIndex: ch.Index,
		ChannelID:    ch.ChannelGID,
		ChannelIntID: ch.ChannelIntID,
		Model:        ch.Model,
		Chunk:        chunk,
	}

	b, err := json.Marshal(env)
	if err != nil {
		return
	}

	select {
	case <-ctx.Done():
		return
	case events <- arenaSSE{Event: "chunk", Data: b}:
	}
}

func (handlers *ArenaHandlers) emitChannelError(ctx context.Context, events chan<- arenaSSE, ch arenaChannelResolved, errResp *ArenaResponseError) {
	if errResp == nil {
		return
	}

	env := arenaErrorEnvelope{
		ChannelIndex: ch.Index,
		ChannelID:    ch.ChannelGID,
		ChannelIntID: ch.ChannelIntID,
		Model:        ch.Model,
		Error:        *errResp,
	}

	b, err := json.Marshal(env)
	if err != nil {
		return
	}

	select {
	case <-ctx.Done():
		return
	case events <- arenaSSE{Event: "error", Data: b}:
	}
}

func (handlers *ArenaHandlers) emitChannelMetrics(
	ctx context.Context,
	events chan<- arenaSSE,
	ch arenaChannelResolved,
	start time.Time,
	firstTokenAt *time.Time,
	usage *arenaUsageJSON,
) {
	metrics := ArenaChannelMetrics{
		LatencyMs: time.Since(start).Milliseconds(),
	}

	if firstTokenAt != nil {
		v := firstTokenAt.Sub(start).Milliseconds()
		metrics.TTFTMs = &v
	}

	if usage != nil {
		metrics.PromptTokens = usage.PromptTokens
		metrics.CompletionTokens = usage.CompletionTokens
		metrics.TotalTokens = usage.TotalTokens

		metrics.EstimatedCost = handlers.estimateCostUSD(ctx, ch.Model, usage)
	}

	env := arenaMetricsEnvelope{
		ChannelIndex: ch.Index,
		ChannelID:    ch.ChannelGID,
		ChannelIntID: ch.ChannelIntID,
		Model:        ch.Model,
		Metrics:      metrics,
	}

	b, err := json.Marshal(env)
	if err != nil {
		return
	}

	select {
	case <-ctx.Done():
		return
	case events <- arenaSSE{Event: "metrics", Data: b}:
	}
}

func (handlers *ArenaHandlers) estimateCostUSD(ctx context.Context, modelID string, usage *arenaUsageJSON) float64 {
	if usage == nil || handlers.ModelService == nil {
		return 0
	}

	var (
		m   *ent.Model
		err error
	)

	m, err = handlers.ModelService.GetModelByModelID(ctx, modelID, model.StatusEnabled)
	if err != nil && ent.IsNotFound(err) {
		m, err = handlers.ModelService.GetModelByModelID(ctx, modelID, model.StatusDisabled)
	}
	if err != nil && ent.IsNotFound(err) {
		m, err = handlers.ModelService.GetModelByModelID(ctx, modelID, model.StatusArchived)
	}
	if err != nil || m == nil || m.ModelCard == nil {
		return 0
	}

	cost := m.ModelCard.Cost
	const per = 1_000_000.0

	promptTokens := float64(usage.PromptTokens)
	completionTokens := float64(usage.CompletionTokens)

	return (promptTokens*cost.Input + completionTokens*cost.Output) / per
}

func extractUsageFromJSON(b []byte) *arenaUsageJSON {
	if len(b) == 0 {
		return nil
	}

	var wrapped struct {
		Usage *arenaUsageJSON `json:"usage"`
	}
	if err := json.Unmarshal(b, &wrapped); err != nil {
		return nil
	}

	if wrapped.Usage == nil {
		return nil
	}

	if wrapped.Usage.PromptTokensDetails != nil && wrapped.Usage.PromptTokensDetails.CachedTokens > 0 {
		wrapped.Usage.CachedTokens = wrapped.Usage.PromptTokensDetails.CachedTokens
	}

	return wrapped.Usage
}

func writeSSE(c *gin.Context, event string, data []byte) bool {
	ctx := c.Request.Context()
	select {
	case <-ctx.Done():
		return false
	default:
	}

	if event != "" {
		_, _ = c.Writer.Write([]byte("event: " + event + "\n"))
	}
	_, _ = c.Writer.Write([]byte("data: "))
	_, _ = c.Writer.Write(data)
	_, _ = c.Writer.Write([]byte("\n\n"))
	c.Writer.Flush()

	return true
}

func (handlers *ArenaHandlers) HandleError(rawErr error) *ArenaResponseError {
	if httpErr, ok := xerrors.As[*httpclient.Error](rawErr); ok {
		msg := tryExtractUpstreamErrorMessage(httpErr.Body)
		if msg == "" {
			msg = http.StatusText(httpErr.StatusCode)
		}

		return &ArenaResponseError{
			Status: httpErr.StatusCode,
			Error: struct {
				Code    int    `json:"code,omitempty"`
				Message string `json:"message"`
			}{
				Code:    httpErr.StatusCode,
				Message: msg,
			},
		}
	}

	if errors.Is(rawErr, transformer.ErrInvalidRequest) {
		return &ArenaResponseError{
			Status: http.StatusBadRequest,
			Error: struct {
				Code    int    `json:"code,omitempty"`
				Message string `json:"message"`
			}{
				Code:    http.StatusBadRequest,
				Message: http.StatusText(http.StatusBadRequest),
			},
		}
	}

	if llmErr, ok := xerrors.As[*llm.ResponseError](rawErr); ok && llmErr != nil {
		if llmErr.Detail.Message == "" {
			return &ArenaResponseError{
				Status: llmErr.StatusCode,
				Error: struct {
					Code    int    `json:"code,omitempty"`
					Message string `json:"message"`
				}{
					Code:    llmErr.StatusCode,
					Message: http.StatusText(llmErr.StatusCode),
				},
			}
		}

		parsedCode, _ := strconv.Atoi(llmErr.Detail.Code)
		if parsedCode == 0 {
			parsedCode = llmErr.StatusCode
		}

		return &ArenaResponseError{
			Status: llmErr.StatusCode,
			Error: struct {
				Code    int    `json:"code,omitempty"`
				Message string `json:"message"`
			}{
				Code:    parsedCode,
				Message: llmErr.Detail.Message,
			},
		}
	}

	return &ArenaResponseError{
		Status: http.StatusInternalServerError,
		Error: struct {
			Code    int    `json:"code,omitempty"`
			Message string `json:"message"`
		}{
			Code:    http.StatusInternalServerError,
			Message: http.StatusText(http.StatusInternalServerError),
		},
	}
}

var _ = context.Background()
