import express from 'express';
import cloudinary from '../config/cloudinary.js';
import VIBE_GRADES from '../services/vibeGrades.js';

const router = express.Router();

const VIBE_NAMES = ['cute', 'natural', 'confident', 'romantic', 'cool', 'bold'];

const VIBE_COPY = {
  cute: {
    pose: ['Keep the shape soft and playful:', 'Add a sweet tilt to this setup:', 'Give this pose a light, storybook feel:'],
    hands: ['Keep the gesture gentle and delicate:', 'Make the hand placement small and playful:', 'Use relaxed fingertips for a softer finish:'],
    expression: ['Try a sweet grin with bright, curious eyes.', 'Give the camera a shy smile and a tiny hint of mischief.', 'Let your cheeks lift into an easy, sunny smile.'],
    tip: ['Find soft window light and let one pastel detail enter the frame.', 'Try open shade for even light across your smile.', 'Keep the background simple and bring one cheerful color into view.'],
  },
  natural: {
    pose: ['Let this setup fall into an unguarded moment:', 'Keep the movement easy and unforced:', 'Make this feel like a moment between frames:'],
    hands: ['Let your hands follow the movement:', 'Leave the gesture loose and familiar:', 'Keep your hands occupied in an everyday way:'],
    expression: ['Catch a real laugh or look toward someone beside you.', 'Let your face settle between smiles instead of holding one.', 'Share a quick glance and let the expression happen naturally.'],
    tip: ['Shoot a short burst while you keep moving.', 'Talk to each other through the frame to keep expressions easy.', 'Use the light already around you and avoid over-directing the moment.'],
  },
  confident: {
    pose: ['Give this shape a composed, assured finish:', 'Take the space in this pose with intention:', 'Keep the body line grounded and self-assured:'],
    hands: ['Place each hand with calm, deliberate purpose:', 'Use a strong hand position without tightening your shoulders:', 'Set your hands cleanly so the pose feels in control:'],
    expression: ['Hold your chin level and meet the lens with steady eyes.', 'Use a composed expression with a small, certain smile.', 'Look directly into camera as if you already belong in the frame.'],
    tip: ['Set the camera around chest height and use clean directional light.', 'Turn slightly toward the light to define your shoulder line.', 'Keep the background uncluttered so your presence leads the frame.'],
  },
  romantic: {
    pose: ['Let this pose unfold slowly and softly:', 'Bring the shape closer and leave it unhurried:', 'Give the moment a tender, easy rhythm:'],
    hands: ['Rest your hands gently and let each touch feel considered:', 'Keep the contact soft, with no gripping or pulling:', 'Let your hands settle where the closeness feels natural:'],
    expression: ['Share a quiet smile meant for someone close.', 'Soften your eyes and hold a warm, unhurried look.', 'Look toward each other as if the camera is not there.'],
    tip: ['Turn toward warm side light and leave a little breathing room.', 'Try late-afternoon light for a gentle warmth on both faces.', 'Move close to the light source and let the background fall away.'],
  },
  cool: {
    pose: ['Keep this shape minimal with one precise angle:', 'Use a clean line and hold the pose without fuss:', 'Settle into an understated, angular position:'],
    hands: ['Keep the hands low and the gesture restrained:', 'Use one simple hand placement and leave the rest relaxed:', 'Keep your hands quiet so the silhouette stays clean:'],
    expression: ['Keep a calm gaze and the smallest hint of a smirk.', 'Look just past the lens with an easy, composed face.', 'Stay relaxed in the face and let the eyes carry the frame.'],
    tip: ['Find directional shade, a clean background, and a level horizon.', 'Use side light to bring out the angles without adding clutter.', 'Keep the frame spare and let negative space do some work.'],
  },
  bold: {
    pose: ['Hit this pose with a bigger, high-energy movement:', 'Make the shape decisive and claim the whole frame:', 'Turn this setup into a strong, unmistakable gesture:'],
    hands: ['Make the hands part of the statement:', 'Use a clear gesture that reads from across the frame:', 'Give your hands a sharp, confident direction:'],
    expression: ['Go straight to camera with an unapologetic look.', 'Bring a fierce grin or a full-volume laugh to the lens.', 'Hold an intense gaze and make the expression unmistakable.'],
    tip: ['Step back, open the frame, and leave room for movement.', 'Use punchy light and shoot during the strongest part of the gesture.', 'Keep the camera wide enough to capture the whole pose cleanly.'],
  },
};

function rewriteInstruction(base, lead) {
  return `${lead} ${base[0].toLowerCase()}${base.slice(1)}`;
}

function chooseDistinctVibePlans(groupPoses) {
  const imageGroups = [...groupPoses.reduce((groups, poseDetails) => {
    const group = groups.get(poseDetails.imagePublicId) || [];
    group.push(poseDetails);
    groups.set(poseDetails.imagePublicId, group);
    return groups;
  }, new Map()).values()];
  const combinations = [];

  function collectCombinations(nextGroup, poses) {
    if (poses.length === 3) {
      combinations.push(poses);
      return;
    }
    for (let groupIndex = nextGroup; groupIndex < imageGroups.length; groupIndex += 1) {
      for (const poseDetails of imageGroups[groupIndex]) {
        collectCombinations(groupIndex + 1, [...poses, poseDetails]);
      }
    }
  }

  collectCombinations(0, []);
  const rankedByVibe = new Map(VIBE_NAMES.map((vibe) => [
    vibe,
    combinations
      .map((poseDetails) => ({
        poseDetails,
        matches: poseDetails.filter((pose) => pose.vibes.includes(vibe)).length,
        tieBreak: Math.random(),
      }))
      .sort((a, b) => b.matches - a.matches || a.tieBreak - b.tieBreak),
  ]));

  let result;
  function assignVibe(vibeIndex, usedSignatures, plans) {
    if (vibeIndex === VIBE_NAMES.length) {
      result = plans;
      return true;
    }

    const vibe = VIBE_NAMES[vibeIndex];
    for (const candidate of rankedByVibe.get(vibe)) {
      const signature = candidate.poseDetails.map((pose) => pose.id).sort().join('|');
      if (usedSignatures.has(signature)) continue;
      plans.set(vibe, candidate.poseDetails.map((poseDetails) => ({ poseDetails })));
      usedSignatures.add(signature);
      if (assignVibe(vibeIndex + 1, usedSignatures, plans)) return true;
      usedSignatures.delete(signature);
      plans.delete(vibe);
    }
    return false;
  }

  if (combinations.length && assignVibe(0, new Set(), new Map())) return result;

  return new Map(VIBE_NAMES.map((vibe) => [
    vibe,
    (rankedByVibe.get(vibe)?.[0]?.poseDetails || groupPoses.slice(0, 3))
      .map((poseDetails) => ({ poseDetails })),
  ]));
}

const POSES = {
  solo: [
    { id: 'solo-own-frame', name: 'Own-the-frame stance', groups: ['solo'], vibes: ['cute', 'romantic', 'confident'], imagePublicId: 'vybe/poses/solo-turn-back', instructions: { pose: 'Plant your feet comfortably, keep one knee soft, and turn your face toward the light.', hands: 'Lift one hand near your hair or glasses; let the other rest by your side.' } },
    { id: 'solo-look-up', name: 'Look-up portrait', groups: ['solo'], vibes: ['natural', 'cool', 'romantic'], imagePublicId: 'vybe/poses/solo-street-stance', instructions: { pose: 'Angle your shoulders slightly and lift your chin toward the light.', hands: 'Hold a jacket lapel or let one hand hover near your collar.' } },
    { id: 'solo-quiet-close', name: 'Quiet close-up', groups: ['solo'], vibes: ['bold', 'confident', 'cool'], imagePublicId: 'vybe/poses/solo-seated-lean', instructions: { pose: 'Turn one shoulder toward the lens and keep your head level.', hands: 'Keep hands just outside the crop or rest them at your collar.' } },
    { id: 'solo-window', name: 'Window-side lean', groups: ['solo'], vibes: ['cute', 'natural'], imagePublicId: 'vybe/poses/solo-seated-lean', instructions: { pose: 'Lean lightly toward a bright window and let your weight settle onto one hip.', hands: 'Touch the window ledge softly or tuck one hand into a pocket.' } },
    { id: 'solo-stride', name: 'Mid-stride frame', groups: ['solo'], vibes: ['romantic', 'bold'], imagePublicId: 'vybe/poses/solo-turn-back', instructions: { pose: 'Take one measured step through the frame and glance back over your shoulder.', hands: 'Let one arm swing while the other brushes your jacket.' } },
    { id: 'solo-power-line', name: 'Strong shoulder line', groups: ['solo'], vibes: ['confident', 'natural'], imagePublicId: 'vybe/poses/solo-street-stance', instructions: { pose: 'Turn your shoulders three-quarters to camera and keep your stance grounded.', hands: 'Set one hand at your waist and leave the other loose.' } },
    { id: 'solo-angle', name: 'The side-angle pause', groups: ['solo'], vibes: ['cute', 'cool', 'bold'], imagePublicId: 'vybe/poses/solo-turn-back', instructions: { pose: 'Pause in profile, then turn your eyes back toward the lens.', hands: 'Rest fingertips near your cheek or keep both hands in your pockets.' } },
    { id: 'solo-seated', name: 'Seated easy pose', groups: ['solo'], vibes: ['natural', 'romantic', 'confident'], imagePublicId: 'vybe/poses/solo-seated-lean', instructions: { pose: 'Sit near the edge of a seat and angle your knees toward the light.', hands: 'Rest your hands loosely on one knee, without clasping tightly.' } },
  ],
  couple: [
    { id: 'couple-walk', name: 'Walk into the frame', groups: ['couple'], vibes: ['cute', 'romantic', 'confident'], imagePublicId: 'vybe/poses/couple-walk', instructions: { pose: 'Walk side by side, close enough for your shoulders to brush.', hands: 'Hold inside hands gently and let your free arms swing.' } },
    { id: 'couple-pause', name: 'A quiet pause', groups: ['couple'], vibes: ['natural', 'cool', 'romantic'], imagePublicId: 'vybe/poses/couple-close', instructions: { pose: 'Stand close with foreheads nearly touching and bodies turned slightly toward camera.', hands: 'Rest your hands softly on each other’s upper arms.' } },
    { id: 'couple-heart', name: 'Heart in the light', groups: ['couple'], vibes: ['bold', 'confident', 'cool'], imagePublicId: 'vybe/poses/couple-heart', instructions: { pose: 'Face each other and raise joined hands to make a small heart shape.', hands: 'Touch fingertips together without blocking either face.' } },
    { id: 'couple-cheek', name: 'Cheek-to-cheek', groups: ['couple'], vibes: ['cute', 'natural'], imagePublicId: 'vybe/poses/couple-close', instructions: { pose: 'Bring your cheeks together and angle your faces toward the brighter side.', hands: 'Link arms loosely or rest a hand on your partner’s shoulder.' } },
    { id: 'couple-spin', name: 'A half-turn together', groups: ['couple'], vibes: ['romantic', 'bold'], imagePublicId: 'vybe/poses/couple-walk', instructions: { pose: 'Turn toward each other as if beginning a dance, then pause mid-step.', hands: 'Keep one hand joined and let the other arm make a clean line.' } },
    { id: 'couple-back-to-back', name: 'Back-to-back stance', groups: ['couple'], vibes: ['confident', 'natural'], imagePublicId: 'vybe/poses/couple-heart', instructions: { pose: 'Stand back-to-back with a little space and angle both faces toward camera.', hands: 'Keep arms relaxed or place one hand at each waist.' } },
    { id: 'couple-forehead', name: 'Almost a kiss', groups: ['couple'], vibes: ['cute', 'cool', 'bold'], imagePublicId: 'vybe/poses/couple-close', instructions: { pose: 'Lean in until your foreheads nearly meet, leaving a small gap between you.', hands: 'Rest a palm lightly at a shoulder or keep hands just below frame.' } },
    { id: 'couple-sit', name: 'Close-seat portrait', groups: ['couple'], vibes: ['natural', 'romantic', 'confident'], imagePublicId: 'vybe/poses/couple-walk', instructions: { pose: 'Sit shoulder-to-shoulder and turn your knees slightly toward one another.', hands: 'Let one hand rest between you and keep the other loose on your lap.' } },
  ],
  friends: [
    { id: 'friends-huddle', name: 'Shoulder-to-shoulder huddle', groups: ['friends'], vibes: ['cute', 'romantic', 'confident'], imagePublicId: 'vybe/poses/friends-huddle', instructions: { pose: 'Sit or stand in one close line and lean gently toward the middle.', hands: 'Rest an arm behind the person next to you.' } },
    { id: 'friends-toast', name: 'Toast and laugh', groups: ['friends'], vibes: ['natural', 'cool', 'romantic'], imagePublicId: 'vybe/poses/friends-toast', instructions: { pose: 'Gather around the table, turn toward one another, and lift your glasses together.', hands: 'Keep glasses around shoulder height so faces stay clear.' } },
    { id: 'friends-walk', name: 'Walk and talk', groups: ['friends'], vibes: ['bold', 'confident', 'cool'], imagePublicId: 'vybe/poses/friends-walk', instructions: { pose: 'Walk in a loose row and turn toward the friend beside you.', hands: 'Let arms swing or link elbows loosely.' } },
    { id: 'friends-selfie', name: 'The close-in selfie', groups: ['friends'], vibes: ['cute', 'natural'], imagePublicId: 'vybe/poses/friends-huddle', instructions: { pose: 'Lean into the center as if gathering for a spontaneous group selfie.', hands: 'Let one person hold the phone while everyone else keeps hands visible.' } },
    { id: 'friends-toast-high', name: 'Raise the energy', groups: ['friends'], vibes: ['romantic', 'bold'], imagePublicId: 'vybe/poses/friends-toast', instructions: { pose: 'Bring the group into a shallow arc and raise your glasses on one count.', hands: 'Keep the toast above shoulder level and away from faces.' } },
    { id: 'friends-stagger', name: 'Staggered lineup', groups: ['friends'], vibes: ['confident', 'natural'], imagePublicId: 'vybe/poses/friends-walk', instructions: { pose: 'Arrange yourselves at two depths and angle each shoulder toward center.', hands: 'Use pockets, relaxed sides, or one arm across a friend’s shoulder.' } },
    { id: 'friends-angle', name: 'One shared angle', groups: ['friends'], vibes: ['cute', 'cool', 'bold'], imagePublicId: 'vybe/poses/friends-huddle', instructions: { pose: 'Tilt the line of shoulders together and have everyone turn one way.', hands: 'Keep gestures small near your own frame so faces remain open.' } },
    { id: 'friends-bench', name: 'Bench-side moment', groups: ['friends'], vibes: ['natural', 'romantic', 'confident'], imagePublicId: 'vybe/poses/friends-toast', instructions: { pose: 'Sit along a bench with knees angled inward and shoulders loosely connected.', hands: 'Rest hands on your own knees or lightly along the bench.' } },
  ],
  group: [
    { id: 'group-layers', name: 'Staggered layers', groups: ['group'], vibes: ['cute', 'romantic', 'confident'], imagePublicId: 'vybe/poses/group-layers', instructions: { pose: 'Build two loose rows, with the back row standing and the front row seated or crouched.', hands: 'Rest hands on your own knees or lightly on a nearby shoulder.' } },
    { id: 'group-everyone-in', name: 'Everyone in', groups: ['group'], vibes: ['natural', 'cool', 'romantic'], imagePublicId: 'vybe/poses/group-huddle', instructions: { pose: 'Close the gaps and lean toward the person nearest the center.', hands: 'Put arms around shoulders, keeping hands visible and relaxed.' } },
    { id: 'group-step', name: 'One shared step', groups: ['group'], vibes: ['bold', 'confident', 'cool'], imagePublicId: 'vybe/poses/group-step', instructions: { pose: 'Take one small step toward camera together, then settle into the frame.', hands: 'Keep hands low or linked so nobody blocks a face.' } },
    { id: 'group-circle', name: 'Circle the center', groups: ['group'], vibes: ['cute', 'natural'], imagePublicId: 'vybe/poses/group-huddle', instructions: { pose: 'Turn inward around one person, then lean into the circle together.', hands: 'Rest hands lightly on nearby shoulders and keep the center open.' } },
    { id: 'group-cheer', name: 'The big cheer', groups: ['group'], vibes: ['romantic', 'bold'], imagePublicId: 'vybe/poses/group-step', instructions: { pose: 'Gather in a wide arc and lift the group energy on a shared count.', hands: 'Raise hands high but leave a clear pocket around every face.' } },
    { id: 'group-columns', name: 'Clean columns', groups: ['group'], vibes: ['confident', 'natural'], imagePublicId: 'vybe/poses/group-layers', instructions: { pose: 'Arrange yourselves in staggered columns and turn each body slightly inward.', hands: 'Place hands simply at sides or on your own knees.' } },
    { id: 'group-lean', name: 'The angled lean', groups: ['group'], vibes: ['cute', 'cool', 'bold'], imagePublicId: 'vybe/poses/group-huddle', instructions: { pose: 'Create one strong diagonal by leaning gently toward a shared center point.', hands: 'Keep gestures close to your body so the group shape stays clean.' } },
    { id: 'group-seated', name: 'Front-row moment', groups: ['group'], vibes: ['natural', 'romantic', 'confident'], imagePublicId: 'vybe/poses/group-layers', instructions: { pose: 'Let a few people sit in front while the rest gather close behind.', hands: 'Rest hands naturally on knees or nearby shoulders, never over a face.' } },
  ],
};

const POSE_PLANS = Object.fromEntries(
  Object.entries(POSES).map(([group, groupPoses]) => [group, chooseDistinctVibePlans(groupPoses)]),
);

// POST /poses  { vibe, peopleCount }
router.post('/', (req, res) => {
  const vibe = String(req.body.vibe || '').toLowerCase();
  const group = String(req.body.peopleCount || '').toLowerCase();

  if (!VIBE_NAMES.includes(vibe) || !POSES[group]) {
    return res.status(400).json({
      error: 'vibe must be one of cute|natural|confident|romantic|cool|bold and peopleCount one of solo|couple|friends|group',
    });
  }

  const selected = POSE_PLANS[group].get(vibe);

  const poses = selected.map(({ poseDetails }, poseIndex) => ({
    name: poseDetails.name,
    imageUrl: cloudinary.url(poseDetails.imagePublicId, {
      secure: true,
      transformation: [
        ...VIBE_GRADES[vibe],
        { fetch_format: 'auto', quality: 'auto' },
      ],
    }),
    instructions: {
      pose: rewriteInstruction(poseDetails.instructions.pose, VIBE_COPY[vibe].pose[poseIndex]),
      hands: rewriteInstruction(poseDetails.instructions.hands, VIBE_COPY[vibe].hands[poseIndex]),
      expression: VIBE_COPY[vibe].expression[poseIndex],
      tip: VIBE_COPY[vibe].tip[poseIndex],
    },
  }));

  res.json({ poses });
});

export default router;