// 回归：酒馆非流式生成时，预生成必须在 MESSAGE_RECEIVED 一刻按同一套编号派发标签。
// 此前预生成只挂在 STREAM_TOKEN_RECEIVED 上，非流式根本没有这个事件，标签一直不发送。
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

function buildHarness({ enablePregen = 'true', chat } = {}) {
  const initialChat = chat || [{ mes: 'hi', is_user: true }, { mes: '', swipe_id: 0 }];
  const code = [
    'var extensionName = "st-chatu8";',
    'var extension_settings100 = { [extensionName]: { cache: "1" } };',
    `var stScript = { substituteParams: (s) => String(s), chat: ${JSON.stringify(initialChat)} };`,
    'var getContext = () => ({ chatId: "chat-A" });',
    `var extension_settings101 = { [extensionName]: { startTag: "image###", endTag: "###", thinkTagFormat: "", banana: {}, enablePregen: ${JSON.stringify(enablePregen)} } };`,
    'function findMesTextFromElement() { return null; }',
    'var logs = []; function addLog(m) { logs.push(String(m)); }',
    'var EventType = { GENERATE_IMAGE_REQUEST: "req", GENERATE_IMAGE_RESPONSE: "res" };',
    `var eventSource38 = {
      listeners: new Map(), emitted: [],
      on(name, fn) { if (!this.listeners.has(name)) this.listeners.set(name, new Set()); this.listeners.get(name).add(fn); },
      removeListener(name, fn) { this.listeners.get(name)?.delete(fn); },
      emit(name, data) { this.emitted.push({ name, data }); for (const fn of Array.from(this.listeners.get(name) || [])) fn(data); },
    };`,
    'var db = new Map();',
    'async function getItemImg(tag) { const r = db.get(tag); return r ? [r.imageUrl, r.change, 0, r.isVideo, r.originalUrl] : [false, false, false, false, ""]; }',
    'async function setItemImg(tag, imageUrl, opts = {}) { db.set(tag, { imageUrl, change: opts.change || "", isVideo: !!opts.isVideo, originalUrl: opts.originalUrl || "" }); }',
    'var PREGEN_RESPONSE_TIMEOUT_MS = 20 * 60 * 1000;',
    'var pregenDispatched = new Set();',
    'var currentlyGenerating = new Set(); var generatingByNormalizedKey = new Map(); var normalizedKeyCache = new Map();',
    'var pregenByNormalizedKey = new Map(); var pregenAdopters = new Map(); var recentPregenResults = new Map();',
    'var pregenByCorrelation = new Map(); var recentPregenByCorrelation = new Map();',
    extract('var pregenGeneration = {'),
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
    extract('function clear() {'),
    'var pregenManager = { add, clear };',
    extract('function takePregenAdopters(prompt2) {'),
    extract('async function adoptPregen(link, correlationKey = "") {'),
    extract('async function fanOutPregenResult(prompt2, responseData, correlationKey = "") {'),
    extract('function releasePregenAdopters(prompt2, reason) {'),
    extract('async function dispatchPregenTask(prompt2, pairedVideoPrompt = "", correlationKey = "") {'),
    extract('function onPregenGenerationStarted(type, _params, dryRun) {'),
    extract('function onPregenGenerationFinished() {'),
    extract('function pregenFromReceivedMessage(id, type) {'),
    // 模拟流式分片到达（与 index.js 里 STREAM_TOKEN_RECEIVED 的监听器同一逻辑）
    `function onStreamToken(text) {
      if (String(extension_settings101[extensionName].enablePregen) !== "true" || !text) return;
      const prompts = parsePrompts(text);
      if (prompts.length > 0) pregenManager.add(prompts, resolvePregenCorrelationBase());
    }`,
    'return { stScript, extension_settings101, eventSource38, logs, isGenerating, makePregenCorrelationKey, pregenDispatched, onPregenGenerationStarted, onPregenGenerationFinished, pregenFromReceivedMessage, onStreamToken, generation: () => pregenGeneration, adoptPregen };',
  ].join('\n');
  return new Function(code)();
}

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
};
const tick = () => new Promise((r) => setTimeout(r, 0));
const settle = async () => { for (let i = 0; i < 4; i++) await tick(); };
const reqs = (h) => h.eventSource38.emitted.filter((e) => e.name === 'req');
// 按钮侧的编号算法（placeholder.js 里 makePregenCorrelationKey(resolveMessageIdentity(...), ordinal) 的口径）
const buttonKey = (h, mesId, swipeId, ordinal) => h.makePregenCorrelationKey({ chatId: 'chat-A', mesId, swipeId }, ordinal);

// 0. 监听器确实挂在了 MESSAGE_RECEIVED / GENERATION_ENDED / GENERATION_STOPPED 上
{
  check('MESSAGE_RECEIVED 已接到预生成', src.includes('eventSource39.on(event_types7.MESSAGE_RECEIVED, pregenFromReceivedMessage)'));
  check('GENERATION_ENDED / GENERATION_STOPPED 会结束生成周期', src.includes('eventSource39.on(event_types7.GENERATION_ENDED, onPregenGenerationFinished)') && src.includes('eventSource39.on(event_types7.GENERATION_STOPPED, onPregenGenerationFinished)'));
}

// 1. 非流式普通回复：GENERATION_STARTED → 酒馆 push 新楼层 → MESSAGE_RECEIVED → 派发，编号与按钮侧一致
{
  const h = buildHarness();
  h.onPregenGenerationStarted('normal', {}, false);
  check('真实生成开始后处于生成周期内', h.generation().active === true && h.generation().type === 'normal');
  // 非流式：酒馆在 saveReply 里才把回复 push 进 chat，然后发 MESSAGE_RECEIVED(id)
  // 正文里带 Markdown：按钮读的是渲染后的 DOM 文本，星号已经没了，两边文本不同、编号相同
  h.stScript.chat.push({ mes: '她走进房间。image###1girl, **walking** into room###\n随后坐下。image###1girl, sitting on sofa###', swipe_id: 0 });
  const id = h.stScript.chat.length - 1;
  h.pregenFromReceivedMessage(id, 'normal');
  await settle();
  const r = reqs(h);
  check('非流式回复到达即派发全部标签', r.length === 2 && r[0].data.prompt === '1girl, **walking** into room' && r[1].data.prompt === '1girl, sitting on sofa', JSON.stringify(r.map((e) => e.data.prompt)));
  check('编号 = 楼层身份 + 正文序号，与按钮侧算出的一致', r[0]?.data.requestKey === buttonKey(h, id, 0, 0) && r[1]?.data.requestKey === buttonKey(h, id, 0, 1), JSON.stringify(r.map((e) => e.data.requestKey)));
  check('派发后标签处于生成中（按钮建好后会认领而不是再发）', h.isGenerating('1girl, **walking** into room'));
  const adopted = await h.adoptPregen('1girl, walking into room', buttonKey(h, id, 0, 0));
  check('随后建好的按钮（DOM 文本无星号）按编号认领了这次预生成', adopted === '1girl, **walking** into room' && h.isGenerating('1girl, walking into room'), String(adopted));
  h.onPregenGenerationFinished();
  check('GENERATION_ENDED 后退出生成周期', h.generation().active === false);
  h.pregenFromReceivedMessage(id, 'normal');
  await settle();
  check('生成周期外再收到 MESSAGE_RECEIVED 不重复派发', reqs(h).length === 2);
}

// 2. 流式：分片已派发，收尾的 MESSAGE_RECEIVED（正文被换行修复改过标点）不会再发第二份
{
  const h = buildHarness();
  h.onPregenGenerationStarted('normal', {}, false);
  // 流式：酒馆开流前先 push 了空楼层
  h.stScript.chat.push({ mes: '', swipe_id: 0 });
  const id = h.stScript.chat.length - 1;
  h.onStreamToken('image###1girl，smile，blue eyes###');
  await settle();
  check('流式分片派发了一次', reqs(h).length === 1 && reqs(h)[0].data.requestKey === buttonKey(h, id, 0, 0));
  h.stScript.chat[id].mes = 'image###1girl,smile,blue eyes###';
  h.pregenFromReceivedMessage(id, 'normal');
  await settle();
  check('收尾 MESSAGE_RECEIVED 文本有差异也按编号去重，不发第二份', reqs(h).length === 1, String(reqs(h).length));
}

// 3. 非生成路径：问候语（first_message）、周期外的 /sendas 都不派发
{
  const h = buildHarness();
  h.stScript.chat.push({ mes: '开场白 image###greeting scene###', swipe_id: 0 });
  h.pregenFromReceivedMessage(h.stScript.chat.length - 1, 'first_message');
  await settle();
  check('开新聊天的问候语不派发', reqs(h).length === 0);
  h.onPregenGenerationStarted('normal', {}, false);
  h.pregenFromReceivedMessage(h.stScript.chat.length - 1, 'first_message');
  await settle();
  check('即便处于生成周期内，first_message 也不派发', reqs(h).length === 0);
  h.onPregenGenerationFinished();
  h.stScript.chat.push({ mes: 'image###sendas scene###', swipe_id: 0 });
  h.pregenFromReceivedMessage(h.stScript.chat.length - 1, 'normal');
  await settle();
  check('生成周期外的 MESSAGE_RECEIVED（/sendas 之类）不派发', reqs(h).length === 0);
}

// 4. dryRun 预演不进入生成周期，也不冲掉正在进行的真实生成的状态
{
  const h = buildHarness();
  h.onPregenGenerationStarted('normal', {}, true);
  check('dryRun 不进入生成周期', h.generation().active === false);
  h.stScript.chat[1].mes = 'image###old one###';
  h.onPregenGenerationStarted('continue', {}, false);
  h.pregenDispatched.add('sentinel');
  h.onPregenGenerationStarted('normal', {}, true);
  check('真实生成进行中来了 dryRun，续写基数与登记表都不受影响', h.generation().type === 'continue' && h.generation().continueBase === 1 && h.pregenDispatched.has('sentinel'));
}

// 5. 非流式续写：正文是「旧 + 新」，只派发基数之后的标签，编号用绝对序号
{
  const h = buildHarness();
  h.stScript.chat[1].mes = '开头 image###old shot### 中间';
  h.onPregenGenerationStarted('continue', {}, false);
  check('续写基数 = 已有闭合标签数', h.generation().continueBase === 1);
  h.stScript.chat[1].mes = '开头 image###old shot### 中间 续写内容 image###new shot###';
  h.pregenFromReceivedMessage(1, 'appendFinal');
  await settle();
  const r = reqs(h);
  check('续写只派发新增标签', r.length === 1 && r[0].data.prompt === 'new shot', JSON.stringify(r.map((e) => e.data.prompt)));
  check('续写编号是整条正文里的绝对序号（与按钮侧一致）', r[0]?.data.requestKey === buttonKey(h, 1, 0, 1), String(r[0]?.data.requestKey));
}

// 6. 非流式 swipe：编号带上新的 swipe 序号
{
  const h = buildHarness();
  h.onPregenGenerationStarted('swipe', {}, false);
  h.stScript.chat[1] = { mes: 'image###swiped shot###', swipe_id: 2 };
  h.pregenFromReceivedMessage(1, 'swipe');
  await settle();
  check('swipe 的编号用新的 swipe 序号', reqs(h).length === 1 && reqs(h)[0].data.requestKey === buttonKey(h, 1, 2, 0), String(reqs(h)[0]?.data.requestKey));
}

// 7. quiet / impersonate / 用户楼层 / 关闭开关：一律不派发
{
  for (const type of ['quiet', 'impersonate']) {
    const h = buildHarness();
    h.onPregenGenerationStarted(type, {}, false);
    h.stScript.chat.push({ mes: 'image###hidden shot###', swipe_id: 0 });
    h.pregenFromReceivedMessage(h.stScript.chat.length - 1, type);
    await settle();
    check(`${type} 不派发`, reqs(h).length === 0);
  }
  {
    const h = buildHarness();
    h.onPregenGenerationStarted('normal', {}, false);
    h.stScript.chat.push({ mes: 'image###user typed###', is_user: true });
    h.pregenFromReceivedMessage(h.stScript.chat.length - 1, 'normal');
    await settle();
    check('用户楼层不派发', reqs(h).length === 0);
  }
  {
    const h = buildHarness({ enablePregen: 'false' });
    h.onPregenGenerationStarted('normal', {}, false);
    h.stScript.chat.push({ mes: 'image###disabled###', swipe_id: 0 });
    h.pregenFromReceivedMessage(h.stScript.chat.length - 1, 'normal');
    await settle();
    check('关闭预生成开关时不派发', reqs(h).length === 0);
  }
}

// 8. 用户中止（GENERATION_STOPPED）同样结束周期
{
  const h = buildHarness();
  h.onPregenGenerationStarted('normal', {}, false);
  h.onPregenGenerationFinished();
  h.stScript.chat.push({ mes: 'image###after abort###', swipe_id: 0 });
  h.pregenFromReceivedMessage(h.stScript.chat.length - 1, 'normal');
  await settle();
  check('中止后到达的楼层不派发', reqs(h).length === 0);
}

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} 通过`);
process.exit(failed ? 1 : 0);
