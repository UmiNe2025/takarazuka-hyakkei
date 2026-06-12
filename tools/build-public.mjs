/* Assemble public/ for Cloudflare Pages deploy (site files only — no research/tools/qa).
   Run: node tools/build-public.mjs  (after tools/prerender.mjs) */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUB = path.join(ROOT, "public");

fs.rmSync(PUB, { recursive: true, force: true });
fs.mkdirSync(PUB, { recursive: true });

const files = [
  "index.html", "404.html", "_headers",
  "llms.txt", "llms-full.txt", "robots.txt", "sitemap.xml",
  "css/style.css", "js/views-data.js", "js/main.js",
  "assets/favicon.svg", "assets/ogp.png"
];

for (const rel of files) {
  const srcPath = path.join(ROOT, rel);
  const dst = path.join(PUB, rel);
  if (!fs.existsSync(srcPath)) { console.error("MISSING:", rel); process.exitCode = 1; continue; }
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(srcPath, dst);
}

const list = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else list.push(path.relative(PUB, p) + " (" + (fs.statSync(p).size / 1024).toFixed(1) + " KB)");
  }
})(PUB);
console.log("public/ assembled:\n  " + list.join("\n  "));
