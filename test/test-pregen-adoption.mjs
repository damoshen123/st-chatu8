// 回归：流式预生成与正文按钮的 key 不一致时，按钮必须能「认领」预生成，而不是再发一次。
// 预生成读的是模型原文，按钮读的是酒馆渲染后的 DOM 文本，两者常差几个 Markdown/宏/尖括号字符。
// 直接从 index.js 抽取真正发布的函数运行，事件总线、图库等外部依赖用假件替代。
import { readFileSync } from 'node:fs';

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

function buildHarness({ cache = '1', timeoutMs = 20 * 60 * 1000 } = {}) {
  const code = [
    'var extensionName = "st-chatu8";',
    `var extension_settings100 = { [extensionName]: { cache: ${JSON.stringify(cache)} } };`,
    'var stScript = { substituteParams: (s) => String(s).replaceAll("{{char}}", "Alice"), chat: [{ mes: "", is_user: true }, { mes: "", swipe_id: 0 }] };',
    'var getContext = () => ({ chatId: "chat-A" });',
    'var extension_settings101 = { [extensionName]: { startTag: "image###", endTag: "###", thinkTagFormat: "", banana: {} } };',
    'function findMesTextFromElement() { return null; }',
    'var logs = []; function addLog(m) { logs.push(String(m)); }',
    'var EventType = { GENERATE_IMAGE_REQUEST: "req", GENERATE_IMAGE_RESPONSE: "res" };',
    `var eventSource38 = {
      listeners: new Map(), emitted: [],
      on(name, fn) { if (!this.listeners.has(name)) this.listeners.set(name, new Set()); this.listeners.get(name).add(fn); },
      removeListener(name, fn) { this.listeners.get(name)?.delete(fn); },
      emit(name, data) { this.emitted.push({ name, data }); for (const fn of Array.from(this.listeners.get(name) || [])) fn(data); },
    };`,
    'var db = new Map(); var setCalls = [];',
    'async function getItemImg(tag) { const r = db.get(tag); return r ? [r.imageUrl, r.change, 0, r.isVideo, r.originalUrl] : [false, false, false, false, ""]; }',
    'async function setItemImg(tag, imageUrl, opts = {}) { setCalls.push({ tag, opts }); db.set(tag, { imageUrl, change: opts.change || "", isVideo: !!opts.isVideo, originalUrl: opts.originalUrl || "" }); }',
    `var PREGEN_RESPONSE_TIMEOUT_MS = ${timeoutMs};`,
    'var pregenDispatched = new Set();',
    'var currentlyGenerating = new Set(); var generatingByNormalizedKey = new Map(); var normalizedKeyCache = new Map();',
    'var pregenByNormalizedKey = new Map(); var pregenAdopters = new Map(); var recentPregenResults = new Map();',
    'var pregenByCorrelation = new Map(); var recentPregenByCorrelation = new Map(); var pregenGeneration = { type: "", continueBase: 0 };',
    extract('async function persistWithDeadline('),
    extract('function generateStableId3(str) {'),
    extract('function isGenerating(prompt2) {'),
    extract('function startGenerating(prompt2) {'),
    extract('function stopGenerating(prompt2) {'),
    extract('function isGeneratingEquivalent(prompt2) {'),
    extract('function normalizeTagKey(text) {'),
    extract('function computeNormalizedTagKey(text) {'),
    extract('function makePregenCorrelationKey(identity, ordinal) {'),
    extract('function safeCurrentChatId() {'),
    extract('function resolvePregenCorrelationBase() {'),
    extract('function looseTagText(text) {'),
    extract('function bigramDice(a, b) {'),
    extract('function looselySameTag(a, b) {'),
    extract('function registerPregen(prompt2, correlationKey = "") {'),
    extract('function unregisterPregen(prompt2, correlationKey = "") {'),
    extract('function escapeRegExpForPregen(string) {'),
    extract('function getThinkTagPairs() {'),
    extract('function stripThinkingForPregen(text) {'),
    extract('function parsePrompts(text) {'),
    extract('function countClosedTags(text) {'),
    extract('function add(prompts, correlationBase = null) {'),
    extract('function takePregenAdopters(prompt2) {'),
    extract('async function adoptPregen(link, correlationKey = "") {'),
    extract('async function fanOutPregenResult(prompt2, responseData, correlationKey = "") {'),
    extract('function releasePregenAdopters(prompt2, reason) {'),
    extract('async function dispatchPregenTask(prompt2, pairedVideoPrompt = "", correlationKey = "") {'),
    'return { stScript, extension_settings101, normalizeTagKey, isGenerating, startGenerating, stopGenerating, isGeneratingEquivalent, adoptPregen, dispatchPregenTask, generateStableId3, eventSource38, db, setCalls, logs, recentPregenResults, pregenAdopters, makePregenCorrelationKey, resolvePregenCorrelationBase, looselySameTag, parsePrompts, countClosedTags, add, pregenGeneration, setGeneration: (g) => { pregenGeneration = g; }, pregenByCorrelation };',
  ].join('\n');
  return new Function(code)();
}

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
};
const tick = () => new Promise((r) => setTimeout(r, 0));

// 模型原文里的标签 vs 酒馆渲染后 DOM 里读出来的同一个标签
const RAW = '*slow dolly-in* on {{char}}, she whispers "come here"  camera follows <Picture 1>, cinematic lighting';
const DOM = 'slow dolly-in on Alice, she whispers "come here"camera follows , cinematic lighting';
const OTHER = 'wide angle, second shot';

// 1. 归一化
{
  const h = buildHarness();
  check('原文 key 与 DOM key 归一化后相同', h.normalizeTagKey(RAW) === h.normalizeTagKey(DOM), h.normalizeTagKey(RAW));
  check('《》约定与真实尖括号归一化后相同', h.normalizeTagKey('she turns to 《Picture 1》 then') === h.normalizeTagKey('she turns to  then'));
  check('不同提示词不会被归一化混同', h.normalizeTagKey(RAW) !== h.normalizeTagKey(OTHER));
  check('"a < 3" 这种不是标签的尖括号不会被当标签吞掉', h.normalizeTagKey('a < 3 > b').includes('<3'), h.normalizeTagKey('a < 3 > b'));
}

// 1b. 宏结果不稳定时同一字符串仍归一化成同一个 key（否则生成计数永远减不回去）
{
  const h = buildHarness();
  h.stScript.substituteParams = (s) => String(s).replaceAll('{{roll}}', String(Math.random()));
  const tag = 'roll {{roll}} scene';
  h.startGenerating(tag);
  const wasEquivalent = h.isGeneratingEquivalent(tag);
  h.stopGenerating(tag);
  check('随机宏下 start/stop 落在同一 key，计数能归零', wasEquivalent && !h.isGeneratingEquivalent(tag) && !h.isGenerating(tag));
}

// 2. 预生成在跑 → 按钮认领 → 结果按按钮的 key 转交并入库
{
  const h = buildHarness();
  const dispatch = h.dispatchPregenTask(RAW);
  await tick(); await tick();
  const req = h.eventSource38.emitted.find((e) => e.name === 'req');
  check('预生成发出了请求', !!req && req.data.prompt === RAW);
  check('预生成期间原文 key 标记为生成中', h.isGenerating(RAW));

  const adopted = await h.adoptPregen(DOM);
  check('按钮按等价 key 认领了预生成', adopted === RAW, String(adopted));
  check('认领后按钮自己的 key 也算生成中（不会再发请求）', h.isGenerating(DOM));
  check('预生成对等价 key 判定为已在生成', h.isGeneratingEquivalent(DOM) && h.isGeneratingEquivalent(RAW));

  h.eventSource38.emitted.length = 0;
  h.eventSource38.emit('res', { id: h.generateStableId3(RAW), success: true, imageData: 'data:video/mp4;base64,AAAA', prompt: RAW, change: RAW, isVideo: true, format: 'video/mp4', originalUrl: 'http://x/v.mp4' });
  await dispatch; await tick(); await tick(); await tick();
  const forwarded = h.eventSource38.emitted.find((e) => e.name === 'res' && e.data.prompt === DOM);
  check('结果按按钮的 requestId 再发了一次', !!forwarded && forwarded.data.id === h.generateStableId3(DOM) && forwarded.data.isVideo === true && forwarded.data.adoptedFrom === RAW);
  check('成品同时存到了按钮的 key 下（刷新后能补渲染）', h.db.has(DOM) && h.db.get(DOM).isVideo === true && h.db.get(DOM).change === DOM);
  check('两边的生成锁都已释放', !h.isGenerating(RAW) && !h.isGenerating(DOM) && !h.isGeneratingEquivalent(DOM));
  check('认领表已清空', h.pregenAdopters.size === 0);
  check('转交的响应不会再触发一轮转交（无死循环）', h.eventSource38.emitted.filter((e) => e.name === 'res').length === 2);
}

// 3. 预生成失败 → 认领按钮也收到失败，不入库
{
  const h = buildHarness();
  const dispatch = h.dispatchPregenTask(RAW);
  await tick(); await tick();
  await h.adoptPregen(DOM);
  h.eventSource38.emitted.length = 0;
  h.eventSource38.emit('res', { id: h.generateStableId3(RAW), success: false, error: 'boom', prompt: RAW });
  await dispatch; await tick(); await tick();
  const forwarded = h.eventSource38.emitted.find((e) => e.name === 'res' && e.data.prompt === DOM);
  check('失败同样转交给认领按钮（按钮复位、提示错误）', !!forwarded && forwarded.data.success === false && forwarded.data.error === 'boom');
  check('失败不写图库', h.setCalls.length === 0 && !h.isGenerating(DOM));
}

// 4. 预生成已经完成、按钮才出现 → 直接把图库成品复制到按钮的 key
{
  const h = buildHarness();
  const dispatch = h.dispatchPregenTask(RAW);
  await tick(); await tick();
  h.db.set(RAW, { imageUrl: 'data:video/mp4;base64,BBBB', change: RAW, isVideo: true, originalUrl: '' });
  h.eventSource38.emit('res', { id: h.generateStableId3(RAW), success: true, imageData: 'data:video/mp4;base64,BBBB', prompt: RAW, change: RAW, isVideo: true, format: 'video/mp4' });
  await dispatch; await tick(); await tick();
  check('完成的预生成被记录为「等价 key → 图库名」', h.recentPregenResults.get(h.normalizeTagKey(RAW)) === RAW);
  const adopted = await h.adoptPregen(DOM);
  check('迟到的按钮直接拿到复制后的成品', adopted === RAW && h.db.has(DOM) && h.db.get(DOM).imageUrl === 'data:video/mp4;base64,BBBB');
  check('这种情况不会把按钮标成生成中', !h.isGenerating(DOM));
  const again = await h.adoptPregen(DOM);
  check('图库已有成品后再认领无副作用', again === null || (h.setCalls.length === 1));
}

// 5. 按钮先发出了请求（流式中途建好的按钮）→ 预生成对等价标签不再重复派发
{
  const h = buildHarness();
  h.startGenerating(DOM);
  await h.dispatchPregenTask(RAW);
  await tick();
  check('按钮已在生成时预生成跳过（不重复发送）', !h.eventSource38.emitted.some((e) => e.name === 'req'), h.logs.at(-1));
}

// 6. 无关的标签不会被误认领
{
  const h = buildHarness();
  const dispatch = h.dispatchPregenTask(RAW);
  await tick(); await tick();
  const adopted = await h.adoptPregen(OTHER);
  check('无关标签认领返回 null 且不标记生成中', adopted === null && !h.isGenerating(OTHER));
  h.eventSource38.emit('res', { id: h.generateStableId3(RAW), success: true, imageData: 'x', prompt: RAW });
  await dispatch;
}

// 7. 预生成超时 → 认领按钮被释放并收到失败
{
  const h = buildHarness({ timeoutMs: 120 });
  const dispatch = h.dispatchPregenTask(RAW);
  await tick(); await tick();
  await h.adoptPregen(DOM);
  await new Promise((r) => setTimeout(r, 200));
  await dispatch;
  const forwarded = h.eventSource38.emitted.find((e) => e.name === 'res' && e.data.prompt === DOM);
  check('超时后认领按钮收到失败并解锁', !!forwarded && forwarded.data.success === false && !h.isGenerating(DOM) && !h.isGenerating(RAW));
}

// 8. 关闭缓存（cache=0）时不写图库，但结果仍转交
{
  const h = buildHarness({ cache: '0' });
  const dispatch = h.dispatchPregenTask(RAW);
  await tick(); await tick();
  await h.adoptPregen(DOM);
  h.eventSource38.emit('res', { id: h.generateStableId3(RAW), success: true, imageData: 'data:image/png;base64,CCCC', prompt: RAW, change: RAW });
  await dispatch; await tick(); await tick();
  const forwarded = h.eventSource38.emitted.find((e) => e.name === 'res' && e.data.prompt === DOM);
  check('cache=0：不写图库但仍转交结果', !!forwarded && h.setCalls.length === 0);
}

// 9. 编号：parsePrompts 给序号（配对模式过滤前的），续写按已有标签数加基数
{
  const h = buildHarness();
  const items = h.parsePrompts('a image###one###b image###two### c image###three###');
  check('parsePrompts 按出现顺序给序号', items.map((i) => i.ordinal).join(',') === '0,1,2' && items[2].prompt === 'three', JSON.stringify(items));
  h.extension_settings101['st-chatu8'].banana = { grokVideoPair: 'true', useGrokFormat: 'true' };
  // 配对是按出现顺序第 i 个生图段配第 i 个视频段；第二个视频段还没闭合时，第二个标签留给后续分片。
  const paired = h.parsePrompts('image###one###\nvideo###v1###\nimage###two###\nvideo###v2');
  check('配对模式：只派发已配到视频段的，且保留原序号', paired.length === 1 && paired[0].ordinal === 0 && paired[0].prompt === 'one' && paired[0].pairedVideoPrompt === 'v1', JSON.stringify(paired));
  const pairedAll = h.parsePrompts('image###one###\nvideo###v1###\nimage###two###\nvideo###v2###');
  check('配对模式：两段都闭合后序号仍是 0,1', pairedAll.length === 2 && pairedAll[1].ordinal === 1 && pairedAll[1].pairedVideoPrompt === 'v2', JSON.stringify(pairedAll));
  h.extension_settings101['st-chatu8'].banana = {};
  check('countClosedTags 数已有正文里的闭合标签（续写基数）', h.countClosedTags('image###a### text image###b###') === 2);
}

// 10. 编号：预生成派发时请求带 requestKey，同编号不重复派发
{
  const h = buildHarness();
  const base = h.resolvePregenCorrelationBase();
  check('流式目标楼层身份可解析（chat 最后一条、swipe 0）', !!base && base.mesId === 1 && base.swipeId === 0 && base.chatId === 'chat-A', JSON.stringify(base));
  h.add([{ prompt: RAW, ordinal: 0 }], base);
  await tick(); await tick(); await tick();
  const req = h.eventSource38.emitted.find((e) => e.name === 'req');
  const expectKey = h.makePregenCorrelationKey(base, 0);
  check('派发的请求带上编号 requestKey', !!req && req.data.requestKey === expectKey, JSON.stringify(req && req.data.requestKey));
  h.add([{ prompt: RAW + ' x', ordinal: 0 }], base);
  await tick(); await tick();
  check('同一编号（流式分片里同一标签的文本还在变）不会再派发', h.eventSource38.emitted.filter((e) => e.name === 'req').length === 1);
  h.eventSource38.emit('res', { id: h.generateStableId3(RAW), success: true, imageData: 'x', prompt: RAW });
}

// 11. 编号认领：文本差异超出归一化范围（正则脚本改了词）也能按编号认领；编号对上但文本不相干则不认
{
  const h = buildHarness();
  const base = h.resolvePregenCorrelationBase();
  const key = h.makePregenCorrelationKey(base, 2);
  const dispatch = h.dispatchPregenTask('camera slowly pushes in on her face, soft window light, she smiles', '', key);
  await tick(); await tick();
  const adoptedSimilar = await h.adoptPregen('camera slowly pushes in on her face, soft window light, she grins', key);
  check('编号相同、文本小改动 → 按编号认领', adoptedSimilar !== null && h.isGenerating('camera slowly pushes in on her face, soft window light, she grins'));
  const adoptedUnrelated = await h.adoptPregen('completely different shot of a dragon over the mountains at night', key);
  check('编号相同、文本不相干（标签数量错位）→ 不认领', adoptedUnrelated === null && !h.isGenerating('completely different shot of a dragon over the mountains at night'), h.logs.at(-1));
  h.eventSource38.emit('res', { id: h.generateStableId3('camera slowly pushes in on her face, soft window light, she smiles'), success: true, imageData: 'x', prompt: 'camera slowly pushes in on her face, soft window light, she smiles' });
  await dispatch; await tick(); await tick();
  check('认领人收到转交并解锁', !h.isGenerating('camera slowly pushes in on her face, soft window light, she grins') && h.db.has('camera slowly pushes in on her face, soft window light, she grins'));
}

// 12. 「换行修复」把全角标点改成半角：归一化 key 现在相等；宽松比对也相等
{
  const h = buildHarness();
  const raw = '1girl，smile；blue eyes：close-up';
  const fixed = '1girl,smile;blue eyes:close-up';
  check('全角标点折半角后归一化 key 相等', h.normalizeTagKey(raw) === h.normalizeTagKey(fixed));
  check('宽松比对：Markdown 与标点差异都视为同一标签', h.looselySameTag('*1girl*, smile', '1girl, smile') && !h.looselySameTag('1girl, smile', 'a dragon flying over snowy mountains'));
}

// 13. 预生成已完成 → 迟到的按钮按编号拿到复制成品
{
  const h = buildHarness();
  const base = h.resolvePregenCorrelationBase();
  const key = h.makePregenCorrelationKey(base, 0);
  const dispatch = h.dispatchPregenTask(RAW, '', key);
  await tick(); await tick();
  h.db.set(RAW, { imageUrl: 'data:video/mp4;base64,DDDD', change: RAW, isVideo: true, originalUrl: '' });
  h.eventSource38.emit('res', { id: h.generateStableId3(RAW), success: true, imageData: 'data:video/mp4;base64,DDDD', prompt: RAW, change: RAW, isVideo: true, format: 'video/mp4' });
  await dispatch; await tick(); await tick();
  const adopted = await h.adoptPregen('slow dolly-in on Alice, she whispers come here camera follows, cinematic lighting', key);
  check('按编号复制已完成的成品到按钮 key', adopted === RAW && h.db.has('slow dolly-in on Alice, she whispers come here camera follows, cinematic lighting'));
}

// 14. 假人/quiet 不给编号；续写带基数
{
  const h = buildHarness();
  h.setGeneration({ type: 'impersonate', continueBase: 0 });
  check('impersonate 不给编号', h.resolvePregenCorrelationBase() === null);
  h.setGeneration({ type: 'continue', continueBase: 2 });
  const base = h.resolvePregenCorrelationBase();
  check('续写：基数随身份返回', !!base && base.offset === 2);
  h.add([{ prompt: 'new tag after continue', ordinal: 0 }], base);
  await tick(); await tick(); await tick();
  const req = h.eventSource38.emitted.find((e) => e.name === 'req');
  check('续写：编号 = 序号 + 基数', !!req && req.data.requestKey === h.makePregenCorrelationKey(base, 2), JSON.stringify(req && req.data.requestKey));
  h.eventSource38.emit('res', { id: h.generateStableId3('new tag after continue'), success: false, error: 'x', prompt: 'new tag after continue' });
}

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} 通过`);
process.exit(failed ? 1 : 0);
