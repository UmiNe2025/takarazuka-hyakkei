/* 本番検証: pages.dev とカスタムドメインの双方で 200 / CSP / カード100枚を確認。
   Run: node tools/verify-live.mjs   （失敗時 exit 1） */
const URLS = [
  "https://takarazuka.pages.dev/",
  "https://takarazuka.jun-nakatani.com/"
];

let fail = false;
for (const url of URLS) {
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (verify-live)" } });
    const body = await r.text();
    const cards = (body.match(/class="view-card"/g) || []).length;
    const csp = Boolean(r.headers.get("content-security-policy"));
    const ok = r.status === 200 && cards === 100 && csp;
    console.log(`${ok ? "✓" : "✗"} ${url} status=${r.status} cards=${cards} CSP=${csp} ${(body.length / 1024).toFixed(0)}KB`);
    if (!ok) fail = true;
  } catch (e) {
    console.log(`✗ ${url} → ${e.message.split("\n")[0]}`);
    fail = true;
  }
}
if (fail) process.exit(1);
