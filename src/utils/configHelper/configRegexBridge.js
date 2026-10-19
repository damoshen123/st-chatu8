// 还原自打包产物 — 原始模块: utils/configHelper/configRegexBridge.js
function getRegexStatus() {
  if (!window.regexAIBridge) {
    return "\u274C \u6B63\u5219\u6A21\u5757\u5C1A\u672A\u52A0\u8F7D\uFF0C\u8BF7\u5148\u5207\u6362\u5230\u6B63\u5219\u9875\u9762\u3002";
  }
  try {
    const status = window.regexAIBridge.getStatus();
    let result = "\u{1F4CB} \u6B63\u5219\u6D4B\u8BD5\u533A\u57DF\u72B6\u6001:\n";
    result += `- \u6D4B\u8BD5\u6A21\u5F0F: ${status.testMode ? "\u2705 \u5DF2\u5F00\u542F" : "\u274C \u672A\u5F00\u542F"}
`;
    result += `- \u5F53\u524D\u914D\u7F6E: ${status.currentProfile || "(\u65E0)"}
`;
    result += `- \u624B\u52BF\u529F\u80FD: ${status.gestureEnabled ? "\u2705 \u5DF2\u5F00\u542F" : "\u274C \u672A\u5F00\u542F"}
`;
    result += `- \u70B9\u51FB\u89E6\u53D1: ${status.clickTriggerEnabled ? "\u2705 \u5DF2\u5F00\u542F" : "\u274C \u672A\u5F00\u542F"}
`;
    result += `- \u524D\u540E\u6B63\u5219: ${status.beforeAfterRegex}
`;
    result += `- \u6587\u5B57\u6B63\u5219: ${status.textRegex}
`;
    result += `- \u539F\u6587: ${status.originalText}
`;
    result += `- \u6B63\u5219\u540E\u6587\u672C: ${status.resultText}
`;
    result += `- \u6B63\u5219\u6761\u76EE (${status.entryCount}\u4E2A):
`;
    if (status.regexEntries.length > 0) {
      status.regexEntries.forEach((e) => {
        const flag = e.disabled ? "[\u7981\u7528]" : "[\u542F\u7528]";
        result += `  ${e.index}. ${flag} ${e.name} | \u67E5\u627E: ${e.findRegex} | \u66FF\u6362: ${e.replaceString}
`;
      });
    } else {
      result += "  (\u6682\u65E0\u6761\u76EE)\n";
    }
    return result;
  } catch (e) {
    return `\u274C \u83B7\u53D6\u6B63\u5219\u72B6\u6001\u5931\u8D25: ${e.message}`;
  }
}

function setRegexOriginalText2(text) {
  if (!window.regexAIBridge) return "\u274C \u6B63\u5219\u6A21\u5757\u672A\u52A0\u8F7D\u3002";
  return window.regexAIBridge.setOriginalText(text);
}

function setRegexEditors2(beforeAfter, textRegex) {
  if (!window.regexAIBridge) return "\u274C \u6B63\u5219\u6A21\u5757\u672A\u52A0\u8F7D\u3002";
  return window.regexAIBridge.setEditors(beforeAfter, textRegex);
}

function createRegexEntry(data) {
  if (!window.regexAIBridge) return "\u274C \u6B63\u5219\u6A21\u5757\u672A\u52A0\u8F7D\u3002";
  return window.regexAIBridge.createEntry(data);
}

async function triggerRegexTest2() {
  if (!window.regexAIBridge) return "\u274C \u6B63\u5219\u6A21\u5757\u672A\u52A0\u8F7D\u3002";
  return await window.regexAIBridge.triggerTest();
}

function setRegexTestMode2(enabled) {
  if (!window.regexAIBridge) return "\u274C \u6B63\u5219\u6A21\u5757\u672A\u52A0\u8F7D\u3002";
  return window.regexAIBridge.setTestMode(enabled);
}

function getRegexResultText2() {
  if (!window.regexAIBridge) return "\u274C \u6B63\u5219\u6A21\u5757\u672A\u52A0\u8F7D\u3002";
  return window.regexAIBridge.getResultText();
}

function setGestureEnabled2(enabled) {
  if (!window.regexAIBridge) return "\u274C \u6B63\u5219\u6A21\u5757\u672A\u52A0\u8F7D\u3002";
  return window.regexAIBridge.setGestureEnabled(enabled);
}

function setClickTriggerEnabled2(enabled) {
  if (!window.regexAIBridge) return "\u274C \u6B63\u5219\u6A21\u5757\u672A\u52A0\u8F7D\u3002";
  return window.regexAIBridge.setClickTriggerEnabled(enabled);
}

function clearAllRegexEntries2() {
  if (!window.regexAIBridge) return "\u274C \u6B63\u5219\u6A21\u5757\u672A\u52A0\u8F7D\u3002";
  return window.regexAIBridge.clearAllEntries();
}

export { clearAllRegexEntries2, createRegexEntry, getRegexResultText2, getRegexStatus, setClickTriggerEnabled2, setGestureEnabled2, setRegexEditors2, setRegexOriginalText2, setRegexTestMode2, triggerRegexTest2 };
