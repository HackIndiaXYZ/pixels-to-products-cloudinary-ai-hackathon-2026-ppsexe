import express from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import os from 'os';
import mongoose from 'mongoose';
import cloudinary from '../config/cloudinary.js';
import Project from '../models/Project.js';

const router = express.Router();

const upload = multer({
  dest: os.tmpdir(), // temp storage, works on Render/Railway too
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per photo
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  },
});

// POST /upload/:projectId  (form-data, field name: photos)
router.post('/:projectId', (req, res) => {
  upload.array('photos', 15)(req, res, async (multerErr) => {
    if (multerErr) {
      return res.status(400).json({ error: multerErr.message });
    }

    const files = req.files || [];
    try {
      const { projectId } = req.params;
      if (!mongoose.isValidObjectId(projectId)) {
        return res.status(400).json({ error: 'Invalid project id' });
      }
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      if (files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const results = await Promise.all(
        files.map((file) =>
          cloudinary.uploader.upload(file.path, { folder: 'vybe/uploads' })
        )
      );

      const assets = results.map((r) => ({
        assetId: r.public_id,
        url: r.secure_url,
        width: r.width,
        height: r.height,
        format: r.format,
      }));

      project.photos.push(...assets);
      project.status = 'uploaded';
      await project.save();

      res.json({ assets });
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ error: 'Upload failed' });
    } finally {
      // always clean up temp files, success or failure
      await Promise.all(files.map((f) => fs.unlink(f.path).catch(() => {})));
    }
  });
});

export default router;