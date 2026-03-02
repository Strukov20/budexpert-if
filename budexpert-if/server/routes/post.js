import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const API_URL = 'https://api.novaposhta.ua/v2.0/json/';
const API_KEY = process.env.NOVA_POSHTA_API_KEY || '';

function buildBody(modelName, calledMethod, methodProperties = {}){
  return {
    apiKey: API_KEY,
    modelName,
    calledMethod,
    methodProperties,
  };
}

async function callNovaPoshta(body){
  if (!API_KEY) {
    throw new Error('NOVA_POSHTA_API_KEY is not configured');
  }
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`NovaPoshta HTTP ${res.status}`);
  }
  const data = await res.json();
  if (!data.success) {
    const msg = Array.isArray(data.errors) && data.errors.length ? data.errors.join('; ') : 'Unknown NP error';
    throw new Error(msg);
  }
  return data.data || [];
}

// GET /api/post/cities?q=Київ
router.get('/cities', async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim();
    const body = buildBody('Address', 'getCities', q ? { FindByString: q } : {});
    const rows = await callNovaPoshta(body);
    const items = rows.map(r => ({
      ref: r.Ref,
      name: r.Description,
      area: r.AreaDescription,
    }));
    res.json(items);
  } catch (err) {
    console.error('NP cities error:', err.message || err);
    res.status(500).json({ message: 'Не вдалося завантажити міста Нової пошти' });
  }
});

// GET /api/post/offices?cityRef=...  (можна додати &q=)
router.get('/offices', async (req, res) => {
  try {
    const cityRef = (req.query.cityRef || '').toString().trim();
    if (!cityRef) return res.status(400).json({ message: 'cityRef обовʼязковий' });
    const body = buildBody('AddressGeneral', 'getWarehouses', { CityRef: cityRef });
    const rows = await callNovaPoshta(body);
    const items = rows.map(r => ({
      ref: r.Ref,
      name: r.Description,
      type: r.TypeOfWarehouse,
      number: r.Number,
      shortAddress: r.ShortAddress || r.Description,
    }));
    res.json(items);
  } catch (err) {
    console.error('NP offices error:', err.message || err);
    res.status(500).json({ message: 'Не вдалося завантажити відділення Нової пошти' });
  }
});

export default router;
