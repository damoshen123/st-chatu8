// 还原自打包产物 — 原始模块: utils/chatDataUtils.js
import { getContext } from "../../../../../st-context.js";
import { eventSource, saveChatConditional, saveSettingsDebounced } from "../../../../../script.js";
import { world_info, world_names } from "../../../../../world-info.js";
import { extension_settings } from "../../../../../extensions.js";
import { eventNames, extensionName } from "./config.js";
import { getCleanLogicalText } from "./imageInserter.js";
import { getWorldEntrySelectionKey, migrateWorldEntryConfig, prepareWorldEntries, worldEntrySelectionKeys } from "./worldEntrySelection.js";

async function setcharData(name, value) {
  let context = getContext();
  context.chatMetadata["st-chatu8"] = context.chatMetadata["st-chatu8"] || {};
  context.chatMetadata["st-chatu8"]["data"] = context.chatMetadata["st-chatu8"]["data"] || {};
  context.chatMetadata["st-chatu8"]["data"][name] = value;
  saveChatConditional();
}

async function getcharData(name) {
  let context = getContext();
  context.chatMetadata["st-chatu8"] = context.chatMetadata["st-chatu8"] || {};
  context.chatMetadata["st-chatu8"]["data"] = context.chatMetadata["st-chatu8"]["data"] || {};
  return context.chatMetadata["st-chatu8"]["data"][name] || {};
}

async function getElContext(el, maxCount = 3, options = {}) {
  const keepImageTagInHistory = options.keepImageTagInHistory === true;
  if (el) {
    if (el.classList.contains("mes_text")) {
      var grandParent = el.parentElement.parentElement;
      var id_str = grandParent.getAttribute("mesid");
      if (!id_str) {
        console.log("[chatDataUtils] mesid attribute not found.");
        return;
      }
      var id = parseInt(id_str, 10);
      console.log("[chatDataUtils] chatId:", id);
      const texts = [];
      if (id >= 2) {
        let startId = id - (maxCount - 1) * 2;
        if (startId < 0) {
          startId = id % 2;
        }
        let count = 0;
        let currentId = startId;
        while (currentId <= id && count < maxCount) {
          const chatMessage = getContext().chat[currentId];
          const messageText = chatMessage.mes || "";
          texts.push(messageText);
          currentId += 2;
          count++;
        }
      } else {
        const chatMessage = getContext().chat[id];
        console.log("[chatDataUtils] Retrieved chatMessage:", chatMessage);
        const messageText = chatMessage.mes || "";
        texts.push(messageText);
      }
      console.log("[chatDataUtils] Retrieved texts:", texts);
      const promises = texts.map((text, index) => {
        const isLast = index === texts.length - 1;
        const keepImageTag = keepImageTagInHistory && !isLast;
        return new Promise((resolve) => {
          const requestId = `chatDataUtils-${Date.now()}-${index}`;
          const timeoutId = setTimeout(() => {
            eventSource.removeListener(eventNames.REGEX_RESULT_MESSAGE, listener);
            console.warn("[chatDataUtils] Regex processing timed out, using original text");
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
          eventSource.emit(eventNames.REGEX_TEST_MESSAGE, { message: text, id: requestId, keepImageTag });
        });
      });
      const retexts = await Promise.all(promises);
      console.log("[chatDataUtils] Processed retexts:", retexts);
      return retexts;
    } else {
      console.log("[chatDataUtils] \u8BE5\u5143\u7D20\u4E0D\u5305\u542B mes_text \u7C7B\uFF0C\u5C1D\u8BD5\u67E5\u627E\u5916\u90E8 mes_text");
      let externalMesText = null;
      let text = null;
      if (el?.ownerDocument !== document) {
        const iframes = document.querySelectorAll("iframe");
        for (const iframe of iframes) {
          try {
            if (iframe.contentDocument === el.ownerDocument || iframe.contentWindow?.document === el.ownerDocument) {
              externalMesText = iframe.closest(".mes_text");
              break;
            }
          } catch (e) {
          }
        }
      }
      if (!externalMesText && el?.closest) {
        externalMesText = el.closest(".mes_text");
      }
      if (externalMesText) {
        const grandParent2 = externalMesText.parentElement?.parentElement;
        const mesIdStr = grandParent2?.getAttribute("mesid");
        if (mesIdStr) {
          const mesId = parseInt(mesIdStr, 10);
          const chatMessage = getContext().chat[mesId];
          const chatText = chatMessage?.mes || "";
          console.log("[chatDataUtils] \u5916\u90E8 mes_text \u68C0\u6D4B\u7ED3\u679C:", {
            mesId,
            chatTextLength: chatText.length
          });
          if (chatText.length > 100 && mesId !== 0) {
            console.log("[chatDataUtils] chat \u6587\u672C\u957F\u5EA6 > 100 \u4E14 mesId !== 0\uFF0C\u4F7F\u7528 mes_text \u903B\u8F91\u83B7\u53D6\u5386\u53F2\u4E0A\u4E0B\u6587");
            const texts = [];
            if (mesId >= 2) {
              let startId = mesId - (maxCount - 1) * 2;
              if (startId < 0) {
                startId = mesId % 2;
              }
              let count = 0;
              let currentId = startId;
              while (currentId <= mesId && count < maxCount) {
                const msg = getContext().chat[currentId];
                const messageText = msg?.mes || "";
                texts.push(messageText);
                currentId += 2;
                count++;
              }
            } else {
              texts.push(chatText);
            }
            console.log("[chatDataUtils] \u83B7\u53D6\u5230\u5386\u53F2\u4E0A\u4E0B\u6587:", texts.length, "\u6761");
            const promises = texts.map((txt, index) => {
              const isLast = index === texts.length - 1;
              const keepImageTag = keepImageTagInHistory && !isLast;
              return new Promise((resolve) => {
                const reqId = `chatDataUtils-${Date.now()}-${index}`;
                const timeoutId = setTimeout(() => {
                  eventSource.removeListener(eventNames.REGEX_RESULT_MESSAGE, listener);
                  console.warn("[chatDataUtils] Regex processing timed out, using original text");
                  resolve(txt);
                }, 5e3);
                const listener = (data) => {
                  if (data.id === reqId) {
                    clearTimeout(timeoutId);
                    eventSource.removeListener(eventNames.REGEX_RESULT_MESSAGE, listener);
                    resolve(data.message);
                  }
                };
                eventSource.on(eventNames.REGEX_RESULT_MESSAGE, listener);
                eventSource.emit(eventNames.REGEX_TEST_MESSAGE, { message: txt, id: reqId, keepImageTag });
              });
            });
            const retexts = await Promise.all(promises);
            console.log("[chatDataUtils] \u5904\u7406\u540E\u7684\u5386\u53F2\u4E0A\u4E0B\u6587:", retexts);
            return retexts;
          } else {
            console.log("[chatDataUtils] chat \u6587\u672C\u957F\u5EA6 <= 100\uFF0C\u4ECE DOM \u5143\u7D20\u83B7\u53D6\u6587\u672C");
            text = getCleanLogicalText(el);
          }
        } else {
          console.log("[chatDataUtils] \u672A\u627E\u5230 mesid \u5C5E\u6027\uFF0C\u4ECE DOM \u5143\u7D20\u83B7\u53D6\u6587\u672C");
          text = getCleanLogicalText(el);
        }
      } else {
        console.log("[chatDataUtils] \u672A\u627E\u5230\u5916\u90E8 mes_text\uFF0C\u4ECE DOM \u5143\u7D20\u83B7\u53D6\u6587\u672C");
        text = getCleanLogicalText(el);
      }
      const requestId = `chatDataUtils-${Date.now()}`;
      const processedText = await new Promise((resolve) => {
        const timeoutId = setTimeout(() => {
          eventSource.removeListener(eventNames.REGEX_RESULT_MESSAGE, listener);
          console.warn("[chatDataUtils] Regex processing timed out, using original text");
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
      return [processedText];
    }
  } else {
    console.log("[chatDataUtils] No element provided.");
  }
}

async function getrWorlds() {
  let worlds = world_names;
  let charworldName = await getcharWorld();
  console.log("charworldName", charworldName);
  worlds = unshiftSpecificValue(worlds, charworldName);
  return worlds;
  console.log("[chatDataUtils] Updated world_names:", worlds);
}

function unshiftSpecificValue(arr, val) {
  const first = [];
  const rest = [];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] == val) {
      first.push(arr[i]);
    } else {
      rest.push(arr[i]);
    }
  }
  rest.sort((a, b) => a.localeCompare(b, "zh-CN"));
  return first.concat(rest);
}

async function getcharWorld() {
  let char_world_name = getContext().characters[getContext().characterId]?.data?.extensions?.world;
  console.log("char_world_name", char_world_name);
  return char_world_name;
}

async function getglobalSelectWorld() {
  const world = world_info.globalSelect;
  return world;
}

async function getWorldEntries(world_name) {
  if (world_name) {
    try {
      let char_WorldInfo = await getContext().loadWorldInfo(world_name);
      if (char_WorldInfo && char_WorldInfo.entries) {
        console.log("char_WorldInfo", char_WorldInfo);
        const entries = prepareWorldEntries(char_WorldInfo.entries);
        const keys = new Map(Object.values(entries).filter((entry) => entry?.uid != null).map((entry) => [String(entry.uid), getWorldEntrySelectionKey(entry)]));
        worldEntrySelectionKeys.set(world_name, keys);
        const settings3 = extension_settings[extensionName] || {};
        let changed = migrateWorldEntryConfig(settings3.worldBookConfig, world_name, keys);
        changed = migrateWorldEntryConfig(settings3.knowledgeBaseConfig, world_name, keys) || changed;
        if (changed) saveSettingsDebounced();
        return entries;
      }
    } catch (e) {
      console.error(e);
    }
  } else {
    return;
  }
}

function resolveNestedVariable(store, name) {
  if (!store) return "";
  const pathParts = name.split(".");
  let value = store[pathParts[0]];
  for (let i = 1; i < pathParts.length; i++) {
    if (value == null || typeof value !== "object") {
      value = void 0;
      break;
    }
    value = value[pathParts[i]];
  }
  if (value === void 0 || value === null) {
    return "";
  }
  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

function setNestedVariable(store, name, value) {
  if (!store) return;
  const pathParts = name.split(".");
  if (pathParts.length === 1) {
    store[name] = value;
    return;
  }
  let node = store;
  for (let i = 0; i < pathParts.length - 1; i++) {
    const key = pathParts[i];
    if (node[key] == null || typeof node[key] !== "object") {
      node[key] = {};
    }
    node = node[key];
  }
  node[pathParts[pathParts.length - 1]] = value;
}

function resolveGlobalVariable(name) {
  const context = getContext();
  const variables = context.extensionSettings?.variables || {};
  return resolveNestedVariable(variables, name);
}

function setglobalvar(name, value) {
  const context = getContext();
  if (!context.extensionSettings) {
    context.extensionSettings = {};
  }
  if (!context.extensionSettings.variables) {
    context.extensionSettings.variables = {};
  }
  setNestedVariable(context.extensionSettings.variables, name, value);
}

export { getElContext, getWorldEntries, getcharData, getcharWorld, getrWorlds, resolveGlobalVariable, resolveNestedVariable, setNestedVariable, setcharData, setglobalvar };
