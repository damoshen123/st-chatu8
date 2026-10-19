// 还原自打包产物 — 原始模块: utils/assistant/assistantImage.js
import { dom, selectedImages2, setSelectedImages } from "./assistantContext.js";
import { escapeHTML } from "./assistantUtils.js";

function renderImagePreview() {
  dom.imagePreview.empty();
  if (selectedImages2.length === 0) {
    dom.imagePreview.hide();
    return;
  }
  dom.imagePreview.show();
  selectedImages2.forEach((img, index) => {
    const previewItem = $(`
            <div class="st-chatu8-ai-image-preview-item">
                <img src="${img.data}" alt="${escapeHTML(img.name)}" />
                <button class="st-chatu8-ai-image-remove" data-index="${index}" title="\u79FB\u9664\u56FE\u7247">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>
        `);
    previewItem.find(".st-chatu8-ai-image-remove").on("click", function() {
      const idx = parseInt($(this).data("index"));
      selectedImages2.splice(idx, 1);
      renderImagePreview();
    });
    dom.imagePreview.append(previewItem);
  });
}

function clearImageSelection() {
  setSelectedImages([]);
  renderImagePreview();
}

function initImageEvents() {
  dom.imageBtn.on("click", function() {
    dom.imageInput.click();
  });
  dom.imageInput.on("change", function(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    files.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toastr?.warning(`\u6587\u4EF6 ${file.name} \u4E0D\u662F\u56FE\u7247\u683C\u5F0F`);
        return;
      }
      const reader = new FileReader();
      reader.onload = function(event) {
        const imageData = {
          name: file.name,
          type: file.type,
          data: event.target.result
        };
        selectedImages2.push(imageData);
        renderImagePreview();
      };
      reader.readAsDataURL(file);
    });
    dom.imageInput.val("");
  });
  dom.inputArea.on("paste", function(e) {
    const clipboardData = e.originalEvent.clipboardData || window.clipboardData;
    if (!clipboardData) return;
    const items = clipboardData.items;
    if (!items) return;
    let hasImage = false;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        hasImage = true;
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;
        const reader = new FileReader();
        reader.onload = function(event) {
          const imageData = {
            name: `\u7C98\u8D34\u56FE\u7247_${Date.now()}.${file.type.split("/")[1] || "png"}`,
            type: file.type,
            data: event.target.result
          };
          selectedImages2.push(imageData);
          renderImagePreview();
          toastr?.success("\u56FE\u7247\u5DF2\u6DFB\u52A0");
        };
        reader.readAsDataURL(file);
      }
    }
  });
}

export { clearImageSelection, initImageEvents, renderImagePreview };
