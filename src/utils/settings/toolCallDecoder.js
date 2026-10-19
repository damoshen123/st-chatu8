// 还原自打包产物 — 原始模块: utils/settings/toolCallDecoder.js
var IncrementalStringDecoder, StreamToolCallParser;

IncrementalStringDecoder = class {
      /**
       * @param {string} targetField - 目标字段名，例如 'thought_and_context' 或 'thought'
       * @param {string} [wrapTag=''] - 可选的包裹标签，例如 'thinking'
       */
      constructor(targetField = "content", wrapTag = "") {
        this.targetField = targetField;
        this.wrapTag = wrapTag && typeof wrapTag === "string" ? wrapTag.trim() : "";
        this.state = "LOOKING_FOR_KEY";
        this.buffer = "";
        this.pendingEscape = "";
        this.hasEmittedTagStart = false;
      }
      /**
       * 重置状态机
       */
      reset() {
        this.state = "LOOKING_FOR_KEY";
        this.buffer = "";
        this.pendingEscape = "";
        this.hasEmittedTagStart = false;
      }
      /**
       * 喂入新的参数分片文本，返回本次解码出的文本
       * @param {string} chunk - 新增的参数分片字符串
       * @returns {string} 解码出的新文本片段（若配置了 wrapTag 会自动带上起始/结束标签）
       */
      feed(chunk) {
        if (!chunk) return "";
        this.buffer += chunk;
        let outputText = "";
        while (this.buffer.length > 0) {
          if (this.state === "LOOKING_FOR_KEY") {
            const keyPattern = `"${this.targetField}"`;
            const idx = this.buffer.indexOf(keyPattern);
            if (idx !== -1) {
              this.buffer = this.buffer.slice(idx + keyPattern.length);
              this.state = "LOOKING_FOR_COLON";
            } else {
              if (this.buffer.length > keyPattern.length) {
                this.buffer = this.buffer.slice(-keyPattern.length);
              }
              break;
            }
          }
          if (this.state === "LOOKING_FOR_COLON") {
            const colonIdx = this.buffer.indexOf(":");
            if (colonIdx !== -1) {
              this.buffer = this.buffer.slice(colonIdx + 1);
              this.state = "LOOKING_FOR_QUOTE";
            } else {
              break;
            }
          }
          if (this.state === "LOOKING_FOR_QUOTE") {
            let foundQuote = false;
            for (let i = 0; i < this.buffer.length; i++) {
              const char = this.buffer[i];
              if (char === '"') {
                this.buffer = this.buffer.slice(i + 1);
                this.state = "IN_STRING";
                foundQuote = true;
                if (this.wrapTag && !this.hasEmittedTagStart) {
                  outputText += `<${this.wrapTag}>`;
                  this.hasEmittedTagStart = true;
                }
                break;
              }
            }
            if (!foundQuote) {
              break;
            }
          }
          if (this.state === "IN_STRING") {
            let str = this.pendingEscape + this.buffer;
            this.pendingEscape = "";
            this.buffer = "";
            let i = 0;
            while (i < str.length) {
              const ch = str[i];
              if (ch === "\\") {
                if (i + 1 >= str.length) {
                  this.pendingEscape = "\\";
                  i++;
                  break;
                }
                const next = str[i + 1];
                if (next === "n") outputText += "\n";
                else if (next === "r") outputText += "\r";
                else if (next === "t") outputText += "	";
                else if (next === "b") outputText += "\b";
                else if (next === "f") outputText += "\f";
                else if (next === '"') outputText += '"';
                else if (next === "\\") outputText += "\\";
                else if (next === "/") outputText += "/";
                else if (next === "u") {
                  if (i + 6 <= str.length) {
                    const hex = str.slice(i + 2, i + 6);
                    try {
                      outputText += String.fromCharCode(parseInt(hex, 16));
                    } catch (e) {
                      outputText += `\\u${hex}`;
                    }
                    i += 6;
                    continue;
                  } else {
                    this.pendingEscape = str.slice(i);
                    i = str.length;
                    break;
                  }
                } else {
                  outputText += next;
                }
                i += 2;
              } else if (ch === '"') {
                this.state = "DONE";
                this.buffer = str.slice(i + 1);
                if (this.wrapTag && this.hasEmittedTagStart) {
                  outputText += `</${this.wrapTag}>

`;
                }
                break;
              } else {
                outputText += ch;
                i++;
              }
            }
          }
          if (this.state === "DONE") {
            break;
          }
        }
        return outputText;
      }
    };

StreamToolCallParser = class {
      /**
       * @param {string|null} targetToolName - 匹配的工具名称
       * @param {Array} fields - 字段列表 [{ name, wrapTag }]
       */
      constructor(targetToolName = null, fields = []) {
        this.targetToolName = targetToolName;
        this.fields = Array.isArray(fields) && fields.length > 0 ? fields : [{ name: "thought_and_context", wrapTag: "" }];
        this.decoders = [];
        this.initDecoders();
        this.rawArguments = "";
        this.isTargetToolMatched = !targetToolName;
      }
      initDecoders() {
        this.decoders = [];
        const seenNames = /* @__PURE__ */ new Set();
        for (const f of this.fields) {
          if (!f || !f.name) continue;
          const name = f.name.trim();
          if (!seenNames.has(name)) {
            seenNames.add(name);
            this.decoders.push(new IncrementalStringDecoder(name, f.wrapTag || ""));
          }
        }
        const fallbacks = ["display_stream", "content", "reply", "text", "thought"];
        for (const fb of fallbacks) {
          if (!seenNames.has(fb)) {
            this.decoders.push(new IncrementalStringDecoder(fb, fb === "thought" ? "thinking" : ""));
          }
        }
      }
      /**
       * 重置解析器
       */
      reset(targetToolName = null, fields = null) {
        this.targetToolName = targetToolName;
        if (fields) this.fields = fields;
        this.initDecoders();
        this.rawArguments = "";
        this.isTargetToolMatched = !targetToolName;
      }
      /**
       * 传入 SSE chunk 中的 tool_calls 增量片段
       * @param {Array} toolCalls - delta.tool_calls 数组
       * @returns {{ deltaContent: string, rawChunk: string }}
       */
      processDeltaToolCalls(toolCalls) {
        let deltaContent = "";
        let rawChunk = "";
        if (!Array.isArray(toolCalls) || toolCalls.length === 0) {
          return { deltaContent, rawChunk };
        }
        for (const tc of toolCalls) {
          const funcName = tc.function?.name;
          if (funcName) {
            if (!this.targetToolName || funcName === this.targetToolName || funcName.startsWith("dispatch_stream_payload") || funcName.startsWith("agw_emit_")) {
              this.isTargetToolMatched = true;
            }
          }
          const argsFragment = tc.function?.arguments || "";
          if (argsFragment) {
            this.rawArguments += argsFragment;
            rawChunk += argsFragment;
            for (const decoder of this.decoders) {
              const text = decoder.feed(argsFragment);
              if (text) {
                deltaContent += text;
              }
            }
          }
        }
        return { deltaContent, rawChunk };
      }
      /**
       * 流结束后获取完整提取的兜底结果
       * @returns {string} 兜底组装的正文字符串
       */
      getFinalFallback() {
        return extractToolCallArguments(this.rawArguments, this.fields);
      }
    };

function extractToolCallArguments(rawArgs, fields = []) {
  if (!rawArgs || typeof rawArgs !== "string") return "";
  const trimmed = rawArgs.trim();
  if (!trimmed) return "";
  const effectiveFields = Array.isArray(fields) && fields.length > 0 ? fields : [{ name: "thought_and_context", wrapTag: "" }, { name: "thought", wrapTag: "thinking" }, { name: "content", wrapTag: "" }];
  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed === "object" && parsed !== null) {
      if (parsed.display_stream !== void 0 && parsed.display_stream !== null) {
        const streamVal = String(parsed.display_stream);
        const thoughtVal2 = parsed.thought || parsed.reasoning || "";
        if (thoughtVal2) {
          const strThought = String(thoughtVal2).trim();
          const wrappedThought = strThought.startsWith("<think") ? strThought : `<thinking>${strThought}</thinking>`;
          return `${wrappedThought}

${streamVal}`;
        }
        return streamVal;
      }
      let assembledText2 = "";
      let matchedAny = false;
      for (const f of effectiveFields) {
        const key = f.name;
        const val = parsed[key];
        if (val !== void 0 && val !== null) {
          matchedAny = true;
          const strVal = typeof val === "string" ? val : JSON.stringify(val);
          const tag = f.wrapTag ? f.wrapTag.trim() : "";
          if (tag) {
            const trimmedVal = strVal.trim();
            if (trimmedVal.startsWith(`<${tag}>`) || tag === "thinking" && trimmedVal.startsWith("<think")) {
              assembledText2 += (assembledText2 ? "\n\n" : "") + strVal;
            } else {
              assembledText2 += `<${tag}>${strVal}</${tag}>

`;
            }
          } else {
            assembledText2 += (assembledText2 ? "\n\n" : "") + strVal;
          }
        }
      }
      if (matchedAny && assembledText2) {
        return assembledText2;
      }
      const fallbackVal = parsed.display_stream || parsed.content || parsed.reply || parsed.text || parsed.answer || "";
      const thoughtVal = parsed.thought || parsed.reasoning || "";
      if (thoughtVal && fallbackVal) {
        const strThought = String(thoughtVal).trim();
        const wrappedThought = strThought.startsWith("<think") ? strThought : `<thinking>${strThought}</thinking>`;
        return `${wrappedThought}

${fallbackVal}`;
      }
      if (fallbackVal) return String(fallbackVal);
      if (thoughtVal) return String(thoughtVal);
    }
  } catch (e) {
  }
  const candidateFields = [...effectiveFields];
  if (!candidateFields.some((f) => f.name === "display_stream")) {
    candidateFields.push({ name: "display_stream", wrapTag: "" });
  }
  if (!candidateFields.some((f) => f.name === "content")) {
    candidateFields.push({ name: "content", wrapTag: "" });
  }
  let assembledText = "";
  for (const f of candidateFields) {
    const key = f.name;
    const regex = new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`);
    const match = trimmed.match(regex);
    if (match) {
      let val = "";
      try {
        val = JSON.parse(`"${match[1]}"`);
      } catch {
        val = match[1];
      }
      if (f.wrapTag && f.wrapTag.trim()) {
        assembledText += `<${f.wrapTag.trim()}>${val}</${f.wrapTag.trim()}>

`;
      } else {
        assembledText += (assembledText ? "\n\n" : "") + val;
      }
    } else {
      const unclosedRegex = new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)$`);
      const unclosedMatch = trimmed.match(unclosedRegex);
      if (unclosedMatch) {
        let val = "";
        try {
          val = JSON.parse(`"${unclosedMatch[1]}"`);
        } catch {
          val = unclosedMatch[1];
        }
        if (f.wrapTag && f.wrapTag.trim()) {
          assembledText += `<${f.wrapTag.trim()}>${val}</${f.wrapTag.trim()}>

`;
        } else {
          assembledText += (assembledText ? "\n\n" : "") + val;
        }
      }
    }
  }
  if (assembledText) return assembledText;
  if (!trimmed.startsWith("{")) {
    return trimmed;
  }
  return "";
}

function normalizeNonStreamingToolCall(responseObj, syntheticToolName = null, fields = []) {
  if (!responseObj?.choices?.length) {
    return { content: "", matched: false, rawResponse: responseObj };
  }
  const choice = responseObj.choices[0];
  const message = choice.message;
  if (!message) {
    return { content: "", matched: false, rawResponse: responseObj };
  }
  const toolCalls = message.tool_calls;
  if (Array.isArray(toolCalls) && toolCalls.length > 0) {
    let finalContent = "";
    let matched = false;
    for (const tc of toolCalls) {
      const func = tc.function;
      if (!func) continue;
      const isMatchedTool = !syntheticToolName || func.name === syntheticToolName || toolCalls.length === 1 || func.name?.startsWith("dispatch_stream_payload") || func.name?.startsWith("agw_emit_");
      if (isMatchedTool) {
        matched = true;
        const text = extractToolCallArguments(func.arguments, fields);
        if (text) {
          finalContent += (finalContent ? "\n\n" : "") + text;
        }
      }
    }
    if (matched && finalContent) {
      return {
        content: finalContent,
        matched: true,
        rawResponse: responseObj
      };
    }
  }
  let content = message.content || "";
  const reasoning = message.reasoning_content || "";
  if (reasoning && content) {
    content = reasoning + "\n\n" + content;
  } else if (reasoning) {
    content = reasoning;
  }
  return {
    content,
    matched: false,
    rawResponse: responseObj
  };
}

export { StreamToolCallParser, normalizeNonStreamingToolCall };
