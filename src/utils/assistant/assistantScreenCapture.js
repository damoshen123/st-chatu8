// 还原自打包产物 — 原始模块: utils/assistant/assistantScreenCapture.js
var browserCaptureEnabled, browserStream, screenShareEnabled, screenStream;

screenShareEnabled = false;

browserCaptureEnabled = false;

screenStream = null;

browserStream = null;

function isScreenShareSupported() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
}

function compressImage3(base64, quality = 0.6, maxWidth = 1920) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round(height * (maxWidth / width));
        width = maxWidth;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL("image/jpeg", quality);
      resolve(compressed);
    };
    img.onerror = () => reject(new Error("\u56FE\u7247\u538B\u7F29\u5931\u8D25"));
    img.src = base64;
  });
}

async function captureFrameFromStream(stream, jpegQuality = 0.8, compressQuality = 0.6, compressMaxWidth = 1920) {
  if (!stream) return null;
  const track = stream.getVideoTracks()[0];
  if (!track || track.readyState !== "live") {
    return null;
  }
  try {
    if (typeof ImageCapture !== "undefined") {
      const imageCapture = new ImageCapture(track);
      const bitmap = await imageCapture.grabFrame();
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      canvas.getContext("2d").drawImage(bitmap, 0, 0);
      bitmap.close();
      const raw = canvas.toDataURL("image/jpeg", jpegQuality);
      return await compressImage3(raw, compressQuality, compressMaxWidth);
    }
    return await captureFrameViaVideo(track, jpegQuality, compressQuality, compressMaxWidth);
  } catch (err) {
    console.warn("[ScreenCapture] ImageCapture \u622A\u5E27\u5931\u8D25\uFF0C\u5C1D\u8BD5 video fallback:", err.message);
    try {
      return await captureFrameViaVideo(track, jpegQuality, compressQuality, compressMaxWidth);
    } catch (err2) {
      console.error("[ScreenCapture] video fallback \u622A\u5E27\u4E5F\u5931\u8D25:", err2.message);
      return null;
    }
  }
}

function captureFrameViaVideo(track, jpegQuality = 0.8, compressQuality = 0.6, compressMaxWidth = 1920) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.srcObject = new MediaStream([track]);
    video.muted = true;
    video.playsInline = true;
    const timeout = setTimeout(() => {
      video.srcObject = null;
      reject(new Error("video \u622A\u5E27\u8D85\u65F6"));
    }, 3e3);
    video.onloadedmetadata = () => {
      video.play().then(() => {
        requestAnimationFrame(() => {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          canvas.getContext("2d").drawImage(video, 0, 0);
          video.pause();
          video.srcObject = null;
          clearTimeout(timeout);
          const raw = canvas.toDataURL("image/jpeg", jpegQuality);
          compressImage3(raw, compressQuality, compressMaxWidth).then(resolve).catch(reject);
        });
      }).catch((err) => {
        clearTimeout(timeout);
        video.srcObject = null;
        reject(err);
      });
    };
    video.onerror = () => {
      clearTimeout(timeout);
      video.srcObject = null;
      reject(new Error("video \u5143\u7D20\u52A0\u8F7D\u5931\u8D25"));
    };
  });
}

async function startScreenShare() {
  if (!isScreenShareSupported()) {
    console.warn("[ScreenCapture] \u5F53\u524D\u6D4F\u89C8\u5668\u4E0D\u652F\u6301 getDisplayMedia");
    toastr?.warning("\u5F53\u524D\u6D4F\u89C8\u5668\u4E0D\u652F\u6301\u5C4F\u5E55\u5171\u4EAB\u529F\u80FD");
    return false;
  }
  if (screenStream) {
    stopScreenShare();
  }
  try {
    screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        frameRate: { max: 2 },
        // 低帧率，仅用于截图
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    });
    const track = screenStream.getVideoTracks()[0];
    if (track) {
      track.onended = () => {
        console.log("[ScreenCapture] \u7528\u6237\u505C\u6B62\u4E86\u5C4F\u5E55\u5171\u4EAB");
        screenShareEnabled = false;
        screenStream = null;
        window.dispatchEvent(new CustomEvent("screen-share-stopped"));
      };
    }
    screenShareEnabled = true;
    console.log("[ScreenCapture] \u5C4F\u5E55\u5171\u4EAB\u5DF2\u542F\u52A8");
    return true;
  } catch (err) {
    console.warn("[ScreenCapture] \u7528\u6237\u62D2\u7EDD\u6216\u65E0\u6CD5\u542F\u52A8\u5C4F\u5E55\u5171\u4EAB:", err.message);
    if (err.name === "NotAllowedError") {
      toastr?.info("\u5DF2\u53D6\u6D88\u5C4F\u5E55\u5171\u4EAB");
    } else {
      toastr?.error(`\u5C4F\u5E55\u5171\u4EAB\u542F\u52A8\u5931\u8D25: ${err.message}`);
    }
    return false;
  }
}

function stopScreenShare() {
  if (screenStream) {
    screenStream.getTracks().forEach((track) => track.stop());
    screenStream = null;
  }
  screenShareEnabled = false;
  console.log("[ScreenCapture] \u5C4F\u5E55\u5171\u4EAB\u5DF2\u505C\u6B62");
}

async function captureScreenFrame() {
  if (!screenStream || !screenShareEnabled) return null;
  const track = screenStream.getVideoTracks()[0];
  if (!track || track.readyState !== "live") {
    console.warn("[ScreenCapture] \u5C4F\u5E55\u5171\u4EAB track \u5DF2\u5931\u6548");
    stopScreenShare();
    window.dispatchEvent(new CustomEvent("screen-share-stopped"));
    return null;
  }
  return captureFrameFromStream(screenStream, 0.8, 0.6, 1920);
}

async function startBrowserCapture() {
  if (!isScreenShareSupported()) {
    console.warn("[ScreenCapture] \u5F53\u524D\u6D4F\u89C8\u5668\u4E0D\u652F\u6301 getDisplayMedia");
    toastr?.warning("\u5F53\u524D\u6D4F\u89C8\u5668\u4E0D\u652F\u6301\u754C\u9762\u622A\u56FE\u529F\u80FD");
    return false;
  }
  if (browserStream) {
    stopBrowserCapture();
  }
  try {
    const displayMediaOptions = {
      video: {
        frameRate: { max: 2 },
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false,
      // Chrome 107+ 支持 preferCurrentTab
      preferCurrentTab: true
    };
    try {
      displayMediaOptions.selfBrowserSurface = "include";
    } catch (_) {
    }
    browserStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
    const track = browserStream.getVideoTracks()[0];
    if (track) {
      track.onended = () => {
        console.log("[ScreenCapture] \u7528\u6237\u505C\u6B62\u4E86\u6D4F\u89C8\u5668\u754C\u9762\u5171\u4EAB");
        browserCaptureEnabled = false;
        browserStream = null;
        window.dispatchEvent(new CustomEvent("browser-capture-stopped"));
      };
    }
    browserCaptureEnabled = true;
    console.log("[ScreenCapture] \u6D4F\u89C8\u5668\u754C\u9762\u5171\u4EAB\u5DF2\u542F\u52A8\uFF08\u539F\u751F getDisplayMedia\uFF09");
    return true;
  } catch (err) {
    console.warn("[ScreenCapture] \u7528\u6237\u62D2\u7EDD\u6216\u65E0\u6CD5\u542F\u52A8\u6D4F\u89C8\u5668\u754C\u9762\u5171\u4EAB:", err.message);
    if (err.name === "NotAllowedError") {
      toastr?.info("\u5DF2\u53D6\u6D88\u6D4F\u89C8\u5668\u754C\u9762\u5171\u4EAB");
    } else {
      toastr?.error(`\u6D4F\u89C8\u5668\u754C\u9762\u5171\u4EAB\u542F\u52A8\u5931\u8D25: ${err.message}`);
    }
    return false;
  }
}

function stopBrowserCapture() {
  if (browserStream) {
    browserStream.getTracks().forEach((track) => track.stop());
    browserStream = null;
  }
  browserCaptureEnabled = false;
  console.log("[ScreenCapture] \u6D4F\u89C8\u5668\u754C\u9762\u5171\u4EAB\u5DF2\u505C\u6B62");
}

async function captureBrowserPage() {
  if (!browserCaptureEnabled || !browserStream) return null;
  const track = browserStream.getVideoTracks()[0];
  if (!track || track.readyState !== "live") {
    console.warn("[ScreenCapture] \u6D4F\u89C8\u5668\u754C\u9762\u5171\u4EAB track \u5DF2\u5931\u6548");
    stopBrowserCapture();
    window.dispatchEvent(new CustomEvent("browser-capture-stopped"));
    return null;
  }
  return captureFrameFromStream(browserStream, 0.7, 0.5, 1280);
}

async function captureForMessage() {
  const captures = [];
  const promises = [];
  if (screenShareEnabled && screenStream) {
    promises.push(
      captureScreenFrame().then((base64) => {
        if (base64) {
          captures.push({
            name: `\u5C4F\u5E55\u622A\u56FE_${Date.now()}.jpg`,
            type: "image/jpeg",
            data: base64
          });
        }
      }).catch((err) => {
        console.warn("[ScreenCapture] \u7535\u8111\u5C4F\u5E55\u622A\u56FE\u5931\u8D25:", err.message);
      })
    );
  }
  if (browserCaptureEnabled && browserStream) {
    promises.push(
      captureBrowserPage().then((base64) => {
        if (base64) {
          captures.push({
            name: `\u6D4F\u89C8\u5668\u622A\u56FE_${Date.now()}.jpg`,
            type: "image/jpeg",
            data: base64
          });
        }
      }).catch((err) => {
        console.warn("[ScreenCapture] \u6D4F\u89C8\u5668\u754C\u9762\u622A\u56FE\u5931\u8D25:", err.message);
      })
    );
  }
  if (promises.length > 0) {
    await Promise.all(promises);
  }
  return captures;
}

function initScreenCaptureEvents() {
  window.addEventListener("screen-share-stopped", () => {
    const checkbox = document.getElementById("chatu8-ai-screen-share");
    if (checkbox) {
      checkbox.checked = false;
    }
    updateScreenShareIndicator(false);
  });
  window.addEventListener("browser-capture-stopped", () => {
    const checkbox = document.getElementById("chatu8-ai-browser-capture");
    if (checkbox) {
      checkbox.checked = false;
    }
    updateBrowserCaptureIndicator(false);
  });
  bindScreenShareToggle();
  bindBrowserCaptureToggle();
  if (!isScreenShareSupported()) {
    const screenShareItem = document.getElementById("chatu8-ai-screen-share-item");
    if (screenShareItem) {
      screenShareItem.style.display = "none";
    }
    const browserCaptureItem = document.getElementById("chatu8-ai-browser-capture-item");
    if (browserCaptureItem) {
      browserCaptureItem.style.display = "none";
    }
  }
  console.log(
    "[ScreenCapture] \u6A21\u5757\u521D\u59CB\u5316\u5B8C\u6210",
    `| getDisplayMedia: ${isScreenShareSupported() ? "\u2713" : "\u2717"}`
  );
}

function bindScreenShareToggle() {
  const checkbox = document.getElementById("chatu8-ai-screen-share");
  if (!checkbox) return;
  checkbox.addEventListener("change", async function() {
    if (this.checked) {
      const success = await startScreenShare();
      if (!success) {
        this.checked = false;
      }
    } else {
      stopScreenShare();
    }
    updateScreenShareIndicator(this.checked);
  });
}

function bindBrowserCaptureToggle() {
  const checkbox = document.getElementById("chatu8-ai-browser-capture");
  if (!checkbox) return;
  checkbox.addEventListener("change", async function() {
    if (this.checked) {
      const success = await startBrowserCapture();
      if (!success) {
        this.checked = false;
      }
    } else {
      stopBrowserCapture();
    }
    updateBrowserCaptureIndicator(this.checked);
  });
}

function updateScreenShareIndicator(active) {
  const indicator = document.getElementById("st-chatu8-ai-screen-share-indicator");
  if (indicator) {
    indicator.style.display = active ? "inline-flex" : "none";
    indicator.title = active ? "\u7535\u8111\u5C4F\u5E55\u5171\u4EAB\u4E2D\uFF08\u70B9\u51FB\u5173\u95ED\uFF09" : "";
  }
}

function updateBrowserCaptureIndicator(active) {
  const indicator = document.getElementById("st-chatu8-ai-browser-capture-indicator");
  if (indicator) {
    indicator.style.display = active ? "inline-flex" : "none";
    indicator.title = active ? "\u6D4F\u89C8\u5668\u754C\u9762\u5171\u4EAB\u4E2D\uFF08\u70B9\u51FB\u5173\u95ED\uFF09" : "";
  }
}

function bindIndicatorClickEvents() {
  const screenIndicator = document.getElementById("st-chatu8-ai-screen-share-indicator");
  if (screenIndicator) {
    screenIndicator.addEventListener("click", () => {
      stopScreenShare();
      updateScreenShareIndicator(false);
      const checkbox = document.getElementById("chatu8-ai-screen-share");
      if (checkbox) checkbox.checked = false;
    });
  }
  const browserIndicator = document.getElementById("st-chatu8-ai-browser-capture-indicator");
  if (browserIndicator) {
    browserIndicator.addEventListener("click", () => {
      stopBrowserCapture();
      updateBrowserCaptureIndicator(false);
      const checkbox = document.getElementById("chatu8-ai-browser-capture");
      if (checkbox) checkbox.checked = false;
    });
  }
}

export { bindIndicatorClickEvents, captureForMessage, initScreenCaptureEvents };
