# VYBE

**You bring the photos. VYBE finds the vibe.**

VYBE is a visual content assistant for social media. You choose a mood and who is in the shot, VYBE suggests three poses to try, you upload your real photos, and VYBE turns them into a ready-to-post Instagram carousel. Cloudinary handles every image step: storage, content-aware cropping, and optimized delivery.

Built by team **PPS.exe** for the Cloudinary hackathon, **Track 2: Generative Content Workflows**.

| | |
|---|---|
| Live demo | [TODO: add the frontend URL] |
| Backend API | https://vybe-95tw.onrender.com |
| Demo video | [TODO: add the video link] |

> The backend runs on a free Render instance that sleeps when idle. The first request can take up to a minute to wake it up.

## The problem

A camera roll is not a post. Turning real photos into a carousel that looks planned takes posing sense, cropping, and editing that most people don't have. Photos taken in the wrong orientation get their subject cut off by an automatic crop, and the result looks careless.

## What VYBE does

1. **Pick a vibe and a group.** Cute, Natural, Confident, Romantic, Cool or Bold, for Solo, Couple, Friends or a Group.
2. **Get three poses to shoot.** Each pose has a reference image and plain instructions for stance, hands, expression, and a tip.
3. **Upload your real photos.** They go straight to Cloudinary and are analyzed for composition.
4. **Get your carousel.** Every photo is cropped to Instagram 4:5 around the subject, previewed in a phone-style frame, and can be downloaded slide by slide.
5. **See the rescue.** The Smart Photo Rescue slider compares a plain center crop with Cloudinary's content-aware crop on the same photo.

## How we use Cloudinary

Cloudinary is the media backbone of the product, not a storage add-on. Each feature below maps to an endpoint.

| Cloudinary feature | Where | What it does |
|---|---|---|
| **Upload API** | `POST /upload/:projectId` | Every user photo is uploaded to the `vybe/uploads` folder. The returned `public_id`, URL, and dimensions are saved on the project. |
| **Content-aware cropping** (`c_fill`, `g_auto:faces`) | `POST /compose/:projectId` | Each photo is cropped to 1080 x 1350 (Instagram 4:5) with the crop centered on detected faces, so the subject stays in frame. |
| **Before and after for Smart Photo Rescue** | `POST /compose/:projectId` | The same photo is also delivered with a plain center crop (`g_center`), and the UI lets you drag between the two. |
| **Automatic format and quality** (`f_auto`, `q_auto`) | `POST /compose/:projectId`, pose images | Every delivered image uses the best format and quality for the viewer's browser. Pose reference images are also resized (`w_600`) on delivery. |
| **Asset storage for references** | `POST /poses` | Pose reference images are stored in Cloudinary under `vybe/poses` and delivered with the same optimizations. |
| **Download delivery** (`fl_attachment`) | Board screen | The "Download this slide" button asks Cloudinary to deliver the finished crop as a file. |
| **Photo analysis** | `POST /analyze/:projectId` | Reads each photo's orientation, number of people, subject position, and background, and suggests a role in the carousel. [TODO (Palak): name the Cloudinary features or models used here.] |

Example of a delivered URL from `/compose`:

```
https://res.cloudinary.com/<cloud>/image/upload/c_fill,g_auto:faces,h_1350,w_1080/f_auto,q_auto/v1/vybe/uploads/<id>
```

## Architecture

```
React app (Vercel)
      |
      |  REST / JSON
      v
Express API (Render) ----> MongoDB Atlas   (projects, photos, poses, board)
      |
      v
Cloudinary   (upload, analysis, smart crop, optimized delivery)
```

A **project** is created when the user picks a vibe and group. It then collects the uploaded photos, the poses shown, and the final board.

### API

| Method and route | Body | Returns |
|---|---|---|
| `GET /` | none | `{ status }` health check |
| `POST /projects` | `{ vibe, peopleCount }` | the new project, including `_id` |
| `GET /projects/:id` | none | the project |
| `PATCH /projects/:id` | any of `vibe`, `peopleCount`, `status` | the updated project |
| `POST /upload/:projectId` | multipart form, field `photos` (up to 15 images, 10 MB each) | `{ assets: [{ assetId, url, width, height, format }] }` |
| `POST /analyze/:projectId` | none | `{ analysis: [{ assetId, peopleCount, orientation, subjectPosition, background, suggestedRole }] }` |
| `POST /poses` | `{ vibe, peopleCount }` | `{ poses: [{ name, imageUrl, instructions: { pose, hands, expression, tip } }] }`, always 3 |
| `POST /compose/:projectId` | optional `{ assetIds }` | `{ slides: [{ assetId, url, beforeUrl, role }] }` |

Valid values: `vibe` is `cute`, `natural`, `confident`, `romantic`, `cool` or `bold`. `peopleCount` is `solo`, `couple`, `friends` or `group`.

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | React (Create React App), react-icons, hand-written CSS with Fraunces and Manrope |
| Backend | Node.js, Express, Mongoose, Multer |
| Database | MongoDB Atlas |
| Media | Cloudinary (`cloudinary` Node SDK) |
| Hosting | Vercel (frontend), Render (backend) |

## Project structure

```
.
├── backend/
│   ├── config/cloudinary.js     Cloudinary SDK setup
│   ├── models/Project.js        Mongoose schema
│   ├── routes/
│   │   ├── projects.js          create, read, update a project
│   │   ├── upload.js            photos to Cloudinary
│   │   ├── analyze.js           photo analysis
│   │   ├── poses.js             pose library
│   │   └── compose.js           smart crop and before/after URLs
│   ├── server.js
│   └── .env.example
├── frontend/
│   ├── public/
│   └── src/
│       ├── App.js               flow, state, and API calls
│       ├── api.js               backend client
│       ├── VibeSelect.js
│       ├── Upload.js
│       ├── PoseStudio.js
│       ├── YourBoard.js
│       └── styles.css
└── design/                      logo and design references
```

## Run it locally

You need Node.js 18 or newer, a free [Cloudinary](https://cloudinary.com) account, and a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster.

### Backend

```bash
cd backend
npm install
cp .env.example .env
```

Fill in `.env`:

```
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
MONGODB_URI=
PORT=4000
```

Start it:

```bash
npm start
```

You should see `VYBE backend running` and `MongoDB connected`. On Windows, use `127.0.0.1` instead of `localhost` in URLs.

### Frontend

```bash
cd frontend
npm install --legacy-peer-deps
```

The flag is needed because React 19 and `react-scripts` 5 declare conflicting peer dependencies.

Create `frontend/.env.development`:

```
REACT_APP_API_URL=http://127.0.0.1:4000
```

Then run `npm start`. For a production build, set `REACT_APP_API_URL` to the deployed backend URL before running `npm run build`.

### Try the API without the UI

```bash
# 1. create a project
curl -X POST http://127.0.0.1:4000/projects \
  -H "Content-Type: application/json" \
  -d '{"vibe":"confident","peopleCount":"solo"}'

# 2. upload a photo (use the _id from step 1)
curl -X POST http://127.0.0.1:4000/upload/PROJECT_ID -F "photos=@photo.jpg"

# 3. analyze, get poses, build the board
curl -X POST http://127.0.0.1:4000/analyze/PROJECT_ID
curl -X POST http://127.0.0.1:4000/poses \
  -H "Content-Type: application/json" \
  -d '{"vibe":"confident","peopleCount":"solo"}'
curl -X POST http://127.0.0.1:4000/compose/PROJECT_ID
```

Open `url` and `beforeUrl` from the last response side by side to see the smart crop against the plain center crop.

## Scope and what's next

This is a hackathon build, so the scope is deliberately tight:

- Six fixed vibes and four group types. Free-text descriptions ("Describe it myself") are not built yet.
- One output format: the Instagram 4:5 carousel.
- Three poses for each vibe and group combination, from a curated library.

Next steps: Story (9:16) and Pinterest outputs, free-text vibe parsing, ordering slides by photo analysis, and user accounts to save boards.

## Team PPS.exe

| | Role |
|---|---|
| Saakshi Singh | Backend and Cloudinary architecture |
| Pooja | Frontend and design implementation |
| Palak | Pose and photo-analysis logic |

Built for the Cloudinary hackathon on HackIndia, "Pixels to Products".
