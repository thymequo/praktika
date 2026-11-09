package handler

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"clothing-store/internal/model"
)

func (h *Handler) CreateProduct(w http.ResponseWriter, r *http.Request) {
	var p model.Product
	if err := readJSON(r, &p); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	p.ID = uuid.New().String()
	if err := h.repo.CreateProduct(&p); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusCreated, p)
}

func (h *Handler) GetProducts(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	if limit == 0 {
		limit = 10
	}

	filters := map[string]string{
		"type":   r.URL.Query().Get("type"),
		"gender": r.URL.Query().Get("gender"),
		"size":   r.URL.Query().Get("size"),
		"color":  r.URL.Query().Get("color"),
		"brand":  r.URL.Query().Get("brand"),
		"season": r.URL.Query().Get("season"),
	}

	sortBy := r.URL.Query().Get("sort")
	if sortBy == "price_asc" {
		sortBy = "price ASC"
	} else if sortBy == "price_desc" {
		sortBy = "price DESC"
	} else {
		sortBy = ""
	}

	products, err := h.repo.GetProducts(limit, offset, filters, sortBy)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, products)
}

func (h *Handler) GetProduct(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	p, err := h.repo.GetProduct(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}
	writeJSON(w, http.StatusOK, p)
}

func (h *Handler) UpdateProduct(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var p model.Product
	if err := readJSON(r, &p); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	p.ID = id
	if err := h.repo.UpdateProduct(&p); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, p)
}

func (h *Handler) DeleteProduct(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.repo.DeleteProduct(id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
