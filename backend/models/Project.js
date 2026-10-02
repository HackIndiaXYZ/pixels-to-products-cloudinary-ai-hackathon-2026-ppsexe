import mongoose from 'mongoose';

const photoSchema = new mongoose.Schema({
  assetId: String,
  url: String,
  width: Number,
  height: Number,
  format: String,
}, { _id: false });

const projectSchema = new mongoose.Schema({
  userId: String,
  vibe: String,
  peopleCount: String,
  photos: [photoSchema],
  poses: { type: Array, default: [] },
  board: { type: Array, default: [] },
  status: { type: String, default: 'created' },
}, { timestamps: true });

export default mongoose.model('Project', projectSchema);