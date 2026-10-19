// 还原自打包产物 — 原始模块: utils/assistant/assistantFloorMessage.js
import { extension_settings } from "../../../../../../extensions.js";
import { getContext } from "../../../../../../st-context.js";
import { eventSource } from "../../../../../../script.js";
import { eventNames, extensionName } from "../config.js";
import { isMobileDevice } from "../utils.js";
import { getWorldEntrySelectionKey } from "../worldEntrySelection.js";
import { worldbookProcessor_exports } from "../videoAssetsService.js";
import { dom } from "./assistantContext.js";

var floorCollectionMode, floorContainerElement, floorTargetElement, manualCollectedMessages, send_data_exports;

floorTargetElement = null;

floorCollectionMode = null;

floorContainerElement = null;

manualCollectedMessages = [];


function setFloorTargetElement(element) {
  if (!element) {
    console.warn("[FloorMessage] \u76EE\u6807\u5143\u7D20\u4E3A\u7A7A");
    return { success: false, message: "\u76EE\u6807\u5143\u7D20\u4E3A\u7A7A", isDuplicate: false };
  }
  floorTargetElement = element;
  const mesContainer = element.closest(".mes[mesid]");
  if (mesContainer) {
    floorCollectionMode = "auto";
    floorContainerElement = mesContainer;
    console.log("[FloorMessage] \u81EA\u52A8\u6A21\u5F0F\uFF1A\u68C0\u6D4B\u5230 mes \u5BB9\u5668, mesid =", mesContainer.getAttribute("mesid"));
    updateFloorStatusIndicator(true);
    updateFloorIndicator(true);
    return { success: true, message: "\u5DF2\u6536\u96C6\u697C\u5C42\u4FE1\u606F\uFF08\u81EA\u52A8\u6A21\u5F0F\uFF09", isDuplicate: false };
  } else {
    floorCollectionMode = "manual";
    floorContainerElement = null;
    const rawText = element.innerText || "";
    const cleanedText = cleanFloorText2(rawText);
    if (!cleanedText) {
      console.warn("[FloorMessage] \u624B\u52A8\u6A21\u5F0F\uFF1A\u5143\u7D20\u6587\u672C\u4E3A\u7A7A");
      return { success: false, message: "\u5143\u7D20\u6587\u672C\u4E3A\u7A7A\uFF0C\u65E0\u6CD5\u6536\u96C6", isDuplicate: false };
    }
    let mesId = "0";
    let charName = "\u624B\u52A8\u6536\u96C6";
    const mesParent = element.closest(".mes[mesid]");
    if (mesParent) {
      mesId = mesParent.getAttribute("mesid") || "0";
      charName = mesParent.getAttribute("ch_name") || mesParent.querySelector(".name_text")?.textContent?.trim() || "\u624B\u52A8\u6536\u96C6";
    }
    const isDuplicate = manualCollectedMessages.some((msg) => msg.text === cleanedText);
    if (isDuplicate) {
      console.log("[FloorMessage] \u624B\u52A8\u6A21\u5F0F\uFF1A\u5185\u5BB9\u5DF2\u5B58\u5728\uFF0C\u8DF3\u8FC7\u91CD\u590D\u6536\u96C6");
      return { success: false, message: "\u8BE5\u5185\u5BB9\u5DF2\u6536\u96C6\u8FC7\uFF0C\u672A\u91CD\u590D\u6DFB\u52A0", isDuplicate: true };
    }
    manualCollectedMessages.push({
      mesId,
      charName,
      text: cleanedText,
      timestamp: Date.now()
    });
    const settings3 = extension_settings[extensionName]?.chatu8_ai_assistant;
    const maxCount = settings3?.floor_count || 1;
    if (manualCollectedMessages.length > maxCount) {
      const removed = manualCollectedMessages.splice(0, manualCollectedMessages.length - maxCount);
      console.log("[FloorMessage] \u624B\u52A8\u6A21\u5F0F\uFF1A\u8D85\u8FC7\u6570\u91CF\u9650\u5236\uFF0C\u5DF2\u6DD8\u6C70", removed.length, "\u6761\u65E7\u6D88\u606F");
    }
    console.log("[FloorMessage] \u624B\u52A8\u6A21\u5F0F\uFF1A\u5DF2\u6DFB\u52A0\u6D88\u606F", {
      mesId,
      charName,
      textLength: cleanedText.length,
      totalCount: manualCollectedMessages.length,
      maxCount
    });
    updateFloorStatusIndicator(true);
    updateFloorIndicator(true);
    return {
      success: true,
      message: `\u5DF2\u6536\u96C6\u697C\u5C42\u4FE1\u606F\uFF08\u624B\u52A8\u6A21\u5F0F\uFF0C\u5171 ${manualCollectedMessages.length}/${maxCount} \u6761\uFF09`,
      isDuplicate: false
    };
  }
}

function isFloorElementCollected() {
  return floorTargetElement !== null;
}

function clearFloorTargetElement() {
  floorTargetElement = null;
  floorCollectionMode = null;
  floorContainerElement = null;
  manualCollectedMessages = [];
  updateFloorStatusIndicator(false);
  updateFloorIndicator(false);
  console.log("[FloorMessage] \u5DF2\u6E05\u9664\u697C\u5C42\u4FE1\u606F\u6536\u96C6");
}

function cleanFloorText2(text) {
  if (!text) return "";
  let cleaned = text;
  cleaned = cleaned.replace(/\[st-chatu8-image[^\]]*\]/g, "");
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
  cleaned = cleaned.trim();
  return cleaned;
}

async function collectFloorMessagesFromContext(count) {
  const messages = [];
  if (!floorTargetElement) return messages;
  if (floorCollectionMode === "auto") {
    const chatContainer = document.getElementById("chat");
    if (!chatContainer) return messages;
    const context = getContext();
    const allMesElements = chatContainer.querySelectorAll(".mes[mesid]");
    const totalMessages = allMesElements.length;
    const startIndex = Math.max(0, totalMessages - count);
    for (let i = startIndex; i < totalMessages; i++) {
      const mesEl = allMesElements[i];
      const mesId = mesEl.getAttribute("mesid") || "?";
      const mesIdNum = parseInt(mesId, 10);
      const charName = mesEl.getAttribute("ch_name") || mesEl.querySelector(".name_text")?.textContent?.trim() || "\u672A\u77E5";
      const rawText = context.chat?.[mesIdNum]?.mes || "";
      const processedText = await processTextThroughRegex2(rawText);
      const cleanedText = cleanFloorText2(processedText);
      if (cleanedText) {
        messages.push({ mesId, charName, text: cleanedText });
      }
    }
  } else if (floorCollectionMode === "manual") {
    return [...manualCollectedMessages];
  }
  return messages;
}

function processTextThroughRegex2(text) {
  return new Promise((resolve) => {
    if (!text) {
      resolve("");
      return;
    }
    const requestId = `floorMsg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const timeoutId = setTimeout(() => {
      eventSource.removeListener(eventNames.REGEX_RESULT_MESSAGE, listener);
      console.warn("[FloorMessage] \u6B63\u5219\u5904\u7406\u8D85\u65F6\uFF0C\u4F7F\u7528\u539F\u59CB\u6587\u672C");
      resolve(text);
    }, 5e3);
    const listener = (data) => {
      if (data.id === requestId) {
        clearTimeout(timeoutId);
        eventSource.removeListener(eventNames.REGEX_RESULT_MESSAGE, listener);
        resolve(data.message);
      }
    };
    eventSource.on(eventNames.REGEX_RESULT_MESSAGE, listener);
    eventSource.emit(eventNames.REGEX_TEST_MESSAGE, { message: text, id: requestId });
  });
}

async function buildFloorContext() {
  const settings3 = extension_settings[extensionName]?.chatu8_ai_assistant;
  if (!settings3?.floor_message_enabled) {
    return "";
  }
  if (!isFloorElementCollected()) {
    return "";
  }
  const count = settings3.floor_count || 1;
  const messages = await collectFloorMessagesFromContext(count);
  if (messages.length === 0) {
    return "";
  }
  const header = `[\u6700\u8FD1 ${messages.length} \u6761\u9152\u9986\u697C\u5C42\u6D88\u606F]`;
  const body = messages.map(
    (msg) => `#${msg.mesId} ${msg.charName}:
${msg.text}`
  ).join("\n\n");
  return `${header}
${body}`;
}

function updateFloorStatusIndicator(collected) {
  if (dom.floorStatus) {
    if (collected) {
      dom.floorStatus.css("background-color", "#4CAF50");
      dom.floorStatus.attr("title", "\u5DF2\u6536\u96C6\u697C\u5C42\u5143\u7D20\uFF08\u6A21\u5F0F: " + (floorCollectionMode || "\u672A\u77E5") + "\uFF09");
    } else {
      dom.floorStatus.css("background-color", "#999");
      dom.floorStatus.attr("title", "\u672A\u6536\u96C6\u697C\u5C42\u5143\u7D20");
    }
  }
}

function updateFloorIndicator(show) {
  if (dom.floorIndicator) {
    dom.floorIndicator.toggle(!!show);
  }
}

async function showFloorInfoPanel() {
  if (!isFloorElementCollected()) {
    console.warn("[FloorMessage] \u672A\u6536\u96C6\u697C\u5C42\u4FE1\u606F");
    return;
  }
  const settings3 = extension_settings[extensionName]?.chatu8_ai_assistant;
  const count = settings3?.floor_count || 1;
  const messages = await collectFloorMessagesFromContext(count);
  if (messages.length === 0) {
    console.warn("[FloorMessage] \u672A\u6536\u96C6\u5230\u6709\u6548\u697C\u5C42\u6D88\u606F");
    return;
  }
  let worldBookHtml = "";
  try {
    const { processWorldBooksWithTriggerStructured: processWorldBooksWithTriggerStructured2 } = await import("../worldbookProcessor.js");
    const rawMessages = await collectFloorMessagesFromContext(count);
    const triggerLines = rawMessages.map((msg) => `#${msg.mesId} ${msg.charName}:
${msg.text}`);
    console.log("[FloorMessage] \u4E16\u754C\u4E66\u89E6\u53D1\uFF1A\u4F7F\u7528\u539F\u59CB\u804A\u5929\u6570\u636E\uFF0C\u5171", rawMessages.length, "\u6761");
    const worldBooksData = await processWorldBooksWithTriggerStructured2(triggerLines);
    if (worldBooksData && worldBooksData.length > 0) {
      const stCtx = getContext();
      const username = stCtx?.name1 || "";
      let worldBooksHtml = "";
      worldBooksData.forEach((worldBook, worldIndex) => {
        const worldId = `world-${worldIndex}`;
        const worldName = worldBook.worldName || "\u672A\u547D\u540D\u4E16\u754C\u4E66";
        const entries = worldBook.entries || [];
        if (entries.length === 0) return;
        let entriesHtml = "";
        entries.forEach((entry, entryIndex) => {
          const entryId = `${worldId}-entry-${entryIndex}`;
          const entryName = entry.comment || "\u672A\u547D\u540D\u6761\u76EE";
          let entryContent = entry.content || "";
          entryContent = entryContent.replaceAll("{{user}}", username);
          entryContent = entryContent.replaceAll("<user>", username);
          const previewLength = 150;
          const entryPreview = entryContent.substring(0, previewLength);
          const hasMore = entryContent.length > previewLength;
          entriesHtml += `
                        <div class="wb-entry-item" data-world-name="${worldName}" data-entry-uid="${encodeURIComponent(getWorldEntrySelectionKey(entry) ?? "")}" style="
                            margin-bottom: 8px;
                            padding: 8px 10px;
                            background: rgba(66, 165, 245, 0.05);
                            border-left: 2px solid rgba(66, 165, 245, 0.3);
                            border-radius: 4px;
                        ">
                            <div style="
                                font-weight: bold;
                                color: #64b5f6;
                                font-size: 12px;
                                margin-bottom: 6px;
                                display: flex;
                                align-items: center;
                                justify-content: space-between;
                                gap: 6px;
                            ">
                                <div style="display: flex; align-items: center; gap: 6px; flex: 1;">
                                    <i class="fa-solid fa-bookmark" style="font-size: 10px;"></i>
                                    <span>${entryName}</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 4px;">
                                    <button class="wb-entry-disable-btn" data-world-name="${worldName}" data-entry-uid="${encodeURIComponent(getWorldEntrySelectionKey(entry) ?? "")}" style="
                                        padding: 2px 8px;
                                        background: rgba(255, 152, 0, 0.15);
                                        border: 1px solid rgba(255, 152, 0, 0.3);
                                        border-radius: 3px;
                                        color: #ff9800;
                                        cursor: pointer;
                                        font-size: 10px;
                                        transition: all 0.2s;
                                    " title="\u7981\u7528\u6B64\u6761\u76EE\uFF08\u5F71\u54CD\u53D1\u9001\u6570\u636E\u8BBE\u7F6E\uFF09">
                                        <i class="fa-solid fa-ban"></i> \u7981\u7528
                                    </button>
                                    ${hasMore ? `
                                    <button class="wb-entry-toggle-top" data-entry-id="${entryId}" style="
                                        padding: 2px 8px;
                                        background: rgba(66, 165, 245, 0.15);
                                        border: 1px solid rgba(66, 165, 245, 0.3);
                                        border-radius: 3px;
                                        color: #42a5f5;
                                        cursor: pointer;
                                        font-size: 10px;
                                        transition: all 0.2s;
                                        display: none;
                                    ">
                                        <i class="fa-solid fa-chevron-up"></i> \u6536\u8D77
                                    </button>
                                    ` : ""}
                                </div>
                            </div>
                            <div class="wb-entry-preview" style="
                                white-space: pre-wrap;
                                line-height: 1.5;
                                font-size: 13px;
                                color: #ddd;
                                ${hasMore ? "cursor: pointer;" : ""}
                            " data-entry-id="${entryId}">
                                ${hasMore ? entryPreview + "..." : entryContent}
                            </div>
                            <div class="wb-entry-full" id="${entryId}-full" style="
                                white-space: pre-wrap;
                                line-height: 1.5;
                                font-size: 13px;
                                color: #ddd;
                                display: none;
                            ">
                                ${entryContent}
                            </div>
                            ${hasMore ? `
                            <button class="wb-entry-toggle" data-entry-id="${entryId}" style="
                                margin-top: 6px;
                                padding: 3px 10px;
                                background: rgba(66, 165, 245, 0.15);
                                border: 1px solid rgba(66, 165, 245, 0.3);
                                border-radius: 3px;
                                color: #42a5f5;
                                cursor: pointer;
                                font-size: 11px;
                                transition: all 0.2s;
                            ">
                                <i class="fa-solid fa-chevron-down"></i> \u5C55\u5F00\u6761\u76EE
                            </button>
                            ` : ""}
                        </div>
                    `;
        });
        worldBooksHtml += `
                    <div class="wb-world-item" style="
                        margin-bottom: 12px;
                        border: 1px solid rgba(66, 165, 245, 0.2);
                        border-radius: 6px;
                        overflow: hidden;
                        background: rgba(66, 165, 245, 0.03);
                    ">
                        <div class="wb-world-header" data-world-id="${worldId}" style="
                            padding: 10px 12px;
                            background: rgba(66, 165, 245, 0.1);
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            user-select: none;
                            transition: background 0.2s;
                        ">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i class="fa-solid fa-chevron-right wb-world-icon" style="
                                    color: #42a5f5;
                                    font-size: 12px;
                                    transition: transform 0.2s;
                                "></i>
                                <span style="font-weight: bold; color: #42a5f5; font-size: 13px;">
                                    \u{1F4D6} ${worldName}
                                </span>
                            </div>
                            <span style="font-size: 11px; color: #888;">
                                ${entries.length} \u4E2A\u6761\u76EE
                            </span>
                        </div>
                        <div class="wb-world-content" id="${worldId}-content" style="
                            padding: 10px;
                            display: none;
                        ">
                            ${entriesHtml}
                        </div>
                    </div>
                `;
      });
      if (worldBooksHtml) {
        worldBookHtml = `
                    <div style="margin-bottom: 18px;">
                        <div style="
                            font-size: 14px;
                            font-weight: bold;
                            color: #90caf9;
                            margin-bottom: 10px;
                            display: flex;
                            align-items: center;
                            gap: 6px;
                        ">
                            <span>\u{1F310} \u4E16\u754C\u4E66\u89E6\u53D1\u5185\u5BB9</span>
                            <button id="wb-expand-all" style="
                                padding: 3px 10px;
                                background: rgba(66, 165, 245, 0.2);
                                border: 1px solid rgba(66, 165, 245, 0.4);
                                border-radius: 4px;
                                color: #42a5f5;
                                cursor: pointer;
                                font-size: 11px;
                                margin-left: auto;
                            ">
                                <i class="fa-solid fa-expand"></i> \u5168\u90E8\u5C55\u5F00
                            </button>
                            <button id="wb-collapse-all" style="
                                padding: 3px 10px;
                                background: rgba(66, 165, 245, 0.2);
                                border: 1px solid rgba(66, 165, 245, 0.4);
                                border-radius: 4px;
                                color: #42a5f5;
                                cursor: pointer;
                                font-size: 11px;
                            ">
                                <i class="fa-solid fa-compress"></i> \u5168\u90E8\u6536\u8D77
                            </button>
                        </div>
                        ${worldBooksHtml}
                    </div>
                    <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 0 0 18px 0;">
                `;
      }
    } else {
      worldBookHtml = `
                <div style="margin-bottom: 18px;">
                    <div style="font-size: 14px; font-weight: bold; color: #90caf9; margin-bottom: 8px;">\u{1F310} \u4E16\u754C\u4E66\u89E6\u53D1\u5185\u5BB9</div>
                    <div style="color: #888; font-size: 13px; font-style: italic;">\uFF08\u65E0\u6761\u76EE\u88AB\u89E6\u53D1\uFF09</div>
                </div>
                <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 0 0 18px 0;">
            `;
    }
  } catch (err) {
    console.warn("[FloorMessage] \u83B7\u53D6\u4E16\u754C\u4E66\u89E6\u53D1\u5185\u5BB9\u5931\u8D25:", err);
    worldBookHtml = `
            <div style="margin-bottom: 18px;">
                <div style="font-size: 14px; font-weight: bold; color: #90caf9; margin-bottom: 8px;">\u{1F310} \u4E16\u754C\u4E66\u89E6\u53D1\u5185\u5BB9</div>
                <div style="color: #f48fb1; font-size: 13px;">\u26A0\uFE0F \u83B7\u53D6\u5931\u8D25: ${err.message || "\u672A\u77E5\u9519\u8BEF"}</div>
            </div>
            <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 0 0 18px 0;">
        `;
  }
  const isMobile3 = isMobileDevice();
  let panelTop = "50%";
  let panelLeft = "50%";
  let panelTransform = "translate(-50%, -50%)";
  let panelMaxHeight = "82vh";
  let panelWidth = "680px";
  if (isMobile3) {
    const topSettingsHolder = document.querySelector("#top-settings-holder");
    let topOffset = 10;
    if (topSettingsHolder) {
      const rect = topSettingsHolder.getBoundingClientRect();
      topOffset = Math.max(10, Math.min(rect.bottom + 10, window.innerHeight * 0.5));
    }
    const availableHeight = Math.max(200, window.innerHeight - topOffset - 20);
    panelTop = `${topOffset}px`;
    panelLeft = "50%";
    panelTransform = "translateX(-50%)";
    panelMaxHeight = `${availableHeight}px`;
    panelWidth = "96vw";
  }
  const floorContent = messages.map((msg, index) => {
    const previewLength = 100;
    const textPreview = msg.text.substring(0, previewLength);
    const hasMore = msg.text.length > previewLength;
    const fullText = msg.text;
    return `
        <div class="st-chatu8-floor-item" data-index="${index}" style="
            margin-bottom: 12px; 
            padding: 12px; 
            background: rgba(255,255,255,0.05); 
            border-radius: 8px;
            border: 1px solid rgba(255,255,255,0.08);
            transition: all 0.2s;
        ">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <div class="floor-drag-handle" style="
                    cursor: grab;
                    color: #888;
                    font-size: 16px;
                    padding: 4px;
                    user-select: none;
                " title="\u62D6\u62FD\u6392\u5E8F">
                    <i class="fa-solid fa-grip-vertical"></i>
                </div>
                <div style="flex: 1; font-weight: bold; color: #4CAF50;">
                    #${msg.mesId} ${msg.charName}
                </div>
                ${hasMore ? `
                <button class="floor-toggle-top-btn" data-index="${index}" style="
                    padding: 3px 10px;
                    background: rgba(76, 175, 80, 0.2);
                    border: 1px solid rgba(76, 175, 80, 0.4);
                    border-radius: 4px;
                    color: #4CAF50;
                    cursor: pointer;
                    font-size: 11px;
                    transition: all 0.2s;
                    display: none;
                ">
                    <i class="fa-solid fa-chevron-up"></i> \u6536\u8D77
                </button>
                ` : ""}
                <button class="floor-remove-btn" data-index="${index}" style="
                    padding: 4px 8px;
                    background: rgba(244, 67, 54, 0.2);
                    border: 1px solid rgba(244, 67, 54, 0.4);
                    border-radius: 4px;
                    color: #f44336;
                    cursor: pointer;
                    font-size: 12px;
                    transition: all 0.2s;
                " title="\u79FB\u9664\u6B64\u6D88\u606F">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
            <div class="floor-text-content" style="position: relative;">
                <div class="floor-text-preview" style="
                    white-space: pre-wrap; 
                    line-height: 1.5;
                    color: #ddd;
                    ${hasMore ? "max-height: 80px; overflow: hidden;" : ""}
                ">
                    ${hasMore ? textPreview + "..." : fullText}
                </div>
                <div class="floor-text-full" style="
                    white-space: pre-wrap; 
                    line-height: 1.5;
                    color: #ddd;
                    display: none;
                ">
                    ${fullText}
                </div>
                ${hasMore ? `
                <button class="floor-toggle-btn" data-index="${index}" style="
                    margin-top: 8px;
                    padding: 4px 12px;
                    background: rgba(76, 175, 80, 0.2);
                    border: 1px solid rgba(76, 175, 80, 0.4);
                    border-radius: 4px;
                    color: #4CAF50;
                    cursor: pointer;
                    font-size: 12px;
                    transition: all 0.2s;
                ">
                    <i class="fa-solid fa-chevron-down"></i> \u5C55\u5F00
                </button>
                ` : ""}
            </div>
        </div>
        `;
  }).join("");
  const panelHtml = `
        <div id="st-chatu8-floor-info-panel" style="
            position: fixed;
            top: ${panelTop};
            left: ${panelLeft};
            transform: ${panelTransform};
            width: ${panelWidth};
            max-width: 96vw;
            max-height: ${panelMaxHeight};
            background: rgba(22, 22, 33, 0.98);
            border: 1px solid rgba(255, 255, 255, 0.18);
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
            z-index: 10001;
            display: flex;
            flex-direction: column;
            backdrop-filter: blur(12px);
        ">
            <div style="
                padding: 15px 20px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <div style="font-size: 16px; font-weight: bold; color: #fff;">
                    \u697C\u5C42\u4FE1\u606F (${messages.length} \u6761)
                </div>
                <div style="display: flex; gap: 10px;">
                    <button id="st-chatu8-floor-clear-btn" style="
                        padding: 5px 15px;
                        background: rgba(244, 67, 54, 0.8);
                        border: none;
                        border-radius: 6px;
                        color: white;
                        cursor: pointer;
                        font-size: 14px;
                    ">\u6E05\u9664\u5168\u90E8</button>
                    <button id="st-chatu8-floor-close-btn" style="
                        padding: 5px 15px;
                        background: rgba(255, 255, 255, 0.1);
                        border: none;
                        border-radius: 6px;
                        color: white;
                        cursor: pointer;
                        font-size: 14px;
                    ">\u5173\u95ED</button>
                </div>
            </div>
            <div id="st-chatu8-floor-content" style="
                padding: 20px;
                overflow-y: auto;
                flex: 1;
                color: #ddd;
            ">
                ${worldBookHtml}
                <div style="font-size: 14px; font-weight: bold; color: #a5d6a7; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
                    <span>\u{1F4CB} \u697C\u5C42\u6D88\u606F</span>
                    <span style="font-size: 12px; color: #888; font-weight: normal;">(\u53EF\u62D6\u62FD\u6392\u5E8F)</span>
                </div>
                <div id="st-chatu8-floor-list">
                    ${floorContent}
                </div>
            </div>
        </div>
    `;
  $("#st-chatu8-floor-info-panel").remove();
  $("body").append(panelHtml);
  $("#st-chatu8-floor-content").on("click", ".wb-world-header", function() {
    const worldId = $(this).data("world-id");
    const $content = $(`#${worldId}-content`);
    const $icon = $(this).find(".wb-world-icon");
    if ($content.is(":visible")) {
      $content.slideUp(200);
      $icon.css("transform", "rotate(0deg)");
    } else {
      $content.slideDown(200);
      $icon.css("transform", "rotate(90deg)");
    }
  });
  $("#st-chatu8-floor-content").on("click", ".wb-entry-toggle", function(e) {
    e.stopPropagation();
    const entryId = $(this).data("entry-id");
    const $item = $(this).closest(".wb-entry-item");
    const $preview = $item.find(".wb-entry-preview");
    const $full = $(`#${entryId}-full`);
    const $topBtn = $item.find(".wb-entry-toggle-top");
    if ($full.is(":visible")) {
      $full.hide();
      $preview.show();
      $(this).html('<i class="fa-solid fa-chevron-down"></i> \u5C55\u5F00\u6761\u76EE');
      $topBtn.hide();
    } else {
      $preview.hide();
      $full.show();
      $(this).html('<i class="fa-solid fa-chevron-up"></i> \u6536\u8D77\u6761\u76EE');
      $topBtn.show();
    }
  });
  $("#st-chatu8-floor-content").on("click", ".wb-entry-toggle-top", function(e) {
    e.stopPropagation();
    const entryId = $(this).data("entry-id");
    const $item = $(this).closest(".wb-entry-item");
    const $preview = $item.find(".wb-entry-preview");
    const $full = $(`#${entryId}-full`);
    const $bottomBtn = $item.find(".wb-entry-toggle");
    $full.hide();
    $preview.show();
    $bottomBtn.html('<i class="fa-solid fa-chevron-down"></i> \u5C55\u5F00\u6761\u76EE');
    $(this).hide();
  });
  $("#st-chatu8-floor-content").on("click", ".wb-entry-preview", function(e) {
    const entryId = $(this).data("entry-id");
    if (!entryId) return;
    const $toggle = $(this).siblings(".wb-entry-toggle");
    if ($toggle.length > 0) {
      $toggle.click();
    }
  });
  $("#st-chatu8-floor-content").on("click", ".wb-entry-disable-btn", async function(e) {
    e.stopPropagation();
    const worldName = $(this).data("world-name");
    const entryUid = decodeURIComponent($(this).attr("data-entry-uid") ?? "");
    if (!worldName || entryUid === "") {
      console.warn("[FloorMessage] \u7981\u7528\u6761\u76EE\u5931\u8D25\uFF1A\u7F3A\u5C11\u5FC5\u8981\u53C2\u6570", { worldName, entryUid });
      return;
    }
    try {
      const { toggleWorldEntryState: toggleWorldEntryState2, getWorldEntryState: getWorldEntryState2 } = await import("../settings/send_data.js");
      const currentState = getWorldEntryState2(worldName, entryUid);
      const newState = toggleWorldEntryState2(worldName, entryUid, false);
      console.log("[FloorMessage] \u5DF2\u7981\u7528\u6761\u76EE:", {
        worldName,
        entryUid,
        \u539F\u72B6\u6001: currentState,
        \u65B0\u72B6\u6001: newState
      });
      const $btn = $(this);
      if (newState === false) {
        $btn.html('<i class="fa-solid fa-check"></i> \u5DF2\u7981\u7528');
        $btn.css({
          "background": "rgba(76, 175, 80, 0.15)",
          "border-color": "rgba(76, 175, 80, 0.3)",
          "color": "#4CAF50"
        });
        $btn.prop("disabled", true);
        toastr.success(`\u5DF2\u7981\u7528\u6761\u76EE\uFF08\u4E16\u754C\u4E66: ${worldName}\uFF09`);
      }
    } catch (err) {
      console.error("[FloorMessage] \u7981\u7528\u6761\u76EE\u5931\u8D25:", err);
      toastr.error("\u7981\u7528\u6761\u76EE\u5931\u8D25: " + (err.message || "\u672A\u77E5\u9519\u8BEF"));
    }
  });
  $("#wb-expand-all").on("click", function() {
    $(".wb-world-content").slideDown(200);
    $(".wb-world-icon").css("transform", "rotate(90deg)");
    $(".wb-entry-full").show();
    $(".wb-entry-preview").hide();
    $(".wb-entry-toggle").html('<i class="fa-solid fa-chevron-up"></i> \u6536\u8D77\u6761\u76EE');
    $(".wb-entry-toggle-top").show();
  });
  $("#wb-collapse-all").on("click", function() {
    $(".wb-world-content").slideUp(200);
    $(".wb-world-icon").css("transform", "rotate(0deg)");
    $(".wb-entry-full").hide();
    $(".wb-entry-preview").show();
    $(".wb-entry-toggle").html('<i class="fa-solid fa-chevron-down"></i> \u5C55\u5F00\u6761\u76EE');
    $(".wb-entry-toggle-top").hide();
  });
  $("#st-chatu8-floor-list").on("click", ".floor-toggle-btn", function() {
    const $item = $(this).closest(".st-chatu8-floor-item");
    const $content = $item.find(".floor-text-content");
    const $preview = $content.find(".floor-text-preview");
    const $full = $content.find(".floor-text-full");
    const $topBtn = $item.find(".floor-toggle-top-btn");
    if ($full.is(":visible")) {
      $full.hide();
      $preview.show();
      $(this).html('<i class="fa-solid fa-chevron-down"></i> \u5C55\u5F00');
      $topBtn.hide();
    } else {
      $preview.hide();
      $full.show();
      $(this).html('<i class="fa-solid fa-chevron-up"></i> \u6536\u8D77');
      $topBtn.show();
    }
  });
  $("#st-chatu8-floor-list").on("click", ".floor-toggle-top-btn", function() {
    const $item = $(this).closest(".st-chatu8-floor-item");
    const $content = $item.find(".floor-text-content");
    const $preview = $content.find(".floor-text-preview");
    const $full = $content.find(".floor-text-full");
    const $bottomBtn = $item.find(".floor-toggle-btn");
    $full.hide();
    $preview.show();
    $bottomBtn.html('<i class="fa-solid fa-chevron-down"></i> \u5C55\u5F00');
    $(this).hide();
  });
  $("#st-chatu8-floor-list").on("click", ".floor-remove-btn", function() {
    const index = parseInt($(this).data("index"));
    if (floorCollectionMode === "manual" && manualCollectedMessages.length > 0) {
      manualCollectedMessages.splice(index, 1);
      console.log("[FloorMessage] \u5DF2\u79FB\u9664\u6D88\u606F\uFF0C\u5269\u4F59:", manualCollectedMessages.length);
      if (manualCollectedMessages.length === 0) {
        clearFloorTargetElement();
        $("#st-chatu8-floor-info-panel").remove();
        toastr.info("\u5DF2\u79FB\u9664\u6240\u6709\u697C\u5C42\u6D88\u606F");
        return;
      }
      $("#st-chatu8-floor-info-panel").remove();
      showFloorInfoPanel();
      toastr.success("\u5DF2\u79FB\u9664\u8BE5\u6D88\u606F");
    } else {
      toastr.warning("\u81EA\u52A8\u6A21\u5F0F\u4E0B\u4E0D\u652F\u6301\u5220\u9664\u5355\u6761\u6D88\u606F");
    }
  });
  const floorList = document.getElementById("st-chatu8-floor-list");
  let draggedElement = null;
  let draggedIndex = null;
  let lastTargetElement = null;
  floorList.querySelectorAll(".st-chatu8-floor-item").forEach((item) => {
    item.draggable = true;
  });
  floorList.addEventListener("dragstart", function(e) {
    const item = e.target.closest(".st-chatu8-floor-item");
    if (!item) return;
    draggedElement = item;
    draggedIndex = parseInt(item.dataset.index);
    lastTargetElement = null;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", draggedIndex);
    setTimeout(() => {
      item.classList.add("dragging");
      item.style.opacity = "0.4";
    }, 0);
  });
  let dragOverTimeout = null;
  floorList.addEventListener("dragover", function(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!draggedElement) return;
    if (dragOverTimeout) return;
    dragOverTimeout = setTimeout(() => {
      dragOverTimeout = null;
    }, 50);
    const afterElement = getDragAfterElement(floorList, e.clientY);
    if (afterElement !== lastTargetElement) {
      lastTargetElement = afterElement;
      if (afterElement == null) {
        floorList.appendChild(draggedElement);
      } else {
        floorList.insertBefore(draggedElement, afterElement);
      }
    }
  });
  floorList.addEventListener("dragenter", function(e) {
    e.preventDefault();
  });
  floorList.addEventListener("dragend", function(e) {
    if (!draggedElement) return;
    draggedElement.classList.remove("dragging");
    draggedElement.style.opacity = "1";
    const items = Array.from(floorList.querySelectorAll(".st-chatu8-floor-item"));
    const newIndex = items.indexOf(draggedElement);
    if (newIndex !== -1 && newIndex !== draggedIndex && floorCollectionMode === "manual") {
      const [movedItem] = manualCollectedMessages.splice(draggedIndex, 1);
      manualCollectedMessages.splice(newIndex, 0, movedItem);
      console.log("[FloorMessage] \u5DF2\u8C03\u6574\u987A\u5E8F:", draggedIndex, "->", newIndex);
      $("#st-chatu8-floor-info-panel").remove();
      showFloorInfoPanel();
      toastr.success("\u5DF2\u8C03\u6574\u987A\u5E8F");
    } else if (floorCollectionMode !== "manual") {
      toastr.warning("\u81EA\u52A8\u6A21\u5F0F\u4E0B\u4E0D\u652F\u6301\u6392\u5E8F");
    }
    draggedElement = null;
    draggedIndex = null;
    lastTargetElement = null;
  });
  floorList.addEventListener("drop", function(e) {
    e.preventDefault();
    e.stopPropagation();
  });
  function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll(".st-chatu8-floor-item:not(.dragging)")];
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }
  $("#st-chatu8-floor-close-btn").on("click", () => {
    $("#st-chatu8-floor-info-panel").remove();
  });
  $("#st-chatu8-floor-clear-btn").on("click", () => {
    clearFloorTargetElement();
    $("#st-chatu8-floor-info-panel").remove();
    toastr.success("\u5DF2\u6E05\u9664\u6240\u6709\u697C\u5C42\u4FE1\u606F");
    console.log("[FloorMessage] \u5DF2\u6E05\u9664\u697C\u5C42\u4FE1\u606F\u6536\u96C6");
  });
  $("#st-chatu8-floor-info-panel").on("click", function(e) {
    if (e.target === this) {
      $(this).remove();
    }
  });
  const style = document.createElement("style");
  style.textContent = `
        .st-chatu8-floor-item {
            cursor: move;
        }
        .st-chatu8-floor-item:hover {
            background: rgba(255,255,255,0.08) !important;
            border-color: rgba(255,255,255,0.15) !important;
        }
        .st-chatu8-floor-item.dragging {
            opacity: 0.4 !important;
            border: 2px dashed rgba(76, 175, 80, 0.6) !important;
            background: rgba(76, 175, 80, 0.1) !important;
        }
        .floor-remove-btn:hover {
            background: rgba(244, 67, 54, 0.4) !important;
            border-color: rgba(244, 67, 54, 0.6) !important;
        }
        .floor-toggle-btn:hover, .floor-toggle-top-btn:hover {
            background: rgba(76, 175, 80, 0.4) !important;
            border-color: rgba(76, 175, 80, 0.6) !important;
        }
        .floor-drag-handle {
            cursor: grab;
        }
        .floor-drag-handle:active {
            cursor: grabbing !important;
        }
        .wb-world-header:hover {
            background: rgba(66, 165, 245, 0.15) !important;
        }
        .wb-entry-toggle:hover, .wb-entry-toggle-top:hover {
            background: rgba(66, 165, 245, 0.25) !important;
            border-color: rgba(66, 165, 245, 0.5) !important;
        }
        .wb-entry-disable-btn:hover:not(:disabled) {
            background: rgba(255, 152, 0, 0.3) !important;
            border-color: rgba(255, 152, 0, 0.5) !important;
        }
        .wb-entry-disable-btn:disabled {
            cursor: not-allowed;
            opacity: 0.7;
        }
        .wb-entry-preview[data-entry-id]:hover {
            background: rgba(66, 165, 245, 0.08);
        }
        #wb-expand-all:hover, #wb-collapse-all:hover {
            background: rgba(66, 165, 245, 0.3) !important;
            border-color: rgba(66, 165, 245, 0.6) !important;
        }
    `;
  document.head.appendChild(style);
}

function initFloorMessageEvents() {
  if (dom.floorIndicator) {
    dom.floorIndicator.off("click.floorMessage").on("click.floorMessage", () => {
      showFloorInfoPanel();
      console.log("[FloorMessage] \u663E\u793A\u697C\u5C42\u4FE1\u606F\u67E5\u770B\u9762\u677F");
    });
  }
}

function bindFloorIndicatorClick() {
  initFloorMessageEvents();
}

export { bindFloorIndicatorClick, buildFloorContext, initFloorMessageEvents, setFloorTargetElement };
