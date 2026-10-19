// ============================================================================
// GOOGLE FIREBASE INITIALIZATION & CONFIGURATION SERVICE
// Tự động chuyển đổi giữa Real Cloud Firebase và Demo Offline Mode
// ============================================================================

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

// Đọc thông số cấu hình từ file .env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

// Kiểm tra xem người dùng đã điền khóa API thật hay chưa
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "AIzaSy..." &&
  firebaseConfig.projectId
);

let app = null;
let db = null;
let auth = null;
let storage = null;
let messaging = null;

if (isFirebaseConfigured) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
    console.log('[APCT Firebase] Đã kết nối thành công Firestore & Storage:', firebaseConfig.projectId);
  } catch (err) {
    console.warn('[APCT Firebase] Lỗi khởi tạo Firebase:', err);
  }
} else {
  console.log('[APCT Firebase] Đang chạy ở chế độ Demo Mode (Chưa cấu hình .env)');
}

// Khởi tạo Firebase Cloud Messaging (Web Push)
export const initFCM = async () => {
  if (!isFirebaseConfigured || !app) return null;
  
  try {
    const supported = await isSupported();
    if (supported && !messaging) {
      messaging = getMessaging(app);
    }
    return messaging;
  } catch (err) {
    console.warn('[APCT FCM] Không hỗ trợ Web Push trên môi trường này:', err);
    return null;
  }
};

export { app, db, auth, storage, messaging, firebaseConfig };
