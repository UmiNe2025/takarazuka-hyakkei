import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { notifyFailures } from '../tools/notify-opendata-failures.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));

test('fetch failures persist without replacing data; retries do not become failed weeks; success resets', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'takarazuka-status-'));
  try {
    const fixture = path.join(temp, 'fetch-fixture.mjs');
    fs.writeFileSync(fixture, `globalThis.fetch = async () => new Response('var event_data = {"events":[{"eventtitle":"fixture","opendays":["2026/09/23"],"url":"/event.html"}]};');`);
    const original = fs.readFileSync(path.join(root, 'life/data/opendata/events.json'), 'utf8');
    fs.writeFileSync(path.join(temp, 'events.json'), original);
    const run = (date, fail, datasets = 'events') => spawnSync(process.execPath,
      ['--import', pathToFileURL(fixture).href, 'tools/fetch-opendata.mjs'], { cwd: root, encoding: 'utf8', env: {
        ...process.env, OPENDATA_OUTPUT_DIR: temp, OPENDATA_TEST_DATE: date,
        OPENDATA_FORCE_FAIL: fail, OPENDATA_DATASETS: datasets,
      } });
    const state = () => JSON.parse(fs.readFileSync(path.join(temp, '_status.json'), 'utf8')).datasets;
    assert.equal(run('2026-09-21', 'events').status, 1);
    assert.equal(state().events.consecutiveFailures, 1);
    assert.equal(state().events.consecutiveFailedWeeks, 1);
    assert.equal(run('2026-09-23', 'events').status, 1);
    assert.equal(state().events.consecutiveFailures, 2);
    assert.equal(state().events.consecutiveFailedWeeks, 1);
    assert.equal(run('2026-09-28', 'events').status, 1);
    assert.equal(state().events.consecutiveFailedWeeks, 2);
    assert.equal(fs.readFileSync(path.join(temp, 'events.json'), 'utf8'), original);
    assert.equal(run('2026-10-12', 'events').status, 1);
    assert.equal(state().events.consecutiveFailedWeeks, 1, 'an unobserved week breaks the consecutive-week claim');
    assert.equal(run('2026-10-12', 'wifi', 'events,wifi').status, 0);
    assert.equal(state().events.consecutiveFailures, 0);
    assert.equal(state().events.consecutiveFailedWeeks, 0);
    assert.equal(state().wifi.consecutiveFailures, 1);
    assert.equal(state().events.lastSuccess, '2026-10-12');
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});

test('alerts create once, comment on exact existing issue, and do nothing below two weeks', async () => {
  const calls = [];
  const run = (args, options) => { calls.push({ args, options }); return args[1] === 'list' ? '[]' : 'ok'; };
  const datasets = { events: { consecutiveFailedWeeks: 1 }, wifi: { consecutiveFailedWeeks: 2, consecutiveFailures: 3, lastAttempt: '2026-09-28', lastError: 'HTTP 404' } };
  await notifyFailures({ datasets }, run);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].args[1], 'create');
  assert.ok(calls[1].options.input.includes('wifi'));
  calls.length = 0;
  const existing = (args, options) => {
    calls.push({ args, options });
    return args[1] === 'list' ? JSON.stringify([{ number: 7, title: '[open-data] wifi: 2週以上の連続取得失敗' }]) : 'ok';
  };
  await notifyFailures({ datasets }, existing);
  assert.equal(calls[1].args[1], 'comment');
  assert.equal(calls[1].args[2], '7');
  calls.length = 0;
  await notifyFailures({ datasets: { events: datasets.events } }, run);
  assert.equal(calls.length, 0);
});
