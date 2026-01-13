package db

type Config struct {
	Dialect       string `conf:"dialect" yaml:"dialect" json:"dialect"`
	DSN           string `conf:"dsn" yaml:"dsn" json:"dsn"`
	Debug         bool   `conf:"debug" yaml:"debug" json:"debug"`
	AutoMigrate   bool   `conf:"auto_migrate" yaml:"auto_migrate" json:"auto_migrate"`
	DropIndex     bool   `conf:"drop_index" yaml:"drop_index" json:"drop_index"`
	DropColumn    bool   `conf:"drop_column" yaml:"drop_column" json:"drop_column"`
	MaxOpenConns  int    `conf:"max_open_conns" yaml:"max_open_conns" json:"max_open_conns"`
	MaxIdleConns  int    `conf:"max_idle_conns" yaml:"max_idle_conns" json:"max_idle_conns"`
}
