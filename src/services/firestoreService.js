// ============================================================================
// GOOGLE FIRESTORE DATABASE SERVICE
// Quản lý lưu trữ thời gian thực (Real-time Cloud Sync) cho toàn hệ thống:
// 1. Phiếu Yêu Cầu Nghiệm Thu (inspection_requests)
// 2. Biên Bản Nghiệm Thu (inspection_reports)
// 3. Thông Báo Hệ Thống & Đẩy Web Push (system_notifications)
// ============================================================================

import { db, isFirebaseConfigured } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  getDocs,
  onSnapshot,
  query 
} from 'firebase/firestore';
import { 
  INITIAL_REQUESTS, 
  INITIAL_REPORTS, 
  INITIAL_NOTIFICATIONS,
  MOCK_USERS 
} from '../data/mockData';

const REQUESTS_COLLECTION = 'inspection_requests';
const REPORTS_COLLECTION = 'inspection_reports';
const NOTIFICATIONS_COLLECTION = 'system_notifications';
const USERS_COLLECTION = 'system_users';
const BUILDINGS_COLLECTION = 'system_buildings';
const DAILY_LOGS_COLLECTION = 'construction_daily_logs';
const COMPLETION_REPORTS_COLLECTION = 'completion_reports';

// ============================================================================
// 1. PHIẾU YÊU CẦU NGHIỆM THU (INSPECTION REQUESTS)
// ============================================================================

// Helper: Loại bỏ hoặc chuyển đổi các giá trị undefined thành null để Firestore không báo lỗi
export const sanitizeData = (data) => {
  if (data === undefined) return null;
  return JSON.parse(JSON.stringify(data, (_, value) => (value === undefined ? null : value)));
};

/**
 * Lắng nghe thời gian thực (Real-time listener) danh sách Phiếu yêu cầu
 */
export const subscribeToRequests = (callback) => {
  if (!isFirebaseConfigured || !db) {
    callback(INITIAL_REQUESTS);
    return () => {};
  }

  try {
    const colRef = collection(db, REQUESTS_COLLECTION);
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const items = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() });
      });

      // Sắp xếp giảm dần theo thời gian tạo
      items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      callback(items);
    }, (error) => {
      console.warn('[Firestore] Lỗi lắng nghe danh sách phiếu:', error);
      callback([]);
    });

    return unsubscribe;
  } catch (e) {
    console.warn('[Firestore Exception]', e);
    callback([]);
    return () => {};
  }
};

/**
 * Lưu hoặc cập nhật Phiếu yêu cầu lên Firestore
 */
export const saveInspectionRequest = async (requestData) => {
  const cleanData = sanitizeData(requestData);
  if (!isFirebaseConfigured || !db) {
    console.log('[Firestore Offline] Lưu phiếu nội bộ:', cleanData?.requestNumber);
    return cleanData;
  }

  try {
    const docRef = doc(db, REQUESTS_COLLECTION, cleanData.id);
    await setDoc(docRef, cleanData);
    console.log('[Firestore Cloud] Đã lưu phiếu thành công:', cleanData.requestNumber);
    return cleanData;
  } catch (error) {
    console.error('[Firestore Save Request Error]', error);
    return cleanData;
  }
};

/**
 * Cập nhật phản hồi thành phần tiếp nhận trên Phiếu yêu cầu
 */
export const updateRecipientResponse = async (requestId, assignedRecipients, newOverallStatus) => {
  if (!isFirebaseConfigured || !db) {
    return true;
  }

  try {
    const docRef = doc(db, REQUESTS_COLLECTION, requestId);
    await updateDoc(docRef, {
      assignedRecipients,
      status: newOverallStatus,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('[Firestore Update Response Error]', error);
    throw error;
  }
};

// ============================================================================
// 2. BIÊN BẢN NGHIỆM THU (INSPECTION REPORTS)
// ============================================================================

/**
 * Lắng nghe thời gian thực (Real-time listener) danh sách Biên bản nghiệm thu
 */
export const subscribeToReports = (callback) => {
  if (!isFirebaseConfigured || !db) {
    callback(INITIAL_REPORTS);
    return () => {};
  }

  try {
    const colRef = collection(db, REPORTS_COLLECTION);
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const items = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() });
      });

      items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      callback(items);
    }, (error) => {
      console.warn('[Firestore] Lỗi lắng nghe danh sách biên bản:', error);
      callback([]);
    });

    return unsubscribe;
  } catch (e) {
    console.warn('[Firestore Exception Reports]', e);
    callback([]);
    return () => {};
  }
};

/**
 * Lưu hoặc cập nhật Biên bản nghiệm thu lên Firestore
 */
export const saveInspectionReport = async (reportData) => {
  const cleanData = sanitizeData(reportData);
  if (!isFirebaseConfigured || !db) {
    console.log('[Firestore Offline] Lưu biên bản nội bộ:', cleanData?.reportNumber);
    return cleanData;
  }

  try {
    const docRef = doc(db, REPORTS_COLLECTION, cleanData.id);
    await setDoc(docRef, cleanData);
    console.log('[Firestore Cloud] Đã lưu biên bản thành công:', cleanData.reportNumber);
    return cleanData;
  } catch (error) {
    console.error('[Firestore Save Report Error]', error);
    return cleanData;
  }
};

// ============================================================================
// 3. THÔNG BÁO HỆ THỐNG THỜI GIAN THỰC (REAL-TIME SYSTEM NOTIFICATIONS)
// ============================================================================

/**
 * Lắng nghe thời gian thực (Real-time listener) danh sách Thông báo hệ thống
 */
export const subscribeToNotifications = (callback) => {
  if (!isFirebaseConfigured || !db) {
    callback(INITIAL_NOTIFICATIONS);
    return () => {};
  }

  try {
    const colRef = collection(db, NOTIFICATIONS_COLLECTION);
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const items = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() });
      });

      items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      callback(items);
    }, (error) => {
      console.warn('[Firestore] Lỗi lắng nghe danh sách thông báo:', error);
      callback([]);
    });

    return unsubscribe;
  } catch (e) {
    console.warn('[Firestore Exception Notifications]', e);
    callback([]);
    return () => {};
  }
};

/**
 * Phát hành thông báo mới lên Firestore để tất cả thiết bị đồng loạt nhận được
 */
export const saveSystemNotification = async (notifData) => {
  const cleanData = sanitizeData({
    ...notifData,
    createdAt: notifData.createdAt || new Date().toISOString()
  });
  if (!isFirebaseConfigured || !db) {
    return cleanData;
  }

  try {
    const docRef = doc(db, NOTIFICATIONS_COLLECTION, cleanData.id);
    await setDoc(docRef, cleanData);
    console.log('[Firestore Cloud] Đã phát thông báo lên toàn mạng:', cleanData.title);
    return cleanData;
  } catch (error) {
    console.error('[Firestore Notification Error]', error);
    throw error;
  }
};

/**
 * Đánh dấu thông báo đã đọc trên Firestore
 */
export const markNotificationRead = async (notifId) => {
  if (!isFirebaseConfigured || !db) return;
  try {
    const docRef = doc(db, NOTIFICATIONS_COLLECTION, notifId);
    await updateDoc(docRef, { isRead: true });
  } catch (err) {
    console.warn('[Firestore Mark Read Error]', err);
  }
};

/**
 * Đánh dấu tất cả thông báo đã đọc trên Firestore
 */
export const markAllNotificationsRead = async (notifications = []) => {
  if (!isFirebaseConfigured || !db) return;
  try {
    const unread = notifications.filter(n => !n.isRead);
    for (const notif of unread) {
      const docRef = doc(db, NOTIFICATIONS_COLLECTION, notif.id);
      updateDoc(docRef, { isRead: true }).catch(() => {});
    }
  } catch (err) {
    console.warn('[Firestore Mark All Read Error]', err);
  }
};

/**
 * Xóa một thông báo trên Firestore
 */
export const deleteSystemNotification = async (notifId) => {
  if (!isFirebaseConfigured || !db) return;
  try {
    const docRef = doc(db, NOTIFICATIONS_COLLECTION, notifId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('[Firestore Delete Notif Error]', err);
  }
};

/**
 * Xóa toàn bộ danh sách thông báo trên Firestore
 */
export const clearAllSystemNotifications = async (notifications = []) => {
  if (!isFirebaseConfigured || !db) return;
  try {
    for (const notif of notifications) {
      const docRef = doc(db, NOTIFICATIONS_COLLECTION, notif.id);
      deleteDoc(docRef).catch(() => {});
    }
  } catch (err) {
    console.warn('[Firestore Clear All Error]', err);
  }
};

/**
 * Lưu FCM Device Token của người dùng lên Firestore để phục vụ gửi Push từ Server/Cloud
 */
export const saveDeviceFCMToken = async (userId, userRole, token) => {
  if (!isFirebaseConfigured || !db || !token) return;
  try {
    const cleanId = `${userId || 'guest'}_${token.slice(-12)}`;
    const docRef = doc(db, 'fcm_device_tokens', cleanId);
    await setDoc(docRef, {
      userId,
      userRole,
      token,
      updatedAt: new Date().toISOString(),
      platform: /iPhone|iPad|iPod/.test(navigator.userAgent) ? 'iOS' : 'Android/Desktop'
    });
    console.log('[Firestore] Đã đăng ký FCM Device Token thành công:', cleanId);
  } catch (err) {
    console.warn('[Firestore FCM Token Error]', err);
  }
};

// ============================================================================
// 4. QUẢN LÝ CÁN BỘ HỆ THỐNG (SYSTEM USERS REAL-TIME SYNC)
// ============================================================================

/**
 * Lắng nghe danh sách cán bộ tùy chỉnh / bổ sung từ Firestore
 */
export const subscribeToUsers = (callback) => {
  if (!isFirebaseConfigured || !db) {
    callback([]);
    return () => {};
  }

  try {
    const colRef = collection(db, USERS_COLLECTION);
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const usersList = [];
      snapshot.forEach(docSnap => {
        usersList.push({ uid: docSnap.id, ...docSnap.data() });
      });
      callback(usersList);
    }, (error) => {
      console.warn('[Firestore] Lỗi lắng nghe cán bộ:', error);
      callback([]);
    });

    return unsubscribe;
  } catch (e) {
    console.warn('[Firestore Users Exception]', e);
    callback([]);
    return () => {};
  }
};

/**
 * Lưu hoặc cập nhật thông tin cán bộ lên Firestore
 */
export const saveSystemUser = async (userData) => {
  const cleanData = sanitizeData({
    ...userData,
    updatedAt: new Date().toISOString()
  });
  if (!isFirebaseConfigured || !db) return cleanData;
  try {
    const docRef = doc(db, USERS_COLLECTION, cleanData.uid);
    await setDoc(docRef, cleanData);
    console.log('[Firestore Cloud] Đã lưu thông tin cán bộ:', cleanData.fullName);
    return cleanData;
  } catch (error) {
    console.error('[Firestore Save User Error]', error);
    throw error;
  }
};

/**
 * Xóa cán bộ khỏi Firestore
 */
export const deleteSystemUser = async (userId) => {
  if (!isFirebaseConfigured || !db) return;
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    await deleteDoc(docRef);
    console.log('[Firestore Cloud] Đã xóa cán bộ:', userId);
  } catch (error) {
    console.error('[Firestore Delete User Error]', error);
    throw error;
  }
};

/**
 * Đồng bộ toàn bộ danh sách cán bộ chính thức lên Google Firestore collection 'system_users'
 */
export const seedOfficialUsersToCloud = async (customUsers = null) => {
  if (!isFirebaseConfigured || !db) return false;
  try {
    const listToSeed = (Array.isArray(customUsers) && customUsers.length > 0) ? customUsers : MOCK_USERS;
    const promises = listToSeed.map(u => {
      const cleanData = sanitizeData({
        ...u,
        updatedAt: new Date().toISOString()
      });
      return setDoc(doc(db, USERS_COLLECTION, u.uid), cleanData);
    });
    await Promise.all(promises);
    console.log(`[Firestore Cloud] Đã đồng bộ thành công ${listToSeed.length} cán bộ lên Firestore!`);
    return true;
  } catch (error) {
    console.error('[Firestore Seed Users Error]', error);
    throw error;
  }
};

// ============================================================================
// 5. QUẢN LÝ CÔNG TRÌNH / TÒA NHÀ (SYSTEM BUILDINGS SYNC)
// ============================================================================

/**
 * Lắng nghe danh sách công trình bổ sung từ Firestore
 */
export const subscribeToBuildings = (callback) => {
  if (!isFirebaseConfigured || !db) {
    callback([]);
    return () => {};
  }

  try {
    const colRef = collection(db, BUILDINGS_COLLECTION);
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const buildingsList = [];
      snapshot.forEach(docSnap => {
        buildingsList.push({ id: docSnap.id, ...docSnap.data() });
      });
      callback(buildingsList);
    }, (error) => {
      console.warn('[Firestore] Lỗi lắng nghe công trình:', error);
      callback([]);
    });

    return unsubscribe;
  } catch (e) {
    console.warn('[Firestore Buildings Exception]', e);
    callback([]);
    return () => {};
  }
};

/**
 * Lưu công trình mới lên Firestore
 */
export const saveBuilding = async (buildingData) => {
  const cleanData = sanitizeData({
    ...buildingData,
    updatedAt: new Date().toISOString()
  });
  if (!isFirebaseConfigured || !db) return cleanData;
  try {
    const docRef = doc(db, BUILDINGS_COLLECTION, cleanData.id);
    await setDoc(docRef, cleanData);
    console.log('[Firestore Cloud] Đã lưu công trình mới:', cleanData.name);
    return cleanData;
  } catch (error) {
    console.error('[Firestore Save Building Error]', error);
    throw error;
  }
};

// ============================================================================
// 6. XÓA DỮ LIỆU THỬ NGHIỆM TRÊN CLOUD (RESET TESTING DATA)
// ============================================================================

/**
 * Xóa sạch toàn bộ Phiếu yêu cầu, Biên bản nghiệm thu, Nhật ký thi công và Thông báo trên Cloud Firestore
 */
export const clearAllCloudInspectionData = async () => {
  if (!isFirebaseConfigured || !db) return true;
  try {
    const collectionsToClear = [REQUESTS_COLLECTION, REPORTS_COLLECTION, NOTIFICATIONS_COLLECTION, DAILY_LOGS_COLLECTION, COMPLETION_REPORTS_COLLECTION];
    await Promise.all(collectionsToClear.map(async (colName) => {
      let snapshot = await getDocs(collection(db, colName));
      while (!snapshot.empty) {
        await Promise.all(snapshot.docs.map(docSnap => deleteDoc(doc(db, colName, docSnap.id))));
        snapshot = await getDocs(collection(db, colName));
      }
    }));
    console.log('[Firestore Cloud] Đã dọn sạch toàn bộ phiếu, biên bản và nhật ký trên Firestore!');
    return true;
  } catch (err) {
    console.error('[Firestore Clear Cloud Data Error]', err);
    throw err;
  }
};

// ============================================================================
// 7. NHẬT KÝ THI CÔNG XÂY DỰNG (CONSTRUCTION DAILY LOGS)
// Theo mẫu chuẩn: 1. Nhat ky thi cong.doc
// ============================================================================

/**
 * Lắng nghe thời gian thực danh sách Nhật ký thi công
 */
export const subscribeToDailyLogs = (callback) => {
  if (!isFirebaseConfigured || !db) {
    callback([]);
    return () => {};
  }

  try {
    const colRef = collection(db, DAILY_LOGS_COLLECTION);
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const items = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() });
      });

      // Sắp xếp giảm dần theo ngày ghi nhật ký
      items.sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0));
      callback(items);
    }, (error) => {
      console.warn('[Firestore] Lỗi lắng nghe danh sách nhật ký:', error);
      callback([]);
    });

    return unsubscribe;
  } catch (e) {
    console.warn('[Firestore Daily Logs Exception]', e);
    callback([]);
    return () => {};
  }
};

/**
 * Lưu hoặc cập nhật Nhật ký thi công lên Firestore
 */
export const saveDailyLog = async (logData) => {
  const cleanData = sanitizeData({
    ...logData,
    updatedAt: new Date().toISOString()
  });

  if (!isFirebaseConfigured || !db) {
    console.log('[Firestore Offline] Lưu nhật ký nội bộ:', cleanData?.logNumber);
    return cleanData;
  }

  try {
    const docRef = doc(db, DAILY_LOGS_COLLECTION, cleanData.id);
    await setDoc(docRef, cleanData);
    console.log('[Firestore Cloud] Đã lưu nhật ký thành công:', cleanData.logNumber);
    return cleanData;
  } catch (error) {
    console.error('[Firestore Save Daily Log Error]', error);
    return cleanData;
  }
};

/**
 * Cập nhật xác nhận TVGS / CĐT trên Nhật ký thi công
 */
export const updateDailyLog = async (logId, updateData) => {
  const cleanData = sanitizeData({
    ...updateData,
    updatedAt: new Date().toISOString()
  });

  if (!isFirebaseConfigured || !db) {
    return cleanData;
  }

  try {
    const docRef = doc(db, DAILY_LOGS_COLLECTION, logId);
    await updateDoc(docRef, cleanData);
    console.log('[Firestore Cloud] Đã cập nhật nhật ký:', logId);
    return cleanData;
  } catch (error) {
    console.error('[Firestore Update Daily Log Error]', error);
    throw error;
  }
};

/**
 * Xóa một Nhật ký thi công
 */
export const deleteDailyLog = async (logId) => {
  if (!isFirebaseConfigured || !db) return true;
  try {
    const docRef = doc(db, DAILY_LOGS_COLLECTION, logId);
    await deleteDoc(docRef);
    console.log('[Firestore Cloud] Đã xóa nhật ký:', logId);
    return true;
  } catch (error) {
    console.error('[Firestore Delete Daily Log Error]', error);
    throw error;
  }
};

// ============================================================================
// 8. BIÊN BẢN NGHIỆM THU HOÀN THÀNH (COMPLETION INSPECTION REPORTS)
// ============================================================================

/**
 * Lắng nghe thay đổi Real-Time của các Biên bản Nghiệm Thu Hoàn Thành
 */
export const subscribeToCompletionReports = (callback) => {
  if (!isFirebaseConfigured || !db) {
    console.log('[Firestore] Offline Mode: Using local Completion Reports');
    callback([]);
    return () => {};
  }

  try {
    const colRef = collection(db, COMPLETION_REPORTS_COLLECTION);
    const q = query(colRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() });
      });
      items.sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0));
      console.log(`[Firestore Real-Time] Cập nhật ${items.length} biên bản nghiệm thu hoàn thành từ Cloud`);
      callback(items);
    }, (error) => {
      console.warn('[Firestore Listen Completion Reports Error]:', error);
      callback([]);
    });

    return unsubscribe;
  } catch (error) {
    console.error('[Firestore Setup Completion Reports Listener Error]:', error);
    callback([]);
    return () => {};
  }
};

/**
 * Lưu mới một Biên bản Nghiệm Thu Hoàn Thành lên Firestore
 */
export const saveCompletionReport = async (reportData) => {
  const cleanData = sanitizeData({
    ...reportData,
    id: reportData.id || `comp_${Date.now()}`,
    createdAt: reportData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  if (!isFirebaseConfigured || !db) {
    return cleanData;
  }

  try {
    const docRef = doc(db, COMPLETION_REPORTS_COLLECTION, cleanData.id);
    await setDoc(docRef, cleanData);
    console.log('[Firestore Cloud] Đã lưu biên bản nghiệm thu hoàn thành:', cleanData.id);
    return cleanData;
  } catch (error) {
    console.error('[Firestore Save Completion Report Error]', error);
    throw error;
  }
};

/**
 * Cập nhật một Biên bản Nghiệm Thu Hoàn Thành
 */
export const updateCompletionReport = async (reportId, updateData) => {
  const cleanData = sanitizeData({
    ...updateData,
    updatedAt: new Date().toISOString()
  });

  if (!isFirebaseConfigured || !db) {
    return cleanData;
  }

  try {
    const docRef = doc(db, COMPLETION_REPORTS_COLLECTION, reportId);
    await updateDoc(docRef, cleanData);
    console.log('[Firestore Cloud] Đã cập nhật biên bản nghiệm thu hoàn thành:', reportId);
    return cleanData;
  } catch (error) {
    console.error('[Firestore Update Completion Report Error]', error);
    throw error;
  }
};

/**
 * Xóa một Biên bản Nghiệm Thu Hoàn Thành
 */
export const deleteCompletionReport = async (reportId) => {
  if (!isFirebaseConfigured || !db) return true;
  try {
    const docRef = doc(db, COMPLETION_REPORTS_COLLECTION, reportId);
    await deleteDoc(docRef);
    console.log('[Firestore Cloud] Đã xóa biên bản nghiệm thu hoàn thành:', reportId);
    return true;
  } catch (error) {
    console.error('[Firestore Delete Completion Report Error]', error);
    throw error;
  }
};

// ============================================================================
// 7. TIÊU CHUẨN NGHIỆM THU DO ADMIN QUẢN LÝ (INSPECTION STANDARDS)
// ============================================================================
const STANDARDS_COLLECTION = 'inspection_standards';
const STANDARDS_DOC_ID = 'system_inspection_standards';

/**
 * Lắng nghe thời gian thực bộ tiêu chuẩn do Admin quản lý từ Firestore
 */
export const subscribeToStandards = (callback) => {
  if (!isFirebaseConfigured || !db) {
    return () => {};
  }

  try {
    const docRef = doc(db, STANDARDS_COLLECTION, STANDARDS_DOC_ID);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data());
      }
    }, (error) => {
      console.warn('[Firestore] Lỗi lắng nghe danh mục tiêu chuẩn:', error);
    });

    return unsubscribe;
  } catch (e) {
    console.warn('[Firestore Standards Exception]', e);
    return () => {};
  }
};

/**
 * Lưu bộ tiêu chuẩn do Admin quản lý lên Firestore
 */
export const saveInspectionStandards = async (standardsPayload) => {
  const cleanData = sanitizeData({
    ...standardsPayload,
    updatedAt: new Date().toISOString()
  });

  if (!isFirebaseConfigured || !db) {
    return cleanData;
  }

  try {
    const docRef = doc(db, STANDARDS_COLLECTION, STANDARDS_DOC_ID);
    await setDoc(docRef, cleanData);
    console.log('[Firestore Cloud] Đã lưu danh mục tiêu chuẩn của Admin thành công');
    return cleanData;
  } catch (error) {
    console.error('[Firestore Save Standards Error]', error);
    return cleanData;
  }
};
