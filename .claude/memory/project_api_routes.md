---
name: project-api-routes
description: API маршрути Express сервера та їх призначення
metadata: 
  node_type: memory
  type: project
  originSessionId: 48cb3f00-c78b-48fd-a3de-50014d6c9e70
---

## Express API маршрути (`/api/*`)

| Маршрут | Файл | Призначення |
|---|---|---|
| `/api/products` | `routes/products.js` | CRUD товарів, bulk import/export (CSV, XLSX), sync by SKU |
| `/api/categories` | `routes/categories.js` | CRUD категорій, reassign |
| `/api/orders` | `routes/orders.js` | CRUD замовлень |
| `/api/auth` | `routes/auth.js` | Login адміна (JWT) |
| `/api/uploads` | `routes/uploads.js` | Завантаження зображень → Cloudinary |
| `/api/leads` | `routes/leads.js` | Заявки (доставка / передзвонити) |
| `/api/post/cities` | `routes/post.js` | Нова Пошта: список міст |
| `/api/post/offices` | `routes/post.js` | Нова Пошта: відділення за cityRef |
| `/api/banner` | `routes/banner.js` | GET/PUT банера головної сторінки |
| `/api/geo/if/streets` | `routes/geo.js` | Автодоповнення вулиць Івано-Франківська через Nominatim |
| `/merchant-feed.xml` | `routes/merchant.js` | Google Merchant Center XML фід товарів |

### Захист маршрутів
- Middleware `requireAdmin` (JWT Bearer) захищає CRUD операції
- `authLimiter`: 100 req / 15 хв для `/api/auth`
- `uploadLimiter`: 200 req / 15 хв для `/api/uploads`

### Геолокація (вулиці)
- Nominatim OpenStreetMap, кеш в пам'яті 12 год
- Тільки кирилиця (латиниця → порожній результат)
- Bounding box: Івано-Франківськ (24.55–24.90, 48.80–49.05)

**How to apply:** Нові API-ендпоінти додавати в `server/routes/`, підключати в `server/index.js` після `app.use`. Відповідні функції — в `client/src/api.js`.
