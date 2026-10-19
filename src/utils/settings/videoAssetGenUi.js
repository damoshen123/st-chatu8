// 还原自打包产物 — 原始模块: utils/settings/videoAssetGenUi.js
import { extension_settings } from "../../../../../../extensions.js";
import { eventSource, saveSettingsDebounced } from "../../../../../../script.js";
import { getContext } from "../../../../../../st-context.js";
import { EventType, eventNames, extensionName } from "../config.js";
import { saveConfigImage } from "../configDatabase.js";
import { getWorldEntries, getcharWorld, getrWorlds } from "../chatDataUtils.js";
import { addVideoAsset } from "../videoAssetsService.js";
import { LLM_VIDEO_ASSET_GEN, LLM_VIDEO_ASSET_GEN_GET_PROMPT } from "../llmRequest.js";
import { openVideoAssetPicker } from "./videoAssetPicker.js";
import { $container, __set_$container, __set_activeImageListener, __set_activeImageRequestId, __set_activeInspectingWorldName, __set_activeMobileTab, __set_allAvailableWorldsList, __set_currentEntryDisplayedCount, __set_currentEntryFilter, __set_currentEntrySearchKeyword, __set_currentImg2ImgRefImage, __set_currentImg2ImgRefName, __set_currentWorldFilter, __set_currentWorldSearchKeyword, __set_isGenerating2, __set_isGeneratingImage, __set_latestGeneratedAsset, __set_latestGeneratedImageData, activeImageListener, activeImageRequestId, activeInspectingWorldName, activeMobileTab, allAvailableWorldsList, cachedWorldEntriesMap, currentEntryDisplayedCount, currentEntryFilter, currentEntryPageSize, currentEntrySearchKeyword, currentImg2ImgRefImage, currentImg2ImgRefName, currentWorldFilter, currentWorldSearchKeyword, isGenerating2, isGeneratingImage, latestGeneratedAsset, latestGeneratedImageData } from "./regex.js";

var $displayFileid, $editModal, $emptyHint, $fileInput2, $grid, $imagePreview, $inputCategory2, $inputDesc2, $inputEnabled, $inputFileid, $inputId, $inputName2, $modalTitle, $previewWrapper, $privacyToggleBtn, $uploadPlaceholder, currentCategoryFilter2, currentSearchQuery2, isInitialized4, isPrivacyMode, pendingImportPackage;

var currentCategoryFilter2 = "all";

var currentSearchQuery2 = "";

var isInitialized4 = false;

var isPrivacyMode = localStorage.getItem("st_chatu8_video_assets_privacy_mode") !== "false";

var pendingImportPackage = null;
function setImg2ImgRefImage(dataUrl, name = "\u53C2\u8003\u56FE.png") {
  __set_currentImg2ImgRefImage(dataUrl || "");
  __set_currentImg2ImgRefName(name || "\u53C2\u8003\u56FE.png");
  updateImg2ImgUI();
}

function clearImg2ImgRefImage() {
  __set_currentImg2ImgRefImage("");
  __set_currentImg2ImgRefName("");
  updateImg2ImgUI();
  toastr.info("\u5DF2\u79FB\u9664\u56FE\u751F\u56FE\u53C2\u8003\u56FE\uFF0C\u6062\u590D\u4E3A\u7EAF\u6587\u751F\u56FE\u6A21\u5F0F");
}

function updateImg2ImgUI() {
  const $card = $("#vag-img2img-card");
  const $empty = $("#vag-img2img-empty");
  const $previewWrap = $("#vag-img2img-preview-wrap");
  const $thumb = $("#vag-img2img-thumb");
  const $name = $("#vag-img2img-name");
  const $badge = $("#vag-img2img-badge");
  const $clearBtn = $("#vag-btn-clear-img2img");
  const $channelHint = $("#vag-img2img-channel-hint");
  if (currentImg2ImgRefImage) {
    $card.addClass("has-image");
    $empty.hide();
    $previewWrap.show();
    $clearBtn.show();
    $thumb.attr("src", currentImg2ImgRefImage);
    $name.text(currentImg2ImgRefName || "\u53C2\u8003\u56FE.png").attr("title", currentImg2ImgRefName);
    $badge.text("\u56FE\u751F\u56FE\u5DF2\u542F\u7528").css({ background: "rgba(16, 185, 129, 0.2)", color: "#10b981" });
  } else {
    $card.removeClass("has-image");
    $empty.show();
    $previewWrap.hide();
    $clearBtn.hide();
    $thumb.attr("src", "");
    $name.text("");
    $badge.text("\u7EAF\u6587\u751F\u56FE").css({ background: "", color: "" });
  }
  const currentMode2 = extension_settings[extensionName]?.mode;
  if (currentImg2ImgRefImage && currentMode2 !== "banana") {
    $channelHint.show();
  } else {
    $channelHint.hide();
  }
}

function escapeHtml10(str) {
  if (!str || typeof str !== "string") return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function getSettings2() {
  return extension_settings[extensionName] || {};
}

function findUserDemandMessageIndex(messages) {
  if (!Array.isArray(messages)) return -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === "user") return i;
  }
  return -1;
}

function attachImagesToMessage7(messages, messageIndex, images, imageLabel = "\u7D20\u6750\u9644\u4EF6") {
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
    const imgName = typeof imgItem === "object" && imgItem.name ? imgItem.name : `${imageLabel} ${idx + 1}`;
    const imgDesc = (typeof imgItem === "object" && imgItem.description ? imgItem.description : "").trim();
    let labelText = `
[${imgName}]`;
    if (imgDesc) {
      labelText += `
\u7D20\u6750\u7B80\u4ECB: ${imgDesc}`;
    }
    contentParts.push({ type: "text", text: labelText });
    let imageUrl = imgBase64;
    if (!imgBase64.startsWith("data:")) {
      imageUrl = `data:image/jpeg;base64,${imgBase64}`;
    }
    contentParts.push({
      type: "image_url",
      image_url: { url: imageUrl, detail: "auto" }
    });
  });
  result[messageIndex] = { ...targetMsg, content: contentParts };
  return result;
}

function readFileAsCompressedDataUrl(file, maxWidth = 1280, maxHeight = 1280, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("\u65E0\u6CD5\u89E3\u7801\u56FE\u7247"));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("\u8BFB\u53D6\u6587\u4EF6\u5931\u8D25"));
    reader.readAsDataURL(file);
  });
}

function renderAttachmentsList() {
  const settings3 = getSettings2();
  if (!Array.isArray(settings3.video_asset_gen_attachments)) {
    settings3.video_asset_gen_attachments = [];
  }
  const attachments = settings3.video_asset_gen_attachments;
  const $listContainer = $("#vag-attachments-container");
  const $countBadge = $("#vag-attachment-count");
  if (!$listContainer.length) return;
  $countBadge.text(`${attachments.length} \u4E2A\u9644\u4EF6`);
  if (attachments.length === 0) {
    $listContainer.html(`
            <div id="vag-attachments-empty" class="vag-attachments-empty">
                <i class="fa-regular fa-images"></i>
                <div>\u6682\u672A\u6DFB\u52A0\u53C2\u8003\u9644\u4EF6\u7D20\u6750</div>
                <div style="font-size: 11px; opacity: 0.7;">\u70B9\u51FB\u4E0A\u65B9\u6309\u94AE\u4ECE\u3010\u89C6\u9891\u8D44\u4EA7\u3011\u5E93\u9009\u53D6\u6216\u4E0A\u4F20\u672C\u5730\u56FE\u7247\uFF0C\u4EA6\u53EF\u5728\u6B64\u9875\u9762\u76F4\u63A5\u6309 Ctrl+V \u7C98\u8D34\u622A\u56FE</div>
            </div>
        `);
    return;
  }
  $listContainer.empty();
  attachments.forEach((att, index) => {
    const isFromAsset = att.sourceType === "video_asset";
    const sourceLabel = isFromAsset ? "\u89C6\u9891\u8D44\u4EA7\u5E93" : "\u672C\u5730\u4E0A\u4F20";
    const sourceIcon = isFromAsset ? "fa-photo-film" : "fa-upload";
    const itemHtml = `
            <div class="vag-attachment-item" data-id="${att.id}" data-index="${index}">
                <div class="vag-attachment-thumb-wrap" title="\u70B9\u51FB\u653E\u5927\u67E5\u770B\u539F\u56FE">
                    <img class="vag-attachment-thumb" src="${att.dataUrl}" alt="${escapeHtml10(att.name)}">
                    <div class="vag-attachment-thumb-overlay">
                        <i class="fa-solid fa-magnifying-glass-plus"></i>
                    </div>
                </div>
                <div class="vag-attachment-content">
                    <div class="vag-attachment-top-row">
                        <div class="vag-attachment-name-group">
                            <span class="vag-attachment-index">#${index + 1}</span>
                            <span class="vag-attachment-source-badge">
                                <i class="fa-solid ${sourceIcon}"></i> ${sourceLabel}
                            </span>
                            <span class="vag-attachment-name" title="${escapeHtml10(att.name)}">${escapeHtml10(att.name)}</span>
                        </div>
                        <div class="vag-attachment-actions">
                            ${index > 0 ? `<button type="button" class="st-chatu8-btn st-chatu8-btn-sm vag-btn-move-up" data-index="${index}" title="\u4E0A\u79FB"><i class="fa-solid fa-arrow-up"></i></button>` : ""}
                            ${index < attachments.length - 1 ? `<button type="button" class="st-chatu8-btn st-chatu8-btn-sm vag-btn-move-down" data-index="${index}" title="\u4E0B\u79FB"><i class="fa-solid fa-arrow-down"></i></button>` : ""}
                            <button type="button" class="st-chatu8-btn danger st-chatu8-btn-sm vag-btn-remove" data-index="${index}" title="\u79FB\u9664\u6B64\u9644\u4EF6"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                    <div class="vag-attachment-desc-wrap">
                        <textarea class="vag-attachment-desc-input" data-index="${index}" rows="2" placeholder="\u5728\u6B64\u8F93\u5165\u9644\u4EF6 #${index + 1} \u7684\u753B\u9762\u7B80\u4ECB\u6216\u5206\u955C\u8981\u6C42\uFF08\u5982\uFF1A\u4E3B\u89D2\u6B63\u9762\u534A\u8EAB\u50CF\uFF0C\u7A7F\u767D\u8272\u98CE\u8863\uFF0C\u795E\u60C5\u4E13\u6CE8...\u968F\u56FE\u53D1\u9001\u7ED9LLM\uFF09">${escapeHtml10(att.description || "")}</textarea>
                    </div>
                </div>
            </div>
        `;
    const $item = $(itemHtml);
    $item.find(".vag-attachment-thumb-wrap").on("click", () => {
      openPreviewModal(att.dataUrl);
    });
    $item.find(".vag-attachment-desc-input").on("input", function() {
      const val = $(this).val();
      att.description = val;
      saveSettingsDebounced();
    });
    $item.find(".vag-btn-move-up").on("click", (e) => {
      e.stopPropagation();
      if (index > 0) {
        const temp = attachments[index - 1];
        attachments[index - 1] = attachments[index];
        attachments[index] = temp;
        saveSettingsDebounced();
        renderAttachmentsList();
      }
    });
    $item.find(".vag-btn-move-down").on("click", (e) => {
      e.stopPropagation();
      if (index < attachments.length - 1) {
        const temp = attachments[index + 1];
        attachments[index + 1] = attachments[index];
        attachments[index] = temp;
        saveSettingsDebounced();
        renderAttachmentsList();
      }
    });
    $item.find(".vag-btn-remove").on("click", (e) => {
      e.stopPropagation();
      attachments.splice(index, 1);
      saveSettingsDebounced();
      renderAttachmentsList();
      toastr.info(`\u5DF2\u79FB\u9664\u9644\u4EF6 #${index + 1}`);
    });
    $listContainer.append($item);
  });
}

function openPreviewModal(dataUrl) {
  if (!dataUrl) return;
  const $modal2 = $("#vag-preview-modal");
  const $img = $("#vag-preview-img");
  $img.attr("src", dataUrl);
  $modal2.css("display", "flex").hide().fadeIn(150);
}

function closePreviewModal() {
  $("#vag-preview-modal").fadeOut(150);
}

function addAttachmentItem(item) {
  const settings3 = getSettings2();
  if (!Array.isArray(settings3.video_asset_gen_attachments)) {
    settings3.video_asset_gen_attachments = [];
  }
  settings3.video_asset_gen_attachments.push(item);
  saveSettingsDebounced();
  renderAttachmentsList();
}

async function getCurrentCharWorldSafe() {
  try {
    return await getcharWorld();
  } catch (e) {
    return "";
  }
}

async function ensureWorldEntriesLoaded(worldName) {
  if (!worldName) return [];
  if (cachedWorldEntriesMap[worldName]) {
    return cachedWorldEntriesMap[worldName];
  }
  try {
    const raw = await getWorldEntries(worldName);
    const arr = Array.isArray(raw) ? raw : Object.values(raw || {});
    cachedWorldEntriesMap[worldName] = arr;
    return arr;
  } catch (err) {
    console.warn(`[VideoAssetGen] \u52A0\u8F7D\u4E16\u754C\u4E66\u300C${worldName}\u300D\u6761\u76EE\u5931\u8D25:`, err);
    cachedWorldEntriesMap[worldName] = [];
    return [];
  }
}

function updateWorldBookBadgeAndCount() {
  const settings3 = getSettings2();
  const selections = settings3.video_asset_gen_world_selections || {};
  const entriesMap = settings3.video_asset_gen_world_entries || {};
  let enabledBooksCount = 0;
  let totalEntriesCount = 0;
  for (const [wName, enabled] of Object.entries(selections)) {
    if (enabled) {
      enabledBooksCount++;
      const uids = entriesMap[wName] || [];
      totalEntriesCount += uids.length;
    }
  }
  const $badge = $("#vag-worldbook-badge");
  if (enabledBooksCount === 0) {
    $badge.text("\u5DF2\u542F\u7528 0 \u672C\u4E16\u754C\u4E66").css({
      background: "var(--st-chatu8-bg-tertiary, rgba(255, 255, 255, 0.08))",
      color: "var(--st-chatu8-text-secondary, #888)"
    });
  } else {
    $badge.text(`\u5DF2\u542F\u7528 ${enabledBooksCount} \u672C\u4E16\u754C\u4E66 (${totalEntriesCount} \u6761\u76EE)`).css({
      background: "rgba(16, 185, 129, 0.18)",
      color: "#34d399"
    });
  }
}

function switchMobileTab(targetTab) {
  __set_activeMobileTab(targetTab || "worlds");
  $("#vag-mobile-tab-worlds").toggleClass("active", activeMobileTab === "worlds");
  $("#vag-mobile-tab-entries").toggleClass("active", activeMobileTab === "entries");
  const $leftCol = $("#vag-wb-left-col");
  const $rightCol = $("#vag-wb-right-col");
  if (activeMobileTab === "worlds") {
    $leftCol.addClass("mobile-active");
    $rightCol.removeClass("mobile-active");
  } else {
    $leftCol.removeClass("mobile-active");
    $rightCol.addClass("mobile-active");
  }
}

function setWorldBookPanelCollapsed(collapsed) {
  const $card = $("#vag-worldbook-card");
  const $layout = $("#vag-worldbook-dual-layout");
  const $mobileTabs = $("#vag-wb-mobile-tabs");
  const $icon = $("#vag-worldbook-collapse-icon");
  const $text = $("#vag-worldbook-collapse-text");
  if (collapsed) {
    $card.addClass("vag-card-collapsed");
    $layout.hide();
    $mobileTabs.hide();
    $icon.removeClass("fa-chevron-up").addClass("fa-chevron-down");
    $text.text("\u5C55\u5F00");
  } else {
    $card.removeClass("vag-card-collapsed");
    $layout.show();
    $mobileTabs.css("display", "");
    $icon.removeClass("fa-chevron-down").addClass("fa-chevron-up");
    $text.text("\u6536\u8D77");
    switchMobileTab(activeMobileTab);
  }
}

async function refreshWorldBookDualList() {
  try {
    const $leftList = $("#vag-world-list-container");
    $leftList.html(`
            <div class="vag-entry-empty-state">
                <i class="fa-solid fa-spinner fa-spin" style="color: var(--st-chatu8-accent-primary, #6366f1);"></i>
                <div>\u6B63\u5728\u52A0\u8F7D\u4E16\u754C\u4E66\u5217\u8868...</div>
            </div>
        `);
    let worlds = [];
    try {
      worlds = await getrWorlds();
    } catch (e) {
      console.warn("[VideoAssetGen] \u83B7\u53D6\u4E16\u754C\u4E66\u5217\u8868\u5931\u8D25:", e);
    }
    __set_allAvailableWorldsList(Array.isArray(worlds) ? worlds.filter(Boolean) : []);
    const settings3 = getSettings2();
    if (!settings3.video_asset_gen_world_selections || typeof settings3.video_asset_gen_world_selections !== "object") {
      settings3.video_asset_gen_world_selections = {};
    }
    if (!settings3.video_asset_gen_world_entries || typeof settings3.video_asset_gen_world_entries !== "object") {
      settings3.video_asset_gen_world_entries = {};
    }
    if (!activeInspectingWorldName || !allAvailableWorldsList.includes(activeInspectingWorldName)) {
      const charWorld = await getCurrentCharWorldSafe();
      if (charWorld && allAvailableWorldsList.includes(charWorld)) {
        __set_activeInspectingWorldName(charWorld);
      } else if (allAvailableWorldsList.length > 0) {
        __set_activeInspectingWorldName(allAvailableWorldsList[0]);
      } else {
        __set_activeInspectingWorldName(null);
      }
    }
    renderWorldListUI();
    if (activeInspectingWorldName) {
      await renderEntryListUI(activeInspectingWorldName);
    } else {
      $("#vag-entry-list-container").html(`
                <div class="vag-entry-empty-state">
                    <i class="fa-regular fa-folder-open"></i>
                    <div>\u6682\u65E0\u53EF\u7528\u4E16\u754C\u4E66</div>
                </div>
            `);
    }
    updateWorldBookBadgeAndCount();
  } catch (err) {
    console.error("[VideoAssetGen] \u5237\u65B0\u4E16\u754C\u4E66\u53CC\u680F\u5217\u8868\u5F02\u5E38:", err);
  }
}

async function renderWorldListUI() {
  const $list = $("#vag-world-list-container");
  if (!$list.length) return;
  const settings3 = getSettings2();
  const selections = settings3.video_asset_gen_world_selections || {};
  const entriesMap = settings3.video_asset_gen_world_entries || {};
  const charWorld = await getCurrentCharWorldSafe();
  $("#vag-world-filter-pills .vag-filter-pill").each(function() {
    const filterVal = $(this).data("filter");
    $(this).toggleClass("active", filterVal === currentWorldFilter);
  });
  const totalEnabledCount = Object.values(selections).filter(Boolean).length;
  $("#vag-mobile-tab-worlds-count").text(totalEnabledCount > 0 ? `${totalEnabledCount}\u672C` : `${allAvailableWorldsList.length}\u672C`);
  const filterTerm = (currentWorldSearchKeyword || "").trim().toLowerCase();
  const filteredWorlds = allAvailableWorldsList.filter((w) => {
    if (!w) return false;
    if (currentWorldFilter === "enabled" && !selections[w]) return false;
    if (!filterTerm) return true;
    return w.toLowerCase().includes(filterTerm);
  });
  if (filteredWorlds.length === 0) {
    const emptyMsg = currentWorldFilter === "enabled" ? "\u6682\u65E0\u5DF2\u542F\u7528\u7684\u4E16\u754C\u4E66\uFF08\u53EF\u5207\u6362\u4E3A\u5168\u90E8\u67E5\u770B\uFF09" : filterTerm ? `\u672A\u641C\u7D22\u5230\u5339\u914D\u300C${escapeHtml10(filterTerm)}\u300D\u7684\u4E16\u754C\u4E66` : "\u6682\u65E0\u53EF\u7528\u4E16\u754C\u4E66";
    $list.html(`
            <div class="vag-entry-empty-state">
                <i class="fa-solid fa-magnifying-glass"></i>
                <div>${emptyMsg}</div>
            </div>
        `);
    return;
  }
  $list.empty();
  const fragment = document.createDocumentFragment();
  filteredWorlds.forEach((worldName) => {
    const isSelected = !!selections[worldName];
    const isActive = worldName === activeInspectingWorldName;
    const isChar = worldName === charWorld;
    const selectedUids = entriesMap[worldName] || [];
    const itemEl = document.createElement("div");
    let classNames = "vag-wb-item";
    if (isSelected) classNames += " world-selected";
    if (isActive) classNames += " active";
    itemEl.className = classNames;
    itemEl.dataset.worldName = worldName;
    itemEl.innerHTML = `
            <input type="checkbox" class="vag-wb-checkbox" ${isSelected ? "checked" : ""} title="\u542F\u7528/\u505C\u7528\u6B64\u4E16\u754C\u4E66">
            <span class="vag-wb-text" title="${escapeHtml10(worldName)}">
                ${escapeHtml10(worldName)}
                ${isChar ? '<span class="vag-wb-char-badge">(\u89D2\u8272)</span>' : ""}
            </span>
            ${isSelected ? `<span class="vag-wb-count-badge" title="\u5DF2\u52FE\u9009 ${selectedUids.length} \u4E2A\u6761\u76EE">${selectedUids.length} \u6761\u76EE</span>` : ""}
        `;
    const $item = $(itemEl);
    const $checkbox = $item.find(".vag-wb-checkbox");
    $checkbox.on("change", async function(e) {
      e.stopPropagation();
      const checked = $(this).prop("checked");
      selections[worldName] = checked;
      if (checked && !Array.isArray(entriesMap[worldName])) {
        const entries = await ensureWorldEntriesLoaded(worldName);
        entriesMap[worldName] = entries.filter((entry) => entry && !entry.disable).map((entry) => String(entry.uid));
      }
      settings3.video_asset_gen_world_selections = selections;
      settings3.video_asset_gen_world_entries = entriesMap;
      saveSettingsDebounced();
      renderWorldListUI();
      if (activeInspectingWorldName === worldName) {
        renderEntryListUI(worldName);
      }
      updateWorldBookBadgeAndCount();
    });
    $item.on("click", function(e) {
      if ($(e.target).is('input[type="checkbox"]')) return;
      __set_currentEntryDisplayedCount(currentEntryPageSize);
      if (activeInspectingWorldName !== worldName) {
        __set_activeInspectingWorldName(worldName);
        renderWorldListUI();
        renderEntryListUI(worldName);
      }
      if (window.innerWidth <= 768) {
        switchMobileTab("entries");
      }
    });
    fragment.appendChild(itemEl);
  });
  $list.append(fragment);
}

function showWorldBookEntryContentModal(title, content, keys = [], isConstant = false) {
  $(".st-chatu8-entry-content-backdrop").remove();
  let keywordsHtml = "";
  const keysList = Array.isArray(keys) ? keys.filter(Boolean) : keys ? [String(keys)] : [];
  if (keysList.length > 0) {
    const keysTags = keysList.map((k) => `
            <span style="display: inline-block; margin: 2px 4px; padding: 2px 7px; background: rgba(99, 102, 241, 0.2); border: 1px solid rgba(99, 102, 241, 0.4); border-radius: 4px; color: #a5b4fc; font-size: 11px;">
                ${escapeHtml10(k)}
            </span>
        `).join("");
    keywordsHtml = `
            <div style="padding: 10px 18px; background: rgba(99, 102, 241, 0.06); border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
                <div style="color: var(--st-chatu8-text-secondary, #94a3b8); font-size: 11px; margin-bottom: 4px;">\u{1F511} \u89E6\u53D1\u5173\u952E\u8BCD\uFF1A</div>
                <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                    ${keysTags}
                </div>
            </div>
        `;
  }
  const constantBadge = isConstant ? `<span class="vag-entry-badge-constant" style="font-size: 11px; padding: 2px 6px; margin-left: 8px;"><i class="fa-solid fa-thumbtack"></i> \u5E38\u5F00</span>` : "";
  const backdropEl = document.createElement("div");
  backdropEl.className = "st-chatu8-entry-content-backdrop";
  backdropEl.innerHTML = `
        <div class="st-chatu8-entry-content-dialog">
            <div class="st-chatu8-workflow-viz-header">
                <h3><i class="fa-solid fa-book-bookmark" style="color: var(--st-chatu8-accent-primary, #6366f1); margin-right: 6px;"></i>${escapeHtml10(title)}${constantBadge}</h3>
                <span class="st-chatu8-workflow-viz-close" title="\u5173\u95ED">&times;</span>
            </div>
            ${keywordsHtml}
            <div class="st-chatu8-entry-content-body">
                <pre class="st-chatu8-entry-content-text">${escapeHtml10(content || "\uFF08\u8BE5\u6761\u76EE\u65E0\u6B63\u6587\u5185\u5BB9\uFF09")}</pre>
            </div>
        </div>
    `;
  document.body.appendChild(backdropEl);
  const closeModal = () => {
    $(backdropEl).fadeOut(150, function() {
      $(this).remove();
    });
    $(document).off("keydown.vagEntryModal");
  };
  $(backdropEl).find(".st-chatu8-workflow-viz-close").on("click", closeModal);
  $(backdropEl).on("click", function(e) {
    if (e.target === this) {
      closeModal();
    }
  });
  $(document).on("keydown.vagEntryModal", function(e) {
    if (e.key === "Escape") {
      closeModal();
    }
  });
}

async function renderEntryListUI(worldName) {
  const $list = $("#vag-entry-list-container");
  const $title = $("#vag-active-world-title");
  if (!$list.length) return;
  $("#vag-entry-filter-pills .vag-filter-pill").each(function() {
    const fVal = $(this).data("filter");
    $(this).toggleClass("active", fVal === currentEntryFilter);
  });
  if (!worldName) {
    $title.html('<i class="fa-solid fa-list-check"></i> \u{1F4DD} \u6761\u76EE\u5F00\u5173 <span style="font-size: 11px; opacity: 0.6; font-weight: normal;">(\u8BF7\u9009\u62E9\u5DE6\u4FA7\u4E16\u754C\u4E66)</span>');
    $("#vag-mobile-tab-entries-count").text("0");
    $list.html(`
            <div class="vag-entry-empty-state">
                <i class="fa-regular fa-hand-pointer"></i>
                <div>\u8BF7\u5728\u5DE6\u4FA7\u70B9\u51FB\u4E00\u4E2A\u4E16\u754C\u4E66\u67E5\u770B\u6761\u76EE</div>
            </div>
        `);
    return;
  }
  $title.html(`<i class="fa-solid fa-book-open"></i> \u{1F4DD} \u6761\u76EE\u5F00\u5173 - <span style="color: var(--st-chatu8-accent-primary, #818cf8); font-weight: 600;">${escapeHtml10(worldName)}</span>`);
  $list.html(`
        <div class="vag-entry-empty-state">
            <i class="fa-solid fa-spinner fa-spin" style="color: var(--st-chatu8-accent-primary, #6366f1);"></i>
            <div>\u6B63\u5728\u52A0\u8F7D\u300C${escapeHtml10(worldName)}\u300D\u7684\u6761\u76EE...</div>
        </div>
    `);
  const entries = await ensureWorldEntriesLoaded(worldName);
  const settings3 = getSettings2();
  const entriesMap = settings3.video_asset_gen_world_entries || {};
  if (!Array.isArray(entriesMap[worldName])) {
    entriesMap[worldName] = entries.filter((entry) => entry && !entry.disable).map((entry) => String(entry.uid));
    settings3.video_asset_gen_world_entries = entriesMap;
    saveSettingsDebounced();
  }
  const selectedUids = new Set((entriesMap[worldName] || []).map(String));
  const totalEntriesCount = entries.length;
  const checkedCount = selectedUids.size;
  $title.html(`<i class="fa-solid fa-book-open"></i> \u{1F4DD} \u6761\u76EE\u5F00\u5173 - <span style="color: var(--st-chatu8-accent-primary, #818cf8); font-weight: 600;">${escapeHtml10(worldName)}</span> <span style="font-size: 11px; opacity: 0.8; font-weight: normal;">(\u5DF2\u9009 ${checkedCount}/${totalEntriesCount})</span>`);
  $("#vag-mobile-tab-entries-count").text(`${checkedCount}/${totalEntriesCount}`);
  if (!entries || entries.length === 0) {
    $list.html(`
            <div class="vag-entry-empty-state">
                <i class="fa-regular fa-folder-open"></i>
                <div>\u8BE5\u4E16\u754C\u4E66\u6682\u65E0\u53EF\u7528\u6761\u76EE</div>
            </div>
        `);
    return;
  }
  const filterTerm = (currentEntrySearchKeyword || "").trim().toLowerCase();
  const filteredEntries = entries.filter((entry) => {
    if (!entry) return false;
    const uidStr = String(entry.uid);
    const isChecked = selectedUids.has(uidStr);
    const isConstant = entry.constant === true;
    if (currentEntryFilter === "checked" && !isChecked) return false;
    if (currentEntryFilter === "constant" && !isConstant) return false;
    if (!filterTerm) return true;
    const comment = (entry.comment || "").toLowerCase();
    const content = (entry.content || "").toLowerCase();
    const keys = (Array.isArray(entry.key) ? entry.key.join(" ") : String(entry.key || "")).toLowerCase();
    return comment.includes(filterTerm) || content.includes(filterTerm) || keys.includes(filterTerm);
  });
  if (filteredEntries.length === 0) {
    let emptyTip = "\u672A\u641C\u7D22\u5230\u5339\u914D\u6761\u76EE";
    if (currentEntryFilter === "checked") {
      emptyTip = "\u5F53\u524D\u4E16\u754C\u4E66\u6682\u65E0\u52FE\u9009\u7684\u6761\u76EE\uFF08\u53EF\u5207\u6362\u7B5B\u9009\u4E3A\u201C\u5168\u90E8\u201D\uFF09";
    } else if (currentEntryFilter === "constant") {
      emptyTip = "\u5F53\u524D\u4E16\u754C\u4E66\u6682\u65E0\u5E38\u5F00\u6761\u76EE";
    } else if (filterTerm) {
      emptyTip = `\u672A\u641C\u7D22\u5230\u5339\u914D\u300C${escapeHtml10(filterTerm)}\u300D\u7684\u6761\u76EE`;
    }
    $list.html(`
            <div class="vag-entry-empty-state">
                <i class="fa-solid fa-magnifying-glass"></i>
                <div>${emptyTip}</div>
            </div>
        `);
    return;
  }
  $list.empty();
  const fragment = document.createDocumentFragment();
  const displayedEntries = filteredEntries.slice(0, currentEntryDisplayedCount);
  displayedEntries.forEach((entry) => {
    const uidStr = String(entry.uid);
    const isChecked = selectedUids.has(uidStr);
    const title = entry.comment || `\u6761\u76EE #${uidStr}`;
    const isConstant = entry.constant === true;
    const keysStr = Array.isArray(entry.key) ? entry.key.filter(Boolean).join(", ") : String(entry.key || "");
    const previewContent = (entry.content || "").trim() || "\uFF08\u65E0\u6761\u76EE\u5185\u5BB9\uFF09";
    const itemEl = document.createElement("div");
    itemEl.className = `vag-entry-item${isChecked ? " selected" : ""}`;
    itemEl.dataset.uid = uidStr;
    itemEl.innerHTML = `
            <input type="checkbox" class="vag-entry-checkbox" ${isChecked ? "checked" : ""}>
            <div class="vag-entry-content-wrap">
                <div class="vag-entry-header">
                    <span class="vag-entry-title" title="${escapeHtml10(title)}">${escapeHtml10(title)}</span>
                    ${isConstant ? '<span class="vag-entry-badge-constant"><i class="fa-solid fa-thumbtack"></i> \u5E38\u5F00</span>' : ""}
                    ${keysStr ? `<span class="vag-entry-badge-key" title="\u89E6\u53D1\u8BCD: ${escapeHtml10(keysStr)}"><i class="fa-solid fa-key"></i> ${escapeHtml10(keysStr)}</span>` : ""}
                </div>
                <div class="vag-entry-preview" title="${escapeHtml10(previewContent)}">${escapeHtml10(previewContent)}</div>
            </div>
            <i class="fa fa-eye vag-entry-view-icon" title="\u67E5\u770B\u6761\u76EE\u5177\u4F53\u5185\u5BB9"></i>
        `;
    const $item = $(itemEl);
    const $checkbox = $item.find(".vag-entry-checkbox");
    $item.find(".vag-entry-view-icon").on("click", function(e) {
      e.stopPropagation();
      showWorldBookEntryContentModal(title, entry.content || "", entry.key || [], isConstant);
    });
    const toggleCheck = (newState) => {
      $checkbox.prop("checked", newState);
      $item.toggleClass("selected", newState);
      if (newState) {
        selectedUids.add(uidStr);
      } else {
        selectedUids.delete(uidStr);
      }
      entriesMap[worldName] = Array.from(selectedUids);
      settings3.video_asset_gen_world_entries = entriesMap;
      saveSettingsDebounced();
      updateWorldBookBadgeAndCount();
      renderWorldListUI();
      const curChecked = selectedUids.size;
      $title.html(`<i class="fa-solid fa-book-open"></i> \u{1F4DD} \u6761\u76EE\u5F00\u5173 - <span style="color: var(--st-chatu8-accent-primary, #818cf8); font-weight: 600;">${escapeHtml10(worldName)}</span> <span style="font-size: 11px; opacity: 0.8; font-weight: normal;">(\u5DF2\u9009 ${curChecked}/${totalEntriesCount})</span>`);
      $("#vag-mobile-tab-entries-count").text(`${curChecked}/${totalEntriesCount}`);
    };
    $checkbox.on("change", function(e) {
      e.stopPropagation();
      toggleCheck($(this).prop("checked"));
    });
    $item.on("click", function(e) {
      if ($(e.target).is('input[type="checkbox"]') || $(e.target).closest(".vag-entry-view-icon").length) return;
      const curState = $checkbox.prop("checked");
      toggleCheck(!curState);
    });
    fragment.appendChild(itemEl);
  });
  $list.append(fragment);
  if (filteredEntries.length > currentEntryDisplayedCount) {
    const remaining = filteredEntries.length - currentEntryDisplayedCount;
    const nextBatch = Math.min(remaining, currentEntryPageSize);
    const $loadMoreWrap = $(`
            <div class="vag-entry-load-more-wrap">
                <button type="button" class="st-chatu8-btn vag-entry-load-more-btn" id="vag-btn-load-more-entries">
                    <i class="fa-solid fa-angles-down"></i> \u52A0\u8F7D\u66F4\u591A\u6761\u76EE (+${nextBatch} \u6761\uFF0C\u5269\u4F59 ${remaining} \u6761)
                </button>
                <button type="button" class="st-chatu8-btn st-chatu8-btn-sm" id="vag-btn-load-all-entries" style="font-size: 10px; opacity: 0.75; padding: 2px 8px;">
                    \u5C55\u5F00\u5168\u90E8 (${filteredEntries.length} \u6761)
                </button>
            </div>
        `);
    $loadMoreWrap.find("#vag-btn-load-more-entries").on("click", function() {
      __set_currentEntryDisplayedCount(currentEntryDisplayedCount + currentEntryPageSize);
      renderEntryListUI(worldName);
    });
    $loadMoreWrap.find("#vag-btn-load-all-entries").on("click", function() {
      __set_currentEntryDisplayedCount(filteredEntries.length);
      renderEntryListUI(worldName);
    });
    $list.append($loadMoreWrap);
  } else if (filteredEntries.length > 15) {
    $list.append(`<div class="vag-entry-footer-summary">\u5DF2\u663E\u793A\u5168\u90E8 ${filteredEntries.length} \u4E2A\u6761\u76EE</div>`);
  }
}

async function selectAllWorlds() {
  const settings3 = getSettings2();
  if (!settings3.video_asset_gen_world_selections) settings3.video_asset_gen_world_selections = {};
  if (!settings3.video_asset_gen_world_entries) settings3.video_asset_gen_world_entries = {};
  for (const worldName of allAvailableWorldsList) {
    settings3.video_asset_gen_world_selections[worldName] = true;
    if (!Array.isArray(settings3.video_asset_gen_world_entries[worldName])) {
      const entries = await ensureWorldEntriesLoaded(worldName);
      settings3.video_asset_gen_world_entries[worldName] = entries.filter((e) => e && !e.disable).map((e) => String(e.uid));
    }
  }
  saveSettingsDebounced();
  renderWorldListUI();
  if (activeInspectingWorldName) {
    renderEntryListUI(activeInspectingWorldName);
  }
  updateWorldBookBadgeAndCount();
  toastr.success(`\u5DF2\u542F\u7528\u5168\u90E8 ${allAvailableWorldsList.length} \u672C\u4E16\u754C\u4E66`);
}

function deselectAllWorlds() {
  const settings3 = getSettings2();
  settings3.video_asset_gen_world_selections = {};
  saveSettingsDebounced();
  renderWorldListUI();
  if (activeInspectingWorldName) {
    renderEntryListUI(activeInspectingWorldName);
  }
  updateWorldBookBadgeAndCount();
  toastr.info("\u5DF2\u53D6\u6D88\u6240\u6709\u4E16\u754C\u4E66\u7684\u542F\u7528\u72B6\u6001");
}

async function selectAllCurrentWorldEntries() {
  if (!activeInspectingWorldName) return;
  const entries = await ensureWorldEntriesLoaded(activeInspectingWorldName);
  const settings3 = getSettings2();
  if (!settings3.video_asset_gen_world_entries) settings3.video_asset_gen_world_entries = {};
  settings3.video_asset_gen_world_entries[activeInspectingWorldName] = entries.map((e) => String(e.uid));
  saveSettingsDebounced();
  renderEntryListUI(activeInspectingWorldName);
  renderWorldListUI();
  updateWorldBookBadgeAndCount();
  toastr.info(`\u5DF2\u5168\u9009\u300C${activeInspectingWorldName}\u300D\u7684\u5168\u90E8 ${entries.length} \u4E2A\u6761\u76EE`);
}

function deselectAllCurrentWorldEntries() {
  if (!activeInspectingWorldName) return;
  const settings3 = getSettings2();
  if (!settings3.video_asset_gen_world_entries) settings3.video_asset_gen_world_entries = {};
  settings3.video_asset_gen_world_entries[activeInspectingWorldName] = [];
  saveSettingsDebounced();
  renderEntryListUI(activeInspectingWorldName);
  renderWorldListUI();
  updateWorldBookBadgeAndCount();
  toastr.info(`\u5DF2\u6E05\u7A7A\u300C${activeInspectingWorldName}\u300D\u7684\u6761\u76EE\u52FE\u9009`);
}

async function selectConstantCurrentWorldEntries() {
  if (!activeInspectingWorldName) return;
  const entries = await ensureWorldEntriesLoaded(activeInspectingWorldName);
  const settings3 = getSettings2();
  if (!settings3.video_asset_gen_world_entries) settings3.video_asset_gen_world_entries = {};
  const constantUids = entries.filter((e) => e && e.constant === true).map((e) => String(e.uid));
  settings3.video_asset_gen_world_entries[activeInspectingWorldName] = constantUids;
  saveSettingsDebounced();
  renderEntryListUI(activeInspectingWorldName);
  renderWorldListUI();
  updateWorldBookBadgeAndCount();
  toastr.info(`\u5DF2\u5728\u300C${activeInspectingWorldName}\u300D\u4E2D\u4EC5\u52FE\u9009 ${constantUids.length} \u4E2A\u5E38\u5F00\u6761\u76EE`);
}

function cleanFloorText(text) {
  if (!text || typeof text !== "string") return "";
  let cleaned = text;
  cleaned = cleaned.replace(/\[st-chatu8-image[^\]]*\]/g, "");
  cleaned = cleaned.replace(/<image>[\s\S]*?<\/image>/gi, "");
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
  return cleaned.trim();
}

function processTextThroughRegex(text) {
  return new Promise((resolve) => {
    if (!text) {
      resolve("");
      return;
    }
    const requestId = `vag-body-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const timeoutId = setTimeout(() => {
      eventSource.removeListener(eventNames.REGEX_RESULT_MESSAGE, listener);
      resolve(text);
    }, 3e3);
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

async function collectAndSetBodyText(targetElement = null) {
  const settings3 = getSettings2();
  const depth = Math.max(1, Math.min(50, parseInt(settings3.video_asset_gen_floor_depth, 10) || 1));
  let collectedMessages = [];
  const context = getContext();
  const chat4 = context?.chat || [];
  let targetMesId = null;
  if (targetElement) {
    const mesContainer = targetElement.closest?.(".mes[mesid]");
    const mesIdAttr = mesContainer?.getAttribute?.("mesid");
    if (mesIdAttr !== null && mesIdAttr !== void 0 && !isNaN(parseInt(mesIdAttr, 10))) {
      targetMesId = parseInt(mesIdAttr, 10);
    }
  }
  if (chat4.length > 0) {
    const endId = targetMesId !== null && targetMesId >= 0 && targetMesId < chat4.length ? targetMesId : chat4.length - 1;
    const startId = Math.max(0, endId - depth + 1);
    for (let i = startId; i <= endId; i++) {
      const chatItem = chat4[i];
      if (!chatItem) continue;
      const rawText = chatItem.mes || "";
      const processedText = await processTextThroughRegex(rawText);
      const cleaned = cleanFloorText(processedText);
      if (!cleaned) continue;
      const charName = chatItem.name || (chatItem.is_user ? "\u7528\u6237" : "\u89D2\u8272");
      collectedMessages.push({
        mesId: i,
        charName,
        text: cleaned
      });
    }
  }
  if (collectedMessages.length === 0 && targetElement?.innerText) {
    const rawText = targetElement.innerText || "";
    const cleaned = cleanFloorText(rawText);
    if (cleaned) {
      collectedMessages.push({
        mesId: targetMesId ?? "0",
        charName: "\u6B63\u6587",
        text: cleaned
      });
    }
  }
  if (collectedMessages.length === 0) {
    toastr.warning("\u672A\u80FD\u83B7\u53D6\u5230\u6709\u6548\u7684\u697C\u5C42\u6B63\u6587\u6587\u672C");
    return false;
  }
  let finalText = "";
  if (collectedMessages.length === 1) {
    const single = collectedMessages[0];
    finalText = single.charName ? `\u3010${single.charName}\u3011
${single.text}` : single.text;
  } else {
    finalText = collectedMessages.map((m) => `\u3010${m.charName}\u3011
${m.text}`).join("\n\n");
  }
  settings3.video_asset_gen_body_text = finalText;
  saveSettingsDebounced();
  const $input = $("#vag-body-text-input");
  if ($input.length) {
    $input.val(finalText);
    $("#vag-body-text-count").text(`${finalText.length} \u5B57`);
  }
  toastr.success(`\u5DF2\u6210\u529F\u6536\u96C6 ${collectedMessages.length} \u6761\u697C\u5C42\u6B63\u6587\uFF08\u5168\u8986\u76D6\uFF0C\u5171 ${finalText.length} \u5B57\uFF09`);
  return true;
}

async function getSelectedWorldBookEntriesContent() {
  const settings3 = getSettings2();
  const selections = settings3.video_asset_gen_world_selections || {};
  const entriesMap = settings3.video_asset_gen_world_entries || {};
  const enabledBookNames = Object.keys(selections).filter((w) => selections[w]);
  if (enabledBookNames.length === 0) {
    return "";
  }
  const sections = [];
  for (const worldName of enabledBookNames) {
    const entries = await ensureWorldEntriesLoaded(worldName);
    if (!entries || entries.length === 0) continue;
    const selectedUids = new Set((entriesMap[worldName] || []).map(String));
    if (selectedUids.size === 0) continue;
    const selectedEntries = entries.filter((e) => e && selectedUids.has(String(e.uid)));
    if (selectedEntries.length === 0) continue;
    const formattedEntries = selectedEntries.map((entry) => {
      const title = entry.comment || `\u6761\u76EE #${entry.uid}`;
      const content = (entry.content || "").trim();
      if (!content) return null;
      return `[\u6761\u76EE: ${title}]
${content}`;
    }).filter(Boolean);
    if (formattedEntries.length > 0) {
      sections.push(`=== \u4E16\u754C\u4E66: \u300A${worldName}\u300B ===
` + formattedEntries.join("\n\n"));
    }
  }
  if (sections.length === 0) {
    return "";
  }
  return `\u3010\u53C2\u8003\u4E16\u754C\u4E66\u8BBE\u5B9A\u8D44\u6599\u3011
` + sections.join("\n\n");
}

function extractImagePrompt3(rawText) {
  if (!rawText || typeof rawText !== "string") return "";
  const text = rawText.trim();
  const contextTagMatch = text.match(/<context>([\s\S]*?)<\/context>/i);
  if (contextTagMatch && contextTagMatch[1].trim().length > 5) {
    let insideContext = contextTagMatch[1].trim();
    const innerCodeMatch = insideContext.match(/```(?:prompt|txt)?\s*([\s\S]*?)```/i);
    if (innerCodeMatch && innerCodeMatch[1].trim()) {
      insideContext = innerCodeMatch[1].trim();
    }
    return insideContext;
  }
  const codeBlockMatch = text.match(/```(?:prompt|txt)?\s*([\s\S]*?)```/i);
  if (codeBlockMatch && codeBlockMatch[1].trim().length > 10) {
    return codeBlockMatch[1].trim();
  }
  const sectionMatch = text.match(/(?:【(?:核心)?(?:生图)?提示词.*?】|Prompt\s*[:：])\s*([\s\S]*?)(?=\n\s*(?:【|[1-9]\.|\n\n|$))/i);
  if (sectionMatch && sectionMatch[1].trim().length > 10) {
    return sectionMatch[1].trim();
  }
  const tagMatch = text.match(/((?:masterpiece|best quality|highres|ultra-detailed|1girl|1boy|[a-z0-9_]+,)[^，。\n\r]{20,})/i);
  if (tagMatch && tagMatch[1].trim().length > 15) {
    return tagMatch[1].trim();
  }
  return text;
}

async function buildVideoAssetGenPrompt(userDemand) {
  let prompt2 = null;
  try {
    prompt2 = await LLM_VIDEO_ASSET_GEN_GET_PROMPT();
  } catch (e) {
    console.warn("[VideoAssetGen] \u83B7\u53D6\u89C6\u9891\u8D44\u4EA7\u751F\u6210\u914D\u7F6E\u63D0\u793A\u8BCD\u5931\u8D25\uFF0C\u56DE\u9000\u4F7F\u7528\u7CFB\u7EDF\u9884\u8BBE\u6A21\u677F:", e);
  }
  if (!Array.isArray(prompt2) || prompt2.length === 0) {
    prompt2 = [
      {
        role: "system",
        content: `\u4F60\u662F\u4E00\u540D\u9876\u7EA7\u89C6\u89C9\u6982\u5FF5\u8BBE\u8BA1\u603B\u76D1\u4E0E AI \u89C6\u89C9\u8D44\u4EA7\u4E13\u5BB6\u3002\u4F60\u80FD\u591F\u6839\u636E\u7528\u6237\u7684\u6307\u4EE4\u81EA\u5982\u6267\u884C\u4EE5\u4E0B\u4EFB\u52A1\uFF1A
1. \u3010\u751F\u56FE\u63D0\u793A\u8BCD\u751F\u6210\u3011\uFF1A\u6839\u636E\u9700\u6C42\u3001\u6B63\u6587\u6216\u53C2\u8003\u56FE\u751F\u6210\u4E13\u4E1A\u751F\u56FE\u63D0\u793A\u8BCD\u3002\u82E5\u7528\u6237\u6307\u5B9A\u5F15\u64CE\uFF08\u5982 NovelAI\u3001Flux/MJ\u81EA\u7136\u8BED\u8A00\uFF09\uFF0C\u4E25\u683C\u6309\u6307\u5B9A\u683C\u5F0F\u751F\u6210\uFF1B\u82E5\u672A\u6307\u5B9A\uFF0C\u9ED8\u8BA4\u6309 SDXL \u89C4\u8303\u7EC4\u7EC7\u3002\u4E25\u7981\u8F93\u51FA\u8D1F\u9762\u8BCD\uFF0C\u4E25\u7981\u540C\u65F6\u8F93\u51FA\u591A\u4E2A\u5F15\u64CE\u683C\u5F0F\uFF0C\u5728 <context> \u4E2D\u4EC5\u8F93\u51FA\u8FD9 1 \u4E2A\u6700\u7B26\u5408\u8981\u6C42\u7684\u63D0\u793A\u8BCD\uFF01
2. \u3010\u56FE\u7247\u8BC6\u522B\u4E0E\u89C6\u89C9\u63CF\u8FF0\u3011\uFF1A\u5F53\u7528\u6237\u8981\u6C42\u63CF\u8FF0\u3001\u5206\u6790\u6216\u62C6\u89E3\u53C2\u8003\u56FE\u7247\u65F6\uFF0C\u5FC5\u987B\u4F7F\u7528\u6D41\u7545\u4E14\u4E13\u4E1A\u7684\u3010\u4E2D\u6587\u81EA\u7136\u8BED\u8A00\u3011\u5BF9\u753B\u9762\u5C55\u5F00\u8BE6\u5C3D\u89E3\u6784\uFF08\u6CE8\u610F\uFF1A\u975E\u751F\u56FE\u82F1\u6587Tag\uFF09\u3002
3. \u3010\u4E13\u4E1A\u7B54\u7591\u4E0E\u5EFA\u8BAE\u3011\uFF1A\u5F53\u7528\u6237\u54A8\u8BE2\u955C\u5934\u5206\u955C\u3001\u5149\u5F71\u3001\u753B\u9762\u4F18\u5316\u7B49\u7591\u95EE\u65F6\uFF0C\u76F4\u63A5\u7ED9\u51FA\u4E13\u4E1A\u6DF1\u5165\u7684\u3010\u4E2D\u6587\u89E3\u7B54\u4E0E\u5EFA\u8BAE\u3011\u3002

\u3010\u6700\u9AD8\u6267\u884C\u94C1\u5F8B\u3011
1. \u7528\u6237\u9700\u6C42\u7B2C\u4E00\u4F18\u5148\uFF0C\u4E0E\u53C2\u8003\u56FE\u6216\u6B63\u6587\u51B2\u7A81\u65F6\u4EE5\u6587\u5B57\u9700\u6C42\u4E3A\u51C6\u3002
2. \u601D\u8003\u5168\u5165 thinking\uFF1A\u6240\u6709\u7684\u610F\u56FE\u62C6\u89E3\u4E0E\u63A8\u5BFC\u5206\u6790\u5FC5\u987B\u6536\u7EB3\u5728 <thinking> ... </thinking> \u5185\u90E8\u3002
3. \u8F93\u51FA\u5168\u5165 context\uFF1A\u6700\u7EC8\u6709\u6548\u6210\u679C\u5FC5\u987B\u4E14\u4EC5\u80FD\u5305\u88F9\u5728 <context> ... </context> \u5185\u90E8\uFF0C\u6807\u7B7E\u5916\u4E25\u7981\u4EFB\u4F55\u6587\u5B57\u3002
4. \u4E25\u7981\u8F93\u51FA\u4EFB\u4F55\u8F6F\u4EF6\u64CD\u4F5C\u6559\u5B66\u3001\u6B65\u9AA4\u6307\u5F15\u6216\u95F2\u804A\u5E9F\u8BDD\u3002`
      },
      {
        role: "user",
        content: `\u3010\u7528\u6237\u9700\u6C42\u4E0E\u7D20\u6750\u8981\u6C42\u3011
{{\u7528\u6237\u9700\u6C42}}

\u3010\u53C2\u8003\u6545\u4E8B\u6B63\u6587\u4E0E\u5267\u60C5\u60C5\u666F\u3011
{{\u6B63\u6587}}

\u3010\u53C2\u8003\u4E16\u754C\u4E66\u4E0E\u4E0A\u4E0B\u6587\u8BBE\u5B9A\u3011
{{\u4E16\u754C\u4E66}}

\u8BF7\u6839\u636E\u4EE5\u4E0A\u3010\u7528\u6237\u9700\u6C42\u3011\uFF08\u7B2C\u4E00\u51C6\u5219\u6700\u9AD8\u4F18\u5148\u7EA7\uFF09\u3001\u3010\u6B63\u6587\u3011\u5267\u60C5\u60C5\u666F\u4EE5\u53CA\u6240\u9644\u5E26\u7684\u53C2\u8003\u56FE\u7247\u7D20\u6750\uFF08\u5982\u6709\uFF09\uFF0C\u4E3A\u6211\u63D0\u53D6\u5173\u952E\u89C6\u89C9\u7279\u5F81\u3002\u8BF7\u5C06\u6240\u6709\u601D\u8003\u4E0E\u5206\u6790\u5168\u90E8\u653E\u5728 <thinking> \u91CC\uFF0C\u771F\u6B63\u7684\u6700\u7EC8\u6709\u6548\u6210\u679C\uFF08\u82E5\u4E3A\u751F\u56FE\u5219\u4EC5\u751F\u6210 1 \u4E2A\u63D0\u793A\u8BCD\uFF0C\u82E5\u4E3A\u770B\u56FE\u5219\u4F7F\u7528\u4E2D\u6587\u81EA\u7136\u8BED\u8A00\u63CF\u8FF0\uFF0C\u82E5\u4E3A\u7B54\u7591\u5219\u76F4\u63A5\u89E3\u7B54\uFF09\u4E25\u683C\u5305\u88F9\u5728 <context> \u91CC\u8F93\u51FA\uFF01`
      }
    ];
  }
  const worldBookText = await getSelectedWorldBookEntriesContent();
  const settings3 = getSettings2();
  const bodyText = (settings3.video_asset_gen_body_text || "").trim();
  let hasReplacedWorldBookPlaceholder = false;
  let hasReplacedBodyPlaceholder = false;
  prompt2.forEach((msg) => {
    if (typeof msg.content === "string") {
      if (/\{\{(?:世界书|worldbook|worldBookContent|世界书触发)\}\}/i.test(msg.content)) {
        hasReplacedWorldBookPlaceholder = true;
      }
      if (/\{\{(?:正文信息|正文|bodyText|contextText|楼层信息)\}\}/i.test(msg.content)) {
        hasReplacedBodyPlaceholder = true;
      }
    }
  });
  const demandText = (userDemand || "").trim() || "\uFF08\u7528\u6237\u672A\u8F93\u5165\u6587\u5B57\u9700\u6C42\uFF0C\u8BF7\u7ED3\u5408\u53C2\u8003\u9644\u4EF6\u3001\u5C0F\u8BF4\u6B63\u6587\u4E0E\u4E16\u754C\u4E66\u8BBE\u5B9A\u8FDB\u884C\u5206\u955C\u4E0E\u89C6\u89C9\u8BBE\u8BA1\uFF09";
  prompt2 = prompt2.map((msg) => {
    if (typeof msg.content === "string") {
      let updated = msg.content;
      if (hasReplacedWorldBookPlaceholder) {
        updated = updated.replace(/\{\{(?:世界书|worldbook|worldBookContent|世界书触发)\}\}/gi, worldBookText).replace(/%(?:世界书|worldbook)%/gi, worldBookText);
      }
      if (hasReplacedBodyPlaceholder) {
        updated = updated.replace(/\{\{(?:正文信息|正文|bodyText|contextText|楼层信息)\}\}/gi, bodyText).replace(/%(?:正文信息|正文)%/gi, bodyText);
      }
      let replacedDemand = demandText;
      const extraContextSections = [];
      if (!hasReplacedWorldBookPlaceholder && worldBookText) {
        extraContextSections.push(worldBookText);
      }
      if (!hasReplacedBodyPlaceholder && bodyText) {
        extraContextSections.push(`\u3010\u53C2\u8003\u6545\u4E8B\u6B63\u6587\u4E0E\u5267\u60C5\u4E0A\u4E0B\u6587\u3011
${bodyText}`);
      }
      if (extraContextSections.length > 0) {
        replacedDemand = `${extraContextSections.join("\n\n")}

\u3010\u7528\u6237\u9700\u6C42\u4E0E\u5206\u955C\u7D20\u6750\u8981\u6C42\u3011
${demandText}`;
      }
      updated = updated.replace(/\{\{用户需求\}\}/g, replacedDemand).replace(/\{\{userDemand\}\}/g, replacedDemand).replace(/%用户需求%/g, replacedDemand);
      return { ...msg, content: updated };
    }
    return msg;
  });
  const attachments = settings3.video_asset_gen_attachments || [];
  if (attachments.length > 0) {
    const userMsgIdx = findUserDemandMessageIndex(prompt2);
    if (userMsgIdx >= 0) {
      const collectedImages = attachments.map((att, i) => ({
        base64: att.dataUrl,
        name: `<\u53C2\u8003\u7D20\u6750 ${i + 1}: ${att.name}>`,
        description: att.description || ""
      }));
      prompt2 = attachImagesToMessage7(prompt2, userMsgIdx, collectedImages, "\u53C2\u8003\u7D20\u6750");
    }
  }
  return prompt2;
}

function extractVideoAssetGenPrompt(rawText) {
  if (!rawText || typeof rawText !== "string") {
    return "";
  }
  let text = rawText;
  const lowerText = text.toLowerCase();
  const lastThinkingIdx = lowerText.lastIndexOf("</thinking>");
  if (lastThinkingIdx !== -1) {
    text = text.substring(lastThinkingIdx + "</thinking>".length);
  }
  const closedContextMatch = text.match(/<context[^>]*>([\s\S]*?)<\/context>/i);
  if (closedContextMatch && closedContextMatch[1] !== void 0) {
    return closedContextMatch[1].trim();
  }
  const openContextMatch = text.match(/<context[^>]*>([\s\S]*)$/i);
  if (openContextMatch && openContextMatch[1] !== void 0) {
    return openContextMatch[1].trim();
  }
  return text.trim();
}

async function executeVideoAssetGeneration() {
  if (isGenerating2) return;
  const settings3 = getSettings2();
  const demand = ($("#vag-demand-input").val() || "").trim();
  const bodyText = (settings3.video_asset_gen_body_text || "").trim();
  const attachments = settings3.video_asset_gen_attachments || [];
  const selections = settings3.video_asset_gen_world_selections || {};
  const entriesMap = settings3.video_asset_gen_world_entries || {};
  const enabledBooks = Object.keys(selections).filter((w) => selections[w]);
  let totalSelectedEntriesCount = 0;
  enabledBooks.forEach((w) => {
    totalSelectedEntriesCount += (entriesMap[w] || []).length;
  });
  if (!demand && !bodyText && attachments.length === 0 && totalSelectedEntriesCount === 0) {
    toastr.warning("\u8BF7\u5148\u8F93\u5165\u7528\u6237\u9700\u6C42\u3001\u6B63\u6587\u4FE1\u606F\u3001\u6DFB\u52A0\u9644\u4EF6\u7D20\u6750\uFF0C\u6216\u5728\u4E16\u754C\u4E66\u4E2D\u52FE\u9009\u8BBE\u5B9A\u6761\u76EE\uFF01");
    $("#vag-demand-input").focus();
    return;
  }
  __set_isGenerating2(true);
  updateUIState(true);
  const startTime = Date.now();
  const worldBookPromptInfo = enabledBooks.length > 0 && totalSelectedEntriesCount > 0 ? `\u9644\u5E26 ${enabledBooks.length} \u672C\u4E16\u754C\u4E66\u5171 ${totalSelectedEntriesCount} \u4E2A\u6761\u76EE, ` : "";
  $("#vag-status-text").text(`\u6B63\u5728\u8C03\u7528\u89C6\u9891\u8D44\u4EA7\u751F\u6210 LLM (${worldBookPromptInfo}${attachments.length} \u4E2A\u7D20\u6750)...`);
  try {
    toastr.info(`\u{1F3AC} \u6B63\u5728\u7EC4\u88C5\u63D0\u793A\u8BCD${worldBookPromptInfo ? "\uFF08\u542B\u4E16\u754C\u4E66\u8BBE\u5B9A\uFF09" : ""}\u5E76\u8BF7\u6C42 LLM \u89C6\u9891\u8D44\u4EA7\u751F\u6210...`);
    const prompt2 = await buildVideoAssetGenPrompt(demand);
    const response = await LLM_VIDEO_ASSET_GEN(prompt2, { timeoutMs: 6e5 });
    const durationSec = ((Date.now() - startTime) / 1e3).toFixed(1);
    let resultText2 = "";
    if (typeof response === "object" && response !== null) {
      resultText2 = response.result || "";
    } else if (typeof response === "string") {
      resultText2 = response;
    }
    if (!resultText2) {
      throw new Error("LLM \u672A\u8FD4\u56DE\u6709\u6548\u5185\u5BB9");
    }
    const cleanedResult = extractVideoAssetGenPrompt(resultText2) || resultText2.trim();
    $("#vag-reply-output").val(cleanedResult).trigger("input");
    settings3.video_asset_gen_reply = cleanedResult;
    saveSettingsDebounced();
    $("#vag-status-text").text(`\u751F\u6210\u6210\u529F (\u8017\u65F6 ${durationSec}s)`);
    toastr.success(`\u{1F389} \u89C6\u9891\u8D44\u4EA7\u751F\u6210\u5B8C\u6210\uFF01(\u8017\u65F6 ${durationSec}s)`);
  } catch (err) {
    console.error("[VideoAssetGen] \u89C6\u9891\u8D44\u4EA7\u751F\u6210\u5931\u8D25:", err);
    const errMsg = err?.message || "\u672A\u77E5\u9519\u8BEF";
    $("#vag-status-text").text(`\u751F\u6210\u5931\u8D25: ${errMsg}`);
    toastr.error(`\u751F\u6210\u5931\u8D25: ${errMsg}`);
  } finally {
    __set_isGenerating2(false);
    updateUIState(false);
  }
}

function updateUIState(running) {
  const $genBtn = $("#vag-generate-btn");
  const $cancelBtn = $("#vag-cancel-btn");
  const $statusBar = $("#vag-status-bar");
  if (running) {
    $genBtn.prop("disabled", true).html('<i class="fa-solid fa-spinner fa-spin"></i> \u6B63\u5728\u751F\u6210\u63D0\u793A\u8BCD...');
    $cancelBtn.show();
    $statusBar.addClass("loading");
    $statusBar.find("i").attr("class", "fa-solid fa-spinner fa-spin").css("color", "var(--st-chatu8-accent-primary, #6366f1)");
  } else {
    $genBtn.prop("disabled", false).html('<i class="fa-solid fa-wand-magic-sparkles"></i> \u5F00\u59CB\u751F\u6210\u63D0\u793A\u8BCD');
    $cancelBtn.hide();
    $statusBar.removeClass("loading");
    $statusBar.find("i").attr("class", "fa-solid fa-circle-check").css("color", "#10b981");
  }
}

function updateImageUIState(running, statusMsg = "", type = "normal") {
  const $genBtn = $("#vag-generate-image-btn");
  const $cancelBtn = $("#vag-cancel-image-btn");
  const $statusBar = $("#vag-image-status-bar");
  const $statusText = $("#vag-image-status-text");
  if (running) {
    $genBtn.prop("disabled", true).html('<i class="fa-solid fa-spinner fa-spin"></i> \u6B63\u5728\u8C03\u7528\u5F15\u64CE\u751F\u56FE...');
    $cancelBtn.show();
    $statusBar.removeClass("error success").addClass("loading");
    $statusBar.find("i").attr("class", "fa-solid fa-spinner fa-spin");
    $statusText.text(statusMsg || "\u751F\u56FE\u5F15\u64CE\u5904\u7406\u4E2D\uFF0C\u8BF7\u7A0D\u5019...");
  } else {
    $genBtn.prop("disabled", false).html('<i class="fa-solid fa-image"></i> \u751F\u6210\u56FE\u7247 (\u8C03\u7528\u751F\u56FE\u529F\u80FD)');
    $cancelBtn.hide();
    $statusBar.removeClass("loading error success");
    if (type === "error") {
      $statusBar.addClass("error");
      $statusBar.find("i").attr("class", "fa-solid fa-circle-exclamation");
      $statusText.text(statusMsg || "\u751F\u56FE\u5931\u8D25");
    } else if (type === "success") {
      $statusBar.addClass("success");
      $statusBar.find("i").attr("class", "fa-solid fa-circle-check");
      $statusText.text(statusMsg || "\u751F\u56FE\u5B8C\u6210\u5E76\u5DF2\u5B58\u5165\u8D44\u4EA7\u5E93");
    } else {
      $statusBar.find("i").attr("class", "fa-regular fa-circle-check");
      $statusText.text(statusMsg || "\u5C31\u7EEA");
    }
  }
}

function cancelImageGeneration() {
  if (!isGeneratingImage) return;
  if (activeImageRequestId && activeImageListener) {
    try {
      eventSource.removeListener(EventType.GENERATE_IMAGE_RESPONSE, activeImageListener);
    } catch (e) {
      console.warn("[VideoAssetGen] \u79FB\u9664\u751F\u56FE\u76D1\u542C\u5668\u5931\u8D25:", e);
    }
  }
  __set_isGeneratingImage(false);
  __set_activeImageRequestId(null);
  __set_activeImageListener(null);
  updateImageUIState(false, "\u7528\u6237\u5DF2\u624B\u52A8\u53D6\u6D88\u751F\u56FE\u4EFB\u52A1");
  toastr.info("\u5DF2\u53D6\u6D88\u56FE\u7247\u751F\u6210\u4EFB\u52A1");
}

function renderGeneratedImageCard(imageData, asset, promptUsed) {
  const $card = $("#vag-image-result-card");
  if (!$card.length) return;
  let currentAsset = asset || null;
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString();
  const demandText = ($("#vag-demand-input").val() || "").trim();
  const assetName = currentAsset?.name || demandText.slice(0, 18) || `AI\u751F\u6210\u56FE\u7247_${(/* @__PURE__ */ new Date()).getHours()}\u65F6${(/* @__PURE__ */ new Date()).getMinutes()}\u5206`;
  const shortPrompt = (promptUsed || "").slice(0, 120) + ((promptUsed || "").length > 120 ? "..." : "");
  $card.html(`
        <div class="vag-section-header">
            <h4 class="vag-section-title">
                <i class="fa-solid fa-circle-check" style="color: #10b981;"></i> \u6700\u65B0\u751F\u6210\u56FE\u7247
            </h4>
            <div class="vag-image-result-badge-row">
                <span class="vag-badge" id="vag-asset-status-badge">
                    ${currentAsset ? '<i class="fa-solid fa-check-double" style="color:#10b981;"></i> \u5DF2\u5B58\u5165\u8D44\u4EA7\u5E93' : '<i class="fa-solid fa-image"></i> \u5DF2\u751F\u6210 (\u672A\u5165\u5E93)'}
                </span>
                <span class="vag-badge">${formattedTime}</span>
            </div>
        </div>
        <div class="vag-image-result-content">
            <div class="vag-image-result-thumb-wrap" id="vag-result-thumb" title="\u70B9\u51FB\u653E\u5927\u67E5\u770B">
                <img class="vag-image-result-thumb" src="${imageData}" alt="\u751F\u6210\u56FE\u7247">
                <div class="vag-image-result-thumb-overlay">
                    <i class="fa-solid fa-magnifying-glass-plus"></i>
                </div>
            </div>
            <div class="vag-image-result-info">
                <div class="vag-image-result-details">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <strong style="color: var(--st-chatu8-text-primary, #fff); font-size: 13px;">${escapeHtml10(assetName)}</strong>
                        ${currentAsset ? `<span class="vag-badge" style="font-size: 10px;">ID: ${escapeHtml10(currentAsset.id)}</span>` : ""}
                    </div>
                    <div style="font-size: 11.5px; color: var(--st-chatu8-text-secondary, #888); line-height: 1.4; word-break: break-all;">
                        <span style="color: #10b981; font-weight: 500;">\u751F\u56FEPrompt:</span> ${escapeHtml10(shortPrompt)}
                    </div>
                </div>
                <div class="vag-image-result-actions">
                    <button type="button" class="st-chatu8-btn st-chatu8-btn-sm" id="vag-btn-view-image-newtab" title="\u5728\u65B0\u7A97\u53E3\u6253\u5F00\u539F\u56FE">
                        <i class="fa-solid fa-up-right-from-square"></i> \u6253\u5F00\u539F\u56FE
                    </button>
                    <button type="button" class="st-chatu8-btn st-chatu8-btn-sm" id="vag-btn-download-image" title="\u4E0B\u8F7D\u6B64\u56FE\u7247\u5230\u672C\u5730">
                        <i class="fa-solid fa-download"></i> \u4E0B\u8F7D\u56FE\u7247
                    </button>
                    <button type="button" class="st-chatu8-btn st-chatu8-btn-sm ${currentAsset ? "" : "primary"}" id="vag-btn-save-as-asset-item" title="\u5C06\u6B64\u56FE\u7247\u4FDD\u5B58\u4E3A\u89C6\u9891\u8D44\u4EA7">
                        <i class="fa-solid ${currentAsset ? "fa-check" : "fa-folder-plus"}"></i> ${currentAsset ? "\u5DF2\u5B58\u4E3A\u8D44\u4EA7" : "\u5B58\u4E3A\u8D44\u4EA7"}
                    </button>
                    <button type="button" class="st-chatu8-btn st-chatu8-btn-sm" id="vag-btn-add-as-attachment" title="\u5C06\u6B64\u56FE\u7247\u6DFB\u52A0\u4E3A\u53C2\u8003\u7D20\u6750\u9644\u4EF6">
                        <i class="fa-solid fa-plus"></i> \u8F6C\u4E3A\u53C2\u8003\u9644\u4EF6
                    </button>
                    <button type="button" class="st-chatu8-btn st-chatu8-btn-sm" id="vag-btn-set-as-img2img" title="\u5C06\u6B64\u56FE\u7247\u8BBE\u4E3A\u56FE\u751F\u56FE\u53C2\u8003\u56FE">
                        <i class="fa-solid fa-wand-magic-sparkles"></i> \u8BBE\u4E3A\u56FE\u751F\u56FE\u53C2\u8003
                    </button>
                </div>
            </div>
        </div>
    `).fadeIn(200);
  $("#vag-result-thumb").on("click", () => {
    openPreviewModal(imageData);
  });
  $("#vag-btn-view-image-newtab").on("click", () => {
    const win = window.open();
    if (win) {
      win.document.write(`<img src="${imageData}" style="max-width:100%; height:auto; display:block; margin:auto;" />`);
    }
  });
  $("#vag-btn-download-image").on("click", () => {
    const a = document.createElement("a");
    a.href = imageData;
    const safeName = (currentAsset?.name || assetName).replace(/[^\w\u4e00-\u9fa5]/g, "_");
    a.download = `${safeName}_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toastr.success("\u5DF2\u5F00\u59CB\u4E0B\u8F7D\u751F\u6210\u7684\u56FE\u7247");
  });
  $("#vag-btn-set-as-img2img").on("click", () => {
    setImg2ImgRefImage(imageData, currentAsset?.name || assetName);
    toastr.success("\u5DF2\u5C06\u5F53\u524D\u751F\u6210\u7684\u56FE\u7247\u8BBE\u4E3A\u56FE\u751F\u56FE\u53C2\u8003\u56FE\uFF01");
  });
  $("#vag-btn-save-as-asset-item").on("click", async function() {
    const $btn = $(this);
    if (currentAsset) {
      toastr.info(`\u6B64\u56FE\u7247\u5DF2\u5B58\u4E3A\u8D44\u4EA7\uFF1A\u3010${currentAsset.name}\u3011`);
      return;
    }
    const nameInput = prompt("\u8BF7\u8F93\u5165\u65B0\u89C6\u9891\u8D44\u4EA7\u540D\u79F0\uFF1A", assetName);
    if (!nameInput) return;
    try {
      $btn.prop("disabled", true).html('<i class="fa-solid fa-spinner fa-spin"></i> \u4FDD\u5B58\u4E2D...');
      const fileid = await saveConfigImage(imageData, {
        fileName: `vag_img_${Date.now()}.png`
      });
      currentAsset = addVideoAsset({
        name: nameInput.trim(),
        category: "character",
        description: promptUsed || "",
        fileid,
        enabled: true
      });
      __set_latestGeneratedAsset(currentAsset);
      $btn.removeClass("primary").html('<i class="fa-solid fa-check"></i> \u5DF2\u5B58\u4E3A\u8D44\u4EA7').prop("disabled", true);
      $("#vag-asset-status-badge").html('<i class="fa-solid fa-check-double" style="color:#10b981;"></i> \u5DF2\u5B58\u5165\u8D44\u4EA7\u5E93');
      toastr.success(`\u5DF2\u6210\u529F\u5C06\u56FE\u7247\u5B58\u5165\u89C6\u9891\u8D44\u4EA7\u5E93\uFF1A\u3010${currentAsset.name}\u3011\uFF01\u53EF\u5728\u3010\u89C6\u9891\u8D44\u4EA7\u3011\u9875\u9762\u67E5\u770B\u3002`);
    } catch (err) {
      console.error("[VideoAssetGen] \u624B\u52A8\u5B58\u5165\u8D44\u4EA7\u5E93\u5931\u8D25:", err);
      $btn.prop("disabled", false).html('<i class="fa-solid fa-folder-plus"></i> \u5B58\u4E3A\u8D44\u4EA7');
      toastr.error(`\u5B58\u4E3A\u8D44\u4EA7\u5931\u8D25: ${err.message}`);
    }
  });
  $("#vag-btn-add-as-attachment").on("click", () => {
    const newItem = {
      id: `vag_att_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: currentAsset?.name || assetName,
      sourceType: currentAsset ? "video_asset" : "custom_upload",
      assetId: currentAsset?.id || "",
      fileid: currentAsset?.fileid || "",
      dataUrl: imageData,
      description: promptUsed || ""
    };
    addAttachmentItem(newItem);
    toastr.success(`\u5DF2\u5C06\u751F\u6210\u56FE\u7247\u6DFB\u52A0\u4E3A\u53C2\u8003\u7D20\u6750 #${getSettings2().video_asset_gen_attachments.length}`);
  });
}

async function executeImageGeneration() {
  if (isGeneratingImage) {
    toastr.warning("\u5DF2\u6709\u751F\u56FE\u4EFB\u52A1\u6B63\u5728\u8FD0\u884C\u4E2D\uFF0C\u8BF7\u7A0D\u5019\u6216\u53D6\u6D88\u5F53\u524D\u4EFB\u52A1");
    return;
  }
  const rawReply = ($("#vag-reply-output").val() || "").trim();
  const rawDemand = ($("#vag-demand-input").val() || "").trim();
  if (!rawReply && !rawDemand) {
    toastr.warning("\u8BF7\u5148\u751F\u6210\u6216\u8F93\u5165\u56FE\u7247\u63D0\u793A\u8BCD (Prompt) \u540E\u518D\u70B9\u51FB\u751F\u56FE\uFF01");
    $("#vag-reply-output").focus();
    return;
  }
  let promptToUse = extractImagePrompt3(rawReply);
  if (!promptToUse) {
    promptToUse = rawReply || rawDemand;
  }
  const hasImg2ImgRef = !!currentImg2ImgRefImage;
  const currentMode2 = extension_settings[extensionName]?.mode;
  if (hasImg2ImgRef && currentMode2 !== "banana") {
    toastr.warning("\u26A0\uFE0F \u5F53\u524D\u63D2\u4EF6\u751F\u56FE\u6E20\u9053\u975E OpenAI (Banana)\uFF0C\u56FE\u751F\u56FE\u53C2\u8003\u56FE\u4EC5\u5728 OpenAI / Grok \u6E20\u9053\u4E0B\u652F\u6301\uFF0C\u8BF7\u5148\u5728\u63D2\u4EF6\u751F\u56FE\u8BBE\u7F6E\u4E2D\u5207\u6362\u751F\u56FE\u6E20\u9053\uFF01");
    return;
  }
  const requestId = `vag_img_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  __set_activeImageRequestId(requestId);
  __set_isGeneratingImage(true);
  const isImg2Img = hasImg2ImgRef && currentMode2 === "banana";
  const statusMsg = isImg2Img ? "\u6B63\u5728\u8C03\u7528 OpenAI / Grok \u6E20\u9053\u6267\u884C\u56FE\u751F\u56FE..." : "\u6B63\u5728\u53D1\u9001\u751F\u56FE\u6307\u4EE4\u81F3\u751F\u56FE\u5F15\u64CE...";
  updateImageUIState(true, statusMsg);
  toastr.info(isImg2Img ? "\u{1F3A8} \u6B63\u5728\u8C03\u7528 OpenAI \u6E20\u9053\u6267\u884C\u56FE\u751F\u56FE..." : "\u{1F3A8} \u6B63\u5728\u8C03\u7528\u751F\u56FE\u529F\u80FD\u751F\u6210\u56FE\u7247\u8D44\u4EA7...", "\u751F\u56FE\u8BF7\u6C42\u5DF2\u53D1\u9001", { timeOut: 3e3 });
  const startTime = Date.now();
  const handleImageResponse2 = async (responseData) => {
    if (!responseData || responseData.id !== requestId) {
      return;
    }
    try {
      eventSource.removeListener(EventType.GENERATE_IMAGE_RESPONSE, handleImageResponse2);
    } catch (e) {
      console.warn("[VideoAssetGen] \u79FB\u9664\u76D1\u542C\u5668\u5F02\u5E38:", e);
    }
    __set_activeImageListener(null);
    __set_isGeneratingImage(false);
    __set_activeImageRequestId(null);
    const durationSec = ((Date.now() - startTime) / 1e3).toFixed(1);
    if (responseData.success && responseData.imageData) {
      __set_latestGeneratedImageData(responseData.imageData);
      __set_latestGeneratedAsset(null);
      renderGeneratedImageCard(responseData.imageData, null, promptToUse);
      updateImageUIState(false, `\u751F\u56FE\u6210\u529F (\u8017\u65F6 ${durationSec}s)`, "success");
      toastr.success(`\u{1F389} \u56FE\u7247\u751F\u6210\u6210\u529F\uFF01(\u8017\u65F6 ${durationSec}s)`);
    } else {
      const errDetail = responseData.error || "\u751F\u56FE\u5F15\u64CE\u8FD4\u56DE\u5931\u8D25\u6216\u672A\u8FD4\u56DE\u56FE\u7247\u6570\u636E";
      updateImageUIState(false, `\u751F\u56FE\u5931\u8D25: ${errDetail}`, "error");
      toastr.error(`\u751F\u56FE\u5931\u8D25: ${errDetail}`);
    }
  };
  __set_activeImageListener(handleImageResponse2);
  eventSource.on(EventType.GENERATE_IMAGE_RESPONSE, handleImageResponse2);
  try {
    const payload = {
      id: requestId,
      prompt: promptToUse
    };
    if (isImg2Img) {
      payload.change = "{\u4FEE\u56FE}";
      payload.retouchImage = currentImg2ImgRefImage;
      payload.retouchPrompt = promptToUse;
    }
    eventSource.emit(EventType.GENERATE_IMAGE_REQUEST, payload);
  } catch (emitErr) {
    console.error("[VideoAssetGen] \u53D1\u9001\u751F\u56FE\u8BF7\u6C42\u5931\u8D25:", emitErr);
    eventSource.removeListener(EventType.GENERATE_IMAGE_RESPONSE, handleImageResponse2);
    __set_isGeneratingImage(false);
    __set_activeImageRequestId(null);
    __set_activeImageListener(null);
    updateImageUIState(false, `\u53D1\u9001\u751F\u56FE\u6307\u4EE4\u5F02\u5E38: ${emitErr.message}`, "error");
    toastr.error(`\u53D1\u9001\u751F\u56FE\u6307\u4EE4\u5931\u8D25: ${emitErr.message}`);
  }
}

async function saveReplyAsVideoAsset() {
  const replyText = ($("#vag-reply-output").val() || "").trim();
  if (!replyText) {
    toastr.warning("\u56DE\u590D\u8F93\u5165\u6846\u4E2D\u6682\u65E0\u5185\u5BB9\u53EF\u5B58\u4E3A\u8D44\u4EA7\uFF01");
    return;
  }
  const defaultName = ($("#vag-demand-input").val() || "").trim().slice(0, 16) || "\u89C6\u9891\u5206\u955C\u65B9\u6848";
  const assetName = prompt("\u8BF7\u8F93\u5165\u65B0\u89C6\u9891\u8D44\u4EA7\u540D\u79F0\uFF1A", defaultName);
  if (!assetName) return;
  try {
    const settings3 = getSettings2();
    const attachments = settings3.video_asset_gen_attachments || [];
    let fileid = "";
    if (attachments.length > 0 && attachments[0].dataUrl) {
      fileid = await saveConfigImage(attachments[0].dataUrl);
    }
    const newAsset = addVideoAsset({
      name: assetName,
      category: "scene",
      description: replyText,
      fileid,
      enabled: true
    });
    toastr.success(`\u5DF2\u6210\u529F\u521B\u5EFA\u89C6\u9891\u8D44\u4EA7\uFF1A\u3010${newAsset.name}\u3011\uFF01\u53EF\u5728\u3010\u89C6\u9891\u8D44\u4EA7\u3011\u9875\u9762\u67E5\u770B\u3002`);
  } catch (err) {
    console.error("[VideoAssetGen] \u4FDD\u5B58\u89C6\u9891\u8D44\u4EA7\u5931\u8D25:", err);
    toastr.error(`\u4FDD\u5B58\u89C6\u9891\u8D44\u4EA7\u5931\u8D25: ${err.message}`);
  }
}

function sendReplyToVideoTestPrompt() {
  const replyText = ($("#vag-reply-output").val() || "").trim();
  if (!replyText) {
    toastr.warning("\u56DE\u590D\u8F93\u5165\u6846\u4E2D\u6682\u65E0\u5185\u5BB9\uFF01");
    return;
  }
  const settings3 = getSettings2();
  settings3.comfyui_video_test_prompt = replyText;
  settings3.runninghub_video_test_prompt = replyText;
  saveSettingsDebounced();
  const $comfyInput = $("#comfyui_video_test_prompt");
  if ($comfyInput.length) {
    $comfyInput.val(replyText).trigger("input");
  }
  const $rhInput = $("#runninghub_video_test_prompt");
  if ($rhInput.length) {
    $rhInput.val(replyText).trigger("input");
  }
  toastr.success("\u5DF2\u586B\u5165 ComfyUI\u89C6\u9891 \u548C RunningHub\u89C6\u9891 \u7684\u6D4B\u8BD5\u63D0\u793A\u8BCD\u6846\uFF01");
}

function refreshVideoAssetGenUI() {
  const settings3 = getSettings2();
  if (!settings3) return;
  const $demand = $("#vag-demand-input");
  if ($demand.length && settings3.video_asset_gen_demand !== void 0) {
    $demand.val(settings3.video_asset_gen_demand);
    $("#vag-demand-count").text(`${settings3.video_asset_gen_demand.length} \u5B57`);
  }
  const $bodyInput = $("#vag-body-text-input");
  const bodyText = settings3.video_asset_gen_body_text || "";
  if ($bodyInput.length) {
    $bodyInput.val(bodyText);
    $("#vag-body-text-count").text(`${bodyText.length} \u5B57`);
  }
  const $depthInput = $("#vag-floor-depth");
  if ($depthInput.length) {
    $depthInput.val(settings3.video_asset_gen_floor_depth || 1);
  }
  const $reply = $("#vag-reply-output");
  if ($reply.length && settings3.video_asset_gen_reply !== void 0) {
    $reply.val(settings3.video_asset_gen_reply);
  }
  refreshWorldBookDualList();
  const isWbCollapsed = settings3.video_asset_gen_worldbook_collapsed !== void 0 ? !!settings3.video_asset_gen_worldbook_collapsed : true;
  setWorldBookPanelCollapsed(isWbCollapsed, false);
  renderAttachmentsList();
}

function initVideoAssetGenUI($modal2) {
  __set_$container($("#ch-tab-video_asset_gen"));
  if (!$container.length) return;
  const settings3 = getSettings2();
  if (settings3.video_asset_gen_demand === void 0) settings3.video_asset_gen_demand = "";
  if (settings3.video_asset_gen_reply === void 0) settings3.video_asset_gen_reply = "";
  if (!Array.isArray(settings3.video_asset_gen_attachments)) settings3.video_asset_gen_attachments = [];
  if (!settings3.video_asset_gen_world_selections || typeof settings3.video_asset_gen_world_selections !== "object") {
    settings3.video_asset_gen_world_selections = {};
  }
  if (!settings3.video_asset_gen_world_entries || typeof settings3.video_asset_gen_world_entries !== "object") {
    settings3.video_asset_gen_world_entries = {};
  }
  if (settings3.video_asset_gen_worldbook_collapsed === void 0) {
    settings3.video_asset_gen_worldbook_collapsed = true;
  }
  const $demandInput = $("#vag-demand-input");
  $demandInput.val(settings3.video_asset_gen_demand || "");
  $("#vag-demand-count").text(`${(settings3.video_asset_gen_demand || "").length} \u5B57`);
  $demandInput.on("input", function() {
    const val = $(this).val();
    settings3.video_asset_gen_demand = val;
    $("#vag-demand-count").text(`${val.length} \u5B57`);
    saveSettingsDebounced();
  });
  const $replyOutput = $("#vag-reply-output");
  $replyOutput.val(settings3.video_asset_gen_reply || "");
  $replyOutput.on("input", function() {
    const val = $(this).val();
    settings3.video_asset_gen_reply = val;
    saveSettingsDebounced();
  });
  $("#vag-btn-clear-demand").on("click", () => {
    $demandInput.val("").trigger("input");
    toastr.info("\u9700\u6C42\u5185\u5BB9\u5DF2\u6E05\u7A7A");
  });
  const $bodyInput = $("#vag-body-text-input");
  $bodyInput.val(settings3.video_asset_gen_body_text || "");
  $("#vag-body-text-count").text(`${(settings3.video_asset_gen_body_text || "").length} \u5B57`);
  $bodyInput.on("input", function() {
    const val = $(this).val();
    settings3.video_asset_gen_body_text = val;
    $("#vag-body-text-count").text(`${val.length} \u5B57`);
    saveSettingsDebounced();
  });
  const $depthInput = $("#vag-floor-depth");
  $depthInput.val(settings3.video_asset_gen_floor_depth || 1);
  $depthInput.on("input change", function() {
    let depth = parseInt($(this).val(), 10);
    if (isNaN(depth) || depth < 1) depth = 1;
    if (depth > 50) depth = 50;
    $(this).val(depth);
    settings3.video_asset_gen_floor_depth = depth;
    saveSettingsDebounced();
  });
  $("#vag-btn-clear-body-text").on("click", () => {
    $bodyInput.val("").trigger("input");
    toastr.info("\u6B63\u6587\u4FE1\u606F\u5DF2\u6E05\u7A7A");
  });
  $("#vag-btn-copy-body-text").on("click", () => {
    const val = $bodyInput.val() || "";
    if (!val) {
      toastr.warning("\u6B63\u6587\u5185\u5BB9\u4E3A\u7A7A");
      return;
    }
    navigator.clipboard.writeText(val).then(() => {
      toastr.success("\u6B63\u6587\u5185\u5BB9\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F");
    }).catch((err) => {
      console.error("\u590D\u5236\u5931\u8D25:", err);
      toastr.error("\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u9009\u62E9\u590D\u5236");
    });
  });
  $("#vag-btn-collect-latest").on("click", async () => {
    await collectAndSetBodyText(null);
  });
  $("#vag-btn-pick-asset").on("click", () => {
    openVideoAssetPicker({
      type: "img",
      title: '<i class="fa-solid fa-photo-film" style="color: #60a5fa;"></i> \u9009\u53D6\u89C6\u9891\u8D44\u4EA7\u4F5C\u4E3A\u53C2\u8003\u7D20\u6750',
      onSelect: (asset, fileBlob, dataUrl) => {
        const newItem = {
          id: `vag_att_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          name: asset.name || "\u672A\u547D\u540D\u8D44\u4EA7",
          sourceType: "video_asset",
          assetId: asset.id,
          fileid: asset.fileid,
          dataUrl,
          description: asset.description || ""
        };
        addAttachmentItem(newItem);
        toastr.success(`\u5DF2\u6DFB\u52A0\u7D20\u6750\uFF1A${asset.name}`);
      }
    });
  });
  const $fileInput3 = $("#vag-file-input");
  $("#vag-btn-upload-file").on("click", () => {
    $fileInput3.val("").click();
  });
  $fileInput3.on("change", async function(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    toastr.info(`\u6B63\u5728\u8BFB\u53D6\u5E76\u538B\u7F29 ${files.length} \u5F20\u56FE\u7247...`);
    let addedCount = 0;
    for (const file of files) {
      try {
        const dataUrl = await readFileAsCompressedDataUrl(file);
        addAttachmentItem({
          id: `vag_att_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          name: file.name,
          sourceType: "upload",
          dataUrl,
          description: ""
        });
        addedCount++;
      } catch (err) {
        console.error("[VideoAssetGen] \u8BFB\u53D6\u672C\u5730\u6587\u4EF6\u5931\u8D25:", file.name, err);
        toastr.error(`\u56FE\u7247 ${file.name} \u8BFB\u53D6\u5931\u8D25`);
      }
    }
    if (addedCount > 0) {
      toastr.success(`\u6210\u529F\u8F7D\u5165 ${addedCount} \u5F20\u672C\u5730\u56FE\u7247`);
    }
  });
  $container.on("paste", async function(e) {
    const clipboardData = e.originalEvent?.clipboardData || window.clipboardData;
    if (!clipboardData) return;
    const items = Array.from(clipboardData.items || []);
    const imageItems = items.filter((item) => item.type.startsWith("image/"));
    if (imageItems.length === 0) return;
    e.preventDefault();
    toastr.info("\u68C0\u6D4B\u5230\u526A\u8D34\u677F\u622A\u56FE\uFF0C\u6B63\u5728\u5BFC\u5165\u9644\u4EF6...");
    for (const item of imageItems) {
      const file = item.getAsFile();
      if (file) {
        try {
          const dataUrl = await readFileAsCompressedDataUrl(file);
          const now = /* @__PURE__ */ new Date();
          const name = `\u526A\u8D34\u677F\u622A\u56FE_${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}${now.getSeconds().toString().padStart(2, "0")}.png`;
          addAttachmentItem({
            id: `vag_att_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            name,
            sourceType: "upload",
            dataUrl,
            description: ""
          });
          toastr.success(`\u5DF2\u6DFB\u52A0\u622A\u56FE\u9644\u4EF6\uFF1A${name}`);
        } catch (err) {
          console.error("[VideoAssetGen] \u7C98\u8D34\u56FE\u7247\u89E3\u6790\u5931\u8D25:", err);
        }
      }
    }
  });
  $("#vag-btn-clear-attachments").on("click", () => {
    const curAtts = settings3.video_asset_gen_attachments || [];
    if (curAtts.length === 0) {
      toastr.info("\u5F53\u524D\u6CA1\u6709\u9700\u8981\u6E05\u7A7A\u7684\u7D20\u6750");
      return;
    }
    if (confirm(`\u786E\u5B9A\u8981\u6E05\u7A7A\u5168\u90E8 ${curAtts.length} \u4E2A\u9644\u4EF6\u7D20\u6750\u5417\uFF1F`)) {
      settings3.video_asset_gen_attachments = [];
      saveSettingsDebounced();
      renderAttachmentsList();
      toastr.success("\u5DF2\u6E05\u7A7A\u6240\u6709\u9644\u4EF6\u7D20\u6750");
    }
  });
  $("#vag-generate-btn").on("click", () => {
    executeVideoAssetGeneration();
  });
  $("#vag-cancel-btn").on("click", () => {
    if (isGenerating2) {
      __set_isGenerating2(false);
      updateUIState(false);
      $("#vag-status-text").text("\u4EFB\u52A1\u5DF2\u624B\u52A8\u4E2D\u6B62");
      toastr.info("\u5DF2\u4E2D\u6B62\u751F\u6210\u4EFB\u52A1");
    }
  });
  $("#vag-btn-copy-reply").on("click", () => {
    const text = ($("#vag-reply-output").val() || "").trim();
    if (!text) {
      toastr.warning("\u56DE\u590D\u6846\u5185\u5BB9\u4E3A\u7A7A");
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      toastr.success("\u5DF2\u590D\u5236\u751F\u6210\u56DE\u590D\u5230\u526A\u8D34\u677F\uFF01");
    }).catch((err) => {
      toastr.error("\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u9009\u62E9\u590D\u5236");
    });
  });
  $("#vag-btn-clear-reply").on("click", () => {
    $("#vag-reply-output").val("").trigger("input");
    toastr.info("\u56DE\u590D\u5185\u5BB9\u5DF2\u6E05\u7A7A");
  });
  $("#vag-btn-save-as-asset").on("click", () => {
    saveReplyAsVideoAsset();
  });
  $("#vag-btn-send-to-test").on("click", () => {
    sendReplyToVideoTestPrompt();
  });
  $("#vag-generate-image-btn").on("click", () => {
    executeImageGeneration();
  });
  $("#vag-cancel-image-btn").on("click", () => {
    cancelImageGeneration();
  });
  const $img2ImgFileInput = $("#vag-img2img-file-input");
  $("#vag-btn-upload-img2img, #vag-btn-change-img2img, #vag-img2img-empty").on("click", () => {
    $img2ImgFileInput.val("").click();
  });
  $img2ImgFileInput.on("change", async function(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsCompressedDataUrl(file);
      setImg2ImgRefImage(dataUrl, file.name);
      toastr.success(`\u5DF2\u8F7D\u5165\u56FE\u751F\u56FE\u53C2\u8003\u56FE\uFF1A${file.name}`);
    } catch (err) {
      console.error("[VideoAssetGen] \u8BFB\u53D6\u56FE\u751F\u56FE\u672C\u5730\u56FE\u7247\u5931\u8D25:", err);
      toastr.error(`\u8BFB\u53D6\u56FE\u7247\u5931\u8D25: ${err.message}`);
    }
  });
  $("#vag-btn-pick-img2img").on("click", () => {
    openVideoAssetPicker({
      type: "img",
      title: '<i class="fa-solid fa-wand-magic-sparkles" style="color: #6366f1;"></i> \u9009\u53D6\u89C6\u9891\u8D44\u4EA7\u4F5C\u4E3A\u56FE\u751F\u56FE\u53C2\u8003\u56FE',
      onSelect: (asset, fileBlob, dataUrl) => {
        if (dataUrl) {
          setImg2ImgRefImage(dataUrl, asset.name || "\u89C6\u9891\u8D44\u4EA7\u53C2\u8003\u56FE.png");
          toastr.success(`\u5DF2\u9009\u5B9A\u56FE\u751F\u56FE\u53C2\u8003\u56FE\uFF1A${asset.name}`);
        } else {
          toastr.error("\u6240\u9009\u8D44\u4EA7\u56FE\u7247\u6570\u636E\u65E0\u6548");
        }
      }
    });
  });
  $("#vag-btn-clear-img2img, #vag-btn-remove-img2img").on("click", () => {
    clearImg2ImgRefImage();
  });
  $("#vag-img2img-thumb-box").on("click", () => {
    if (currentImg2ImgRefImage) {
      openPreviewModal(currentImg2ImgRefImage);
    }
  });
  const $img2imgCard = $("#vag-img2img-card");
  $img2imgCard.on("dragover dragenter", function(e) {
    e.preventDefault();
    e.stopPropagation();
    $(this).addClass("drag-over");
  });
  $img2imgCard.on("dragleave dragend drop", function(e) {
    e.preventDefault();
    e.stopPropagation();
    $(this).removeClass("drag-over");
  });
  $img2imgCard.on("drop", async function(e) {
    const files = Array.from(e.originalEvent?.dataTransfer?.files || []);
    const imageFile = files.find((f) => f.type.startsWith("image/"));
    if (imageFile) {
      try {
        const dataUrl = await readFileAsCompressedDataUrl(imageFile);
        setImg2ImgRefImage(dataUrl, imageFile.name);
        toastr.success(`\u5DF2\u62D6\u62FD\u8F7D\u5165\u56FE\u751F\u56FE\u53C2\u8003\u56FE\uFF1A${imageFile.name}`);
      } catch (err) {
        console.error("[VideoAssetGen] \u62D6\u62FD\u56FE\u7247\u89E3\u6790\u5931\u8D25:", err);
      }
    }
  });
  $("#vag-mobile-tab-worlds").on("click", () => {
    switchMobileTab("worlds");
  });
  $("#vag-mobile-tab-entries").on("click", () => {
    switchMobileTab("entries");
  });
  $("#vag-world-filter-pills .vag-filter-pill").on("click", function() {
    const filterVal = $(this).data("filter") || "all";
    if (currentWorldFilter !== filterVal) {
      __set_currentWorldFilter(filterVal);
      renderWorldListUI();
    }
  });
  $("#vag-entry-filter-pills .vag-filter-pill").on("click", function() {
    const filterVal = $(this).data("filter") || "all";
    if (currentEntryFilter !== filterVal) {
      __set_currentEntryFilter(filterVal);
      __set_currentEntryDisplayedCount(currentEntryPageSize);
      if (activeInspectingWorldName) {
        renderEntryListUI(activeInspectingWorldName);
      }
    }
  });
  $("#vag-btn-refresh-worlds").on("click", async () => {
    toastr.info("\u6B63\u5728\u5237\u65B0\u4E16\u754C\u4E66\u5217\u8868...");
    await refreshWorldBookDualList();
    toastr.success("\u4E16\u754C\u4E66\u5217\u8868\u5DF2\u66F4\u65B0");
  });
  $("#vag-btn-toggle-worldbook-collapse").on("click", () => {
    const settings4 = getSettings2();
    const currentCollapsed = !!settings4.video_asset_gen_worldbook_collapsed;
    const nextCollapsed = !currentCollapsed;
    settings4.video_asset_gen_worldbook_collapsed = nextCollapsed;
    saveSettingsDebounced();
    setWorldBookPanelCollapsed(nextCollapsed, true);
  });
  $("#vag-world-search-input").on("input", function() {
    __set_currentWorldSearchKeyword($(this).val());
    renderWorldListUI();
  });
  $("#vag-btn-select-all-worlds").on("click", () => {
    selectAllWorlds();
  });
  $("#vag-btn-deselect-all-worlds").on("click", () => {
    deselectAllWorlds();
  });
  $("#vag-entry-search-input").on("input", function() {
    __set_currentEntrySearchKeyword($(this).val());
    __set_currentEntryDisplayedCount(currentEntryPageSize);
    if (activeInspectingWorldName) {
      renderEntryListUI(activeInspectingWorldName);
    }
  });
  $("#vag-btn-select-all-entries").on("click", () => {
    selectAllCurrentWorldEntries();
  });
  $("#vag-btn-deselect-all-entries").on("click", () => {
    deselectAllCurrentWorldEntries();
  });
  $("#vag-btn-toggle-constant-entries").on("click", () => {
    selectConstantCurrentWorldEntries();
  });
  $("#vag-btn-reset-all").on("click", () => {
    if (confirm("\u786E\u5B9A\u8981\u91CD\u7F6E\u300C\u89C6\u9891\u8D44\u4EA7\u751F\u6210\u300D\u9875\u9762\u7684\u5168\u90E8\u8F93\u5165\u3001\u4E16\u754C\u4E66\u9009\u62E9\u3001\u9644\u4EF6\u53CA\u56DE\u590D\u5417\uFF1F")) {
      $demandInput.val("").trigger("input");
      $replyOutput.val("").trigger("input");
      $bodyInput.val("");
      $("#vag-body-text-count").text("0 \u5B57");
      settings3.video_asset_gen_body_text = "";
      settings3.video_asset_gen_attachments = [];
      settings3.video_asset_gen_world_selections = {};
      settings3.video_asset_gen_world_entries = {};
      __set_currentWorldSearchKeyword("");
      __set_currentEntrySearchKeyword("");
      __set_currentWorldFilter("all");
      __set_currentEntryFilter("all");
      __set_currentEntryDisplayedCount(currentEntryPageSize);
      $("#vag-world-search-input").val("");
      $("#vag-entry-search-input").val("");
      switchMobileTab("worlds");
      renderWorldListUI();
      if (activeInspectingWorldName) {
        renderEntryListUI(activeInspectingWorldName);
      }
      updateWorldBookBadgeAndCount();
      settings3.video_asset_gen_worldbook_collapsed = true;
      setWorldBookPanelCollapsed(true, false);
      $("#vag-image-result-card").hide().empty();
      updateImageUIState(false, "\u5C31\u7EEA");
      saveSettingsDebounced();
      renderAttachmentsList();
      toastr.success("\u5DF2\u91CD\u7F6E\u5168\u90E8\u5185\u5BB9");
    }
  });
  $("#vag-preview-close, #vag-preview-modal").on("click", function(e) {
    if (e.target === this || $(this).hasClass("vag-preview-close")) {
      closePreviewModal();
    }
  });
  renderAttachmentsList();
  refreshWorldBookDualList();
  const isWbCollapsed = settings3.video_asset_gen_worldbook_collapsed !== void 0 ? !!settings3.video_asset_gen_worldbook_collapsed : true;
  setWorldBookPanelCollapsed(isWbCollapsed, false);
}

export function __set_$grid(v) { $grid = v; }

export function __set_$emptyHint(v) { $emptyHint = v; }

export function __set_$editModal(v) { $editModal = v; }

export function __set_$fileInput2(v) { $fileInput2 = v; }

export function __set_$imagePreview(v) { $imagePreview = v; }

export function __set_$previewWrapper(v) { $previewWrapper = v; }

export function __set_$uploadPlaceholder(v) { $uploadPlaceholder = v; }

export function __set_$inputCategory2(v) { $inputCategory2 = v; }

export function __set_$inputName2(v) { $inputName2 = v; }

export function __set_$displayFileid(v) { $displayFileid = v; }

export function __set_$inputFileid(v) { $inputFileid = v; }

export function __set_$inputDesc2(v) { $inputDesc2 = v; }

export function __set_$inputEnabled(v) { $inputEnabled = v; }

export function __set_$inputId(v) { $inputId = v; }

export function __set_$modalTitle(v) { $modalTitle = v; }

export function __set_$privacyToggleBtn(v) { $privacyToggleBtn = v; }

export function __set_currentCategoryFilter2(v) { currentCategoryFilter2 = v; }

export function __set_currentSearchQuery2(v) { currentSearchQuery2 = v; }

export function __set_isPrivacyMode(v) { isPrivacyMode = v; }

export function __set_pendingImportPackage(v) { pendingImportPackage = v; }

export function __set_isInitialized4(v) { isInitialized4 = v; }

export { $displayFileid, $editModal, $emptyHint, $fileInput2, $grid, $imagePreview, $inputCategory2, $inputDesc2, $inputEnabled, $inputFileid, $inputId, $inputName2, $modalTitle, $previewWrapper, $privacyToggleBtn, $uploadPlaceholder, collectAndSetBodyText, currentCategoryFilter2, currentSearchQuery2, initVideoAssetGenUI, isInitialized4, isPrivacyMode, pendingImportPackage, refreshVideoAssetGenUI };
