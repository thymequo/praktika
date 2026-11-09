package db

import (
	"database/sql"
	"log/slog"
)

func Migrate(db *sql.DB, log *slog.Logger) error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS roles (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			email TEXT NOT NULL,
			phone TEXT,
			role_id TEXT,
			registration_date TEXT,
			FOREIGN KEY (role_id) REFERENCES roles(id)
		)`,
		`CREATE TABLE IF NOT EXISTS products (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			type TEXT,
			gender TEXT,
			size TEXT,
			color TEXT,
			description TEXT,
			brand TEXT,
			season TEXT,
			price REAL
		)`,
		`CREATE TABLE IF NOT EXISTS photos (
			id TEXT PRIMARY KEY,
			filename TEXT NOT NULL,
			product_id TEXT,
			FOREIGN KEY (product_id) REFERENCES products(id)
		)`,
		`CREATE TABLE IF NOT EXISTS carts (
			id TEXT PRIMARY KEY,
			user_id TEXT,
			product_id TEXT,
			count INTEGER,
			FOREIGN KEY (user_id) REFERENCES users(id),
			FOREIGN KEY (product_id) REFERENCES products(id)
		)`,
		`CREATE TABLE IF NOT EXISTS orders (
			id TEXT PRIMARY KEY,
			user_id TEXT,
			date_time TEXT,
			status INTEGER,
			FOREIGN KEY (user_id) REFERENCES users(id)
		)`,
		`CREATE TABLE IF NOT EXISTS order_items (
			id TEXT PRIMARY KEY,
			order_id TEXT,
			product_id TEXT,
			price REAL,
			FOREIGN KEY (order_id) REFERENCES orders(id),
			FOREIGN KEY (product_id) REFERENCES products(id)
		)`,
		`INSERT OR IGNORE INTO roles (id, name) VALUES 
			('1', 'guest'), 
			('2', 'client'), 
			('3', 'manager'), 
			('4', 'admin')`,
	}

	for _, q := range queries {
		if _, err := db.Exec(q); err != nil {
			return err
		}
	}

	log.Info("database migrated")
	return nil
}
