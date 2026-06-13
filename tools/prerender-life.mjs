/* 宝塚くらしの便利帳 — 静的プリレンダ
   life/data/guide.json + life/data/opendata/*.json → life/index.html（マーカー間に挿入）
   さらに llms-life.txt（LLM向け全文）を生成する。
   Run: node tools/prerender-life.mjs   （tools/prerender.mjs とは独立） */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LIFE = path.join(ROOT, "life");
const BASE = "https://takarazuka.jun-nakatani.com/life/";

const guide = JSON.parse(fs.readFileSync(path.join(LIFE, "data", "guide.json"), "utf8"));
const odDir = path.join(LIFE, "data", "opendata");
const od = {};
if (fs.existsSync(odDir)) {
  for (const f of fs.readdirSync(odDir).filter((f) => f.endsWith(".json"))) {
    const b = JSON.parse(fs.readFileSync(path.join(odDir, f), "utf8"));
    od[b.id] = b;
  }
}

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
/* href に入れるURLは http(s) のみ許可（javascript: 等のスキーム混入を防ぐ防御層） */
const safeUrl = (u) => (/^https?:\/\//i.test(String(u ?? "")) ? String(u) : "");
/* tel: URI は RFC 3966 上 # * + が有効。encodeURIComponent で #7119→%237119 と化けるのを避け、
   ダイヤル可能文字だけを残す（救急ダイヤル #7119 / #8000 の正常発信のため）。 */
const telHref = (p) => "tel:" + String(p).normalize("NFKC").replace(/[^\d#+*]/g, "");

/* ---------- icons (24x24 stroke) ---------- */
const I = {
  siren: '<path d="M6 12a6 6 0 0 1 12 0v5H6Z"/><path d="M4 21h16M12 3v1M4.9 5.9l.8.8M19.1 5.9l-.8.8"/>',
  shield: '<path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6Z"/><path d="m9 12 2 2 4-4"/>',
  trash: '<path d="M4 7h16M10 4h4M6 7l1 13h10l1-13M10 11v5M14 11v5"/>',
  stamp: '<path d="M9 4h6v5a3 3 0 0 0 3 3h1v4H5v-4h1a3 3 0 0 0 3-3Z"/><path d="M5 20h14"/>',
  child: '<circle cx="12" cy="7" r="3.2"/><path d="M5.5 21c.6-4 3-6.5 6.5-6.5s5.9 2.5 6.5 6.5"/>',
  medcross: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  heart: '<path d="M12 20s-7-4.6-9-9c-1.2-2.7.5-6 3.7-6 2 0 3.5 1.2 4.3 2.6h2C13.8 6.2 15.3 5 17.3 5c3.2 0 4.9 3.3 3.7 6-2 4.4-9 9-9 9Z"/>',
  yen: '<path d="m7 4 5 7 5-7M12 11v9M8 13h8M8 16.5h8"/>',
  droplet: '<path d="M12 3s6 6.3 6 11a6 6 0 0 1-12 0c0-4.7 6-11 6-11Z"/>',
  train: '<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14M9 21l1.5-2.5M15 21l-1.5-2.5"/><circle cx="9" cy="14" r=".8"/><circle cx="15" cy="14" r=".8"/>',
  building: '<path d="M4 21V5l8-2 8 2v16"/><path d="M2 21h20M9 8h2M13 8h2M9 12h2M13 12h2M9 16h2M13 16h2"/>',
  calendar: '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/>',
  chat: '<path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5Z"/><path d="M9 11h.01M12.5 11h.01M16 11h.01"/>',
  phone: '<path d="M5 4h4l1.5 4.5L8 10a12 12 0 0 0 6 6l1.5-2.5L20 15v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2Z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  pin: '<path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11Z"/><circle cx="12" cy="10" r="2.6"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M19 13v6H5V5h6"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>',
};
const icon = (name, cls) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${cls ? ` class="${cls}"` : ""}>${I[name] || I.list}</svg>`;

/* ---------- SOS strip ---------- */
const sosHtml = `
<section class="sos" aria-labelledby="sos-title">
  <div class="sos-card">
    <h2 class="sos-title" id="sos-title">${icon("siren")} ${esc(guide.sos.title)}</h2>
    <div class="sos-grid">
${guide.sos.buttons.map((b) => `      <a class="sos-btn" href="${telHref(b.tel)}"><span class="n">${esc(b.num)}</span><span class="t">${esc(b.label)}</span></a>`).join("\n")}
    </div>
    <p class="sos-note">${esc(guide.sos.note)}</p>
  </div>
</section>`;

/* ---------- nav chips ---------- */
const navHtml = guide.categories.map((c) =>
  `    <a class="catchip" style="--chip: var(--c-${c.color})" href="#${c.id}" data-target="${c.id}">${icon(c.icon)} ${esc(c.title)}</a>`
).join("\n");

/* ---------- item card ---------- */
function factRow(ic, label, html) {
  return `<div class="i-fact">${icon(ic)}<span class="f-label">${label}</span><span>${html}</span></div>`;
}
function renderItem(it) {
  const facts = [];
  if (it.phone) facts.push(factRow("phone", "電話",
    `<a class="tel-link" href="${telHref(it.phone)}">${esc(it.phone)}</a>${it.phoneNote ? ` <small>（${esc(it.phoneNote)}）</small>` : ""}`));
  if (it.hours) facts.push(factRow("clock", "時間", esc(it.hours)));
  if (it.address) facts.push(factRow("pin", "場所", esc(it.address)));
  const steps = it.steps && it.steps.length
    ? `<ol class="i-steps">${it.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>` : "";
  const link = safeUrl(it.url)
    ? `<a class="i-link" href="${esc(safeUrl(it.url))}" rel="noopener">${esc(it.urlLabel || "市公式ページで詳しく")} ${icon("external")}</a>` : "";
  const tags = it.tags && it.tags.length
    ? `<span class="i-tags">${it.tags.map((t) => `<span class="i-tag">${esc(t)}</span>`).join("")}</span>` : "";
  return `<article class="item-card">
  <h3>${it.important ? '<span class="badge-imp">重要</span>' : ""}${esc(it.title)}</h3>
  <p class="i-sum">${esc(it.summary)}</p>
  ${facts.length ? `<div class="i-facts">${facts.join("")}</div>` : ""}${steps}
  <div class="i-foot">${link}${tags}</div>
</article>`;
}

/* ---------- open data blocks ---------- */
function mapLink(itm) {
  const q = encodeURIComponent(`${itm.name} ${itm.address || ""} 宝塚市`.trim());
  return `<a class="od-map-link" href="https://www.google.com/maps/search/?api=1&query=${q}" rel="noopener">地図</a>`;
}
function renderOdTable(b) {
  const areas = [...new Set(b.items.map((i) => i.area).filter(Boolean))];
  const areaSel = areas.length > 1
    ? `<select aria-label="地区で絞り込み"><option value="">すべての地区</option>${areas.map((a) => `<option>${esc(a)}</option>`).join("")}</select>` : "";
  const head = b.columns.map((c) => `<th scope="col">${esc(c.label)}</th>`).join("") + (b.map ? "<th></th>" : "");
  const rows = b.items.map((itm) => {
    const tds = b.columns.map((c) => `<td${c.name ? ' class="od-name"' : ""}>${esc(itm[c.key] ?? "")}</td>`).join("");
    return `<tr${itm.area ? ` data-area="${esc(itm.area)}"` : ""}>${tds}${b.map ? `<td>${mapLink(itm)}</td>` : ""}</tr>`;
  }).join("\n");
  return `<div class="od-block" data-odfilter id="od-${b.id}">
  <h3>${esc(b.title)} <span class="od-badge">自動更新</span></h3>
  <p class="od-note">${esc(b.note)}（${b.items.length}件 / データ取得日: ${esc(b.fetched || "—")}）</p>
  <div class="od-filter">
    <input type="search" placeholder="名称・住所で絞り込み" aria-label="${esc(b.title)}を絞り込み">${areaSel}
    <span class="od-count" aria-live="polite"></span>
  </div>
  <div class="od-table-wrap"><table class="od-table"><thead><tr>${head}</tr></thead><tbody>
${rows}
  </tbody></table></div>
</div>`;
}
function renderOdEvents(b) {
  const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); // JST
  /* 開催前→開催日順、開催中（長期）→後ろに回して「開催中」表示 */
  const items = b.items
    .filter((e) => (e.dateEnd || e.date) >= today)
    .map((e) => ({ ...e, ongoing: e.date < today, sortKey: e.date < today ? `${e.dateEnd}~` : e.date }))
    .sort((a, z) => (a.ongoing - z.ongoing) || a.sortKey.localeCompare(z.sortKey))
    .slice(0, 60);
  const fmt = (d) => { const [, m, dd] = d.split("-"); return `${Number(m)}/${Number(dd)}`; };
  const lis = items.map((e, i) => {
    const dateTxt = e.ongoing
      ? `開催中<br>〜${fmt(e.dateEnd)}`
      : e.dateEnd && e.dateEnd !== e.date ? `${fmt(e.date)}<br>〜${fmt(e.dateEnd)}` : fmt(e.date);
    const body = `<p class="ev-t">${safeUrl(e.url) ? `<a href="${esc(safeUrl(e.url))}" rel="noopener">${esc(e.title)}</a>` : esc(e.title)}</p>` +
      (e.desc || e.place ? `<p class="ev-d">${esc([e.place, e.desc].filter(Boolean).join(" — "))}</p>` : "");
    return `<li class="ev-item"${i >= 12 ? " hidden" : ""}><span class="ev-date">${dateTxt}</span><div class="ev-body">${body}</div></li>`;
  }).join("\n");
  const more = items.length > 12
    ? `<p class="ev-more"><button id="ev-more-btn" class="catchip" type="button">すべてのイベントを表示（あと${items.length - 12}件）</button></p>` : "";
  return `<div class="od-block" data-odfilter id="od-${b.id}">
  <h3>${esc(b.title)} <span class="od-badge">自動更新</span></h3>
  <p class="od-note">${esc(b.note)}（データ取得日: ${esc(b.fetched || "—")}）</p>
  <div class="od-filter"><input type="search" placeholder="イベント名で絞り込み" aria-label="イベントを絞り込み"><span class="od-count" aria-live="polite"></span></div>
  <ul class="ev-list">
${lis || '<li class="ev-item"><div class="ev-body"><p class="ev-d">現在掲載できる今後のイベント情報がありません。市公式サイトのイベントカレンダーをご覧ください。</p></div></li>'}
  </ul>${more}
</div>`;
}
const renderOd = (id) => {
  const b = od[id];
  if (!b) return `<!-- opendata ${id}: not fetched -->`;
  return b.type === "events" ? renderOdEvents(b) : renderOdTable(b);
};

/* ---------- sections ---------- */
const sectionsHtml = guide.categories.map((c) => {
  const items = `<div class="item-grid">\n${c.items.map(renderItem).join("\n")}\n</div>`;
  const odBlocks = (c.opendata || []).map(renderOd).join("\n");
  const faq = c.faq && c.faq.length
    ? `<div class="faq-block"><h3>${icon("chat")} よくある質問</h3>${c.faq.map((f) =>
        `<details class="faq-item"><summary>${esc(f.q)}</summary><div class="faq-a">${esc(f.a)}</div></details>`).join("\n")}</div>`
    : "";
  return `<section class="cat-section" id="${c.id}" style="--cat: var(--c-${c.color})" aria-labelledby="h-${c.id}">
  <div class="cat-head">
    <span class="cat-icon">${icon(c.icon)}</span>
    <h2 id="h-${c.id}"><span class="cat-en">${esc(c.en)}</span>${esc(c.title)}</h2>
  </div>
  <p class="cat-tagline">${esc(c.tagline)}</p>
  ${items}
${odBlocks}
${faq}
</section>`;
}).join("\n\n");

/* ---------- JSON-LD ---------- */
const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); // JST
const faqAll = guide.categories.flatMap((c) => c.faq || []);
const graph = [
  {
    "@type": "WebPage",
    "@id": BASE,
    url: BASE,
    name: "宝塚くらしの便利帳 — 宝塚市の生活情報まとめ",
    description: "兵庫県宝塚市で暮らす人のための生活情報ポータル。ごみ・手続き・医療・子育て・防災・交通の窓口と連絡先を一覧化。",
    inLanguage: "ja",
    dateModified: today,
    isPartOf: { "@type": "WebSite", name: "宝塚百景 / 宝塚くらしの便利帳", url: "https://takarazuka.jun-nakatani.com/" },
    about: { "@type": "City", name: "宝塚市", sameAs: "https://www.city.takarazuka.hyogo.jp/" },
  },
  {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "宝塚百景", item: "https://takarazuka.jun-nakatani.com/" },
      { "@type": "ListItem", position: 2, name: "宝塚くらしの便利帳", item: BASE },
    ],
  },
  ...(faqAll.length ? [{
    "@type": "FAQPage",
    mainEntity: faqAll.map((f) => ({
      "@type": "Question", name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  }] : []),
  ...Object.values(od).map((b) => ({
    "@type": "Dataset",
    name: `宝塚市オープンデータ: ${b.title}`,
    description: b.note,
    url: b.sourcePage,
    license: "https://creativecommons.org/licenses/by/4.0/deed.ja",
    creator: { "@type": "GovernmentOrganization", name: "宝塚市" },
    dateModified: b.fetched,
  })),
];
/* `</script>` によるタグ脱出を防ぐため `<` `>` をUnicodeエスケープ（JSONとしては同値） */
const safeJson = (obj) => JSON.stringify(obj).replace(/</g, "\\u003C").replace(/>/g, "\\u003E");
const ldBlock = `<script type="application/ld+json">${safeJson({ "@context": "https://schema.org", "@graph": graph })}</script>`;

/* ---------- inject into index.html ---------- */
const updatedDates = [guide.updated, ...Object.values(od).map((b) => b.fetched)].filter(Boolean).sort();
const newest = updatedDates[updatedDates.length - 1] || today;
const inject = (html, tag, content) =>
  html.replace(new RegExp(`(<!--${tag}:START-->)[\\s\\S]*?(<!--${tag}:END-->)`),
    (_, a, z) => `${a}\n${content}\n${z}`);

let html = fs.readFileSync(path.join(LIFE, "index.html"), "utf8");
html = inject(html, "SOS", sosHtml);
html = inject(html, "NAV", navHtml);
html = inject(html, "GUIDE", sectionsHtml);
html = inject(html, "LD", ldBlock);
html = inject(html, "UPDATED", `データ更新日: <b>${newest}</b>（オープンデータは毎週自動更新）`);
html = inject(html, "FOOT-META", `最終データ取得日: ${newest}。`);
fs.writeFileSync(path.join(LIFE, "index.html"), html);

/* ---------- llms-life.txt（LLM向け全文） ---------- */
let md = `# 宝塚くらしの便利帳 — Takarazuka Living Guide (Residents' Practical Information)

> 兵庫県宝塚市で暮らす人のための生活情報まとめ（非公式・個人制作）。各項目は宝塚市公式サイト等の出典に基づく（${guide.updated} 確認）。最新情報は必ず各出典URLで確認のこと。施設一覧は宝塚市オープンデータ（CC BY 4.0）を加工、毎週自動更新。
> URL: ${BASE}

`;
for (const c of guide.categories) {
  md += `## ${c.title} (${c.en})\n\n`;
  for (const it of c.items) {
    md += `### ${it.title}\n${it.summary}\n`;
    if (it.phone) md += `- 電話: ${it.phone}${it.phoneNote ? `（${it.phoneNote}）` : ""}\n`;
    if (it.hours) md += `- 時間: ${it.hours}\n`;
    if (it.address) md += `- 場所: ${it.address}\n`;
    if (it.steps) it.steps.forEach((s, i) => { md += `- 手順${i + 1}: ${s}\n`; });
    if (it.url) md += `- 詳細: ${it.url}\n`;
    md += "\n";
  }
  for (const f of c.faq || []) md += `Q: ${f.q}\nA: ${f.a}\n\n`;
  for (const id of c.opendata || []) {
    const b = od[id];
    if (!b) continue;
    md += `### ${b.title}（オープンデータ・${b.fetched}時点・${b.items.length}件）\n`;
    if (b.type === "events") {
      for (const e of b.items.slice(0, 40)) md += `- ${e.date}${e.dateEnd && e.dateEnd !== e.date ? `〜${e.dateEnd}` : ""}: ${e.title}${e.place ? `（${e.place}）` : ""}\n`;
    } else {
      for (const itm of b.items) md += `- ${itm.name}${itm.address ? `（${itm.address}）` : ""}${itm.kind ? ` [${itm.kind}]` : ""}\n`;
    }
    md += `出典: 宝塚市オープンデータ ${b.sourcePage}（CC BY 4.0）\n\n`;
  }
}
md += `---\n出典・ライセンス: 宝塚市オープンデータ（CC BY 4.0、出典: 宝塚市）を加工。その他の記述は宝塚市公式サイト等を${guide.updated}に確認して作成。本ガイドは非公式であり、緊急時は 119 / 110 へ。\n`;
fs.writeFileSync(path.join(ROOT, "llms-life.txt"), md);

console.log(`life prerendered: ${guide.categories.length} sections, ` +
  `${guide.categories.reduce((n, c) => n + c.items.length, 0)} items, ` +
  `${Object.keys(od).length} opendata blocks, llms-life.txt ${(md.length / 1024).toFixed(1)} KB, updated=${newest}`);
