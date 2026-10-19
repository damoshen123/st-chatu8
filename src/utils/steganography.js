// 还原自打包产物 — 原始模块: utils/steganography.js
import { base64ToUint8Array, stringToBase64Async, uint8ArrayToBase64 } from "./perf/base64Utils.js";

var ImageSteganography;

ImageSteganography = class {
      constructor() {
        this.MIME_TYPE = "data:image/png;base64,";
      }
      /**
       * 编码：将 JSON 数据编码为伪装的 PNG base64
       * @param {Object} jsonData - 要编码的 JSON 数据
       * @returns {Promise<string>} Base64 编码的"PNG"数据
       */
      async encode(jsonData) {
        try {
          const jsonStr = JSON.stringify(jsonData);
          const base64Data = await this.stringToBase64Async(jsonStr);
          const result = this.MIME_TYPE + base64Data;
          return result;
        } catch (error) {
          console.error("[Stego] \u7F16\u7801\u5931\u8D25:", error);
          throw error;
        }
      }
      /**
       * 解码：从伪装的 PNG base64 中提取 JSON 数据
       * @param {string} imageBase64 - Base64 编码的"PNG"数据
       * @returns {Promise<Object>} 解码后的 JSON 对象
       */
      async decode(imageBase64) {
        try {
          let base64Data = imageBase64;
          if (base64Data.startsWith(this.MIME_TYPE)) {
            base64Data = base64Data.substring(this.MIME_TYPE.length);
          } else if (base64Data.startsWith("data:")) {
            const commaIndex = base64Data.indexOf(",");
            if (commaIndex !== -1) {
              base64Data = base64Data.substring(commaIndex + 1);
            }
          }
          const jsonStr = this.base64ToString(base64Data);
          const jsonData = JSON.parse(jsonStr);
          return jsonData;
        } catch (error) {
          console.error("[Stego] \u89E3\u7801\u5931\u8D25:", error);
          throw error;
        }
      }
      /**
       * 字符串异步转 Base64（优先原生 Uint8Array.toBase64，其次 Blob + FileReader）
       * @param {string} str 
       * @returns {Promise<string>}
       */
      async stringToBase64Async(str) {
        return stringToBase64Async(str);
      }
      /**
       * 字符串转 Base64（同步路径）
       * @param {string} str 
       * @returns {string}
       */
      stringToBase64(str) {
        const encoder = new TextEncoder();
        const uint8Array = encoder.encode(str);
        return this.uint8ArrayToBase64(uint8Array);
      }
      /**
       * Base64 转字符串
       * @param {string} base64 
       * @returns {string}
       */
      base64ToString(base64) {
        const uint8Array = this.base64ToUint8Array(base64);
        const decoder = new TextDecoder();
        return decoder.decode(uint8Array);
      }
      /**
       * Uint8Array 转 Base64
       * @param {Uint8Array} uint8Array 
       * @returns {string}
       */
      uint8ArrayToBase64(uint8Array) {
        return uint8ArrayToBase64(uint8Array);
      }
      /**
       * Base64 转 Uint8Array
       * @param {string} base64 
       * @returns {Uint8Array}
       */
      base64ToUint8Array(base64) {
        return base64ToUint8Array(base64);
      }
      /**
       * 验证数据完整性
       * @param {string} imageBase64 - Base64 编码的数据
       * @returns {Promise<boolean>}
       */
      async verify(imageBase64) {
        try {
          await this.decode(imageBase64);
          return true;
        } catch {
          return false;
        }
      }
    };

export { ImageSteganography };
