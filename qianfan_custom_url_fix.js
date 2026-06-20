const STORE_KEY = 'st_chatu8_llm_extra_params_v2';
const ACTIVE_PROFILE_KEY = 'st_chatu8_llm_extra_params_active_profile';
const LEGACY_BODY_KEY = 'st_chatu8_llm_extra_body';
const LEGACY_HEADERS_KEY = 'st_chatu8_llm_extra_headers';
const LEGACY_THINKING_KEY = 'st_chatu8_qianfan_default_thinking_param';

function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parseJsonObject(value) {
    if (isPlainObject(value)) return value;
    if (typeof value !== 'string' || !value.trim()) return {};

    try {
        const parsed = JSON.parse(value);
        return isPlainObject(parsed) ? parsed : {};
    } catch (_) {
        return {};
    }
}

function mergeDeep(...sources) {
    const result = {};

    for (const source of sources) {
        if (!isPlainObject(source)) continue;

        for (const [key, value] of Object.entries(source)) {
            if (isPlainObject(value) && isPlainObject(result[key])) {
                result[key] = mergeDeep(result[key], value);
            } else if (isPlainObject(value)) {
                result[key] = mergeDeep(value);
            } else {
                result[key] = value;
            }
        }
    }

    return result;
}

function normalizeConfig(value) {
    const config = isPlainObject(value) ? value : {};
    return {
        body: parseJsonObject(config.body),
        headers: parseJsonObject(config.headers),
        disableThinking: config.disableThinking !== false,
    };
}

function readRootStore() {
    try {
        const parsed = JSON.parse(globalThis.localStorage?.getItem(STORE_KEY) || '{}');
        if (isPlainObject(parsed)) {
            return {
                version: 2,
                profiles: isPlainObject(parsed.profiles) ? parsed.profiles : {},
                migratedLegacy: parsed.migratedLegacy === true,
            };
        }
    } catch (_) {}

    return { version: 2, profiles: {}, migratedLegacy: false };
}

function writeRootStore(store) {
    globalThis.localStorage?.setItem(STORE_KEY, JSON.stringify(store));
}

function descriptorFromSelect() {
    const select = globalThis.document?.querySelector('#ch-llm_profile_select');
    if (!select) return null;

    const value = String(select.value || '').trim();
    const label = String(select.selectedOptions?.[0]?.textContent || value || '默认配置').trim();
    const key = value ? `value:${value}` : `label:${label || '默认配置'}`;
    return { key, label: label || value || '默认配置' };
}

function readRememberedDescriptor() {
    try {
        const parsed = JSON.parse(globalThis.localStorage?.getItem(ACTIVE_PROFILE_KEY) || '{}');
        if (isPlainObject(parsed) && typeof parsed.key === 'string' && parsed.key) {
            return {
                key: parsed.key,
                label: typeof parsed.label === 'string' && parsed.label ? parsed.label : parsed.key,
            };
        }
    } catch (_) {}

    return { key: 'default', label: '默认配置' };
}

function rememberDescriptor(descriptor) {
    try {
        globalThis.localStorage?.setItem(ACTIVE_PROFILE_KEY, JSON.stringify(descriptor));
    } catch (_) {}
}

function getProfileDescriptor() {
    const fromSelect = descriptorFromSelect();
    if (fromSelect) {
        rememberDescriptor(fromSelect);
        return fromSelect;
    }
    return readRememberedDescriptor();
}

function migrateLegacyIfNeeded(store, descriptor) {
    if (store.migratedLegacy) return store;

    const legacyBody = parseJsonObject(globalThis.localStorage?.getItem(LEGACY_BODY_KEY));
    const legacyHeaders = parseJsonObject(globalThis.localStorage?.getItem(LEGACY_HEADERS_KEY));
    const legacyThinking = globalThis.localStorage?.getItem(LEGACY_THINKING_KEY);
    const hasLegacy = Object.keys(legacyBody).length > 0
        || Object.keys(legacyHeaders).length > 0
        || legacyThinking !== null;

    if (hasLegacy && !store.profiles[descriptor.key]) {
        store.profiles[descriptor.key] = {
            body: legacyBody,
            headers: legacyHeaders,
            disableThinking: !(legacyThinking === 'false' || legacyThinking === '0' || legacyThinking === 'off'),
        };
    }

    store.migratedLegacy = true;
    writeRootStore(store);

    try {
        globalThis.localStorage?.removeItem(LEGACY_BODY_KEY);
        globalThis.localStorage?.removeItem(LEGACY_HEADERS_KEY);
        globalThis.localStorage?.removeItem(LEGACY_THINKING_KEY);
    } catch (_) {}

    return store;
}

function getCurrentConfig() {
    const descriptor = getProfileDescriptor();
    const store = migrateLegacyIfNeeded(readRootStore(), descriptor);
    return normalizeConfig(store.profiles[descriptor.key]);
}

function setCurrentConfig(config) {
    const descriptor = getProfileDescriptor();
    const store = migrateLegacyIfNeeded(readRootStore(), descriptor);
    store.profiles[descriptor.key] = normalizeConfig(config);
    writeRootStore(store);
    return normalizeConfig(store.profiles[descriptor.key]);
}

function clearCurrentConfig() {
    const descriptor = getProfileDescriptor();
    const store = migrateLegacyIfNeeded(readRootStore(), descriptor);
    delete store.profiles[descriptor.key];
    writeRootStore(store);
}

const service = {
    getProfileDescriptor,
    getCurrentConfig,
    setCurrentConfig,
    clearCurrentConfig,
    parseJsonObject,
};

globalThis.__stChatu8QianfanExtraParams = service;

function isQianfanCodingPayload(payload) {
    if (!payload || payload.chat_completion_source !== 'custom' || typeof payload.custom_url !== 'string') {
        return false;
    }

    try {
        const url = new URL(payload.custom_url.trim());
        return url.hostname.toLowerCase() === 'qianfan.baidubce.com'
            && /^\/v2\/coding(?:\/v1)?\/?$/i.test(url.pathname);
    } catch (_) {
        return /qianfan\.baidubce\.com\/v2\/coding/i.test(payload.custom_url);
    }
}

function normalizeQianfanCodingUrl(value) {
    try {
        const url = new URL(value.trim());
        if (url.hostname.toLowerCase() === 'qianfan.baidubce.com'
            && /^\/v2\/coding\/v1\/?$/i.test(url.pathname)) {
            url.pathname = '/v2/coding';
            return url.toString().replace(/\/$/, '');
        }
    } catch (_) {}

    return value;
}

if (!globalThis.__stChatu8QianfanFetchPatchInstalled) {
    globalThis.__stChatu8QianfanFetchPatchInstalled = true;
    const originalFetch = globalThis.fetch;

    if (typeof originalFetch === 'function') {
        globalThis.fetch = function patchedFetch(input, init) {
            let nextInit = init;

            try {
                if (init && typeof init.body === 'string' && init.body.includes('qianfan.baidubce.com')) {
                    const payload = JSON.parse(init.body);

                    if (isQianfanCodingPayload(payload)) {
                        const config = getCurrentConfig();
                        let changed = false;

                        const normalizedUrl = normalizeQianfanCodingUrl(payload.custom_url);
                        if (normalizedUrl !== payload.custom_url) {
                            payload.custom_url = normalizedUrl;
                            changed = true;
                        }

                        const currentBody = parseJsonObject(payload.custom_include_body);
                        const mergedBody = mergeDeep(
                            currentBody,
                            config.body,
                            config.disableThinking ? { thinking: { type: 'disabled' } } : {},
                        );
                        if (Object.keys(mergedBody).length > 0) {
                            const nextBody = JSON.stringify(mergedBody);
                            if (payload.custom_include_body !== nextBody) {
                                payload.custom_include_body = nextBody;
                                changed = true;
                            }
                        }

                        const currentHeaders = parseJsonObject(payload.custom_include_headers);
                        const mergedHeaders = mergeDeep(currentHeaders, config.headers);
                        if (Object.keys(mergedHeaders).length > 0) {
                            const nextHeaders = JSON.stringify(mergedHeaders);
                            if (payload.custom_include_headers !== nextHeaders) {
                                payload.custom_include_headers = nextHeaders;
                                changed = true;
                            }
                        }

                        if (changed) {
                            nextInit = { ...init, body: JSON.stringify(payload) };
                        }
                    }
                }
            } catch (error) {
                console.warn('[st-chatu8] 千帆附加参数处理失败，已回退原始请求：', error);
            }

            return originalFetch.call(this, input, nextInit);
        };
    }
}

try {
    await import('./index.js');
} catch (error) {
    console.error('[st-chatu8] 上游核心 index.js 加载失败：', error);
    throw error;
}

try {
    await import('./qianfan_extra_params_ui.js');
} catch (error) {
    console.error('[st-chatu8] 千帆附加参数 UI 加载失败；核心插件仍可继续使用：', error);
}
