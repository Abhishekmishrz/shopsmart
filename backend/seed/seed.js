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

// Creates the account, or updates its password and role if it already exists,
// so the values in .env are always the ones that work.
// Admins can't sign up through the API, so the seed is the only way to make one.
const seedUser = async ({ name, email, password, role }) => {
  if (!email || !password) {
    console.log(`No ${role} account in .env, skipping`);
    return;
  }

  let user = await User.findOne({ email: email.toLowerCase() });
  if (user) {
    user.password = password;
    user.role = role;
  } else {
    user = new User({ name, email, password, role });
  }
  await user.save(); // save() runs the pre-save hook, so the password gets hashed
  console.log(`${role === 'admin' ? 'Admin' : 'Customer'} ready: ${user.email}`);
};

const env = process.env;

await connectDB();
await seedProducts();
await seedUser({
  name: env.ADMIN_NAME || 'Admin',
  email: env.ADMIN_EMAIL,
  password: env.ADMIN_PASSWORD,
  role: 'admin',
});
await seedUser({
  name: env.CUSTOMER_NAME || 'Demo Customer',
  email: env.CUSTOMER_EMAIL,
  password: env.CUSTOMER_PASSWORD,
  role: 'user',
});
await mongoose.disconnect();
