package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"clothing-store/internal/repo"
)

type Handler struct {
	repo *repo.Repo
	log  *slog.Logger
}

func New(repo *repo.Repo, log *slog.Logger) *Handler {
	return &Handler{repo: repo, log: log}
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if data != nil {
		json.NewEncoder(w).Encode(data)
	}
}

func readJSON(r *http.Request, v interface{}) error {
	return json.NewDecoder(r.Body).Decode(v)
}
