// 还原自打包产物 — 原始模块: utils/newline_fix.js
import { chat, eventSource, event_types, messageFormatting, saveChatConditional, saveSettingsDebounced } from "../../../../../../script.js";
import { extension_settings } from "../../../../../extensions.js";
import { getContext } from "../../../../../st-context.js";
import { extensionName } from "./config.js";
import { stylishConfirm } from "./ui_common.js";
import { refreshCharacterSettings } from "./settings/character/index.js";
import "./utils.js"; // init_utils

var render;

render = async (message_id) => {
      console.log("rendering message:", message_id);
      const mes_html = document.querySelector(`div.mes[mesid="${message_id}"]`);
      if (!mes_html) {
        return;
      }
      const chat_message = chat[message_id];
      if (chat_message.swipes) {
        const swipesCounter = mes_html.querySelector(".swipes-counter");
        if (swipesCounter) {
          swipesCounter.textContent = `${chat_message.swipe_id + 1}\u200B/\u200B${chat_message.swipes.length}`;
        }
      }
      const mesText = mes_html.querySelector(".mes_text");
      if (mesText) {
        mesText.innerHTML = messageFormatting(
          chat_message.mes,
          chat_message.name,
          chat_message.is_system,
          chat_message.is_user,
          message_id
        );
      }
      mes_html.querySelectorAll("pre code").forEach((element) => {
        highlight_code(element);
      });
      await eventSource.emit(
        chat_message.is_user ? event_types.USER_MESSAGE_RENDERED : event_types.CHARACTER_MESSAGE_RENDERED,
        message_id
      );
    };

function initializeNewlineFixer() {
  eventSource.on(event_types.MESSAGE_RECEIVED, async function(id) {
    if (String(extension_settings[extensionName].newlineFixEnabled) !== "true") {
      return;
    }
    if (!chat[id] || typeof chat[id].mes !== "string") {
      return;
    }
    const originalMessage = chat[id].mes;
    let newMessage = originalMessage.replaceAll("\n###", "###");
    newMessage = newMessage.replace(/<image>\n*###\n*/g, "<image>image###");
    const settings3 = extension_settings[extensionName];
    const startTag = settings3?.startTag || "image###";
    const endTag = settings3?.endTag || "###";
    const escapeRegExp2 = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const tagBlockRegex = new RegExp(`${escapeRegExp2(startTag)}([\\s\\S]*?)${escapeRegExp2(endTag)}`, "g");
    newMessage = newMessage.replace(tagBlockRegex, (match, innerContent) => {
      const sanitizedContent = innerContent.replace(/，/g, ",").replace(/；/g, ";").replace(/：/g, ":");
      return `${startTag}${sanitizedContent}${endTag}`;
    });
    if (originalMessage !== newMessage) {
      console.log(`ChatU8: Fixed newlines & symbols for message ID: ${id}`);
      chat[id].mes = newMessage;
      await saveChatConditional();
      render(id);
    }
  });
  eventSource.on(event_types.MESSAGE_RECEIVED, async function(id) {
    console.log(`ChatU8: Extracting character and outfit tags for message ID: ${id}`);
    if (!chat[id] || typeof chat[id].mes !== "string") {
      return;
    }
    const originalMessage = chat[id].mes;
    const extracted = extractCharacterAndOutfitTags2(originalMessage);
    if (extracted.characters.length === 0 && extracted.outfits.length === 0) {
      return;
    }
    await handleExtractedData(extracted);
  });
  eventSource.on(event_types.MESSAGE_EDITED, async function(id) {
    console.log(`ChatU8: Extracting character and outfit tags for message ID: ${id}`);
    if (!chat[id] || typeof chat[id].mes !== "string") {
      return;
    }
    const originalMessage = chat[id].mes;
    const extracted = extractCharacterAndOutfitTags2(originalMessage);
    if (extracted.characters.length === 0 && extracted.outfits.length === 0) {
      return;
    }
    await handleExtractedData(extracted);
  });
}

function highlight_code(element) {
  const $node = $(element);
  if ($node.hasClass("hljs") || $node.text().includes("<body")) {
    return;
  }
  hljs.highlightElement(element);
  $node.append(
    $(`<i class="fa-solid fa-copy code-copy interactable" title="Copy code"></i>`).on("click", function(e) {
      e.stopPropagation();
    }).on("pointerup", async function() {
      navigator.clipboard.writeText($(element).text());
      toastr.info(`\u5DF2\u590D\u5236!`, "", { timeOut: 2e3 });
    })
  );
}

function extractCharacterAndOutfitTags2(message) {
  const items = [];
  const combinedRegex = /<(人物|服装)>([\s\S]*?)<\/\1>/g;
  let match;
  while ((match = combinedRegex.exec(message)) !== null) {
    const type = match[1];
    const content = preprocessTagContent3(match[2]);
    const position = match.index;
    if (type === "\u4EBA\u7269") {
      const parsed = parseCharacterData2(content);
      if (parsed) {
        items.push({ type: "character", data: parsed, position, matchedOutfits: [] });
      }
    } else if (type === "\u670D\u88C5") {
      const parsed = parseOutfitData3(content);
      if (parsed) {
        items.push({ type: "outfit", data: parsed, position });
      }
    }
  }
  items.sort((a, b) => a.position - b.position);
  let currentCharacter = null;
  const characters = [];
  const orphanOutfits = [];
  for (const item of items) {
    if (item.type === "character") {
      currentCharacter = item;
      characters.push(item);
    } else if (item.type === "outfit") {
      if (currentCharacter) {
        currentCharacter.matchedOutfits.push(item.data);
      } else {
        orphanOutfits.push(item.data);
      }
    }
  }
  return {
    characters: characters.map((c) => ({ ...c.data, matchedOutfits: c.matchedOutfits })),
    outfits: orphanOutfits
  };
}

function preprocessTagContent3(content) {
  let processed = content.replace(/：/g, ":").replace(/，/g, ",");
  processed = processed.replace(/下半身NSWebcam:/g, "\u4E0B\u534A\u8EABNSFW\u80CC\u9762:");
  processed = processed.replace(/下半身NSFW_背面:/g, "\u4E0B\u534A\u8EABNSFW\u80CC\u9762:");
  processed = processed.replace(/上半身NSFW_背面:/g, "\u4E0A\u534A\u8EABNSFW\u80CC\u9762:");
  return processed;
}

function parseCharacterData2(content) {
  const lines = content.split("\n").map((line) => line.trim()).filter((line) => line);
  const data = {
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
    fullBodyNSFWBack: ""
  };
  const fieldMap = {
    "\u4E2D\u6587\u540D\u79F0": "nameCN",
    "\u82F1\u6587\u540D\u79F0": "nameEN",
    "\u89D2\u8272\u7279\u5F81": "characterTraits",
    "\u4E94\u5B98\u5916\u8C8C": "facialFeatures",
    "\u4E94\u5B98\u5916\u8C8C\u80CC\u9762": "facialFeaturesBack",
    "\u4E0A\u534A\u8EABSFW": "upperBodySFW",
    "\u4E0A\u534A\u8EABSFW\u80CC\u9762": "upperBodySFWBack",
    "\u4E0B\u534A\u8EABSFW": "fullBodySFW",
    "\u4E0B\u534A\u8EABSFW\u80CC\u9762": "fullBodySFWBack",
    "\u4E0A\u534A\u8EABNSFW": "upperBodyNSFW",
    "\u4E0A\u534A\u8EABNSFW\u80CC\u9762": "upperBodyNSFWBack",
    "\u4E0B\u534A\u8EABNSFW": "fullBodyNSFW",
    "\u4E0B\u534A\u8EABNSFW\u80CC\u9762": "fullBodyNSFWBack"
  };
  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;
    const key = line.substring(0, colonIndex).trim();
    const value = line.substring(colonIndex + 1).trim();
    if (fieldMap[key]) {
      data[fieldMap[key]] = value;
    } else if (key && value) {
      console.log(`ChatU8: \u672A\u8BC6\u522B\u7684\u4EBA\u7269\u5B57\u6BB5 "${key}"`);
    }
  }
  if (!data.nameCN) {
    return null;
  }
  console.log("ChatU8: \u89E3\u6790\u5230\u7684\u4EBA\u7269\u6570\u636E:", data);
  return data;
}

function parseOutfitData3(content) {
  const lines = content.split("\n").map((line) => line.trim()).filter((line) => line);
  const data = {
    nameCN: "",
    nameEN: "",
    owner: "",
    // 归属人（英文名称）
    upperBody: "",
    upperBodyBack: "",
    fullBody: "",
    fullBodyBack: ""
  };
  const fieldMap = {
    "\u5F52\u5C5E\u4EBA": "owner",
    "\u4E2D\u6587\u540D\u79F0": "nameCN",
    "\u82F1\u6587\u540D\u79F0": "nameEN",
    "\u4E0A\u534A\u8EAB": "upperBody",
    "\u4E0A\u534A\u8EAB\u80CC\u9762": "upperBodyBack",
    "\u4E0B\u534A\u8EAB": "fullBody",
    "\u4E0B\u534A\u8EAB\u80CC\u9762": "fullBodyBack"
  };
  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;
    const key = line.substring(0, colonIndex).trim();
    const value = line.substring(colonIndex + 1).trim();
    if (fieldMap[key]) {
      data[fieldMap[key]] = value;
    } else if (key && value) {
      console.log(`ChatU8: \u672A\u8BC6\u522B\u7684\u670D\u88C5\u5B57\u6BB5 "${key}"`);
    }
  }
  if (!data.nameCN) {
    return null;
  }
  console.log("ChatU8: \u89E3\u6790\u5230\u7684\u670D\u88C5\u6570\u636E:", data);
  return data;
}

async function handleExtractedData(extracted, metadata = {}) {
  const { characters, outfits } = extracted;
  const { generationContext = "", generationWorldBook = "", generationVariables = {} } = metadata;
  let message = "\u68C0\u6D4B\u5230\u4EE5\u4E0B\u5185\u5BB9:\n\n";
  if (characters.length > 0) {
    message += `\u4EBA\u7269 (${characters.length}\u4E2A):
`;
    characters.forEach((char) => {
      message += `  \u2022 ${char.nameCN} (${char.nameEN || "\u65E0\u82F1\u6587\u540D"})
`;
    });
    message += "\n";
  }
  if (outfits.length > 0) {
    message += `\u670D\u88C5 (${outfits.length}\u5957):
`;
    outfits.forEach((outfit) => {
      message += `  \u2022 ${outfit.nameCN} (${outfit.nameEN || "\u65E0\u82F1\u6587\u540D"})
`;
    });
    message += "\n";
  }
  message += "\u662F\u5426\u5F55\u5165\u8FD9\u4E9B\u6570\u636E?";
  const confirmed = await stylishConfirm(message);
  if (!confirmed) {
    return;
  }
  const settings3 = extension_settings[extensionName];
  const createdCharacters = [];
  const createdOutfits = [];
  const stContext = getContext();
  const cardPrefix = stContext?.name2 ? `[${stContext.name2}]` : "";
  const outfitOwnershipMap = {};
  for (const outfitData of outfits) {
    const presetName = cardPrefix ? `${cardPrefix}${outfitData.nameCN}` : outfitData.nameCN;
    if (settings3.outfitPresets[presetName]) {
      const overwrite = await stylishConfirm(`\u670D\u88C5 "${presetName}" \u5DF2\u5B58\u5728,\u662F\u5426\u8986\u76D6?`);
      if (!overwrite) continue;
    }
    settings3.outfitPresets[presetName] = {
      nameCN: outfitData.nameCN,
      nameEN: outfitData.nameEN,
      owner: outfitData.owner || "",
      upperBody: outfitData.upperBody,
      upperBodyBack: outfitData.upperBodyBack,
      fullBody: outfitData.fullBody,
      fullBodyBack: outfitData.fullBodyBack
    };
    console.log(`ChatU8: \u5DF2\u4FDD\u5B58\u670D\u88C5\u9884\u8BBE "${presetName}":`, settings3.outfitPresets[presetName]);
    createdOutfits.push(presetName);
    if (outfitData.owner && outfitData.owner.trim()) {
      outfitOwnershipMap[presetName] = outfitData.owner.trim();
    }
  }
  for (const charData of characters) {
    const presetName = cardPrefix ? `${cardPrefix}${charData.nameCN}` : charData.nameCN;
    if (settings3.characterPresets[presetName]) {
      const overwrite = await stylishConfirm(`\u89D2\u8272 "${presetName}" \u5DF2\u5B58\u5728,\u662F\u5426\u8986\u76D6?`);
      if (!overwrite) continue;
    }
    const matchedOutfitNames = [];
    if (charData.matchedOutfits && charData.matchedOutfits.length > 0) {
      for (const outfitData of charData.matchedOutfits) {
        const outfitName = cardPrefix ? `${cardPrefix}${outfitData.nameCN}` : outfitData.nameCN;
        if (settings3.outfitPresets[outfitName]) {
          const overwrite = await stylishConfirm(`\u670D\u88C5 "${outfitName}" \u5DF2\u5B58\u5728,\u662F\u5426\u8986\u76D6?`);
          if (!overwrite) continue;
        }
        settings3.outfitPresets[outfitName] = {
          nameCN: outfitData.nameCN,
          nameEN: outfitData.nameEN,
          owner: outfitData.owner || "",
          upperBody: outfitData.upperBody,
          upperBodyBack: outfitData.upperBodyBack,
          fullBody: outfitData.fullBody,
          fullBodyBack: outfitData.fullBodyBack
        };
        console.log(`ChatU8: \u5DF2\u4FDD\u5B58\u670D\u88C5\u9884\u8BBE "${outfitName}" (\u5173\u8054\u5230 ${presetName}):`, settings3.outfitPresets[outfitName]);
        createdOutfits.push(outfitName);
        if (outfitData.owner && outfitData.owner.trim()) {
          outfitOwnershipMap[outfitName] = outfitData.owner.trim();
        } else {
          matchedOutfitNames.push(outfitName);
        }
      }
    }
    settings3.characterPresets[presetName] = {
      nameCN: charData.nameCN,
      nameEN: charData.nameEN,
      characterTraits: charData.characterTraits,
      // 角色特征
      facialFeatures: charData.facialFeatures,
      facialFeaturesBack: charData.facialFeaturesBack,
      upperBodySFW: charData.upperBodySFW,
      upperBodySFWBack: charData.upperBodySFWBack,
      fullBodySFW: charData.fullBodySFW,
      fullBodySFWBack: charData.fullBodySFWBack,
      upperBodyNSFW: charData.upperBodyNSFW,
      upperBodyNSFWBack: charData.upperBodyNSFWBack,
      fullBodyNSFW: charData.fullBodyNSFW,
      fullBodyNSFWBack: charData.fullBodyNSFWBack,
      outfits: matchedOutfitNames,
      // 只关联没有指定归属人或归属当前角色的服装
      generationContext,
      // 存储生成时的上下文
      generationWorldBook,
      // 存储生成时的世界书触发
      generationVariables
      // 存储生成时使用的 getvar 变量
    };
    console.log(`ChatU8: \u5DF2\u4FDD\u5B58\u89D2\u8272\u9884\u8BBE "${presetName}" (\u5173\u8054\u670D\u88C5: ${matchedOutfitNames.join(", ")}):`, settings3.characterPresets[presetName]);
    createdCharacters.push(presetName);
  }
  const normalizeOwnerName = (name) => {
    if (!name) return "";
    return name.toLowerCase().replace(/\s+/g, "");
  };
  for (const [outfitName, ownerNameEN] of Object.entries(outfitOwnershipMap)) {
    const normalizedOwner = normalizeOwnerName(ownerNameEN);
    let matchCount = 0;
    const matchedPresetNames = /* @__PURE__ */ new Set();
    for (const charData of characters) {
      if (charData.nameEN && normalizeOwnerName(charData.nameEN) === normalizedOwner) {
        const presetName = cardPrefix ? `${cardPrefix}${charData.nameCN}` : charData.nameCN;
        matchedPresetNames.add(presetName);
      }
    }
    for (const [presetName, preset] of Object.entries(settings3.characterPresets)) {
      if (preset.nameEN && normalizeOwnerName(preset.nameEN) === normalizedOwner) {
        matchedPresetNames.add(presetName);
      }
    }
    for (const targetName of matchedPresetNames) {
      const targetPreset = settings3.characterPresets[targetName];
      if (targetPreset) {
        if (!targetPreset.outfits) {
          targetPreset.outfits = [];
        }
        if (!targetPreset.outfits.includes(outfitName)) {
          targetPreset.outfits.push(outfitName);
          matchCount++;
          console.log(`ChatU8: \u670D\u88C5 "${outfitName}" \u5DF2\u5F52\u5C5E\u5230\u89D2\u8272 "${targetName}" (via owner: ${ownerNameEN})`);
        }
      }
    }
    if (matchCount === 0) {
      console.warn(`ChatU8: \u65E0\u6CD5\u627E\u5230\u5F52\u5C5E\u4EBA "${ownerNameEN}" \u5BF9\u5E94\u7684\u89D2\u8272,\u670D\u88C5 "${outfitName}" \u672A\u5F52\u5C5E`);
    } else if (matchCount > 1) {
      console.log(`ChatU8: \u670D\u88C5 "${outfitName}" \u5DF2\u5F52\u5C5E\u5230 ${matchCount} \u4E2A\u540C\u540D\u89D2\u8272`);
    }
  }
  const characterTab = $("#st-chatu8-tab-character");
  if (characterTab.length) {
    refreshCharacterSettings(characterTab);
  }
  if (createdOutfits.length > 0) {
    saveSettingsDebounced();
  }
  if (createdCharacters.length > 0) {
    const enable = await stylishConfirm(
      `\u662F\u5426\u5728\u5F53\u524D\u89D2\u8272\u542F\u7528\u5217\u8868\u4E2D\u542F\u7528\u8FD9 ${createdCharacters.length} \u4E2A\u89D2\u8272?`
    );
    if (enable) {
      const currentPresetId = settings3.characterEnablePresetId;
      if (currentPresetId && settings3.characterEnablePresets[currentPresetId]) {
        const enablePreset = settings3.characterEnablePresets[currentPresetId];
        enablePreset.characters = [.../* @__PURE__ */ new Set([...enablePreset.characters, ...createdCharacters])];
        saveSettingsDebounced();
      }
    }
  }
  let summary = "\u5F55\u5165\u5B8C\u6210!\n\n";
  if (createdCharacters.length > 0) {
    summary += `\u2713 \u5DF2\u521B\u5EFA ${createdCharacters.length} \u4E2A\u89D2\u8272\u9884\u8BBE
`;
  }
  if (createdOutfits.length > 0) {
    summary += `\u2713 \u5DF2\u521B\u5EFA ${createdOutfits.length} \u4E2A\u670D\u88C5\u9884\u8BBE
`;
  }
  toastr.success(summary, "\u6570\u636E\u5F55\u5165\u6210\u529F", { timeOut: 3e3 });
}

export { extractCharacterAndOutfitTags2, handleExtractedData, initializeNewlineFixer };
