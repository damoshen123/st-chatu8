// 还原自打包产物 — 原始模块: utils/character_config.js
var CHARACTER_CONFIG_SCHEMA_VERSION, defaultCharacterSettings;

CHARACTER_CONFIG_SCHEMA_VERSION = 2;

defaultCharacterSettings = {
      // 角色预设
      characterPresets: {
        "\u9ED8\u8BA4\u89D2\u8272": {
          nameCN: "",
          nameEN: "",
          characterTraits: "",
          // 角色特征
          facialFeatures: "",
          facialFeaturesBack: "",
          upperBodySFW: "",
          upperBodySFWBack: "",
          fullBodySFW: "",
          fullBodySFWBack: "",
          upperBodyNSFW: "",
          upperBodyNSFWBack: "",
          fullBodyNSFW: "",
          fullBodyNSFWBack: "",
          outfits: [],
          photoMedia: [],
          audioMedia: [],
          selectedPhotoId: null,
          selectedAudioId: null,
          photoImageIds: [],
          // 兼容旧版本
          selectedPhotoIndex: 0,
          // 兼容旧版本
          photoPrompt: "",
          // 角色照片生成提示词
          sendPhoto: false,
          sendAudio: false,
          generationContext: "",
          // 生成时的上下文
          generationWorldBook: "",
          // 生成时的世界书触发
          generationVariables: {}
          // 生成时使用的 getvar 变量
        }
      },
      characterPresetId: "\u9ED8\u8BA4\u89D2\u8272",
      // 服装预设
      outfitPresets: {
        "\u9ED8\u8BA4\u670D\u88C5": {
          nameCN: "",
          nameEN: "",
          owner: "",
          // 归属人（英文名称）
          upperBody: "",
          upperBodyBack: "",
          fullBody: "",
          fullBodyBack: "",
          photoImageIds: [],
          // 服装照片数组 (configDatabase ID 列表)
          selectedPhotoIndex: 0,
          // 当前选中的图片索引
          photoPrompt: "",
          // 服装照片生成提示词
          sendPhoto: false
          // 是否发送图片
        }
      },
      outfitPresetId: "\u9ED8\u8BA4\u670D\u88C5",
      // 角色启用预设
      characterEnablePresets: {
        "\u9ED8\u8BA4\u542F\u7528\u5217\u8868": {
          characters: []
        }
      },
      characterEnablePresetId: "\u9ED8\u8BA4\u542F\u7528\u5217\u8868",
      // 通用服装列表预设
      outfitEnablePresets: {
        "\u9ED8\u8BA4\u670D\u88C5\u5217\u8868": {
          outfits: []
        }
      },
      outfitEnablePresetId: "\u9ED8\u8BA4\u670D\u88C5\u5217\u8868",
      // 通用角色列表预设
      characterCommonPresets: {
        "\u9ED8\u8BA4\u901A\u7528\u89D2\u8272\u5217\u8868": {
          characters: []
        }
      },
      characterCommonPresetId: "\u9ED8\u8BA4\u901A\u7528\u89D2\u8272\u5217\u8868",
      // AI 生成设置
      characterAI: {
        model: "mistral",
        temperature: 0.8,
        systemPrompt: "\u4F60\u662F\u4E00\u4E2A\u4E13\u4E1A\u7684\u89D2\u8272\u8BBE\u8BA1\u52A9\u624B\u3002\u6839\u636E\u7528\u6237\u7684\u63CF\u8FF0\uFF0C\u751F\u6210\u8BE6\u7EC6\u7684\u89D2\u8272\u7279\u5F81\u63CF\u8FF0\u3002\u8BF7\u6309\u7167\u4EE5\u4E0B\u683C\u5F0F\u8F93\u51FA\uFF1A\n\n\u57FA\u7840\u4FE1\u606F\uFF1A\n\u5934\u90E8\u7279\u5F81\uFF1A\n\u8EAB\u4F53\u7279\u5F81\uFF1A\n\u7279\u6B8A\u7279\u5F81\uFF1A\n\u5176\u4ED6\u7279\u5F81\uFF1A\n\n\u6BCF\u4E2A\u90E8\u5206\u90FD\u8981\u8BE6\u7EC6\u63CF\u8FF0\u3002",
        lastPrompt: ""
      },
      outfitAI: {
        model: "mistral",
        temperature: 0.8,
        systemPrompt: "\u4F60\u662F\u4E00\u4E2A\u4E13\u4E1A\u7684\u670D\u88C5\u8BBE\u8BA1\u52A9\u624B\u3002\u6839\u636E\u7528\u6237\u7684\u63CF\u8FF0\uFF0C\u751F\u6210\u8BE6\u7EC6\u7684\u670D\u88C5\u914D\u9970\u63CF\u8FF0\u3002\u8BF7\u6309\u7167\u4EE5\u4E0B\u683C\u5F0F\u8F93\u51FA\uFF1A\n\n\u5934\u9888\u90E8\u88C5\u9970\uFF1A\n\u8EAF\u5E72\u670D\u88C5\uFF1A\n\u4E0B\u8EAB\u670D\u88C5\uFF1A\n\u624B\u811A\u914D\u9970\uFF1A\n\u5176\u4ED6\u914D\u9970\uFF1A\n\n\u6BCF\u4E2A\u90E8\u5206\u90FD\u8981\u8BE6\u7EC6\u63CF\u8FF0\u3002",
        lastPrompt: ""
      }
    };

function normalizeMediaEntry(entry, kind = "image", fallbackId = null) {
  if (!entry && !fallbackId) return null;
  const id = typeof entry === "string" ? entry : entry?.id || fallbackId;
  if (!id) return null;
  const source = typeof entry === "object" ? entry : {};
  return {
    id,
    kind: source.kind || kind,
    mimeType: source.mimeType || (kind === "audio" ? "audio/mpeg" : "image/png"),
    fileName: source.fileName || source.filename || id,
    size: Number.isFinite(source.size) ? source.size : void 0,
    description: typeof source.description === "string" ? source.description : ""
  };
}

function normalizeCharacterPreset(preset = {}) {
  let result = preset;
  if (!result || typeof result !== "object") {
    if (typeof result === "string" && result.trim()) {
      result = {
        nameCN: result.trim(),
        nameEN: "",
        characterTraits: "",
        photoMedia: [],
        audioMedia: []
      };
    } else {
      result = {
        photoMedia: [],
        audioMedia: []
      };
    }
  }
  const legacyIds = Array.isArray(result.photoImageIds) ? result.photoImageIds : [];
  const legacySingle = result.photoImageId && !legacyIds.includes(result.photoImageId) ? [result.photoImageId] : [];
  const sourceMedia = Array.isArray(result.photoMedia) ? result.photoMedia : [];
  result.photoMedia = [...sourceMedia, ...legacyIds, ...legacySingle].map((entry) => normalizeMediaEntry(entry, "image")).filter(Boolean).filter((entry, index, items) => items.findIndex((item) => item.id === entry.id) === index);
  result.audioMedia = (Array.isArray(result.audioMedia) ? result.audioMedia : []).map((entry) => normalizeMediaEntry(entry, "audio")).filter(Boolean).filter((entry, index, items) => items.findIndex((item) => item.id === entry.id) === index);
  const photoIndex = Number.isInteger(result.selectedPhotoIndex) ? result.selectedPhotoIndex : 0;
  result.selectedPhotoId = result.selectedPhotoId && result.photoMedia.some((item) => item.id === result.selectedPhotoId) ? result.selectedPhotoId : result.photoMedia[photoIndex]?.id || result.photoMedia.at(-1)?.id || null;
  result.selectedAudioId = result.selectedAudioId && result.audioMedia.some((item) => item.id === result.selectedAudioId) ? result.selectedAudioId : result.audioMedia[0]?.id || null;
  result.mediaSchemaVersion = CHARACTER_CONFIG_SCHEMA_VERSION;
  return result;
}

function normalizeCharacterEnableEntry(entry) {
  if (typeof entry === "string") return {
    characterPresetName: entry,
    imageFileId: null,
    audioFileId: null,
    imageDescription: "",
    audioDescription: ""
  };
  const source = entry || {};
  return {
    characterPresetName: source.characterPresetName || source.name || source.presetName || "",
    imageFileId: source.imageFileId || null,
    audioFileId: source.audioFileId || null,
    imageDescription: typeof source.imageDescription === "string" ? source.imageDescription : "",
    audioDescription: typeof source.audioDescription === "string" ? source.audioDescription : ""
  };
}

function normalizeCharacterEnablePreset(preset = {}) {
  if (!preset || typeof preset !== "object") {
    preset = { characters: [] };
  }
  preset.characters = (Array.isArray(preset.characters) ? preset.characters : []).map(normalizeCharacterEnableEntry).filter((entry) => entry.characterPresetName);
  preset.mediaSchemaVersion = CHARACTER_CONFIG_SCHEMA_VERSION;
  return preset;
}

function migrateCharacterSettings(settings3 = {}) {
  if (!settings3 || typeof settings3 !== "object") return settings3;
  if (Array.isArray(settings3.characterPresets)) {
    const converted = {};
    settings3.characterPresets.forEach((item, idx) => {
      if (typeof item === "string" && item.trim()) {
        converted[item.trim()] = { nameCN: item.trim() };
      } else if (item && typeof item === "object") {
        const name = item.nameCN || item.nameEN || `\u89D2\u8272_${idx + 1}`;
        converted[name] = item;
      }
    });
    settings3.characterPresets = converted;
  } else if (settings3.characterPresets && typeof settings3.characterPresets === "object") {
    for (const [key, preset] of Object.entries(settings3.characterPresets)) {
      if (typeof preset === "string") {
        const charName = preset.trim() || key;
        delete settings3.characterPresets[key];
        settings3.characterPresets[charName] = {
          nameCN: charName,
          nameEN: "",
          characterTraits: "",
          photoMedia: [],
          audioMedia: []
        };
      } else if (!preset || typeof preset !== "object") {
        delete settings3.characterPresets[key];
      }
    }
  } else {
    settings3.characterPresets = {};
  }
  for (const preset of Object.values(settings3.characterPresets || {})) {
    if (preset && typeof preset === "object") {
      normalizeCharacterPreset(preset);
    }
  }
  if (settings3.characterEnablePresets && typeof settings3.characterEnablePresets === "object") {
    for (const preset of Object.values(settings3.characterEnablePresets)) {
      if (preset && typeof preset === "object") {
        normalizeCharacterEnablePreset(preset);
      }
    }
  }
  settings3.characterConfigSchemaVersion = CHARACTER_CONFIG_SCHEMA_VERSION;
  return settings3;
}

export { defaultCharacterSettings, migrateCharacterSettings, normalizeCharacterEnableEntry, normalizeCharacterEnablePreset, normalizeCharacterPreset, normalizeMediaEntry };
