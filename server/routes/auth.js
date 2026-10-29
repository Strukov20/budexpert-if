import { createRouter } from '../middleware/router.js';
import '../config.js';
import { createHash, timingSafeEqual } from 'node:crypto';
import jwt from 'jsonwebtoken';



const router = createRouter();

const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS = process.env.ADMIN_PASS;
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET;
const ADMIN_JWT_EXPIRES = process.env.ADMIN_JWT_EXPIRES || '2h';

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username === 'string' && typeof password === 'string' && password.length <= 1024 && ADMIN_PASS && username === ADMIN_USER && timingSafeEqual(createHash('sha256').update(password).digest(), createHash('sha256').update(ADMIN_PASS).digest())) {
    const token = jwt.sign(
      { username },
      ADMIN_JWT_SECRET,
      { expiresIn: ADMIN_JWT_EXPIRES, subject: 'admin', algorithm: 'HS256', issuer: 'budexpert', audience: 'budexpert-admin' }
    );
    return res.json({ token });
  }
  return res.status(401).json({ message: 'Невірні облікові дані' });
});

export default router;
