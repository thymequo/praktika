package router

import (
	"database/sql"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"clothing-store/internal/handler"
	"clothing-store/internal/repo"
)

func New(db *sql.DB, log *slog.Logger) http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	repository := repo.New(db)
	h := handler.New(repository, log)

	r.Route("/product", func(r chi.Router) {
		r.Post("/", h.CreateProduct)
		r.Get("/", h.GetProducts)
		r.Get("/{id}", h.GetProduct)
		r.Put("/{id}", h.UpdateProduct)
		r.Delete("/{id}", h.DeleteProduct)
	})

	r.Route("/photo", func(r chi.Router) {
		r.Post("/", h.CreatePhoto)
		r.Get("/{id}", h.GetPhoto)
		r.Delete("/{id}", h.DeletePhoto)
	})

	r.Route("/role", func(r chi.Router) {
		r.Post("/", h.CreateRole)
		r.Get("/", h.GetRoles)
		r.Put("/{id}", h.UpdateRole)
		r.Delete("/{id}", h.DeleteRole)
	})

	r.Route("/user", func(r chi.Router) {
		r.Post("/", h.CreateUser)
		r.Get("/", h.GetUsers)
		r.Get("/role/{id}", h.GetUsersByRole)
		r.Put("/{id}", h.UpdateUser)
		r.Delete("/{id}", h.DeleteUser)
	})

	r.Route("/cart", func(r chi.Router) {
		r.Post("/", h.CreateCart)
		r.Get("/{user_id}", h.GetCart)
		r.Put("/{id}", h.UpdateCart)
		r.Delete("/{id}", h.DeleteCart)
	})

	r.Route("/order", func(r chi.Router) {
		r.Post("/", h.CreateOrder)
		r.Get("/", h.GetOrders)
		r.Get("/{id}", h.GetOrder)
		r.Put("/{id}", h.UpdateOrder)
	})

	r.Route("/order_item", func(r chi.Router) {
		r.Post("/", h.CreateOrderItem)
		r.Get("/{order_id}", h.GetOrderItems)
	})

	return r
}