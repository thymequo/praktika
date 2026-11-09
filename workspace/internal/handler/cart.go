package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"clothing-store/internal/model"
)

func (h *Handler) CreateCart(w http.ResponseWriter, r *http.Request) {
	var c model.Cart
	if err := readJSON(r, &c); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	c.ID = uuid.New().String()
	if err := h.repo.CreateCart(&c); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusCreated, c)
}

func (h *Handler) GetCart(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "user_id")
	carts, err := h.repo.GetCart(userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, carts)
}

func (h *Handler) UpdateCart(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var c model.Cart
	if err := readJSON(r, &c); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	c.ID = id
	if err := h.repo.UpdateCart(&c); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, c)
}

func (h *Handler) DeleteCart(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.repo.DeleteCart(id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
