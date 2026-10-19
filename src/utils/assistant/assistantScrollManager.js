// 还原自打包产物 — 原始模块: utils/assistant/assistantScrollManager.js
import { getChatImagesBatch } from "../configDatabase.js";
import { activeChat, dom } from "./assistantContext.js";

var _nativeScrollHandler, scrollState;

scrollState = {
      totalMessages: 0,
      // 总消息数
      renderedStart: 0,
      // 已渲染的起始索引
      renderedEnd: 0,
      // 已渲染的结束索引
      pageSize: 100,
      // 每页消息数
      isLoading: false,
      // 是否正在加载
      hasMore: true,
      // 是否还有更多消息
      scrollLocked: false,
      // 滚动位置锁定（加载时使用）
      unreadCount: 0
      // 未读消息数（用户不在底部时）
    };

_nativeScrollHandler = null;

function updateScrollStateAfterEdit(newTotal) {
  scrollState.totalMessages = newTotal;
  if (scrollState.renderedEnd > newTotal) {
    scrollState.renderedEnd = newTotal;
  }
  if (scrollState.renderedStart >= newTotal) {
    scrollState.renderedStart = Math.max(0, newTotal - scrollState.pageSize);
  }
  scrollState.hasMore = scrollState.renderedStart > 0;
}

function resetScrollState() {
  scrollState.totalMessages = 0;
  scrollState.renderedStart = 0;
  scrollState.renderedEnd = 0;
  scrollState.isLoading = false;
  scrollState.hasMore = true;
  scrollState.scrollLocked = false;
  scrollState.unreadCount = 0;
}

async function renderMessagesWithPagination(messages, appendMessage2, scrollToEnd = true) {
  const validMessages = Array.isArray(messages) ? messages.filter((msg) => msg && typeof msg === "object") : [];
  console.log("[ScrollManager] \u5F00\u59CB\u5206\u9875\u6E32\u67D3\uFF0C\u603B\u6D88\u606F\u6570:", validMessages.length);
  resetScrollState();
  scrollState.totalMessages = validMessages.length;
  if (validMessages.length === 0) {
    return;
  }
  const allImageRefs = [];
  validMessages.forEach((msg) => {
    if (Array.isArray(msg.imageRefs)) {
      allImageRefs.push(...msg.imageRefs);
    }
  });
  let imageCache = {};
  if (allImageRefs.length > 0) {
    try {
      imageCache = await getChatImagesBatch(allImageRefs);
      console.log("[ScrollManager] \u6279\u91CF\u52A0\u8F7D\u56FE\u7247\u5B8C\u6210\uFF0C\u5171", Object.keys(imageCache).length, "\u5F20");
    } catch (err) {
      console.error("[ScrollManager] \u6279\u91CF\u52A0\u8F7D\u56FE\u7247\u5931\u8D25:", err);
    }
  }
  if (validMessages.length <= scrollState.pageSize) {
    console.log("[ScrollManager] \u6D88\u606F\u6570 <= pageSize\uFF0C\u5168\u90E8\u6E32\u67D3");
    scrollState.renderedStart = 0;
    scrollState.renderedEnd = validMessages.length;
    scrollState.hasMore = false;
    for (const [index, msg] of validMessages.entries()) {
      let content = "";
      let images = null;
      if (Array.isArray(msg.imageRefs) && msg.imageRefs.length > 0) {
        content = msg.content || "";
        images = msg.imageRefs.filter((refId) => imageCache[refId]).map((refId) => ({
          data: imageCache[refId],
          name: "\u56FE\u7247"
        }));
        if (images.length === 0) images = null;
      } else if (Array.isArray(msg.content)) {
        const textPart = msg.content.find((c) => c.type === "text");
        content = textPart?.text || "";
        const imageParts = msg.content.filter((c) => c.type === "image_url");
        if (imageParts.length > 0) {
          images = imageParts.map((img) => ({
            data: img.image_url?.url || img.image_url,
            name: "\u751F\u6210\u7684\u56FE\u7247"
          }));
        }
      } else {
        content = msg.content || "";
        images = msg.images || null;
      }
      await appendMessage2(msg.role, content, images, index, true, {});
    }
  } else {
    console.log("[ScrollManager] \u6D88\u606F\u6570 > pageSize\uFF0C\u6E32\u67D3\u6700\u540E", scrollState.pageSize, "\u6761");
    scrollState.renderedStart = validMessages.length - scrollState.pageSize;
    scrollState.renderedEnd = validMessages.length;
    scrollState.hasMore = scrollState.renderedStart > 0;
    if (scrollState.hasMore) {
      prependLoadMoreIndicator();
    }
    const visibleMessages = validMessages.slice(scrollState.renderedStart, scrollState.renderedEnd);
    for (const [relativeIndex, msg] of visibleMessages.entries()) {
      const absoluteIndex = scrollState.renderedStart + relativeIndex;
      let content = "";
      let images = null;
      if (Array.isArray(msg.imageRefs) && msg.imageRefs.length > 0) {
        content = msg.content || "";
        images = msg.imageRefs.filter((refId) => imageCache[refId]).map((refId) => ({
          data: imageCache[refId],
          name: "\u56FE\u7247"
        }));
        if (images.length === 0) images = null;
      } else if (Array.isArray(msg.content)) {
        const textPart = msg.content.find((c) => c.type === "text");
        content = textPart?.text || "";
        const imageParts = msg.content.filter((c) => c.type === "image_url");
        if (imageParts.length > 0) {
          images = imageParts.map((img) => ({
            data: img.image_url?.url || img.image_url,
            name: "\u751F\u6210\u7684\u56FE\u7247"
          }));
        }
      } else {
        content = msg.content || "";
        images = msg.images || null;
      }
      await appendMessage2(msg.role, content, images, absoluteIndex, true, {});
    }
  }
  if (scrollToEnd) {
    requestAnimationFrame(() => {
      dom.chatBody.scrollTop(dom.chatBody[0].scrollHeight);
      console.log("[ScrollManager] \u6EDA\u52A8\u5230\u5E95\u90E8\u5B8C\u6210");
    });
  }
  console.log("[ScrollManager] \u5206\u9875\u6E32\u67D3\u5B8C\u6210\uFF0C\u5DF2\u6E32\u67D3:", scrollState.renderedStart, "-", scrollState.renderedEnd);
}

async function loadMoreMessages(messages, appendMessage2) {
  if (scrollState.isLoading || !scrollState.hasMore) {
    return;
  }
  const validMessages = Array.isArray(messages) ? messages.filter((msg) => msg && typeof msg === "object") : [];
  console.log("[ScrollManager] \u5F00\u59CB\u52A0\u8F7D\u66F4\u591A\u6D88\u606F...");
  scrollState.isLoading = true;
  updateLoadMoreIndicator("\u6B63\u5728\u52A0\u8F7D...");
  const oldScrollHeight = dom.chatBody[0].scrollHeight;
  const oldScrollTop = dom.chatBody[0].scrollTop;
  const newStart = Math.max(0, scrollState.renderedStart - scrollState.pageSize);
  const loadCount = scrollState.renderedStart - newStart;
  if (loadCount === 0) {
    scrollState.hasMore = false;
    updateLoadMoreIndicator("\u5DF2\u5230\u8FBE\u9876\u90E8");
    scrollState.isLoading = false;
    console.log("[ScrollManager] \u5DF2\u5230\u8FBE\u9876\u90E8\uFF0C\u65E0\u66F4\u591A\u6D88\u606F");
    return;
  }
  console.log("[ScrollManager] \u52A0\u8F7D\u6D88\u606F\u8303\u56F4:", newStart, "-", scrollState.renderedStart);
  const newMessages = validMessages.slice(newStart, scrollState.renderedStart);
  const imageRefs = [];
  newMessages.forEach((msg) => {
    if (Array.isArray(msg.imageRefs)) {
      imageRefs.push(...msg.imageRefs);
    }
  });
  let imageCache = {};
  if (imageRefs.length > 0) {
    try {
      imageCache = await getChatImagesBatch(imageRefs);
    } catch (err) {
      console.error("[ScrollManager] \u52A0\u8F7D\u56FE\u7247\u5931\u8D25:", err);
    }
  }
  const $loadMoreIndicator = dom.chatBody.find(".st-chatu8-ai-load-more-indicator");
  const $newElements = [];
  for (const [relativeIndex, msg] of newMessages.entries()) {
    const absoluteIndex = newStart + relativeIndex;
    let content = "";
    let images = null;
    if (Array.isArray(msg.imageRefs) && msg.imageRefs.length > 0) {
      content = msg.content || "";
      images = msg.imageRefs.filter((refId) => imageCache[refId]).map((refId) => ({
        data: imageCache[refId],
        name: "\u56FE\u7247"
      }));
      if (images.length === 0) images = null;
    } else if (Array.isArray(msg.content)) {
      const textPart = msg.content.find((c) => c.type === "text");
      content = textPart?.text || "";
      const imageParts = msg.content.filter((c) => c.type === "image_url");
      if (imageParts.length > 0) {
        images = imageParts.map((img) => ({
          data: img.image_url?.url || img.image_url,
          name: "\u751F\u6210\u7684\u56FE\u7247"
        }));
      }
    } else {
      content = msg.content || "";
      images = msg.images || null;
    }
    const $tempContainer = $("<div>");
    const originalChatBody = dom.chatBody;
    dom.chatBody = $tempContainer;
    try {
      await appendMessage2(msg.role, content, images, absoluteIndex, true, {});
      const $msgElement = $tempContainer.children().first();
      $newElements.push($msgElement);
    } finally {
      dom.chatBody = originalChatBody;
    }
  }
  if ($loadMoreIndicator.length) {
    $loadMoreIndicator.after($newElements);
  } else {
    dom.chatBody.prepend($newElements);
  }
  scrollState.renderedStart = newStart;
  scrollState.hasMore = newStart > 0;
  requestAnimationFrame(() => {
    const newScrollHeight = dom.chatBody[0].scrollHeight;
    const scrollDiff = newScrollHeight - oldScrollHeight;
    dom.chatBody[0].scrollTop = oldScrollTop + scrollDiff;
    console.log("[ScrollManager] \u6EDA\u52A8\u4F4D\u7F6E\u5DF2\u6062\u590D\uFF0C\u504F\u79FB:", scrollDiff);
  });
  if (!scrollState.hasMore) {
    updateLoadMoreIndicator("\u5DF2\u5230\u8FBE\u9876\u90E8");
  } else {
    updateLoadMoreIndicator("\u5411\u4E0A\u6EDA\u52A8\u52A0\u8F7D\u66F4\u591A\u5386\u53F2\u6D88\u606F...");
  }
  scrollState.isLoading = false;
  console.log("[ScrollManager] \u52A0\u8F7D\u5B8C\u6210\uFF0C\u5F53\u524D\u5DF2\u6E32\u67D3:", scrollState.renderedStart, "-", scrollState.renderedEnd);
}

function scrollToBottom(smooth = true) {
  if (!dom.chatBody || !dom.chatBody[0]) return;
  if (smooth) {
    dom.chatBody.stop(true).animate({
      scrollTop: dom.chatBody[0].scrollHeight
    }, 300);
  } else {
    dom.chatBody.scrollTop(dom.chatBody[0].scrollHeight);
  }
  scrollState.unreadCount = 0;
  updateUnreadBadge(0);
}

function scrollToMessageHead(messageElem, smooth = true, topOffset = 10) {
  if (!dom.chatBody || !dom.chatBody[0] || !messageElem) return;
  const $elem = $(messageElem);
  if (!$elem.length) return;
  const chatBodyEl = dom.chatBody[0];
  const elemEl = $elem[0];
  const chatBodyRect = chatBodyEl.getBoundingClientRect();
  const elemRect = elemEl.getBoundingClientRect();
  const targetScrollTop = Math.max(0, chatBodyEl.scrollTop + (elemRect.top - chatBodyRect.top) - topOffset);
  if (smooth) {
    dom.chatBody.stop(true).animate({
      scrollTop: targetScrollTop
    }, 300);
  } else {
    chatBodyEl.scrollTop = targetScrollTop;
  }
}

function isNearBottom(threshold = 100) {
  if (!dom.chatBody || !dom.chatBody[0]) return true;
  const scrollTop = dom.chatBody[0].scrollTop;
  const scrollHeight = dom.chatBody[0].scrollHeight;
  const clientHeight = dom.chatBody[0].clientHeight;
  return scrollHeight - scrollTop - clientHeight < threshold;
}

function prependLoadMoreIndicator() {
  if (dom.chatBody.find(".st-chatu8-ai-load-more-indicator").length > 0) {
    return;
  }
  const $indicator = $(`
        <div class="st-chatu8-ai-load-more-indicator">
            <i class="fa-solid fa-arrow-up"></i>
            <span>\u5411\u4E0A\u6EDA\u52A8\u52A0\u8F7D\u66F4\u591A\u5386\u53F2\u6D88\u606F...</span>
        </div>
    `);
  dom.chatBody.prepend($indicator);
}

function updateLoadMoreIndicator(text) {
  const $indicator = dom.chatBody.find(".st-chatu8-ai-load-more-indicator span");
  if ($indicator.length) {
    $indicator.text(text);
  }
}

function initScrollToBottomButton() {
  if ($("#st-chatu8-ai-scroll-to-bottom").length > 0) {
    return;
  }
  const $button = $(`
        <button id="st-chatu8-ai-scroll-to-bottom" class="st-chatu8-ai-scroll-to-bottom" title="\u56DE\u5230\u5E95\u90E8">
            <i class="fa-solid fa-arrow-down"></i>
            <span class="unread-badge" style="display: none;">0</span>
        </button>
    `);
  dom.dialog.append($button);
  $button.on("click", function() {
    scrollToBottom(true);
  });
  console.log('[ScrollManager] "\u56DE\u5230\u5E95\u90E8"\u6309\u94AE\u5DF2\u521D\u59CB\u5316');
}

function updateScrollToBottomButton(distanceFromBottom) {
  const $button = $("#st-chatu8-ai-scroll-to-bottom");
  if (!$button.length) return;
  const avgMessageHeight = 80;
  const messagesFromBottom = Math.floor(distanceFromBottom / avgMessageHeight);
  if (messagesFromBottom > 4) {
    $button.addClass("visible");
  } else {
    $button.removeClass("visible");
  }
}

function updateUnreadBadge(count) {
  const $badge = $("#st-chatu8-ai-scroll-to-bottom .unread-badge");
  if (!$badge.length) return;
  if (count > 0) {
    $badge.text(count).show();
  } else {
    $badge.hide();
  }
}

function incrementUnreadCount() {
  if (!isNearBottom()) {
    scrollState.unreadCount++;
    updateUnreadBadge(scrollState.unreadCount);
  }
}

function initScrollListener(appendMessage2) {
  if (!dom.chatBody || !dom.chatBody[0]) {
    console.warn("[ScrollManager] dom.chatBody \u4E0D\u5B58\u5728\uFF0C\u65E0\u6CD5\u521D\u59CB\u5316\u6EDA\u52A8\u76D1\u542C");
    return;
  }
  cleanupScrollListener();
  let rAFPending = false;
  _nativeScrollHandler = function() {
    if (rAFPending) return;
    rAFPending = true;
    requestAnimationFrame(() => {
      rAFPending = false;
      if (!activeChat || !activeChat.messages || !dom.chatBody || !dom.chatBody[0]) return;
      const chatEl = dom.chatBody[0];
      const scrollTop = chatEl.scrollTop;
      const scrollHeight = chatEl.scrollHeight;
      const clientHeight = chatEl.clientHeight;
      if (scrollTop < 200 && scrollState.hasMore && !scrollState.isLoading) {
        loadMoreMessages(activeChat.messages, appendMessage2);
      }
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      updateScrollToBottomButton(distanceFromBottom);
    });
  };
  dom.chatBody[0].addEventListener("scroll", _nativeScrollHandler, { passive: true });
  console.log("[ScrollManager] \u9AD8\u6027\u80FD\u539F\u751F\u6EDA\u52A8\u76D1\u542C\u5668\u5DF2\u542F\u7528 (passive: true)");
}

function cleanupScrollListener() {
  if (dom.chatBody && dom.chatBody[0] && _nativeScrollHandler) {
    dom.chatBody[0].removeEventListener("scroll", _nativeScrollHandler);
    _nativeScrollHandler = null;
  }
  dom.chatBody?.off("scroll.scrollManager");
}

export { incrementUnreadCount, initScrollListener, initScrollToBottomButton, isNearBottom, renderMessagesWithPagination, scrollToMessageHead, updateScrollStateAfterEdit };
