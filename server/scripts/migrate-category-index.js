import mongoose from 'mongoose';
import '../config.js';
import Category from '../models/Category.js';

try {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required');
  await mongoose.connect(process.env.MONGO_URI, { autoIndex: false, serverSelectionTimeoutMS: 10000 });
  const indexes = await Category.collection.indexes();
  const legacy = indexes.find(index => index.name === 'name_1' && index.unique);
  console.log(JSON.stringify({ legacyUniqueNameIndex: !!legacy, apply: process.argv.includes('--apply') }));
  if (legacy && process.argv.includes('--apply')) {
    // Ensure replacement constraint exists before dropping the old constraint.
    await Category.collection.createIndex({ parent: 1, name: 1 }, { unique: true });
    await Category.collection.dropIndex('name_1');
    console.log('Category index migration complete');
  }
} catch (error) {
  console.error('Category index migration failed:', error.name);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
