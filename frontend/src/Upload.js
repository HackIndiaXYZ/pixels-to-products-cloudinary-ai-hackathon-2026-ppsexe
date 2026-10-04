import { useState } from "react";
import { FaCloudUploadAlt, FaTimes } from "react-icons/fa";

const MAX_FILES = 15;
const MAX_BYTES = 10 * 1024 * 1024;

function isImage(file) {
  return file.type.startsWith("image/") || /\.(jpe?g|jfif|png|webp|gif|heic|heif)$/i.test(file.name);
}

function Upload({ onNext, loading }) {
  const [items, setItems] = useState([]); // { file, url }
  const [dragging, setDragging] = useState(false);
  const [note, setNote] = useState("");

  function addFiles(fileList) {
    const incoming = Array.from(fileList || []);
    const accepted = [];
    let skipped = 0;
    incoming.forEach((f) => {
      if (isImage(f) && f.size <= MAX_BYTES) accepted.push(f);
      else skipped += 1;
    });
    setItems((prev) => {
      const room = MAX_FILES - prev.length;
      const next = accepted.slice(0, Math.max(room, 0)).map((file) => ({
        file,
        url: URL.createObjectURL(file),
      }));
      return [...prev, ...next];
    });
    setNote(skipped > 0 ? `${skipped} file(s) skipped. Use images under 10 MB.` : "");
  }

  function remove(index) {
    setItems((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }

  return (
    <section>
      <h2 className="v-h2">Add your photos</h2>
      <p className="v-lead">
        Three to five photos make a full carousel. Pick the ones you like, in
        any shape. VYBE handles the cropping.
      </p>

      <label
        className={"v-drop" + (dragging ? " is-drag" : "")}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <FaCloudUploadAlt />
        <strong>Drop photos here or choose files</strong>
        <span className="v-muted">JPG, PNG, WebP or HEIC, up to 10 MB each</span>
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={loading}
          onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
        />
      </label>

      {note && <p className="v-muted" role="status">{note}</p>}

      {items.length > 0 && (
        <div className="v-thumbs">
          {items.map((item, i) => (
            <div className="v-thumb" key={item.url}>
              <img src={item.url} alt={item.file.name} />
              <button
                type="button"
                className="v-thumb-x"
                aria-label={`Remove ${item.file.name}`}
                onClick={() => remove(i)}
              >
                <FaTimes />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="v-actions">
        <button
          type="button"
          className="v-btn"
          disabled={loading || items.length === 0}
          onClick={() => onNext(items.map((it) => it.file))}
        >
          See my poses
        </button>
        {items.length > 0 && (
          <span className="v-muted">{items.length} photo{items.length > 1 ? "s" : ""} ready</span>
        )}
      </div>
    </section>
  );
}

export default Upload;