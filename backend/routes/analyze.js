import express from 'express';
import mongoose from 'mongoose';
import cloudinary from '../config/cloudinary.js';
import Project from '../models/Project.js';

const router = express.Router();

const ANALYSIS_TIMEOUT_MS = 2400;

function fallbackBackground(photo) {
  const hints = `${photo.assetId || ''} ${photo.url || ''}`.toLowerCase();
  if (/street|road|city|urban/.test(hints)) return 'street';
  if (/indoor|interior|room|studio|cafe/.test(hints)) return 'indoor';
  return 'outdoor';
}

async function runAnalysis(photo, index) {
  const width = Number(photo.width) || 0;
  const height = Number(photo.height) || 0;
  const orientation = width > height ? 'landscape' : width < height ? 'portrait' : 'square';
  let faces = [];
  let peopleCount = 1;
  let background = fallbackBackground(photo);

  try {
    const resource = await Promise.race([
      cloudinary.api.resource(photo.assetId, { faces: true }),
      new Promise((_, reject) => {
        const timeout = setTimeout(() => reject(new Error('Cloudinary analysis timed out')), ANALYSIS_TIMEOUT_MS);
        timeout.unref?.();
      }),
    ]);
    faces = Array.isArray(resource.faces) ? resource.faces : [];
    peopleCount = faces.length;

    const tags = Array.isArray(resource.tags) ? resource.tags.join(' ').toLowerCase() : '';
    const hints = `${tags} ${resource.context?.custom?.background || ''}`.toLowerCase();
    if (/street|road|city|urban/.test(hints)) background = 'street';
    else if (/indoor|interior|room|studio|cafe/.test(hints)) background = 'indoor';
    else if (/outdoor|nature|park|beach|garden/.test(hints)) background = 'outdoor';
  } catch (error) {
    console.warn(`Photo analysis fallback for ${photo.assetId}:`, error.message);
  }

  const faceCenterX = faces.length && width
    ? faces.reduce((sum, face) => sum + (Number(face?.[0]) + Number(face?.[2]) / 2), 0) / faces.length
    : width / 2;
  const normalizedCenterX = width ? faceCenterX / width : 0.5;
  const subjectPosition = normalizedCenterX < 1 / 3 ? 'left' : normalizedCenterX > 2 / 3 ? 'right' : 'center';

  return {
    assetId: photo.assetId,
    peopleCount,
    orientation,
    subjectPosition,
    background,
    suggestedRole: index === 0 ? 'cover' : orientation === 'landscape' ? 'full-width' : 'detail',
  };
}

// POST /analyze/:projectId
router.post('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!mongoose.isValidObjectId(projectId)) {
      return res.status(400).json({ error: 'Invalid project id' });
    }
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.photos.length === 0) {
      return res.status(400).json({ error: 'No photos to analyze' });
    }

    const analysis = await Promise.all(project.photos.map((p, i) => runAnalysis(p, i)));
    project.status = 'analyzed';
    await project.save();

    res.json({ analysis });
  } catch (err) {
    console.error('Analyze error:', err);
    res.status(500).json({ error: 'Analyze failed' });
  }
});

export default router;