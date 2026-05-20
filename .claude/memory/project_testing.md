---
name: project-testing
description: "Тестова інфраструктура — Playwright API-тести, safety guards"
metadata: 
  node_type: memory
  type: project
  originSessionId: 48cb3f00-c78b-48fd-a3de-50014d6c9e70
---

## Тестування

### Playwright (API-тести)
- Тільки `*.api.spec.js` у директорії `tests/`
- Запуск: `npm run test:api` (порт 5001, DB `budexpert_test`)
- Перед запуском: `npm run pretest` — seed продуктів у тестову БД

### Safety guards (захист від запуску тестів на проді)
- `playwright.config.js`: `assertNotProd()` — блокує хости з `DENY_PROD_HOSTS` (default: `budexpert-if-api.onrender.com`)
- `server/index.js`: якщо `TEST_ENV=test` і URI не local/не містить `_test` суфікс — кидає помилку
- `ALLOW_REMOTE_DB_IN_TEST=true` — явний override для виключних випадків

### MongoDB для тестів
```bash
npm run mongo:test:up    # Docker контейнер budexpert-mongo-test, порт 27017
npm run test:api:docker  # mongo:test:up + test:api
```

### Env-змінні тестів
- `MONGO_URI=mongodb://127.0.0.1:27017/budexpert_test`
- `PORT=5001`, `TEST_ENV=test`
- `ADMIN_USER=admin`, `ADMIN_PASS=admin123`, `ADMIN_JWT_SECRET=dev-admin-secret`

**How to apply:** Нові тести писати як `*.api.spec.js`. Ніколи не запускати тести проти prod URI.
