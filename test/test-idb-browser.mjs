// 真实浏览器里验证改后的 IndexedDB 包装：正常路径没被改坏（含 5MB 视频级数据往返），
// 真实 transaction.abort() 会 reject 而不是挂起，openDB 被旧连接阻塞时会 reject。
// 测试页把结果 POST 回本地服务，避免 --dump-dom 的时机问题。
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const src = readFileSync(new URL('../index.js', import.meta.url), 'utf8');
const start = src.indexOf('function awaitIdbRequest(');
if (start === -1) throw new Error('未在 index.js 中找到 awaitIdbRequest');
let depth = 0, end = -1;
for (let i = src.indexOf('{', start); i < src.length; i++) {
  if (src[i] === '{') depth++;
  else if (src[i] === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
}
const awaitIdbRequestSrc = src.slice(start, end);

const PAGE = `<!doctype html><html><head><meta charset="utf-8"></head><body><pre id="result">PENDING</pre>
<script>
${awaitIdbRequestSrc}
const DB = 'chatu8_hangguard_test_' + Math.random().toString(36).slice(2);
const STORE = 'store';
function openTestDB(name, version) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, version);
    req.onupgradeneeded = (e) => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('IndexedDB 打开被阻塞'));
    req.onsuccess = (e) => resolve(e.target.result);
  });
}
async function run() {
  const out = [];
  const push = (name, ok, detail) => out.push({ name: name, ok: ok, detail: detail || '' });
  let db = null;
  try {
    db = await openTestDB(DB, 1);
    const size = 5 * 1024 * 1024;
    const buf = new Uint8Array(size);
    buf[0] = 7; buf[size - 1] = 9;
    let tx = db.transaction([STORE], 'readwrite');
    await awaitIdbRequest(tx, tx.objectStore(STORE).put({ id: 'vid', data: buf.buffer }), '写入 vid', 60000);
    tx = db.transaction([STORE], 'readonly');
    const got = await awaitIdbRequest(tx, tx.objectStore(STORE).get('vid'), '读取 vid', 30000);
    const view = new Uint8Array(got.data);
    push('5MB 视频级数据写入并读回一致', view.byteLength === size && view[0] === 7 && view[size - 1] === 9, view.byteLength + ' 字节');

    tx = db.transaction([STORE], 'readwrite');
    const p = awaitIdbRequest(tx, tx.objectStore(STORE).put({ id: 'x', data: 1 }), '写入 x', 5000);
    tx.abort();
    let msg = null;
    try { await p; } catch (e) { msg = e.message; }
    push('真实 transaction.abort() → reject 且不挂起', msg !== null, msg || '竟然 resolve 了');

    let blockedMsg = null;
    try { await openTestDB(DB, 2); } catch (e) { blockedMsg = e.message; }
    push('旧连接未关闭时升级 → onblocked 触发 reject', /阻塞/.test(blockedMsg || ''), blockedMsg || '竟然成功打开了');
  } catch (e) {
    push('测试自身异常', false, (e && e.message) || String(e));
  }
  if (db) { try { db.close(); } catch (e) {} }
  document.getElementById('result').textContent = JSON.stringify(out);
  try {
    await fetch('/result', { method: 'POST', body: JSON.stringify(out) });
  } catch (e) {}
}
run();
</script></body></html>`;

let resolveResult;
const resultPromise = new Promise((r) => { resolveResult = r; });
const server = createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/result') {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      res.writeHead(204).end();
      try { resolveResult(JSON.parse(body)); } catch (e) { resolveResult([{ name: '结果解析失败', ok: false, detail: body.slice(0, 200) }]); }
    });
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(PAGE);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const profile = mkdtempSync(join(tmpdir(), 'chatu8-idb-'));
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--user-data-dir=${profile}`, `http://127.0.0.1:${port}/`,
], { stdio: 'ignore' });

const timeout = new Promise((r) => setTimeout(() => r(null), 60000));
const results = await Promise.race([resultPromise, timeout]);

chrome.kill();
server.close();
try { rmSync(profile, { recursive: true, force: true }); } catch (e) {}

if (!results) {
  console.log('FAIL  浏览器在 60 秒内没有回报结果');
  process.exit(1);
}
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? '  — ' + r.detail : ''}`);
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} 通过`);
process.exit(failed.length ? 1 : 0);
