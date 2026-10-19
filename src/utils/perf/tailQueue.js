// 还原自打包产物 — 原始模块: utils/perf/tailQueue.js
import { getPerfState, isPerfFeatureEnabled } from "./perfConfig.js";

var _tailState, _tailSwitchMemo;

_tailState = null;

_tailSwitchMemo = null;

function isTailEnabled() {
  if (_tailSwitchMemo !== null) return _tailSwitchMemo;
  _tailSwitchMemo = isPerfFeatureEnabled("tailOffMainThread", true);
  return _tailSwitchMemo;
}

function tailYield() {
  if (_tailState && _tailState.flushing) return Promise.resolve();
  try {
    if (typeof window !== "undefined" && window.scheduler && typeof window.scheduler.yield === "function") {
      return window.scheduler.yield();
    }
  } catch (_) {
  }
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function tailTick() {
  return new Promise((resolve) => {
    try {
      if (typeof MessageChannel === "function") {
        const channel = new MessageChannel();
        channel.port1.onmessage = () => {
          channel.port1.close();
          resolve();
        };
        channel.port2.postMessage(0);
        return;
      }
    } catch (_) {
    }
    setTimeout(resolve, 0);
  });
}

async function tailStep(options) {
  if (!options || options.__tailRun !== true) return;
  const stepJob = options.__tailJob;
  if (stepJob && stepJob.canceled) {
    throw new Error("\u6536\u5C3E\u4EFB\u52A1\u5DF2\u53D6\u6D88");
  }
  if (_tailState && _tailState.flushing) return;
  await tailYield();
}

function getTailState() {
  if (_tailState) return _tailState;
  const state3 = {
    jobs: [],
    seq: 0,
    running: false,
    scheduled: false,
    paused: false,
    flushing: false,
    current: null,
    completed: 0,
    failed: 0,
    canceled: 0
  };
  _tailState = state3;
  try {
    if (typeof window !== "undefined") {
      window.addEventListener("pagehide", tailFlushForUnload, true);
      window.addEventListener("beforeunload", tailFlushForUnload);
      const perfState = getPerfState();
      perfState.tail = {
        pending: () => _tailState ? _tailState.jobs.length : 0,
        stats: () => _tailState ? {
          pending: _tailState.jobs.length,
          running: _tailState.running,
          completed: _tailState.completed,
          failed: _tailState.failed,
          canceled: _tailState.canceled
        } : null,
        idle: () => !(_tailState && (_tailState.running || _tailState.jobs.length > 0)),
        flush: () => tailRun(),
        pause: () => {
          if (_tailState) _tailState.paused = true;
        },
        resume: () => {
          if (_tailState) {
            _tailState.paused = false;
            tailKick();
          }
        },
        cancel: (id) => tailCancel(id),
        cancelAll: () => tailCancel(null)
      };
    }
  } catch (_) {
  }
  return state3;
}

function tailCancel(id) {
  const state3 = getTailState();
  let count = 0;
  const cancelAll = id === null || id === void 0;
  for (let i = state3.jobs.length - 1; i >= 0; i--) {
    if (cancelAll || state3.jobs[i].id === id) {
      state3.jobs[i].canceled = true;
      state3.jobs.splice(i, 1);
      state3.canceled++;
      count++;
    }
  }
  if (state3.current && (cancelAll || state3.current.id === id)) {
    state3.current.canceled = true;
    try {
      if (state3.current.controller) state3.current.controller.abort();
    } catch (_) {
    }
    count++;
  }
  return count;
}

function tailKick() {
  const state3 = getTailState();
  if (state3.running || state3.scheduled || state3.paused || state3.jobs.length === 0 || state3.flushing) return;
  state3.scheduled = true;
  setTimeout(() => {
    state3.scheduled = false;
    tailRun();
  }, 0);
}

function tailNotify(job, error) {
  if (!error) {
    try {
      if (typeof job.onSuccess === "function") job.onSuccess();
    } catch (e) {
      console.error("[TailQueue] \u6210\u529F\u56DE\u8C03\u6267\u884C\u5F02\u5E38:", e);
    }
    return;
  }
  let delivered = false;
  if (typeof job.onError === "function") {
    try {
      job.onError(error);
      delivered = true;
    } catch (e) {
      console.error("[TailQueue] \u5931\u8D25\u56DE\u8C03\u6267\u884C\u5F02\u5E38:", e);
    }
  }
  try {
    const perfState = getPerfState();
    if (perfState && perfState.tail) {
      perfState.tail.lastError = {
        name: job.name || "",
        message: error?.message ? error.message : String(error),
        at: Date.now()
      };
    }
  } catch (_) {
  }
  if (!delivered) {
    try {
      if (typeof toastr !== "undefined" && typeof toastr.error === "function") {
        toastr.error("\u56FE\u7247\u5DF2\u663E\u793A\uFF0C\u4F46\u540E\u53F0\u4FDD\u5B58\u5230\u6570\u636E\u5E93\u5931\u8D25\uFF0C\u8BE6\u89C1\u63A7\u5236\u53F0\u65E5\u5FD7\u3002");
      }
    } catch (_) {
    }
  }
}

async function tailRun() {
  const state3 = getTailState();
  if (state3.running) return;
  state3.running = true;
  try {
    while (state3.jobs.length > 0) {
      if (state3.paused && !state3.flushing) break;
      const job = state3.jobs.shift();
      if (job.canceled) continue;
      state3.current = job;
      try {
        await job.run(job);
        state3.completed++;
        tailNotify(job, null);
      } catch (error) {
        if (job.canceled) {
          state3.canceled++;
        } else {
          state3.failed++;
          console.error("[TailQueue] \u6536\u5C3E\u4EFB\u52A1\u6267\u884C\u5931\u8D25:", job.name || "", error);
          tailNotify(job, error);
        }
      }
      state3.current = null;
      await tailTick();
    }
  } finally {
    state3.running = false;
  }
  if (state3.jobs.length > 0 && !state3.paused) {
    tailKick();
  }
}

function tailFlushForUnload() {
  const state3 = getTailState();
  state3.flushing = true;
  state3.paused = false;
  if (!state3.running && state3.jobs.length > 0) {
    try {
      const drained = tailRun();
      if (drained && typeof drained.catch === "function") drained.catch(() => {
      });
    } catch (_) {
    }
    return;
  }
  while (state3.jobs.length > 0) {
    const job = state3.jobs.shift();
    if (job.canceled) continue;
    try {
      const pending = job.run(job);
      if (pending && typeof pending.then === "function") {
        pending.then(() => tailNotify(job, null), (err) => tailNotify(job, err));
      }
    } catch (e) {
      tailNotify(job, e);
    }
  }
}

function tailEnqueue(name, run, hooks = {}) {
  const state3 = getTailState();
  let controller = null;
  try {
    if (typeof AbortController === "function") controller = new AbortController();
  } catch (_) {
  }
  const job = {
    id: ++state3.seq,
    name,
    run,
    canceled: false,
    controller,
    signal: controller ? controller.signal : null,
    onSuccess: typeof hooks?.onSuccess === "function" ? hooks.onSuccess : null,
    onError: typeof hooks?.onError === "function" ? hooks.onError : null
  };
  state3.jobs.push(job);
  if (state3.flushing) {
    try {
      const started = job.run(job);
      if (started && typeof started.then === "function") {
        started.then(() => tailNotify(job, null), (err) => tailNotify(job, err));
      }
    } catch (e) {
      tailNotify(job, e);
    }
    return job.id;
  }
  if (state3.paused) return job.id;
  tailKick();
  return job.id;
}

export { isTailEnabled, tailEnqueue, tailStep };
