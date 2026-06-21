/* 宝塚さんぽ（おでかけガイド）を guide/ に生成する。
   実行: node tools/build-guide.mjs  → guide/index.html ＋ guide/<slug>.html ＋ guide/guide.css
   ・広告は「読ませる独自ガイド」層にのみ掲載（/life くらしの便利帳は広告なしを維持）。
   ・事実は research/R1〜R4（公式・出典つきリサーチ）に基づき、自分の言葉で記述。
   ・料金・時間・運行など変動する情報は「2026年時点」と明記し、公式での確認を促す。 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "guide");
const BASE = "https://takarazuka.jun-nakatani.com";
const AD = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6214118528662072" crossorigin="anonymous"></script>';

const e = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const strip = (s) => String(s).replace(/<[^>]+>/g, "");

const CREST = '<svg class="crest" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="#38285c"/><circle cx="32" cy="32" r="30" fill="none" stroke="#c19a3f" stroke-width="2"/><circle cx="32" cy="32" r="25.5" fill="none" stroke="#c19a3f" stroke-width=".8" opacity=".7"/><g fill="#9b7fd4"><ellipse cx="32" cy="18.5" rx="6.2" ry="8.4"/><ellipse cx="44.4" cy="27.5" rx="6.2" ry="8.4" transform="rotate(72 44.4 27.5)"/><ellipse cx="39.6" cy="42.2" rx="6.2" ry="8.4" transform="rotate(144 39.6 42.2)"/><ellipse cx="24.4" cy="42.2" rx="6.2" ry="8.4" transform="rotate(216 24.4 42.2)"/><ellipse cx="19.6" cy="27.5" rx="6.2" ry="8.4" transform="rotate(288 19.6 27.5)"/></g><path d="M32 25.6l1.9 4.3 4.7.5-3.5 3.1 1 4.6-4.1-2.4-4.1 2.4 1-4.6-3.5-3.1 4.7-.5z" fill="#e7bd55"/></svg>';

const CSS = `:root{--ink:#241d3f;--ink-soft:#5a5170;--paper:#fffdf7;--cream:#f7f1e6;--line:#e6ddcb;--purple:#38285c;--violet:#7a5cb8;--gold:#c19a3f;--gold-d:#9a7826}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;color:var(--ink);background:var(--paper);font-family:"Zen Kaku Gothic New","Hiragino Kaku Gothic ProN",sans-serif;line-height:1.9;font-size:16px}
a{color:var(--purple)}
.skip-link{position:fixed;left:12px;top:8px;z-index:20;background:var(--purple);color:#fff;padding:8px 12px;border-radius:8px;transform:translateY(-150%)}
.skip-link:focus{transform:none}
.wrap{max-width:760px;margin:0 auto;padding:0 22px}
.site-head{background:var(--purple);color:#f3ecdc}
.site-head .wrap{display:flex;align-items:center;gap:14px;min-height:64px;flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:#f3ecdc}
.brand .crest{width:34px;height:34px;flex:none}
.brand b{font-family:"Zen Old Mincho",serif;font-size:18px;letter-spacing:.05em;display:block;line-height:1.2}
.brand small{font-size:10px;letter-spacing:.18em;color:#c8b58a}
.head-links{margin-left:auto;display:flex;gap:16px;font-size:12.5px;flex-wrap:wrap}
.head-links a{color:#d9cba6;text-decoration:none}
.head-links a:hover{color:#fff;text-decoration:underline}
.breadcrumb{background:var(--cream);font-size:12px}
.breadcrumb ol{display:flex;gap:6px;list-style:none;margin:0;padding:9px 0;flex-wrap:wrap;color:var(--ink-soft)}
.breadcrumb a{color:var(--ink-soft)}
.guide-hero{background:linear-gradient(180deg,#efe7f3,var(--paper));border-bottom:1px solid var(--line);padding:30px 0 22px}
.eyebrow{color:var(--gold-d);font-size:12px;font-weight:700;letter-spacing:.12em;margin:0 0 8px}
.guide-hero h1{font-family:"Zen Old Mincho",serif;font-weight:700;font-size:27px;line-height:1.45;margin:0 0 10px}
.guide-hero .lead{color:var(--ink-soft);font-size:15px;margin:0}
main{padding:26px 0 10px}
.doc h2{font-family:"Zen Old Mincho",serif;font-size:20px;margin:34px 0 10px;padding-bottom:6px;border-bottom:2px solid var(--line)}
.doc h3{font-size:16px;margin:22px 0 4px;color:var(--purple)}
.doc p,.doc li{font-size:15px;line-height:1.95}
.doc ul,.doc ol{padding-left:22px}.doc li{margin:5px 0}
.box{background:#fff;border:1px solid var(--line);border-left:4px solid var(--gold);border-radius:12px;padding:14px 18px;margin:18px 0}
.box.access{border-left-color:var(--violet)}
.box h3{margin:0 0 6px}
.note{background:var(--cream);border:1px solid var(--line);border-radius:12px;padding:12px 16px;margin:18px 0;font-size:13.5px;color:var(--ink-soft);line-height:1.85}
.course{list-style:none;padding:0;margin:14px 0}
.course li{display:flex;gap:12px;padding:10px 0;border-bottom:1px dashed var(--line)}
.course .t{flex:none;width:64px;font-weight:700;color:var(--gold-d);font-size:13.5px}
.course .c b{display:block}
.qa{background:#fff;border:1px solid var(--line);border-radius:14px;padding:6px 18px;margin:14px 0}
.qa dt{font-weight:700;margin:14px 0 4px;color:var(--purple)}
.qa dd{margin:0 0 12px;font-size:14.5px}
.sources{font-size:12.5px;color:var(--ink-soft);border-top:1px dashed var(--line);margin-top:22px;padding-top:12px}
.sources a{color:var(--ink-soft)}
.rel{background:var(--cream);border:1px solid var(--line);border-radius:12px;padding:14px 18px;margin:22px 0 0}
.rel b{font-size:14px}.rel ul{margin:6px 0 0}
.cta{display:inline-block;margin:18px 0 4px;background:var(--purple);color:#f3ecdc;border-radius:10px;padding:11px 20px;font-weight:700;text-decoration:none}
.cta:hover{background:#2a1f47}
.backlink{display:inline-block;margin:6px 0;font-weight:700;text-decoration:none}
.cards{display:grid;gap:14px;margin:8px 0 0}
.card{display:block;background:#fff;border:1px solid var(--line);border-radius:14px;padding:16px 18px;text-decoration:none;color:var(--ink);transition:border-color .15s,transform .15s,box-shadow .15s}
.card:hover{border-color:var(--violet);transform:translateY(-1px);box-shadow:0 8px 20px rgba(56,40,92,.10)}
.card .k{font-size:11.5px;font-weight:700;letter-spacing:.08em;color:var(--gold-d)}
.card h2{font-family:"Zen Old Mincho",serif;font-size:18px;margin:5px 0 5px;border:0;padding:0}
.card p{font-size:13.5px;color:var(--ink-soft);margin:0;line-height:1.7}
.site-foot{background:var(--purple);color:#cbb88f;margin-top:34px;padding:26px 0}
.site-foot .wrap{font-size:12.5px;line-height:1.8}
.site-foot .ft{font-family:"Zen Old Mincho",serif;color:#f3ecdc;font-size:16px;margin:0 0 4px}
.site-foot a{color:#d9cba6}
@media(max-width:560px){.guide-hero h1{font-size:23px}.head-links{width:100%;margin:0}}`;

function head(meta, ld) {
  return `<!DOCTYPE html><html lang="ja"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(meta.title)}</title>
<meta name="description" content="${e(meta.desc)}">
<link rel="canonical" href="${e(meta.url)}">
<meta name="theme-color" content="#38285c">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<meta property="og:type" content="${meta.ogtype || "article"}">
<meta property="og:site_name" content="宝塚百景">
<meta property="og:title" content="${e(meta.title)}">
<meta property="og:description" content="${e(meta.desc)}">
<meta property="og:url" content="${e(meta.url)}">
<meta property="og:image" content="${BASE}/assets/ogp.png">
<meta property="og:locale" content="ja_JP">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Zen+Old+Mincho:wght@400;700;900&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/guide/guide.css">
<script src="/js/consent.js"></script>
${AD}
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>`;
}

const HEADER = `<body><a class="skip-link" href="#main">本文へスキップ</a>
<header class="site-head"><div class="wrap">
  <a class="brand" href="/">${CREST}<span><b>宝塚百景</b><small>TAKARAZUKA さんぽ</small></span></a>
  <nav class="head-links" aria-label="関連">
    <a href="/">宝塚百景（観光）</a>
    <a href="/guide/">さんぽガイド</a>
    <a href="/life/">くらしの便利帳</a>
  </nav>
</div></header>`;

const FOOTER = `<footer class="site-foot"><div class="wrap">
  <p class="ft">宝塚百景 — 100 Views of Takarazuka</p>
  <p><a href="/">観光トップ</a> ／ <a href="/guide/">さんぽガイド</a> ／ <a href="/life/">くらしの便利帳</a> ／ <a href="/privacy.html">プライバシーポリシー</a></p>
  <p>本サイトは宝塚市を愛する個人による非公式ガイドです。掲載情報は2026年6月時点の調査に基づきます。開館時間・料金・行事の日程・運行は変更されることがあります。お出かけ前に各公式サイトで最新情報をご確認ください。</p>
</div></footer></body></html>`;

function breadcrumb(crumbs) {
  return `<nav class="breadcrumb" aria-label="パンくず"><div class="wrap"><ol>${crumbs.map((c, i) =>
    i < crumbs.length - 1 ? `<li><a href="${e(c.url)}">${e(c.name)}</a> ›</li>` : `<li aria-current="page">${e(c.name)}</li>`
  ).join("")}</ol></div></nav>`;
}

function renderBody(a) {
  let h = "";
  for (const s of a.sections) {
    h += `<h2>${e(s.h)}</h2>`;
    for (const block of s.body) {
      if (typeof block === "string") h += `<p>${block}</p>`;
      else if (block.ul) h += `<ul>${block.ul.map((li) => `<li>${li}</li>`).join("")}</ul>`;
      else if (block.h3) h += `<h3>${e(block.h3)}</h3>`;
      else if (block.course) h += `<ul class="course">${block.course.map((c) => `<li><span class="t">${e(c[0])}</span><span class="c"><b>${c[1]}</b>${c[2] || ""}</span></li>`).join("")}</ul>`;
    }
  }
  if (a.access) h += `<div class="box access"><h3>アクセス・基本情報</h3>${a.access}</div>`;
  if (a.faq && a.faq.length) {
    h += `<h2>よくある質問</h2><dl class="qa">${a.faq.map(([q, ans]) => `<dt>${e(q)}</dt><dd>${ans}</dd>`).join("")}</dl>`;
  }
  if (a.note) h += `<p class="note">${a.note}</p>`;
  if (a.sources && a.sources.length) {
    h += `<div class="sources">主な参照: ${a.sources.map((s) => s.url ? `<a href="${e(s.url)}" target="_blank" rel="noopener">${e(s.name)}</a>` : e(s.name)).join("／")}（最新情報は各公式サイトでご確認ください）</div>`;
  }
  return h;
}

function relatedLinks(a, all) {
  const others = all.filter((x) => x.slug !== a.slug).slice(0, 3);
  return `<div class="rel"><b>あわせて読みたい</b><ul>${others.map((x) => `<li><a href="${x.slug}.html">${e(x.title)}</a></li>`).join("")}</ul></div>`;
}

function articlePage(a, all) {
  const url = `${BASE}/guide/${a.slug}.html`;
  const ld = { "@context": "https://schema.org", "@graph": [
    { "@type": "Article", headline: a.title, description: a.desc, inLanguage: "ja", datePublished: "2026-06-21", dateModified: "2026-06-21", mainEntityOfPage: url,
      author: { "@type": "Organization", name: "宝塚百景" }, publisher: { "@type": "Organization", name: "宝塚百景", url: BASE },
      about: { "@type": "City", name: "宝塚市", sameAs: "https://www.city.takarazuka.hyogo.jp/" } },
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "宝塚百景", item: BASE + "/" },
      { "@type": "ListItem", position: 2, name: "さんぽガイド", item: BASE + "/guide/" },
      { "@type": "ListItem", position: 3, name: a.title, item: url } ] },
  ] };
  if (a.faq && a.faq.length) ld["@graph"].push({ "@type": "FAQPage", mainEntity: a.faq.map(([q, ans]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: strip(ans) } })) });
  return head({ title: a.title + "｜宝塚さんぽ", desc: a.desc, url, ogtype: "article" }, ld) + HEADER +
    breadcrumb([{ name: "宝塚百景", url: "/" }, { name: "さんぽガイド", url: "/guide/" }, { name: a.short || a.title }]) +
    `<div class="guide-hero"><div class="wrap"><p class="eyebrow">${e(a.eyebrow)}</p><h1>${e(a.title)}</h1><p class="lead">${e(a.lead)}</p></div></div>` +
    `<main id="main"><div class="wrap doc"><a class="backlink" href="/guide/">← さんぽガイド一覧</a>` + renderBody(a) +
    `<p><a class="cta" href="/">宝塚百景（観光トップ）を見る →</a></p>` + relatedLinks(a, all) +
    `<p style="margin-top:14px"><a class="backlink" href="/guide/">← さんぽガイド一覧へ</a></p></div></main>` + FOOTER;
}

function hubPage(all) {
  const url = BASE + "/guide/";
  const desc = "宝塚を歩いて楽しむための、地元目線のおでかけガイド。宝塚歌劇のはじめての観劇、中山寺の安産祈願、清荒神の門前町、半日モデルコース、寺社めぐり、街の歴史までをまとめています。";
  const ld = { "@context": "https://schema.org", "@graph": [
    { "@type": "CollectionPage", name: "宝塚さんぽガイド", description: desc, url, inLanguage: "ja", isPartOf: { "@type": "WebSite", name: "宝塚百景", url: BASE + "/" }, about: { "@type": "City", name: "宝塚市", sameAs: "https://www.city.takarazuka.hyogo.jp/" } },
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "宝塚百景", item: BASE + "/" },
      { "@type": "ListItem", position: 2, name: "さんぽガイド", item: url } ] },
    { "@type": "ItemList", itemListElement: all.map((a, i) => ({ "@type": "ListItem", position: i + 1, url: `${BASE}/guide/${a.slug}.html`, name: a.title })) },
  ] };
  return head({ title: "宝塚さんぽガイド｜宝塚百景", desc, url, ogtype: "website" }, ld) + HEADER +
    breadcrumb([{ name: "宝塚百景", url: "/" }, { name: "さんぽガイド" }]) +
    `<div class="guide-hero"><div class="wrap"><p class="eyebrow">TAKARAZUKA WALKING GUIDE</p><h1>宝塚さんぽガイド</h1><p class="lead">${e(desc)}</p></div></div>` +
    `<main id="main"><div class="wrap"><div class="cards">${all.map((a) =>
      `<a class="card" href="${a.slug}.html"><span class="k">${e(a.eyebrow)}</span><h2>${e(a.title)}</h2><p>${e(a.desc)}</p></a>`).join("")}</div>` +
    `<p style="margin-top:20px"><a class="cta" href="/">宝塚百景（観光トップ）へ →</a></p></div></main>` + FOOTER;
}

// ============================ 記事データ ============================
const ARTICLES = [
  {
    slug: "nakayamadera-anzan", eyebrow: "寺社・ご利益", short: "中山寺の安産祈願",
    title: "中山寺の安産祈願ガイド｜戌の日・腹帯・所要時間・アクセス",
    desc: "安産祈願で全国的に知られる中山寺（宝塚市）の参拝ガイド。戌の日の考え方、鐘の緒（腹帯）の授与、妊婦にやさしいバリアフリー、青い五重塔、アクセスと所要時間をまとめました。",
    lead: "「安産といえば中山寺」と全国から参拝者が訪れる、西国三十三所第24番札所。はじめての方でも安心してお参りできるよう、由来から戌の日の考え方、所要時間までをまとめました。",
    sections: [
      { h: "中山寺はどんなお寺？", body: [
        "中山寺は真言宗中山寺派の大本山で、西国三十三所観音霊場の第24番札所。本尊は十一面観世音菩薩で、寺伝では聖徳太子の創建とも伝わる古刹です。豊臣秀吉が世継ぎを願って祈願し秀頼を授かったという伝承も残ります。",
        "安産祈願の名所となったのは幕末から。明治天皇の母・中山一位局が当寺の「鐘の緒（かねのお）」を授かって無事に明治天皇を出産したことから、日本で唯一の「明治天皇勅願所」となり、安産の信仰が全国に広まりました。",
      ] },
      { h: "「鐘の緒（腹帯）」と戌の日の考え方", body: [
        "中山寺の安産祈願は、安産の護符である「鐘の緒（腹帯）」にちなんだ信仰で知られます。日本では古くから、犬がお産が軽いことにあやかり、妊娠5か月目の「戌の日」に腹帯を巻いて安産を願う習わしがあります。",
        "そのため戌の日は参拝者が多く、特に大安と重なる日や休日は混み合います。戌の日にこだわらず、体調のよい日に無理なくお参りしても問題はありません。授与品の種類・初穂料・受付時間などは変わることがあるため、お出かけ前に必ず公式サイトでご確認ください。",
      ] },
      { h: "妊婦さんにやさしいバリアフリー", body: [
        "中山寺は、山門から本堂までエレベーターやエスカレーター、手すりが整備された、全国でも数少ないバリアフリーのお寺です。妊娠中の方や高齢の方、ベビーカー連れでも本堂近くまで上がりやすく、安産祈願の名所にふさわしい配慮がなされています。",
      ] },
      { h: "青い五重塔と梅林も見どころ", body: [
        "境内の五重塔「青龍塔」は2017年に約400年ぶりに再建されたもので、高さ約28メートル。仏の知恵を表す深い青色は日本の五重塔としては極めて珍しく、写真映えするスポットです。",
        "寺の西側に広がる中山観音公園の梅林には約1,000本の梅があり、見頃は例年3月上旬。入園は無料です。健脚の方は、境内から中山の最高峰を経て清荒神へ抜ける奥之院ハイキング（往復・縦走で約2〜3時間）も楽しめます。",
      ] },
    ],
    access: "宝塚市中山寺。阪急宝塚線「中山観音」駅からすぐ（徒歩約1分）。お参りのみなら所要約45分、奥之院ハイキングを含めると3〜4時間ほど。駐車場の有無・初穂料・受付時間は公式サイトでご確認ください。",
    faq: [
      ["戌の日でないと安産祈願はできませんか？", "戌の日は安産の縁起がよい日とされますが、その日でなければ祈願できないわけではありません。混雑を避けたい場合は、戌の日以外の平日にお参りする方も多くいます。体調を最優先にしてください。"],
      ["腹帯は持参しますか？それとも授かりますか？", "中山寺では安産祈願にちなむ授与品があります。持ち込みの可否や授与の方法は変わることがあるため、最新の案内を公式サイトでご確認のうえお出かけください。"],
      ["どのくらい時間がかかりますか？", "お参りだけなら45分前後が目安です。戌の日や休日は受付が混み合い、待ち時間が長くなることがあります。"],
      ["妊娠中でも本堂まで上がれますか？", "エレベーター・エスカレーターが整備されているため、妊娠中の方や高齢の方でも比較的らくに本堂近くまで進めます。"],
    ],
    sources: [{ name: "中山寺 公式", url: "https://www.nakayamadera.or.jp/" }, { name: "宝塚市国際観光協会", url: "https://kanko-takarazuka.jp/" }],
  },
  {
    slug: "kiyoshikojin-guide", eyebrow: "寺社・門前町", short: "清荒神の参拝・初詣",
    title: "清荒神清澄寺の参拝・初詣ガイド｜門前町・縁日・鉄斎美術館",
    desc: "「荒神さん」で親しまれる清荒神清澄寺（宝塚市）の参拝ガイド。火・台所の神のご利益、約1.2kmの門前町、毎月27・28日の縁日、関西屈指の初詣、鉄斎美術館までを地元目線で案内します。",
    lead: "「荒神さん」と呼ばれ親しまれる清荒神清澄寺は、火と台所の神様。約1.2kmの参道に約200軒の店が並ぶ門前町の賑わいも大きな魅力です。お参りと食べ歩きをまとめて楽しめます。",
    sections: [
      { h: "「荒神さん」清荒神清澄寺とは", body: [
        "清荒神清澄寺は真言三宝宗の大本山。平安時代の896年、宇多天皇の勅願寺として開かれ、「日本第一清荒神」の称号を授かったと伝わります。本尊は大日如来ですが、広く信仰を集めているのは境内に祀られる三宝荒神（さんぼうこうじん）です。",
        "三宝荒神は台所・火の神として「荒神さん」と呼ばれ、家内安全・商売繁盛・厄除けのご利益で知られます。台所に荒神さんのお札を祀る家庭も多く、暮らしに根づいた信仰です。神仏習合の名残で、拝殿（天堂）には鳥居があるのも特徴です。",
      ] },
      { h: "約1.2kmの門前町「龍の道」を歩く", body: [
        "阪急清荒神駅から境内までは、ゆるやかな坂道「龍の道」が約1.2km続きます。沿道には飲食店・土産物店・露店など約200軒が並び、参道そのものが見どころ。縁日グルメや甘味を味わいながら歩くのが定番の楽しみ方です。",
        "毎月27日・28日は「月並三宝例祭」で縁日が立ち、いっそうの賑わいになります。日本の門前町文化や縁日の雰囲気をそのまま体感できる、貴重な参道です。",
      ] },
      { h: "関西屈指の初詣スポット", body: [
        "正月三が日には約40万人が訪れる、関西でも有数の初詣スポットです。三が日は参道・境内ともに大変混雑するため、時間に余裕をもって訪れるのがおすすめ。家内安全や商売繁盛を願う参拝者で一年の始まりが活気づきます。",
      ] },
      { h: "鉄斎美術館（聖光殿）", body: [
        "境内には、近代日本画の巨匠・富岡鉄斎の作品を収蔵・公開する鉄斎美術館「聖光殿」があります。清荒神清澄寺が半世紀以上かけて集めた当山コレクションは2,000余点に及び、海外の美術館にも作品を貸し出してきた本格的な美術館です。参拝とあわせて立ち寄ると、信仰と芸術の両方に触れられます（入館料・開館状況は公式でご確認ください）。",
      ] },
    ],
    access: "宝塚市米谷。阪急今津線「清荒神」駅から徒歩約20分（約1.2kmの参道）。参道から境内までゆっくり歩いて約90分が目安。駐車場・各施設の時間や料金は公式サイトでご確認ください。",
    faq: [
      ["駅から少し遠いですか？", "参道は約1.2km・徒歩20分ほどですが、店が並ぶ門前町自体が楽しみのひとつです。坂道なので歩きやすい靴がおすすめです。"],
      ["毎月の縁日はいつですか？", "毎月27日・28日に縁日（月並三宝例祭）が立ち、参道が特に賑わいます。"],
      ["中山寺とあわせて参拝できますか？", "健脚の方は、中山寺から奥之院を経て清荒神へ抜けるハイキングコース（約7〜8km・2〜3時間）でつなぐこともできます。"],
      ["鉄斎美術館はいつでも入れますか？", "企画展の入れ替えや開館日があります。入館料とあわせて最新情報を公式サイトでご確認ください。"],
    ],
    sources: [{ name: "清荒神清澄寺 公式", url: "https://www.kiyoshikojin.or.jp/" }, { name: "宝塚市国際観光協会", url: "https://kanko-takarazuka.jp/" }],
  },
  {
    slug: "takarazuka-revue-first", eyebrow: "宝塚歌劇", short: "はじめての観劇ガイド",
    title: "はじめての宝塚歌劇 観劇ガイド｜チケット・座席・5組・当日の流れ",
    desc: "宝塚大劇場で初めて宝塚歌劇を観る人へ。チケットの取り方、座席と料金の目安、花・月・雪・星・宙の5組、芝居＋ショーの二本立て、大階段や銀橋など、観劇前に知っておきたい基本をやさしくまとめました。",
    lead: "女性だけで演じられる宝塚歌劇は、2024年に110周年を迎えた唯一無二の舞台。「気になるけれど敷居が高そう」という方へ、はじめての観劇に必要なことだけを整理しました。",
    sections: [
      { h: "宝塚歌劇とは（女性だけの舞台）", body: [
        "宝塚歌劇は1914年に宝塚で初公演を行い、団員すべてが女性という世界でも珍しい劇団です。男性役を演じる「男役」と女性役の「娘役」がおり、各組のトップスターを頂点としたスターシステムで運営されています。理念は「清く 正しく 美しく」。",
        "華やかな大階段や、客席に最も近い「銀橋（ぎんきょう）」での歌唱はフィナーレの見どころ。公演の最後に全員で歌う「すみれの花咲く頃」は、100年近く歌い継がれる宝塚のテーマソングです。",
      ] },
      { h: "5組それぞれの個性", body: [
        "宝塚歌劇は花組・月組・雪組・星組・宙組（そらぐみ）の5組と、各組に客演する専科で構成されます。組ごとにテーマカラーや雰囲気が異なり、同じ宝塚でも公演によって世界観が大きく変わります。お気に入りの組やスターを見つけるのも楽しみ方のひとつです。",
      ] },
      { h: "チケットと座席・料金の目安", body: [
        "宝塚大劇場の公演は、各組が約1か月半ずつ上演し、5組が宝塚と東京の劇場を交互に使います。チケットは公式の「宝塚歌劇Webチケットサービス」で会員登録のうえ購入でき、当日券は残席がある場合に劇場窓口で販売されます。",
        "座席は階・位置によって料金が分かれ、最も手頃なB席は2026年時点で3,500円ほど。人気公演は発売直後に完売することもあるため、日程が決まったら早めの確保がおすすめです。価格や発売スケジュールは変動するため、必ず公式で最新情報をご確認ください。",
      ] },
      { h: "当日の流れと楽しみ方", body: [
        "公演は「芝居」と「ショー」の二本立てで、休憩30分を含めて全体で約3時間。ミュージカルが初めての方でも、物語と豪華なレビューの両方を一度に楽しめる構成です。劇場内での写真・録音・録画はできません。",
        "日本語以外の字幕や同時通訳はありませんが、公式サイトにはあらすじや配役が複数言語で掲載されています。観劇前に物語を予習しておくと、より深く楽しめます。",
      ] },
      { h: "観劇前後のおすすめ", body: [
        "阪急宝塚駅から大劇場へは、桜並木の「花のみち」を歩いて向かうのが定番。途中には小林一三像や『ベルサイユのばら』のオスカルとアンドレの像があります。劇場のすぐそばには手塚治虫記念館や、土産物がそろうソリオ宝塚もあり、観劇とあわせて半日たっぷり楽しめます。",
      ] },
    ],
    access: "宝塚大劇場は阪急宝塚線・今津線「宝塚」駅、またはJR宝塚駅から花のみち経由で徒歩約5〜8分。公演スケジュール・チケット価格・座席数は宝塚歌劇公式サイトでご確認ください（情報は2026年時点）。",
    faq: [
      ["初心者でも楽しめますか？", "はい。芝居とショーの二本立てで、視覚的にも華やかなため、予備知識がなくても十分楽しめます。あらすじを事前に読んでおくとより安心です。"],
      ["字幕はありますか？", "劇場内の字幕や同時通訳はありません。ただし公式サイトに英語などのあらすじ・配役が掲載されています。"],
      ["服装に決まりはありますか？", "特別なドレスコードはありません。多くの方が少しよそ行きの服装で訪れますが、観劇を楽しむ場としての節度があれば普段着でも問題ありません。"],
      ["チケットが取れないときは？", "隣接する宝塚バウホール（約500席）の公演や、東京宝塚劇場の公演もあります。当日券の有無は公演により異なります。"],
    ],
    note: "本ページは観劇の基礎を紹介するものです。公演内容・料金・チケットの取り扱いは宝塚歌劇団の公式サイトが最新かつ正確です。",
    sources: [{ name: "宝塚歌劇 公式", url: "https://kageki.hankyu.co.jp/" }, { name: "宝塚歌劇 Webチケット", url: "https://www.takarazuka-ticket.com/" }],
  },
  {
    slug: "half-day-course", eyebrow: "モデルコース", short: "半日モデルコース",
    title: "宝塚 半日観光モデルコース｜花のみち・宝塚大劇場・手塚治虫記念館",
    desc: "宝塚を半日（約3〜4時間）で巡るモデルコース。阪急宝塚駅を起点に、桜並木の花のみち、宝塚大劇場、手塚治虫記念館、武庫川沿いを効率よく歩く王道ルートを、所要時間の目安つきで紹介します。",
    lead: "「宝塚を半日で楽しみたい」という方へ。阪急宝塚駅を起点に、観劇をしない日でも宝塚の魅力を味わえる、歩いて回れる王道の半日コースをまとめました。",
    sections: [
      { h: "コースの全体像", body: [
        "今回のコースは、阪急宝塚駅周辺に見どころが集まる「歌劇エリア」を歩いて巡る約3〜4時間のプラン。移動はほぼ徒歩で、坂も少なく歩きやすいルートです。観劇を組み合わせる場合は、公演前後の時間に合わせて立ち寄り先を選ぶとよいでしょう。",
        { course: [
          ["0:00", "阪急宝塚駅・ソリオ宝塚", "駅直結の商業施設。土産やトイレ、軽食の補給に。"],
          ["0:10", "花のみち（徒歩約420m）", "駅と大劇場を結ぶ桜並木。小林一三像やオスカルの像も。"],
          ["0:30", "宝塚大劇場・宝塚ホテル前", "劇場の外観と街の雰囲気を楽しむ。観劇する日はここで。"],
          ["1:00", "手塚治虫記念館", "火の鳥のオブジェが出迎える。見学60〜90分。"],
          ["2:30", "文化芸術センター「たからば」", "ファミリーランド跡地。庭園は無料で散策できる。"],
          ["3:00", "武庫川・宝塚温泉エリア", "川沿いを散策。カフェや日帰り入浴でひと休み。"],
        ] },
      ] },
      { h: "見どころピックアップ", body: [
        { h3: "花のみち" },
        "阪急宝塚駅から宝塚大劇場へ続く約420mの遊歩道。命名は小林一三で、春には約60本のソメイヨシノが咲く桜の名所です。『ベルサイユのばら』のオスカルとアンドレの像など、宝塚らしいモニュメントが点在します。",
        { h3: "手塚治虫記念館" },
        "「マンガの神様」手塚治虫は、5歳から24歳までの約20年間を宝塚で過ごしました。記念館では原画や映像、アニメ制作体験などを通じてその世界に触れられます。入口には高さ約4.4mの火の鳥のオブジェ。開館時間・入館料は公式でご確認ください（2026年時点で大人700円ほど）。",
        { h3: "文化芸術センター「たからば」" },
        "かつて宝塚ファミリーランドがあった場所に2020年に開館した文化施設。展示やアトリエのほか、庭園部分は無料で散策できます。",
      ] },
      { h: "雨の日・暑い日の調整", body: [
        "天候が崩れたときは、駅直結のソリオ宝塚、屋内の手塚治虫記念館、文化芸術センターを中心に組み立てると快適です。夏場は花のみちの木陰を歩きつつ、屋内施設で休憩をはさむのがおすすめです。",
      ] },
    ],
    access: "起点は阪急宝塚線・今津線「宝塚」駅、またはJR宝塚駅。主な立ち寄り先はいずれも徒歩圏内です。各施設の開館時間・料金・休館日は公式サイトでご確認ください（情報は2026年時点）。",
    faq: [
      ["子ども連れでも回れますか？", "ほぼ徒歩・平坦なルートで、手塚治虫記念館や庭園など子どもも楽しめる施設が中心です。ベビーカーでも回りやすいコースです。"],
      ["観劇とセットにできますか？", "できます。公演の前後に花のみちや手塚治虫記念館を組み込むのが定番です。観劇だけで約3時間かかるため、立ち寄りは時間に余裕をもって。"],
      ["所要時間はどのくらいですか？", "立ち寄り先を絞れば約3時間、ゆっくり巡って4時間ほどが目安です。"],
      ["桜の見頃はいつですか？", "花のみちのソメイヨシノは例年3月下旬〜4月上旬が見頃です。"],
    ],
    sources: [{ name: "宝塚市国際観光協会", url: "https://kanko-takarazuka.jp/" }, { name: "手塚治虫記念館（宝塚市）", url: "https://www.city.takarazuka.hyogo.jp/tezuka/" }],
  },
  {
    slug: "jisha-goshuin", eyebrow: "寺社めぐり", short: "寺社めぐり・御朱印さんぽ",
    title: "宝塚の寺社めぐり 御朱印さんぽ｜中山寺・清荒神・売布神社ほか",
    desc: "阪急沿線でつなぐ宝塚の寺社めぐり。安産の中山寺、荒神さんの清荒神、衣食財の売布神社、初日の出の宝塚神社、スサノオを祀る伊和志津神社まで、ご利益とアクセスをまとめた御朱印さんぽガイドです。",
    lead: "宝塚は、古社・古刹が阪急沿線に点在し、電車でつないで巡りやすい街です。ご利益もさまざま。半日〜一日で歩ける、宝塚の寺社めぐりをまとめました。",
    sections: [
      { h: "宝塚の寺社の楽しみ方", body: [
        "宝塚の寺社は、阪急宝塚線・今津線の駅から歩いて行ける場所が多く、電車で気軽につなげるのが魅力です。安産・厄除け・縁結び・学問など、お参りの目的に合わせて行き先を選べます。御朱印やお守りの授与方針は各寺社で異なるため、事前に公式で確認しておくと安心です。",
      ] },
      { h: "ご利益別・宝塚の主な寺社", body: [
        { h3: "中山寺（安産祈願）" },
        "西国三十三所第24番札所で、全国的な安産祈願の名所。エレベーター・エスカレーターが整い、妊婦さんにもやさしいお寺です。阪急「中山観音」駅すぐ。",
        { h3: "清荒神清澄寺（火・台所の神／家内安全）" },
        "「荒神さん」として親しまれ、約1.2kmの門前町が続きます。家内安全・商売繁盛・厄除けのご利益。阪急「清荒神」駅から徒歩約20分。",
        { h3: "売布神社（衣・食・財／縁結び）" },
        "1,400年以上の歴史をもつ式内社。里人に稲作や機織りを教えたと伝わる下照姫神を祀り、衣・食・財の守護、縁結びの信仰があります。阪急「売布神社」駅から徒歩約5分。",
        { h3: "宝塚神社（初日の出／えびす）" },
        "高台にあり、大阪方面まで見渡せる初日の出の名所。毎年1月の「えびす大祭（宝のえびす）」では商売繁盛を願う人で賑わい、黄色い御朱印が人気です。阪急「宝塚」駅から徒歩約15分。",
        { h3: "伊和志津神社（学問・縁結び）" },
        "スサノオを祀る宝塚随一の古社で、市内の総鎮守とされてきました。加藤清正が朝鮮から持ち帰った虎を境内で飼ったという伝承も残ります。阪急「小林」駅から徒歩約5分。",
      ] },
      { h: "めぐり方の目安", body: [
        "今津線沿いの清荒神・売布神社・小林（伊和志津神社）と、宝塚線の中山観音（中山寺）・宝塚（宝塚神社）を組み合わせると、半日〜一日で無理なく巡れます。健脚の方は、中山寺から清荒神への奥之院ハイキング（約7〜8km・2〜3時間）で2つの大寺をつなぐコースも人気です。",
      ] },
    ],
    access: "各寺社とも阪急宝塚線・今津線の駅から徒歩圏内です。御朱印・お守りの授与時間や初穂料は寺社ごとに異なるため、各公式サイトでご確認ください。",
    faq: [
      ["一日で何ヶ所くらい回れますか？", "移動と参拝を考えると、ゆっくりで3〜4ヶ所が目安です。沿線をそろえると効率よく巡れます。"],
      ["御朱印は必ずいただけますか？", "授与の時間や対応は寺社・時期によって異なります。お出かけ前に各公式で確認しておくと確実です。"],
      ["中山寺と清荒神は歩いてつながりますか？", "奥之院を経由するハイキングコース（約7〜8km）でつながります。健脚向けで、所要2〜3時間ほどです。"],
    ],
    sources: [{ name: "宝塚市国際観光協会", url: "https://kanko-takarazuka.jp/" }, { name: "中山寺 公式", url: "https://www.nakayamadera.or.jp/" }, { name: "清荒神清澄寺 公式", url: "https://www.kiyoshikojin.or.jp/" }],
  },
  {
    slug: "takarazuka-history", eyebrow: "街の歴史", short: "宝塚という街の歴史",
    title: "「宝塚」という街の歴史｜地名の由来・古墳・小浜宿・宝塚歌劇の始まり",
    desc: "なぜ「宝塚」という名前なのか。古墳（宝の塚）が語源とされる地名の由来から、江戸の宿場町・小浜宿、宝塚温泉、小林一三と宝塚歌劇の誕生まで、宝塚という街の成り立ちをやさしく解説します。",
    lead: "華やかな歌劇のイメージが強い宝塚ですが、その名前は古い古墳に由来し、街は宿場町や温泉、鉄道とともに育ってきました。宝塚という街の成り立ちを、ひとつの物語としてたどります。",
    sections: [
      { h: "「宝塚」という名前の由来", body: [
        "「塚（つか）」は古墳を意味する言葉です。宝塚市内には200基を超える古墳が残り、古くからこの地は「宝の塚」と呼ばれてきました。江戸時代の地誌『摂陽群談』（1701年）には「この塚のそばで物を拾う者には必ず幸せがある。これによって宝塚の名が付いたといわれる」という記述が残ります。",
        "「宝塚」の名が広く知られるようになったのは、1887年に宝塚温泉が開業してからのこと。市として正式に発足したのは1954年で、川辺郡宝塚町と武庫郡良元村が合併して宝塚市が誕生しました。",
      ] },
      { h: "古代の宝塚 — 数多くの古墳", body: [
        "宝塚は猪名川流域でも古い古墳が集まる地域です。なかでも中山荘園古墳は、兵庫県内で唯一の八角形の墳丘をもつ古墳で、天皇陵に用いられた形式が郊外の住宅地に残るとして国の史跡に指定されています。地名の「塚」が示すとおり、宝塚は古代から人々が暮らした土地でした。",
      ] },
      { h: "江戸時代 — 宿場町・小浜宿と酒造り", body: [
        "宝塚駅にほど近い小浜（こはま）は、有馬街道と西宮街道が交わる交通の要衝として栄えた宿場町・寺内町です。堀と土塁で囲まれた構えをもち、豊臣秀吉や千利休が有馬温泉への道中に立ち寄ったとも伝わります。",
        "また小浜は、名水「玉の井」を生かした酒造りの地でもありました。「小浜流（こはまりゅう）」と呼ばれる酒造技術は、後に有名になる灘の酒に先行して栄えたといわれます。今もその歴史は市立小浜宿資料館で知ることができます。",
      ] },
      { h: "近代 — 温泉と小林一三の街づくり", body: [
        "明治に入り宝塚温泉が開業すると、武庫川沿いに温泉町が形成されます。そこへ大きな転機をもたらしたのが、阪急電鉄の創業者・小林一三です。1910年に梅田〜宝塚間の鉄道を開業し、沿線に住宅地を分譲。「鉄道を敷く前に沿線に暮らす人をつくる」という発想で、郊外住宅という新しい暮らし方を生み出しました。",
        "鉄道・住宅・温泉・劇場・百貨店を一体で経営するこの手法は「私鉄沿線開発モデル」として全国の私鉄に広まり、日本の鉄道経営の基本形になりました。宝塚は、その出発点となった街です。",
      ] },
      { h: "宝塚歌劇の誕生（1914年）", body: [
        "1911年に小林一三が開いた宝塚新温泉には、当時としては珍しい大きな室内プールがありました。しかし冬は使えなかったため、その空間を生かす余興として「宝塚唱歌隊」が結成されます。",
        "そして1914年4月1日、プールを改造した劇場で初公演が行われました。演目は桃太郎を題材にした歌劇『ドンブラコ』など。これが宝塚歌劇の始まりです。温泉の集客のために生まれた少女歌劇が、110年を超えて世界に知られる劇団へと育ったのです。",
      ] },
    ],
    note: "余談ですが、コンビニでおなじみの炭酸水「ウィルキンソン」も、明治期に宝塚（小林）で瓶詰めが始まったことが知られています。身近なブランドにも、宝塚の歴史が隠れています。",
    faq: [
      ["「宝塚」の名前の由来は？", "「塚」は古墳を意味し、市内に多くの古墳が残ることから「宝の塚」と呼ばれたことに由来するとされます。江戸時代の地誌にもその記述があります。"],
      ["宝塚歌劇はいつ始まりましたか？", "1914年4月1日、宝塚新温泉のプールを改造した劇場での初公演が始まりです。2024年に110周年を迎えました。"],
      ["宝塚はなぜ温泉地になったのですか？", "武庫川沿いで温泉が確認され、1887年に宝塚温泉が開業。その後、阪急の鉄道とリゾート開発によって発展しました。"],
    ],
    sources: [{ name: "宝塚市公式サイト", url: "https://www.city.takarazuka.hyogo.jp/" }, { name: "宝塚歌劇 公式（歴史）", url: "https://kageki.hankyu.co.jp/fun/history1914.html" }],
  },
];

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "guide.css"), CSS, "utf8");
fs.writeFileSync(path.join(OUT, "index.html"), hubPage(ARTICLES), "utf8");
for (const a of ARTICLES) fs.writeFileSync(path.join(OUT, a.slug + ".html"), articlePage(a, ARTICLES), "utf8");
console.log("guide/ generated:", ARTICLES.length, "articles + hub + guide.css");
