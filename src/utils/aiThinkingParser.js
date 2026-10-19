// 还原自打包产物 — 原始模块: utils/aiThinkingParser.js
function parseThinkingContent(text) {
  if (!text || typeof text !== "string") {
    return {
      hasThinking: false,
      thinkingBlocks: [],
      cleanedText: text || ""
    };
  }
  const thinkingBlocks = [];
  let remaining = text;
  let loopGuard = 0;
  const MAX_LOOPS = 10;
  while (remaining.length > 0 && loopGuard < MAX_LOOPS) {
    loopGuard++;
    let matchedSomething = false;
    const terminalBlockMatch = remaining.match(/^\s*```(?:bash|sh|console|linux|terminal)?\s*[\r\n]([\s\S]*?)```(?:\s*[\r\n]*|$)/i);
    if (terminalBlockMatch) {
      const rawTerminal = terminalBlockMatch[0].trim();
      if (rawTerminal.length > 0) {
        thinkingBlocks.push({
          content: rawTerminal,
          startIndex: 0,
          index: thinkingBlocks.length,
          type: "terminal"
        });
      }
      remaining = remaining.slice(terminalBlockMatch[0].length);
      matchedSomething = true;
      continue;
    }
    const unclosedTerminalMatch = remaining.match(/^\s*```(?:bash|sh|console|linux|terminal)?\s*[\r\n][\s\S]*$/i);
    if (unclosedTerminalMatch && !remaining.slice(unclosedTerminalMatch[0].indexOf("\n") + 1).includes("```")) {
      thinkingBlocks.push({
        content: unclosedTerminalMatch[0].trim(),
        startIndex: 0,
        index: thinkingBlocks.length,
        type: "terminal",
        isUnclosed: true
      });
      remaining = "";
      break;
    }
    const openTagMatch = remaining.match(/^\s*<(think(?:ing)?|assistant_trace|trace|pipeline_trace|video_asset_think|Tag_think)>/i);
    if (openTagMatch) {
      const tagName = openTagMatch[1];
      const afterOpenIdx = openTagMatch[0].length;
      const subText = remaining.slice(afterOpenIdx);
      const closeTagRegex = new RegExp(`</${tagName}>`, "i");
      const closeMatch = subText.match(closeTagRegex);
      if (closeMatch && closeMatch.index !== void 0) {
        const tagContent = subText.slice(0, closeMatch.index).trim();
        if (tagContent.length > 0) {
          const truncatedContent = tagContent.length > 20480 ? tagContent.substring(0, 20480) + "\n...(\u5185\u5BB9\u8FC7\u957F\u5DF2\u622A\u65AD)" : tagContent;
          thinkingBlocks.push({
            content: truncatedContent,
            startIndex: 0,
            index: thinkingBlocks.length,
            type: tagName.toLowerCase()
          });
        }
        remaining = subText.slice(closeMatch.index + closeMatch[0].length);
        matchedSomething = true;
        continue;
      } else {
        const tagContent = subText.trim();
        if (tagContent.length > 0) {
          thinkingBlocks.push({
            content: tagContent,
            startIndex: 0,
            index: thinkingBlocks.length,
            type: tagName.toLowerCase(),
            isUnclosed: true
          });
        }
        remaining = "";
        break;
      }
    }
    const fallbackCloseRegex = /^[\s\S]*?<\/(think(?:ing)?|assistant_trace|trace|pipeline_trace)>(?:\s*[\r\n]*|$)/i;
    const orphanCloseMatch = remaining.match(fallbackCloseRegex);
    if (orphanCloseMatch && orphanCloseMatch.index === 0) {
      const rawContent = orphanCloseMatch[0].replace(/<\/(think(?:ing)?|assistant_trace|trace|pipeline_trace)>/gi, "").trim();
      if (rawContent.length > 0) {
        thinkingBlocks.push({
          content: rawContent,
          startIndex: 0,
          index: thinkingBlocks.length,
          type: "orphan_thinking"
        });
      }
      remaining = remaining.slice(orphanCloseMatch[0].length);
      matchedSomething = true;
      continue;
    }
    if (!matchedSomething) {
      break;
    }
  }
  const cleanedText = remaining.trim();
  return {
    hasThinking: thinkingBlocks.length > 0,
    thinkingBlocks,
    cleanedText
  };
}

export { parseThinkingContent };
