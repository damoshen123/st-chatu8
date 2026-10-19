// 还原自打包产物 — 原始模块: utils/avatarConfig.js
import { extensionFolderPath } from "./config.js";

var AVATAR_CONFIG, DEFAULT_AVATARS;

DEFAULT_AVATARS = {
      // 人设默认头像（智绘姬头像）
      persona: `${extensionFolderPath}/html/settings/\u667A\u7ED8\u59EC\u5934\u50CF.png`,
      // User 默认头像
      user: `${extensionFolderPath}/html/settings/default-user-avatar.png`
    };

AVATAR_CONFIG = {
      // 最大文件大小（5MB）
      maxFileSize: 5 * 1024 * 1024,
      // 支持的图片格式
      acceptedFormats: ["image/jpeg", "image/png", "image/webp", "image/gif"],
      // 压缩后的最大尺寸
      maxWidth: 512,
      maxHeight: 512,
      // 压缩质量
      quality: 0.9
    };

export { AVATAR_CONFIG, DEFAULT_AVATARS };
