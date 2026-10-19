// 还原自打包产物 — 原始模块: utils/perf/base64Utils.js
import { getPerfState, isPerfFeatureEnabled } from "./perfConfig.js";

function isNativeBase64Enabled() {
  const state3 = getPerfState();
  if (typeof state3.nativeBase64 !== "boolean") {
    state3.nativeBase64 = isPerfFeatureEnabled("nativeBase64", true);
  }
  return state3.nativeBase64;
}

function chunkedBase64(uint8Array, chunkSize = 8192) {
  let binary = "";
  const len = uint8Array.byteLength;
  for (let i = 0; i < len; i += chunkSize) {
    const end = i + chunkSize < len ? i + chunkSize : len;
    binary += String.fromCharCode.apply(null, uint8Array.subarray(i, end));
  }
  return window.btoa(binary);
}

function uint8ArrayToBase64(uint8Array) {
  if (isNativeBase64Enabled()) {
    if (typeof uint8Array.toBase64 === "function") {
      try {
        return uint8Array.toBase64();
      } catch (_) {
      }
    }
    return chunkedBase64(uint8Array);
  }
  let binary = "";
  const len = uint8Array.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return window.btoa(binary);
}

function base64ToUint8Array(base64) {
  if (isNativeBase64Enabled() && typeof Uint8Array.fromBase64 === "function") {
    try {
      return Uint8Array.fromBase64(base64);
    } catch (_) {
    }
  }
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function stringToBase64Async(str) {
  const uint8Array = new TextEncoder().encode(str);
  if (typeof uint8Array.toBase64 === "function") {
    try {
      return uint8Array.toBase64();
    } catch (_) {
    }
  }
  if (typeof Blob === "function" && typeof FileReader === "function") {
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") resolve(reader.result);
          else reject(new Error("FileReader result is not a string"));
        };
        reader.onerror = () => reject(reader.error || new Error("FileReader error"));
        reader.readAsDataURL(new Blob([uint8Array]));
      });
      const commaIndex = dataUrl.indexOf(",");
      return commaIndex === -1 ? dataUrl : dataUrl.substring(commaIndex + 1);
    } catch (readerError) {
      console.warn("[Base64Perf] \u539F\u751F Blob \u7F16\u7801\u5931\u8D25\uFF0C\u56DE\u9000\u5206\u5757\u5B9E\u73B0:", readerError?.message);
    }
  }
  return uint8ArrayToBase64(uint8Array);
}

function base64ToArrayBuffer(base64) {
  if (isNativeBase64Enabled() && typeof Uint8Array.fromBase64 === "function") {
    try {
      return Uint8Array.fromBase64(base64).buffer;
    } catch (_) {
    }
  }
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  if (isNativeBase64Enabled()) {
    if (typeof bytes.toBase64 === "function") {
      try {
        return bytes.toBase64();
      } catch (_) {
      }
    }
    return chunkedBase64(bytes);
  }
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ByteLength(base64) {
  if (!base64) return 0;
  const len = base64.length;
  let padding = 0;
  if (base64[len - 1] === "=") padding++;
  if (base64[len - 2] === "=") padding++;
  return Math.floor(len * 3 / 4) - padding;
}

export { arrayBufferToBase64, base64ByteLength, base64ToArrayBuffer, base64ToUint8Array, stringToBase64Async, uint8ArrayToBase64 };
