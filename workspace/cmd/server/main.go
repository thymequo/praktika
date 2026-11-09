package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"clothing-store/internal/config"
	"clothing-store/internal/db"
	"clothing-store/internal/router"
	"clothing-store/pkg/logger"
)

func main() {
	log := logger.New()
	cfg := config.Load(log)

	database, err := db.New(cfg.DBPath, log)
	if err != nil {
		log.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer database.Close()

	if err := db.Migrate(database, log); err != nil {
		log.Error("failed to migrate database", "error", err)
		os.Exit(1)
	}

	r := router.New(database, log)

	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: r,
	}

	go func() {
		log.Info("starting server", "port", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info("shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Error("server forced to shutdown", "error", err)
	}
}
