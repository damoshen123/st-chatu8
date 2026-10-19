// 还原自打包产物 — 原始模块: utils/iframe/placeholder.js
import { extension_settings } from "../../../../../../extensions.js";
import { getContext } from "../../../../../../st-context.js";
import { eventSource, saveChatConditional } from "../../../../../../script.js";
import { extensionName } from "../config.js";
import { normalizePromptTag, sleep } from "../utils.js";
import { isGenerating } from "../generation_status.js";
import { fuzzyMatchLine, removeThinkingTextOnly } from "../imageInserter.js";
import { getcharData, setcharData } from "../chatDataUtils.js";
import { getItemImg } from "../database.js";
import { showEditDialog } from "./dialogs.js";
import { deactivateAutoClickWindow } from "./index.js";
import { findNodeAtPosition, generateElKey, generateStableId } from "./utils.js";
import { createAndShowImage, triggerGeneration } from "./generation.js";
import "../promptReq.js"; // init_promptReq

var handledAutoClickPromptMd5s, handledAutoClickRequestIds;

handledAutoClickRequestIds = /* @__PURE__ */ new Set();

handledAutoClickPromptMd5s = /* @__PURE__ */ new Set();

function getPromptMd5(prompt2) {
  if (!prompt2) return "";
  const norm = normalizePromptTag(prompt2);
  try {
    const crypto2 = window.stChatu8CryptoJS || window.CryptoJS || (typeof CryptoJS !== "undefined" ? CryptoJS : null);
    if (crypto2 && typeof crypto2.MD5 === "function") {
      return crypto2.MD5(norm).toString();
    }
  } catch (_) {
  }
  return generateStableId(norm);
}

function registerAutoClickHandled(prompt2, requestId) {
  if (!prompt2) return;
  const norm = normalizePromptTag(prompt2);
  const promptMd5 = getPromptMd5(norm);
  if (promptMd5) {
    handledAutoClickPromptMd5s.add(promptMd5);
  }
  if (requestId) {
    handledAutoClickRequestIds.add(requestId);
  } else {
    const id = generateStableId(norm);
    handledAutoClickRequestIds.add(id);
  }
}

function clearHandledAutoClickCache() {
  handledAutoClickRequestIds.clear();
  handledAutoClickPromptMd5s.clear();
}

function getImageTags4() {
  const settings3 = extension_settings[extensionName];
  const startTag = settings3?.startTag || "image###";
  const endTag = settings3?.endTag || "###";
  return { startTag, endTag };
}

function extractPureTag(tag, startTag, endTag) {
  if (!tag) return tag;
  const escapedStart = startTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedEnd = endTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pureTagRegex = new RegExp(`${escapedStart}([\\s\\S]*?)${escapedEnd}`);
  const pureTagMatch = tag.match(pureTagRegex);
  if (pureTagMatch) {
    return pureTagMatch[1].trim();
  }
  return tag;
}

async function getSavedImageMatches(logicalText, rootElement, logicalTextForMatchOverride, firstDivEndOffset = 0) {
  const result = [];
  try {
    const existingImage = rootElement.querySelector(`.st-chatu8-image-container`);
    if (existingImage) {
      return result;
    }
    const indexOfSearchStart = firstDivEndOffset > 0 ? firstDivEndOffset : 0;
    const logicalTextForMatch = removeThinkingTextOnly(logicalTextForMatchOverride || logicalText);
    if (rootElement?.classList?.contains("mes_text")) {
      let idStr = rootElement.getAttribute("data-mesid");
      if (!idStr) {
        const grandParent = rootElement.parentElement?.parentElement;
        idStr = grandParent?.getAttribute("mesid");
      }
      if (idStr) {
        const id = parseInt(idStr, 10);
        const context = getContext();
        if (context.chat && context.chat[id]) {
          const key = context.chat[id].swipe_id ?? 0;
          const extraImages = context.chat[id].extra?.images?.[key];
          if (Array.isArray(extraImages) && extraImages.length > 0) {
            const { startTag: startTag2, endTag: endTag2 } = getImageTags4();
            for (const img of extraImages) {
              const alreadyWrapped = img.tag.includes(startTag2) && img.tag.includes(endTag2);
              const imageTagText = alreadyWrapped ? img.tag : `${startTag2}${img.tag}${endTag2}`;
              const textHasTag = alreadyWrapped ? logicalText.includes(imageTagText) : logicalTextForMatch.includes(imageTagText);
              const linkForQuery = alreadyWrapped ? (() => {
                const escapedStart = startTag2.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                const escapedEnd = endTag2.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                const pureTagRegex = new RegExp(`${escapedStart}([\\s\\S]*?)${escapedEnd}`);
                const pureTagMatch = img.tag.match(pureTagRegex);
                return pureTagMatch ? pureTagMatch[1].trim() : img.tag;
              })() : img.tag;
              const existingButton = rootElement.querySelector(
                `button.image-tag-button[data-link="${CSS.escape(linkForQuery)}"], button.image-tag-button[data-image-tag="${CSS.escape(linkForQuery)}"]`
              );
              if (!existingButton && !textHasTag) {
                const matchResult = fuzzyMatchLine(logicalTextForMatch, img.regex, 0.5);
                if (matchResult) {
                  let correctEndIndex = matchResult.endIndex;
                  const matchedLine = matchResult.matchedLine;
                  let lineIndexInOriginal = logicalText.indexOf(matchedLine, indexOfSearchStart);
                  if (lineIndexInOriginal === -1) {
                    lineIndexInOriginal = logicalText.indexOf(matchedLine);
                  }
                  if (lineIndexInOriginal !== -1) {
                    correctEndIndex = lineIndexInOriginal + matchedLine.length;
                  }
                  result.push({
                    content: img.tag,
                    insertPosition: correctEndIndex
                  });
                } else {
                  result.push({
                    content: img.tag,
                    insertPosition: img.endIndex
                  });
                }
              }
            }
            if (result.length > 0) {
              console.log("[iframe] Matched from chat[" + id + "].extra.images[" + key + "], tags:", result.length);
            }
            return result;
          }
          const imageGroups2 = await getcharData("image_groups") || {};
          const elKey2 = generateElKey(logicalText);
          if (elKey2 && imageGroups2[elKey2]) {
            const oldImages = imageGroups2[elKey2];
            if (!context.chat[id].extra) {
              context.chat[id].extra = {};
            }
            if (!context.chat[id].extra.images) {
              context.chat[id].extra.images = {};
            }
            context.chat[id].extra.images[key] = oldImages;
            delete imageGroups2[elKey2];
            await setcharData("image_groups", imageGroups2);
            saveChatConditional();
            console.log("[iframe] Migrated image group from elKey:", elKey2, "to chat[" + id + "].extra.images[" + key + "]");
            const { startTag: startTag2, endTag: endTag2 } = getImageTags4();
            for (const img of oldImages) {
              const alreadyWrapped = img.tag.includes(startTag2) && img.tag.includes(endTag2);
              const imageTagText = alreadyWrapped ? img.tag : `${startTag2}${img.tag}${endTag2}`;
              const textHasTag = alreadyWrapped ? logicalText.includes(imageTagText) : logicalTextForMatch.includes(imageTagText);
              const linkForQuery = alreadyWrapped ? (() => {
                const escapedStart = startTag2.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                const escapedEnd = endTag2.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                const pureTagRegex = new RegExp(`${escapedStart}([\\s\\S]*?)${escapedEnd}`);
                const pureTagMatch = img.tag.match(pureTagRegex);
                return pureTagMatch ? pureTagMatch[1].trim() : img.tag;
              })() : img.tag;
              const existingButton = rootElement.querySelector(
                `button.image-tag-button[data-link="${CSS.escape(linkForQuery)}"], button.image-tag-button[data-image-tag="${CSS.escape(linkForQuery)}"]`
              );
              if (!existingButton && !textHasTag) {
                const matchResult = fuzzyMatchLine(logicalTextForMatch, img.regex, 0.5);
                if (matchResult) {
                  let correctEndIndex = matchResult.endIndex;
                  const matchedLine = matchResult.matchedLine;
                  let lineIndexInOriginal = logicalText.indexOf(matchedLine, indexOfSearchStart);
                  if (lineIndexInOriginal === -1) {
                    lineIndexInOriginal = logicalText.indexOf(matchedLine);
                  }
                  if (lineIndexInOriginal !== -1) {
                    correctEndIndex = lineIndexInOriginal + matchedLine.length;
                  }
                  result.push({
                    content: img.tag,
                    insertPosition: correctEndIndex
                  });
                } else {
                  result.push({
                    content: img.tag,
                    insertPosition: img.endIndex
                  });
                }
              }
            }
            if (result.length > 0) {
              console.log("[iframe] Matched from migrated data, tags:", result.length);
            }
            return result;
          }
          return result;
        }
      }
    }
    const imageGroups = await getcharData("image_groups") || {};
    const elKey = generateElKey(logicalText);
    if (!elKey) return result;
    const images = imageGroups[elKey];
    if (!Array.isArray(images) || images.length === 0) return result;
    const { startTag, endTag } = getImageTags4();
    for (const img of images) {
      const alreadyWrapped = img.tag.includes(startTag) && img.tag.includes(endTag);
      const imageTagText = alreadyWrapped ? img.tag : `${startTag}${img.tag}${endTag}`;
      const textHasTag = alreadyWrapped ? logicalText.includes(imageTagText) : logicalTextForMatch.includes(imageTagText);
      const linkForQuery = normalizePromptTag(
        alreadyWrapped ? (() => {
          const escapedStart = startTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const escapedEnd = endTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const pureTagRegex = new RegExp(`${escapedStart}([\\s\\S]*?)${escapedEnd}`);
          const pureTagMatch = img.tag.match(pureTagRegex);
          return pureTagMatch ? pureTagMatch[1].trim() : img.tag;
        })() : img.tag
      );
      const existingButton = rootElement.querySelector(
        `button.image-tag-button[data-link="${CSS.escape(linkForQuery)}"], button.image-tag-button[data-image-tag="${CSS.escape(linkForQuery)}"]`
      );
      if (!existingButton && !textHasTag) {
        result.push({
          content: img.tag,
          insertPosition: img.endIndex
        });
      }
    }
    if (result.length > 0) {
      console.log("[iframe] Matched image group by key:", elKey, "tags:", result.length);
    }
  } catch (e) {
    console.error("[iframe] Error in getSavedImageMatches:", e);
  }
  return result;
}

async function createButtonAtPosition(insertPosition, tag, nodeInfos, doc, rootElement, settings3, shouldAutoClickBatch, imageAlt = "Generated Image") {
  const { startTag, endTag } = getImageTags4();
  const alreadyWrapped = tag.includes(startTag) && tag.includes(endTag);
  const pureTag = extractPureTag(tag, startTag, endTag);
  let thinkingPrefix = "";
  if (alreadyWrapped && pureTag !== tag) {
    const escapedStart = startTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const escapedEnd = endTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const tagPatternRegex = new RegExp(`${escapedStart}[\\s\\S]*?${escapedEnd}`);
    const tagMatch = tag.match(tagPatternRegex);
    if (tagMatch) {
      const matchIndex = tag.indexOf(tagMatch[0]);
      if (matchIndex > 0) {
        thinkingPrefix = tag.substring(0, matchIndex);
      }
    }
  }
  const link = normalizePromptTag(pureTag);
  const requestId = generateStableId(link);
  const tagInsertedMarker = `tag-inserted-${requestId}`;
  const tagMarkerAttr = `data-${tagInsertedMarker}`;
  if (rootElement.hasAttribute && rootElement.hasAttribute(tagMarkerAttr)) {
    const existingButton2 = rootElement.querySelector(
      `button.image-tag-button[data-link="${CSS.escape(link)}"], button.image-tag-button[data-image-tag="${CSS.escape(link)}"]`
    );
    if (existingButton2) {
      console.log("[iframe] Tag already inserted with button, skipping:", tag.substring(0, 50));
      return null;
    } else {
      console.log("[iframe] Tag marker exists but button missing, re-inserting:", tag.substring(0, 50));
      rootElement.removeAttribute(tagMarkerAttr);
    }
  }
  const existingButton = rootElement.querySelector(
    `button.image-tag-button[data-link="${CSS.escape(link)}"], button.image-tag-button[data-image-tag="${CSS.escape(link)}"]`
  );
  if (existingButton) {
    console.log("[iframe] Button already exists, skipping:", link.substring(0, 50), "loading:", existingButton.hasAttribute("data-loading"));
    if (rootElement.setAttribute) {
      rootElement.setAttribute(tagMarkerAttr, "true");
    }
    return null;
  }
  const targetNodeInfo = findNodeAtPosition(nodeInfos, insertPosition);
  if (!targetNodeInfo) {
    console.warn("[iframe] Could not find target node for position:", insertPosition);
    return null;
  }
  if (rootElement.setAttribute) {
    rootElement.setAttribute(tagMarkerAttr, "true");
  }
  const button = doc.createElement("button");
  button.className = "image-tag-button st-chatu8-image-button";
  button.textContent = "\u751F\u6210\u56FE\u7247";
  button.dataset.link = link;
  button.dataset.requestId = requestId;
  button.dataset.imageTag = link;
  button.dataset.createdAt = String(Date.now());
  let pressTimer = null;
  let isLongPress2 = false;
  const longPressThreshold = 1200;
  const handlePressStart = (e) => {
    if (e.type === "mousedown" && e.button !== 0) return;
    isLongPress2 = false;
    pressTimer = setTimeout(() => {
      isLongPress2 = true;
      pressTimer = null;
      e.preventDefault();
      if (settings3.longPressToEdit == "true") {
        showEditDialog(null, button);
      }
    }, longPressThreshold);
  };
  const handlePressEnd = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  };
  button.addEventListener("click", (e) => {
    if (isLongPress2) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    e.preventDefault();
    triggerGeneration(button);
  });
  button.addEventListener("mousedown", handlePressStart);
  button.addEventListener("mouseup", handlePressEnd);
  button.addEventListener("mouseleave", handlePressEnd);
  button.addEventListener("touchstart", handlePressStart);
  button.addEventListener("touchend", handlePressEnd);
  button.addEventListener("touchcancel", handlePressEnd);
  const imgSpan = doc.createElement("span");
  imgSpan.className = "st-chatu8-image-span";
  imgSpan.dataset.requestId = requestId;
  const range = doc.createRange();
  try {
    const targetNode = targetNodeInfo.node;
    const offsetInNode = insertPosition - targetNodeInfo.start;
    if (targetNode.nodeType === Node.TEXT_NODE) {
      range.setStart(targetNode, offsetInNode);
      range.setEnd(targetNode, offsetInNode);
    } else {
      range.setStartAfter(targetNode);
      range.setEndAfter(targetNode);
    }
    range.insertNode(imgSpan);
    range.insertNode(button);
    if (thinkingPrefix) {
      const imageWrapper = doc.createElement("image");
      imageWrapper.innerHTML = thinkingPrefix;
      const pWrapper = doc.createElement("p");
      pWrapper.appendChild(imageWrapper);
      range.insertNode(pWrapper);
    }
  } catch (e) {
    console.error("[iframe] Error inserting button at position:", e);
    return null;
  }
  const [imageUrl, change, , isVideo, originalUrl, video, activeMode] = await getItemImg(link);
  if (change) {
    button.dataset.change = change;
  }
  if (video) {
    button.dataset.video = video;
  }
  const resolvedMode = activeMode || (video && !change ? "video" : link && /asset_manifest\s*:/i.test(link) ? "video" : "image");
  button.dataset.activeMode = resolvedMode;
  if (!button.hasAttribute("data-loading")) {
    button.textContent = resolvedMode === "video" ? "\u751F\u6210\u89C6\u9891" : "\u751F\u6210\u56FE\u7247";
  }
  if (imageUrl) {
    createAndShowImage(imgSpan, imageUrl, imageAlt, button, change, isVideo, originalUrl, video, resolvedMode);
    if (settings3.dbclike === "true") {
      button.style.setProperty("display", "none", "important");
    }
  } else if (isGenerating(link)) {
    console.log("[iframe] \u56FE\u50CF\u6B63\u5728\u751F\u6210\u4E2D\uFF0C\u6302\u8F7D\u76D1\u542C\u72B6\u6001:", button);
    triggerGeneration(button, true);
  } else if (shouldAutoClickBatch) {
  }
}

function isButtonEligibleForAutoClick(button) {
  if (!button) return false;
  const isPermanent = String(extension_settings[extensionName]?.zidongdianji2) === "true";
  if (!window.zidongdianji && !isPermanent) {
    return false;
  }
  const reqId = button.dataset.requestId;
  const link = button.dataset.link || "";
  const promptMd5 = getPromptMd5(link);
  if (button.style.display === "none") {
    return false;
  }
  const root = button.closest(".mes_text") || button.parentElement;
  if (root && reqId) {
    const span = root.querySelector(`span[data-request-id="${reqId}"]`);
    if (span && span.querySelector("img, video, .st-chatu8-video-fallback")) {
      return false;
    }
  }
  if (button.dataset.autoClickHandled === "true" || button.hasAttribute("data-loading")) {
    return false;
  }
  if (link && isGenerating(link)) {
    return false;
  }
  if (promptMd5 && handledAutoClickPromptMd5s.has(promptMd5)) {
    return false;
  }
  if (reqId && handledAutoClickRequestIds.has(reqId)) {
    return false;
  }
  if (!isPermanent) {
    const createdAt = Number(button.dataset.createdAt || 0);
    const triggerStartTime = Number(window.zidongdianjiStartTime || 0);
    const now = Date.now();
    if (triggerStartTime <= 0 || now - triggerStartTime > 15e3) {
      return false;
    }
    if (createdAt <= 0 || now - createdAt > 6e4) {
      return false;
    }
    if (createdAt < triggerStartTime - 15e3) {
      return false;
    }
  }
  return true;
}

async function tryMountImageFromDB(button, span, settings3, imageAlt = "Generated Image") {
  if (!button || !span) return false;
  if (span.querySelector("img, video, .st-chatu8-video-fallback")) {
    return true;
  }
  const link = button.dataset.link;
  if (!link) return false;
  try {
    const [imageUrl, change, , isVideo, originalUrl, video, activeMode] = await getItemImg(link);
    if (change) {
      button.dataset.change = change;
    }
    if (video) {
      button.dataset.video = video;
    }
    const resolvedMode = activeMode || (video && !change ? "video" : link && /asset_manifest\s*:/i.test(link) ? "video" : "image");
    button.dataset.activeMode = resolvedMode;
    if (!button.hasAttribute("data-loading")) {
      button.textContent = resolvedMode === "video" ? "\u751F\u6210\u89C6\u9891" : "\u751F\u6210\u56FE\u7247";
    }
    if (imageUrl) {
      createAndShowImage(span, imageUrl, imageAlt, button, change, isVideo, originalUrl, video, resolvedMode);
      if (settings3?.dbclike === "true") {
        button.style.setProperty("display", "none", "important");
      }
      return true;
    } else if (isGenerating(link)) {
      triggerGeneration(button, true);
    }
  } catch (e) {
    console.warn("[iframe] tryMountImageFromDB \u5C1D\u8BD5\u52A0\u8F7D\u56FE\u7247\u51FA\u9519:", link?.substring(0, 40), e);
  }
  return false;
}

async function findAndReplaceInElement(rootElement, imageAlt = "Generated Image", taskId = null) {
  if (!rootElement) {
    return;
  }
  const notifyAutoClick = (success = true) => {
    if (taskId) {
      eventSource.emit("st_chatu8_auto_click_complete", {
        taskId,
        success
      });
      console.log("[iframe] \u81EA\u52A8\u70B9\u51FB\u4EFB\u52A1\u5DF2\u901A\u77E5\u5B8C\u6210, taskId:", taskId, "success:", success);
    }
  };
  const settings3 = extension_settings[extensionName];
  let isEditedContentReprocess = false;
  if (rootElement.dataset && rootElement.dataset.chatu8Processed === "true") {
    const anyButton = rootElement.querySelector("button.image-tag-button");
    if (anyButton) {
      const allButtons = Array.from(rootElement.querySelectorAll("button.image-tag-button"));
      const mountPromises = [];
      for (const btn of allButtons) {
        const requestId = btn.dataset.requestId;
        const span = rootElement.querySelector(`span[data-request-id="${requestId}"]`);
        if (span && !span.querySelector("img, video, .st-chatu8-video-fallback")) {
          mountPromises.push(tryMountImageFromDB(btn, span, settings3, imageAlt));
        }
      }
      if (mountPromises.length > 0) {
        await Promise.all(mountPromises);
      }
      const isPermanent2 = String(extension_settings[extensionName]?.zidongdianji2) === "true";
      const isAutoClickEnabled2 = String(settings3?.zidongdianji) === "true";
      const shouldAutoClickExisting = isAutoClickEnabled2 && (window.zidongdianji || isPermanent2);
      if (shouldAutoClickExisting) {
        const eligibleButtons = allButtons.filter((btn) => {
          if (!isButtonEligibleForAutoClick(btn)) return false;
          const reqId = btn.dataset.requestId;
          const span = rootElement.querySelector(`span[data-request-id="${reqId}"]`);
          if (span && span.querySelector("img, video, .st-chatu8-video-fallback")) {
            return false;
          }
          return true;
        });
        if (eligibleButtons.length > 0) {
          console.log("[iframe] \u81EA\u52A8\u70B9\u51FB\u5BF9\u5143\u7D20\u4E2D\u65B0\u6309\u94AE\u9519\u5CF0\u89E6\u53D1\u751F\u6210\uFF0C\u6570\u91CF:", eligibleButtons.length);
          for (let i = 0; i < eligibleButtons.length; i++) {
            if (String(extension_settings[extensionName]?.zidongdianji2) !== "true" && !window.zidongdianji) {
              console.log("[iframe] \u81EA\u52A8\u70B9\u51FB\u7A97\u53E3\u5DF2\u5173\u95ED\uFF0C\u505C\u6B62\u7EE7\u7EED\u89E6\u53D1");
              break;
            }
            const btn = eligibleButtons[i];
            const reqId = btn.dataset.requestId;
            const link = btn.dataset.link || "";
            const promptMd5 = getPromptMd5(link);
            if (promptMd5) {
              handledAutoClickPromptMd5s.add(promptMd5);
            }
            if (reqId) {
              handledAutoClickRequestIds.add(reqId);
            }
            btn.dataset.autoClickHandled = "true";
            triggerGeneration(btn);
            if (i < eligibleButtons.length - 1) {
              const clickInterval = Math.max(100, Math.min(500, parseInt(extension_settings[extensionName]?.imageGenInterval, 10) || 300));
              await sleep(clickInterval);
            }
          }
          if (String(extension_settings[extensionName]?.zidongdianji2) !== "true") {
            deactivateAutoClickWindow();
          }
        }
      }
      notifyAutoClick(true);
      return;
    } else {
      console.log("[iframe] Element marked processed but no buttons found, re-processing");
      delete rootElement.dataset.chatu8Processed;
      delete rootElement.dataset.chatu8ContentLength;
    }
  }
  const loadingButton = rootElement.querySelector('button.image-tag-button[data-loading="true"]');
  if (loadingButton) {
    const startedAt = Number(loadingButton.dataset.loadingStartedAt || 0);
    const btnLink = loadingButton.dataset.link || loadingButton.dataset.imageTag;
    const generating = btnLink ? isGenerating(btnLink) : false;
    const maxTimeoutMs = Math.max(18e5, (parseInt(settings3?.comfyui_timeout, 10) || 1800) * 1e3);
    const isStale = !generating && startedAt > 0 && Date.now() - startedAt > 1e4 || startedAt > 0 && Date.now() - startedAt > maxTimeoutMs;
    if (isStale) {
      console.warn("[iframe] \u68C0\u6D4B\u5230\u9648\u65E7 loading \u6B7B\u9501\u6309\u94AE\uFF0C\u81EA\u52A8\u590D\u4F4D\u81EA\u6108:", btnLink);
      loadingButton.removeAttribute("data-loading");
      delete loadingButton.dataset.loadingStartedAt;
      loadingButton.disabled = false;
      const bMode = loadingButton.dataset.activeMode || "image";
      loadingButton.textContent = bMode === "video" ? "\u751F\u6210\u89C6\u9891" : "\u751F\u6210\u56FE\u7247";
    } else {
      console.log("[iframe] Element has loading button, skipping processing");
      notifyAutoClick(true);
      return;
    }
  }
  if (!settings3.startTag || !settings3.endTag) {
    console.warn("[iframe] startTag or endTag is empty, skipping placeholder processing");
    notifyAutoClick(false);
    return;
  }
  const escapeRegExp2 = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };
  const pattern = new RegExp(`${escapeRegExp2(settings3.startTag)}([\\s\\S]*?)${escapeRegExp2(settings3.endTag)}`, "g");
  const doc = rootElement.ownerDocument || rootElement;
  const firstDirectDiv = rootElement.querySelector(":scope > div");
  if (firstDirectDiv) {
  }
  let firstDivStartOffset = -1;
  let firstDivEndOffset = -1;
  const nodeInfos = [];
  let logicalText = "";
  const CODE_RELATED_TAGS = /* @__PURE__ */ new Set([
    "SCRIPT",
    "STYLE",
    "BUTTON",
    "PRE",
    "CODE",
    // 代码块
    "TEXTAREA",
    // 输入框
    "KBD",
    "SAMP",
    "VAR"
    // 键盘输入、示例输出、变量
  ]);
  const CODE_CLASS_PATTERNS = ["hljs", "highlight", "prism", "language-", "CodeMirror", "ace_"];
  const walker = doc.createTreeWalker(rootElement, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
    acceptNode: function(node) {
      const parent = node.parentElement;
      const parentTag = parent?.tagName;
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== "BR") {
        return NodeFilter.FILTER_SKIP;
      }
      if (CODE_RELATED_TAGS.has(parentTag)) {
        return NodeFilter.FILTER_REJECT;
      }
      if (parent?.classList.contains("image-tag-button") || parent?.classList.contains("st-chatu8-image-span")) {
        return NodeFilter.FILTER_REJECT;
      }
      if (parent?.className && typeof parent.className === "string") {
        for (const pattern2 of CODE_CLASS_PATTERNS) {
          if (parent.className.includes(pattern2)) {
            return NodeFilter.FILTER_REJECT;
          }
        }
      }
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  let n;
  while (n = walker.nextNode()) {
    const start = logicalText.length;
    let text = "";
    if (n.nodeType === Node.TEXT_NODE) {
      text = n.textContent;
    } else if (n.tagName === "BR") {
      text = "\n";
    }
    if (firstDirectDiv && text.length > 0) {
      const isInFirstDiv = n === firstDirectDiv || firstDirectDiv.contains(n);
      if (isInFirstDiv) {
        if (firstDivStartOffset === -1) {
          firstDivStartOffset = start;
        }
        firstDivEndOffset = start + text.length;
      }
    }
    logicalText += text;
    nodeInfos.push({ node: n, start, end: logicalText.length });
  }
  let logicalTextExcludingFirstDiv = logicalText;
  if (firstDirectDiv && firstDivStartOffset !== -1 && firstDivEndOffset > firstDivStartOffset) {
    const beforeDiv = logicalText.substring(0, firstDivStartOffset);
    const afterDiv = logicalText.substring(firstDivEndOffset);
    logicalTextExcludingFirstDiv = beforeDiv + afterDiv;
  }
  const patternMatches = [];
  let match;
  while ((match = pattern.exec(logicalText)) !== null) {
    patternMatches.push({
      fullMatch: match[0],
      content: match[1],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      isPatternMatch: true
      // 标记为 pattern 匹配，需要替换原文本
    });
  }
  const savedMatches = await getSavedImageMatches(logicalText, rootElement, logicalTextExcludingFirstDiv, firstDivEndOffset > 0 ? firstDivEndOffset : 0);
  if (patternMatches.length === 0 && savedMatches.length === 0) {
    notifyAutoClick(true);
    return;
  }
  const isPermanent = String(extension_settings[extensionName]?.zidongdianji2) === "true";
  const isAutoClickEnabled = String(settings3?.zidongdianji) === "true";
  const shouldAutoClickBatch = isAutoClickEnabled && (window.zidongdianji || isPermanent);
  const clickPromises = [];
  const buttonsToAutoClick = [];
  const sortedSavedMatches = [...savedMatches].sort((a, b) => b.insertPosition - a.insertPosition);
  for (const savedMatch of sortedSavedMatches) {
    const promise = createButtonAtPosition(
      savedMatch.insertPosition,
      savedMatch.content,
      nodeInfos,
      doc,
      rootElement,
      settings3,
      shouldAutoClickBatch,
      // 非插入原文模式也支持自动点击
      imageAlt
    );
    clickPromises.push(promise);
  }
  for (let i = patternMatches.length - 1; i >= 0; i--) {
    const matchInfo = patternMatches[i];
    const nodesToProcess = nodeInfos.filter(
      (info) => matchInfo.startIndex < info.end && matchInfo.endIndex > info.start
    );
    if (nodesToProcess.length === 0) continue;
    const firstNodeInfo = nodesToProcess[0];
    const lastNodeInfo = nodesToProcess[nodesToProcess.length - 1];
    const parent = firstNodeInfo.node.parentNode;
    const range = doc.createRange();
    try {
      const startOffset = matchInfo.startIndex - firstNodeInfo.start;
      if (firstNodeInfo.node.nodeType === Node.TEXT_NODE) {
        const startTextLength = firstNodeInfo.node.textContent?.length ?? 0;
        if (startTextLength === 0 || startOffset > startTextLength) {
          console.warn("[iframe] StartOffset out of bounds:", { startOffset, startTextLength, matchInfo });
          continue;
        }
        range.setStart(firstNodeInfo.node, startOffset);
      } else {
        range.setStartBefore(firstNodeInfo.node);
      }
      const endNode = lastNodeInfo.node;
      const endOffset = matchInfo.endIndex - lastNodeInfo.start;
      if (endNode.nodeType === Node.TEXT_NODE) {
        const textLength = endNode.textContent?.length ?? 0;
        if (textLength === 0 || endOffset > textLength) {
          console.warn("[iframe] EndOffset out of bounds:", { endOffset, textLength, matchInfo });
          continue;
        }
        range.setEnd(endNode, endOffset);
      } else {
        range.setEndAfter(endNode);
      }
    } catch (e) {
      console.error("st-chatu8: Error setting range. Skipping match.", e, matchInfo);
      continue;
    }
    range.deleteContents();
    const link = normalizePromptTag(matchInfo.content);
    const requestId = generateStableId(link);
    const tagInsertedMarker = `tag-inserted-${requestId}`;
    const tagMarkerAttr = `data-${tagInsertedMarker}`;
    if (rootElement.hasAttribute && rootElement.hasAttribute(tagMarkerAttr)) {
      const existingBtn2 = rootElement.querySelector(`button.image-tag-button[data-link="${CSS.escape(link)}"]`);
      if (existingBtn2) {
        console.log("[iframe] Tag already inserted with button, skipping:", link.substring(0, 50));
        continue;
      } else {
        console.log("[iframe] Tag marker exists but button missing, re-inserting:", link.substring(0, 50));
        rootElement.removeAttribute(tagMarkerAttr);
      }
    }
    const existingBtn = rootElement.querySelector(`button.image-tag-button[data-link="${CSS.escape(link)}"]`);
    if (existingBtn) {
      console.log("[iframe] Button already exists, skipping:", link.substring(0, 50), "loading:", existingBtn.hasAttribute("data-loading"));
      if (rootElement.setAttribute) {
        rootElement.setAttribute(tagMarkerAttr, "true");
      }
      continue;
    }
    if (rootElement.setAttribute) {
      rootElement.setAttribute(tagMarkerAttr, "true");
    }
    const button = doc.createElement("button");
    button.className = "image-tag-button st-chatu8-image-button";
    button.textContent = "\u751F\u6210\u56FE\u7247";
    button.dataset.link = link;
    button.dataset.requestId = requestId;
    button.dataset.imageTag = link;
    button.dataset.createdAt = String(Date.now());
    let pressTimer = null;
    let isLongPress2 = false;
    const longPressThreshold = 1200;
    const handlePressStart = (e) => {
      if (e.type === "mousedown" && e.button !== 0) return;
      isLongPress2 = false;
      pressTimer = setTimeout(() => {
        isLongPress2 = true;
        pressTimer = null;
        e.preventDefault();
        if (extension_settings[extensionName].longPressToEdit == "true") {
          showEditDialog(null, button);
        }
      }, longPressThreshold);
    };
    const handlePressEnd = () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    };
    button.addEventListener("click", (e) => {
      if (isLongPress2) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      e.preventDefault();
      triggerGeneration(button);
    });
    button.addEventListener("mousedown", handlePressStart);
    button.addEventListener("mouseup", handlePressEnd);
    button.addEventListener("mouseleave", handlePressEnd);
    button.addEventListener("touchstart", handlePressStart);
    button.addEventListener("touchend", handlePressEnd);
    button.addEventListener("touchcancel", handlePressEnd);
    const imgSpan = doc.createElement("span");
    imgSpan.className = "st-chatu8-image-span";
    imgSpan.dataset.requestId = requestId;
    range.insertNode(imgSpan);
    range.insertNode(button);
    const promise = (async () => {
      const [imageUrl, change, , isVideo, originalUrl, video, activeMode] = await getItemImg(link);
      if (change) {
        button.dataset.change = change;
      }
      if (video) {
        button.dataset.video = video;
      }
      const resolvedMode = activeMode || (video && !change ? "video" : link && /asset_manifest\s*:/i.test(link) ? "video" : "image");
      button.dataset.activeMode = resolvedMode;
      if (!button.hasAttribute("data-loading")) {
        button.textContent = resolvedMode === "video" ? "\u751F\u6210\u89C6\u9891" : "\u751F\u6210\u56FE\u7247";
      }
      if (imageUrl) {
        createAndShowImage(imgSpan, imageUrl, imageAlt, button, change, isVideo, originalUrl, video, resolvedMode);
        if (extension_settings[extensionName].dbclike === "true") {
          button.style.setProperty("display", "none", "important");
        }
      } else if (isGenerating(link)) {
        console.log("[iframe] \u56FE\u50CF\u6B63\u5728\u751F\u6210\u4E2D\uFF0C\u6302\u8F7D\u76D1\u542C\u72B6\u6001:", button);
        triggerGeneration(button, true);
      } else if (shouldAutoClickBatch) {
        buttonsToAutoClick.unshift(button);
      }
    })();
    clickPromises.push(promise);
  }
  Promise.all(clickPromises).then(async () => {
    if (shouldAutoClickBatch) {
      const buttonsInOrder = Array.from(rootElement.querySelectorAll("button.image-tag-button")).filter(isButtonEligibleForAutoClick);
      if (buttonsInOrder.length > 0) {
        console.log("[iframe] \u6309 DOM \u81EA\u7136\u6B63\u5E8F\uFF08\u4ECE\u4E0A\u5230\u4E0B\uFF09\u9519\u5CF0\u89E6\u53D1\u81EA\u52A8\u751F\u6210\uFF0C\u6309\u94AE\u6570\u91CF:", buttonsInOrder.length);
        for (let i = 0; i < buttonsInOrder.length; i++) {
          if (String(extension_settings[extensionName]?.zidongdianji2) !== "true" && !window.zidongdianji) {
            console.log("[iframe] \u81EA\u52A8\u70B9\u51FB\u7A97\u53E3\u5DF2\u5173\u95ED\uFF0C\u505C\u6B62\u7EE7\u7EED\u89E6\u53D1");
            break;
          }
          const btn = buttonsInOrder[i];
          const reqId = btn.dataset.requestId;
          const link = btn.dataset.link || "";
          const promptMd5 = getPromptMd5(link);
          if (promptMd5) {
            handledAutoClickPromptMd5s.add(promptMd5);
          }
          if (reqId) {
            handledAutoClickRequestIds.add(reqId);
          }
          console.log(`[iframe] \u81EA\u52A8\u70B9\u51FB\u89E6\u53D1\u751F\u6210 #${i + 1} (\u6B63\u5E8F):`, btn);
          btn.dataset.autoClickHandled = "true";
          triggerGeneration(btn);
          if (i < buttonsInOrder.length - 1) {
            const clickInterval = Math.max(100, Math.min(500, parseInt(extension_settings[extensionName]?.imageGenInterval, 10) || 300));
            await sleep(clickInterval);
          }
        }
        if (String(extension_settings[extensionName]?.zidongdianji2) !== "true") {
          deactivateAutoClickWindow();
        }
      }
    }
    if (taskId) {
      eventSource.emit("st_chatu8_auto_click_complete", {
        taskId,
        success: true
      });
      console.log("[iframe] \u81EA\u52A8\u70B9\u51FB\u4EFB\u52A1\u5DF2\u5B8C\u6210, taskId:", taskId);
    }
  }).catch((err) => {
    console.error("[iframe] \u5904\u7406\u5360\u4F4D\u7B26\u6309\u94AE\u51FA\u73B0\u9519\u8BEF:", err);
    if (taskId) {
      eventSource.emit("st_chatu8_auto_click_complete", {
        taskId,
        success: false
      });
      console.log("[iframe] \u81EA\u52A8\u70B9\u51FB\u4EFB\u52A1\u5F02\u5E38\u7ED3\u675F\u901A\u77E5\u5DF2\u53D1\u51FA, taskId:", taskId);
    }
  });
  if (rootElement.dataset) {
    rootElement.dataset.chatu8Processed = "true";
    rootElement.dataset.chatu8ContentLength = String(rootElement.textContent?.length || 0);
  }
}

export { clearHandledAutoClickCache, findAndReplaceInElement, registerAutoClickHandled };
