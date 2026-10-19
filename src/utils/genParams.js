// 还原自打包产物 — 原始模块: utils/genParams.js
var PARAM_LABELS, RANDOM_FLAGS;

PARAM_LABELS = {
      backend: "\u751F\u6210\u540E\u7AEF",
      model: "\u6A21\u578B",
      yushe: "\u63D0\u793A\u8BCD\u9884\u8BBE",
      promptReplaceId: "\u63D0\u793A\u8BCD\u66FF\u6362\u89C4\u5219\u9884\u8BBE",
      vibeGroup: "Vibe \u7EC4\uFF08\u6C1B\u56F4\u8F6C\u79FB\uFF09",
      charRefGroup: "\u89D2\u8272\u53C2\u8003\u7EC4",
      resolvedPrompt: "\u5B9E\u9645\u63D0\u793A\u8BCD",
      negativePrompt: "\u8D1F\u9762\u63D0\u793A\u8BCD",
      width: "\u5BBD\u5EA6",
      height: "\u9AD8\u5EA6",
      seed: "\u79CD\u5B50",
      steps: "\u6B65\u6570",
      sampler: "\u91C7\u6837\u5668",
      scheduler: "\u8C03\u5EA6\u5668",
      cfgScale: "CFG / \u5F15\u5BFC\u5F3A\u5EA6",
      imageSize: "\u56FE\u7247\u5C3A\u5BF8",
      aspectRatio: "\u5BBD\u9AD8\u6BD4",
      date: "\u751F\u6210\u65F6\u95F4"
    };

RANDOM_FLAGS = {
      yushe: "yusheRandom",
      vibeGroup: "vibeGroupRandom"
    };

function buildGenParams(backend, fields = {}) {
  const result = {};
  if (backend) {
    result.backend = backend;
  }
  for (const [key, value] of Object.entries(fields)) {
    if (value === null || value === void 0) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    if (value === false) continue;
    result[key] = value;
  }
  return Object.keys(result).length > 0 ? result : null;
}

function createParamsPanel(doc) {
  const panel = doc.createElement("div");
  panel.className = "st-chatu8-params-panel";
  const header = doc.createElement("div");
  header.className = "st-chatu8-params-header";
  const title = doc.createElement("span");
  title.className = "st-chatu8-params-title";
  title.textContent = "\u751F\u6210\u53C2\u6570";
  const copyBtn = doc.createElement("span");
  copyBtn.className = "st-chatu8-params-copy";
  copyBtn.innerHTML = '<i class="fa-solid fa-copy"></i>\u590D\u5236\u5168\u90E8 JSON';
  const closeBtn = doc.createElement("span");
  closeBtn.className = "st-chatu8-params-close";
  closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
  closeBtn.title = "\u5173\u95ED\u53C2\u6570\u9762\u677F";
  closeBtn.onclick = () => {
    panel.classList.remove("visible");
  };
  const headerActions = doc.createElement("span");
  headerActions.className = "st-chatu8-params-header-actions";
  headerActions.appendChild(copyBtn);
  headerActions.appendChild(closeBtn);
  header.appendChild(title);
  header.appendChild(headerActions);
  panel.appendChild(header);
  const body = doc.createElement("div");
  body.className = "st-chatu8-params-body";
  body.style.cssText = "display: flex; flex-direction: column; gap: 6px;";
  panel.appendChild(body);
  let currentParams = null;
  copyBtn.onclick = async () => {
    if (!currentParams) return;
    const text = JSON.stringify(currentParams, null, 2);
    const ok = await copyText(doc, text);
    if (typeof toastr !== "undefined") {
      ok ? toastr.success("\u53C2\u6570\u5DF2\u590D\u5236") : toastr.error("\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u9009\u62E9\u6587\u672C");
    }
  };
  function render2(genParams, fallbackPrompt, date) {
    body.innerHTML = "";
    currentParams = genParams || null;
    copyBtn.style.display = genParams ? "" : "none";
    const rows = formatGenParams(genParams, fallbackPrompt, date);
    if (rows.length === 0) {
      const empty = doc.createElement("div");
      empty.className = "st-chatu8-params-empty";
      empty.textContent = "\u8FD9\u5F20\u56FE\u751F\u6210\u65F6\u8FD8\u6CA1\u6709\u8BB0\u5F55\u53C2\u6570\u55B5\uFF5E\n\uFF08\u6B64\u529F\u80FD\u4E0A\u7EBF\u524D\u751F\u6210\u7684\u56FE\u7247\u6CA1\u6709\u53C2\u6570\u8BB0\u5F55\uFF09";
      body.appendChild(empty);
      return;
    }
    if (!genParams) {
      const note = doc.createElement("div");
      note.className = "st-chatu8-params-empty";
      note.textContent = "\u8FD9\u5F20\u56FE\u6CA1\u6709\u8BB0\u5F55\u751F\u6210\u53C2\u6570\uFF0C\u4EE5\u4E0B\u4EC5\u4E3A\u5DF2\u77E5\u4FE1\u606F";
      body.appendChild(note);
    }
    for (const row of rows) {
      const rowEl = doc.createElement("div");
      rowEl.className = "st-chatu8-params-row" + (row.isLong ? " long" : "");
      const labelEl = doc.createElement("span");
      labelEl.className = "st-chatu8-params-label";
      labelEl.textContent = row.label;
      const valueEl = doc.createElement("span");
      valueEl.className = "st-chatu8-params-value";
      valueEl.textContent = row.value;
      if (row.isRandom) {
        const tag = doc.createElement("span");
        tag.className = "st-chatu8-params-random";
        tag.textContent = "\u968F\u673A\u547D\u4E2D";
        tag.title = "\u8FD9\u662F\u672C\u6B21\u751F\u6210\u5B9E\u9645\u547D\u4E2D\u7684\u9884\u8BBE\uFF0C\u53EF\u80FD\u4E0E\u8BBE\u7F6E\u4E2D\u5F53\u524D\u9009\u62E9\u7684\u4E0D\u540C";
        valueEl.appendChild(tag);
      }
      rowEl.appendChild(labelEl);
      rowEl.appendChild(valueEl);
      body.appendChild(rowEl);
    }
  }
  function toggle() {
    panel.classList.toggle("visible");
    return panel.classList.contains("visible");
  }
  function isVisible() {
    return panel.classList.contains("visible");
  }
  return { panel, render: render2, toggle, isVisible };
}

async function copyText(doc, text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (error) {
    console.warn("[genParams] clipboard API \u5931\u8D25\uFF0C\u56DE\u9000\u5230 execCommand:", error);
  }
  try {
    const textarea = doc.createElement("textarea");
    textarea.value = text;
    textarea.style.cssText = "position: fixed; left: -9999px; top: 0;";
    doc.body.appendChild(textarea);
    textarea.select();
    const ok = doc.execCommand("copy");
    doc.body.removeChild(textarea);
    return ok;
  } catch (error) {
    console.error("[genParams] \u590D\u5236\u5931\u8D25:", error);
    return false;
  }
}

function formatGenParams(genParams, fallbackPrompt = void 0, date = void 0) {
  const source = { ...genParams || {} };
  if (source.resolvedPrompt === void 0 && fallbackPrompt) {
    source.resolvedPrompt = fallbackPrompt;
  }
  if (source.date === void 0 && date) {
    source.date = new Date(date).toLocaleString("zh-CN");
  }
  const rows = [];
  for (const key of Object.keys(PARAM_LABELS)) {
    if (source[key] === void 0 || source[key] === null) continue;
    const value = String(source[key]);
    if (value.trim() === "") continue;
    rows.push({
      key,
      label: PARAM_LABELS[key],
      value,
      isRandom: RANDOM_FLAGS[key] ? source[RANDOM_FLAGS[key]] === true : false,
      // 长文本（提示词）用多行样式展示
      isLong: key === "resolvedPrompt" || key === "negativePrompt" || value.length > 60
    });
  }
  const known = /* @__PURE__ */ new Set([...Object.keys(PARAM_LABELS), ...Object.values(RANDOM_FLAGS)]);
  for (const [key, value] of Object.entries(source)) {
    if (known.has(key)) continue;
    if (value === void 0 || value === null || value === "") continue;
    rows.push({
      key,
      label: key,
      value: typeof value === "object" ? JSON.stringify(value) : String(value),
      isRandom: false,
      isLong: String(value).length > 60
    });
  }
  return rows;
}

export { buildGenParams, createParamsPanel };
