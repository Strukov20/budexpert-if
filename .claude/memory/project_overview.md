---
name: project-overview
description: "Загальний огляд проекту budexpert-if — що це, стек, архітектура, деплой"
metadata: 
  node_type: memory
  type: project
  originSessionId: 48cb3f00-c78b-48fd-a3de-50014d6c9e70
---

## budexpert-if — інтернет-магазин будівельних матеріалів (Івано-Франківськ)

Повноцінний e-commerce сайт для магазину будівельних матеріалів «BudExpert» (м. Івано-Франківськ).

### Архітектура
- **Монорепозиторій** з двома пакетами: `server/` та `client/`
- **Backend**: Node.js + Express (ESM, `"type": "module"`), MongoDB + Mongoose, порт 5001
- **Frontend**: React 18 + Vite + TailwindCSS, SPA, порт 5173 (dev)
- **БД**: MongoDB (prod — Atlas, dev — Docker `mongo:7`, test — local `budexpert_test`)
- **Зображення**: Cloudinary (завантаження через `/api/uploads`)
- **Тести**: Playwright (тільки API-тести, `*.api.spec.js`)

### Деплой
- Prod API хост: `budexpert-if-api.onrender.com` (Render)
- Клієнт збирається Vite і роздається Express як статика (`client/dist`)
- `client/public/_redirects` — правила для Netlify/Render SPA fallback

### Запуск
```bash
npm run dev          # mongo:dev:up + server + client concurrently
npm run test:api     # Playwright API тести проти localhost:5001
```

**Why:** Це комерційний проект реального магазину, весь UI — українською мовою.
**How to apply:** При будь-яких змінах враховувати, що продакшн на Render, а зображення в Cloudinary — не видаляти publicId без потреби.
