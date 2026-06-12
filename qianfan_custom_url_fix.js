(function () {
    if (globalThis.__stChatu8QianfanCodingUrlFix) return;
    globalThis.__stChatu8QianfanCodingUrlFix = true;

    const original = globalThis.fetch;
    const badPattern = /^https:\/\/qianfan\.baidubce\.com\/v2\/coding\/v1\/?$/i;
    const target = 'https://qianfan.baidubce.com/v2/coding';

    const defaultExtraBody = {
        thinking: { type: 'disabled' },
    };

    const extraBodyStorageKeys = [
        'st_chatu8_llm_extra_body',
        'stChatu8LlmExtraBody',
        'stChatu8QianfanExtraBody',
    ];

    const extraHeaderStorageKeys = [
        'st_chatu8_llm_extra_headers',
        'stChatu8LlmExtraHeaders',
        'stChatu8QianfanExtraHeaders',
    ];

    function isPlainObject(value) {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    }

    function parseObject(value) {
        if (isPlainObject(value)) return value;
        if (typeof value !== 'string') return {};

        const trimmed = value.trim();
        if (!trimmed) return {};

        try {
            const parsed = JSON.parse(trimmed);
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

    function isEmptyObject(value) {
        return !isPlainObject(value) || Object.keys(value).length === 0;
    }

    function readStorageObject(keys) {
        let merged = {};

        try {
            for (const key of keys) {
                const parsed = parseObject(globalThis.localStorage?.getItem(key));
                merged = mergeDeep(merged, parsed);
            }
        } catch (_) {}

        return merged;
    }

    function readGlobalObject(name) {
        try {
            return parseObject(globalThis[name]);
        } catch (_) {
            return {};
        }
    }

    function shouldUseDefaultThinkingParam() {
        try {
            const flag = globalThis.localStorage?.getItem('st_chatu8_qianfan_default_thinking_param');
            if (flag === 'false' || flag === '0' || flag === 'off') return false;
        } catch (_) {}
        return globalThis.__stChatu8QianfanDefaultThinkingParam !== false;
    }

    function normalizeJsonObjectField(payload, fieldName, ...extraObjects) {
        const current = parseObject(payload[fieldName]);
        const merged = mergeDeep(...extraObjects, current);

        if (!isEmptyObject(merged)) {
            payload[fieldName] = JSON.stringify(merged);
            return true;
        }

        return false;
    }

    function isQianfanCodingPayload(payload) {
        return payload
            && payload.chat_completion_source === 'custom'
            && typeof payload.custom_url === 'string'
            && /qianfan\.baidubce\.com\/v2\/coding/i.test(payload.custom_url.trim());
    }

    globalThis.fetch = function (input, init) {
        try {
            if (init && typeof init.body === 'string' && init.body.indexOf('qianfan.baidubce.com') !== -1) {
                const payload = JSON.parse(init.body);

                if (isQianfanCodingPayload(payload)) {
                    let changed = false;

                    if (badPattern.test(payload.custom_url.trim())) {
                        payload.custom_url = target;
                        changed = true;
                    }

                    const configuredExtraBody = mergeDeep(
                        readStorageObject(extraBodyStorageKeys),
                        readGlobalObject('__stChatu8LlmExtraBody'),
                        readGlobalObject('__stChatu8QianfanExtraBody'),
                    );
                    const bodyDefaults = shouldUseDefaultThinkingParam() ? defaultExtraBody : {};
                    changed = normalizeJsonObjectField(payload, 'custom_include_body', bodyDefaults, configuredExtraBody) || changed;

                    const configuredExtraHeaders = mergeDeep(
                        readStorageObject(extraHeaderStorageKeys),
                        readGlobalObject('__stChatu8LlmExtraHeaders'),
                        readGlobalObject('__stChatu8QianfanExtraHeaders'),
                    );
                    changed = normalizeJsonObjectField(payload, 'custom_include_headers', configuredExtraHeaders) || changed;

                    if (changed) {
                        init = { ...init, body: JSON.stringify(payload) };
                    }
                }
            }
        } catch (_) {}
        return original.call(this, input, init);
    };
})();

await import('./qianfan_extra_params_ui.js');
await import('./index.js');
