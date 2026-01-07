import express from "express";
import Product from "../models/Product.js";
import requireAdmin from "../middleware/auth.js";
import Category from "../models/Category.js";
import { v2 as cloudinary } from "cloudinary";

const router = express.Router();

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
  const { q, category, subcategory } = req.query;
  const filter = {};
  if (q) {
    filter.name = { $regex: q, $options: 'i' };
  }
  if (category) {
    filter.category = category;
  }
  if (subcategory) {
    filter.subcategory = subcategory;
  }
  // Optional pagination
  const page = parseInt(req.query.page, 10);
  const limit = parseInt(req.query.limit, 10);
  if (Number.isInteger(page) && Number.isInteger(limit) && limit > 0) {
    const skip = Math.max(0, (page - 1)) * limit;
    const [items, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments(filter)
    ]);
    return res.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
  }
  const products = await Product.find(filter).sort({ createdAt: -1 });
  res.json(products);
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
    res.status(500).json({ message: 'Не вдалося сформувати CSV', error: e?.message });
  }
});

// POST /api/products
router.post("/", requireAdmin, async (req, res) => {
  try {
    const payload = { ...req.body };

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

    if ('images' in payload) {
      payload.images = normalizeImagesInput(payload.images) || [];
      const { image, imagePublicId } = pickFirstImage(payload.images);
      payload.image = image;
      payload.imagePublicId = imagePublicId;
    }
    const name = (payload.name || '').trim();
    if (!name) return res.status(400).json({ message: "Поле name обов'язкове" });
    // Перевірка на дубль назви (без урахування регістру)
    const exists = await Product.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
    if (exists) {
      return res.status(409).json({ message: "Товар з такою назвою вже існує" });
    }
    const product = new Product(payload);
    await product.save();
    res.status(201).json(product);
  } catch (e) {
    res.status(400).json({ message: "Не вдалося створити товар", error: e?.message });
  }
});

// POST /api/products/bulk
// Body: Array<ProductLike>. Підтримує category або categoryName (name існуючої категорії)
router.post("/bulk", requireAdmin, async (req, res) => {
  try {
    const payload = req.body;
    if (!Array.isArray(payload) || payload.length === 0) {
      return res.status(400).json({ message: "Очікується масив продуктів" });
    }

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
          const update = { $set: { ...rest }, $setOnInsert: { sku } };
          // Гарантуємо, що name теж оновиться, якщо передано
          if (rest.name) {
            update.$set.name = rest.name;
          }
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
    return res.status(200).json({ count: totalCount, inserted: insertedCount, updated: updatedCount, skipped });
  } catch (err) {
    // Якщо були часткові вставки при ordered:false
    if (err && err.insertedDocs) {
      return res.status(207).json({ count: err.insertedDocs.length, items: err.insertedDocs, error: true });
    }
    return res.status(500).json({ message: "Помилка масового додавання", error: err?.message });
  }
});

// PUT /api/products/:id
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const body = { ...req.body };

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
    // копіюємо усі поля окрім category
    for (const k of Object.keys(body)) {
      if (k !== 'category' && k !== 'subcategory') update.$set[k] = body[k];
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

    // Cloudinary cleanup: delete removed images (supports legacy imagePublicId + images[])
    const oldIds = new Set(
      [
        current.imagePublicId,
        ...(Array.isArray(current.images) ? current.images.map(x => x?.publicId).filter(Boolean) : []),
      ].filter(Boolean)
    );

    const newIds = new Set(
      [
        body.imagePublicId,
        ...(Array.isArray(body.images) ? body.images.map(x => x?.publicId).filter(Boolean) : []),
      ].filter(Boolean)
    );

    const toDelete = [];
    for (const id of oldIds) {
      if (!newIds.has(id)) toDelete.push(id);
    }

    if (toDelete.length) {
      await Promise.all(
        toDelete.map(async (publicId) => {
          try {
            await cloudinary.uploader.destroy(publicId);
          } catch (err) {
            console.error('Cloudinary destroy error (update product):', err?.message || err);
          }
        })
      );
    }

    // прибрати порожні оператори
    if (!Object.keys(update.$unset).length) delete update.$unset;

    const p = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!p) return res.status(404).json({ message: 'Not found' });
    res.json(p);
  } catch (e) {
    res.status(400).json({ message: "Не вдалося оновити товар", error: e?.message });
  }
});

// DELETE /api/products/:id
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Not found' });

    const ids = Array.from(new Set(
      [
        p.imagePublicId,
        ...(Array.isArray(p.images) ? p.images.map(x => x?.publicId).filter(Boolean) : []),
      ].filter(Boolean)
    ));

    if (ids.length) {
      await Promise.all(
        ids.map(async (publicId) => {
          try {
            await cloudinary.uploader.destroy(publicId);
          } catch (err) {
            console.error('Cloudinary destroy error (delete product):', err?.message || err);
          }
        })
      );
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: "Не вдалося видалити товар", error: e?.message });
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
    const result = await Product.deleteMany({});
    return res.json({ ok: true, deletedCount: result?.deletedCount || 0 });
  } catch (e) {
    return res.status(500).json({ message: "Не вдалося видалити товари", error: e?.message });
  }
});

export default router;
