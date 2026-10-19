// 还原自打包产物 — 原始模块: utils/wordReplacementCore.js
function parseWordReplacementRules(rulesText) {
  if (!rulesText || typeof rulesText !== "string") return [];
  const rules = [];
  for (const line of rulesText.split("\n")) {
    const rawLine = line.replace(/\r$/, "");
    if (!rawLine.trim()) continue;
    const eqIndex = rawLine.indexOf("=");
    if (eqIndex === -1) continue;
    const find = unescapeSequences(rawLine.substring(0, eqIndex).trim());
    const replace = unescapeSequences(rawLine.substring(eqIndex + 1));
    if (!find) continue;
    rules.push({ find, replace });
  }
  return rules;
}

function applyWordReplacementRules(text, rules) {
  if (!text || typeof text !== "string" || !Array.isArray(rules) || rules.length === 0) {
    return text;
  }
  let result = text;
  for (const rule of rules) {
    try {
      const escaped = escapeRegexChars(rule.find);
      const regex = new RegExp(escaped, "g");
      result = result.replace(regex, () => rule.replace);
    } catch (error) {
      console.warn(`[st-chatu8] \u8BCD\u6C47\u66FF\u6362\u89C4\u5219\u6267\u884C\u5931\u8D25: "${rule.find}" -> "${rule.replace}"`, error);
    }
  }
  return result;
}

function replaceTextInMessageContent(content, replacer) {
  if (typeof content === "string") {
    return replacer(content);
  }
  if (Array.isArray(content)) {
    return content.map((part) => {
      if (part && part.type === "text" && typeof part.text === "string") {
        return { ...part, text: replacer(part.text) };
      }
      return part;
    });
  }
  return content;
}

function replaceTextInMessages(messages, replacer) {
  if (!Array.isArray(messages)) return messages;
  return messages.map((message) => {
    if (!message || typeof message !== "object" || !Object.prototype.hasOwnProperty.call(message, "content")) {
      return message;
    }
    return {
      ...message,
      content: replaceTextInMessageContent(message.content, replacer)
    };
  });
}

function escapeRegexChars(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function unescapeSequences(str) {
  return str.replace(/\\([stn\\])/g, (_, ch) => {
    if (ch === "s") return " ";
    if (ch === "t") return "	";
    if (ch === "n") return "\n";
    return "\\";
  });
}

export { applyWordReplacementRules, parseWordReplacementRules, replaceTextInMessages };
