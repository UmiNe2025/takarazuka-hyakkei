/* Merge verified episodes (research/episodes/<cat>.verified.json) into js/views-data.js.
   Run: node tools/merge-episodes.mjs */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = path.join(ROOT, "js", "views-data.js");
const epDir = path.join(ROOT, "research", "episodes");

const src = fs.readFileSync(dataPath, "utf8");
const { TKZ_VIEWS, TKZ_CATS } = new Function(src + "; return {TKZ_VIEWS, TKZ_CATS};")();

let merged = 0, problems = [];
for (const cat of Object.keys(TKZ_CATS)) {
  const verified = path.join(epDir, cat + ".verified.json");
  const raw = path.join(epDir, cat + ".json");
  const file = fs.existsSync(verified) ? verified : (fs.existsSync(raw) ? raw : null);
  if (!file) { problems.push(`MISSING file for cat=${cat}`); continue; }
  if (file === raw) problems.push(`WARN: using unverified file for cat=${cat}`);
  let json;
  try { json = JSON.parse(fs.readFileSync(file, "utf8")); }
  catch (e) { problems.push(`PARSE ERROR ${file}: ${e.message}`); continue; }
  for (const ep of json.episodes || []) {
    const v = TKZ_VIEWS[ep.i];
    if (!v) { problems.push(`bad index ${ep.i} in ${cat}`); continue; }
    if (v.cat !== cat) { problems.push(`index ${ep.i} cat mismatch: expected ${cat}, got ${v.cat}`); continue; }
    if (!ep.eja || !ep.een) { problems.push(`index ${ep.i} missing eja/een`); continue; }
    v.eja = ep.eja.trim();
    v.een = ep.een.trim();
    merged++;
  }
}

const missing = TKZ_VIEWS.map((v, i) => (v.eja ? null : i)).filter((x) => x !== null);

const header = `/* ==========================================================================
   宝塚百景 — The Hundred Views data
   Curated from research/ (R1–R4, sourced 2026-06). Each view:
   ja/en = name, dja/den = one-line description, eja/een = episode (こぼれ話),
   cat = category key, aj/ae = area (JA/EN).
   Regenerate after edits: node tools/merge-episodes.mjs && node tools/prerender.mjs
   ========================================================================== */
`;

function ser(obj) {
  const keys = ["ja", "en", "dja", "den", "eja", "een", "cat", "aj", "ae"];
  const parts = keys.filter((k) => obj[k] !== undefined)
    .map((k) => `${k}: ${JSON.stringify(obj[k])}`);
  return "  { " + parts.join(",\n    ") + " }";
}

const out = header +
  "\nconst TKZ_CATS = " + JSON.stringify(TKZ_CATS, null, 2) + ";\n\n" +
  "const TKZ_VIEWS = [\n" + TKZ_VIEWS.map(ser).join(",\n") + "\n];\n";

fs.writeFileSync(dataPath, out);
console.log(`merged episodes: ${merged}/100`);
if (missing.length) console.log("views WITHOUT episode:", missing.join(", "));
if (problems.length) console.log("problems:\n- " + problems.join("\n- "));
console.log("wrote", dataPath);
