/* Prerender SEO/LLMO artifacts from js/views-data.js:
   1. Static 100-views grid HTML  -> index.html between <!--VIEWS:START/END-->
   2. ItemList JSON-LD            -> index.html between <!--LD:START/END-->
   3. llms-full.txt               -> full markdown content for LLMs
   4. sitemap.xml                 -> with today's lastmod
   Run: node tools/prerender.mjs */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://takarazuka.jun-nakatani.com/";

const src = fs.readFileSync(path.join(ROOT, "js", "views-data.js"), "utf8");
const { TKZ_VIEWS, TKZ_CATS } = new Function(src + "; return {TKZ_VIEWS, TKZ_CATS};")();

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const KD = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
const toKanji = (n) => n === 100 ? "百" :
  (Math.floor(n / 10) > 1 ? KD[Math.floor(n / 10)] : "") + (n >= 10 ? "十" : "") + KD[n % 10];
const bi = (ja, en) => `<span class="ja" lang="ja">${esc(ja)}</span><span class="en" lang="en">${esc(en)}</span>`;

/* ---------- 1. static grid ---------- */
const cardsHtml = TKZ_VIEWS.map((v, i) => {
  const cat = TKZ_CATS[v.cat];
  const epi = v.eja && v.een
    ? `<details class="view-epi"><summary>${bi("こぼれ話", "Side story")}</summary><p>${bi(v.eja, v.een)}</p></details>`
    : "";
  const search = esc((v.ja + " " + v.en + " " + v.dja + " " + v.den + " " + (v.eja || "") + " " + (v.een || "") + " " + v.aj + " " + v.ae).toLowerCase());
  return `<li class="view-card" id="view-${i + 1}" data-cat="${v.cat}" data-search="${search}">` +
    `<span class="view-num" aria-hidden="true">${toKanji(i + 1)}</span>` +
    `<div class="view-body"><h3>${bi(v.ja, v.en)}<span class="v-en">${bi(v.en, v.ja)}</span></h3>` +
    `<p>${bi(v.dja, v.den)}</p>${epi}` +
    `<div class="view-tags"><span class="vtag">${bi(cat.ja, cat.en)}</span>` +
    `<span class="vtag area">${bi(v.aj, v.ae)}</span></div></div></li>`;
}).join("\n");

/* ---------- 2. ItemList JSON-LD ---------- */
const itemList = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "100 Views of Takarazuka — 宝塚百景",
  "description": "One hundred curated views of Takarazuka, Hyogo, Japan: stage, story, temples, waters, paths, fields, taste, festivals and town life.",
  "numberOfItems": TKZ_VIEWS.length,
  "itemListElement": TKZ_VIEWS.map((v, i) => ({
    "@type": "ListItem",
    "position": i + 1,
    "item": {
      "@type": "TouristAttraction",
      "name": v.en,
      "alternateName": v.ja,
      "description": v.den + (v.een ? " " + v.een : ""),
      "url": BASE + "#view-" + (i + 1),
      "address": { "@type": "PostalAddress", "addressLocality": "Takarazuka", "addressRegion": "Hyogo", "addressCountry": "JP" }
    }
  }))
};
const ldBlock = `<script type="application/ld+json">\n${JSON.stringify(itemList)}\n</script>`;

const idxPath = path.join(ROOT, "index.html");
let html = fs.readFileSync(idxPath, "utf8");
html = html.replace(/<!--VIEWS:START-->[\s\S]*?<!--VIEWS:END-->/, `<!--VIEWS:START-->\n${cardsHtml}\n<!--VIEWS:END-->`);
html = html.replace(/<!--LD:START-->[\s\S]*?<!--LD:END-->/, `<!--LD:START-->\n${ldBlock}\n<!--LD:END-->`);
fs.writeFileSync(idxPath, html);

/* ---------- 3. llms-full.txt ---------- */
const catNames = Object.fromEntries(Object.entries(TKZ_CATS).map(([k, v]) => [k, `${v.en} / ${v.ja}`]));
let md = `# 100 Views of Takarazuka — 宝塚百景 (Full Content)

> A bilingual (Japanese/English) guide to Takarazuka, Hyogo, Japan — every corner of the city in 100 curated views.
> Site: ${BASE}
> Takarazuka is ~25 min from Osaka and ~35 min from Kobe by train. Home of the all-female Takarazuka Revue (since 1914), Osamu Tezuka's formative hometown (age 5–24), the Saigoku-pilgrimage temple Nakayama-dera, Kiyoshikōjin Seichō-ji, the abandoned-railway hiking trail along the Muko River gorge, the dahlia fields of the Nishitani highlands (two-thirds of the city's area), and the 1889 birthplace of "Wilkinson Tansan" sparkling water.
> Facts researched June 2026 with sources; hours/fees change — check official sites. Unofficial fan-made guide.

`;
for (const [cat] of Object.entries(TKZ_CATS)) {
  md += `\n## ${catNames[cat]}\n\n`;
  TKZ_VIEWS.forEach((v, i) => {
    if (v.cat !== cat) return;
    md += `### ${i + 1}. ${v.en}（${v.ja}）\n`;
    md += `- Area: ${v.ae} / ${v.aj}\n`;
    md += `- ${v.den}\n- ${v.dja}\n`;
    if (v.een) md += `- Story: ${v.een}\n- こぼれ話: ${v.eja}\n`;
    md += `\n`;
  });
}
fs.writeFileSync(path.join(ROOT, "llms-full.txt"), md);

/* ---------- 4. sitemap.xml ---------- */
const today = new Date().toISOString().slice(0, 10);
/* guide/（宝塚さんぽ・おでかけガイド）のURLもsitemapに含める。tools/build-guide.mjs と対応。 */
const guideSitemap = ["", "nakayamadera-anzan", "kiyoshikojin-guide", "takarazuka-revue-first", "half-day-course", "jisha-goshuin", "takarazuka-history", "haisenshiki-hiking", "tezuka-museum"]
  .map((s) => `  <url>\n    <loc>${BASE}guide/${s}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${s ? "0.7" : "0.9"}</priority>\n  </url>`).join("\n");
fs.writeFileSync(path.join(ROOT, "sitemap.xml"),
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE}about</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${BASE}monthly/2026-07</loc>
    <lastmod>${today}</lastmod>
    <changefreq>never</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${BASE}observations/2026-07-nakayamadera</loc>
    <lastmod>${today}</lastmod>
    <changefreq>never</changefreq>
    <priority>0.5</priority>
  </url>
${guideSitemap}
</urlset>
`);
/* 注: /life/ 系のURLは tools/prerender-life.mjs が後段で追記する（deploy順: prerender → prerender-life）。 */

console.log(`prerendered: ${TKZ_VIEWS.length} cards (${(cardsHtml.length / 1024).toFixed(1)} KB), ` +
  `JSON-LD ${(ldBlock.length / 1024).toFixed(1)} KB, llms-full.txt ${(md.length / 1024).toFixed(1)} KB, sitemap lastmod ${today}`);
