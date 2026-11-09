## Сетап

.env.example
PORT=8080
DB_PATH=store.db


1. зависимости: `go mod tidy`
2. cd "/c/Users/thyme/Documents/.Important/Golang Projects/workspace" 
3. запуск сервера: `go run cmd/server/main.go`

### Продукт
- `POST /product` - Создать продукт (admin)
  ```bash
  curl -X POST http://localhost:8080/product -H "Content-Type: application/json" -d '{"name":"T-Shirt","type":"tops","gender":"male","size":"M","color":"black","brand":"Nike","season":"summer","price":29.99}'
  ```
- `GET /product` - Список продуктов (?limit=&offset=&type=&gender=&size=&color=&brand=&season=&sort=price_asc|price_desc)
  ```bash
  curl http://localhost:8080/product?limit=10&offset=0&sort=price_asc
  ```
- `GET /product/{id}` - Достать продукт
  ```bash
  curl http://localhost:8080/product/<uuid>
  ```
- `PUT /product/{id}` - Обновить продукт
  ```bash
  curl -X PUT http://localhost:8080/product/<uuid> -H "Content-Type: application/json" -d '{"name":"Updated T-Shirt","price":39.99}'
  ```
- `DELETE /product/{id}` - Удалить продукт
  ```bash
  curl -X DELETE http://localhost:8080/product/<uuid>
  ```

### Фото
- `POST /photo` - Загрузить фото (multipart/form-data, fields: file, product_id)
  ```bash
  curl -X POST http://localhost:8080/photo -F "file=@test.jpg" -F "product_id=<uuid>"
  ```
- `GET /photo/{id}` - Взять данные о фото
  ```bash
  curl http://localhost:8080/photo/<uuid> --output photo.jpg
  ```
- `DELETE /photo/{id}` - Удалить фото
  ```bash
  curl -X DELETE http://localhost:8080/photo/<uuid>
  ```

### Роль
- `POST /role` - Создать роль
  ```bash
  curl -X POST http://localhost:8080/role -H "Content-Type: application/json" -d '{"name":"moderator"}'
  ```
- `GET /role` - Список ролей
  ```bash
  curl http://localhost:8080/role
  ```
- `PUT /role/{id}` - Обновить роль
  ```bash
  curl -X PUT http://localhost:8080/role/<uuid> -H "Content-Type: application/json" -d '{"name":"supervisor"}'
  ```
- `DELETE /role/{id}` - Удалить роль
  ```bash
  curl -X DELETE http://localhost:8080/role/<uuid>
  ```

### Пользователь
- `POST /user` - Создать пользователя
  ```bash
  curl -X POST http://localhost:8080/user -H "Content-Type: application/json" -d '{"name":"John","email":"john@test.com","phone":"+1234567890","role_id":"2"}'
  ```a
- `GET /user` - Список пользователей (?limit=&offset=)
  ```bash
  curl http://localhost:8080/user?limit=10&offset=0
  ```
- `GET /user/role/{id}` - Список пользователей по роли
  ```bash
  curl http://localhost:8080/user/role/2?limit=10&offset=0
  ```
- `PUT /user/{id}` - Обновить пользователя
  ```bash
  curl -X PUT http://localhost:8080/user/<uuid> -H "Content-Type: application/json" -d '{"name":"Jane","email":"jane@test.com"}'
  ```
- `DELETE /user/{id}` - Удалить пользователя
  ```bash
  curl -X DELETE http://localhost:8080/user/<uuid>
  ```

### Корзина
- `POST /cart` - Добавить в корзину
  ```bash
  curl -X POST http://localhost:8080/cart -H "Content-Type: application/json" -d '{"user_id":"<uuid>","product_id":"<uuid>","count":2}'
  ```
- `GET /cart/{user_id}` - Достать корзину пользователя
  ```bash
  curl http://localhost:8080/cart/<uuid>
  ```
- `PUT /cart/{id}` - Обновить предмет в корзине
  ```bash
  curl -X PUT http://localhost:8080/cart/<uuid> -H "Content-Type: application/json" -d '{"count":5}'
  ```
- `DELETE /cart/{id}` - Убрать из корзины
  ```bash
  curl -X DELETE http://localhost:8080/cart/<uuid>
  ```

### Заказ
- `POST /order` - Создать заказ
  ```bash
  curl -X POST http://localhost:8080/order -H "Content-Type: application/json" -d '{"user_id":"<uuid>","status":1}'
  ```
- `GET /order` - Список заказов (?limit=&offset=&from=&to=&status=)
  ```bash
  curl http://localhost:8080/order?limit=10&offset=0&status=1
  ```
- `GET /order/{id}` - Достать заказ
  ```bash
  curl http://localhost:8080/order/<uuid>
  ```
- `PUT /order/{id}` - Обновить статус заказа
  ```bash
  curl -X PUT http://localhost:8080/order/<uuid> -H "Content-Type: application/json" -d '{"status":3}'
  ```

### Товар
- `POST /order_item` - Добавить товар
  ```bash
  curl -X POST http://localhost:8080/order_item -H "Content-Type: application/json" -d '{"order_id":"<uuid>","product_id":"<uuid>","price":29.99}'
  ```
- `GET /order_item/{order_id}` - достать товар
  ```bash
  curl http://localhost:8080/order_item/<uuid>
  ```

## Выполнено
- Все 7 сущностей с полным функционалом
- SQLite с данными
- Загрузка файлов для фото
- Фильтры, сортировка
- Вывод под json

## Не выполнено
- Настоящая аутентификация (роли устанавливаются но не на конечном уровне)

## Возврат в изначалку
1.  Удалить `store.db` и перезапустить сервер.
2.  Создать `uploads/` папку хотя бы с одной картинкой (пр., `shoe.jpg`)

```bash
# Создать админа
curl -X POST http://localhost:8080/user -H "Content-Type: application/json" -d '{"name":"Admin Demo","email":"admin@demo.com","role_id":"4"}'

# Создать клиента
curl -X POST http://localhost:8080/user -H "Content-Type: application/json" -d '{"name":"Client Demo","email":"client@demo.com","role_id":"2"}'

# Создать продукт
curl -X POST http://localhost:8080/product -H "Content-Type: application/json" -d '{"name":"Demo T-Shirt","type":"tops","gender":"male","size":"M","color":"black","brand":"DemoBrand","season":"summer","price":1999.00}'

# Загрузить фото продукту
curl -X POST http://localhost:8080/photo -F "file=@uploads/shoe.jpg" -F "product_id=<PRODUCT_UUID>"
```
