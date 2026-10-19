// 还原自打包产物 — 原始模块: utils/iframe/autoLLMClick.js
import { extension_settings } from "../../../../../../extensions.js";
import { eventSource, event_types } from "../../../../../../../script.js";
import { getContext } from "../../../../../../st-context.js";
import { extensionName } from "../config.js";
import { debugBranch, debugContent, debugElement, debugLog, debugMilestone, debugStartSession, debugTimer } from "../debugLogger.js";
import { handlePromptRequest } from "../promptReq.js";
import { __set_generationStartChatLength, __set_generationStartSwipesLength, generationStartChatLength, generationStartSwipesLength, processedAutoLLMMessageIds } from "../ui.js";

function isPluginEnabled2() {
  const scriptEnabled = extension_settings[extensionName]?.scriptEnabled;
  const enabled = scriptEnabled === true || scriptEnabled === "true";
  debugLog("autoLLMClick.isPluginEnabled", "\u68C0\u67E5\u63D2\u4EF6\u662F\u5426\u542F\u7528", {
    scriptEnabled,
    \u7ED3\u679C: enabled
  });
  return enabled;
}

function isAutoLLMEnabled() {
  if (!isPluginEnabled2()) {
    debugBranch("autoLLMClick.isAutoLLMEnabled", "\u63D2\u4EF6\u672A\u542F\u7528", true, {
      \u6761\u4EF6: "isPluginEnabled()"
    });
    return false;
  }
  const autoLLMImageGen = extension_settings[extensionName]?.autoLLMImageGen;
  const enabled = autoLLMImageGen === true || autoLLMImageGen === "true";
  debugLog("autoLLMClick.isAutoLLMEnabled", "\u68C0\u67E5\u81EA\u52A8LLM\u751F\u56FE\u662F\u5426\u542F\u7528", {
    autoLLMImageGen,
    \u7ED3\u679C: enabled
  });
  return enabled;
}

async function findElement(messageId) {
  const timer = debugTimer("autoLLMClick.findElement", "\u67E5\u627E\u76EE\u6807\u5143\u7D20");
  const maxWaitMs = 1e3;
  const intervalMs = 50;
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    const realMesText = document.querySelector(`div.mes[mesid="${messageId}"] .mes_text`);
    if (realMesText) {
      console.log("[st-chatu8] Found real mes_text element for messageId:", messageId, "in", Date.now() - startTime, "ms");
      debugBranch("autoLLMClick.findElement", "\u627E\u5230\u771F\u5B9EDOM\u5143\u7D20", true, {
        messageId,
        \u8017\u65F6: Date.now() - startTime
      });
      debugElement("autoLLMClick.findElement", "\u771F\u5B9Emes_text\u5143\u7D20", realMesText);
      timer.end("\u627E\u5230\u771F\u5B9E\u5143\u7D20");
      return realMesText;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  console.log("[st-chatu8] Real mes_text not found for messageId:", messageId);
  debugBranch("autoLLMClick.findElement", "\u672A\u627E\u5230DOM\u5143\u7D20", false, {
    messageId
  });
  timer.end("\u672A\u627E\u5230\u5143\u7D20");
  return null;
}

eventSource.on(event_types.GENERATION_STARTED, (data) => {
  console.log("[st-chatu8] GENERATION_STARTED data:", data);
  debugStartSession("\u81EA\u52A8LLM\u56FE\u7247\u751F\u6210");
  debugLog("autoLLMClick.GENERATION_STARTED", "LLM\u751F\u6210\u5F00\u59CB\u4E8B\u4EF6\u89E6\u53D1", {
    eventData: data
  });
  const context = getContext();
  const chat4 = context?.chat;
  if (chat4 && chat4.length > 0) {
    __set_generationStartChatLength(chat4.length);
    const lastMessage = chat4[generationStartChatLength - 1];
    __set_generationStartSwipesLength(lastMessage?.swipes?.length || 0);
    processedAutoLLMMessageIds.delete(generationStartChatLength - 1);
    if (typeof data === "number" && !isNaN(data) && data > 0) {
      processedAutoLLMMessageIds.delete(data - 1);
    }
    console.log("[st-chatu8] Chat array length:", generationStartChatLength);
    console.log("[st-chatu8] Last message swipes length:", generationStartSwipesLength);
    debugLog("autoLLMClick.GENERATION_STARTED", "\u8BB0\u5F55\u751F\u6210\u5F00\u59CB\u65F6\u7684\u72B6\u6001\u5E76\u91CD\u7F6E\u5F53\u524D\u6D88\u606F\u9632\u91CD\u6807\u8BB0", {
      chatLength: generationStartChatLength,
      swipesLength: generationStartSwipesLength
    });
  } else {
    __set_generationStartChatLength(0);
    __set_generationStartSwipesLength(0);
    console.log("[st-chatu8] Chat array is empty or not available");
    debugBranch("autoLLMClick.GENERATION_STARTED", "Chat\u4E3A\u7A7A", true, {
      chatExists: !!chat4,
      chatLength: chat4?.length
    });
  }
});

eventSource.on(event_types.GENERATION_ENDED, async (data) => {
  const timer = debugTimer("autoLLMClick.GENERATION_ENDED", "\u5904\u7406LLM\u751F\u6210\u7ED3\u675F\u4E8B\u4EF6");
  console.log("[st-chatu8] GENERATION_ENDED data:", data);
  console.log("[st-chatu8] Start chat length:", generationStartChatLength, "Start swipes length:", generationStartSwipesLength);
  debugLog("autoLLMClick.GENERATION_ENDED", "LLM\u751F\u6210\u7ED3\u675F\u4E8B\u4EF6\u89E6\u53D1", {
    eventData: data,
    startChatLength: generationStartChatLength,
    startSwipesLength: generationStartSwipesLength
  });
  const context = getContext();
  const chat4 = context?.chat;
  const currentChatLength = chat4?.length || 0;
  const currentLastMessage = chat4 && chat4.length > 0 ? chat4[chat4.length - 1] : null;
  const currentSwipesLength = currentLastMessage?.swipes?.length || 0;
  console.log("[st-chatu8] Current chat length:", currentChatLength, "Current swipes length:", currentSwipesLength);
  debugLog("autoLLMClick.GENERATION_ENDED", "\u83B7\u53D6\u5F53\u524D\u72B6\u6001", {
    currentChatLength,
    currentSwipesLength
  });
  const isChatIncreased = currentChatLength > generationStartChatLength;
  const isSwipesIncreased = !isChatIncreased && currentSwipesLength > generationStartSwipesLength;
  console.log("[st-chatu8] Chat increased:", isChatIncreased, "Swipes increased:", isSwipesIncreased);
  debugBranch("autoLLMClick.GENERATION_ENDED", "Chat\u6216Swipes\u53D8\u5316\u68C0\u6D4B", isChatIncreased || isSwipesIncreased, {
    isChatIncreased,
    isSwipesIncreased,
    chatDelta: currentChatLength - generationStartChatLength,
    swipesDelta: currentSwipesLength - generationStartSwipesLength
  });
  if (!isChatIncreased && !isSwipesIncreased) {
    console.log("[st-chatu8] No chat or swipes increase detected, skipping");
    debugLog("autoLLMClick.GENERATION_ENDED", "\u65E0\u53D8\u5316 - \u8DF3\u8FC7\u5904\u7406", {
      \u539F\u56E0: "Chat\u548CSwipes\u5747\u672A\u589E\u52A0"
    });
    timer.end("\u8DF3\u8FC7 - \u65E0\u53D8\u5316");
    return;
  }
  if (!isAutoLLMEnabled()) {
    console.log("[st-chatu8] autoLLMImageGen is disabled, skipping");
    debugBranch("autoLLMClick.GENERATION_ENDED", "\u81EA\u52A8LLM\u751F\u56FE\u672A\u542F\u7528", true, {
      \u6761\u4EF6: "isAutoLLMEnabled()"
    });
    timer.end("\u8DF3\u8FC7 - \u529F\u80FD\u672A\u542F\u7528");
    return;
  }
  let messageId = -1;
  if (typeof data === "number" && !isNaN(data) && data > 0) {
    messageId = data - 1;
  } else if (chat4 && chat4.length > 0) {
    messageId = chat4.length - 1;
  }
  debugLog("autoLLMClick.GENERATION_ENDED", "\u8BA1\u7B97\u6D88\u606FID", {
    eventData: data,
    messageId
  });
  if (messageId >= 0) {
    if (processedAutoLLMMessageIds.has(messageId)) {
      console.log("[st-chatu8] Message ID already processed for autoLLM:", messageId, "- skipping");
      timer.end("\u8DF3\u8FC7 - \u8BE5\u6D88\u606F\u5DF2\u89E6\u53D1\u8FC7\u81EA\u52A8LLM\u751F\u56FE");
      return;
    }
    if (chat4 && chat4[messageId]) {
      const messageContent = chat4[messageId].mes;
      console.log("[st-chatu8] Message ID:", messageId);
      console.log("[st-chatu8] Message content:", messageContent);
      debugContent("autoLLMClick.GENERATION_ENDED", "\u6D88\u606F\u5185\u5BB9", messageContent, 300);
      if (!messageContent || messageContent.length <= 500) {
        console.log("[st-chatu8] Message content too short (<=500), skipping. Length:", messageContent?.length || 0);
        debugBranch("autoLLMClick.GENERATION_ENDED", "\u6D88\u606F\u957F\u5EA6\u68C0\u67E5", false, {
          \u6761\u4EF6: "messageContent.length > 500",
          \u5B9E\u9645\u957F\u5EA6: messageContent?.length || 0,
          \u8981\u6C42: "> 500"
        });
        timer.end("\u8DF3\u8FC7 - \u6D88\u606F\u8FC7\u77ED");
        return;
      }
      debugBranch("autoLLMClick.GENERATION_ENDED", "\u6D88\u606F\u957F\u5EA6\u68C0\u67E5\u901A\u8FC7", true, {
        \u6D88\u606F\u957F\u5EA6: messageContent.length
      });
      if (extension_settings[extensionName]?.insertOriginalText !== "true") {
        extension_settings[extensionName].insertOriginalText = "true";
        console.log("[st-chatu8] Auto-enabled insertOriginalText due to message length > 500");
        debugLog("autoLLMClick.GENERATION_ENDED", "\u81EA\u52A8\u542F\u7528 insertOriginalText", {
          \u539F\u56E0: "\u6D88\u606F\u957F\u5EA6 > 500"
        });
        const insertTextSwitch = document.getElementById("insertOriginalText");
        if (insertTextSwitch) {
          insertTextSwitch.checked = true;
        }
        try {
          const { saveSettingsDebounced: saveSettingsDebounced73 } = await import("../../../../../../../script.js");
          saveSettingsDebounced73();
        } catch (e) {
          console.warn("[st-chatu8] Failed to save settings:", e);
        }
      }
      const el = await findElement(messageId);
      if (!el) {
        console.log("[st-chatu8] Element not found for messageId:", messageId, "- skipping");
        debugBranch("autoLLMClick.GENERATION_ENDED", "\u5143\u7D20\u67E5\u627E\u5931\u8D25", false, {
          messageId,
          \u539F\u56E0: "DOM\u5143\u7D20\u672A\u627E\u5230"
        });
        return;
      }
      console.log("[st-chatu8] Got element for messageId:", messageId, "isConnected:", el.isConnected);
      debugElement("autoLLMClick.GENERATION_ENDED", "\u76EE\u6807\u5143\u7D20", el);
      processedAutoLLMMessageIds.add(messageId);
      try {
        console.log("[st-chatu8] Triggering handlePromptRequest with gesture1 for messageId:", messageId);
        debugMilestone("autoLLMClick.GENERATION_ENDED", "\u5F00\u59CB\u89E6\u53D1 handlePromptRequest");
        debugLog("autoLLMClick.GENERATION_ENDED", "\u8C03\u7528 handlePromptRequest (\u81EA\u52A8\u89E6\u53D1\u6A21\u5F0F)", {
          gestureId: "gesture1",
          messageId,
          elementConnected: el.isConnected,
          source: "auto"
        });
        handlePromptRequest(el, "gesture1", { source: "auto", isAuto: true, skipDemandPopup: true });
      } catch (error) {
        console.error("[st-chatu8] handlePromptRequest failed:", error);
        debugLog("autoLLMClick.GENERATION_ENDED", "handlePromptRequest \u8C03\u7528\u5931\u8D25", {
          error: error.message
        });
      }
    } else {
      console.log("[st-chatu8] No message found for ID:", messageId);
      debugBranch("autoLLMClick.GENERATION_ENDED", "\u6D88\u606F\u67E5\u627E", false, {
        messageId,
        chatExists: !!chat4,
        \u539F\u56E0: "\u6D88\u606F\u4E0D\u5B58\u5728"
      });
    }
  } else {
    debugBranch("autoLLMClick.GENERATION_ENDED", "messageId\u6709\u6548\u6027\u68C0\u67E5", false, {
      messageId,
      \u539F\u56E0: "messageId < 0"
    });
  }
  timer.end("\u5904\u7406\u5B8C\u6210");
});

eventSource.on(event_types.CHAT_CHANGED, () => {
  processedAutoLLMMessageIds.clear();
});

function initAutoLLMClick() {
  console.log("[st-chatu8] autoLLMClick module initialized");
  debugLog("autoLLMClick.initAutoLLMClick", "autoLLMClick \u6A21\u5757\u5DF2\u521D\u59CB\u5316");
}

export { initAutoLLMClick };
