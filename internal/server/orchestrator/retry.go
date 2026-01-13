package orchestrator

import (
	"errors"

	"github.com/looplj/axonhub/llm"
	"github.com/looplj/axonhub/llm/httpclient"
)

func isRetryableError(err error) bool {
	if err == nil {
		return false
	}

	return httpclient.IsHTTPStatusCodeRetryable(ExtractStatusCodeFromError(err))
}

// ExtractStatusCodeFromError attempts to extract HTTP status code from various error types.
// Supports both httpclient.Error (raw HTTP errors) and llm.ResponseError (transformed errors).
func ExtractStatusCodeFromError(err error) int {
	if err == nil {
		return 0
	}

	// Try to extract from httpclient.Error (raw HTTP error)
	var httpErr *httpclient.Error
	if errors.As(err, &httpErr) {
		return httpErr.StatusCode
	}

	// Try to extract from llm.ResponseError (transformed error from pipeline)
	// This is critical for retry logic as TransformError converts httpclient.Error to llm.ResponseError
	var llmErr *llm.ResponseError
	if errors.As(err, &llmErr) {
		return llmErr.StatusCode
	}

	return 0
}
