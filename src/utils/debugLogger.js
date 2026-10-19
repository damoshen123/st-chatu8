// 还原自打包产物 — 原始模块: utils/debugLogger.js
var currentSessionName, debugLogEntries, debugModeEnabled, globalSessionStartTime;

debugLogEntries = [];

debugModeEnabled = false;

globalSessionStartTime = null;

currentSessionName = "";

function isDebugEnabled() {
  return debugModeEnabled;
}

function toggleDebug(enabled) {
  if (typeof enabled === "boolean") {
    debugModeEnabled = enabled;
  } else {
    debugModeEnabled = !debugModeEnabled;
  }
  if (debugModeEnabled) {
    debugLogEntries.push({
      timestamp: Date.now(),
      type: "system",
      functionName: "debugLogger",
      message: "\u{1F527} \u8C03\u8BD5\u6A21\u5F0F\u5DF2\u542F\u7528"
    });
  }
  return debugModeEnabled;
}

function debugStartSession(sessionName) {
  globalSessionStartTime = Date.now();
  currentSessionName = sessionName || "\u8C03\u8BD5\u4F1A\u8BDD";
  if (debugModeEnabled) {
    debugLogEntries.push({
      timestamp: globalSessionStartTime,
      type: "session_start",
      functionName: "debugLogger",
      message: `\u{1F680} \u4F1A\u8BDD\u5F00\u59CB: ${currentSessionName}`,
      elapsed: 0
    });
  }
}

function getSessionElapsed() {
  if (!globalSessionStartTime) return 0;
  return Date.now() - globalSessionStartTime;
}

function debugLog(functionName, message, context) {
  if (!debugModeEnabled) return;
  debugLogEntries.push({
    timestamp: Date.now(),
    type: "log",
    functionName,
    message,
    context,
    elapsed: getSessionElapsed()
  });
}

function debugBranch(functionName, branchName, entered, conditionDetails) {
  if (!debugModeEnabled) return;
  const context = { entered: !!entered };
  if (conditionDetails) {
    context.\u6761\u4EF6\u8BE6\u60C5 = conditionDetails;
  }
  debugLogEntries.push({
    timestamp: Date.now(),
    type: "branch",
    functionName,
    message: `\u5206\u652F: ${branchName}`,
    context,
    elapsed: getSessionElapsed()
  });
}

function debugTimer(functionName, description) {
  const startTime = Date.now();
  const startElapsed = getSessionElapsed();
  if (debugModeEnabled) {
    debugLogEntries.push({
      timestamp: startTime,
      type: "timer_start",
      functionName,
      message: description || "\u23F1\uFE0F \u5F00\u59CB\u8BA1\u65F6",
      elapsed: startElapsed
    });
  }
  return {
    /**
     * 结束计时并记录耗时
     * @param {string} [info] - 结束时的额外信息
     * @returns {number} 耗时（毫秒）
     */
    end(info) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      const endElapsed = getSessionElapsed();
      if (debugModeEnabled) {
        debugLogEntries.push({
          timestamp: endTime,
          type: "timer_end",
          functionName,
          message: info || "\u23F1\uFE0F \u8BA1\u65F6\u7ED3\u675F",
          duration,
          elapsed: endElapsed
        });
      }
      return duration;
    }
  };
}

function getDebugLog() {
  return debugLogEntries;
}

function getDebugLogCount() {
  return debugLogEntries.length;
}

function clearDebugLog() {
  debugLogEntries = [];
}

function exportDebugLog() {
  if (debugLogEntries.length === 0) {
    return "\u8C03\u8BD5\u65E5\u5FD7\u4E3A\u7A7A\u3002";
  }
  const lines = [];
  const now = /* @__PURE__ */ new Date();
  const firstEntry = debugLogEntries[0];
  const lastEntry = debugLogEntries[debugLogEntries.length - 1];
  const totalDuration = lastEntry.timestamp - firstEntry.timestamp;
  lines.push("========================================");
  lines.push("\u{1F527} \u8C03\u8BD5\u65E5\u5FD7\u5BFC\u51FA");
  lines.push(`\u751F\u6210\u65F6\u95F4: ${formatTimestamp(now.getTime())}`);
  lines.push(`\u603B\u6761\u6570: ${debugLogEntries.length}`);
  lines.push(`\u603B\u8017\u65F6: ${totalDuration}ms`);
  if (currentSessionName) {
    lines.push(`\u4F1A\u8BDD\u540D\u79F0: ${currentSessionName}`);
  }
  lines.push("========================================");
  lines.push("");
  const formatElapsed = (elapsed) => {
    if (elapsed === void 0 || elapsed === null) return "";
    return ` [+${elapsed}ms]`;
  };
  const formatContext = (context) => {
    if (!context) return "";
    return JSON.stringify(context, null, 2).split("\n").map((l, i) => i === 0 ? l : "    " + l).join("\n");
  };
  for (const entry of debugLogEntries) {
    const timeStr = formatTimestamp(entry.timestamp);
    const elapsedStr = formatElapsed(entry.elapsed);
    switch (entry.type) {
      case "session_start":
        lines.push(`[${timeStr}]${elapsedStr} \u{1F680} ${entry.message}`);
        lines.push("----------------------------------------");
        lines.push("");
        break;
      case "log":
        lines.push(`[${timeStr}]${elapsedStr} \u{1F4DD} ${entry.functionName}`);
        lines.push(`  \u63CF\u8FF0: ${entry.message}`);
        if (entry.context) {
          lines.push(`  \u4E0A\u4E0B\u6587: ${formatContext(entry.context)}`);
        }
        lines.push("");
        break;
      case "branch":
        const symbol = entry.context?.entered ? "\u2713" : "\u2717";
        lines.push(`[${timeStr}]${elapsedStr} \u2937 ${entry.message} ${symbol}`);
        if (entry.context?.\u6761\u4EF6\u8BE6\u60C5) {
          lines.push(`  \u6761\u4EF6\u8BE6\u60C5: ${formatContext(entry.context.\u6761\u4EF6\u8BE6\u60C5)}`);
        }
        lines.push("");
        break;
      case "timer_start":
        lines.push(`[${timeStr}]${elapsedStr} \u23F1\uFE0F ${entry.functionName} \u5F00\u59CB`);
        if (entry.message && entry.message !== "\u23F1\uFE0F \u5F00\u59CB\u8BA1\u65F6") {
          lines.push(`  \u63CF\u8FF0: ${entry.message}`);
        }
        lines.push("");
        break;
      case "timer_end":
        lines.push(`[${timeStr}]${elapsedStr} \u23F1\uFE0F ${entry.functionName} \u7ED3\u675F (\u8017\u65F6: ${entry.duration}ms)`);
        if (entry.message && entry.message !== "\u23F1\uFE0F \u8BA1\u65F6\u7ED3\u675F") {
          lines.push(`  \u7ED3\u679C: ${entry.message}`);
        }
        lines.push("");
        break;
      case "content":
        lines.push(`[${timeStr}]${elapsedStr} ${entry.message}`);
        if (entry.context?.\u5185\u5BB9) {
          lines.push(`  \u5185\u5BB9: ${entry.context.\u5185\u5BB9}`);
        }
        if (entry.context?.\u539F\u59CB\u957F\u5EA6) {
          lines.push(`  \u957F\u5EA6: ${entry.context.\u539F\u59CB\u957F\u5EA6} \u5B57\u7B26${entry.context.\u5DF2\u622A\u65AD ? " (\u5DF2\u622A\u65AD)" : ""}`);
        }
        lines.push("");
        break;
      case "element":
        lines.push(`[${timeStr}]${elapsedStr} ${entry.message}`);
        if (entry.context) {
          lines.push(`  \u5143\u7D20\u4FE1\u606F: ${formatContext(entry.context)}`);
        }
        lines.push("");
        break;
      case "milestone":
        lines.push(`[${timeStr}]${elapsedStr} ${entry.message}`);
        lines.push("");
        break;
      case "error":
        lines.push(`[${timeStr}]${elapsedStr} ${entry.message}`);
        if (entry.context) {
          lines.push(`  \u9519\u8BEF\u8BE6\u60C5: ${formatContext(entry.context)}`);
        }
        lines.push("");
        break;
      case "system":
        lines.push(`[${timeStr}]${elapsedStr} \u{1F527} ${entry.message}`);
        lines.push("");
        break;
      default:
        lines.push(`[${timeStr}]${elapsedStr} ${entry.functionName}: ${entry.message}`);
        if (entry.context) {
          lines.push(`  \u4E0A\u4E0B\u6587: ${formatContext(entry.context)}`);
        }
        lines.push("");
    }
  }
  lines.push("========================================");
  lines.push(`\u65E5\u5FD7\u7ED3\u675F - \u603B\u8017\u65F6: ${totalDuration}ms`);
  lines.push("========================================");
  return lines.join("\n");
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const ms = String(date.getMilliseconds()).padStart(3, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`;
}

function debugError(functionName, message, error) {
  if (!debugModeEnabled) return;
  const context = error instanceof Error ? { errorName: error.name, errorMessage: error.message } : error;
  debugLogEntries.push({
    timestamp: Date.now(),
    type: "error",
    functionName,
    message: `\u274C ${message}`,
    context,
    elapsed: getSessionElapsed()
  });
}

function debugMilestone(functionName, milestone) {
  if (!debugModeEnabled) return;
  debugLogEntries.push({
    timestamp: Date.now(),
    type: "milestone",
    functionName,
    message: `\u{1F3AF} ${milestone}`,
    elapsed: getSessionElapsed()
  });
}

function debugContent(functionName, label, content, maxLength = 200) {
  if (!debugModeEnabled) return;
  const contentStr = String(content || "");
  const truncated = contentStr.length > maxLength;
  const displayContent = truncated ? contentStr.substring(0, maxLength) + `... [\u622A\u65AD\uFF0C\u539F\u957F\u5EA6: ${contentStr.length}]` : contentStr;
  debugLogEntries.push({
    timestamp: Date.now(),
    type: "content",
    functionName,
    message: `\u{1F4DD} ${label}`,
    context: {
      \u5185\u5BB9: displayContent,
      \u539F\u59CB\u957F\u5EA6: contentStr.length,
      \u5DF2\u622A\u65AD: truncated
    },
    elapsed: getSessionElapsed()
  });
}

function debugElement(functionName, label, element) {
  if (!debugModeEnabled) return;
  if (!element) {
    debugLogEntries.push({
      timestamp: Date.now(),
      type: "element",
      functionName,
      message: `\u{1F532} ${label}: null/undefined`,
      context: { \u5143\u7D20: null },
      elapsed: getSessionElapsed()
    });
    return;
  }
  const elementInfo = {
    \u6807\u7B7E\u540D: element.tagName,
    \u7C7B\u540D: element.className || "(\u65E0)",
    ID: element.id || "(\u65E0)",
    mesId: element.getAttribute?.("mesid") || element.closest?.(".mes")?.getAttribute?.("mesid") || "(\u65E0)",
    \u6587\u672C\u9884\u89C8: (element.textContent || "").substring(0, 50) + (element.textContent?.length > 50 ? "..." : ""),
    \u6587\u672C\u957F\u5EA6: element.textContent?.length || 0,
    \u662F\u5426\u4E3Ames_text: element.classList?.contains?.("mes_text") || false,
    \u5728iframe\u4E2D: element.ownerDocument !== document
  };
  debugLogEntries.push({
    timestamp: Date.now(),
    type: "element",
    functionName,
    message: `\u{1F532} ${label}`,
    context: elementInfo,
    elapsed: getSessionElapsed()
  });
}

export { clearDebugLog, debugBranch, debugContent, debugElement, debugError, debugLog, debugMilestone, debugStartSession, debugTimer, exportDebugLog, getDebugLog, getDebugLogCount, isDebugEnabled, toggleDebug };
