package gql

import (
	"context"

	"github.com/99designs/gqlgen/graphql"
	"go.uber.org/zap"

	"github.com/looplj/axonhub/internal/contexts"
	"github.com/looplj/axonhub/internal/log"
	"github.com/looplj/axonhub/internal/tracing"
)

type loggingTracer struct{}

var _ interface {
	graphql.HandlerExtension
	graphql.ResponseInterceptor
} = &loggingTracer{}

func (t *loggingTracer) ExtensionName() string {
	return "logging_tracer"
}

func (t *loggingTracer) Validate(schema graphql.ExecutableSchema) error {
	return nil
}

func (t *loggingTracer) InterceptResponse(ctx context.Context, next graphql.ResponseHandler) *graphql.Response {
	if graphql.HasOperationContext(ctx) {
		opCtx := graphql.GetOperationContext(ctx)
		ctx = tracing.WithOperationName(ctx, opCtx.OperationName)

		if log.DebugEnabled(ctx) {
			// Log operation name and query length only, avoid logging full query/variables
			// which may contain sensitive data like passwords or tokens
			log.Debug(ctx, "received graphql request",
				zap.String("operation", opCtx.OperationName),
				zap.Int("query_length", len(opCtx.RawQuery)),
				zap.Int("variables_count", len(opCtx.Variables)),
			)
		}
	}

	resp := next(ctx)

	// Capture GraphQL errors to context for access logging
	if resp != nil && len(resp.Errors) > 0 {
		for _, gqlErr := range resp.Errors {
			contexts.AddError(ctx, gqlErr)
		}
	}

	return resp
}
