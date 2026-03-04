// Package config provides application configuration loaded from environment
// variables with sensible defaults for local development.
package config

import (
	"fmt"
	"os"
	"strconv"
)

// Config holds all application configuration.
type Config struct {
	// Server settings
	Host string
	Port int

	// Database
	DBPath string

	// Ollama AI
	OllamaURL   string
	OllamaModel string

	// Security
	APIKey string // Optional: if set, REST API requires this key

	// Logging
	LogLevel string // debug, info, warn, error
}

// Load reads configuration from environment variables with defaults.
func Load() (*Config, error) {
	cfg := &Config{
		Host:        getEnv("STAKEHOLDER_HOST", "127.0.0.1"),
		Port:        getEnvInt("STAKEHOLDER_PORT", 1420),
		DBPath:      getEnv("STAKEHOLDER_DB_PATH", "stakeholder.db"),
		OllamaURL:   getEnv("STAKEHOLDER_OLLAMA_URL", "http://localhost:11434"),
		OllamaModel: getEnv("STAKEHOLDER_OLLAMA_MODEL", "llama3.2"),
		APIKey:   getEnv("STAKEHOLDER_API_KEY", ""),
		LogLevel: getEnv("STAKEHOLDER_LOG_LEVEL", "info"),
	}

	if err := cfg.validate(); err != nil {
		return nil, fmt.Errorf("config validation: %w", err)
	}

	return cfg, nil
}

// Addr returns the listen address string (host:port).
func (c *Config) Addr() string {
	return fmt.Sprintf("%s:%d", c.Host, c.Port)
}

// APIKeyEnabled returns true if REST API key authentication is configured.
func (c *Config) APIKeyEnabled() bool {
	return c.APIKey != ""
}

func (c *Config) validate() error {
	if c.Port < 1 || c.Port > 65535 {
		return fmt.Errorf("port must be between 1 and 65535, got %d", c.Port)
	}
	return nil
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	val, ok := os.LookupEnv(key)
	if !ok {
		return fallback
	}
	n, err := strconv.Atoi(val)
	if err != nil {
		return fallback
	}
	return n
}
