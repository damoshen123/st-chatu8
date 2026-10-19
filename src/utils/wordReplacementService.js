// 还原自打包产物 — 原始模块: utils/wordReplacementService.js
import { extension_settings } from "../../../../../extensions.js";
import { extensionName } from "./config.js";
import { applyWordReplacementRules, parseWordReplacementRules, replaceTextInMessages } from "./wordReplacementCore.js";

function getCurrentReplacementRules(type) {
  const settings3 = extension_settings[extensionName];
  const profiles = settings3?.word_replacement_profiles;
  const currentProfileName = settings3?.current_word_replacement_profile;
  const profile = currentProfileName ? profiles?.[currentProfileName] : null;
  const rulesText = type === "ai" ? profile?.aiReplacement : profile?.textReplacement;
  return parseWordReplacementRules(rulesText);
}

function applyWordReplacement(text, type) {
  if (!text || typeof text !== "string") return text;
  return applyWordReplacementRules(text, getCurrentReplacementRules(type));
}

function applyReverseWordReplacement(text, type) {
  if (!text || typeof text !== "string") return text;
  const rules = getCurrentReplacementRules(type);
  const reverseRules = rules.map((rule) => ({ find: rule.replace, replace: rule.find }));
  return applyWordReplacementRules(text, reverseRules);
}

function applyWordReplacementToMessages(messages, type) {
  const rules = getCurrentReplacementRules(type);
  return replaceTextInMessages(messages, (text) => applyWordReplacementRules(text, rules));
}

export { applyReverseWordReplacement, applyWordReplacement, applyWordReplacementToMessages };
