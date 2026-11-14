// Fills the database with demo products and creates the admin account.
// Run from the backend folder: npm run seed
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import products from './products.json' with { type: 'json' };

const seedProducts = async () => {
  // Start from a clean catalogue so running the seed twice gives no duplicates
  await Product.deleteMany({});
  await Product.insertMany(products);
  console.log(`Inserted ${products.length} products`);
};

const seedAdmin = async () => {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.log('ADMIN_EMAIL / ADMIN_PASSWORD not set in .env, skipping admin');
    return;
  }

  // Admins can't sign up through the API, so the seed is the only way to make one
  let admin = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
  if (admin) {
    admin.role = 'admin';
  } else {
    admin = new User({
      name: ADMIN_NAME || 'Admin',
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin',
    });
  }
  await admin.save(); // save() runs the pre-save hook, so the password gets hashed
  console.log(`Admin ready: ${admin.email}`);
};

await connectDB();
await seedProducts();
await seedAdmin();
await mongoose.disconnect();
