// 还原自打包产物 — 原始模块: utils/comfyuiAdapter.js
var multiGpuCache;

multiGpuCache = /* @__PURE__ */ new Map();

function normalizeUrl(url) {
  if (!url) return "";
  return url.replace(/\/+$/, "");
}

async function detectMultiGpu(rawUrl) {
  const url = normalizeUrl(rawUrl);
  if (!url) return false;
  if (multiGpuCache.has(url)) {
    return multiGpuCache.get(url);
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${url}/mgpu/status`, {
      method: "GET",
      signal: controller.signal
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      const isMulti = !!(data && (data.enabled === true || data.status === "running" || Array.isArray(data.workers)));
      multiGpuCache.set(url, isMulti);
      return isMulti;
    }
  } catch {
  }
  multiGpuCache.set(url, false);
  return false;
}

async function fetchHistory(rawUrl, promptId, options = {}) {
  const url = normalizeUrl(rawUrl);
  let isMulti = multiGpuCache.get(url);
  if (isMulti === void 0) {
    isMulti = await detectMultiGpu(url);
  }
  if (isMulti) {
    try {
      const mgpuRes = await fetch(`${url}/mgpu/history/${promptId}`, options);
      if (mgpuRes.ok) {
        return mgpuRes;
      }
    } catch (err) {
      if (options.signal && options.signal.aborted) {
        throw err;
      }
    }
  }
  return await fetch(`${url}/history/${promptId}`, options);
}

async function interruptAll(rawUrl, options = {}) {
  const url = normalizeUrl(rawUrl);
  if (!url) return;
  const isMulti = multiGpuCache.get(url);
  const headers = options.headers || {};
  const requests = [
    fetch(`${url}/api/interrupt`, {
      method: "POST",
      headers
    }).catch(() => {
    })
  ];
  if (isMulti !== false) {
    requests.push(
      fetch(`${url}/mgpu/interrupt`, {
        method: "POST",
        headers
      }).catch(() => {
      })
    );
  }
  await Promise.allSettled(requests);
}

export { detectMultiGpu, fetchHistory, interruptAll };
