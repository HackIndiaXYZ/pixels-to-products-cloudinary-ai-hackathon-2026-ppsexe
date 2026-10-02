import express from 'express';
import mongoose from 'mongoose';
import cloudinary from '../config/cloudinary.js';
import Project from '../models/Project.js';

const router = express.Router();

// POST /compose/:projectId   body (optional): { assetIds: [...] }
router.post('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!mongoose.isValidObjectId(projectId)) {
      return res.status(400).json({ error: 'Invalid project id' });
    }
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const requested = req.body?.assetIds;
    const assetIds =
        Array.isArray(requested) && requested.length > 0
        ? requested
        : project.photos.map((p) => p.assetId);

    if (assetIds.length === 0) {
      return res.status(400).json({ error: 'No photos to compose' });
    }

    const slides = assetIds.map((assetId, index) => {
      const smartUrl = cloudinary.url(assetId, {
        secure: true,
        transformation: [
          { width: 1080, height: 1350, crop: 'fill', gravity: 'auto:faces' }, // Instagram 4:5
          { fetch_format: 'auto', quality: 'auto' },
        ],
      });
      const beforeUrl = cloudinary.url(assetId, {
        secure: true,
        transformation: [{ width: 1080, height: 1350, crop: 'fill', gravity: 'center' }], // naive centre crop
      });
      return {
        assetId,
        url: smartUrl,
        beforeUrl, // for the Smart Photo Rescue before/after
        role: index === 0 ? 'cover' : `slide-${index + 1}`,
      };
    });

    project.board = slides;
    project.status = 'composed';
    await project.save();

    res.json({ slides });
  } catch (err) {
    console.error('Compose error:', err);
    res.status(500).json({ error: 'Compose failed' });
  }
});

export default router;