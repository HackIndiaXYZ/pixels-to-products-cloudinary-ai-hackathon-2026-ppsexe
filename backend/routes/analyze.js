import express from 'express';
import mongoose from 'mongoose';
import Project from '../models/Project.js';

const router = express.Router();

// PALAK: replace the body of this function with real analysis.
// Must return { assetId, peopleCount, orientation, subjectPosition, background, suggestedRole }
async function runAnalysis(photo, index) {
  const orientation =
    photo.width > photo.height ? 'landscape' : photo.width < photo.height ? 'portrait' : 'square';
  return {
    assetId: photo.assetId,
    peopleCount: null,
    orientation,
    subjectPosition: 'center',
    background: null,
    suggestedRole: index === 0 ? 'cover' : 'detail',
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