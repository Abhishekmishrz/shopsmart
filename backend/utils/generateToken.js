import jwt from 'jsonwebtoken';

// Creates a signed token that proves who the user is.
// Only the user's id goes inside; the token expires after 7 days.
const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

export default generateToken;
