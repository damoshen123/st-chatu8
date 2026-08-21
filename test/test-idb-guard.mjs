// 验证 awaitIdbRequest 的核心断言：事务被中止 / 静默挂起时必须 reject，而不是永久 pending。
// 直接从 index.js 抽取函数源码运行，确保测的就是真正发布的那份代码。
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../index.js', import.meta.url), 'utf8');
const start = src.indexOf('function awaitIdbRequest(');
if (start === -1) throw new Error('未在 index.js 中找到 awaitIdbRequest');
let depth = 0, end = -1;
for (let i = src.indexOf('{', start); i < src.length; i++) {
  if (src[i] === '{') depth++;
  else if (src[i] === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
}
const awaitIdbRequest = new Function(`${src.slice(start, end)}; return awaitIdbRequest;`)();

const fakePair = () => ({ transaction: {}, request: {} });
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
};
// 任何用例都不允许挂起：整体加一个硬性看护，超时即视为失败。
const withGuard = (p, name) => Promise.race([
  p,
  new Promise((_, rej) => setTimeout(() => rej(new Error(`用例「${name}」自身挂起了`)), 5000)),
]);

// a) 正常成功路径
{
  const { transaction, request } = fakePair();
  const p = awaitIdbRequest(transaction, request, 'put', 1000);
  request.onsuccess({ target: { result: 'VALUE' } });
  try {
    check('request.onsuccess → resolve 且带回结果', (await withGuard(p, 'a')) === 'VALUE');
  } catch (e) { check('request.onsuccess → resolve 且带回结果', false, e.message); }
}

// b) request 自身报错
{
  const { transaction, request } = fakePair();
  request.error = new Error('QuotaExceededError');
  const p = awaitIdbRequest(transaction, request, 'put', 1000);
  request.onerror();
  try { await withGuard(p, 'b'); check('request.onerror → reject', false, '竟然 resolve 了'); }
  catch (e) { check('request.onerror → reject', e.message === 'QuotaExceededError', e.message); }
}

// c) 核心用例：事务被中止，request 回调完全不触发（旧代码在这里永久挂起）
{
  const { transaction, request } = fakePair();
  transaction.error = null;
  const p = awaitIdbRequest(transaction, request, '写入 abc', 1000);
  transaction.onabort();
  try { await withGuard(p, 'c'); check('transaction.onabort（request 静默）→ reject', false, '竟然 resolve 了'); }
  catch (e) { check('transaction.onabort（request 静默）→ reject', /事务被中止/.test(e.message), e.message); }
}

// d) 事务层报错
{
  const { transaction, request } = fakePair();
  const p = awaitIdbRequest(transaction, request, '读取 abc', 1000);
  transaction.onerror();
  try { await withGuard(p, 'd'); check('transaction.onerror（request 静默）→ reject', false, '竟然 resolve 了'); }
  catch (e) { check('transaction.onerror（request 静默）→ reject', /事务出错/.test(e.message), e.message); }
}

// e) 谁都不触发：兜底超时必须生效
{
  const { transaction, request } = fakePair();
  const t0 = Date.now();
  const p = awaitIdbRequest(transaction, request, 'put', 300);
  try { await withGuard(p, 'e'); check('全程静默 → 兜底超时 reject', false, '竟然 resolve 了'); }
  catch (e) { check('全程静默 → 兜底超时 reject', /超时/.test(e.message) && Date.now() - t0 >= 290, `${e.message} / ${Date.now() - t0}ms`); }
}

// f) 只 settle 一次：超时之后迟到的回调不得再次改变结果或抛错
{
  const { transaction, request } = fakePair();
  const p = awaitIdbRequest(transaction, request, 'put', 100);
  // 必须在等待之前就接住结果，否则超时 reject 会先变成 unhandledRejection 把进程带走。
  const outcome = p.then((v) => ({ ok: true, v }), (e) => ({ ok: false, e }));
  await new Promise((r) => setTimeout(r, 200));
  let threw = null;
  try { request.onsuccess({ target: { result: 'LATE' } }); transaction.onabort(); } catch (e) { threw = e; }
  const r = await outcome;
  check(
    '迟到回调不破坏已 settle 的结果',
    !r.ok && /超时/.test(r.e.message) && !threw,
    r.ok ? '竟然 resolve 了' : `${r.e.message}${threw ? ' / 迟到回调抛错: ' + threw.message : ''}`,
  );
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} 通过`);
process.exit(failed.length ? 1 : 0);
