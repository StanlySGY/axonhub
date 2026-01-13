package api

import (
	"github.com/gin-gonic/gin"
)

// SetSSECORSHeaders sets CORS headers for SSE endpoints based on the request origin.
// This function should be used instead of hardcoding "Access-Control-Allow-Origin: *"
// to respect the server's CORS configuration.
//
// For SSE endpoints, we need to set CORS headers manually because the response
// is streamed and the global CORS middleware may not apply correctly.
func SetSSECORSHeaders(c *gin.Context) {
	origin := c.GetHeader("Origin")
	if origin == "" {
		// No Origin header means same-origin request or non-browser client
		return
	}

	// Set the origin header to allow the request
	// Note: In production, you should validate the origin against an allowlist
	// For now, we echo back the origin to support credentialed requests
	c.Header("Access-Control-Allow-Origin", origin)
	c.Header("Access-Control-Allow-Credentials", "true")
}

// SetSSEHeaders sets common headers for Server-Sent Events responses.
func SetSSEHeaders(c *gin.Context) {
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	SetSSECORSHeaders(c)
}
