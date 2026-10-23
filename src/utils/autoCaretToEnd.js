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

  // Lắng nghe sự kiện Focus (bắt đầu vào ô input bằng click, tap, phím Tab, hoặc .focus())
  document.addEventListener('focusin', (e) => {
    const el = e.target;
    if (!isTextInput(el)) return;

    moveCaretToEnd(el);
    setTimeout(() => moveCaretToEnd(el), 10);
    setTimeout(() => moveCaretToEnd(el), 40);
    setTimeout(() => moveCaretToEnd(el), 100);
    setTimeout(() => moveCaretToEnd(el), 200);
  }, true);

  // Lắng nghe sự kiện nhấp chuột (tránh trình duyệt đặt con trỏ tại vị trí click sau khi focus)
  document.addEventListener('mouseup', (e) => {
    const el = e.target;
    if (!isTextInput(el)) return;

    setTimeout(() => moveCaretToEnd(el), 0);
    setTimeout(() => moveCaretToEnd(el), 30);
  }, true);

  // Lắng nghe sự kiện chạm màn hình trên điện thoại di động (iOS Safari / Android Chrome)
  document.addEventListener('touchend', (e) => {
    const el = e.target;
    if (!isTextInput(el)) return;

    setTimeout(() => moveCaretToEnd(el), 0);
    setTimeout(() => moveCaretToEnd(el), 40);
    setTimeout(() => moveCaretToEnd(el), 120);
  }, true);

  // Lắng nghe sự kiện Click
  document.addEventListener('click', (e) => {
    const el = e.target;
    if (!isTextInput(el)) return;

    setTimeout(() => moveCaretToEnd(el), 0);
    setTimeout(() => moveCaretToEnd(el), 30);
  }, true);
};
