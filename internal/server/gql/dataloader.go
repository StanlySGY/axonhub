package gql

import (
	"context"
	"fmt"

	"github.com/graph-gophers/dataloader/v7"
	"github.com/samber/lo"

	"github.com/looplj/axonhub/internal/ent"
	"github.com/looplj/axonhub/internal/ent/channel"
	"github.com/looplj/axonhub/internal/ent/requestexecution"
)

// Loaders holds all dataloaders for the GraphQL server.
type Loaders struct {
	ChannelLoader        *dataloader.Loader[int, *ent.Channel]
	ExecutionCountLoader *dataloader.Loader[int, int]
}

// loaderKey is the context key for dataloaders.
type loaderKey struct{}

// NewLoaders creates a new Loaders instance with all dataloaders configured.
func NewLoaders(client *ent.Client) *Loaders {
	return &Loaders{
		ChannelLoader: dataloader.NewBatchedLoader(
			newChannelBatchFunc(client),
			dataloader.WithCache[int, *ent.Channel](&dataloader.NoCache[int, *ent.Channel]{}),
		),
		ExecutionCountLoader: dataloader.NewBatchedLoader(
			newExecutionCountBatchFunc(client),
			dataloader.WithCache[int, int](&dataloader.NoCache[int, int]{}),
		),
	}
}

// WithLoaders adds dataloaders to the context.
func WithLoaders(ctx context.Context, loaders *Loaders) context.Context {
	return context.WithValue(ctx, loaderKey{}, loaders)
}

// GetLoaders retrieves dataloaders from the context.
func GetLoaders(ctx context.Context) *Loaders {
	loaders, ok := ctx.Value(loaderKey{}).(*Loaders)
	if !ok {
		return nil
	}
	return loaders
}

// newChannelBatchFunc creates a batch function for loading channels by ID.
func newChannelBatchFunc(client *ent.Client) dataloader.BatchFunc[int, *ent.Channel] {
	return func(ctx context.Context, keys []int) []*dataloader.Result[*ent.Channel] {
		// Filter out zero IDs
		validKeys := lo.Filter(keys, func(id int, _ int) bool { return id != 0 })

		// Query all channels in one batch
		channels, err := client.Channel.Query().
			Where(channel.IDIn(validKeys...)).
			All(ctx)

		// Build a map for quick lookup
		channelMap := make(map[int]*ent.Channel, len(channels))
		for _, ch := range channels {
			channelMap[ch.ID] = ch
		}

		// Build results in the same order as keys
		results := make([]*dataloader.Result[*ent.Channel], len(keys))
		for i, key := range keys {
			if key == 0 {
				results[i] = &dataloader.Result[*ent.Channel]{Data: nil, Error: nil}
				continue
			}

			if err != nil {
				results[i] = &dataloader.Result[*ent.Channel]{
					Error: fmt.Errorf("failed to load channel %d: %w", key, err),
				}
				continue
			}

			ch, ok := channelMap[key]
			if !ok {
				// Channel not found - return nil without error (soft delete or doesn't exist)
				results[i] = &dataloader.Result[*ent.Channel]{Data: nil, Error: nil}
				continue
			}

			results[i] = &dataloader.Result[*ent.Channel]{Data: ch}
		}

		return results
	}
}

// LoadChannel loads a channel by ID using the dataloader.
// Returns nil if the channel doesn't exist or ID is 0.
func LoadChannel(ctx context.Context, channelID int) (*ent.Channel, error) {
	loaders := GetLoaders(ctx)
	if loaders == nil {
		return nil, fmt.Errorf("dataloaders not found in context")
	}

	thunk := loaders.ChannelLoader.Load(ctx, channelID)
	return thunk()
}

// LoadExecutionCount loads execution count by request ID using the dataloader.
// Returns 0 if the request doesn't exist or ID is 0.
func LoadExecutionCount(ctx context.Context, requestID int) (int, error) {
	loaders := GetLoaders(ctx)
	if loaders == nil {
		return 0, fmt.Errorf("dataloaders not found in context")
	}

	thunk := loaders.ExecutionCountLoader.Load(ctx, requestID)
	return thunk()
}

// newExecutionCountBatchFunc creates a batch function for loading execution counts by request ID.
func newExecutionCountBatchFunc(client *ent.Client) dataloader.BatchFunc[int, int] {
	return func(ctx context.Context, requestIDs []int) []*dataloader.Result[int] {
		// Filter out zero IDs
		validIDs := lo.Filter(requestIDs, func(id int, _ int) bool { return id != 0 })

		// Query execution counts grouped by request_id
		var counts []struct {
			RequestID int `json:"request_id"`
			Count     int `json:"count"`
		}

		err := client.RequestExecution.Query().
			Where(requestexecution.RequestIDIn(validIDs...)).
			GroupBy(requestexecution.FieldRequestID).
			Aggregate(ent.Count()).
			Scan(ctx, &counts)

		// Build a map for quick lookup
		countMap := make(map[int]int, len(counts))
		for _, c := range counts {
			countMap[c.RequestID] = c.Count
		}

		// Build results in the same order as keys
		results := make([]*dataloader.Result[int], len(requestIDs))
		for i, requestID := range requestIDs {
			if requestID == 0 {
				results[i] = &dataloader.Result[int]{Data: 0, Error: nil}
				continue
			}

			if err != nil {
				results[i] = &dataloader.Result[int]{
					Error: fmt.Errorf("failed to load execution count for request %d: %w", requestID, err),
				}
				continue
			}

			count, ok := countMap[requestID]
			if !ok {
				// No executions found - return 0
				results[i] = &dataloader.Result[int]{Data: 0, Error: nil}
				continue
			}

			results[i] = &dataloader.Result[int]{Data: count}
		}

		return results
	}
}
