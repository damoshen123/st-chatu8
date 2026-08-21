// 端到端：让真实的 index.js（未裁剪的完整 bundle）在浏览器里跑起来，用真实的 jQuery /
// toastr / SillyTavern EventEmitter，只 stub 那 15 个模块导出符号，然后复现用户报告的状态：
//   「按钮在转圈、锚点是空的、结果其实已经落库」—— 修复后必须自动补上，无需刷新页面。
// 同时验证真实 mp4 能被解码播放（走的是 blob + fixMp4Faststart 那条真实路径）。
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, cpSync, mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join, dirname, extname } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ST = 'C:\\Users\\P7XXTM1-G\\Downloads\\tavern_helper_template-main\\_tmp_sillytavern_release\\SillyTavern-release';
const EXT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURE = 'C:\\Users\\P7XXTM1-G\\Downloads\\runninghub\\data\\images\\4dd31e52-f71b-4439-b378-062980e1f689\\ComfyUI_ZIP_video_00000.mp4';

for (const p of [CHROME, join(ST, 'public', 'lib', 'jquery-3.5.1.min.js'), FIXTURE]) {
  if (!existsSync(p)) throw new Error(`缺少依赖: ${p}`);
}

// ---------- 搭一个最小的 SillyTavern 目录布局，让扩展的相对 import 能解析 ----------
const site = mkdtempSync(join(tmpdir(), 'chatu8-e2e-'));
const pub = join(site, 'public');
const extDir = join(pub, 'scripts', 'extensions', 'third-party', 'st-chatu8');
mkdirSync(extDir, { recursive: true });
mkdirSync(join(pub, 'lib'), { recursive: true });
cpSync(EXT, extDir, {
  recursive: true,
  filter: (s) => !/[\\/](?:\.git|node_modules|test)(?:$|[\\/])/.test(s) && !/\.bak-/.test(s),
});
for (const lib of ['jquery-3.5.1.min.js', 'jquery-ui.min.js', 'toastr.min.js', 'eventemitter.js']) {
  copyFileSync(join(ST, 'public', 'lib', lib), join(pub, 'lib', lib));
}
copyFileSync(FIXTURE, join(pub, 'fixture.mp4'));

const write = (rel, content) => {
  const p = join(pub, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content, 'utf8');
};

// ---------- 15 个模块导出符号的 stub ----------
write('script.js', `
import { EventEmitter } from './lib/eventemitter.js';
export const eventSource = new EventEmitter();
export const event_types = {
  APP_READY: 'app_ready',
  CHAT_CHANGED: 'chat_id_changed',
  MESSAGE_UPDATED: 'message_edited',
  MESSAGE_SWIPED: 'message_swiped',
  MESSAGE_RECEIVED: 'message_received',
  MESSAGE_EDITED: 'message_edited_before',
  MESSAGE_SENT: 'message_sent',
  CHARACTER_MESSAGE_RENDERED: 'character_message_rendered',
  USER_MESSAGE_RENDERED: 'user_message_rendered',
  GENERATION_STARTED: 'generation_started',
  GENERATION_ENDED: 'generation_ended',
  GENERATE_AFTER_COMBINE_PROMPTS: 'generate_after_combine_prompts',
  STREAM_TOKEN_RECEIVED: 'stream_token_received',
  CHAT_COMPLETION_SETTINGS_READY: 'chat_completion_settings_ready',
};
export const chat = window.__ST.chat;
export function messageFormatting(mes) { return mes; }
export function saveChat() {}
export function saveChatConditional() {}
export function saveChatDebounced() {}
export function saveMetadata() {}
export function reloadCurrentChat() {}
export function saveSettingsDebounced() { window.__ST.saveSettingsCalls++; }
`);
write('scripts/extensions.js', `
export const extension_settings = window.__ST.extension_settings;
export const extensionTypes = { local: 'local', global: 'global', system: 'system' };
`);
write('scripts/st-context.js', `
export function getContext() { return window.__ST.context; }
`);
write('scripts/world-info.js', `
export const world_info = {};
export const world_names = [];
`);

// ---------- 测试页 ----------
write('test.html', `<!doctype html><html><head><meta charset="utf-8"><title>e2e</title></head><body>
<div id="top-settings-holder"></div>
<div id="extensions_settings"></div>
<div id="extensions_settings2"></div>
<div id="send_form"><div id="options"><a id="option_toggle_AN"></a></div><textarea id="send_textarea"></textarea><div id="send_but"></div></div>
<div id="chat"></div>
<pre id="result">PENDING</pre>
<script src="/lib/jquery-3.5.1.min.js"></script>
<script src="/lib/jquery-ui.min.js"></script>
<script src="/lib/toastr.min.js"></script>
<script src="/scripts/extensions/third-party/st-chatu8/crypto-js.min.js"></script>
<script>
window.hljs = { highlightElement: function () {}, highlight: function () { return { value: '' }; } };
window.token = 'test-token';
window.__ST = {
  chat: [],
  saveSettingsCalls: 0,
  // jiuguanchucun=false → 走 IndexedDB 分支，和用户「酒馆存储」路径共用同一段收尾逻辑，
  // 但不需要真的酒馆服务端；其余字段交给扩展自己的默认值 merge 补全。
  extension_settings: { 'st-chatu8': { jiuguanchucun: 'false', cache: '1', scriptEnabled: 'true', startTag: 'image###', endTag: '###', mode: 'banana', zidongdianji: 'false' } },
  context: {
    chat: [], chatId: 'e2e', chatMetadata: { variables: {} }, name2: 'Tester',
    characters: [], characterId: 0, groupId: null, groups: [],
    getRequestHeaders: function () { return { 'Content-Type': 'application/json' }; },
    eventSource: null, eventTypes: {}, extensionSettings: {},
    saveSettingsDebounced: function () {}, saveMetadata: function () {},
    substituteParams: function (s) { return s; }, generateQuietPrompt: function () { return Promise.resolve(''); },
  },
};
window.__ST.context.chat = window.__ST.chat;

const TAG = 'e2e 视频标签';
const results = [];
const push = (name, ok, detail) => results.push({ name: name, ok: ok, detail: detail || '' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const report = async () => {
  document.getElementById('result').textContent = JSON.stringify(results);
  try { await fetch('/result', { method: 'POST', body: JSON.stringify(results) }); } catch (e) {}
};

// 按扩展自己的库结构预置一条「已落库的视频」：dbName=chatu8_gallery, store=tupianhuancun,
// 元数据存在固定 id 'tupianshuju' 里。这样扩展的 getItemImg 就能原样读到。
function openGallery() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('chatu8_gallery', 6);
    req.onupgradeneeded = (e) => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains('tupianhuancun')) d.createObjectStore('tupianhuancun', { keyPath: 'id' });
      if (!d.objectStoreNames.contains('vocabularies')) d.createObjectStore('vocabularies', { keyPath: 'fileName' });
      if (!d.objectStoreNames.contains('groups')) d.createObjectStore('groups', { keyPath: 'id_index' }).createIndex('fileName', 'fileName', { unique: false });
      if (!d.objectStoreNames.contains('subgroups')) d.createObjectStore('subgroups', { keyPath: 'id_index' }).createIndex('fileName', 'fileName', { unique: false });
      if (!d.objectStoreNames.contains('tags')) {
        const s = d.createObjectStore('tags', { autoIncrement: true });
        s.createIndex('fileName', 'fileName', { unique: false });
        s.createIndex('hot', 'hot', { unique: false });
      }
    };
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('blocked'));
    req.onsuccess = (e) => resolve(e.target.result);
  });
}
function put(db, value) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['tupianhuancun'], 'readwrite');
    const r = tx.objectStore('tupianhuancun').put(value);
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
    tx.onabort = () => reject(tx.error || new Error('abort'));
  });
}
async function seedVideoIntoDb() {
  const bytes = await (await fetch('/fixture.mp4')).arrayBuffer();
  const db = await openGallery();
  const md5 = CryptoJS.MD5(TAG).toString();
  const uuid = 'e2e-uuid-1';
  await put(db, { id: uuid, data: bytes });
  const metadata = {};
  metadata[md5] = {
    images: [{ uuid: uuid, thumbnail_uuid: 'e2e-thumb-1', date: Date.now(), isVideo: true, format: 'video/mp4', originalUrl: '/fixture.mp4', size: bytes.byteLength, thumbnail_size: 0 }],
    index: 0, change: '',
  };
  await put(db, { id: 'tupianshuju', shuju: JSON.stringify(metadata) });
  db.close();
  return bytes.byteLength;
}

// 复现用户遇到的状态：按钮在转圈、锚点是空的、结果其实已经落库。
function buildStuckFloor() {
  const requestId = 'chatu8-id-e2e';
  const mes = document.createElement('div');
  mes.className = 'mes';
  mes.setAttribute('mesid', '0');
  const mesText = document.createElement('div');
  mesText.className = 'mes_text';
  const btn = document.createElement('button');
  btn.className = 'image-tag-button st-chatu8-image-button';
  btn.dataset.link = TAG;
  btn.dataset.requestId = requestId;
  btn.dataset.imageTag = TAG;
  btn.setAttribute('data-loading', 'true');
  btn.dataset.loadingSince = String(Date.now() - 180000);
  btn.textContent = '加载中...';
  const span = document.createElement('span');
  span.className = 'st-chatu8-image-span';
  span.dataset.requestId = requestId;
  mesText.appendChild(btn);
  mesText.appendChild(span);
  mes.appendChild(mesText);
  document.getElementById('chat').appendChild(mes);
  return { btn: btn, span: span };
}

(async () => {
  let loadError = null;
  try {
    const size = await seedVideoIntoDb();
    push('预置一条已落库的真实视频', size > 100000, size + ' 字节');

    // 加载真实的、未裁剪的扩展 bundle
    try {
      await import('/scripts/extensions/third-party/st-chatu8/index.js');
    } catch (e) {
      loadError = (e && (e.stack || e.message)) || String(e);
    }
    push('真实 index.js 在浏览器中加载成功', loadError === null, loadError ? String(loadError).slice(0, 300) : '');

    // 等扩展初始化（main() 里有 setTimeout/setInterval 的启动步骤）
    await sleep(6000);

    const registered = Object.keys(window.__ST_EVENTS || {});
    push('扩展已注册消息渲染类事件监听（补渲染的触发时机）',
      ['character_message_rendered', 'user_message_rendered', 'message_edited', 'message_swiped', 'chat_id_changed'].every((e) => registered.indexOf(e) !== -1),
      '已注册: ' + registered.join(', '));

    const floor = buildStuckFloor();
    push('已复现「按钮转圈 + 锚点为空 + 数据已落库」的状态',
      floor.btn.hasAttribute('data-loading') && floor.span.childElementCount === 0, '');

    // 关键断言：以前这里只能靠刷新页面；现在一个消息渲染事件就该把媒体补回来。
    const { eventSource, event_types } = await import('/script.js');
    await eventSource.emit(event_types.CHARACTER_MESSAGE_RENDERED, 0);
    let video = null;
    for (let i = 0; i < 60; i++) {
      await sleep(250);
      video = floor.span.querySelector('video');
      if (video) break;
    }
    push('消息渲染事件触发后自动补出视频（无需刷新页面）', video !== null, video ? '已出现 <video>' : '20 秒内没有出现 video 元素');
    push('补渲染后按钮不再转圈',
      !floor.btn.hasAttribute('data-loading'),
      'loading=' + floor.btn.hasAttribute('data-loading') + ' text=' + floor.btn.textContent);

    if (video) {
      // 真实 mp4 必须能被解码：这条路径经过 _dataUrlToBlob + fixMp4Faststart + blob URL。
      let meta = false;
      for (let i = 0; i < 40; i++) {
        if (video.readyState >= 1 && video.videoWidth > 0) { meta = true; break; }
        await sleep(250);
      }
      push('补出的视频能被浏览器解码（真实 mp4 可播放）', meta,
        'readyState=' + video.readyState + ' ' + video.videoWidth + 'x' + video.videoHeight + ' src=' + String(video.src).slice(0, 24));
    }
  } catch (e) {
    push('测试自身异常', false, (e && (e.stack || e.message)) || String(e));
  }
  await report();
})();
</script></body></html>`);

// eventSource 的注册要能被观察到：包一层，把注册过的事件名记到 window 上。
write('lib/eventemitter.js', readFileSync(join(ST, 'public', 'lib', 'eventemitter.js'), 'utf8').replace(
  'EventEmitter.prototype.on = function (event, listener) {',
  `EventEmitter.prototype.on = function (event, listener) {
    try { window.__ST_EVENTS = window.__ST_EVENTS || {}; window.__ST_EVENTS[event] = (window.__ST_EVENTS[event] || 0) + 1; } catch (e) {}`,
));

// ---------- 静态服务 + Chrome ----------
const MIME = { '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.mp4': 'video/mp4', '.map': 'application/json' };
let resolveResult;
const resultPromise = new Promise((r) => { resolveResult = r; });
const consoleLines = [];
const server = createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/result') {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      res.writeHead(204).end();
      try { resolveResult(JSON.parse(body)); } catch (e) { resolveResult([{ name: '结果解析失败', ok: false, detail: body.slice(0, 400) }]); }
    });
    return;
  }
  const rel = decodeURIComponent(req.url.split('?')[0]);
  // 扩展启动时会取 CSRF token，取不到就直接 throw 掉整个初始化 —— 真实酒馆有这个端点。
  if (rel === '/csrf-token') {
    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ token: 'e2e-csrf' }));
    return;
  }
  if (rel === '/favicon.ico') { res.writeHead(204).end(); return; }
  const file = join(pub, rel === '/' ? 'test.html' : rel);
  try {
    const buf = readFileSync(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' }).end(buf);
  } catch (e) {
    consoleLines.push('404 ' + rel);
    res.writeHead(404).end('not found');
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const profile = mkdtempSync(join(tmpdir(), 'chatu8-e2e-profile-'));
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--autoplay-policy=no-user-gesture-required', '--mute-audio',
  `--user-data-dir=${profile}`, `http://127.0.0.1:${port}/`,
], { stdio: 'ignore' });

const results = await Promise.race([resultPromise, new Promise((r) => setTimeout(() => r(null), 120000))]);
chrome.kill();
server.close();
try { rmSync(profile, { recursive: true, force: true }); } catch (e) {}
try { rmSync(site, { recursive: true, force: true }); } catch (e) {}

if (consoleLines.length) console.log('未命中的静态请求:', [...new Set(consoleLines)].join(', '));
if (!results) { console.log('FAIL  浏览器在 120 秒内没有回报结果'); process.exit(1); }
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? '  — ' + r.detail : ''}`);
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} 通过`);
process.exit(failed.length ? 1 : 0);
