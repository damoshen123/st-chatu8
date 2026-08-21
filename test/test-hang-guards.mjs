// 验证 persistWithDeadline 的核心断言：存库链路挂起时，界面通知不能被一起拖住；
// 但存库失败仍必须照旧报错，且迟到的 rejection 不能变成 unhandledRejection。
// 直接从 index.js 抽取函数源码运行，确保测的就是真正发布的那份代码。
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../index.js', import.meta.url), 'utf8');
function extract(signature, name) {
  const start = src.indexOf(signature);
  if (start === -1) throw new Error(`未在 index.js 中找到 ${name}`);
  let depth = 0, end = -1;
  for (let i = src.indexOf('{', start); i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
  }
  return new Function(`${src.slice(start, end)}; return ${name};`)();
}
const persistWithDeadline = extract('async function persistWithDeadline(', 'persistWithDeadline');

const unhandled = [];
process.on('unhandledRejection', (e) => unhandled.push(e));

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
};

// a) 存库正常：原样返回结果，且不该白等超时
{
  const t0 = Date.now();
  const value = await persistWithDeadline(Promise.resolve('SAVED'), 'banana', 2000);
  const cost = Date.now() - t0;
  check('存库成功 → 原样返回且不等超时', value === 'SAVED' && cost < 500, `返回 ${value} / ${cost}ms`);
}

// b) 核心用例：存库永久挂起 —— 必须按时放行去通知界面，而且不能抛错
{
  const t0 = Date.now();
  let value, threw = null;
  try { value = await persistWithDeadline(new Promise(() => {}), 'banana', 300); }
  catch (e) { threw = e; }
  const cost = Date.now() - t0;
  check(
    '存库永久挂起 → 超时放行、不抛错（按钮不再永久转圈）',
    !threw && value === '__persist_timeout__' && cost >= 290 && cost < 1500,
    threw ? `抛了 ${threw.message}` : `返回 ${value} / ${cost}ms`,
  );
}

// c) 存库失败仍要报错：这条语义不能被兜底逻辑吃掉，否则「界面有、库里没有」会变成无声故障
{
  let threw = null;
  try { await persistWithDeadline(Promise.reject(new Error('上传失败: 413')), 'banana', 2000); }
  catch (e) { threw = e; }
  check('存库失败 → 照旧抛错', threw !== null && /413/.test(threw.message), threw ? threw.message : '没有抛错');
}

// d) 超时放行之后存库才失败：只能记日志，不能变成 unhandledRejection
{
  let late;
  const p = new Promise((_, rej) => { late = rej; });
  const value = await persistWithDeadline(p, 'banana', 200);
  late(new Error('迟到的存库失败'));
  await new Promise((r) => setTimeout(r, 300));
  check(
    '超时放行后存库才失败 → 不产生 unhandledRejection',
    value === '__persist_timeout__' && unhandled.length === 0,
    unhandled.length ? `出现 ${unhandled.length} 个未处理拒绝: ${unhandled.map((e) => e.message).join(', ')}` : '干净',
  );
}

// ---- scheduleStegoSync：后台串行 + 末位合并 ----
const stegoSrc = (() => {
  const start = src.indexOf('function scheduleStegoSync(');
  if (start === -1) throw new Error('未在 index.js 中找到 scheduleStegoSync');
  let depth = 0;
  for (let i = src.indexOf('{', start); i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(start, i + 1); }
  }
})();
const makeScheduler = (ctx) => new Function('ctx', `
  var stegoSyncState = { running: false, pending: false };
  async function updateStegoImage() { return ctx.impl(); }
  ${stegoSrc}
  return { schedule: scheduleStegoSync, state: () => stegoSyncState };
`)(ctx);

// e) 不阻塞调用方：即使备份很慢，schedule 也必须立刻返回
{
  const ctx = { calls: 0, impl: () => new Promise((r) => setTimeout(r, 400)) };
  const s = makeScheduler(ctx);
  const t0 = Date.now();
  s.schedule();
  const cost = Date.now() - t0;
  check('schedule 立即返回（备份不再阻塞生图链路）', cost < 50, `${cost}ms`);
  await new Promise((r) => setTimeout(r, 600));
}

// f) 末位合并：跑的过程中连续请求多次，只应再补跑一次
{
  const ctx = { calls: 0, impl: null };
  ctx.impl = () => { ctx.calls++; return new Promise((r) => setTimeout(r, 200)); };
  const s = makeScheduler(ctx);
  s.schedule();
  s.schedule(); s.schedule(); s.schedule();
  await new Promise((r) => setTimeout(r, 900));
  check('执行中的多次请求合并成一次补跑', ctx.calls === 2, `实际执行 ${ctx.calls} 次`);
  check('跑完后状态复位，后续还能再触发', s.state().running === false, `running=${s.state().running}`);
}

// g) 备份自身抛错也必须复位状态，否则后面永远不再备份
{
  const ctx = { calls: 0, impl: null };
  ctx.impl = () => { ctx.calls++; return Promise.reject(new Error('上传挂了')); };
  const s = makeScheduler(ctx);
  s.schedule();
  await new Promise((r) => setTimeout(r, 100));
  const recovered = s.state().running === false;
  s.schedule();
  await new Promise((r) => setTimeout(r, 100));
  check('备份抛错后状态复位且能再次触发', recovered && ctx.calls === 2, `running=${s.state().running} calls=${ctx.calls}`);
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} 通过`);
process.exit(failed.length ? 1 : 0);
