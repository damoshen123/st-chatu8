// Added by YXQBYJQ with Codex assistance, 2026-10-04.
// Covered by the repository's Aladdin Free Public License; see ../LICENSE.
// Run: node --test tests/novelai-fallback.test.mjs
// No API keys, browser globals, real network traffic, or paid generations.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(
  process.env.NOVELAI_TEST_SOURCE ? resolve(process.env.NOVELAI_TEST_SOURCE) : new URL('../index.js', import.meta.url),
  'utf8'
);
const relay = 'https://relay.example.invalid';
const generationPath = '/ai/generate-image';
const generationUrl = `${relay}${generationPath}`;

function extractHelpers(text) {
  const normalizeStart = text.indexOf('function normalizeNovelAIOtherSiteUrl(value) {');
  const normalizeEnd = text.indexOf('function getDirectHeaders3(', normalizeStart);
  const fallbackStart = text.indexOf('var workingNovelAIUrlCache =');
  const fallbackEnd = text.indexOf('var activeAbortControllers =', fallbackStart);
  assert.ok(normalizeStart >= 0 && normalizeEnd > normalizeStart, 'URL normalizer not found');
  assert.ok(fallbackStart >= 0 && fallbackEnd > fallbackStart, 'Fallback helpers not found');
  // Only execute the actual production helpers, not the rest of the extension.
  return text.slice(normalizeStart, normalizeEnd) + text.slice(fallbackStart, fallbackEnd);
}

function response(status, body = '') {
  return { status, ok: status >= 200 && status < 300, text: async () => body };
}

function harness(replies, { otherSite = relay, site = '其他站点' } = {}) {
  const calls = [];
  const logs = [];
  const sleeps = [];
  const settings = { novelaisite: site, novelaiOtherSite: otherSite };
  const context = vm.createContext({
    extensionName: 'st-chatu8',
    extension_settings62: { 'st-chatu8': settings },
    addLog: (message) => logs.push(message),
    sleep: async (ms) => { sleeps.push(ms); },
    fetch: async (url, options) => {
      calls.push({ url, options });
      const reply = replies[calls.length - 1];
      assert.ok(reply, `Unexpected request to ${url}`);
      if (reply instanceof Error) throw reply;
      return reply;
    },
  });
  vm.runInContext(extractHelpers(source), context, { timeout: 1000 });
  return { context, settings, calls, logs, sleeps };
}

function post(h, { endpointPath = generationPath, signal } = {}) {
  return h.context.postNovelAIWithFallback({
    ...h.context.getNovelAICandidateUrls(endpointPath),
    endpointPath,
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
    signal,
  });
}

for (const status of [400, 401, 402, 403, 408, 409, 422, 429, 500, 502, 503, 504]) {
  test(`HTTP ${status} stops fallback and preserves the original server reason`, async () => {
    const message = `original-error-${status}`;
    const h = harness([
      response(status, JSON.stringify({ error: { message } })),
      response(405, '{"detail":"Method Not Allowed"}'),
    ]);
    await assert.rejects(post(h), (error) => {
      assert.match(error.message, new RegExp(`HTTP ${status}`));
      assert.ok(error.message.includes(message));
      assert.ok(!error.message.includes('405'));
      return true;
    });
    assert.deepEqual(h.calls.map(({ url }) => url), [generationUrl]);
    assert.equal(h.sleeps.length, 0);
    assert.ok(h.logs.some((message) => message.includes(`HTTP ${status}`) && message.includes(`original-error-${status}`)));
  });
}

for (const status of [404, 405]) {
  test(`HTTP ${status} still falls back to a direct endpoint and caches it`, async () => {
    const success = response(200);
    success.text = async () => { throw new Error('Successful binary response must not be read as text'); };
    const h = harness([response(status, 'Path mismatch'), success, response(200)]);
    assert.equal(await post(h), success);
    assert.deepEqual(h.calls.map(({ url }) => url), [generationUrl, relay]);
    assert.deepEqual(Array.from(h.context.getNovelAICandidateUrls().candidates), [relay, generationUrl]);
    assert.equal((await post(h)).status, 200);
    assert.equal(h.calls[2].url, relay);
    h.context.clearNovelAIUrlCache();
    assert.equal(h.context.getNovelAICandidateUrls().candidates[0], generationUrl);
  });
}

test('Success returns the exact response and preserves POST options', async () => {
  const success = response(200);
  const signal = { aborted: false };
  const h = harness([success]);
  assert.equal(await post(h, { signal }), success);
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0].options.method, 'POST');
  assert.equal(h.calls[0].options.body, '{}');
  assert.equal(h.calls[0].options.headers['Content-Type'], 'application/json');
  assert.equal(h.calls[0].options.signal, signal);
});

test('Official site uses one candidate, independent of the other-site setting', async () => {
  const h = harness([response(429, '{"message":"official-rate-limit"}')], { site: '官网' });
  await assert.rejects(post(h), /HTTP 429.*official-rate-limit/);
  assert.deepEqual(h.calls.map(({ url }) => url), ['https://image.novelai.net/ai/generate-image']);
});

test('An explicit generate-image endpoint is not appended or retried', async () => {
  const h = harness([response(429, '{"detail":"quota exhausted"}')], { otherSite: generationUrl });
  await assert.rejects(post(h), /HTTP 429.*quota exhausted/);
  assert.deepEqual(h.calls.map(({ url }) => url), [generationUrl]);
});

test('Trailing slashes and spaces are normalized without changing root configuration', async () => {
  const h = harness([response(200)], { otherSite: `  ${relay}///  ` });
  await post(h);
  assert.equal(h.calls[0].url, generationUrl);
});

test('An empty other-site setting still reports a configuration error', () => {
  const h = harness([], { otherSite: '  ' });
  assert.throws(() => h.context.getNovelAICandidateUrls(), /novelaiOtherSite/);
});

for (const endpointPath of ['/ai/encode-vibe', '/ai/upscale', 'ai/generate-image']) {
  test(`${endpointPath} retains its own path and does not mask a quota error`, async () => {
    const h = harness([response(429, '{"detail":"limit reached"}')]);
    await assert.rejects(post(h, { endpointPath }), /HTTP 429.*limit reached/);
    assert.equal(h.calls.length, 1);
    assert.equal(h.calls[0].url, `${relay}/${endpointPath.replace(/^\/+/, '')}`);
  });
}

test('A cached direct endpoint also stops at its real 429 rather than trying the other URL', async () => {
  const h = harness([response(404), response(200), response(429, '{"message":"cached endpoint quota"}')]);
  await post(h);
  await assert.rejects(post(h), /HTTP 429.*cached endpoint quota/);
  assert.deepEqual(h.calls.map(({ url }) => url), [generationUrl, relay, relay]);
});

for (const [name, body, expected] of [
  ['flat message', '{"message":"flat error"}', 'flat error'],
  ['FastAPI detail', '{"detail":"detail error"}', 'detail error'],
  ['non-string nested message', '{"error":{"message":{}},"message":"valid flat error"}', 'valid flat error'],
  ['empty nested message', '{"error":{"message":"  "},"detail":"valid detail"}', 'valid detail'],
  ['plain text', 'upstream temporarily unavailable', 'upstream temporarily unavailable'],
  ['invalid JSON', '{invalid', '{invalid'],
  ['null JSON', 'null', 'null'],
  ['structured detail', '{"detail":[{"type":"validation"}]}', 'validation'],
]) {
  test(`Server error envelope: ${name}`, async () => {
    const h = harness([response(503, body)]);
    await assert.rejects(post(h), (error) => {
      assert.match(error.message, /HTTP 503/);
      assert.ok(error.message.includes(expected));
      return true;
    });
    assert.equal(h.calls.length, 1);
  });
}

test('Plain text authentication errors remain visible alongside HTTP 401', async () => {
  const h = harness([response(401, 'Key disabled by operator')]);
  await assert.rejects(post(h), /HTTP 401.*Key disabled by operator/);
  assert.equal(h.calls.length, 1);
});

test('An unreadable error body does not turn a 429 into a fallback request', async () => {
  const failure = response(429);
  failure.text = async () => { throw new Error('Body unavailable'); };
  const h = harness([failure]);
  await assert.rejects(post(h), /HTTP 429/);
  assert.equal(h.calls.length, 1);
});

test('The first path mismatch can fall back, but a real error at the fallback stops there', async () => {
  const h = harness([response(404), response(429, '{"detail":"daily quota reached"}')]);
  await assert.rejects(post(h), /HTTP 429.*daily quota reached/);
  assert.deepEqual(h.calls.map(({ url }) => url), [generationUrl, relay]);
});

test('Two path failures still produce the final HTTP 405 and server message', async () => {
  const h = harness([response(404), response(405, '{"detail":"Method Not Allowed"}')]);
  await assert.rejects(post(h), /HTTP 405.*Method Not Allowed/);
  assert.equal(h.calls.length, 2);
});

test('Aborted requests do not fall back or retry', async () => {
  const aborted = new Error('Request aborted');
  aborted.name = 'AbortError';
  const h = harness([aborted]);
  await assert.rejects(post(h, { signal: { aborted: true } }), (error) => error === aborted);
  assert.equal(h.calls.length, 1);
  assert.equal(h.sleeps.length, 0);
});

test('Existing network-error fallback behavior is unchanged', async () => {
  const success = response(200);
  const h = harness([new TypeError('Failed to fetch'), success]);
  assert.equal(await post(h), success);
  assert.deepEqual(h.calls.map(({ url }) => url), [generationUrl, relay]);
});

test('Existing final-candidate network retry is unchanged', async () => {
  const success = response(200);
  const h = harness([new TypeError('Failed to fetch'), success], { otherSite: generationUrl });
  assert.equal(await post(h), success);
  assert.deepEqual(h.calls.map(({ url }) => url), [generationUrl, generationUrl]);
  assert.deepEqual(h.sleeps, [1000]);
});
