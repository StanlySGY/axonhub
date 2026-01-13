package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/looplj/axonhub/internal/objects"
)

// OpenAI error types following https://platform.openai.com/docs/guides/error-codes
const (
	ErrorTypeInvalidRequestError  = "invalid_request_error"
	ErrorTypeAuthenticationError  = "authentication_error"
	ErrorTypePermissionError      = "permission_error"
	ErrorTypeNotFoundError        = "not_found_error"
	ErrorTypeRateLimitError       = "rate_limit_error"
	ErrorTypeServerError          = "server_error"
	ErrorTypeServiceUnavailable   = "service_unavailable"
	ErrorTypeInsufficientQuota    = "insufficient_quota"
	ErrorTypeInvalidAPIKey        = "invalid_api_key"
	ErrorTypeModelNotFoundError   = "model_not_found"
	ErrorTypeContextLengthExceeded = "context_length_exceeded"
)

// AbortWithError aborts the request with a JSON error response and adds the error to gin context for access logging.
func AbortWithError(c *gin.Context, status int, err error) {
	_ = c.Error(err)
	c.AbortWithStatusJSON(status, objects.ErrorResponse{
		Error: objects.NewError(statusToErrorType(status), err.Error()),
	})
}

// AbortWithOpenAIError aborts the request with an OpenAI-compatible error response.
func AbortWithOpenAIError(c *gin.Context, status int, errType, message string) {
	c.AbortWithStatusJSON(status, objects.ErrorResponse{
		Error: objects.NewError(errType, message),
	})
}

// AbortWithOpenAIErrorCode aborts the request with an OpenAI-compatible error response including error code.
func AbortWithOpenAIErrorCode(c *gin.Context, status int, errType, message, code string) {
	c.AbortWithStatusJSON(status, objects.ErrorResponse{
		Error: objects.NewErrorWithCode(errType, message, code),
	})
}

// statusToErrorType maps HTTP status codes to OpenAI error types.
func statusToErrorType(status int) string {
	switch status {
	case http.StatusBadRequest:
		return ErrorTypeInvalidRequestError
	case http.StatusUnauthorized:
		return ErrorTypeAuthenticationError
	case http.StatusForbidden:
		return ErrorTypePermissionError
	case http.StatusNotFound:
		return ErrorTypeNotFoundError
	case http.StatusTooManyRequests:
		return ErrorTypeRateLimitError
	case http.StatusInternalServerError:
		return ErrorTypeServerError
	case http.StatusServiceUnavailable:
		return ErrorTypeServiceUnavailable
	default:
		return ErrorTypeServerError
	}
}
