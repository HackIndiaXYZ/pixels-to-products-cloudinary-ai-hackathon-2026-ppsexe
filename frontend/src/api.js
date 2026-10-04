const BASE = process.env.REACT_APP_API_URL || 'http://127.0.0.1:4000';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  let data = null;
  try {
    data = await res.json();
  } catch {
    // non-JSON response
  }
  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  }
  return data;
}

// vibe: cute|natural|confident|romantic|cool|bold
// peopleCount: solo|couple|friends|group  (always lowercase)
export function createProject(vibe, peopleCount) {
  return request('/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vibe: vibe.toLowerCase(),
      peopleCount: peopleCount.toLowerCase(),
    }),
  });
}

// files: array of File objects from <input type="file" multiple>
export function uploadPhotos(projectId, files) {
  const form = new FormData();
  files.forEach((f) => form.append('photos', f)); // field name must be "photos"
  // do NOT set Content-Type here, the browser sets it with the boundary
  return request(`/upload/${projectId}`, { method: 'POST', body: form });
}

export function analyzePhotos(projectId) {
  return request(`/analyze/${projectId}`, { method: 'POST' });
}

export function getPoses(vibe, peopleCount) {
  return request('/poses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vibe: vibe.toLowerCase(),
      peopleCount: peopleCount.toLowerCase(),
    }),
  });
}

export function composeBoard(projectId, assetIds) {
  return request(`/compose/${projectId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(assetIds ? { assetIds } : {}),
  });
}