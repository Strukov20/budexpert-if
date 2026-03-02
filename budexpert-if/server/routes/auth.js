import express from 'express';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const router = express.Router();

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'dev-admin-secret';
const ADMIN_JWT_EXPIRES = process.env.ADMIN_JWT_EXPIRES || '7d';

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = jwt.sign(
      { username },
      ADMIN_JWT_SECRET,
      { expiresIn: ADMIN_JWT_EXPIRES, subject: 'admin' }
    );
    return res.json({ token });
  }
  return res.status(401).json({ message: 'Невірні облікові дані' });
});

export default router;
