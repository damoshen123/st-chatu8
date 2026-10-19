// 还原自打包产物 — 原始模块: utils/characterprompt.js
import { extension_settings } from "../../../../../extensions.js";
import { extensionName } from "./config.js";
import { getSortedCharacterIds, parsePromptStringWithCoordinates } from "./utils.js";

function normalizeName(name) {
  return name.toLowerCase().replace(/-/g, " ").replace(/[''`´]/g, "'").replace(/\s+/g, " ").trim();
}

function calculateMatchScore(inputName, presetName) {
  if (!inputName || !presetName || typeof inputName !== "string" || typeof presetName !== "string") {
    return 0;
  }
  if (inputName === presetName) {
    return 1e3 + presetName.length;
  }
  if (inputName.includes(presetName)) {
    return 100 + presetName.length;
  }
  if (presetName.includes(inputName)) {
    return 50 + inputName.length;
  }
  return 0;
}

function collectCharacterCandidates(inputName, characterPresets, characterIds) {
  const candidates = [];
  for (const charId of characterIds) {
    const char = characterPresets[charId];
    if (!char) continue;
    if (char.nameEN) {
      const names = char.nameEN.split("|");
      for (const name of names) {
        const trimmedName = name.trim();
        if (!trimmedName) continue;
        const normalizedName = normalizeName(trimmedName);
        const score = calculateMatchScore(inputName, normalizedName);
        if (score > 0) {
          candidates.push({
            preset: char,
            score,
            matchedName: trimmedName
          });
        }
      }
    }
    if (char.nameCN) {
      const names = char.nameCN.split("|");
      for (const name of names) {
        const trimmedName = name.trim();
        if (!trimmedName) continue;
        const normalizedName = normalizeName(trimmedName);
        const score = calculateMatchScore(inputName, normalizedName);
        if (score > 0) {
          candidates.push({
            preset: char,
            score,
            matchedName: trimmedName
          });
        }
      }
    }
  }
  return candidates;
}

function collectOutfitCandidates(inputName, outfitPresets, outfitIds) {
  const candidates = [];
  for (const outfitId of outfitIds) {
    const outfit = outfitPresets[outfitId];
    if (!outfit) continue;
    if (outfit.nameEN) {
      const names = outfit.nameEN.split("|");
      for (const name of names) {
        const trimmedName = name.trim();
        if (!trimmedName) continue;
        const normalizedName = normalizeName(trimmedName);
        const score = calculateMatchScore(inputName, normalizedName);
        if (score > 0) {
          candidates.push({
            preset: outfit,
            score,
            matchedName: trimmedName
          });
        }
      }
    }
    if (outfit.nameCN) {
      const names = outfit.nameCN.split("|");
      for (const name of names) {
        const trimmedName = name.trim();
        if (!trimmedName) continue;
        const normalizedName = normalizeName(trimmedName);
        const score = calculateMatchScore(inputName, normalizedName);
        if (score > 0) {
          candidates.push({
            preset: outfit,
            score,
            matchedName: trimmedName
          });
        }
      }
    }
  }
  return candidates;
}

function findBestCharacterMatch(inputName, characterPresets, enabledCharacters, commonCharacters) {
  const presetNames = (entries) => (entries || []).map((entry) => typeof entry === "string" ? entry : entry?.characterPresetName).filter(Boolean);
  enabledCharacters = presetNames(enabledCharacters);
  commonCharacters = presetNames(commonCharacters);
  if (!inputName || typeof inputName !== "string") {
    return null;
  }
  let candidates = collectCharacterCandidates(inputName, characterPresets, enabledCharacters);
  if (candidates.length > 0) {
    const bestMatch = candidates.reduce(
      (best, current) => current.score > best.score ? current : best
    );
    console.log(
      "[CharacterPrompt] Best character match from enabled characters:",
      bestMatch.matchedName,
      "with score:",
      bestMatch.score
    );
    return bestMatch.preset;
  }
  candidates = collectCharacterCandidates(inputName, characterPresets, commonCharacters);
  if (candidates.length > 0) {
    const bestMatch = candidates.reduce(
      (best, current) => current.score > best.score ? current : best
    );
    console.log(
      "[CharacterPrompt] Best character match from common characters:",
      bestMatch.matchedName,
      "with score:",
      bestMatch.score
    );
    return bestMatch.preset;
  }
  const allCharacterIds = Object.keys(characterPresets);
  candidates = collectCharacterCandidates(inputName, characterPresets, allCharacterIds);
  if (candidates.length > 0) {
    const bestMatch = candidates.reduce(
      (best, current) => current.score > best.score ? current : best
    );
    console.log(
      "[CharacterPrompt] Best character match from all presets (fallback):",
      bestMatch.matchedName,
      "with score:",
      bestMatch.score
    );
    return bestMatch.preset;
  }
  return null;
}

function inspectCharacterPromptTrigger(input) {
  if (!input || typeof input !== "string") {
    return {
      matched: false,
      extractedName: "",
      normalizedName: "",
      matchedDisplayName: "",
      format: "invalid"
    };
  }
  const trimmedInput = input.trim();
  const unwrappedInput = trimmedInput.startsWith("$") && trimmedInput.endsWith("$") ? trimmedInput.slice(1, -1).trim() : trimmedInput;
  let extractedName = unwrappedInput;
  let format = "plain";
  try {
    if (unwrappedInput.startsWith("{") && unwrappedInput.endsWith("}")) {
      const parsed = JSON.parse(unwrappedInput);
      if (parsed.name) {
        extractedName = parsed.name;
        format = parsed.angle !== void 0 ? "json-character" : "json";
      }
    }
  } catch (error) {
  }
  if (format === "plain") {
    const characterFormats = [
      "-sfw-upperbody-sfw-lowerbody",
      "-sfw-upperbody-nsfw-lowerbody",
      "-nsfw-upperbody-sfw-lowerbody",
      "-nsfw-upperbody-nsfw-lowerbody",
      "-sfw-upperbody-sfw-fullbody",
      "-sfw-upperbody-nsfw-fullbody",
      "-nsfw-upperbody-sfw-fullbody",
      "-nsfw-upperbody-nsfw-fullbody",
      "-sfw-upperbody",
      "-nsfw-upperbody",
      "-sfw-lowerbody",
      "-nsfw-lowerbody"
    ];
    for (const pattern of characterFormats) {
      if (unwrappedInput.toLowerCase().endsWith(pattern)) {
        extractedName = unwrappedInput.slice(0, -pattern.length).trim();
        format = "legacy-character";
        break;
      }
    }
  }
  const normalizedName = normalizeName(extractedName);
  const defaultCharacterSettings2 = extension_settings[extensionName] || {};
  const characterPresets = defaultCharacterSettings2.characterPresets || {};
  const characterEnablePresetId = defaultCharacterSettings2.characterEnablePresetId;
  const characterCommonPresetId = defaultCharacterSettings2.characterCommonPresetId;
  const enabledCharacters = characterEnablePresetId && defaultCharacterSettings2.characterEnablePresets?.[characterEnablePresetId]?.characters || [];
  const commonCharacters = characterCommonPresetId && defaultCharacterSettings2.characterCommonPresets?.[characterCommonPresetId]?.characters || [];
  const character = findBestCharacterMatch(normalizedName, characterPresets, enabledCharacters, commonCharacters);
  const matchedDisplayName = character?.nameCN || character?.nameEN || "";
  let matchedPresetId = "";
  if (character) {
    for (const id of Object.keys(characterPresets)) {
      if (characterPresets[id] === character) {
        matchedPresetId = id;
        break;
      }
    }
  }
  let matchSource = "none";
  if (character) {
    if (matchedPresetId && enabledCharacters.some((entry) => (typeof entry === "string" ? entry : entry?.characterPresetName) === matchedPresetId)) {
      matchSource = "enabled";
    } else if (matchedPresetId && commonCharacters.includes(matchedPresetId)) {
      matchSource = "common";
    } else {
      matchSource = "fallback-all";
    }
  }
  return {
    matched: Boolean(character),
    extractedName,
    normalizedName,
    matchedDisplayName,
    matchedPresetId,
    matchSource,
    format
  };
}

function inspectCharacterPromptTriggers(input) {
  if (!input || typeof input !== "string") {
    return [];
  }
  const segments = [];
  const regex = /\$([^$]+)\$/g;
  let match;
  while ((match = regex.exec(input)) !== null) {
    segments.push(match[1].trim());
  }
  if (segments.length === 0) {
    segments.push(input.trim());
  }
  return segments.filter((seg) => seg.length > 0).map((seg) => ({
    segment: seg,
    result: inspectCharacterPromptTrigger(seg)
  }));
}

function findBestOutfitMatch(inputName, outfitPresets, enabledOutfits, allOutfitIds) {
  if (!inputName || typeof inputName !== "string") {
    return null;
  }
  let candidates = collectOutfitCandidates(inputName, outfitPresets, enabledOutfits);
  if (candidates.length > 0) {
    const bestMatch = candidates.reduce(
      (best, current) => current.score > best.score ? current : best
    );
    console.log(
      "[CharacterPrompt] Best outfit match from enabled outfits:",
      bestMatch.matchedName,
      "with score:",
      bestMatch.score
    );
    return bestMatch.preset;
  }
  candidates = collectOutfitCandidates(inputName, outfitPresets, allOutfitIds);
  if (candidates.length > 0) {
    const bestMatch = candidates.reduce(
      (best, current) => current.score > best.score ? current : best
    );
    console.log(
      "[CharacterPrompt] Best outfit match from all presets (fallback):",
      bestMatch.matchedName,
      "with score:",
      bestMatch.score
    );
    return bestMatch.preset;
  }
  return null;
}

function processCharacterPrompt(prompt2) {
  if (!prompt2 || typeof prompt2 !== "string") {
    return prompt2;
  }
  prompt2 = prompt2.replace(/\r?\n/g, ", ");
  window.collectedCharacterNegatives = "";
  if (prompt2.includes("Scene Composition")) {
    console.log("[CharacterPrompt] \u68C0\u6D4B\u5230\u5206\u89D2\u8272\u6A21\u5F0F");
    return processMultiCharacterPrompt(prompt2);
  }
  console.log("[CharacterPrompt] \u4F7F\u7528\u975E\u5206\u89D2\u8272\u6A21\u5F0F");
  const defaultCharacterSettings2 = extension_settings[extensionName];
  console.log("[CharacterPrompt] Processing prompt:", prompt2);
  const characterPresets = defaultCharacterSettings2.characterPresets || {};
  const outfitPresets = defaultCharacterSettings2.outfitPresets || {};
  const characterEnablePresetId = defaultCharacterSettings2.characterEnablePresetId;
  const characterCommonPresetId = defaultCharacterSettings2.characterCommonPresetId;
  const outfitEnablePresetId = defaultCharacterSettings2.outfitEnablePresetId;
  const enabledCharacters = characterEnablePresetId && defaultCharacterSettings2.characterEnablePresets?.[characterEnablePresetId]?.characters || [];
  const commonCharacters = characterCommonPresetId && defaultCharacterSettings2.characterCommonPresets?.[characterCommonPresetId]?.characters || [];
  const enabledOutfits = outfitEnablePresetId && defaultCharacterSettings2.outfitEnablePresets?.[outfitEnablePresetId]?.outfits || [];
  const characterOutfits = enabledCharacters.flatMap((charId) => characterPresets[charId]?.outfits || []);
  const allAvailableOutfits = [.../* @__PURE__ */ new Set([...enabledOutfits, ...characterOutfits])];
  const outfitNameMap = /* @__PURE__ */ new Map();
  for (const outfitId of allAvailableOutfits) {
    const outfit = outfitPresets[outfitId];
    if (outfit) {
      if (outfit.nameEN) {
        const names = outfit.nameEN.split("|");
        for (const name of names) {
          const trimmedName = name.trim();
          if (trimmedName) {
            outfitNameMap.set(trimmedName, outfit);
          }
        }
      }
      if (outfit.nameCN) {
        const names = outfit.nameCN.split("|");
        for (const name of names) {
          const trimmedName = name.trim();
          if (trimmedName) {
            outfitNameMap.set(trimmedName, outfit);
          }
        }
      }
    }
  }
  let sharedCameraAngle = null;
  let sharedIsFromBehind = false;
  const parseJsonFormat = (content) => {
    try {
      if (content.startsWith("{") && content.endsWith("}")) {
        const parsed = JSON.parse(content);
        if (parsed.name) {
          return {
            isJson: true,
            hasAngle: "angle" in parsed,
            // 用于区分角色(有angle)和服装(无angle)
            name: parsed.name,
            angle: parsed.angle || "",
            upperBody: parsed.upperBody || "hidden",
            // hidden 表示不处理
            lowerBody: parsed.lowerBody || "hidden"
            // hidden 表示不处理
          };
        }
      }
    } catch (e) {
    }
    return { isJson: false };
  };
  const processedPrompt = prompt2.replace(/\$([^$]+)\$/g, (match, content) => {
    const trimmedContent = content.trim();
    const jsonData = parseJsonFormat(trimmedContent);
    if (jsonData.isJson) {
      const normalizedCharacterName = normalizeName(jsonData.name);
      const cameraAngle = jsonData.angle;
      const isFromBehind = cameraAngle.toLowerCase().includes("from behind");
      sharedCameraAngle = cameraAngle;
      sharedIsFromBehind = isFromBehind;
      const upperState = jsonData.upperBody.toLowerCase();
      const lowerState = jsonData.lowerBody.toLowerCase();
      if (jsonData.hasAngle) {
        const character = findBestCharacterMatch(
          normalizedCharacterName,
          characterPresets,
          enabledCharacters,
          commonCharacters
        );
        if (character) {
          let replacement = "";
          if (character.characterTraits) {
            replacement = character.characterTraits;
          }
          if (upperState !== "hidden") {
            const facialField = isFromBehind ? character.facialFeaturesBack || "" : character.facialFeatures || "";
            if (facialField) replacement += (replacement ? ", " : "") + facialField;
            if (upperState === "sfw") {
              const field = isFromBehind ? character.upperBodySFWBack : character.upperBodySFW;
              if (field) replacement += (replacement ? ", " : "") + field;
            } else if (upperState === "nsfw") {
              const field = isFromBehind ? character.upperBodyNSFWBack : character.upperBodyNSFW;
              if (field) replacement += (replacement ? ", " : "") + field;
            }
          }
          if (lowerState !== "hidden") {
            if (lowerState === "sfw") {
              const field = isFromBehind ? character.fullBodySFWBack : character.fullBodySFW;
              if (field) replacement += (replacement ? ", " : "") + field;
            } else if (lowerState === "nsfw") {
              const field = isFromBehind ? character.fullBodyNSFWBack : character.fullBodyNSFW;
              if (field) replacement += (replacement ? ", " : "") + field;
            }
          }
          if (character.negative) {
            collectNegativeToGlobal(character.negative);
          }
          console.log("[CharacterPrompt] JSON Character replacement result:", replacement);
          return replacement;
        }
        return match;
      } else {
        const normalizedOutfitName = normalizeName(jsonData.name);
        const allOutfitIds = Object.keys(outfitPresets);
        const outfit = findBestOutfitMatch(
          normalizedOutfitName,
          outfitPresets,
          allAvailableOutfits,
          allOutfitIds
        );
        if (outfit) {
          let replacement = "";
          if (upperState === "visible") {
            const field = sharedIsFromBehind ? outfit.upperBodyBack : outfit.upperBody;
            if (field) replacement = field;
          }
          if (lowerState === "visible") {
            const field = sharedIsFromBehind ? outfit.fullBodyBack : outfit.fullBody;
            if (field) replacement += (replacement ? ", " : "") + field;
          }
          console.log("[CharacterPrompt] JSON Outfit replacement result:", replacement);
          return replacement;
        }
        return match;
      }
    }
    const characterFormats = [
      { pattern: "-sfw-upperbody-sfw-lowerbody", upper: "sfw", lower: "sfw" },
      { pattern: "-sfw-upperbody-nsfw-lowerbody", upper: "sfw", lower: "nsfw" },
      { pattern: "-nsfw-upperbody-sfw-lowerbody", upper: "nsfw", lower: "sfw" },
      { pattern: "-nsfw-upperbody-nsfw-lowerbody", upper: "nsfw", lower: "nsfw" },
      { pattern: "-sfw-upperbody-sfw-fullbody", upper: "sfw", lower: "sfw" },
      { pattern: "-sfw-upperbody-nsfw-fullbody", upper: "sfw", lower: "nsfw" },
      { pattern: "-nsfw-upperbody-sfw-fullbody", upper: "nsfw", lower: "sfw" },
      { pattern: "-nsfw-upperbody-nsfw-fullbody", upper: "nsfw", lower: "nsfw" },
      { pattern: "-sfw-upperbody", upper: "sfw", lower: null },
      { pattern: "-nsfw-upperbody", upper: "nsfw", lower: null },
      { pattern: "-sfw-lowerbody", upper: null, lower: "sfw" },
      { pattern: "-nsfw-lowerbody", upper: null, lower: "nsfw" }
    ];
    for (const format of characterFormats) {
      if (trimmedContent.toLowerCase().endsWith(format.pattern)) {
        const nameAndAngle = trimmedContent.slice(0, -format.pattern.length).trim();
        const normalizedCharacterName = normalizeName(nameAndAngle);
        const cameraAngle = nameAndAngle;
        const isFromBehind = cameraAngle.toLowerCase().includes("from behind");
        sharedCameraAngle = cameraAngle;
        sharedIsFromBehind = isFromBehind;
        const character = findBestCharacterMatch(
          normalizedCharacterName,
          characterPresets,
          enabledCharacters,
          commonCharacters
        );
        if (character) {
          let replacement = "";
          if (character.characterTraits) {
            replacement = character.characterTraits;
          }
          if (format.upper) {
            const facialField = isFromBehind ? character.facialFeaturesBack || "" : character.facialFeatures || "";
            if (facialField) replacement += (replacement ? ", " : "") + facialField;
          }
          if (format.upper === "sfw") {
            const field = isFromBehind ? character.upperBodySFWBack : character.upperBodySFW;
            if (field) replacement += (replacement ? ", " : "") + field;
          } else if (format.upper === "nsfw") {
            const field = isFromBehind ? character.upperBodyNSFWBack : character.upperBodyNSFW;
            if (field) replacement += (replacement ? ", " : "") + field;
          }
          if (format.lower === "sfw") {
            const field = isFromBehind ? character.fullBodySFWBack : character.fullBodySFW;
            if (field) replacement += (replacement ? ", " : "") + field;
          } else if (format.lower === "nsfw") {
            const field = isFromBehind ? character.fullBodyNSFWBack : character.fullBodyNSFW;
            if (field) replacement += (replacement ? ", " : "") + field;
          }
          if (character.negative) {
            collectNegativeToGlobal(character.negative);
          }
          console.log("[CharacterPrompt] Character replacement result:", replacement);
          return replacement;
        }
        return match;
      }
    }
    const outfitFormats = [
      { pattern: "-upperbody-lowerbody", hasUpper: true, hasLower: true },
      { pattern: "-upperbody", hasUpper: true, hasLower: false },
      { pattern: "-lowerbody", hasUpper: false, hasLower: true }
    ];
    for (const format of outfitFormats) {
      if (trimmedContent.toLowerCase().endsWith(format.pattern)) {
        const rawOutfitName = trimmedContent.slice(0, -format.pattern.length).trim();
        const normalizedOutfitName = normalizeName(rawOutfitName);
        const allOutfitIds = Object.keys(outfitPresets);
        const outfit = findBestOutfitMatch(
          normalizedOutfitName,
          outfitPresets,
          allAvailableOutfits,
          allOutfitIds
        );
        if (outfit) {
          let replacement = "";
          if (format.hasUpper) {
            const field = sharedIsFromBehind ? outfit.upperBodyBack : outfit.upperBody;
            if (field) replacement = field;
          }
          if (format.hasLower) {
            const field = sharedIsFromBehind ? outfit.fullBodyBack : outfit.fullBody;
            if (field) replacement += (replacement ? ", " : "") + field;
          }
          console.log("[CharacterPrompt] Outfit replacement result:", replacement);
          return replacement;
        }
        return match;
      }
    }
    return match;
  });
  let finalPrompt = processedPrompt.replace(/\r?\n/g, ", ");
  return finalPrompt.replace(/, \s*,/g, ",").replace(/,+/g, ",").replace(/^, |, $/g, "").trim();
}

function collectNegativeToGlobal(negative) {
  if (!negative || typeof negative !== "string") {
    return;
  }
  const trimmed = negative.trim();
  if (!trimmed) {
    return;
  }
  if (window.collectedCharacterNegatives) {
    window.collectedCharacterNegatives += ", " + trimmed;
  } else {
    window.collectedCharacterNegatives = trimmed;
  }
  console.log("[CharacterPrompt] \u6536\u96C6\u8D1F\u9762\u63D0\u793A\u8BCD\u5230\u5168\u5C40:", trimmed);
}

function processMultiCharacterPrompt(prompt2) {
  try {
    const prompt_data = parsePromptStringWithCoordinates(prompt2);
    console.log("[CharacterPrompt] \u89E3\u6790\u540E\u7684 prompt_data:", prompt_data);
    const defaultCharacterSettings2 = extension_settings[extensionName];
    const characterPresets = defaultCharacterSettings2.characterPresets || {};
    const outfitPresets = defaultCharacterSettings2.outfitPresets || {};
    const characterEnablePresetId = defaultCharacterSettings2.characterEnablePresetId;
    const characterCommonPresetId = defaultCharacterSettings2.characterCommonPresetId;
    const outfitEnablePresetId = defaultCharacterSettings2.outfitEnablePresetId;
    const enabledCharacters = characterEnablePresetId && defaultCharacterSettings2.characterEnablePresets?.[characterEnablePresetId]?.characters || [];
    const commonCharacters = characterCommonPresetId && defaultCharacterSettings2.characterCommonPresets?.[characterCommonPresetId]?.characters || [];
    const enabledOutfits = outfitEnablePresetId && defaultCharacterSettings2.outfitEnablePresets?.[outfitEnablePresetId]?.outfits || [];
    const characterOutfits = enabledCharacters.flatMap((charId) => characterPresets[charId]?.outfits || []);
    const allAvailableOutfits = [.../* @__PURE__ */ new Set([...enabledOutfits, ...characterOutfits])];
    const charIds = getSortedCharacterIds(prompt_data);
    for (const i of charIds) {
      const promptKey = `Character ${i} Prompt`;
      const ucKey = `Character ${i} UC`;
      if (prompt_data[promptKey]) {
        console.log(`[CharacterPrompt] \u5904\u7406 ${promptKey}:`, prompt_data[promptKey]);
        const negatives = [];
        let sharedIsFromBehind = false;
        const replacedPrompt = prompt_data[promptKey].replace(/\$([^$]+)\$/g, (match, content) => {
          const trimmedContent = content.trim();
          const parseJsonFormat = (content2) => {
            try {
              if (content2.startsWith("{") && content2.endsWith("}")) {
                const parsed = JSON.parse(content2);
                if (parsed.name) {
                  return {
                    isJson: true,
                    hasAngle: "angle" in parsed,
                    name: parsed.name,
                    angle: parsed.angle || "",
                    upperBody: parsed.upperBody || "hidden",
                    lowerBody: parsed.lowerBody || "hidden"
                  };
                }
              }
            } catch (e) {
            }
            return { isJson: false };
          };
          const jsonData = parseJsonFormat(trimmedContent);
          if (jsonData.isJson && jsonData.hasAngle) {
            const normalizedCharacterName = normalizeName(jsonData.name);
            const isFromBehind = jsonData.angle.toLowerCase().includes("from behind");
            sharedIsFromBehind = isFromBehind;
            const character = findBestCharacterMatch(
              normalizedCharacterName,
              characterPresets,
              enabledCharacters,
              commonCharacters
            );
            if (character) {
              if (character.negative) {
                negatives.push(character.negative.trim());
                console.log(`[CharacterPrompt] \u6536\u96C6\u8D1F\u9762\u63D0\u793A\u8BCD:`, character.negative.trim());
              }
              let replacement = "";
              if (character.characterTraits) {
                replacement = character.characterTraits;
              }
              const upperState = jsonData.upperBody.toLowerCase();
              const lowerState = jsonData.lowerBody.toLowerCase();
              if (upperState !== "hidden") {
                const facialField = isFromBehind ? character.facialFeaturesBack || "" : character.facialFeatures || "";
                if (facialField) replacement += (replacement ? ", " : "") + facialField;
                if (upperState === "sfw") {
                  const field = isFromBehind ? character.upperBodySFWBack : character.upperBodySFW;
                  if (field) replacement += (replacement ? ", " : "") + field;
                } else if (upperState === "nsfw") {
                  const field = isFromBehind ? character.upperBodyNSFWBack : character.upperBodyNSFW;
                  if (field) replacement += (replacement ? ", " : "") + field;
                }
              }
              if (lowerState !== "hidden") {
                if (lowerState === "sfw") {
                  const field = isFromBehind ? character.fullBodySFWBack : character.fullBodySFW;
                  if (field) replacement += (replacement ? ", " : "") + field;
                } else if (lowerState === "nsfw") {
                  const field = isFromBehind ? character.fullBodyNSFWBack : character.fullBodyNSFW;
                  if (field) replacement += (replacement ? ", " : "") + field;
                }
              }
              return replacement;
            }
          } else if (jsonData.isJson && !jsonData.hasAngle) {
            const normalizedOutfitName = normalizeName(jsonData.name);
            const allOutfitIds = Object.keys(outfitPresets);
            const outfit = findBestOutfitMatch(
              normalizedOutfitName,
              outfitPresets,
              allAvailableOutfits,
              allOutfitIds
            );
            if (outfit) {
              let replacement = "";
              const upperState = jsonData.upperBody.toLowerCase();
              const lowerState = jsonData.lowerBody.toLowerCase();
              if (upperState === "visible") {
                const field = sharedIsFromBehind ? outfit.upperBodyBack : outfit.upperBody;
                if (field) replacement = field;
              }
              if (lowerState === "visible") {
                const field = sharedIsFromBehind ? outfit.fullBodyBack : outfit.fullBody;
                if (field) replacement += (replacement ? ", " : "") + field;
              }
              console.log("[CharacterPrompt] JSON Outfit replacement result (multi-char mode):", replacement);
              return replacement;
            }
            return match;
          } else {
            const characterFormats = [
              { pattern: "-sfw-upperbody-sfw-lowerbody", upper: "sfw", lower: "sfw" },
              { pattern: "-sfw-upperbody-nsfw-lowerbody", upper: "sfw", lower: "nsfw" },
              { pattern: "-nsfw-upperbody-sfw-lowerbody", upper: "nsfw", lower: "sfw" },
              { pattern: "-nsfw-upperbody-nsfw-lowerbody", upper: "nsfw", lower: "nsfw" },
              { pattern: "-sfw-upperbody-sfw-fullbody", upper: "sfw", lower: "sfw" },
              { pattern: "-sfw-upperbody-nsfw-fullbody", upper: "sfw", lower: "nsfw" },
              { pattern: "-nsfw-upperbody-sfw-fullbody", upper: "nsfw", lower: "sfw" },
              { pattern: "-nsfw-upperbody-nsfw-fullbody", upper: "nsfw", lower: "nsfw" },
              { pattern: "-sfw-upperbody", upper: "sfw", lower: null },
              { pattern: "-nsfw-upperbody", upper: "nsfw", lower: null },
              { pattern: "-sfw-lowerbody", upper: null, lower: "sfw" },
              { pattern: "-nsfw-lowerbody", upper: null, lower: "nsfw" }
            ];
            for (const format of characterFormats) {
              if (trimmedContent.toLowerCase().endsWith(format.pattern)) {
                const nameAndAngle = trimmedContent.slice(0, -format.pattern.length).trim();
                const normalizedCharacterName = normalizeName(nameAndAngle);
                const isFromBehind = nameAndAngle.toLowerCase().includes("from behind");
                sharedIsFromBehind = isFromBehind;
                const character = findBestCharacterMatch(
                  normalizedCharacterName,
                  characterPresets,
                  enabledCharacters,
                  commonCharacters
                );
                if (character) {
                  if (character.negative) {
                    negatives.push(character.negative.trim());
                    console.log(`[CharacterPrompt] \u6536\u96C6\u8D1F\u9762\u63D0\u793A\u8BCD:`, character.negative.trim());
                  }
                  let replacement = "";
                  if (character.characterTraits) {
                    replacement = character.characterTraits;
                  }
                  if (format.upper) {
                    const facialField = isFromBehind ? character.facialFeaturesBack || "" : character.facialFeatures || "";
                    if (facialField) replacement += (replacement ? ", " : "") + facialField;
                  }
                  if (format.upper === "sfw") {
                    const field = isFromBehind ? character.upperBodySFWBack : character.upperBodySFW;
                    if (field) replacement += (replacement ? ", " : "") + field;
                  } else if (format.upper === "nsfw") {
                    const field = isFromBehind ? character.upperBodyNSFWBack : character.upperBodyNSFW;
                    if (field) replacement += (replacement ? ", " : "") + field;
                  }
                  if (format.lower === "sfw") {
                    const field = isFromBehind ? character.fullBodySFWBack : character.fullBodySFW;
                    if (field) replacement += (replacement ? ", " : "") + field;
                  } else if (format.lower === "nsfw") {
                    const field = isFromBehind ? character.fullBodyNSFWBack : character.fullBodyNSFW;
                    if (field) replacement += (replacement ? ", " : "") + field;
                  }
                  return replacement;
                }
                return match;
              }
            }
            const outfitFormats = [
              { pattern: "-upperbody-lowerbody", hasUpper: true, hasLower: true },
              { pattern: "-upperbody", hasUpper: true, hasLower: false },
              { pattern: "-lowerbody", hasUpper: false, hasLower: true }
            ];
            for (const format of outfitFormats) {
              if (trimmedContent.toLowerCase().endsWith(format.pattern)) {
                const rawOutfitName = trimmedContent.slice(0, -format.pattern.length).trim();
                const normalizedOutfitName = normalizeName(rawOutfitName);
                const allOutfitIds = Object.keys(outfitPresets);
                const outfit = findBestOutfitMatch(
                  normalizedOutfitName,
                  outfitPresets,
                  allAvailableOutfits,
                  allOutfitIds
                );
                if (outfit) {
                  let replacement = "";
                  if (format.hasUpper) {
                    const field = sharedIsFromBehind ? outfit.upperBodyBack : outfit.upperBody;
                    if (field) replacement = field;
                  }
                  if (format.hasLower) {
                    const field = sharedIsFromBehind ? outfit.fullBodyBack : outfit.fullBody;
                    if (field) replacement += (replacement ? ", " : "") + field;
                  }
                  return replacement;
                }
                return match;
              }
            }
          }
          return match;
        });
        prompt_data[promptKey] = replacedPrompt;
        if (negatives.length > 0) {
          const negativesStr = negatives.join(", ");
          if (prompt_data[ucKey]) {
            prompt_data[ucKey] += ", " + negativesStr;
          } else {
            prompt_data[ucKey] = negativesStr;
          }
          console.log(`[CharacterPrompt] \u6DFB\u52A0\u8D1F\u9762\u5230 ${ucKey}:`, negativesStr);
        }
      }
    }
    return reconstructPromptString(prompt_data);
  } catch (error) {
    console.error("[CharacterPrompt] \u5206\u89D2\u8272\u6A21\u5F0F\u5904\u7406\u5931\u8D25:", error);
    console.log("[CharacterPrompt] \u964D\u7EA7\u5230\u975E\u5206\u89D2\u8272\u6A21\u5F0F");
    return processCharacterPrompt(prompt2.replace("Scene Composition", "SceneComposition"));
  }
}

function reconstructPromptString(prompt_data) {
  if (!prompt_data || typeof prompt_data !== "object") {
    console.error("[CharacterPrompt] prompt_data \u65E0\u6548");
    return "";
  }
  let result = "";
  if (prompt_data["Scene Composition"]) {
    result += `Scene Composition: ${prompt_data["Scene Composition"]};`;
  }
  const charIds = getSortedCharacterIds(prompt_data);
  for (const i of charIds) {
    const promptKey = `Character ${i} Prompt`;
    const ucKey = `Character ${i} UC`;
    const centersKey = `Character ${i} centers`;
    if (prompt_data[promptKey]) {
      result += ` ${promptKey}: ${prompt_data[promptKey]}`;
      if (prompt_data[centersKey]) {
        result += `|centers:${prompt_data[centersKey]}`;
      }
      result += ";";
    }
    if (prompt_data[ucKey]) {
      result += ` ${ucKey}: ${prompt_data[ucKey]};`;
    }
  }
  result = result.replace(/\r?\n/g, ", ");
  const finalResult = result.trim();
  console.log("[CharacterPrompt] \u91CD\u7EC4\u540E\u7684 prompt:", finalResult);
  return finalResult;
}

export { inspectCharacterPromptTrigger, inspectCharacterPromptTriggers, processCharacterPrompt };
