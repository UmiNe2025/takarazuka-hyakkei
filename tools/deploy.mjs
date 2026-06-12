/* ワンコマンド・デプロイ: ビルド → Cloudflare Pages デプロイ → 本番検証
   Run: node tools/deploy.mjs [--push]
     --push : デプロイ成功後に git add/commit/push まで実行（GitHubミラー更新）
   手順は PLAYBOOK-cloudflare-pages-custom-domain.md 準拠。 */
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROJECT = "takarazuka";
const PROD_URL = "https://takarazuka.jun-nakatani.com/";
const PAGES_URL = "https://takarazuka.pages.dev/";
const doPush = process.argv.includes("--push");

function run(cmd, opts = {}) {
  console.log("\n$ " + cmd);
  execSync(cmd, { cwd: ROOT, stdio: "inherit", ...opts });
}

console.log("=== 宝塚百景 deploy ===");
run("node tools/prerender.mjs");
run("node tools/prerender-life.mjs");
run("node tools/build-public.mjs");
run(`npx wrangler pages deploy public --project-name=${PROJECT} --branch=main --commit-dirty=true`);

console.log(`\n--- verify ${PAGES_URL} & ${PROD_URL} (CDN伝播のため少し待機) ---`);
await new Promise((res) => setTimeout(res, 8000));
try {
  run("node tools/verify-live.mjs");
} catch (e) {
  console.log("検証失敗（伝播待ちの可能性。数分後に node tools/verify-live.mjs で再確認を）");
  process.exitCode = 1;
}

if (doPush && process.exitCode !== 1) {
  run('git add -A');
  run('git commit -m "chore: deploy update" --allow-empty');
  run("git push");
}
console.log("\ndone." + (doPush ? "" : "（git push は --push 指定時のみ）"));
