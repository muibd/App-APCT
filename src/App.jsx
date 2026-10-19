import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Building2, Plus, Search, Filter, CheckCircle2, Clock, XCircle, 
  AlertTriangle, FileText, ChevronRight, Layers, MapPin, Calendar, 
  Send, Users, ShieldAlert, Award, HardHat, Eye, Briefcase, ShieldCheck,
  BellRing, LogOut, ArrowRight, UserCheck, BookOpen, Settings, Wrench, RotateCcw
} from 'lucide-react';

import Navbar from './components/Navbar';
import LoginScreen from './components/LoginScreen';
import PushNotificationToast from './components/PushNotificationToast';
import CreateRequestModal from './components/CreateRequestModal';
import InvitationDetailModal from './components/InvitationDetailModal';
import InspectionReportModal from './components/InspectionReportModal';
import AdminPortalModal from './components/AdminPortalModal';
import UserManagementView from './components/UserManagementView';
import ReportsListView from './components/ReportsListView';
import MobileProfileSheet from './components/MobileProfileSheet';
import PushGuideModal from './components/PushGuideModal';
import ConfirmDialogModal from './components/ConfirmDialogModal';
import { 
  MOCK_USERS, 
  MOCK_PROJECT, 
  INITIAL_REQUESTS, 
  INITIAL_REPORTS,
  STANDARD_CRITERIA_LIST,
  INITIAL_NOTIFICATIONS
} from './data/mockData';
import { getSuggestedStandards } from './data/standardsRules';

import { 
  saveInspectionRequest, 
  updateRecipientResponse, 
  saveInspectionReport, 
  subscribeToRequests,
  subscribeToReports,
  subscribeToNotifications,
  saveSystemNotification,
  markNotificationRead,
  markAllNotificationsRead,
  deleteSystemNotification,
  clearAllSystemNotifications,
  saveDeviceFCMToken,
  subscribeToUsers,
  saveSystemUser,
  deleteSystemUser,
  clearAllCloudInspectionData
} from './services/firestoreService';
import { 
  requestPushPermission, 
  showSystemNotification 
} from './services/notificationService';
import { 
  initOneSignal, 
  loginOneSignalUser, 
  requestOneSignalPermission, 
  sendOneSignalPush 
} from './services/oneSignalService';
import { isFirebaseConfigured } from './services/firebase';
import { 
  safeSaveLocalStorage, 
  getAllFromIndexedDB, 
  clearAllFromIndexedDB, 
  clearAllAPCTStorage 
} from './utils/storageHelper';

const USERS_STORAGE_KEY = 'apct_users_list';
const NOTIF_STORAGE_KEY = 'apct_notifications_list';
const REQUESTS_STORAGE_KEY = 'apct_requests_list';
const REPORTS_STORAGE_KEY = 'apct_reports_list';
const DATA_VERSION_KEY = 'apct_data_version';
const CURRENT_DATA_VERSION = '20261019_clean_fresh_v1';

// Tự động dọn dẹp các biên bản/phiếu cũ từ phiên kiểm thử trước để bắt đầu sạch sẽ
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const savedVer = localStorage.getItem(DATA_VERSION_KEY);
    if (savedVer !== CURRENT_DATA_VERSION) {
      localStorage.removeItem(REQUESTS_STORAGE_KEY);
      localStorage.removeItem(REPORTS_STORAGE_KEY);
      localStorage.removeItem(NOTIF_STORAGE_KEY);
      localStorage.setItem(DATA_VERSION_KEY, CURRENT_DATA_VERSION);
      clearAllFromIndexedDB('requests');
      clearAllFromIndexedDB('reports');
    }
  } catch (e) {
    console.warn('Lỗi kiểm tra phiên bản dữ liệu:', e);
  }
}

export default function App() {
  // Quản lý danh sách cán bộ: ưu tiên localStorage, tự chuẩn hóa password & status
  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem(USERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(u => {
            const mock = MOCK_USERS.find(m => m.uid === u.uid);
            return {
              ...u,
              role: u.role || mock?.role || 'CONTRACTOR',
              leaderId: u.leaderId !== undefined ? u.leaderId : mock?.leaderId,
              subordinateIds: u.subordinateIds !== undefined ? u.subordinateIds : mock?.subordinateIds,
              password: u.password || '123456',
              status: u.status || 'ACTIVE'
            };
          });
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc danh sách cán bộ từ localStorage:', e);
    }
    return MOCK_USERS;
  });

  const [requests, setRequests] = useState(() => {
    try {
      const saved = localStorage.getItem(REQUESTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Lỗi đọc requests từ localStorage:', e);
    }
    return INITIAL_REQUESTS;
  });

  const [reports, setReports] = useState(() => {
    try {
      const saved = localStorage.getItem(REPORTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Lỗi đọc reports từ localStorage:', e);
    }
    return INITIAL_REPORTS;
  });

  const [standards, setStandards] = useState(STANDARD_CRITERIA_LIST);

  // User Authentication State: Lấy từ localStorage nếu có, mặc định là null để hiện màn hình Login
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('apct_logged_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Tự động đồng bộ users vào localStorage
  useEffect(() => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.warn('Lỗi lưu users vào localStorage:', e);
    }
  }, [users]);

  // Quản lý thông báo thực tế (Real Notifications State)
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(NOTIF_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(n => !n.id?.startsWith('notif_init_'));
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc notifications:', e);
    }
    return [];
  });

  // 0. Khôi phục dữ liệu từ IndexedDB (tránh 100% mất dữ liệu khi LocalStorage bị đầy quota hoặc F5)
  useEffect(() => {
    // Nếu phiên bản dữ liệu chưa đồng nhất thì không khôi phục dữ liệu cũ
    if (localStorage.getItem(DATA_VERSION_KEY) !== CURRENT_DATA_VERSION) {
      return;
    }

    getAllFromIndexedDB('reports').then(idbReports => {
      if (idbReports && idbReports.length > 0) {
        setReports(prev => {
          const map = new Map();
          prev.forEach(r => map.set(r.reportNumber || r.id, r));
          idbReports.forEach(ir => {
            const key = ir.reportNumber || ir.id;
            const existing = map.get(key);
            if (!existing) {
              map.set(key, ir);
            } else {
              const idbTime = new Date(ir.updatedAt || ir.createdAt || 0).getTime();
              const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
              const idbDefectCount = Array.isArray(ir.defectPhotos) ? ir.defectPhotos.length : 0;
              const existingDefectCount = Array.isArray(existing.defectPhotos) ? existing.defectPhotos.length : 0;
              const idbRectCount = Array.isArray(ir.rectification?.photos) ? ir.rectification.photos.length : 0;
              const existingRectCount = Array.isArray(existing.rectification?.photos) ? existing.rectification.photos.length : 0;

              if (idbTime >= existingTime || idbDefectCount > existingDefectCount || idbRectCount > existingRectCount) {
                map.set(key, { ...existing, ...ir });
              }
            }
          });
          const merged = Array.from(map.values());
          safeSaveLocalStorage(REPORTS_STORAGE_KEY, merged);
          return merged;
        });
      }
    });

    getAllFromIndexedDB('requests').then(idbRequests => {
      if (idbRequests && idbRequests.length > 0) {
        setRequests(prev => {
          const map = new Map();
          prev.forEach(r => map.set(r.requestNumber || r.id, r));
          idbRequests.forEach(ir => {
            const key = ir.requestNumber || ir.id;
            const existing = map.get(key);
            if (!existing) {
              map.set(key, ir);
            } else if (existing.status === 'COMPLETED') {
              map.set(key, { ...existing, ...ir, status: 'COMPLETED' });
            } else if (ir.status === 'RECTIFIED' && existing.status !== 'RECTIFIED') {
              map.set(key, { ...existing, ...ir });
            }
          });
          const merged = Array.from(map.values());
          safeSaveLocalStorage(REQUESTS_STORAGE_KEY, merged);
          return merged;
        });
      }
    });
  }, []);

  // 1. Đồng bộ Real-Time Phiếu yêu cầu từ Firestore (Lấy Firestore làm chuẩn, chống đè mất ảnh cục bộ)
  useEffect(() => {
    const unsubscribe = subscribeToRequests((cloudRequests) => {
      setRequests(prev => {
        // NẾU CLOUD TRỐNG (ĐÃ XÓA SẠCH TRÊN FIRESTORE HOẶC BẮT ĐẦU TEST LẠI)
        if (!cloudRequests || cloudRequests.length === 0) {
          safeSaveLocalStorage(REQUESTS_STORAGE_KEY, []);
          clearAllFromIndexedDB('requests');
          return [];
        }

        const map = new Map();
        // Lấy danh sách từ Firestore làm Single Source of Truth
        cloudRequests.forEach(item => {
          const key = item.requestNumber || item.id;
          const local = prev.find(r => (r.id && r.id === item.id) || (r.requestNumber && r.requestNumber === item.requestNumber));
          if (!local) {
            map.set(key, item);
          } else {
            const localHasRectification = local.status === 'RECTIFIED' || Boolean(local.rectificationPhotos?.length) || Boolean(local.rectificationNotes);
            const cloudHasRectification = item.status === 'RECTIFIED' || Boolean(item.rectificationPhotos?.length) || Boolean(item.rectificationNotes);

            if (localHasRectification && !cloudHasRectification) {
              map.set(key, { ...item, ...local });
            } else {
              const cloudTime = new Date(item.updatedAt || item.createdAt || 0).getTime();
              const localTime = new Date(local.updatedAt || local.createdAt || 0).getTime();
              if (cloudTime >= localTime) {
                map.set(key, item);
              } else {
                map.set(key, { ...item, ...local });
              }
            }
          }
        });

        // Giữ lại bản ghi nháp cục bộ chưa kịp đồng bộ (nếu có)
        prev.forEach(localItem => {
          if (localItem._isOfflineDraft && !map.has(localItem.requestNumber || localItem.id)) {
            map.set(localItem.requestNumber || localItem.id, localItem);
          }
        });

        const merged = Array.from(map.values());
        merged.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        safeSaveLocalStorage(REQUESTS_STORAGE_KEY, merged);
        return merged;
      });
    });
    return () => unsubscribe();
  }, []);

  // 2. Đồng bộ Real-Time Biên bản nghiệm thu từ Firestore (Lấy Firestore làm chuẩn)
  useEffect(() => {
    const unsubscribe = subscribeToReports((cloudReports) => {
      setReports(prev => {
        // NẾU CLOUD TRỐNG (ĐÃ XÓA SẠCH TRÊN FIRESTORE HOẶC BẮT ĐẦU TEST LẠI)
        if (!cloudReports || cloudReports.length === 0) {
          safeSaveLocalStorage(REPORTS_STORAGE_KEY, []);
          clearAllFromIndexedDB('reports');
          return [];
        }

        const map = new Map();
        cloudReports.forEach(item => {
          const key = item.reportNumber || item.id;
          const local = prev.find(r => (r.id && r.id === item.id) || (r.reportNumber && r.reportNumber === item.reportNumber));
          if (!local) {
            map.set(key, item);
          } else {
            // NẾU LOCAL ĐÃ ĐƯỢC ĐVTC SỬA CHỮA (RECTIFIED) VÀ CÓ ẢNH THỰC TẾ:
            // Tuyệt đối không cho bản ghi cũ REJECTED từ cloud ghi đè làm mất ảnh!
            const localHasRectification = local.status === 'RECTIFIED' || Boolean(local.rectification?.photos?.length);
            const cloudHasRectification = item.status === 'RECTIFIED' || Boolean(item.rectification?.photos?.length);

            if (localHasRectification && !cloudHasRectification) {
              map.set(key, { ...item, ...local });
            } else {
              const cloudTime = new Date(item.updatedAt || item.createdAt || 0).getTime();
              const localTime = new Date(local.updatedAt || local.createdAt || 0).getTime();
              if (cloudTime >= localTime) {
                map.set(key, item);
              } else {
                map.set(key, { ...item, ...local });
              }
            }
          }
        });

        prev.forEach(localItem => {
          if (localItem._isOfflineDraft && !map.has(localItem.reportNumber || localItem.id)) {
            map.set(localItem.reportNumber || localItem.id, localItem);
          }
        });

        const merged = Array.from(map.values());
        merged.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        safeSaveLocalStorage(REPORTS_STORAGE_KEY, merged);
        return merged;
      });
    });
    return () => unsubscribe();
  }, []);

  // 3. Đồng bộ Real-Time Thông báo hệ thống từ Firestore
  const prevNotifIdsRef = useRef(new Set());
  const isInitialNotifMountRef = useRef(true);

  useEffect(() => {
    const unsubscribe = subscribeToNotifications((cloudNotifs) => {
      setNotifications(cloudNotifs);

      // Nếu có thông báo mới sau lần tải đầu tiên -> Kích hoạt Pop-up Toast & Native Push
      if (!isInitialNotifMountRef.current) {
        const newIncoming = cloudNotifs.filter(n => !prevNotifIdsRef.current.has(n.id) && !n.isRead);
        if (newIncoming.length > 0) {
          const latest = newIncoming[0];
          setActivePushToast(latest);
          showSystemNotification(latest.title, latest.body);
        }
      } else {
        isInitialNotifMountRef.current = false;
      }

      prevNotifIdsRef.current = new Set(cloudNotifs.map(n => n.id));
    });

    return () => unsubscribe();
  }, []);

  // 4. Đồng bộ Real-Time Danh sách Cán bộ từ Firestore (Admin thêm người sẽ lưu trữ và sync real-time)
  useEffect(() => {
    const unsubscribe = subscribeToUsers((cloudUsers) => {
      if (cloudUsers && cloudUsers.length > 0) {
        setUsers(prev => {
          const merged = [...prev];
          cloudUsers.forEach(cu => {
            const idx = merged.findIndex(u => u.uid === cu.uid);
            if (idx >= 0) {
              merged[idx] = { ...merged[idx], ...cu };
            } else {
              merged.push(cu);
            }
          });
          return merged;
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // 5. Khởi tạo OneSignal Web Push SDK
  useEffect(() => {
    initOneSignal((optedIn) => {
      if (optedIn) {
        setPushPermissionGranted(true);
      }
    });
  }, []);

  // 5. Gắn nhãn người dùng vào OneSignal khi đăng nhập/đổi vai trò
  useEffect(() => {
    if (currentUser) {
      loginOneSignalUser(currentUser);
    }
  }, [currentUser]);

  // Tự động lưu notifications vào localStorage làm cache offline
  useEffect(() => {
    try {
      localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(notifications));
    } catch (e) {
      console.warn('Lỗi lưu notifications:', e);
    }
  }, [notifications]);

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    markAllNotificationsRead(notifications);
  };

  const handleMarkNotificationAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    markNotificationRead(id);
  };

  const handleDeleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    deleteSystemNotification(id);
  };

  const handleClearAllNotifications = () => {
    const current = [...notifications];
    setNotifications([]);
    clearAllSystemNotifications(current);
  };

  const currentRole = currentUser?.role || 'CONTRACTOR';

  // Push Permission State
  const [pushPermissionGranted, setPushPermissionGranted] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState('REQUESTS'); // 'REQUESTS' | 'INVITATIONS' | 'REPORTS' | 'ADMIN_USERS' | 'ADMIN_STANDARDS'

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [initialOpenRectify, setInitialOpenRectify] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);

  // Push Notification Toast state
  const [activePushToast, setActivePushToast] = useState(null);

  // Push Notification Guide Modal state
  const [pushGuideModal, setPushGuideModal] = useState({
    isOpen: false,
    reason: null
  });

  // Khóa cố định màn hình nền khi có bất kỳ popup / modal nào được mở
  const isAnyModalOpen = Boolean(
    isCreateModalOpen || 
    selectedRequest || 
    selectedReport || 
    isAdminModalOpen || 
    isMobileProfileOpen || 
    pushGuideModal.isOpen
  );

  useEffect(() => {
    if (isAnyModalOpen) {
      document.body.classList.add('modal-open');
      document.documentElement.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');
    };
  }, [isAnyModalOpen]);

  // Login handler
  const handleLogin = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('apct_logged_user', JSON.stringify(user));
    } catch (e) {
      console.warn(e);
    }
  };

  // Switch User handler for mobile testing
  const handleSwitchUser = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('apct_logged_user', JSON.stringify(user));
    } catch (e) {
      console.warn('Lỗi switch user:', e);
    }
  };

  // Logout handler
  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('apct_logged_user');
    } catch (e) {
      console.warn(e);
    }
  };

  // Request Push Permission Handler
  const handleEnablePush = async () => {
    // Kích hoạt đồng thời cả OneSignal Web Push
    requestOneSignalPermission().catch(console.warn);

    const res = await requestPushPermission();
    if (res.granted) {
      setPushPermissionGranted(true);
      if (res.token) {
        saveDeviceFCMToken(currentUser?.uid, currentUser?.role, res.token);
      }
      showSystemNotification(
        '🔔 APCT Nghiệm Thu: Đã bật thông báo!',
        'Bạn sẽ nhận được thông báo ngay cả khi đang tắt màn hình hoặc không mở ứng dụng.'
      );
      setActivePushToast({
        id: Date.now(),
        title: 'Bật thông báo thành công! 🎉',
        body: 'Thiết bị của bạn đã sẵn sàng nhận thông báo nghiệm thu từ hệ thống.',
        time: 'Vừa xong'
      });
    } else {
      setPushGuideModal({
        isOpen: true,
        reason: res.reason || 'unsupported'
      });
    }
  };

  // QUẢN LÝ CÁN BỘ (Personnel Management Handlers - Sync Firestore Cloud & Two-Way Hierarchy Sync)
  const handleAddUser = async (newUser) => {
    setUsers(prev => {
      let updatedUsers = [newUser, ...prev];

      // Nếu tạo Trưởng có danh sách cấp dưới (subordinateIds) -> cập nhật leaderId cho các cấp dưới đó
      if ((newUser.role === 'LEAD_SUPERVISOR' || newUser.role === 'LEAD_INVESTOR') && Array.isArray(newUser.subordinateIds)) {
        updatedUsers = updatedUsers.map(u => {
          if (u.uid === newUser.uid) return u;
          if (newUser.subordinateIds.includes(u.uid)) {
            return { ...u, leaderId: newUser.uid };
          }
          return u;
        });
      }

      // Nếu tạo cán bộ cấp dưới có leaderId -> thêm cán bộ này vào subordinateIds của vị Trưởng đó
      if (newUser.leaderId) {
        updatedUsers = updatedUsers.map(u => {
          if (u.uid === newUser.leaderId) {
            const curSubs = Array.isArray(u.subordinateIds) ? u.subordinateIds : [];
            if (!curSubs.includes(newUser.uid)) {
              return { ...u, subordinateIds: [...curSubs, newUser.uid] };
            }
          }
          return u;
        });
      }

      safeSaveLocalStorage(USERS_STORAGE_KEY, updatedUsers);
      return updatedUsers;
    });

    try {
      await saveSystemUser(newUser);
    } catch (e) {
      console.warn('Lỗi lưu cán bộ lên Firestore:', e);
    }
  };

  const handleUpdateUser = async (updatedUser) => {
    setUsers(prev => {
      let updatedUsers = prev.map(u => u.uid === updatedUser.uid ? updatedUser : u);

      // Nếu cập nhật Trưởng -> đồng bộ hai chiều với các cấp dưới
      if (updatedUser.role === 'LEAD_SUPERVISOR' || updatedUser.role === 'LEAD_INVESTOR') {
        const newSubs = Array.isArray(updatedUser.subordinateIds) ? updatedUser.subordinateIds : [];
        updatedUsers = updatedUsers.map(u => {
          if (u.uid === updatedUser.uid) return u;
          if (newSubs.includes(u.uid)) {
            return { ...u, leaderId: updatedUser.uid };
          }
          if (u.leaderId === updatedUser.uid && !newSubs.includes(u.uid)) {
            return { ...u, leaderId: null };
          }
          return u;
        });
      }

      // Nếu cập nhật cán bộ thường có leaderId -> đồng bộ vào subordinateIds của Trưởng
      if (updatedUser.role === 'SUPERVISOR' || updatedUser.role === 'INVESTOR') {
        updatedUsers = updatedUsers.map(u => {
          if (u.uid === updatedUser.uid) return u;
          const curSubs = Array.isArray(u.subordinateIds) ? u.subordinateIds : [];
          if (u.uid === updatedUser.leaderId) {
            if (!curSubs.includes(updatedUser.uid)) {
              return { ...u, subordinateIds: [...curSubs, updatedUser.uid] };
            }
          } else if (curSubs.includes(updatedUser.uid) && u.uid !== updatedUser.leaderId) {
            return { ...u, subordinateIds: curSubs.filter(id => id !== updatedUser.uid) };
          }
          return u;
        });
      }

      safeSaveLocalStorage(USERS_STORAGE_KEY, updatedUsers);
      return updatedUsers;
    });

    if (currentUser?.uid === updatedUser.uid) {
      const refreshedCurrentUser = {
        ...currentUser,
        ...updatedUser
      };
      setCurrentUser(refreshedCurrentUser);
      try {
        localStorage.setItem('apct_logged_user', JSON.stringify(refreshedCurrentUser));
      } catch (e) {
        console.warn(e);
      }
    }

    try {
      await saveSystemUser(updatedUser);
    } catch (e) {
      console.warn('Lỗi cập nhật cán bộ lên Firestore:', e);
    }
  };

  const handleDeleteUser = async (userId) => {
    setUsers(prev => {
      const filtered = prev.filter(u => u.uid !== userId).map(u => {
        if (u.leaderId === userId) return { ...u, leaderId: null };
        if (Array.isArray(u.subordinateIds) && u.subordinateIds.includes(userId)) {
          return { ...u, subordinateIds: u.subordinateIds.filter(id => id !== userId) };
        }
        return u;
      });
      safeSaveLocalStorage(USERS_STORAGE_KEY, filtered);
      return filtered;
    });

    if (currentUser?.uid === userId) {
      handleLogout();
    }
    try {
      await deleteSystemUser(userId);
    } catch (e) {
      console.warn('Lỗi xóa cán bộ trên Firestore:', e);
    }
  };

  const handleToggleUserStatus = (userId) => {
    setUsers(prev => prev.map(u => {
      if (u.uid === userId) {
        const nextStatus = (u.status || 'ACTIVE') === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  // Update user role in Admin Portal
  const handleUpdateUserRole = (uid, newRole) => {
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole } : u));
    if (currentUser?.uid === uid) {
      const updated = { ...currentUser, role: newRole };
      setCurrentUser(updated);
      try {
        localStorage.setItem('apct_logged_user', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
    }
  };

  // Modal xác nhận & thông báo tùy chỉnh chuẩn APCT (Thay thế 100% window.confirm và alert)
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: 'confirm',
    title: '',
    message: '',
    confirmText: 'Xác nhận',
    cancelText: 'Hủy bỏ',
    loading: false,
    onConfirm: null,
    onCancel: null
  });

  const showConfirm = ({
    title,
    message,
    type = 'confirm',
    confirmText = 'Xác nhận',
    cancelText = 'Hủy bỏ',
    onConfirm,
    onCancel
  }) => {
    setConfirmDialog({
      isOpen: true,
      type,
      title,
      message,
      confirmText,
      cancelText,
      loading: false,
      onConfirm: async () => {
        if (onConfirm) {
          try {
            setConfirmDialog(prev => ({ ...prev, loading: true }));
            await onConfirm();
          } finally {
            setConfirmDialog(prev => ({ ...prev, isOpen: false, loading: false }));
          }
        } else {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      },
      onCancel: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        if (onCancel) onCancel();
      }
    });
  };

  const showAlert = ({
    title,
    message,
    type = 'info',
    confirmText = 'Đã hiểu',
    onConfirm
  }) => {
    setConfirmDialog({
      isOpen: true,
      type,
      title,
      message,
      confirmText,
      cancelText: null, // Không hiện nút Hủy cho thông báo dạng alert
      loading: false,
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        if (onConfirm) onConfirm();
      },
      onCancel: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Xóa sạch toàn bộ dữ liệu phiếu, biên bản và thông báo để kiểm thử lại từ đầu
  const handleResetAllData = () => {
    showConfirm({
      type: 'danger',
      title: 'BẠN CÓ CHẮC CHẮN MUỐN XÓA TẤT CẢ DỮ LIỆU?',
      message: 'Toàn bộ Phiếu yêu cầu, Biên bản nghiệm thu và Thông báo trên Cloud Firestore cũng như bộ nhớ máy sẽ bị xóa sạch.\n\nBạn sẽ bắt đầu kiểm thử lại ứng dụng hoàn toàn từ đầu (0 phiếu, 0 biên bản).',
      confirmText: 'Xóa Toàn Bộ Dữ Liệu',
      cancelText: 'Hủy Bỏ',
      onConfirm: async () => {
        try {
          await clearAllCloudInspectionData();
          await clearAllAPCTStorage();
          setRequests([]);
          setReports([]);
          setNotifications([]);
          showAlert({
            type: 'success',
            title: 'Đã Xóa Thành Công!',
            message: 'Toàn bộ dữ liệu kiểm thử đã được dọn sạch.\nBây giờ bạn có thể bắt đầu tạo phiếu nghiệm thu mới từ đầu.',
            confirmText: 'Bắt đầu ngay'
          });
        } catch (err) {
          console.error("Lỗi xóa dữ liệu:", err);
          showAlert({
            type: 'danger',
            title: 'Lỗi Xóa Dữ Liệu',
            message: 'Có lỗi khi xóa dữ liệu: ' + (err.message || err),
            confirmText: 'Đóng'
          });
        }
      }
    });
  };

  // 1. Khi ĐVTC TẠO PHIẾU MỚI: Tự động khởi tạo cả Phiếu yêu cầu & Biên bản nghiệm thu
  const handleCreateRequest = async (newRequest) => {
    const isMaterial = newRequest.inspectionType === 'MATERIAL';
    const newReportId = `rep_${Date.now()}`;
    const reportNum = newRequest.requestNumber 
      ? newRequest.requestNumber.replace('PYC', isMaterial ? 'BBNT-VL' : 'BBNT-APG') 
      : `0${Math.floor(Math.random() * 80) + 10}/${isMaterial ? 'BBNT-VL' : 'BBNT-APG'}`;
    const docNum = `TLCC-0${Math.floor(Math.random() * 80) + 10}/2026`;
    const today = new Date();
    const cityDate = `Cần Thơ, ngày ${String(today.getDate()).padStart(2, '0')} tháng ${String(today.getMonth() + 1).padStart(2, '0')} năm ${today.getFullYear()}`;

    // Lấy thông tin cán bộ TVGS và CĐT từ danh sách tiếp nhận
    const tvgsRecipient = newRequest.assignedRecipients?.find(r => r.role === 'SUPERVISOR' || r.role === 'LEAD_SUPERVISOR');
    const cdtRecipient = newRequest.assignedRecipients?.find(r => r.role === 'INVESTOR' || r.role === 'LEAD_INVESTOR');

    const appliedStandards = (newRequest.standardsApplied && newRequest.standardsApplied.length > 0)
      ? newRequest.standardsApplied
      : getSuggestedStandards(newRequest.taskContent || newRequest.itemName, isMaterial ? 'MATERIAL' : 'WORK');

    const newReport = {
      id: newReportId,
      requestId: newRequest.id,
      requestNumber: newRequest.requestNumber,
      reportNumber: reportNum,
      referenceDocNumber: docNum,
      cityDate: cityDate,
      inspectionType: newRequest.inspectionType || 'WORK',
      reportTemplate: isMaterial ? 'FORM_12' : 'CONSTRUCTION_WORK',
      materialDetails: newRequest.materialDetails || null,
      projectInfo: {
        projectName: newRequest.projectName,
        buildingName: newRequest.buildingName,
        itemName: newRequest.itemName,
        location: newRequest.location
      },
      inspectionObject: isMaterial 
        ? `Nghiệm thu vật liệu đầu vào: ${newRequest.materialDetails?.name || newRequest.taskContent}` 
        : newRequest.taskContent,
      time: {
        startTime: newRequest.startTime || `${newRequest.scheduledTime}`,
        endTime: newRequest.endTime || `16h30, ${newRequest.scheduledTime?.includes(' ') ? newRequest.scheduledTime.split(' ')[1] : 'hôm nay'}`,
        place: newRequest.inspectionPlace
      },
      attendees: {
        investor: {
          company: cdtRecipient?.company || 'Công ty TNHH An Phú Cần Thơ',
          person: cdtRecipient?.fullName || 'Ông Bành Nguyễn Hậu',
          position: cdtRecipient?.position || 'Cán bộ ban QLDA',
          email: cdtRecipient?.email || '',
          uid: cdtRecipient?.uid || '',
          signed: false
        },
        supervisor: {
          company: tvgsRecipient?.company || 'Công ty CP TVXD và TM GELICON',
          person: tvgsRecipient?.fullName || 'KS. Võ Văn Tón',
          position: tvgsRecipient?.position || 'Cán bộ tư vấn giám sát',
          email: tvgsRecipient?.email || '',
          uid: tvgsRecipient?.uid || '',
          signed: false
        },
        contractor: {
          company: newRequest.contractorCompany || 'Công ty CP Xây dựng An Phú Gia',
          person: newRequest.createdByName || 'KS. Lê Văn Kỹ Thuật',
          position: newRequest.createdByRole || 'Kỹ thuật hiện trường',
          signed: true
        }
      },
      assignedRecipients: newRequest.assignedRecipients || [],
      standardsApplied: appliedStandards,
      qualityAssessment: { matchDesign: true, matchStandards: true, matchTechnical: true, otherOpinions: 'Không' },
      conclusion: { isAccepted: true, repairRequired: 'Không có', otherRequirements: 'Không có' },
      status: 'PENDING_APPROVAL',
      defectPhotos: [],
      evidencePhotos: newRequest.evidencePhotos || [],
      rectification: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const finalRequest = {
      ...newRequest,
      hasReport: true,
      reportId: newReportId,
      status: 'SENT',
      evidencePhotos: newRequest.evidencePhotos || []
    };

    const pushPayload = {
      id: `notif_${Date.now()}`,
      type: 'INVITATION',
      title: '📋 Phiếu yêu cầu & Biên bản mới: ' + finalRequest.taskContent.slice(0, 42) + '...',
      body: `ĐVTC ${finalRequest.contractorCompany} đã phát hành Phiếu yêu cầu & Biên bản nghiệm thu. Lịch hẹn lúc ${finalRequest.scheduledTime} tại ${finalRequest.buildingName}.`,
      actionText: 'Mở biên bản nghiệm thu',
      targetReportId: newReportId,
      targetRequestId: finalRequest.id,
      targetRoles: ['SUPERVISOR', 'LEAD_SUPERVISOR', 'CONTRACTOR'], // Chỉ thông báo TVGS và ĐVTC trước! CĐT chỉ nhận sau khi TVGS duyệt!
      createdAt: new Date().toISOString(),
      time: 'Vừa xong',
      isRead: false
    };

    setActivePushToast(pushPayload);
    showSystemNotification(pushPayload.title, pushPayload.body);

    // Cập nhật ngay lập tức vào state nội bộ và cache localStorage (Optimistic UI Update)
    // Giúp danh sách cập nhật tức thì 100% không bị trễ hay mất phiếu
    setRequests(prev => {
      const updated = [finalRequest, ...prev.filter(r => r.id !== finalRequest.id)];
      try {
        localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });

    setReports(prev => {
      const updated = [newReport, ...prev.filter(r => r.id !== newReport.id)];
      try {
        localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });

    setNotifications(prev => {
      const updated = [pushPayload, ...prev];
      try {
        localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });

    try {
      await saveInspectionRequest(finalRequest);
      await saveInspectionReport(newReport);
      await saveSystemNotification(pushPayload);

      // Kích hoạt nổ thông báo màn hình khóa qua OneSignal: CHỈ GỬI CHO TVGS!
      sendOneSignalPush({
        title: '📋 Phiếu yêu cầu & Biên bản mới: ' + (finalRequest.requestNumber || 'Mới'),
        message: `ĐVTC ${finalRequest.contractorCompany} gửi TVGS kiểm tra: ${finalRequest.taskContent.slice(0, 50)}...`,
        targetRoles: ['SUPERVISOR', 'LEAD_SUPERVISOR'],
        url: 'https://app-apct-nghiemthu.web.app'
      }).catch(console.warn);
    } catch (e) {
      console.warn('Lưu Firestore lỗi:', e);
    }
  };

  // Khởi tạo biên bản nghiệm thu mới hoặc mở biên bản hiện có
  const handleOpenOrCreateReport = async (reportIdOrReqId, isCreateNew = false) => {
    // 1. Kiểm tra xem đã có report nào khớp với reportIdOrReqId hay chưa
    let rep = reports.find(r => r.id === reportIdOrReqId || r.requestId === reportIdOrReqId);
    let targetReq = requests.find(r => r.id === reportIdOrReqId || r.reportId === reportIdOrReqId);
    if (!rep) {
      if (targetReq?.reportId) {
        rep = reports.find(r => r.id === targetReq.reportId);
      }
      if (!rep && targetReq?.id) {
        rep = reports.find(r => r.requestId === targetReq.id);
      }
      if (!rep && targetReq?.requestNumber) {
        rep = reports.find(r => r.requestNumber === targetReq.requestNumber || r.reportNumber === targetReq.requestNumber.replace('PYC', 'BBNT'));
      }
    }
    if (!targetReq && rep) {
      targetReq = requests.find(r => 
        r.id === rep.requestId || 
        r.reportId === rep.id ||
        (rep.requestNumber && r.requestNumber === rep.requestNumber) ||
        (rep.reportNumber && r.requestNumber === rep.reportNumber.replace('BBNT', 'PYC'))
      );
    }

    // Nếu đã tìm thấy report hiện có -> Luôn luôn mở report đó, TUYỆT ĐỐI không khởi tạo đè lên làm mất dữ liệu!
    if (rep) {
      // ĐỒNG BỘ TRẠNG THÁI KHẮC PHỤC:
      const isCompleted = rep.status === 'COMPLETED' || 
        (Boolean(rep.attendees?.supervisor?.signed) && Boolean(rep.attendees?.investor?.signed));
      if (!isCompleted) {
        if (rep.status === 'RECTIFIED' || targetReq?.status === 'RECTIFIED') {
          const actualPhotos = (Array.isArray(rep.rectification?.photos) && rep.rectification.photos.length > 0)
            ? rep.rectification.photos
            : (Array.isArray(targetReq?.rectificationPhotos) && targetReq.rectificationPhotos.length > 0)
            ? targetReq.rectificationPhotos
            : [];

          rep = {
            ...rep,
            status: 'RECTIFIED',
            rectification: {
              description: rep.rectification?.description || targetReq?.rectificationNotes || 'Đã sửa chữa khắc phục theo đúng yêu cầu',
              photos: actualPhotos,
              suggestedTime: rep.rectification?.suggestedTime || '16h30 ngày hôm nay',
              submittedBy: rep.rectification?.submittedBy || {
                name: targetReq?.createdByName || 'KS. Lê Văn Kỹ Thuật',
                role: 'CONTRACTOR',
                roleTitle: 'Kỹ Thuật Đơn Vị Thi Công',
                company: 'Công ty CP Xây dựng An Phú Gia',
                timestamp: targetReq?.updatedAt || new Date().toISOString()
              }
            },
            updatedAt: rep.updatedAt || new Date().toISOString()
          };
        }
      }

      setSelectedReport(rep);
      return;
    }

    // Chỉ khi thật sự chưa có report nào tồn tại thì mới khởi tạo
    if (!targetReq) {
      targetReq = requests.find(r => r.id === reportIdOrReqId || r.reportId === reportIdOrReqId);
    }
    if (!targetReq) return;

    const newReportId = `rep_${Date.now()}`;
    const isMaterial = targetReq.inspectionType === 'MATERIAL';
    const appliedStandards = (targetReq.standardsApplied && targetReq.standardsApplied.length > 0)
      ? targetReq.standardsApplied
      : getSuggestedStandards(targetReq.taskContent || targetReq.itemName, isMaterial ? 'MATERIAL' : 'WORK');

    const newReport = {
      id: newReportId,
      requestId: targetReq.id,
      requestNumber: targetReq.requestNumber,
      reportNumber: targetReq.requestNumber 
        ? targetReq.requestNumber.replace('PYC', isMaterial ? 'BBNT-VL' : 'BBNT-APG') 
        : `0${Math.floor(Math.random() * 80) + 10}/${isMaterial ? 'BBNT-VL' : 'BBNT-APG'}`,
      referenceDocNumber: `TLCC-0${Math.floor(Math.random() * 80) + 10}/2026`,
      cityDate: `Cần Thơ, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`,
      inspectionType: targetReq.inspectionType || 'WORK',
      reportTemplate: isMaterial ? 'FORM_12' : 'CONSTRUCTION_WORK',
      materialDetails: targetReq.materialDetails || null,
      projectInfo: {
        projectName: targetReq.projectName,
        buildingName: targetReq.buildingName,
        itemName: targetReq.itemName,
        location: targetReq.location
      },
      inspectionObject: isMaterial 
        ? `Nghiệm thu vật liệu đầu vào: ${targetReq.materialDetails?.name || targetReq.taskContent}` 
        : targetReq.taskContent,
      time: {
        startTime: targetReq.startTime || `${targetReq.scheduledTime}`,
        endTime: targetReq.endTime || `16h30, ${targetReq.scheduledTime?.includes(' ') ? targetReq.scheduledTime.split(' ')[1] : 'hôm nay'}`,
        place: targetReq.inspectionPlace
      },
      attendees: {
        investor: { company: 'Công ty TNHH An Phú Cần Thơ', person: 'Ông Bành Nguyễn Hậu', position: 'Cán bộ ban QLDA', signed: false },
        supervisor: { company: 'Công ty CP TVXD và TM GELICON', person: 'KS. Võ Văn Tón', position: 'Cán bộ tư vấn giám sát', signed: false },
        contractor: { company: 'Công ty CP Xây dựng An Phú Gia', person: targetReq.createdByName || 'KS. Lê Văn Kỹ Thuật', position: targetReq.createdByRole || 'Kỹ thuật hiện trường', signed: true }
      },
      standardsApplied: appliedStandards,
      qualityAssessment: { matchDesign: true, matchStandards: true, matchTechnical: true, otherOpinions: 'Không' },
      conclusion: { isAccepted: true, repairRequired: 'Không có', otherRequirements: 'Không có' },
      status: 'PENDING_APPROVAL',
      defectPhotos: [],
      evidencePhotos: targetReq.evidencePhotos || [],
      rectification: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedReq = {
      ...targetReq,
      hasReport: true,
      reportId: newReport.id,
      updatedAt: new Date().toISOString()
    };

    setReports(prev => {
      const matchFn = r => r.id === newReport.id || (newReport.reportNumber && r.reportNumber === newReport.reportNumber);
      const filtered = prev.filter(r => !matchFn(r));
      const next = [newReport, ...filtered];
      safeSaveLocalStorage(REPORTS_STORAGE_KEY, next);
      return next;
    });

    setRequests(prev => {
      const next = prev.map(r => r.id === targetReq.id ? updatedReq : r);
      safeSaveLocalStorage(REQUESTS_STORAGE_KEY, next);
      return next;
    });

    try {
      await saveInspectionReport(newReport);
      await saveInspectionRequest(updatedReq);
    } catch (e) {
      console.warn('Lưu báo cáo Firestore lỗi:', e);
    }

    setSelectedReport(newReport);
  };

  // Xử lý khi Cán bộ KHÔNG ĐỒNG Ý NGHIỆM THU từ chối biên bản
  const handleRejectReport = async (reportId, rejectData) => {
    // 1. Tìm đúng đối tượng report cần từ chối
    const targetReport = reports.find(r => r.id === reportId || r.id === selectedReport?.id) || selectedReport;
    if (!targetReport) return;

    const updatedConclusion = {
      ...(targetReport.conclusion || {}),
      isAccepted: false,
      rejectionReason: rejectData.rejectionReason,
      repairRequired: rejectData.repairRequired,
      deadline: rejectData.deadline,
      rejectedBy: rejectData.rejectedBy
    };

    const previousHistory = targetReport.rectificationHistory || [];
    const updatedHistory = rejectData.rectificationHistory || (
      targetReport.rectification 
        ? [...previousHistory, { ...targetReport.rectification, rejectedAt: new Date().toISOString(), rejectionReason: rejectData.rejectionReason }]
        : previousHistory
    );

    const isInvestorReject = rejectData.rejectedBy?.role === 'INVESTOR';
    const keepSupervisorSigned = isInvestorReject ? Boolean(targetReport.attendees?.supervisor?.signed) : false;

    const updatedReport = {
      ...targetReport,
      id: targetReport.id || reportId,
      conclusion: updatedConclusion,
      attendees: {
        ...targetReport.attendees,
        supervisor: {
          ...targetReport.attendees?.supervisor,
          signed: keepSupervisorSigned
        },
        investor: {
          ...targetReport.attendees?.investor,
          signed: false
        }
      },
      defectPhotos: rejectData.defectPhotos || [],
      status: 'REJECTED',
      rectification: null,
      rectificationHistory: updatedHistory,
      updatedAt: new Date().toISOString()
    };

    // 2. Tìm và chuẩn bị đồng bộ request tương ứng (ĐỒNG BỘ TRƯỚC, KHÔNG ĐỂ NULL TRONG CALLBACK)
    const targetReq = requests.find(r => 
      (targetReport.requestId && r.id === targetReport.requestId) ||
      (r.reportId && r.reportId === targetReport.id) ||
      r.id === reportId ||
      r.reportId === reportId
    );

    let updatedReq = null;
    if (targetReq) {
      updatedReq = {
        ...targetReq,
        status: 'HAS_REJECTIONS',
        hasReport: true,
        reportId: updatedReport.id,
        rejectionNotes: rejectData.rejectionReason,
        rectificationNotes: null,
        updatedAt: new Date().toISOString()
      };
    }

    // 3. Cập nhật mảng reports vào React State, IndexedDB & LocalStorage tức thì
    setReports(prev => {
      const matchFn = r => (
        r.id === updatedReport.id || 
        (updatedReport.requestId && r.requestId === updatedReport.requestId) ||
        (updatedReport.reportNumber && r.reportNumber === updatedReport.reportNumber)
      );
      const filtered = prev.filter(r => !matchFn(r));
      const nextReports = [updatedReport, ...filtered];
      safeSaveLocalStorage(REPORTS_STORAGE_KEY, nextReports);
      return nextReports;
    });

    // 4. Cập nhật selectedReport
    setSelectedReport(updatedReport);

    // 5. Cập nhật request liên quan vào React State, IndexedDB & LocalStorage tức thì
    if (updatedReq) {
      setRequests(prev => {
        const nextRequests = prev.map(req => req.id === updatedReq.id ? updatedReq : req);
        safeSaveLocalStorage(REQUESTS_STORAGE_KEY, nextRequests);
        return nextRequests;
      });
    }

    // 6. Phát thông báo push toast & ghi nhận vào Notification Center
    const senderRoleTitle = isInvestorReject ? 'Chủ Đầu Tư' : 'Tư Vấn Giám Sát';
    const notifTitle = `⚠️ [Không đạt] ${senderRoleTitle} yêu cầu sửa: ${targetReport.reportNumber || ''}`;
    const notifBody = `${rejectData.rejectedBy?.name} (${senderRoleTitle}) KHÔNG ĐỒNG Ý nghiệm thu (Yêu cầu ĐVTC sửa chữa). Lý do: "${rejectData.rejectionReason.slice(0, 70)}..."`;

    const pushPayload = {
      id: `notif_${Date.now()}`,
      type: 'REJECTION',
      title: notifTitle,
      body: notifBody,
      actionText: 'Xem ảnh lỗi & Khắc phục',
      targetReportId: updatedReport.id,
      targetRequestId: updatedReq?.id || targetReport.requestId,
      targetRoles: ['CONTRACTOR'],
      createdAt: new Date().toISOString(),
      time: 'Vừa xong',
      isRead: false
    };

    setActivePushToast(pushPayload);
    showSystemNotification(notifTitle, notifBody);

    try {
      // BẮT BUỘC AWAIT ĐỂ LƯU CHẮC CHẮN LÊN CLOUD FIRESTORE TRƯỚC KHI ĐỔI TÀI KHOẢN
      await saveInspectionReport(updatedReport);
      if (updatedReq) {
        await saveInspectionRequest(updatedReq);
      }
      await saveSystemNotification(pushPayload);

      // Kích hoạt nổ thông báo màn hình khóa cho ĐVTC
      sendOneSignalPush({
        title: notifTitle,
        message: notifBody,
        targetRoles: ['CONTRACTOR'],
        url: 'https://app-apct-nghiemthu.web.app'
      }).catch(console.warn);
    } catch (e) {
      console.warn('Lỗi lưu từ chối lên Firestore:', e);
    }
  };

  // Xử lý khi ĐVTC khắc phục xong và TVGS/CĐT đồng ý nghiệm thu lại
  const handleReinspectReport = async (reportId, updatedReportFromModal) => {
    const targetReport = updatedReportFromModal || reports.find(r => r.id === reportId || r.id === selectedReport?.id) || selectedReport;
    if (!targetReport) return;

    const now = new Date().toISOString();

    const isSupervisorSigned = Boolean(targetReport.attendees?.supervisor?.signed);
    const isInvestorSigned = Boolean(targetReport.attendees?.investor?.signed);
    const isContractorSigned = targetReport.attendees?.contractor?.signed !== false;
    const isFullyCompleted = isSupervisorSigned && isInvestorSigned && isContractorSigned;

    const finalStatus = isFullyCompleted ? 'COMPLETED' : (isSupervisorSigned ? 'WAITING_INVESTOR' : 'PENDING_APPROVAL');

    const updatedReport = {
      ...targetReport,
      status: finalStatus,
      updatedAt: now
    };

    const targetReq = requests.find(r => 
      (targetReport.requestId && r.id === targetReport.requestId) ||
      (r.reportId && r.reportId === targetReport.id) ||
      r.id === reportId ||
      r.reportId === reportId
    );

    let updatedReq = null;
    if (targetReq) {
      updatedReq = {
        ...targetReq,
        status: finalStatus,
        hasReport: true,
        reportId: updatedReport.id,
        updatedAt: now
      };
    }

    setReports(prev => {
      const matchFn = r => r.id === targetReport.id || (updatedReport.reportNumber && r.reportNumber === updatedReport.reportNumber);
      const filtered = prev.filter(r => !matchFn(r));
      const nextReports = [updatedReport, ...filtered];
      safeSaveLocalStorage(REPORTS_STORAGE_KEY, nextReports);
      saveToIndexedDB('reports', nextReports);
      return nextReports;
    });

    setSelectedReport(updatedReport);
    setInitialOpenRectify(false);

    if (updatedReq) {
      setRequests(prev => {
        const nextRequests = prev.map(r => r.id === updatedReq.id ? updatedReq : r);
        safeSaveLocalStorage(REQUESTS_STORAGE_KEY, nextRequests);
        saveToIndexedDB('requests', nextRequests);
        return nextRequests;
      });
    }

    // Nếu TVGS vừa duyệt đạt sau sửa chữa -> Bắn thông báo mời CĐT
    if (!isFullyCompleted && isSupervisorSigned) {
      const notifTitle = `✍️ [TVGS Đã Phê Duyệt] Mời CĐT duyệt: ${targetReport.reportNumber || ''}`;
      const notifBody = `Tư Vấn Giám Sát đã kiểm tra lại kết quả sửa chữa và nghiệm thu đạt. Kính mời Chủ Đầu Tư kiểm tra hồ sơ, ảnh và ký phê duyệt!`;

      const pushPayload = {
        id: `notif_${Date.now()}`,
        type: 'INVITATION',
        title: notifTitle,
        body: notifBody,
        actionText: 'Mở biên bản để ký duyệt',
        targetReportId: targetReport.id,
        targetRequestId: updatedReq?.id || targetReport.requestId,
        targetRoles: ['INVESTOR', 'LEAD_INVESTOR', 'SUPERVISOR', 'LEAD_SUPERVISOR', 'CONTRACTOR'],
        createdAt: new Date().toISOString(),
        time: 'Vừa xong',
        isRead: false
      };

      setNotifications(prev => {
        const nextNotifs = [pushPayload, ...prev.filter(n => n.id !== pushPayload.id)];
        safeSaveLocalStorage('apct_notifications_list', nextNotifs);
        return nextNotifs;
      });
      setActivePushToast(pushPayload);
      showSystemNotification(notifTitle, notifBody);

      try {
        await saveInspectionReport(updatedReport);
        if (updatedReq) await saveInspectionRequest(updatedReq);
        await saveSystemNotification(pushPayload);
        sendOneSignalPush({
          title: notifTitle,
          message: notifBody,
          targetRoles: ['INVESTOR', 'LEAD_INVESTOR'],
          url: 'https://app-apct-nghiemthu.web.app'
        }).catch(console.warn);
      } catch (e) {
        console.warn(e);
      }
      return;
    }

    // Nếu cả 3 bên đã hoàn thành -> Bắn thông báo hoàn tất cho cả 3 bên
    if (isFullyCompleted) {
      const notifTitle = `🎉 [Hoàn thành nghiệm thu] Biên bản ${targetReport.reportNumber || ''}`;
      const notifBody = `Biên bản nghiệm thu ${targetReport.projectInfo?.itemName || ''} đã được cả 3 bên (ĐVTC - TVGS - CĐT) kiểm tra đạt và ký số hoàn tất!`;

      const pushPayload = {
        id: `notif_${Date.now()}`,
        type: 'COMPLETION',
        title: notifTitle,
        body: notifBody,
        actionText: 'Xem biên bản hoàn thành',
        targetReportId: targetReport.id,
        targetRequestId: updatedReq?.id || targetReport.requestId,
        targetRoles: ['CONTRACTOR', 'SUPERVISOR', 'LEAD_SUPERVISOR', 'INVESTOR', 'LEAD_INVESTOR'],
        createdAt: new Date().toISOString(),
        time: 'Vừa xong',
        isRead: false
      };

      setNotifications(prev => {
        const nextNotifs = [pushPayload, ...prev.filter(n => n.id !== pushPayload.id)];
        safeSaveLocalStorage('apct_notifications_list', nextNotifs);
        return nextNotifs;
      });
      setActivePushToast(pushPayload);
      showSystemNotification(notifTitle, notifBody);

      try {
        await saveInspectionReport(updatedReport);
        if (updatedReq) await saveInspectionRequest(updatedReq);
        await saveSystemNotification(pushPayload);

        sendOneSignalPush({
          title: notifTitle,
          message: notifBody,
          targetRoles: ['CONTRACTOR', 'SUPERVISOR', 'LEAD_SUPERVISOR', 'INVESTOR', 'LEAD_INVESTOR'],
          url: 'https://app-apct-nghiemthu.web.app'
        }).catch(console.warn);
      } catch (e) {
        console.warn('Lỗi lưu nghiệm thu lại lên Firestore:', e);
      }
    }
  };

  const handleSaveReport = async (updatedReport) => {
    const prevReport = reports.find(r => r.id === updatedReport.id);
    const tvgsJustSigned = 
      updatedReport.attendees?.supervisor?.signed && 
      (!prevReport || !prevReport.attendees?.supervisor?.signed);

    const isAllSigned = 
      Boolean(updatedReport.attendees?.investor?.signed) &&
      Boolean(updatedReport.attendees?.supervisor?.signed) &&
      Boolean(updatedReport.attendees?.contractor?.signed !== false);

    const isSupervisorSigned = Boolean(updatedReport.attendees?.supervisor?.signed);

    let finalStatus = updatedReport.status || 'PENDING_APPROVAL';
    if (isAllSigned) {
      finalStatus = 'COMPLETED';
    } else if (updatedReport.status === 'REJECTED' || updatedReport.status === 'RECTIFIED') {
      finalStatus = updatedReport.status;
    } else if (isSupervisorSigned) {
      finalStatus = 'WAITING_INVESTOR';
    }

    const finalReport = {
      ...updatedReport,
      status: finalStatus,
      updatedAt: new Date().toISOString()
    };

    setReports(prev => {
      const matchFn = r => r.id === finalReport.id || (finalReport.reportNumber && r.reportNumber === finalReport.reportNumber);
      const filtered = prev.filter(r => !matchFn(r));
      const nextReports = [finalReport, ...filtered];
      safeSaveLocalStorage(REPORTS_STORAGE_KEY, nextReports);
      return nextReports;
    });

    if (selectedReport && selectedReport.id === finalReport.id) {
      setSelectedReport(finalReport);
    }

    let updatedReq = null;
    const targetReq = requests.find(r => 
      (finalReport.requestId && r.id === finalReport.requestId) ||
      (r.reportId && r.reportId === finalReport.id)
    );
    if (targetReq) {
      updatedReq = {
        ...targetReq,
        status: finalReport.status,
        hasReport: true,
        reportId: finalReport.id,
        updatedAt: new Date().toISOString()
      };
      setRequests(prev => {
        const nextRequests = prev.map(r => r.id === updatedReq.id ? updatedReq : r);
        safeSaveLocalStorage(REQUESTS_STORAGE_KEY, nextRequests);
        return nextRequests;
      });
    }

    try {
      await saveInspectionReport(finalReport);
      if (updatedReq) {
        await saveInspectionRequest(updatedReq);
      }

      // Khi TVGS ký duyệt đồng ý -> Bắn thông báo mời Chủ Đầu Tư vào kiểm tra và ký phê duyệt!
      if (tvgsJustSigned && !isAllSigned) {
        const notifTitle = `✍️ [TVGS Đã Phê Duyệt] Mời CĐT ký duyệt: ${finalReport.reportNumber || 'Biên bản'}`;
        const notifBody = `Tư vấn giám sát (${finalReport.attendees?.supervisor?.person || 'TVGS'}) đã nghiệm thu đạt và ký duyệt. Kính mời Đại diện Chủ đầu tư vào kiểm tra & ký xác nhận!`;

        const pushPayload = {
          id: `notif_${Date.now()}`,
          type: 'INVITATION',
          title: notifTitle,
          body: notifBody,
          actionText: 'Mở biên bản để ký duyệt',
          targetReportId: finalReport.id,
          targetRequestId: finalReport.requestId,
          targetRoles: ['INVESTOR'],
          createdAt: new Date().toISOString(),
          time: 'Vừa xong',
          isRead: false
        };

        setActivePushToast(pushPayload);
        showSystemNotification(notifTitle, notifBody);
        await saveSystemNotification(pushPayload);

        sendOneSignalPush({
          title: notifTitle,
          message: notifBody,
          targetRoles: ['INVESTOR'],
          url: 'https://app-apct-nghiemthu.web.app'
        }).catch(console.warn);
      } else if (isAllSigned) {
        const notifTitle = `🎉 [Hoàn thành nghiệm thu] Biên bản ${finalReport.reportNumber || ''}`;
        const notifBody = `Biên bản nghiệm thu ${finalReport.projectInfo?.itemName || ''} đã được cả 3 bên hoàn tất ký số độc lập!`;

        const pushPayload = {
          id: `notif_${Date.now()}`,
          type: 'COMPLETION',
          title: notifTitle,
          body: notifBody,
          actionText: 'Xem biên bản hoàn thành',
          targetReportId: finalReport.id,
          targetRequestId: finalReport.requestId,
          targetRoles: ['CONTRACTOR', 'SUPERVISOR', 'LEAD_SUPERVISOR', 'INVESTOR', 'LEAD_INVESTOR'],
          createdAt: new Date().toISOString(),
          time: 'Vừa xong',
          isRead: false
        };

        setNotifications(prev => {
          const nextNotifs = [pushPayload, ...prev.filter(n => n.id !== pushPayload.id)];
          safeSaveLocalStorage('apct_notifications_list', nextNotifs);
          return nextNotifs;
        });
        setActivePushToast(pushPayload);
        showSystemNotification(notifTitle, notifBody);
        await saveSystemNotification(pushPayload);

        sendOneSignalPush({
          title: notifTitle,
          message: notifBody,
          targetRoles: ['CONTRACTOR', 'SUPERVISOR', 'LEAD_SUPERVISOR', 'INVESTOR', 'LEAD_INVESTOR'],
          url: 'https://app-apct-nghiemthu.web.app'
        }).catch(console.warn);
      }
    } catch (e) {
      console.warn('Lưu báo cáo lỗi:', e);
    }
  };

  // Xử lý khi ĐVTC báo cáo đã sửa lỗi xong và gửi lại yêu cầu nghiệm thu
  const handleResubmitReport = async (reportId, rectificationData, fullReport) => {
    const targetReport = fullReport || reports.find(r => r.id === reportId || r.requestId === reportId || (selectedReport && r.id === selectedReport.id)) || selectedReport;
    if (!targetReport) return;

    // Xác định ai là người cần kiểm tra lại theo luồng:
    // CĐT từ chối -> ĐVTC sửa -> CĐT duyệt lại trực tiếp!
    // TVGS từ chối -> ĐVTC sửa -> TVGS duyệt lại!
    const targetReviewer = rectificationData?.target || (targetReport.conclusion?.rejectedBy?.role === 'INVESTOR' ? 'INVESTOR' : 'SUPERVISOR');

    // Chỉ lưu ảnh thực tế ĐVTC đã chụp / tải lên
    const safePhotos = (Array.isArray(rectificationData?.photos) && rectificationData.photos.length > 0)
      ? rectificationData.photos
      : [];

    const safeRectificationData = {
      ...rectificationData,
      photos: safePhotos,
      target: targetReviewer
    };

    const updatedReport = {
      ...targetReport,
      id: targetReport.id || reportId || `rep_${Date.now()}`,
      rectification: safeRectificationData,
      status: 'RECTIFIED',
      updatedAt: new Date().toISOString()
    };

    const targetReq = requests.find(r => 
      (updatedReport.requestId && r.id === updatedReport.requestId) ||
      (r.reportId && (r.reportId === updatedReport.id || r.reportId === reportId)) ||
      (updatedReport.reportNumber && r.requestNumber === updatedReport.reportNumber.replace('BBNT', 'PYC')) ||
      (updatedReport.requestNumber && r.requestNumber === updatedReport.requestNumber) ||
      r.id === reportId ||
      r.id === updatedReport.id
    );

    if (targetReq && !updatedReport.requestId) {
      updatedReport.requestId = targetReq.id;
    }

    let updatedReq = null;
    if (targetReq) {
      updatedReq = {
        ...targetReq,
        status: 'RECTIFIED',
        hasReport: true,
        reportId: updatedReport.id,
        rectificationNotes: safeRectificationData.description,
        rectificationPhotos: safePhotos,
        updatedAt: new Date().toISOString()
      };
    }

    // 1. Cập nhật mảng reports vào React State, IndexedDB & LocalStorage tức thì
    setReports(prev => {
      const matchFn = r => (
        r.id === updatedReport.id || 
        (updatedReport.requestId && r.requestId === updatedReport.requestId) ||
        (updatedReport.reportNumber && r.reportNumber === updatedReport.reportNumber) ||
        (targetReq && r.requestId === targetReq.id) ||
        (targetReq?.reportId && r.id === targetReq.reportId)
      );
      const filtered = prev.filter(r => !matchFn(r));
      const nextReports = [updatedReport, ...filtered];
      safeSaveLocalStorage(REPORTS_STORAGE_KEY, nextReports);
      return nextReports;
    });

    // 2. Cập nhật selectedReport & tắt cờ mở form sửa
    setSelectedReport(updatedReport);
    setInitialOpenRectify(false);

    // 3. Cập nhật request vào React State, IndexedDB & LocalStorage
    if (updatedReq) {
      setRequests(prev => {
        const matchReqFn = r => (
          r.id === updatedReq.id ||
          (updatedReport.requestId && r.id === updatedReport.requestId) ||
          (r.reportId && (r.reportId === updatedReport.id || r.reportId === reportId)) ||
          (updatedReport.reportNumber && r.requestNumber === updatedReport.reportNumber.replace('BBNT', 'PYC'))
        );
        const filtered = prev.filter(r => !matchReqFn(r));
        const nextRequests = [updatedReq, ...filtered];
        safeSaveLocalStorage(REQUESTS_STORAGE_KEY, nextRequests);
        return nextRequests;
      });
    }

    // 4. Bắn thông báo Toast & Notification Bell cho ĐÚNG người nhận theo Sơ đồ hoạt động
    const targetName = targetReviewer === 'INVESTOR' ? 'Chủ Đầu Tư' : 'Tư Vấn Giám Sát';
    const notifTitle = `🔄 [Đã sửa lỗi] Biên bản ${targetReport.reportNumber || ''}`;
    const notifBody = `${rectificationData.submittedBy?.name} (ĐVTC) đã sửa xong lỗi và gửi ${safePhotos.length} ảnh hiện trường. Mời ${targetName} kiểm tra lại kết quả!`;

    const pushPayload = {
      id: `notif_${Date.now()}`,
      type: 'INVITATION',
      title: notifTitle,
      body: notifBody,
      actionText: 'Xem ảnh sửa & Kiểm tra lại',
      targetReportId: targetReport.id,
      targetRequestId: updatedReq?.id || targetReport.requestId,
      targetRoles: [targetReviewer], // Gửi CHÍNH XÁC vai trò cần duyệt lại!
      createdAt: new Date().toISOString(),
      time: 'Vừa xong',
      isRead: false
    };

    setActivePushToast(pushPayload);
    showSystemNotification(notifTitle, notifBody);

    try {
      await saveInspectionReport(updatedReport);
      if (updatedReq) {
        await saveInspectionRequest(updatedReq);
      }
      await saveSystemNotification(pushPayload);

      // Kích hoạt nổ thông báo màn hình khóa cho đúng vai trò
      sendOneSignalPush({
        title: notifTitle,
        message: notifBody,
        targetRoles: [targetReviewer],
        url: 'https://app-apct-nghiemthu.web.app'
      }).catch(console.warn);
    } catch (e) {
      console.warn('Lỗi lưu khắc phục lên Firestore:', e);
    }
  };

  const handleOpenReport = (report, options = {}) => {
    if (!report) return;
    let rep = reports.find(r => 
      r.id === report.id || 
      (report.requestId && r.requestId === report.requestId) || 
      (report.reportNumber && r.reportNumber === report.reportNumber)
    ) || report;

    // Tìm request liên quan để đồng bộ
    let targetReq = requests.find(r => 
      r.id === rep.requestId || 
      r.reportId === rep.id || 
      r.id === report.requestId || 
      r.reportId === report.id ||
      (rep.requestNumber && r.requestNumber === rep.requestNumber) ||
      (rep.reportNumber && r.requestNumber === rep.reportNumber.replace('BBNT', 'PYC')) ||
      (report.reportNumber && r.requestNumber === report.reportNumber.replace('BBNT', 'PYC'))
    );

    const isCompleted = rep.status === 'COMPLETED' || 
      (Boolean(rep.attendees?.supervisor?.signed) && Boolean(rep.attendees?.investor?.signed));

    if (!isCompleted) {
      const isReqRectified = targetReq?.status === 'RECTIFIED' || Boolean(targetReq?.rectificationNotes);
      const isRepRectified = rep.status === 'RECTIFIED' || Boolean(rep.rectification);

      if (isReqRectified || isRepRectified) {
        const photos = (Array.isArray(rep.rectification?.photos) && rep.rectification.photos.length > 0)
          ? rep.rectification.photos
          : (Array.isArray(targetReq?.rectificationPhotos) && targetReq.rectificationPhotos.length > 0)
          ? targetReq.rectificationPhotos
          : (Array.isArray(report?.rectification?.photos) && report.rectification.photos.length > 0)
          ? report.rectification.photos
          : [];

        rep = {
          ...rep,
          status: 'RECTIFIED',
          rectification: {
            description: rep.rectification?.description || targetReq?.rectificationNotes || report?.rectification?.description || 'Đã sửa chữa khắc phục theo đúng yêu cầu',
            photos: photos,
            suggestedTime: rep.rectification?.suggestedTime || report?.rectification?.suggestedTime || '16h30 ngày hôm nay',
            submittedBy: rep.rectification?.submittedBy || report?.rectification?.submittedBy || {
              name: targetReq?.createdByName || 'KS. Lê Văn Kỹ Thuật',
              role: 'CONTRACTOR',
              roleTitle: 'Kỹ Thuật Đơn Vị Thi Công',
              company: 'Công ty CP Xây dựng An Phú Gia',
              timestamp: targetReq?.updatedAt || new Date().toISOString()
            }
          },
          updatedAt: new Date().toISOString()
        };

        setReports(prev => {
          const matchFn = r => (
            r.id === rep.id || 
            (rep.requestId && r.requestId === rep.requestId) || 
            (rep.reportNumber && r.reportNumber === rep.reportNumber)
          );
          const filtered = prev.filter(r => !matchFn(r));
          const next = [rep, ...filtered];
          safeSaveLocalStorage(REPORTS_STORAGE_KEY, next);
          return next;
        });
      }
    }

    if (!targetReq) {
      targetReq = requests.find(r => r.id === rep.requestId || r.reportId === rep.id);
    }
    const repWithRecipients = {
      ...rep,
      assignedRecipients: rep.assignedRecipients || targetReq?.assignedRecipients || []
    };

    setSelectedReport(repWithRecipients);
    setInitialOpenRectify(Boolean(options.openRectify));
  };

  // NẾU CHƯA ĐĂNG NHẬP -> HIỆN MÀN HÌNH LOGIN
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} users={users} />;
  }

  // Phân quyền theo cấp bậc & chức vụ:
  // - Chỉ huy trưởng: xem toàn bộ phiếu/biên bản do cấp dưới thuộc nhà thầu thi công lập
  // - Kỹ thuật hiện trường (ĐVTC thường): chỉ xem phiếu do chính mình lập
  // - Tư vấn giám sát trưởng (LEAD_SUPERVISOR): xem toàn bộ phiếu/biên bản thuộc đơn vị TVGS (dưới mình)
  // - TVGS thường (như trắc đạc, kỹ sư GS): chỉ xem phiếu mình được chỉ định tiếp nhận
  // - Trưởng Ban QLDA (LEAD_INVESTOR): xem toàn bộ phiếu/biên bản gửi Ban QLDA CĐT
  // - Cán bộ CĐT thường: chỉ xem phiếu mình được chỉ định
  const isContractorLead = 
    currentRole === 'CONTRACTOR' && (
      (currentUser?.position || '').toLowerCase().includes('chỉ huy') ||
      (currentUser?.position || '').toLowerCase().includes('trưởng') ||
      Boolean(currentUser?.isLead)
    );

  const isSupervisorLead = 
    currentRole === 'LEAD_SUPERVISOR' ||
    (currentRole === 'SUPERVISOR' && (
      (currentUser?.position || '').toLowerCase().includes('giám sát trưởng') ||
      (currentUser?.position || '').toLowerCase().includes('trưởng') ||
      Boolean(currentUser?.isLead)
    ));

  const isInvestorLead = 
    currentRole === 'LEAD_INVESTOR' ||
    (currentRole === 'INVESTOR' && (
      (currentUser?.position || '').toLowerCase().includes('trưởng ban') ||
      (currentUser?.position || '').toLowerCase().includes('giám đốc') ||
      Boolean(currentUser?.isLead)
    ));

  const accessibleRequests = requests.filter(req => {
    // 1. Quản trị viên
    if (currentRole === 'ADMIN') return true;

    // 2. Chỉ huy trưởng: xem tất cả phiếu do nhà thầu thi công lập (dưới mình)
    if (isContractorLead) return true;

    // 3. Kỹ thuật hiện trường (ĐVTC thường): chỉ xem phiếu do chính mình lập
    if (currentRole === 'CONTRACTOR') {
      const isCreator = 
        req.createdByUid === currentUser.uid ||
        req.createdByName === currentUser.fullName ||
        (!req.createdByUid && !req.createdByName);
      return isCreator;
    }

    const curUid = currentUser?.uid;
    const curEmail = (currentUser?.email || '').trim().toLowerCase();
    const curName = (currentUser?.fullName || '').trim().toLowerCase();

    // 4. Tư vấn giám sát trưởng: xem phiếu gửi cho chính mình HOẶC các cán bộ TVGS dưới quyền mình!
    if (currentRole === 'LEAD_SUPERVISOR' || isSupervisorLead) {
      const subIds = Array.isArray(currentUser?.subordinateIds) ? currentUser.subordinateIds : [];
      const mySubordinates = users.filter(u => 
        (u.role === 'SUPERVISOR' || u.role === 'LEAD_SUPERVISOR') && 
        (u.leaderId === curUid || subIds.includes(u.uid))
      );
      const subUids = mySubordinates.map(u => u.uid);
      const subEmails = mySubordinates.map(u => (u.email || '').trim().toLowerCase()).filter(Boolean);
      const subNames = mySubordinates.map(u => (u.fullName || '').trim().toLowerCase()).filter(Boolean);

      if (!req.assignedRecipients || req.assignedRecipients.length === 0) return true;

      return req.assignedRecipients.some(rec => {
        const isTvgs = rec.role === 'SUPERVISOR' || rec.role === 'LEAD_SUPERVISOR';
        if (!isTvgs) return false;

        const recUid = rec.uid;
        const recEmail = (rec.email || '').trim().toLowerCase();
        const recName = (rec.fullName || '').trim().toLowerCase();
        const recLeaderId = rec.leaderId;

        // Phiếu gửi cho chính TVGS Trưởng
        if ((curUid && recUid === curUid) || (curEmail && recEmail === curEmail) || (curName && recName === curName)) return true;

        // Phiếu gửi cho cán bộ dưới quyền của TVGS Trưởng này
        if (recLeaderId && recLeaderId === curUid) return true;
        if (recUid && subUids.includes(recUid)) return true;
        if (recEmail && subEmails.includes(recEmail)) return true;
        if (recName && subNames.some(sn => sn === recName || sn.includes(recName) || recName.includes(sn))) return true;

        return false;
      });
    }

    // 5. Trưởng Ban QLDA (CĐT Trưởng): xem phiếu gửi cho chính mình HOẶC các cán bộ CĐT dưới quyền mình!
    if (currentRole === 'LEAD_INVESTOR' || isInvestorLead) {
      const subIds = Array.isArray(currentUser?.subordinateIds) ? currentUser.subordinateIds : [];
      const mySubordinates = users.filter(u => 
        (u.role === 'INVESTOR' || u.role === 'LEAD_INVESTOR') && 
        (u.leaderId === curUid || subIds.includes(u.uid))
      );
      const subUids = mySubordinates.map(u => u.uid);
      const subEmails = mySubordinates.map(u => (u.email || '').trim().toLowerCase()).filter(Boolean);
      const subNames = mySubordinates.map(u => (u.fullName || '').trim().toLowerCase()).filter(Boolean);

      if (!req.assignedRecipients || req.assignedRecipients.length === 0) return true;

      return req.assignedRecipients.some(rec => {
        const isCdt = rec.role === 'INVESTOR' || rec.role === 'LEAD_INVESTOR';
        if (!isCdt) return false;

        const recUid = rec.uid;
        const recEmail = (rec.email || '').trim().toLowerCase();
        const recName = (rec.fullName || '').trim().toLowerCase();
        const recLeaderId = rec.leaderId;

        // Phiếu gửi cho chính CĐT Trưởng
        if ((curUid && recUid === curUid) || (curEmail && recEmail === curEmail) || (curName && recName === curName)) return true;

        // Phiếu gửi cho cán bộ dưới quyền của CĐT Trưởng này
        if (recLeaderId && recLeaderId === curUid) return true;
        if (recUid && subUids.includes(recUid)) return true;
        if (recEmail && subEmails.includes(recEmail)) return true;
        if (recName && subNames.some(sn => sn === recName || sn.includes(recName) || recName.includes(sn))) return true;

        return false;
      });
    }

    // 6. Cán bộ TVGS & CĐT thường: CHỈ XEM các phiếu mà cán bộ đó ĐƯỢC CHỈ ĐỊNH TIẾP NHẬN
    if (!req.assignedRecipients || req.assignedRecipients.length === 0) {
      // Hỗ trợ hiển thị các phiếu cũ/chưa cấu hình người nhận cụ thể
      return true;
    }

    return req.assignedRecipients.some(rec => {
      const recUid = rec.uid;
      const recEmail = (rec.email || '').trim().toLowerCase();
      const recName = (rec.fullName || '').trim().toLowerCase();

      const uidMatch = Boolean(curUid && recUid === curUid);
      const emailMatch = Boolean(curEmail && recEmail && curEmail === recEmail);
      const nameMatch = Boolean(curName && recName && (
        curName === recName || 
        curName.includes(recName) || 
        recName.includes(curName)
      ));

      return uidMatch || emailMatch || nameMatch;
    });
  });

  const filteredRequests = accessibleRequests.filter(req => {
    const matchesSearch = 
      req.taskContent.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requestNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.buildingName.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesStatus = true;
    if (statusFilter === 'SENT') matchesStatus = req.status === 'SENT' || !req.status;
    if (statusFilter === 'HAS_REJECTIONS') matchesStatus = req.status === 'HAS_REJECTIONS';
    if (statusFilter === 'RECTIFIED') matchesStatus = req.status === 'RECTIFIED';
    if (statusFilter === 'COMPLETED') matchesStatus = req.status === 'COMPLETED';

    return matchesSearch && matchesStatus;
  });

  // 2. Phân quyền xem Biên bản nghiệm thu:
  const accessibleReports = reports.filter(rep => {
    if (currentRole === 'ADMIN') return true;
    if (isContractorLead) return true;

    const matchingReq = requests.find(r => r.id === rep.requestId || r.reportId === rep.id);

    if (currentRole === 'CONTRACTOR') {
      const isCreator = 
        matchingReq?.createdByUid === currentUser.uid ||
        matchingReq?.createdByName === currentUser.fullName ||
        rep.attendees?.contractor?.person === currentUser.fullName;
      return isCreator;
    }

    const curUid = currentUser?.uid;
    const curEmail = (currentUser?.email || '').trim().toLowerCase();
    const curName = (currentUser?.fullName || '').trim().toLowerCase();

    // 1. LEAD_SUPERVISOR: Xem báo cáo của chính mình hoặc các TVGS dưới quyền mình
    if (currentRole === 'LEAD_SUPERVISOR' || isSupervisorLead) {
      const subIds = Array.isArray(currentUser?.subordinateIds) ? currentUser.subordinateIds : [];
      const mySubordinates = users.filter(u => 
        (u.role === 'SUPERVISOR' || u.role === 'LEAD_SUPERVISOR') && 
        (u.leaderId === curUid || subIds.includes(u.uid))
      );
      const subUids = mySubordinates.map(u => u.uid);
      const subEmails = mySubordinates.map(u => (u.email || '').trim().toLowerCase()).filter(Boolean);
      const subNames = mySubordinates.map(u => (u.fullName || '').trim().toLowerCase()).filter(Boolean);

      const isAssigned = matchingReq?.assignedRecipients?.some(rec => {
        if (rec.role !== 'SUPERVISOR' && rec.role !== 'LEAD_SUPERVISOR') return false;
        const recUid = rec.uid;
        const recEmail = (rec.email || '').trim().toLowerCase();
        const recName = (rec.fullName || '').trim().toLowerCase();
        const recLeaderId = rec.leaderId;

        if ((curUid && recUid === curUid) || (curEmail && recEmail === curEmail) || (curName && recName === curName)) return true;
        if (recLeaderId && recLeaderId === curUid) return true;
        if (recUid && subUids.includes(recUid)) return true;
        if (recEmail && subEmails.includes(recEmail)) return true;
        if (recName && subNames.some(sn => sn === recName || sn.includes(recName) || recName.includes(sn))) return true;
        return false;
      });

      const supPerson = (rep.attendees?.supervisor?.person || '').trim().toLowerCase();
      const supEmail = (rep.attendees?.supervisor?.email || '').trim().toLowerCase();
      const isSupAttendee = 
        (curName && (supPerson === curName || supPerson.includes(curName) || curName.includes(supPerson))) ||
        (curEmail && supEmail === curEmail) ||
        subNames.some(sn => sn === supPerson || sn.includes(supPerson) || supPerson.includes(sn)) ||
        (supEmail && subEmails.includes(supEmail));

      if (!matchingReq?.assignedRecipients || matchingReq.assignedRecipients.length === 0) return true;
      return Boolean(isAssigned || isSupAttendee);
    }

    // 2. LEAD_INVESTOR: Xem báo cáo của chính mình hoặc các CĐT dưới quyền mình
    if (currentRole === 'LEAD_INVESTOR' || isInvestorLead) {
      const subIds = Array.isArray(currentUser?.subordinateIds) ? currentUser.subordinateIds : [];
      const mySubordinates = users.filter(u => 
        (u.role === 'INVESTOR' || u.role === 'LEAD_INVESTOR') && 
        (u.leaderId === curUid || subIds.includes(u.uid))
      );
      const subUids = mySubordinates.map(u => u.uid);
      const subEmails = mySubordinates.map(u => (u.email || '').trim().toLowerCase()).filter(Boolean);
      const subNames = mySubordinates.map(u => (u.fullName || '').trim().toLowerCase()).filter(Boolean);

      const isAssigned = matchingReq?.assignedRecipients?.some(rec => {
        if (rec.role !== 'INVESTOR' && rec.role !== 'LEAD_INVESTOR') return false;
        const recUid = rec.uid;
        const recEmail = (rec.email || '').trim().toLowerCase();
        const recName = (rec.fullName || '').trim().toLowerCase();
        const recLeaderId = rec.leaderId;

        if ((curUid && recUid === curUid) || (curEmail && recEmail === curEmail) || (curName && recName === curName)) return true;
        if (recLeaderId && recLeaderId === curUid) return true;
        if (recUid && subUids.includes(recUid)) return true;
        if (recEmail && subEmails.includes(recEmail)) return true;
        if (recName && subNames.some(sn => sn === recName || sn.includes(recName) || recName.includes(sn))) return true;
        return false;
      });

      const invPerson = (rep.attendees?.investor?.person || '').trim().toLowerCase();
      const invEmail = (rep.attendees?.investor?.email || '').trim().toLowerCase();
      const isInvAttendee = 
        (curName && (invPerson === curName || invPerson.includes(curName) || curName.includes(invPerson))) ||
        (curEmail && invEmail === curEmail) ||
        subNames.some(sn => sn === invPerson || sn.includes(invPerson) || invPerson.includes(sn)) ||
        (invEmail && subEmails.includes(invEmail));

      if (!matchingReq?.assignedRecipients || matchingReq.assignedRecipients.length === 0) return true;
      return Boolean(isAssigned || isInvAttendee);
    }

    // 3. TVGS & CĐT thường: CHỈ XEM báo cáo mà mình được chỉ định hoặc tham gia
    const isAssignedInReq = matchingReq?.assignedRecipients?.some(r => {
      const recUid = r.uid;
      const recEmail = (r.email || '').trim().toLowerCase();
      const recName = (r.fullName || '').trim().toLowerCase();

      return (curUid && recUid === curUid) ||
             (curEmail && recEmail && curEmail === recEmail) ||
             (curName && recName && (curName === recName || curName.includes(recName) || recName.includes(curName)));
    });

    const isAttendee = 
      (rep.attendees?.supervisor?.person && curName && (
        rep.attendees.supervisor.person.toLowerCase().includes(curName) ||
        curName.includes(rep.attendees.supervisor.person.toLowerCase())
      )) ||
      (rep.attendees?.investor?.person && curName && (
        rep.attendees.investor.person.toLowerCase().includes(curName) ||
        curName.includes(rep.attendees.investor.person.toLowerCase())
      )) ||
      (rep.attendees?.supervisor?.email && curEmail && rep.attendees.supervisor.email.toLowerCase() === curEmail) ||
      (rep.attendees?.investor?.email && curEmail && rep.attendees.investor.email.toLowerCase() === curEmail);

    if (!matchingReq?.assignedRecipients || matchingReq.assignedRecipients.length === 0) {
      return true;
    }

    return Boolean(isAssignedInReq || isAttendee);
  });

  // Lọc thông báo phù hợp vai trò
  const userNotifications = notifications.filter(notif => {
    if (currentRole === 'ADMIN') return true;

    if (notif.targetRole) {
      const matchTargetRole = 
        notif.targetRole === currentRole ||
        (currentRole === 'LEAD_SUPERVISOR' && notif.targetRole === 'SUPERVISOR') ||
        (currentRole === 'LEAD_INVESTOR' && notif.targetRole === 'INVESTOR');
      if (!matchTargetRole) return false;
    }

    if (notif.targetRoles) {
      const matchTargetRoles = 
        notif.targetRoles.includes(currentRole) ||
        (currentRole === 'LEAD_SUPERVISOR' && notif.targetRoles.includes('SUPERVISOR')) ||
        (currentRole === 'LEAD_INVESTOR' && notif.targetRoles.includes('INVESTOR'));
      if (!matchTargetRoles) return false;
    }

    if (notif.recipientUid && notif.recipientUid !== currentUser?.uid) return false;
    return true;
  });

  const unreadCount = userNotifications.filter(n => !n.isRead).length;

  const stats = {
    total: accessibleRequests.length,
    sent: accessibleRequests.filter(r => r.status === 'SENT' || !r.status).length,
    rejected: accessibleRequests.filter(r => r.status === 'HAS_REJECTIONS').length,
    rectified: accessibleRequests.filter(r => r.status === 'RECTIFIED').length,
    completed: accessibleRequests.filter(r => r.status === 'COMPLETED').length,
    myInvitations: accessibleRequests.length
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* HEADER NAVBAR */}
      <Navbar 
        currentRole={currentRole}
        currentUser={currentUser}
        unreadCount={unreadCount}
        notifications={userNotifications}
        onMarkAllAsRead={handleMarkAllNotificationsAsRead}
        onMarkAsRead={handleMarkNotificationAsRead}
        onDeleteNotification={handleDeleteNotification}
        onClearAllNotifications={handleClearAllNotifications}
        onSelectNotification={(notif) => {
          setInitialOpenRectify(false);
          const rep = reports.find(r => 
            (notif.targetReportId && (r.id === notif.targetReportId || r.reportId === notif.targetReportId)) || 
            (notif.targetRequestId && r.requestId === notif.targetRequestId)
          );
          if (rep) {
            handleOpenReport(rep);
            return;
          }
          if (notif.targetReportId) {
            handleOpenOrCreateReport(notif.targetReportId);
            return;
          }
          if (notif.targetRequestId) {
            const target = requests.find(r => r.id === notif.targetRequestId);
            if (target) setSelectedRequest(target);
          }
        }}
        pushPermissionGranted={pushPermissionGranted}
        onEnablePush={handleEnablePush}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        onOpenProfile={() => setIsMobileProfileOpen(true)}
        onLogout={handleLogout}
        onResetAllData={handleResetAllData}
      />

      {/* PUSH NOTIFICATION TOAST POPUP */}
      <PushNotificationToast 
        notification={activePushToast}
        onClose={() => setActivePushToast(null)}
        onAction={(notif) => {
          handleMarkNotificationAsRead(notif.id);
          setInitialOpenRectify(false);
          const rep = reports.find(r => 
            (notif.targetReportId && (r.id === notif.targetReportId || r.reportId === notif.targetReportId)) || 
            (notif.targetRequestId && r.requestId === notif.targetRequestId)
          );
          if (rep) {
            handleOpenReport(rep);
            return;
          }
          if (notif.targetReportId) {
            handleOpenOrCreateReport(notif.targetReportId);
            return;
          }
          const target = requests.find(r => r.id === notif.targetRequestId);
          if (target) setSelectedRequest(target);
        }}
      />

      <div className="app-container">
        {/* DESKTOP SIDEBAR THEO VAI TRÒ */}
        <aside className="app-sidebar">
          <div className="sidebar-section-title">
            {currentRole === 'ADMIN' ? 'Phân Hệ Quản Trị' : 'Chức Năng Phân Quyền'}
          </div>

          <ul className="sidebar-nav-list" style={{ marginBottom: '24px' }}>
            {currentRole === 'ADMIN' ? (
              <>
                <li 
                  className={`sidebar-nav-item ${activeTab === 'ADMIN_USERS' ? 'active' : ''}`}
                  onClick={() => setActiveTab('ADMIN_USERS')}
                >
                  <Users size={18} />
                  <span>Quản Lý Cán Bộ ({users.length})</span>
                </li>
                <li 
                  className={`sidebar-nav-item ${activeTab === 'ADMIN_STANDARDS' ? 'active' : ''}`}
                  onClick={() => setActiveTab('ADMIN_STANDARDS')}
                >
                  <BookOpen size={18} />
                  <span>Thư Viện TCVN ({standards.length})</span>
                </li>
                <li 
                  className={`sidebar-nav-item ${activeTab === 'REQUESTS' ? 'active' : ''}`}
                  onClick={() => setActiveTab('REQUESTS')}
                >
                  <Send size={18} />
                  <span>Tất Cả Phiếu Yêu Cầu ({accessibleRequests.length})</span>
                </li>
                <li 
                  className={`sidebar-nav-item ${activeTab === 'REPORTS' ? 'active' : ''}`}
                  onClick={() => setActiveTab('REPORTS')}
                >
                  <FileText size={18} />
                  <span>Hồ Sơ Biên Bản ({accessibleReports.length})</span>
                </li>
              </>
            ) : (
              <>
                <li 
                  className={`sidebar-nav-item ${activeTab === 'REQUESTS' ? 'active' : ''}`}
                  onClick={() => setActiveTab('REQUESTS')}
                >
                  <Send size={18} />
                  <span>
                    {currentRole === 'CONTRACTOR' 
                      ? `Phiếu Đã Lập & Gửi (${accessibleRequests.length})` 
                      : `Phiếu Mời Nghiệm Thu (${accessibleRequests.length})`}
                  </span>
                </li>

                <li 
                  className={`sidebar-nav-item ${activeTab === 'REPORTS' ? 'active' : ''}`}
                  onClick={() => setActiveTab('REPORTS')}
                >
                  <FileText size={18} />
                  <span>Biên Bản Nghiệm Thu ({accessibleReports.length})</span>
                </li>
              </>
            )}
          </ul>

          <div className="sidebar-section-title">Công Trình Đang Phụ Trách</div>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', fontSize: '0.82rem' }}>
            <div style={{ fontWeight: 'bold', color: '#1e3a8a', marginBottom: '6px' }}>
              🏗️ {MOCK_PROJECT.projectName.slice(0, 32)}...
            </div>
            <div style={{ paddingLeft: '10px', borderLeft: '2px solid #3b82f6', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ color: '#0f172a', fontWeight: '600' }}>
                🏢 Chung cư nhà ở xã hội 2
              </div>
              <div style={{ color: '#64748b', fontSize: '0.78rem', paddingLeft: '8px' }}>
                • Thi công kết cấu Tòa A-B<br />
                • Thi công phần móng hầm
              </div>
            </div>
          </div>
        </aside>

        {/* NỘI DUNG CHÍNH (GIAO DIỆN CHUYÊN BIỆT TỪNG VAI TRÒ) */}
        <main className="app-main">
          {/* MÀN HÌNH DANH SÁCH BIÊN BẢN NGHIỆM THU CHO MỌI VAI TRÒ */}
          {activeTab === 'REPORTS' ? (
            <ReportsListView 
              reports={accessibleReports}
              currentRole={currentRole}
              currentUser={currentUser}
              onOpenReport={handleOpenReport}
            />
          ) : currentRole === 'ADMIN' && (activeTab === 'ADMIN_USERS' || activeTab === 'ADMIN_STANDARDS') ? (
            <div>
              <div className="dashboard-header">
                <div className="dashboard-title-row">
                  <div className="dashboard-title">
                    <h2>Bảng Quản Trị Hệ Thống APCT (Admin Portal)</h2>
                  </div>
                </div>
              </div>

              {activeTab === 'ADMIN_USERS' ? (
                <UserManagementView
                  users={users}
                  currentUser={currentUser}
                  onAddUser={handleAddUser}
                  onUpdateUser={handleUpdateUser}
                  onDeleteUser={handleDeleteUser}
                  onUpdateUserRole={handleUpdateUserRole}
                  onToggleUserStatus={handleToggleUserStatus}
                />
              ) : (
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '14px', color: '#1e293b' }}>
                    Thư Viện Tiêu Chuẩn & Quy Chuẩn Xây Dựng Áp Dụng (TCVN / QCVN)
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {standards.map(s => (
                      <div key={s.id} style={{ 
                        padding: '12px 16px', 
                        background: '#f8fafc', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <span style={{ fontWeight: 'bold', color: '#b91c1c', fontSize: '0.88rem', minWidth: '160px' }}>
                          {s.code}
                        </span>
                        <span style={{ fontSize: '0.9rem', color: '#334155' }}>
                          {s.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* MÀN HÌNH NGHIỆP VỤ (CONTRACTOR, SUPERVISOR, INVESTOR) */
            <div>
              <div className="dashboard-header">
                {/* BANNER CHÀO MỪNG DÀNH CHO MOBILE */}
                <div className="mobile-welcome-banner">
                  <div className="mobile-welcome-info">
                    <div className="mobile-greeting-text">
                      Xin chào, <strong>{currentUser?.fullName}</strong> 👋
                    </div>
                    <div className="mobile-role-tag-row">
                      <span className="mobile-role-badge">
                        {currentRole === 'CONTRACTOR' && '👷‍♂️ ĐVTC'}
                        {currentRole === 'SUPERVISOR' && '👁️ TVGS'}
                        {currentRole === 'LEAD_SUPERVISOR' && '👁️ TVGS Trưởng'}
                        {currentRole === 'INVESTOR' && '🏢 CĐT'}
                        {currentRole === 'LEAD_INVESTOR' && '🏢 CĐT Trưởng'}
                        {currentRole === 'ADMIN' && '🛡️ Admin'}
                      </span>
                      <span className="mobile-company-text">• {currentUser?.company || 'An Phú Gia'}</span>
                    </div>
                  </div>

                  {currentRole === 'CONTRACTOR' && (
                    <button className="btn-primary mobile-create-btn" onClick={() => setIsCreateModalOpen(true)}>
                      <Plus size={16} />
                      <span>Lập Phiếu</span>
                    </button>
                  )}
                </div>

                <div className="dashboard-title-row desktop-only-flex">
                  <div className="dashboard-title">
                    <h2>
                      {currentRole === 'CONTRACTOR' && '👷‍♂️ Phân Hệ Đơn Vị Thi Công'}
                      {currentRole === 'SUPERVISOR' && '👁️ Phân Hệ Tư Vấn Giám Sát (TVGS)'}
                      {currentRole === 'LEAD_SUPERVISOR' && '👁️ Phân Hệ Tư Vấn Giám Sát Trưởng'}
                      {currentRole === 'INVESTOR' && '🏢 Phân Hệ Đại Diện Chủ Đầu Tư (Ban QLDA)'}
                      {currentRole === 'LEAD_INVESTOR' && '🏢 Phân Hệ Đại Diện Chủ Đầu Tư Trưởng (Trưởng Ban QLDA)'}
                      {currentRole === 'ADMIN' && '🛡️ Giám Sát Hồ Sơ Nghiệm Thu (Admin)'}
                    </h2>
                  </div>

                  {/* CHỈ HIỂN THỊ NÚT TẠO PHIẾU NẾU LÀ ĐƠN VỊ THI CÔNG */}
                  {currentRole === 'CONTRACTOR' && (
                    <button className="btn-primary" onClick={() => setIsCreateModalOpen(true)}>
                      <Plus size={18} />
                      <span>Tạo Phiếu Yêu Cầu</span>
                    </button>
                  )}
                </div>

                {/* STAT METRIC CARDS */}
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                  <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setStatusFilter('ALL')}>
                    <div className="stat-icon-wrapper stat-icon-blue">
                      <FileText size={20} />
                    </div>
                    <div>
                      <div className="stat-value">{stats.total}</div>
                      <div className="stat-label">Tổng phiếu</div>
                    </div>
                  </div>

                  <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setStatusFilter('SENT')}>
                    <div className="stat-icon-wrapper stat-icon-amber">
                      <Send size={20} />
                    </div>
                    <div>
                      <div className="stat-value">{stats.sent}</div>
                      <div className="stat-label">Chờ nghiệm thu</div>
                    </div>
                  </div>

                  <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setStatusFilter('HAS_REJECTIONS')}>
                    <div className="stat-icon-wrapper stat-icon-red">
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <div className="stat-value">{stats.rejected}</div>
                      <div className="stat-label">Chưa đạt (Cần sửa)</div>
                    </div>
                  </div>

                  <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setStatusFilter('RECTIFIED')}>
                    <div className="stat-icon-wrapper" style={{ background: '#f3e8ff', color: '#7c3aed' }}>
                      <RotateCcw size={20} />
                    </div>
                    <div>
                      <div className="stat-value">{stats.rectified}</div>
                      <div className="stat-label">Đã sửa (Chờ duyệt)</div>
                    </div>
                  </div>

                  <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setStatusFilter('COMPLETED')}>
                    <div className="stat-icon-wrapper stat-icon-green">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <div className="stat-value">{stats.completed}</div>
                      <div className="stat-label">Đã duyệt đạt (3/3)</div>
                    </div>
                  </div>
                </div>

                {/* SEARCH & FILTERS */}
                <div className="toolbar-row">
                  <div className="search-input-box">
                    <Search size={18} />
                    <input 
                      type="text" 
                      className="search-input"
                      placeholder="Tìm theo nội dung công tác, số hiệu phiếu..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="filter-pills">
                    <button 
                      className={`filter-pill ${statusFilter === 'ALL' ? 'active' : ''}`}
                      onClick={() => setStatusFilter('ALL')}
                    >
                      Tất cả ({stats.total})
                    </button>
                    <button 
                      className={`filter-pill ${statusFilter === 'SENT' ? 'active' : ''}`}
                      onClick={() => setStatusFilter('SENT')}
                    >
                      Chờ nghiệm thu ({stats.sent})
                    </button>
                    <button 
                      className={`filter-pill ${statusFilter === 'HAS_REJECTIONS' ? 'active' : ''}`}
                      style={statusFilter === 'HAS_REJECTIONS' ? { background: '#ef4444', borderColor: '#ef4444', color: '#fff' } : {}}
                      onClick={() => setStatusFilter('HAS_REJECTIONS')}
                    >
                      ⚠️ Chưa đạt ({stats.rejected})
                    </button>
                    <button 
                      className={`filter-pill ${statusFilter === 'RECTIFIED' ? 'active' : ''}`}
                      style={statusFilter === 'RECTIFIED' ? { background: '#7c3aed', borderColor: '#7c3aed', color: '#fff' } : {}}
                      onClick={() => setStatusFilter('RECTIFIED')}
                    >
                      🔄 Đã sửa ({stats.rectified})
                    </button>
                    <button 
                      className={`filter-pill ${statusFilter === 'COMPLETED' ? 'active' : ''}`}
                      onClick={() => setStatusFilter('COMPLETED')}
                    >
                      Đã hoàn thành ({stats.completed})
                    </button>
                  </div>
                </div>
              </div>

              {/* DANH SÁCH THẺ PHIẾU NGHIỆM THU */}
              <div className="cards-list">
                {filteredRequests.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <FileText size={48} color="#94a3b8" style={{ marginBottom: '12px' }} />
                    <h3 style={{ color: '#334155', marginBottom: '6px' }}>Không có phiếu nào</h3>
                    <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
                      {statusFilter === 'HAS_REJECTIONS' 
                        ? 'Tuyệt vời! Hiện không có phiếu nào bị từ chối hoặc cần sửa chữa.' 
                        : currentRole === 'SUPERVISOR' || currentRole === 'INVESTOR'
                        ? 'Chưa có phiếu yêu cầu nghiệm thu nào trong danh mục này.'
                        : 'Chưa có phiếu yêu cầu nghiệm thu nào trong danh mục này.'}
                    </p>
                  </div>
                ) : (
                  filteredRequests.map(req => {
                    const isCompleted = req.status === 'COMPLETED';
                    const isRejected = req.status === 'HAS_REJECTIONS';
                    const isRectified = req.status === 'RECTIFIED';
                    const matchingRep = reports.find(r => r.id === req.reportId || r.requestId === req.id);

                    return (
                      <div 
                        key={req.id} 
                        className="inspection-card"
                        style={{
                          border: isRejected 
                            ? '1.5px solid #fca5a5' 
                            : isRectified 
                            ? '1.5px solid #d8b4fe' 
                            : isCompleted 
                            ? '1.5px solid #a7f3d0' 
                            : '1px solid #e2e8f0',
                          background: isRejected ? '#fffafa' : '#ffffff'
                        }}
                      >
                        <div className="card-top-bar">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span className="card-req-number">{req.requestNumber}</span>
                            {isCompleted ? (
                              <span className="badge-status badge-approved">
                                <CheckCircle2 size={13} /> Đã Hoàn Thành
                              </span>
                            ) : isRejected ? (
                              <span className="badge-status" style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <AlertTriangle size={13} color="#dc2626" /> Không Đạt (Cần Sửa Chữa)
                              </span>
                            ) : isRectified ? (
                              <span className="badge-status" style={{ background: '#f3e8ff', color: '#6b21a8', border: '1px solid #d8b4fe', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <RotateCcw size={13} color="#7c3aed" /> Đã Sửa (Chờ Duyệt Lại)
                              </span>
                            ) : req.status === 'WAITING_INVESTOR' ? (
                              <span className="badge-status" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={13} color="#2563eb" /> Chờ CĐT Phê Duyệt
                              </span>
                            ) : (
                              <span className="badge-status badge-confirmed" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
                                <Send size={13} /> Đã Gửi Đi (Kèm Biên Bản)
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={14} />
                            <span>Hẹn: <strong>{req.scheduledTime}</strong></span>
                          </div>
                        </div>

                        <h3 className="card-task-title">{req.taskContent}</h3>

                        <div className="card-hierarchy-breadcrumb">
                          <span>🏢 {req.buildingName}</span>
                          <span>›</span>
                          <span>📑 {req.itemName}</span>
                          <span>›</span>
                          <span>📍 {req.inspectionPlace}</span>
                        </div>

                        {/* THÔNG BÁO LÝ DO KHIẾM KHUYẾT NẾU TỪ CHỐI */}
                        {isRejected && (
                          <div style={{
                            background: '#fff1f2',
                            border: '1px solid #fecaca',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            margin: '12px 0 6px 0',
                            fontSize: '0.84rem',
                            color: '#991b1b',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px'
                          }}>
                            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#dc2626' }} />
                            <div>
                              <div style={{ fontWeight: 700 }}>Biên bản nghiệm thu chưa đạt - Yêu cầu khắc phục sửa chữa:</div>
                              <div style={{ color: '#7f1d1d', marginTop: '3px' }}>
                                "{req.rejectionNotes || 'Cán bộ kiểm tra yêu cầu nắn chỉnh và khắc phục lỗi trước khi nghiệm thu lại.'}"
                              </div>
                            </div>
                          </div>
                        )}

                        {/* THÔNG BÁO NỘI DUNG ĐÃ KHẮC PHỤC NẾU ĐVTC ĐÃ SỬA */}
                        {isRectified && (
                          <div style={{
                            background: '#f5f3ff',
                            border: '1px solid #d8b4fe',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            margin: '12px 0 6px 0',
                            fontSize: '0.84rem',
                            color: '#6b21a8',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px'
                          }}>
                            <Wrench size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#7c3aed' }} />
                            <div>
                              <div style={{ fontWeight: 700 }}>ĐVTC đã hoàn thành khắc phục sửa chữa:</div>
                              <div style={{ color: '#581c87', marginTop: '3px' }}>
                                "{req.rectificationNotes || 'Đã sửa chữa theo đúng yêu cầu kỹ thuật và gửi ảnh hiện trường.'}"
                              </div>
                            </div>
                          </div>
                        )}

                        {/* DANH SÁCH CÁN BỘ TIẾP NHẬN YÊU CẦU */}
                        <div className="recipients-status-list">
                          <div className="recipients-title">
                            Thành phần tiếp nhận yêu cầu ({req.assignedRecipients?.length || 0}):
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                            {req.assignedRecipients?.map((rec, idx) => (
                              <div key={idx} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '0.8rem'
                              }}>
                                <span style={{ 
                                  width: '7px', 
                                  height: '7px', 
                                  borderRadius: '50%', 
                                  background: (rec.role === 'SUPERVISOR' || rec.role === 'LEAD_SUPERVISOR') ? '#059669' : '#d97706' 
                                }} />
                                <strong>{rec.fullName}</strong>
                                <span style={{ color: '#64748b', fontSize: '0.74rem' }}>
                                  ({rec.role === 'LEAD_SUPERVISOR' ? 'TVGS Trưởng' : rec.role === 'SUPERVISOR' ? 'TVGS' : rec.role === 'LEAD_INVESTOR' ? 'CĐT Trưởng' : 'CĐT'})
                                </span>
                                {rec.uid === currentUser?.uid && (
                                  <span style={{ fontSize: '0.7rem', background: '#e0e7ff', color: '#3730a3', padding: '1px 5px', borderRadius: '4px' }}>
                                    Bạn
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* NÚT HÀNH ĐỘNG CHUẨN NGHIỆP VỤ */}
                        <div className="card-actions-row">
                          <button 
                            className="btn-secondary" 
                            onClick={() => setSelectedRequest(req)}
                          >
                            <FileText size={16} />
                            <span>Phiếu Yêu Cầu</span>
                          </button>

                          {isRejected ? (
                            currentRole === 'CONTRACTOR' ? (
                              <button 
                                className="btn-primary" 
                                style={{ background: '#7c3aed' }}
                                onClick={() => {
                                  if (matchingRep) {
                                    handleOpenReport(matchingRep, { openRectify: true });
                                  } else {
                                    handleOpenOrCreateReport(req.reportId || req.id, false);
                                  }
                                }}
                              >
                                <Wrench size={16} />
                                <span>Khắc Phục & Mời Lại</span>
                              </button>
                            ) : (
                              <button 
                                className="btn-secondary" 
                                style={{ borderColor: '#fca5a5', color: '#b91c1c', background: '#fff' }}
                                onClick={() => handleOpenOrCreateReport(req.reportId || req.id, false)}
                              >
                                <AlertTriangle size={16} color="#dc2626" />
                                <span>Xem Biên Bản Lỗi</span>
                              </button>
                            )
                          ) : isRectified ? (
                            <button 
                              className="btn-primary" 
                              style={{ background: '#7c3aed' }}
                              onClick={() => handleOpenOrCreateReport(req.reportId || req.id, false)}
                            >
                              <RotateCcw size={16} />
                              <span>{currentRole === 'CONTRACTOR' ? 'Xem Biên Bản Đã Sửa' : 'Nghiệm Thu Lại Sau Sửa'}</span>
                            </button>
                          ) : (
                            <button 
                              className="btn-primary" 
                              style={{ background: '#059669' }}
                              onClick={() => handleOpenOrCreateReport(req.reportId || req.id, false)}
                            >
                              <Award size={16} />
                              <span>Xem Biên Bản Nghiệm Thu</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="mobile-bottom-nav">
        <button 
          className={`bottom-nav-item ${activeTab === 'REQUESTS' ? 'active' : ''}`}
          onClick={() => setActiveTab('REQUESTS')}
        >
          <Send size={20} />
          <span>Phiếu Yêu Cầu</span>
        </button>

        <button 
          className={`bottom-nav-item ${activeTab === 'REPORTS' ? 'active' : ''}`}
          onClick={() => setActiveTab('REPORTS')}
        >
          <Award size={20} />
          <span>Biên Bản NT</span>
        </button>

        <button 
          className="bottom-nav-item"
          onClick={() => {
            const bellBtn = document.querySelector('.btn-icon-badge');
            if (bellBtn) bellBtn.click();
          }}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BellRing size={20} />
            {unreadCount > 0 && <span className="bottom-nav-badge-dot">{unreadCount}</span>}
          </div>
          <span>Thông Báo</span>
        </button>

        <button 
          className="bottom-nav-item"
          onClick={() => setIsMobileProfileOpen(true)}
        >
          <UserCheck size={20} />
          <span>Tài Khoản</span>
        </button>
      </nav>

      {/* MOBILE PROFILE & QUICK ROLE SWITCHER SHEET */}
      <MobileProfileSheet 
        isOpen={isMobileProfileOpen}
        onClose={() => setIsMobileProfileOpen(false)}
        currentUser={currentUser}
        currentRole={currentRole}
        users={users}
        onSwitchUser={handleSwitchUser}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        onLogout={handleLogout}
        pushPermissionGranted={pushPermissionGranted}
        onEnablePush={handleEnablePush}
        onResetAllData={handleResetAllData}
      />

      {/* MODALS */}
      <CreateRequestModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        users={users}
        currentUser={currentUser}
        onSubmitRequest={handleCreateRequest}
        showAlert={showAlert}
      />

      <InvitationDetailModal 
        isOpen={Boolean(selectedRequest)}
        onClose={() => setSelectedRequest(null)}
        request={selectedRequest}
        currentRole={currentRole}
        currentUser={currentUser}
        onOpenReport={(reportId, isCreate) => {
          setSelectedRequest(null);
          handleOpenOrCreateReport(reportId, isCreate);
        }}
      />

      <InspectionReportModal 
        isOpen={Boolean(selectedReport)}
        onClose={() => {
          setSelectedReport(null);
          setInitialOpenRectify(false);
        }}
        report={selectedReport}
        currentRole={currentRole}
        currentUser={currentUser}
        onSaveReport={handleSaveReport}
        onRejectReport={handleRejectReport}
        onReinspectReport={handleReinspectReport}
        onResubmitReport={handleResubmitReport}
        initialOpenRectify={initialOpenRectify}
        showAlert={showAlert}
      />

      <AdminPortalModal 
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        users={users}
        currentUser={currentUser}
        onAddUser={handleAddUser}
        onUpdateUser={handleUpdateUser}
        onDeleteUser={handleDeleteUser}
        onUpdateUserRole={handleUpdateUserRole}
        onToggleUserStatus={handleToggleUserStatus}
        onResetAllData={handleResetAllData}
        showAlert={showAlert}
      />

      {/* MODAL HƯỚNG DẪN BẬT THÔNG BÁO CHO IPHONE (IOS) VÀ TRÌNH DUYỆT */}
      <PushGuideModal 
        isOpen={pushGuideModal.isOpen}
        onClose={() => setPushGuideModal(prev => ({ ...prev, isOpen: false }))}
        reason={pushGuideModal.reason}
        onRetry={handleEnablePush}
      />

      {/* MODAL POPUP CONFIRM & ALERT TÙY CHỈNH CHUẨN APCT (THAY THẾ WINDOW.CONFIRM/ALERT) */}
      <ConfirmDialogModal {...confirmDialog} />
    </div>
  );
}
