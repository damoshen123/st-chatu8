// 还原自打包产物 — 原始模块: utils/configStorageCleanupModal.js
import { getConfigImage } from "./configDatabase.js";
import { showToast, stylishConfirm } from "./ui_common.js";
import { CONFIG_FOLDER2, MODAL_ID } from "./ui.js";
import { cleanupConfigStorage, diagnoseConfigStorage } from "./configStorageDiagnose.js";

var CONFIG_DB_NAME2, CONFIG_FOLDER, CONFIG_STORE_NAME2;

var CONFIG_FOLDER = "chatu8_config";

var CONFIG_DB_NAME2 = "chatu8_config_images";

var CONFIG_STORE_NAME2 = "config_images";
function fileUrl(fileName) {
  return `/user/images/${CONFIG_FOLDER2}/${encodeURIComponent(fileName)}`;
}

function escapeHtml3(str) {
  return String(str ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function fmtSize(bytes) {
  if (typeof bytes !== "number" || !isFinite(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fmtMB2(bytes) {
  return `${((bytes || 0) / 1024 / 1024).toFixed(1)} MB`;
}

async function showConfigStorageCleanupModal() {
  $(`#${MODAL_ID}`).remove();
  const parent = document.getElementById("st-chatu8-settings") || document.body;
  const $backdrop = $(`
        <div id="${MODAL_ID}" class="st-chatu8-modal-backdrop st-chatu8-cfgclean-modal"
             style="position:fixed; top:0; left:0; width:100%; height:100%; z-index:10200;">
            <div class="st-chatu8-confirm-box st-chatu8-popup-modal st-chatu8-popup-modal-large"
                 style="max-width:700px; max-height:85vh; overflow-y:auto;">
                <h3 class="st-chatu8-popup-title">\u914D\u7F6E\u5B58\u50A8\u6E05\u7406</h3>
                <div class="st-chatu8-cfgclean-body">
                    <div class="st-chatu8-cfgclean-empty">\u6B63\u5728\u626B\u63CF...</div>
                </div>
                <div class="st-chatu8-confirm-buttons">
                    <button class="st-chatu8-btn st-chatu8-cfgclean-close-btn">\u5173\u95ED</button>
                </div>
            </div>
        </div>
    `);
  $(parent).append($backdrop);
  const $body = $backdrop.find(".st-chatu8-cfgclean-body");
  const close = () => {
    $backdrop.remove();
  };
  $backdrop.find(".st-chatu8-cfgclean-close-btn").on("click", close);
  $backdrop.on("click", (e) => {
    if (e.target === $backdrop[0]) close();
  });
  await renderContent($body, $backdrop);
}

async function renderContent($body, $backdrop) {
  $body.html('<div class="st-chatu8-cfgclean-empty">\u6B63\u5728\u626B\u63CF\u670D\u52A1\u5668\u6587\u4EF6\u4E0E\u6CE8\u518C\u8868...</div>');
  let data;
  try {
    data = await diagnoseConfigStorage();
  } catch (e) {
    $body.html(`<div class="st-chatu8-cfgclean-empty">\u626B\u63CF\u5931\u8D25: ${escapeHtml3(e.message)}</div>`);
    return;
  }
  if (data.error) {
    $body.html(`<div class="st-chatu8-cfgclean-empty">\u626B\u63CF\u5931\u8D25: ${escapeHtml3(data.error)}</div>`);
    return;
  }
  const orphans = data.orphans || [];
  const sizes = data.orphanSizes || {};
  const riskySet = new Set(data.orphanRisky || []);
  const missingEntries = data.missingEntries || [];
  const unrefList = data.unreferencedImages || [];
  const summary = `\u670D\u52A1\u5668\u6587\u4EF6 ${data.serverFileCount} \u4E2A \xB7 \u65E0\u4E3B\u5E9F\u5F03\u56FE\u7247 ${unrefList.length} \u4E2A\uFF08${fmtMB2(data.unreferencedTotalBytes)}\uFF09\xB7 \u5B64\u513F\u6587\u4EF6 ${orphans.length} \u4E2A\uFF08${fmtMB2(data.orphanTotalBytes)}\uFF09\xB7 \u5931\u6548\u5F15\u7528 ${missingEntries.length} \u6761`;
  const parts = [`<p class="st-chatu8-popup-description">${escapeHtml3(summary)}</p>`];
  parts.push('<div class="st-chatu8-cfgclean-section-title">\u65E0\u4E3B\u5E9F\u5F03\u89D2\u8272/\u670D\u88C5\u56FE\u7247\uFF08\u89D2\u8272\u8BBE\u8BA1\u8986\u76D6\u6216\u5220\u9664\u540E\u6B8B\u7559\uFF0C\u65E0\u4EFB\u4F55\u9884\u8BBE\u4F7F\u7528\uFF09</div>');
  if (!unrefList.length) {
    parts.push('<div class="st-chatu8-cfgclean-empty">\u6CA1\u6709\u65E0\u4E3B\u5E9F\u5F03\u56FE\u7247\uFF0C\u6240\u6709\u914D\u7F6E\u56FE\u7247\u5747\u5904\u4E8E\u6709\u6548\u5F15\u7528\u4E2D\u3002</div>');
  } else {
    parts.push(`
            <div class="st-chatu8-import-toolbar">
                <button class="st-chatu8-btn" data-act="unref-all"><i class="fa-solid fa-check-double"></i> \u5168\u9009</button>
                <button class="st-chatu8-btn" data-act="unref-none"><i class="fa-solid fa-xmark"></i> \u53D6\u6D88\u5168\u9009</button>
                <button class="st-chatu8-btn danger" data-act="unref-del"><i class="fa-solid fa-trash"></i> \u5220\u9664\u9009\u4E2D</button>
            </div>
            <div class="st-chatu8-import-list" data-list="unref">
        `);
    unrefList.forEach((item, i) => {
      const id = `cfgclean-unref-${i}`;
      const isServer = item.storage === "server";
      const thumbSrc = isServer && item.fileName ? fileUrl(item.fileName) : "";
      parts.push(`
                <div class="st-chatu8-import-item st-chatu8-cfgclean-item">
                    <input type="checkbox" class="st-chatu8-import-checkbox" id="${id}"
                           data-unref-id="${escapeHtml3(item.id)}" checked>
                    <div class="st-chatu8-cfgclean-thumb" data-id="${escapeHtml3(item.id)}" ${isServer && item.fileName ? `data-file="${escapeHtml3(item.fileName)}"` : ""} title="\u70B9\u51FB\u9884\u89C8">
                        ${isServer && thumbSrc ? `<img loading="lazy" src="${thumbSrc}" alt="${escapeHtml3(item.id)}">` : `<div class="st-chatu8-thumb-loading" data-load-id="${escapeHtml3(item.id)}"><i class="fa-solid fa-spinner fa-spin"></i></div>`}
                    </div>
                    <label class="st-chatu8-import-name" for="${id}">
                        ${escapeHtml3(item.id)}
                        <span class="st-chatu8-cfgclean-size" style="margin-left: 8px; color: ${isServer ? "#4CAF50" : "#2196F3"}; font-size: 11px;">
                            [${isServer ? "\u670D\u52A1\u5668\u5B58\u50A8" : "\u672C\u5730IndexedDB"}]
                        </span>
                        ${item.size ? `<span class="st-chatu8-cfgclean-size">${fmtSize(item.size)}</span>` : ""}
                    </label>
                </div>
            `);
    });
    parts.push("</div>");
  }
  parts.push('<div class="st-chatu8-cfgclean-section-title">\u670D\u52A1\u5668\u7EAF\u5B64\u513F\u6587\u4EF6\uFF08\u670D\u52A1\u5668\u786C\u76D8\u4E0A\u5B58\u5728\uFF0C\u4F46\u672A\u5728\u6CE8\u518C\u8868\u4E2D\u767B\u8BB0\uFF09</div>');
  if (!orphans.length) {
    parts.push('<div class="st-chatu8-cfgclean-empty">\u6CA1\u6709\u5B64\u513F\u6587\u4EF6\uFF0C\u65E0\u9700\u6E05\u7406\u3002</div>');
  } else {
    parts.push(`
            <div class="st-chatu8-import-toolbar">
                <button class="st-chatu8-btn" data-act="orphan-all"><i class="fa-solid fa-check-double"></i> \u5168\u9009</button>
                <button class="st-chatu8-btn" data-act="orphan-none"><i class="fa-solid fa-xmark"></i> \u53D6\u6D88\u5168\u9009</button>
                <button class="st-chatu8-btn danger" data-act="orphan-del"><i class="fa-solid fa-trash"></i> \u5220\u9664\u9009\u4E2D</button>
            </div>
            <div class="st-chatu8-import-list" data-list="orphan">
        `);
    orphans.forEach((f, i) => {
      const risky = riskySet.has(f);
      const id = `cfgclean-orphan-${i}`;
      parts.push(`
                <div class="st-chatu8-import-item st-chatu8-cfgclean-item">
                    <input type="checkbox" class="st-chatu8-import-checkbox" id="${id}"
                           data-file="${escapeHtml3(f)}" ${risky ? "" : "checked"}>
                    <div class="st-chatu8-cfgclean-thumb" data-file="${escapeHtml3(f)}" title="\u70B9\u51FB\u9884\u89C8">
                        <img loading="lazy" src="${fileUrl(f)}" alt="${escapeHtml3(f)}">
                    </div>
                    <label class="st-chatu8-import-name" for="${id}">
                        ${escapeHtml3(f)}
                        <span class="st-chatu8-cfgclean-size">${fmtSize(sizes[f])}</span>
                        ${risky ? '<span class="st-chatu8-cfgclean-badge">\u9700\u4EBA\u5DE5\u786E\u8BA4</span>' : ""}
                    </label>
                </div>
            `);
    });
    parts.push("</div>");
    parts.push('<div class="st-chatu8-cfgclean-empty">\u63D0\u793A\uFF1A\u90E8\u5206\u6587\u4EF6\u662F\u4F2A\u88C5\u6210 .png \u7684 JSON \u6570\u636E\uFF0C\u7F29\u7565\u56FE\u65E0\u6CD5\u663E\u793A\u5C5E\u6B63\u5E38\u73B0\u8C61\u3002</div>');
  }
  parts.push('<div class="st-chatu8-cfgclean-section-title">\u5931\u6548\u5F15\u7528\uFF08\u6CE8\u518C\u8868\u6709\u8BB0\u5F55\uFF0C\u4F46\u670D\u52A1\u5668\u6587\u4EF6\u5DF2\u4E0D\u5B58\u5728\uFF09</div>');
  if (!missingEntries.length) {
    parts.push('<div class="st-chatu8-cfgclean-empty">\u6CA1\u6709\u5931\u6548\u5F15\u7528\u3002</div>');
  } else {
    parts.push(`
            <div class="st-chatu8-import-toolbar">
                <button class="st-chatu8-btn" data-act="dead-all"><i class="fa-solid fa-check-double"></i> \u5168\u9009</button>
                <button class="st-chatu8-btn" data-act="dead-none"><i class="fa-solid fa-xmark"></i> \u53D6\u6D88\u5168\u9009</button>
                <button class="st-chatu8-btn danger" data-act="dead-del"><i class="fa-solid fa-broom"></i> \u6E05\u7406\u9009\u4E2D</button>
            </div>
            <div class="st-chatu8-import-list" data-list="dead">
        `);
    missingEntries.forEach((e, i) => {
      const id = `cfgclean-dead-${i}`;
      parts.push(`
                <div class="st-chatu8-import-item st-chatu8-cfgclean-item">
                    <input type="checkbox" class="st-chatu8-import-checkbox" id="${id}"
                           data-key="${escapeHtml3(e.key)}" checked>
                    <label class="st-chatu8-import-name" for="${id}">
                        ${escapeHtml3(e.key)}
                        <span class="st-chatu8-cfgclean-size">${escapeHtml3(e.kind)}</span>
                    </label>
                </div>
            `);
    });
    parts.push("</div>");
    parts.push('<div class="st-chatu8-cfgclean-empty">\u8FD9\u4E9B\u6761\u76EE\u6307\u5411\u7684\u6587\u4EF6\u5DF2\u4ECE\u670D\u52A1\u5668\u6D88\u5931\uFF0C\u6570\u636E\u5DF2\u65E0\u6CD5\u6062\u590D\uFF0C\u6E05\u7406\u53EA\u662F\u79FB\u9664\u5931\u6548\u8BB0\u5F55\u3002</div>');
  }
  parts.push(`
        <div class="st-chatu8-cfgclean-progress" style="display:none;">
            <div class="st-chatu8-cfgclean-progress-track">
                <div class="st-chatu8-cfgclean-progress-fill"></div>
            </div>
            <div class="st-chatu8-cfgclean-progress-text"></div>
        </div>
    `);
  $body.html(parts.join(""));
  bindThumbFallback($body);
  loadIndexedDbThumbs($body);
  bindEvents($body, $backdrop, { sizes });
  updateCounts($body);
}

async function loadIndexedDbThumbs($body) {
  const $placeholders = $body.find(".st-chatu8-thumb-loading");
  for (let i = 0; i < $placeholders.length; i++) {
    const el = $placeholders[i];
    const id = $(el).data("load-id");
    if (!id) continue;
    try {
      const base64 = await getConfigImage(id);
      if (base64) {
        $(el).replaceWith(`<img loading="lazy" src="${base64}" alt="${escapeHtml3(id)}">`);
      } else {
        $(el).replaceWith('<div class="st-chatu8-cfgclean-thumb-fallback" title="\u8BFB\u53D6\u5931\u8D25\u6216\u975E\u56FE\u7247"><i class="fa-solid fa-image"></i></div>');
      }
    } catch (_) {
      $(el).replaceWith('<div class="st-chatu8-cfgclean-thumb-fallback"><i class="fa-solid fa-image"></i></div>');
    }
  }
}

function bindThumbFallback($body) {
  $body.find(".st-chatu8-cfgclean-thumb img").each(function() {
    const img = this;
    const replace = () => {
      $(img).closest(".st-chatu8-cfgclean-thumb").removeAttr("title").html('<div class="st-chatu8-cfgclean-thumb-fallback" title="\u975E\u56FE\u7247\u6570\u636E\uFF0C\u65E0\u6CD5\u9884\u89C8"><i class="fa-solid fa-file-lines"></i></div>');
    };
    img.addEventListener("error", replace);
    if (img.complete && img.naturalWidth === 0) replace();
  });
}

function updateCounts($body) {
  const unrefN = $body.find('[data-list="unref"] .st-chatu8-import-checkbox:checked').length;
  const orphanN = $body.find('[data-list="orphan"] .st-chatu8-import-checkbox:checked').length;
  const deadN = $body.find('[data-list="dead"] .st-chatu8-import-checkbox:checked').length;
  const $ud = $body.find('[data-act="unref-del"]');
  $ud.html(`<i class="fa-solid fa-trash"></i> \u5220\u9664\u9009\u4E2D(${unrefN})`).prop("disabled", unrefN === 0);
  const $od = $body.find('[data-act="orphan-del"]');
  $od.html(`<i class="fa-solid fa-trash"></i> \u5220\u9664\u9009\u4E2D(${orphanN})`).prop("disabled", orphanN === 0);
  const $dd = $body.find('[data-act="dead-del"]');
  $dd.html(`<i class="fa-solid fa-broom"></i> \u6E05\u7406\u9009\u4E2D(${deadN})`).prop("disabled", deadN === 0);
}

function bindEvents($body, $backdrop, ctx) {
  $body.on("change", ".st-chatu8-import-checkbox", () => updateCounts($body));
  $body.on("click", '[data-act="unref-all"]', () => {
    $body.find('[data-list="unref"] .st-chatu8-import-checkbox').prop("checked", true);
    updateCounts($body);
  });
  $body.on("click", '[data-act="unref-none"]', () => {
    $body.find('[data-list="unref"] .st-chatu8-import-checkbox').prop("checked", false);
    updateCounts($body);
  });
  $body.on("click", '[data-act="orphan-all"]', () => {
    $body.find('[data-list="orphan"] .st-chatu8-import-checkbox').prop("checked", true);
    updateCounts($body);
  });
  $body.on("click", '[data-act="orphan-none"]', () => {
    $body.find('[data-list="orphan"] .st-chatu8-import-checkbox').prop("checked", false);
    updateCounts($body);
  });
  $body.on("click", '[data-act="dead-all"]', () => {
    $body.find('[data-list="dead"] .st-chatu8-import-checkbox').prop("checked", true);
    updateCounts($body);
  });
  $body.on("click", '[data-act="dead-none"]', () => {
    $body.find('[data-list="dead"] .st-chatu8-import-checkbox').prop("checked", false);
    updateCounts($body);
  });
  $body.on("click", ".st-chatu8-cfgclean-thumb", function() {
    const $img = $(this).find("img");
    if ($img.length && $img.attr("src")) {
      showLightbox($img.attr("src"));
    } else {
      const f = $(this).data("file");
      if (f) showLightbox(fileUrl(f));
    }
  });
  $body.on("click", '[data-act="unref-del"]', async function() {
    const ids = $body.find('[data-list="unref"] .st-chatu8-import-checkbox:checked').map((_, el) => $(el).data("unref-id")).get();
    if (!ids.length) return;
    const ok = await stylishConfirm(
      `\u786E\u8BA4\u5220\u9664\u9009\u4E2D\u7684 ${ids.length} \u4E2A\u65E0\u4E3B\u5E9F\u5F03\u56FE\u7247\uFF1F\u5C06\u5F7B\u5E95\u4ECE\u670D\u52A1\u5668\u78C1\u76D8\u3001\u6CE8\u518C\u8868\u548C\u672C\u5730\u6570\u636E\u5E93\u4E2D\u6E05\u9664\uFF0C\u5220\u9664\u540E\u65E0\u6CD5\u6062\u590D\u3002`
    );
    if (!ok) return;
    await runCleanup($body, $backdrop, { unreferencedIds: ids });
  });
  $body.on("click", '[data-act="orphan-del"]', async function() {
    const files = $body.find('[data-list="orphan"] .st-chatu8-import-checkbox:checked').map((_, el) => $(el).data("file")).get();
    if (!files.length) return;
    const bytes = files.reduce((s, f) => s + (ctx.sizes[f] || 0), 0);
    const ok = await stylishConfirm(
      `\u786E\u8BA4\u5220\u9664 ${files.length} \u4E2A\u6587\u4EF6\uFF1F\u5171 ${fmtMB2(bytes)}\uFF0C\u5220\u9664\u540E\u65E0\u6CD5\u6062\u590D\u3002`
    );
    if (!ok) return;
    await runCleanup($body, $backdrop, { orphanFiles: files });
  });
  $body.on("click", '[data-act="dead-del"]', async function() {
    const keys = $body.find('[data-list="dead"] .st-chatu8-import-checkbox:checked').map((_, el) => $(el).data("key")).get();
    if (!keys.length) return;
    const ok = await stylishConfirm(
      `\u786E\u8BA4\u79FB\u9664 ${keys.length} \u6761\u5931\u6548\u6CE8\u518C\u8868\u8BB0\u5F55\uFF1F\u5BF9\u5E94\u6587\u4EF6\u5DF2\u4E0D\u5B58\u5728\uFF0C\u6B64\u64CD\u4F5C\u53EA\u6E05\u7406\u8BB0\u5F55\u3002`
    );
    if (!ok) return;
    await runCleanup($body, $backdrop, { deadKeys: keys });
  });
}

async function runCleanup($body, $backdrop, payload) {
  const $progress = $body.find(".st-chatu8-cfgclean-progress");
  const $fill = $progress.find(".st-chatu8-cfgclean-progress-fill");
  const $text = $progress.find(".st-chatu8-cfgclean-progress-text");
  const $buttons = $body.find(".st-chatu8-btn").add($backdrop.find(".st-chatu8-cfgclean-close-btn"));
  $buttons.prop("disabled", true);
  $progress.show();
  $fill.css("width", "0%");
  $text.text("\u51C6\u5907\u4E2D...");
  let result;
  try {
    result = await cleanupConfigStorage({
      ...payload,
      onProgress: (done, total, name) => {
        const pct = total ? Math.floor(done / total * 100) : 100;
        $fill.css("width", `${pct}%`);
        $text.text(name ? `\u6B63\u5728\u5220\u9664 (${done}/${total}): ${name}` : `\u5904\u7406\u4E2D (${done}/${total})`);
      }
    });
  } catch (e) {
    console.error("[ConfigDB \u6E05\u7406] \u5931\u8D25:", e);
    showToast(`\u6E05\u7406\u5931\u8D25: ${e.message}`, "error");
    $buttons.prop("disabled", false);
    $progress.hide();
    return;
  }
  $progress.hide();
  $buttons.prop("disabled", false);
  const msgs = [];
  if (result.deletedUnreferenced && result.deletedUnreferenced.length) {
    msgs.push(`\u6E05\u7406\u5E9F\u5F03\u56FE\u7247 ${result.deletedUnreferenced.length} \u4E2A`);
  }
  if (result.deletedFiles.length) msgs.push(`\u5220\u9664\u5B64\u513F\u6587\u4EF6 ${result.deletedFiles.length} \u4E2A`);
  if (result.deletedKeys.length) msgs.push(`\u79FB\u9664\u8BB0\u5F55 ${result.deletedKeys.length} \u6761`);
  if (result.skipped.length) msgs.push(`\u8DF3\u8FC7 ${result.skipped.length} \u4E2A\uFF08\u4ECD\u88AB\u5F15\u7528\uFF09`);
  if (result.errors.length) msgs.push(`\u5931\u8D25 ${result.errors.length} \u4E2A`);
  showToast(
    msgs.length ? `\u6E05\u7406\u5B8C\u6210\uFF1A${msgs.join("\uFF0C")}` : "\u6CA1\u6709\u5185\u5BB9\u88AB\u6E05\u7406",
    result.errors.length ? "warning" : "success"
  );
  await renderContent($body, $backdrop);
}

function showLightbox(srcOrName) {
  const parent = document.getElementById("st-chatu8-settings") || document.body;
  const finalSrc = String(srcOrName).startsWith("data:") || String(srcOrName).startsWith("/") || String(srcOrName).startsWith("http") ? srcOrName : fileUrl(srcOrName);
  const $lb = $(`
        <div class="st-chatu8-preview-backdrop" style="z-index:10300;">
            <div class="st-chatu8-preview-dialog">
                <span class="st-chatu8-preview-close">&times;</span>
                <div class="st-chatu8-preview-image-container">
                    <img src="${finalSrc}" alt="\u9884\u89C8"
                         style="max-width:100%; max-height:100%; object-fit:contain;">
                </div>
            </div>
        </div>
    `);
  const onKey = (e) => {
    if (e.key === "Escape") close();
  };
  const close = () => {
    document.removeEventListener("keydown", onKey);
    $lb.remove();
  };
  $lb.find(".st-chatu8-preview-close").on("click", close);
  $lb.on("click", (e) => {
    if (e.target === $lb[0]) close();
  });
  document.addEventListener("keydown", onKey);
  $(parent).append($lb);
}

export { CONFIG_DB_NAME2, CONFIG_FOLDER, CONFIG_STORE_NAME2, showConfigStorageCleanupModal };
