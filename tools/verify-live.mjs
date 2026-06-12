/* 本番検証: pages.dev とカスタムドメインの双方で 200 / CSP / コンテンツ量を確認。
   - /        : 宝塚百景（view-card が100枚）
   - /life/   : くらしの便利帳（item-card が50枚以上）
   Run: node tools/verify-live.mjs   （失敗時 exit 1） */
const CHECKS = [
  { url: "https://takarazuka.pages.dev/", pat: /class="view-card"/g, min: 100, label: "views" },
  { url: "https://takarazuka.jun-nakatani.com/", pat: /class="view-card"/g, min: 100, label: "views" },
  { url: "https://takarazuka.pages.dev/life/", pat: /class="item-card"/g, min: 50, label: "items" },
  { url: "https://takarazuka.jun-nakatani.com/life/", pat: /class="item-card"/g, min: 50, label: "items" },
];

let fail = false;
for (const { url, pat, min, label } of CHECKS) {
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (verify-live)" } });
    const body = await r.text();
    const count = (body.match(pat) || []).length;
    const csp = Boolean(r.headers.get("content-security-policy"));
    const ok = r.status === 200 && count >= min && csp;
    console.log(`${ok ? "✓" : "✗"} ${url} status=${r.status} ${label}=${count} CSP=${csp} ${(body.length / 1024).toFixed(0)}KB`);
    if (!ok) fail = true;
  } catch (e) {
    console.log(`✗ ${url} → ${e.message.split("\n")[0]}`);
    fail = true;
  }
}
if (fail) process.exit(1);
