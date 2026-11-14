import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';

const app = express();

// Middleware: runs on every request before it reaches a route
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

// Health check: a quick way to see that the server is running
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;

// Connect to the database first, then start accepting requests
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
