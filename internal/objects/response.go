package objects

// ErrorResponse represents a standard error response.
type ErrorResponse struct {
	Error Error `json:"error"`
}

// Error represents error details compatible with OpenAI API format.
type Error struct {
	Message string  `json:"message"`
	Type    string  `json:"type"`
	Param   *string `json:"param"`
	Code    *string `json:"code"`
}

// NewError creates a new Error with the given type and message.
func NewError(errType, message string) Error {
	return Error{
		Type:    errType,
		Message: message,
	}
}

// NewErrorWithCode creates a new Error with type, message, and code.
func NewErrorWithCode(errType, message, code string) Error {
	return Error{
		Type:    errType,
		Message: message,
		Code:    &code,
	}
}
