// 复现并守住：非默认插入位置下，swipe 之后同楼层不再生成新媒体。
//
// 场景 = 用户的真实配置（mediaInsertPosition = bottom）。媒体被放进 .mes 层的
// .st-chatu8-media-slot；酒馆 swipe 只重写 mes_text.innerHTML，槽位连同旧视频残留下来，
// 而 getSavedImageMatches 开头的整层守卫（guardScope 正是 .mes）一看到它就 return []，
// 于是新回复的标签一个按钮都插不回来 —— 表现为「该楼层已经存在视频就不会发新的」。
//
// 修复前：主断言（swipe 后新标签插出按钮）必然失败。
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

const site = mkdtempSync(join(tmpdir(), 'chatu8-swipe-'));
const pub = join(site, 'public');
const extDir = join(pub, 'scripts', 'extensions', 'third-party', 'st-chatu8');
mkdirSync(extDir, { recursive: true });
mkdirSync(join(pub, 'lib'), { recursive: true });
cpSync(EXT, extDir, { recursive: true, filter: (s) => !/[\\/](?:\.git|node_modules|test)(?:$|[\\/])/.test(s) && !/\.bak-/.test(s) });
for (const lib of ['jquery-3.5.1.min.js', 'jquery-ui.min.js', 'toastr.min.js', 'eventemitter.js']) {
  copyFileSync(join(ST, 'public', 'lib', lib), join(pub, 'lib', lib));
}
copyFileSync(FIXTURE, join(pub, 'fixture.mp4'));

const write = (rel, content) => {
  const p = join(pub, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content, 'utf8');
};

write('script.js', `
import { EventEmitter } from './lib/eventemitter.js';
export const eventSource = new EventEmitter();
export const event_types = {
  APP_READY: 'app_ready', CHAT_CHANGED: 'chat_id_changed', MESSAGE_UPDATED: 'message_edited',
  MESSAGE_SWIPED: 'message_swiped', MESSAGE_RECEIVED: 'message_received', MESSAGE_EDITED: 'message_edited_before',
  MESSAGE_SENT: 'message_sent', CHARACTER_MESSAGE_RENDERED: 'character_message_rendered',
  USER_MESSAGE_RENDERED: 'user_message_rendered', GENERATION_STARTED: 'generation_started',
  GENERATION_ENDED: 'generation_ended', GENERATE_AFTER_COMBINE_PROMPTS: 'generate_after_combine_prompts',
  STREAM_TOKEN_RECEIVED: 'stream_token_received', CHAT_COMPLETION_SETTINGS_READY: 'chat_completion_settings_ready',
};
export const chat = window.__ST.chat;
export function messageFormatting(mes) { return mes; }
export function saveChat() {}
export function saveChatConditional() {}
export function saveChatDebounced() {}
export function saveMetadata() {}
export function reloadCurrentChat() {}
export function saveSettingsDebounced() {}
`);
write('scripts/extensions.js', `
export const extension_settings = window.__ST.extension_settings;
export const extensionTypes = { local: 'local', global: 'global', system: 'system' };
`);
write('scripts/st-context.js', `export function getContext() { return window.__ST.context; }`);
write('scripts/world-info.js', `export const world_info = {}; export const world_names = [];`);
write('lib/eventemitter.js', readFileSync(join(ST, 'public', 'lib', 'eventemitter.js'), 'utf8'));

const LINE_A = '她站在窗边，晚风把窗帘吹得鼓起来，屋里很安静。';
const LINE_B = '他推开门走进来，手里还提着那只旧皮箱，脚步很轻。';
const TAG_A = 'swipe回归-视频A';
const TAG_B = 'swipe回归-视频B';

write('test.html', `<!doctype html><html><head><meta charset="utf-8"><title>swipe</title></head><body>
<div id="top-settings-holder"></div><div id="extensions_settings"></div><div id="extensions_settings2"></div>
<div id="send_form"><div id="options"><a id="option_toggle_AN"></a></div><textarea id="send_textarea"></textarea><div id="send_but"></div></div>
<div id="chat">
  <div class="mes" mesid="0"><div class="mes_block"><div class="mes_text">${LINE_A}</div></div></div>
</div>
<pre id="result">PENDING</pre>
<script src="/lib/jquery-3.5.1.min.js"></script>
<script src="/lib/jquery-ui.min.js"></script>
<script src="/lib/toastr.min.js"></script>
<script src="/scripts/extensions/third-party/st-chatu8/crypto-js.min.js"></script>
<script>
window.hljs = { highlightElement: function () {}, highlight: function () { return { value: '' }; } };
window.token = 'swipe';
const LINE_A = ${JSON.stringify(LINE_A)};
const LINE_B = ${JSON.stringify(LINE_B)};
const TAG_A = ${JSON.stringify(TAG_A)};
const TAG_B = ${JSON.stringify(TAG_B)};

window.__ST = {
  // 第 0 条 swipe 已经有一个视频标签，正文是 LINE_A
  chat: [{
    mes: LINE_A, is_user: false, name: 'Tester', swipe_id: 0,
    swipes: [LINE_A, LINE_B],
    extra: { images: { 0: [{ tag: TAG_A, regex: LINE_A, endIndex: LINE_A.length }] } },
  }],
  extension_settings: { 'st-chatu8': {
    jiuguanchucun: 'false', cache: '1', scriptEnabled: 'true', startTag: 'image###', endTag: '###',
    mode: 'banana', zidongdianji: 'false', dbclike: 'false', insertOriginalText: 'true',
    // 关键：非默认插入位置，媒体会被放到 .mes 层的槽位里
    mediaInsertPosition: 'bottom',
  } },
  context: { chat: [], chatId: 'swipe', chatMetadata: { variables: {} }, name2: 'Tester', characters: [], characterId: 0,
    groupId: null, groups: [], getRequestHeaders: function () { return { 'Content-Type': 'application/json' }; },
    saveSettingsDebounced: function () {}, saveMetadata: function () {}, substituteParams: function (s) { return s; } },
};
window.__ST.context.chat = window.__ST.chat;

const results = [];
const push = (name, ok, detail) => results.push({ name: name, ok: ok, detail: detail || '' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const mes = () => document.querySelector('#chat .mes[mesid="0"]');
const mesText = () => document.querySelector('#chat .mes_text');
const buttons = () => document.querySelectorAll('#chat button.image-tag-button');
const slots = () => mes().querySelectorAll('.st-chatu8-media-slot');
const waitFor = async (fn, ms) => {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) { if (fn()) return true; await sleep(250); }
  return false;
};

// 按扩展自己的库结构预置「标签 A 已经生成过的视频」
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
async function seed() {
  const bytes = await (await fetch('/fixture.mp4')).arrayBuffer();
  const db = await openGallery();
  const md5 = CryptoJS.MD5(TAG_A).toString();
  await put(db, { id: 'swipe-uuid-a', data: bytes });
  const metadata = {};
  metadata[md5] = {
    images: [{ uuid: 'swipe-uuid-a', thumbnail_uuid: 'swipe-thumb-a', date: Date.now(), isVideo: true, format: 'video/mp4', originalUrl: '/fixture.mp4', size: bytes.byteLength, thumbnail_size: 0 }],
    index: 0, change: '',
  };
  await put(db, { id: 'tupianshuju', shuju: JSON.stringify(metadata) });
  db.close();
}

(async () => {
  try {
    await seed();
    let loadError = null;
    try { await import('/scripts/extensions/third-party/st-chatu8/index.js'); }
    catch (e) { loadError = (e && (e.stack || e.message)) || String(e); }
    push('真实 index.js 加载成功', loadError === null, loadError ? String(loadError).slice(0, 300) : '');

    // ---- 前提：非默认插入位置下，媒体确实进了 .mes 层的槽位 ----
    const gotSlot = await waitFor(() => slots().length > 0 && slots()[0].querySelector('video'), 20000);
    push('前提：媒体渲染进 .mes 层的 .st-chatu8-media-slot（非默认插入位置）',
      gotSlot, '槽位数=' + slots().length);
    const slotA = slots()[0] || null;

    // ---- 模拟酒馆 swipe：只重写 mes_text.innerHTML，槽位留在 .mes 上 ----
    const st = await import('/script.js');
    window.__ST.chat[0].swipe_id = 1;
    window.__ST.chat[0].mes = LINE_B;
    window.__ST.chat[0].extra.images[1] = [{ tag: TAG_B, regex: LINE_B, endIndex: LINE_B.length }];
    mesText().innerHTML = LINE_B;          // 酒馆 updateMessageBlock 就是这么干的
    await st.eventSource.emit(st.event_types.MESSAGE_SWIPED, 0);

    push('swipe 后旧槽位仍挂在 .mes 上（酒馆只重写了 mes_text）',
      slotA !== null && mes().contains(slotA), '');

    // ---- 主断言：新回复的标签必须能插出按钮（修复前这里恒为 0）----
    const gotButton = await waitFor(() => {
      for (const b of buttons()) if (b.dataset.link === TAG_B) return true;
      return false;
    }, 25000);
    push('swipe 后新标签插出了「生成图片」按钮（核心）', gotButton,
      '当前按钮: ' + Array.from(buttons()).map((b) => b.dataset.link).join(', ') || '(一个都没有)');

    // ---- 孤儿槽位应被清理，楼层里不该继续挂着上一条 swipe 的视频 ----
    push('上一条 swipe 的孤儿槽位已被清理', slotA !== null && !mes().contains(slotA),
      '楼层现存槽位=' + slots().length);

    // ---- 防重复：连跑多轮重扫，按钮与媒体容器数量都不能增长 ----
    const btnCount = () => Array.from(buttons()).filter((b) => b.dataset.link === TAG_B).length;
    const before = { btn: btnCount(), media: mes().querySelectorAll('.st-chatu8-image-container').length };
    await sleep(13000);      // chenk 每 4 秒重扫一次，这里至少跑 3 轮
    const after = { btn: btnCount(), media: mes().querySelectorAll('.st-chatu8-image-container').length };
    push('连续多轮重扫不重复插入按钮/媒体',
      after.btn === before.btn && after.media === before.media,
      JSON.stringify(before) + ' → ' + JSON.stringify(after));
  } catch (e) {
    push('测试自身异常', false, (e && (e.stack || e.message)) || String(e));
  }
  document.getElementById('result').textContent = JSON.stringify(results);
  try { await fetch('/result', { method: 'POST', body: JSON.stringify(results) }); } catch (e) {}
})();
</script></body></html>`);

const MIME = { '.js': 'text/javascript; charset=utf-8', '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.mp4': 'video/mp4', '.png': 'image/png' };
let resolveResult;
const resultPromise = new Promise((r) => { resolveResult = r; });
const missed = [];
const server = createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]);
  if (req.method === 'POST' && rel === '/result') {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      res.writeHead(204).end();
      try { resolveResult(JSON.parse(body)); } catch (e) { resolveResult([{ name: '结果解析失败', ok: false, detail: body.slice(0, 400) }]); }
    });
    return;
  }
  if (rel === '/csrf-token') { res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ token: 'swipe' })); return; }
  if (rel === '/favicon.ico') { res.writeHead(204).end(); return; }
  const file = join(pub, rel === '/' ? 'test.html' : rel);
  try {
    const buf = readFileSync(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' }).end(buf);
  } catch (e) { missed.push(rel); res.writeHead(404).end('not found'); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const profile = mkdtempSync(join(tmpdir(), 'chatu8-swipe-profile-'));
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--autoplay-policy=no-user-gesture-required', '--mute-audio', '--window-size=1200,900',
  `--user-data-dir=${profile}`, `http://127.0.0.1:${port}/`,
], { stdio: 'ignore' });

const results = await Promise.race([resultPromise, new Promise((r) => setTimeout(() => r(null), 180000))]);
chrome.kill();
server.close();
try { rmSync(profile, { recursive: true, force: true }); } catch (e) {}
try { rmSync(site, { recursive: true, force: true }); } catch (e) {}

if (missed.length) console.log('未命中的静态请求:', [...new Set(missed)].join(', '));
if (!results) { console.log('FAIL  浏览器在 180 秒内没有回报结果'); process.exit(1); }
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? '  — ' + r.detail : ''}`);
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} 通过`);
process.exit(failed.length ? 1 : 0);
