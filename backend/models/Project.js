import mongoose from 'mongoose';

const photoSchema = new mongoose.Schema({
  assetId: String,      // Cloudinary public_id
  url: String,          // Cloudinary secure_url
  width: Number,
  height: Number,
  format: String,
  analysis: {           // filled in by /analyze
    peopleCount: Number,
    orientation: String,
    subjectPosition: String,
    background: String,
    suggestedRole: String,
  },
});

const projectSchema = new mongoose.Schema(
  {
    userId: { type: String, default: 'guest' },
    vibe: String,         // cute, natural, confident, romantic, cool, bold
    peopleCount: String,  // solo, couple, friends, group
    photos: [photoSchema],
    poses: [
      {
        name: String,
        imageUrl: String,
        instructions: mongoose.Schema.Types.Mixed,
      },
    ],
    board: [
      {
        assetId: String,
        url: String,
        role: String,     // cover, slide-2, ...
      },
    ],
    status: {
      type: String,
      enum: ['created', 'uploaded', 'analyzed', 'composed'],
      default: 'created',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Project', projectSchema);