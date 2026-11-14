import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// What we send to the frontend about a user (never the password)
const userResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

// POST /api/auth/register
export const register = async (req, res) => {
  // Pick only these fields, so nobody can register as admin by sending "role"
  const { name, email, password } = req.body;

  const user = await User.create({ name, email, password });

  res.status(201).json({ user: userResponse(user), token: generateToken(user._id) });
};

// POST /api/auth/login
export const login = async (req, res) => {
  const { email, password } = req.body;

  // Strings only: blocks NoSQL injection like { "email": { "$ne": "" } }
  if (typeof email !== 'string' || typeof password !== 'string') {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  // Same message for "no such user" and "wrong password",
  // so attackers can't find out which emails are registered
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  res.json({ user: userResponse(user), token: generateToken(user._id) });
};

// GET /api/auth/me (protected)
export const getMe = (req, res) => {
  res.json({ user: userResponse(req.user) });
};
