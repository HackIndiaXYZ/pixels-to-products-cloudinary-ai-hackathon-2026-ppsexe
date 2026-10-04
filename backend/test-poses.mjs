const vibes = ["cute", "natural", "confident", "romantic", "cool", "bold"];
const groups = ["solo", "couple", "friends", "group"];
const base = process.argv[2] || "http://127.0.0.1:4000";

let bad = 0;
const sets = {};
const transformations = {};

for (const peopleCount of groups) {
  sets[peopleCount] = new Set();
  transformations[peopleCount] = {};
  for (const vibe of vibes) {
    const r = await fetch(`${base}/poses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vibe, peopleCount }),
    });
    const d = await r.json();
    const poses = d.poses || [];
    sets[peopleCount].add(poses.map((p) => p.name).join("|"));

    const expressions = new Set(poses.map((pose) => pose.instructions?.expression));
    const tips = new Set(poses.map((pose) => pose.instructions?.tip));
    const grades = poses.map((pose) => {
      const uploadPath = pose.imageUrl?.split("/image/upload/")[1];
      return uploadPath?.split("/vybe/poses/")[0] || "";
    });
    const uniqueCopy = expressions.size === poses.length && tips.size === poses.length;
    const oneGrade = grades.length === 3 && new Set(grades).size === 1;
    if (grades[0]) transformations[peopleCount][vibe] = grades[0];

    let broken = 0;
    for (const p of poses) {
      if (!p.imageUrl) { broken++; continue; }
      const h = await fetch(p.imageUrl, { method: "HEAD" });
      if (!h.ok) broken++;
    }
    const ok = r.ok && poses.length === 3 && broken === 0 && uniqueCopy && oneGrade;
    if (!ok) bad++;
    console.log(`${ok ? "OK  " : "FAIL"} ${vibe}+${peopleCount}: ${poses.length} poses, ${broken} broken images, ${uniqueCopy ? "unique copy" : "duplicate copy"}, ${oneGrade ? "one grade" : "mixed grade"}`);
  }
}

console.log("");
for (const g of groups) {
  console.log(`${g}: ${sets[g].size} different pose sets across 6 vibes (want more than 1)`);
  const gradeCount = new Set(Object.values(transformations[g])).size;
  const uniqueGrades = gradeCount === vibes.length;
  console.log(`${g}: ${gradeCount} different grade strings across 6 vibes (${uniqueGrades ? "OK" : "FAIL"})`);
  if (!uniqueGrades) bad++;
}
console.log(bad === 0 ? "\nAll 24 combinations pass" : `\n${bad} combinations failing`);

if (poses[0]?.imageUrl) {
  grades[vibe] = poses[0].imageUrl
    .split("/image/upload/")[1]
    .split("/v1/")[0]
    .replace(/co_[0-9a-f]{6},?/gi, ""); // a bare co_ does nothing
}
const texts = poses.map((p) => p.instructions?.expression);
if (new Set(texts).size < poses.length) console.log(`     WARN ${vibe}+${peopleCount}: poses share the same expression`);

const byGrade = {};
for (const [v, t] of Object.entries(grades)) (byGrade[t] ||= []).push(v);
for (const [t, list] of Object.entries(byGrade)) {
  if (list.length > 1) console.log(`WARN same visual grade for: ${list.join(", ")}`);
}