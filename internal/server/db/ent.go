package db

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"entgo.io/ent/dialect"
	"entgo.io/ent/dialect/sql/schema"

	_ "github.com/go-sql-driver/mysql"
	_ "github.com/jackc/pgx/v5/stdlib"

	entsql "entgo.io/ent/dialect/sql"

	"github.com/looplj/axonhub/internal/ent"
	"github.com/looplj/axonhub/internal/ent/migrate"
	"github.com/looplj/axonhub/internal/ent/migrate/datamigrate"
	"github.com/looplj/axonhub/internal/ent/migrate/schemahook"
	"github.com/looplj/axonhub/internal/log"
	_ "github.com/looplj/axonhub/internal/ent/runtime"
	_ "github.com/looplj/axonhub/internal/pkg/sqlite"
)

func NewEntClient(cfg Config) *ent.Client {
	var opts []ent.Option
	if cfg.Debug {
		opts = append(opts, ent.Debug())
	}

	var (
		sqlDB     *sql.DB
		dbDialect string
		err       error
	)

	switch cfg.Dialect {
	case "postgres", "pgx", "postgresdb", "pg", "postgresql":
		sqlDB, err = sql.Open("pgx", cfg.DSN)
		if err != nil {
			panic(err)
		}

		dbDialect = dialect.Postgres
	case "sqlite3", "sqlite":
		sqlDB, err = sql.Open("sqlite3", cfg.DSN)
		if err != nil {
			panic(err)
		}

		dbDialect = dialect.SQLite
	case "mysql", "tidb":
		sqlDB, err = sql.Open("mysql", cfg.DSN)
		if err != nil {
			panic(err)
		}

		dbDialect = dialect.MySQL
	default:
		panic(fmt.Errorf("invalid dialect: %s", cfg.Dialect))
	}

	// Configure connection pool
	if cfg.MaxOpenConns > 0 {
		sqlDB.SetMaxOpenConns(cfg.MaxOpenConns)
	} else if dbDialect == dialect.SQLite {
		// SQLite recommended: single connection to avoid locking issues
		sqlDB.SetMaxOpenConns(1)
	}
	if cfg.MaxIdleConns > 0 {
		sqlDB.SetMaxIdleConns(cfg.MaxIdleConns)
	}

	drv := entsql.OpenDB(dbDialect, sqlDB)
	opts = append(opts, ent.Driver(drv))
	client := ent.NewClient(opts...)

	// Run schema migration with configurable options
	if cfg.AutoMigrate {
		// Use context with timeout for migration
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()

		migrateOpts := []schema.MigrateOption{
			migrate.WithGlobalUniqueID(false),
			migrate.WithForeignKeys(false),
			schema.WithHooks(schemahook.V0_3_0),
		}

		// Only enable drop operations if explicitly configured (dangerous in production)
		if cfg.DropIndex {
			log.Warn(ctx, "database migration: DropIndex is enabled - this may cause data loss")
			migrateOpts = append(migrateOpts, migrate.WithDropIndex(true))
		}
		if cfg.DropColumn {
			log.Warn(ctx, "database migration: DropColumn is enabled - this may cause data loss")
			migrateOpts = append(migrateOpts, migrate.WithDropColumn(true))
		}

		err = client.Schema.Create(ctx, migrateOpts...)
		if err != nil {
			panic(err)
		}

		// Run data migrations using the Migrator framework
		migrator := datamigrate.NewMigrator(client)
		if err := migrator.Run(ctx); err != nil {
			panic(err)
		}
	}

	return client
}
