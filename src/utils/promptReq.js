// 还原自打包产物 — 原始模块: utils/promptReq.js
import { extension_settings } from "../../../../../extensions.js";
import { getContext } from "../../../../../st-context.js";
import { extensionName } from "./config.js";
import { addLog, clampPopupToViewport, isMobileDeviceDialog, removeThinkingTags } from "./utils.js";
import { taskQueue_exports } from "./generation_status.js";
import { insertImagesIntoElement, parseImagesFromPrompt } from "./imageInserter.js";
import { debugBranch, debugError, debugLog, debugMilestone, debugTimer } from "./debugLogger.js";
import { getElContext } from "./chatDataUtils.js";
import { processWorldBooksWithTrigger } from "./worldbookProcessor.js";
import { mergeAdjacentMessages, replaceAllPlaceholders } from "./promptProcessor.js";
import { buildPromptForRequestType, getMergeOptionsForRequestType } from "./settings/llmService.js";
import { updateCombinedPrompt } from "./settings/llmUi.js";
import { generateCharacterListText, generateCommonCharacterListText, generateOutfitEnableListText, getCommonCharacterImages, getEnabledCharacterImages, getEnabledOutfitImages } from "./settings/worldbook.js";
import { updateItemImgActiveMode, updateItemImgVideo } from "./database.js";
import { LLM_IMAGE_GEN, LLM_VIDEO_GEN, LLM_VISUAL_MAT_PREP } from "./llmRequest.js";
import { openVideoAssetPicker } from "./settings/videoAssetPicker.js";
import { parseVideosFromPrompt } from "./videoInserter.js";
import { iframe_exports } from "./iframe.js";
import "./settings/llm.js"; // init_llm



function buildParseFailureToastInfo(text, requestType) {
  const source = typeof text === "string" ? text.trim() : "";
  const isVideo = requestType === "visual_mat_prep";
  const typeName = isVideo ? "\u89C6\u9891" : "\u56FE\u7247";
  const containerTag = isVideo ? "<Videos>" : "<images>";
  const itemTagOpen = isVideo ? "<Video>" : "<image>";
  const itemTagClose = isVideo ? "</Video>" : "</image>";
  if (!source) {
    return {
      level: "warning",
      title: `${typeName}\u6807\u7B7E\u89E3\u6790\u5931\u8D25`,
      message: "LLM \u6CA1\u6709\u8FD4\u56DE\u4EFB\u4F55\u53EF\u89E3\u6790\u6587\u672C\u3002\u672C\u6B21\u8BF7\u6C42\u50CF\u662F\u7A7A\u54CD\u5E94\u3001\u8D85\u65F6\u6216\u88AB\u4E2D\u65AD\uFF0C\u8BF7\u91CD\u8BD5\u5E76\u68C0\u67E5\u63A5\u53E3\u72B6\u6001\u3002"
    };
  }
  if (/(处理中|正在处理|处理中\.{0,3}|请稍候|请稍等|稍后|生成中|正在生成|排队中|队列中|任务已提交|processing|please\s+wait|pending|queued|generating|working)/i.test(source)) {
    return {
      level: "info",
      title: "LLM \u4ECD\u5728\u5904\u7406\u4E2D",
      message: `LLM \u5F53\u524D\u8FD4\u56DE\u7684\u662F\u201C\u5904\u7406\u4E2D/\u751F\u6210\u4E2D\u201D\u7684\u4E2D\u95F4\u6001\u6587\u672C\uFF0C\u8FD8\u4E0D\u662F\u6700\u7EC8${typeName}\u6807\u7B7E\u7ED3\u679C\u3002\u8BF7\u7B49\u5F85\u5B8C\u6210\u540E\u91CD\u8BD5\uFF0C\u6216\u68C0\u67E5\u63A5\u53E3\u662F\u5426\u652F\u6301\u8F6E\u8BE2\u6700\u7EC8\u7ED3\u679C\u3002`
    };
  }
  if (isVideo) {
    const hasNewVideoContainer = /<videos>/i.test(source);
    const newVideoBlocks = [...source.matchAll(/<video\b[^>]*>([\s\S]*?)<\/video>/gi)];
    if (hasNewVideoContainer && newVideoBlocks.length === 0) {
      return {
        level: "warning",
        title: "\u89C6\u9891\u6807\u7B7E\u683C\u5F0F\u4E0D\u5B8C\u6574",
        message: "LLM \u8FD4\u56DE\u4E86 <videos> \u5BB9\u5668\uFF0C\u4F46\u5185\u90E8\u672A\u68C0\u6D4B\u5230\u6709\u6548\u7684 <video>...</video> \u5757\u3002\u8BF7\u68C0\u67E5\u63D0\u793A\u8BCD\u8F93\u51FA\u683C\u5F0F\u3002"
      };
    }
    if (newVideoBlocks.length > 0) {
      const missingAnchorCount = newVideoBlocks.filter((m) => {
        const inner = m[1] || "";
        return !/(?:source_anchor|sourceAnchor|source-anchor|定位锚点|锚点)\s*[:：]/i.test(inner) && !/<SourceAnchor>/i.test(inner);
      }).length;
      if (missingAnchorCount > 0) {
        return {
          level: "warning",
          title: "\u89C6\u9891\u7F3A\u5C11\u5B9A\u4F4D\u951A\u70B9",
          message: `\u68C0\u6D4B\u5230 ${newVideoBlocks.length} \u4E2A <video> \u5757\uFF0C\u4F46\u6709 ${missingAnchorCount} \u4E2A\u7F3A\u5C11 source_anchor \u5B9A\u4F4D\u951A\u70B9\uFF0C\u65E0\u6CD5\u5B9A\u4F4D\u63D2\u5165\u4F4D\u7F6E\u3002`
        };
      }
      return {
        level: "warning",
        title: "\u89C6\u9891\u6807\u7B7E\u89E3\u6790\u5F02\u5E38",
        message: `\u68C0\u6D4B\u5230 ${newVideoBlocks.length} \u4E2A <video> \u5757\uFF0C\u4F46\u672A\u80FD\u6210\u529F\u751F\u6210\u63D2\u5165\u6807\u7B7E\u3002\u8BF7\u68C0\u67E5 video \u5185\u90E8\u63D0\u793A\u8BCD\u5185\u5BB9\u662F\u5426\u5B8C\u6574\u3002`
      };
    }
    const isYamlLike = /(?:^|\n)\s*videos\s*:/i.test(source) || /```(?:yaml)?\s*[\s\S]*?(?:videos|clip_)/i.test(source) || /(?:^|\n)\s*-\s+id:\s*clip_/i.test(source);
    if (isYamlLike) {
      const hasClips = /(?:^|\n)\s*-\s+id\s*:/i.test(source);
      const hasAnchor = /(?:source_anchor|sourceAnchor|source-anchor)\s*:/i.test(source);
      if (!hasClips) {
        return {
          level: "warning",
          title: "\u89C6\u9891\u914D\u7F6E\u683C\u5F0F\u4E0D\u5B8C\u6574",
          message: "LLM \u8FD4\u56DE\u4E86 videos \u5217\u8868\u7ED3\u6784\uFF0C\u4F46\u6CA1\u6709\u68C0\u6D4B\u5230\u6709\u6548\u7684 - id: \u89C6\u9891\u7247\u6BB5\u3002\u8BF7\u68C0\u67E5\u63D0\u793A\u8BCD\u8F93\u51FA\u683C\u5F0F\u3002"
        };
      }
      if (!hasAnchor) {
        return {
          level: "warning",
          title: "\u89C6\u9891\u7F3A\u5C11\u5B9A\u4F4D\u951A\u70B9",
          message: "\u68C0\u6D4B\u5230\u4E86 YAML \u89C6\u9891\u7247\u6BB5\uFF0C\u4F46\u7F3A\u5C11 source_anchor \u5B9A\u4F4D\u5B57\u6BB5\uFF0C\u65E0\u6CD5\u5B9A\u4F4D\u63D2\u5165\u4F4D\u7F6E\u3002\u8BF7\u68C0\u67E5 LLM \u8F93\u51FA\u662F\u5426\u5305\u542B source_anchor\u3002"
        };
      }
      return {
        level: "warning",
        title: "\u89C6\u9891 YAML \u89E3\u6790\u5931\u8D25",
        message: "\u68C0\u6D4B\u5230 YAML \u89C6\u9891\u914D\u7F6E\uFF0C\u4F46\u672A\u80FD\u6210\u529F\u89E3\u6790\u51FA\u6709\u6548\u7247\u6BB5\u3002\u8BF7\u68C0\u67E5\u7F29\u8FDB\u6216 YAML \u8BED\u6CD5\u662F\u5426\u6B63\u786E\u3002"
      };
    }
    return {
      level: "warning",
      title: "\u672A\u627E\u5230\u89C6\u9891\u914D\u7F6E",
      message: "LLM \u8FD4\u56DE\u5185\u5BB9\u4E2D\u6CA1\u6709\u627E\u5230\u6709\u6548\u7684 <videos>/<video> \u6807\u7B7E\u6216 YAML videos \u5217\u8868\uFF0C\u65E0\u6CD5\u89E3\u6790\u89C6\u9891\u6570\u636E\u3002"
    };
  }
  const containerRegex = /<images>/i;
  const hasContainerBlock = containerRegex.test(source);
  const itemRegex = /<image>([\s\S]*?)<\/image>/gi;
  const itemBlocks = [...source.matchAll(itemRegex)];
  if (hasContainerBlock && itemBlocks.length === 0) {
    return {
      level: "warning",
      title: "\u56FE\u7247\u6807\u7B7E\u683C\u5F0F\u4E0D\u5B8C\u6574",
      message: "LLM \u8FD4\u56DE\u4E86 <images> \u5BB9\u5668\uFF0C\u4F46\u91CC\u9762\u6CA1\u6709\u6709\u6548\u7684 <image> \u5757\u3002\u8BF7\u68C0\u67E5\u63D0\u793A\u8BCD\u662F\u5426\u8981\u6C42\u8F93\u51FA\u5B8C\u6574\u7684 <image>...</image> \u7ED3\u6784\u3002"
    };
  }
  if (!hasContainerBlock && itemBlocks.length === 0) {
    return {
      level: "warning",
      title: "\u672A\u627E\u5230\u56FE\u7247\u6807\u7B7E",
      message: "LLM \u8FD4\u56DE\u5185\u5BB9\u4E2D\u6CA1\u6709 <images> \u6216 <image> \u6807\u7B7E\uFF0C\u56E0\u6B64\u65E0\u6CD5\u89E3\u6790\u56FE\u7247\u6570\u636E\u3002\u901A\u5E38\u662F\u6A21\u578B\u6CA1\u6709\u6309\u7EA6\u5B9A\u683C\u5F0F\u8F93\u51FA\u3002"
    };
  }
  const missingRegexCount = itemBlocks.filter((match) => !/regex\s*:/i.test(match[1] || "")).length;
  const missingTagCount = itemBlocks.filter((match) => !/image###/i.test(match[1] || "")).length;
  if (missingRegexCount > 0 || missingTagCount > 0) {
    const parts = [];
    if (missingRegexCount > 0) {
      parts.push(`${missingRegexCount} \u4E2A <image> \u7F3A\u5C11 regex: \u5B9A\u4F4D\u884C`);
    }
    if (missingTagCount > 0) {
      parts.push(`${missingTagCount} \u4E2A <image> \u7F3A\u5C11 image### \u6807\u7B7E\u5185\u5BB9`);
    }
    return {
      level: "warning",
      title: "\u56FE\u7247\u6807\u7B7E\u683C\u5F0F\u9519\u8BEF",
      message: `\u68C0\u6D4B\u5230 ${itemBlocks.length} \u4E2A <image> \u5757\uFF0C\u4F46\u683C\u5F0F\u4E0D\u5B8C\u6574\uFF1A${parts.join("\uFF1B")}\u3002\u8BF7\u68C0\u67E5 LLM \u8F93\u51FA\u662F\u5426\u540C\u65F6\u5305\u542B regex: \u548C image###...###\u3002`
    };
  }
  return {
    level: "warning",
    title: `${typeName}\u6807\u7B7E\u89E3\u6790\u5931\u8D25`,
    message: `\u68C0\u6D4B\u5230\u4E86${typeName}\u76F8\u5173\u6587\u672C\uFF0C\u4F46\u6700\u7EC8\u6CA1\u6709\u89E3\u6790\u51FA\u6709\u6548${typeName}\u6570\u636E\u3002\u8BF7\u68C0\u67E5 LLM \u8F93\u51FA\u7ED3\u6784\u662F\u5426\u5B8C\u6574\u3002`
  };
}

function ensureVideoDemandAssetStyles(doc) {
  const styleId = "st-chatu8-video-demand-assets-style";
  if (doc.getElementById(styleId)) return;
  const style = doc.createElement("style");
  style.id = styleId;
  style.textContent = `
    .st-chatu8-video-demand-assets { margin-top: 12px; min-width: 0; }
    .st-chatu8-video-demand-assets-title { margin-bottom: 8px; color: var(--st-chatu8-text-secondary, #b7acc7); font-size: 12px; }
    .st-chatu8-video-demand-assets-list { display: flex; gap: 10px; overflow-x: auto; overflow-y: hidden; padding: 2px 2px 10px; scroll-snap-type: x proximity; scrollbar-width: thin; }
    .st-chatu8-video-demand-asset-card { position: relative; flex: 0 0 118px; height: 142px; padding: 8px; box-sizing: border-box; border: 1px solid var(--st-chatu8-border-color, #51446f); border-radius: 9px; background: var(--st-chatu8-bg-secondary, #211c31); color: var(--st-chatu8-text-primary, #eee); cursor: pointer; scroll-snap-align: start; text-align: left; overflow: hidden; }
    .st-chatu8-video-demand-asset-card:hover { border-color: var(--st-chatu8-accent-primary, #a855f7); }
    .st-chatu8-video-demand-asset-card.locked { cursor: default; border-color: var(--st-chatu8-accent-primary, #8b5cf6); }
    .st-chatu8-video-demand-asset-label { display: flex; justify-content: space-between; align-items: center; gap: 4px; height: 20px; margin-bottom: 6px; font-size: 11px; font-weight: 700; }
    .st-chatu8-video-demand-asset-badge { opacity: .65; font-size: 10px; font-weight: 500; }
    .st-chatu8-video-demand-asset-preview { width: 100%; height: 82px; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 6px; background: rgba(0,0,0,.24); color: var(--st-chatu8-text-secondary, #9388a7); font-size: 11px; text-align: center; }
    .st-chatu8-video-demand-asset-preview img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .st-chatu8-video-demand-asset-name { margin-top: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px; opacity: .9; }
    .st-chatu8-video-demand-asset-clear { position: absolute; top: 5px; right: 5px; width: 20px; height: 20px; padding: 0; border: 0; border-radius: 50%; background: rgba(0,0,0,.72); color: #fff; cursor: pointer; line-height: 20px; text-align: center; }
    @media (max-width: 768px) {
      .st-chatu8-video-demand-asset-card { flex-basis: 104px; height: 132px; }
      .st-chatu8-video-demand-asset-preview { height: 72px; }
    }
    `;
  doc.head.appendChild(style);
}

function setupVideoDemandAssetSection(section, firstFrameSrc, selectedImages3) {
  ensureVideoDemandAssetStyles(document);
  section.replaceChildren();
  section.className = "st-chatu8-video-demand-assets";
  const selectedBySlot = /* @__PURE__ */ new Map();
  const heading = document.createElement("div");
  heading.className = "st-chatu8-video-demand-assets-title";
  heading.textContent = "\u9996\u5E27\u5DF2\u9501\u5B9A\uFF1B\u53EF\u9009\u89C6\u9891\u8D44\u4EA7 2\uFF5E9";
  const list = document.createElement("div");
  list.className = "st-chatu8-video-demand-assets-list";
  const syncResult = () => {
    selectedImages3.splice(0, selectedImages3.length, ...[...selectedBySlot.values()].sort((a, b) => a.pictureIndex - b.pictureIndex));
  };
  const render2 = () => {
    list.replaceChildren();
    for (let pictureIndex = 1; pictureIndex <= 9; pictureIndex++) {
      const selected = selectedBySlot.get(pictureIndex);
      const card = document.createElement("div");
      card.className = "st-chatu8-video-demand-asset-card";
      const label = document.createElement("div");
      label.className = "st-chatu8-video-demand-asset-label";
      const labelText = document.createElement("span");
      labelText.textContent = `<Picture ${pictureIndex}>`;
      label.appendChild(labelText);
      const preview = document.createElement("div");
      preview.className = "st-chatu8-video-demand-asset-preview";
      const name = document.createElement("div");
      name.className = "st-chatu8-video-demand-asset-name";
      if (pictureIndex === 1) {
        card.classList.add("locked");
        card.setAttribute("aria-disabled", "true");
        const badge = document.createElement("span");
        badge.className = "st-chatu8-video-demand-asset-badge";
        badge.textContent = "\u9996\u5E27";
        label.appendChild(badge);
        if (firstFrameSrc) {
          const image = document.createElement("img");
          image.src = firstFrameSrc;
          image.alt = "\u9996\u5E27\u53C2\u8003\u56FE\u7247";
          preview.appendChild(image);
        } else {
          preview.textContent = "\u5F53\u524D\u56FE\u7247";
        }
        name.textContent = "\u9996\u5E27\u53C2\u8003\u56FE\u7247";
      } else if (selected) {
        const image = document.createElement("img");
        image.src = selected.base64;
        image.alt = selected.name || `Picture ${pictureIndex}`;
        preview.appendChild(image);
        name.textContent = selected.name || `\u89C6\u9891\u8D44\u4EA7 ${pictureIndex}`;
        const clear2 = document.createElement("button");
        clear2.type = "button";
        clear2.className = "st-chatu8-video-demand-asset-clear";
        clear2.title = "\u6E05\u9664\u6B64\u8D44\u4EA7";
        clear2.textContent = "\xD7";
        clear2.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          selectedBySlot.delete(pictureIndex);
          syncResult();
          render2();
        });
        card.appendChild(clear2);
      } else {
        preview.textContent = "+ \u9009\u62E9\u89C6\u9891\u8D44\u4EA7";
        name.textContent = "\u672A\u9009\u62E9";
      }
      card.append(label, preview, name);
      if (pictureIndex > 1) {
        card.setAttribute("role", "button");
        card.tabIndex = 0;
        card.addEventListener("click", () => {
          if (typeof openVideoAssetPicker !== "function") {
            toastr.error("\u89C6\u9891\u8D44\u4EA7\u9009\u62E9\u5668\u5C1A\u672A\u52A0\u8F7D");
            return;
          }
          openVideoAssetPicker({
            type: "img",
            title: `<i class="fa-solid fa-photo-film" style="color:#60a5fa"></i> \u4E3A &lt;Picture ${pictureIndex}&gt; \u9009\u62E9\u89C6\u9891\u8D44\u4EA7`,
            onSelect: (asset, imageBlob, dataUrl) => {
              if (!asset?.fileid || !dataUrl) {
                toastr.warning("\u8BE5\u89C6\u9891\u8D44\u4EA7\u7F3A\u5C11\u6709\u6548\u56FE\u7247\u6216 file_id");
                return;
              }
              selectedBySlot.set(pictureIndex, {
                base64: dataUrl,
                name: asset.name || `\u89C6\u9891\u8D44\u4EA7 ${pictureIndex}`,
                description: asset.description || "",
                fileid: asset.fileid,
                assetId: asset.id || "",
                pictureIndex
              });
              syncResult();
              render2();
            }
          });
        });
        card.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            card.click();
          }
        });
      }
      list.appendChild(card);
    }
  };
  render2();
  section.append(heading, list);
}

function showUserDemandPopup2(options = {}) {
  const {
    title: customTitle = "\u{1F5BC}\uFE0F \u8F93\u5165\u751F\u56FE\u9700\u6C42",
    hint: customHint = "\u8BF7\u63CF\u8FF0\u60A8\u5E0C\u671B\u751F\u6210\u7684\u56FE\u7247\u7684\u5177\u4F53\u9700\u6C42\uFF08\u53EF\u9009\uFF09",
    placeholder: customPlaceholder = "\u4F8B\u5982\uFF1A\u91CD\u70B9\u63CF\u7ED8\u573A\u666F\u6C1B\u56F4\uFF0C\u5149\u7EBF\u67D4\u548C...",
    defaultText = "",
    videoAssetMode = false,
    firstFrameSrc = ""
  } = options;
  return new Promise((resolve) => {
    const isMobile3 = isMobileDeviceDialog();
    const uploadedImages = [];
    let topOffset = 10;
    let maxHeight = "none";
    if (isMobile3) {
      const topSettingsHolder = document.querySelector("#top-settings-holder");
      if (topSettingsHolder) {
        const rect = topSettingsHolder.getBoundingClientRect();
        topOffset = Math.max(10, Math.min(rect.bottom + 10, window.innerHeight * 0.5));
      }
      const availableHeight = Math.max(200, window.innerHeight - topOffset - 20);
      maxHeight = `${availableHeight}px`;
    }
    const overlay2 = document.createElement("div");
    overlay2.id = "user-demand-overlay";
    overlay2.className = "st-chatu8-popup-overlay";
    const bubble = document.createElement("div");
    bubble.className = "st-chatu8-popup-bubble";
    if (isMobile3) {
      bubble.classList.add("mobile");
      bubble.style.top = `${topOffset}px`;
      bubble.style.maxHeight = maxHeight;
    } else {
      clampPopupToViewport(bubble);
    }
    const title = document.createElement("div");
    title.textContent = customTitle;
    title.className = "st-chatu8-popup-title";
    const hint = document.createElement("div");
    hint.textContent = customHint;
    hint.className = "st-chatu8-popup-hint";
    const textarea = document.createElement("textarea");
    textarea.placeholder = customPlaceholder;
    textarea.value = defaultText || "";
    textarea.className = "st-chatu8-popup-textarea";
    const imageUploadSection = document.createElement("div");
    imageUploadSection.className = "st-chatu8-popup-upload-section";
    const uploadHeader = document.createElement("div");
    uploadHeader.className = "st-chatu8-popup-upload-header";
    const uploadLabel = document.createElement("span");
    uploadLabel.textContent = "\u{1F4CE} \u53C2\u8003\u56FE\u7247\uFF08\u53EF\u9009\uFF09";
    uploadLabel.className = "st-chatu8-popup-upload-label";
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.style.display = "none";
    const uploadBtn = document.createElement("button");
    uploadBtn.type = "button";
    uploadBtn.innerHTML = '<i class="fa-solid fa-plus"></i> \u6DFB\u52A0\u56FE\u7247';
    uploadBtn.className = "st-chatu8-popup-upload-btn";
    uploadBtn.addEventListener("click", () => fileInput.click());
    uploadHeader.appendChild(uploadLabel);
    uploadHeader.appendChild(uploadBtn);
    const imagePreviewContainer = document.createElement("div");
    imagePreviewContainer.className = "st-chatu8-popup-preview-container";
    const emptyHint = document.createElement("div");
    emptyHint.textContent = "\u70B9\u51FB\u4E0A\u65B9\u6309\u94AE\u6DFB\u52A0\u53C2\u8003\u56FE\u7247";
    emptyHint.className = "st-chatu8-popup-empty-hint";
    imagePreviewContainer.appendChild(emptyHint);
    function updateImagePreviews() {
      imagePreviewContainer.innerHTML = "";
      if (uploadedImages.length === 0) {
        const hint2 = document.createElement("div");
        hint2.textContent = "\u70B9\u51FB\u4E0A\u65B9\u6309\u94AE\u6DFB\u52A0\u53C2\u8003\u56FE\u7247";
        hint2.className = "st-chatu8-popup-empty-hint";
        imagePreviewContainer.appendChild(hint2);
        return;
      }
      uploadedImages.forEach((imgObj, index) => {
        const itemContainer = document.createElement("div");
        itemContainer.className = "st-chatu8-popup-img-item";
        const imgWrapper = document.createElement("div");
        imgWrapper.className = "st-chatu8-popup-img-wrapper";
        const img = document.createElement("img");
        img.src = imgObj.base64;
        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.innerHTML = "\xD7";
        deleteBtn.className = "st-chatu8-popup-img-delete";
        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          uploadedImages.splice(index, 1);
          updateImagePreviews();
        });
        imgWrapper.appendChild(img);
        imgWrapper.appendChild(deleteBtn);
        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.placeholder = `\u56FE${index + 1}`;
        nameInput.value = imgObj.name || "";
        nameInput.className = "st-chatu8-popup-img-name";
        nameInput.addEventListener("input", (e) => {
          uploadedImages[index].name = e.target.value;
        });
        itemContainer.appendChild(imgWrapper);
        itemContainer.appendChild(nameInput);
        imagePreviewContainer.appendChild(itemContainer);
      });
      const countLabel = document.createElement("div");
      countLabel.textContent = `\u5DF2\u6DFB\u52A0 ${uploadedImages.length} \u5F20\u56FE\u7247`;
      countLabel.className = "st-chatu8-popup-img-count";
      imagePreviewContainer.appendChild(countLabel);
    }
    fileInput.addEventListener("change", async (e) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      for (const file of files) {
        if (!file.type.startsWith("image/")) continue;
        try {
          const base64 = await readFileAsBase647(file);
          uploadedImages.push({
            base64,
            name: ""
            // 用户可选填
          });
        } catch (err) {
          console.error("[showUserDemandPopup] Failed to read image:", err);
        }
      }
      updateImagePreviews();
      setTimeout(() => {
        if (fileInput) fileInput.value = "";
      }, 100);
    });
    function readFileAsBase647(file) {
      return new Promise((resolve2, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve2(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
    imageUploadSection.appendChild(uploadHeader);
    imageUploadSection.appendChild(fileInput);
    imageUploadSection.appendChild(imagePreviewContainer);
    if (videoAssetMode) {
      setupVideoDemandAssetSection(imageUploadSection, firstFrameSrc, uploadedImages);
    }
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "st-chatu8-popup-buttons";
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "\u53D6\u6D88";
    cancelBtn.className = "st-chatu8-popup-btn-cancel";
    const confirmBtn = document.createElement("button");
    confirmBtn.textContent = "\u786E\u5B9A\u751F\u6210";
    confirmBtn.className = "st-chatu8-popup-btn-confirm";
    const closePopup = (result) => {
      overlay2.classList.add("closing");
      setTimeout(() => {
        if (fileInput) fileInput.remove();
        overlay2.remove();
        resolve(result);
      }, 150);
    };
    cancelBtn.addEventListener("click", () => closePopup(null));
    confirmBtn.addEventListener("click", () => closePopup({
      text: textarea.value.trim() || "",
      images: [...uploadedImages]
    }));
    const handleKeydown = (e) => {
      if (e.key === "Escape") {
        closePopup(null);
        document.removeEventListener("keydown", handleKeydown);
      } else if (e.key === "Enter" && e.ctrlKey) {
        closePopup({
          text: textarea.value.trim() || "",
          images: [...uploadedImages]
        });
        document.removeEventListener("keydown", handleKeydown);
      }
    };
    document.addEventListener("keydown", handleKeydown);
    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(confirmBtn);
    bubble.appendChild(title);
    bubble.appendChild(hint);
    bubble.appendChild(textarea);
    bubble.appendChild(imageUploadSection);
    bubble.appendChild(buttonContainer);
    overlay2.appendChild(bubble);
    document.body.appendChild(overlay2);
    setTimeout(() => textarea.focus(), 100);
  });
}

async function handlePromptRequest(el, gestureId, options = {}) {
  return processImageLikeRequest(el, gestureId, "image_gen", "\u6B63\u6587\u56FE\u7247\u751F\u6210", LLM_IMAGE_GEN, options);
}

async function handleVisualMatPrepRequest(el, gestureId, options = {}) {
  return processImageLikeRequest(el, gestureId, "visual_mat_prep", "\u89C6\u6750\u51C6\u5907", LLM_VISUAL_MAT_PREP, options);
}

function extractVideosXmlContent(text) {
  if (!text || typeof text !== "string") return "";
  let cleanText = text.replace(/<(?:thinking|think|motion_trajectory|video_asset_think|Tag_think|pipeline_trace|latent_analysis)\b[^>]*>[\s\S]*?<\/(?:thinking|think|motion_trajectory|video_asset_think|Tag_think|pipeline_trace|latent_analysis)>/gi, "").replace(/^[\s\S]*?<\/(?:thinking|think|motion_trajectory|video_asset_think|Tag_think|pipeline_trace|latent_analysis)>/i, "").trim();
  let targetText = "";
  const containerMatch = cleanText.match(/<(?:video_prompt|videos)\b[^>]*>([\s\S]*?)<\/(?:video_prompt|videos)>/i);
  const searchScope = containerMatch ? containerMatch[1] : cleanText;
  const videosMatch = searchScope.match(/<videos\b[^>]*>([\s\S]*?)<\/videos>/i);
  const innerVideos = videosMatch ? videosMatch[1] : searchScope;
  const subVideoMatch = innerVideos.match(/<video\b[^>]*>([\s\S]*?)<\/video>/i);
  if (subVideoMatch && subVideoMatch[1]) {
    targetText = subVideoMatch[1];
  } else if (videosMatch && videosMatch[1]) {
    targetText = videosMatch[1];
  } else if (containerMatch && containerMatch[1]) {
    targetText = containerMatch[1];
  } else {
    const singleVideoMatch = cleanText.match(/<video\b[^>]*>([\s\S]*?)<\/video>/i);
    if (singleVideoMatch && singleVideoMatch[1]) {
      targetText = singleVideoMatch[1];
    }
  }
  if (!targetText || !targetText.trim()) {
    return "";
  }
  let cleaned = targetText.trim();
  cleaned = cleaned.replace(/<video_think\b[^>]*>[\s\S]*?<\/video_think>/gi, "").trim();
  cleaned = cleaned.replace(/```[a-zA-Z0-9_-]*/g, "").replace(/```/g, "").trim();
  cleaned = cleaned.replace(/《/g, "<").replace(/》/g, ">");
  cleaned = cleaned.replace(/\r?\n/g, "\\n");
  return cleaned.trim();
}

function appendVideoAssetMapToMessage(messages, messageIndex, selectedAssets) {
  if (!selectedAssets.length || messageIndex < 0 || messageIndex >= messages.length) return messages;
  const result = [...messages];
  const target = result[messageIndex];
  const mapping = selectedAssets.map((asset) => {
    return `<Picture ${asset.pictureIndex}>\uFF1A${asset.name || `\u89C6\u9891\u8D44\u4EA7 ${asset.pictureIndex}`}\uFF1B${asset.description || "\u65E0\u989D\u5916\u8BF4\u660E"}`;
  }).join("\n");
  const notice = `

[\u5DF2\u9009\u62E9\u7684\u89C6\u9891\u8D44\u4EA7]
${mapping}
\u8BF7\u5728 asset_manifest.pictures \u4E2D\u6309\u4E0A\u8FF0 Picture \u7F16\u53F7\u5F15\u7528\u8FD9\u4E9B\u8D44\u4EA7\uFF1BPicture 1 \u56FA\u5B9A\u4E3A\u9996\u5E27\u53C2\u8003\u56FE\u7247\u3002`;
  if (typeof target.content === "string") {
    result[messageIndex] = { ...target, content: target.content + notice };
  } else if (Array.isArray(target.content)) {
    result[messageIndex] = { ...target, content: [{ type: "text", text: notice }, ...target.content] };
  }
  return result;
}

function bindSelectedVideoAssetsToManifest(videoContent, selectedAssets) {
  if (!videoContent || !selectedAssets.length) return videoContent;
  const hadEscapedNewlines = !videoContent.includes("\n") && videoContent.includes("\\n");
  let normalized = videoContent.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\\r/g, "\n");
  const header = normalized.match(/asset_manifest\s*:/i);
  if (!header || typeof header.index !== "number") return videoContent;
  const braceStart = normalized.indexOf("{", header.index + header[0].length);
  if (braceStart < 0) return videoContent;
  let depth = 0;
  let inString = false;
  let escaped = false;
  let braceEnd = -1;
  for (let i = braceStart; i < normalized.length; i++) {
    const ch = normalized[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        braceEnd = i + 1;
        break;
      }
    }
  }
  if (braceEnd < 0) return videoContent;
  let manifest;
  try {
    manifest = JSON.parse(normalized.slice(braceStart, braceEnd).replace(/,\s*([}\]])/g, "$1"));
  } catch (error) {
    console.warn("[handleImageToVideoGen] \u65E0\u6CD5\u56DE\u5199\u89C6\u9891\u8D44\u4EA7 manifest:", error);
    return videoContent;
  }
  const existingPictures = Array.isArray(manifest.pictures) ? manifest.pictures : [];
  const existingByIndex = /* @__PURE__ */ new Map();
  existingPictures.forEach((item) => {
    const match = String(item?.label || "").match(/Picture\s*(\d+)/i);
    if (match) existingByIndex.set(Number(match[1]), item);
  });
  const existingPic1 = existingByIndex.get(1) || {};
  const pictureOne = {
    ...existingPic1,
    label: "Picture 1",
    entity_ref: existingPic1.entity_ref || "\u9996\u5E27\u53C2\u8003\u56FE\u7247",
    entity_type: existingPic1.entity_type || "keyframe",
    is_keyframe: true,
    usage: existingPic1.usage || "keyframe completion"
  };
  delete pictureOne.file_id;
  const boundPictures = selectedAssets.filter((asset) => {
    return asset.pictureIndex >= 2 && asset.pictureIndex <= 9 && asset.fileid;
  }).sort((a, b) => a.pictureIndex - b.pictureIndex).map((asset) => {
    const existing = existingByIndex.get(asset.pictureIndex) || {};
    return {
      ...existing,
      label: `Picture ${asset.pictureIndex}`,
      entity_ref: asset.name || `\u89C6\u9891\u8D44\u4EA7 ${asset.pictureIndex}`,
      entity_type: existing.entity_type || "reference_image",
      file_id: asset.fileid,
      is_keyframe: false,
      usage: existing.usage || "visual reference"
    };
  });
  manifest.pictures = [pictureOne, ...boundPictures];
  if (!Array.isArray(manifest.audios)) manifest.audios = [];
  normalized = normalized.slice(0, braceStart) + JSON.stringify(manifest, null, 2) + normalized.slice(braceEnd);
  return hadEscapedNewlines ? normalized.replace(/\r?\n/g, "\\n") : normalized;
}

async function handleImageToVideoGen(targetEl, imgElement, button, dialogContext = {}) {
  const mainTimer = debugTimer("promptReq.handleImageToVideoGen", "\u56FE\u751F\u89C6\u9891\u6D41\u7A0B");
  toastr.info("\u{1F3AC} \u6B63\u5728\u53D1\u8D77\u56FE\u751F\u89C6\u9891\u8BF7\u6C42...");
  try {
    let findUserDemandMessageIndex2 = function(messages) {
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === "user") return i;
      }
      return -1;
    }, attachImagesToMessage9 = function(messages, messageIndex, images, imageLabel = "\u53C2\u8003\u56FE\u7247") {
      if (!images || images.length === 0 || messageIndex < 0 || messageIndex >= messages.length) {
        return messages;
      }
      const result = [...messages];
      const targetMsg = result[messageIndex];
      const contentParts = [];
      if (typeof targetMsg.content === "string") {
        contentParts.push({ type: "text", text: targetMsg.content });
      } else if (Array.isArray(targetMsg.content)) {
        contentParts.push(...targetMsg.content);
      }
      images.forEach((imgItem, idx) => {
        const imgBase64 = typeof imgItem === "string" ? imgItem : imgItem.base64;
        const imgName = typeof imgItem === "object" && imgItem.name ? imgItem.name : `${imageLabel}${idx + 1}`;
        contentParts.push({ type: "text", text: `
[${imgName}]` });
        let imageUrl = imgBase64;
        if (!imgBase64.startsWith("data:")) {
          imageUrl = `data:image/png;base64,${imgBase64}`;
        }
        contentParts.push({
          type: "image_url",
          image_url: { url: imageUrl, detail: "auto" }
        });
      });
      result[messageIndex] = { ...targetMsg, content: contentParts };
      return result;
    };
    let firstFrameBase64 = "";
    if (imgElement) {
      if (imgElement.src && imgElement.src.startsWith("data:image/")) {
        firstFrameBase64 = imgElement.src;
      } else if (imgElement.src) {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = imgElement.naturalWidth || imgElement.width || 512;
          canvas.height = imgElement.naturalHeight || imgElement.height || 512;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
          firstFrameBase64 = canvas.toDataURL("image/png");
        } catch (e) {
          console.warn("[handleImageToVideoGen] Canvas \u63D0\u53D6\u56FE\u7247 Base64 \u5931\u8D25\uFF0C\u4F7F\u7528\u539F\u59CB src:", e);
          firstFrameBase64 = imgElement.src;
        }
      }
    }
    let el = targetEl;
    if (!el && button) {
      el = button.closest(".mes_text") || button.closest(".mes");
    }
    const historyDepth = parseInt(extension_settings[extensionName]?.historyDepth || "3", 10);
    const keepImageTagInHistory = extension_settings[extensionName]?.historyKeepImageTag === true;
    const contextElements = await getElContext(el, historyDepth, { keepImageTagInHistory }) || [];
    const nowtxt = contextElements.length > 0 ? contextElements[contextElements.length - 1] : "";
    const contextWithoutBody = contextElements.slice(0, -1);
    const userDemand = dialogContext?.userDemand || "";
    const userUploadedImages = dialogContext?.userUploadedImages || [];
    const selectedVideoAssets = userUploadedImages.filter((item) => {
      return item && Number.isInteger(item.pictureIndex) && item.fileid;
    });
    let triggeredContent = "";
    if (contextElements.length > 0) {
      const triggerElements = userDemand ? [...contextElements, userDemand] : contextElements;
      triggeredContent = await processWorldBooksWithTrigger(triggerElements) || "";
    }
    const entryTriggerTextParts = [];
    if (userDemand) {
      entryTriggerTextParts.push(userDemand);
    }
    if (nowtxt) {
      entryTriggerTextParts.push(nowtxt);
    }
    const entryTriggerText = entryTriggerTextParts.join("\n");
    const characterTriggerTextParts = [];
    if (contextElements.length > 0) {
      characterTriggerTextParts.push(contextElements.join("\n"));
    }
    if (triggeredContent) {
      characterTriggerTextParts.push(triggeredContent);
    }
    const characterTriggerText = characterTriggerTextParts.join("\n");
    let promt = buildPromptForRequestType("video_gen", entryTriggerText);
    if (!promt || promt.length === 0) {
      throw new Error('\u672A\u80FD\u83B7\u53D6\u5230\u63D0\u793A\u8BCD\uFF0C\u8BF7\u68C0\u67E5 LLM \u8BBE\u7F6E\u4E2D"\u56FE\u751F\u89C6\u9891"\u7684\u4E0A\u4E0B\u6587\u9884\u8BBE\u914D\u7F6E');
    }
    const characterListText = generateCharacterListText(characterTriggerText);
    const outfitEnableListText = generateOutfitEnableListText();
    const commonCharacterListText = generateCommonCharacterListText();
    promt = mergeAdjacentMessages(promt, getMergeOptionsForRequestType("video_gen"));
    const videoChannel = extension_settings[extensionName]?.videoChannel || "comfyui";
    const duration = videoChannel === "runninghub" ? extension_settings[extensionName]?.runninghub_val_duration ?? "4" : extension_settings[extensionName]?.comfyui_val_duration ?? "4";
    const contextData = {
      context: contextWithoutBody.join("\n"),
      body: nowtxt,
      worldBookContent: triggeredContent,
      variables: /* @__PURE__ */ new Map(),
      userDemand,
      characterListText,
      outfitEnableListText,
      commonCharacterListText,
      duration
    };
    const { messages: processedMessages } = await replaceAllPlaceholders(promt, contextData);
    promt = processedMessages;
    const userMsgIndex = findUserDemandMessageIndex2(promt);
    if (selectedVideoAssets.length > 0 && userMsgIndex >= 0) {
      promt = appendVideoAssetMapToMessage(promt, userMsgIndex, selectedVideoAssets);
    }
    const imagesToAttach = [];
    if (firstFrameBase64) {
      imagesToAttach.push({
        base64: firstFrameBase64,
        name: "\u9996\u5E27\u53C2\u8003\u56FE\u7247",
        description: "\u9996\u5E27\u53C2\u8003\u56FE\u7247"
      });
    }
    if (Array.isArray(userUploadedImages) && userUploadedImages.length > 0) {
      userUploadedImages.forEach((imgItem, idx) => {
        imagesToAttach.push({
          base64: typeof imgItem === "string" ? imgItem : imgItem.base64,
          name: typeof imgItem === "object" && imgItem.pictureIndex ? `<Picture ${imgItem.pictureIndex}> ${imgItem.name || "\u89C6\u9891\u8D44\u4EA7"}` : typeof imgItem === "object" && imgItem.name ? imgItem.name : `\u53C2\u8003\u56FE\u7247${idx + 1}`,
          description: `\u53C2\u8003\u56FE\u7247${idx + 1}`
        });
      });
    }
    if (imagesToAttach.length > 0 && userMsgIndex >= 0) {
      promt = attachImagesToMessage9(promt, userMsgIndex, imagesToAttach, "\u53C2\u8003\u56FE\u7247");
      debugLog("handleImageToVideoGen", `\u5DF2\u9644\u52A0 ${imagesToAttach.length} \u5F20\u56FE\u7247\u9644\u4EF6`);
    }
    updateCombinedPrompt(promt, "[\u56FE\u751F\u89C6\u9891] ");
    const maxRetries = extension_settings[extensionName]?.llm_retry_count ?? 0;
    let attempt = 0;
    let videoContent = "";
    while (attempt <= maxRetries) {
      if (attempt > 0) {
        const retryMsg = `\u672A\u68C0\u6D4B\u5230\u6709\u6548 Videos \u6807\u7B7E\uFF0C\u6B63\u5728\u8FDB\u884C\u7B2C ${attempt}/${maxRetries} \u6B21\u91CD\u8BD5...`;
        console.log(`[LLM Parse Retry] \u56FE\u751F\u89C6\u9891 ${retryMsg}`);
        addLog(`\u23F3 ${retryMsg}`);
        toastr.info(`\u{1F504} ${retryMsg}`);
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      const llmResponse = await LLM_VIDEO_GEN(promt, { timeoutMs: 6e5 });
      if (llmResponse.testMode) {
        mainTimer.end("LLM \u6D4B\u8BD5\u6A21\u5F0F\u8FD4\u56DE");
        return;
      }
      const next_promt = llmResponse.result || "";
      const cleanedPrompt = removeThinkingTags(next_promt);
      videoContent = extractVideosXmlContent(cleanedPrompt);
      if (videoContent) {
        videoContent = bindSelectedVideoAssetsToManifest(videoContent, selectedVideoAssets);
        if (attempt > 0) {
          const succMsg = "\u91CD\u8BD5\u6210\u529F\uFF01\u5DF2\u6210\u529F\u89E3\u6790\u51FA Videos \u6807\u7B7E\u914D\u7F6E";
          console.log(`[LLM Parse Retry] \u56FE\u751F\u89C6\u9891 ${succMsg}`);
          addLog(`\u2705 ${succMsg}`);
          toastr.success(`\u2705 ${succMsg}`);
        }
        break;
      }
      attempt++;
    }
    if (!videoContent) {
      toastr.warning("\u672A\u80FD\u4ECE LLM \u8FD4\u56DE\u4E2D\u68C0\u6D4B\u5230\u6709\u6548\u7684 Videos \u6807\u7B7E\uFF0C\u5DF2\u5224\u5B9A\u4E3A\u5931\u8D25");
      return;
    }
    if (button) {
      button.dataset.video = videoContent;
      button.dataset.activeMode = "video";
      if (button.dataset.link) {
        await updateItemImgVideo(button.dataset.link, videoContent);
        await updateItemImgActiveMode(button.dataset.link, "video");
      }
    }
    if (dialogContext) {
      if (typeof dialogContext.setVideoContentSafe === "function") {
        await dialogContext.setVideoContentSafe(videoContent);
      } else if (typeof dialogContext.switchMode === "function") {
        await dialogContext.switchMode("video");
        if (dialogContext.input) {
          dialogContext.input.value = videoContent.replace(/\\n/g, "\n");
        }
        if (typeof dialogContext.updateBackdrop === "function") {
          dialogContext.updateBackdrop();
        }
        if (typeof dialogContext.updateTabIndicators === "function") {
          dialogContext.updateTabIndicators();
        }
      } else if (dialogContext.input) {
        dialogContext.input.value = videoContent.replace(/\\n/g, "\n");
        if (typeof dialogContext.updateBackdrop === "function") {
          dialogContext.updateBackdrop();
        }
        if (typeof dialogContext.updateTabIndicators === "function") {
          dialogContext.updateTabIndicators();
        }
      }
    }
    toastr.success("\u{1F3AC} \u56FE\u751F\u89C6\u9891\u914D\u7F6E\u5DF2\u6210\u529F\u751F\u6210\u5E76\u4FDD\u5B58\u5230\u89C6\u9891\u6807\u7B7E\uFF01");
    mainTimer.end("\u56FE\u751F\u89C6\u9891\u6D41\u7A0B\u5B8C\u6210");
  } catch (err) {
    debugError("handleImageToVideoGen", "\u56FE\u751F\u89C6\u9891\u5931\u8D25", err);
    console.error("[promptReq] handleImageToVideoGen \u5931\u8D25:", err);
    toastr.error("\u56FE\u751F\u89C6\u9891\u8BF7\u6C42\u5931\u8D25: " + (err.message || err));
  }
}

async function processImageLikeRequest(el, gestureId, requestType, title, llmFunction, options = {}) {
  const mainTimer = debugTimer(`promptReq.${requestType}`, `${title}\u6838\u5FC3\u6D41\u7A0B`);
  debugMilestone(requestType, `\u5F00\u59CB\u5904\u7406${title}\u8BF7\u6C42`);
  debugLog(`promptReq.${requestType}`, "\u8BF7\u6C42\u521D\u59CB\u5316", {
    gestureId,
    \u76EE\u6807\u5143\u7D20: el?.className || el?.tagName,
    \u529F\u80FD\u8BF4\u660E: `\u5904\u7406\u624B\u52BF\u8BC6\u522B\u540E\u7684${title}\u8BF7\u6C42`,
    \u89E6\u53D1\u6765\u6E90: options?.source || "manual"
  });
  let isDemandEnabled = false;
  let defaultDemand = "";
  let popupOptions = {
    title: "\u{1F5BC}\uFE0F \u8F93\u5165\u751F\u56FE\u9700\u6C42",
    hint: "\u8BF7\u63CF\u8FF0\u60A8\u5E0C\u671B\u751F\u6210\u7684\u56FE\u7247\u7684\u5177\u4F53\u9700\u6C42\uFF08\u53EF\u9009\uFF09",
    placeholder: "\u4F8B\u5982\uFF1A\u91CD\u70B9\u63CF\u7ED8\u573A\u666F\u6C1B\u56F4\uFF0C\u5149\u7EBF\u67D4\u548C..."
  };
  if (requestType === "visual_mat_prep") {
    isDemandEnabled = extension_settings[extensionName]?.visualPrepDemandEnabled ?? false;
    defaultDemand = extension_settings[extensionName]?.defaultVisualPrepDemand || "";
    popupOptions = {
      title: "\u{1F3AC} \u8F93\u5165\u89C6\u6750\u51C6\u5907\u9700\u6C42",
      hint: "\u8BF7\u63CF\u8FF0\u60A8\u5E0C\u671B\u51C6\u5907\u7684\u89C6\u6750/\u89C6\u9891\u955C\u5934\u7684\u5177\u4F53\u9700\u6C42\uFF08\u53EF\u9009\uFF09",
      placeholder: "\u4F8B\u5982\uFF1A\u6307\u5B9A\u955C\u5934\u8FD0\u955C\u3001\u666F\u522B\u6784\u56FE\u3001\u52A8\u6001\u6C1B\u56F4..."
    };
  } else {
    isDemandEnabled = extension_settings[extensionName]?.imageGenDemandEnabled ?? false;
    defaultDemand = extension_settings[extensionName]?.defaultImageDemand || "";
  }
  const isAutoTrigger = options?.source === "auto" || options?.isAuto === true || options?.skipDemandPopup === true;
  if (isAutoTrigger) {
    debugBranch(requestType, "\u81EA\u52A8\u89E6\u53D1\uFF0C\u8DF3\u8FC7\u7528\u6237\u9700\u6C42\u5F39\u7A97", true, {
      source: options?.source || "auto",
      skipDemandPopup: options?.skipDemandPopup
    });
    isDemandEnabled = false;
  }
  let userDemand = "";
  let userUploadedImages = [];
  if (isDemandEnabled) {
    debugBranch(requestType, "\u663E\u793A\u7528\u6237\u9700\u6C42\u5F39\u7A97", true);
    debugLog(requestType, "\u7528\u6237\u9700\u6C42\u5F39\u7A97\u5DF2\u542F\u7528\uFF0C\u7B49\u5F85\u7528\u6237\u8F93\u5165");
    const popupTimer = debugTimer("showUserDemandPopup", "\u7528\u6237\u9700\u6C42\u8F93\u5165\u5F39\u7A97");
    const result = await showUserDemandPopup2(popupOptions);
    popupTimer.end("\u7528\u6237\u5DF2\u54CD\u5E94");
    if (result === null) {
      debugBranch(requestType, "\u7528\u6237\u53D6\u6D88\u8BF7\u6C42", true);
      debugLog(requestType, `\u7528\u6237\u53D6\u6D88\u4E86${title}\u8BF7\u6C42`);
      toastr.info(`\u5DF2\u53D6\u6D88${title}\u8BF7\u6C42`);
      mainTimer.end("\u7528\u6237\u53D6\u6D88");
      return;
    }
    userDemand = result.text || defaultDemand;
    userUploadedImages = result.images || [];
    debugLog(`promptReq.${requestType}`, "\u7528\u6237\u9700\u6C42\u5DF2\u83B7\u53D6", {
      \u9700\u6C42\u6587\u672C\u957F\u5EA6: userDemand.length
    });
  } else {
    debugBranch(requestType, "\u8DF3\u8FC7\u7528\u6237\u9700\u6C42\u5F39\u7A97", true);
    userDemand = defaultDemand;
  }
  toastr.info(`\u6B63\u5728\u5904\u7406${title}\u8BF7\u6C42...`);
  let context = getContext();
  const historyDepth = (extension_settings[extensionName]?.llm_history_depth ?? 2) + 1;
  const keepImageTagInHistory = extension_settings[extensionName]?.historyKeepImageTag === true;
  debugLog(requestType, "\u83B7\u53D6\u4E0A\u4E0B\u6587", {
    \u5386\u53F2\u5C42\u6570: historyDepth,
    \u5386\u53F2\u4FDD\u7559image\u6807\u7B7E: keepImageTagInHistory
  });
  const contextTimer = debugTimer("getElContext", "\u83B7\u53D6\u5143\u7D20\u4E0A\u4E0B\u6587\u6D88\u606F");
  const contextElements = await getElContext(el, historyDepth, { keepImageTagInHistory });
  contextTimer.end(`\u83B7\u53D6\u5230 ${contextElements?.length || 0} \u6761\u4E0A\u4E0B\u6587`);
  const nowtxt = contextElements[contextElements.length - 1];
  let triggeredContent = "";
  if (contextElements) {
    const triggerElements = userDemand ? [...contextElements, userDemand] : contextElements;
    debugLog("handlePromptRequest", "\u5904\u7406\u4E16\u754C\u4E66\u89E6\u53D1", {
      \u89E6\u53D1\u6587\u672C\u6761\u6570: triggerElements.length
    });
    const wbTimer = debugTimer("processWorldBooksWithTrigger", "\u4E16\u754C\u4E66\u89E6\u53D1\u5904\u7406");
    triggeredContent = await processWorldBooksWithTrigger(triggerElements);
    wbTimer.end(`\u89E6\u53D1\u5185\u5BB9\u957F\u5EA6: ${triggeredContent?.length || 0}`);
    if (triggeredContent) {
      debugLog("handlePromptRequest", "\u4E16\u754C\u4E66\u89E6\u53D1\u5185\u5BB9\u5DF2\u83B7\u53D6", {
        \u5185\u5BB9\u9884\u89C8: triggeredContent.substring(0, 100) + "..."
      });
    }
  }
  let variables = context.chatMetadata.variables || {};
  const contextWithoutBody = contextElements && contextElements.length > 1 ? contextElements.slice(0, -1) : [];
  const entryTriggerTextParts = [];
  if (userDemand) {
    entryTriggerTextParts.push(userDemand);
  }
  if (nowtxt) {
    entryTriggerTextParts.push(nowtxt);
  }
  const entryTriggerText = entryTriggerTextParts.join("\n");
  const characterTriggerTextParts = [];
  if (userDemand) {
    characterTriggerTextParts.push(userDemand);
  }
  if (contextElements && contextElements.length > 0) {
    characterTriggerTextParts.push(contextElements.join("\n"));
  }
  if (triggeredContent) {
    characterTriggerTextParts.push(triggeredContent);
  }
  const characterTriggerText = characterTriggerTextParts.join("\n");
  debugLog("handlePromptRequest", "\u6784\u5EFA Prompt", {
    \u8BF7\u6C42\u7C7B\u578B: requestType,
    \u6761\u76EE\u89E6\u53D1\u6587\u672C\u957F\u5EA6: entryTriggerText.length
  });
  const buildTimer = debugTimer("buildPromptForRequestType", "\u6784\u5EFA\u8BF7\u6C42\u7C7B\u578B Prompt");
  debugLog(requestType, "\u6784\u5EFALLM\u63D0\u793A\u8BCD");
  let promt = buildPromptForRequestType(requestType, entryTriggerText);
  buildTimer.end(`\u6D88\u606F\u6570\u91CF: ${promt?.length || 0}`);
  if (!promt || promt.length === 0) {
    throw new Error(`\u672A\u80FD\u83B7\u53D6\u5230\u63D0\u793A\u8BCD\uFF0C\u8BF7\u68C0\u67E5 LLM \u8BBE\u7F6E\u4E2D"${title}"\u7684\u4E0A\u4E0B\u6587\u9884\u8BBE\u914D\u7F6E`);
  }
  const characterListText = generateCharacterListText(characterTriggerText);
  const outfitEnableListText = generateOutfitEnableListText();
  const commonCharacterListText = generateCommonCharacterListText();
  debugLog(requestType, "\u751F\u6210\u89D2\u8272/\u670D\u88C5\u5217\u8868", {
    \u89D2\u8272\u5217\u8868\u957F\u5EA6: characterListText?.length || 0,
    \u670D\u88C5\u5217\u8868\u957F\u5EA6: outfitEnableListText?.length || 0,
    \u901A\u7528\u89D2\u8272\u5217\u8868\u957F\u5EA6: commonCharacterListText?.length || 0
  });
  const allPlaceholders = [
    "{{\u4E0A\u4E0B\u6587}}",
    "{{\u4E16\u754C\u4E66\u89E6\u53D1}}",
    "{{getvar::name}}",
    "{{\u6B63\u6587}}",
    "{{\u89D2\u8272\u542F\u7528\u5217\u8868}}",
    "{{\u901A\u7528\u89D2\u8272\u542F\u7528\u5217\u8868}}",
    "{{\u901A\u7528\u670D\u88C5\u542F\u7528\u5217\u8868}}",
    "{{\u7528\u6237\u9700\u6C42}}",
    "{{\u79D2\u6570}}",
    "{{\u89C6\u9891\u79D2\u6570}}"
  ];
  debugLog(requestType, "\u5408\u5E76\u76F8\u90BB\u6D88\u606F");
  promt = mergeAdjacentMessages(promt, getMergeOptionsForRequestType(requestType));
  const videoChannel = extension_settings[extensionName]?.videoChannel || "comfyui";
  const duration = videoChannel === "runninghub" ? extension_settings[extensionName]?.runninghub_val_duration ?? "4" : extension_settings[extensionName]?.comfyui_val_duration ?? "4";
  const contextData = {
    context: contextWithoutBody.join("\n"),
    body: nowtxt,
    worldBookContent: triggeredContent,
    variables,
    userDemand,
    characterListText,
    outfitEnableListText,
    commonCharacterListText,
    duration
  };
  debugLog(requestType, "\u66FF\u6362\u5360\u4F4D\u7B26");
  const replaceTimer = debugTimer("replaceAllPlaceholders", "\u5360\u4F4D\u7B26\u66FF\u6362\u5904\u7406");
  const { messages: processedMessages, replacedVariables } = await replaceAllPlaceholders(promt, contextData);
  promt = processedMessages;
  replaceTimer.end(`\u66FF\u6362\u4E86 ${replacedVariables.size} \u4E2A\u53D8\u91CF`);
  function attachImagesToMessage9(messages, messageIndex, images2, imageLabel = "\u53C2\u8003\u56FE\u7247") {
    if (!images2 || images2.length === 0 || messageIndex < 0 || messageIndex >= messages.length) {
      return messages;
    }
    const result = [...messages];
    const targetMsg = result[messageIndex];
    const contentParts = [];
    if (typeof targetMsg.content === "string") {
      contentParts.push({
        type: "text",
        text: targetMsg.content
      });
    } else if (Array.isArray(targetMsg.content)) {
      contentParts.push(...targetMsg.content);
    }
    if (images2.length > 0) {
      contentParts.push({
        type: "text",
        text: `
[\u4EE5\u4E0B\u662F\u7528\u6237\u4E0A\u4F20\u7684${images2.length}\u5F20${imageLabel}]`
      });
    }
    images2.forEach((imgItem, idx) => {
      const imgBase64 = typeof imgItem === "string" ? imgItem : imgItem.base64;
      const imgName = typeof imgItem === "object" && imgItem.name ? imgItem.name : `${imageLabel}${idx + 1}`;
      contentParts.push({
        type: "text",
        text: `[${imgName}]`
      });
      const description = typeof imgItem === "object" && imgItem.description ? String(imgItem.description).trim() : "";
      if (description) {
        contentParts.push({
          type: "text",
          text: `[${imgName}\u8BF4\u660E\uFF1A${description}]`
        });
      }
      let imageUrl = imgBase64;
      if (!imgBase64.startsWith("data:")) {
        imageUrl = `data:image/png;base64,${imgBase64}`;
      }
      contentParts.push({
        type: "image_url",
        image_url: {
          url: imageUrl,
          detail: "auto"
          // 可选: 'low', 'high', 'auto'
        }
      });
    });
    result[messageIndex] = {
      ...targetMsg,
      content: contentParts
    };
    return result;
  }
  function findUserDemandMessageIndex2(messages) {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        return i;
      }
    }
    return -1;
  }
  const userDemandMessageIndex = findUserDemandMessageIndex2(promt);
  if (userUploadedImages.length > 0 && userDemandMessageIndex >= 0) {
    debugLog(requestType, "\u9644\u52A0\u7528\u6237\u4E0A\u4F20\u56FE\u7247", {
      \u6570\u91CF: userUploadedImages.length,
      \u76EE\u6807\u6D88\u606F\u7D22\u5F15: userDemandMessageIndex
    });
    promt = attachImagesToMessage9(promt, userDemandMessageIndex, userUploadedImages, "\u53C2\u8003\u56FE\u7247");
  }
  try {
    debugLog(requestType, "\u6536\u96C6\u89D2\u8272/\u670D\u88C5\u56FE\u7247");
    const characterImages = await getEnabledCharacterImages(characterTriggerText);
    const outfitImages = await getEnabledOutfitImages();
    const commonCharacterImages = await getCommonCharacterImages();
    const allCharacterOutfitImages = [...characterImages, ...outfitImages, ...commonCharacterImages];
    debugLog(requestType, "\u89D2\u8272/\u670D\u88C5\u56FE\u7247\u6536\u96C6\u5B8C\u6210", {
      \u89D2\u8272\u56FE\u7247\u6570: characterImages.length,
      \u670D\u88C5\u56FE\u7247\u6570: outfitImages.length,
      \u901A\u7528\u89D2\u8272\u56FE\u7247\u6570: commonCharacterImages.length,
      \u603B\u8BA1: allCharacterOutfitImages.length
    });
    if (allCharacterOutfitImages.length > 0 && userDemandMessageIndex >= 0) {
      promt = attachImagesToMessage9(promt, userDemandMessageIndex, allCharacterOutfitImages, "\u89D2\u8272\u670D\u88C5\u53C2\u8003\u56FE\u7247");
    }
  } catch (err) {
    debugError(requestType, "\u6536\u96C6\u89D2\u8272/\u670D\u88C5\u56FE\u7247\u5931\u8D25", err);
    console.error(`[promptReq] \u6536\u96C6\u89D2\u8272/\u670D\u88C5\u56FE\u7247\u5931\u8D25:`, err);
  }
  let diagnosticText = "";
  if (replacedVariables.size > 0) {
    diagnosticText = `\u8BCA\u65AD\uFF1A\u68C0\u6D4B\u5230\u4EE5\u4E0B\u53D8\u91CF\u88AB\u4F7F\u7528\uFF1A${[...replacedVariables].join("\u3001")}
`;
  } else {
    diagnosticText = "\u8BCA\u65AD\uFF1A\u6CA1\u6709\u68C0\u6D4B\u5230\u53D8\u91CF\u88AB\u4F7F\u7528\u3002\n";
  }
  const unusedVariables = allPlaceholders.filter((p) => !replacedVariables.has(p) && !p.includes("::"));
  if (unusedVariables.length > 0) {
    diagnosticText += `\u672A\u4F7F\u7528\u7684\u53D8\u91CF\uFF1A${unusedVariables.join("\u3001")}

`;
  } else {
    diagnosticText += `\u6240\u6709\u57FA\u7840\u53D8\u91CF\u90FD\u5DF2\u4F7F\u7528\u3002

`;
  }
  updateCombinedPrompt(promt, diagnosticText);
  const isRegexTestMode = extension_settings[extensionName]?.regexTestMode ?? false;
  if (isRegexTestMode) {
    debugBranch(requestType, "\u6B63\u5219\u6D4B\u8BD5\u6A21\u5F0F - \u505C\u6B62LLM\u8BF7\u6C42", true);
    toastr.info("\u{1F9EA} \u6B63\u5219\u6D4B\u8BD5\u6A21\u5F0F\u5DF2\u542F\u7528\uFF1A\u5DF2\u505C\u6B62 LLM \u8BF7\u6C42\uFF0C\u4EC5\u5C55\u793A\u6700\u7EC8 Prompt");
    extension_settings[extensionName].regexTestMode = false;
    $("#ch-regex-test-mode").prop("checked", false);
    console.log("[promptReq] \u6B63\u5219\u6D4B\u8BD5\u6A21\u5F0F\u5DF2\u81EA\u52A8\u5173\u95ED\uFF08\u4E00\u6B21\u6027\u89E6\u53D1\uFF09");
    mainTimer.end("\u6B63\u5219\u6D4B\u8BD5\u6A21\u5F0F - \u672A\u53D1\u8D77LLM\u8BF7\u6C42");
    return;
  }
  debugMilestone(requestType, "\u5F00\u59CB LLM \u8BF7\u6C42");
  debugLog(requestType, `\u53D1\u8D77 LLM ${title}\u8BF7\u6C42`, {
    \u6D88\u606F\u6570\u91CF: promt?.length || 0,
    \u8D85\u65F6\u8BBE\u7F6E: "300000ms"
  });
  const maxRetries = extension_settings[extensionName]?.llm_retry_count ?? 0;
  let attempt = 0;
  let images = [];
  let next_promt = "";
  let cleanedPrompt = "";
  while (attempt <= maxRetries) {
    if (attempt > 0) {
      const retryMsg = `\u672A\u68C0\u6D4B\u5230\u6709\u6548${title}\u6807\u7B7E\uFF0C\u6B63\u5728\u8FDB\u884C\u7B2C ${attempt}/${maxRetries} \u6B21\u91CD\u8BD5...`;
      console.log(`[LLM Parse Retry] ${title} ${retryMsg}`);
      addLog(`\u23F3 ${retryMsg}`);
      toastr.info(`\u{1F504} ${retryMsg}`);
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    const llmTimer = debugTimer(`LLM_${requestType.toUpperCase()}`, `LLM ${title}\u8BF7\u6C42${attempt > 0 ? ` (\u7B2C${attempt}\u6B21\u91CD\u8BD5)` : ""}`);
    let llmResponse;
    try {
      llmResponse = await llmFunction(promt, { timeoutMs: 6e5 });
    } catch (llmErr) {
      llmTimer.end("LLM \u8BF7\u6C42\u5F02\u5E38\u5931\u8D25");
      if (llmErr?.name === "AbortError" || llmErr?.message?.includes("aborted") || llmErr?.message?.includes("Request aborted")) {
        console.log(`[promptReq] ${title} \u8BF7\u6C42\u5DF2\u88AB\u7528\u6237\u4E2D\u6B62`);
        mainTimer.end("\u7528\u6237\u4E2D\u6B62");
        return;
      }
      console.error(`[promptReq] ${title} \u8BF7\u6C42\u5931\u8D25:`, llmErr);
      toastr.error(`${title} \u8BF7\u6C42\u5931\u8D25: ${llmErr?.message || "\u672A\u77E5\u9519\u8BEF"}`);
      mainTimer.end("LLM \u8BF7\u6C42\u5931\u8D25");
      return;
    }
    llmTimer.end(`\u54CD\u5E94\u957F\u5EA6: ${llmResponse?.result?.length || 0}`);
    if (llmResponse?.testMode) {
      debugBranch(requestType, "LLM\u8FD4\u56DE\u6D4B\u8BD5\u6A21\u5F0F", true);
      mainTimer.end("LLM \u6D4B\u8BD5\u6A21\u5F0F\u8FD4\u56DE");
      return;
    }
    next_promt = llmResponse?.result || "";
    cleanedPrompt = removeThinkingTags(next_promt);
    images = [];
    if (requestType === "visual_mat_prep") {
      debugLog(requestType, "\u89E3\u6790\u89C6\u9891\u89C6\u6750\u6807\u7B7E");
      const parseTimer = debugTimer("parseVideosFromPrompt", "\u89E3\u6790\u89C6\u9891\u89C6\u6750\u6807\u7B7E");
      images = parseVideosFromPrompt(cleanedPrompt);
      parseTimer.end(`\u89E3\u6790\u5230 ${images.length} \u4E2A\u89C6\u9891\u89C6\u6750\u6807\u7B7E`);
    } else {
      debugLog(requestType, "\u89E3\u6790\u56FE\u7247\u6807\u7B7E");
      const parseTimer = debugTimer("parseImagesFromPrompt", "\u89E3\u6790\u56FE\u7247\u6807\u7B7E");
      images = parseImagesFromPrompt(cleanedPrompt);
      parseTimer.end(`\u89E3\u6790\u5230 ${images.length} \u4E2A\u56FE\u7247\u6807\u7B7E`);
    }
    debugLog(requestType, "\u89E3\u6790\u5B8C\u6210", {
      \u5C1D\u8BD5\u6B21\u6570: attempt,
      \u6570\u91CF: images.length,
      \u6807\u7B7E\u9884\u89C8: images.slice(0, 3).map((img) => img.tag || img.prompt?.substring(0, 30) || "unknown")
    });
    if (images.length > 0) {
      if (attempt > 0) {
        const succMsg = `\u91CD\u8BD5\u6210\u529F\uFF01\u5DF2\u6210\u529F\u89E3\u6790\u51FA ${images.length} \u4E2A${title}\u6807\u7B7E`;
        console.log(`[LLM Parse Retry] ${title} ${succMsg}`);
        addLog(`\u2705 ${succMsg}`);
        toastr.success(`\u2705 ${succMsg}`);
      }
      break;
    }
    attempt++;
  }
  if (images.length === 0) {
    const toastInfo = buildParseFailureToastInfo(cleanedPrompt, requestType);
    const toastLevel = toastr[toastInfo.level] ? toastInfo.level : "warning";
    toastr[toastLevel](toastInfo.message, toastInfo.title);
    debugBranch(requestType, "\u6807\u7B7E\u4E3A\u7A7A - \u5DF2\u63D0\u793A\u7528\u6237", true, {
      \u6807\u9898: toastInfo.title,
      \u7EA7\u522B: toastInfo.level
    });
  }
  if (images.length > 0 && el) {
    debugLog(requestType, "\u63D2\u5165\u56FE\u7247\u6807\u7B7E\u5230 DOM");
    const insertTimer = debugTimer("insertImagesIntoElement", "\u63D2\u5165\u56FE\u7247\u6807\u7B7E");
    await insertImagesIntoElement(el, images);
    insertTimer.end("\u63D2\u5165\u5B8C\u6210");
    const autoClickEnabled = String(extension_settings[extensionName]?.zidongdianji) === "true";
    if (autoClickEnabled) {
      const { taskQueue: taskQueue2, TaskType: TaskType2, TaskStatus: TaskStatus2 } = await import("./taskQueue.js");
      const { eventSource: eventSource49 } = await import("../../../../script.js");
      const { activateAutoClickWindow: activateAutoClickWindow2, deactivateAutoClickWindow: deactivateAutoClickWindow2 } = await import("./iframe/index.js");
      const autoClickTaskId = taskQueue2.addTask({
        name: `\u81EA\u52A8\u6279\u91CF\u751F\u6210 (${images.length} \u9879)`,
        type: TaskType2.AUTO_CLICK,
        prompt: `\u5171 ${images.length} \u4E2A\u751F\u6210\u6807\u7B7E\u5F85\u81EA\u52A8\u89E6\u53D1`
      });
      taskQueue2.updateStatus(autoClickTaskId, TaskStatus2.RUNNING);
      const completeHandler = (data) => {
        if (data.taskId === autoClickTaskId) {
          taskQueue2.completeTask(autoClickTaskId, data.success !== false);
          eventSource49.removeListener("st_chatu8_auto_click_complete", completeHandler);
          if (String(extension_settings[extensionName]?.zidongdianji2) !== "true") {
            deactivateAutoClickWindow2();
          }
        }
      };
      eventSource49.on("st_chatu8_auto_click_complete", completeHandler);
      setTimeout(() => {
        import("./iframe/index.js").then(({ processImagePlaceholdersForElement: processImagePlaceholdersForElement2 }) => {
          let targetEl = el;
          if (!targetEl?.isConnected) {
            const mesBlock = el?.closest?.(".mes") || el?.parentElement?.closest?.(".mes");
            const mesId = mesBlock?.getAttribute("mesid");
            if (mesId !== null && mesId !== void 0) {
              const realMesText = document.querySelector(`.mes[mesid="${mesId}"] .mes_text`);
              if (realMesText) {
                targetEl = realMesText;
                console.log("[promptReq] \u91CD\u65B0\u5B9A\u4F4D\u5230\u91CD\u7ED8\u540E\u7684\u771F\u5B9E DOM \u5143\u7D20, mesId:", mesId);
              }
            }
          }
          activateAutoClickWindow2();
          processImagePlaceholdersForElement2(targetEl || el, autoClickTaskId);
        }).catch((err) => {
          debugError(requestType, "\u52A0\u8F7D iframe \u6A21\u5757\u5931\u8D25", err);
          console.error(`[promptReq] \u52A0\u8F7D iframe \u6A21\u5757\u5931\u8D25:`, err);
          deactivateAutoClickWindow2();
          taskQueue2.completeTask(autoClickTaskId, false);
          eventSource49.removeListener("st_chatu8_auto_click_complete", completeHandler);
        });
      }, 80);
    }
  } else if (images.length > 0 && !el) {
    toastr.warning("\u56FE\u7247\u6807\u7B7E\u5DF2\u7ECF\u89E3\u6790\u6210\u529F\uFF0C\u4F46\u5F53\u524D\u672A\u627E\u5230\u53EF\u63D2\u5165\u7684\u6D88\u606F\u5143\u7D20\uFF0C\u56E0\u6B64\u65E0\u6CD5\u663E\u793A\u5230\u754C\u9762\u4E0A\u3002\u8BF7\u5237\u65B0\u6D88\u606F\u533A\u57DF\u540E\u91CD\u8BD5\u3002", "\u56FE\u7247\u6807\u7B7E\u65E0\u6CD5\u663E\u793A");
    debugBranch(requestType, "\u6709\u56FE\u7247\u6807\u7B7E\u4F46\u7F3A\u5C11\u76EE\u6807\u5143\u7D20", true);
  }
  debugMilestone(requestType, `${title}\u6D41\u7A0B\u5B8C\u6210`);
  mainTimer.end("\u5168\u6D41\u7A0B\u5B8C\u6210");
}

export { handleImageToVideoGen, handlePromptRequest, handleVisualMatPrepRequest, showUserDemandPopup2 };
