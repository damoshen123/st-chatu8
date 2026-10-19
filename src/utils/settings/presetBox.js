// 还原自打包产物 — 原始模块: utils/settings/presetBox.js
import { __set_isGlobalListenerBound, isGlobalListenerBound } from "./prompt.js";

function setupPresetBoxes(container = document) {
  const $container4 = $(container);
  const wrappers = $container4.hasClass("st-chatu8-preset-box-wrapper") ? $container4 : $container4.find(".st-chatu8-preset-box-wrapper");
  wrappers.each(function() {
    const wrapper = $(this);
    if (wrapper.data("preset-box-initialized")) return;
    wrapper.data("preset-box-initialized", true);
    const toggleBtn = wrapper.find(".st-chatu8-preset-box-btn");
    const dropdown = wrapper.find(".st-chatu8-preset-box-dropdown");
    const closeBtn = wrapper.find(".st-chatu8-preset-box-close");
    toggleBtn.off("click.presetbox").on("click.presetbox", function(e) {
      e.stopPropagation();
      const isOpen = dropdown.hasClass("is-open");
      closeAllPresetBoxes();
      if (!isOpen) {
        openPresetBox(wrapper);
      }
    });
    closeBtn.off("click.presetbox").on("click.presetbox", function(e) {
      e.stopPropagation();
      closePresetBox(wrapper);
    });
    dropdown.find(".st-chatu8-preset-box-item").off("click.presetbox-item").on("click.presetbox-item", function() {
      setTimeout(() => {
        closePresetBox(wrapper);
      }, 120);
    });
  });
  if (!isGlobalListenerBound) {
    $(document).on("click.presetbox-global", function(e) {
      if (!$(e.target).closest(".st-chatu8-preset-box-wrapper").length) {
        closeAllPresetBoxes();
      }
    });
    let resizeTimer = null;
    $(window).on("resize.presetbox", function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const openWrapper = $(".st-chatu8-preset-box-wrapper").filter(function() {
          return $(this).find(".st-chatu8-preset-box-dropdown.is-open").length > 0;
        });
        if (openWrapper.length) {
          const dropdown = openWrapper.find(".st-chatu8-preset-box-dropdown");
          adjustPresetBoxPosition(openWrapper, dropdown);
        }
      }, 100);
    });
    __set_isGlobalListenerBound(true);
  }
}

function openPresetBox(wrapper) {
  const toggleBtn = wrapper.find(".st-chatu8-preset-box-btn");
  const dropdown = wrapper.find(".st-chatu8-preset-box-dropdown");
  toggleBtn.addClass("is-active");
  if (dropdown[0]) {
    dropdown[0].style.setProperty("--st-preset-box-shift-x", "0px");
  }
  dropdown.addClass("is-open");
  adjustPresetBoxPosition(wrapper, dropdown);
}

function closePresetBox(wrapper) {
  const toggleBtn = wrapper.find(".st-chatu8-preset-box-btn");
  const dropdown = wrapper.find(".st-chatu8-preset-box-dropdown");
  toggleBtn.removeClass("is-active");
  dropdown.removeClass("is-open");
  if (dropdown[0]) {
    dropdown[0].style.removeProperty("--st-preset-box-shift-x");
    dropdown[0].style.removeProperty("transform-origin");
  }
}

function closeAllPresetBoxes() {
  $(".st-chatu8-preset-box-btn.is-active").removeClass("is-active");
  const openDropdowns = $(".st-chatu8-preset-box-dropdown.is-open");
  openDropdowns.each(function() {
    this.style.removeProperty("--st-preset-box-shift-x");
    this.style.removeProperty("transform-origin");
  });
  openDropdowns.removeClass("is-open");
}

function adjustPresetBoxPosition(wrapper, dropdown) {
  if (!dropdown.length || !dropdown.hasClass("is-open")) return;
  requestAnimationFrame(() => {
    const el = dropdown[0];
    if (!el) return;
    el.style.setProperty("--st-preset-box-shift-x", "0px");
    const rect = el.getBoundingClientRect();
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const safeMargin = 10;
    let minLeft = safeMargin;
    let maxRight = viewportWidth - safeMargin;
    const modal = wrapper.closest(".st-chatu8-modal-content");
    if (modal.length) {
      const modalRect = modal[0].getBoundingClientRect();
      minLeft = Math.max(safeMargin, modalRect.left + safeMargin);
      maxRight = Math.min(viewportWidth - safeMargin, modalRect.right - safeMargin);
    }
    let shiftX = 0;
    if (rect.left < minLeft) {
      shiftX = minLeft - rect.left;
    }
    if (rect.right + shiftX > maxRight) {
      shiftX = Math.max(minLeft - rect.left, maxRight - rect.right);
    }
    const roundedShift = Math.round(shiftX);
    el.style.setProperty("--st-preset-box-shift-x", `${roundedShift}px`);
    if (roundedShift > 30) {
      el.style.transformOrigin = "top left";
    } else {
      el.style.removeProperty("transform-origin");
    }
  });
}

export { setupPresetBoxes };
