// 还原自打包产物 — 原始模块: utils/settings/rollProcessor.js
var CHARSET, DEFAULT_SEED_MAX, DEFAULT_STRING_LENGTH, ROLL_PATTERN;

CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

DEFAULT_SEED_MAX = 1e5;

DEFAULT_STRING_LENGTH = 8;

ROLL_PATTERN = /\{\{roll\s+(?:1d)?(\d+)\}\}/gi;

function createSeededRandom(seed) {
  return function() {
    let t = seed += 1831565813;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function seededRandomString(seed, length = DEFAULT_STRING_LENGTH) {
  const random = createSeededRandom(seed);
  let result = "";
  for (let i = 0; i < length; i++) {
    const index = Math.floor(random() * CHARSET.length);
    result += CHARSET[index];
  }
  return result;
}

function processRollInContent(content) {
  if (content == null || typeof content !== "string") {
    return content;
  }
  if (content === "") {
    return content;
  }
  return content.replace(ROLL_PATTERN, (match, seedMaxStr) => {
    let seedMax = parseInt(seedMaxStr, 10);
    if (isNaN(seedMax) || seedMax <= 0) {
      seedMax = DEFAULT_SEED_MAX;
    }
    const isDice = match.toLowerCase().includes("1d");
    let seed = Math.floor(Math.random() * (seedMax + 1));
    return seededRandomString(seed);
  });
}

function processRollPlaceholders(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return messages;
  }
  return messages.map((message) => {
    if (!message || typeof message !== "object") {
      return message;
    }
    if (typeof message.content === "string") {
      return {
        ...message,
        content: processRollInContent(message.content)
      };
    }
    if (Array.isArray(message.content)) {
      return {
        ...message,
        content: message.content.map((part) => {
          if (part && part.type === "text" && typeof part.text === "string") {
            return {
              ...part,
              text: processRollInContent(part.text)
            };
          }
          return part;
        })
      };
    }
    return message;
  });
}

export { processRollPlaceholders };
