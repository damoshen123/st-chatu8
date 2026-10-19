// 还原自打包产物 — 原始模块: utils/assistant/assistantSession.js
import { addLog } from "../utils.js";
import { deleteChatData, deleteChatImagesByChatId, getAiChatHistory, getChatData, getChatImagesBatch, getChatIndex, migrateV1ToV2, saveChatData, saveChatIndex } from "../configDatabase.js";
import { abortLLMChannelRequest } from "../settings/llmService.js";
import { activeChat, chatIndex, dom, initialized, isAiGenerating, setActiveChat, setChatIndex, setCurrentSystemMsgContent, setCurrentSystemMsgElement, setInitialized, setIsAiGenerating, setPendingCommand, setV2Ready } from "./assistantContext.js";
import { getAssistantDisplayName } from "./assistantAvatar.js";
import { clearAll, restore, serialize } from "../aiTaskManager.js";
import { escapeHTML } from "./assistantUtils.js";
import { renderMessagesWithPagination } from "./assistantScrollManager.js";
import { updateSendButtonState } from "./assistantMessage.js";
import { getSummaryManager, resetSummaryManager } from "./assistantSummary.js";
import { checkAndShowSettings } from "./assistantDialog.js";
import "../config.js"; // init_config
import "../aiSettingsBridge.js"; // init_aiSettingsBridge
import "../settings/llm.js"; // init_llm

function _abortAndCleanupGeneration() {
  if (isAiGenerating) {
    console.log("[AI Assistant] \u5207\u6362\u4F1A\u8BDD\u524D\u4E2D\u6B62\u6B63\u5728\u8FDB\u884C\u7684 AI \u751F\u6210");
    abortLLMChannelRequest("assistant");
    setIsAiGenerating(false);
    updateSendButtonState();
  }
  setCurrentSystemMsgElement(null);
  setCurrentSystemMsgContent(null);
  setPendingCommand(null);
}

function _clearEditingState() {
  dom.inputArea?.removeData("editing-index");
  dom.chatBody?.find(".st-chatu8-ai-msg").removeClass("editing");
}

function _sanitizeChatMessages(chatData, source = "") {
  const rawMessages = Array.isArray(chatData?.messages) ? chatData.messages : [];
  const sanitizedMessages = [];
  const sourceLabel = source ? ` (${source})` : "";
  rawMessages.forEach((msg, idx) => {
    if (!msg || typeof msg !== "object") {
      console.warn(`[AI Assistant] \u6D88\u606F[${idx}] \u65E0\u6548${sourceLabel}\uFF0C\u5DF2\u8DF3\u8FC7:`, msg);
      return;
    }
    if (msg.content === void 0 || msg.content === null) {
      msg.content = "";
    }
    if (!msg.role || msg.role !== "user" && msg.role !== "assistant" && msg.role !== "system") {
      const inferredRole = idx % 2 === 0 ? "user" : "assistant";
      console.warn(`[AI Assistant] \u6D88\u606F[${idx}] role \u5B57\u6BB5\u65E0\u6548${sourceLabel} (${msg.role})\uFF0C\u63A8\u65AD\u4E3A: ${inferredRole}`);
      msg.role = inferredRole;
    }
    sanitizedMessages.push(msg);
  });
  if (chatData) {
    chatData.messages = sanitizedMessages;
  }
  return sanitizedMessages;
}

function generateChatId() {
  return "chat_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
}

function formatDate(ms) {
  const d = new Date(ms);
  return `${d.getMonth() + 1}-${d.getDate()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function _updateIndexEntry(chatData) {
  if (!chatData || !chatData.id) return;
  const idx = chatIndex.chatList.findIndex((e) => e.id === chatData.id);
  const entry = {
    id: chatData.id,
    title: chatData.title || "\u65B0\u5BF9\u8BDD",
    updatedAt: chatData.updatedAt || Date.now(),
    messageCount: (chatData.messages || []).length
  };
  if (idx >= 0) {
    chatIndex.chatList[idx] = entry;
  } else {
    chatIndex.chatList.unshift(entry);
  }
}

async function syncAndSave(chatData) {
  const targetChat = chatData || activeChat;
  if (!targetChat) return;
  _sanitizeChatMessages(targetChat, "syncAndSave");
  targetChat.taskData = serialize();
  targetChat.updatedAt = Date.now();
  const mgr2 = getSummaryManager();
  if (mgr2 && targetChat === activeChat) {
    targetChat.summaryData = mgr2.exportData();
  }
  _updateIndexEntry(targetChat);
  try {
    await saveChatData(targetChat.id, targetChat);
    await saveChatIndex(chatIndex);
  } catch (err) {
    console.error("[AI Assistant] syncAndSave \u5931\u8D25:", err);
  }
}

async function startNewChat(appendMessage2) {
  _abortAndCleanupGeneration();
  _clearEditingState();
  if (activeChat) {
    _sanitizeChatMessages(activeChat, "startNewChat:saveOld");
    activeChat.taskData = serialize();
    activeChat.updatedAt = Date.now();
    _updateIndexEntry(activeChat);
    try {
      await saveChatData(activeChat.id, activeChat);
    } catch (err) {
      console.error("[AI Assistant] \u4FDD\u5B58\u65E7\u4F1A\u8BDD\u5931\u8D25:", err);
    }
  }
  const newId = generateChatId();
  const newChatData = {
    id: newId,
    title: "\u65B0\u5BF9\u8BDD",
    updatedAt: Date.now(),
    taskData: null,
    messages: []
  };
  setActiveChat(newChatData);
  chatIndex.activeChatId = newId;
  _updateIndexEntry(newChatData);
  dom.chatBody.empty();
  await appendMessage2("system", `\u4F60\u597D\u5440\uFF01\u6211\u662F${getAssistantDisplayName()} AI \u52A9\u624B\uFF0C\u8BA9\u6211\u4EEC\u5F00\u59CB\u65B0\u7684\u5BF9\u8BDD\u5427\uFF01`);
  clearAll();
  resetSummaryManager(newId);
  try {
    await saveChatData(newId, newChatData);
    await saveChatIndex(chatIndex);
  } catch (err) {
    console.error("[AI Assistant] \u4FDD\u5B58\u65B0\u4F1A\u8BDD\u5931\u8D25:", err);
  }
}

async function switchChat(chatId, appendMessage2) {
  const targetEntry = chatIndex.chatList.find((e) => e.id === chatId);
  if (!targetEntry) return;
  _abortAndCleanupGeneration();
  _clearEditingState();
  if (activeChat) {
    _sanitizeChatMessages(activeChat, "switchChat:saveOld");
    activeChat.taskData = serialize();
    activeChat.updatedAt = Date.now();
    _updateIndexEntry(activeChat);
    try {
      await saveChatData(activeChat.id, activeChat);
    } catch (err) {
      console.error("[AI Assistant] \u4FDD\u5B58\u5F53\u524D\u4F1A\u8BDD\u5931\u8D25:", err);
    }
  }
  let targetChat = null;
  try {
    targetChat = await getChatData(chatId);
  } catch (err) {
    console.error(`[AI Assistant] \u52A0\u8F7D\u4F1A\u8BDD ${chatId} \u5931\u8D25:`, err);
  }
  if (!targetChat) {
    console.warn(`[AI Assistant] \u4F1A\u8BDD ${chatId} \u6570\u636E\u6682\u4E0D\u53EF\u7528`);
    toastr?.warning(`\u65E0\u6CD5\u52A0\u8F7D\u4F1A\u8BDD\u300C${targetEntry.title || "\u672A\u547D\u540D"}\u300D\u7684\u6D88\u606F\u6570\u636E\uFF0C\u53EF\u80FD\u6570\u636E\u5C1A\u672A\u540C\u6B65\u6216\u5DF2\u88AB\u6E05\u7406\u3002`);
    return;
  }
  setActiveChat(targetChat);
  chatIndex.activeChatId = chatId;
  restore(targetChat.taskData || null);
  resetSummaryManager(chatId);
  if (targetChat.summaryData) {
    const newMgr = getSummaryManager();
    if (newMgr) {
      newMgr.importData(targetChat.summaryData);
    }
  }
  const msgs = _sanitizeChatMessages(targetChat, `switchChat:${chatId}`);
  console.log("[AI Assistant] \u5F00\u59CB\u6E32\u67D3\u4F1A\u8BDD:", chatId, ", \u6D88\u606F\u6570:", msgs.length);
  if (!dom.chatBody || !dom.chatBody.length) {
    console.error("[AI Assistant] switchChat: dom.chatBody \u4E0D\u5B58\u5728\uFF01");
    return;
  }
  dom.chatBody.empty();
  if (msgs.length === 0) {
    await appendMessage2("system", `\u4F60\u597D\u5440\uFF01\u6211\u662F${getAssistantDisplayName()} AI \u52A9\u624B\uFF0C\u8BA9\u6211\u4EEC\u5F00\u59CB\u65B0\u7684\u5BF9\u8BDD\u5427\uFF01`);
  } else {
    await renderMessagesWithPagination(msgs, appendMessage2, true);
  }
  console.log("[AI Assistant] \u4F1A\u8BDD\u6E32\u67D3\u5B8C\u6210\uFF0C\u6700\u7EC8\u6D88\u606F\u6570:", dom.chatBody.children().length);
  dom.historyPanel.removeClass("active");
  try {
    await saveChatIndex(chatIndex);
  } catch (err) {
    console.error("[AI Assistant] \u4FDD\u5B58\u7D22\u5F15\u5931\u8D25:", err);
  }
}

async function _renderActiveChat(appendMessage2) {
  if (!activeChat) {
    console.warn("[AI Assistant] _renderActiveChat: activeChat \u4E3A\u7A7A");
    return;
  }
  console.log("[AI Assistant] \u5F00\u59CB\u6E32\u67D3\u6D3B\u52A8\u4F1A\u8BDD:", activeChat.id, ", \u6D88\u606F\u6570:", activeChat.messages?.length);
  if (!dom.chatBody || !dom.chatBody.length) {
    console.error("[AI Assistant] _renderActiveChat: dom.chatBody \u4E0D\u5B58\u5728\uFF01");
    return;
  }
  dom.chatBody.empty();
  const msgs = _sanitizeChatMessages(activeChat, `_renderActiveChat:${activeChat.id}`);
  if (msgs.length === 0) {
    await appendMessage2("system", `\u4F60\u597D\u5440\uFF01\u6211\u662F${getAssistantDisplayName()} AI \u52A9\u624B\uFF0C\u8BA9\u6211\u4EEC\u5F00\u59CB\u65B0\u7684\u5BF9\u8BDD\u5427\uFF01`);
    return;
  }
  await renderMessagesWithPagination(msgs, appendMessage2, true);
  console.log("[AI Assistant] \u6D3B\u52A8\u4F1A\u8BDD\u6E32\u67D3\u5B8C\u6210\uFF0C\u6700\u7EC8\u6D88\u606F\u6570:", dom.chatBody.children().length);
}

async function initChatSession(appendMessage2) {
  if (initialized) {
    console.log("[AI Assistant] \u4F1A\u8BDD\u5DF2\u521D\u59CB\u5316\uFF0C\u8DF3\u8FC7\u91CD\u590D\u521D\u59CB\u5316");
    return;
  }
  setInitialized(true);
  try {
    const existingIndex = await getChatIndex();
    if (existingIndex && existingIndex.version === 2) {
      setChatIndex(existingIndex);
      setV2Ready(true);
      console.log("[AI Assistant] V2 \u7D22\u5F15\u52A0\u8F7D\u6210\u529F\uFF0C\u5171", existingIndex.chatList.length, "\u4E2A\u4F1A\u8BDD");
      const targetChatId = existingIndex.activeChatId || (existingIndex.chatList && existingIndex.chatList.length > 0 ? existingIndex.chatList[0].id : null);
      if (targetChatId) {
        try {
          const chatData = await getChatData(targetChatId);
          if (chatData) {
            existingIndex.activeChatId = targetChatId;
            setActiveChat(chatData);
            restore(chatData.taskData || null);
            resetSummaryManager(chatData.id);
            if (chatData.summaryData) {
              const initMgr = getSummaryManager();
              if (initMgr) initMgr.importData(chatData.summaryData);
            }
          } else {
            console.warn(`[AI Assistant] \u4F1A\u8BDD ${targetChatId} \u6682\u65F6\u65E0\u6CD5\u76F4\u63A5\u52A0\u8F7D\uFF0C\u4FDD\u7559\u7D22\u5F15\u8BB0\u5F55`);
          }
        } catch (err) {
          console.error("[AI Assistant] \u52A0\u8F7D\u6D3B\u52A8\u4F1A\u8BDD\u5931\u8D25:", err);
        }
      }
    } else {
      console.log("[AI Assistant] \u672A\u627E\u5230 V2 \u7D22\u5F15\uFF0C\u68C0\u6D4B V1 \u65E7\u6570\u636E...");
      const oldHistory = await getAiChatHistory();
      if (oldHistory && (Array.isArray(oldHistory) && oldHistory.length > 0 || oldHistory.chats)) {
        console.log("[AI Assistant] \u68C0\u6D4B\u5230 V1 \u6570\u636E\uFF0C\u5F00\u59CB\u8FC1\u79FB...");
        try {
          const result = await migrateV1ToV2();
          if (result.success) {
            console.log(`[AI Assistant] \u8FC1\u79FB\u6210\u529F: ${result.migratedChats} \u4E2A\u4F1A\u8BDD, ${result.migratedImages} \u5F20\u56FE\u7247`);
            const migratedIndex = await getChatIndex();
            if (migratedIndex) {
              setChatIndex(migratedIndex);
              if (migratedIndex.activeChatId) {
                const chatData = await getChatData(migratedIndex.activeChatId);
                if (chatData) {
                  setActiveChat(chatData);
                  restore(chatData.taskData || null);
                  resetSummaryManager(chatData.id);
                  if (chatData.summaryData) {
                    const migMgr = getSummaryManager();
                    if (migMgr) migMgr.importData(chatData.summaryData);
                  }
                }
              }
            }
          } else {
            console.error("[AI Assistant] V1\u2192V2 \u8FC1\u79FB\u5931\u8D25:", result.error);
          }
        } catch (migErr) {
          console.error("[AI Assistant] \u8FC1\u79FB\u8FC7\u7A0B\u51FA\u9519:", migErr);
        }
      } else {
        console.log("[AI Assistant] \u65E0\u5386\u53F2\u6570\u636E\uFF0C\u521D\u59CB\u5316\u7A7A\u7D22\u5F15");
        setChatIndex({ version: 2, activeChatId: null, chatList: [] });
      }
      setV2Ready(true);
    }
  } catch (err) {
    console.error("[AI Assistant] \u52A0\u8F7D\u804A\u5929\u8BB0\u5F55\u5931\u8D25", err);
    setChatIndex({ version: 2, activeChatId: null, chatList: [] });
    setV2Ready(true);
  }
  if (!activeChat) {
    await startNewChat(appendMessage2);
  } else {
    await _renderActiveChat(appendMessage2);
  }
}

function _startRenameInline($titleSpan, entry, appendMessage2) {
  if ($titleSpan.parent().find(".st-chatu8-ai-history-rename-input").length > 0) return;
  const currentTitle = entry.title || "\u65B0\u5BF9\u8BDD";
  const $input = $(`<input type="text" class="st-chatu8-ai-history-rename-input" />`);
  $input.val(currentTitle);
  $titleSpan.hide().after($input);
  $input.focus().select();
  const finishRename = async () => {
    const newTitle = $input.val().trim();
    $input.remove();
    $titleSpan.show();
    if (!newTitle || newTitle === currentTitle) return;
    const idx = chatIndex.chatList.findIndex((e) => e.id === entry.id);
    if (idx >= 0) {
      chatIndex.chatList[idx].title = newTitle;
    }
    entry.title = newTitle;
    if (activeChat && activeChat.id === entry.id) {
      activeChat.title = newTitle;
      activeChat.updatedAt = Date.now();
      try {
        await saveChatData(activeChat.id, activeChat);
      } catch (err) {
        console.error("[AI Assistant] \u4FDD\u5B58\u91CD\u547D\u540D\u7684\u6D3B\u52A8\u4F1A\u8BDD\u5931\u8D25:", err);
      }
    } else {
      try {
        const chatData = await getChatData(entry.id);
        if (chatData) {
          chatData.title = newTitle;
          chatData.updatedAt = Date.now();
          await saveChatData(entry.id, chatData);
        }
      } catch (err) {
        console.error(`[AI Assistant] \u4FDD\u5B58\u91CD\u547D\u540D\u4F1A\u8BDD ${entry.id} \u5931\u8D25:`, err);
      }
    }
    try {
      await saveChatIndex(chatIndex);
    } catch (err) {
      console.error("[AI Assistant] \u4FDD\u5B58\u7D22\u5F15\u5931\u8D25:", err);
    }
    renderHistoryList(appendMessage2);
    toastr?.success("\u5DF2\u91CD\u547D\u540D\u4E3A: " + newTitle);
  };
  let finished = false;
  const safeFinish = () => {
    if (finished) return;
    finished = true;
    finishRename();
  };
  $input.on("keydown", function(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      safeFinish();
    } else if (e.key === "Escape") {
      e.preventDefault();
      $input.remove();
      $titleSpan.show();
      finished = true;
    }
  });
  $input.on("blur", function() {
    setTimeout(safeFinish, 150);
  });
}

function renderHistoryList(appendMessage2) {
  dom.historyList.empty();
  const chatArray = [...chatIndex.chatList].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  if (chatArray.length === 0) {
    dom.historyList.append('<div style="text-align: center; color: var(--st-chatu8-text-secondary); margin-top: 20px;">\u6682\u65E0\u804A\u5929\u8BB0\u5F55</div>');
    return;
  }
  chatArray.forEach((entry) => {
    const isActive = entry.id === chatIndex.activeChatId ? "active-chat" : "";
    const html = `
            <div class="st-chatu8-ai-history-item ${isActive}" data-id="${entry.id}">
                <div class="st-chatu8-ai-history-content">
                    <input type="checkbox" class="st-chatu8-ai-history-checkbox" data-id="${entry.id}">
                    <div class="st-chatu8-ai-history-info">
                        <span class="st-chatu8-ai-history-title">${escapeHTML(entry.title)}</span>
                        <span class="st-chatu8-ai-history-time">${formatDate(entry.updatedAt)}${entry.messageCount != null ? ` \xB7 ${entry.messageCount}\u6761` : ""}</span>
                    </div>
                </div>
                <div class="st-chatu8-ai-history-actions">
                    <i class="fa-solid fa-pen st-chatu8-ai-history-rename" data-id="${entry.id}" title="\u91CD\u547D\u540D"></i>
                    <i class="fa-solid fa-trash-can st-chatu8-ai-history-delete" data-id="${entry.id}" title="\u5220\u9664\u6B64\u5BF9\u8BDD"></i>
                </div>
            </div>
        `;
    const $item = $(html);
    $item.find(".st-chatu8-ai-history-info").on("click", function(e) {
      e.stopPropagation();
      if ($(this).find(".st-chatu8-ai-history-rename-input").length > 0) return;
      switchChat(entry.id, appendMessage2);
    });
    $item.find(".st-chatu8-ai-history-title").on("dblclick", function(e) {
      e.stopPropagation();
      _startRenameInline($(this), entry, appendMessage2);
    });
    $item.find(".st-chatu8-ai-history-checkbox").on("click", function(e) {
      e.stopPropagation();
      const $checkbox = $(this);
      const $historyItem = $checkbox.closest(".st-chatu8-ai-history-item");
      if ($checkbox.is(":checked")) {
        $historyItem.addClass("selected");
      } else {
        $historyItem.removeClass("selected");
      }
    });
    $item.find(".st-chatu8-ai-history-rename").on("click", function(e) {
      e.stopPropagation();
      const $titleSpan = $item.find(".st-chatu8-ai-history-title");
      _startRenameInline($titleSpan, entry, appendMessage2);
    });
    $item.find(".st-chatu8-ai-history-delete").on("click", async function(e) {
      e.stopPropagation();
      if (confirm("\u786E\u5B9A\u8981\u6C38\u4E45\u5220\u9664\u8FD9\u6761\u804A\u5929\u8BB0\u5F55\u5417\uFF1F")) {
        const deleteId = entry.id;
        try {
          await deleteChatImagesByChatId(deleteId);
          await deleteChatData(deleteId);
        } catch (err) {
          console.error(`[AI Assistant] \u5220\u9664\u4F1A\u8BDD ${deleteId} \u5931\u8D25:`, err);
        }
        chatIndex.chatList = chatIndex.chatList.filter((e2) => e2.id !== deleteId);
        if (chatIndex.activeChatId === deleteId) {
          chatIndex.activeChatId = null;
          setActiveChat(null);
          await startNewChat(appendMessage2);
        }
        try {
          await saveChatIndex(chatIndex);
        } catch (err) {
          console.error("[AI Assistant] \u4FDD\u5B58\u7D22\u5F15\u5931\u8D25:", err);
        }
        renderHistoryList(appendMessage2);
      }
    });
    dom.historyList.append($item);
  });
}

function initSessionEvents(appendMessage2) {
  const {
    dialog,
    newChatBtn,
    historyBtn,
    historyPanel,
    historyCloseBtn,
    historyList,
    exportChatBtn,
    selectAllBtn,
    deselectAllBtn,
    settingsPanel,
    inputArea
  } = dom;
  let isRendering = false;
  $(document).off("click", "#st-chatu8-ai-trigger");
  $(document).on("click", "#st-chatu8-ai-trigger", async function(e) {
    const wasActive = dialog.hasClass("active");
    dialog.toggleClass("active");
    if (dialog.hasClass("active") && !wasActive) {
      if (isRendering) {
        console.log("[AI Assistant] \u6B63\u5728\u6E32\u67D3\u4E2D\uFF0C\u8DF3\u8FC7\u91CD\u590D\u8BF7\u6C42");
        return;
      }
      isRendering = true;
      addLog("[UI] \u5524\u9192\u667A\u7ED8\u59ECAI\u52A9\u624B");
      const dialogWidth = dialog.outerWidth();
      const dialogHeight = dialog.outerHeight();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const centerLeft = (viewportWidth - dialogWidth) / 2;
      const centerTop = (viewportHeight - dialogHeight) / 2;
      dialog.css({
        left: Math.max(0, centerLeft) + "px",
        top: Math.max(0, centerTop) + "px"
      });
      checkAndShowSettings();
      requestAnimationFrame(() => {
        if (!initialized) {
          initChatSession(appendMessage2).then(() => {
            setTimeout(() => inputArea.focus(), 100);
            isRendering = false;
          }).catch((err) => {
            console.error("[AI Assistant] \u521D\u59CB\u5316\u4F1A\u8BDD\u5931\u8D25:", err);
            isRendering = false;
          });
        } else {
          _renderActiveChat(appendMessage2).then(() => {
            setTimeout(() => inputArea.focus(), 100);
            isRendering = false;
          }).catch((err) => {
            console.error("[AI Assistant] \u6E32\u67D3\u4F1A\u8BDD\u5931\u8D25:", err);
            isRendering = false;
          });
        }
      });
    }
  });
  newChatBtn.on("click", async function() {
    if (confirm("\u786E\u5B9A\u8981\u4FDD\u7559\u5F53\u524D\u804A\u5929\uFF0C\u5F00\u542F\u65B0\u5BF9\u8BDD\u5417\uFF1F")) {
      await startNewChat(appendMessage2);
      toastr?.success("\u5DF2\u5F00\u542F\u65B0\u5BF9\u8BDD\u3002");
    }
  });
  historyBtn.on("click", function() {
    settingsPanel.removeClass("active");
    renderHistoryList(appendMessage2);
    historyPanel.addClass("active");
  });
  historyCloseBtn.on("click", function() {
    historyPanel.removeClass("active");
  });
  selectAllBtn.on("click", function() {
    historyList.find(".st-chatu8-ai-history-checkbox").prop("checked", true).trigger("change");
    historyList.find(".st-chatu8-ai-history-item").addClass("selected");
  });
  deselectAllBtn.on("click", function() {
    historyList.find(".st-chatu8-ai-history-checkbox").prop("checked", false).trigger("change");
    historyList.find(".st-chatu8-ai-history-item").removeClass("selected");
  });
  exportChatBtn.on("click", async function() {
    try {
      const selectedCheckboxes = historyList.find(".st-chatu8-ai-history-checkbox:checked");
      if (selectedCheckboxes.length === 0) {
        toastr?.warning("\u8BF7\u5148\u9009\u62E9\u8981\u5BFC\u51FA\u7684\u804A\u5929\u8BB0\u5F55\uFF01");
        return;
      }
      const selectedChatIds = [];
      selectedCheckboxes.each(function() {
        selectedChatIds.push($(this).data("id"));
      });
      const selectedChats = {};
      for (const chatId of selectedChatIds) {
        let chatData = null;
        if (activeChat && activeChat.id === chatId) {
          chatData = activeChat;
        } else {
          try {
            chatData = await getChatData(chatId);
          } catch (err) {
            console.error(`[AI Assistant] \u52A0\u8F7D\u4F1A\u8BDD ${chatId} \u5931\u8D25:`, err);
            continue;
          }
        }
        if (!chatData) continue;
        const allRefs = [];
        (chatData.messages || []).forEach((msg) => {
          if (Array.isArray(msg.imageRefs)) {
            allRefs.push(...msg.imageRefs);
          }
        });
        let imageMap = {};
        if (allRefs.length > 0) {
          try {
            imageMap = await getChatImagesBatch(allRefs);
          } catch (err) {
            console.error(`[AI Assistant] \u52A0\u8F7D\u4F1A\u8BDD ${chatId} \u56FE\u7247\u5931\u8D25:`, err);
          }
        }
        const exportMessages = (chatData.messages || []).map((msg) => {
          const exportMsg = { role: msg.role, content: msg.content };
          if (msg.timestamp) exportMsg.timestamp = msg.timestamp;
          if (Array.isArray(msg.imageRefs) && msg.imageRefs.length > 0) {
            const contentParts = [];
            if (msg.content) {
              contentParts.push({ type: "text", text: msg.content });
            }
            const imagesList = [];
            for (const refId of msg.imageRefs) {
              const base64 = imageMap[refId];
              if (base64) {
                contentParts.push({
                  type: "image_url",
                  image_url: { url: base64 }
                });
                imagesList.push({ data: base64, name: "\u56FE\u7247" });
              }
            }
            if (contentParts.length > 0) {
              exportMsg.content = contentParts.length === 1 && contentParts[0].type === "text" ? contentParts[0].text : contentParts;
            }
            if (imagesList.length > 0) {
              exportMsg.images = imagesList;
            }
          }
          return exportMsg;
        });
        selectedChats[chatId] = {
          id: chatData.id,
          title: chatData.title,
          updatedAt: chatData.updatedAt,
          messages: exportMessages,
          taskData: chatData.taskData
        };
      }
      if (Object.keys(selectedChats).length === 0) {
        toastr?.warning("\u672A\u80FD\u52A0\u8F7D\u4EFB\u4F55\u9009\u4E2D\u7684\u804A\u5929\u8BB0\u5F55\uFF01");
        return;
      }
      const exportData = {
        version: "2.0",
        exportDate: (/* @__PURE__ */ new Date()).toISOString(),
        exportCount: Object.keys(selectedChats).length,
        chats: selectedChats
      };
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const now = /* @__PURE__ */ new Date();
      const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}`;
      const timeStr = `${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}${now.getSeconds().toString().padStart(2, "0")}`;
      a.download = `\u667A\u7ED8\u59EC\u804A\u5929\u8BB0\u5F55_${dateStr}_${timeStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toastr?.success(`\u5DF2\u5BFC\u51FA ${Object.keys(selectedChats).length} \u6761\u804A\u5929\u8BB0\u5F55\uFF01`);
    } catch (error) {
      console.error("[AI Assistant] \u5BFC\u51FA\u804A\u5929\u8BB0\u5F55\u5931\u8D25:", error);
      toastr?.error(`\u5BFC\u51FA\u5931\u8D25: ${error.message}`);
    }
  });
}

export { initSessionEvents, startNewChat, switchChat, syncAndSave };
