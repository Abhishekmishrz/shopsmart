import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Lets the request through only if it carries a valid login token.
// The frontend sends it as the header "Authorization: Bearer <token>".
export const protect = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    res.status(401);
    throw new Error('Please log in to continue');
  }

  const token = header.split(' ')[1];

  // Throws if the token was changed, signed with another secret, or expired
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // The account may have been deleted after the token was issued
  const user = await User.findById(decoded.id);
  if (!user) {
    res.status(401);
    throw new Error('This account no longer exists');
  }

  req.user = user; // available to every route after this one
  next();
};

// Use after protect: only admins get past this point
export const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    res.status(403);
    throw new Error('Admin access only');
  }
  next();
};
