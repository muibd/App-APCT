// ============================================================================
// ONESIGNAL WEB PUSH NOTIFICATION SERVICE
// Hỗ trợ nổ thông báo ra màn hình khóa điện thoại (Background Push)
// Hoạt động trên cả iPhone (iOS 16.4+ PWA) và Android / Desktop Chrome
// ============================================================================

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID || "";
const ONESIGNAL_REST_API_KEY = import.meta.env.VITE_ONESIGNAL_REST_API_KEY || "";

export const isOneSignalConfigured = Boolean(ONESIGNAL_APP_ID);

/**
 * Khởi tạo OneSignal Web Push SDK
 */
export const initOneSignal = (onPermissionChange) => {
  if (typeof window === 'undefined') return;

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async function(OneSignal) {
    if (!ONESIGNAL_APP_ID) {
      console.log('[OneSignal] Chưa cấu hình VITE_ONESIGNAL_APP_ID trong .env');
      return;
    }

    try {
      await OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        safari_web_id: import.meta.env.VITE_ONESIGNAL_SAFARI_WEB_ID || undefined,
        notifyButton: {
          enable: false
        },
        allowLocalhostAsSecureOrigin: true
      });

      console.log('[OneSignal] Đã khởi tạo OneSignal Web Push SDK thành công!');

      // Lắng nghe thay đổi trạng thái đăng ký nhận thông báo
      if (typeof onPermissionChange === 'function') {
        OneSignal.User.PushSubscription.addEventListener('change', (event) => {
          console.log('[OneSignal Subscription Change]', event);
          onPermissionChange(event.current.optedIn);
        });
      }
    } catch (err) {
      console.warn('[OneSignal Init Error]', err);
    }
  });
};

/**
 * Gắn nhãn vai trò và tài khoản người dùng vào OneSignal để gửi đúng người
 */
export const loginOneSignalUser = (user) => {
  if (!isOneSignalConfigured || !user || typeof window === 'undefined') return;

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async function(OneSignal) {
    try {
      if (user.uid) {
        await OneSignal.login(user.uid);
      }
      if (user.role) {
        await OneSignal.User.addTag("role", user.role);
      }
      if (user.fullName) {
        await OneSignal.User.addTag("fullName", user.fullName);
      }
      console.log('[OneSignal User Tagged]', user.fullName, 'Role:', user.role);
    } catch (err) {
      console.warn('[OneSignal Tag Error]', err);
    }
  });
};

/**
 * Yêu cầu người dùng cấp quyền thông báo qua OneSignal
 */
export const requestOneSignalPermission = async () => {
  if (!isOneSignalConfigured || typeof window === 'undefined') {
    return { granted: false, reason: 'not_configured' };
  }

  return new Promise((resolve) => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function(OneSignal) {
      try {
        await OneSignal.Slidedown.promptPush();
        const isOptedIn = OneSignal.User.PushSubscription.optedIn;
        resolve({ granted: isOptedIn });
      } catch (err) {
        console.error('[OneSignal Prompt Error]', err);
        resolve({ granted: false, reason: err.message });
      }
    });
  });
};

/**
 * Gửi thông báo đẩy nền qua OneSignal REST API để đánh thức màn hình khóa
 * @param {Object} options
 * @param {string} options.title - Tiêu đề thông báo
 * @param {string} options.message - Nội dung thông báo
 * @param {string[]} [options.targetRoles] - Danh sách vai trò nhận (vd: ['SUPERVISOR', 'INVESTOR'])
 * @param {string} [options.url] - Đường dẫn khi người dùng bấm vào thông báo
 */
export const sendOneSignalPush = async ({ title, message, targetRoles = [], url = 'https://app-apct-nghiemthu.web.app' }) => {
  if (!ONESIGNAL_APP_ID) {
    console.log('[OneSignal Demo Push] Chưa có APP_ID, mô phỏng gửi thành công.');
    return false;
  }

  try {
    const payload = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: title, vi: title },
      contents: { en: message, vi: message },
      url: url,
      chrome_web_icon: 'https://app-apct-nghiemthu.web.app/icons/icon-192x192.svg',
      firefox_icon: 'https://app-apct-nghiemthu.web.app/icons/icon-192x192.svg'
    };

    // Nếu có chỉ định vai trò nhận thông báo
    if (targetRoles.length > 0) {
      const filters = [];
      targetRoles.forEach((role, idx) => {
        if (idx > 0) filters.push({ operator: 'OR' });
        filters.push({ field: 'tag', key: 'role', relation: '=', value: role });
      });
      payload.filters = filters;
    } else {
      payload.included_segments = ['Subscribed Users'];
    }

    const headers = {
      'Content-Type': 'application/json'
    };

    if (ONESIGNAL_REST_API_KEY) {
      headers['Authorization'] = `Basic ${ONESIGNAL_REST_API_KEY}`;
    }

    const res = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log('[OneSignal Push Result]', data);
    return true;
  } catch (err) {
    console.warn('[OneSignal Send Push Warn]', err);
    return false;
  }
};
