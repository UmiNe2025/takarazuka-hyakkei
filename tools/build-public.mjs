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
  "index.html", "privacy.html", "404.html", "_headers",
  "llms.txt", "llms-full.txt", "llms-life.txt", "robots.txt", "sitemap.xml",
  "css/style.css", "css/policy.css",
  "js/views-data.js", "js/main.js", "js/consent.js", "js/lang-lite.js",
  "assets/favicon.svg", "assets/ogp.png",
];

for (const rel of files) {
  const srcPath = path.join(ROOT, rel);
  const dst = path.join(PUB, rel);
  if (!fs.existsSync(srcPath)) { console.error("MISSING:", rel); process.exitCode = 1; continue; }
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(srcPath, dst);
}

/* life/ はマルチページ（ハブ + カテゴリ別 + 検索インデックス + assets）を
   まるごとコピー。編集元データ(data/)・READMEは公開物に含めない。 */
const LIFE_EXCLUDE = new Set(["data", "README.md"]);
(function copyLife(srcDir, dstDir) {
  fs.mkdirSync(dstDir, { recursive: true });
  for (const e of fs.readdirSync(srcDir, { withFileTypes: true })) {
    if (LIFE_EXCLUDE.has(e.name)) continue;
    const s = path.join(srcDir, e.name);
    const d = path.join(dstDir, e.name);
    if (e.isDirectory()) copyLife(s, d);
    else fs.copyFileSync(s, d);
  }
})(path.join(ROOT, "life"), path.join(PUB, "life"));

/* guide/ （宝塚さんぽ・おでかけガイド = 広告あり層）も丸ごとコピー */
(function copyGuide(srcDir, dstDir) {
  if (!fs.existsSync(srcDir)) { console.error("MISSING: guide/"); process.exitCode = 1; return; }
  fs.mkdirSync(dstDir, { recursive: true });
  for (const ent of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const s = path.join(srcDir, ent.name);
    const d = path.join(dstDir, ent.name);
    if (ent.isDirectory()) copyGuide(s, d);
    else fs.copyFileSync(s, d);
  }
})(path.join(ROOT, "guide"), path.join(PUB, "guide"));

const list = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else list.push(path.relative(PUB, p) + " (" + (fs.statSync(p).size / 1024).toFixed(1) + " KB)");
  }
})(PUB);
console.log("public/ assembled:\n  " + list.join("\n  "));
