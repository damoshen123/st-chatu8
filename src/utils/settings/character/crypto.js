// 还原自打包产物 — 原始模块: utils/settings/character/crypto.js
import { stylishConfirm } from "../../ui_common.js";

function encryptBase64(text) {
  if (!text) return "";
  try {
    return btoa(unescape(encodeURIComponent(text)));
  } catch (e) {
    console.error("Base64 \u52A0\u5BC6\u5931\u8D25:", e);
    return text;
  }
}

function decryptBase64(encodedText) {
  if (!encodedText) return "";
  try {
    return decodeURIComponent(escape(atob(encodedText)));
  } catch (e) {
    console.error("Base64 \u89E3\u5BC6\u5931\u8D25:", e);
    return encodedText;
  }
}

function encryptObjectFields(obj, fields) {
  const encrypted = JSON.parse(JSON.stringify(obj));
  fields.forEach((field) => {
    if (encrypted[field]) {
      encrypted[field] = encryptBase64(encrypted[field]);
    }
  });
  return encrypted;
}

function decryptObjectFields(obj, fields) {
  const decrypted = JSON.parse(JSON.stringify(obj));
  fields.forEach((field) => {
    if (decrypted[field]) {
      decrypted[field] = decryptBase64(decrypted[field]);
    }
  });
  return decrypted;
}

function encryptCharacterPreset(preset) {
  const fields = [
    "nameCN",
    "nameEN",
    "facialFeatures",
    "facialFeaturesBack",
    "upperBodySFW",
    "upperBodySFWBack",
    "fullBodySFW",
    "fullBodySFWBack",
    "upperBodyNSFW",
    "upperBodyNSFWBack",
    "fullBodyNSFW",
    "fullBodyNSFWBack"
  ];
  const encrypted = encryptObjectFields(preset, fields);
  if (preset.outfits && Array.isArray(preset.outfits)) {
    encrypted.outfits = preset.outfits.map((name) => encryptBase64(name));
  }
  return encrypted;
}

function decryptCharacterPreset(preset) {
  const fields = [
    "nameCN",
    "nameEN",
    "facialFeatures",
    "facialFeaturesBack",
    "upperBodySFW",
    "upperBodySFWBack",
    "fullBodySFW",
    "fullBodySFWBack",
    "upperBodyNSFW",
    "upperBodyNSFWBack",
    "fullBodyNSFW",
    "fullBodyNSFWBack"
  ];
  const decrypted = decryptObjectFields(preset, fields);
  if (preset.outfits && Array.isArray(preset.outfits)) {
    decrypted.outfits = preset.outfits.map((name) => decryptBase64(name));
  }
  return decrypted;
}

function encryptOutfitPreset(preset) {
  const fields = ["nameCN", "nameEN", "upperBody", "upperBodyBack", "fullBody", "fullBodyBack"];
  return encryptObjectFields(preset, fields);
}

function decryptOutfitPreset(preset) {
  const fields = ["nameCN", "nameEN", "upperBody", "upperBodyBack", "fullBody", "fullBodyBack"];
  return decryptObjectFields(preset, fields);
}

function encryptListPreset(preset, listKey) {
  const encrypted = JSON.parse(JSON.stringify(preset));
  if (preset[listKey] && Array.isArray(preset[listKey])) {
    encrypted[listKey] = preset[listKey].map((entry) => {
      if (typeof entry === "string") return encryptBase64(entry);
      if (entry && typeof entry === "object") {
        return {
          ...entry,
          characterPresetName: entry.characterPresetName ? encryptBase64(entry.characterPresetName) : entry.characterPresetName
        };
      }
      return entry;
    });
  }
  return encrypted;
}

function decryptListPreset(preset, listKey) {
  const decrypted = JSON.parse(JSON.stringify(preset));
  if (preset[listKey] && Array.isArray(preset[listKey])) {
    decrypted[listKey] = preset[listKey].map((entry) => {
      if (typeof entry === "string") return decryptBase64(entry);
      if (entry && typeof entry === "object") {
        return {
          ...entry,
          characterPresetName: entry.characterPresetName ? decryptBase64(entry.characterPresetName) : entry.characterPresetName
        };
      }
      return entry;
    });
  }
  return decrypted;
}

function isEncryptedData(data) {
  return data && data._encrypted === true;
}

function encryptPresetNames(presets, prefix) {
  const nameMap = {};
  const encryptedPresets = {};
  let counter = 1;
  for (const name in presets) {
    const encId = `${prefix}${String(counter).padStart(3, "0")}`;
    nameMap[encId] = name;
    encryptedPresets[encId] = presets[name];
    counter++;
  }
  return { encryptedPresets, nameMap };
}

async function encryptExportData(dataToExport) {
  const shouldEncrypt = await stylishConfirm("\u662F\u5426\u5BF9\u5BFC\u51FA\u5185\u5BB9\u8FDB\u884C Base64 \u52A0\u5BC6\u4FDD\u62A4?\n\n\u52A0\u5BC6\u540E\u53EF\u9632\u6B62\u6587\u672C\u7F16\u8F91\u5668\u76F4\u63A5\u67E5\u770B\u654F\u611F\u5185\u5BB9\u3002");
  if (shouldEncrypt) {
    const allNameMaps = {};
    const charForwardMap = {};
    const outfitForwardMap = {};
    if (dataToExport.characters) {
      const { encryptedPresets: encChars, nameMap: charMap } = encryptPresetNames(dataToExport.characters, "CHAR_");
      allNameMaps.characters = charMap;
      for (const encId in charMap) {
        charForwardMap[charMap[encId]] = encId;
      }
    }
    if (dataToExport.outfits) {
      const { encryptedPresets: encOutfits, nameMap: outfitMap } = encryptPresetNames(dataToExport.outfits, "OUTFIT_");
      allNameMaps.outfits = outfitMap;
      for (const encId in outfitMap) {
        outfitForwardMap[outfitMap[encId]] = encId;
      }
    }
    if (dataToExport.characters) {
      const { encryptedPresets: encChars, nameMap: charMap } = encryptPresetNames(dataToExport.characters, "CHAR_");
      const encryptedCharacters = {};
      for (const encId in encChars) {
        const charPreset = encChars[encId];
        let encrypted = encryptCharacterPreset(charPreset);
        if (encrypted.outfits && encrypted.outfits.length > 0) {
          encrypted.outfits = encrypted.outfits.map((name) => {
            const decrypted = decryptBase64(name);
            const encryptedId = outfitForwardMap[decrypted] || decrypted;
            return encryptBase64(encryptedId);
          });
        }
        encryptedCharacters[encId] = encrypted;
      }
      dataToExport.characters = encryptedCharacters;
    }
    if (dataToExport.outfits) {
      const { encryptedPresets: encOutfits } = encryptPresetNames(dataToExport.outfits, "OUTFIT_");
      const encryptedOutfits = {};
      for (const encId in encOutfits) {
        encryptedOutfits[encId] = encryptOutfitPreset(encOutfits[encId]);
      }
      dataToExport.outfits = encryptedOutfits;
    }
    if (dataToExport.characterEnablePresets) {
      const { encryptedPresets: encPresets, nameMap: presetMap } = encryptPresetNames(dataToExport.characterEnablePresets, "CHAR_EN_");
      allNameMaps.characterEnablePresets = presetMap;
      const encryptedPresets = {};
      for (const encId in encPresets) {
        const preset = encPresets[encId];
        let encrypted = encryptListPreset(preset, "characters");
        if (encrypted.characters) {
          encrypted.characters = encrypted.characters.map((entry) => {
            if (typeof entry === "string") {
              const decrypted = decryptBase64(entry);
              return encryptBase64(charForwardMap[decrypted] || decrypted);
            }
            if (entry && typeof entry === "object") {
              const decrypted = decryptBase64(entry.characterPresetName || "");
              return {
                ...entry,
                characterPresetName: encryptBase64(charForwardMap[decrypted] || decrypted)
              };
            }
            return entry;
          });
        }
        encryptedPresets[encId] = encrypted;
      }
      dataToExport.characterEnablePresets = encryptedPresets;
    }
    if (dataToExport.outfitEnablePresets) {
      const { encryptedPresets: encPresets, nameMap: presetMap } = encryptPresetNames(dataToExport.outfitEnablePresets, "OUTFIT_EN_");
      allNameMaps.outfitEnablePresets = presetMap;
      const encryptedPresets = {};
      for (const encId in encPresets) {
        const preset = encPresets[encId];
        let encrypted = encryptListPreset(preset, "outfits");
        if (encrypted.outfits) {
          encrypted.outfits = encrypted.outfits.map((name) => {
            const decrypted = decryptBase64(name);
            return encryptBase64(outfitForwardMap[decrypted] || decrypted);
          });
        }
        encryptedPresets[encId] = encrypted;
      }
      dataToExport.outfitEnablePresets = encryptedPresets;
    }
    if (dataToExport.characterCommonPresets) {
      const { encryptedPresets: encPresets, nameMap: presetMap } = encryptPresetNames(dataToExport.characterCommonPresets, "CHAR_COM_");
      allNameMaps.characterCommonPresets = presetMap;
      const encryptedPresets = {};
      for (const encId in encPresets) {
        const preset = encPresets[encId];
        let encrypted = encryptListPreset(preset, "characters");
        if (encrypted.characters) {
          encrypted.characters = encrypted.characters.map((entry) => {
            if (typeof entry === "string") {
              const decrypted = decryptBase64(entry);
              return encryptBase64(charForwardMap[decrypted] || decrypted);
            }
            if (entry && typeof entry === "object") {
              const decrypted = decryptBase64(entry.characterPresetName || "");
              return {
                ...entry,
                characterPresetName: encryptBase64(charForwardMap[decrypted] || decrypted)
              };
            }
            return entry;
          });
        }
        encryptedPresets[encId] = encrypted;
      }
      dataToExport.characterCommonPresets = encryptedPresets;
    }
    dataToExport._nameMap = encryptBase64(JSON.stringify(allNameMaps));
    dataToExport._encrypted = true;
    dataToExport._version = "1.0";
  }
  return dataToExport;
}

function decryptImportData(importedData) {
  if (!isEncryptedData(importedData)) {
    console.log("[Character] \u5BFC\u5165\u6570\u636E\u672A\u52A0\u5BC6,\u76F4\u63A5\u8FD4\u56DE");
    return importedData;
  }
  console.log("[Character] \u68C0\u6D4B\u5230\u52A0\u5BC6\u6570\u636E,\u5F00\u59CB\u89E3\u5BC6...");
  const decryptedData = JSON.parse(JSON.stringify(importedData));
  let allNameMaps = {};
  if (decryptedData._nameMap) {
    try {
      allNameMaps = JSON.parse(decryptBase64(decryptedData._nameMap));
      console.log("[Character] \u540D\u79F0\u6620\u5C04\u8868\u89E3\u5BC6\u6210\u529F");
    } catch (e) {
      console.error("[Character] \u540D\u79F0\u6620\u5C04\u8868\u89E3\u5BC6\u5931\u8D25:", e);
    }
  }
  const charReverseMap = {};
  const outfitReverseMap = {};
  if (allNameMaps.characters) {
    for (const encId in allNameMaps.characters) {
      charReverseMap[encId] = allNameMaps.characters[encId];
    }
  }
  if (allNameMaps.outfits) {
    for (const encId in allNameMaps.outfits) {
      outfitReverseMap[encId] = allNameMaps.outfits[encId];
    }
  }
  if (decryptedData.characters) {
    const decryptedCharacters = {};
    for (const charKey in decryptedData.characters) {
      const originalName = allNameMaps.characters ? allNameMaps.characters[charKey] : charKey;
      let charPreset = decryptCharacterPreset(decryptedData.characters[charKey]);
      if (charPreset.outfits && charPreset.outfits.length > 0) {
        charPreset.outfits = charPreset.outfits.map((name) => outfitReverseMap[name] || name);
      }
      decryptedCharacters[originalName] = charPreset;
    }
    decryptedData.characters = decryptedCharacters;
  }
  if (decryptedData.outfits) {
    const decryptedOutfits = {};
    for (const outfitKey in decryptedData.outfits) {
      const originalName = allNameMaps.outfits ? allNameMaps.outfits[outfitKey] : outfitKey;
      decryptedOutfits[originalName] = decryptOutfitPreset(decryptedData.outfits[outfitKey]);
    }
    decryptedData.outfits = decryptedOutfits;
  }
  if (decryptedData.characterEnablePresets) {
    const decryptedPresets = {};
    for (const presetKey in decryptedData.characterEnablePresets) {
      const originalName = allNameMaps.characterEnablePresets ? allNameMaps.characterEnablePresets[presetKey] : presetKey;
      let preset = decryptListPreset(decryptedData.characterEnablePresets[presetKey], "characters");
      if (preset.characters) {
        preset.characters = preset.characters.map((entry) => {
          if (typeof entry === "string") return charReverseMap[entry] || entry;
          if (entry && typeof entry === "object") {
            return {
              ...entry,
              characterPresetName: charReverseMap[entry.characterPresetName] || entry.characterPresetName
            };
          }
          return entry;
        });
      }
      decryptedPresets[originalName] = preset;
    }
    decryptedData.characterEnablePresets = decryptedPresets;
  }
  if (decryptedData.outfitEnablePresets) {
    const decryptedPresets = {};
    for (const presetKey in decryptedData.outfitEnablePresets) {
      const originalName = allNameMaps.outfitEnablePresets ? allNameMaps.outfitEnablePresets[presetKey] : presetKey;
      let preset = decryptListPreset(decryptedData.outfitEnablePresets[presetKey], "outfits");
      if (preset.outfits) {
        preset.outfits = preset.outfits.map((name) => outfitReverseMap[name] || name);
      }
      decryptedPresets[originalName] = preset;
    }
    decryptedData.outfitEnablePresets = decryptedPresets;
  }
  if (decryptedData.characterCommonPresets) {
    const decryptedPresets = {};
    for (const presetKey in decryptedData.characterCommonPresets) {
      const originalName = allNameMaps.characterCommonPresets ? allNameMaps.characterCommonPresets[presetKey] : presetKey;
      let preset = decryptListPreset(decryptedData.characterCommonPresets[presetKey], "characters");
      if (preset.characters) {
        preset.characters = preset.characters.map((entry) => {
          if (typeof entry === "string") return charReverseMap[entry] || entry;
          if (entry && typeof entry === "object") {
            return {
              ...entry,
              characterPresetName: charReverseMap[entry.characterPresetName] || entry.characterPresetName
            };
          }
          return entry;
        });
      }
      decryptedPresets[originalName] = preset;
    }
    decryptedData.characterCommonPresets = decryptedPresets;
  }
  delete decryptedData._encrypted;
  delete decryptedData._version;
  delete decryptedData._nameMap;
  console.log("[Character] \u6570\u636E\u89E3\u5BC6\u5B8C\u6210");
  return decryptedData;
}

export { decryptImportData, encryptExportData };
