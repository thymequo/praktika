package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"clothing-store/internal/model"
)

func (h *Handler) CreateOrderItem(w http.ResponseWriter, r *http.Request) {
	var oi model.OrderItem
	if err := readJSON(r, &oi); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	oi.ID = uuid.New().String()
	if err := h.repo.CreateOrderItem(&oi); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusCreated, oi)
}

func (h *Handler) GetOrderItems(w http.ResponseWriter, r *http.Request) {
	orderID := chi.URLParam(r, "order_id")
	items, err := h.repo.GetOrderItems(orderID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, items)
}
