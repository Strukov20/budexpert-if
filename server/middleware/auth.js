import '../config.js';
import jwt from 'jsonwebtoken';



const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET;

export function requireAdmin(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    try {
      const payload = jwt.verify(token, ADMIN_JWT_SECRET, { algorithms: ['HS256'], issuer: 'budexpert', audience: 'budexpert-admin' });
      if (payload.sub !== 'admin') return res.status(401).json({ message: 'Unauthorized' });
      req.admin = { id: payload.sub, username: payload.username };
      return next();
    } catch (e) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  } catch (e) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

export default requireAdmin;
