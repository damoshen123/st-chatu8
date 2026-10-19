// 还原自打包产物 — 原始模块: utils/aiAssistant.js
import { saveChatImage } from "./configDatabase.js";
import { activeChat, dom, initDomRefs, refreshSettingsPanelFn } from "./assistant/assistantContext.js";
import { bindFloorIndicatorClick, initFloorMessageEvents } from "./assistant/assistantFloorMessage.js";
import { initAvatarUpdateListener, updateDialogTitle } from "./assistant/assistantAvatar.js";
import { refreshAllKnowledgeBaseCaches } from "./knowledgeBaseService.js";
import { escapeHTML, loadMarked } from "./assistant/assistantUtils.js";
import { setupTTSEventListeners } from "./assistant/assistantTTS.js";
import { initScrollListener, initScrollToBottomButton } from "./assistant/assistantScrollManager.js";
import { initImageEvents } from "./assistant/assistantImage.js";
import { initSessionEvents, switchChat, syncAndSave } from "./assistant/assistantSession.js";
import { appendMessage, handleContinueFromMessage, handleEditMessage, showImageFullscreen } from "./assistant/assistantMessage.js";
import { initSummaryEvents } from "./assistant/assistantSummary.js";
import { initDialogEvents } from "./assistant/assistantDialog.js";
import { handleRegenerateMessage, handleSend, initInputEvents } from "./assistant/assistantLLM.js";
import { bindIndicatorClickEvents, initScreenCaptureEvents } from "./assistant/assistantScreenCapture.js";

var aiAssistantInitialized;

aiAssistantInitialized = false;

function refreshAiAssistantSettings() {
  if (refreshSettingsPanelFn) {
    refreshSettingsPanelFn();
  }
}

function initAiAssistant(modal) {
  if (aiAssistantInitialized) {
    console.warn("[AI Assistant] \u5DF2\u521D\u59CB\u5316\u8FC7\uFF0C\u8DF3\u8FC7\u91CD\u590D\u521D\u59CB\u5316");
    return;
  }
  aiAssistantInitialized = true;
  console.log("[AI Assistant] \u5F00\u59CB\u521D\u59CB\u5316...");
  loadMarked().catch(() => {
    console.warn("[AI Assistant] Markdown \u6E32\u67D3\u4E0D\u53EF\u7528\uFF0C\u5C06\u4F7F\u7528\u7EAF\u6587\u672C\u6A21\u5F0F");
  });
  refreshAllKnowledgeBaseCaches().catch((err) => {
    console.warn("[AI Assistant] \u5237\u65B0\u8D44\u6599\u5E93\u7F13\u5B58\u5931\u8D25:", err);
  });
  const dialog = $("#st-chatu8-ai-dialog");
  initDomRefs(dialog);
  setupTTSEventListeners();
  window.addEventListener("ai-show-generated-image", async (event) => {
    console.log("[AI Assistant] \u6536\u5230\u663E\u793A\u56FE\u7247\u4E8B\u4EF6:", event.detail);
    const { imageUrl, prompt: prompt2 } = event.detail;
    if (!imageUrl) {
      console.warn("[AI Assistant] \u56FE\u7247URL\u4E3A\u7A7A");
      return;
    }
    const chatBody = dom.chatBody;
    const icon = '<img src="/scripts/extensions/third-party/st-chatu8/html/settings/\u667A\u7ED8\u59EC\u5934\u50CF.png" alt="\u667A\u7ED8\u59EC" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%; image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges;">';
    const messageHtml = `
            <div class="st-chatu8-ai-msg system-msg">
                <div class="msg-avatar">${icon}</div>
                <div class="msg-content">
                    <div class="st-chatu8-ai-generated-image" style="margin-top: 10px;">
                        <img src="${imageUrl}" alt="AI\u751F\u6210\u7684\u56FE\u7247" style="max-width: 100%; border-radius: 8px; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
                        <div style="margin-top: 5px; font-size: 12px; color: #666;">\u63D0\u793A\u8BCD: ${escapeHTML(prompt2)}</div>
                    </div>
                </div>
            </div>
        `;
    const $elem = $(messageHtml);
    $elem.find("img").on("click", function() {
      showImageFullscreen(imageUrl);
    });
    chatBody.append($elem);
    chatBody.scrollTop(chatBody[0].scrollHeight);
    console.log("[AI Assistant] \u5DF2\u6DFB\u52A0\u56FE\u7247\u6D88\u606F\u5230\u804A\u5929");
    if (activeChat) {
      try {
        const mimeMatch = imageUrl.match(/^data:(image\/[^;]+);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
        const imageId = await saveChatImage(imageUrl, {
          mimeType,
          name: `generated_${Date.now()}`,
          chatId: activeChat.id
        });
        const imageMessage = {
          role: "assistant",
          content: `[\u56FE\u7247\u751F\u6210]
\u63D0\u793A\u8BCD: ${prompt2}`,
          imageRefs: [imageId]
        };
        activeChat.messages.push(imageMessage);
        activeChat.updatedAt = Date.now();
        await syncAndSave();
        console.log("[AI Assistant] \u56FE\u7247\u6D88\u606F\u5DF2\u4FDD\u5B58\u5230\u5386\u53F2\u8BB0\u5F55\uFF08V2 imageRefs \u683C\u5F0F\uFF09, imageId:", imageId);
      } catch (err) {
        console.error("[AI Assistant] \u4FDD\u5B58\u56FE\u7247\u6D88\u606F\u5931\u8D25:", err);
        try {
          const fallbackMessage = {
            role: "assistant",
            content: `[\u56FE\u7247\u751F\u6210]
\u63D0\u793A\u8BCD: ${prompt2}
\uFF08\u56FE\u7247\u4FDD\u5B58\u5931\u8D25\uFF09`
          };
          activeChat.messages.push(fallbackMessage);
          activeChat.updatedAt = Date.now();
          await syncAndSave();
        } catch (fallbackErr) {
          console.error("[AI Assistant] \u964D\u7EA7\u4FDD\u5B58\u4E5F\u5931\u8D25:", fallbackErr);
        }
      }
    }
  });
  const boundAppendMessage = (role, text, images = null, messageIndex = null, skipScroll = false) => {
    return appendMessage(role, text, images, messageIndex, skipScroll, {
      handleEditMessage: (idx) => handleEditMessage(idx),
      handleContinueFromMessage: (idx) => handleContinueFromMessage(idx, boundSwitchChat),
      handleRegenerateMessage: (idx) => boundHandleRegenerate(idx),
      handleSend: () => boundHandleSend()
    });
  };
  const boundSwitchChat = (chatId) => {
    switchChat(chatId, boundAppendMessage);
  };
  const boundHandleSend = () => {
    handleSend(boundHandleSend, boundHandleRegenerate, boundAppendMessage, boundSwitchChat);
  };
  const boundHandleRegenerate = (messageIndex) => {
    handleRegenerateMessage(messageIndex, boundHandleSend, boundHandleRegenerate, boundAppendMessage, boundSwitchChat);
  };
  initDialogEvents();
  initSessionEvents(boundAppendMessage);
  initImageEvents();
  initScreenCaptureEvents();
  bindIndicatorClickEvents();
  initFloorMessageEvents();
  bindFloorIndicatorClick();
  initSummaryEvents();
  initInputEvents(boundHandleSend);
  initAvatarUpdateListener(dom.chatBody);
  updateDialogTitle();
  initScrollListener(boundAppendMessage);
  initScrollToBottomButton();
  console.log("[AI Assistant] \u521D\u59CB\u5316\u5B8C\u6210");
}

export { initAiAssistant, refreshAiAssistantSettings };
