import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import { notFound, errorHandler } from './middleware/error.js';

const app = express();

// Middleware: runs on every request before it reaches a route
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

// Health check: a quick way to see that the server is running
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Every API request needs the database: wait for the (shared) connection first
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/chat', chatRoutes);

// These two must come after all routes
app.use(notFound);
app.use(errorHandler);

// On our machine: connect, then start a normal server.
// On Vercel (it sets VERCEL=1): there is no long-running server. Vercel imports
// this file and calls the exported app for each request.
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5050;
  connectDB()
    .then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
    .catch(() => process.exit(1)); // no database = nothing works, so stop
}

export default app;
