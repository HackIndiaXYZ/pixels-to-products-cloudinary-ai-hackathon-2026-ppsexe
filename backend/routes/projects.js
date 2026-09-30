import express from 'express';
import Project from '../models/Project.js';

const router = express.Router();

const VIBES = ['cute', 'natural', 'confident', 'romantic', 'cool', 'bold'];
const GROUPS = ['solo', 'couple', 'friends', 'group'];

// POST /projects  -> create a project
router.post('/', async (req, res) => {
  try {
    const { vibe, peopleCount, userId } = req.body;

    if (!VIBES.includes(vibe) || !GROUPS.includes(peopleCount)) {
      return res.status(400).json({ error: 'Invalid vibe or peopleCount' });
    }

    const project = await Project.create({ vibe, peopleCount, userId });
    res.status(201).json(project);
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Could not create project' });
  }
});

// GET /projects/:id  -> fetch a project
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(400).json({ error: 'Invalid project id' });
  }
});

// PATCH /projects/:id  -> update vibe / peopleCount
router.patch('/:id', async (req, res) => {
  try {
    const updates = {};
    if (req.body.vibe) updates.vibe = req.body.vibe;
    if (req.body.peopleCount) updates.peopleCount = req.body.peopleCount;

    const project = await Project.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(400).json({ error: 'Invalid project id' });
  }
});

export default router;