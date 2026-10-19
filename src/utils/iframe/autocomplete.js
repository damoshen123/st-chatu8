// 还原自打包产物 — 原始模块: utils/iframe/autocomplete.js
import { extension_settings } from "../../../../../../extensions.js";
import { extensionName } from "../config.js";
import { dbs } from "../database.js";

async function handleAutocomplete2(inputEl, resultsEl) {
  const text = inputEl.value;
  const cursorPosition = inputEl.selectionStart;
  const textBeforeCursor = text.substring(0, cursorPosition);
  const textAfterCursor = text.substring(cursorPosition);
  const lastCommaBefore = textBeforeCursor.lastIndexOf(",");
  const nextCommaAfter = textAfterCursor.indexOf(",");
  const startIndex = lastCommaBefore + 1;
  const endIndex = nextCommaAfter !== -1 ? cursorPosition + nextCommaAfter : text.length;
  const currentTag = text.substring(startIndex, endIndex).trim();
  if (currentTag.length < 1) {
    resultsEl.style.display = "none";
    return;
  }
  try {
    if (!extension_settings || !extension_settings[extensionName]) {
      console.warn("extension_settings not available.");
      return;
    }
    const settings3 = extension_settings[extensionName];
    const startsWith = String(settings3.vocabulary_search_startswith) === "true";
    const limit = parseInt(settings3.vocabulary_search_limit, 10);
    const sortBy = settings3.vocabulary_search_sort;
    const searcher = dbs;
    const results = await searcher.searchTags(currentTag, { startsWith, limit, sortBy });
    resultsEl.innerHTML = "";
    if (results.length > 0) {
      results.forEach((tag) => {
        const item = document.createElement("div");
        item.className = "ch-autocomplete-item";
        item.textContent = `${tag.name} (${tag.translation})`;
        item.addEventListener("mousedown", (e) => {
          e.preventDefault();
          handleResultClick2(inputEl, resultsEl, tag.name + "\uFF08" + tag.translation + "\uFF09", startIndex, endIndex);
        });
        resultsEl.appendChild(item);
      });
      resultsEl.style.display = "block";
    } else {
      resultsEl.style.display = "none";
    }
  } catch (error) {
    console.error("Tag search failed:", error);
    resultsEl.style.display = "none";
  }
}

function handleResultClick2(inputEl, resultsEl, tag, startIndex, endIndex) {
  const originalText2 = inputEl.value;
  const textBefore = originalText2.substring(0, startIndex);
  const textAfter = originalText2.substring(endIndex);
  const leadingSpace = originalText2.substring(startIndex, startIndex + 1) === " " ? " " : "";
  const trimmedTextAfter = textAfter.trim();
  const trailingComma = trimmedTextAfter.length > 0 && !trimmedTextAfter.startsWith(",") ? ", " : "";
  const newText = `${textBefore.trim() ? textBefore : ""}${leadingSpace}${tag}${trailingComma}${textAfter.trim() ? textAfter : ""}`;
  inputEl.value = newText;
  inputEl.dispatchEvent(new Event("input", { bubbles: true }));
  resultsEl.style.display = "none";
  if (typeof resultsEl.restoreDialogSize === "function") {
    resultsEl.restoreDialogSize();
  }
  inputEl.focus();
  const newCursorPosition = (textBefore + leadingSpace + tag + trailingComma).length;
  setTimeout(() => inputEl.setSelectionRange(newCursorPosition, newCursorPosition), 0);
}

export { handleAutocomplete2 };
