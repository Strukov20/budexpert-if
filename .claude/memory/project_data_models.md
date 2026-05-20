---
name: project-data-models
description: "MongoDB моделі даних: Product, Category, Order, Lead, Banner"
metadata: 
  node_type: memory
  type: project
  originSessionId: 48cb3f00-c78b-48fd-a3de-50014d6c9e70
---

## Mongoose-моделі

### Product
- `name`, `price` (обов'язкові)
- `image` (String, legacy), `imagePublicId` (String, legacy) — залишені для сумісності
- `images[]` — масив `{ url, publicId }` — основний спосіб зберігання зображень
- `description` (String), `specs` (Map<String,String>)
- `category`, `subcategory`, `type` — ObjectId ref → Category (3-рівнева ієрархія)
- `sku`, `stock`, `unit`, `discount` (0-100), `productOfWeek` (Boolean)
- `timestamps: true`

### Category
- `name`, `description`, `parent` (ObjectId | null)
- Унікальний compound index `{ parent, name }` — дозволяє однакові назви в різних батьках
- **ВАЖЛИВО**: legacy index `name_1` (simple unique) видаляється при старті сервера автоматично

### Order
- `customerName`, `phone`, `address`, `items[]` (`productId` ref, `quantity`), `totalPrice`
- `status`: `new | processing | shipped | completed | cancelled`
- `note` (String), `timestamps: true`

### Lead (заявки)
- `type`: `call | delivery`
- `name`, `phone`, `city`, `street`, `house`, `datetime`
- `status`: `new | in_progress | done | cancelled`

### Banner
- `key` (unique, default: `'home'`), `images[]` `{ url, publicId, link }`

**How to apply:** При додаванні нових полів до Product — оновлювати обидва `image`/`imagePublicId` (legacy) та `images[]` через хелпери `normalizeImagesInput` і `pickFirstImage` у `server/routes/products.js`.
