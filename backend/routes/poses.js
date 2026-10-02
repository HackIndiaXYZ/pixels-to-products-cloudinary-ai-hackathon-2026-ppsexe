import express from 'express';

const router = express.Router();

const BASE = {
  solo: [
    { name: 'Over-the-shoulder glance', pose: 'Stand side-on, look back over your shoulder', hands: 'One hand lightly in hair or pocket' },
    { name: 'Walking away', pose: 'Mid-stride, slightly turned from camera', hands: 'Relaxed, swinging naturally' },
    { name: 'Seated casual', pose: 'Sit with one knee up, lean back', hands: 'Resting on knee or ground' },
  ],
  couple: [
    { name: 'Forehead touch', pose: 'Stand close, foreheads almost touching', hands: 'Hands on partner\'s arms' },
    { name: 'Walking together', pose: 'Hold hands, walk toward the camera', hands: 'Interlocked' },
    { name: 'Back hug', pose: 'One stands behind, arms around the waist', hands: 'Clasped at the front' },
  ],
  friends: [
    { name: 'Linked arms', pose: 'Stand shoulder to shoulder, arms linked', hands: 'Linked' },
    { name: 'Laugh together', pose: 'Turn toward each other mid-laugh', hands: 'Loose, natural' },
    { name: 'Walk and talk', pose: 'Walk side by side, looking at each other', hands: 'In pockets or swinging' },
  ],
  group: [
    { name: 'Staggered row', pose: 'Stand in a loose diagonal, varied heights', hands: 'Mix of poses, hands on shoulders' },
    { name: 'Huddle in', pose: 'Squeeze close, lean toward the centre', hands: 'Arms around each other' },
    { name: 'Jump or spin', pose: 'Everyone moves at once', hands: 'Up or out' },
  ],
};

const VIBE = {
  cute: { expression: 'Soft smile, slightly tilted head', tip: 'Shoot in soft, bright light' },
  natural: { expression: 'Relaxed, mid-laugh, not looking at the camera', tip: 'Take candid bursts, not set poses' },
  confident: { expression: 'Chin up, steady eye contact', tip: 'Shoot from a slightly low angle' },
  romantic: { expression: 'Gentle, eyes soft or closed', tip: 'Golden hour backlight works best' },
  cool: { expression: 'Neutral, slight smirk', tip: 'Use shadows and strong angles' },
  bold: { expression: 'Strong, direct, playful intensity', tip: 'Go wide and fill the frame' },
};

// POST /poses  { vibe, peopleCount }
router.post('/', (req, res) => {
  const vibe = String(req.body.vibe || '').toLowerCase();
  const group = String(req.body.peopleCount || '').toLowerCase();

  if (!VIBE[vibe] || !BASE[group]) {
    return res.status(400).json({
      error: 'vibe must be one of cute|natural|confident|romantic|cool|bold and peopleCount one of solo|couple|friends|group',
    });
  }

  const poses = BASE[group].map((b) => ({
    name: b.name,
    imageUrl: null, // PALAK/POOJA: plug in a Cloudinary reference image per pose
    instructions: {
      pose: b.pose,
      hands: b.hands,
      expression: VIBE[vibe].expression,
      tip: VIBE[vibe].tip,
    },
  }));

  res.json({ poses });
});

export default router;