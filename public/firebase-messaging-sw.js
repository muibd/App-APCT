// ============================================================================
// FIREBASE CLOUD MESSAGING (FCM) SERVICE WORKER
// Hỗ trợ nhận thông báo nền (Background Notification) ngay cả khi không mở App
// ============================================================================

importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Khởi tạo Firebase thật của dự án APCT
const firebaseConfig = {
  apiKey: "AIzaSyBAJvY6Pn3TjruubE-QN9ItcNL8Q5RHPK0",
  authDomain: "app-apct-nghiemthu.firebaseapp.com",
  projectId: "app-apct-nghiemthu",
  storageBucket: "app-apct-nghiemthu.firebasestorage.app",
  messagingSenderId: "1019219852691",
  appId: "1:1019219852691:web:27d14ee00994cd078a3c66"
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // Nhận thông báo khi ứng dụng đang đóng / ở chế độ nền
  messaging.onBackgroundMessage((payload) => {
    console.log('[FCM Service Worker] Nhận thông báo nền:', payload);

    const notificationTitle = payload.notification?.title || 'APCT - Thông báo Nghiệm thu';
    const notificationOptions = {
      body: payload.notification?.body || 'Bạn có thông báo mới từ hệ thống nghiệm thu công trình.',
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/icon-192x192.svg',
      vibrate: [200, 100, 200],
      data: payload.data || {},
      actions: [
        { action: 'open_invitation', title: 'Xem chi tiết phiếu' },
        { action: 'dismiss', title: 'Bỏ qua' }
      ]
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (e) {
  console.log('[FCM Service Worker] Khởi tạo:', e);
}

// Bắt sự kiện khi người dùng click vào thông báo hệ thống
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const clickAction = event.notification.data?.click_action || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Nếu đã có tab đang mở -> Focus vào tab đó
      for (let client of windowClients) {
        if (client.url.includes(clickAction) && 'focus' in client) {
          return client.focus();
        }
      }
      // Nếu app đang đóng -> Mở tab mới
      if (clients.openWindow) {
        return clients.openWindow(clickAction);
      }
    })
  );
});
