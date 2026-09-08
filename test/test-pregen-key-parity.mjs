// 回归：流式预生成算出的 link/requestId 必须与正文按钮逐字一致。
// 预生成读的是模型原始流式文本，按钮读的是酒馆渲染后的 DOM 文本，中间隔着 Markdown、宏替换、
// HTML 标签吞字。两边 key 不一致的后果是「预生成存一份、按钮再生成一份」：开了流式预生成拿不到视频，
// 勾了自动点击又重复发送。直接从 index.js 抽取真正发布的函数，在真实浏览器 DOM 里跑。
import { readFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME_CANDIDATES = [
  process.env.CHROME,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/opt/google/chrome/chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);
const CHROME = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!CHROME) throw new Error(`找不到 Chrome，可用环境变量 CHROME 指定路径。试过: ${CHROME_CANDIDATES.join(', ')}`);

const src = readFileSync(new URL('../index.js', import.meta.url), 'utf8');
function extract(signature) {
  const start = src.indexOf(signature);
  if (start === -1) throw new Error(`未在 index.js 中找到 ${signature}`);
  let depth = 0, end = -1;
  for (let i = src.indexOf('{', start); i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
  }
  return src.slice(start, end);
}
const PLUGIN_CODE = [
  'var extensionName = "st-chatu8";',
  'var pregenRenderWarned = false;',
  'var pregenScanCache = { signature: null, prompts: [] };',
  'function addLog() {}',
  extract('function generateStableId(str) {'),
  extract('function collectLogicalText(rootElement) {'),
  extract('function escapeRegExpForPregen(string) {'),
  extract('function getThinkTagPairs() {'),
  extract('function stripThinkingForPregen(text) {'),
  extract('function renderLogicalTextLikeChat(rawText) {'),
  extract('function resetPregenScanCache() {'),
  extract('function parsePrompts(text) {'),
].join('\n');

const PAGE = `<!doctype html><html><body><pre id="result"></pre>
<script>${PLUGIN_CODE}</script>
<script>
// 模拟酒馆：cleanUpMessage 去行尾空白；messageFormatting 做宏替换 + 最小 Markdown（强调、换行、引号），
// 尖括号原样输出——真实酒馆也是这样，交给浏览器把 <Picture 1> 当标签吞掉。
const CHAR_NAME = 'Alice';
function fakeCleanUp({ getMessage }) { return String(getMessage).replace(/[^\\S\\r\\n]+$/gm, ''); }
function fakeFormatting(mes) {
  let s = String(mes).replaceAll('{{char}}', CHAR_NAME);
  s = s.replace(/\\*([^*\\n]+)\\*/g, '<em>$1</em>');
  s = s.replace(/"([^"\\n]+)"/g, '<q>"$1"</q>');
  return s.split(/\\n{2,}/).map((p) => '<p>' + p.replaceAll('\\n', '<br>') + '</p>').join('');
}
window.stScript = { chat: [{ name: CHAR_NAME, is_user: false, is_system: false }], cleanUpMessage: fakeCleanUp, messageFormatting: fakeFormatting };
const settings = { startTag: 'image###', endTag: '###', thinkTagFormat: '', banana: {} };
window.extension_settings101 = { [extensionName]: settings };

// 与 findAndReplaceInElement 逐字一致地从「已渲染楼层」算按钮 link（同一个 collectLogicalText）。
function mainFlowLinks(raw, tagStart, tagEnd, keepNewline = false) {
  const mes = document.createElement('div');
  mes.className = 'mes_text';
  mes.innerHTML = fakeFormatting(fakeCleanUp({ getMessage: raw }));
  const esc = (s) => s.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&');
  const pattern = new RegExp(esc(tagStart) + '([\\\\s\\\\S]*?)' + esc(tagEnd), 'g');
  const { logicalText } = collectLogicalText(mes);
  return [...logicalText.matchAll(pattern)].map((m) => {
    const t = m[1].trim().replaceAll('《', '<').replaceAll('》', '>');
    return keepNewline ? t : t.replaceAll('\\n', '');
  });
}
// 修复前的算法：直接在原文上匹配。
function legacyLinks(raw, tagStart, tagEnd) {
  const esc = (s) => s.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&');
  const pattern = new RegExp(esc(tagStart) + '([\\\\s\\\\S]*?)' + esc(tagEnd), 'g');
  return [...raw.matchAll(pattern)].map((m) => m[1].trim().replaceAll('《', '<').replaceAll('》', '>').replaceAll('\\n', ''));
}

const out = [];
const push = (name, ok, detail = '') => out.push({ name, ok, detail });
try {
  // 典型视频提示词：多行、强调星号、引号、{{char}}、尖括号、行尾空格。
  const RAW = '她抬头看向窗外。\\n\\nimage###\\n*slow dolly-in* on {{char}}, she whispers "come here"  \\ncamera follows <Picture 1>, cinematic lighting\\n###\\n\\n他没有回答。';

  const pregen = parsePrompts(RAW);
  const main = mainFlowLinks(RAW, 'image###', '###');
  const legacy = legacyLinks(RAW, 'image###', '###');
  push('用例本身有效：旧算法与按钮 link 确实不同', legacy[0] !== main[0], JSON.stringify({ legacy: legacy[0], main: main[0] }));
  push('预生成 link 与按钮 link 逐字一致', pregen.length === 1 && pregen[0] === main[0], JSON.stringify({ pregen: pregen[0], main: main[0] }));
  push('requestId 一致（同一个按钮能认领预生成结果）', pregen[0] && generateStableId(pregen[0]) === generateStableId(main[0]), generateStableId(main[0]));

  // 同一批闭合标签再次进来（流式后续分片）：走缓存，结果不变。
  const again = parsePrompts(RAW + ' 又多了一句话。');
  push('闭合标签集合不变时复用结果', again.length === 1 && again[0] === pregen[0]);

  // 新标签闭合时缓存失效，两个都要有。
  const RAW2 = RAW + '\\n\\nimage###second shot, *wide angle*###';
  const two = parsePrompts(RAW2);
  const mainTwo = mainFlowLinks(RAW2, 'image###', '###');
  push('新增闭合标签后重新扫描且仍与按钮一致', two.length === 2 && two[0] === mainTwo[0] && two[1] === mainTwo[1], JSON.stringify(two));

  // 思维链内的标签不能被抢先派发（保持原有行为）。
  resetPregenScanCache();
  settings.thinkTagFormat = '<think>|</think>';
  const RAW3 = '<think>image###inside thinking###</think>\\n\\nimage###outside *ok*###';
  const think = parsePrompts(RAW3);
  push('思维链里的标签仍被跳过', think.length === 1 && think[0] === 'outside ok', JSON.stringify(think));
  settings.thinkTagFormat = '';

  // 图生视频配对：视频段同样按渲染后文本取，且保留换行（与主流程一致）。
  resetPregenScanCache();
  settings.banana = { grokVideoPair: 'true', useGrokFormat: 'true', grokVideoStartTag: 'video###', grokVideoEndTag: '###' };
  const RAW4 = 'image###1girl, *smile*###\\n\\nvideo###\\n*she turns* to 《Picture 1》\\nthen waves\\n###';
  const pair = parsePrompts(RAW4);
  const pairMain = mainFlowLinks(RAW4, 'image###', '###');
  const pairVideoMain = mainFlowLinks(RAW4, 'video###', '###', true);
  push('配对模式：生图段 link 一致', pair.length === 1 && pair[0].prompt === pairMain[0], JSON.stringify({ pair, pairMain }));
  push('配对模式：视频段提示词与主流程一致', pair.length === 1 && pair[0].pairedVideoPrompt === pairVideoMain[0], JSON.stringify({ got: pair[0] && pair[0].pairedVideoPrompt, want: pairVideoMain[0] }));
  settings.banana = {};

  // 酒馆没导出渲染函数时回落到原文匹配，不抛错。
  resetPregenScanCache();
  const saved = window.stScript.messageFormatting;
  window.stScript.messageFormatting = undefined;
  let fallbackThrew = null, fallback = [];
  try { fallback = parsePrompts(RAW); } catch (e) { fallbackThrew = e; }
  window.stScript.messageFormatting = saved;
  push('渲染函数不可用 → 回落原文匹配且不抛错', !fallbackThrew && fallback.length === 1 && fallback[0] === legacy[0], fallbackThrew ? fallbackThrew.message : JSON.stringify(fallback));

  // 渲染抛错同样回落。
  resetPregenScanCache();
  window.stScript.messageFormatting = () => { throw new Error('boom'); };
  let throwFallback = [];
  try { throwFallback = parsePrompts(RAW); } catch (e) { throwFallback = ['THREW ' + e.message]; }
  window.stScript.messageFormatting = saved;
  push('渲染抛错 → 回落原文匹配且不抛错', throwFallback.length === 1 && throwFallback[0] === legacy[0], JSON.stringify(throwFallback));
} catch (e) {
  push('测试自身异常', false, (e && e.stack) || String(e));
}
document.getElementById('result').textContent = JSON.stringify(out);
fetch('/result', { method: 'POST', body: JSON.stringify(out) }).catch(() => {});
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

const profile = mkdtempSync(join(tmpdir(), 'chatu8-pregen-'));
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run', '--no-default-browser-check',
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
let failed = 0;
for (const r of results) {
  if (!r.ok) failed++;
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? '  — ' + r.detail : ''}`);
}
console.log(failed ? `\n${failed} 项失败` : '\n全部通过');
process.exit(failed ? 1 : 0);
