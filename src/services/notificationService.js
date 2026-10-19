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
 * Hiển thị thông báo cục bộ của hệ điều hành (Native System Notification)
 */
export const showSystemNotification = (title, body, url = '/') => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  try {
    const notification = new Notification(title, {
      body,
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/icon-192x192.svg',
      vibrate: [200, 100, 200],
      tag: 'apct-inspection'
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (e) {
    console.warn('[Native Notification Error]', e);
  }
};
