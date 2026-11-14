// Runs when no route matched the URL
export const notFound = (req, res) => {
  res.status(404).json({ message: `Not found: ${req.originalUrl}` });
};

// Every error thrown in a route or middleware ends up here.
// Express knows this is the error handler because it has 4 parameters.
export const errorHandler = (err, req, res, next) => {
  // Use the status the route set (e.g. 401), otherwise 500
  let status = res.statusCode >= 400 ? res.statusCode : 500;
  let message = err.message;

  // Mongoose schema rules failed (required, min, enum, match...)
  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }

  // Unique index violated, e.g. email already registered
  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue)[0];
    message = field === 'email' ? 'This email is already registered' : `${field} already exists`;
  }

  // An id in the URL is not a valid MongoDB ObjectId
  if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path}`;
  }

  // Token was tampered with, or is past its expiry time
  if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid token, please log in again';
  }
  if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Your session has expired, please log in again';
  }

  // Unexpected bugs: log the details, but don't show them to users in production
  if (status === 500) {
    console.error(err);
    if (process.env.NODE_ENV === 'production') message = 'Something went wrong';
  }

  res.status(status).json({ message });
};
