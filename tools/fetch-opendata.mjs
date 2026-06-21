/* 宝塚市オープンデータ取得 → life/data/opendata/*.json
   出典: 宝塚市オープンデータ（CC BY 4.0） https://www.city.takarazuka.hyogo.jp/1060687/1060729/1014984/index.html
   Run: node tools/fetch-opendata.mjs
   方針: 取得・変換に失敗したデータセットは既存JSONを残して警告のみ（CIで古いデータが消えない）。 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "life", "data", "opendata");
fs.mkdirSync(OUT, { recursive: true });

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) takarazuka-life-guide/1.0 (+https://takarazuka.jun-nakatani.com/life/)";
const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); // JST
const CITY = "https://www.city.takarazuka.hyogo.jp";

async function get(url, tries = 3) {
  let err;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA } });
      if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
      return Buffer.from(await r.arrayBuffer());
    } catch (e) { err = e; await new Promise((res) => setTimeout(res, 1500 * (i + 1))); }
  }
  throw err;
}

/* 先頭シートを行配列に（2枚目以降の「作成例」シートは使わない） */
async function sheetRows(url) {
  const wb = XLSX.read(await get(url));
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
}

/* NFKC: 互換漢字（U+FA10「塚」等）・全角英数を正規化してから整形 */
const norm = (s) => String(s ?? "").normalize("NFKC").replace(/\s+/g, " ").trim();
const stripCity = (s) => norm(s).replace(/^兵庫県/, "").replace(/^宝塚市/, "");
/* Excelの時刻シリアル(0..1) or "HH:MM" → "H:MM" */
function excelTime(v) {
  if (v === "" || v == null) return "";
  if (typeof v === "string") return norm(v);
  const mins = Math.round(Number(v) * 24 * 60);
  return `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, "0")}`;
}
function hoursOf(days, start, end, note) {
  const s = excelTime(start), e = excelTime(end);
  let range = "";
  if (Number(start) === 0 && Number(end) > 0.999) range = "24時間";
  else if (s && e) range = `${s}〜${e}`;
  return norm([norm(days), range, norm(note)].filter(Boolean).join(" "));
}
/* ヘッダー行から列名→index のマップ */
function headerMap(rows) {
  const h = rows[0].map(norm);
  return { idx: (name) => h.findIndex((c) => c.includes(name)), header: h };
}

function write(block) {
  if (!block.items.length) throw new Error("0 items");
  fs.writeFileSync(path.join(OUT, `${block.id}.json`), JSON.stringify(block, null, 1));
  console.log(`✓ ${block.id}: ${block.items.length} items`);
}

const ATTRIB = "出典: 宝塚市オープンデータ（CC BY 4.0）を加工して作成";
const tasks = {

  /* ---------- 指定緊急避難場所・避難所 ---------- */
  async shelters() {
    const url = `${CITY}/_res/projects/default_project/_page_/001/021/476/r5_siteikinkyuuhinanbasyo0123.xlsx`;
    const rows = await sheetRows(url);
    const { idx } = headerMap(rows);
    const [iName, iAddr, iTel, iKind] = ["名称", "住所", "電話番号", "施設種別"].map(idx);
    const hazardCols = ["洪水", "崖崩れ", "地震", "内水"].map((k) => [k === "崖崩れ" ? "土砂" : k, idx(k)]);
    const items = rows.slice(1).filter((r) => norm(r[iName])).map((r) => ({
      name: norm(r[iName]),
      address: stripCity(r[iAddr]),
      kind: norm(r[iKind]),
      hazards: hazardCols.filter(([, i]) => i >= 0 && Number(r[i]) === 1).map(([k]) => k).join("・"),
      phone: norm(r[iTel]),
    }));
    write({
      id: "shelters",
      title: "指定緊急避難場所・指定避難所",
      note: `${ATTRIB}。「対応災害」はその災害のときに避難できることを示します。開設状況は災害時の市の発表で確認してください`,
      fetched: today, sourcePage: `${CITY}/1013056/1001456/1002647/1021476.html`,
      type: "table", map: true,
      columns: [
        { key: "name", label: "名称", name: true },
        { key: "address", label: "所在地" },
        { key: "kind", label: "種別" },
        { key: "hazards", label: "対応災害" },
      ],
      items,
    });
  },

  /* ---------- AED設置場所（24h + 公共施設） ---------- */
  async aed() {
    const srcs = [
      { url: `${CITY}/_res/projects/default_project/_page_/001/029/611/24h.xlsx`, kind: "24時間ステーション" },
      { url: `${CITY}/_res/projects/default_project/_page_/001/029/611/20260210.xlsx`, kind: "公共施設等" },
    ];
    const items = [];
    for (const s of srcs) {
      const rows = await sheetRows(s.url);
      const { idx } = headerMap(rows);
      const [iName, iAddr, iPos, iDays, iS, iE, iNote] =
        ["名称", "住所", "設置位置", "利用可能曜日", "開始時間", "終了時間", "特記事項"].map(idx);
      for (const r of rows.slice(1)) {
        if (!norm(r[iName])) continue;
        items.push({
          name: norm(r[iName]),
          address: stripCity(r[iAddr]) + (norm(r[iPos]) ? `（${norm(r[iPos])}）` : ""),
          kind: s.kind,
          hours: hoursOf(r[iDays], r[iS], r[iE], r[iNote]),
        });
      }
    }
    write({
      id: "aed",
      title: "AED設置場所（まちかど救急ステーション）",
      note: `${ATTRIB}。「24時間ステーション」はコンビニ等で24時間利用できる設置場所です`,
      fetched: today, sourcePage: `${CITY}/1060686/1060716/1008153/1011278/1057271/1029611.html`,
      type: "table", map: true,
      columns: [
        { key: "name", label: "設置場所", name: true },
        { key: "address", label: "所在地" },
        { key: "kind", label: "区分" },
        { key: "hours", label: "利用できる時間" },
      ],
      items,
    });
  },

  /* ---------- 公衆トイレ（公衆便所 + 公園内） ---------- */
  async toilets() {
    const srcs = [
      { url: `${CITY}/_res/projects/default_project/_page_/001/026/522/kousyubenjo_takarazuka.xlsx`, kind: "公衆便所" },
      { url: `${CITY}/_res/projects/default_project/_page_/001/026/521/toire-kouen_2.xlsx`, kind: "公園内" },
    ];
    const items = [];
    for (const s of srcs) {
      const rows = await sheetRows(s.url);
      const { idx } = headerMap(rows);
      const [iName, iAddr, iPos, iMulti, iWheel] =
        ["名称", "住所", "設置位置", "多機能トイレ数", "車椅子"].map(idx);
      for (const r of rows.slice(1)) {
        if (!norm(r[iName])) continue;
        const barrier = norm(r[iWheel]) === "有" || Number(r[iMulti]) > 0 ? "多機能/車いす対応" : "—";
        items.push({
          name: norm(r[iName]),
          address: stripCity(r[iAddr]) + (norm(r[iPos]) ? `（${norm(r[iPos])}）` : ""),
          kind: s.kind,
          barrier,
        });
      }
    }
    write({
      id: "toilets",
      title: "公衆トイレ一覧",
      note: `${ATTRIB}`,
      fetched: today, sourcePage: `${CITY}/1060687/1060729/1014984/1026522.html`,
      type: "table", map: true,
      columns: [
        { key: "name", label: "名称", name: true },
        { key: "address", label: "場所" },
        { key: "kind", label: "区分" },
        { key: "barrier", label: "バリアフリー" },
      ],
      items,
    });
  },

  /* ---------- 赤ちゃんの駅 ---------- */
  async babystations() {
    const url = `${CITY}/_res/projects/default_project/_page_/001/000/562/emotosika.xlsx`;
    const rows = await sheetRows(url);
    const { idx } = headerMap(rows);
    const [iName, iAddr, iDays, iHours, iNyu, iOmu] =
      ["名称", "住所", "利用可能日", "利用可能時間", "授乳スペース", "おむつ交換台"].map(idx);
    const items = rows.slice(1).filter((r) => norm(r[iName])).map((r) => ({
      name: norm(r[iName]),
      address: stripCity(r[iAddr]),
      hours: norm([r[iDays], r[iHours]].map(norm).filter(Boolean).join(" ")),
      equip: [norm(r[iNyu]) === "有" ? "授乳" : "", norm(r[iOmu]) === "有" ? "おむつ交換" : ""].filter(Boolean).join("・") || "—",
    }));
    write({
      id: "babystations",
      title: "赤ちゃんの駅（授乳・おむつ交換スポット）",
      note: `${ATTRIB}。外出中に授乳やおむつ交換ができる施設です`,
      fetched: today, sourcePage: `${CITY}/1060680/1060698/1061552/1009331/1000562.html`,
      type: "table", map: true,
      columns: [
        { key: "name", label: "施設名", name: true },
        { key: "address", label: "所在地" },
        { key: "hours", label: "利用できる日時" },
        { key: "equip", label: "設備" },
      ],
      items,
    });
  },

  /* ---------- 市立幼稚園・認定こども園 ---------- */
  async kindergartens() {
    const url = `${CITY}/_res/projects/default_project/_page_/001/054/503/2024opendeta.xlsx`;
    const rows = await sheetRows(url);
    const { idx } = headerMap(rows);
    const [iName, iKind, iAddr, iTel, iAge] = ["名称", "種別", "住所", "電話番号", "受入年齢"].map(idx);
    const items = rows.slice(1).filter((r) => norm(r[iName])).map((r) => ({
      name: norm(r[iName]),
      kind: norm(r[iKind]),
      address: stripCity(r[iAddr]),
      phone: norm(r[iTel]),
      age: norm(r[iAge]),
    }));
    write({
      id: "kindergartens",
      title: "市立幼稚園・認定こども園",
      note: `${ATTRIB}。申込は学事課（0797-77-2366）で受付`,
      fetched: today, sourcePage: `${CITY}/1060687/1060729/1014984/1054503.html`,
      type: "table", map: true,
      columns: [
        { key: "name", label: "園名", name: true },
        { key: "kind", label: "種別" },
        { key: "address", label: "所在地" },
        { key: "phone", label: "電話" },
        { key: "age", label: "受入年齢" },
      ],
      items,
    });
  },

  /* ---------- 図書館（G空間情報センター・CSV/Shift_JIS） ---------- */
  async libraries() {
    const url = "https://www.geospatial.jp/ckan/dataset/84b72c94-e474-401d-ad9c-7897dd064c08/resource/62efb1a3-47e1-4de7-8aff-6750cc7bfd85/download/takarazuka-library.csv";
    const buf = await get(url);
    const text = new TextDecoder("shift_jis").decode(buf);
    const rows = parseCsv(text);
    const { idx } = headerMap(rows);
    const [iName, iAddr, iTel, iDays, iS, iE, iNoteT] =
      ["名称", "住所", "電話番号", "利用可能曜日", "開始時間", "終了時間", "利用可能時間特記事項"].map(idx);
    const items = rows.slice(1).filter((r) => norm(r[iName])).map((r) => ({
      name: norm(r[iName]),
      address: stripCity(r[iAddr]),
      phone: norm(r[iTel]),
      hours: norm([norm(r[iDays]), [norm(r[iS]), norm(r[iE])].filter(Boolean).join("〜"), norm(r[iNoteT])].filter(Boolean).join(" ")),
    }));
    write({
      id: "libraries",
      title: "市内の図書館",
      note: `${ATTRIB}（G空間情報センター掲載データ）。休館日等の詳細は各館ページで確認を`,
      fetched: today, sourcePage: "https://www.geospatial.jp/ckan/dataset/takarazuka-library",
      type: "table", map: true,
      columns: [
        { key: "name", label: "名称", name: true },
        { key: "address", label: "所在地" },
        { key: "phone", label: "電話" },
        { key: "hours", label: "開館" },
      ],
      items,
    });
  },

  /* ---------- 公衆無線LAN ---------- */
  async wifi() {
    const url = "https://www.geospatial.jp/ckan/dataset/27411118-15a1-42de-93cc-e6bbbbb6e35d/resource/27c2ecf3-4bca-4057-9bba-893ecb7ab982/download/282146_public_wireless_lan-.xlsx";
    const rows = await sheetRows(url);
    const { idx } = headerMap(rows);
    const [iName, iAddr, iSsid, iArea, iNote] = ["名称", "所在地_連結表記", "SSID", "提供エリア", "備考"].map(idx);
    const items = rows.slice(1).filter((r) => norm(r[iName])).map((r) => ({
      name: norm(r[iName]),
      address: stripCity(r[iAddr]),
      ssid: norm(r[iSsid]),
      note: norm([norm(r[iArea]), norm(r[iNote])].filter(Boolean).join("・")),
    }));
    write({
      id: "wifi",
      title: "公衆無線LAN（フリーWi-Fi）スポット",
      note: `${ATTRIB}`,
      fetched: today, sourcePage: "https://www.geospatial.jp/ckan/dataset/takarazuka-wifi",
      type: "table", map: true,
      columns: [
        { key: "name", label: "施設名", name: true },
        { key: "address", label: "所在地" },
        { key: "ssid", label: "SSID" },
        { key: "note", label: "備考" },
      ],
      items,
    });
  },

  /* ---------- イベント情報（city_event.js / JSON） ---------- */
  async events() {
    const url = `${CITY}/city_event.js`;
    const text = new TextDecoder("utf-8").decode(await get(url));
    /* 形式: `var event_data = {\nevents: [...]...};` — トップレベルキーのみ非クォートのJS。
       プレフィックス/末尾の `;` を除去し、行頭の裸キーをクォートしてJSONとして読む。 */
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("event JSON not found");
    const jsonish = m[0].replace(/^([A-Za-z_$][\w$]*)\s*:/gm, '"$1":');
    const data = JSON.parse(jsonish);
    const events = data.events || [];
    const toIso = (d) => {
      const mm = String(d).match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
      return mm ? `${mm[1]}-${mm[2].padStart(2, "0")}-${mm[3].padStart(2, "0")}` : "";
    };
    const stripTags = (s) => norm(String(s ?? "").replace(/<[^>]*>/g, ""));
    const items = [];
    for (const e of events) {
      const title = stripTags(e.eventtitle);
      if (!title) continue;
      const opendays = (e.opendays || []).map(toIso).filter(Boolean).sort();
      const kikan = (e.kikandays || [])[0] || {};
      const from = toIso(kikan.from) || opendays[0] || "";
      const to = toIso(kikan.to) || opendays[opendays.length - 1] || "";
      if (!from) continue;
      const href = e.url ? (String(e.url).startsWith("http") ? e.url : CITY + e.url) : "";
      items.push({
        date: from,
        dateEnd: to && to !== from ? to : "",
        title,
        place: stripTags(e.place2),
        desc: stripTags(e.description).slice(0, 90),
        url: href,
        target: (e.target || []).map(String),
        category: (e.category || []).map(String),
        application: String(e.application || "") === "1",
        deadline: toIso(e.offer_endday),
      });
    }
    items.sort((a, b) => a.date.localeCompare(b.date));
    write({
      id: "events",
      title: "宝塚市のイベント情報",
      note: `${ATTRIB}。今後開催されるものを開催日順に表示しています。申込方法・詳細は各リンク先で確認を`,
      fetched: today, sourcePage: `${CITY}/1060687/1060729/1014984/index.html`,
      type: "events",
      items,
    });
  },
};

/* 最小CSVパーサ（ダブルクォート対応） */
function parseCsv(text) {
  const rows = []; let row = []; let cur = ""; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cur); cur = "";
      if (row.some((v) => v !== "")) rows.push(row);
      row = [];
    } else cur += c;
  }
  if (cur !== "" || row.length) { row.push(cur); if (row.some((v) => v !== "")) rows.push(row); }
  return rows;
}

/* ---------- run all ---------- */
let failed = 0;
for (const [name, fn] of Object.entries(tasks)) {
  try { await fn(); }
  catch (e) { failed++; console.error(`✗ ${name}: ${e.message}（既存データを維持します）`); }
}
console.log(failed ? `done with ${failed} failure(s)` : "all datasets updated");
if (failed === Object.keys(tasks).length) process.exit(1); // 全滅時のみ失敗扱い
