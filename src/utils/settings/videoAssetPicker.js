// 还原自打包产物 — 原始模块: utils/settings/videoAssetPicker.js
import { getConfigFile, getConfigImage } from "../configDatabase.js";
import { getCategoryLabel, getVideoAssets } from "../videoAssetsService.js";

var $pickerModal, currentCategoryFilter, currentPickerOptions, currentSearchQuery, llm_exports;

$pickerModal = null;

currentPickerOptions = null;

currentCategoryFilter = "all";

currentSearchQuery = "";


function escapeHtml2(str) {
  if (!str || typeof str !== "string") return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function ensurePickerModal() {
  if ($pickerModal && $pickerModal.length) {
    return;
  }
  $("#st-chatu8-asset-picker-modal").remove();
  const modalHtml = `
        <div id="st-chatu8-asset-picker-modal" class="st-chatu8-modal-backdrop st-chatu8-workflow-viz-backdrop" style="display: none; position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; height: 100dvh !important; background: rgba(0, 0, 0, 0.75) !important; z-index: 999999 !important; backdrop-filter: blur(4px); align-items: center; justify-content: center; box-sizing: border-box;">
            <div class="st-chatu8-modal-content" style="max-width: 860px; width: 92%; max-height: 85vh; margin: auto; display: flex; flex-direction: column; overflow: hidden; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.7); background: var(--st-chatu8-bg-primary, #1e1e2e); color: var(--st-chatu8-text-primary, #fff); border: 1px solid var(--st-chatu8-border-color, rgba(255,255,255,0.15)); position: relative; z-index: 1000000;">
                <!-- \u6A21\u6001\u6846\u5934\u90E8 -->
                <div class="st-chatu8-modal-header" style="flex-shrink: 0; padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center;">
                    <h3 id="st-chatu8-asset-picker-title" style="margin: 0; font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-photo-film" style="color: #60a5fa;"></i> \u4ECE\u89C6\u9891\u8D44\u4EA7\u83B7\u53D6\u7D20\u6750
                    </h3>
                    <span id="st-chatu8-asset-picker-close" class="st-chatu8-modal-close" style="font-size: 24px; cursor: pointer; opacity: 0.7; transition: opacity 0.2s;">&times;</span>
                </div>

                <!-- \u6A21\u6001\u6846\u9876\u90E8\u64CD\u4F5C\u680F\uFF1A\u5B50\u5206\u7C7B\u836F\u4E38 + \u641C\u7D22\u6846 -->
                <div style="flex-shrink: 0; padding: 10px 20px; background: rgba(0,0,0,0.15); border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; flex-wrap: wrap; gap: 10px; justify-content: space-between; align-items: center;">
                    <div id="st-chatu8-picker-nav" style="display: flex; flex-wrap: wrap; gap: 6px;">
                        <!-- \u52A8\u6001\u586B\u5145\u5206\u7C7B\u6807\u7B7E -->
                    </div>
                    <div style="position: relative; flex-grow: 1; max-width: 260px;">
                        <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 12px; color: #888; pointer-events: none;"></i>
                        <input type="text" id="st-chatu8-picker-search" class="st-chatu8-text-input" placeholder="\u641C\u7D22\u540D\u79F0\u6216\u7B80\u4ECB..." style="width: 100%; padding-left: 28px; padding-right: 24px; font-size: 12px; height: 30px; border-radius: 15px;">
                        <i id="st-chatu8-picker-search-clear" class="fa-solid fa-circle-xmark" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); font-size: 12px; color: #888; cursor: pointer; display: none;"></i>
                    </div>
                </div>

                <!-- \u6A21\u6001\u6846\u5361\u7247\u7F51\u683C\u4E3B\u4F53 -->
                <div class="st-chatu8-modal-body" style="padding: 16px 20px; overflow-y: auto; flex: 1; min-height: 0;">
                    <div id="st-chatu8-picker-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px;">
                        <!-- \u52A8\u6001\u586B\u5145\u8D44\u4EA7\u5361\u7247 -->
                    </div>
                    <div id="st-chatu8-picker-empty" style="display: none; text-align: center; padding: 40px 20px; color: var(--st-chatu8-text-secondary, #888);">
                        <i class="fa-regular fa-folder-open" style="font-size: 42px; opacity: 0.4; margin-bottom: 12px;"></i>
                        <div style="font-size: 14px; font-weight: 500;" id="st-chatu8-picker-empty-title">\u5F53\u524D\u6682\u65E0\u53EF\u7528\u7D20\u6750</div>
                        <div style="font-size: 12px; opacity: 0.7; margin-top: 6px;" id="st-chatu8-picker-empty-sub">\u60A8\u53EF\u4EE5\u524D\u5F80\u3010\u89C6\u9891\u8D44\u4EA7\u3011\u9875\u9762\u8FDB\u884C\u6DFB\u52A0\u6216\u4E0A\u4F20</div>
                    </div>
                </div>

                <!-- \u6A21\u6001\u6846\u5E95\u90E8\u8BF4\u660E -->
                <div style="flex-shrink: 0; padding: 10px 20px; border-top: 1px solid rgba(255,255,255,0.08); font-size: 12px; color: var(--st-chatu8-text-secondary, #888); display: flex; justify-content: space-between; align-items: center;">
                    <span><i class="fa-solid fa-circle-info"></i> \u70B9\u51FB\u4EFB\u610F\u5361\u7247\u5373\u53EF\u5C06\u5176\u8F7D\u5165\u5F53\u524D\u4F4D\u7F6E</span>
                    <button type="button" class="st-chatu8-btn" id="st-chatu8-picker-cancel-btn" style="padding: 4px 14px; font-size: 12px;">\u53D6\u6D88</button>
                </div>
            </div>
        </div>
    `;
  const $parent = $("#st-chatu8-settings").length ? $("#st-chatu8-settings") : $("body");
  $parent.append(modalHtml);
  $pickerModal = $("#st-chatu8-asset-picker-modal");
  $("#st-chatu8-asset-picker-close, #st-chatu8-picker-cancel-btn").on("click", () => {
    closeVideoAssetPicker();
  });
  const $searchInput = $("#st-chatu8-picker-search");
  const $searchClear = $("#st-chatu8-picker-search-clear");
  $searchInput.on("input", function() {
    currentSearchQuery = $(this).val().trim().toLowerCase();
    $searchClear.toggle(currentSearchQuery.length > 0);
    renderPickerGrid();
  });
  $searchClear.on("click", function() {
    $searchInput.val("");
    currentSearchQuery = "";
    $(this).hide();
    renderPickerGrid();
  });
}

function updatePickerNavHighlight($nav, activeKey) {
  $nav.find("button[data-picker-cat]").each(function() {
    const isCur = $(this).attr("data-picker-cat") === activeKey;
    if (isCur) {
      $(this).addClass("st-chatu8-btn-primary active").css({
        "background": "var(--st-chatu8-accent-primary, #60a5fa)",
        "color": "#ffffff",
        "border-color": "var(--st-chatu8-accent-primary, #60a5fa)",
        "box-shadow": "0 2px 8px rgba(96, 165, 250, 0.4)",
        "font-weight": "600",
        "cursor": "default"
      });
    } else {
      $(this).removeClass("st-chatu8-btn-primary active").css({
        "background": "var(--st-chatu8-bg-tertiary, rgba(255,255,255,0.06))",
        "color": "var(--st-chatu8-text-secondary, #aaa)",
        "border-color": "var(--st-chatu8-border-color, rgba(255,255,255,0.12))",
        "box-shadow": "none",
        "font-weight": "normal",
        "cursor": "pointer"
      });
    }
  });
}

function renderPickerNav(type) {
  const $nav = $("#st-chatu8-picker-nav");
  $nav.empty();
  if (type === "aud") {
    $nav.html(`
            <span class="st-chatu8-btn st-chatu8-btn-primary active st-chatu8-btn-sm" style="border-radius: 12px; pointer-events: none; background: var(--st-chatu8-accent-primary, #60a5fa); color: #fff; font-weight: 600; padding: 4px 12px; font-size: 11px;">
                <i class="fa-solid fa-music"></i> \u97F3\u9891\u8D44\u4EA7
            </span>
        `);
    return;
  }
  const imgCategories = [
    { key: "all", label: "\u5168\u90E8\u56FE\u7247", icon: "fa-border-all" },
    { key: "character", label: "\u89D2\u8272", icon: "fa-user" },
    { key: "body_part", label: "\u90E8\u4F4D", icon: "fa-hand" },
    { key: "scene", label: "\u573A\u666F", icon: "fa-mountain-sun" },
    { key: "prop", label: "\u9053\u5177", icon: "fa-wand-magic-sparkles" },
    { key: "pose", label: "\u59FF\u52BF", icon: "fa-person-walking" }
  ];
  imgCategories.forEach((cat) => {
    const $pill = $(`
            <button type="button" class="st-chatu8-btn st-chatu8-btn-sm" style="border-radius: 12px; font-size: 11px; padding: 4px 11px; transition: all 0.2s;" data-picker-cat="${cat.key}">
                <i class="fa-solid ${cat.icon}"></i> ${cat.label}
            </button>
        `);
    $pill.on("click", function() {
      currentCategoryFilter = cat.key;
      updatePickerNavHighlight($nav, cat.key);
      renderPickerGrid();
    });
    $nav.append($pill);
  });
  updatePickerNavHighlight($nav, currentCategoryFilter);
}

function renderPickerGrid() {
  const $grid2 = $("#st-chatu8-picker-grid");
  const $empty = $("#st-chatu8-picker-empty");
  $grid2.empty();
  if (!currentPickerOptions) return;
  const type = currentPickerOptions.type || "img";
  const allAssets = getVideoAssets();
  let filtered = allAssets.filter((a) => {
    if (type === "aud") {
      return a.category === "audio";
    } else {
      return a.category !== "audio";
    }
  });
  if (type === "img" && currentCategoryFilter !== "all") {
    filtered = filtered.filter((a) => a.category === currentCategoryFilter);
  }
  if (currentSearchQuery) {
    filtered = filtered.filter((a) => {
      const name = (a.name || "").toLowerCase();
      const desc = (a.description || "").toLowerCase();
      const fid = (a.fileid || "").toLowerCase();
      return name.includes(currentSearchQuery) || desc.includes(currentSearchQuery) || fid.includes(currentSearchQuery);
    });
  }
  if (filtered.length === 0) {
    if (type === "aud") {
      $("#st-chatu8-picker-empty-title").text("\u89C6\u9891\u8D44\u4EA7\u5E93\u4E2D\u6682\u65E0\u97F3\u9891\u7D20\u6750");
      $("#st-chatu8-picker-empty-sub").text("\u8BF7\u524D\u5F80\u3010\u89C6\u9891\u8D44\u4EA7\u3011\u9875\u9762\u6DFB\u52A0\u97F3\u9891\u8D44\u4EA7\uFF0C\u6216\u76F4\u63A5\u5728\u5F53\u524D\u5361\u7247\u70B9\u51FB\u3010\u672C\u5730\u4E0A\u4F20\u3011");
    } else {
      $("#st-chatu8-picker-empty-title").text("\u5F53\u524D\u6682\u65E0\u5339\u914D\u7684\u56FE\u7247\u7D20\u6750");
      $("#st-chatu8-picker-empty-sub").text("\u60A8\u53EF\u4EE5\u5207\u6362\u5206\u7C7B\u3001\u6E05\u7A7A\u641C\u7D22\uFF0C\u6216\u524D\u5F80\u3010\u89C6\u9891\u8D44\u4EA7\u3011\u9875\u9762\u6DFB\u52A0\u7D20\u6750");
    }
    $empty.show();
    return;
  }
  $empty.hide();
  filtered.forEach((asset) => {
    const isAudio = asset.category === "audio";
    const catLabel = getCategoryLabel(asset.category);
    const cardHtml = `
            <div class="st-chatu8-picker-card" data-id="${asset.id}" style="border: 1px solid var(--st-chatu8-border-color, rgba(255,255,255,0.12)); border-radius: 8px; overflow: hidden; background: var(--st-chatu8-bg-secondary, rgba(255,255,255,0.04)); cursor: pointer; transition: all 0.2s ease; display: flex; flex-direction: column;">
                <div style="position: relative; height: 110px; background: rgba(0,0,0,0.3); overflow: hidden; display: flex; align-items: center; justify-content: center;">
                    ${isAudio ? `
                        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; width: 100%; padding: 10px;">
                            <i class="fa-solid fa-music" style="font-size: 28px; color: #ec4899; opacity: 0.9;"></i>
                            <span style="font-size: 11px; color: #aaa; max-width: 90%; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">\u97F3\u9891\u7D20\u6750</span>
                        </div>
                    ` : `
                        <img class="st-chatu8-picker-img" src="" alt="${escapeHtml2(asset.name)}" style="width: 100%; height: 100%; object-fit: contain; display: none;">
                        <div class="st-chatu8-picker-img-placeholder" style="font-size: 24px; opacity: 0.3;">
                            <i class="fa-solid fa-image"></i>
                        </div>
                    `}
                    <div style="position: absolute; top: 6px; left: 6px; background: rgba(0,0,0,0.65); backdrop-filter: blur(4px); border-radius: 4px; padding: 2px 6px; font-size: 10px; color: #eee; display: flex; align-items: center; gap: 4px;">
                        ${isAudio ? '<i class="fa-solid fa-music" style="color: #ec4899;"></i>' : '<i class="fa-solid fa-tag" style="color: #60a5fa;"></i>'}
                        <span>${catLabel}</span>
                    </div>
                </div>
                <div style="padding: 10px; display: flex; flex-direction: column; gap: 4px; flex: 1;">
                    <div style="font-size: 12px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;" title="${escapeHtml2(asset.name)}">
                        ${escapeHtml2(asset.name || "\u672A\u547D\u540D\u7D20\u6750")}
                    </div>
                    <div style="font-size: 11px; color: var(--st-chatu8-text-secondary, #888); line-height: 1.3; height: 28px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;" title="${escapeHtml2(asset.description || "")}">
                        ${escapeHtml2(asset.description || "\u65E0\u63CF\u8FF0\u8BF4\u660E")}
                    </div>
                </div>
            </div>
        `;
    const $card = $(cardHtml);
    $card.hover(
      function() {
        $(this).css({
          "border-color": "var(--st-chatu8-accent-primary, #60a5fa)",
          "transform": "translateY(-2px)",
          "box-shadow": "0 4px 14px rgba(96, 165, 250, 0.25)"
        });
      },
      function() {
        $(this).css({
          "border-color": "var(--st-chatu8-border-color, rgba(255,255,255,0.12))",
          "transform": "none",
          "box-shadow": "none"
        });
      }
    );
    if (!isAudio && asset.fileid) {
      getConfigImage(asset.fileid).then((dataUrl) => {
        if (dataUrl) {
          $card.find(".st-chatu8-picker-img").attr("src", dataUrl).show();
          $card.find(".st-chatu8-picker-img-placeholder").hide();
        }
      }).catch(() => {
      });
    }
    $card.on("click", async function() {
      if (!currentPickerOptions || !currentPickerOptions.onSelect) return;
      const selectCallback = currentPickerOptions.onSelect;
      closeVideoAssetPicker();
      try {
        if (isAudio) {
          toastr.info(`\u6B63\u5728\u8BFB\u53D6\u97F3\u9891\u7D20\u6750 [${asset.name}]...`);
          const fileEntry = await getConfigFile(asset.fileid, { kind: "audio" });
          if (!fileEntry || !fileEntry.data) {
            throw new Error("\u672A\u8BFB\u53D6\u5230\u97F3\u9891\u5E95\u5C42\u6570\u636E");
          }
          const blob = fileEntry.data instanceof Blob ? fileEntry.data : new Blob([fileEntry.data], { type: fileEntry.mimeType || "audio/mpeg" });
          selectCallback(asset, blob, null);
        } else {
          toastr.info(`\u6B63\u5728\u8BFB\u53D6\u56FE\u7247\u7D20\u6750 [${asset.name}]...`);
          const dataUrl = await getConfigImage(asset.fileid);
          if (!dataUrl) {
            throw new Error("\u672A\u8BFB\u53D6\u5230\u56FE\u7247\u5E95\u5C42\u6570\u636E");
          }
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          selectCallback(asset, blob, dataUrl);
        }
      } catch (err) {
        console.error("[VideoAssetPicker] \u8BFB\u53D6\u9009\u5B9A\u7D20\u6750\u5931\u8D25:", err);
        toastr.error(`\u8BFB\u53D6\u7D20\u6750\u5931\u8D25: ${err.message}`);
      }
    });
    $grid2.append($card);
  });
}

function openVideoAssetPicker(options = {}) {
  ensurePickerModal();
  currentPickerOptions = options;
  currentCategoryFilter = "all";
  currentSearchQuery = "";
  const type = options.type || "img";
  const isAudio = type === "aud";
  const defaultTitle = isAudio ? '<i class="fa-solid fa-music" style="color: #ec4899;"></i> \u4ECE\u89C6\u9891\u8D44\u4EA7\u83B7\u53D6\u97F3\u9891\u7D20\u6750' : '<i class="fa-solid fa-photo-film" style="color: #60a5fa;"></i> \u4ECE\u89C6\u9891\u8D44\u4EA7\u83B7\u53D6\u56FE\u7247\u7D20\u6750';
  $("#st-chatu8-asset-picker-title").html(options.title || defaultTitle);
  $("#st-chatu8-picker-search").val("");
  $("#st-chatu8-picker-search-clear").hide();
  renderPickerNav(type);
  renderPickerGrid();
  $pickerModal.css("display", "flex").hide().fadeIn(150);
}

function closeVideoAssetPicker() {
  if ($pickerModal) {
    $pickerModal.fadeOut(150);
  }
  currentPickerOptions = null;
}

export { llm_exports, openVideoAssetPicker };
