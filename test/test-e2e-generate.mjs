// 端到端第二场：走完整生成链路。场景 = 用户的真实配置：
// banana + useGrokFormat + 酒馆存储(jiuguanchucun=true)，mock 的 /v1/images/generations
// 按 OpenAI 契约回传真实媒体的 b64_json。三种模式：
//   --stuck （默认）/api/images/upload 永不响应，精确复刻「结果已拿到、存库却挂住」——
//            修复前 emit 永远发不出、按钮永远转圈；修复后应在 20 秒放行阈值后照常显示。
//   --normal 存库一切正常，用来确认修复没有给正常路径引入额外等待。
//   --image  同 normal，但生成的是图片，确认图片路径没有被改动影响。
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

const site = mkdtempSync(join(tmpdir(), 'chatu8-gen-'));
const pub = join(site, 'public');
const extDir = join(pub, 'scripts', 'extensions', 'third-party', 'st-chatu8');
mkdirSync(extDir, { recursive: true });
mkdirSync(join(pub, 'lib'), { recursive: true });
cpSync(EXT, extDir, { recursive: true, filter: (s) => !/[\\/](?:\.git|node_modules|test)(?:$|[\\/])/.test(s) && !/\.bak-/.test(s) });
for (const lib of ['jquery-3.5.1.min.js', 'jquery-ui.min.js', 'toastr.min.js', 'eventemitter.js']) {
  copyFileSync(join(ST, 'public', 'lib', lib), join(pub, 'lib', lib));
}
const fixtureBytes = readFileSync(FIXTURE);
const fixtureB64 = fixtureBytes.toString('base64');
copyFileSync(FIXTURE, join(pub, 'fixture.mp4'));

const MODE = process.argv.includes('--normal') ? 'normal' : process.argv.includes('--image') ? 'image' : 'stuck';
// 一张 2x2 的 PNG，用于图片路径的回归验证
const PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAEUlEQVR4nGP8z8DAwMDAxAADAA8+AfyxOnCxAAAAAElFTkSuQmCC';
writeFileSync(join(pub, 'fixture.png'), Buffer.from(PNG_B64, 'base64'));
const MEDIA = MODE === 'image'
  ? { b64: PNG_B64, mime: 'image/png', url: '/fixture.png', tagName: 'img' }
  : { b64: fixtureB64, mime: 'video/mp4', url: '/fixture.mp4', tagName: 'video' };
console.log(`模式: ${MODE}（媒体 ${MEDIA.mime}，存库${MODE === 'stuck' ? '挂起' : '正常'}）`);

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

write('test.html', `<!doctype html><html><head><meta charset="utf-8"><title>gen</title></head><body>
<div id="top-settings-holder"></div><div id="extensions_settings"></div><div id="extensions_settings2"></div>
<div id="send_form"><div id="options"><a id="option_toggle_AN"></a></div><textarea id="send_textarea"></textarea><div id="send_but"></div></div>
<div id="chat"><div class="mes" mesid="0"><div class="mes_text">这是一段足够长的正文，用来让插件把标签识别出来并插入生成按钮，后面紧跟着图片标签。image###e2e生成视频###</div></div></div>
<pre id="result">PENDING</pre>
<script src="/lib/jquery-3.5.1.min.js"></script>
<script src="/lib/jquery-ui.min.js"></script>
<script src="/lib/toastr.min.js"></script>
<script src="/scripts/extensions/third-party/st-chatu8/crypto-js.min.js"></script>
<script>
window.hljs = { highlightElement: function () {}, highlight: function () { return { value: '' }; } };
window.token = 'e2e';
window.__ST = {
  chat: [{ mes: '正文', is_user: false, name: 'Tester', extra: {}, swipe_id: 0 }],
  // 用户的真实组合：banana + Grok 原生 images/generations + 酒馆存储
  extension_settings: { 'st-chatu8': {
    jiuguanchucun: 'true', cache: '1', scriptEnabled: 'true', startTag: 'image###', endTag: '###',
    mode: 'banana', zidongdianji: 'false', dbclike: 'false', clickToPreview: 'true',
    banana: { apiUrl: '/mockapi/v1', apiKey: 'x', model: '视频', videoModel: '视频', editModel: '视频',
              useGrokFormat: 'true', imageSize: '544x960', aspectRatio: '9:16',
              conversationPresetId: '默认', editPresetId: '默认', videoPresetId: '默认',
              conversationPresets: { '默认': { conversation: [], fixedPrompt: '', postfixPrompt: '' } },
              prompt_replace: { '默认': { text: '' } }, prompt_replace_id: '默认' },
  } },
  context: { chat: [], chatId: 'e2e', chatMetadata: { variables: {} }, name2: 'Tester', characters: [], characterId: 0,
    groupId: null, groups: [], getRequestHeaders: function () { return { 'Content-Type': 'application/json' }; },
    saveSettingsDebounced: function () {}, saveMetadata: function () {}, substituteParams: function (s) { return s; } },
};
window.__ST.context.chat = window.__ST.chat;

// 记录关键时间点，用来证明「界面通知不再被存库拖住」
window.__MODE = '__MODE__';
window.__MEDIA_TAG = '__MEDIA_TAG__';
window.__MARKS = { uploadHits: 0 };
const realFetch = window.fetch.bind(window);
window.fetch = function (input, init) {
  const url = typeof input === 'string' ? input : (input && input.url) || '';
  if (url.indexOf('/api/images/upload') !== -1) {
    window.__MARKS.uploadHits++;
    // stuck 模式下让存库永久挂起：这就是修复前 emit 永远发不出去的那一刻
    if (window.__MODE === 'stuck') return new Promise(function () {});
  }
  return realFetch(input, init);
};

const results = [];
const push = (name, ok, detail) => results.push({ name: name, ok: ok, detail: detail || '' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  try {
    let loadError = null;
    try { await import('/scripts/extensions/third-party/st-chatu8/index.js'); }
    catch (e) { loadError = (e && (e.stack || e.message)) || String(e); }
    push('真实 index.js 加载成功', loadError === null, loadError ? String(loadError).slice(0, 300) : '');
    await sleep(6000);

    const btn = document.querySelector('#chat button.image-tag-button');
    push('插件已为 image### 标签插入生成按钮', btn !== null, btn ? 'link=' + btn.dataset.link : '未找到按钮');
    if (!btn) throw new Error('没有按钮，后续无法继续');

    const t0 = Date.now();
    btn.click();
    await sleep(300);
    push('点击后按钮进入转圈状态', btn.hasAttribute('data-loading'), 'text=' + btn.textContent);

    const span = btn.nextElementSibling;
    const stuck = window.__MODE === 'stuck';
    let media = null;
    for (let i = 0; i < 200; i++) {           // 最多等 50 秒
      await sleep(250);
      media = span.querySelector(window.__MEDIA_TAG);
      if (media) break;
    }
    const elapsed = Date.now() - t0;
    push(stuck ? '存库卡死时媒体依然显示出来（修复前会永久转圈）' : '正常路径下媒体显示出来',
      media !== null, media ? '耗时 ' + elapsed + 'ms' : '50 秒内没有出现 <' + window.__MEDIA_TAG + '>');
    if (stuck) {
      push('确认存库确实被卡住了（不是走了正常路径）', window.__MARKS.uploadHits > 0, '拦截到 ' + window.__MARKS.uploadHits + ' 次上传请求');
      push('出现时机符合 20 秒放行阈值（而不是等到永远）', media !== null && elapsed > 15000 && elapsed < 45000, elapsed + 'ms');
    } else {
      // 回归重点：正常路径不该因为这次改动多等那 20 秒
      push('正常路径没有引入额外等待（远早于 20 秒放行阈值）', media !== null && elapsed < 15000, elapsed + 'ms');
    }
    push('按钮已复位，不再转圈', btn !== null && !btn.hasAttribute('data-loading'), 'loading=' + btn.hasAttribute('data-loading') + ' text=' + btn.textContent);

    if (media && window.__MEDIA_TAG === 'video') {
      let meta = false;
      for (let i = 0; i < 40; i++) {
        if (media.readyState >= 1 && media.videoWidth > 0) { meta = true; break; }
        await sleep(250);
      }
      push('显示出来的视频能被解码播放', meta, 'readyState=' + media.readyState + ' ' + media.videoWidth + 'x' + media.videoHeight);
    }
    if (media && window.__MEDIA_TAG === 'img') {
      let loaded = false;
      for (let i = 0; i < 40; i++) {
        if (media.complete && media.naturalWidth > 0) { loaded = true; break; }
        await sleep(250);
      }
      push('显示出来的图片能正常解码', loaded, media.naturalWidth + 'x' + media.naturalHeight);
    }
    const log = document.getElementById('ch-log-textarea');
    if (log && log.value) {
      const stages = (log.value.match(/\\[DB\\][^\\n]*/g) || []);
      push(stuck ? '阶段日志记录了存库超时并放行' : '阶段日志正常记录了各阶段耗时',
        stuck ? /存库超过/.test(log.value) : (stages.length > 0 && !/存库超过/.test(log.value)),
        stages.slice(-3).join(' | '));
    }
  } catch (e) {
    push('测试自身异常', false, (e && (e.stack || e.message)) || String(e));
  }
  document.getElementById('result').textContent = JSON.stringify(results);
  try { await fetch('/result', { method: 'POST', body: JSON.stringify(results) }); } catch (e) {}
})();
</script></body></html>`);

// 把模式注入页面（页面脚本是纯字符串，避免再嵌一层模板插值）
{
  const p = join(pub, 'test.html');
  writeFileSync(p, readFileSync(p, 'utf8').replace('__MODE__', MODE).replace('__MEDIA_TAG__', MEDIA.tagName), 'utf8');
}
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
  if (rel === '/csrf-token') { res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ token: 'e2e' })); return; }
  if (rel === '/favicon.ico') { res.writeHead(204).end(); return; }
  // 酒馆存储的落盘端点（normal/image 模式会真的走到这里；stuck 模式在页面侧就被挂住了）
  if (req.method === 'POST' && rel === '/api/images/upload') {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ path: MEDIA.url }));
    });
    return;
  }
  if (req.method === 'POST' && rel === '/api/images/delete') {
    req.resume();
    res.writeHead(200, { 'Content-Type': 'application/json' }).end('{}');
    return;
  }
  // mock 的生图端点：延迟 2 秒后按 OpenAI 契约回传真实媒体，附带 url 供播放回退
  if (req.method === 'POST' && rel === '/mockapi/v1/images/generations') {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => setTimeout(() => {
      res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({
        created: Math.floor(Date.now() / 1000),
        data: [{ b64_json: MEDIA.b64, mime_type: MEDIA.mime, url: MEDIA.url }],
      }));
    }, 2000));
    return;
  }
  const file = join(pub, rel === '/' ? 'test.html' : rel);
  try {
    // 必须先读再写头：readFileSync 抛错时若头已发出，catch 里再写 404 会直接崩掉服务。
    const buf = readFileSync(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' }).end(buf);
  } catch (e) { missed.push(rel); res.writeHead(404).end('not found'); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const profile = mkdtempSync(join(tmpdir(), 'chatu8-gen-profile-'));
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
