---
name: project-integrations
description: "Зовнішні інтеграції проекту — Cloudinary, Нова Пошта, Nominatim, Google Merchant"
metadata: 
  node_type: memory
  type: project
  originSessionId: 48cb3f00-c78b-48fd-a3de-50014d6c9e70
---

## Зовнішні інтеграції

### Cloudinary
- Зберігання зображень товарів та банерів
- `imagePublicId` / `publicId` — ID для видалення/трансформацій
- Upload через `POST /api/uploads` (multer → Cloudinary)

### Нова Пошта API v2
- Ключ: `NOVA_POSHTA_API_KEY` у `server/.env`
- `GET /api/post/cities?q=` — пошук міст
- `GET /api/post/offices?cityRef=` — відділення міста
- Використовується у `Checkout.jsx` для вибору адреси доставки

### Nominatim (OpenStreetMap)
- Автодоповнення вулиць для Івано-Франківська
- `GET /api/geo/if/streets?q=` — мінімум 4 символи, тільки кирилиця
- In-memory кеш 12 год, User-Agent: `budexpert-if (street autocomplete)`

### Google Merchant Center
- XML фід: `GET /merchant-feed.xml`
- `PUBLIC_BASE_URL` або `SITE_URL` env var для абсолютних URL у фіді
- Дані: всі товари з назвою, ціною, описом, брендом зі `specs`

**How to apply:** При проблемах з доставкою — перевіряти `NOVA_POSHTA_API_KEY`. При проблемах з зображеннями — Cloudinary credentials. Merchant фід — перевіряти `PUBLIC_BASE_URL`.
