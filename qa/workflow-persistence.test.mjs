import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('failed publication commits only status; same-day retry still publishes changed data', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'takarazuka-workflow-'));
  const bash = process.platform === 'win32' ? 'C:/Program Files/Git/bin/bash.exe' : 'bash';
  const workflow = fs.readFileSync(fileURLToPath(new URL('../.github/workflows/update-data.yml', import.meta.url)), 'utf8');
  const step = workflow.split('      - name: Commit updated data back to main')[1].split('      - name: Report notification failure')[0];
  const script = step.split('        run: |')[1].split('\n').map(line => line.replace(/^          /, '')).join('\n');
  const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    const remote = path.join(temp, 'remote.git');
    const work = path.join(temp, 'work');
    git(temp, 'init', '--bare', '--initial-branch=main', remote);
    git(temp, 'clone', remote, work);
    git(work, 'config', 'user.email', 'test@example.invalid');
    git(work, 'config', 'user.name', 'Local test');
    const files = ['life/data/opendata/events.json', 'life/data/opendata/_status.json', 'life/events/index.html', 'index.html', 'llms-full.txt', 'llms-life.txt', 'sitemap.xml'];
    for (const file of files) {
      fs.mkdirSync(path.dirname(path.join(work, file)), { recursive: true });
      fs.writeFileSync(path.join(work, file), 'old\n');
    }
    git(work, 'add', '.'); git(work, 'commit', '-m', 'fixture'); git(work, 'push', 'origin', 'main');
    const mutate = () => {
      fs.writeFileSync(path.join(work, files[0]), 'new data same day\n');
      fs.writeFileSync(path.join(work, files[1]), 'successful fetch status\n');
      fs.writeFileSync(path.join(work, files[2]), 'new generated page\n');
      git(work, 'add', 'life/data/opendata');
    };
    mutate();
    execFileSync(bash, ['-e'], { cwd: work, input: script, env: { ...process.env, PUBLISHED: 'failure' }, stdio: ['pipe', 'pipe', 'pipe'] });
    assert.equal(git(remote, 'show', 'main:life/data/opendata/events.json'), 'old\n');
    assert.equal(git(remote, 'show', 'main:life/events/index.html'), 'old\n');
    assert.equal(git(remote, 'show', 'main:life/data/opendata/_status.json'), 'successful fetch status\n');
    assert.equal(git(work, 'status', '--porcelain'), '');
    mutate();
    assert.ok(git(work, 'diff', '--cached', '--name-only', '--', 'life/data/opendata', ':!life/data/opendata/_status.json').includes('events.json'));
    execFileSync(bash, ['-e'], { cwd: work, input: script, env: { ...process.env, PUBLISHED: 'success' }, stdio: ['pipe', 'pipe', 'pipe'] });
    assert.equal(git(remote, 'show', 'main:life/data/opendata/events.json'), 'new data same day\n');
    assert.equal(git(remote, 'show', 'main:life/events/index.html'), 'new generated page\n');
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});
