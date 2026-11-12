package main

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"embed"
	"encoding/hex"
	"fmt"
	"io/fs"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"clothing-store/internal/config"
	"clothing-store/internal/db"
	"clothing-store/internal/router"
	"clothing-store/pkg/logger"

	"github.com/google/uuid"
)

//go:embed frontend/*
var frontendFiles embed.FS

func main() {
	log := logger.New()
	cfg := config.Load(log)

	database, err := db.New(cfg.DBPath, log)
	if err != nil {
		log.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer database.Close()

	db.Migrate(database)

	ensureAdminExists(database)

	staticFiles, _ := fs.Sub(frontendFiles, "frontend")
	fileServer := http.FileServer(http.FS(staticFiles))

	apiRouter := router.New(database, log)

	mux := http.NewServeMux()
	
	mux.Handle("/product", apiRouter)
	mux.Handle("/product/", apiRouter)
	mux.Handle("/photo", apiRouter)
	mux.Handle("/photo/", apiRouter)
	mux.Handle("/role", apiRouter)
	mux.Handle("/role/", apiRouter)
	mux.Handle("/user", apiRouter)
	mux.Handle("/user/", apiRouter)
	mux.Handle("/cart", apiRouter)
	mux.Handle("/cart/", apiRouter)
	mux.Handle("/order", apiRouter)
	mux.Handle("/order/", apiRouter)
	mux.Handle("/order_item", apiRouter)
	mux.Handle("/order_item/", apiRouter)

	mux.Handle("/", fileServer)

	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: mux,
	}

	go func() {
		log.Info("starting server", "port", cfg.Port)
		log.Info("frontend embedded, open http://localhost:" + cfg.Port)
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

func ensureAdminExists(database *sql.DB) {
	password := "123456"
	hash := sha256.Sum256([]byte(password))
	hashedPassword := hex.EncodeToString(hash[:])

	// Проверяем, есть ли админ
	var count int
	err := database.QueryRow("SELECT COUNT(*) FROM users WHERE email = ?", "admin@demo.com").Scan(&count)
	if err != nil {
		fmt.Printf("Warning: could not check admin user: %v\n", err)
		return
	}

	if count == 0 {
		// Создаём нового админа
		id := uuid.New().String()
		regDate := time.Now().Format(time.RFC3339)

		_, err := database.Exec(
			"INSERT INTO users (id, name, email, phone, password, role_id, registration_date) VALUES (?, ?, ?, ?, ?, ?, ?)",
			id, "Admin", "admin@demo.com", "+79990000000", hashedPassword, "4", regDate,
		)
		if err != nil {
			fmt.Printf("Warning: could not create admin user: %v\n", err)
		} else {
			fmt.Println("✓ Admin user created: admin@demo.com / 123456")
		}
	} else {
		// Если админ уже есть, принудительно обновляем ему пароль на правильный хеш
		_, err := database.Exec("UPDATE users SET password = ? WHERE email = ?", hashedPassword, "admin@demo.com")
		if err != nil {
			fmt.Printf("Warning: could not update admin password: %v\n", err)
		} else {
			fmt.Println("✓ Admin password verified/updated: admin@demo.com / 123456")
		}
	}
}