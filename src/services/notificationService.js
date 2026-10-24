// ============================================================================
// WEB PUSH NOTIFICATION & FCM TOKEN SERVICE
// Hỗ trợ xin cấp quyền và gửi thông báo hiển thị trên màn hình thiết bị
// ============================================================================

import { initFCM, isFirebaseConfigured } from './firebase';
import { getToken } from 'firebase/messaging';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || "";

/**
 * Kiểm tra thiết bị có phải là iOS (iPhone/iPad) hay không
 */
export const isIOSDevice = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
};

/**
 * Kiểm tra xem web app có đang chạy ở chế độ Standalone (Đã thêm vào Màn hình chính - PWA) hay không
 */
export const isStandalonePWA = () => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
};

/**
 * Lấy thông tin chẩn đoán hỗ trợ Web Push trên thiết bị hiện tại
 */
export const getPushDiagnostics = () => {
  const isIOS = isIOSDevice();
  const isStandalone = isStandalonePWA();
  const hasNotification = typeof window !== 'undefined' && 'Notification' in window;
  const permission = hasNotification ? Notification.permission : 'unsupported';
  
  return {
    isIOS,
    isStandalone,
    hasNotification,
    permission
  };
};

/**
 * Yêu cầu người dùng cấp quyền hiển thị thông báo trên trình duyệt/điện thoại
 */
export const requestPushPermission = async () => {
  const diag = getPushDiagnostics();

  // 1. Trường hợp người dùng iPhone/iPad chưa cài ra Màn hình chính
  if (diag.isIOS && !diag.isStandalone) {
    console.warn('[Web Push] Trên iOS, Apple yêu cầu thêm web app vào Màn hình chính (PWA) để nhận thông báo.');
    return {
      granted: false,
      reason: 'ios_not_standalone',
      isIOS: true,
      isStandalone: false,
      message: 'Trên iPhone/iPad, Apple yêu cầu thêm ứng dụng vào Màn hình chính (Add to Home Screen) mới có thể nhận thông báo đẩy.'
    };
  }

  // 2. Trường hợp trình duyệt hoàn toàn không hỗ trợ Notification API (hoặc chạy trong Safari tab thường / Riêng tư)
  if (!diag.hasNotification) {
    console.warn('[Web Push] Trình duyệt không hỗ trợ Web Notification hoặc đang chạy ở tab Riêng tư.');
    return {
      granted: false,
      reason: diag.isIOS ? 'ios_not_standalone' : 'unsupported',
      isIOS: diag.isIOS,
      isStandalone: diag.isStandalone,
      message: diag.isIOS 
        ? 'Trên iPhone, Apple chặn thông báo trên tab trình duyệt thường hoặc tab Riêng tư. Vui lòng thêm ứng dụng vào Màn hình chính.'
        : 'Trình duyệt của bạn hiện chưa hỗ trợ Web Notification hoặc đang duyệt web ở chế độ Riêng tư (Ẩn danh).'
    };
  }

  // 3. Trường hợp quyền thông báo đã bị người dùng chọn Từ chối (Blocked / Denied) trước đó
  if (Notification.permission === 'denied') {
    console.warn('[Web Push] Quyền thông báo đã bị chặn trong Cài đặt trình duyệt.');
    return {
      granted: false,
      reason: 'denied',
      isIOS: diag.isIOS,
      isStandalone: diag.isStandalone,
      message: 'Quyền thông báo đang bị Chặn. Bạn cần mở Cài đặt trình duyệt để cho phép lại.'
    };
  }

  // 4. Gọi API xin cấp quyền từ người dùng
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('[Web Push] Người dùng đã cấp quyền nhận thông báo.');
      
      let token = null;
      if (isFirebaseConfigured && VAPID_KEY) {
        try {
          const messaging = await initFCM();
          if (messaging) {
            token = await getToken(messaging, { vapidKey: VAPID_KEY });
            console.log('[FCM Device Token]', token);
          }
        } catch (fcmErr) {
          console.warn('[FCM Token Warn]', fcmErr);
        }
      }
      return { granted: true, token, isIOS: diag.isIOS };
    } else if (permission === 'denied') {
      console.warn('[Web Push] Người dùng đã từ chối cấp quyền thông báo.');
      return {
        granted: false,
        reason: 'denied',
        isIOS: diag.isIOS,
        isStandalone: diag.isStandalone,
        message: 'Bạn đã chọn Không cho phép nhận thông báo.'
      };
    } else {
      return {
        granted: false,
        reason: 'dismissed',
        isIOS: diag.isIOS,
        isStandalone: diag.isStandalone,
        message: 'Hộp thoại xin cấp quyền đã bị đóng.'
      };
    }
  } catch (err) {
    console.error('[Web Push Permission Error]', err);
    return {
      granted: false,
      reason: 'error',
      isIOS: diag.isIOS,
      isStandalone: diag.isStandalone,
      message: err.message || 'Không thể yêu cầu quyền thông báo.'
    };
  }
};

/**
 * Phát âm thanh chuông thông báo (Web Audio API - luôn kêu kể cả mobile/desktop)
 */
export const playNotificationSound = () => {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Chime 1: 587.33 Hz (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.28);

    // Chime 2: 880 Hz (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.22, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.45);
  } catch (err) {
    // Trình duyệt có thể chặn âm thanh nếu chưa có tương tác từ người dùng
  }
};

/**
 * Hiển thị thông báo cục bộ của hệ điều hành (Native System Notification / Service Worker Notification)
 * Đảm bảo 100% hiển thị trên cả Android Chrome, Desktop và PWA iOS
 */
export const showSystemNotification = async (title, body, url = '/') => {
  if (typeof window === 'undefined') return;
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  // Luôn phát âm thanh chuông thông báo
  playNotificationSound();

  const options = {
    body,
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/icon-192x192.svg',
    vibrate: [200, 100, 200],
    tag: `apct_${Date.now()}`,
    data: { url }
  };

  // 1. Thử dùng Service Worker Registration trước (BẮT BUỘC cho Android Chrome và Web PWA)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, options);
        return;
      }
    } catch (swErr) {
      console.warn('[SW Notification fallback]', swErr);
    }
  }

  // 2. Fallback sang Native Notification API trên Desktop Chrome / Firefox
  try {
    const notification = new Notification(title, options);
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (e) {
    console.warn('[Native Notification Error]', e);
  }
};
