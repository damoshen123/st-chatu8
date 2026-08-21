// 在真实 DOM 里验证新增的 hydrateMissingMedia 编排逻辑：
// 该补的补上、该跳过的跳过、刚发起的生成不被误复位、iframe 里的锚点也覆盖、并发不重入。
// hasRenderedMedia / resolveMediaContainer / collectMediaDocuments 用 index.js 里的真实实现；
// createAndShowImage / getItemImg / getInsertMode 是既有的成熟函数，这里 stub 掉以隔离编排逻辑。
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const src = readFileSync(new URL('../index.js', import.meta.url), 'utf8');
function extract(signature) {
  const start = src.indexOf(signature);
  if (start === -1) throw new Error(`未在 index.js 中找到 ${signature}`);
  let depth = 0;
  for (let i = src.indexOf('{', start); i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(start, i + 1); }
  }
  throw new Error(`未能定界 ${signature}`);
}
const realFns = [
  extract('function collectMediaDocuments('),
  extract('function hasRenderedMedia('),
  extract('function resolveMediaContainer('),
  extract('async function hydrateMissingMedia('),
].join('\n');
const HYDRATE_MIN_LOADING_AGE_MS = Number(/var HYDRATE_MIN_LOADING_AGE_MS = ([^;]+);/.exec(src)[1].replace('* 1e3', '* 1000').split('*').reduce((a, b) => a * Number(b), 1));

const PAGE = `<!doctype html><html><head><meta charset="utf-8"></head><body>
<div id="chat"></div><pre id="result">PENDING</pre>
<script>
// ---- 被测代码（真实实现，从 index.js 抽取）----
var hydrateState = { running: false };
var HYDRATE_MIN_LOADING_AGE_MS = ${HYDRATE_MIN_LOADING_AGE_MS};
var extensionName = 'st-chatu8';
var extension_settings40 = { 'st-chatu8': { dbclike: 'false' } };
function addLog() {}
${realFns}
// ---- stub：既有成熟函数，隔离掉以只测编排 ----
var DB = {};                 // link -> [imageUrl, change, index, isVideo, originalUrl]
var getItemImgCalls = [];
async function getItemImg(link) {
  getItemImgCalls.push(link);
  return DB[link] || [false, false, false, false];
}
function getInsertMode() { return 'default'; }
var createCalls = [];
function createAndShowImage(container, imageUrl, alt, button, change, isVideo, originalUrl) {
  createCalls.push({ imageUrl: imageUrl, isVideo: !!isVideo, originalUrl: originalUrl || '' });
  const el = container.ownerDocument.createElement(isVideo ? 'video' : 'img');
  el.className = 'st-chatu8-fake-media';
  container.replaceChildren(el);
}
// ---- 测试装置 ----
function makeFloor(doc, host, requestId, link, opts) {
  opts = opts || {};
  const mes = doc.createElement('div');
  mes.className = 'mes';
  const mesText = doc.createElement('div');
  mesText.className = 'mes_text';
  const btn = doc.createElement('button');
  btn.className = 'image-tag-button st-chatu8-image-button';
  btn.dataset.link = link;
  btn.dataset.requestId = requestId;
  btn.textContent = '加载中...';
  if (opts.loading !== false) {
    btn.setAttribute('data-loading', 'true');
    btn.dataset.loadingSince = String(Date.now() - (opts.ageMs === undefined ? 120000 : opts.ageMs));
  }
  const span = doc.createElement('span');
  span.className = 'st-chatu8-image-span';
  span.dataset.requestId = requestId;
  if (opts.prefilled) {
    const img = doc.createElement('img');
    img.className = 'st-chatu8-existing';
    span.appendChild(img);
  }
  mesText.appendChild(btn);
  mesText.appendChild(span);
  mes.appendChild(mesText);
  host.appendChild(mes);
  return { mes: mes, btn: btn, span: span };
}
async function run() {
  const out = [];
  const push = (name, ok, detail) => out.push({ name: name, ok: ok, detail: detail || '' });
  const chat = document.getElementById('chat');
  try {
    // 1) 空锚点 + 库里有数据 → 补渲染并复位按钮（这正是「必须刷新才显示」的那个状态）
    DB['视频A'] = ['data:video/mp4;base64,AAAA', '', 0, true, 'http://127.0.0.1:6888/files/a.mp4'];
    const f1 = makeFloor(document, chat, 'rid-1', '视频A', {});
    let filled = await hydrateMissingMedia();
    push('空锚点 + 库里有数据 → 补渲染',
      filled === 1 && f1.span.querySelector('video.st-chatu8-fake-media') !== null,
      'filled=' + filled);
    push('补渲染后按钮被复位（不再转圈）',
      !f1.btn.hasAttribute('data-loading') && f1.btn.textContent === '生成图片',
      'loading=' + f1.btn.hasAttribute('data-loading') + ' text=' + f1.btn.textContent);
    push('视频的 originalUrl 被透传给渲染（播放失败可回退 HTTP 直链）',
      createCalls.length === 1 && createCalls[0].isVideo === true && /files\\/a\\.mp4$/.test(createCalls[0].originalUrl),
      JSON.stringify(createCalls[0] || null));

    // 2) 幂等：再跑一次不应重复插入
    const before = createCalls.length;
    filled = await hydrateMissingMedia();
    push('已渲染的锚点不再重复插入（幂等）',
      filled === 0 && createCalls.length === before,
      'filled=' + filled + ' createCalls=' + createCalls.length);

    // 3) 楼层里本来就有媒体 → 完全不碰，也不该去查库
    chat.replaceChildren();
    DB['图B'] = ['data:image/png;base64,AAAA', '', 0, false, ''];
    const f3 = makeFloor(document, chat, 'rid-3', '图B', { prefilled: true });
    getItemImgCalls.length = 0;
    filled = await hydrateMissingMedia();
    push('锚点已有媒体 → 跳过且不查库',
      filled === 0 && getItemImgCalls.length === 0 && f3.span.querySelector('img.st-chatu8-existing') !== null,
      'filled=' + filled + ' 查库次数=' + getItemImgCalls.length);

    // 4) 刚发起的生成（转圈不到 20s）→ 可以补渲染，但不能把按钮判成完成
    chat.replaceChildren();
    DB['视频C'] = ['data:video/mp4;base64,AAAA', '', 0, true, ''];
    const f4 = makeFloor(document, chat, 'rid-4', '视频C', { ageMs: 2000 });
    filled = await hydrateMissingMedia();
    push('刚发起的生成 → 补渲染但按钮保持转圈（不误判完成）',
      filled === 1 && f4.btn.hasAttribute('data-loading') && f4.btn.textContent === '加载中...',
      'filled=' + filled + ' loading=' + f4.btn.hasAttribute('data-loading') + ' text=' + f4.btn.textContent);

    // 5) 库里没有数据 → 一点 DOM 都不该动
    chat.replaceChildren();
    const f5 = makeFloor(document, chat, 'rid-5', '不存在的标签', {});
    filled = await hydrateMissingMedia();
    push('库里没有数据 → 不动 DOM、按钮继续转圈',
      filled === 0 && f5.span.childElementCount === 0 && f5.btn.hasAttribute('data-loading'),
      'filled=' + filled + ' spanChildren=' + f5.span.childElementCount);

    // 6) iframe 里的锚点同样要覆盖
    chat.replaceChildren();
    const frame = document.createElement('iframe');
    document.body.appendChild(frame);
    await new Promise((r) => setTimeout(r, 50));
    const fdoc = frame.contentDocument;
    fdoc.body.innerHTML = '';
    DB['视频D'] = ['data:video/mp4;base64,AAAA', '', 0, true, ''];
    const f6 = makeFloor(fdoc, fdoc.body, 'rid-6', '视频D', {});
    filled = await hydrateMissingMedia();
    push('iframe 内的锚点也能补上',
      filled === 1 && f6.span.querySelector('video.st-chatu8-fake-media') !== null,
      'filled=' + filled);

    // 7) 并发不重入：第二次调用必须立刻返回 0，不重复补
    chat.replaceChildren();
    fdoc.body.innerHTML = '';
    DB['视频E'] = ['data:video/mp4;base64,AAAA', '', 0, true, ''];
    makeFloor(document, chat, 'rid-7', '视频E', {});
    const both = await Promise.all([hydrateMissingMedia(), hydrateMissingMedia()]);
    push('并发调用不重入',
      (both[0] === 1 && both[1] === 0) || (both[0] === 0 && both[1] === 1),
      JSON.stringify(both));
  } catch (e) {
    push('测试自身异常', false, (e && (e.stack || e.message)) || String(e));
  }
  document.getElementById('result').textContent = JSON.stringify(out);
  try { await fetch('/result', { method: 'POST', body: JSON.stringify(out) }); } catch (e) {}
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
      try { resolveResult(JSON.parse(body)); } catch (e) { resolveResult([{ name: '结果解析失败', ok: false, detail: body.slice(0, 300) }]); }
    });
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(PAGE);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const profile = mkdtempSync(join(tmpdir(), 'chatu8-hydrate-'));
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--user-data-dir=${profile}`, `http://127.0.0.1:${port}/`,
], { stdio: 'ignore' });

const results = await Promise.race([resultPromise, new Promise((r) => setTimeout(() => r(null), 60000))]);
chrome.kill();
server.close();
try { rmSync(profile, { recursive: true, force: true }); } catch (e) {}

if (!results) { console.log('FAIL  浏览器在 60 秒内没有回报结果'); process.exit(1); }
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? '  — ' + r.detail : ''}`);
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} 通过`);
process.exit(failed.length ? 1 : 0);
