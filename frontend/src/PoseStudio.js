import { useState } from "react";

// adds Cloudinary automatic format, quality and width to a delivery URL
function optimize(url, width = 600) {
  if (!url || !url.includes("/image/upload/")) return url;
  return url.replace("/image/upload/", `/image/upload/f_auto,q_auto,w_${width}/`);
}

function PoseStudio({ poses = [], vibe, group, onMakeBoard, loading }) {
  const [selected, setSelected] = useState(null);

  return (
    <section>
      <h2 className="v-h2">Three poses to try</h2>
      <p className="v-lead">
        Shoot these, then build your board from the photos you take.
      </p>
      <div>
        <span className="v-pill">{vibe}</span>
        <span className="v-pill">{group}</span>
      </div>

      <div className="v-poses">
        {poses.map((pose) => {
          const info = pose.instructions || {};
          return (
            <article
              key={pose.name}
              className={"v-pose" + (selected === pose.name ? " is-on" : "")}
              onClick={() => setSelected(pose.name)}
            >
              <div className="v-frame">
                {pose.imageUrl ? (
                  <img src={optimize(pose.imageUrl)} alt={pose.name} loading="lazy" />
                ) : (
                  <div className="v-frame-empty" style={{ height: "100%" }}>No reference image</div>
                )}
              </div>
              <div className="v-pose-body">
                <h3 className="v-h3">{pose.name}</h3>
                {info.expression && <p className="v-muted" style={{ margin: 0 }}>{info.expression}</p>}
                <details className="v-details" onClick={(e) => e.stopPropagation()}>
                  <summary>How to pose</summary>
                  <dl>
                    {info.pose && (<><dt>Pose</dt><dd>{info.pose}</dd></>)}
                    {info.hands && (<><dt>Hands</dt><dd>{info.hands}</dd></>)}
                    {info.expression && (<><dt>Expression</dt><dd>{info.expression}</dd></>)}
                    {info.tip && (<><dt>Tip</dt><dd>{info.tip}</dd></>)}
                  </dl>
                </details>
              </div>
            </article>
          );
        })}
      </div>

      <div className="v-actions" style={{ marginTop: 56 }}>
        <button type="button" className="v-btn" onClick={onMakeBoard} disabled={loading}>
          Build my board
        </button>
      </div>
    </section>
  );
}

export default PoseStudio;