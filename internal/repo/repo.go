package repo

import (
	"database/sql"
	"fmt"

	"clothing-store/internal/model"
)

type Repo struct {
	db *sql.DB
}

func New(db *sql.DB) *Repo {
	return &Repo{db: db}
}

func (r *Repo) CreateProduct(p *model.Product) error {
	_, err := r.db.Exec("INSERT INTO products (id, name, type, gender, size, color, description, brand, season, price, photo_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
		p.ID, p.Name, p.Type, p.Gender, p.Size, p.Color, p.Description, p.Brand, p.Season, p.Price, p.PhotoID)
	return err
}

func (r *Repo) GetProducts(limit, offset int, filters map[string]string, sortBy string) ([]model.Product, error) {
	query := "SELECT id, name, type, gender, size, color, description, brand, season, price, photo_id FROM products WHERE 1=1"
	args := []interface{}{}

	for k, v := range filters {
		if v != "" {
			query += fmt.Sprintf(" AND %s = ?", k)
			args = append(args, v)
		}
	}

	if sortBy != "" {
		query += " ORDER BY " + sortBy
	}

	query += " LIMIT ? OFFSET ?"
	args = append(args, limit, offset)

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []model.Product
	for rows.Next() {
		var p model.Product
		if err := rows.Scan(&p.ID, &p.Name, &p.Type, &p.Gender, &p.Size, &p.Color, &p.Description, &p.Brand, &p.Season, &p.Price, &p.PhotoID); err != nil {
			return nil, err
		}
		products = append(products, p)
	}
	return products, nil
}

func (r *Repo) GetProduct(id string) (*model.Product, error) {
	p := &model.Product{}
	err := r.db.QueryRow("SELECT id, name, type, gender, size, color, description, brand, season, price, photo_id FROM products WHERE id = ?", id).
		Scan(&p.ID, &p.Name, &p.Type, &p.Gender, &p.Size, &p.Color, &p.Description, &p.Brand, &p.Season, &p.Price, &p.PhotoID)
	if err != nil {
		return nil, err
	}
	return p, nil
}

func (r *Repo) UpdateProduct(p *model.Product) error {
	_, err := r.db.Exec("UPDATE products SET name=?, type=?, gender=?, size=?, color=?, description=?, brand=?, season=?, price=? WHERE id=?",
		p.Name, p.Type, p.Gender, p.Size, p.Color, p.Description, p.Brand, p.Season, p.Price, p.ID)
	return err
}

func (r *Repo) SetProductPhoto(productID, photoID string) error {
	_, err := r.db.Exec("UPDATE products SET photo_id = ? WHERE id = ?", photoID, productID)
	return err
}

func (r *Repo) DeleteProduct(id string) error {
	_, err := r.db.Exec("DELETE FROM products WHERE id = ?", id)
	return err
}

func (r *Repo) CreatePhoto(p *model.Photo) error {
	_, err := r.db.Exec("INSERT INTO photos (id, filename, product_id) VALUES (?, ?, ?)", p.ID, p.Filename, p.ProductID)
	return err
}

func (r *Repo) GetPhoto(id string) (*model.Photo, error) {
	p := &model.Photo{}
	err := r.db.QueryRow("SELECT id, filename, product_id FROM photos WHERE id = ?", id).Scan(&p.ID, &p.Filename, &p.ProductID)
	if err != nil {
		return nil, err
	}
	return p, nil
}

func (r *Repo) DeletePhoto(id string) error {
	_, err := r.db.Exec("DELETE FROM photos WHERE id = ?", id)
	return err
}

func (r *Repo) CreateRole(role *model.Role) error {
	_, err := r.db.Exec("INSERT INTO roles (id, name) VALUES (?, ?)", role.ID, role.Name)
	return err
}

func (r *Repo) GetRoles() ([]model.Role, error) {
	rows, err := r.db.Query("SELECT id, name FROM roles")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var roles []model.Role
	for rows.Next() {
		var role model.Role
		if err := rows.Scan(&role.ID, &role.Name); err != nil {
			return nil, err
		}
		roles = append(roles, role)
	}
	return roles, nil
}

func (r *Repo) UpdateRole(role *model.Role) error {
	_, err := r.db.Exec("UPDATE roles SET name=? WHERE id=?", role.Name, role.ID)
	return err
}

func (r *Repo) DeleteRole(id string) error {
	_, err := r.db.Exec("DELETE FROM roles WHERE id = ?", id)
	return err
}

func (r *Repo) CreateUser(u *model.User) error {
	_, err := r.db.Exec("INSERT INTO users (id, name, email, phone, password, role_id, registration_date) VALUES (?, ?, ?, ?, ?, ?, ?)",
		u.ID, u.Name, u.Email, u.Phone, u.Password, u.RoleID, u.RegistrationDate)
	return err
}

func (r *Repo) GetUserByEmail(email string) (*model.User, error) {
	u := &model.User{}
	err := r.db.QueryRow(
		"SELECT id, name, email, phone, password, role_id, registration_date FROM users WHERE email = ?",
		email,
	).Scan(&u.ID, &u.Name, &u.Email, &u.Phone, &u.Password, &u.RoleID, &u.RegistrationDate)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, err
	}
	return u, nil
}

func (r *Repo) GetUsers(limit, offset int, roleID string) ([]model.User, error) {
	query := "SELECT id, name, email, phone, role_id, registration_date FROM users"
	args := []interface{}{}

	if roleID != "" {
		query += " WHERE role_id = ?"
		args = append(args, roleID)
	}

	query += " LIMIT ? OFFSET ?"
	args = append(args, limit, offset)

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []model.User
	for rows.Next() {
		var u model.User
		if err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.Phone, &u.RoleID, &u.RegistrationDate); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}

func (r *Repo) UpdateUser(u *model.User) error {
	_, err := r.db.Exec("UPDATE users SET name=?, email=?, phone=?, role_id=? WHERE id=?",
		u.Name, u.Email, u.Phone, u.RoleID, u.ID)
	return err
}

func (r *Repo) DeleteUser(id string) error {
	_, err := r.db.Exec("DELETE FROM users WHERE id = ?", id)
	return err
}

func (r *Repo) CreateCart(c *model.Cart) error {
	_, err := r.db.Exec("INSERT INTO carts (id, user_id, product_id, count) VALUES (?, ?, ?, ?)", c.ID, c.UserID, c.ProductID, c.Count)
	return err
}

func (r *Repo) GetCart(userID string) ([]model.Cart, error) {
	rows, err := r.db.Query("SELECT id, user_id, product_id, count FROM carts WHERE user_id = ?", userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var carts []model.Cart
	for rows.Next() {
		var c model.Cart
		if err := rows.Scan(&c.ID, &c.UserID, &c.ProductID, &c.Count); err != nil {
			return nil, err
		}
		carts = append(carts, c)
	}
	return carts, nil
}

func (r *Repo) UpdateCart(c *model.Cart) error {
	_, err := r.db.Exec("UPDATE carts SET count=? WHERE id=?", c.Count, c.ID)
	return err
}

func (r *Repo) DeleteCart(id string) error {
	_, err := r.db.Exec("DELETE FROM carts WHERE id = ?", id)
	return err
}

func (r *Repo) CreateOrder(o *model.Order) error {
	_, err := r.db.Exec("INSERT INTO orders (id, user_id, date_time, status) VALUES (?, ?, ?, ?)", o.ID, o.UserID, o.DateTime, o.Status)
	return err
}

func (r *Repo) GetOrders(limit, offset int, from, to string, status int) ([]model.Order, error) {
	query := "SELECT id, user_id, date_time, status FROM orders WHERE 1=1"
	args := []interface{}{}

	if from != "" {
		query += " AND date_time >= ?"
		args = append(args, from)
	}
	if to != "" {
		query += " AND date_time <= ?"
		args = append(args, to)
	}
	if status > 0 {
		query += " AND status = ?"
		args = append(args, status)
	}

	query += " LIMIT ? OFFSET ?"
	args = append(args, limit, offset)

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orders []model.Order
	for rows.Next() {
		var o model.Order
		if err := rows.Scan(&o.ID, &o.UserID, &o.DateTime, &o.Status); err != nil {
			return nil, err
		}
		orders = append(orders, o)
	}
	return orders, nil
}

func (r *Repo) GetOrder(id string) (*model.Order, error) {
	o := &model.Order{}
	err := r.db.QueryRow("SELECT id, user_id, date_time, status FROM orders WHERE id = ?", id).
		Scan(&o.ID, &o.UserID, &o.DateTime, &o.Status)
	if err != nil {
		return nil, err
	}
	return o, nil
}

func (r *Repo) UpdateOrder(o *model.Order) error {
	_, err := r.db.Exec("UPDATE orders SET status=? WHERE id=?", o.Status, o.ID)
	return err
}

func (r *Repo) CreateOrderItem(oi *model.OrderItem) error {
	_, err := r.db.Exec("INSERT INTO order_items (id, order_id, product_id, price) VALUES (?, ?, ?, ?)", oi.ID, oi.OrderID, oi.ProductID, oi.Price)
	return err
}

func (r *Repo) GetOrderItems(orderID string) ([]model.OrderItem, error) {
	rows, err := r.db.Query("SELECT id, order_id, product_id, price FROM order_items WHERE order_id = ?", orderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []model.OrderItem
	for rows.Next() {
		var oi model.OrderItem
		if err := rows.Scan(&oi.ID, &oi.OrderID, &oi.ProductID, &oi.Price); err != nil {
			return nil, err
		}
		items = append(items, oi)
	}
	return items, nil
}