// Called by update-data.yml after fetch, including when every dataset failed.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const gh = (args, options = {}) => execFileSync('gh', args, { encoding: 'utf8', ...options });
export async function notifyFailures(status, run = gh) {
  for (const [name, state] of Object.entries(status.datasets)) {
    if (state.consecutiveFailedWeeks < 2) continue;
    const title = `[open-data] ${name}: 2週以上の連続取得失敗`;
    const issues = JSON.parse(run(['issue', 'list', '--state', 'open', '--search', `${title} in:title`, '--limit', '100', '--json', 'number,title']));
    const existing = issues.find((issue) => issue.title === title);
    const runUrl = process.env.GITHUB_RUN_ID ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` : '';
    const body = [`データセット: ${name}`, `最終試行: ${state.lastAttempt}`, `連続失敗: ${state.consecutiveFailedWeeks}週 / ${state.consecutiveFailures}回`,
      `最終成功: ${state.lastSuccess || '記録なし'}`, `エラー: ${state.lastError}`, '', '前回のデータ・取得日を維持しています。公式の掲載先・ファイル形式を確認してください。', runUrl].join('\n');
    // stdin avoids command interpolation and preserves Japanese and multiline text.
    const args = existing ? ['issue', 'comment', String(existing.number), '--body-file', '-'] : ['issue', 'create', '--title', title, '--body-file', '-'];
    console.log(run(args, { input: body }));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const file = fileURLToPath(new URL('../life/data/opendata/_status.json', import.meta.url));
  await notifyFailures(JSON.parse(fs.readFileSync(file, 'utf8')));
}
