// 还原自打包产物 — 原始模块: utils/errorCollector.js
import { extensionFolderPath, extensionName } from "./config.js";
import { exportLogsWithHistory } from "./utils.js";

var ERROR_DEDUPE_WINDOW_MS, MAX_ERROR_ENTRIES, PLUGIN_MARKERS, errorEntries, globalErrorHandlerInstalled;

errorEntries = [];

MAX_ERROR_ENTRIES = 500;

ERROR_DEDUPE_WINDOW_MS = 15e3;

PLUGIN_MARKERS = [
      extensionName.toLowerCase(),
      extensionFolderPath.toLowerCase(),
      `/scripts/extensions/third-party/${extensionName}`.toLowerCase(),
      `scripts/extensions/third-party/${extensionName}`.toLowerCase()
    ];

globalErrorHandlerInstalled = false;

function toSafeString(value) {
  if (value == null) return "";
  return String(value);
}

function containsPluginMarker(value) {
  const text = toSafeString(value).toLowerCase();
  return PLUGIN_MARKERS.some((marker) => text.includes(marker));
}

function extractErrorDetails(error) {
  const details = {};
  if (error instanceof Error) {
    details.stack = error.stack;
    details.errorName = error.name;
    details.errorMessage = error.message;
    return details;
  }
  if (!error || typeof error !== "object") {
    return details;
  }
  details.context = error;
  if (typeof error.stack === "string") details.stack = error.stack;
  if (typeof error.name === "string") details.errorName = error.name;
  if (typeof error.message === "string") details.errorMessage = error.message;
  if (typeof error.source === "string") details.source = error.source;
  if (Number.isFinite(error.lineno)) details.lineno = error.lineno;
  if (Number.isFinite(error.colno)) details.colno = error.colno;
  if (error.error instanceof Error) {
    if (!details.stack) details.stack = error.error.stack;
    if (!details.errorName) details.errorName = error.error.name;
    if (!details.errorMessage) details.errorMessage = error.error.message;
  }
  return details;
}

function inferSourceScope(type, details) {
  if (type === "api" || type === "validation" || type === "config" || type === "runtime") {
    return "plugin";
  }
  const candidates = [
    details.source,
    details.stack,
    details.errorMessage,
    details.context?.message,
    details.context?.title,
    details.context?.source
  ];
  if (candidates.some(containsPluginMarker)) {
    return "plugin";
  }
  if (details.source || details.stack) {
    return "external";
  }
  return "unknown";
}

function getEntrySignature(type, message, details) {
  const stackLine = toSafeString(details.stack).split("\n").map((line) => line.trim()).find(Boolean) || "";
  return [
    toSafeString(type),
    toSafeString(message),
    toSafeString(details.source),
    toSafeString(details.lineno),
    toSafeString(details.colno),
    toSafeString(details.errorMessage),
    stackLine
  ].join("|");
}

function mergeEntry(target, details, timestamp) {
  target.timestamp = timestamp;
  target.lastSeen = timestamp;
  target.count = (target.count || 1) + 1;
  if (!target.stack && details.stack) target.stack = details.stack;
  if (!target.errorName && details.errorName) target.errorName = details.errorName;
  if (!target.errorMessage && details.errorMessage) target.errorMessage = details.errorMessage;
  if (!target.source && details.source) target.source = details.source;
  if (target.lineno == null && details.lineno != null) target.lineno = details.lineno;
  if (target.colno == null && details.colno != null) target.colno = details.colno;
  if (!target.context && details.context) target.context = details.context;
}

function collectError(type, message, error) {
  const timestamp = Date.now();
  const details = extractErrorDetails(error);
  const signature = getEntrySignature(type, message, details);
  const sourceScope = inferSourceScope(type, details);
  for (let i = errorEntries.length - 1; i >= 0; i--) {
    const existing = errorEntries[i];
    if (existing.signature === signature && timestamp - (existing.lastSeen || existing.timestamp) <= ERROR_DEDUPE_WINDOW_MS) {
      mergeEntry(existing, details, timestamp);
      console.error(`[${extensionName}] ${type}: ${message}`, error);
      return;
    }
  }
  const entry = {
    timestamp,
    firstSeen: timestamp,
    lastSeen: timestamp,
    type: type || "unknown",
    message: message || "\u672A\u77E5\u9519\u8BEF",
    count: 1,
    sourceScope,
    signature
  };
  if (details.stack) entry.stack = details.stack;
  if (details.errorName) entry.errorName = details.errorName;
  if (details.errorMessage) entry.errorMessage = details.errorMessage;
  if (details.context) entry.context = details.context;
  if (details.source) entry.source = details.source;
  if (details.lineno != null) entry.lineno = details.lineno;
  if (details.colno != null) entry.colno = details.colno;
  errorEntries.push(entry);
  if (errorEntries.length > MAX_ERROR_ENTRIES) {
    errorEntries.shift();
  }
  console.error(`[${extensionName}] ${type}: ${message}`, error);
}

function installGlobalErrorHandler() {
  if (globalErrorHandlerInstalled) return;
  window.addEventListener("unhandledrejection", (event) => {
    try {
      collectError("unhandled_promise", "\u672A\u5904\u7406\u7684 Promise \u62D2\u7EDD", event.reason);
    } catch (e) {
    }
  });
  const originalErrorHandler = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    try {
      collectError("global", `\u5168\u5C40\u9519\u8BEF: ${message}`, {
        source,
        lineno,
        colno,
        error
      });
    } catch (e) {
    }
    if (originalErrorHandler) {
      return originalErrorHandler.apply(this, arguments);
    }
    return false;
  };
  const originalAlert = window.alert;
  window.alert = function(message) {
    try {
      const msgStr = String(message || "");
      const isError = /失败|错误|Error|Failed|异常|Exception|无法|不能|问题/i.test(msgStr);
      if (isError) {
        collectError("alert", "Alert \u9519\u8BEF\u63D0\u793A", { message: msgStr });
      }
    } catch (e) {
    }
    return originalAlert.call(window, message);
  };
  if (window.toastr && typeof window.toastr.error === "function") {
    const originalToastrError = window.toastr.error;
    window.toastr.error = function(message, title, options) {
      try {
        collectError("toastr", title || "Toastr \u9519\u8BEF", {
          message: String(message || ""),
          title: String(title || "")
        });
      } catch (e) {
      }
      return originalToastrError.call(window.toastr, message, title, options);
    };
  }
  globalErrorHandlerInstalled = true;
  console.log(`[${extensionName}] \u5168\u5C40\u9519\u8BEF\u5904\u7406\u5668\u5DF2\u5B89\u88C5`);
}

function getAllErrors() {
  return [...errorEntries];
}

function getRecentErrors(count = 10) {
  return errorEntries.slice(-count);
}

function getErrorStats() {
  const stats = {
    total: 0,
    unique: errorEntries.length,
    byType: {},
    byScope: {},
    recent24h: 0,
    recentHour: 0
  };
  const now = Date.now();
  const hour = 60 * 60 * 1e3;
  const day = 24 * hour;
  for (const entry of errorEntries) {
    const count = entry.count || 1;
    stats.total += count;
    stats.byType[entry.type] = (stats.byType[entry.type] || 0) + count;
    stats.byScope[entry.sourceScope || "unknown"] = (stats.byScope[entry.sourceScope || "unknown"] || 0) + count;
    const age = now - (entry.lastSeen || entry.timestamp);
    if (age < hour) stats.recentHour += count;
    if (age < day) stats.recent24h += count;
  }
  return stats;
}

function clearErrors() {
  errorEntries = [];
  console.log(`[${extensionName}] \u9519\u8BEF\u8BB0\u5F55\u5DF2\u6E05\u7A7A`);
}

async function exportErrors() {
  if (errorEntries.length === 0) {
    return "\u6682\u65E0\u9519\u8BEF\u8BB0\u5F55\u3002";
  }
  const lines = [];
  const now = /* @__PURE__ */ new Date();
  const logExport = await exportLogsWithHistory();
  const stats = getErrorStats();
  lines.push("========================================");
  lines.push("\u{1F6A8} \u9519\u8BEF\u4E0E\u65E5\u5FD7\u8BCA\u65AD\u5BFC\u51FA");
  lines.push(`\u751F\u6210\u65F6\u95F4: ${formatTimestamp2(now.getTime())}`);
  lines.push(`\u603B\u9519\u8BEF\u6570: ${stats.total}`);
  lines.push(`\u53BB\u91CD\u540E\u8BB0\u5F55\u6570: ${stats.unique}`);
  lines.push("========================================");
  lines.push("");
  lines.push("\u3010\u8BF4\u660E\u3011");
  lines.push("\u4EE5\u4E0B\u9519\u8BEF\u8BB0\u5F55\u6765\u81EA\u6D4F\u89C8\u5668\u5168\u5C40\u76D1\u542C\uFF0C\u53EF\u80FD\u6765\u81EA SillyTavern \u4E3B\u7A0B\u5E8F\u3001\u5176\u4ED6\u63D2\u4EF6\u3001\u9875\u9762\u811A\u672C\u6216\u672C\u63D2\u4EF6\u672C\u8EAB\u3002");
  lines.push("\u8BF7\u7ED3\u5408\u672C\u6587\u4EF6\u540E\u9644\u7684\u8FD0\u884C\u65E5\u5FD7\u4E00\u8D77\u5224\u65AD\u95EE\u9898\u6765\u6E90\u3002");
  lines.push("");
  lines.push("\u3010\u9519\u8BEF\u7EDF\u8BA1\u3011");
  lines.push(`\u6700\u8FD1 1 \u5C0F\u65F6: ${stats.recentHour} \u4E2A\u9519\u8BEF`);
  lines.push(`\u6700\u8FD1 24 \u5C0F\u65F6: ${stats.recent24h} \u4E2A\u9519\u8BEF`);
  lines.push("\u6309\u7C7B\u578B\u5206\u5E03:");
  for (const [type, count] of Object.entries(stats.byType)) {
    lines.push(`  - ${type}: ${count}`);
  }
  if (Object.keys(stats.byScope).length > 0) {
    lines.push("\u6309\u6765\u6E90\u5206\u5E03:");
    for (const [scope, count] of Object.entries(stats.byScope)) {
      lines.push(`  - ${scope}: ${count}`);
    }
  }
  lines.push("");
  lines.push("========================================");
  lines.push("");
  for (const entry of errorEntries) {
    const timeStr = formatTimestamp2(entry.lastSeen || entry.timestamp);
    lines.push(`[${timeStr}] \u274C ${entry.type.toUpperCase()} (${entry.sourceScope || "unknown"})`);
    lines.push(`  \u6D88\u606F: ${entry.message}`);
    lines.push(`  \u6B21\u6570: ${entry.count || 1}`);
    lines.push(`  \u9996\u6B21\u51FA\u73B0: ${formatTimestamp2(entry.firstSeen || entry.timestamp)}`);
    lines.push(`  \u6700\u8FD1\u51FA\u73B0: ${formatTimestamp2(entry.lastSeen || entry.timestamp)}`);
    if (entry.errorName) {
      lines.push(`  \u9519\u8BEF\u540D: ${entry.errorName}`);
    }
    if (entry.errorMessage) {
      lines.push(`  \u9519\u8BEF\u8BE6\u60C5: ${entry.errorMessage}`);
    }
    if (entry.source) {
      lines.push(`  \u6587\u4EF6: ${entry.source}`);
    }
    if (entry.lineno != null || entry.colno != null) {
      lines.push(`  \u4F4D\u7F6E: ${entry.lineno ?? "?"}:${entry.colno ?? "?"}`);
    }
    if (entry.stack) {
      lines.push(`  \u5806\u6808:`);
      const stackLines = entry.stack.split("\n").slice(0, 5);
      stackLines.forEach((line) => lines.push(`    ${line}`));
    }
    if (entry.context) {
      lines.push(`  \u4E0A\u4E0B\u6587: ${JSON.stringify(entry.context, null, 2)}`);
    }
    lines.push("");
  }
  lines.push("========================================");
  lines.push("");
  lines.push("\u3010\u8FD0\u884C\u65E5\u5FD7\uFF08\u5F53\u524D\u4F1A\u8BDD + \u6700\u8FD1 24 \u5C0F\u65F6\u5386\u53F2\u4F1A\u8BDD\uFF09\u3011");
  if (logExport && logExport.trim() !== "") {
    lines.push(logExport.trimEnd());
  } else {
    lines.push("\u5F53\u524D\u4E0E\u5386\u53F2\u8FD0\u884C\u65E5\u5FD7\u5747\u4E3A\u7A7A\u3002");
  }
  lines.push("");
  lines.push("========================================");
  lines.push(`\u9519\u8BEF\u65E5\u5FD7\u7ED3\u675F - \u5171 ${stats.total} \u4E2A\u9519\u8BEF\uFF0C\u53BB\u91CD\u540E ${stats.unique} \u6761\u8BB0\u5F55`);
  lines.push("========================================");
  return lines.join("\n");
}

function formatTimestamp2(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export { clearErrors, exportErrors, getAllErrors, getErrorStats, getRecentErrors, installGlobalErrorHandler };
