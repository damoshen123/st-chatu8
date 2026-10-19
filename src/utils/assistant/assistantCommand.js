// 还原自打包产物 — 原始模块: utils/assistant/assistantCommand.js
import { extension_settings } from "../../../../../../extensions.js";
import { extensionName } from "../config.js";
import { activeChat, currentSystemMsgContent, dom, pendingCommand, setCurrentSystemMsgContent, setCurrentSystemMsgElement, setPendingCommand } from "./assistantContext.js";
import { parseAndApplySettings, parseQuerySettings } from "../aiSettingsBridge.js";
import { appendSystemEmptyMessage } from "./assistantMessage.js";
import { assistantLLM_exports } from "./assistantSummary.js";
import "./assistantUtils.js"; // init_assistantUtils
import "./assistantSession.js"; // init_assistantSession

function getAutoExecuteMode() {
  const aiConfig = extension_settings[extensionName]?.chatu8_ai_assistant || {};
  return aiConfig.auto_execute_commands === true;
}

function createPendingCommand(messageElement, commandContent) {
  return {
    messageElement,
    commandContent,
    buttonElement: null,
    timestamp: Date.now()
  };
}

function clearPendingCommand() {
  if (pendingCommand && pendingCommand.buttonElement) {
    pendingCommand.buttonElement.fadeOut(200, function() {
      $(this).remove();
    });
  }
  setPendingCommand(null);
}

function renderExecuteButton(messageElement) {
  const button = $(`
        <div class="st-chatu8-ai-execute-command-btn">
            <button class="st-chatu8-ai-btn st-chatu8-ai-execute-btn">
                <i class="fa-solid fa-play"></i> \u6267\u884C\u547D\u4EE4
            </button>
            <span class="st-chatu8-ai-execute-hint">
                \u6216\u53D1\u9001\u65B0\u6D88\u606F\u53D6\u6D88
            </span>
        </div>
    `);
  messageElement.after(button);
  dom.chatBody.scrollTop(dom.chatBody[0].scrollHeight);
  return button;
}

async function parseQueryWithProgress(accumulatedReply) {
  const hasImageGeneration = accumulatedReply.includes('"type": "generate_image"') || accumulatedReply.includes('"type":"generate_image"');
  if (hasImageGeneration && currentSystemMsgContent) {
    const loadingHtml = `
            <div class="st-chatu8-ai-image-generating" style="margin-top: 10px; padding: 10px; background: rgba(100, 150, 255, 0.1); border-left: 3px solid #6496ff; border-radius: 4px;">
                <i class="fa-solid fa-spinner fa-spin"></i> \u6B63\u5728\u751F\u6210\u56FE\u7247\uFF0C\u8BF7\u7A0D\u5019...
            </div>
        `;
    currentSystemMsgContent.append(loadingHtml);
    dom.chatBody.scrollTop(dom.chatBody[0].scrollHeight);
  }
  try {
    const queryResult = await parseQuerySettings(accumulatedReply);
    return queryResult;
  } finally {
    if (hasImageGeneration && currentSystemMsgContent) {
      currentSystemMsgContent.find(".st-chatu8-ai-image-generating").remove();
    }
  }
}

async function executePendingCommand(command, boundAppendMessage, handleRegenerateFn) {
  const { commandContent, buttonElement } = command;
  if (!buttonElement) return;
  const btn = buttonElement.find("button");
  btn.prop("disabled", true).removeClass("success error").addClass("loading").html('<i class="fa-solid fa-spinner fa-spin"></i> \u6267\u884C\u4E2D...');
  try {
    parseAndApplySettings(commandContent);
    const queryResult = await parseQueryWithProgress(commandContent);
    btn.removeClass("loading").addClass("success").html('<i class="fa-solid fa-check"></i> \u5DF2\u6267\u884C');
    if (queryResult !== null) {
      if (!activeChat) {
        toastr?.error("\u5F53\u524D\u6CA1\u6709\u6D3B\u52A8\u7684\u5BF9\u8BDD\u4F1A\u8BDD");
        return;
      }
      activeChat.messages.push({ role: "user", content: queryResult });
      const userMsgIndex = activeChat.messages.length - 1;
      await boundAppendMessage("user", queryResult, null, userMsgIndex);
      setCurrentSystemMsgElement(null);
      setCurrentSystemMsgContent(null);
      await appendSystemEmptyMessage();
      if (currentSystemMsgContent) {
        currentSystemMsgContent.html('<i><span style="color:var(--st-chatu8-text-secondary);">\u5DF2\u83B7\u53D6\u6700\u65B0\u7CFB\u7EDF\u53C2\u6570\uFF0C\u601D\u8003\u4E2D...</span></i>');
      }
      setPendingCommand(null);
      const { generateAiResponse: generateAiResponse2 } = await import("./assistantLLM.js");
      await generateAiResponse2(null, handleRegenerateFn, boundAppendMessage);
      return;
    }
    setTimeout(() => {
      buttonElement.fadeOut(300, () => buttonElement.remove());
    }, 2e3);
    setPendingCommand(null);
  } catch (error) {
    console.error("[AI Command Execution] \u547D\u4EE4\u6267\u884C\u5931\u8D25:", error);
    btn.removeClass("loading").addClass("error").prop("disabled", false).html('<i class="fa-solid fa-times"></i> \u6267\u884C\u5931\u8D25');
    toastr?.error(`\u547D\u4EE4\u6267\u884C\u5931\u8D25: ${error.message}`);
    clearPendingCommand();
  }
}

export { clearPendingCommand, createPendingCommand, executePendingCommand, getAutoExecuteMode, renderExecuteButton };
