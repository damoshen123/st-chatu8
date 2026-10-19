// 还原自打包产物 — 原始模块: utils/settings/knowledgeBase/userService.js
import { extension_settings } from "../../../../../../../extensions.js";
import { extensionName } from "../../config.js";
import { PERSONA_FIELD_LABELS } from "./personaPreset.js";

function isUserEnabled() {
  const profiles = extension_settings[extensionName]?.personaProfiles;
  if (!profiles) return false;
  return profiles.userEnabled === true && !!profiles.currentUserPresetId && !!profiles.presets?.[profiles.currentUserPresetId];
}

function getCurrentUser() {
  const profiles = extension_settings[extensionName]?.personaProfiles;
  if (!profiles || !profiles.currentUserPresetId) return null;
  return profiles.presets?.[profiles.currentUserPresetId] || null;
}

function getUserFieldValue(fieldName) {
  if (!isUserEnabled()) return "";
  const user = getCurrentUser();
  if (!user) return "";
  return (user[fieldName] || "").trim();
}

function buildFieldLines2(data, fields) {
  const lines = [];
  for (const field of fields) {
    const value = (data[field] || "").trim();
    if (!value) continue;
    const label = PERSONA_FIELD_LABELS[field] || field;
    lines.push(`${label}: ${value}`);
  }
  return lines;
}

function buildUserPromptContent() {
  if (!isUserEnabled()) return "";
  const user = getCurrentUser();
  if (!user) return "";
  const sections = [];
  const basicFields = ["name", "age", "gender", "race"];
  const basicLines = buildFieldLines2(user, basicFields);
  if (basicLines.length > 0) {
    sections.push(`<\u57FA\u7840\u4FE1\u606F>
${basicLines.join("\n")}
</\u57FA\u7840\u4FE1\u606F>`);
  }
  const appearanceFields = ["bodyType", "appearance"];
  const appearanceLines = buildFieldLines2(user, appearanceFields);
  if (appearanceLines.length > 0) {
    sections.push(`<\u5916\u8C8C\u4E0E\u8EAB\u6750>
${appearanceLines.join("\n")}
</\u5916\u8C8C\u4E0E\u8EAB\u6750>`);
  }
  const personalityFields = ["personality", "abilities", "speechStyle"];
  const personalityLines = buildFieldLines2(user, personalityFields);
  if (personalityLines.length > 0) {
    sections.push(`<\u6027\u683C\u4E0E\u80FD\u529B>
${personalityLines.join("\n")}
</\u6027\u683C\u4E0E\u80FD\u529B>`);
  }
  const bgFields = ["background", "hobbies", "relationships"];
  const bgLines = buildFieldLines2(user, bgFields);
  if (bgLines.length > 0) {
    sections.push(`<\u80CC\u666F\u6545\u4E8B>
${bgLines.join("\n")}
</\u80CC\u666F\u6545\u4E8B>`);
  }
  const isekaiFields = ["isekai_origin", "isekai_method", "isekai_reaction", "isekai_goal"];
  const isekaiLines = buildFieldLines2(user, isekaiFields);
  if (isekaiLines.length > 0) {
    sections.push(`<\u7A7F\u8D8A\u8BA4\u77E5>
${isekaiLines.join("\n")}
</\u7A7F\u8D8A\u8BA4\u77E5>`);
  }
  const notesValue = (user.notes || "").trim();
  if (notesValue) {
    sections.push(`<\u8865\u5145\u4FE1\u606F>
${notesValue}
</\u8865\u5145\u4FE1\u606F>`);
  }
  if (sections.length === 0) return "";
  return sections.join("\n\n");
}

export { buildUserPromptContent, getUserFieldValue };
