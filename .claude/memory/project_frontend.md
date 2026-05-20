---
name: project-frontend
description: "Структура React-клієнта: сторінки, компоненти, маршрутизація"
metadata: 
  node_type: memory
  type: project
  originSessionId: 48cb3f00-c78b-48fd-a3de-50014d6c9e70
---

## React Frontend (Vite + TailwindCSS)

### Сторінки (`client/src/pages/`)
- `Home.jsx` — головна, підтримує slug-маршрути (`/:parentSlug/:childSlug/:typeSlug`)
- `ProductPage.jsx` — картка товару (`/p/:id` і `/products/:id`)
- `ProductsSearch.jsx` — пошук/фільтрація товарів (`/products`)
- `Cart.jsx` — кошик
- `Checkout.jsx` — оформлення замовлення (інтеграція Нова Пошта)
- `AdminPanel.jsx` — адмін-панель (захищена JWT, тільки `/admin`)
- `AdminLogin.jsx` — `/admin/login`
- `Services.jsx`, `About.jsx`, `Contacts.jsx`, `Payment.jsx`, `ReturnsPolicy.jsx` — інформаційні

### Компоненти (`client/src/components/`)
- `Header.jsx`, `Footer.jsx` — шапка/підвал (приховуються на `/admin*`)
- `HomeBanner.jsx` — банер головної
- `ProductCard.jsx` — картка товару в списку
- `SearchBar.jsx` — пошуковий рядок
- `Pagination.jsx` — пагінація
- `DeliveryLeadForm.jsx` — форма заявки на доставку / передзвонити

### Маршрутизація
- `RequireAdmin` guard — перевіряє `localStorage.admin_token`, redirect → `/admin/login`
- 401 відповідь API → автоматичний logout + redirect через axios interceptor у `api.js`
- Адмін-маршрути: `Header`/`Footer` не відображаються

### API клієнт
- `client/src/api.js` — централізований axios-інстанс
- `VITE_API_URL` env var (fallback: `/api`)
- Bearer token автоматично додається через request interceptor

**How to apply:** Нові сторінки — додавати в `App.jsx` як `<Route>`. Нові API-запити — додавати функції до `api.js`, не inline в компоненти.
