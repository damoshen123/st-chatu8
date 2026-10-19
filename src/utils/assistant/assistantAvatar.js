// 还原自打包产物 — 原始模块: utils/assistant/assistantAvatar.js
import { extension_settings } from "../../../../../../extensions.js";
import { extensionName } from "../config.js";
import { DEFAULT_AVATARS } from "../avatarConfig.js";
import { getPersonaAvatarById } from "../settings/knowledgeBase/personaPreset.js";
import { getUserAvatarById } from "../settings/knowledgeBase/userPreset.js";

var _charAvatarCache, _userAvatarCache;

_charAvatarCache = { key: null, value: null };

_userAvatarCache = { key: null, value: null };

function clearAvatarCache() {
  _charAvatarCache = { key: null, value: null };
  _userAvatarCache = { key: null, value: null };
}

async function getCurrentCharAvatar() {
  const aiConfig = extension_settings[extensionName]?.chatu8_ai_assistant || {};
  const systemPromptKey = aiConfig.system_prompt_key || "default";
  if (systemPromptKey !== "custom") {
    return DEFAULT_AVATARS.persona;
  }
  const personaProfiles = extension_settings[extensionName]?.personaProfiles;
  if (!personaProfiles || !personaProfiles.enabled) {
    return DEFAULT_AVATARS.persona;
  }
  const currentPresetId = personaProfiles.currentPresetId;
  if (!currentPresetId) {
    return DEFAULT_AVATARS.persona;
  }
  if (_charAvatarCache.key === currentPresetId && _charAvatarCache.value !== null) {
    return _charAvatarCache.value;
  }
  const avatarBase64 = await getPersonaAvatarById(currentPresetId);
  const result = avatarBase64 || DEFAULT_AVATARS.persona;
  _charAvatarCache = { key: currentPresetId, value: result };
  return result;
}

async function getCurrentUserAvatar() {
  const aiConfig = extension_settings[extensionName]?.chatu8_ai_assistant || {};
  const systemPromptKey = aiConfig.system_prompt_key || "default";
  if (systemPromptKey !== "custom") {
    return DEFAULT_AVATARS.user;
  }
  const personaProfiles = extension_settings[extensionName]?.personaProfiles;
  if (!personaProfiles || !personaProfiles.userEnabled) {
    return DEFAULT_AVATARS.user;
  }
  const currentUserPresetId = personaProfiles.currentUserPresetId;
  if (!currentUserPresetId) {
    return DEFAULT_AVATARS.user;
  }
  if (_userAvatarCache.key === currentUserPresetId && _userAvatarCache.value !== null) {
    return _userAvatarCache.value;
  }
  const avatarBase64 = await getUserAvatarById(currentUserPresetId);
  const result = avatarBase64 || DEFAULT_AVATARS.user;
  _userAvatarCache = { key: currentUserPresetId, value: result };
  return result;
}

function getAssistantDisplayName() {
  const aiConfig = extension_settings[extensionName]?.chatu8_ai_assistant || {};
  const systemPromptKey = aiConfig.system_prompt_key || "default";
  if (systemPromptKey === "custom") {
    const personaProfiles = extension_settings[extensionName]?.personaProfiles;
    if (personaProfiles?.enabled) {
      const presetId = personaProfiles.currentPresetId;
      const preset = presetId ? personaProfiles.presets?.[presetId] : null;
      if (preset?.name) {
        return preset.name;
      }
    }
  }
  return "\u667A\u7ED8\u59EC";
}

function generateAvatarHTML(avatarSrc, alt = "Avatar") {
  return `<img src="${avatarSrc}" alt="${alt}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%; image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges;">`;
}

function updateDialogTitle() {
  const name = getAssistantDisplayName();
  const $title = $("#st-chatu8-ai-dialog-title");
  if ($title.length) {
    $title.text(`${name} AI \u52A9\u624B`);
  }
}

async function updateChatAvatars(chatBody) {
  if (!chatBody || !chatBody.length) return;
  const charAvatar = await getCurrentCharAvatar();
  const userAvatar = await getCurrentUserAvatar();
  const charAvatarHTML = generateAvatarHTML(charAvatar, "\u667A\u7ED8\u59EC");
  const userAvatarHTML = generateAvatarHTML(userAvatar, "User");
  chatBody.find(".st-chatu8-ai-msg.system-msg .msg-avatar").html(charAvatarHTML);
  chatBody.find(".st-chatu8-ai-msg.user-msg .msg-avatar").html(userAvatarHTML);
}

function initAvatarUpdateListener(chatBody) {
  if (!chatBody || !chatBody.length) return;
  const checkInterval = setInterval(async () => {
    const personaProfiles = extension_settings[extensionName]?.personaProfiles;
    if (!personaProfiles) return;
    const currentPresetId = personaProfiles.currentPresetId;
    const currentUserPresetId = personaProfiles.currentUserPresetId;
    const aiConfig = extension_settings[extensionName]?.chatu8_ai_assistant || {};
    const currentPromptKey = aiConfig.system_prompt_key || "default";
    const lastPresetId = chatBody.data("last-persona-preset-id");
    const lastUserPresetId = chatBody.data("last-user-preset-id");
    const lastPromptKey = chatBody.data("last-prompt-key");
    if (currentPresetId !== lastPresetId || currentUserPresetId !== lastUserPresetId || currentPromptKey !== lastPromptKey) {
      clearAvatarCache();
      await updateChatAvatars(chatBody);
      updateDialogTitle();
      chatBody.data("last-persona-preset-id", currentPresetId);
      chatBody.data("last-user-preset-id", currentUserPresetId);
      chatBody.data("last-prompt-key", currentPromptKey);
    }
  }, 500);
  return () => clearInterval(checkInterval);
}

export { generateAvatarHTML, getAssistantDisplayName, getCurrentCharAvatar, getCurrentUserAvatar, initAvatarUpdateListener, updateDialogTitle };
