// 还原自打包产物 — 原始模块: utils/settings/image_upload.js
import { extension_settings } from "../../../../../../extensions.js";
import { extensionName } from "../config.js";
import { addLog, prepareImageForUpload, processUploadedImage } from "../utils.js";
import { dbs } from "../database.js";
import { COMFYUI_REF_CACHE_KEY, NAI_CHAR_REF_CACHE_KEY, NAI_VIBE_CACHE_KEY, __set_comfyuiImageObjectURL, __set_nai3CharRefImageMimeType, __set_nai3VibeTransferImageMimeType, comfyuiImageObjectURL, nai3CharRefImageMimeType, nai3VibeTransferImageMimeType } from "./api_connections.js";

var STORAGE_PREFIX;

var STORAGE_PREFIX = "st_chatu8_section_collapsed_";
function updateNovelaiImagePreview(src) {
  const previewImg = document.getElementById("previewImage_novelai");
  const placeholder = document.querySelector("#novelai-image-preview-container .st-chatu8-image-placeholder");
  const removeBtn = document.getElementById("novelai-remove-image-btn");
  if (src && src.startsWith("data:image")) {
    previewImg.src = src;
    previewImg.style.display = "block";
    placeholder.style.display = "none";
    removeBtn.style.display = "inline-flex";
    const parts = src.split(",");
    const meta = parts[0].split(":")[1].split(";")[0];
    __set_nai3VibeTransferImageMimeType(meta);
    window.nai3VibeTransferImage = parts[1];
    dbs.storeReadWrite({ id: NAI_VIBE_CACHE_KEY, data: src });
  } else {
    previewImg.src = "";
    previewImg.style.display = "none";
    placeholder.style.display = "flex";
    removeBtn.style.display = "none";
    window.nai3VibeTransferImage = null;
  }
}

function removeNovelaiImage() {
  updateNovelaiImagePreview(null);
  dbs.storeDelete(NAI_VIBE_CACHE_KEY);
}

async function handleNovelaiImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const base64Image = await processUploadedImage(file, true);
    updateNovelaiImagePreview(base64Image);
  } catch (error) {
    console.error("Error processing NovelAI image:", error);
    alert("\u56FE\u7247\u5904\u7406\u5931\u8D25: " + error.message);
  }
}

function updateNovelaiCharRefImagePreview(src) {
  const previewImg = document.getElementById("previewImage_nai_char_ref");
  const placeholder = document.querySelector("#novelai-char-ref-image-preview-container .st-chatu8-image-placeholder");
  const removeBtn = document.getElementById("novelai-remove-char-ref-image-btn");
  if (!previewImg || !placeholder || !removeBtn) {
    console.log("[CharRef] Old character reference UI elements not found - using new system");
    return;
  }
  if (src && src.startsWith("data:image")) {
    previewImg.src = src;
    previewImg.style.display = "block";
    placeholder.style.display = "none";
    removeBtn.style.display = "inline-flex";
    const parts = src.split(",");
    const meta = parts[0].split(":")[1].split(";")[0];
    __set_nai3CharRefImageMimeType(meta);
    window.nai3CharRefImage = parts[1];
    dbs.storeReadWrite({ id: NAI_CHAR_REF_CACHE_KEY, data: src });
  } else {
    previewImg.src = "";
    previewImg.style.display = "none";
    placeholder.style.display = "flex";
    removeBtn.style.display = "none";
    window.nai3CharRefImage = null;
  }
}

function removeNovelaiCharRefImage() {
  updateNovelaiCharRefImagePreview(null);
  dbs.storeDelete(NAI_CHAR_REF_CACHE_KEY);
}

async function handleNovelaiCharRefImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const base64Image = await processUploadedImage(file);
    updateNovelaiCharRefImagePreview(base64Image);
  } catch (error) {
    console.error("Error processing NovelAI char ref image:", error);
    alert("\u56FE\u7247\u5904\u7406\u5931\u8D25: " + error.message);
  }
}

function updateComfyUIImagePreview(src) {
  const previewImg = document.getElementById("previewImage2");
  const placeholder = document.querySelector("#comfyui-image-preview-container .st-chatu8-image-placeholder");
  const removeBtn = document.getElementById("comfyui-remove-image-btn");
  if (previewImg.src && previewImg.src.startsWith("blob:") && previewImg.src !== src) {
    URL.revokeObjectURL(previewImg.src);
  }
  if (src) {
    previewImg.src = src;
    previewImg.style.display = "block";
    placeholder.style.display = "none";
    removeBtn.style.display = "inline-flex";
  } else {
    previewImg.src = "";
    previewImg.style.display = "none";
    placeholder.style.display = "flex";
    removeBtn.style.display = "none";
    window.comfyuicankaotupian = null;
    __set_comfyuiImageObjectURL(null);
  }
}

function removeComfyUIImage() {
  updateComfyUIImagePreview(null);
  dbs.storeDelete(COMFYUI_REF_CACHE_KEY);
}

async function handleImageUpload22(event) {
  const settings3 = extension_settings[extensionName];
  const file = event.target.files[0];
  if (!file) return;
  try {
    const { blob: imageBlob, fileName: uploadFileName } = await prepareImageForUpload(file);
    const objectURL = URL.createObjectURL(imageBlob);
    __set_comfyuiImageObjectURL(objectURL);
    updateComfyUIImagePreview(objectURL);
    const formData = new FormData();
    formData.append("image", imageBlob, uploadFileName || "comfyui_ref.jpg");
    formData.append("overwrite", "true");
    let url111 = settings3.comfyuiUrl.trim();
    if (!url111) {
      alert("\u8BF7\u5148\u8BBE\u7F6EComfyUI API\u5730\u5740\u3002");
      removeComfyUIImage();
      return;
    }
    const response = await fetch(`${url111}/upload/image`, {
      method: "POST",
      body: formData
    });
    if (response.ok) {
      const result = await response.json();
      window.comfyuicankaotupian = result.name;
      addLog(`\u56FE\u7247\u4E0A\u4F20\u6210\u529F, \u670D\u52A1\u5668\u8FD4\u56DE\u6570\u636E: ${JSON.stringify(result)}`);
      console.log("\u4E0A\u4F20\u6210\u529F, \u670D\u52A1\u5668\u8FD4\u56DE\u6570\u636E:", result);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result;
        const cachePayload = { data: base64data, serverFileName: result.name };
        dbs.storeReadWrite({ id: COMFYUI_REF_CACHE_KEY, data: cachePayload });
      };
      reader.readAsDataURL(imageBlob);
    } else {
      const errorText = await response.text();
      alert("\u4E0A\u4F20\u5931\u8D25: " + errorText);
      addLog(`\u56FE\u7247\u4E0A\u4F20\u5931\u8D25, \u9519\u8BEF\u8BE6\u60C5: ${errorText}`);
      console.error("\u9519\u8BEF\u8BE6\u60C5:", errorText);
      removeComfyUIImage();
    }
  } catch (error) {
    alert("\u56FE\u7247\u5904\u7406\u6216\u4E0A\u4F20\u65F6\u51FA\u9519: " + error.message);
    console.error("\u56FE\u7247\u5904\u7406\u6216\u4E0A\u4F20\u65F6\u51FA\u9519:", error);
    addLog(`\u56FE\u7247\u4E0A\u4F20\u5931\u8D25, \u9519\u8BEF\u8BE6\u60C5: ${JSON.stringify(error)}`);
    removeComfyUIImage();
  }
}

async function loadCachedImages() {
  await dbs.openDB();
  try {
    const naiVibeRecord = await dbs.storeReadOnly(NAI_VIBE_CACHE_KEY);
    if (naiVibeRecord && naiVibeRecord.data) {
      updateNovelaiImagePreview(naiVibeRecord.data);
    }
  } catch (error) {
    console.error("Error loading cached NovelAI Vibe image:", error);
  }
  try {
    const naiCharRefRecord = await dbs.storeReadOnly(NAI_CHAR_REF_CACHE_KEY);
    if (naiCharRefRecord && naiCharRefRecord.data) {
      updateNovelaiCharRefImagePreview(naiCharRefRecord.data);
    }
  } catch (error) {
    console.error("Error loading cached NovelAI Char Ref image:", error);
  }
  try {
    const comfyRecord = await dbs.storeReadOnly(COMFYUI_REF_CACHE_KEY);
    if (comfyRecord && comfyRecord.data && comfyRecord.data.data && comfyRecord.data.serverFileName) {
      const cachePayload = comfyRecord.data;
      const res = await fetch(cachePayload.data);
      const blob = await res.blob();
      const objectURL = URL.createObjectURL(blob);
      updateComfyUIImagePreview(objectURL);
      __set_comfyuiImageObjectURL(objectURL);
      window.comfyuicankaotupian = cachePayload.serverFileName;
      addLog(`\u4ECE\u7F13\u5B58\u52A0\u8F7DComfyUI\u56FE\u7247: ${cachePayload.serverFileName}`);
      console.log(`Loaded ComfyUI image from cache: ${cachePayload.serverFileName}`);
    } else if (comfyRecord && typeof comfyRecord.data === "string") {
      const res = await fetch(comfyRecord.data);
      const blob = await res.blob();
      const objectURL = URL.createObjectURL(blob);
      updateComfyUIImagePreview(objectURL);
      __set_comfyuiImageObjectURL(objectURL);
      console.warn("Loaded ComfyUI image from old cache format. Please re-upload to update cache to the new format.");
    }
  } catch (error) {
    console.error("Error loading cached ComfyUI image:", error);
  }
}

function initImageUpload(settingsModal) {
  loadCachedImages();
  settingsModal.find("#novelai-select-image-btn").on("click", () => {
    document.getElementById("imageInput_novelai").click();
  });
  settingsModal.find("#imageInput_novelai").on("change", handleNovelaiImageUpload);
  settingsModal.find("#novelai-remove-image-btn").on("click", () => {
    removeNovelaiImage();
  });
  settingsModal.find("#novelai-select-char-ref-image-btn").on("click", () => {
    document.getElementById("imageInput_nai_char_ref").click();
  });
  settingsModal.find("#imageInput_nai_char_ref").on("change", handleNovelaiCharRefImageUpload);
  settingsModal.find("#novelai-remove-char-ref-image-btn").on("click", () => {
    removeNovelaiCharRefImage();
  });
  settingsModal.find("#comfyui-select-image-btn").on("click", () => {
    document.getElementById("imageInput2").click();
  });
  settingsModal.find("#imageInput2").on("change", handleImageUpload22);
  settingsModal.find("#comfyui-remove-image-btn").on("click", () => {
    removeComfyUIImage();
  });
}

export { STORAGE_PREFIX, initImageUpload, updateComfyUIImagePreview, updateNovelaiCharRefImagePreview, updateNovelaiImagePreview };
