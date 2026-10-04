import assert from 'node:assert/strict';
import test from 'node:test';
import cloudinary from '../config/cloudinary.js';
import Project from '../models/Project.js';
import captionRouter from '../routes/caption.js';
import composeRouter from '../routes/compose.js';
import posesRouter from '../routes/poses.js';

const VIBES = ['cute', 'natural', 'confident', 'romantic', 'cool', 'bold'];
const GROUPS = ['solo', 'couple', 'friends', 'group'];
cloudinary.config({ cloud_name: 'demo' });

function invoke(handler, req) {
  let status = 200;
  let body;
  handler(req, {
    status(code) {
      status = code;
      return this;
    },
    json(value) {
      body = value;
      return value;
    },
  });
  return { status, body };
}

test('poses return three vibe-specific matches and optimized HTTPS URLs', () => {
  const handler = posesRouter.stack[0].route.stack[0].handle;
  for (const peopleCount of GROUPS) {
    const responses = VIBES.map((vibe) => invoke(handler, {
      body: { vibe, peopleCount },
    }));

    for (const { status, body } of responses) {
      assert.equal(status, 200);
      assert.equal(body.poses.length, 3);
      const baseAssetIds = body.poses.map((pose) => {
        const publicId = new URL(pose.imageUrl).pathname.split('/').at(-1);
        return publicId.split('?')[0];
      });
      assert.equal(new Set(baseAssetIds).size, 3);
      assert.equal(new Set(body.poses.map((pose) => pose.instructions.expression)).size, 3);
      assert.equal(new Set(body.poses.map((pose) => pose.instructions.tip)).size, 3);
      assert.equal(new Set(body.poses.map((pose) => pose.instructions.pose.split(/(?<=[.!?])\s+/).at(-1))).size, 3);
      assert.equal(new Set(body.poses.map((pose) => pose.instructions.hands.split(/(?<=[.!?])\s+/).at(-1))).size, 3);
      for (const pose of body.poses) {
        assert.match(pose.imageUrl, /^https:\/\//);
        assert.match(pose.imageUrl, /f_auto/);
        assert.match(pose.imageUrl, /q_auto/);
        assert.deepEqual(Object.keys(pose.instructions), ['pose', 'hands', 'expression', 'tip']);
      }
    }

    const poseSets = responses.map(({ body }) => body.poses.map((pose) => pose.name).sort().join('|'));
    assert.equal(new Set(poseSets).size, VIBES.length, `${peopleCount} pose sets should vary by vibe`);
    const gradeStrings = responses.map(({ body }) => {
      const pathname = new URL(body.poses[0].imageUrl).pathname;
      return pathname.split('/image/upload/')[1]?.split('/vybe/poses/')[0] || '';
    });
    assert.equal(new Set(gradeStrings).size, VIBES.length, `${peopleCount} grade strings should vary by vibe`);
  }
});

test('captions return three variations for every supported vibe', () => {
  const handler = captionRouter.stack[0].route.stack[0].handle;

  for (const vibe of VIBES) {
    const { status, body } = invoke(handler, { body: { vibe, peopleCount: 'friends' } });
    assert.equal(status, 200);
    assert.equal(body.variations.length, 3);
    assert.ok(body.variations.every((variation) => variation.caption && Array.isArray(variation.hashtags)));
  }
});

test('compose grades by vibe and returns plain, rescue, Story, and Pinterest URLs', async () => {
  const handler = composeRouter.stack[0].route.stack[0].handle;
  const originalFindById = Project.findById;
  const project = {
    vibe: '',
    photos: [{ assetId: 'vybe/test/one' }, { assetId: 'vybe/test/two' }],
    board: [],
    async save() {},
  };
  Project.findById = async () => project;

  try {
    const responses = [];
    for (const vibe of VIBES) {
      project.vibe = vibe;
      const { status, body } = await handlerResult(handler, project);
      assert.equal(status, 200);
      assert.equal(body.slides.length, 2);
      const [cover, nextSlide] = body.slides;
      assert.match(cover.url, /f_auto/);
      assert.match(cover.url, /q_auto/);
      assert.match(cover.url, /l_text/);
      assert.doesNotMatch(nextSlide.url, /l_text/);
      assert.ok(cover.plainUrl);
      assert.match(cover.beforeUrl, /g_center/);
      assert.match(cover.storyUrl, /h_1920/);
      assert.match(cover.pinterestUrl, /h_1500/);
      responses.push({ cover, nextSlide });
    }

    assert.equal(new Set(responses.map(({ cover }) => cover.url)).size, VIBES.length);
    assert.equal(new Set(responses.map(({ cover }) => cover.plainUrl)).size, 1);
    assert.equal(new Set(responses.map(({ cover }) => cover.beforeUrl)).size, 1);
  } finally {
    Project.findById = originalFindById;
  }
});

async function handlerResult(handler, project) {
  let status = 200;
  let body;
  await handler({
    params: { projectId: '507f1f77bcf86cd799439011' },
    body: {},
  }, {
    status(code) {
      status = code;
      return this;
    },
    json(value) {
      body = value;
      return value;
    },
  });
  return { status, body };
}