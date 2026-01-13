package server

import (
	"time"

	"github.com/looplj/axonhub/internal/tracing"
)

// DefaultMaxBodySize is the default maximum request body size (32MB)
const DefaultMaxBodySize int64 = 32 << 20

type Config struct {
	Port        int           `conf:"port" yaml:"port" json:"port"`
	Name        string        `conf:"name" yaml:"name" json:"name"`
	BasePath    string        `conf:"base_path" yaml:"base_path" json:"base_path"`
	ReadTimeout time.Duration `conf:"read_timeout" yaml:"read_timeout" json:"read_timeout"`

	// RequestTimeout is the maximum duration for processing a request.
	RequestTimeout time.Duration `conf:"request_timeout" yaml:"request_timeout" json:"request_timeout"`

	// LLMRequestTimeout is the maximum duration for processing a request to LLM.
	LLMRequestTimeout time.Duration `conf:"llm_request_timeout" yaml:"llm_request_timeout" json:"llm_request_timeout"`

	// MaxBodySize is the maximum request body size in bytes (default: 32MB)
	MaxBodySize int64 `conf:"max_body_size" yaml:"max_body_size" json:"max_body_size"`

	Trace tracing.Config `conf:"trace" yaml:"trace" json:"trace"`

	Debug bool `conf:"debug" yaml:"debug" json:"debug"`
	CORS  CORS `conf:"cors" yaml:"cors" json:"cors"`
}

// GetMaxBodySize returns the configured max body size or the default value
func (c *Config) GetMaxBodySize() int64 {
	if c.MaxBodySize <= 0 {
		return DefaultMaxBodySize
	}
	return c.MaxBodySize
}

type CORS struct {
	Enabled          bool          `conf:"enabled" yaml:"enabled" json:"enabled"`
	AllowedOrigins   []string      `conf:"allowed_origins" yaml:"allowed_origins" json:"allowed_origins"`
	AllowedMethods   []string      `conf:"allowed_methods" yaml:"allowed_methods" json:"allowed_methods"`
	AllowedHeaders   []string      `conf:"allowed_headers" yaml:"allowed_headers" json:"allowed_headers"`
	ExposedHeaders   []string      `conf:"exposed_headers" yaml:"exposed_headers" json:"exposed_headers"`
	AllowCredentials bool          `conf:"allow_credentials" yaml:"allow_credentials" json:"allow_credentials"`
	MaxAge           time.Duration `conf:"max_age" yaml:"max_age" json:"max_age"`
}
