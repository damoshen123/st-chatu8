/**
 * Baidu Qianfan Coding Plan compatibility shim.
 *
 * st-chatu8's LLM request path is OpenAI-compatible by default and may append
 * `/v1` for every custom endpoint. Baidu Qianfan Coding Plan endpoints should
 * not receive that extra `/v1`, so this file installs a narrow fetch-level
 * normalizer before the original extension entry is loaded.
 */
(function installQianfanCodingPlanV1Fix() {
    if (globalThis.__stChatu8QianfanCodingPlanV1FixInstalled) {
        return;
    }

    const nativeFetch = globalThis.fetch;
    if (typeof nativeFetch !== 'function') {
        return;
    }

    const QIANFAN_HOST_RE = /(qianfan|baidubce|baidu)/i;
    const CODING_PLAN_RE = /(coding[\s_-]*plan|coding[-_/]?plan|code[-_/]?plan|ai[-_/]?code|coder|代码|编程)/i;

    function getRequestUrl(input) {
        if (typeof input === 'string') {
            return input;
        }
        if (typeof URL !== 'undefined' && input instanceof URL) {
            return input.href;
        }
        if (input && typeof input.url === 'string') {
            return input.url;
        }
        return '';
    }

    async function getRequestBodyText(input, init) {
        if (init && typeof init.body === 'string') {
            return init.body;
        }
        if (typeof URLSearchParams !== 'undefined' && init && init.body instanceof URLSearchParams) {
            return init.body.toString();
        }
        if (typeof Request !== 'undefined' && input instanceof Request) {
            try {
                return await input.clone().text();
            } catch (_) {
                return '';
            }
        }
        return '';
    }

    function isQianfanRequest(rawUrl) {
        try {
            const url = new URL(rawUrl, globalThis.location?.href || undefined);
            return QIANFAN_HOST_RE.test(url.hostname) || QIANFAN_HOST_RE.test(url.href);
        } catch (_) {
            return QIANFAN_HOST_RE.test(rawUrl || '');
        }
    }

    function removeAutoAddedV1(rawUrl) {
        try {
            const url = new URL(rawUrl, globalThis.location?.href || undefined);
            const originalPathname = url.pathname;
            url.pathname = originalPathname.replace(/\/v1(?=\/|$)/, '');
            return url.pathname === originalPathname ? rawUrl : url.toString();
        } catch (_) {
            return String(rawUrl).replace(/\/v1(?=\/|$)/, '');
        }
    }

    function rebuildInputWithUrl(input, fixedUrl) {
        if (typeof input === 'string') {
            return fixedUrl;
        }
        if (typeof URL !== 'undefined' && input instanceof URL) {
            return new URL(fixedUrl);
        }
        if (typeof Request !== 'undefined' && input instanceof Request) {
            return new Request(fixedUrl, input);
        }
        return fixedUrl;
    }

    async function patchedFetch(input, init) {
        const rawUrl = getRequestUrl(input);

        if (rawUrl && /\/v1(?=\/|$)/.test(rawUrl) && isQianfanRequest(rawUrl)) {
            const bodyText = await getRequestBodyText(input, init);
            const detectionText = `${rawUrl}\n${bodyText}`;

            if (CODING_PLAN_RE.test(detectionText)) {
                const fixedUrl = removeAutoAddedV1(rawUrl);
                if (fixedUrl !== rawUrl) {
                    input = rebuildInputWithUrl(input, fixedUrl);
                    if (globalThis.console?.debug) {
                        console.debug('[st-chatu8] Qianfan Coding Plan URL normalized:', rawUrl, '=>', fixedUrl);
                    }
                }
            }
        }

        return nativeFetch.call(this, input, init);
    }

    patchedFetch.__stChatu8QianfanCodingPlanFix = true;
    globalThis.fetch = patchedFetch;
    globalThis.__stChatu8QianfanCodingPlanV1FixInstalled = true;
})();

await import('./index.js');
