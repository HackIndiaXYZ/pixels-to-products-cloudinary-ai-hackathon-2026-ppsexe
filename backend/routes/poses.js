import express from 'express';
import cloudinary from '../config/cloudinary.js';

const router = express.Router();

const BASE = {
  solo: [
    { name: 'Own-the-frame stance', imageId: 'solo-turn-back', pose: 'Plant your feet comfortably, keep one knee soft, and turn your face toward the light', hands: 'Lift one hand near your hair or glasses; let the other rest by your side' },
    { name: 'Look-up close portrait', imageId: 'solo-street-stance', pose: 'Frame from the waist up, angle your shoulders slightly, and lift your chin toward the light', hands: 'Hold a jacket lapel or let one hand hover near your collar' },
    { name: 'Quiet close-up', imageId: 'solo-seated-lean', pose: 'Frame from the chest up, turn one shoulder toward the lens, and keep your head level', hands: 'Keep hands just outside the crop or rest them lightly at your collar' },
  ],
  couple: [
    { name: 'Walk into the frame', imageId: 'couple-walk', pose: 'Walk side by side, close enough for your shoulders to brush', hands: 'Hold inside hands gently and let your free arms swing' },
    { name: 'A quiet pause', imageId: 'couple-close', pose: 'Stand close with foreheads nearly touching and bodies turned slightly toward the lens', hands: 'Rest hands softly on each other\'s upper arms' },
    { name: 'Heart in the light', imageId: 'couple-heart', pose: 'Face each other and raise joined hands to make a small heart shape', hands: 'Touch fingertips together without blocking either face' },
  ],
  friends: [
    { name: 'Shoulder-to-shoulder huddle', imageId: 'friends-huddle', pose: 'Sit or stand in one close line and lean gently toward the middle', hands: 'Rest an arm behind the person next to you' },
    { name: 'Toast and laugh', imageId: 'friends-toast', pose: 'Gather around the table, turn toward one another, and lift your glasses together', hands: 'Keep glasses around shoulder height so faces stay clear' },
    { name: 'Walk and talk', imageId: 'friends-walk', pose: 'Walk in a loose row and turn toward the friend beside you', hands: 'Let arms swing or link elbows loosely' },
  ],
  group: [
    { name: 'Staggered layers', imageId: 'group-layers', pose: 'Build two loose rows, with the back row standing and the front row seated or crouched', hands: 'Rest hands on your own knees or lightly on a nearby shoulder' },
    { name: 'Everyone in', imageId: 'group-huddle', pose: 'Close the gaps and lean toward the person nearest the center', hands: 'Put arms around shoulders, keeping hands visible and relaxed' },
    { name: 'One shared step', imageId: 'group-step', pose: 'Take one small step toward the camera together, then settle into the frame', hands: 'Keep hands low or linked so nobody blocks a face' },
  ],
};

const VIBE = {
  cute: { cue: 'Add a small head tilt and keep the shape soft.', expression: 'Warm smile, relaxed eyes', tip: 'Face a bright window or open shade' },
  natural: { cue: 'Start moving before the shutter; keep the in-between moment.', expression: 'Mid-laugh or looking at each other', tip: 'Shoot a short burst while everyone moves' },
  confident: { cue: 'Lengthen your posture and turn your strongest side toward the lens.', expression: 'Chin level, steady eye contact', tip: 'Shoot from chest height or slightly below' },
  romantic: { cue: 'Move close and let the pose feel unhurried.', expression: 'Soft eyes and a quiet smile', tip: 'Use warm side light near sunset' },
  cool: { cue: 'Keep the movement minimal and use a clean, angled line.', expression: 'Relaxed face with a slight smirk', tip: 'Use directional shade and a straight horizon' },
  bold: { cue: 'Make the gesture bigger and hold it for one beat.', expression: 'Direct gaze with playful intensity', tip: 'Step back, use a wide frame, and leave room to move' },
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

  const poses = BASE[group].map((poseDetails) => ({
    name: poseDetails.name,
    imageUrl: cloudinary.url(`vybe/poses/${poseDetails.imageId}`, { secure: true }),
    instructions: {
      pose: `${poseDetails.pose}. ${VIBE[vibe].cue}`,
      hands: poseDetails.hands,
      expression: VIBE[vibe].expression,
      tip: VIBE[vibe].tip,
    },
  }));

  res.json({ poses });
});

export default router;