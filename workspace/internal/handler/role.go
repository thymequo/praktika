package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"clothing-store/internal/model"
)

func (h *Handler) CreateRole(w http.ResponseWriter, r *http.Request) {
	var role model.Role
	if err := readJSON(r, &role); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	role.ID = uuid.New().String()
	if err := h.repo.CreateRole(&role); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusCreated, role)
}

func (h *Handler) GetRoles(w http.ResponseWriter, r *http.Request) {
	roles, err := h.repo.GetRoles()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, roles)
}

func (h *Handler) UpdateRole(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var role model.Role
	if err := readJSON(r, &role); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	role.ID = id
	if err := h.repo.UpdateRole(&role); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, role)
}

func (h *Handler) DeleteRole(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.repo.DeleteRole(id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
