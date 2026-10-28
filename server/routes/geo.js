import { createRouter } from '../middleware/router.js';
import fs from 'node:fs';

const router = createRouter();
// A local list avoids sending customer address input to a third party and does
// not depend on a public geocoding endpoint that forbids autocomplete.
let streets = [];
if (process.env.STREET_SUGGESTIONS_FILE) {
  const data = JSON.parse(fs.readFileSync(process.env.STREET_SUGGESTIONS_FILE, 'utf8'));
  if (!Array.isArray(data) || data.some(value => typeof value !== 'string')) throw new Error('Street suggestions must be a JSON string array');
  streets = [...new Set(data.map(value => value.trim()).filter(Boolean))];
}
router.get('/if/streets', (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim().toLocaleLowerCase('uk-UA') : '';
  if (q.length < 4 || q.length > 100 || /[A-Za-z]/.test(q)) return res.json([]);
  res.json(streets.filter(street => street.toLocaleLowerCase('uk-UA').includes(q)).slice(0, 10));
});
export default router;
