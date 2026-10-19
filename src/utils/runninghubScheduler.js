// 还原自打包产物 — 原始模块: utils/runninghubScheduler.js
var RunningHubScheduler;

RunningHubScheduler = class {
      constructor({ keys, limit, globalLimit = () => 0, pausedKey = () => false, probe, log: log3 = () => {
      } }) {
        this.keys = keys;
        this.limit = limit;
        this.globalLimit = globalLimit;
        this.pausedKey = pausedKey;
        this.probe = probe;
        this.log = log3;
        this.states = /* @__PURE__ */ new Map();
        this.waiters = [];
        this.activeLeasesByTaskId = /* @__PURE__ */ new Map();
        this.sequence = 0;
      }
      state(key) {
        if (!this.states.has(key)) {
          this.states.set(key, { active: 0, lastUsed: 0, cooldown: 0, info: null, checking: false, checkedAt: 0, probeFailures: 0 });
        }
        return this.states.get(key);
      }
      totalActive() {
        let sum = 0;
        for (const s of this.states.values()) sum += s.active;
        return sum;
      }
      configuredGlobalLimit() {
        const val = Number(this.globalLimit());
        return Number.isFinite(val) && val > 0 ? Math.floor(val) : Infinity;
      }
      effectiveLimit(key, officialLimit = 1) {
        const local = Number(this.limit(key));
        const activeCap = Number.isFinite(local) && local > 0 ? Math.floor(local) : Infinity;
        return Math.min(activeCap, officialLimit);
      }
      /**
       * 清除指定或全部 Key 的探针缓存 (供任务消费或扣减后同步失效)
       */
      invalidateKey(apiKey) {
        if (apiKey) {
          const s = this.states.get(apiKey);
          if (s) {
            s.info = null;
            s.checkedAt = 0;
            s.probeFailures = 0;
          }
        } else {
          for (const s of this.states.values()) {
            s.info = null;
            s.checkedAt = 0;
            s.probeFailures = 0;
          }
        }
      }
      /**
       * 获取指定 Key 的当前本地运行并发任务数 (兼容旧版导出)
       */
      getLocalActiveCount(apiKey) {
        return this.states.get(apiKey)?.active || 0;
      }
      /**
       * 强制重置所有本地 Key 并发计数 (自愈与调试)
       */
      resetAllKeyActiveCounts() {
        for (const s of this.states.values()) {
          s.active = 0;
          s.cooldown = 0;
          s.probeFailures = 0;
        }
        this.activeLeasesByTaskId.clear();
        this.log("[RunningHub] \u5DF2\u5F3A\u5236\u91CD\u7F6E\u6240\u6709\u672C\u5730\u5E76\u53D1\u901A\u9053\u4E3A 0");
        this.pump();
      }
      /**
       * 申请通道 (支持 abortSignal 与 isTaskCancelled 回调)
       */
      acquire({ apiKeys, abortSignal, taskId, isTaskCancelled, priority = "normal", timeoutMs = 6e5 } = {}) {
        return new Promise((resolve, reject) => {
          if (abortSignal?.aborted || typeof isTaskCancelled === "function" && isTaskCancelled()) {
            return reject(new Error("\u4EFB\u52A1\u5DF2\u53D6\u6D88"));
          }
          const waiter = {
            taskId,
            apiKeys,
            abortSignal,
            isTaskCancelled,
            priority,
            deadline: Date.now() + timeoutMs,
            resolve,
            reject,
            settled: false
          };
          waiter.abort = () => this.finishWaiter(waiter, new Error("\u4EFB\u52A1\u5DF2\u53D6\u6D88"));
          abortSignal?.addEventListener("abort", waiter.abort, { once: true });
          waiter.timer = setTimeout(() => this.finishWaiter(waiter, new Error("\u7B49\u5F85 RunningHub \u901A\u9053\u8D85\u65F6 (10\u5206\u949F)")), timeoutMs);
          if (priority === "high") {
            this.waiters.unshift(waiter);
          } else {
            this.waiters.push(waiter);
          }
          this.pump();
        });
      }
      finishWaiter(w, err, lease) {
        if (w.settled) return;
        w.settled = true;
        clearTimeout(w.timer);
        w.abortSignal?.removeEventListener("abort", w.abort);
        this.waiters = this.waiters.filter((item) => item !== w);
        if (err) w.reject(err);
        else w.resolve(lease);
        if (this.waiters.length > 0) {
          setTimeout(() => this.pump(), 0);
        }
      }
      // 核心分配循环：完全同步原子操作！含全 Key 异常快速失败机制
      pump() {
        if (!this.waiters.length) return;
        const globalLimit = this.configuredGlobalLimit();
        for (const w of [...this.waiters]) {
          if (w.settled) continue;
          if (w.abortSignal?.aborted || typeof w.isTaskCancelled === "function" && w.isTaskCancelled()) {
            w.abort();
            continue;
          }
          if (this.totalActive() >= globalLimit) break;
          const allConfigured = this.keys();
          const keys = [...new Set(w.apiKeys?.length ? w.apiKeys : allConfigured)];
          if (!keys.length) {
            this.finishWaiter(w, new Error("\u672A\u914D\u7F6E\u4EFB\u4F55 RunningHub API Key"));
            continue;
          }
          const candidates = [];
          let pausedCount = 0;
          let cooldownCount = 0;
          let zeroBalanceCount = 0;
          let authInvalidCount = 0;
          let networkFailCount = 0;
          let busyCount = 0;
          for (const key of keys) {
            if (this.pausedKey(key)) {
              pausedCount++;
              continue;
            }
            const s = this.state(key);
            if (s.probeFailures >= 2) {
              networkFailCount++;
              continue;
            }
            if (s.cooldown > Date.now()) {
              cooldownCount++;
              continue;
            }
            const isInfoStale = !s.info || Date.now() - s.checkedAt > 3e4;
            if (isInfoStale && !s.checking) {
              this.refreshKey(key);
              if (!s.info) continue;
            }
            const q = s.info?.queue;
            const b = s.info?.balance;
            if (q && !q.isValid) {
              authInvalidCount++;
              continue;
            }
            if (b && (!b.isValid || !b.hasBalance)) {
              zeroBalanceCount++;
              continue;
            }
            if (!q || !b) continue;
            const cap = this.effectiveLimit(key, q.limit);
            if (s.active >= cap) {
              busyCount++;
              continue;
            }
            candidates.push({ key, s, cap });
          }
          if (!candidates.length) {
            if (this.totalActive() === 0) {
              if (pausedCount === keys.length) {
                this.finishWaiter(w, new Error("\u914D\u7F6E\u7684\u5168\u90E8 RunningHub API Key \u5747\u5904\u4E8E\u6682\u505C\u72B6\u6001\uFF0C\u8BF7\u5728\u8BBE\u7F6E\u4E2D\u6062\u590D\u542F\u7528\uFF01"));
                continue;
              }
              if (networkFailCount > 0 && networkFailCount + pausedCount === keys.length) {
                this.finishWaiter(w, new Error("RunningHub \u670D\u52A1\u8FDE\u63A5\u5931\u8D25\u6216\u7F51\u7EDC\u5F02\u5E38\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u8FDE\u63A5\u4E0E\u63A5\u53E3\u5730\u5740\uFF01"));
                continue;
              }
              if (cooldownCount === 0) {
                if (authInvalidCount > 0 && authInvalidCount + pausedCount === keys.length) {
                  this.finishWaiter(w, new Error("\u914D\u7F6E\u7684 RunningHub API Key \u9274\u6743\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u8BBE\u7F6E\u4E2D\u7684 Key \u662F\u5426\u6709\u6548\uFF01"));
                  continue;
                }
                if (zeroBalanceCount > 0 && zeroBalanceCount + pausedCount === keys.length) {
                  this.finishWaiter(w, new Error("\u914D\u7F6E\u7684\u5168\u90E8\u53EF\u7528 RunningHub API Key \u4F59\u989D\u5747\u5C0F\u4E8E\u7B49\u4E8E0\uFF0C\u8BF7\u5145\u503C\u540E\u91CD\u8BD5\uFF01"));
                  continue;
                }
              }
            }
            continue;
          }
          candidates.sort((a, b) => a.s.active / a.cap - b.s.active / b.cap || a.s.lastUsed - b.s.lastUsed);
          const chosen = candidates[0];
          const lease = this.allocateLease(chosen.key, chosen.s, w);
          this.finishWaiter(w, null, lease);
        }
      }
      allocateLease(key, s, w) {
        s.active++;
        s.lastUsed = ++this.sequence;
        let released = false;
        let onAbort = null;
        const lease = {
          id: this.sequence,
          apiKey: key,
          taskId: w.taskId,
          remoteTaskId: null,
          cancelled: false,
          queueInfo: s.info?.queue,
          remainCoins: s.info?.balance?.remainCoins,
          isCancelled: () => lease.cancelled,
          // 晚绑定与孤儿终止，防止网络间隙期取消导致云端任务泄漏
          setRemoteTaskId: (rId) => {
            lease.remoteTaskId = rId;
            if (lease.cancelled) {
              runningHubCancelRemote(lease.apiKey, rId);
            }
          },
          // 终态或异常释放通道（含清理外部事件监听，防内存泄漏）
          releaseKey: () => {
            if (released) return;
            released = true;
            if (onAbort && w.abortSignal) {
              w.abortSignal.removeEventListener("abort", onAbort);
              onAbort = null;
            }
            if (w.taskId && this.activeLeasesByTaskId.has(w.taskId)) {
              const set = this.activeLeasesByTaskId.get(w.taskId);
              set.delete(lease);
              if (set.size === 0) this.activeLeasesByTaskId.delete(w.taskId);
            }
            s.active = Math.max(0, s.active - 1);
            this.log(`[RunningHub] \u91CA\u653E Key \u901A\u9053 (\u672C\u5730\u5269\u4F59\u8FD0\u884C: ${s.active})`);
            setTimeout(() => this.pump(), 0);
          },
          // 官方满载退避 3.5s，挂载精准自愈唤醒时钟，杜绝单 Key 假死
          markRejected: () => {
            s.cooldown = Date.now() + 3500;
            lease.releaseKey();
            setTimeout(() => this.pump(), 3550);
          }
        };
        if (w.abortSignal) {
          onAbort = () => {
            lease.cancelled = true;
            if (lease.remoteTaskId) {
              runningHubCancelRemote(lease.apiKey, lease.remoteTaskId);
            }
            lease.releaseKey();
          };
          if (w.abortSignal.aborted) onAbort();
          else w.abortSignal.addEventListener("abort", onAbort, { once: true });
        }
        if (w.taskId) {
          if (!this.activeLeasesByTaskId.has(w.taskId)) {
            this.activeLeasesByTaskId.set(w.taskId, /* @__PURE__ */ new Set());
          }
          this.activeLeasesByTaskId.get(w.taskId).add(lease);
        }
        return lease;
      }
      /**
       * 探针刷新：无论成功或失败均更新时间戳，防死循环；失败时附带 10s 冷却惩罚与自愈时钟，记录连续失败数
       */
      async refreshKey(key) {
        const s = this.state(key);
        if (s.checking || Date.now() - s.checkedAt < 5e3) return;
        s.checking = true;
        try {
          s.info = await this.probe(key);
          s.checkedAt = Date.now();
          s.probeFailures = 0;
        } catch (e) {
          s.info = null;
          s.checkedAt = Date.now();
          s.probeFailures = (s.probeFailures || 0) + 1;
          s.cooldown = Date.now() + 1e4;
          setTimeout(() => this.pump(), 10050);
        } finally {
          s.checking = false;
          this.pump();
        }
      }
      /**
       * 取消指定 taskId 的所有排队与运行任务 (包含联动远端云端撤销)
       */
      cancel(taskId) {
        if (!taskId) return;
        for (const w of [...this.waiters]) {
          if (w.taskId === taskId) w.abort();
        }
        const leases = this.activeLeasesByTaskId.get(taskId);
        if (leases && leases.size > 0) {
          for (const lease of Array.from(leases)) {
            lease.cancelled = true;
            if (lease.remoteTaskId && lease.apiKey) {
              runningHubCancelRemote(lease.apiKey, lease.remoteTaskId);
            }
            lease.releaseKey();
          }
          this.activeLeasesByTaskId.delete(taskId);
        }
      }
    };

async function runningHubFetch(url, options = {}, timeoutMs = 6e4) {
  const controller = new AbortController();
  const abort = () => controller.abort(options.signal?.reason);
  if (options.signal?.aborted) abort();
  else options.signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(() => controller.abort(new Error("RunningHub \u8BF7\u6C42\u8D85\u65F6")), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const body = await response.arrayBuffer();
    if (!response.ok) {
      let detail = "";
      try {
        const data = JSON.parse(new TextDecoder().decode(body));
        detail = data.errorMessage || data.msg || "";
      } catch (_) {
      }
      const error = new Error(`RunningHub HTTP ${response.status}${detail ? ": " + detail : ""}`);
      error.status = response.status;
      throw error;
    }
    return new Response(body, { status: response.status, headers: response.headers });
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", abort);
  }
}

async function runningHubReadWithRetry(operation, { signal, maxAttempts = 4 } = {}) {
  const delays = [1e3, 2e3, 4e3];
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (signal?.aborted) throw signal.reason || new Error("\u4EFB\u52A1\u5DF2\u53D6\u6D88");
    try {
      return await operation();
    } catch (error) {
      const status = Number(error.status);
      const isUnrecoverableAuth = status >= 400 && status < 500 && ![408, 429].includes(status);
      if (signal?.aborted || attempt + 1 >= maxAttempts || isUnrecoverableAuth) {
        throw error;
      }
      const delayMs = delays[attempt] || 4e3;
      await new Promise((resolve, reject) => {
        const t = setTimeout(resolve, delayMs);
        signal?.addEventListener("abort", () => {
          clearTimeout(t);
          reject(signal.reason || new Error("\u4EFB\u52A1\u5DF2\u53D6\u6D88"));
        }, { once: true });
      });
    }
  }
}

async function runningHubCancelRemote(apiKey, taskId) {
  if (!apiKey || !taskId) return;
  try {
    await runningHubFetch("https://www.runninghub.ai/task/openapi/cancel", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({ apiKey, taskId })
    }, 15e3);
    console.log(`[RunningHub] \u5DF2\u5411\u4E91\u7AEF\u53D1\u9001\u8FDC\u7AEF\u53D6\u6D88\u6307\u4EE4 (Task: ${taskId})`);
  } catch (e) {
    console.warn("[RunningHub] \u53D1\u9001\u8FDC\u7AEF\u53D6\u6D88\u8BF7\u6C42\u5F02\u5E38 (\u5DF2\u5FFD\u7565):", e.message);
  }
}

export { RunningHubScheduler, runningHubFetch, runningHubReadWithRetry };
