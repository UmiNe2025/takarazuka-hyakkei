/* 宝塚くらしの便利帳 — 静的プリレンダ（マルチページ）
   life/data/guide.json + life/data/opendata/*.json から
     - life/index.html              … ハブ（トップ）
     - life/<id>/index.html          … カテゴリ別ページ（12ページ）
     - life/search-index.json        … 全ページ横断検索インデックス
     - llms-life.txt（ROOT）          … LLM向け全文
     - sitemap.xml へ /life/ 系URLを反映
   を生成する。tools/prerender.mjs（宝塚百景）とは独立。
   Run: node tools/prerender-life.mjs */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LIFE = path.join(ROOT, "life");
const SITE = "https://takarazuka.jun-nakatani.com";
const LIFEBASE = SITE + "/life/";

const guide = JSON.parse(fs.readFileSync(path.join(LIFE, "data", "guide.json"), "utf8"));
const odDir = path.join(LIFE, "data", "opendata");
const od = {};
if (fs.existsSync(odDir)) {
  for (const f of fs.readdirSync(odDir).filter((f) => f.endsWith(".json"))) {
    const b = JSON.parse(fs.readFileSync(path.join(odDir, f), "utf8"));
    od[b.id] = b;
  }
}

/* ---------- helpers ---------- */
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const safeUrl = (u) => (/^https?:\/\//i.test(String(u ?? "")) ? String(u) : "");
const telHref = (p) => "tel:" + String(p).normalize("NFKC").replace(/[^\d#+*]/g, "");
const safeJson = (obj) => JSON.stringify(obj).replace(/</g, "\\u003C").replace(/>/g, "\\u003E");
const catUrl = (id) => `/life/${id}/`;

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
  home: '<path d="M4 11 12 4l8 7"/><path d="M6 10v10h12V10"/><path d="M10 20v-6h4v6"/>',
  bookmark: '<path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-3.8L6 21Z"/>',
  arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.8-3.8"/>',
};
const icon = (name, cls) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${cls ? ` class="${cls}"` : ""}>${I[name] || I.list}</svg>`;

/* ---------- updated date ---------- */
const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); // JST
const updatedDates = [guide.updated, ...Object.values(od).map((b) => b.fetched)].filter(Boolean).sort();
const newest = updatedDates[updatedDates.length - 1] || today;

/* ==========================================================================
   shared layout
   ========================================================================== */
function docStart(o) {
  const ogTitle = o.ogTitle || o.title;
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.desc)}">
<link rel="canonical" href="${esc(o.canonical)}">
<meta name="theme-color" content="#241d3f">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">

<meta property="og:type" content="website">
<meta property="og:site_name" content="宝塚くらしの便利帳">
<meta property="og:title" content="${esc(ogTitle)}">
<meta property="og:description" content="${esc(o.desc)}">
<meta property="og:url" content="${esc(o.canonical)}">
<meta property="og:image" content="${SITE}/life/assets/ogp.png">
<meta property="og:locale" content="ja_JP">
<meta name="twitter:card" content="summary_large_image">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Zen+Old+Mincho:wght@400;700;900&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/life/life.css">
${o.ld || ""}
</head>
<body${o.bodyClass ? ` class="${o.bodyClass}"` : ""}>
<a class="skip-link" href="#main">本文へスキップ</a>

<header class="site-head">
  <div class="wrap">
    <a class="brand" href="/life/">
      <span class="b-main">宝塚くらしの便利帳</span>
      <span class="b-sub">TAKARAZUKA LIVING GUIDE</span>
    </a>
    <nav class="head-links" aria-label="関連サイト">
      <a href="/">宝塚百景（観光・魅力）</a>
      <a href="https://www.city.takarazuka.hyogo.jp/" rel="noopener">宝塚市公式サイト</a>
    </nav>
  </div>
</header>

<div class="topbar">
  <div class="wrap">
    <a class="tb-home" href="/life/">${icon("home")}<span>便利帳トップ</span></a>
    <div class="tb-search" role="search">
      <label class="sr-only" for="q">生活情報を検索</label>
      ${icon("search")}
      <input id="q" type="search" placeholder="例: ごみ / 引越し / 休日診療 / 児童手当" autocomplete="off" aria-controls="q-results">
      <button id="q-clear" class="tb-clear" type="button" aria-label="検索をクリア" hidden>✕</button>
    </div>
  </div>
  <div class="search-results" id="q-results" role="listbox" aria-label="検索結果" hidden></div>
</div>`;
}

function breadcrumb(trail) {
  const lis = trail.map((t, i) =>
    i === trail.length - 1
      ? `<li aria-current="page">${esc(t.name)}</li>`
      : `<li><a href="${esc(t.url)}">${esc(t.name)}</a></li>`
  ).join("");
  return `<nav class="breadcrumb" aria-label="パンくずリスト"><div class="wrap"><ol>${lis}</ol></div></nav>`;
}

/* full SOS card (hub + emergency page) */
function sosFull() {
  return `
<section class="sos" aria-labelledby="sos-title">
  <div class="sos-card">
    <h2 class="sos-title" id="sos-title">${icon("siren")} ${esc(guide.sos.title)}</h2>
    <div class="sos-grid">
${guide.sos.buttons.map((b) => `      <a class="sos-btn" href="${telHref(b.tel)}"><span class="n">${esc(b.num)}</span><span class="t">${esc(b.label)}</span></a>`).join("\n")}
    </div>
    <p class="sos-note">${esc(guide.sos.note)}</p>
  </div>
</section>`;
}

/* slim emergency strip (category pages other than emergency) */
function sosStrip() {
  return `<div class="sos-strip"><div class="wrap">
  <span class="ss-label">${icon("siren")} 緊急</span>
  <a href="tel:119"><b>119</b> 火事・救急</a>
  <a href="tel:110"><b>110</b> 事件・事故</a>
  <a href="tel:#7119"><b>#7119</b> 救急相談</a>
  <a class="ss-more" href="/life/emergency/">緊急の連絡先一覧 ${icon("arrowR")}</a>
</div></div>`;
}

function footer() {
  return `
<div class="page-notice">
  <div class="page-notice-box">
    <b>ご利用にあたって:</b> 本サイトは宝塚市在住の個人が制作した<b>非公式</b>の案内ページです。掲載内容は出典ページをもとに確認していますが、制度・時間・連絡先は変更されることがあります。<b>最新・正確な情報は必ず各項目のリンク先（宝塚市公式サイト等）でご確認ください。</b>緊急時は迷わず 119（火事・救急）・110（事件・事故）へ。
  </div>
</div>

<footer class="site-foot">
  <div class="wrap">
    <div class="foot-grid">
      <div>
        <h2>宝塚くらしの便利帳</h2>
        <p>宝塚市で暮らす人のための生活情報ポータル。市公式情報への「入口の地図」として、要点と連絡先をテーマ別にまとめています。</p>
      </div>
      <div>
        <h2>データについて</h2>
        <p>施設・避難所・イベント等の一覧は<a href="https://www.city.takarazuka.hyogo.jp/1060687/1060729/1014984/index.html" rel="noopener">宝塚市オープンデータ</a>（<a href="https://creativecommons.org/licenses/by/4.0/deed.ja" rel="noopener">CC BY 4.0</a>）を加工して作成し、定期的に自動更新しています。最終データ取得日: ${newest}。</p>
      </div>
      <div>
        <h2>関連リンク</h2>
        <p>
          <a href="/">宝塚百景 — 100 Views of Takarazuka</a><br>
          <a href="https://www.city.takarazuka.hyogo.jp/" rel="noopener">宝塚市公式サイト</a><br>
          <a href="/privacy.html">プライバシーポリシー</a>
        </p>
      </div>
    </div>
    <p class="foot-small">本サイトは非公式の個人制作サイトであり、宝塚市とは関係ありません。掲載情報の利用は自己責任でお願いします。出典: 宝塚市オープンデータ（CC BY 4.0）ほか、各項目に記載。</p>
  </div>
</footer>

<button id="to-top" class="to-top" type="button" aria-label="ページ上部へ戻る">
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="m5 14 7-7 7 7"/></svg>
</button>

<script src="/life/life.js" defer></script>
</body>
</html>`;
}

/* ==========================================================================
   content renderers
   ========================================================================== */
function factRow(ic, label, html) {
  return `<div class="i-fact">${icon(ic)}<span class="f-label">${label}</span><span>${html}</span></div>`;
}
function renderItem(it, cat, idx) {
  const itemId = `${cat.id}-${idx + 1}`;
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
  const save = `<button class="save-item" type="button" data-save-item hidden aria-pressed="false"
    data-save-id="${esc(itemId)}" data-save-title="${esc(it.title)}" data-save-url="${catUrl(cat.id)}#${itemId}"
    data-save-category="${esc(cat.title)}" data-save-color="${esc(cat.color)}">${icon("bookmark")}<span>あとで見る</span></button>`;
  return `<article class="item-card" id="${itemId}">
  <h3>${it.important ? '<span class="badge-imp">重要</span>' : ""}${esc(it.title)}</h3>
  <p class="i-sum">${esc(it.summary)}</p>
  ${facts.length ? `<div class="i-facts">${facts.join("")}</div>` : ""}${steps}
  <div class="i-foot">${link}${save}${tags}</div>
</article>`;
}

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
function upcomingEvents(b, limit) {
  const items = b.items
    .filter((e) => (e.dateEnd || e.date) >= today)
    .map((e) => ({ ...e, ongoing: e.date < today, sortKey: e.date < today ? `${e.dateEnd}~` : e.date }))
    .sort((a, z) => (a.ongoing - z.ongoing) || a.sortKey.localeCompare(z.sortKey));
  return limit ? items.slice(0, limit) : items;
}
const fmtMd = (d) => { const [, m, dd] = d.split("-"); return `${Number(m)}/${Number(dd)}`; };
function eventLi(e, hidden) {
  const dateTxt = e.ongoing
    ? `開催中<br>〜${fmtMd(e.dateEnd)}`
    : e.dateEnd && e.dateEnd !== e.date ? `${fmtMd(e.date)}<br>〜${fmtMd(e.dateEnd)}` : fmtMd(e.date);
  const body = `<p class="ev-t">${safeUrl(e.url) ? `<a href="${esc(safeUrl(e.url))}" rel="noopener">${esc(e.title)}</a>` : esc(e.title)}</p>` +
    (e.desc || e.place ? `<p class="ev-d">${esc([e.place, e.desc].filter(Boolean).join(" — "))}</p>` : "");
  return `<li class="ev-item"${hidden ? " hidden" : ""}><span class="ev-date">${dateTxt}</span><div class="ev-body">${body}</div></li>`;
}
function renderOdEvents(b) {
  const items = upcomingEvents(b, 60);
  const lis = items.map((e, i) => eventLi(e, i >= 12)).join("\n");
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

function faqBlock(faqs) {
  if (!faqs || !faqs.length) return "";
  return `<div class="faq-block"><h3>${icon("chat")} よくある質問</h3>${faqs.map((f) =>
    `<details class="faq-item"><summary>${esc(f.q)}</summary><div class="faq-a">${esc(f.a)}</div></details>`).join("\n")}</div>`;
}

/* category card (hub grid + other-categories nav) */
function categoryCard(c) {
  const n = c.items.length + (c.opendata || []).length;
  return `<a class="cat-card" href="${catUrl(c.id)}" style="--cat: var(--c-${c.color})">
  <span class="cc-icon">${icon(c.icon)}</span>
  <span class="cc-body">
    <span class="cc-en">${esc(c.en)}</span>
    <span class="cc-title">${esc(c.title)}</span>
    <span class="cc-desc">${esc(c.tagline)}</span>
    <span class="cc-meta">${n}件の案内</span>
  </span>
  <span class="cc-arrow">${icon("arrowR")}</span>
</a>`;
}

/* ---------- hub: routes for the situations residents actually arrive with ---------- */
function quickRoutes() {
  const routes = [
    {
      tone: "emergency", label: "いま困っている", title: "救急車を呼ぶか、受診するか迷う",
      lead: "命の危険を感じたら、迷わず119番へ。判断に迷うときは救急相談につながれます。",
      primary: { href: "tel:#7119", text: "#7119 に電話して相談する", note: "救急相談（24時間）" },
      links: [{ href: "/life/emergency/", text: "緊急の連絡先をすべて見る" }, { href: "/life/medical/", text: "休日・夜間の診療先を探す" }],
    },
    {
      tone: "procedure", label: "引越し", title: "転入・転出・転居をまとめて進める",
      lead: "役所の届出だけで終わりません。水道と、出し切れないごみも先に段取りしておくと安心です。",
      primary: { href: "/life/procedure/#procedure-1", text: "まず住民異動の手続きを確認", note: "転入・転出・転居" },
      links: [{ href: "/life/lifeline/#lifeline-1", text: "水道の開始・中止を申し込む" }, { href: "/life/garbage/", text: "粗大ごみ・持込みを調べる" }],
    },
    {
      tone: "garbage", label: "今日のごみ", title: "分け方・出し方や粗大ごみを知りたい",
      lead: "収集日・分別は地域ごとに違います。出す前に公式の分別検索と収集日を確認できます。",
      primary: { href: "/life/garbage/", text: "ごみ・リサイクルの案内へ", note: "分別・収集日・粗大ごみ" },
      links: [{ href: "/life/garbage/#garbage-3", text: "粗大ごみの出し方を確認" }],
    },
    {
      tone: "childcare", label: "子ども", title: "子どもの急な体調不良・子育ての相談",
      lead: "夜間・休日の急な症状は小児救急の電話相談へ。ふだんの支援や保育の情報もひとつにあります。",
      primary: { href: "tel:#8000", text: "#8000 に電話して相談する", note: "小児救急医療電話相談" },
      links: [{ href: "/life/childcare/", text: "子育て・教育の案内へ" }, { href: "/life/medical/", text: "休日・夜間の受診先を探す" }],
    },
    {
      tone: "disaster", label: "備える", title: "自宅周辺の災害リスクと避難先を確認",
      lead: "武庫川の水害、山際の土砂災害、地震。平時にハザードマップと避難所を見ておくと行動が早くなります。",
      primary: { href: "/life/disaster/", text: "ハザードマップ・避難所を確認", note: "防災情報と避難先" },
      links: [{ href: "/life/emergency/", text: "災害時の連絡先も確認する" }],
    },
    {
      tone: "welfare", label: "相談する", title: "暮らし・契約・法律の困りごとを相談",
      lead: "ひとりで抱え込まず、内容に合う相談先へ。消費者トラブル、生活の困りごと、福祉の案内をまとめています。",
      primary: { href: "/life/events/#events-1", text: "契約・悪質商法の相談先へ", note: "消費生活センター・188" },
      links: [{ href: "/life/welfare/", text: "生活・福祉の相談先を探す" }, { href: "/life/events/#events-2", text: "無料法律相談を確認する" }],
    },
  ];
  return `<section class="quick-routes" aria-labelledby="routes-h">
    <div class="route-heading">
      <div><p class="route-kicker">WHAT DO YOU NEED TODAY?</p><h2 id="routes-h">困りごとから、次にすることへ</h2></div>
      <p>複数の窓口が関わることほど、最初の一手をひとつに絞りました。</p>
    </div>
    <div class="route-grid">
${routes.map((r) => `      <article class="route-card" style="--route: var(--c-${r.tone})">
        <p class="route-label">${esc(r.label)}</p>
        <h3>${esc(r.title)}</h3>
        <p class="route-lead">${esc(r.lead)}</p>
        <a class="route-primary" href="${esc(r.primary.href)}"><span>${esc(r.primary.text)}</span><small>${esc(r.primary.note)}</small>${icon("arrowR")}</a>
        <div class="route-links">${r.links.map((l) => `<a href="${esc(l.href)}">${esc(l.text)}</a>`).join("")}</div>
      </article>`).join("\n")}
    </div>
  </section>`;
}

function savedGuides() {
  return `<section class="saved-guides" id="saved-guides" aria-labelledby="saved-guides-h" hidden>
    <div class="saved-head"><div><p class="route-kicker">ON THIS DEVICE</p><h2 id="saved-guides-h">あとで見る</h2></div><button class="saved-clear" id="saved-clear" type="button">すべて消す</button></div>
    <p class="saved-note">保存した案内は、この端末のブラウザにだけ保存されます。</p>
    <ul class="saved-list" id="saved-list" aria-live="polite"></ul>
  </section>`;
}

/* ---------- hub: a local-only desk for the recurring parts of life ---------- */
const livingAreas = [
  { id: "kobayashi", label: "小林・仁川・高司", care: "小林地域包括支援センター", phone: "0797-74-3863", keywords: ["小林", "仁川", "高司", "末成", "光明", "良元", "福井"] },
  { id: "sakasegawa", label: "逆瀬川・西山", care: "逆瀬川地域包括支援センター", phone: "0797-76-2830", keywords: ["逆瀬川", "中州", "末広", "伊孑志", "野上", "西山", "ゆずり葉", "社町"] },
  { id: "gotenyama", label: "宝塚・御殿山", care: "御殿山地域包括支援センター", phone: "0797-83-1336", keywords: ["御殿山", "すみれ", "清荒神", "売布", "美座", "川面"] },
  { id: "obama", label: "小浜・安倉", care: "小浜地域包括支援センター", phone: "0797-86-3707", keywords: ["小浜", "安倉", "美幸", "御所", "金井"] },
  { id: "nagao", label: "長尾・山本", care: "長尾地域包括支援センター", phone: "0797-80-2941", keywords: ["山本", "長尾", "丸橋", "口谷", "中筋", "中山寺", "泉町"] },
  { id: "hanayashiki", label: "花屋敷・山手台・中山台", care: "花屋敷地域包括支援センター", phone: "072-740-3555", keywords: ["花屋敷", "山手台", "中山台", "切畑", "長尾台", "桜台"] },
  { id: "nishitani", label: "西谷", care: "西谷地域包括支援センター", phone: "0797-83-5080", keywords: ["西谷", "大原野", "波豆", "佐曽利", "玉瀬", "香合", "境野", "長谷"] },
];
const childTerms = ["子ども", "親子", "乳幼児", "幼児", "児童", "赤ちゃん", "保護者", "ファミリー", "子育て", "小学生", "中学生", "高校生", "夏休み", "育児"];
const childLike = (e) => childTerms.some((term) => `${e.title} ${e.place || ""} ${e.desc || ""}`.includes(term));

function lifeTools() {
  const eventData = od.events ? upcomingEvents(od.events, 90).map((e) => ({
    date: e.date, dateEnd: e.dateEnd || "", title: e.title, place: e.place || "", desc: e.desc || "", url: e.url || "",
    target: e.target || [], application: Boolean(e.application), deadline: e.deadline || "",
  })) : [];
  const starterEvents = eventData.filter(childLike).slice(0, 3);
  const starterList = starterEvents.length ? starterEvents.map((e) => `<li><span>${esc(fmtMd(e.date))}</span>${safeUrl(e.url) ? `<a href="${esc(safeUrl(e.url))}" rel="noopener">${esc(e.title)}</a>` : esc(e.title)}</li>`).join("") :
    '<li>いま掲載できる子ども向けイベントはありません。子育て・教育の案内をご覧ください。</li>';
  const data = {
    updated: newest,
    areas: livingAreas,
    events: eventData,
    shelters: (od.shelters?.items || []).map((s) => ({ name: s.name, address: s.address, hazards: s.hazards || "" })),
    urls: {
      garbage: "https://www.city.takarazuka.hyogo.jp/cleancenter/household_garbage/1010940.html",
      care: "/life/welfare/",
      careApply: "/life/welfare/",
      childcare: "/life/childcare/",
      events: "/life/events/",
      hazard: "https://www.city.takarazuka.hyogo.jp/1013056/1001456/1009171/hazardmap.html",
      disaster: "/life/disaster/",
      safetyMail: "https://www.city.takarazuka.hyogo.jp/1013056/1013222/1025907/1025911/1000416.html",
    },
  };
  return `<section class="life-tools" id="life-tools" aria-labelledby="life-tools-h">
    <div class="tools-intro">
      <div><p class="tools-kicker">A DESK FOR ORDINARY DAYS</p><h2 id="life-tools-h">わたしの宝塚、今日の机</h2></div>
      <p>地域と家族の状況を選ぶと、今日見るべき入口を整えます。設定はこの端末にだけ保存され、住所や連絡先は保存しません。</p>
    </div>
    <form class="local-profile" id="local-profile" aria-describedby="local-profile-note">
      <div class="profile-fields">
        <label>お住まいに近い地域
          <select id="local-area" name="area"><option value="">選ばない</option>${livingAreas.map((a) => `<option value="${esc(a.id)}">${esc(a.label)}</option>`).join("")}</select>
        </label>
        <label>子どもの年齢・状況
          <select id="local-child-age" name="childAge"><option value="">選ばない</option><option value="pregnancy">妊娠中・これから</option><option value="baby">0〜2歳</option><option value="preschool">3〜5歳</option><option value="school">小学生</option><option value="teen">中高生</option></select>
        </label>
        <button id="local-profile-save" type="button">この端末に設定</button>
        <button id="local-profile-reset" class="profile-reset" type="button" hidden>設定を消す</button>
      </div>
      <p id="local-profile-note">地域包括支援センターの担当は町名によって分かれる場合があります。表示内容は目安として、必ず公式一覧で確認してください。</p>
      <p id="local-profile-status" class="profile-status" aria-live="polite"></p>
    </form>

    <div class="tool-grid">
      <section class="tool-card tool-district" aria-labelledby="district-h">
        <p class="tool-overline">MY AREA</p><h3 id="district-h">マイ地区・今日の宝塚</h3>
        <p id="district-lede">地域を選ぶと、介護の相談先と近隣候補の避難所をこの場に出します。</p>
        <div id="district-result" class="district-result" hidden></div>
        <div class="tool-actions"><a id="district-garbage" href="https://www.city.takarazuka.hyogo.jp/cleancenter/household_garbage/1010940.html" rel="noopener">町名からごみ収集日を確認</a><a href="/life/facility/">公共施設を探す</a></div>
      </section>

      <section class="tool-card tool-child" id="child-week" aria-labelledby="child-week-h">
        <p class="tool-overline">CHILDREN THIS WEEK</p><h3 id="child-week-h">子どもと今週</h3>
        <p id="child-week-lede">市の更新データから、親子・子ども向けの近い日程を抜き出します。</p>
        <ul id="child-week-list" class="mini-event-list">${starterList}</ul>
        <div class="tool-actions"><a href="/life/childcare/">子育て・教育の案内</a><a href="/life/events/">すべてのイベント</a></div>
      </section>

      <section class="tool-card tool-care" id="care-start" aria-labelledby="care-start-h">
        <p class="tool-overline">STARTING CARE</p><h3 id="care-start-h">親の介護をはじめる</h3>
        <ol class="care-steps"><li><b>まず相談</b><span>介護の必要性が決まっていなくても、地域包括支援センターへ。</span></li><li><b>認定を申請</b><span>必要になったら、要介護認定の申請へ進みます。</span></li><li><b>退院前に連携</b><span>病院の相談員と地域の相談先を早めにつなぎます。</span></li></ol>
        <div id="care-area-result" class="care-area-result">地域を設定すると、最初に相談する窓口を表示します。</div>
        <div class="tool-actions"><a href="/life/welfare/">高齢者・福祉の案内</a><a href="/life/welfare/">地域包括支援センターの案内</a></div>
      </section>

      <section class="tool-card tool-disaster family-card" id="family-disaster" aria-labelledby="family-disaster-h">
        <p class="tool-overline">FAMILY EMERGENCY CARD</p><h3 id="family-disaster-h">わが家の防災カード</h3>
        <p>平時に決めて、印刷しておくための一枚です。入力した集合場所・連絡方法は保存されません。</p>
        <div class="disaster-fields"><label>家族の集合場所<input id="family-meeting" type="text" autocomplete="off" placeholder="例: ○○公園の入口"></label><label>連絡方法・連絡先<input id="family-contact" type="text" autocomplete="off" placeholder="例: 災害用伝言ダイヤル 171"></label></div>
        <div id="disaster-area-result" class="disaster-area-result">地域を設定すると、近隣候補の避難所を最大3件表示します。</div>
        <div class="tool-actions"><a href="https://www.city.takarazuka.hyogo.jp/1013056/1001456/1009171/hazardmap.html" rel="noopener">自宅周辺のハザードを確認</a><button id="print-disaster-card" type="button">このカードを印刷</button></div>
      </section>
    </div>
    <script id="life-tools-data" type="application/json">${safeJson(data)}</script>
  </section>`;
}

/* ==========================================================================
   page: category
   ========================================================================== */
function categoryDescription(c) {
  const names = c.items.slice(0, 4).map((it) => it.title.split(/[ —（(]/)[0]).join("・");
  return `宝塚市の${c.title}に関する生活情報。${c.tagline} ${names} など、窓口・連絡先・手続きを出典付きでまとめています。`;
}
function categoryPage(c) {
  const canonical = LIFEBASE + c.id + "/";
  const title = `${c.title}｜宝塚くらしの便利帳（宝塚市の生活情報）`;
  const desc = categoryDescription(c);

  const ld = [
    { "@type": "WebPage", "@id": canonical, url: canonical, name: `${c.title}｜宝塚くらしの便利帳`, description: desc, inLanguage: "ja", dateModified: today, isPartOf: { "@type": "WebSite", name: "宝塚くらしの便利帳", url: LIFEBASE }, about: { "@type": "City", name: "宝塚市", sameAs: "https://www.city.takarazuka.hyogo.jp/" } },
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "宝塚百景", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: "宝塚くらしの便利帳", item: LIFEBASE },
      { "@type": "ListItem", position: 3, name: c.title, item: canonical },
    ] },
    ...(c.faq && c.faq.length ? [{ "@type": "FAQPage", mainEntity: c.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }] : []),
    ...(c.opendata || []).filter((id) => od[id]).map((id) => {
      const b = od[id];
      return { "@type": "Dataset", name: `宝塚市オープンデータ: ${b.title}`, description: b.note, url: b.sourcePage, license: "https://creativecommons.org/licenses/by/4.0/deed.ja", creator: { "@type": "GovernmentOrganization", name: "宝塚市" }, dateModified: b.fetched };
    }),
  ];
  const ldTag = `<script type="application/ld+json">${safeJson({ "@context": "https://schema.org", "@graph": ld })}</script>`;

  const isEmergency = c.id === "emergency";
  const others = guide.categories.filter((x) => x.id !== c.id);

  const items = `<div class="item-grid">\n${c.items.map((it, i) => renderItem(it, c, i)).join("\n")}\n</div>`;
  const odBlocks = (c.opendata || []).map(renderOd).join("\n");

  const body = `${isEmergency ? "" : sosStrip()}
${breadcrumb([
    { name: "宝塚百景", url: "/" },
    { name: "くらしの便利帳", url: "/life/" },
    { name: c.title },
  ])}

<div class="cat-hero" style="--cat: var(--c-${c.color})">
  <div class="wrap">
    <span class="cat-icon">${icon(c.icon)}</span>
    <div class="cat-hd-text">
      <span class="cat-en">${esc(c.en)}</span>
      <h1>${esc(c.title)}</h1>
      <p class="cat-tagline">${esc(c.tagline)}</p>
    </div>
  </div>
</div>

<main id="main">
  <div class="wrap">
    <section class="cat-section" style="--cat: var(--c-${c.color})">
      ${items}
${odBlocks}
${faqBlock(c.faq)}
${isEmergency ? sosFull() : ""}
    </section>

    <nav class="othercat" aria-label="他のカテゴリ">
      <h2>ほかのテーマをみる</h2>
      <div class="cat-card-grid compact">
${others.map(categoryCard).join("\n")}
      </div>
    </nav>
  </div>
</main>`;

  return docStart({ title, desc, canonical, ld: ldTag, bodyClass: "page-cat" }) + body + footer();
}

/* ==========================================================================
   page: hub
   ========================================================================== */
function hubPage() {
  const canonical = LIFEBASE;
  const title = "宝塚くらしの便利帳 — 宝塚市の生活情報まとめ（ごみ・手続き・医療・子育て・防災）";
  const desc = "兵庫県宝塚市で暮らす人のための生活情報ポータル。ごみの分別・収集日、市役所の手続き、休日・夜間診療、子育て支援、避難所、税金、交通、公共施設まで——必要な窓口と連絡先をテーマ別に。宝塚市オープンデータで定期自動更新。";

  const ld = [
    { "@type": "WebSite", "@id": LIFEBASE + "#website", url: LIFEBASE, name: "宝塚くらしの便利帳", inLanguage: "ja", publisher: { "@type": "Person", name: "宝塚市在住の制作者" } },
    { "@type": "CollectionPage", "@id": canonical, url: canonical, name: title, description: desc, inLanguage: "ja", dateModified: newest, isPartOf: { "@id": LIFEBASE + "#website" }, about: { "@type": "City", name: "宝塚市", sameAs: "https://www.city.takarazuka.hyogo.jp/" } },
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "宝塚百景", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: "宝塚くらしの便利帳", item: LIFEBASE },
    ] },
    { "@type": "ItemList", name: "宝塚くらしの便利帳 カテゴリ一覧", itemListElement: guide.categories.map((c, i) => ({
      "@type": "ListItem", position: i + 1, name: c.title, url: LIFEBASE + c.id + "/",
    })) },
  ];
  const ldTag = `<script type="application/ld+json">${safeJson({ "@context": "https://schema.org", "@graph": ld })}</script>`;

  /* events teaser */
  const evb = od.events;
  const evTeaser = evb ? (() => {
    const items = upcomingEvents(evb, 6);
    if (!items.length) return "";
    const lis = items.map((e) => eventLi(e, false)).join("\n");
    return `<section class="hub-events">
      <div class="sec-head"><h2>${icon("calendar")} 直近のイベント</h2><a class="sec-more" href="/life/events/">すべて見る ${icon("arrowR")}</a></div>
      <ul class="ev-list">
${lis}
      </ul>
    </section>`;
  })() : "";

  const body = `
<div class="hero">
  <div class="hero-inner">
    <h1>
      <span class="hero-kicker">TAKARAZUKA LIVING GUIDE</span>
      宝塚くらしの便利帳
    </h1>
    <p class="hero-lede">ごみの出し方から夜間の救急まで。宝塚市で暮らすのに必要な情報の「入口」を、テーマ別にまとめました。上の検索か、下のカテゴリからお探しください。</p>
    <p class="hero-updated">データ更新日: <b>${newest}</b>（オープンデータは毎週自動更新）</p>
  </div>
  <div class="hero-art" aria-hidden="true">
    <img src="/life/assets/hero.png" alt="" width="1983" height="793" loading="eager">
  </div>
</div>

${sosFull()}

<main id="main">
  <div class="wrap">
    ${lifeTools()}
    ${savedGuides()}
    ${quickRoutes()}
    <section class="cat-cards" aria-labelledby="cats-h">
      <div class="sec-head"><h2 id="cats-h">${icon("list")} カテゴリから探す</h2></div>
      <div class="cat-card-grid">
${guide.categories.map(categoryCard).join("\n")}
      </div>
    </section>

    ${evTeaser}
  </div>
</main>`;

  return docStart({ title, desc, canonical, ld: ldTag, bodyClass: "page-hub" }) + body + footer();
}

/* ==========================================================================
   write pages
   ========================================================================== */
fs.writeFileSync(path.join(LIFE, "index.html"), hubPage());
for (const c of guide.categories) {
  const dir = path.join(LIFE, c.id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), categoryPage(c));
}

/* ---------- search index (cross-page) ---------- */
const searchIndex = [];
for (const c of guide.categories) {
  c.items.forEach((it, i) => {
    searchIndex.push({
      t: it.title,
      s: it.summary,
      g: [...(it.tags || []), it.phone || "", it.address || ""].join(" "),
      c: c.title,
      color: c.color,
      u: `${catUrl(c.id)}#${c.id}-${i + 1}`,
    });
  });
}
fs.writeFileSync(path.join(LIFE, "search-index.json"), JSON.stringify(searchIndex));

/* ---------- llms-life.txt（LLM向け全文） ---------- */
let mdtxt = `# 宝塚くらしの便利帳 — Takarazuka Living Guide (Residents' Practical Information)

> 兵庫県宝塚市で暮らす人のための生活情報まとめ（非公式・個人制作）。各項目は宝塚市公式サイト等の出典に基づく（${guide.updated} 確認）。最新情報は必ず各出典URLで確認のこと。施設一覧は宝塚市オープンデータ（CC BY 4.0）を加工、毎週自動更新。
> ハブ: ${LIFEBASE} ／ 各テーマは ${LIFEBASE}<id>/ に分割（id一覧: ${guide.categories.map((c) => c.id).join(", ")}）。

`;
for (const c of guide.categories) {
  mdtxt += `## ${c.title} (${c.en}) — ${LIFEBASE}${c.id}/\n\n`;
  for (const it of c.items) {
    mdtxt += `### ${it.title}\n${it.summary}\n`;
    if (it.phone) mdtxt += `- 電話: ${it.phone}${it.phoneNote ? `（${it.phoneNote}）` : ""}\n`;
    if (it.hours) mdtxt += `- 時間: ${it.hours}\n`;
    if (it.address) mdtxt += `- 場所: ${it.address}\n`;
    if (it.steps) it.steps.forEach((s, i) => { mdtxt += `- 手順${i + 1}: ${s}\n`; });
    if (it.url) mdtxt += `- 詳細: ${it.url}\n`;
    mdtxt += "\n";
  }
  for (const f of c.faq || []) mdtxt += `Q: ${f.q}\nA: ${f.a}\n\n`;
  for (const id of c.opendata || []) {
    const b = od[id];
    if (!b) continue;
    mdtxt += `### ${b.title}（オープンデータ・${b.fetched}時点・${b.items.length}件）\n`;
    if (b.type === "events") {
      for (const e of b.items.slice(0, 40)) mdtxt += `- ${e.date}${e.dateEnd && e.dateEnd !== e.date ? `〜${e.dateEnd}` : ""}: ${e.title}${e.place ? `（${e.place}）` : ""}\n`;
    } else {
      for (const itm of b.items) mdtxt += `- ${itm.name}${itm.address ? `（${itm.address}）` : ""}${itm.kind ? ` [${itm.kind}]` : ""}\n`;
    }
    mdtxt += `出典: 宝塚市オープンデータ ${b.sourcePage}（CC BY 4.0）\n\n`;
  }
}
mdtxt += `---\n出典・ライセンス: 宝塚市オープンデータ（CC BY 4.0、出典: 宝塚市）を加工。その他の記述は宝塚市公式サイト等を${guide.updated}に確認して作成。本ガイドは非公式であり、緊急時は 119 / 110 へ。\n`;
fs.writeFileSync(path.join(ROOT, "llms-life.txt"), mdtxt);

/* ---------- sitemap.xml に /life/ 系URLを反映 ---------- */
const sitemapPath = path.join(ROOT, "sitemap.xml");
if (fs.existsSync(sitemapPath)) {
  let sm = fs.readFileSync(sitemapPath, "utf8");
  /* 既存の life 系 <url> ブロックを除去（再生成のため・冪等化） */
  sm = sm.replace(/\s*<url>(?:(?!<\/url>)[\s\S])*?\/life\/[\s\S]*?<\/url>/g, "");
  const lifeUrls = [
    `  <url>\n    <loc>${LIFEBASE}</loc>\n    <lastmod>${newest}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>`,
    ...guide.categories.map((c) =>
      `  <url>\n    <loc>${LIFEBASE}${c.id}/</loc>\n    <lastmod>${newest}</lastmod>\n    <changefreq>${(c.opendata || []).length ? "weekly" : "monthly"}</changefreq>\n    <priority>0.8</priority>\n  </url>`),
  ].join("\n");
  sm = sm.replace(/\s*<\/urlset>\s*$/, "\n" + lifeUrls + "\n</urlset>\n");
  fs.writeFileSync(sitemapPath, sm);
}

console.log(`life prerendered: hub + ${guide.categories.length} category pages, ` +
  `${guide.categories.reduce((n, c) => n + c.items.length, 0)} items, ` +
  `${Object.keys(od).length} opendata blocks, search-index ${searchIndex.length} entries, ` +
  `llms-life.txt ${(mdtxt.length / 1024).toFixed(1)} KB, updated=${newest}`);
