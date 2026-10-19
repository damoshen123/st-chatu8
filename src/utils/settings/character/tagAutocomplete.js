// 还原自打包产物 — 原始模块: utils/settings/character/tagAutocomplete.js
import { extension_settings } from "../../../../../../../extensions.js";
import { extensionName } from "../../config.js";
import { dbs } from "../../database.js";

async function handleAutocomplete(inputEl, resultsEl) {
  const text = inputEl.value;
  const cursorPosition = inputEl.selectionStart;
  const textBeforeCursor = text.substring(0, cursorPosition);
  const textAfterCursor = text.substring(cursorPosition);
  const lastCommaBefore = Math.max(textBeforeCursor.lastIndexOf(","), textBeforeCursor.lastIndexOf("\uFF0C"));
  const nextCommaAfter = textAfterCursor.search(/[,，]/);
  const startIndex = lastCommaBefore + 1;
  const endIndex = nextCommaAfter !== -1 ? cursorPosition + nextCommaAfter : text.length;
  const query = text.substring(startIndex, endIndex).trim();
  if (query.length < 1) {
    resultsEl.style.display = "none";
    return;
  }
  try {
    const settings3 = extension_settings[extensionName];
    const startsWith = String(settings3.vocabulary_search_startswith) === "true";
    const limit = parseInt(settings3.vocabulary_search_limit, 10);
    const sortBy = settings3.vocabulary_search_sort;
    const results = await dbs.searchTags(query, { startsWith, limit, sortBy });
    resultsEl.innerHTML = "";
    if (results.length > 0) {
      results.forEach((tag) => {
        const item = document.createElement("div");
        item.className = "ch-autocomplete-item";
        item.textContent = `${tag.name} (${tag.translation})`;
        item.dataset.tagName = tag.name;
        item.dataset.tagTranslation = tag.translation;
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

function handleResultClick(inputEl, resultsEl, tag) {
  const text = inputEl.value;
  const cursorPosition = inputEl.selectionStart;
  const textBeforeCursor = text.substring(0, cursorPosition);
  const textAfterCursor = text.substring(cursorPosition);
  const lastCommaBefore = Math.max(textBeforeCursor.lastIndexOf(","), textBeforeCursor.lastIndexOf("\uFF0C"));
  const nextCommaAfter = textAfterCursor.search(/[,，]/);
  const startIndex = lastCommaBefore + 1;
  const endIndex = nextCommaAfter !== -1 ? cursorPosition + nextCommaAfter : text.length;
  const newTagText = `${tag.name}\uFF08${tag.translation}\uFF09`;
  const textBefore = text.substring(0, startIndex);
  const textAfter = text.substring(endIndex);
  const leadingSpace = text.substring(startIndex, startIndex + 1) === " " ? " " : "";
  const trimmedTextAfter = textAfter.trim();
  const trailingComma = trimmedTextAfter.length > 0 && !trimmedTextAfter.startsWith(",") ? ", " : "";
  const newText = `${textBefore.trim() ? textBefore : ""}${leadingSpace}${newTagText}${trailingComma}${textAfter.trim() ? textAfter : ""}`;
  inputEl.value = newText.replace(/，/g, ",");
  resultsEl.style.display = "none";
  inputEl.focus();
  const newCursorPosition = (textBefore + leadingSpace + newTagText + trailingComma).length;
  setTimeout(() => inputEl.setSelectionRange(newCursorPosition, newCursorPosition), 0);
  $(inputEl).trigger("input");
}

function initTagAutocomplete() {
  console.log("[Character] Initializing tag autocomplete...");
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".st-chatu8-field-col") && !event.target.closest(".ch-autocomplete-results")) {
      $(".ch-autocomplete-results").hide();
    }
  });
  const characterFields = [
    "char_photo_prompt",
    "char_characterTraits",
    "char_facialFeatures",
    "char_facialFeaturesBack",
    "char_upperBodySFW",
    "char_upperBodySFWBack",
    "char_fullBodySFW",
    "char_fullBodySFWBack",
    "char_upperBodyNSFW",
    "char_upperBodyNSFWBack",
    "char_fullBodyNSFW",
    "char_fullBodyNSFWBack"
  ];
  characterFields.forEach((fieldId) => {
    const textarea = document.getElementById(fieldId);
    const resultsContainer = document.getElementById(`${fieldId}-results`);
    console.log(`[Character] Field ${fieldId}: textarea=${!!textarea}, results=${!!resultsContainer}`);
    if (textarea && resultsContainer) {
      $(textarea).off("input.autocomplete").on("input.autocomplete", () => handleAutocomplete(textarea, resultsContainer));
      $(textarea).off("click").on("click", (event) => event.stopPropagation());
      $(resultsContainer).off("click").on("click", ".ch-autocomplete-item", function(event) {
        event.stopPropagation();
        const tagName = $(this).data("tagName");
        const tagTranslation = $(this).data("tagTranslation");
        if (tagName && tagTranslation !== void 0) {
          handleResultClick(textarea, resultsContainer, { name: tagName, translation: tagTranslation });
        }
      });
      console.log(`[Character] Successfully bound autocomplete to ${fieldId}`);
    } else {
      console.warn(`[Character] Could not find elements for ${fieldId}`);
    }
  });
  const outfitFields = [
    "outfit_upperBody",
    "outfit_upperBodyBack",
    "outfit_fullBody",
    "outfit_fullBodyBack"
  ];
  outfitFields.forEach((fieldId) => {
    const textarea = document.getElementById(fieldId);
    const resultsContainer = document.getElementById(`${fieldId}-results`);
    console.log(`[Character] Field ${fieldId}: textarea=${!!textarea}, results=${!!resultsContainer}`);
    if (textarea && resultsContainer) {
      $(textarea).off("input.autocomplete").on("input.autocomplete", () => handleAutocomplete(textarea, resultsContainer));
      $(textarea).off("click").on("click", (event) => event.stopPropagation());
      $(resultsContainer).off("click").on("click", ".ch-autocomplete-item", function(event) {
        event.stopPropagation();
        const tagName = $(this).data("tagName");
        const tagTranslation = $(this).data("tagTranslation");
        if (tagName && tagTranslation !== void 0) {
          handleResultClick(textarea, resultsContainer, { name: tagName, translation: tagTranslation });
        }
      });
      console.log(`[Character] Successfully bound autocomplete to ${fieldId}`);
    } else {
      console.warn(`[Character] Could not find elements for ${fieldId}`);
    }
  });
  console.log("[Character] Tag autocomplete initialized");
}

export { initTagAutocomplete };
