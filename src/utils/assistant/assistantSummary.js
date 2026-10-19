// 还原自打包产物 — 原始模块: utils/assistant/assistantSummary.js
import { LLMRequestTypes } from "../config.js";
import { countTokens, isMobileDevice } from "../utils.js";
import { executeDefaultLLMRequest, getEffectiveConfigForRequestType } from "../settings/llmService.js";
import { getResultTextareaUpdater, updateCombinedPrompt } from "../settings/llmUi.js";
import { activeChat, dom } from "./assistantContext.js";
import { syncAndSave } from "./assistantSession.js";
import { buildCustomPrefillMessages, substituteTemplateVariables } from "./assistantLLM.js";

var $summaryOverlay, MIN_KEEP_ROUNDS, ROUNDS_PER_GROUP, SummaryManager, TOKEN_COUNT_MODEL, assistantLLM_exports, multiSelectMode, selectedGroupIndices, selectedSummaryIds, summaryManager, tokenCalcVersion;

ROUNDS_PER_GROUP = 10;

MIN_KEEP_ROUNDS = 15;

TOKEN_COUNT_MODEL = "gemini-2.5-pro";

SummaryManager = class {
      /**
       * @param {string} chatId - 所属会话 ID
       */
      constructor(chatId) {
        this.chatId = chatId;
        this.summaries = [];
        this.relations = [];
      }
      // ─── 分组 ────────────────────────────────────────────────
      /**
       * 将消息数组按 40 轮一组分组。
       * @param {Array} messages - activeChat.messages
       * @returns {MessageGroup[]}
       */
      groupMessages(messages) {
        const pairs = [];
        for (let i = 0; i < messages.length; i++) {
          const msg = messages[i];
          if (msg.role === "user") {
            const next = messages[i + 1];
            if (next && (next.role === "assistant" || next.role === "system")) {
              pairs.push({
                userIndex: i,
                assistantIndex: i + 1,
                userMsg: msg,
                assistantMsg: next
              });
              i++;
            }
          }
        }
        const groups = [];
        for (let i = 0; i < pairs.length; i += ROUNDS_PER_GROUP) {
          const chunk = pairs.slice(i, i + ROUNDS_PER_GROUP);
          const start = chunk[0].userIndex;
          const end = chunk[chunk.length - 1].assistantIndex;
          groups.push({
            groupIndex: groups.length,
            start,
            end,
            roundCount: chunk.length,
            pairs: chunk
          });
        }
        return groups;
      }
      // ─── 总结创建 ─────────────────────────────────────────────
      /**
       * 创建新的总结条目
       * @param {{ messageRange?: [number,number], sourceIds?: string[], content: string, type?: string }} opts
       * @returns {SummaryEntry}
       */
      createSummary({ messageRange = null, sourceIds = [], content, type = "direct" }) {
        const id = `summary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const summary = {
          id,
          type: sourceIds.length > 0 ? "merged" : type,
          messageRange,
          sourceIds,
          content: content || "",
          enabled: false,
          createdAt: Date.now(),
          level: sourceIds.length > 0 ? this._getMaxLevel(sourceIds) + 1 : 1
        };
        this.summaries.push(summary);
        if (sourceIds.length > 0) {
          this.relations.push({ parentId: id, childIds: [...sourceIds] });
        }
        return summary;
      }
      /**
       * 获取 sourceIds 中最高层级
       * @param {string[]} sourceIds
       * @returns {number}
       */
      _getMaxLevel(sourceIds) {
        let max = 1;
        for (const id of sourceIds) {
          const s = this.summaries.find((s2) => s2.id === id);
          if (s && s.level > max) max = s.level;
        }
        return max;
      }
      // ─── 启用/禁用 ────────────────────────────────────────────
      /**
       * 启用指定总结（自动禁用冲突）
       * @param {string} summaryId
       */
      enableSummary(summaryId) {
        const summary = this.summaries.find((s) => s.id === summaryId);
        if (!summary) return;
        this._disableConflictingSummaries(summaryId);
        summary.enabled = true;
      }
      /**
       * 禁用指定总结
       * @param {string} summaryId
       */
      disableSummary(summaryId) {
        const summary = this.summaries.find((s) => s.id === summaryId);
        if (summary) summary.enabled = false;
      }
      /**
       * 禁用与指定总结冲突的所有其他总结
       * 规则：父总结与所有子总结互斥
       * @param {string} summaryId
       */
      _disableConflictingSummaries(summaryId) {
        const childIds = this._getAllChildIds(summaryId);
        const parentIds = this._getAllParentIds(summaryId);
        const conflictIds = /* @__PURE__ */ new Set([...childIds, ...parentIds]);
        conflictIds.delete(summaryId);
        for (const id of conflictIds) {
          const s = this.summaries.find((s2) => s2.id === id);
          if (s) s.enabled = false;
        }
      }
      /**
       * 递归获取所有子总结 ID
       * @param {string} summaryId
       * @returns {string[]}
       */
      _getAllChildIds(summaryId) {
        const result = [];
        const relation = this.relations.find((r) => r.parentId === summaryId);
        if (relation) {
          for (const childId of relation.childIds) {
            result.push(childId);
            result.push(...this._getAllChildIds(childId));
          }
        }
        return result;
      }
      /**
       * 递归获取所有父总结 ID
       * @param {string} summaryId
       * @returns {string[]}
       */
      _getAllParentIds(summaryId) {
        const result = [];
        const relation = this.relations.find((r) => r.childIds.includes(summaryId));
        if (relation) {
          result.push(relation.parentId);
          result.push(...this._getAllParentIds(relation.parentId));
        }
        return result;
      }
      /**
       * 获取指定 summaryId 的直接子总结 ID 列表（只有一层）
       * @param {string} summaryId
       * @returns {string[]}
       */
      getDirectChildIds(summaryId) {
        const relation = this.relations.find((r) => r.parentId === summaryId);
        return relation ? relation.childIds : [];
      }
      /**
       * 获取指定 summaryId 的父总结 ID（只有一层）
       * @param {string} summaryId
       * @returns {string|null}
       */
      getParentId(summaryId) {
        const relation = this.relations.find((r) => r.childIds.includes(summaryId));
        return relation ? relation.parentId : null;
      }
      // ─── 查询 ─────────────────────────────────────────────────
      /**
       * 获取所有启用的总结，按 messageRange 升序排列（合并总结按第一个子总结的范围）
       * @returns {SummaryEntry[]}
       */
      getEnabledSummaries() {
        return this.summaries.filter((s) => s.enabled).sort((a, b) => {
          const aStart = a.messageRange?.[0] ?? Infinity;
          const bStart = b.messageRange?.[0] ?? Infinity;
          return aStart - bStart;
        });
      }
      /**
       * 根据 sourceIds 计算合并总结覆盖的 messageRange
       * @param {string[]} sourceIds
       * @returns {[number, number]|null}
       */
      getMergedRange(sourceIds) {
        let minStart = Infinity, maxEnd = -Infinity;
        for (const id of sourceIds) {
          const s = this.summaries.find((s2) => s2.id === id);
          if (s?.messageRange) {
            if (s.messageRange[0] < minStart) minStart = s.messageRange[0];
            if (s.messageRange[1] > maxEnd) maxEnd = s.messageRange[1];
          }
        }
        if (minStart === Infinity) return null;
        return [minStart, maxEnd];
      }
      // ─── 上下文构建 ───────────────────────────────────────────
      /**
       * 构建注入到 LLM 上下文的总结文本块。
       * 格式：
       * <以前对话的总结>
       * [第X组总结 ...]
       * {content}
       * ...
       * </以前对话的总结>
       *
       * @param {Array} allMessages - 完整的消息数组
       * @returns {{ summaryBlock: string, excludedRanges: [number,number][] }}
       */
      buildSummaryContextBlock(allMessages) {
        const enabled = this.getEnabledSummaries();
        if (enabled.length === 0) {
          return { summaryBlock: "", excludedRanges: [] };
        }
        const totalMessages = allMessages.length;
        const keepFromIndex = Math.max(0, totalMessages - MIN_KEEP_ROUNDS * 2);
        const lines = [];
        const excludedRanges = [];
        for (const summary of enabled) {
          if (!summary.messageRange) continue;
          const [start, end] = summary.messageRange;
          const excludeEnd = Math.min(end, keepFromIndex - 1);
          if (start <= excludeEnd) {
            excludedRanges.push([start, excludeEnd]);
          }
          const groupStart = Math.floor(start / (ROUNDS_PER_GROUP * 2)) * ROUNDS_PER_GROUP + 1;
          const groupEnd = groupStart + Math.round((end - start + 1) / 2) - 1;
          lines.push(`[\u7B2C${groupStart}\u81F3${groupEnd}\u8F6E\u5BF9\u8BDD\u603B\u7ED3]`);
          lines.push(summary.content.trim());
          lines.push("");
        }
        const summaryBlock = `<\u4EE5\u524D\u5BF9\u8BDD\u7684\u603B\u7ED3>
${lines.join("\n")}</\u4EE5\u524D\u5BF9\u8BDD\u7684\u603B\u7ED3>`;
        return { summaryBlock, excludedRanges };
      }
      /**
       * 过滤消息历史，排除被总结覆盖的范围（但保底最后 MIN_KEEP_ROUNDS 轮）
       * @param {Array} messages - 原始消息数组（已处理为 LLM 格式）
       * @param {[number,number][]} excludedRanges
       * @returns {Array}
       */
      filterHistoryMessages(messages, excludedRanges) {
        if (!excludedRanges || excludedRanges.length === 0) return messages;
        return messages.filter((_, index) => {
          for (const [start, end] of excludedRanges) {
            if (index >= start && index <= end) return false;
          }
          return true;
        });
      }
      // ─── 持久化 ───────────────────────────────────────────────
      /** 导出数据（保存到会话） */
      exportData() {
        return {
          summaries: this.summaries,
          relations: this.relations
        };
      }
      /** 从会话加载数据 */
      importData(data) {
        if (!data) return;
        this.summaries = data.summaries || [];
        this.relations = data.relations || [];
      }
      /** 删除指定总结及其在 relations 中的记录 */
      deleteSummary(summaryId) {
        this.summaries = this.summaries.filter((s) => s.id !== summaryId);
        this.relations = this.relations.filter((r) => r.parentId !== summaryId);
        this.relations.forEach((r) => {
          r.childIds = r.childIds.filter((id) => id !== summaryId);
        });
        this.relations = this.relations.filter((r) => r.childIds.length > 0);
      }
    };

summaryManager = null;

multiSelectMode = false;

selectedGroupIndices = /* @__PURE__ */ new Set();

selectedSummaryIds = /* @__PURE__ */ new Set();

tokenCalcVersion = 0;

$summaryOverlay = null;


function extractCleanText(content) {
  let text = "";
  if (typeof content === "string") {
    text = content;
  } else if (Array.isArray(content)) {
    const part = content.find((c) => c.type === "text");
    text = part?.text || "";
  }
  return text.replace(/^[\s\S]*<\/think(?:ing)?>\s*/g, "").trim();
}

function stripThink(text) {
  if (typeof text !== "string") return "";
  let result = text.replace(/<think(?:ing)?>([\s\S]*?)<\/think(?:ing)?>/g, "").trim();
  if (result.match(/^<think(?:ing)?>/)) {
    result = result.replace(/^<think(?:ing)?>([\s\S]*)$/g, "").trim();
  }
  if (!result && text.includes("</think")) {
    result = text.replace(/^[\s\S]*<\/think(?:ing)?>\s*/g, "").trim();
  }
  return result;
}

async function generateSummary({ messagePairs = [], existingSummaryContents = [], onProgress = null }) {
  let contentToSummarize = "";
  if (existingSummaryContents.length > 0) {
    contentToSummarize = existingSummaryContents.map(
      (text, idx) => `[\u603B\u7ED3${idx + 1}]
${text.trim()}`
    ).join("\n\n---\n\n");
  } else {
    contentToSummarize = messagePairs.map((pair, idx) => {
      const userText = extractCleanText(pair.userMsg.content);
      const assistantText = extractCleanText(pair.assistantMsg.content);
      return `[\u7B2C${idx + 1}\u8F6E]
\u7528\u6237\uFF1A${userText}
AI\uFF1A${assistantText}`;
    }).join("\n\n");
  }
  const effectiveConfig = getEffectiveConfigForRequestType(LLMRequestTypes.CHAT_SUMMARY);
  const contextProfile = effectiveConfig.context || {};
  const profileData = effectiveConfig;
  if (!contextProfile.entries || !Array.isArray(contextProfile.entries)) {
    throw new Error("\u804A\u5929\u603B\u7ED3\u9884\u8BBE\u672A\u914D\u7F6E\uFF0C\u8BF7\u5728 LLM \u8BBE\u7F6E\u4E2D\u914D\u7F6E\u300C\u804A\u5929\u603B\u7ED3\u300D\u4E0A\u4E0B\u6587\u9884\u8BBE\u3002");
  }
  const messages = [];
  for (const entry of contextProfile.entries) {
    if (!entry.enabled) continue;
    if (!entry.content || entry.content.trim() === "") continue;
    let content = entry.content;
    if (content.includes("{{\u9700\u8981\u603B\u7ED3\u7684\u5185\u5BB9}}")) {
      content = content.replace(/\{\{需要总结的内容\}\}/g, contentToSummarize);
    }
    try {
      content = await substituteTemplateVariables(content, {});
    } catch (e) {
    }
    messages.push({ role: entry.role || "system", content });
  }
  if (messages.length === 0) {
    throw new Error("\u603B\u7ED3\u9884\u8BBE\u6761\u76EE\u5168\u90E8\u88AB\u7981\u7528\uFF0C\u65E0\u6CD5\u751F\u6210\u603B\u7ED3\u3002");
  }
  updateCombinedPrompt(messages, "[\u804A\u5929\u603B\u7ED3] ");
  let fullText = "";
  let isFirstChunk = true;
  const statusPatterns = /^(正在处理|请稍候|重试中|连接中|.*外部请求)/;
  const resultUpdater = getResultTextareaUpdater();
  const updateCallback = (chunk) => {
    if (isFirstChunk && statusPatterns.test(chunk.trim())) {
      if (onProgress) onProgress(chunk);
      return;
    }
    isFirstChunk = false;
    fullText += chunk;
    if (onProgress) onProgress(chunk);
    if (resultUpdater) resultUpdater(fullText);
  };
  await executeDefaultLLMRequest(
    { prompt: messages, id: `summary_${Date.now()}` },
    profileData,
    updateCallback,
    "summary"
  );
  return stripThink(fullText) || fullText.trim();
}

function getSummaryManager() {
  if (!summaryManager && activeChat) {
    summaryManager = new SummaryManager(activeChat.id);
  }
  return summaryManager;
}

function resetSummaryManager(chatId) {
  summaryManager = new SummaryManager(chatId);
}

function initSummaryEvents() {
  const $sm = dom.summaryManager;
  if (!$sm || !$sm.length) return;
  $sm.find("#summary-close-btn").on("click", function() {
    hideSummaryPanel();
  });
  $sm.find("#summary-toggle-multiselect").on("click", function() {
    multiSelectMode = !multiSelectMode;
    const $btn = $(this);
    if (multiSelectMode) {
      $btn.addClass("active").html('<i class="fa-solid fa-check-double"></i> \u53D6\u6D88\u591A\u9009');
    } else {
      $btn.removeClass("active").html('<i class="fa-solid fa-check-double"></i> \u591A\u9009');
      selectedGroupIndices.clear();
      selectedSummaryIds.clear();
      $sm.find(".summary-card.selected").removeClass("selected");
    }
    updateToolbarButtons();
  });
  $sm.find("#summary-generate-selected-btn").on("click", async function() {
    await handleGenerateSelected();
  });
  $sm.find("#summary-enable-selected-btn").on("click", function() {
    handleEnableSelected();
  });
  $sm.find("#summary-disable-selected-btn").on("click", function() {
    handleDisableSelected();
  });
  $sm.on("summary:refresh", function() {
    renderPanel();
  });
}

function showSummaryPanel() {
  const $sm = dom.summaryManager;
  if (!$sm || !$sm.length) return;
  const isMobile3 = isMobileDevice();
  if (isMobile3) {
    const topSettingsHolder = document.querySelector("#top-settings-holder");
    let topOffset = 10;
    if (topSettingsHolder) {
      const rect = topSettingsHolder.getBoundingClientRect();
      topOffset = Math.max(10, Math.min(rect.bottom + 10, window.innerHeight * 0.5));
    }
    const availableHeight = Math.max(200, window.innerHeight - topOffset - 20);
    $sm.css({
      top: `${topOffset}px`,
      left: "50%",
      transform: "translateX(-50%)",
      width: "96vw",
      maxWidth: "96vw",
      height: `${availableHeight}px`,
      maxHeight: `${availableHeight}px`
    });
  } else {
    $sm.css({
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: "",
      maxWidth: "",
      height: "",
      maxHeight: ""
    });
  }
  if (!$summaryOverlay) {
    $summaryOverlay = $('<div class="st-chatu8-summary-overlay"></div>');
    $summaryOverlay.on("click", function() {
      hideSummaryPanel();
    });
  }
  $("body").append($summaryOverlay);
  $sm.appendTo("body");
  $sm.show();
  $sm.trigger("summary:refresh");
}

function hideSummaryPanel() {
  const $sm = dom.summaryManager;
  if ($sm) $sm.hide();
  if ($summaryOverlay) {
    $summaryOverlay.detach();
  }
}

function renderPanel() {
  if (!activeChat) return;
  const mgr = getSummaryManager();
  if (!mgr) return;
  const groups = mgr.groupMessages(activeChat.messages);
  renderColumns(groups, mgr);
  setTimeout(() => renderSVGLines(), 60);
  updateEnabledHint();
  calculateAndDisplayTokens(groups, mgr);
}

function ensureTotalTokensElement($sm) {
  let $el = $sm.find("#summary-total-tokens");
  if (!$el.length) {
    $el = $('<span id="summary-total-tokens" class="summary-total-tokens"></span>');
    const $hint = $sm.find("#summary-enabled-hint");
    if ($hint.length) {
      $hint.after($el);
    } else {
      $sm.find(".summary-footer").prepend($el);
    }
  }
  return $el;
}

async function calculateAndDisplayTokens(groups, mgr) {
  const version = ++tokenCalcVersion;
  const $sm = dom.summaryManager;
  $sm.find(".summary-card-tokens").html(
    '<i class="fa-solid fa-circle-notch fa-spin" style="font-size:9px;opacity:0.4;"></i>'
  );
  ensureTotalTokensElement($sm).text("\u7EDF\u8BA1\u4E2D...");
  const groupTokens = /* @__PURE__ */ new Map();
  const groupPromises = groups.map(async (group, idx) => {
    const msgs = [];
    for (const pair of group.pairs) {
      msgs.push({ role: "user", content: extractCleanText(pair.userMsg.content) });
      msgs.push({ role: "assistant", content: extractCleanText(pair.assistantMsg.content) });
    }
    const count = await countTokens(msgs, TOKEN_COUNT_MODEL);
    groupTokens.set(idx, count);
  });
  const summaryTokens = /* @__PURE__ */ new Map();
  const summaryPromises = mgr.summaries.map(async (summary) => {
    const msgs = [{ role: "system", content: summary.content }];
    const count = await countTokens(msgs, TOKEN_COUNT_MODEL);
    summaryTokens.set(summary.id, count);
  });
  let presetTokenCount = 0;
  const presetPromise = (async () => {
    try {
      const { messages: presetMessages } = await buildCustomPrefillMessages({});
      if (presetMessages && presetMessages.length > 0) {
        presetTokenCount = await countTokens(presetMessages, TOKEN_COUNT_MODEL);
        if (presetTokenCount < 0) presetTokenCount = 0;
      }
    } catch (e) {
      console.warn("[calculateAndDisplayTokens] \u9884\u8BBE token \u8BA1\u7B97\u5931\u8D25:", e);
    }
  })();
  await Promise.all([...groupPromises, ...summaryPromises, presetPromise]);
  if (version !== tokenCalcVersion) return;
  for (const [idx, count] of groupTokens) {
    const $el = $sm.find(`[data-token-group="${idx}"]`);
    if ($el.length) {
      $el.text(count >= 0 ? `${(count / 1e3).toFixed(1)}k` : "");
    }
  }
  for (const [id, count] of summaryTokens) {
    const $el = $sm.find(`[data-token-summary="${id}"]`);
    if ($el.length) {
      $el.text(count >= 0 ? `${(count / 1e3).toFixed(1)}k` : "");
    }
  }
  let totalTokens = 0;
  const coveredGroupIndices = /* @__PURE__ */ new Set();
  for (const summary of mgr.summaries) {
    if (!summary.enabled || !summary.messageRange) continue;
    totalTokens += Math.max(0, summaryTokens.get(summary.id) || 0);
    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];
      if (g.start >= summary.messageRange[0] && g.end <= summary.messageRange[1]) {
        coveredGroupIndices.add(i);
      }
    }
  }
  for (let i = 0; i < groups.length; i++) {
    if (!coveredGroupIndices.has(i)) {
      totalTokens += Math.max(0, groupTokens.get(i) || 0);
    }
  }
  for (let i = 0; i < groups.length; i++) {
    const $el = $sm.find(`[data-token-group="${i}"]`);
    if (coveredGroupIndices.has(i)) {
      $el.addClass("summary-card-tokens--excluded");
    } else {
      $el.removeClass("summary-card-tokens--excluded");
    }
  }
  const historyTokens = totalTokens;
  totalTokens += presetTokenCount;
  const presetHint = presetTokenCount > 0 ? ` (\u9884\u8BBE ${(presetTokenCount / 1e3).toFixed(1)}k + \u5386\u53F2 ${(historyTokens / 1e3).toFixed(1)}k)` : "";
  ensureTotalTokensElement($sm).text(`\u9884\u4F30\u53D1\u9001: ${(totalTokens / 1e3).toFixed(1)}k tokens${presetHint}`);
}

function renderColumns(groups, mgr) {
  const $container4 = dom.summaryManager.find("#summary-columns");
  $container4.children(".summary-col").remove();
  const $col0 = $('<div class="summary-col" data-level="0"></div>');
  $col0.append('<div class="summary-col-header">\u6D88\u606F\u7EC4</div>');
  const $list0 = $('<div class="summary-col-list"></div>');
  groups.forEach((group, idx) => {
    const hasSummary = mgr.summaries.some(
      (s) => s.messageRange && s.messageRange[0] === group.start && s.messageRange[1] === group.end
    );
    const enabledSummary = mgr.summaries.find(
      (s) => s.messageRange && s.enabled && s.messageRange[0] === group.start && s.messageRange[1] === group.end
    );
    const cardClass = [
      "summary-card",
      "summary-card--group",
      enabledSummary ? "summary-card--enabled" : "",
      hasSummary ? "summary-card--has-summary" : "",
      selectedGroupIndices.has(idx) ? "selected" : ""
    ].filter(Boolean).join(" ");
    const $card = $(`
            <div class="${cardClass}" data-group-index="${idx}" data-group-start="${group.start}" data-group-end="${group.end}">
                <div class="summary-card-header">
                    <span class="summary-card-title">\u7B2C ${idx + 1} \u7EC4</span>
                    ${enabledSummary ? '<span class="summary-card-badge summary-card-badge--enabled">\u2713</span>' : ""}
                    ${hasSummary && !enabledSummary ? '<span class="summary-card-badge">\u2713</span>' : ""}
                </div>
                <div class="summary-card-info">${group.roundCount} \u8F6E (${group.start + 1}\u2013${group.end + 1}) \xB7 <span class="summary-card-tokens" data-token-group="${idx}"></span></div>
                <div class="summary-card-actions">
                    ${!hasSummary ? `<button class="summary-btn summary-btn--sm summary-btn--primary summary-generate-btn" title="${group.roundCount < ROUNDS_PER_GROUP ? `\u4E0D\u8DB3${ROUNDS_PER_GROUP}\u8F6E\uFF0C\u65E0\u6CD5\u603B\u7ED3` : "\u751F\u6210\u603B\u7ED3"}" ${group.roundCount < ROUNDS_PER_GROUP ? "disabled" : ""}><i class="fa-solid fa-wand-magic-sparkles"></i></button>` : ""}
                    ${hasSummary ? `<button class="summary-btn summary-btn--sm summary-btn--danger summary-delete-btn" title="\u5220\u9664\u603B\u7ED3"><i class="fa-solid fa-trash"></i></button>` : ""}
                </div>
            </div>
        `);
    $card.on("click", function(e) {
      if ($(e.target).closest("button").length) return;
      if (multiSelectMode) {
        if (selectedGroupIndices.has(idx)) {
          selectedGroupIndices.delete(idx);
          $card.removeClass("selected");
        } else {
          selectedGroupIndices.add(idx);
          $card.addClass("selected");
        }
        updateToolbarButtons();
      } else {
        showGroupDetailPopup(group, idx);
      }
    });
    $card.find(".summary-generate-btn").on("click", async function(e) {
      e.stopPropagation();
      await handleGenerateSingle(idx, group);
    });
    $card.find(".summary-delete-btn").on("click", function(e) {
      e.stopPropagation();
      handleDeleteByGroupRange(group.start, group.end);
    });
    $list0.append($card);
  });
  if (groups.length === 0) {
    $list0.append('<div class="summary-empty"><i class="fa-solid fa-comments"></i>\u6682\u65E0\u53EF\u603B\u7ED3\u7684\u5206\u7EC4</div>');
  }
  $col0.append($list0);
  $container4.append($col0);
  const maxLevel = mgr.summaries.reduce((m, s) => Math.max(m, s.level || 1), 0);
  for (let level = 1; level <= Math.max(maxLevel, 1); level++) {
    const levelSummaries = mgr.summaries.filter((s) => (s.level || 1) === level).sort((a, b) => (a.sortOrder ?? a.createdAt ?? 0) - (b.sortOrder ?? b.createdAt ?? 0));
    const levelLabel = level === 1 ? "\u76F4\u63A5\u603B\u7ED3 L1" : `\u5408\u5E76\u603B\u7ED3 L${level}`;
    const $col = $(`<div class="summary-col" data-level="${level}"></div>`);
    $col.append(`<div class="summary-col-header">${levelLabel}</div>`);
    const $list = $('<div class="summary-col-list"></div>');
    if (levelSummaries.length === 0) {
      $list.append(`<div class="summary-empty"><i class="fa-solid fa-wand-magic-sparkles"></i>${level === 1 ? "\u70B9\u51FB \u2728 \u751F\u6210" : "\u9009\u4E2D\u591A\u4E2A\u603B\u7ED3\u5408\u5E76"}</div>`);
    }
    levelSummaries.forEach((summary) => {
      const isMerged = summary.type === "merged";
      const cardClass = [
        "summary-card",
        "summary-card--summary",
        summary.enabled ? "summary-card--enabled" : "",
        isMerged ? "summary-card--merged" : "",
        selectedSummaryIds.has(summary.id) ? "selected" : ""
      ].filter(Boolean).join(" ");
      const rangeHint = summary.messageRange ? `${summary.messageRange[0] + 1}\u2013${summary.messageRange[1] + 1}` : "";
      const preview = summary.content.length > 40 ? summary.content.substring(0, 40) + "..." : summary.content;
      const $card = $(`
                <div class="${cardClass}" data-summary-id="${summary.id}">
                    <div class="summary-card-header">
                        <span class="summary-card-title">${isMerged ? "\u5408\u5E76" : "\u603B\u7ED3"} L${summary.level}</span>
                        ${summary.enabled ? '<span class="summary-card-badge summary-card-badge--enabled">\u2713</span>' : ""}
                    </div>
                    ${rangeHint ? `<div class="summary-card-info">${rangeHint}</div>` : ""}
                    <div class="summary-card-preview">${escapeHTML2(preview)}</div>
                    <div class="summary-card-tokens" data-token-summary="${summary.id}"></div>
                    <div class="summary-card-actions">
                        ${!summary.enabled ? `<button class="summary-btn summary-btn--sm summary-btn--success summary-enable-btn" title="\u542F\u7528"><i class="fa-solid fa-check"></i></button>` : `<button class="summary-btn summary-btn--sm summary-btn--warning summary-disable-btn" title="\u7981\u7528"><i class="fa-solid fa-times"></i></button>`}
                        <button class="summary-btn summary-btn--sm summary-btn--danger summary-delete-summary-btn" title="\u5220\u9664"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            `);
      $card.on("click", function(e) {
        if ($(e.target).closest("button").length) return;
        if (multiSelectMode) {
          if (selectedSummaryIds.has(summary.id)) {
            selectedSummaryIds.delete(summary.id);
            $card.removeClass("selected");
          } else {
            selectedSummaryIds.add(summary.id);
            $card.addClass("selected");
          }
          updateToolbarButtons();
        } else {
          showSummaryDetailPopup(summary);
        }
      });
      $card.find(".summary-enable-btn").on("click", function(e) {
        e.stopPropagation();
        mgr.enableSummary(summary.id);
        saveSummaryData();
        renderPanel();
      });
      $card.find(".summary-disable-btn").on("click", function(e) {
        e.stopPropagation();
        mgr.disableSummary(summary.id);
        saveSummaryData();
        renderPanel();
      });
      $card.find(".summary-delete-summary-btn").on("click", function(e) {
        e.stopPropagation();
        mgr.deleteSummary(summary.id);
        saveSummaryData();
        renderPanel();
      });
      $list.append($card);
    });
    enableDragSort($list, level, mgr);
    $col.append($list);
    $container4.append($col);
  }
  let scrollTimer = null;
  $container4.off("scroll.svgRedraw").on("scroll.svgRedraw", function() {
    if (scrollTimer) clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => renderSVGLines(), 60);
  });
  $container4.find(".summary-col-list").off("scroll.svgRedraw").on("scroll.svgRedraw", function() {
    if (scrollTimer) clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => renderSVGLines(), 60);
  });
}

function showGroupDetailPopup(group, idx) {
  const pairs = group.pairs.slice(0, 20);
  let contentHtml = pairs.map((pair) => {
    const userText = extractCleanText(pair.userMsg.content).substring(0, 200);
    const aiText = extractCleanText(pair.assistantMsg.content).substring(0, 200);
    return `<div class="detail-turn">
            <div class="detail-role detail-role--user">\u7528\u6237:</div>
            <div class="detail-text">${escapeHTML2(userText)}</div>
            <div class="detail-role detail-role--ai">AI:</div>
            <div class="detail-text">${escapeHTML2(aiText)}</div>
        </div>`;
  }).join("");
  if (group.pairs.length > 20) {
    contentHtml += `<div style="text-align:center;opacity:0.5;padding:8px;">... \u5171 ${group.roundCount} \u8F6E</div>`;
  }
  showDetailPopup(`\u7B2C ${idx + 1} \u7EC4 \u2014 ${group.roundCount} \u8F6E\u5BF9\u8BDD (${group.start + 1}\u2013${group.end + 1})`, contentHtml);
}

function showSummaryDetailPopup(summary) {
  const isMerged = summary.type === "merged";
  const title = `${isMerged ? "\u5408\u5E76\u603B\u7ED3" : "\u76F4\u63A5\u603B\u7ED3"} L${summary.level}`;
  const rangeHint = summary.messageRange ? `\u6D88\u606F\u8303\u56F4: ${summary.messageRange[0] + 1}\u2013${summary.messageRange[1] + 1}` : "";
  showDetailPopup(title, {
    editable: true,
    text: summary.content,
    hint: rangeHint,
    onSave: (newContent) => {
      const mgr = getSummaryManager();
      if (!mgr) return;
      const target = mgr.summaries.find((s) => s.id === summary.id);
      if (target) {
        target.content = newContent;
        saveSummaryData();
        renderPanel();
      }
    }
  });
}

function showDetailPopup(title, opts) {
  $(".summary-detail-overlay").remove();
  const isObj = typeof opts === "object" && opts !== null;
  const editable = isObj && opts.editable;
  const contentHtml = isObj ? opts.html || "" : opts;
  const editText = isObj ? opts.text || "" : "";
  const hint = isObj ? opts.hint || "" : "";
  const isMobile3 = isMobileDevice();
  let panelExtra = "";
  if (isMobile3) {
    const topSettingsHolder = document.querySelector("#top-settings-holder");
    let topOffset = 10;
    if (topSettingsHolder) {
      const rect = topSettingsHolder.getBoundingClientRect();
      topOffset = Math.max(10, Math.min(rect.bottom + 10, window.innerHeight * 0.5));
    }
    const availableHeight = Math.max(200, window.innerHeight - topOffset - 20);
    panelExtra = `style="top:${topOffset}px;left:50%;transform:translateX(-50%);width:94vw;max-height:${availableHeight}px;"`;
  }
  let bodyHtml;
  if (editable) {
    bodyHtml = `
            ${hint ? `<div style="font-size:12px;color:#888;margin-bottom:8px;">${hint}</div>` : ""}
            <textarea class="summary-detail-textarea">${escapeHTML2(editText)}</textarea>
            <div class="summary-detail-actions">
                <button class="summary-btn summary-btn--sm summary-btn--success summary-detail-save-btn"><i class="fa-solid fa-check"></i> \u4FDD\u5B58</button>
                <button class="summary-btn summary-btn--sm summary-btn--outline summary-detail-cancel-btn">\u53D6\u6D88</button>
            </div>
        `;
  } else {
    bodyHtml = contentHtml;
  }
  const html = `
        <div class="summary-detail-overlay">
            <div class="summary-detail-panel" ${panelExtra}>
                <div class="summary-detail-header">
                    <div class="summary-detail-title">${title}</div>
                    <button class="summary-btn summary-btn--icon summary-detail-close-btn"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="summary-detail-body">${bodyHtml}</div>
            </div>
        </div>
    `;
  const $overlay = $(html);
  $("body").append($overlay);
  $overlay.find(".summary-detail-close-btn").on("click", () => $overlay.remove());
  $overlay.on("click", function(e) {
    if ($(e.target).hasClass("summary-detail-overlay")) $overlay.remove();
  });
  if (editable && isObj && opts.onSave) {
    $overlay.find(".summary-detail-save-btn").on("click", function() {
      const newText = $overlay.find(".summary-detail-textarea").val().trim();
      if (newText) {
        opts.onSave(newText);
        $overlay.remove();
      }
    });
    $overlay.find(".summary-detail-cancel-btn").on("click", () => $overlay.remove());
  }
}

function enableDragSort($list, level, mgr) {
  const listEl = $list[0];
  if (!listEl) return;
  let dragEl = null;
  let placeholder = null;
  $list.find(".summary-card--summary").attr("draggable", "true");
  $list.on("dragstart", ".summary-card--summary", function(e) {
    dragEl = this;
    $(this).addClass("summary-card--dragging");
    e.originalEvent.dataTransfer.effectAllowed = "move";
    e.originalEvent.dataTransfer.setData("text/plain", "");
    placeholder = document.createElement("div");
    placeholder.className = "summary-card-placeholder";
    placeholder.style.height = this.offsetHeight + "px";
  });
  $list.on("dragover", ".summary-card--summary, .summary-card-placeholder", function(e) {
    e.preventDefault();
    e.originalEvent.dataTransfer.dropEffect = "move";
    if (!dragEl || this === dragEl) return;
    const rect = this.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const parentEl = this.parentNode;
    if (e.originalEvent.clientY < midY) {
      parentEl.insertBefore(placeholder, this);
    } else {
      parentEl.insertBefore(placeholder, this.nextSibling);
    }
  });
  $list.on("dragend", ".summary-card--summary", function() {
    $(this).removeClass("summary-card--dragging");
    if (placeholder && placeholder.parentNode) {
      placeholder.parentNode.insertBefore(dragEl, placeholder);
      placeholder.parentNode.removeChild(placeholder);
    }
    const cards = $list.find(".summary-card--summary");
    cards.each(function(index) {
      const summaryId = $(this).data("summary-id");
      const s = mgr.summaries.find((s2) => s2.id === summaryId);
      if (s) {
        s.sortOrder = index;
      }
    });
    saveSummaryData();
    setTimeout(() => renderSVGLines(), 60);
    dragEl = null;
    placeholder = null;
  });
}

function renderSVGLines() {
  const $svg = dom.summaryManager.find("#summary-svg-lines");
  $svg.empty();
  const mgr = getSummaryManager();
  if (!mgr) return;
  const $columns = dom.summaryManager.find("#summary-columns");
  if (!$columns.length) return;
  const columnsEl = $columns[0];
  const colRect = columnsEl.getBoundingClientRect();
  const scrollLeft = columnsEl.scrollLeft;
  const scrollTop = 0;
  const svgW = columnsEl.scrollWidth;
  const svgH = columnsEl.clientHeight;
  $svg.attr({ width: svgW, height: svgH });
  $svg.css({ width: svgW + "px", height: svgH + "px" });
  function drawCurve(fromEl, toEl, cssClass) {
    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();
    const x1 = fromRect.right - colRect.left + scrollLeft;
    const y1 = fromRect.top + fromRect.height / 2 - colRect.top + scrollTop;
    const x2 = toRect.left - colRect.left + scrollLeft;
    const y2 = toRect.top + toRect.height / 2 - colRect.top + scrollTop;
    const midX = (x1 + x2) / 2;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`);
    path.setAttribute("class", cssClass);
    $svg.append(path);
  }
  for (const summary of mgr.summaries) {
    if (summary.type === "merged" || !summary.messageRange) continue;
    const $summaryCard = dom.summaryManager.find(`[data-summary-id="${summary.id}"]`);
    if (!$summaryCard.length) continue;
    const lineClass = summary.enabled ? "line-group-to-summary line-enabled" : "line-group-to-summary";
    if (summary.sourceGroups && summary.sourceGroups.length > 0) {
      for (const sg of summary.sourceGroups) {
        const $groupCard = dom.summaryManager.find(
          `[data-group-start="${sg.start}"][data-group-end="${sg.end}"]`
        );
        if ($groupCard.length) {
          drawCurve($groupCard[0], $summaryCard[0], lineClass);
        }
      }
    } else {
      const $groupCard = dom.summaryManager.find(
        `[data-group-start="${summary.messageRange[0]}"][data-group-end="${summary.messageRange[1]}"]`
      );
      if (!$groupCard.length) continue;
      drawCurve($groupCard[0], $summaryCard[0], lineClass);
    }
  }
  for (const relation of mgr.relations) {
    const $parent = dom.summaryManager.find(`[data-summary-id="${relation.parentId}"]`);
    if (!$parent.length) continue;
    const parentSummary = mgr.summaries.find((s) => s.id === relation.parentId);
    for (const childId of relation.childIds) {
      const $child = dom.summaryManager.find(`[data-summary-id="${childId}"]`);
      if (!$child.length) continue;
      const lineClass = parentSummary?.enabled ? "line-merged line-enabled" : "line-merged";
      drawCurve($child[0], $parent[0], lineClass);
    }
  }
}

async function handleGenerateSingle(groupIndex, group) {
  if (!activeChat) return;
  const mgr = getSummaryManager();
  if (!mgr) return;
  if (group.roundCount < ROUNDS_PER_GROUP) {
    showStatus2(`\u7B2C ${groupIndex + 1} \u7EC4\u53EA\u6709 ${group.roundCount} \u8F6E\uFF0C\u4E0D\u8DB3 ${ROUNDS_PER_GROUP} \u8F6E\uFF0C\u65E0\u6CD5\u751F\u6210\u603B\u7ED3`, "warning");
    return;
  }
  showStatus2("\u6B63\u5728\u751F\u6210\u603B\u7ED3...", "info");
  const $groupCard = dom.summaryManager.find(`[data-group-index="${groupIndex}"]`);
  const $loadingEl = $('<div class="summary-card-loading"><i class="fa-solid fa-spinner"></i><span>\u6B63\u5728\u751F\u6210...</span></div>');
  $groupCard.find(".summary-card-actions").hide();
  $groupCard.append($loadingEl);
  try {
    let progressText = "";
    const summaryText = await generateSummary({
      messagePairs: group.pairs,
      onProgress: (chunk) => {
        progressText += chunk;
        const preview = stripThink(progressText);
        if (preview) {
          const displayText = preview.length > 80 ? preview.substring(0, 80) + "..." : preview;
          $loadingEl.find("span").text(displayText);
        }
      }
    });
    if (summaryText) {
      mgr.createSummary({
        messageRange: [group.start, group.end],
        content: summaryText,
        type: "direct"
      });
      saveSummaryData();
      showStatus2("\u603B\u7ED3\u751F\u6210\u5B8C\u6210", "success");
    } else {
      showStatus2("\u603B\u7ED3\u751F\u6210\u5931\u8D25\uFF1A\u8FD4\u56DE\u5185\u5BB9\u4E3A\u7A7A", "error");
    }
  } catch (err) {
    console.error("[Summary] \u751F\u6210\u603B\u7ED3\u5931\u8D25:", err);
    showStatus2("\u751F\u6210\u5931\u8D25: " + err.message, "error");
  }
  renderPanel();
}

async function handleGenerateSelected() {
  if (!activeChat) return;
  const mgr = getSummaryManager();
  if (!mgr) return;
  if (selectedGroupIndices.size > 0) {
    const groups = mgr.groupMessages(activeChat.messages);
    const indices = [...selectedGroupIndices].sort((a, b) => a - b);
    const shortGroups = indices.filter((idx) => groups[idx] && groups[idx].roundCount < ROUNDS_PER_GROUP);
    if (shortGroups.length > 0) {
      const names = shortGroups.map((idx) => `\u7B2C${idx + 1}\u7EC4(${groups[idx].roundCount}\u8F6E)`).join("\u3001");
      showStatus2(`${names} \u4E0D\u8DB3 ${ROUNDS_PER_GROUP} \u8F6E\uFF0C\u5DF2\u81EA\u52A8\u8DF3\u8FC7`, "warning");
    }
    const validIndices = indices.filter((idx) => groups[idx] && groups[idx].roundCount >= ROUNDS_PER_GROUP);
    const allPairs = [];
    let mergeStart = Infinity, mergeEnd = -Infinity;
    const sourceGroupStarts = [];
    for (const idx of validIndices) {
      const group = groups[idx];
      if (!group) continue;
      allPairs.push(...group.pairs);
      if (group.start < mergeStart) mergeStart = group.start;
      if (group.end > mergeEnd) mergeEnd = group.end;
      sourceGroupStarts.push({ start: group.start, end: group.end });
    }
    if (allPairs.length === 0) {
      showStatus2("\u9009\u4E2D\u7684\u6D88\u606F\u7EC4\u65E0\u6709\u6548\u6D88\u606F\uFF08\u53EF\u80FD\u5168\u90E8\u4E0D\u8DB3\u8F6E\u6570\uFF09", "warning");
      return;
    }
    showStatus2(`\u6B63\u5728\u4E3A ${indices.length} \u4E2A\u6D88\u606F\u7EC4\u751F\u6210\u5408\u5E76\u603B\u7ED3\uFF08\u5171 ${allPairs.length} \u8F6E\uFF09...`, "info");
    try {
      const summaryText = await generateSummary({
        messagePairs: allPairs,
        onProgress: () => {
        }
      });
      if (summaryText) {
        const newSummary = mgr.createSummary({
          messageRange: [mergeStart, mergeEnd],
          content: summaryText,
          type: "direct"
        });
        if (sourceGroupStarts.length > 1) {
          newSummary.sourceGroups = sourceGroupStarts;
        }
        saveSummaryData();
        showStatus2("\u5408\u5E76\u603B\u7ED3\u751F\u6210\u5B8C\u6210", "success");
      } else {
        showStatus2("\u603B\u7ED3\u751F\u6210\u5931\u8D25\uFF1A\u8FD4\u56DE\u5185\u5BB9\u4E3A\u7A7A", "error");
      }
    } catch (err) {
      console.error("[Summary] \u751F\u6210\u5408\u5E76\u603B\u7ED3\u5931\u8D25:", err);
      showStatus2("\u751F\u6210\u5931\u8D25: " + err.message, "error");
    }
    selectedGroupIndices.clear();
    renderPanel();
    return;
  }
  if (selectedSummaryIds.size < 2) {
    showStatus2("\u8BF7\u81F3\u5C11\u9009\u62E9 2 \u4E2A\u603B\u7ED3\u8FDB\u884C\u5408\u5E76", "warning");
    return;
  }
  showStatus2("\u6B63\u5728\u751F\u6210\u5408\u5E76\u603B\u7ED3...", "info");
  try {
    const existingContents = [];
    const sourceIds = [];
    for (const id of selectedSummaryIds) {
      const s = mgr.summaries.find((s2) => s2.id === id);
      if (s) {
        existingContents.push(s.content);
        sourceIds.push(id);
      }
    }
    const mergedRange = mgr.getMergedRange(sourceIds);
    const summaryText = await generateSummary({
      existingSummaryContents: existingContents,
      onProgress: () => {
      }
    });
    if (summaryText) {
      mgr.createSummary({
        messageRange: mergedRange,
        sourceIds,
        content: summaryText,
        type: "merged"
      });
      saveSummaryData();
      showStatus2("\u5408\u5E76\u603B\u7ED3\u751F\u6210\u5B8C\u6210", "success");
      selectedSummaryIds.clear();
    } else {
      showStatus2("\u5408\u5E76\u603B\u7ED3\u751F\u6210\u5931\u8D25\uFF1A\u8FD4\u56DE\u5185\u5BB9\u4E3A\u7A7A", "error");
    }
  } catch (err) {
    console.error("[Summary] \u751F\u6210\u5408\u5E76\u603B\u7ED3\u5931\u8D25:", err);
    showStatus2("\u751F\u6210\u5931\u8D25: " + err.message, "error");
  }
  renderPanel();
}

function handleDeleteByGroupRange(start, end) {
  const mgr = getSummaryManager();
  if (!mgr) return;
  const target = mgr.summaries.find((s) => s.messageRange && s.messageRange[0] === start && s.messageRange[1] === end);
  if (target) {
    mgr.deleteSummary(target.id);
    saveSummaryData();
    renderPanel();
  }
}

function handleEnableSelected() {
  const mgr = getSummaryManager();
  if (!mgr) return;
  for (const id of selectedSummaryIds) {
    mgr.enableSummary(id);
  }
  saveSummaryData();
  selectedSummaryIds.clear();
  renderPanel();
}

function handleDisableSelected() {
  const mgr = getSummaryManager();
  if (!mgr) return;
  for (const id of selectedSummaryIds) {
    mgr.disableSummary(id);
  }
  saveSummaryData();
  selectedSummaryIds.clear();
  renderPanel();
}

function updateToolbarButtons() {
  const $genBtn = dom.summaryManager.find("#summary-generate-selected-btn");
  const $enableBtn = dom.summaryManager.find("#summary-enable-selected-btn");
  const $disableBtn = dom.summaryManager.find("#summary-disable-selected-btn");
  const hasSummarySelection = selectedSummaryIds.size > 0;
  const hasGroupSelection = selectedGroupIndices.size > 0;
  const canGenerate = selectedSummaryIds.size >= 2 || hasGroupSelection;
  $genBtn.prop("disabled", !canGenerate);
  $enableBtn.prop("disabled", !hasSummarySelection);
  $disableBtn.prop("disabled", !hasSummarySelection);
}

function updateEnabledHint() {
  const mgr = getSummaryManager();
  const $hint = dom.summaryManager.find("#summary-enabled-hint");
  if (!mgr || !mgr.summaries.length) {
    $hint.text("");
    return;
  }
  const enabledCount = mgr.summaries.filter((s) => s.enabled).length;
  $hint.text(enabledCount > 0 ? `\u5DF2\u542F\u7528 ${enabledCount} \u4E2A\u603B\u7ED3` : "");
}

function showStatus2(msg, type = "info") {
  const $bar = dom.summaryManager.find("#summary-status-bar");
  $bar.text(msg).removeClass("summary-status-bar--info summary-status-bar--success summary-status-bar--warning summary-status-bar--error").addClass(`summary-status-bar--${type}`).show();
  if (type !== "error") {
    setTimeout(() => $bar.fadeOut(), 3e3);
  }
}

function saveSummaryData() {
  if (!activeChat) return;
  const mgr = getSummaryManager();
  if (!mgr) return;
  activeChat.summaryData = mgr.exportData();
  syncAndSave().catch((err) => {
    console.error("[Summary] \u4FDD\u5B58\u603B\u7ED3\u6570\u636E\u5931\u8D25:", err);
  });
}

function escapeHTML2(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export { assistantLLM_exports, getSummaryManager, hideSummaryPanel, initSummaryEvents, resetSummaryManager, showSummaryPanel };
