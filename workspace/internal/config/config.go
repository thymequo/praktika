package config

import (
	"log/slog"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port   string
	DBPath string
}

func Load(log *slog.Logger) *Config {
	_ = godotenv.Load()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "store.db"
	}

	return &Config{
		Port:   port,
		DBPath: dbPath,
	}
}
