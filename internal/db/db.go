package db

import (
	"database/sql"
	"log/slog"

	_ "modernc.org/sqlite"
)

func New(dbPath string, log *slog.Logger) (*sql.DB, error) {
	database, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, err
	}

	if err := database.Ping(); err != nil {
		return nil, err
	}

	log.Info("database connected", "path", dbPath)
	return database, nil
}
