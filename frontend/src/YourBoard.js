import { useState } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaRegHeart,
  FaRegComment,
  FaRegPaperPlane,
  FaRegBookmark,
} from "react-icons/fa";

function slideLabel(slide, index) {
  return slide.role === "cover" ? "Cover" : `Slide ${index + 1}`;
}

// forces a browser download for a Cloudinary delivery URL
function downloadUrl(url) {
  if (!url || !url.includes("/image/upload/")) return url;
  return url.replace("/image/upload/", "/image/upload/fl_attachment/");
}

function describe(info) {
  if (!info) return "";
  const parts = [];
  if (typeof info.peopleCount === "number") {
    parts.push(info.peopleCount === 1 ? "1 person" : `${info.peopleCount} people`);
  }
  if (info.background) parts.push(info.background);
  if (info.subjectPosition) parts.push(`subject ${info.subjectPosition}`);
  return parts.join(", ");
}

function YourBoard({ slides = [], analysis = [], onStartOver }) {
  const [index, setIndex] = useState(0);
  const [pos, setPos] = useState(50);
  const [vibeGrade, setVibeGrade] = useState(true);

  if (slides.length === 0) {
    return (
      <section>
        <h2 className="v-h2">Your board</h2>
        <p className="v-lead">No board yet. Add photos and build one.</p>
      </section>
    );
  }

  const current = slides[index];
  const displayUrl = vibeGrade ? current.url : current.plainUrl || current.url;
  const info = analysis.find((a) => a.assetId === current.assetId);
  const detected = describe(info);

  return (
    <section>
      <h2 className="v-h2">Your Instagram carousel</h2>
      <p className="v-lead">
        {slides.length} slide{slides.length > 1 ? "s" : ""}, cropped to 4:5 around your subject.
      </p>

      <div className="v-board">
        <div>
          <div className="v-grade-toggle" role="group" aria-label="Vibe color grade">
            <button
              type="button"
              className={vibeGrade ? "is-on" : ""}
              aria-pressed={vibeGrade}
              onClick={() => setVibeGrade(true)}
            >
              Vibe on
            </button>
            <button
              type="button"
              className={!vibeGrade ? "is-on" : ""}
              aria-pressed={!vibeGrade}
              onClick={() => setVibeGrade(false)}
            >
              Vibe off
            </button>
          </div>
          <div className="v-phone">
            <div className="v-phone-screen">
              <div className="v-phone-top">
                <span className="v-avatar" aria-hidden="true" />
                your.vybe
              </div>
              <div className="v-phone-img">
                <img src={displayUrl} alt={slideLabel(current, index)} />
                <button
                  type="button"
                  className="v-arrow prev"
                  aria-label="Previous slide"
                  disabled={index === 0}
                  onClick={() => setIndex(index - 1)}
                >
                  <FaChevronLeft />
                </button>
                <button
                  type="button"
                  className="v-arrow next"
                  aria-label="Next slide"
                  disabled={index === slides.length - 1}
                  onClick={() => setIndex(index + 1)}
                >
                  <FaChevronRight />
                </button>
              </div>
              <div className="v-phone-bottom">
                <div className="v-phone-icons" aria-hidden="true">
                  <FaRegHeart /> <FaRegComment /> <FaRegPaperPlane />
                </div>
                <div className="v-dots" aria-hidden="true">
                  {slides.map((s, i) => (
                    <span key={s.assetId} className={"v-dot" + (i === index ? " is-on" : "")} />
                  ))}
                </div>
                <FaRegBookmark aria-hidden="true" />
              </div>
            </div>
          </div>

          <div className="v-strip">
            {slides.map((s, i) => (
              <button
                key={s.assetId}
                type="button"
                className={i === index ? "is-on" : ""}
                aria-label={slideLabel(s, i)}
                onClick={() => setIndex(i)}
              >
                <img src={vibeGrade ? s.url : s.plainUrl || s.url} alt="" />
                <span>{i + 1}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="v-rescue">
          <h3 className="v-h3" style={{ fontSize: 28 }}>Smart photo rescue</h3>
          <p className="v-muted" style={{ maxWidth: "46ch" }}>
            A plain center crop can cut off the person. Cloudinary's
            content-aware crop finds the subject and keeps them in frame.
            Drag the handle to compare {slideLabel(current, index).toLowerCase()}.
          </p>

          <div className="v-compare" style={{ "--pos": `${pos}%` }}>
            <img src={displayUrl} alt={vibeGrade ? "Vibe-graded smart crop" : "Plain smart crop"} />
            <img className="before" src={current.beforeUrl} alt="Before: center crop" />
            <div className="v-compare-line" />
            <span className="v-compare-tag l">Center crop</span>
            <span className="v-compare-tag r">{vibeGrade ? "Vibe grade" : "Plain smart crop"}</span>
            <input
              type="range"
              min="0"
              max="100"
              value={pos}
              aria-label="Compare center crop and smart crop"
              onChange={(e) => setPos(Number(e.target.value))}
            />
          </div>

          {detected && <p className="v-muted">Detected in this photo: {detected}.</p>}

          <div className="v-actions" style={{ marginTop: 24 }}>
            <a
              className="v-btn-quiet"
              href={downloadUrl(displayUrl)}
              target="_blank"
              rel="noreferrer"
            >
              Download this slide
            </a>
            <button type="button" className="v-btn-quiet" onClick={onStartOver}>
              Start over with a new vibe
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default YourBoard;