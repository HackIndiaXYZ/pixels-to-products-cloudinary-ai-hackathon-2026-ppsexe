import express from 'express';
import mongoose from 'mongoose';
import cloudinary from '../config/cloudinary.js';
import Project from '../models/Project.js';
import VIBE_GRADES from '../services/vibeGrades.js';

const router = express.Router();

const COVER_TAGLINES = {
  cute: 'SOFT SPOT',
  natural: 'IN THE MOMENT',
  confident: 'OWN YOUR FRAME',
  romantic: 'CLOSER, ALWAYS',
  cool: 'NO EXTRA NOISE',
  bold: 'MAKE IT COUNT',
};

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
      const crop = { width: 1080, height: 1350, crop: 'fill', gravity: 'auto:faces' };
      const delivery = { fetch_format: 'auto', quality: 'auto' };
      const grade = VIBE_GRADES[project.vibe] || VIBE_GRADES.natural;
      const plainUrl = cloudinary.url(assetId, {
        secure: true,
        transformation: [crop, delivery],
      });
      const smartUrl = cloudinary.url(assetId, {
        secure: true,
        transformation: [
          crop,
          ...grade,
          ...(index === 0 ? [
            {
              overlay: {
                font_family: 'Arial',
                font_size: 64,
                font_weight: 'bold',
                text: encodeURIComponent(COVER_TAGLINES[project.vibe] || COVER_TAGLINES.natural),
              },
            },
            { gravity: 'south', y: 72, flags: 'layer_apply' },
          ] : []),
          delivery,
        ],
      });
      const beforeUrl = cloudinary.url(assetId, {
        secure: true,
        transformation: [{ width: 1080, height: 1350, crop: 'fill', gravity: 'center' }], // naive centre crop
      });
      const storyUrl = cloudinary.url(assetId, {
        secure: true,
        transformation: [
          { width: 1080, height: 1920, crop: 'fill', gravity: 'auto:faces' },
          delivery,
        ],
      });
      const pinterestUrl = cloudinary.url(assetId, {
        secure: true,
        transformation: [
          { width: 1000, height: 1500, crop: 'fill', gravity: 'auto:faces' },
          delivery,
        ],
      });
      return {
        assetId,
        url: smartUrl,
        plainUrl,
        beforeUrl, // for the Smart Photo Rescue before/after
        storyUrl,
        pinterestUrl,
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