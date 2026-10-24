/**
 * autoCaretToEnd.js
 * Tự động di chuyển con trỏ soạn thảo (caret) xuống cuối văn bản khi người dùng
 * nhấp chuột hoặc chạm vào bất kỳ ô input/textarea nào trong ứng dụng để nhập hoặc sửa.
 */

const isTextInput = (el) => {
  if (!el || !el.tagName) return false;
  const tag = el.tagName.toUpperCase();
  if (tag === 'TEXTAREA') return true;
  if (tag === 'INPUT') {
    const type = (el.type || 'text').toLowerCase();
    return ['text', 'search', 'url', 'tel', 'password', 'email', ''].includes(type);
  }
  return false;
};

export const moveCaretToEnd = (el) => {
  if (!isTextInput(el)) return;
  try {
    const len = el.value ? el.value.length : 0;
    if (typeof el.setSelectionRange === 'function') {
      // Chỉ tự động nhảy về cuối khi người dùng không bôi đen chọn 1 đoạn văn bản
      if (el.selectionStart === el.selectionEnd) {
        el.setSelectionRange(len, len);
      }
    }
  } catch {
    // Bỏ qua với các phần tử không hỗ trợ setSelectionRange
  }
};

export const initAutoCaretToEnd = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  let lastHandledEl = null;

  // Lắng nghe sự kiện Focus vào ô input/textarea
  document.addEventListener('focusin', (e) => {
    const el = e.target;
    if (!isTextInput(el)) return;
    lastHandledEl = el;
    requestAnimationFrame(() => moveCaretToEnd(el));
    setTimeout(() => moveCaretToEnd(el), 30);
  }, true);

  // Chỉ khi click vào đúng ô input vừa focus thì mới định vị lại con trỏ về cuối một lần
  document.addEventListener('mouseup', (e) => {
    const el = e.target;
    if (el && el === lastHandledEl && isTextInput(el)) {
      setTimeout(() => moveCaretToEnd(el), 10);
      lastHandledEl = null;
    }
  }, true);

  // Hỗ trợ cảm ứng trên thiết bị di động
  document.addEventListener('touchend', (e) => {
    const el = e.target;
    if (el && el === lastHandledEl && isTextInput(el)) {
      setTimeout(() => moveCaretToEnd(el), 20);
      lastHandledEl = null;
    }
  }, true);
};
