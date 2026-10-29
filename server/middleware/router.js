import express from 'express';
import mongoose from 'mongoose';

// Express 4 does not automatically forward rejected async handlers.
export function createRouter() {
  const router = express.Router();
  for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
    const register = router[method].bind(router);
    router[method] = (path, ...handlers) => register(path, ...handlers.map(handler => (req, res, next) => {
      try { return Promise.resolve(handler(req, res, next)).catch(next); }
      catch (error) { return next(error); }
    }));
  }
  router.param('id', (req, res, next, id) => {
    if (!mongoose.isObjectIdOrHexString(id)) return res.status(400).json({ message: 'Invalid id' });
    next();
  });
  return router;
}
