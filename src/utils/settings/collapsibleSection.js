// 还原自打包产物 — 原始模块: utils/settings/collapsibleSection.js
import { STORAGE_PREFIX } from "./image_upload.js";

var generationTabs2;

var generationTabs2 = ["sd", "novelai", "comfyui", "runninghub"];

function isSectionCollapsed(sectionId, defaultCollapsed = true) {
  if (!sectionId) return defaultCollapsed;
  try {
    const saved = localStorage.getItem(STORAGE_PREFIX + sectionId);
    if (saved !== null) {
      return saved === "true";
    }
  } catch (e) {
    console.warn("[Chatu8] \u8BFB\u53D6\u6A21\u5757\u6298\u53E0\u72B6\u6001\u5931\u8D25:", e);
  }
  return defaultCollapsed;
}

function setSectionCollapsed(sectionId, collapsed) {
  if (!sectionId) return;
  try {
    localStorage.setItem(STORAGE_PREFIX + sectionId, collapsed ? "true" : "false");
  } catch (e) {
    console.warn("[Chatu8] \u4FDD\u5B58\u6A21\u5757\u6298\u53E0\u72B6\u6001\u5931\u8D25:", e);
  }
}

function initCollapsibleSections(container) {
  const $root = container ? $(container) : $(document);
  $root.find(".st-chatu8-collapsible-section").each(function() {
    const $section = $(this);
    const sectionId = $section.data("section-id");
    const initialHasCollapsed = $section.hasClass("is-collapsed");
    const shouldBeCollapsed = sectionId ? isSectionCollapsed(sectionId, initialHasCollapsed) : initialHasCollapsed;
    if (shouldBeCollapsed) {
      $section.addClass("is-collapsed");
    } else {
      $section.removeClass("is-collapsed");
    }
  });
  $(document).off("click.chatu8Collapsible", ".st-chatu8-collapsible-section .st-chatu8-section-header").on("click.chatu8Collapsible", ".st-chatu8-collapsible-section .st-chatu8-section-header", function(e) {
    if ($(e.target).closest("button, select, input, a, .st-chatu8-preset-box-wrapper").length > 0) {
      return;
    }
    const $header = $(this);
    const $section = $header.closest(".st-chatu8-collapsible-section");
    if (!$section.length) return;
    const isCurrentlyCollapsed = $section.hasClass("is-collapsed");
    const nextCollapsed = !isCurrentlyCollapsed;
    if (nextCollapsed) {
      $section.addClass("is-collapsed");
    } else {
      $section.removeClass("is-collapsed");
    }
    const sectionId = $section.data("section-id");
    if (sectionId) {
      setSectionCollapsed(sectionId, nextCollapsed);
    }
  });
}

export { generationTabs2, initCollapsibleSections };
