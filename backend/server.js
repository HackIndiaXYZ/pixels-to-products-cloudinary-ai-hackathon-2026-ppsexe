import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import projectsRoute from './routes/projects.js';
// (the other routes get added as you write them)

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'VYBE backend is running' });
});

app.use('/projects', projectsRoute);

// Connect to MongoDB, but don't crash if it fails
if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.warn('MongoDB connection failed:', err.message));
} else {
  console.warn('MONGODB_URI not set: running without a database');
}

app.listen(PORT, () => {
  console.log(`VYBE backend running on http://localhost:${PORT}`);
});