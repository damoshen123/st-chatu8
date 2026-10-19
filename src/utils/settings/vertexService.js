// 还原自打包产物 — 原始模块: utils/settings/vertexService.js
var tokenCache;

tokenCache = /* @__PURE__ */ new Map();

function cleanPrivateKey(rawKey) {
  if (!rawKey || typeof rawKey !== "string") return "";
  let pk = rawKey.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  pk = pk.replace(/\\n/g, "\n");
  return pk.trim();
}

function pemToArrayBuffer(pem) {
  const cleaned = cleanPrivateKey(pem);
  const isPKCS1 = cleaned.includes("RSA PRIVATE KEY");
  const base64 = cleaned.replace(/-----BEGIN [A-Z ]+-----/g, "").replace(/-----END [A-Z ]+-----/g, "").replace(/\s+/g, "");
  const binaryDerString = atob(base64);
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }
  if (!isPKCS1) {
    return binaryDer.buffer;
  }
  const pkcs1Length = binaryDer.length;
  const prefix = [
    48,
    130,
    0,
    0,
    // Sequence (length will be patched)
    2,
    1,
    0,
    // Integer 0
    48,
    13,
    // Sequence (13 bytes)
    6,
    9,
    42,
    134,
    72,
    134,
    247,
    13,
    1,
    1,
    1,
    // 1.2.840.113549.1.1.1
    5,
    0,
    // NULL
    4,
    130,
    0,
    0
    // Octet string (length will be patched)
  ];
  const totalLen = pkcs1Length + 22;
  prefix[2] = totalLen >> 8 & 255;
  prefix[3] = totalLen & 255;
  prefix[20] = pkcs1Length >> 8 & 255;
  prefix[21] = pkcs1Length & 255;
  const pkcs8Der = new Uint8Array(prefix.length + pkcs1Length);
  pkcs8Der.set(prefix, 0);
  pkcs8Der.set(binaryDer, prefix.length);
  return pkcs8Der.buffer;
}

function base64UrlEncode(input) {
  let str;
  if (typeof input === "string") {
    str = btoa(unescape(encodeURIComponent(input)));
  } else {
    const bytes = new Uint8Array(input);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    str = btoa(binary);
  }
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function createSignedJWT(credentials) {
  const { client_email, private_key } = credentials;
  if (!client_email || !private_key) {
    throw new Error("Vertex \u51ED\u636E\u7F3A\u5C11 client_email \u6216 private_key");
  }
  const now = Math.floor(Date.now() / 1e3);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: client_email,
    sub: client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/cloud-platform"
  };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const derBuffer = pemToArrayBuffer(private_key);
  const cryptoKey = await window.crypto.subtle.importKey(
    "pkcs8",
    derBuffer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256"
    },
    false,
    ["sign"]
  );
  const encoder = new TextEncoder();
  const signatureBuffer = await window.crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(signingInput)
  );
  const encodedSignature = base64UrlEncode(signatureBuffer);
  return `${signingInput}.${encodedSignature}`;
}

async function getVertexAccessToken(credentials, bypassProxy = false) {
  if (!credentials || !credentials.client_email) {
    throw new Error("\u672A\u914D\u7F6E\u6709\u6548\u7684 Vertex Service Account \u51ED\u636E");
  }
  const email = credentials.client_email;
  const now = Math.floor(Date.now() / 1e3);
  const cached = tokenCache.get(email);
  if (cached && cached.expiresAt > now + 120) {
    return cached.accessToken;
  }
  const jwt = await createSignedJWT(credentials);
  const tokenUrl = "https://oauth2.googleapis.com/token";
  const postBody = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${encodeURIComponent(jwt)}`;
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: postBody
  });
  if (!response.ok) {
    let errText = "";
    try {
      errText = await response.text();
    } catch (_e) {
    }
    throw new Error(`Google OAuth2 Token \u4EA4\u6362\u5931\u8D25 (${response.status}): ${errText}`);
  }
  const data = await response.json();
  const accessToken = data.access_token;
  const expiresIn = data.expires_in || 3600;
  tokenCache.set(email, {
    accessToken,
    expiresAt: now + expiresIn
  });
  return accessToken;
}

function buildVertexEndpoint(location2, projectId, model, isStream = false) {
  const loc = (location2 || "us-central1").trim();
  const cleanModel = (model || "gemini-2.5-flash").trim();
  const baseURL = loc === "global" ? "https://aiplatform.googleapis.com" : `https://${loc}-aiplatform.googleapis.com`;
  const action = isStream ? "streamGenerateContent?alt=sse" : "generateContent";
  return `${baseURL}/v1/projects/${projectId}/locations/${loc}/publishers/google/models/${cleanModel}:${action}`;
}

function convertOpenAIToVertexGemini(openAiBody) {
  const geminiPayload = {
    contents: []
  };
  const genConfig = {};
  if (openAiBody.temperature !== void 0 && openAiBody.temperature !== null) {
    genConfig.temperature = openAiBody.temperature;
  }
  if (openAiBody.top_p !== void 0 && openAiBody.top_p !== null) {
    genConfig.topP = openAiBody.top_p;
  }
  if (openAiBody.max_tokens !== void 0 && openAiBody.max_tokens !== null) {
    genConfig.maxOutputTokens = openAiBody.max_tokens;
  }
  if (Object.keys(genConfig).length > 0) {
    geminiPayload.generationConfig = genConfig;
  }
  const messages = Array.isArray(openAiBody.messages) ? openAiBody.messages : [];
  const systemParts = [];
  const contents = [];
  for (const msg of messages) {
    const role = msg.role;
    const content = msg.content;
    if (role === "system" || role === "developer") {
      if (typeof content === "string" && content.trim() !== "") {
        systemParts.push(content.trim());
      }
      continue;
    }
    let geminiRole = role === "assistant" || role === "model" ? "model" : "user";
    const parts = [];
    if (typeof content === "string" && content !== "") {
      parts.push({ text: content });
    } else if (Array.isArray(content)) {
      for (const item of content) {
        if (item.type === "text" && item.text) {
          parts.push({ text: item.text });
        } else if (item.type === "image_url" && item.image_url?.url) {
          const url = item.image_url.url;
          if (url.startsWith("data:")) {
            const commaIdx = url.indexOf(",");
            if (commaIdx > 0) {
              const header = url.slice(5, commaIdx);
              const mime = header.split(";")[0] || "image/png";
              const b64Data = url.slice(commaIdx + 1);
              parts.push({
                inlineData: {
                  mimeType: mime,
                  data: b64Data
                }
              });
            }
          }
        }
      }
    }
    if (role === "assistant" && Array.isArray(msg.tool_calls)) {
      for (const tc of msg.tool_calls) {
        const fnName = tc.function?.name || "";
        let fnArgs = {};
        try {
          fnArgs = JSON.parse(tc.function?.arguments || "{}");
        } catch (_e) {
        }
        parts.push({
          functionCall: {
            name: fnName,
            args: fnArgs
          }
        });
      }
    }
    if (role === "tool") {
      geminiRole = "user";
      let respObj = {};
      try {
        respObj = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
      } catch (_e) {
        respObj = { response: String(content) };
      }
      parts.push({
        functionResponse: {
          name: msg.name || "custom_tool",
          response: respObj
        }
      });
    }
    if (parts.length > 0) {
      contents.push({
        role: geminiRole,
        parts
      });
    }
  }
  if (contents.length > 0 && contents[0].role === "model") {
    contents.unshift({
      role: "user",
      parts: [{ text: "..." }]
    });
  }
  if (systemParts.length > 0) {
    geminiPayload.systemInstruction = {
      parts: [{ text: systemParts.join("\n\n") }]
    };
  }
  geminiPayload.contents = contents;
  if (Array.isArray(openAiBody.tools) && openAiBody.tools.length > 0) {
    const declarations = [];
    for (const t of openAiBody.tools) {
      if (t.type === "function" && t.function) {
        declarations.push({
          name: t.function.name,
          description: t.function.description || "",
          parameters: t.function.parameters
        });
      }
    }
    if (declarations.length > 0) {
      geminiPayload.tools = [{ functionDeclarations: declarations }];
    }
  }
  return geminiPayload;
}

function convertVertexToOpenAIResponse(vertexResp, model) {
  const candidate = vertexResp?.candidates?.[0];
  const parts = candidate?.content?.parts || [];
  let textContent = "";
  let reasoningContent = "";
  const toolCalls = [];
  for (const part of parts) {
    if (part.thought) {
      reasoningContent += (reasoningContent ? "\n" : "") + part.text;
    } else if (part.text) {
      textContent += part.text;
    } else if (part.functionCall) {
      toolCalls.push({
        id: `call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type: "function",
        function: {
          name: part.functionCall.name,
          arguments: JSON.stringify(part.functionCall.args || {})
        }
      });
    }
  }
  let finishReason = "stop";
  if (candidate?.finishReason === "MAX_TOKENS") finishReason = "length";
  if (candidate?.finishReason === "TOOL_CALLS" || toolCalls.length > 0) finishReason = "tool_calls";
  const message = {
    role: "assistant",
    content: textContent
  };
  if (reasoningContent) {
    message.reasoning_content = reasoningContent;
  }
  if (toolCalls.length > 0) {
    message.tool_calls = toolCalls;
  }
  return {
    id: `chatcmpl-${Date.now()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1e3),
    model,
    choices: [
      {
        index: 0,
        message,
        finish_reason: finishReason
      }
    ],
    usage: {
      prompt_tokens: vertexResp?.usageMetadata?.promptTokenCount || 0,
      completion_tokens: vertexResp?.usageMetadata?.candidatesTokenCount || 0,
      total_tokens: vertexResp?.usageMetadata?.totalTokenCount || 0
    }
  };
}

function convertVertexSSEToOpenAIChunk(jsonLine, model, respId, created) {
  try {
    const data = JSON.parse(jsonLine);
    const candidate = data?.candidates?.[0];
    if (!candidate) return null;
    const parts = candidate?.content?.parts || [];
    const delta = {};
    for (const part of parts) {
      if (part.thought) {
        delta.reasoning_content = (delta.reasoning_content || "") + part.text;
      } else if (part.text) {
        delta.content = (delta.content || "") + part.text;
      } else if (part.functionCall) {
        delta.tool_calls = [
          {
            index: 0,
            id: `call_${Date.now()}`,
            type: "function",
            function: {
              name: part.functionCall.name,
              arguments: JSON.stringify(part.functionCall.args || {})
            }
          }
        ];
      }
    }
    let finishReason = null;
    if (candidate?.finishReason) {
      finishReason = candidate.finishReason === "MAX_TOKENS" ? "length" : "stop";
    }
    return {
      id: respId,
      object: "chat.completion.chunk",
      created,
      model,
      choices: [
        {
          index: 0,
          delta,
          finish_reason: finishReason
        }
      ]
    };
  } catch (_e) {
    return null;
  }
}

export { buildVertexEndpoint, convertOpenAIToVertexGemini, convertVertexSSEToOpenAIChunk, convertVertexToOpenAIResponse, getVertexAccessToken };
