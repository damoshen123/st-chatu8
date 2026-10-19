// 还原自打包产物 — 原始模块: utils/assistant/assistantMessage.js
import { getChatImagesBatch } from "../configDatabase.js";
import { activeChat, currentSystemMsgContent, currentSystemMsgElement, dom, isAiGenerating, setCurrentSystemMsgContent, setCurrentSystemMsgElement, setSelectedImages } from "./assistantContext.js";
import { generateAvatarHTML, getAssistantDisplayName, getCurrentCharAvatar, getCurrentUserAvatar } from "./assistantAvatar.js";
import { removeThinkBlocks } from "../aiSettingsBridge.js";
import { escapeHTML, renderMarkdown, renderThinkingPanel } from "./assistantUtils.js";
import { handleTTSButtonClick } from "./assistantTTS.js";
import { incrementUnreadCount, isNearBottom, scrollToMessageHead } from "./assistantScrollManager.js";
import { parseThinkingContent } from "../aiThinkingParser.js";
import { renderImagePreview } from "./assistantImage.js";
import { syncAndSave } from "./assistantSession.js";

var _scrollRAFPending;

_scrollRAFPending = false;

function removeDisclaimerBlocks(text) {
  if (!text || typeof text !== "string") return text;
  return text.replace(/<disclaimer>[\s\S]*?<\/disclaimer>/gi, "").trim();
}

function updateSendButtonState() {
  if (isAiGenerating) {
    dom.sendBtn.html('<i class="fa-solid fa-stop"></i>');
    dom.sendBtn.addClass("generating");
    dom.sendBtn.attr("title", "\u505C\u6B62\u751F\u6210");
  } else {
    dom.sendBtn.html('<i class="fa-solid fa-paper-plane"></i>');
    dom.sendBtn.removeClass("generating");
    dom.sendBtn.attr("title", "\u53D1\u9001");
  }
}

function adjustInputHeight() {
  dom.inputArea[0].style.height = "auto";
  const newHeight = Math.min(dom.inputArea[0].scrollHeight, 100);
  dom.inputArea[0].style.height = newHeight + "px";
}

function parseAndRenderAskChoice(text) {
  text = removeThinkBlocks(text);
  const choiceMatch = text.match(/<AskChoice>([\s\S]*?)<\/AskChoice>/i);
  if (!choiceMatch) return { cleanedText: text, choiceHtml: "" };
  let options = [];
  try {
    options = JSON.parse(choiceMatch[1]);
    if (!Array.isArray(options)) options = [];
  } catch (e) {
    options = choiceMatch[1].split("\n").map((s) => s.trim()).filter(Boolean);
  }
  const cleanedText = text.replace(/<AskChoice>[\s\S]*?<\/AskChoice>/gi, "").trim();
  if (options.length === 0) return { cleanedText, choiceHtml: "" };
  let choiceHtml = '<div class="st-chatu8-ai-ask-choice">';
  choiceHtml += '<div class="st-chatu8-ai-ask-choice-label"><i class="fa-solid fa-hand-pointer"></i> \u8BF7\u9009\u62E9\uFF1A</div>';
  choiceHtml += '<div class="st-chatu8-ai-ask-choice-options">';
  options.forEach((opt, idx) => {
    const label = typeof opt === "object" ? opt.label || opt.text || JSON.stringify(opt) : String(opt);
    choiceHtml += `<button class="st-chatu8-ai-ask-choice-btn" data-choice-index="${idx}" data-choice-value="${escapeHTML(label)}">${escapeHTML(label)}</button>`;
  });
  choiceHtml += "</div>";
  choiceHtml += '<div class="st-chatu8-ai-ask-choice-hint">\u70B9\u51FB\u9009\u9879\u53D1\u9001\uFF0C\u6216\u76F4\u63A5\u8F93\u5165\u6D88\u606F\u53D6\u6D88\u9009\u62E9</div>';
  choiceHtml += "</div>";
  return { cleanedText, choiceHtml };
}

function dismissAskChoices() {
  dom.chatBody.find(".st-chatu8-ai-ask-choice").addClass("dismissed");
}

async function appendSystemEmptyMessage() {
  console.log("[DEBUG-MSG] \u25B6 appendSystemEmptyMessage() \u5F00\u59CB");
  console.log("[DEBUG-MSG]   dom.chatBody \u5B58\u5728:", !!dom.chatBody, ", \u957F\u5EA6:", dom.chatBody?.length);
  const charAvatar = await getCurrentCharAvatar();
  const icon = generateAvatarHTML(charAvatar, getAssistantDisplayName());
  const html = `
        <div class="st-chatu8-ai-msg system-msg">
            <div class="msg-avatar">${icon}</div>
            <div class="msg-content"></div>
        </div>
    `;
  const $elem = $(html);
  dom.chatBody.append($elem);
  dom.chatBody.scrollTop(dom.chatBody[0].scrollHeight);
  setCurrentSystemMsgElement($elem);
  setCurrentSystemMsgContent($elem.find(".msg-content"));
  const isInDOM = $.contains(document, $elem[0]);
  const contentEl = $elem.find(".msg-content");
  console.log("[DEBUG-MSG]   \u6D88\u606F\u6C14\u6CE1\u5DF2\u521B\u5EFA, \u5728DOM\u4E2D:", isInDOM);
  console.log("[DEBUG-MSG]   currentSystemMsgContent \u5B58\u5728:", !!contentEl.length, ", \u5728DOM\u4E2D:", $.contains(document, contentEl[0]));
  console.log("[DEBUG-MSG] \u25C0 appendSystemEmptyMessage() \u7ED3\u675F");
}

function finalizeAssistantMessage(messageIndex, handleRegenerateMessage2) {
  if (!currentSystemMsgElement) return;
  currentSystemMsgElement.attr("data-msg-index", messageIndex);
  if (!currentSystemMsgElement.find(".st-chatu8-ai-msg-floor").length) {
    currentSystemMsgElement.prepend(`<span class="st-chatu8-ai-msg-floor">#${messageIndex + 1}</span>`);
  }
  const actionButtons = `
        <div class="st-chatu8-ai-msg-actions">
            <button class="st-chatu8-ai-msg-tts" data-index="${messageIndex}" title="\u6717\u8BFB\u6B64\u56DE\u590D">
                <i class="fa-solid fa-volume-up"></i>
            </button>
            <button class="st-chatu8-ai-msg-regenerate" data-index="${messageIndex}" title="\u91CD\u65B0\u751F\u6210\u6B64\u56DE\u590D">
                <i class="fa-solid fa-rotate-right"></i>
            </button>
        </div>
    `;
  currentSystemMsgElement.append(actionButtons);
  currentSystemMsgElement.find(".st-chatu8-ai-msg-regenerate").on("click", function() {
    handleRegenerateMessage2(messageIndex);
  });
  currentSystemMsgElement.find(".st-chatu8-ai-msg-tts").on("click", function() {
    handleTTSButtonClick(messageIndex);
  });
  scrollToMessageHead(currentSystemMsgElement, true);
}

function showImageFullscreen(imageUrl) {
  const overlay2 = $(`
        <div class="st-chatu8-ai-image-fullscreen-overlay" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.95);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: zoom-out;
            animation: fadeIn 0.2s ease;
        ">
            <img src="${imageUrl}" style="
                max-width: 95vw;
                max-height: 95vh;
                object-fit: contain;
                border-radius: 8px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
                animation: zoomIn 0.3s ease;
            " />
            <div style="
                position: absolute;
                top: 20px;
                right: 20px;
                color: white;
                font-size: 32px;
                cursor: pointer;
                background: rgba(0, 0, 0, 0.5);
                width: 48px;
                height: 48px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s;
            " class="st-chatu8-ai-fullscreen-close">
                <i class="fa-solid fa-times"></i>
            </div>
        </div>
    `);
  if (!$("#st-chatu8-ai-fullscreen-styles").length) {
    $("head").append(`
            <style id="st-chatu8-ai-fullscreen-styles">
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes zoomIn {
                    from { transform: scale(0.8); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .st-chatu8-ai-fullscreen-close:hover {
                    background: rgba(255, 255, 255, 0.2) !important;
                }
            </style>
        `);
  }
  overlay2.on("click", function(e) {
    if (e.target === this || $(e.target).closest(".st-chatu8-ai-fullscreen-close").length) {
      overlay2.fadeOut(200, () => overlay2.remove());
    }
  });
  $(document).on("keydown.fullscreen", function(e) {
    if (e.key === "Escape") {
      overlay2.fadeOut(200, () => overlay2.remove());
      $(document).off("keydown.fullscreen");
    }
  });
  $("body").append(overlay2);
}

async function appendMessage(role, text, images = null, messageIndex = null, skipScroll = false, callbacks = {}) {
  let icon;
  if (role === "system" || role === "assistant") {
    const charAvatar = await getCurrentCharAvatar();
    icon = generateAvatarHTML(charAvatar, getAssistantDisplayName());
  } else {
    const userAvatar = await getCurrentUserAvatar();
    icon = generateAvatarHTML(userAvatar, "User");
  }
  const cssClass = role === "system" || role === "assistant" ? "system-msg" : "user-msg";
  let innerContent = "";
  if (images && images.length > 0) {
    innerContent += '<div class="st-chatu8-ai-message-images">';
    images.forEach((img) => {
      innerContent += `<img src="${img.data}" alt="${escapeHTML(img.name)}" class="st-chatu8-ai-message-image" style="cursor: zoom-in;" data-fullscreen-url="${img.data}" />`;
    });
    innerContent += "</div>";
  }
  if (role === "user" && typeof text === "string" && (text.includes("\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D\u68C0\u7D22\u3011") || text.includes("\u3010\u7CFB\u7EDF\u81EA\u52A8\u56DE\u590D") || text.includes("<SystemResponse"))) {
    const summaryTitle = "\u{1F527} \u5185\u90E8\u5DE5\u5177\u67E5\u8BE2\u4E0E\u6267\u884C\u7ED3\u679C (\u70B9\u51FB\u5C55\u5F00)";
    innerContent += `
            <details class="st-chatu8-ai-query-details">
                <summary class="st-chatu8-ai-query-summary"><i class="fa-solid fa-code" style="margin-right: 5px;"></i> ${summaryTitle}</summary>
                <pre class="st-chatu8-ai-query-content">${escapeHTML(text)}</pre>
            </details>
        `;
  } else if (role === "assistant" && typeof text === "string") {
    const thinkingResult = parseThinkingContent(text);
    if (thinkingResult.hasThinking) {
      thinkingResult.thinkingBlocks.forEach((block) => {
        innerContent += renderThinkingPanel(block);
      });
    }
    text = thinkingResult.cleanedText;
    const askChoiceResult = parseAndRenderAskChoice(text);
    text = askChoiceResult.cleanedText;
    const queryMatch = text.match(/<SystemQuery>([\s\S]*?)<\/SystemQuery>/gi);
    const updateMatch = text.match(/<UpdateSettings>([\s\S]*?)<\/UpdateSettings>/gi);
    if (queryMatch || updateMatch) {
      let displayHtml = `<i><span style="color:var(--st-chatu8-text-secondary);">${getAssistantDisplayName()}\u8C03\u7528\u4E86\u5185\u90E8\u5DE5\u5177...</span></i>
`;
      let rawCode = "";
      if (queryMatch) rawCode += queryMatch.join("\n");
      if (updateMatch) rawCode += updateMatch.join("\n");
      displayHtml += `
                <details class="st-chatu8-ai-query-details">
                    <summary class="st-chatu8-ai-query-summary"><i class="fa-solid fa-microchip" style="margin-right:5px"></i> \u6267\u884C\u5185\u90E8\u547D\u4EE4</summary>
                    <pre class="st-chatu8-ai-query-content">${escapeHTML(rawCode)}</pre>
                </details>
            `;
      let textWithoutTags = text.replace(/<SystemQuery>[\s\S]*?<\/SystemQuery>/gi, "").replace(/<UpdateSettings>[\s\S]*?<\/UpdateSettings>/gi, "").trim();
      textWithoutTags = removeDisclaimerBlocks(textWithoutTags);
      if (textWithoutTags) {
        displayHtml = renderMarkdown(textWithoutTags) + "<br><br>" + displayHtml;
      }
      innerContent += displayHtml;
    } else {
      text = removeDisclaimerBlocks(text);
      innerContent += renderMarkdown(text);
    }
    if (askChoiceResult.choiceHtml) {
      innerContent += askChoiceResult.choiceHtml;
    }
  } else {
    innerContent += escapeHTML(text).replace(/\n/g, "<br>");
  }
  let actionButtons = "";
  if (role === "user" && messageIndex !== null) {
    actionButtons = `
            <div class="st-chatu8-ai-msg-actions">
                <button class="st-chatu8-ai-msg-edit" data-index="${messageIndex}" title="\u7F16\u8F91\u6B64\u6D88\u606F">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="st-chatu8-ai-msg-continue" data-index="${messageIndex}" title="\u4ECE\u6B64\u5904\u7EE7\u7EED\u5BF9\u8BDD">
                    <i class="fa-solid fa-play"></i>
                </button>
            </div>
        `;
  } else if ((role === "assistant" || role === "system") && messageIndex !== null) {
    actionButtons = `
            <div class="st-chatu8-ai-msg-actions">
                <button class="st-chatu8-ai-msg-tts" data-index="${messageIndex}" title="\u6717\u8BFB\u6B64\u56DE\u590D">
                    <i class="fa-solid fa-volume-up"></i>
                </button>
                <button class="st-chatu8-ai-msg-regenerate" data-index="${messageIndex}" title="\u91CD\u65B0\u751F\u6210\u6B64\u56DE\u590D">
                    <i class="fa-solid fa-rotate-right"></i>
                </button>
            </div>
        `;
  }
  const floorBadge = messageIndex !== null ? `<span class="st-chatu8-ai-msg-floor">#${messageIndex + 1}</span>` : "";
  const html = `
        <div class="st-chatu8-ai-msg ${cssClass}" data-msg-index="${messageIndex !== null ? messageIndex : ""}">
            ${floorBadge}
            <div class="msg-avatar">${icon}</div>
            <div class="msg-content">${innerContent}</div>
            ${actionButtons}
        </div>
    `;
  const $msgElement = $(html);
  dom.chatBody.append($msgElement);
  $msgElement.find(".st-chatu8-ai-message-image").on("click", function() {
    const imageUrl = $(this).attr("data-fullscreen-url") || $(this).attr("src");
    showImageFullscreen(imageUrl);
  });
  if (role === "user" && messageIndex !== null) {
    $msgElement.find(".st-chatu8-ai-msg-edit").on("click", function() {
      if (callbacks.handleEditMessage) callbacks.handleEditMessage(messageIndex);
    });
    $msgElement.find(".st-chatu8-ai-msg-continue").on("click", function() {
      if (callbacks.handleContinueFromMessage) callbacks.handleContinueFromMessage(messageIndex);
    });
  } else if ((role === "assistant" || role === "system") && messageIndex !== null) {
    $msgElement.find(".st-chatu8-ai-msg-regenerate").on("click", function() {
      if (callbacks.handleRegenerateMessage) callbacks.handleRegenerateMessage(messageIndex);
    });
    $msgElement.find(".st-chatu8-ai-msg-tts").on("click", function() {
      handleTTSButtonClick(messageIndex);
    });
  }
  $msgElement.find(".st-chatu8-ai-ask-choice-btn").on("click", function() {
    const choiceValue = $(this).attr("data-choice-value");
    if (!choiceValue) return;
    $(this).addClass("selected");
    $(this).closest(".st-chatu8-ai-ask-choice").addClass("answered");
    dom.inputArea.val(choiceValue);
    if (callbacks.handleSend) callbacks.handleSend();
  });
  if (!skipScroll) {
    if (role === "assistant" || role === "system") {
      scrollToMessageHead($msgElement, true);
    } else {
      dom.chatBody.scrollTop(dom.chatBody[0].scrollHeight);
    }
  } else {
    if ((role === "assistant" || role === "system") && !isNearBottom()) {
      incrementUnreadCount();
    }
  }
}

async function handleEditMessage(messageIndex) {
  if (!activeChat) return;
  const message = activeChat.messages[messageIndex];
  if (!message || message.role !== "user") return;
  let textContent = "";
  if (Array.isArray(message.content)) {
    const textPart = message.content.find((c) => c.type === "text");
    textContent = textPart ? textPart.text : "";
  } else {
    textContent = message.content || "";
  }
  dom.inputArea.val(textContent);
  adjustInputHeight();
  if (Array.isArray(message.imageRefs) && message.imageRefs.length > 0) {
    try {
      const imageCache = await getChatImagesBatch(message.imageRefs);
      const restoredImages = message.imageRefs.filter((refId) => imageCache[refId]).map((refId) => ({ data: imageCache[refId], name: refId }));
      if (restoredImages.length > 0) {
        setSelectedImages(restoredImages);
        renderImagePreviewFromMessage();
      }
    } catch (err) {
      console.error("[AI Assistant] \u7F16\u8F91\u6D88\u606F\u65F6\u52A0\u8F7D\u56FE\u7247\u5931\u8D25:", err);
    }
  } else if (message.images && message.images.length > 0) {
    setSelectedImages([...message.images]);
    renderImagePreviewFromMessage();
  }
  dom.chatBody.find(".st-chatu8-ai-msg").removeClass("editing");
  dom.chatBody.find(`.st-chatu8-ai-msg[data-msg-index="${messageIndex}"]`).addClass("editing");
  dom.inputArea.focus();
  toastr?.info("\u6D88\u606F\u5DF2\u52A0\u8F7D\u5230\u8F93\u5165\u6846\uFF0C\u4FEE\u6539\u540E\u53D1\u9001\u5C06\u66FF\u6362\u539F\u6D88\u606F\u5E76\u91CD\u65B0\u751F\u6210\u540E\u7EED\u5BF9\u8BDD");
  dom.inputArea.data("editing-index", messageIndex);
}

function renderImagePreviewFromMessage() {
  renderImagePreview();
}

async function handleContinueFromMessage(messageIndex, switchChatFn) {
  if (!activeChat) return;
  if (messageIndex >= activeChat.messages.length) return;
  const confirmMsg = `\u786E\u5B9A\u8981\u4ECE\u7B2C ${messageIndex + 1} \u6761\u6D88\u606F\u7EE7\u7EED\u5417\uFF1F\u8FD9\u5C06\u5220\u9664\u8BE5\u6D88\u606F\u4E4B\u540E\u7684\u6240\u6709\u5BF9\u8BDD\u3002`;
  if (!confirm(confirmMsg)) return;
  activeChat.messages = activeChat.messages.slice(0, messageIndex + 1);
  activeChat.updatedAt = Date.now();
  await syncAndSave(activeChat);
  switchChatFn(activeChat.id);
  toastr?.success("\u5DF2\u4ECE\u6B64\u5904\u7EE7\u7EED\u5BF9\u8BDD\uFF0C\u53EF\u4EE5\u8F93\u5165\u65B0\u6D88\u606F\u4E86");
}

function throttledScrollToBottom() {
  if (_scrollRAFPending) return;
  _scrollRAFPending = true;
  requestAnimationFrame(() => {
    _scrollRAFPending = false;
    if (dom.chatBody && dom.chatBody[0]) {
      dom.chatBody[0].scrollTop = dom.chatBody[0].scrollHeight;
    }
  });
}

function reattachMessageElement() {
  console.log("[FIX-REATTACH] \u25B6 \u5F00\u59CB\u5C1D\u8BD5\u91CD\u65B0\u9644\u7740\u6D88\u606F\u5143\u7D20\u5230 DOM");
  if (!isAiGenerating) {
    console.warn("[FIX-REATTACH] Step0 \u4E2D\u6B62\uFF1AAI \u5DF2\u505C\u6B62\u751F\u6210\uFF0C\u8DF3\u8FC7\u91CD\u65B0\u9644\u7740\uFF08\u53EF\u80FD\u662F\u4F1A\u8BDD\u5DF2\u5207\u6362\uFF09");
    return false;
  }
  if (!currentSystemMsgElement || !currentSystemMsgContent) {
    console.warn("[FIX-REATTACH] Step1 \u5931\u8D25\uFF1AcurrentSystemMsgElement=", !!currentSystemMsgElement, ", currentSystemMsgContent=", !!currentSystemMsgContent);
    return false;
  }
  console.log("[FIX-REATTACH] Step1 \u901A\u8FC7\uFF1A\u5143\u7D20\u5F15\u7528\u5B58\u5728");
  let chatBody = dom.chatBody;
  console.log("[FIX-REATTACH] Step2: dom.chatBody \u5B58\u5728:", !!chatBody, ", \u957F\u5EA6:", chatBody?.length);
  if (chatBody && chatBody.length) {
    const chatBodyInDOM = $.contains(document, chatBody[0]);
    console.log("[FIX-REATTACH] Step2: dom.chatBody \u5728DOM\u4E2D:", chatBodyInDOM);
  }
  if (!chatBody || !chatBody.length || !$.contains(document, chatBody[0])) {
    console.warn("[FIX-REATTACH] Step2: dom.chatBody \u4E5F\u5DF2\u8131\u79BB DOM\uFF0C\u5C1D\u8BD5\u91CD\u65B0\u67E5\u627E...");
    const selectors = [
      "#st-chatu8-ai-chat-body",
      ".st-chatu8-ai-dialog #st-chatu8-ai-chat-body",
      '[id="st-chatu8-ai-chat-body"]'
    ];
    let found = false;
    for (const sel of selectors) {
      const newChatBody = $(sel);
      console.log("[FIX-REATTACH] Step2: \u5C1D\u8BD5\u9009\u62E9\u5668", sel, "\u2192 \u627E\u5230:", newChatBody.length);
      if (newChatBody.length && $.contains(document, newChatBody[0])) {
        dom.chatBody = newChatBody;
        chatBody = newChatBody;
        found = true;
        console.log("[FIX-REATTACH] Step2 \u2705 \u5DF2\u901A\u8FC7", sel, "\u91CD\u65B0\u627E\u5230 dom.chatBody");
        break;
      }
    }
    if (!found) {
      console.error("[FIX-REATTACH] Step2 \u274C \u65E0\u6CD5\u627E\u5230\u6709\u6548\u7684 dom.chatBody\uFF0C\u653E\u5F03\u91CD\u65B0\u9644\u7740");
      return false;
    }
  } else {
    console.log("[FIX-REATTACH] Step2 \u901A\u8FC7\uFF1Adom.chatBody \u4ECD\u5728 DOM \u4E2D");
  }
  console.log("[FIX-REATTACH] Step3: \u6267\u884C chatBody.append(currentSystemMsgElement)");
  chatBody.append(currentSystemMsgElement);
  const nowInDOM = $.contains(document, currentSystemMsgContent[0]);
  console.log("[FIX-REATTACH] Step4: \u91CD\u65B0\u9644\u7740\u540E currentSystemMsgContent \u5728DOM\u4E2D:", nowInDOM);
  if (nowInDOM) {
    console.log("[FIX-REATTACH] \u2705 \u91CD\u65B0\u9644\u7740\u6210\u529F\uFF01");
  } else {
    console.error("[FIX-REATTACH] \u274C \u91CD\u65B0\u9644\u7740\u540E\u5143\u7D20\u4ECD\u4E0D\u5728 DOM \u4E2D\uFF01");
  }
  return nowInDOM;
}

function createThrottledUIUpdater2(handleSendFn) {
  let accumulatedReply = "";
  let thinkingRendered = false;
  let lastUpdateTime = 0;
  let pendingUpdate = null;
  const UPDATE_INTERVAL = 120;
  function doUpdate() {
    if (!currentSystemMsgContent) {
      console.warn("[DEBUG-UI] \u26A0 doUpdate(): currentSystemMsgContent \u4E3A null/undefined\uFF0C\u8DF3\u8FC7");
      return;
    }
    const inDOM = $.contains(document, currentSystemMsgContent[0]);
    console.log("[DEBUG-UI] doUpdate(): currentSystemMsgContent \u5728DOM\u4E2D:", inDOM, ", accumulatedReply\u957F\u5EA6:", accumulatedReply.length);
    if (!inDOM) {
      console.error("[DEBUG-UI] \u274C doUpdate(): currentSystemMsgContent \u5DF2\u8131\u79BB DOM\uFF01\u5C1D\u8BD5\u4FEE\u590D...");
      const fixed = reattachMessageElement();
      if (!fixed) {
        console.error("[DEBUG-UI] \u274C doUpdate(): \u4FEE\u590D\u5931\u8D25\uFF0C\u8DF3\u8FC7\u672C\u6B21\u66F4\u65B0");
        return;
      }
      console.log("[DEBUG-UI] \u2705 doUpdate(): DOM \u91CD\u65B0\u9644\u7740\u6210\u529F\uFF0C\u7EE7\u7EED\u66F4\u65B0");
    }
    let displayHtml = "";
    const thinkingResult = parseThinkingContent(accumulatedReply);
    if (thinkingResult.hasThinking) {
      thinkingResult.thinkingBlocks.forEach((block) => {
        displayHtml += renderThinkingPanel(block);
      });
      if (!thinkingResult.thinkingBlocks.some((b) => b.isUnclosed)) {
        thinkingRendered = true;
      }
    }
    let textWithoutThink = thinkingResult.cleanedText;
    textWithoutThink = textWithoutThink.replace(/<AskChoice>[\s\S]*?<\/AskChoice>/gi, "").trim();
    const queryMatch = textWithoutThink.match(/<SystemQuery>([\s\S]*?)<\/SystemQuery>/gi);
    const updateMatch = textWithoutThink.match(/<UpdateSettings>([\s\S]*?)<\/UpdateSettings>/gi);
    if (queryMatch || updateMatch) {
      displayHtml += `<i><span style="color:var(--st-chatu8-text-secondary);">${getAssistantDisplayName()}\u8C03\u7528\u4E86\u5185\u90E8\u5DE5\u5177...</span></i>
`;
      let rawCode = "";
      if (queryMatch) rawCode += queryMatch.join("\n");
      if (updateMatch) rawCode += updateMatch.join("\n");
      displayHtml += `
                <details class="st-chatu8-ai-query-details">
                    <summary class="st-chatu8-ai-query-summary"><i class="fa-solid fa-microchip" style="margin-right:5px"></i> \u6267\u884C\u5185\u90E8\u547D\u4EE4</summary>
                    <pre class="st-chatu8-ai-query-content">${escapeHTML(rawCode)}</pre>
                </details>
            `;
      let textWithoutTags = textWithoutThink.replace(/<SystemQuery>[\s\S]*?<\/SystemQuery>/gi, "").replace(/<UpdateSettings>[\s\S]*?<\/UpdateSettings>/gi, "").trim();
      textWithoutTags = removeDisclaimerBlocks(textWithoutTags);
      if (textWithoutTags) {
        displayHtml += "<br>" + escapeHTML(textWithoutTags).replace(/\n/g, "<br>");
      }
    } else {
      const finalText = removeDisclaimerBlocks(textWithoutThink);
      if (finalText.trim()) {
        displayHtml += escapeHTML(finalText).replace(/\n/g, "<br>");
      }
    }
    currentSystemMsgContent.html(displayHtml);
    throttledScrollToBottom();
  }
  function callback(replyPart) {
    accumulatedReply = replyPart;
    console.log("[DEBUG-UI] callback() \u88AB\u8C03\u7528, replyPart\u957F\u5EA6:", typeof replyPart === "string" ? replyPart.length : "N/A");
    const now = Date.now();
    if (now - lastUpdateTime >= UPDATE_INTERVAL) {
      lastUpdateTime = now;
      if (pendingUpdate) {
        clearTimeout(pendingUpdate);
        pendingUpdate = null;
      }
      doUpdate();
    } else if (!pendingUpdate) {
      pendingUpdate = setTimeout(() => {
        pendingUpdate = null;
        lastUpdateTime = Date.now();
        doUpdate();
      }, UPDATE_INTERVAL - (now - lastUpdateTime));
    }
  }
  function flush() {
    console.log("[DEBUG-UI] \u25B6 flush() \u5F00\u59CB");
    if (pendingUpdate) {
      clearTimeout(pendingUpdate);
      pendingUpdate = null;
    }
    if (!currentSystemMsgContent || !accumulatedReply) {
      console.warn("[DEBUG-UI] \u26A0 flush(): \u63D0\u524D\u8FD4\u56DE - currentSystemMsgContent:", !!currentSystemMsgContent, ", accumulatedReply:", !!accumulatedReply, ", accumulatedReply\u957F\u5EA6:", accumulatedReply?.length);
      return;
    }
    const inDOM = $.contains(document, currentSystemMsgContent[0]);
    console.log("[DEBUG-UI] flush(): currentSystemMsgContent \u5728DOM\u4E2D:", inDOM, ", accumulatedReply\u957F\u5EA6:", accumulatedReply.length);
    if (!inDOM) {
      console.error("[DEBUG-UI] \u274C flush(): currentSystemMsgContent \u5DF2\u8131\u79BB DOM\uFF01\u5C1D\u8BD5\u4FEE\u590D...");
      const fixed = reattachMessageElement();
      if (!fixed) {
        console.error("[DEBUG-UI] \u274C flush(): \u4FEE\u590D\u5931\u8D25\uFF0C\u8DF3\u8FC7\u672C\u6B21\u6E32\u67D3");
        return;
      }
      console.log("[DEBUG-UI] \u2705 flush(): DOM \u91CD\u65B0\u9644\u7740\u6210\u529F\uFF0C\u7EE7\u7EED\u6E32\u67D3");
    }
    let displayHtml = "";
    const thinkingResult = parseThinkingContent(accumulatedReply);
    if (thinkingResult.hasThinking) {
      thinkingResult.thinkingBlocks.forEach((block) => {
        displayHtml += renderThinkingPanel(block);
      });
    }
    let textWithoutThink = thinkingResult.cleanedText;
    const askChoiceResult = parseAndRenderAskChoice(textWithoutThink);
    textWithoutThink = askChoiceResult.cleanedText;
    const queryMatch = textWithoutThink.match(/<SystemQuery>([\s\S]*?)<\/SystemQuery>/gi);
    const updateMatch = textWithoutThink.match(/<UpdateSettings>([\s\S]*?)<\/UpdateSettings>/gi);
    if (queryMatch || updateMatch) {
      displayHtml += `<i><span style="color:var(--st-chatu8-text-secondary);">${getAssistantDisplayName()}\u8C03\u7528\u4E86\u5185\u90E8\u5DE5\u5177...</span></i>
`;
      let rawCode = "";
      if (queryMatch) rawCode += queryMatch.join("\n");
      if (updateMatch) rawCode += updateMatch.join("\n");
      displayHtml += `
                <details class="st-chatu8-ai-query-details">
                    <summary class="st-chatu8-ai-query-summary"><i class="fa-solid fa-microchip" style="margin-right:5px"></i> \u6267\u884C\u5185\u90E8\u547D\u4EE4</summary>
                    <pre class="st-chatu8-ai-query-content">${escapeHTML(rawCode)}</pre>
                </details>
            `;
      let textWithoutTags = textWithoutThink.replace(/<SystemQuery>[\s\S]*?<\/SystemQuery>/gi, "").replace(/<UpdateSettings>[\s\S]*?<\/UpdateSettings>/gi, "").trim();
      textWithoutTags = removeDisclaimerBlocks(textWithoutTags);
      if (textWithoutTags) {
        displayHtml += "<br>" + renderMarkdown(textWithoutTags);
      }
    } else {
      const finalText = removeDisclaimerBlocks(textWithoutThink);
      if (finalText.trim()) {
        displayHtml += renderMarkdown(finalText);
      }
    }
    if (askChoiceResult.choiceHtml) {
      displayHtml += askChoiceResult.choiceHtml;
    }
    currentSystemMsgContent.html(displayHtml);
    if (askChoiceResult.choiceHtml) {
      currentSystemMsgContent.find(".st-chatu8-ai-ask-choice-btn").on("click", function() {
        const choiceValue = $(this).attr("data-choice-value");
        if (!choiceValue) return;
        $(this).addClass("selected");
        $(this).closest(".st-chatu8-ai-ask-choice").addClass("answered");
        dom.inputArea.val(choiceValue);
        if (handleSendFn) handleSendFn();
      });
    }
    if (currentSystemMsgElement && currentSystemMsgElement.length) {
      scrollToMessageHead(currentSystemMsgElement, true);
    } else {
      throttledScrollToBottom();
    }
  }
  function getReply() {
    return removeDisclaimerBlocks(accumulatedReply);
  }
  return { callback, flush, getReply };
}

export { adjustInputHeight, appendMessage, appendSystemEmptyMessage, createThrottledUIUpdater2, dismissAskChoices, finalizeAssistantMessage, handleContinueFromMessage, handleEditMessage, showImageFullscreen, updateSendButtonState };
