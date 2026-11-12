package handler

import (
	"io"
	"net/http"
	"os"
	"path/filepath"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"clothing-store/internal/model"
)

const uploadDir = "./uploads"

func init() {
	os.MkdirAll(uploadDir, os.ModePerm)
}

func (h *Handler) CreatePhoto(w http.ResponseWriter, r *http.Request) {
	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "failed to get file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	filename := uuid.New().String() + filepath.Ext(header.Filename)
	dst, err := os.Create(filepath.Join(uploadDir, filename))
	if err != nil {
		http.Error(w, "failed to save file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		http.Error(w, "failed to copy file", http.StatusInternalServerError)
		return
	}

	productID := r.FormValue("product_id")
	p := &model.Photo{
		ID:        uuid.New().String(),
		Filename:  filename,
		ProductID: productID,
	}

	if err := h.repo.CreatePhoto(p); err != nil {
		os.Remove(filepath.Join(uploadDir, filename))
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// link photo to product immediately
	if productID != "" {
		h.repo.SetProductPhoto(productID, p.ID)
	}

	writeJSON(w, http.StatusCreated, p)
}

func (h *Handler) GetPhoto(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	p, err := h.repo.GetPhoto(id)
	if err != nil {
		http.Error(w, "photo not found", http.StatusNotFound)
		return
	}

	path := filepath.Join(uploadDir, p.Filename)
	w.Header().Set("Content-Type", "image/jpeg")
	http.ServeFile(w, r, path)
}

func (h *Handler) DeletePhoto(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	p, err := h.repo.GetPhoto(id)
	if err == nil {
		os.Remove(filepath.Join(uploadDir, p.Filename))
	}

	if err := h.repo.DeletePhoto(id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}