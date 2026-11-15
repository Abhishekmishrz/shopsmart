import mongoose from 'mongoose';

// The connection is created once and reused. Locally that means once per server start.
// On Vercel each request may wake up a "warm" function that is already connected,
// so this avoids opening a new connection on every request.
let connection = null;

const connectDB = () => {
  if (!connection) {
    connection = mongoose
      .connect(process.env.MONGO_URI)
      .then((conn) => {
        console.log(`MongoDB connected: ${conn.connection.host}`);
        return conn;
      })
      .catch((error) => {
        connection = null; // let the next request try again
        console.error(`MongoDB connection failed: ${error.message}`);
        throw error;
      });
  }
  return connection;
};

export default connectDB;
