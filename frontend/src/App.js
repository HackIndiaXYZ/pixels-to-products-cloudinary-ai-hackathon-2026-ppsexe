import "./tokens.css";
import "./styles.css";
import { useState } from "react";
import VibeSelect from "./VibeSelect";
import Upload from "./Upload";
import PoseStudio from "./PoseStudio";
import YourBoard from "./YourBoard";
import {
  createProject,
  uploadPhotos,
  analyzePhotos,
  getPoses,
  composeBoard,
} from "./api";

const STEPS = [
  { id: "vibe", label: "Vibe" },
  { id: "upload", label: "Upload" },
  { id: "pose", label: "Poses" },
  { id: "board", label: "Board" },
];

function App() {
  const [screen, setScreen] = useState("vibe");

  const [vibe, setVibe] = useState("");
  const [group, setGroup] = useState("");
  const [projectId, setProjectId] = useState(null);
  const [analysis, setAnalysis] = useState([]);
  const [poses, setPoses] = useState([]);
  const [slides, setSlides] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [error, setError] = useState("");

  async function run(message, fn) {
    setError("");
    setLoadingMsg(message);
    setLoading(true);
    try {
      await fn();
    } catch (e) {
      setError(e.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleVibeContinue() {
    if (!vibe || !group) {
      setError("Pick a vibe and who is in the photos to continue.");
      return;
    }
    run("Setting up your project. The first request can take up to a minute while the server wakes up.", async () => {
      const project = await createProject(vibe, group);
      setProjectId(project._id);
      setScreen("upload");
    });
  }

  function handleUploadNext(files) {
    if (!files || files.length === 0) {
      setError("Add at least one photo to continue.");
      return;
    }
    run("Uploading your photos to Cloudinary and reading their composition.", async () => {
      await uploadPhotos(projectId, files);

      // analysis adds detail but should never block the flow
      try {
        const a = await analyzePhotos(projectId);
        setAnalysis(a.analysis || []);
      } catch (e) {
        console.warn("Analyze failed:", e.message);
      }

      const p = await getPoses(vibe, group);
      setPoses(p.poses || []);
      setScreen("pose");
    });
  }

  function handleMakeBoard() {
    run("Cropping every photo to Instagram 4:5 with Cloudinary.", async () => {
      const board = await composeBoard(projectId);
      setSlides(board.slides || []);
      setScreen("board");
    });
  }

  function handleStartOver() {
    setVibe("");
    setGroup("");
    setProjectId(null);
    setAnalysis([]);
    setPoses([]);
    setSlides([]);
    setError("");
    setScreen("vibe");
  }

  function canOpen(id) {
    if (id === "vibe") return true;
    if (id === "upload") return Boolean(projectId);
    if (id === "pose") return poses.length > 0;
    if (id === "board") return slides.length > 0;
    return false;
  }

  function go(id) {
    if (!canOpen(id)) return;
    setError("");
    setScreen(id);
  }

  const currentIndex = STEPS.findIndex((s) => s.id === screen);

  return (
    <div className="v-app">
      <header className="v-header">
        <div className="v-logo">
          <span className="v-logo-mark" aria-hidden="true" />
          VYBE
        </div>
        <ol className="v-steps">
          {STEPS.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                className={
                  "v-step" +
                  (screen === s.id ? " is-active" : "") +
                  (i < currentIndex ? " is-done" : "")
                }
                onClick={() => go(s.id)}
                disabled={!canOpen(s.id)}
                aria-current={screen === s.id ? "step" : undefined}
              >
                <span className="v-step-num">{i + 1}</span>
                <span className="v-step-label">{s.label}</span>
              </button>
            </li>
          ))}
        </ol>
      </header>

      {error && <div className="v-error" role="alert">{error}</div>}

      {loading && (
        <div className="v-loading" role="status">
          <div className="v-spinner" />
          <p>{loadingMsg}</p>
        </div>
      )}

      <main className="v-main">
        {screen === "vibe" && (
          <VibeSelect
            vibe={vibe}
            group={group}
            setVibe={setVibe}
            setGroup={setGroup}
            onContinue={handleVibeContinue}
            loading={loading}
          />
        )}
        {screen === "upload" && (
          <Upload onNext={handleUploadNext} loading={loading} />
        )}
        {screen === "pose" && (
          <PoseStudio
            poses={poses}
            vibe={vibe}
            group={group}
            onMakeBoard={handleMakeBoard}
            loading={loading}
          />
        )}
        {screen === "board" && (
          <YourBoard
            slides={slides}
            analysis={analysis}
            onStartOver={handleStartOver}
          />
        )}
      </main>

      <footer className="v-footer">
        Photos stored and delivered by Cloudinary with automatic format and quality.
      </footer>
    </div>
  );
}

export default App;