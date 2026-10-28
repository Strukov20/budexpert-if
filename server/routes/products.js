import { createRouter } from '../middleware/router.js';
import mongoose from 'mongoose';
import Product from "../models/Product.js";
import requireAdmin from "../middleware/auth.js";
import Category from "../models/Category.js";
import { productInput } from '../services/productInput.js';
import { imageIds, removeImages } from '../services/media.js';
const router = createRouter();

const escapeRegExp = (s) => String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Прибирає поля з порожнім значенням, щоб імпорт (CSV/XLSX) не затирав
// наявні дані товару, коли колонка відсутня або порожня у файлі.
const stripEmptyForUpdate = (obj) => {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === '' || value === undefined || value === null) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) continue;
    out[key] = value;
  }
  return out;
};

const normalizeImagesInput = (images) => {
  if (!Array.isArray(images)) return undefined;
  return images
    .filter(Boolean)
    .map((x) => {
      if (typeof x === 'string') return { url: x, publicId: '' };
      if (typeof x !== 'object') return null;
      const url = (x.url ?? x.image ?? '').toString().trim();
      const publicId = (x.publicId ?? x.imagePublicId ?? '').toString().trim();
      if (!url && !publicId) return null;
      return { url, publicId };
    })
    .filter(Boolean);
};

const pickFirstImage = (imagesArr) => {
  if (!Array.isArray(imagesArr) || !imagesArr.length) return { image: '', imagePublicId: '' };
  const first = imagesArr[0] || {};
  return {
    image: (first.url || '').toString().trim(),
    imagePublicId: (first.publicId || '').toString().trim(),
  };
};

 const parseSpecsText = (input) => {
   if (typeof input !== 'string') return undefined;
   const out = {};
   const parts = input
     .replace(/\r\n/g, '\n')
     .split(/[;\n]+/g)
     .map(s => s.trim())
     .filter(Boolean);
 
   for (const p of parts) {
     const idx = p.indexOf(':');
     if (idx === -1) continue;
     const key = p.slice(0, idx).trim();
     const value = p.slice(idx + 1).trim();
     if (!key) continue;
     out[key] = value;
   }
 
   return out;
 };

// GET /api/products
router.get("/", async (req, res) => {
  const { q, category, subcategory, type, productOfWeek } = req.query;
  const filter = {};
  for (const key of ['q', 'category', 'subcategory', 'type']) {
    if (req.query[key] !== undefined && (typeof req.query[key] !== 'string' || req.query[key].length > 100)) return res.status(400).json({ message: 'Invalid filter' });
  }
  for (const key of ['category', 'subcategory', 'type']) {
    if (req.query[key] && !mongoose.isObjectIdOrHexString(req.query[key])) return res.status(400).json({ message: 'Invalid category id' });
  }
  if (q) {
    filter.name = { $regex: escapeRegExp(q), $options: 'i' };
  }
  if (category) {
    filter.category = new mongoose.Types.ObjectId(category);
  }
  if (subcategory) {
    filter.subcategory = new mongoose.Types.ObjectId(subcategory);
  }
  if (type) {
    filter.type = new mongoose.Types.ObjectId(type);
  }

  if (productOfWeek !== undefined && productOfWeek !== null && String(productOfWeek).trim() !== '') {
    const v = String(productOfWeek).trim().toLowerCase()
    const truthy = v === '1' || v === 'true' || v === 'yes' || v === 'on'
    const falsy = v === '0' || v === 'false' || v === 'no' || v === 'off'
    if (truthy) filter.productOfWeek = true
    if (falsy) filter.productOfWeek = false
  }
  // Legacy array responses are bounded too; page/limit returns pagination metadata.
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 100);
  if (!Number.isSafeInteger(page) || page < 1 || page > 1000000 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) return res.status(400).json({ message: 'Invalid pagination (limit 1–100)' });
  if (req.query.page !== undefined || req.query.limit !== undefined) {
    const skip = Math.max(0, (page - 1)) * limit;
    const [items, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),
      Product.countDocuments(filter)
    ]);
    return res.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
  }
  const products = await Product.find(filter).sort({ createdAt: -1, _id: -1 }).limit(100);
  res.json(products);
});

// GET /api/products/counts
router.get('/counts', async (req, res) => {
  const { q, category, subcategory, type } = req.query;
  const filter = {};
  for (const key of ['q', 'category', 'subcategory', 'type']) {
    if (req.query[key] !== undefined && (typeof req.query[key] !== 'string' || req.query[key].length > 100)) return res.status(400).json({ message: 'Invalid filter' });
  }
  for (const key of ['category', 'subcategory', 'type']) {
    if (req.query[key] && !mongoose.isObjectIdOrHexString(req.query[key])) return res.status(400).json({ message: 'Invalid category id' });
  }
  if (q) {
    filter.name = { $regex: escapeRegExp(q), $options: 'i' };
  }
  if (category) {
    filter.category = new mongoose.Types.ObjectId(category);
  }
  if (subcategory) {
    filter.subcategory = new mongoose.Types.ObjectId(subcategory);
  }
  if (type) {
    filter.type = new mongoose.Types.ObjectId(type);
  }

  const faceted = await Product.aggregate([
    { $match: filter },
    {
      $facet: {
        byCategory: [
          { $match: { category: { $exists: true, $ne: null } } },
          { $group: { _id: '$category', count: { $sum: 1 } } },
        ],
        bySubcategory: [
          { $match: { subcategory: { $exists: true, $ne: null } } },
          { $group: { _id: '$subcategory', count: { $sum: 1 } } },
        ],
        byType: [
          { $match: { type: { $exists: true, $ne: null } } },
          { $group: { _id: '$type', count: { $sum: 1 } } },
        ],
      },
    },
  ]);

  const first = (Array.isArray(faceted) && faceted[0]) ? faceted[0] : {};

  const toMap = (rows) => {
    const out = {};
    for (const r of (Array.isArray(rows) ? rows : [])) {
      if (!r || !r._id) continue;
      out[String(r._id)] = Number(r.count || 0);
    }
    return out;
  };

  return res.json({
    byCategory: toMap(first.byCategory),
    bySubcategory: toMap(first.bySubcategory),
    byType: toMap(first.byType),
  });
});

// GET /api/products/:id
router.get("/:id", async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) return res.status(404).json({ message: "Not found" });
  res.json(p);
});

// GET /api/products/export
// Експорт усіх товарів у CSV
router.get("/export/all", requireAdmin, async (_req, res) => {
  try {
    const items = await Product.find({}).populate('category');

    const header = [
      'name','price','stock','unit','sku','description','specs',
      'categoryName','image','imagePublicId','discount','createdAt','updatedAt'
    ];

    const escapeCsv = (v)=>{
      if (v === null || v === undefined) return '';
      const s = String(v);
      if (/[",\n]/.test(s)) {
        return '"' + s.replace(/"/g,'""') + '"';
      }
      return s;
    };

    const lines = [];
    lines.push(header.join(','));

    for (const p of items) {
      const specsObj = p.specs ? Object.fromEntries(p.specs) : {};
      const row = [
        p.name || '',
        p.price ?? '',
        p.stock ?? '',
        p.unit || '',
        p.sku || '',
        p.description || '',
        JSON.stringify(specsObj),
        (p.category && p.category.name) || '',
        p.image || '',
        p.imagePublicId || '',
        p.discount ?? '',
        p.createdAt ? p.createdAt.toISOString() : '',
        p.updatedAt ? p.updatedAt.toISOString() : '',
      ].map(escapeCsv);
      lines.push(row.join(','));
    }

    const csv = lines.join('\n');
    res.setHeader('Content-Type','text/csv; charset=utf-8');
    res.setHeader('Content-Disposition','attachment; filename="products-export.csv"');
    res.send(csv);
  } catch (e) {
    res.status(500).json({ message: 'Не вдалося сформувати CSV' });
  }
});

// POST /api/products/sync/sku
// Синхронізація каталогу по SKU після імпорту:
// - проставляє stock=0 ТІЛЬКИ для товарів з заповненим sku, яких немає у списку skus
// Body: { skus: string[], dryRun?: boolean }
router.post('/sync/sku', requireAdmin, async (req, res) => {
  try {
    const dryRun = Boolean(req.body?.dryRun);
    const raw = req.body?.skus;
    if (!Array.isArray(raw)) {
      return res.status(400).json({ message: 'Очікується поле skus: string[]' });
    }

    const keep = Array.from(new Set(raw.map(s => String(s || '').trim()).filter(Boolean)));
    if (keep.length === 0) {
      return res.status(400).json({ message: 'Список SKU порожній — синхронізацію видалення скасовано' });
    }

    const filter = {
      sku: { $exists: true, $ne: '' },
      $and: [{ sku: { $nin: keep } }]
    };

    const toMarkCount = await Product.countDocuments(filter);
    if (dryRun) {
      return res.json({ ok: true, dryRun: true, toMarkCount, markedCount: 0 });
    }

    const result = await Product.updateMany(filter, { $set: { stock: 0, discount: 0 } });
    const markedCount = result?.modifiedCount ?? result?.nModified ?? 0;
    return res.json({ ok: true, dryRun: false, toMarkCount, markedCount });
  } catch (e) {
    return res.status(500).json({ message: 'Не вдалося синхронізувати товари по SKU' });
  }
});

// POST /api/products
router.post("/", requireAdmin, async (req, res) => {
  try {
    const payload = productInput(req.body);

     if (typeof payload.specs === 'string') {
       payload.specs = parseSpecsText(payload.specs);
     }
     if (typeof payload.specsText === 'string') {
       payload.specs = parseSpecsText(payload.specsText);
       delete payload.specsText;
     }
    if (payload.category === '' || payload.category === null) {
      delete payload.category;
    }
    if (payload.subcategory === '' || payload.subcategory === null) {
      delete payload.subcategory;
    }

    if (payload.type === '' || payload.type === null) {
      delete payload.type;
    }

    if ('images' in payload) {
      payload.images = normalizeImagesInput(payload.images) || [];
      const { image, imagePublicId } = pickFirstImage(payload.images);
      payload.image = image;
      payload.imagePublicId = imagePublicId;
    }
    const name = (payload.name || '').trim();
    if (!name) return res.status(400).json({ message: "Поле name обов'язкове" });
    // Перевірка на дубль назви (без урахування регістру)
    const exists = await Product.findOne({ name: { $regex: `^${escapeRegExp(name)}$`, $options: 'i' } });
    if (exists) {
      return res.status(409).json({ message: "Товар з такою назвою вже існує" });
    }
    const product = new Product(payload);
    await product.save();
    res.status(201).json(product);
  } catch (e) {
    res.status(400).json({ message: "Не вдалося створити товар" });
  }
});

// POST /api/products/bulk
// Body: Array<ProductLike>. Підтримує category або categoryName (name існуючої категорії)
router.post("/bulk", requireAdmin, async (req, res) => {
  try {
    const rawPayload = req.body;
    if (!Array.isArray(rawPayload) || rawPayload.length === 0 || rawPayload.length > 5000) {
      return res.status(400).json({ message: "Очікується масив продуктів" });
    }

    const payload = rawPayload.map(productInput);

    // Збираємо унікальні categoryName для мапінгу на ObjectId
    const categoryNames = Array.from(new Set(
      payload
        .map((p) => (p && typeof p.categoryName === "string" ? p.categoryName.trim() : null))
        .filter(Boolean)
    ));

    let catMap = new Map();
    if (categoryNames.length) {
      const cats = await Category.find({ name: { $in: categoryNames } });
      cats.forEach((c) => catMap.set(c.name, c._id));
      // створити відсутні категорії
      const missing = categoryNames.filter(n => !catMap.has(n));
      if (missing.length) {
        const created = await Category.insertMany(missing.map(name => ({ name })), { ordered: false });
        created.forEach(c => catMap.set(c.name, c._id));
      }
    }

    // Підготовка документів + нормалізація name/sku
    const docs = payload.map((p) => {
      const doc = { ...p };
      if (!doc.category && doc.categoryName && catMap.has(doc.categoryName)) {
        doc.category = catMap.get(doc.categoryName);
      }
      delete doc.categoryName;
      if (doc.name) doc.name = String(doc.name).trim();
      if (doc.sku) doc.sku = String(doc.sku).trim();
      return doc;
    });

    // Розділяємо товари з sku та без sku
    const withSku = docs.filter(d => d.sku);
    const withoutSku = docs.filter(d => !d.sku);

    const keepSkuSet = new Set(withSku.map(d => String(d.sku || '').trim()).filter(Boolean));

    let insertedCount = 0;
    let updatedCount = 0;
    let skipped = 0;

    // 1) upsert за sku для товарів, у яких sku заданий
    if (withSku.length) {
      // Прибираємо дублікати sku всередині самого імпорту
      const seenSku = new Set();
      const uniqueBySku = [];
      for (const d of withSku) {
        if (!d.sku) continue;
        if (seenSku.has(d.sku)) {
          skipped++;
          continue;
        }
        seenSku.add(d.sku);
        uniqueBySku.push(d);
      }

      if (uniqueBySku.length) {
        const ops = uniqueBySku.map(d => {
          const { sku, _id, __v, ...rest } = d;
          // Порожні/відсутні поля з файлу імпорту не повинні затирати наявні
          // дані товару (напр. опис) при оновленні за sku.
          const update = { $set: stripEmptyForUpdate(rest), $setOnInsert: { sku } };
          return {
            updateOne: {
              filter: { sku },
              update,
              upsert: true,
            },
          };
        });

        const bulkResult = await Product.bulkWrite(ops, { ordered: false });
        const nUpserted = bulkResult.upsertedCount ?? bulkResult.nUpserted ?? 0;
        const nModified = bulkResult.modifiedCount ?? bulkResult.nModified ?? 0;
        insertedCount += nUpserted;
        updatedCount += nModified;
      }
    }

    // 2) Товари без sku: створюємо нові, уникаючи дублів за name
    if (withoutSku.length) {
      const importNames = Array.from(new Set(withoutSku.map(d => d.name).filter(Boolean)));
      let existingByName = [];
      if (importNames.length) {
        existingByName = await Product.find({ name: { $in: importNames } }).select('name');
      }
      const existingNames = new Set(existingByName.map(p => p.name));

      const seenNames = new Set();
      const toInsertNoSku = [];
      for (const d of withoutSku) {
        const n = d.name || '';
        if (!n) {
          skipped++;
          continue;
        }
        const nameDup = existingNames.has(n) || seenNames.has(n);
        if (nameDup) {
          skipped++;
          continue;
        }
        seenNames.add(n);
        toInsertNoSku.push(d);
      }

      if (toInsertNoSku.length) {
        const insertedDocs = await Product.insertMany(toInsertNoSku, { ordered: false });
        insertedCount += insertedDocs.length;
      }
    }

    const totalCount = insertedCount + updatedCount;
    return res.status(200).json({ count: totalCount, inserted: insertedCount, updated: updatedCount, skipped, skus: Array.from(keepSkuSet) });
  } catch (err) {
    // Якщо були часткові вставки при ordered:false
    if (err && err.insertedDocs) {
      return res.status(207).json({ count: err.insertedDocs.length, items: err.insertedDocs, error: true });
    }
    return res.status(err.status || 500).json({ message: "Помилка масового додавання" });
  }
});

// PUT /api/products/:id
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const body = productInput(req.body);

     if (typeof body.specs === 'string') {
       body.specs = parseSpecsText(body.specs);
     }
     if (typeof body.specsText === 'string') {
       body.specs = parseSpecsText(body.specsText);
       delete body.specsText;
     }

    // Знаходимо поточний товар, щоб знати старе зображення
    const current = await Product.findById(req.params.id);
    if (!current) return res.status(404).json({ message: 'Not found' });

    if ('images' in body) {
      body.images = normalizeImagesInput(body.images) || [];
      const { image, imagePublicId } = pickFirstImage(body.images);
      body.image = image;
      body.imagePublicId = imagePublicId;
    }

    const update = { $set: {}, $unset: {} };
    // копіюємо усі поля окрім category/subcategory/type
    for (const k of Object.keys(body)) {
      if (k !== 'category' && k !== 'subcategory' && k !== 'type') update.$set[k] = body[k];
    }
    // спеціальна обробка category
    if ('category' in body) {
      if (body.category === '' || body.category === null) {
        update.$unset.category = "";
      } else {
        update.$set.category = body.category;
      }
    }

    // спеціальна обробка subcategory
    if ('subcategory' in body) {
      if (body.subcategory === '' || body.subcategory === null) {
        update.$unset.subcategory = "";
      } else {
        update.$set.subcategory = body.subcategory;
      }
    }

    // спеціальна обробка type
    if ('type' in body) {
      if (body.type === '' || body.type === null) {
        update.$unset.type = "";
      } else {
        update.$set.type = body.type;
      }
    }

    const imageFieldsChanged = ['images', 'image', 'imagePublicId'].some(key => key in body);
    const updatedImages = { ...current.toObject(), ...body };
    const toDelete = imageFieldsChanged
      ? imageIds(current).filter(id => !imageIds(updatedImages).includes(id))
      : [];

    // прибрати порожні оператори
    if (!Object.keys(update.$unset).length) delete update.$unset;

    const p = await Product.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!p) return res.status(404).json({ message: 'Not found' });
    await removeImages(toDelete);
    res.json(p);
  } catch (e) {
    res.status(400).json({ message: "Не вдалося оновити товар" });
  }
});

// DELETE /api/products/:id
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Not found' });

    const ids = imageIds(p);

    await Product.findByIdAndDelete(req.params.id);
    await removeImages(ids);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: "Не вдалося видалити товар" });
  }
});

// DELETE /api/products
// Видалити всі товари: потребує підтвердження ?confirm=true
router.delete("/", requireAdmin, async (req, res) => {
  try {
    const { confirm } = req.query;
    if (confirm !== 'true') {
      return res.status(400).json({ message: "Для масового видалення додайте ?confirm=true" });
    }

    const adminPassExpected = process.env.ADMIN_PASS || '';
    const adminPassProvided =
      (req.headers['x-admin-pass'] || req.headers['x-admin-password'] || req.headers['x-admin-passphrase'] || '').toString() ||
      (req.body && (req.body.adminPass || req.body.password || req.body.adminPassword) ? String(req.body.adminPass || req.body.password || req.body.adminPassword) : '');

    if (!adminPassExpected || adminPassProvided !== adminPassExpected) {
      return res.status(403).json({ message: 'Потрібне підтвердження паролем адміністратора' });
    }

    const result = await Product.deleteMany({});
    return res.json({ ok: true, deletedCount: result?.deletedCount || 0 });
  } catch (e) {
    return res.status(500).json({ message: "Не вдалося видалити товари" });
  }
});

export default router;
