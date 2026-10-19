// 还原自打包产物 — 原始模块: utils/settings/knowledgeBase/personaService.js
import { extension_settings } from "../../../../../../../extensions.js";
import { extensionName } from "../../config.js";
import { PERSONA_FIELD_LABELS } from "./personaPreset.js";

function isPersonaEnabled() {
  const profiles = extension_settings[extensionName]?.personaProfiles;
  if (!profiles) return false;
  return profiles.enabled === true && !!profiles.currentPresetId && !!profiles.presets?.[profiles.currentPresetId];
}

function getCurrentPersona() {
  const profiles = extension_settings[extensionName]?.personaProfiles;
  if (!profiles || !profiles.currentPresetId) return null;
  return profiles.presets?.[profiles.currentPresetId] || null;
}

function buildFieldLines(persona, fields) {
  const lines = [];
  for (const field of fields) {
    const value = (persona[field] || "").trim();
    if (!value) continue;
    const label = PERSONA_FIELD_LABELS[field] || field;
    lines.push(`${label}: ${value}`);
  }
  return lines;
}

function getPersonaFieldValue(fieldName) {
  if (!isPersonaEnabled()) return "";
  const persona = getCurrentPersona();
  if (!persona) return "";
  return (persona[fieldName] || "").trim();
}

function buildPersonaPromptContent() {
  if (!isPersonaEnabled()) return "";
  const persona = getCurrentPersona();
  if (!persona) return "";
  const sections = [];
  const basicFields = ["name", "age", "gender", "race"];
  const basicLines = buildFieldLines(persona, basicFields);
  if (basicLines.length > 0) {
    sections.push(`<\u57FA\u7840\u4FE1\u606F>
${basicLines.join("\n")}
</\u57FA\u7840\u4FE1\u606F>`);
  }
  const appearanceFields = ["bodyType", "appearance"];
  const appearanceLines = buildFieldLines(persona, appearanceFields);
  if (appearanceLines.length > 0) {
    sections.push(`<\u5916\u8C8C\u4E0E\u8EAB\u6750>
${appearanceLines.join("\n")}
</\u5916\u8C8C\u4E0E\u8EAB\u6750>`);
  }
  const personalityFields = ["personality", "abilities", "speechStyle"];
  const personalityLines = buildFieldLines(persona, personalityFields);
  if (personalityLines.length > 0) {
    sections.push(`<\u6027\u683C\u4E0E\u80FD\u529B>
${personalityLines.join("\n")}
</\u6027\u683C\u4E0E\u80FD\u529B>`);
  }
  const bgFields = ["background", "hobbies", "relationships"];
  const bgLines = buildFieldLines(persona, bgFields);
  if (bgLines.length > 0) {
    sections.push(`<\u80CC\u666F\u6545\u4E8B>
${bgLines.join("\n")}
</\u80CC\u666F\u6545\u4E8B>`);
  }
  const isekaiFields = ["isekai_origin", "isekai_method", "isekai_reaction", "isekai_goal"];
  const isekaiLines = buildFieldLines(persona, isekaiFields);
  if (isekaiLines.length > 0) {
    sections.push(`<\u7A7F\u8D8A\u8BA4\u77E5>
${isekaiLines.join("\n")}
</\u7A7F\u8D8A\u8BA4\u77E5>`);
  }
  const notesValue = (persona.notes || "").trim();
  if (notesValue) {
    sections.push(`<\u8865\u5145\u4FE1\u606F>
${notesValue}
</\u8865\u5145\u4FE1\u606F>`);
  }
  if (sections.length === 0) return "";
  return sections.join("\n\n");
}

export { buildPersonaPromptContent, getPersonaFieldValue };
