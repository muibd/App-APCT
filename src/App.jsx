import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Building2, Plus, Search, Filter, CheckCircle2, Clock, XCircle, 
  AlertTriangle, FileText, ChevronRight, Layers, MapPin, Calendar, 
  Send, Users, ShieldAlert, Award, HardHat, Eye, Briefcase, ShieldCheck,
  BellRing, LogOut, ArrowRight, UserCheck, BookOpen, Settings, Wrench, RotateCcw,
  ArrowLeftRight, NotebookPen, Ban, CreditCard
} from 'lucide-react';

import Navbar from './components/Navbar';
import LoginScreen from './components/LoginScreen';
import PushNotificationToast from './components/PushNotificationToast';
import CreateRequestModal from './components/CreateRequestModal';
import InvitationDetailModal from './components/InvitationDetailModal';
import InspectionReportModal from './components/InspectionReportModal';
import ReassignRecipientModal from './components/ReassignRecipientModal';
import AdminPortalModal from './components/AdminPortalModal';
import UserManagementView from './components/UserManagementView';
import ReportsListView from './components/ReportsListView';
import DailyLogsListView from './components/DailyLogsListView';
import CreateDailyLogModal from './components/CreateDailyLogModal';
import DailyLogDetailModal from './components/DailyLogDetailModal';
import CompletionReportsListView from './components/CompletionReportsListView';
import CreateCompletionReportModal from './components/CreateCompletionReportModal';
import CompletionReportDetailModal from './components/CompletionReportDetailModal';
import MobileProfileSheet from './components/MobileProfileSheet';
import ProfileView from './components/ProfileView';
import PushGuideModal from './components/PushGuideModal';
import ConfirmDialogModal from './components/ConfirmDialogModal';
import StandardsManagementView from './components/StandardsManagementView';
import ProjectManagementView from './components/ProjectManagementView';
import ShopDocumentsView from './components/ShopDocumentsView';
import CreateShopDocumentModal from './components/CreateShopDocumentModal';
import ShopDocumentDetailModal from './components/ShopDocumentDetailModal';
import PaymentDocumentsView from './components/PaymentDocumentsView';
import CreatePaymentDocumentModal from './components/CreatePaymentDocumentModal';
import PaymentDocumentDetailModal from './components/PaymentDocumentDetailModal';
import { 
  MOCK_USERS, 
  MOCK_PROJECT, 
  INITIAL_REQUESTS, 
  INITIAL_REPORTS,
  STANDARD_CRITERIA_LIST,
  INITIAL_NOTIFICATIONS,
  INITIAL_DAILY_LOGS,
  INITIAL_COMPLETION_REPORTS
} from './data/mockData';
import { getSuggestedStandards, loadStoredStandards, STANDARDS_STORAGE_KEY, INITIAL_STANDARDS_DATA } from './data/standardsRules';
import { 
  loadStoredProjects, 
  saveStoredProjects, 
  loadStoredDocTypes, 
  saveStoredDocTypes,
  generateDocumentCode,
  getDocumentRevisionNumber 
} from './data/projectCatalog';
import {
  loadStoredShopDocuments,
  saveStoredShopDocuments,
  loadStoredShopSlaConfigs,
  saveStoredShopSlaConfigs,
  DEFAULT_SHOP_SLA_CONFIGS,
  SHOP_STATUS,
  getEffectiveShopStatus,
  calculateDueDate,
  isShopAssignmentOverdue,
  isShopReviewOverdue,
  getShopLeadSupervisor,
  getShopLeadInvestor,
  SHOP_DOCUMENTS_STORAGE_KEY,
  SHOP_SLA_STORAGE_KEY
} from './data/shopDocumentConstants';
import {
  loadStoredPaymentDocuments,
  saveStoredPaymentDocuments,
  loadStoredPaymentSlaConfigs,
  saveStoredPaymentSlaConfigs,
  DEFAULT_PAYMENT_SLA_CONFIGS,
  PAYMENT_STATUS,
  getEffectivePaymentStatus,
  isPaymentAssignmentOverdue,
  isPaymentReviewOverdue,
  getPaymentLeadSupervisor,
  getPaymentLeadInvestor,
  PAYMENT_DOCUMENTS_STORAGE_KEY,
  PAYMENT_SLA_STORAGE_KEY
} from './data/paymentDocumentConstants';

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
  seedOfficialUsersToCloud,
  clearAllCloudInspectionData,
  subscribeToDailyLogs,
  saveDailyLog,
  updateDailyLog,
  deleteDailyLog,
  subscribeToCompletionReports,
  saveCompletionReport,
  updateCompletionReport,
  deleteCompletionReport,
  subscribeToStandards,
  saveInspectionStandards,
  subscribeToShopDocuments,
  saveShopDocument,
  deleteShopDocument,
  subscribeToShopSlaConfigs,
  saveShopSlaConfigs,
  subscribeToPaymentDocuments,
  savePaymentDocument,
  deletePaymentDocument,
  subscribeToPaymentSlaConfigs,
  savePaymentSlaConfigs,
  cleanupOldRequestsAndReports
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
  saveToIndexedDB,
  getAllFromIndexedDB, 
  clearAllFromIndexedDB, 
  clearAllAPCTStorage 
} from './utils/storageHelper';

const USERS_STORAGE_KEY = 'apct_users_list';
const NOTIF_STORAGE_KEY = 'apct_notifications_list';
const REQUESTS_STORAGE_KEY = 'apct_requests_list';
const REPORTS_STORAGE_KEY = 'apct_reports_list';
const DAILY_LOGS_STORAGE_KEY = 'apct_daily_logs_v1';
const COMPLETION_REPORTS_STORAGE_KEY = 'apct_completion_reports_v1';
const DATA_VERSION_KEY = 'apct_data_version';
const CURRENT_DATA_VERSION = '20261026_clean_v3';

// Tự động dọn dẹp các biên bản/phiếu cũ từ phiên kiểm thử trước để bắt đầu sạch sẽ
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const savedVer = localStorage.getItem(DATA_VERSION_KEY);
    if (savedVer !== CURRENT_DATA_VERSION) {
      localStorage.removeItem(REQUESTS_STORAGE_KEY);
      localStorage.removeItem(REPORTS_STORAGE_KEY);
      localStorage.removeItem(NOTIF_STORAGE_KEY);
      localStorage.removeItem(DAILY_LOGS_STORAGE_KEY);
      localStorage.removeItem(COMPLETION_REPORTS_STORAGE_KEY);
      localStorage.setItem(DATA_VERSION_KEY, CURRENT_DATA_VERSION);
      clearAllFromIndexedDB('requests');
      clearAllFromIndexedDB('reports');
    }
  } catch (e) {
    console.warn('Lỗi kiểm tra phiên bản dữ liệu:', e);
  }
}

// Chuẩn hóa dữ liệu biên bản: số biên bản là WA hoặc MI, mã căn cứ theo cấu trúc [Mã CT]/[WA|MI]/[ddMMyy]-[revStr].01
function sanitizeReportData(r) {
  if (!r) return r;
  const isMat = r.reportTemplate === 'FORM_12' || r.inspectionType === 'MATERIAL';
  const docCode = isMat ? 'MI' : 'WA';
  const projCode = r.projectCode || (
    (r.projectInfo?.buildingName || '').includes('2204') || (r.projectInfo?.buildingName || '').includes('cao tầng') ? '2204' : '2203'
  );

  let repNum = (r.reportNumber || '').trim();
  repNum = repNum.replace(/^\.\.\.\.\.\.\s*/, '').replace(/^\.\.\.\s*/, '').trim();
  repNum = repNum.replace(/^IR[\/\s-]*/i, '').replace(/[\/\s-]IR$/i, '').trim();
  if (!repNum || repNum === '......' || repNum === 'IR' || repNum === docCode) {
    repNum = docCode;
  } else if (!repNum.includes(docCode)) {
    repNum = `${repNum}/${docCode}`;
  }

  const rev = getDocumentRevisionNumber(r);
  const revStr = String(rev).padStart(2, '0');

  let refNum = (r.projectCategoryCode || r.referenceDocNumber || '').trim();
  if (!refNum || refNum.startsWith('TLCC') || refNum.includes('TLCC') || !refNum.includes('/')) {
    refNum = generateDocumentCode(projCode, docCode, r.createdAt || new Date(), rev);
  } else {
    refNum = refNum.replace(/\/(IR|MI|WA)\//, `/${docCode}/`);
    if (/-\d+(\.\d+)?$/.test(refNum)) {
      refNum = refNum.replace(/-\d+(\.\d+)?$/, `-${revStr}.01`);
    } else {
      refNum = `${refNum}-${revStr}.01`;
    }
  }

  return {
    ...r,
    revisionNumber: rev,
    reportNumber: repNum,
    projectCode: projCode,
    docTypeCode: docCode,
    projectCategoryCode: refNum,
    referenceDocNumber: refNum
  };
}

export default function App() {
  // Quản lý danh sách cán bộ: ưu tiên localStorage, tự chuẩn hóa password & status (lọc bỏ tài khoản test cũ)
  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem(USERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = parsed.filter(u => {
            const uid = (u?.uid || '').toLowerCase();
            const email = (u?.email || '').toLowerCase();
            return !(uid === 'uid_muitvgsv' || uid === 'uid_muicdt' ||
                     uid === 'uid_custom_1792576174520' || uid === 'uid_custom_1792576233247' ||
                     email.includes('muitvgs') || email.includes('muicdt'));
          });
          const merged = [...filtered];
          MOCK_USERS.forEach(m => {
            const existingIdx = merged.findIndex(u => u.uid === m.uid || ((u.email || '').toLowerCase() === (m.email || '').toLowerCase()));
            if (existingIdx === -1) {
              merged.push(m);
            }
          });
          return merged.map(u => {
            const mock = MOCK_USERS.find(m => m.uid === u.uid || ((u.email || '').toLowerCase() === (m.email || '').toLowerCase()));
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

  // Mốc thời gian bắt đầu ngày 26/10/2026 giờ VN (Xóa toàn bộ dữ liệu kiểm thử cũ từ hôm qua trở về trước)
  const OLD_DATA_CUTOFF = '2026-10-25T17:00:00.000Z';

  const [requests, setRequests] = useState(() => {
    try {
      const saved = localStorage.getItem(REQUESTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(item => {
            const c = item.createdAt || '';
            return !c || c >= OLD_DATA_CUTOFF;
          });
          safeSaveLocalStorage(REQUESTS_STORAGE_KEY, filtered);
          return filtered;
        }
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
        if (Array.isArray(parsed)) {
          const sanitized = parsed
            .map(sanitizeReportData)
            .filter(item => {
              const c = item.createdAt || '';
              return !c || c >= OLD_DATA_CUTOFF;
            });
          safeSaveLocalStorage(REPORTS_STORAGE_KEY, sanitized);
          return sanitized;
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc reports từ localStorage:', e);
    }
    return INITIAL_REPORTS;
  });

  const [dailyLogs, setDailyLogs] = useState(() => {
    try {
      const saved = localStorage.getItem(DAILY_LOGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Lỗi đọc dailyLogs từ localStorage:', e);
    }
    return INITIAL_DAILY_LOGS || [];
  });

  const [completionReports, setCompletionReports] = useState(() => {
    try {
      const saved = localStorage.getItem(COMPLETION_REPORTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Lỗi đọc completionReports từ localStorage:', e);
    }
    return INITIAL_COMPLETION_REPORTS || [];
  });

  // Quản lý Hồ sơ bộ phận Shop & Cấu hình thời hạn phản hồi (SLA)
  const [shopDocuments, setShopDocuments] = useState(loadStoredShopDocuments);
  const [shopSlaConfigs, setShopSlaConfigs] = useState(loadStoredShopSlaConfigs);

  // Quản lý Hồ sơ thanh toán (Tạm ứng, Thanh toán, Quyết toán) & Cấu hình thời hạn phản hồi (SLA)
  const [paymentDocuments, setPaymentDocuments] = useState(loadStoredPaymentDocuments);
  const [paymentSlaConfigs, setPaymentSlaConfigs] = useState(loadStoredPaymentSlaConfigs);

  const [standards, setStandards] = useState(STANDARD_CRITERIA_LIST);
  const [standardsData, setStandardsData] = useState(loadStoredStandards);
  const [projectsList, setProjectsList] = useState(loadStoredProjects);
  const [docTypesList, setDocTypesList] = useState(loadStoredDocTypes);

  const handleSaveProjects = (newProjects) => {
    setProjectsList(newProjects);
    saveStoredProjects(newProjects);
  };

  const handleSaveDocTypes = (newDocTypes) => {
    setDocTypesList(newDocTypes);
    saveStoredDocTypes(newDocTypes);
  };

  // User Authentication State: Lấy từ localStorage nếu có, mặc định là null để hiện màn hình Login
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('apct_logged_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        const uid = (parsed?.uid || '').toLowerCase();
        const email = (parsed?.email || '').toLowerCase();
        const isTest = uid === 'uid_muitvgsv' || uid === 'uid_muicdt' ||
                       uid === 'uid_custom_1792576174520' || uid === 'uid_custom_1792576233247' ||
                       email.includes('muitvgs') || email.includes('muicdt');
        if (isTest) {
          localStorage.removeItem('apct_logged_user');
          return null;
        }
        return parsed;
      }
      return null;
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

  // Đồng bộ refs cho real-time listeners & notification routing
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;
  const requestsRef = useRef(requests);
  requestsRef.current = requests;
  const reportsRef = useRef(reports);
  reportsRef.current = reports;
  const usersRef = useRef(users);
  usersRef.current = users;
  const shopDocumentsRef = useRef(shopDocuments);
  shopDocumentsRef.current = shopDocuments;
  const paymentDocumentsRef = useRef(paymentDocuments);
  paymentDocumentsRef.current = paymentDocuments;
  const dailyLogsRef = useRef(dailyLogs);
  dailyLogsRef.current = dailyLogs;
  const completionReportsRef = useRef(completionReports);
  completionReportsRef.current = completionReports;

  // Helper chuẩn hóa so sánh tên (loại bỏ chức danh như KS, Chỉ huy trưởng...)
  const normalizePersonName = (name) => {
    if (!name) return '';
    return name
      .toLowerCase()
      .replace(/^(ks\.|kỹ sư|thạc sĩ|tiến sĩ|chỉ huy trưởng|chỉ huy phó|cán bộ)\s+/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // ============================================================================
  // 1. HÀM KIỂM TRA PHÂN QUYỀN TRUY CẬP PHIẾU YÊU CẦU & BIÊN BẢN NGHIỆM THU
  // ============================================================================
  const canAccessInspection = (req, rep, user, allUsers) => {
    if (!user) return false;
    const role = user.role;

    // 1. Quản trị viên (ADMIN): luôn xem được tất cả
    if (role === 'ADMIN') return true;

    const curUid = user.uid;
    const curEmail = (user.email || '').trim().toLowerCase();
    const curName = (user.fullName || '').trim().toLowerCase();
    const curNormName = normalizePersonName(user.fullName);

    // 2. Phân hệ Đơn Vị Thi Công (CONTRACTOR):
    // "Ai xem được của người đó": Mỗi cán bộ ĐVTC chỉ xem phiếu/biên bản do chính mình tạo ra hoặc đứng tên ký
    if (role === 'CONTRACTOR') {
      const reqCreatedUid = req?.createdByUid;
      const reqCreatedName = (req?.createdByName || '').trim().toLowerCase();
      const reqCreatedNorm = normalizePersonName(req?.createdByName);
      const repContractorPerson = (rep?.attendees?.contractor?.person || '').trim().toLowerCase();
      const repContractorNorm = normalizePersonName(rep?.attendees?.contractor?.person);
      const repContractorUid = rep?.attendees?.contractor?.uid;

      const isMyInspection = Boolean(
        (curUid && reqCreatedUid && curUid === reqCreatedUid) ||
        (curName && reqCreatedName && curName === reqCreatedName) ||
        (curNormName && reqCreatedNorm && curNormName === reqCreatedNorm) ||
        (curUid && repContractorUid && curUid === repContractorUid) ||
        (curName && repContractorPerson && curName === repContractorPerson) ||
        (curNormName && repContractorNorm && curNormName === repContractorNorm)
      );

      return isMyInspection;
    }

    // 3. Phân hệ Tư Vấn Giám Sát (SUPERVISOR & LEAD_SUPERVISOR):
    const isSupervisorLead = role === 'LEAD_SUPERVISOR' || Boolean(user.isLead && role === 'SUPERVISOR') || (role === 'SUPERVISOR' && (user.position || '').toLowerCase().includes('trưởng'));
    if (role === 'SUPERVISOR' || role === 'LEAD_SUPERVISOR') {
      const recipients = req?.assignedRecipients || rep?.assignedRecipients || [];
      const supPerson = (rep?.attendees?.supervisor?.person || '').trim().toLowerCase();
      const supPersonNorm = normalizePersonName(rep?.attendees?.supervisor?.person);
      const supEmail = (rep?.attendees?.supervisor?.email || '').trim().toLowerCase();
      const supUid = rep?.attendees?.supervisor?.uid;

      // Kiểm tra chỉ định đích danh cho chính cán bộ này ("ai xem được của người đó")
      const isDirectlyAssigned = recipients.some(rec => {
        if (rec.role !== 'SUPERVISOR' && rec.role !== 'LEAD_SUPERVISOR') return false;
        const rUid = rec.uid;
        const rEmail = (rec.email || '').trim().toLowerCase();
        const rName = (rec.fullName || '').trim().toLowerCase();
        const rNormName = normalizePersonName(rec.fullName);
        return (curUid && rUid && curUid === rUid) || 
               (curEmail && rEmail && curEmail === rEmail) || 
               (curName && rName && curName === rName) ||
               (curNormName && rNormName && curNormName === rNormName);
      });

      const isDirectAttendee = Boolean(
        (curUid && supUid && curUid === supUid) ||
        (curName && supPerson && curName === supPerson) ||
        (curNormName && supPersonNorm && curNormName === supPersonNorm) ||
        (curEmail && supEmail && curEmail === supEmail)
      );

      // Nếu là cán bộ TVGS thường: CHỈ xem nếu được chỉ định đích danh cho chính mình
      if (!isSupervisorLead) {
        return Boolean(isDirectlyAssigned || isDirectAttendee);
      }

      // Nếu là TVGS Trưởng: xem nếu chỉ định cho mình HOẶC cho các cán bộ TVGS cấp dưới quyền
      const subIds = Array.isArray(user.subordinateIds) ? user.subordinateIds : [];
      const hasExplicitSubs = subIds.length > 0 || (allUsers || []).some(u => u.leaderId === curUid);
      const mySubordinates = (allUsers || []).filter(u => {
        if (u.uid === curUid) return false;
        if (u.role !== 'SUPERVISOR') return false;
        if ((u.position || '').toLowerCase().includes('trưởng')) return false;
        if (hasExplicitSubs) {
          return u.leaderId === curUid || subIds.includes(u.uid);
        }
        return true;
      });
      const subUids = mySubordinates.map(u => u.uid);
      const subEmails = mySubordinates.map(u => (u.email || '').trim().toLowerCase()).filter(Boolean);
      const subNormNames = mySubordinates.map(u => normalizePersonName(u.fullName)).filter(Boolean);

      const isAssignedToSub = recipients.some(rec => {
        if (rec.role !== 'SUPERVISOR') return false;
        const rUid = rec.uid;
        const rEmail = (rec.email || '').trim().toLowerCase();
        const rNormName = normalizePersonName(rec.fullName);
        const rLeader = rec.leaderId;

        if (rLeader && rLeader === curUid) return true;
        if (rUid && subUids.includes(rUid)) return true;
        if (rEmail && subEmails.includes(rEmail)) return true;
        if (rNormName && subNormNames.includes(rNormName)) return true;
        return false;
      });

      const isSubAttendee = Boolean(
        (supPersonNorm && subNormNames.includes(supPersonNorm)) ||
        (supEmail && subEmails.includes(supEmail))
      );

      return Boolean(isDirectlyAssigned || isDirectAttendee || isAssignedToSub || isSubAttendee);
    }

    // 4. Phân hệ Chủ Đầu Tư (INVESTOR & LEAD_INVESTOR):
    const isInvestorLead = role === 'LEAD_INVESTOR' || Boolean(user.isLead && role === 'INVESTOR') || (role === 'INVESTOR' && ((user.position || '').toLowerCase().includes('trưởng') || (user.position || '').toLowerCase().includes('giám đốc')));
    if (role === 'INVESTOR' || role === 'LEAD_INVESTOR') {
      const recipients = req?.assignedRecipients || rep?.assignedRecipients || [];
      const invPerson = (rep?.attendees?.investor?.person || '').trim().toLowerCase();
      const invPersonNorm = normalizePersonName(rep?.attendees?.investor?.person);
      const invEmail = (rep?.attendees?.investor?.email || '').trim().toLowerCase();
      const invUid = rep?.attendees?.investor?.uid;

      // Kiểm tra chỉ định đích danh cho chính cán bộ này ("ai xem được của người đó")
      const isDirectlyAssigned = recipients.some(rec => {
        if (rec.role !== 'INVESTOR' && rec.role !== 'LEAD_INVESTOR') return false;
        const rUid = rec.uid;
        const rEmail = (rec.email || '').trim().toLowerCase();
        const rName = (rec.fullName || '').trim().toLowerCase();
        const rNormName = normalizePersonName(rec.fullName);
        return (curUid && rUid && curUid === rUid) || 
               (curEmail && rEmail && curEmail === rEmail) || 
               (curName && rName && curName === rName) ||
               (curNormName && rNormName && curNormName === rNormName);
      });

      const isDirectAttendee = Boolean(
        (curUid && invUid && curUid === invUid) ||
        (curName && invPerson && curName === invPerson) ||
        (curNormName && invPersonNorm && curNormName === invPersonNorm) ||
        (curEmail && invEmail && curEmail === invEmail)
      );

      // Nếu là cán bộ CĐT thường: CHỈ xem nếu được chỉ định đích danh cho chính mình
      if (!isInvestorLead) {
        return Boolean(isDirectlyAssigned || isDirectAttendee);
      }

      // Nếu là CĐT Trưởng: xem nếu chỉ định cho mình HOẶC cho các cán bộ CĐT cấp dưới quyền
      const subIds = Array.isArray(user.subordinateIds) ? user.subordinateIds : [];
      const hasExplicitSubs = subIds.length > 0 || (allUsers || []).some(u => u.leaderId === curUid);
      const mySubordinates = (allUsers || []).filter(u => {
        if (u.uid === curUid) return false;
        if (u.role !== 'INVESTOR') return false;
        if ((u.position || '').toLowerCase().includes('trưởng') || (u.position || '').toLowerCase().includes('giám đốc')) return false;
        if (hasExplicitSubs) {
          return u.leaderId === curUid || subIds.includes(u.uid);
        }
        return true;
      });
      const subUids = mySubordinates.map(u => u.uid);
      const subEmails = mySubordinates.map(u => (u.email || '').trim().toLowerCase()).filter(Boolean);
      const subNormNames = mySubordinates.map(u => normalizePersonName(u.fullName)).filter(Boolean);

      const isAssignedToSub = recipients.some(rec => {
        if (rec.role !== 'INVESTOR') return false;
        const rUid = rec.uid;
        const rEmail = (rec.email || '').trim().toLowerCase();
        const rNormName = normalizePersonName(rec.fullName);
        const rLeader = rec.leaderId;

        if (rLeader && rLeader === curUid) return true;
        if (rUid && subUids.includes(rUid)) return true;
        if (rEmail && subEmails.includes(rEmail)) return true;
        if (rNormName && subNormNames.includes(rNormName)) return true;
        return false;
      });

      const isSubAttendee = Boolean(
        (invPersonNorm && subNormNames.includes(invPersonNorm)) ||
        (invEmail && subEmails.includes(invEmail))
      );

      return Boolean(isDirectlyAssigned || isDirectAttendee || isAssignedToSub || isSubAttendee);
    }

    return false;
  };

  // ============================================================================
  // 2. CÁC HÀM KIỂM TRA PHÂN QUYỀN TRUY CẬP CHO SHOP, THANH TOÁN, NHẬT KÝ, HOÀN THÀNH
  // ============================================================================
  const canAccessShopDocument = (doc, user, allUsers, notif) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    const curUid = user.uid;
    const curName = normalizePersonName(user.fullName);

    if (notif?.recipientUid && notif.recipientUid === curUid) return true;
    if (Array.isArray(notif?.extraRecipientUids) && notif.extraRecipientUids.includes(curUid)) return true;

    const isSupervisorLead = user.role === 'LEAD_SUPERVISOR' || Boolean(user.isLead && user.role === 'SUPERVISOR') || (user.role === 'SUPERVISOR' && (user.position || '').toLowerCase().includes('giám sát trưởng'));
    const isInvestorLead = user.role === 'LEAD_INVESTOR' || Boolean(user.isLead && user.role === 'INVESTOR') || (user.role === 'INVESTOR' && ((user.position || '').toLowerCase().includes('trưởng ban') || (user.position || '').toLowerCase().includes('giám đốc')));

    if (isSupervisorLead || isInvestorLead) return true;

    const creatorUid = doc?.createdByUid || notif?.createdByUid;
    const creatorName = normalizePersonName(doc?.createdByName || notif?.createdByName);
    if (user.role === 'CONTRACTOR') {
      return Boolean((curUid && creatorUid && curUid === creatorUid) || (curName && creatorName && curName === creatorName));
    }

    if (user.role === 'SUPERVISOR') {
      const tvgsAssignee = doc?.assignedTvgs?.assignee || (doc?.assignedTvgs?.uid ? doc.assignedTvgs : null);
      const tvgsUid = tvgsAssignee?.uid;
      const tvgsName = normalizePersonName(tvgsAssignee?.fullName);
      return Boolean((curUid && tvgsUid && curUid === tvgsUid) || (curName && tvgsName && curName === tvgsName));
    }

    if (user.role === 'INVESTOR') {
      const invAssignee = doc?.assignedInvestor?.assignee || (doc?.assignedInvestor?.uid ? doc.assignedInvestor : null);
      const invUid = invAssignee?.uid;
      const invName = normalizePersonName(invAssignee?.fullName);
      return Boolean((curUid && invUid && curUid === invUid) || (curName && invName && curName === invName));
    }

    return false;
  };

  const canAccessPaymentDocument = (doc, user, allUsers, notif) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    const curUid = user.uid;
    const curName = normalizePersonName(user.fullName);

    if (notif?.recipientUid && notif.recipientUid === curUid) return true;
    if (Array.isArray(notif?.extraRecipientUids) && notif.extraRecipientUids.includes(curUid)) return true;

    const isSupervisorLead = user.role === 'LEAD_SUPERVISOR' || Boolean(user.isLead && user.role === 'SUPERVISOR') || (user.role === 'SUPERVISOR' && (user.position || '').toLowerCase().includes('giám sát trưởng'));
    const isInvestorLead = user.role === 'LEAD_INVESTOR' || Boolean(user.isLead && user.role === 'INVESTOR') || (user.role === 'INVESTOR' && ((user.position || '').toLowerCase().includes('trưởng ban') || (user.position || '').toLowerCase().includes('giám đốc')));

    if (isSupervisorLead || isInvestorLead) return true;

    const creatorUid = doc?.createdByUid || notif?.createdByUid;
    const creatorName = normalizePersonName(doc?.createdByName || notif?.createdByName);
    if (user.role === 'CONTRACTOR') {
      return Boolean((curUid && creatorUid && curUid === creatorUid) || (curName && creatorName && curName === creatorName));
    }

    if (user.role === 'SUPERVISOR') {
      const tvgsAssignee = doc?.assignedTvgs?.assignee || (doc?.assignedTvgs?.uid ? doc.assignedTvgs : null);
      const tvgsUid = tvgsAssignee?.uid;
      const tvgsName = normalizePersonName(tvgsAssignee?.fullName);
      return Boolean((curUid && tvgsUid && curUid === tvgsUid) || (curName && tvgsName && curName === tvgsName));
    }

    if (user.role === 'INVESTOR') {
      const invAssignee = doc?.assignedInvestor?.assignee || (doc?.assignedInvestor?.uid ? doc.assignedInvestor : null);
      const invUid = invAssignee?.uid;
      const invName = normalizePersonName(invAssignee?.fullName);
      return Boolean((curUid && invUid && curUid === invUid) || (curName && invName && curName === invName));
    }

    return false;
  };

  const canAccessDailyLog = (log, user, allUsers, notif) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    const curUid = user.uid;
    const curName = normalizePersonName(user.fullName);

    if (notif?.recipientUid && notif.recipientUid === curUid) return true;
    if (Array.isArray(notif?.extraRecipientUids) && notif.extraRecipientUids.includes(curUid)) return true;

    const isSupervisorLead = user.role === 'LEAD_SUPERVISOR' || Boolean(user.isLead && user.role === 'SUPERVISOR');
    const isInvestorLead = user.role === 'LEAD_INVESTOR' || Boolean(user.isLead && user.role === 'INVESTOR');
    if (isSupervisorLead || isInvestorLead) return true;

    const creatorUid = log?.createdByUid || log?.contractorUid || notif?.createdByUid;
    const creatorName = normalizePersonName(log?.contractorName || notif?.createdByName);
    if (user.role === 'CONTRACTOR') {
      return Boolean((curUid && creatorUid && curUid === creatorUid) || (curName && creatorName && curName === creatorName));
    }

    if (user.role === 'SUPERVISOR') {
      const supUid = log?.supervisorUid || log?.assignedSupervisor?.uid;
      const supName = normalizePersonName(log?.assignedSupervisor?.name || log?.assignedSupervisor?.fullName);
      return Boolean((curUid && supUid && curUid === supUid) || (curName && supName && curName === supName));
    }

    return false;
  };

  const canAccessCompletionReport = (cr, user, allUsers, notif) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    const curUid = user.uid;
    const curName = normalizePersonName(user.fullName);

    if (notif?.recipientUid && notif.recipientUid === curUid) return true;
    if (Array.isArray(notif?.extraRecipientUids) && notif.extraRecipientUids.includes(curUid)) return true;

    const isSupervisorLead = user.role === 'LEAD_SUPERVISOR' || Boolean(user.isLead && user.role === 'SUPERVISOR');
    const isInvestorLead = user.role === 'LEAD_INVESTOR' || Boolean(user.isLead && user.role === 'INVESTOR');
    if (isSupervisorLead || isInvestorLead) return true;

    const creatorUid = cr?.createdByUid || cr?.contractorUid || notif?.createdByUid;
    const creatorName = normalizePersonName(cr?.contractorName || notif?.createdByName);
    if (user.role === 'CONTRACTOR') {
      return Boolean((curUid && creatorUid && curUid === creatorUid) || (curName && creatorName && curName === creatorName));
    }

    const hasSig = Boolean(
      (user.role === 'SUPERVISOR' && (cr?.signatures?.supervisor?.signerUid === curUid || normalizePersonName(cr?.signatures?.supervisor?.signerName) === curName)) ||
      (user.role === 'INVESTOR' && (cr?.signatures?.investor?.signerUid === curUid || normalizePersonName(cr?.signatures?.investor?.signerName) === curName))
    );
    return hasSig;
  };

  // ============================================================================
  // 3. HÀM KIỂM TRA PHÂN PHỐI THÔNG BÁO CHÍNH XÁC (NOTIFICATION RECIPIENT RESOLVER)
  // Chỉ những người được ủy quyền / phân công mới nhận được thông báo
  // ============================================================================
  const checkNotificationRecipient = (
    notif, 
    user = currentUserRef.current, 
    reqList = requestsRef.current, 
    repList = reportsRef.current,
    allUsers = usersRef.current
  ) => {
    if (!user || !notif) return false;
    const role = user.role;

    // 0. Quản trị viên (ADMIN): Luôn nhận để giám sát toàn dự án
    if (role === 'ADMIN') return true;

    const curUid = user.uid;
    const curEmail = (user.email || '').trim().toLowerCase();
    const curName = (user.fullName || '').trim().toLowerCase();
    const curNormName = normalizePersonName(user.fullName);

    // 1. THÔNG BÁO HỒ SƠ SHOP
    if (notif.targetShopDocId) {
      const sDoc = (shopDocumentsRef.current || []).find(d => d.id === notif.targetShopDocId);
      return canAccessShopDocument(sDoc, user, allUsers, notif);
    }

    // 2. THÔNG BÁO HỒ SƠ THANH TOÁN
    if (notif.targetPaymentDocId) {
      const pDoc = (paymentDocumentsRef.current || []).find(d => d.id === notif.targetPaymentDocId);
      return canAccessPaymentDocument(pDoc, user, allUsers, notif);
    }

    // 3. THÔNG BÁO NHẬT KÝ THI CÔNG
    if (notif.targetDailyLogId) {
      const dl = (dailyLogsRef.current || []).find(l => l.id === notif.targetDailyLogId);
      return canAccessDailyLog(dl, user, allUsers, notif);
    }

    // 4. THÔNG BÁO BIÊN BẢN NGHIỆM THU HOÀN THÀNH
    if (notif.targetCompletionReportId) {
      const cr = (completionReportsRef.current || []).find(l => l.id === notif.targetCompletionReportId);
      return canAccessCompletionReport(cr, user, allUsers, notif);
    }

    // 5. THÔNG BÁO PHIẾU YÊU CẦU & BIÊN BẢN NGHIỆM THU
    if (notif.targetRequestId || notif.targetReportId) {
      const req = (reqList || []).find(r => 
        (notif.targetRequestId && (r.id === notif.targetRequestId || r.requestNumber === notif.targetRequestId)) ||
        (notif.targetReportId && (r.reportId === notif.targetReportId || r.id === notif.targetReportId))
      );
      const rep = (repList || []).find(r => 
        (notif.targetReportId && (r.id === notif.targetReportId || r.reportNumber === notif.targetReportId)) ||
        (notif.targetRequestId && (r.requestId === notif.targetRequestId || r.id === notif.targetRequestId))
      );

      // Tạo đối tượng dữ liệu tổng hợp
      const effectiveReq = req || {
        id: notif.targetRequestId,
        createdByUid: notif.createdByUid,
        createdByName: notif.createdByName,
        assignedRecipients: notif.assignedRecipients || []
      };
      const effectiveRep = rep || {
        id: notif.targetReportId,
        requestId: notif.targetRequestId,
        assignedRecipients: notif.assignedRecipients || [],
        attendees: {
          contractor: { uid: notif.createdByUid, person: notif.createdByName },
          supervisor: (notif.assignedRecipients || []).find(r => r.role === 'SUPERVISOR'),
          investor: (notif.assignedRecipients || []).find(r => r.role === 'INVESTOR')
        }
      };

      // ĐIỀU KIỆN TIÊN QUYẾT BẮT BUỘC: Nếu không có quyền truy cập phiếu -> TUYỆT ĐỐI KHÔNG NHẬN THÔNG BÁO!
      const hasAccess = canAccessInspection(effectiveReq, effectiveRep, user, allUsers);
      if (!hasAccess) {
        return false;
      }

      // Đích danh trực tiếp
      if (notif.recipientUid && notif.recipientUid === curUid) return true;
      if (Array.isArray(notif.extraRecipientUids) && notif.extraRecipientUids.includes(curUid)) return true;

      // Kỹ thuật hiện trường (CONTRACTOR): Phải là người tạo phiếu
      if (role === 'CONTRACTOR') {
        const creatorUid = notif.createdByUid || effectiveReq.createdByUid || effectiveRep.createdByUid;
        const creatorName = (notif.createdByName || effectiveReq.createdByName || effectiveRep.createdByName || '').trim().toLowerCase();
        const creatorNorm = normalizePersonName(notif.createdByName || effectiveReq.createdByName || effectiveRep.createdByName);
        return Boolean(
          (curUid && creatorUid && curUid === creatorUid) ||
          (curName && creatorName && curName === creatorName) ||
          (curNormName && creatorNorm && curNormName === creatorNorm)
        );
      }

      const isSupervisorLead = role === 'LEAD_SUPERVISOR' || Boolean(user.isLead && role === 'SUPERVISOR') || (role === 'SUPERVISOR' && (user.position || '').toLowerCase().includes('trưởng'));
      const isInvestorLead = role === 'LEAD_INVESTOR' || Boolean(user.isLead && role === 'INVESTOR') || (role === 'INVESTOR' && ((user.position || '').toLowerCase().includes('trưởng') || (user.position || '').toLowerCase().includes('giám đốc')));

      // Trưởng bộ phận phụ trách cấp dưới liên quan
      if (isSupervisorLead) {
        if (!notif.targetRoles || notif.targetRoles.includes('LEAD_SUPERVISOR') || notif.targetRoles.includes('SUPERVISOR')) {
          return true;
        }
      }
      if (isInvestorLead) {
        if (!notif.targetRoles || notif.targetRoles.includes('LEAD_INVESTOR') || notif.targetRoles.includes('INVESTOR')) {
          return true;
        }
      }

      // Cán bộ TVGS / CĐT thường: Phải là người được phân công trực tiếp
      const assignedRecipients = effectiveReq.assignedRecipients || effectiveRep.assignedRecipients || [];
      const isDirectAssigned = assignedRecipients.some(rec => {
        if (rec.role && rec.role !== role) return false;
        const rUid = rec.uid;
        const rEmail = (rec.email || '').trim().toLowerCase();
        const rName = (rec.fullName || '').trim().toLowerCase();
        const rNorm = normalizePersonName(rec.fullName);
        return (curUid && rUid && curUid === rUid) ||
               (curEmail && rEmail && curEmail === rEmail) ||
               (curName && rName && curName === rName) ||
               (curNormName && rNorm && curNormName === rNorm);
      });

      const isDirectAttendee = Boolean(
        (role === 'SUPERVISOR' && (
          (curUid && effectiveRep.attendees?.supervisor?.uid === curUid) ||
          (curEmail && effectiveRep.attendees?.supervisor?.email?.toLowerCase() === curEmail) ||
          (curNormName && normalizePersonName(effectiveRep.attendees?.supervisor?.person) === curNormName)
        )) ||
        (role === 'INVESTOR' && (
          (curUid && effectiveRep.attendees?.investor?.uid === curUid) ||
          (curEmail && effectiveRep.attendees?.investor?.email?.toLowerCase() === curEmail) ||
          (curNormName && normalizePersonName(effectiveRep.attendees?.investor?.person) === curNormName)
        ))
      );

      if (!isDirectAssigned && !isDirectAttendee) {
        return false;
      }

      // Kiểm tra vai trò đích
      if (role === 'SUPERVISOR') {
        return !notif.targetRoles || notif.targetRoles.includes('SUPERVISOR');
      }
      if (role === 'INVESTOR') {
        return !notif.targetRoles || notif.targetRoles.includes('INVESTOR');
      }

      return false;
    }

    // 6. THÔNG BÁO ĐÍCH DANH KHÁC
    if (notif.recipientUid && notif.recipientUid === curUid) return true;
    if (Array.isArray(notif.extraRecipientUids) && notif.extraRecipientUids.includes(curUid)) return true;

    return false;
  };

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
          prev.forEach(r => map.set(r.id, r));
          idbReports.forEach(rawIr => {
            const ir = sanitizeReportData(rawIr);
            const key = ir.id;
            const created = ir.createdAt || '';
            // Bỏ qua các bản ghi trước ngày cutoff
            if (!key || (created && created < OLD_DATA_CUTOFF)) return;
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
          prev.forEach(r => map.set(r.id, r));
          idbRequests.forEach(ir => {
            const key = ir.id;
            const created = ir.createdAt || '';
            // Bỏ qua các bản ghi trước ngày cutoff
            if (!key || (created && created < OLD_DATA_CUTOFF)) return;
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

    getAllFromIndexedDB('shop_documents').then(idbShopDocs => {
      if (idbShopDocs && idbShopDocs.length > 0) {
        setShopDocuments(prev => {
          const map = new Map();
          (prev || []).forEach(d => { if (d?.id) map.set(d.id, d); });
          idbShopDocs.forEach(d => {
            if (d?.id && !map.has(d.id)) {
              map.set(d.id, d);
            }
          });
          const merged = Array.from(map.values());
          merged.sort((a, b) => new Date(b.submittedAt || b.createdAt || 0) - new Date(a.submittedAt || a.createdAt || 0));
          saveStoredShopDocuments(merged);
          return merged;
        });
      }
    });

    getAllFromIndexedDB('payment_documents').then(idbPaymentDocs => {
      if (idbPaymentDocs && idbPaymentDocs.length > 0) {
        setPaymentDocuments(prev => {
          const map = new Map();
          (prev || []).forEach(d => { if (d?.id) map.set(d.id, d); });
          idbPaymentDocs.forEach(d => {
            if (d?.id && !map.has(d.id)) {
              map.set(d.id, d);
            }
          });
          const merged = Array.from(map.values());
          merged.sort((a, b) => new Date(b.submittedAt || b.createdAt || 0) - new Date(a.submittedAt || a.createdAt || 0));
          saveStoredPaymentDocuments(merged);
          return merged;
        });
      }
    });
  }, []);

  // 0. Tự động dọn dẹp các phiếu và biên bản cũ trước ngày 26/10/2026 trên Firestore (chỉ thực hiện 1 lần)
  useEffect(() => {
    const cleanupKey = `apct_cleaned_${OLD_DATA_CUTOFF}`;
    if (!localStorage.getItem(cleanupKey)) {
      cleanupOldRequestsAndReports(OLD_DATA_CUTOFF)
        .then(() => {
          try { localStorage.setItem(cleanupKey, 'done'); } catch (_) {}
        })
        .catch(console.warn);
    }
  }, []);

  // 1. Đồng bộ Real-Time Phiếu yêu cầu từ Firestore (Lấy Firestore làm chuẩn)
  useEffect(() => {
    const unsubscribe = subscribeToRequests((cloudRequests) => {
      setRequests(prev => {
        if (!Array.isArray(cloudRequests)) return prev;
        const map = new Map();

        // Nạp danh sách từ Firestore bằng ID duy nhất (loại bỏ dữ liệu cũ trước 26/10/2026)
        cloudRequests.forEach(item => {
          const key = item.id;
          const created = item.createdAt || '';
          if (key && (!created || created >= OLD_DATA_CUTOFF)) {
            map.set(key, item);
          }
        });

        // Chỉ giữ lại bản ghi nháp cục bộ đang chờ đồng bộ offline
        (prev || []).forEach(localItem => {
          const key = localItem?.id;
          const created = localItem?.createdAt || '';
          if (!key || (created && created < OLD_DATA_CUTOFF)) return;
          const cloudItem = map.get(key);
          if (!cloudItem) {
            if (localItem._isOfflineDraft) {
              map.set(key, localItem);
            }
          } else {
            const localHasRectification = localItem.status === 'RECTIFIED' || Boolean(localItem.rectificationPhotos?.length) || Boolean(localItem.rectificationNotes);
            const cloudHasRectification = cloudItem.status === 'RECTIFIED' || Boolean(cloudItem.rectificationPhotos?.length) || Boolean(cloudItem.rectificationNotes);

            if (localHasRectification && !cloudHasRectification) {
              map.set(key, { ...cloudItem, ...localItem });
            } else {
              const cloudTime = new Date(cloudItem.updatedAt || cloudItem.createdAt || 0).getTime();
              const localTime = new Date(localItem.updatedAt || localItem.createdAt || 0).getTime();
              if (localTime > cloudTime) {
                map.set(key, { ...cloudItem, ...localItem });
              }
            }
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
        if (!Array.isArray(cloudReports)) return prev;
        const map = new Map();

        // Nạp danh sách từ Firestore bằng ID duy nhất (loại bỏ dữ liệu cũ trước 26/10/2026)
        cloudReports.forEach(item => {
          const key = item.id;
          const created = item.createdAt || '';
          if (key && (!created || created >= OLD_DATA_CUTOFF)) {
            map.set(key, sanitizeReportData(item));
          }
        });

        // Chỉ giữ lại bản ghi nháp cục bộ đang chờ đồng bộ offline
        (prev || []).forEach(localItem => {
          const key = localItem?.id;
          const created = localItem?.createdAt || '';
          if (!key || (created && created < OLD_DATA_CUTOFF)) return;
          const cloudItem = map.get(key);
          if (!cloudItem) {
            if (localItem._isOfflineDraft) {
              map.set(key, localItem);
            }
          } else {
            const localHasRectification = localItem.status === 'RECTIFIED' || Boolean(localItem.rectification?.photos?.length);
            const cloudHasRectification = cloudItem.status === 'RECTIFIED' || Boolean(cloudItem.rectification?.photos?.length);

            if (localHasRectification && !cloudHasRectification) {
              map.set(key, { ...cloudItem, ...localItem });
            } else {
              const cloudTime = new Date(cloudItem.updatedAt || cloudItem.createdAt || 0).getTime();
              const localTime = new Date(localItem.updatedAt || localItem.createdAt || 0).getTime();
              if (localTime > cloudTime) {
                map.set(key, { ...cloudItem, ...localItem });
              }
            }
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

      // Nếu có thông báo mới sau lần tải đầu tiên -> Kích hoạt Pop-up Toast & Native Push nếu gửi cho mình
      if (!isInitialNotifMountRef.current) {
        const newIncoming = cloudNotifs.filter(n => !prevNotifIdsRef.current.has(n.id) && !n.isRead);
        if (newIncoming.length > 0) {
          let shownToast = false;
          newIncoming.forEach(item => {
            if (checkNotificationRecipient(item, currentUserRef.current, requestsRef.current, reportsRef.current)) {
              if (!shownToast) {
                setActivePushToast(item);
                shownToast = true;
              }
              showSystemNotification(item.title, item.body);
            }
          });
        }
      } else {
        isInitialNotifMountRef.current = false;
      }

      prevNotifIdsRef.current = new Set(cloudNotifs.map(n => n.id));
    });

    return () => unsubscribe();
  }, []);

  // 4. Đồng bộ Real-Time Danh sách Cán bộ từ Firestore (Lấy Firestore Cloud làm chuẩn)
  useEffect(() => {
    const unsubscribe = subscribeToUsers((cloudUsers) => {
      if (cloudUsers && cloudUsers.length > 0) {
        // Dọn dẹp và loại bỏ các tài khoản test cũ khỏi danh sách chính thức
        const cleanUsers = cloudUsers.filter(u => {
          const uid = (u?.uid || '').toLowerCase();
          const email = (u?.email || '').toLowerCase();
          const isTest = uid === 'uid_muitvgsv' || uid === 'uid_muicdt' ||
                         uid === 'uid_custom_1792576174520' || uid === 'uid_custom_1792576233247' ||
                         email.includes('muitvgs') || email.includes('muicdt');
          if (isTest && isFirebaseConfigured && u.uid) {
            deleteSystemUser(u.uid).catch(() => {});
          }
          return !isTest;
        });

        setUsers(cleanUsers);
        try {
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(cleanUsers));
        } catch (e) {
          console.warn('Lỗi lưu users vào cache:', e);
        }

        // Tự động đồng bộ với currentUser nếu thông tin tài khoản đang đăng nhập được cập nhật
        setCurrentUser(curr => {
          if (!curr) return curr;
          const curUid = (curr.uid || '').toLowerCase();
          const curEmail = (curr.email || '').toLowerCase();
          if (curUid === 'uid_muitvgsv' || curUid === 'uid_muicdt' ||
              curUid === 'uid_custom_1792576174520' || curUid === 'uid_custom_1792576233247' ||
              curEmail.includes('muitvgs') || curEmail.includes('muicdt')) {
            try { localStorage.removeItem('apct_logged_user'); } catch (e) {}
            return null;
          }
          const fresh = cleanUsers.find(u => u.uid === curr.uid);
          if (fresh) {
            const updated = { ...curr, ...fresh };
            try {
              localStorage.setItem('apct_logged_user', JSON.stringify(updated));
            } catch (e) {}
            return updated;
          }
          return curr;
        });
      } else if (isFirebaseConfigured) {
        // Tự động seed lên Firestore nếu trên cloud chưa có
        seedOfficialUsersToCloud(MOCK_USERS).catch(console.warn);
      }
    });
    return () => unsubscribe();
  }, []);

  // 4b. Đồng bộ Real-Time Nhật ký thi công từ Firestore
  useEffect(() => {
    const unsubscribe = subscribeToDailyLogs((cloudLogs) => {
      setDailyLogs(prev => {
        if (!Array.isArray(cloudLogs)) return prev;
        const map = new Map();
        cloudLogs.forEach(item => {
          if (item?.id) map.set(item.id, item);
        });
        (prev || []).forEach(item => {
          if (item?._isOfflineDraft && !map.has(item.id)) {
            map.set(item.id, item);
          }
        });
        const merged = Array.from(map.values());
        merged.sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0));
        safeSaveLocalStorage(DAILY_LOGS_STORAGE_KEY, merged);
        return merged;
      });
    });
    return () => unsubscribe();
  }, []);

  // 4c. Đồng bộ Real-Time Biên bản nghiệm thu hoàn thành từ Firestore
  useEffect(() => {
    const unsubscribe = subscribeToCompletionReports((cloudReports) => {
      setCompletionReports(prev => {
        if (!Array.isArray(cloudReports)) return prev;
        const map = new Map();
        cloudReports.forEach(item => {
          if (item?.id) map.set(item.id, item);
        });
        (prev || []).forEach(item => {
          if (item?._isOfflineDraft && !map.has(item.id)) {
            map.set(item.id, item);
          }
        });
        const merged = Array.from(map.values());
        merged.sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0));
        safeSaveLocalStorage(COMPLETION_REPORTS_STORAGE_KEY, merged);
        return merged;
      });
    });
    return () => unsubscribe();
  }, []);

  // 4d. Đồng bộ Real-Time Danh mục tiêu chuẩn do Admin quản lý từ Firestore
  useEffect(() => {
    const unsubscribe = subscribeToStandards((remoteStandards) => {
      if (remoteStandards && (remoteStandards.works || remoteStandards.materials)) {
        // Hợp nhất dữ liệu từ Cloud với danh mục mặc định để không bao giờ bị mất mục 16, 17 (MEP) và mục 18 (PCCC)
        const incomingWorks = Array.isArray(remoteStandards.works) ? remoteStandards.works : [];
        const mergedWorks = [...incomingWorks];

        INITIAL_STANDARDS_DATA.works.forEach(defaultWork => {
          const exists = mergedWorks.some(w => 
            w.id === defaultWork.id || 
            (w.name && defaultWork.name && w.name.trim().toLowerCase() === defaultWork.name.trim().toLowerCase())
          );
          if (!exists) {
            mergedWorks.push(defaultWork);
          }
        });

        // Sắp xếp lại STT
        mergedWorks.forEach((w, idx) => {
          w.stt = idx + 1;
        });

        const updatedStandards = {
          works: mergedWorks,
          materials: Array.isArray(remoteStandards.materials) ? remoteStandards.materials : (INITIAL_STANDARDS_DATA.materials || []),
          mandatory: []
        };

        setStandardsData(updatedStandards);
        try {
          localStorage.setItem(STANDARDS_STORAGE_KEY, JSON.stringify(updatedStandards));
        } catch (e) {
          console.warn('Lỗi lưu standards từ Cloud vào localStorage:', e);
        }

        // Nếu danh mục trên Cloud cũ thiếu mục, tự động đồng bộ bù lên Cloud
        if (incomingWorks.length < mergedWorks.length) {
          saveInspectionStandards(updatedStandards).catch(err => {
            console.warn('[Firestore] Tự động cập nhật 18 hạng mục lên Cloud:', err);
          });
        }
      }
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleSaveStandards = async (newStandards) => {
    setStandardsData(newStandards);
    try {
      localStorage.setItem(STANDARDS_STORAGE_KEY, JSON.stringify(newStandards));
    } catch (e) {
      console.warn('Lỗi lưu standards vào localStorage:', e);
    }
    try {
      await saveInspectionStandards(newStandards);
    } catch (err) {
      console.warn('Lỗi lưu standards lên Firestore:', err);
    }
  };

  const handleSyncStandardsToCloud = async (payloadToSync) => {
    const data = payloadToSync || standardsData;
    try {
      await saveInspectionStandards(data);
      return true;
    } catch (e) {
      console.error('Lỗi đồng bộ tiêu chuẩn lên Cloud:', e);
      return false;
    }
  };

  // 4e. Đồng bộ Real-Time Hồ Sơ Bộ Phận Shop từ Firestore (Bảo toàn dữ liệu cục bộ)
  useEffect(() => {
    const unsubscribe = subscribeToShopDocuments((cloudDocs) => {
      // Nếu Cloud chưa có dữ liệu hoặc lỗi kết nối, giữ nguyên toàn bộ hồ sơ đã tạo trên máy
      if (!Array.isArray(cloudDocs) || cloudDocs.length === 0) {
        return;
      }

      setShopDocuments(prev => {
        const localStored = loadStoredShopDocuments();
        const baseItems = Array.isArray(prev) && prev.length > 0 ? prev : localStored;
        const map = new Map();

        // 1. Nạp tất cả hồ sơ hiện có ở local
        baseItems.forEach(item => {
          if (item?.id) map.set(item.id, item);
        });

        // 2. Hợp nhất các hồ sơ từ Cloud Firestore
        cloudDocs.forEach(cloudItem => {
          if (!cloudItem?.id) return;
          const existing = map.get(cloudItem.id);
          if (!existing) {
            map.set(cloudItem.id, cloudItem);
          } else {
            const cloudTime = new Date(cloudItem.updatedAt || cloudItem.createdAt || 0).getTime();
            const localTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
            if (cloudTime >= localTime) {
              const finalPdf = existing.pdfFile?.dataUrl ? existing.pdfFile : (cloudItem.pdfFile || existing.pdfFile);
              map.set(cloudItem.id, { ...existing, ...cloudItem, pdfFile: finalPdf });
            }
          }
        });

        const merged = Array.from(map.values());
        merged.sort((a, b) => new Date(b.submittedAt || b.createdAt || 0) - new Date(a.submittedAt || a.createdAt || 0));
        saveStoredShopDocuments(merged);
        return merged;
      });
    });
    return () => unsubscribe();
  }, []);

  // 4f. Đồng bộ Real-Time Cấu hình SLA Thời hạn phản hồi Hồ sơ Shop từ Firestore
  useEffect(() => {
    const unsubscribe = subscribeToShopSlaConfigs((cloudSla) => {
      if (Array.isArray(cloudSla) && cloudSla.length > 0) {
        setShopSlaConfigs(cloudSla);
        saveStoredShopSlaConfigs(cloudSla);
      }
    });
    return () => unsubscribe();
  }, []);

  // 4g. Đồng bộ Real-Time Hồ Sơ Thanh Toán từ Firestore (Bảo toàn dữ liệu cục bộ)
  useEffect(() => {
    const unsubscribe = subscribeToPaymentDocuments((cloudDocs) => {
      if (!Array.isArray(cloudDocs) || cloudDocs.length === 0) {
        return;
      }

      setPaymentDocuments(prev => {
        const localStored = loadStoredPaymentDocuments();
        const baseItems = Array.isArray(prev) && prev.length > 0 ? prev : localStored;
        const map = new Map();

        baseItems.forEach(item => {
          if (item?.id) map.set(item.id, item);
        });

        cloudDocs.forEach(cloudItem => {
          if (!cloudItem?.id) return;
          const existing = map.get(cloudItem.id);
          if (!existing) {
            map.set(cloudItem.id, cloudItem);
          } else {
            const cloudTime = new Date(cloudItem.updatedAt || cloudItem.createdAt || 0).getTime();
            const localTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
            if (cloudTime >= localTime) {
              const finalPdf = existing.pdfFile?.dataUrl ? existing.pdfFile : (cloudItem.pdfFile || existing.pdfFile);
              map.set(cloudItem.id, { ...existing, ...cloudItem, pdfFile: finalPdf });
            }
          }
        });

        const merged = Array.from(map.values());
        merged.sort((a, b) => new Date(b.submittedAt || b.createdAt || 0) - new Date(a.submittedAt || a.createdAt || 0));
        saveStoredPaymentDocuments(merged);
        return merged;
      });
    });
    return () => unsubscribe();
  }, []);

  // 4h. Đồng bộ Real-Time Cấu hình SLA Thời hạn phản hồi Hồ sơ Thanh Toán từ Firestore
  useEffect(() => {
    const unsubscribe = subscribeToPaymentSlaConfigs((cloudSla) => {
      if (Array.isArray(cloudSla) && cloudSla.length > 0) {
        setPaymentSlaConfigs(cloudSla);
        saveStoredPaymentSlaConfigs(cloudSla);
      }
    });
    return () => unsubscribe();
  }, []);

  // Quản lý SLA Thời hạn phản hồi
  const handleSaveShopSlaConfigs = async (newConfigs) => {
    setShopSlaConfigs(newConfigs);
    saveStoredShopSlaConfigs(newConfigs);
    try {
      await saveShopSlaConfigs(newConfigs);
    } catch (e) {
      console.warn('Lỗi lưu cấu hình SLA lên Firestore:', e);
    }
  };

  const handleSyncShopSlaToCloud = async (configsToSync) => {
    try {
      await saveShopSlaConfigs(configsToSync || shopSlaConfigs);
      showAlert({
        type: 'success',
        title: 'Đồng Bộ Thành Công',
        message: 'Đã lưu và đồng bộ toàn bộ quy định SLA hồ sơ shop lên Cloud Firestore!'
      });
    } catch (err) {
      showAlert({
        type: 'error',
        title: 'Lỗi Đồng Bộ',
        message: 'Không thể đồng bộ SLA lên Cloud: ' + (err.message || err)
      });
    }
  };

  // 1. Tạo mới hồ sơ shop (Mặc định gửi TVGS Trưởng & Trưởng Ban QLDA, hạn phân công 1 ngày)
  const handleCreateShopDocument = async (newDoc) => {
    try {
      // 1. Lưu ngay lập tức vào state & LocalStorage & IndexedDB
      setShopDocuments(prev => {
        const next = [newDoc, ...prev.filter(d => d.id !== newDoc.id)];
        saveStoredShopDocuments(next);
        return next;
      });

      // 2. Đồng bộ lên Firestore
      const saved = (await saveShopDocument(newDoc)) || newDoc;
      setShopDocuments(prev => {
        const next = [saved, ...prev.filter(d => d.id !== saved.id)];
        saveStoredShopDocuments(next);
        return next;
      });

      // Tìm UID của TVGS Trưởng (Đinh Xuân Thám) và Trưởng Ban QLDA (Ngô Quý Linh)
      const leadSup = getShopLeadSupervisor(users);
      const leadInv = getShopLeadInvestor(users);

      // Tạo thông báo đến 2 anh Trưởng và Chủ Đầu Tư
      const notifTitle = `📑 [Cần phân công] Hồ sơ Shop mới: ${saved.title}`;
      const notifBody = `${saved.createdByName} (${saved.contractorCompany || 'ĐVTC'}) vừa trình duyệt "${saved.typeName}": ${saved.title}. Mời TVGS Trưởng (${leadSup.fullName}) & Trưởng Ban QLDA (${leadInv.fullName}) phân công cán bộ phụ trách trong vòng 1 ngày (24 giờ).`;

      const notif = {
        id: `notif_${Date.now()}`,
        type: 'SHOP_DOCUMENT_WAITING_ASSIGNMENT',
        title: notifTitle,
        body: notifBody,
        targetShopDocId: saved.id,
        actionText: 'Xem hồ sơ & Phân công cán bộ',
        assignedRecipients: saved.assignedRecipients || [],
        createdByUid: saved.createdByUid,
        createdByName: saved.createdByName,
        extraRecipientUids: [
          saved.createdByUid,
          leadSup.uid,
          leadInv.uid
        ].filter(Boolean),
        targetRoles: ['LEAD_SUPERVISOR', 'LEAD_INVESTOR', 'ADMIN', 'CONTRACTOR'],
        createdAt: new Date().toISOString(),
        time: 'Vừa xong',
        isRead: false
      };

      setNotifications(prev => {
        const nextNotifs = [notif, ...prev.filter(n => n.id !== notif.id)];
        safeSaveLocalStorage(NOTIF_STORAGE_KEY, nextNotifs);
        return nextNotifs;
      });

      if (checkNotificationRecipient(notif, currentUser)) {
        setActivePushToast(notif);
        showSystemNotification(notifTitle, notifBody);
      }

      saveSystemNotification(notif).catch(console.warn);
      sendOneSignalPush({
        title: notifTitle,
        message: notifBody,
        targetRoles: ['LEAD_SUPERVISOR', 'LEAD_INVESTOR', 'ADMIN']
      }).catch(console.warn);

      showAlert({
        type: 'success',
        title: 'Tạo Hồ Sơ Thành Công!',
        message: `Đã phát hành hồ sơ "${saved.title}" (Mã: ${saved.docCode}).\nHồ sơ đã được gửi mặc định đến TVGS Trưởng (${leadSup.fullName}) và Trưởng Ban QLDA (${leadInv.fullName}) để phân công cán bộ chuyên môn trong vòng 1 ngày.`,
        confirmText: 'Xem Hồ Sơ',
        cancelText: 'Đóng',
        onConfirm: () => setSelectedShopDoc(saved)
      });
    } catch (err) {
      console.error('Lỗi tạo hồ sơ shop:', err);
      showAlert({
        type: 'error',
        title: 'Lỗi Tạo Hồ Sơ',
        message: 'Có lỗi xảy ra: ' + (err.message || err)
      });
    }
  };

  // 2. Phân công cán bộ thụ lý (Dành cho TVGS Trưởng và Trưởng Ban QLDA)
  const handleAssignShopDocument = async ({ docId, roleType, assignee, slaDays, leader }) => {
    try {
      const doc = (shopDocuments || []).find(d => d.id === docId) || selectedShopDoc;
      if (!doc) return;

      const nowIso = new Date().toISOString();
      const targetDueDateIso = calculateDueDate(nowIso, slaDays).toISOString();
      const isTvgs = roleType === 'SUPERVISOR';

      const updatedTvgs = isTvgs ? {
        ...doc.assignedTvgs,
        assignee,
        uid: assignee.uid,
        fullName: assignee.fullName,
        email: assignee.email || '',
        position: assignee.position || 'Kỹ sư TVGS',
        company: assignee.company || 'Tư Vấn Giám Sát Gelicon',
        assignedBy: {
          uid: leader?.uid || currentUser?.uid,
          fullName: leader?.fullName || currentUser?.fullName,
          role: leader?.role || currentUser?.role
        },
        assignedAt: nowIso,
        slaDays: Number(slaDays || 3),
        dueDate: targetDueDateIso,
        status: 'PENDING'
      } : doc.assignedTvgs;

      const updatedInvestor = !isTvgs ? {
        ...doc.assignedInvestor,
        assignee,
        uid: assignee.uid,
        fullName: assignee.fullName,
        email: assignee.email || '',
        position: assignee.position || 'Kỹ sư QLDA',
        company: assignee.company || 'Ban Quản Lý Dự Án An Phú Eco City',
        assignedBy: {
          uid: leader?.uid || currentUser?.uid,
          fullName: leader?.fullName || currentUser?.fullName,
          role: leader?.role || currentUser?.role
        },
        assignedAt: nowIso,
        slaDays: Number(slaDays || 3),
        dueDate: targetDueDateIso,
        status: 'PENDING'
      } : doc.assignedInvestor;

      // Cả 2 bên đều đã được phân công cán bộ -> Chuyển sang trạng thái SENT (Đang thẩm định)
      const bothAssigned = Boolean(updatedTvgs?.assignee || updatedTvgs?.uid) && Boolean(updatedInvestor?.assignee || updatedInvestor?.uid);

      const updatedDoc = {
        ...doc,
        assignedTvgs: updatedTvgs,
        assignedInvestor: updatedInvestor,
        status: bothAssigned ? SHOP_STATUS.SENT : doc.status,
        dueDate: targetDueDateIso,
        assignedRecipients: [
          ...(doc.assignedRecipients || []).filter(r => r.role !== roleType),
          { uid: assignee.uid, role: roleType, name: assignee.fullName, position: assignee.position }
        ],
        history: [
          ...(doc.history || []),
          {
            action: 'ASSIGNED',
            by: leader?.fullName || currentUser?.fullName,
            role: leader?.role || currentUser?.role,
            time: nowIso,
            note: `${leader?.position || 'Trưởng ban'} đã phân công cho cán bộ ${assignee.fullName} (${isTvgs ? 'TVGS' : 'Ban QLDA'}) thẩm định. Hạn hoàn thành: ${slaDays} ngày.`
          }
        ],
        updatedAt: nowIso
      };

      await saveShopDocument(updatedDoc);
      setShopDocuments(prev => {
        const next = prev.map(d => d.id === docId ? updatedDoc : d);
        saveStoredShopDocuments(next);
        return next;
      });
      setSelectedShopDoc(updatedDoc);

      // Bắn thông báo ĐÍCH DANH đến người được phân công
      const notifTitle = `📋 [Được giao nhiệm vụ] Thẩm định hồ sơ Shop: ${updatedDoc.title}`;
      const notifBody = `${leader?.fullName || 'Trưởng ban'} đã phân công bạn (${assignee.fullName}) thẩm định hồ sơ "${updatedDoc.title}". Hạn hoàn thành: ${slaDays} ngày.`;

      const notif = {
        id: `notif_${Date.now()}`,
        type: 'SHOP_DOCUMENT_ASSIGNED',
        title: notifTitle,
        body: notifBody,
        targetShopDocId: updatedDoc.id,
        actionText: 'Xem hồ sơ & Thẩm định',
        assignedRecipients: updatedDoc.assignedRecipients || [],
        recipientUid: assignee.uid, // Gửi trực tiếp cán bộ được giao
        createdByUid: updatedDoc.createdByUid,
        createdByName: updatedDoc.createdByName,
        extraRecipientUids: [
          assignee.uid,
          leader?.uid,
          updatedDoc.createdByUid
        ].filter(Boolean),
        targetRoles: [roleType, 'LEAD_SUPERVISOR', 'LEAD_INVESTOR', 'ADMIN'],
        createdAt: nowIso,
        time: 'Vừa xong',
        isRead: false
      };

      setNotifications(prev => {
        const nextNotifs = [notif, ...prev.filter(n => n.id !== notif.id)];
        safeSaveLocalStorage(NOTIF_STORAGE_KEY, nextNotifs);
        return nextNotifs;
      });

      if (checkNotificationRecipient(notif, currentUser)) {
        setActivePushToast(notif);
        showSystemNotification(notifTitle, notifBody);
      }

      saveSystemNotification(notif).catch(console.warn);
      sendOneSignalPush({ title: notifTitle, message: notifBody, targetRoles: [roleType, 'LEAD_SUPERVISOR', 'LEAD_INVESTOR', 'ADMIN'] }).catch(console.warn);

      showAlert({
        type: 'success',
        title: 'Phân Công Thành Công! 📋',
        message: `Đã giao hồ sơ "${updatedDoc.title}" cho cán bộ ${assignee.fullName}.\nThời hạn phản hồi: ${slaDays} ngày.`
      });
    } catch (err) {
      console.error('Lỗi phân công hồ sơ shop:', err);
      showAlert({ type: 'error', title: 'Lỗi', message: err.message || err });
    }
  };

  // 3. Xác nhận đạt hồ sơ shop (Quy trình tuần tự: TVGS duyệt trước -> Ban QLDA phê duyệt sau)
  const handleApproveShopDocument = async (docId, { roleType, note, reviewer }) => {
    try {
      const doc = (shopDocuments || []).find(d => d.id === docId) || selectedShopDoc;
      if (!doc) return;

      // Bảo vệ chặt chẽ: Ban QLDA chỉ được duyệt khi TVGS đã duyệt đạt
      if (roleType === 'INVESTOR' && doc.assignedTvgs?.status !== 'ACCEPTED') {
        showAlert({
          type: 'warning',
          title: 'Chưa đủ điều kiện phê duyệt',
          message: 'Tư Vấn Giám Sát chưa thẩm định đạt hồ sơ này. Ban QLDA chỉ được phê duyệt sau khi TVGS đã duyệt đạt!'
        });
        return;
      }

      const nowIso = new Date().toISOString();
      const updatedAssignedTvgs = roleType === 'SUPERVISOR' ? {
        ...doc.assignedTvgs,
        status: 'ACCEPTED',
        reviewedAt: nowIso,
        note: note || 'Xác nhận đạt yêu cầu kỹ thuật'
      } : doc.assignedTvgs;

      const updatedAssignedInvestor = roleType === 'INVESTOR' ? {
        ...doc.assignedInvestor,
        status: 'ACCEPTED',
        reviewedAt: nowIso,
        note: note || 'Xác nhận đạt yêu cầu kỹ thuật'
      } : doc.assignedInvestor;

      // Cả 2 bên đều xác nhận đạt -> Trạng thái hoàn tất APPROVED
      const isBothAccepted = (updatedAssignedTvgs?.status === 'ACCEPTED') && (updatedAssignedInvestor?.status === 'ACCEPTED');

      const updatedDoc = {
        ...doc,
        assignedTvgs: updatedAssignedTvgs,
        assignedInvestor: updatedAssignedInvestor,
        status: isBothAccepted ? SHOP_STATUS.APPROVED : SHOP_STATUS.SENT,
        history: [
          ...(doc.history || []),
          {
            action: 'APPROVED',
            by: reviewer?.fullName || (roleType === 'SUPERVISOR' ? 'Tư Vấn Giám Sát' : 'Ban QLDA'),
            role: roleType === 'SUPERVISOR' ? 'Tư Vấn Giám Sát' : 'Ban QLDA',
            time: nowIso,
            note: note ? `Xác nhận đạt: ${note}` : 'Đã xác nhận phê duyệt đạt'
          }
        ],
        updatedAt: nowIso
      };

      await saveShopDocument(updatedDoc);
      setShopDocuments(prev => {
        const next = prev.map(d => d.id === docId ? updatedDoc : d);
        saveStoredShopDocuments(next);
        return next;
      });
      setSelectedShopDoc(updatedDoc);

      // Phân định thông báo theo bước thẩm định tuần tự
      let notifTitle = '';
      let notifBody = '';
      let targetRoles = [];
      let extraRecipientUids = [];

      if (roleType === 'SUPERVISOR') {
        // Bước 1: TVGS duyệt đạt -> Gửi thông báo mời Ban QLDA vào phê duyệt
        notifTitle = `📋 TVGS đã duyệt đạt - Mời Ban QLDA phê duyệt: ${updatedDoc.title}`;
        notifBody = `Tư Vấn Giám Sát (${reviewer?.fullName || 'TVGS'}) đã thẩm định và xác nhận ĐẠT hồ sơ "${updatedDoc.title}". Kính mời Ban QLDA (${updatedDoc.assignedInvestor?.fullName || updatedDoc.assignedInvestor?.assignee?.fullName || 'QLDA'}) vào kiểm tra và phê duyệt cuối cùng.`;
        targetRoles = ['INVESTOR', 'LEAD_INVESTOR', 'ADMIN', 'CONTRACTOR'];
        extraRecipientUids = [
          updatedDoc.assignedInvestor?.uid || updatedDoc.assignedInvestor?.assignee?.uid,
          updatedDoc.createdByUid,
          updatedDoc.assignedTvgs?.uid || updatedDoc.assignedTvgs?.assignee?.uid
        ].filter(Boolean);
      } else {
        // Bước 2: Ban QLDA duyệt đạt -> Cả 2 bên đã duyệt hoàn tất
        notifTitle = `✅ Hồ sơ Shop đã được Ban QLDA phê duyệt hoàn tất: ${updatedDoc.title}`;
        notifBody = `Ban QLDA (${reviewer?.fullName || 'Ban QLDA'}) đã phê duyệt hoàn tất hồ sơ "${updatedDoc.title}". Cả TVGS và Ban QLDA đều đã xác nhận đạt, hồ sơ đủ điều kiện triển khai thi công!`;
        targetRoles = ['CONTRACTOR', 'SUPERVISOR', 'LEAD_SUPERVISOR', 'INVESTOR', 'LEAD_INVESTOR', 'ADMIN'];
        extraRecipientUids = [
          updatedDoc.createdByUid,
          updatedDoc.assignedTvgs?.uid || updatedDoc.assignedTvgs?.assignee?.uid,
          updatedDoc.assignedInvestor?.uid || updatedDoc.assignedInvestor?.assignee?.uid
        ].filter(Boolean);
      }

      const notif = {
        id: `notif_${Date.now()}`,
        type: roleType === 'SUPERVISOR' ? 'SHOP_DOCUMENT_TVGS_APPROVED' : 'SHOP_DOCUMENT_APPROVED',
        title: notifTitle,
        body: notifBody,
        targetShopDocId: updatedDoc.id,
        actionText: 'Xem chi tiết hồ sơ shop',
        assignedRecipients: updatedDoc.assignedRecipients || [],
        createdByUid: updatedDoc.createdByUid,
        createdByName: updatedDoc.createdByName,
        extraRecipientUids,
        targetRoles,
        createdAt: nowIso,
        time: 'Vừa xong',
        isRead: false
      };

      setNotifications(prev => {
        const nextNotifs = [notif, ...prev.filter(n => n.id !== notif.id)];
        safeSaveLocalStorage(NOTIF_STORAGE_KEY, nextNotifs);
        return nextNotifs;
      });

      if (checkNotificationRecipient(notif, currentUser)) {
        setActivePushToast(notif);
        showSystemNotification(notifTitle, notifBody);
      }

      saveSystemNotification(notif).catch(console.warn);
      sendOneSignalPush({ title: notifTitle, message: notifBody, targetRoles }).catch(console.warn);

      showAlert({
        type: 'success',
        title: roleType === 'SUPERVISOR' ? 'TVGS Đã Thẩm Định Đạt!' : 'Phê Duyệt Hoàn Tất!',
        message: roleType === 'SUPERVISOR'
          ? `Hồ sơ "${updatedDoc.title}" đã được TVGS duyệt đạt.\nHệ thống đã gửi thông báo đến Ban QLDA để tiến hành phê duyệt bước tiếp theo.`
          : `Hồ sơ "${updatedDoc.title}" đã được Ban QLDA phê duyệt hoàn tất. Cả 2 bên TVGS và Ban QLDA đều đã xác nhận đạt!`
      });
    } catch (err) {
      console.error('Lỗi duyệt hồ sơ shop:', err);
      showAlert({ type: 'error', title: 'Lỗi', message: err.message || err });
    }
  };

  // 4. Yêu cầu sửa / Từ chối hồ sơ shop
  const handleRejectShopDocument = async (docId, { roleType, reason, reviewer }) => {
    try {
      const doc = (shopDocuments || []).find(d => d.id === docId) || selectedShopDoc;
      if (!doc) return;

      // Bảo vệ: Ban QLDA không thể thao tác sửa/hủy khi TVGS chưa duyệt đạt
      if (roleType === 'INVESTOR' && doc.assignedTvgs?.status !== 'ACCEPTED') {
        showAlert({
          type: 'warning',
          title: 'Chưa đủ điều kiện thao tác',
          message: 'Tư Vấn Giám Sát chưa duyệt đạt hồ sơ này nên Ban QLDA chưa thể thực hiện yêu cầu sửa hay hủy!'
        });
        return;
      }

      const nowIso = new Date().toISOString();
      const updatedAssignedTvgs = roleType === 'SUPERVISOR' ? {
        ...doc.assignedTvgs,
        status: 'REJECTED',
        reviewedAt: nowIso,
        note: reason
      } : doc.assignedTvgs;

      const updatedAssignedInvestor = roleType === 'INVESTOR' ? {
        ...doc.assignedInvestor,
        status: 'REJECTED',
        reviewedAt: nowIso,
        note: reason
      } : doc.assignedInvestor;

      const updatedDoc = {
        ...doc,
        assignedTvgs: updatedAssignedTvgs,
        assignedInvestor: updatedAssignedInvestor,
        status: SHOP_STATUS.REJECTED,
        rejectionReason: reason,
        rejectedBy: {
          uid: reviewer?.uid || currentUser?.uid,
          fullName: reviewer?.fullName || currentUser?.fullName,
          role: roleType,
          position: reviewer?.position || (roleType === 'SUPERVISOR' ? 'Kỹ sư TVGS' : 'Cán bộ Ban QLDA'),
          time: nowIso,
          reason
        },
        history: [
          ...(doc.history || []),
          {
            action: 'REJECTED',
            by: reviewer?.fullName || (roleType === 'SUPERVISOR' ? 'Tư Vấn Giám Sát' : 'Ban QLDA'),
            role: roleType === 'SUPERVISOR' ? 'Tư Vấn Giám Sát' : 'Ban QLDA',
            time: nowIso,
            note: `Yêu cầu chỉnh sửa: ${reason}`
          }
        ],
        updatedAt: nowIso
      };

      await saveShopDocument(updatedDoc);
      setShopDocuments(prev => {
        const next = prev.map(d => d.id === docId ? updatedDoc : d);
        saveStoredShopDocuments(next);
        return next;
      });
      setSelectedShopDoc(updatedDoc);

      // Phân định thông báo yêu cầu sửa (Gửi trực tiếp đến ĐVTC lập phiếu)
      const isTvgsReject = roleType === 'SUPERVISOR';
      const notifTitle = isTvgsReject 
        ? `⚠️ TVGS yêu cầu chỉnh sửa hồ sơ: ${updatedDoc.title}`
        : `⚠️ Ban QLDA yêu cầu chỉnh sửa hồ sơ: ${updatedDoc.title}`;
      const notifBody = `${reviewer?.fullName || 'Cán bộ'} (${isTvgsReject ? 'TVGS' : 'Ban QLDA'}) yêu cầu chỉnh sửa hồ sơ "${updatedDoc.title}". Lý do: ${reason}`;

      const notif = {
        id: `notif_${Date.now()}`,
        type: 'SHOP_DOCUMENT_REJECTED',
        title: notifTitle,
        body: notifBody,
        targetShopDocId: updatedDoc.id,
        actionText: 'Xem lý do & chỉnh sửa',
        assignedRecipients: updatedDoc.assignedRecipients || [],
        recipientUid: updatedDoc.createdByUid, // ĐÍCH DANH ĐVTC TẠO HỒ SƠ
        createdByUid: updatedDoc.createdByUid,
        createdByName: updatedDoc.createdByName,
        extraRecipientUids: [
          updatedDoc.createdByUid,
          updatedDoc.assignedTvgs?.uid || updatedDoc.assignedTvgs?.assignee?.uid,
          updatedDoc.assignedInvestor?.uid || updatedDoc.assignedInvestor?.assignee?.uid
        ].filter(Boolean),
        targetRoles: ['CONTRACTOR', 'SUPERVISOR', 'LEAD_SUPERVISOR', 'INVESTOR', 'LEAD_INVESTOR', 'ADMIN'],
        createdAt: nowIso,
        time: 'Vừa xong',
        isRead: false
      };

      setNotifications(prev => {
        const nextNotifs = [notif, ...prev.filter(n => n.id !== notif.id)];
        safeSaveLocalStorage(NOTIF_STORAGE_KEY, nextNotifs);
        return nextNotifs;
      });

      if (checkNotificationRecipient(notif, currentUser)) {
        setActivePushToast(notif);
        showSystemNotification(notifTitle, notifBody);
      }

      saveSystemNotification(notif).catch(console.warn);
      sendOneSignalPush({ title: notifTitle, message: notifBody, targetRoles: ['CONTRACTOR', 'SUPERVISOR', 'INVESTOR', 'ADMIN'] }).catch(console.warn);

      showAlert({
        type: 'info',
        title: 'Đã Gửi Yêu Cầu Chỉnh Sửa',
        message: `Đã gửi yêu cầu chỉnh sửa hồ sơ "${updatedDoc.title}" đến Nhà thầu.\nLý do: ${reason}`
      });
    } catch (err) {
      console.error('Lỗi từ chối hồ sơ shop:', err);
      showAlert({ type: 'error', title: 'Lỗi', message: err.message || err });
    }
  };

  // 5. Khắc phục & Nộp lại trực tiếp cho người từ chối (Bypasses 2 leaders)
  const handleResubmitShopDocument = async (docId, { notes, pdfFile, pdfFiles, photos, resubmittedBy }) => {
    try {
      const doc = (shopDocuments || []).find(d => d.id === docId) || selectedShopDoc;
      if (!doc) return;

      const nowIso = new Date().toISOString();
      const rejectingOfficer = doc.rejectedBy;
      const isTvgsReject = rejectingOfficer?.role === 'SUPERVISOR';

      // Đặt lại trạng thái của bên từ chối về PENDING
      const updatedTvgs = isTvgsReject ? {
        ...doc.assignedTvgs,
        status: 'PENDING',
        note: ''
      } : doc.assignedTvgs;

      const updatedInvestor = !isTvgsReject ? {
        ...doc.assignedInvestor,
        status: 'PENDING',
        note: ''
      } : doc.assignedInvestor;

      const updatedDoc = {
        ...doc,
        notes: notes !== undefined ? notes : doc.notes,
        pdfFile: pdfFile !== undefined ? pdfFile : doc.pdfFile,
        pdfFiles: Array.isArray(pdfFiles) ? pdfFiles : (doc.pdfFiles || (doc.pdfFile ? [doc.pdfFile] : [])),
        photos: Array.isArray(photos) ? photos : doc.photos,
        assignedTvgs: updatedTvgs,
        assignedInvestor: updatedInvestor,
        status: SHOP_STATUS.SENT, // Quay lại trạng thái ĐANG THẨM ĐỊNH
        rejectionReason: '',
        history: [
          ...(doc.history || []),
          {
            action: 'RESUBMITTED',
            by: resubmittedBy?.fullName || currentUser?.fullName,
            role: 'CONTRACTOR',
            time: nowIso,
            note: `Đã khắc phục chỉnh sửa và nộp lại trực tiếp cho ${rejectingOfficer?.fullName || 'cán bộ thẩm định'}. Nội dung: ${notes}`
          }
        ],
        updatedAt: nowIso
      };

      await saveShopDocument(updatedDoc);
      setShopDocuments(prev => {
        const next = prev.map(d => d.id === docId ? updatedDoc : d);
        saveStoredShopDocuments(next);
        return next;
      });
      setSelectedShopDoc(updatedDoc);

      // Bắn thông báo TRỰC TIẾP ĐẾN NGƯỜI ĐÃ TỪ CHỐI (Không qua 2 anh Trưởng)
      const targetOfficerName = rejectingOfficer?.fullName || 'Cán bộ thẩm định';
      const notifTitle = `🔄 [Đã sửa & Gửi lại] Hồ sơ Shop: ${updatedDoc.title}`;
      const notifBody = `Nhà thầu (${resubmittedBy?.fullName || 'ĐVTC'}) đã chỉnh sửa và gửi lại hồ sơ "${updatedDoc.title}" trực tiếp cho bạn (${targetOfficerName}) kiểm tra lại. Nội dung: ${notes}`;

      const notif = {
        id: `notif_${Date.now()}`,
        type: 'SHOP_DOCUMENT_RESUBMITTED',
        title: notifTitle,
        body: notifBody,
        targetShopDocId: updatedDoc.id,
        actionText: 'Xem hồ sơ & Đánh giá lại',
        assignedRecipients: updatedDoc.assignedRecipients || [],
        recipientUid: rejectingOfficer?.uid, // GỬI TRỰC TIẾP CHO NGƯỜI TỪ CHỐI!
        createdByUid: updatedDoc.createdByUid,
        createdByName: updatedDoc.createdByName,
        extraRecipientUids: [
          rejectingOfficer?.uid,
          updatedDoc.createdByUid
        ].filter(Boolean),
        targetRoles: [rejectingOfficer?.role || 'SUPERVISOR', 'CONTRACTOR', 'ADMIN'],
        createdAt: nowIso,
        time: 'Vừa xong',
        isRead: false
      };

      setNotifications(prev => {
        const nextNotifs = [notif, ...prev.filter(n => n.id !== notif.id)];
        safeSaveLocalStorage(NOTIF_STORAGE_KEY, nextNotifs);
        return nextNotifs;
      });

      if (checkNotificationRecipient(notif, currentUser)) {
        setActivePushToast(notif);
        showSystemNotification(notifTitle, notifBody);
      }

      saveSystemNotification(notif).catch(console.warn);
      sendOneSignalPush({ title: notifTitle, message: notifBody, targetRoles: [rejectingOfficer?.role || 'SUPERVISOR', 'ADMIN'] }).catch(console.warn);

      showAlert({
        type: 'success',
        title: 'Đã Gửi Lại Hồ Sơ! 🔄',
        message: `Hồ sơ "${updatedDoc.title}" đã được nộp lại trực tiếp cho cán bộ ${targetOfficerName} để kiểm tra lại.`
      });
    } catch (err) {
      console.error('Lỗi nộp lại hồ sơ shop:', err);
      showAlert({ type: 'error', title: 'Lỗi', message: err.message || err });
    }
  };

  // 6. Xóa hồ sơ shop
  const handleDeleteShopDocument = async (docId) => {
    try {
      await deleteShopDocument(docId);
      setShopDocuments(prev => {
        const next = prev.filter(d => d.id !== docId);
        saveStoredShopDocuments(next);
        return next;
      });
      setSelectedShopDoc(null);
      showAlert({
        type: 'success',
        title: 'Đã Xóa',
        message: 'Đã xóa hồ sơ shop khỏi hệ thống.'
      });
    } catch (err) {
      console.error('Lỗi xóa hồ sơ shop:', err);
      showAlert({ type: 'error', title: 'Lỗi', message: err.message || err });
    }
  };

  // 7. KIỂM TRA ĐỊNH KỲ THÔNG BÁO QUÁ HẠN (SLA BACKGROUND MONITOR)
  // Quy tắc:
  // - Quá 1 ngày (24h) chưa chọn cán bộ -> Báo CĐT và chính người chậm
  // - Quá thời hạn phản hồi (dueDate) mà cán bộ chưa duyệt -> Báo Trưởng ban, cán bộ chậm & CĐT
  const lastOverdueCheckRef = useRef(0);
  useEffect(() => {
    if (!shopDocuments || shopDocuments.length === 0) return;

    const checkOverdueShopDocs = () => {
      const now = Date.now();
      if (now - lastOverdueCheckRef.current < 45000) return; // Kiểm tra tối đa 45s/lần
      lastOverdueCheckRef.current = now;

      let hasUpdates = false;
      const updatedDocs = shopDocuments.map(doc => {
        let changed = false;
        let d = { ...doc };

        // 1. Kiểm tra chậm phân công (> 24h từ lúc tạo)
        if (isShopAssignmentOverdue(d)) {
          const isTvgsAssigned = Boolean(d.assignedTvgs?.assignee || d.assignedTvgs?.uid);
          const isInvestorAssigned = Boolean(d.assignedInvestor?.assignee || d.assignedInvestor?.uid);

          const leadSup = getShopLeadSupervisor(users);
          const leadInv = getShopLeadInvestor(users);

          // Nếu TVGS chưa phân công
          if (!isTvgsAssigned && !d.assignmentTvgsOverdueNotified) {
            d.assignmentTvgsOverdueNotified = true;
            changed = true;

            const notifTitle = `🚨 [Chậm phân công] TVGS Trưởng chưa giao việc: ${d.title}`;
            const notifBody = `Hồ sơ "${d.title}" đã quá hạn 1 ngày (24h) mà Tư vấn giám sát trưởng (${leadSup.fullName}) chưa phân công cán bộ phụ trách.`;
            const notif = {
              id: `notif_overdue_assign_tvgs_${d.id}_${Date.now()}`,
              type: 'SHOP_DOCUMENT_ASSIGNMENT_OVERDUE',
              title: notifTitle,
              body: notifBody,
              targetShopDocId: d.id,
              actionText: 'Phân công ngay',
              recipientUid: leadSup.uid,
              extraRecipientUids: [leadSup.uid],
              targetRoles: ['LEAD_SUPERVISOR', 'ADMIN', 'LEAD_INVESTOR'],
              createdAt: new Date().toISOString(),
              time: 'Vừa xong',
              isRead: false
            };

            setNotifications(prev => [notif, ...prev]);
            saveSystemNotification(notif).catch(console.warn);
            if (checkNotificationRecipient(notif, currentUser)) {
              setActivePushToast(notif);
              showSystemNotification(notifTitle, notifBody);
            }
          }

          // Nếu Ban QLDA chưa phân công
          if (!isInvestorAssigned && !d.assignmentInvestorOverdueNotified) {
            d.assignmentInvestorOverdueNotified = true;
            changed = true;

            const notifTitle = `🚨 [Chậm phân công] Trưởng Ban QLDA chưa giao việc: ${d.title}`;
            const notifBody = `Hồ sơ "${d.title}" đã quá hạn 1 ngày (24h) mà Trưởng Ban QLDA (${leadInv.fullName}) chưa phân công cán bộ phụ trách.`;
            const notif = {
              id: `notif_overdue_assign_inv_${d.id}_${Date.now()}`,
              type: 'SHOP_DOCUMENT_ASSIGNMENT_OVERDUE',
              title: notifTitle,
              body: notifBody,
              targetShopDocId: d.id,
              actionText: 'Phân công ngay',
              recipientUid: leadInv.uid,
              extraRecipientUids: [leadInv.uid],
              targetRoles: ['LEAD_INVESTOR', 'ADMIN'],
              createdAt: new Date().toISOString(),
              time: 'Vừa xong',
              isRead: false
            };

            setNotifications(prev => [notif, ...prev]);
            saveSystemNotification(notif).catch(console.warn);
            if (checkNotificationRecipient(notif, currentUser)) {
              setActivePushToast(notif);
              showSystemNotification(notifTitle, notifBody);
            }
          }
        }

        // 2. Kiểm tra chậm phản hồi thẩm định (> dueDate)
        if (d.status === SHOP_STATUS.SENT) {
          const leadSup = getShopLeadSupervisor(users);
          const leadInv = getShopLeadInvestor(users);

          // Kiểm tra TVGS quá hạn
          const tvgsAssigned = d.assignedTvgs?.assignee || d.assignedTvgs?.uid;
          if (tvgsAssigned && d.assignedTvgs?.status === 'PENDING') {
            const tvgsDue = d.assignedTvgs?.dueDate ? new Date(d.assignedTvgs.dueDate).getTime() : (d.dueDate ? new Date(d.dueDate).getTime() : 0);
            if (tvgsDue && now > tvgsDue && !d.tvgsReviewOverdueNotified) {
              d.tvgsReviewOverdueNotified = true;
              changed = true;

              const tvgsName = d.assignedTvgs?.assignee?.fullName || d.assignedTvgs?.fullName || 'Cán bộ TVGS';
              const tvgsUid = d.assignedTvgs?.assignee?.uid || d.assignedTvgs?.uid;
              const notifTitle = `⏰ [Chậm phản hồi] TVGS quá hạn thẩm định: ${d.title}`;
              const notifBody = `Cán bộ TVGS (${tvgsName}) đã quá hạn thẩm định hồ sơ "${d.title}". Thông báo cảnh báo được gửi đến TVGS Trưởng (${leadSup.fullName}), CĐT và cán bộ chậm.`;

              const notif = {
                id: `notif_overdue_review_tvgs_${d.id}_${Date.now()}`,
                type: 'SHOP_DOCUMENT_REVIEW_OVERDUE',
                title: notifTitle,
                body: notifBody,
                targetShopDocId: d.id,
                actionText: 'Xem hồ sơ & Xử lý gấp',
                recipientUid: tvgsUid,
                extraRecipientUids: [tvgsUid, leadSup.uid].filter(Boolean),
                targetRoles: ['SUPERVISOR', 'LEAD_SUPERVISOR', 'LEAD_INVESTOR', 'ADMIN'],
                createdAt: new Date().toISOString(),
                time: 'Vừa xong',
                isRead: false
              };

              setNotifications(prev => [notif, ...prev]);
              saveSystemNotification(notif).catch(console.warn);
              if (checkNotificationRecipient(notif, currentUser)) {
                setActivePushToast(notif);
                showSystemNotification(notifTitle, notifBody);
              }
            }
          }

          // Kiểm tra Ban QLDA quá hạn
          const invAssigned = d.assignedInvestor?.assignee || d.assignedInvestor?.uid;
          if (invAssigned && d.assignedInvestor?.status === 'PENDING') {
            const invDue = d.assignedInvestor?.dueDate ? new Date(d.assignedInvestor.dueDate).getTime() : (d.dueDate ? new Date(d.dueDate).getTime() : 0);
            if (invDue && now > invDue && !d.investorReviewOverdueNotified) {
              d.investorReviewOverdueNotified = true;
              changed = true;

              const invName = d.assignedInvestor?.assignee?.fullName || d.assignedInvestor?.fullName || 'Cán bộ QLDA';
              const invUid = d.assignedInvestor?.assignee?.uid || d.assignedInvestor?.uid;
              const notifTitle = `⏰ [Chậm phản hồi] Ban QLDA quá hạn phê duyệt: ${d.title}`;
              const notifBody = `Cán bộ Ban QLDA (${invName}) đã quá hạn phê duyệt hồ sơ "${d.title}". Thông báo cảnh báo được gửi đến Trưởng Ban QLDA (${leadInv.fullName}), CĐT và cán bộ chậm.`;

              const notif = {
                id: `notif_overdue_review_inv_${d.id}_${Date.now()}`,
                type: 'SHOP_DOCUMENT_REVIEW_OVERDUE',
                title: notifTitle,
                body: notifBody,
                targetShopDocId: d.id,
                actionText: 'Xem hồ sơ & Xử lý gấp',
                recipientUid: invUid,
                extraRecipientUids: [invUid, leadInv.uid].filter(Boolean),
                targetRoles: ['INVESTOR', 'LEAD_INVESTOR', 'ADMIN'],
                createdAt: new Date().toISOString(),
                time: 'Vừa xong',
                isRead: false
              };

              setNotifications(prev => [notif, ...prev]);
              saveSystemNotification(notif).catch(console.warn);
              if (checkNotificationRecipient(notif, currentUser)) {
                setActivePushToast(notif);
                showSystemNotification(notifTitle, notifBody);
              }
            }
          }
        }

        if (changed) {
          hasUpdates = true;
          saveShopDocument(d).catch(console.warn);
        }
        return d;
      });

      if (hasUpdates) {
        setShopDocuments(updatedDocs);
        saveStoredShopDocuments(updatedDocs);
      }
    };

    checkOverdueShopDocs();
    const interval = setInterval(checkOverdueShopDocs, 60000); // Mỗi 60 giây kiểm tra 1 lần
    return () => clearInterval(interval);
  }, [shopDocuments, users]);

  // ============================================================================
  // HỒ SƠ THANH TOÁN (TẠM ỨNG, THANH TOÁN, QUYẾT TOÁN) HANDLERS
  // ============================================================================

  // 1. Tạo mới hồ sơ thanh toán (Mặc định gửi TVGS Trưởng & Trưởng Ban QLDA, hạn 1 ngày)
  const handleCreatePaymentDocument = async (newDoc) => {
    try {
      // Lưu ngay vào state & LocalStorage
      setPaymentDocuments(prev => {
        const next = [newDoc, ...prev.filter(d => d.id !== newDoc.id)];
        saveStoredPaymentDocuments(next);
        return next;
      });

      // Đồng bộ lên Firestore
      const saved = (await savePaymentDocument(newDoc)) || newDoc;
      setPaymentDocuments(prev => {
        const next = [saved, ...prev.filter(d => d.id !== saved.id)];
        saveStoredPaymentDocuments(next);
        return next;
      });

      const leadSup = getPaymentLeadSupervisor(users);
      const leadInv = getPaymentLeadInvestor(users);

      const notifTitle = `💰 [Cần phân công] Hồ sơ Thanh toán mới: ${saved.title}`;
      const notifBody = `${saved.createdByName} (${saved.contractorCompany || 'ĐVTC'}) vừa trình duyệt "${saved.typeName}": ${saved.title}. Mời TVGS Trưởng (${leadSup.fullName}) & Trưởng Ban QLDA (${leadInv.fullName}) phân công cán bộ phụ trách trong vòng 1 ngày (24 giờ).`;

      const notif = {
        id: `notif_${Date.now()}`,
        type: 'PAYMENT_DOCUMENT_WAITING_ASSIGNMENT',
        title: notifTitle,
        body: notifBody,
        targetPaymentDocId: saved.id,
        actionText: 'Xem hồ sơ & Phân công cán bộ',
        assignedRecipients: saved.assignedRecipients || [],
        createdByUid: saved.createdByUid,
        createdByName: saved.createdByName,
        extraRecipientUids: [
          saved.createdByUid,
          leadSup.uid,
          leadInv.uid
        ].filter(Boolean),
        targetRoles: ['LEAD_SUPERVISOR', 'LEAD_INVESTOR', 'ADMIN', 'CONTRACTOR'],
        createdAt: new Date().toISOString(),
        time: 'Vừa xong',
        isRead: false
      };

      setNotifications(prev => {
        const nextNotifs = [notif, ...prev.filter(n => n.id !== notif.id)];
        safeSaveLocalStorage(NOTIF_STORAGE_KEY, nextNotifs);
        return nextNotifs;
      });

      if (checkNotificationRecipient(notif, currentUser)) {
        setActivePushToast(notif);
        showSystemNotification(notifTitle, notifBody);
      }

      saveSystemNotification(notif).catch(console.warn);
      sendOneSignalPush({
        title: notifTitle,
        message: notifBody,
        targetRoles: ['LEAD_SUPERVISOR', 'LEAD_INVESTOR', 'ADMIN']
      }).catch(console.warn);

      showAlert({
        type: 'success',
        title: 'Tạo Hồ Sơ Thành Công!',
        message: `Đã phát hành hồ sơ "${saved.title}" (Mã: ${saved.docCode}).\nHồ sơ đã được gửi mặc định đến TVGS Trưởng (${leadSup.fullName}) và Trưởng Ban QLDA (${leadInv.fullName}) để phân công cán bộ trong vòng 1 ngày.`,
        confirmText: 'Xem Hồ Sơ',
        cancelText: 'Đóng',
        onConfirm: () => setSelectedPaymentDoc(saved)
      });
    } catch (err) {
      console.error('Lỗi tạo hồ sơ thanh toán:', err);
      showAlert({
        type: 'error',
        title: 'Lỗi Tạo Hồ Sơ',
        message: 'Có lỗi xảy ra: ' + (err.message || err)
      });
    }
  };

  // 2. Phân công cán bộ thụ lý hồ sơ thanh toán
  const handleAssignPaymentDocument = async ({ docId, roleType, assignee, slaDays, leader }) => {
    try {
      const doc = (paymentDocuments || []).find(d => d.id === docId) || selectedPaymentDoc;
      if (!doc) return;

      const nowIso = new Date().toISOString();
      const targetDueDateIso = calculateDueDate(nowIso, slaDays).toISOString();
      const isTvgs = roleType === 'SUPERVISOR';

      const updatedTvgs = isTvgs ? {
        ...doc.assignedTvgs,
        assignee,
        uid: assignee.uid,
        fullName: assignee.fullName,
        email: assignee.email || '',
        position: assignee.position || 'Kỹ sư TVGS',
        company: assignee.company || 'Tư Vấn Giám Sát Gelicon',
        assignedBy: {
          uid: leader?.uid || currentUser?.uid,
          fullName: leader?.fullName || currentUser?.fullName,
          role: leader?.role || currentUser?.role
        },
        assignedAt: nowIso,
        slaDays: Number(slaDays || 3),
        dueDate: targetDueDateIso,
        status: 'PENDING'
      } : doc.assignedTvgs;

      const updatedInvestor = !isTvgs ? {
        ...doc.assignedInvestor,
        assignee,
        uid: assignee.uid,
        fullName: assignee.fullName,
        email: assignee.email || '',
        position: assignee.position || 'Kỹ sư QLDA',
        company: assignee.company || 'Ban Quản Lý Dự Án An Phú Eco City',
        assignedBy: {
          uid: leader?.uid || currentUser?.uid,
          fullName: leader?.fullName || currentUser?.fullName,
          role: leader?.role || currentUser?.role
        },
        assignedAt: nowIso,
        slaDays: Number(slaDays || 3),
        dueDate: targetDueDateIso,
        status: 'PENDING'
      } : doc.assignedInvestor;

      const bothAssigned = Boolean(updatedTvgs?.assignee || updatedTvgs?.uid) && Boolean(updatedInvestor?.assignee || updatedInvestor?.uid);

      const updatedDoc = {
        ...doc,
        assignedTvgs: updatedTvgs,
        assignedInvestor: updatedInvestor,
        status: bothAssigned ? PAYMENT_STATUS.SENT : doc.status,
        dueDate: targetDueDateIso,
        assignedRecipients: [
          ...(doc.assignedRecipients || []).filter(r => r.role !== roleType),
          { uid: assignee.uid, role: roleType, name: assignee.fullName, position: assignee.position }
        ],
        history: [
          ...(doc.history || []),
          {
            action: 'ASSIGNED',
            by: leader?.fullName || currentUser?.fullName,
            role: leader?.role || currentUser?.role,
            time: nowIso,
            note: `${leader?.position || 'Trưởng ban'} đã phân công cho cán bộ ${assignee.fullName} (${isTvgs ? 'TVGS' : 'Ban QLDA'}) thẩm định. Hạn hoàn thành: ${slaDays} ngày.`
          }
        ],
        updatedAt: nowIso
      };

      await savePaymentDocument(updatedDoc);
      setPaymentDocuments(prev => {
        const next = prev.map(d => d.id === docId ? updatedDoc : d);
        saveStoredPaymentDocuments(next);
        return next;
      });
      setSelectedPaymentDoc(updatedDoc);

      const notifTitle = `📋 [Được giao nhiệm vụ] Thẩm định hồ sơ Thanh toán: ${updatedDoc.title}`;
      const notifBody = `${leader?.fullName || 'Trưởng ban'} đã phân công bạn (${assignee.fullName}) thẩm định hồ sơ "${updatedDoc.title}". Hạn hoàn thành: ${slaDays} ngày.`;

      const notif = {
        id: `notif_${Date.now()}`,
        type: 'PAYMENT_DOCUMENT_ASSIGNED',
        title: notifTitle,
        body: notifBody,
        targetPaymentDocId: updatedDoc.id,
        actionText: 'Xem hồ sơ & Thẩm định',
        assignedRecipients: updatedDoc.assignedRecipients || [],
        recipientUid: assignee.uid,
        createdByUid: updatedDoc.createdByUid,
        createdByName: updatedDoc.createdByName,
        extraRecipientUids: [
          assignee.uid,
          leader?.uid,
          updatedDoc.createdByUid
        ].filter(Boolean),
        targetRoles: [roleType, 'LEAD_SUPERVISOR', 'LEAD_INVESTOR', 'ADMIN'],
        createdAt: nowIso,
        time: 'Vừa xong',
        isRead: false
      };

      setNotifications(prev => {
        const nextNotifs = [notif, ...prev.filter(n => n.id !== notif.id)];
        safeSaveLocalStorage(NOTIF_STORAGE_KEY, nextNotifs);
        return nextNotifs;
      });

      if (checkNotificationRecipient(notif, currentUser)) {
        setActivePushToast(notif);
        showSystemNotification(notifTitle, notifBody);
      }

      saveSystemNotification(notif).catch(console.warn);
      sendOneSignalPush({ title: notifTitle, message: notifBody, targetRoles: [roleType, 'LEAD_SUPERVISOR', 'LEAD_INVESTOR', 'ADMIN'] }).catch(console.warn);

      showAlert({
        type: 'success',
        title: 'Phân Công Thành Công! 📋',
        message: `Đã giao hồ sơ thanh toán "${updatedDoc.title}" cho cán bộ ${assignee.fullName}.\nThời hạn phản hồi: ${slaDays} ngày.`
      });
    } catch (err) {
      console.error('Lỗi phân công hồ sơ thanh toán:', err);
      showAlert({ type: 'error', title: 'Lỗi', message: err.message || err });
    }
  };

  // 3. Xác nhận đạt hồ sơ thanh toán (TVGS duyệt trước -> Ban QLDA phê duyệt sau)
  const handleApprovePaymentDocument = async (docId, { roleType, note, reviewer }) => {
    try {
      const doc = (paymentDocuments || []).find(d => d.id === docId) || selectedPaymentDoc;
      if (!doc) return;

      if (roleType === 'INVESTOR' && doc.assignedTvgs?.status !== 'ACCEPTED') {
        showAlert({
          type: 'warning',
          title: 'Chưa đủ điều kiện phê duyệt',
          message: 'Tư Vấn Giám Sát chưa thẩm định đạt hồ sơ thanh toán này. Ban QLDA chỉ được phê duyệt sau khi TVGS đã duyệt đạt!'
        });
        return;
      }

      const nowIso = new Date().toISOString();
      const updatedAssignedTvgs = roleType === 'SUPERVISOR' ? {
        ...doc.assignedTvgs,
        status: 'ACCEPTED',
        reviewedAt: nowIso,
        note: note || 'Xác nhận đạt yêu cầu'
      } : doc.assignedTvgs;

      const updatedAssignedInvestor = roleType === 'INVESTOR' ? {
        ...doc.assignedInvestor,
        status: 'ACCEPTED',
        reviewedAt: nowIso,
        note: note || 'Xác nhận đạt yêu cầu'
      } : doc.assignedInvestor;

      const isBothAccepted = (updatedAssignedTvgs?.status === 'ACCEPTED') && (updatedAssignedInvestor?.status === 'ACCEPTED');

      const updatedDoc = {
        ...doc,
        assignedTvgs: updatedAssignedTvgs,
        assignedInvestor: updatedAssignedInvestor,
        status: isBothAccepted ? PAYMENT_STATUS.APPROVED : PAYMENT_STATUS.SENT,
        history: [
          ...(doc.history || []),
          {
            action: 'APPROVED',
            by: reviewer?.fullName || (roleType === 'SUPERVISOR' ? 'Tư Vấn Giám Sát' : 'Ban QLDA'),
            role: roleType === 'SUPERVISOR' ? 'Tư Vấn Giám Sát' : 'Ban QLDA',
            time: nowIso,
            note: note ? `Xác nhận đạt: ${note}` : 'Đã xác nhận phê duyệt đạt'
          }
        ],
        updatedAt: nowIso
      };

      await savePaymentDocument(updatedDoc);
      setPaymentDocuments(prev => {
        const next = prev.map(d => d.id === docId ? updatedDoc : d);
        saveStoredPaymentDocuments(next);
        return next;
      });
      setSelectedPaymentDoc(updatedDoc);

      let notifTitle = '';
      let notifBody = '';
      let targetRoles = [];
      let extraRecipientUids = [];

      if (roleType === 'SUPERVISOR') {
        notifTitle = `📋 TVGS đã duyệt đạt - Mời Ban QLDA phê duyệt: ${updatedDoc.title}`;
        notifBody = `Tư Vấn Giám Sát (${reviewer?.fullName || 'TVGS'}) đã thẩm định và xác nhận ĐẠT hồ sơ thanh toán "${updatedDoc.title}". Kính mời Ban QLDA (${updatedDoc.assignedInvestor?.fullName || updatedDoc.assignedInvestor?.assignee?.fullName || 'QLDA'}) vào kiểm tra và phê duyệt cuối cùng.`;
        targetRoles = ['INVESTOR', 'LEAD_INVESTOR', 'ADMIN', 'CONTRACTOR'];
        extraRecipientUids = [
          updatedDoc.assignedInvestor?.uid || updatedDoc.assignedInvestor?.assignee?.uid,
          updatedDoc.createdByUid,
          updatedDoc.assignedTvgs?.uid || updatedDoc.assignedTvgs?.assignee?.uid
        ].filter(Boolean);
      } else {
        notifTitle = `✅ Hồ sơ Thanh toán đã được Ban QLDA phê duyệt hoàn tất: ${updatedDoc.title}`;
        notifBody = `Ban QLDA (${reviewer?.fullName || 'Ban QLDA'}) đã phê duyệt hoàn tất hồ sơ "${updatedDoc.title}". Cả TVGS và Ban QLDA đều đã xác nhận đạt!`;
        targetRoles = ['CONTRACTOR', 'SUPERVISOR', 'LEAD_SUPERVISOR', 'INVESTOR', 'LEAD_INVESTOR', 'ADMIN'];
        extraRecipientUids = [
          updatedDoc.createdByUid,
          updatedDoc.assignedTvgs?.uid || updatedDoc.assignedTvgs?.assignee?.uid,
          updatedDoc.assignedInvestor?.uid || updatedDoc.assignedInvestor?.assignee?.uid
        ].filter(Boolean);
      }

      const notif = {
        id: `notif_${Date.now()}`,
        type: roleType === 'SUPERVISOR' ? 'PAYMENT_DOCUMENT_TVGS_APPROVED' : 'PAYMENT_DOCUMENT_APPROVED',
        title: notifTitle,
        body: notifBody,
        targetPaymentDocId: updatedDoc.id,
        actionText: 'Xem chi tiết hồ sơ thanh toán',
        assignedRecipients: updatedDoc.assignedRecipients || [],
        createdByUid: updatedDoc.createdByUid,
        createdByName: updatedDoc.createdByName,
        extraRecipientUids,
        targetRoles,
        createdAt: nowIso,
        time: 'Vừa xong',
        isRead: false
      };

      setNotifications(prev => {
        const nextNotifs = [notif, ...prev.filter(n => n.id !== notif.id)];
        safeSaveLocalStorage(NOTIF_STORAGE_KEY, nextNotifs);
        return nextNotifs;
      });

      if (checkNotificationRecipient(notif, currentUser)) {
        setActivePushToast(notif);
        showSystemNotification(notifTitle, notifBody);
      }

      saveSystemNotification(notif).catch(console.warn);
      sendOneSignalPush({ title: notifTitle, message: notifBody, targetRoles }).catch(console.warn);

      showAlert({
        type: 'success',
        title: roleType === 'SUPERVISOR' ? 'TVGS Đã Thẩm Định Đạt!' : 'Phê Duyệt Hoàn Tất!',
        message: roleType === 'SUPERVISOR'
          ? `Hồ sơ "${updatedDoc.title}" đã được TVGS duyệt đạt.\nHệ thống đã gửi thông báo đến Ban QLDA để tiến hành phê duyệt bước tiếp theo.`
          : `Hồ sơ "${updatedDoc.title}" đã được Ban QLDA phê duyệt hoàn tất. Cả 2 bên TVGS và Ban QLDA đều đã xác nhận đạt!`
      });
    } catch (err) {
      console.error('Lỗi duyệt hồ sơ thanh toán:', err);
      showAlert({ type: 'error', title: 'Lỗi', message: err.message || err });
    }
  };

  // 4. Yêu cầu sửa / Từ chối hồ sơ thanh toán
  const handleRejectPaymentDocument = async (docId, { roleType, reason, reviewer }) => {
    try {
      const doc = (paymentDocuments || []).find(d => d.id === docId) || selectedPaymentDoc;
      if (!doc) return;

      if (roleType === 'INVESTOR' && doc.assignedTvgs?.status !== 'ACCEPTED') {
        showAlert({
          type: 'warning',
          title: 'Chưa đủ điều kiện thao tác',
          message: 'Tư Vấn Giám Sát chưa duyệt đạt hồ sơ thanh toán này nên Ban QLDA chưa thể thực hiện yêu cầu sửa hay hủy!'
        });
        return;
      }

      const nowIso = new Date().toISOString();
      const updatedAssignedTvgs = roleType === 'SUPERVISOR' ? {
        ...doc.assignedTvgs,
        status: 'REJECTED',
        reviewedAt: nowIso,
        note: reason
      } : doc.assignedTvgs;

      const updatedAssignedInvestor = roleType === 'INVESTOR' ? {
        ...doc.assignedInvestor,
        status: 'REJECTED',
        reviewedAt: nowIso,
        note: reason
      } : doc.assignedInvestor;

      const updatedDoc = {
        ...doc,
        assignedTvgs: updatedAssignedTvgs,
        assignedInvestor: updatedAssignedInvestor,
        status: PAYMENT_STATUS.REJECTED,
        rejectionReason: reason,
        rejectedBy: {
          uid: reviewer?.uid || currentUser?.uid,
          fullName: reviewer?.fullName || currentUser?.fullName,
          role: roleType,
          position: reviewer?.position || (roleType === 'SUPERVISOR' ? 'Kỹ sư TVGS' : 'Cán bộ Ban QLDA'),
          time: nowIso,
          reason
        },
        history: [
          ...(doc.history || []),
          {
            action: 'REJECTED',
            by: reviewer?.fullName || (roleType === 'SUPERVISOR' ? 'Tư Vấn Giám Sát' : 'Ban QLDA'),
            role: roleType === 'SUPERVISOR' ? 'Tư Vấn Giám Sát' : 'Ban QLDA',
            time: nowIso,
            note: `Yêu cầu chỉnh sửa: ${reason}`
          }
        ],
        updatedAt: nowIso
      };

      await savePaymentDocument(updatedDoc);
      setPaymentDocuments(prev => {
        const next = prev.map(d => d.id === docId ? updatedDoc : d);
        saveStoredPaymentDocuments(next);
        return next;
      });
      setSelectedPaymentDoc(updatedDoc);

      const isTvgsReject = roleType === 'SUPERVISOR';
      const notifTitle = isTvgsReject 
        ? `⚠️ TVGS yêu cầu chỉnh sửa hồ sơ thanh toán: ${updatedDoc.title}`
        : `⚠️ Ban QLDA yêu cầu chỉnh sửa hồ sơ thanh toán: ${updatedDoc.title}`;
      const notifBody = `${reviewer?.fullName || 'Cán bộ'} (${isTvgsReject ? 'TVGS' : 'Ban QLDA'}) yêu cầu chỉnh sửa hồ sơ "${updatedDoc.title}". Lý do: ${reason}`;

      const notif = {
        id: `notif_${Date.now()}`,
        type: 'PAYMENT_DOCUMENT_REJECTED',
        title: notifTitle,
        body: notifBody,
        targetPaymentDocId: updatedDoc.id,
        actionText: 'Xem lý do & chỉnh sửa',
        assignedRecipients: updatedDoc.assignedRecipients || [],
        recipientUid: updatedDoc.createdByUid,
        createdByUid: updatedDoc.createdByUid,
        createdByName: updatedDoc.createdByName,
        extraRecipientUids: [
          updatedDoc.createdByUid,
          updatedDoc.assignedTvgs?.uid || updatedDoc.assignedTvgs?.assignee?.uid,
          updatedDoc.assignedInvestor?.uid || updatedDoc.assignedInvestor?.assignee?.uid
        ].filter(Boolean),
        targetRoles: ['CONTRACTOR', 'SUPERVISOR', 'LEAD_SUPERVISOR', 'INVESTOR', 'LEAD_INVESTOR', 'ADMIN'],
        createdAt: nowIso,
        time: 'Vừa xong',
        isRead: false
      };

      setNotifications(prev => {
        const nextNotifs = [notif, ...prev.filter(n => n.id !== notif.id)];
        safeSaveLocalStorage(NOTIF_STORAGE_KEY, nextNotifs);
        return nextNotifs;
      });

      if (checkNotificationRecipient(notif, currentUser)) {
        setActivePushToast(notif);
        showSystemNotification(notifTitle, notifBody);
      }

      saveSystemNotification(notif).catch(console.warn);
      sendOneSignalPush({ title: notifTitle, message: notifBody, targetRoles: ['CONTRACTOR', 'SUPERVISOR', 'INVESTOR', 'ADMIN'] }).catch(console.warn);

      showAlert({
        type: 'info',
        title: 'Đã Gửi Yêu Cầu Chỉnh Sửa',
        message: `Đã gửi yêu cầu chỉnh sửa hồ sơ thanh toán "${updatedDoc.title}" đến Nhà thầu.\nLý do: ${reason}`
      });
    } catch (err) {
      console.error('Lỗi từ chối hồ sơ thanh toán:', err);
      showAlert({ type: 'error', title: 'Lỗi', message: err.message || err });
    }
  };

  // 5. Khắc phục & Nộp lại trực tiếp cho người từ chối (Bypasses 2 leaders)
  const handleResubmitPaymentDocument = async (docId, { notes, pdfFile, pdfFiles, photos, resubmittedBy }) => {
    try {
      const doc = (paymentDocuments || []).find(d => d.id === docId) || selectedPaymentDoc;
      if (!doc) return;

      const nowIso = new Date().toISOString();
      const rejectingOfficer = doc.rejectedBy;
      const isTvgsReject = rejectingOfficer?.role === 'SUPERVISOR';

      const updatedTvgs = isTvgsReject ? {
        ...doc.assignedTvgs,
        status: 'PENDING',
        note: ''
      } : doc.assignedTvgs;

      const updatedInvestor = !isTvgsReject ? {
        ...doc.assignedInvestor,
        status: 'PENDING',
        note: ''
      } : doc.assignedInvestor;

      const updatedDoc = {
        ...doc,
        notes: notes !== undefined ? notes : doc.notes,
        pdfFile: pdfFile !== undefined ? pdfFile : doc.pdfFile,
        pdfFiles: Array.isArray(pdfFiles) ? pdfFiles : (doc.pdfFiles || (doc.pdfFile ? [doc.pdfFile] : [])),
        photos: Array.isArray(photos) ? photos : doc.photos,
        assignedTvgs: updatedTvgs,
        assignedInvestor: updatedInvestor,
        status: PAYMENT_STATUS.SENT,
        rejectionReason: '',
        history: [
          ...(doc.history || []),
          {
            action: 'RESUBMITTED',
            by: resubmittedBy?.fullName || currentUser?.fullName,
            role: 'CONTRACTOR',
            time: nowIso,
            note: `Đã khắc phục chỉnh sửa và nộp lại trực tiếp cho ${rejectingOfficer?.fullName || 'cán bộ thẩm định'}. Nội dung: ${notes}`
          }
        ],
        updatedAt: nowIso
      };

      await savePaymentDocument(updatedDoc);
      setPaymentDocuments(prev => {
        const next = prev.map(d => d.id === docId ? updatedDoc : d);
        saveStoredPaymentDocuments(next);
        return next;
      });
      setSelectedPaymentDoc(updatedDoc);

      const targetOfficerName = rejectingOfficer?.fullName || 'Cán bộ thẩm định';
      const notifTitle = `🔄 [Đã sửa & Gửi lại] Hồ sơ Thanh toán: ${updatedDoc.title}`;
      const notifBody = `Nhà thầu (${resubmittedBy?.fullName || 'ĐVTC'}) đã chỉnh sửa và gửi lại hồ sơ "${updatedDoc.title}" trực tiếp cho bạn (${targetOfficerName}) kiểm tra lại. Nội dung: ${notes}`;

      const notif = {
        id: `notif_${Date.now()}`,
        type: 'PAYMENT_DOCUMENT_RESUBMITTED',
        title: notifTitle,
        body: notifBody,
        targetPaymentDocId: updatedDoc.id,
        actionText: 'Xem hồ sơ & Đánh giá lại',
        assignedRecipients: updatedDoc.assignedRecipients || [],
        recipientUid: rejectingOfficer?.uid,
        createdByUid: updatedDoc.createdByUid,
        createdByName: updatedDoc.createdByName,
        extraRecipientUids: [
          rejectingOfficer?.uid,
          updatedDoc.createdByUid
        ].filter(Boolean),
        targetRoles: [rejectingOfficer?.role || 'SUPERVISOR', 'CONTRACTOR', 'ADMIN'],
        createdAt: nowIso,
        time: 'Vừa xong',
        isRead: false
      };

      setNotifications(prev => {
        const nextNotifs = [notif, ...prev.filter(n => n.id !== notif.id)];
        safeSaveLocalStorage(NOTIF_STORAGE_KEY, nextNotifs);
        return nextNotifs;
      });

      if (checkNotificationRecipient(notif, currentUser)) {
        setActivePushToast(notif);
        showSystemNotification(notifTitle, notifBody);
      }

      saveSystemNotification(notif).catch(console.warn);
      sendOneSignalPush({ title: notifTitle, message: notifBody, targetRoles: [rejectingOfficer?.role || 'SUPERVISOR', 'ADMIN'] }).catch(console.warn);

      showAlert({
        type: 'success',
        title: 'Đã Gửi Lại Hồ Sơ! 🔄',
        message: `Hồ sơ thanh toán "${updatedDoc.title}" đã được nộp lại trực tiếp cho cán bộ ${targetOfficerName} để kiểm tra lại.`
      });
    } catch (err) {
      console.error('Lỗi nộp lại hồ sơ thanh toán:', err);
      showAlert({ type: 'error', title: 'Lỗi', message: err.message || err });
    }
  };

  // 6. Xóa hồ sơ thanh toán
  const handleDeletePaymentDocument = async (docId) => {
    try {
      await deletePaymentDocument(docId);
      setPaymentDocuments(prev => {
        const next = prev.filter(d => d.id !== docId);
        saveStoredPaymentDocuments(next);
        return next;
      });
      setSelectedPaymentDoc(null);
      showAlert({
        type: 'success',
        title: 'Đã Xóa',
        message: 'Đã xóa hồ sơ thanh toán khỏi hệ thống.'
      });
    } catch (err) {
      console.error('Lỗi xóa hồ sơ thanh toán:', err);
      showAlert({ type: 'error', title: 'Lỗi', message: err.message || err });
    }
  };

  // 7. KIỂM TRA ĐỊNH KỲ THÔNG BÁO QUÁ HẠN HỒ SƠ THANH TOÁN
  const lastOverduePaymentCheckRef = useRef(0);
  useEffect(() => {
    if (!paymentDocuments || paymentDocuments.length === 0) return;

    const checkOverduePaymentDocs = () => {
      const now = Date.now();
      if (now - lastOverduePaymentCheckRef.current < 45000) return;
      lastOverduePaymentCheckRef.current = now;

      let hasUpdates = false;
      const updatedDocs = paymentDocuments.map(doc => {
        let changed = false;
        let d = { ...doc };

        // 1. Kiểm tra chậm phân công (> 24h từ lúc tạo)
        if (isPaymentAssignmentOverdue(d)) {
          const isTvgsAssigned = Boolean(d.assignedTvgs?.assignee || d.assignedTvgs?.uid);
          const isInvestorAssigned = Boolean(d.assignedInvestor?.assignee || d.assignedInvestor?.uid);
          const leadSup = getPaymentLeadSupervisor(users);
          const leadInv = getPaymentLeadInvestor(users);

          if (!isTvgsAssigned && !d.assignmentTvgsOverdueNotified) {
            d.assignmentTvgsOverdueNotified = true;
            changed = true;

            const notifTitle = `⏰ [Chậm phân công] Quá 24h chưa giao TVGS: ${d.title}`;
            const notifBody = `Hồ sơ thanh toán "${d.title}" đã quá 24h kể từ khi tạo nhưng TVGS Trưởng (${leadSup.fullName}) chưa phân công cán bộ thụ lý.`;

            const notif = {
              id: `notif_overdue_assign_tvgs_${d.id}_${Date.now()}`,
              type: 'PAYMENT_DOCUMENT_ASSIGNMENT_OVERDUE',
              title: notifTitle,
              body: notifBody,
              targetPaymentDocId: d.id,
              actionText: 'Phân công ngay',
              recipientUid: leadSup.uid,
              extraRecipientUids: [leadSup.uid, leadInv.uid].filter(Boolean),
              targetRoles: ['LEAD_SUPERVISOR', 'LEAD_INVESTOR', 'ADMIN'],
              createdAt: new Date().toISOString(),
              time: 'Vừa xong',
              isRead: false
            };

            setNotifications(prev => [notif, ...prev]);
            saveSystemNotification(notif).catch(console.warn);
            if (checkNotificationRecipient(notif, currentUser)) {
              setActivePushToast(notif);
              showSystemNotification(notifTitle, notifBody);
            }
          }

          if (!isInvestorAssigned && !d.assignmentInvestorOverdueNotified) {
            d.assignmentInvestorOverdueNotified = true;
            changed = true;

            const notifTitle = `⏰ [Chậm phân công] Quá 24h chưa giao Ban QLDA: ${d.title}`;
            const notifBody = `Hồ sơ thanh toán "${d.title}" đã quá 24h kể từ khi tạo nhưng Trưởng Ban QLDA (${leadInv.fullName}) chưa phân công cán bộ thụ lý.`;

            const notif = {
              id: `notif_overdue_assign_inv_${d.id}_${Date.now()}`,
              type: 'PAYMENT_DOCUMENT_ASSIGNMENT_OVERDUE',
              title: notifTitle,
              body: notifBody,
              targetPaymentDocId: d.id,
              actionText: 'Phân công ngay',
              recipientUid: leadInv.uid,
              extraRecipientUids: [leadInv.uid, leadSup.uid].filter(Boolean),
              targetRoles: ['LEAD_INVESTOR', 'LEAD_SUPERVISOR', 'ADMIN'],
              createdAt: new Date().toISOString(),
              time: 'Vừa xong',
              isRead: false
            };

            setNotifications(prev => [notif, ...prev]);
            saveSystemNotification(notif).catch(console.warn);
            if (checkNotificationRecipient(notif, currentUser)) {
              setActivePushToast(notif);
              showSystemNotification(notifTitle, notifBody);
            }
          }
        }

        // 2. Kiểm tra chậm phản hồi (Quá hạn SLA)
        if (d.status !== PAYMENT_STATUS.APPROVED && d.status !== PAYMENT_STATUS.REJECTED) {
          const leadSup = getPaymentLeadSupervisor(users);
          const leadInv = getPaymentLeadInvestor(users);

          // Kiểm tra TVGS quá hạn
          const tvgsAssigned = d.assignedTvgs?.assignee || d.assignedTvgs?.uid;
          if (tvgsAssigned && d.assignedTvgs?.status === 'PENDING') {
            const tvgsDue = d.assignedTvgs?.dueDate ? new Date(d.assignedTvgs.dueDate).getTime() : (d.dueDate ? new Date(d.dueDate).getTime() : 0);
            if (tvgsDue && now > tvgsDue && !d.tvgsReviewOverdueNotified) {
              d.tvgsReviewOverdueNotified = true;
              changed = true;

              const tvgsName = d.assignedTvgs?.assignee?.fullName || d.assignedTvgs?.fullName || 'Kỹ sư TVGS';
              const tvgsUid = d.assignedTvgs?.assignee?.uid || d.assignedTvgs?.uid;
              const notifTitle = `⏰ [Chậm phản hồi] TVGS quá hạn thẩm định: ${d.title}`;
              const notifBody = `Cán bộ TVGS (${tvgsName}) đã quá thời hạn phản hồi hồ sơ thanh toán "${d.title}". Cảnh báo gửi đến TVGS Trưởng (${leadSup.fullName}) và cán bộ chậm.`;

              const notif = {
                id: `notif_overdue_review_tvgs_${d.id}_${Date.now()}`,
                type: 'PAYMENT_DOCUMENT_REVIEW_OVERDUE',
                title: notifTitle,
                body: notifBody,
                targetPaymentDocId: d.id,
                actionText: 'Xem hồ sơ & Xử lý gấp',
                recipientUid: tvgsUid,
                extraRecipientUids: [tvgsUid, leadSup.uid].filter(Boolean),
                targetRoles: ['SUPERVISOR', 'LEAD_SUPERVISOR', 'LEAD_INVESTOR', 'ADMIN'],
                createdAt: new Date().toISOString(),
                time: 'Vừa xong',
                isRead: false
              };

              setNotifications(prev => [notif, ...prev]);
              saveSystemNotification(notif).catch(console.warn);
              if (checkNotificationRecipient(notif, currentUser)) {
                setActivePushToast(notif);
                showSystemNotification(notifTitle, notifBody);
              }
            }
          }

          // Kiểm tra Ban QLDA quá hạn
          const invAssigned = d.assignedInvestor?.assignee || d.assignedInvestor?.uid;
          if (invAssigned && d.assignedInvestor?.status === 'PENDING') {
            const invDue = d.assignedInvestor?.dueDate ? new Date(d.assignedInvestor.dueDate).getTime() : (d.dueDate ? new Date(d.dueDate).getTime() : 0);
            if (invDue && now > invDue && !d.investorReviewOverdueNotified) {
              d.investorReviewOverdueNotified = true;
              changed = true;

              const invName = d.assignedInvestor?.assignee?.fullName || d.assignedInvestor?.fullName || 'Cán bộ QLDA';
              const invUid = d.assignedInvestor?.assignee?.uid || d.assignedInvestor?.uid;
              const notifTitle = `⏰ [Chậm phản hồi] Ban QLDA quá hạn phê duyệt: ${d.title}`;
              const notifBody = `Cán bộ Ban QLDA (${invName}) đã quá hạn phê duyệt hồ sơ thanh toán "${d.title}". Thông báo cảnh báo được gửi đến Trưởng Ban QLDA (${leadInv.fullName}), CĐT và cán bộ chậm.`;

              const notif = {
                id: `notif_overdue_review_inv_${d.id}_${Date.now()}`,
                type: 'PAYMENT_DOCUMENT_REVIEW_OVERDUE',
                title: notifTitle,
                body: notifBody,
                targetPaymentDocId: d.id,
                actionText: 'Xem hồ sơ & Xử lý gấp',
                recipientUid: invUid,
                extraRecipientUids: [invUid, leadInv.uid].filter(Boolean),
                targetRoles: ['INVESTOR', 'LEAD_INVESTOR', 'ADMIN'],
                createdAt: new Date().toISOString(),
                time: 'Vừa xong',
                isRead: false
              };

              setNotifications(prev => [notif, ...prev]);
              saveSystemNotification(notif).catch(console.warn);
              if (checkNotificationRecipient(notif, currentUser)) {
                setActivePushToast(notif);
                showSystemNotification(notifTitle, notifBody);
              }
            }
          }
        }

        if (changed) {
          hasUpdates = true;
          savePaymentDocument(d).catch(console.warn);
        }
        return d;
      });

      if (hasUpdates) {
        setPaymentDocuments(updatedDocs);
        saveStoredPaymentDocuments(updatedDocs);
      }
    };

    checkOverduePaymentDocs();
    const interval = setInterval(checkOverduePaymentDocs, 60000);
    return () => clearInterval(interval);
  }, [paymentDocuments, users]);

  // ============================================================================
  // 4d. TỰ ĐỘNG ĐỒNG BỘ CẶP ĐÔI 1-1 (AUTO-HEAL PAIRS) - TỐI ƯU CHỐNG LOOP & LAG
  // ============================================================================
  const isAutoHealingRef = useRef(false);

  useEffect(() => {
    if (!requests || !reports) return;
    if (requests.length === 0 || reports.length === 0) return;
    if (isAutoHealingRef.current) return;

    let requestsNeedUpdate = false;
    let reportsNeedUpdate = false;

    // A. Nếu có Biên bản nào mà chưa có Phiếu yêu cầu trong requests -> Phục hồi Phiếu yêu cầu
    const currentRequests = [...requests];
    reports.forEach(rep => {
      const hasReq = currentRequests.some(r => 
        (r.id && rep.requestId && r.id === rep.requestId) || 
        (r.reportId && r.reportId === rep.id) ||
        (r.projectCategoryCode && rep.projectCategoryCode && r.projectCategoryCode.replace(/\/(IR|WA|MI)\//, '') === rep.projectCategoryCode.replace(/\/(IR|WA|MI)\//, ''))
      );
      if (!hasReq && rep.id) {
        const isMaterial = rep.inspectionType === 'MATERIAL';
        const healedReq = {
          id: rep.requestId || `req_${rep.id}`,
          requestNumber: 'IR',
          projectCategoryCode: rep.projectCategoryCode || generateDocumentCode('2203', 'IR', rep.createdAt || new Date(), rep.revisionNumber || 1),
          referenceDocNumber: rep.referenceDocNumber || rep.projectCategoryCode,
          projectId: rep.projectInfo?.projectId || 'proj_2203',
          projectName: rep.projectInfo?.projectName || 'Đầu tư Xây Dựng Nhà Ở Phường Thường Thạnh - An Phú Eco City',
          buildingName: rep.projectInfo?.buildingName || 'Chung cư nhà ở xã hội 2',
          itemName: rep.projectInfo?.itemName || 'Thi công kết cấu – Tòa A và Tòa B',
          location: rep.projectInfo?.location || 'Cần Thơ',
          contractorCompany: rep.attendees?.contractor?.company || 'Công ty CP Xây dựng An Phú Gia',
          createdByUid: rep.createdByUid || 'uid_dvtc_01',
          createdByName: rep.attendees?.contractor?.person || 'Phạm Thanh Nhàn',
          createdByRole: rep.attendees?.contractor?.position || 'Chỉ huy trưởng',
          taskContent: rep.inspectionObject || (isMaterial ? 'Nghiệm thu vật liệu đầu vào' : 'Nghiệm thu công việc xây dựng'),
          startTime: rep.time?.startTime || '08h30, hôm nay',
          endTime: rep.time?.endTime || '16h30, hôm nay',
          scheduledTime: rep.time?.startTime || '08h30 hôm nay',
          inspectionPlace: rep.time?.place || 'Hiện trường công trình An Phú Eco City',
          status: rep.status === 'COMPLETED' ? 'COMPLETED' : (rep.status === 'REJECTED' ? 'HAS_REJECTIONS' : (rep.status === 'RECTIFIED' ? 'RECTIFIED' : (rep.status === 'WAITING_INVESTOR' ? 'WAITING_INVESTOR' : 'SENT'))),
          createdAt: rep.createdAt || new Date().toISOString(),
          hasReport: true,
          reportId: rep.id,
          assignedRecipients: rep.assignedRecipients || [],
          evidencePhotos: rep.evidencePhotos || [],
          inspectionType: rep.inspectionType || 'WORK',
          standardsApplied: rep.standardsApplied || [],
          materials: rep.materials || null,
          materialDetails: rep.materialDetails || null,
          rectificationNotes: rep.rectification?.description || null,
          rectificationPhotos: rep.rectification?.photos || []
        };
        currentRequests.push(healedReq);
        requestsNeedUpdate = true;
      }
    });

    // B. Nếu có Phiếu yêu cầu nào mà chưa có Biên bản trong reports -> Phục hồi Biên bản
    const currentReports = [...reports];
    requests.forEach(req => {
      const hasRep = currentReports.some(r => 
        (r.id && req.reportId && r.id === req.reportId) || 
        (r.requestId && r.requestId === req.id) ||
        (r.projectCategoryCode && req.projectCategoryCode && r.projectCategoryCode.replace(/\/(IR|WA|MI)\//, '') === req.projectCategoryCode.replace(/\/(IR|WA|MI)\//, ''))
      );
      if (!hasRep && req.id) {
        const isMaterial = req.inspectionType === 'MATERIAL';
        const newReportId = req.reportId || `rep_${req.id}`;
        const reportDocCode = isMaterial ? 'MI' : 'WA';
        const projectCode = req.projectCode || (
          (req.buildingName || '').includes('2204') || (req.buildingName || '').includes('cao tầng') ? '2204' : '2203'
        );
        const reportNum = reportDocCode;
        const docNum = generateDocumentCode(projectCode, reportDocCode, req.createdAt || new Date(), req.revisionNumber || 1);
        const today = new Date();
        const cityDate = `Cần Thơ, ngày ${String(today.getDate()).padStart(2, '0')} tháng ${String(today.getMonth() + 1).padStart(2, '0')} năm ${today.getFullYear()}`;

        const tvgsRecipient = req.assignedRecipients?.find(r => r.role === 'SUPERVISOR' || r.role === 'LEAD_SUPERVISOR');
        const cdtRecipient = req.assignedRecipients?.find(r => r.role === 'INVESTOR' || r.role === 'LEAD_INVESTOR');

        const healedRep = {
          id: newReportId,
          requestId: req.id,
          requestNumber: req.requestNumber,
          reportNumber: reportNum,
          projectCode: projectCode,
          docTypeCode: reportDocCode,
          projectCategoryCode: docNum,
          referenceDocNumber: docNum,
          revisionNumber: req.revisionNumber || 1,
          cityDate: cityDate,
          inspectionType: req.inspectionType || 'WORK',
          reportTemplate: isMaterial ? 'FORM_12' : 'CONSTRUCTION_WORK',
          materialDetails: req.materialDetails || null,
          materials: req.materials || req.materialDetails?.materials || null,
          projectInfo: {
            projectName: req.projectName,
            buildingName: req.buildingName,
            itemName: req.itemName,
            location: req.location
          },
          inspectionObject: isMaterial 
            ? `Nghiệm thu vật liệu đầu vào: ${req.materialDetails?.name || req.taskContent}` 
            : req.taskContent,
          time: {
            startTime: req.startTime || req.scheduledTime,
            endTime: req.endTime || '16h30, hôm nay',
            place: req.inspectionPlace
          },
          attendees: {
            investor: {
              company: cdtRecipient?.company || 'Công ty TNHH An Phú Cần Thơ',
              person: cdtRecipient?.fullName || '',
              position: cdtRecipient?.position || 'Cán bộ ban QLDA',
              email: cdtRecipient?.email || '',
              uid: cdtRecipient?.uid || '',
              signed: req.status === 'COMPLETED'
            },
            supervisor: {
              company: tvgsRecipient?.company || 'Công ty CP Tư vấn Xây dựng và Thương mại GELICON',
              person: tvgsRecipient?.fullName || '',
              position: tvgsRecipient?.position || 'Cán bộ tư vấn giám sát',
              email: tvgsRecipient?.email || '',
              uid: tvgsRecipient?.uid || '',
              signed: req.status === 'COMPLETED' || req.status === 'WAITING_INVESTOR'
            },
            contractor: {
              company: req.contractorCompany || 'Công ty CP Xây dựng An Phú Gia',
              person: req.createdByName || 'Phạm Thanh Nhàn',
              position: req.createdByRole || 'Chỉ huy trưởng',
              signed: true
            }
          },
          assignedRecipients: req.assignedRecipients || [],
          standardsApplied: req.standardsApplied || [],
          qualityAssessment: { matchDesign: true, matchStandards: true, matchTechnical: true, otherOpinions: 'Không' },
          conclusion: { isAccepted: req.status !== 'HAS_REJECTIONS', repairRequired: 'Không có', otherRequirements: 'Không có' },
          status: req.status === 'COMPLETED' ? 'COMPLETED' : (req.status === 'HAS_REJECTIONS' ? 'REJECTED' : (req.status === 'RECTIFIED' ? 'RECTIFIED' : (req.status === 'WAITING_INVESTOR' ? 'WAITING_INVESTOR' : 'PENDING_APPROVAL'))),
          defectPhotos: [],
          evidencePhotos: req.evidencePhotos || [],
          rectification: null,
          createdAt: req.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        currentReports.push(healedRep);
        reportsNeedUpdate = true;
      }
    });

    if (requestsNeedUpdate || reportsNeedUpdate) {
      isAutoHealingRef.current = true;
      if (requestsNeedUpdate) {
        currentRequests.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setRequests(currentRequests);
        safeSaveLocalStorage(REQUESTS_STORAGE_KEY, currentRequests);
      }
      if (reportsNeedUpdate) {
        currentReports.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setReports(currentReports);
        safeSaveLocalStorage(REPORTS_STORAGE_KEY, currentReports);
      }
      setTimeout(() => {
        isAutoHealingRef.current = false;
      }, 800);
    }
  }, [requests.length, reports.length]);

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
  const [pushPermissionGranted, setPushPermissionGranted] = useState(() => {
    if (typeof window === 'undefined') return false;
    const hasNotification = 'Notification' in window && Notification.permission === 'granted';
    const isSavedEnabled = localStorage.getItem('apct_push_enabled') === 'true';
    return Boolean(hasNotification || isSavedEnabled);
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        setPushPermissionGranted(true);
      }
    }
  }, []);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState('REQUESTS'); // 'REQUESTS' | 'INVITATIONS' | 'REPORTS' | 'ADMIN_USERS' | 'ADMIN_STANDARDS'

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [initialOpenRectify, setInitialOpenRectify] = useState(false);
  const [reportInitialTab, setReportInitialTab] = useState('INVITATION');
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);
  const [isCreateDailyLogModalOpen, setIsCreateDailyLogModalOpen] = useState(false);
  const [selectedDailyLog, setSelectedDailyLog] = useState(null);
  const [isDailyLogDetailModalOpen, setIsDailyLogDetailModalOpen] = useState(false);
  const [isCreateCompletionModalOpen, setIsCreateCompletionModalOpen] = useState(false);
  const [selectedCompletionReport, setSelectedCompletionReport] = useState(null);
  const [isCompletionDetailModalOpen, setIsCompletionDetailModalOpen] = useState(false);
  
  // Modal Hồ Sơ Bộ Phận Shop
  const [isCreateShopModalOpen, setIsCreateShopModalOpen] = useState(false);
  const [selectedShopDoc, setSelectedShopDoc] = useState(null);

  // Modal Hồ Sơ Thanh Toán
  const [isCreatePaymentModalOpen, setIsCreatePaymentModalOpen] = useState(false);
  const [selectedPaymentDoc, setSelectedPaymentDoc] = useState(null);
  const [reassignModalState, setReassignModalState] = useState({
    isOpen: false,
    request: null,
    reassignType: 'SUPERVISOR' // 'SUPERVISOR' | 'INVESTOR'
  });

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
    pushGuideModal.isOpen ||
    reassignModalState.isOpen ||
    isCreateDailyLogModalOpen ||
    isDailyLogDetailModalOpen ||
    isCreateCompletionModalOpen ||
    isCompletionDetailModalOpen ||
    Boolean(selectedCompletionReport) ||
    isCreateShopModalOpen ||
    Boolean(selectedShopDoc) ||
    isCreatePaymentModalOpen ||
    Boolean(selectedPaymentDoc)
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
      try {
        localStorage.setItem('apct_push_enabled', 'true');
      } catch (e) {}
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

  // Cập nhật thông tin hồ sơ & mật khẩu của chính người dùng đang đăng nhập
  const handleUpdateUserProfile = async (updatedFields) => {
    if (!currentUser) return;
    const updatedUser = {
      ...currentUser,
      ...updatedFields
    };
    await handleUpdateUser(updatedUser);
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

  const handleToggleUserStatus = async (userId) => {
    let updatedTarget = null;
    setUsers(prev => {
      const nextUsers = prev.map(u => {
        if (u.uid === userId) {
          const nextStatus = (u.status || 'ACTIVE') === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
          updatedTarget = { ...u, status: nextStatus };
          return updatedTarget;
        }
        return u;
      });
      safeSaveLocalStorage(USERS_STORAGE_KEY, nextUsers);
      return nextUsers;
    });
    if (updatedTarget) {
      try {
        await saveSystemUser(updatedTarget);
      } catch (e) {
        console.warn('Lỗi lưu trạng thái user lên Firestore:', e);
      }
    }
  };

  // Update user role in Admin Portal
  const handleUpdateUserRole = async (uid, newRole) => {
    let updatedTarget = null;
    setUsers(prev => {
      const nextUsers = prev.map(u => {
        if (u.uid === uid) {
          updatedTarget = { ...u, role: newRole };
          return updatedTarget;
        }
        return u;
      });
      safeSaveLocalStorage(USERS_STORAGE_KEY, nextUsers);
      return nextUsers;
    });
    if (currentUser?.uid === uid) {
      const updated = { ...currentUser, role: newRole };
      setCurrentUser(updated);
      try {
        localStorage.setItem('apct_logged_user', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
    }
    if (updatedTarget) {
      try {
        await saveSystemUser(updatedTarget);
      } catch (e) {
        console.warn('Lỗi lưu role user lên Firestore:', e);
      }
    }
  };

  // Đồng bộ toàn bộ danh sách cán bộ hiện có lên Google Firestore Cloud
  const handleSyncAllUsersToCloud = async () => {
    try {
      await seedOfficialUsersToCloud(users);
      safeSaveLocalStorage(USERS_STORAGE_KEY, users);
      return true;
    } catch (e) {
      console.warn('Lỗi đồng bộ cán bộ lên Cloud:', e);
      return false;
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
          isAutoHealingRef.current = true;
          setRequests([]);
          setReports([]);
          setNotifications([]);
          setDailyLogs([]);
          setCompletionReports([]);
          await clearAllAPCTStorage();
          try { localStorage.removeItem(DAILY_LOGS_STORAGE_KEY); } catch (e) {}
          try { localStorage.removeItem(COMPLETION_REPORTS_STORAGE_KEY); } catch (e) {}
          await clearAllCloudInspectionData();
          setTimeout(() => {
            isAutoHealingRef.current = false;
          }, 1000);
          showAlert({
            type: 'success',
            title: 'Đã Xóa Thành Công!',
            message: 'Toàn bộ dữ liệu kiểm thử đã được dọn sạch.\nBây giờ bạn có thể bắt đầu tạo phiếu nghiệm thu mới từ đầu.',
            confirmText: 'Bắt đầu ngay'
          });
        } catch (err) {
          isAutoHealingRef.current = false;
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

  // ============================================================================
  // HANDLERS CHO NHẬT KÝ THI CÔNG (CONSTRUCTION DAILY LOGS)
  // ============================================================================
  const handleCreateDailyLog = async (newLog) => {
    try {
      const saved = await saveDailyLog(newLog);
      const updatedList = [saved, ...(dailyLogs || []).filter(l => l.id !== saved.id)];
      setDailyLogs(updatedList);
      safeSaveLocalStorage(DAILY_LOGS_STORAGE_KEY, updatedList);
      setIsCreateDailyLogModalOpen(false);

      // Gửi thông báo tới TVGS và CĐT
      const notif = {
        title: `📝 Nhật Ký Thi Công Mới: ${saved.logNumber || 'Ngày ' + saved.date}`,
        body: `${currentUser?.fullName || 'ĐVTC'} vừa tạo Nhật ký thi công ngày ${saved.date} cho ${saved.buildingName || 'Công trình'}. Kính mời TVGS ${saved.assignedSupervisor?.name ? `(${saved.assignedSupervisor.name})` : ''} và CĐT vào kiểm tra và xác nhận.`,
        recipientUid: saved.supervisorUid || null,
        type: 'DAILY_LOG_CREATED',
        targetDailyLogId: saved.id,
        createdAt: new Date().toISOString(),
        isRead: false
      };
      saveSystemNotification(notif).catch(console.warn);

      showAlert({
        type: 'success',
        title: 'Tạo Nhật Ký Thành Công!',
        message: `Đã lưu Nhật ký thi công số ${saved.logNumber || ''} (Ngày ${saved.date}).\nVăn bản đã được chuyển đến Tư Vấn Giám Sát và Chủ Đầu Tư để theo dõi.`,
        confirmText: 'Xem Văn Bản',
        onConfirm: () => {
          setSelectedDailyLog(saved);
          setIsDailyLogDetailModalOpen(true);
        }
      });
    } catch (err) {
      console.error('Lỗi lưu nhật ký thi công:', err);
      showAlert({
        type: 'danger',
        title: 'Lỗi Lưu Nhật Ký',
        message: 'Có lỗi xảy ra: ' + (err.message || err),
        confirmText: 'Đóng'
      });
    }
  };

  const handleConfirmDailyLog = async (updatedLog) => {
    try {
      await updateDailyLog(updatedLog.id, updatedLog);
      const updatedList = (dailyLogs || []).map(l => l.id === updatedLog.id ? updatedLog : l);
      setDailyLogs(updatedList);
      safeSaveLocalStorage(DAILY_LOGS_STORAGE_KEY, updatedList);
      setSelectedDailyLog(updatedLog);

      // Thông báo các bên đã xác nhận hoàn tất
      const notif = {
        title: `✅ TVGS & CĐT Đã Xác Nhận Nhật Ký Thi Công`,
        body: `Tư vấn giám sát đã đánh giá ý kiến và hoàn tất xác nhận Nhật ký thi công ngày ${updatedLog.date}. Biên bản nhật ký đã hoàn chỉnh pháp lý 3 bên.`,
        type: 'DAILY_LOG_CONFIRMED',
        targetDailyLogId: updatedLog.id,
        createdAt: new Date().toISOString(),
        isRead: false
      };
      saveSystemNotification(notif).catch(console.warn);

      showAlert({
        type: 'success',
        title: 'Xác Nhận Thành Công!',
        message: `Tư vấn giám sát và Chủ đầu tư đã hoàn tất ký nhận xét Nhật ký thi công ngày ${updatedLog.date}.\nVăn bản đã hoàn thiện đầy đủ 7 mục theo chuẩn pháp lý.`,
        confirmText: 'Đóng'
      });
    } catch (err) {
      console.error('Lỗi cập nhật nhật ký:', err);
      showAlert({
        type: 'danger',
        title: 'Lỗi Xác Nhận',
        message: 'Có lỗi xảy ra: ' + (err.message || err),
        confirmText: 'Đóng'
      });
    }
  };

  const handleDeleteDailyLog = (logId) => {
    showConfirm({
      type: 'danger',
      title: 'XÁC NHẬN XÓA NHẬT KÝ THI CÔNG',
      message: 'Bạn có chắc chắn muốn xóa nhật ký thi công này? Dữ liệu đã xóa không thể phục hồi.',
      confirmText: 'Xóa Nhật Ký',
      cancelText: 'Hủy Bỏ',
      onConfirm: async () => {
        try {
          await deleteDailyLog(logId);
          const updatedList = (dailyLogs || []).filter(l => l.id !== logId);
          setDailyLogs(updatedList);
          safeSaveLocalStorage(DAILY_LOGS_STORAGE_KEY, updatedList);
          if (selectedDailyLog?.id === logId) {
            setIsDailyLogDetailModalOpen(false);
            setSelectedDailyLog(null);
          }
          showAlert({
            type: 'success',
            title: 'Đã Xóa Thành Công',
            message: 'Nhật ký thi công đã được xóa khỏi hệ thống.',
            confirmText: 'Đóng'
          });
        } catch (err) {
          showAlert({
            type: 'danger',
            title: 'Lỗi Xóa Nhật Ký',
            message: 'Không thể xóa: ' + (err.message || err),
            confirmText: 'Đóng'
          });
        }
      }
    });
  };

  const handleOpenDailyLog = (log) => {
    setSelectedDailyLog(log);
    setIsDailyLogDetailModalOpen(true);
  };

  // ============================================================================
  // HANDLERS CHO BIÊN BẢN NGHIỆM THU HOÀN THÀNH (COMPLETION INSPECTION REPORTS)
  // ============================================================================
  const handleCreateCompletionReport = async (newReport) => {
    try {
      const saved = await saveCompletionReport(newReport);
      const updatedList = [saved, ...(completionReports || []).filter(r => r.id !== saved.id)];
      setCompletionReports(updatedList);
      safeSaveLocalStorage(COMPLETION_REPORTS_STORAGE_KEY, updatedList);
      setIsCreateCompletionModalOpen(false);

      // Tự động gửi thông báo đến TVGS Trưởng và CĐT Trưởng
      const notif = {
        id: `notif_${Date.now()}`,
        title: `🏆 Biên Bản Nghiệm Thu Hoàn Thành: ${saved.reportNumber || saved.objectName}`,
        body: `ĐVTC ${saved.contractorName || currentUser?.fullName} đã phát hành Biên bản nghiệm thu hoàn thành. Đã tự động gửi tới TVGS Trưởng (${saved.leadSupervisor?.name || 'Đinh Xuân Thám'}) và CĐT Trưởng (${saved.leadInvestor?.name || 'Ngô Quý Linh'}) để kiểm tra và ký duyệt.`,
        type: 'COMPLETION_REPORT_CREATED',
        targetCompletionReportId: saved.id,
        targetRoles: ['LEAD_SUPERVISOR', 'LEAD_INVESTOR', 'SUPERVISOR', 'INVESTOR', 'ADMIN', 'CONTRACTOR'],
        createdAt: new Date().toISOString(),
        isRead: false
      };
      saveSystemNotification(notif).catch(console.warn);

      showAlert({
        type: 'success',
        title: 'Lập Biên Bản Hoàn Thành Thành Công!',
        message: `Đã phát hành Biên bản nghiệm thu hoàn thành số ${saved.reportNumber || ''}.\nHệ thống đã tự động gửi đến TVGS Trưởng và CĐT Trưởng để ký duyệt pháp lý theo quy định.`,
        confirmText: 'Xem Văn Bản',
        onConfirm: () => {
          setSelectedCompletionReport(saved);
          setIsCompletionDetailModalOpen(true);
        }
      });
    } catch (err) {
      console.error('Lỗi lưu biên bản hoàn thành:', err);
      showAlert({
        type: 'danger',
        title: 'Lỗi Lưu Biên Bản',
        message: 'Có lỗi xảy ra: ' + (err.message || err),
        confirmText: 'Đóng'
      });
    }
  };

  const handleSignCompletionReport = async (reportId, role) => {
    try {
      const rep = (completionReports || []).find(r => r.id === reportId) || selectedCompletionReport;
      if (!rep) return;

      const updatedSignatures = {
        ...(rep.signatures || {}),
        [role]: {
          ...(rep.signatures?.[role] || {}),
          signed: true,
          signedAt: new Date().toISOString(),
          signerName: currentUser?.fullName || rep.signatures?.[role]?.signerName || 'Cán bộ ký duyệt'
        }
      };

      const isSupervisorSigned = Boolean(role === 'supervisor' || rep.signatures?.supervisor?.signed);
      const isInvestorSigned = Boolean(role === 'investor' || rep.signatures?.investor?.signed);
      const isDesignerSigned = rep.completionType === 'PROJECT_USE' 
        ? Boolean(role === 'designer' || rep.signatures?.designer?.signed)
        : true;
      const isFullySigned = isSupervisorSigned && isInvestorSigned && isDesignerSigned;

      const updatedReport = {
        ...rep,
        signatures: updatedSignatures,
        status: isFullySigned ? 'COMPLETED' : 'IN_PROGRESS',
        updatedAt: new Date().toISOString()
      };

      await updateCompletionReport(reportId, updatedReport);

      const updatedList = (completionReports || []).map(r => r.id === reportId ? updatedReport : r);
      setCompletionReports(updatedList);
      safeSaveLocalStorage(COMPLETION_REPORTS_STORAGE_KEY, updatedList);
      setSelectedCompletionReport(updatedReport);

      const roleTitle = role === 'supervisor' ? 'Tư Vấn Giám Sát' : role === 'investor' ? 'Chủ Đầu Tư' : 'Tư Vấn Thiết Kế';
      const notif = {
        id: `notif_${Date.now()}`,
        title: `✍️ ${roleTitle} Đã Ký Biên Bản Hoàn Thành: ${rep.reportNumber || rep.objectName}`,
        body: `${currentUser?.fullName || roleTitle} đã hoàn tất ký số trên biên bản nghiệm thu hoàn thành. ${isFullySigned ? 'Biên bản đã có đầy đủ chữ ký các bên!' : 'Đang chờ bên còn lại ký duyệt.'}`,
        type: 'COMPLETION_REPORT_SIGNED',
        targetCompletionReportId: rep.id,
        targetRoles: ['CONTRACTOR', 'SUPERVISOR', 'LEAD_SUPERVISOR', 'INVESTOR', 'LEAD_INVESTOR', 'ADMIN'],
        createdAt: new Date().toISOString(),
        isRead: false
      };
      saveSystemNotification(notif).catch(console.warn);

      showAlert({
        type: 'success',
        title: 'Ký Phê Duyệt Thành Công!',
        message: `${roleTitle} đã ký số xác nhận vào Biên bản nghiệm thu hoàn thành số ${rep.reportNumber || ''}.\n${isFullySigned ? 'Tất cả các bên đã ký xong, biên bản chính thức có hiệu lực.' : 'Văn bản đang chờ bên còn lại hoàn tất chữ ký.'}`,
        confirmText: 'Đóng'
      });
    } catch (err) {
      console.error('Lỗi ký biên bản hoàn thành:', err);
      showAlert({
        type: 'danger',
        title: 'Lỗi Ký Phê Duyệt',
        message: 'Có lỗi xảy ra: ' + (err.message || err),
        confirmText: 'Đóng'
      });
    }
  };

  const handleDeleteCompletionReport = (reportId) => {
    showConfirm({
      type: 'danger',
      title: 'XÁC NHẬN XÓA BIÊN BẢN HOÀN THÀNH',
      message: 'Bạn có chắc chắn muốn xóa Biên bản nghiệm thu hoàn thành này? Dữ liệu đã xóa không thể phục hồi.',
      confirmText: 'Xóa Biên Bản',
      cancelText: 'Hủy Bỏ',
      onConfirm: async () => {
        try {
          await deleteCompletionReport(reportId);
          const updatedList = (completionReports || []).filter(r => r.id !== reportId);
          setCompletionReports(updatedList);
          safeSaveLocalStorage(COMPLETION_REPORTS_STORAGE_KEY, updatedList);
          if (selectedCompletionReport?.id === reportId) {
            setIsCompletionDetailModalOpen(false);
            setSelectedCompletionReport(null);
          }
          showAlert({
            type: 'success',
            title: 'Đã Xóa Thành Công',
            message: 'Biên bản nghiệm thu hoàn thành đã được xóa khỏi hệ thống.',
            confirmText: 'Đóng'
          });
        } catch (err) {
          showAlert({
            type: 'danger',
            title: 'Lỗi Xóa Biên Bản',
            message: 'Không thể xóa: ' + (err.message || err),
            confirmText: 'Đóng'
          });
        }
      }
    });
  };

  const handleOpenCompletionReport = (report) => {
    setSelectedCompletionReport(report);
    setIsCompletionDetailModalOpen(true);
  };

  // 1. Khi ĐVTC TẠO PHIẾU MỚI: Tự động khởi tạo cả Phiếu yêu cầu & Biên bản nghiệm thu
  const handleCreateRequest = async (newRequest) => {
    const isMaterial = newRequest.inspectionType === 'MATERIAL';
    const newReportId = `rep_${Date.now()}`;
    const projectCode = newRequest.projectCode || '2203';
    const reportDocCode = isMaterial ? 'MI' : 'WA';
    const reqDocCode = isMaterial ? 'MI' : 'IR';

    // Số tài liệu căn cứ / Mã hạng mục công trình của biên bản (WA hoặc MI):
    // [Mã công trình]/[WA hoặc MI]/[ddMMyy]-01.01 (Ví dụ: 2203/WA/231026-01.01 hoặc 2203/MI/231026-01.01)
    const docNum = generateDocumentCode(
      projectCode, 
      reportDocCode, 
      new Date(), 
      newRequest.revisionNumber || 1
    );

    // Số trong form: Số ở dưới nhấc lên, ví dụ: 2203/WA/261026-01.01 hoặc 2203/MI/261026-01.01
    const reportNum = docNum;

    const today = new Date();
    const cityDate = `Cần Thơ, ngày ${String(today.getDate()).padStart(2, '0')} tháng ${String(today.getMonth() + 1).padStart(2, '0')} năm ${today.getFullYear()}`;

    // Format ngày giờ bắt đầu và kết thúc tự động: "13h30, ngày 26 tháng 10 năm 2026"
    let autoStartText = '';
    let autoEndText = '';
    try {
      const sDate = newRequest.scheduledDate || (new Date()).toISOString().slice(0, 10);
      const sTimeMatch = (newRequest.startTime || newRequest.scheduledTime || '13:30').match(/(\d{1,2})[h:](\d{2})/);
      const parts = sDate.split('-');
      const year = parts[0] || '2026';
      const month = parseInt(parts[1] || '10', 10);
      const day = parseInt(parts[2] || '26', 10);
      const hour = sTimeMatch ? parseInt(sTimeMatch[1], 10) : 13;
      const min = sTimeMatch ? parseInt(sTimeMatch[2], 10) : 30;
      const totalMin = hour * 60 + min;
      const endTotal = totalMin + 30;
      const endH = Math.floor(endTotal / 60) % 24;
      const endM = endTotal % 60;
      const pad = (n) => String(n).padStart(2, '0');
      autoStartText = `${pad(hour)}h${pad(min)}, ngày ${day} tháng ${month} năm ${year}`;
      autoEndText = `${pad(endH)}h${pad(endM)}, ngày ${day} tháng ${month} năm ${year}`;
    } catch {
      autoStartText = '13h30, ngày 26 tháng 10 năm 2026';
      autoEndText = '14h00, ngày 26 tháng 10 năm 2026';
    }

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
      projectCode: projectCode,
      docTypeCode: reportDocCode,
      projectCategoryCode: docNum,
      referenceDocNumber: docNum,
      revisionNumber: newRequest.revisionNumber || 1,
      cityDate: cityDate,
      inspectionType: newRequest.inspectionType || 'WORK',
      reportTemplate: isMaterial ? 'FORM_12' : 'CONSTRUCTION_WORK',
      materialDetails: newRequest.materialDetails || null,
      materials: newRequest.materials || newRequest.materialDetails?.materials || null,
      projectInfo: {
        projectCode: projectCode,
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
        endTime: newRequest.endTime || autoEndText,
        startTimeText: autoStartText,
        endTimeText: autoEndText,
        place: newRequest.inspectionPlace || 'Dự án Đầu tư xây dựng nhà ở Phường Thường Thạnh - An Phú Eco City'
      },
      attendees: {
        investor: {
          company: cdtRecipient?.company || 'Công ty TNHH An Phú Cần Thơ',
          person: cdtRecipient?.fullName || '',
          position: cdtRecipient?.position || 'Cán bộ ban QLDA',
          email: cdtRecipient?.email || '',
          uid: cdtRecipient?.uid || '',
          signed: false
        },
        supervisor: {
          company: tvgsRecipient?.company || 'Công ty CP Tư vấn Xây dựng và Thương mại GELICON',
          person: tvgsRecipient?.fullName || '',
          position: tvgsRecipient?.position || 'Cán bộ tư vấn giám sát',
          email: tvgsRecipient?.email || '',
          uid: tvgsRecipient?.uid || '',
          signed: false
        },
        contractor: {
          company: newRequest.contractorCompany || currentUser?.company || 'Công ty CP Xây dựng An Phú Gia',
          person: newRequest.createdByName || currentUser?.fullName || 'Phạm Thanh Nhàn',
          position: newRequest.createdByRole || currentUser?.position || 'Chỉ huy trưởng',
          uid: newRequest.createdByUid || currentUser?.uid || '',
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
      assignedRecipients: finalRequest.assignedRecipients || [],
      createdByUid: finalRequest.createdByUid || currentUser?.uid,
      createdByName: finalRequest.createdByName || currentUser?.fullName,
      targetRoles: ['SUPERVISOR', 'LEAD_SUPERVISOR', 'LEAD_INVESTOR'], // TVGS và các Trưởng nhận thông báo
      createdAt: new Date().toISOString(),
      time: 'Vừa xong',
      isRead: false
    };

    if (checkNotificationRecipient(pushPayload, currentUser, [finalRequest, ...requests], [newReport, ...reports])) {
      setActivePushToast(pushPayload);
      showSystemNotification(pushPayload.title, pushPayload.body);
    }

    // Cập nhật ngay lập tức vào state nội bộ và cache an toàn (Optimistic UI Update + IndexedDB Backup)
    // Giúp danh sách cập nhật tức thì 100% không bao giờ bị trễ, mất hay tràn bộ nhớ
    setRequests(prev => {
      const updated = [finalRequest, ...prev.filter(r => r.id !== finalRequest.id && r.requestNumber !== finalRequest.requestNumber)];
      safeSaveLocalStorage(REQUESTS_STORAGE_KEY, updated);
      return updated;
    });

    setReports(prev => {
      const updated = [newReport, ...prev.filter(r => r.id !== newReport.id && r.reportNumber !== newReport.reportNumber)];
      safeSaveLocalStorage(REPORTS_STORAGE_KEY, updated);
      return updated;
    });

    setNotifications(prev => {
      const updated = [pushPayload, ...prev];
      safeSaveLocalStorage(NOTIF_STORAGE_KEY, updated);
      return updated;
    });

    if (showAlert) {
      showAlert({
        type: 'success',
        title: 'Phát Hành Thành Công! 📋',
        message: `Đã phát hành Phiếu yêu cầu ${finalRequest.requestNumber} & Biên bản nghiệm thu ${newReport.reportNumber} đến TVGS & CĐT.`
      });
    }

    try {
      await saveInspectionRequest(finalRequest);
      await saveInspectionReport(newReport);
      await saveSystemNotification(pushPayload);

      // Kích hoạt nổ thông báo màn hình khóa qua OneSignal: Gửi cho TVGS và các Trưởng
      sendOneSignalPush({
        title: '📋 Phiếu yêu cầu & Biên bản mới: ' + (finalRequest.requestNumber || 'Mới'),
        message: `ĐVTC ${finalRequest.contractorCompany} gửi TVGS kiểm tra: ${finalRequest.taskContent.slice(0, 50)}...`,
        targetRoles: ['SUPERVISOR', 'LEAD_SUPERVISOR', 'LEAD_INVESTOR'],
        url: 'https://app-apct-nghiemthu.web.app'
      }).catch(console.warn);
    } catch (e) {
      console.warn('Lưu Firestore lỗi:', e);
    }
  };

  // Khởi tạo biên bản nghiệm thu mới hoặc mở biên bản hiện có
  const handleOpenOrCreateReport = async (reportIdOrReqId, isCreateNew = false, defaultTab = 'INVITATION') => {
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
      // ĐỒNG BỘ CÁN BỘ ĐƯỢC CHỈ ĐỊNH TỪ PHIẾU YÊU CẦU:
      if (targetReq?.assignedRecipients && targetReq.assignedRecipients.length > 0) {
        const assignedSup = targetReq.assignedRecipients.find(r => r.role === 'SUPERVISOR' || r.role === 'LEAD_SUPERVISOR');
        const assignedInv = targetReq.assignedRecipients.find(r => r.role === 'INVESTOR' || r.role === 'LEAD_INVESTOR');
        const leadInv = users.find(u => u.role === 'LEAD_INVESTOR') || { fullName: 'Ngô Quý Linh', position: 'Trưởng Ban QLDA', company: 'Công ty TNHH An Phú Cần Thơ' };
        const leadSup = users.find(u => u.role === 'LEAD_SUPERVISOR') || { fullName: 'Đinh Xuân Thám', position: 'Tư vấn giám sát trưởng', company: 'Công ty CP TVXD và TM GELICON' };
        const leadContractor = users.find(u => u.role === 'CONTRACTOR' && (((u.position || '').toLowerCase().includes('chỉ huy')) || (u.fullName || '').includes('Chỉ Huy'))) 
          || { fullName: 'Trần Hữu Chỉ Huy', position: 'Chỉ huy trưởng', company: 'Công ty CP Xây dựng An Phú Gia' };

            const effectiveContCompany = rep.attendees?.contractor?.company || targetReq.contractorCompany || 'Công ty CP Xây dựng An Phú Gia';
            if (targetReq && rep.attendees?.contractor?.company && targetReq.contractorCompany !== rep.attendees.contractor.company) {
              targetReq.contractorCompany = rep.attendees.contractor.company;
              setRequests(prev => {
                const next = prev.map(r => r.id === targetReq.id ? { ...r, contractorCompany: rep.attendees.contractor.company } : r);
                safeSaveLocalStorage(REQUESTS_STORAGE_KEY, next);
                return next;
              });
              saveInspectionRequest({ ...targetReq, contractorCompany: rep.attendees.contractor.company }).catch(console.warn);
            }

            rep = {
              ...rep,
              assignedRecipients: targetReq.assignedRecipients,
              attendees: {
                ...rep.attendees,
                supervisor: {
                  ...rep.attendees?.supervisor,
                  uid: assignedSup?.uid || rep.attendees?.supervisor?.uid,
                  person: rep.attendees?.supervisor?.signed 
                    ? rep.attendees.supervisor.person 
                    : (assignedSup?.fullName || rep.attendees?.supervisor?.person || leadSup.fullName),
                  position: assignedSup?.position || rep.attendees?.supervisor?.position || leadSup.position,
                  company: assignedSup?.company || rep.attendees?.supervisor?.company || leadSup.company,
                  leadPerson: rep.attendees?.supervisor?.leadPerson || leadSup.fullName,
                  leadPosition: rep.attendees?.supervisor?.leadPosition || leadSup.position
                },
                investor: {
                  ...rep.attendees?.investor,
                  uid: assignedInv?.uid || rep.attendees?.investor?.uid,
                  person: rep.attendees?.investor?.signed 
                    ? rep.attendees.investor.person 
                    : (assignedInv?.fullName || rep.attendees?.investor?.person || leadInv.fullName),
                  position: assignedInv?.position || rep.attendees?.investor?.position || leadInv.position,
                  company: assignedInv?.company || rep.attendees?.investor?.company || leadInv.company,
                  leadPerson: rep.attendees?.investor?.leadPerson || leadInv.fullName,
                  leadPosition: rep.attendees?.investor?.leadPosition || leadInv.position
                },
                contractor: {
                  ...rep.attendees?.contractor,
                  person: targetReq.createdByName || rep.attendees?.contractor?.person || 'KS. Lê Văn Kỹ Thuật',
                  position: targetReq.createdByRole || rep.attendees?.contractor?.position || 'Kỹ thuật hiện trường',
                  company: effectiveContCompany,
                  leadPerson: rep.attendees?.contractor?.leadPerson || leadContractor.fullName,
                  leadPosition: rep.attendees?.contractor?.leadPosition || leadContractor.position
                }
              }
            };
      }

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
      setReportInitialTab(defaultTab);
      return;
    }

    // Chỉ khi thật sự chưa có report nào tồn tại thì mới khởi tạo
    if (!targetReq) {
      targetReq = requests.find(r => r.id === reportIdOrReqId || r.reportId === reportIdOrReqId);
    }
    if (!targetReq) return;

    const newReportId = `rep_${Date.now()}`;
    const isMaterial = targetReq.inspectionType === 'MATERIAL';
    const reportDocCode = isMaterial ? 'MI' : 'WA';
    const projectCode = targetReq.projectCode || (
      (targetReq.buildingName || '').includes('2204') || (targetReq.buildingName || '').includes('cao tầng') ? '2204' : '2203'
    );
    const reportNum = reportDocCode;
    const docNum = generateDocumentCode(projectCode, reportDocCode, targetReq.createdAt || new Date(), targetReq.revisionNumber || 1);
    const appliedStandards = (targetReq.standardsApplied && targetReq.standardsApplied.length > 0)
      ? targetReq.standardsApplied
      : getSuggestedStandards(targetReq.taskContent || targetReq.itemName, isMaterial ? 'MATERIAL' : 'WORK');

    const newReport = {
      id: newReportId,
      requestId: targetReq.id,
      requestNumber: targetReq.requestNumber,
      reportNumber: reportNum,
      projectCode: projectCode,
      docTypeCode: reportDocCode,
      projectCategoryCode: docNum,
      referenceDocNumber: docNum,
      revisionNumber: targetReq.revisionNumber || 1,
      cityDate: `Cần Thơ, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`,
      inspectionType: targetReq.inspectionType || 'WORK',
      reportTemplate: isMaterial ? 'FORM_12' : 'CONSTRUCTION_WORK',
      materialDetails: targetReq.materialDetails || null,
      materials: targetReq.materials || targetReq.materialDetails?.materials || null,
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
        endTime: targetReq.endTime || (() => {
          const start = targetReq.startTime || targetReq.scheduledTime;
          const match = start && start.match(/^(\d{1,2})[h:](\d{2})(.*)$/);
          if (match) {
            let h = parseInt(match[1], 10);
            let m = parseInt(match[2], 10) + 30;
            if (m >= 60) {
              h = (h + Math.floor(m / 60)) % 24;
              m = m % 60;
            }
            return `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}${match[3]}`;
          }
          return `16h00, ${targetReq.scheduledTime?.includes(' ') ? targetReq.scheduledTime.split(' ')[1] : 'hôm nay'}`;
        })(),
        place: targetReq.inspectionPlace || 'Dự án Đầu tư xây dựng nhà ở Phường Thường Thạnh - An Phú Eco City'
      },
      assignedRecipients: targetReq.assignedRecipients || [],
      attendees: (() => {
        const assignedSup = targetReq.assignedRecipients?.find(r => r.role === 'SUPERVISOR' || r.role === 'LEAD_SUPERVISOR');
        const assignedInv = targetReq.assignedRecipients?.find(r => r.role === 'INVESTOR' || r.role === 'LEAD_INVESTOR');
        const leadInv = users.find(u => u.role === 'LEAD_INVESTOR') || { fullName: 'Ngô Quý Linh', position: 'Trưởng Ban QLDA', company: 'Công ty TNHH An Phú Cần Thơ' };
        const leadSup = users.find(u => u.role === 'LEAD_SUPERVISOR') || { fullName: 'Đinh Xuân Thám', position: 'Tư vấn giám sát trưởng', company: 'Công ty CP TVXD và TM GELICON' };
        const leadContractor = users.find(u => u.role === 'CONTRACTOR' && (((u.position || '').toLowerCase().includes('chỉ huy')) || (u.fullName || '').includes('Chỉ Huy'))) 
          || { fullName: 'Trần Hữu Chỉ Huy', position: 'Chỉ huy trưởng', company: 'Công ty CP Xây dựng An Phú Gia' };

        return {
          investor: { 
            uid: assignedInv?.uid || leadInv.uid,
            company: assignedInv?.company || leadInv.company || 'Công ty TNHH An Phú Cần Thơ', 
            person: assignedInv?.fullName || leadInv.fullName, 
            position: assignedInv?.position || leadInv.position, 
            email: assignedInv?.email || leadInv.email,
            leadPerson: leadInv.fullName,
            leadPosition: leadInv.position,
            signed: false 
          },
          supervisor: { 
            uid: assignedSup?.uid || leadSup.uid,
            company: assignedSup?.company || leadSup.company || 'Công ty CP TVXD và TM GELICON', 
            person: assignedSup?.fullName || leadSup.fullName, 
            position: assignedSup?.position || leadSup.position, 
            email: assignedSup?.email || leadSup.email,
            leadPerson: leadSup.fullName,
            leadPosition: leadSup.position,
            signed: false 
          },
          contractor: { 
            uid: targetReq.createdByUid,
            company: targetReq.contractorCompany || 'Công ty CP Xây dựng An Phú Gia', 
            person: targetReq.createdByName || 'KS. Lê Văn Kỹ Thuật', 
            position: targetReq.createdByRole || 'Kỹ thuật hiện trường', 
            leadPerson: leadContractor.fullName,
            leadPosition: leadContractor.position,
            signed: true 
          }
        };
      })(),
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
      const matchFn = r => r.id === newReport.id || (newReport.requestId && r.requestId === newReport.requestId);
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
    setReportInitialTab(defaultTab);
  };

  // Mở modal điều chuyển cán bộ TVGS hoặc CĐT cho phiếu
  const handleOpenReassignModal = (request, reassignType) => {
    setReassignModalState({
      isOpen: true,
      request,
      reassignType
    });
  };

  // Xác nhận đổi người TVGS / CĐT khác và thực thi quy trình điều chuyển toàn diện:
  // 1. Cập nhật assignedRecipients trên phiếu
  // 2. Chuyển quyền xác nhận / ký số trên biên bản sang người mới
  // 3. Gửi thông báo đến người tạo, chủ đầu tư, tư vấn giám sát được đổi
  const handleConfirmReassign = async (requestId, reassignType, newOfficer, reasonNote) => {
    const targetReq = requests.find(r => r.id === requestId);
    if (!targetReq || !newOfficer) return;

    const isSupervisor = reassignType === 'SUPERVISOR';
    const roleLabel = isSupervisor ? 'Tư Vấn Giám Sát (TVGS)' : 'Ban Quản Lý Dự Án (Ban QLDA)';

    // Tìm cán bộ cũ đang phụ trách vai trò này
    const currentRecipients = Array.isArray(targetReq.assignedRecipients) ? [...targetReq.assignedRecipients] : [];
    const oldOfficer = currentRecipients.find(r => 
      isSupervisor 
        ? (r.role === 'SUPERVISOR' || r.role === 'LEAD_SUPERVISOR')
        : (r.role === 'INVESTOR' || r.role === 'LEAD_INVESTOR')
    );

    const newRecipientObj = {
      uid: newOfficer.uid,
      fullName: newOfficer.fullName,
      email: newOfficer.email || '',
      phone: newOfficer.phone || '',
      role: newOfficer.role,
      position: newOfficer.position || (isSupervisor ? 'Cán bộ TVGS' : 'Cán bộ ban QLDA'),
      company: newOfficer.company || (isSupervisor ? 'Công ty CP TVXD và TM GELICON' : 'Công ty TNHH An Phú Cần Thơ'),
      leaderId: newOfficer.leaderId || null
    };

    let updatedRecipients;
    if (oldOfficer) {
      updatedRecipients = currentRecipients.map(r => {
        if (isSupervisor && (r.role === 'SUPERVISOR' || r.role === 'LEAD_SUPERVISOR')) {
          return newRecipientObj;
        }
        if (!isSupervisor && (r.role === 'INVESTOR' || r.role === 'LEAD_INVESTOR')) {
          return newRecipientObj;
        }
        return r;
      });
    } else {
      updatedRecipients = [...currentRecipients, newRecipientObj];
    }

    const reassignRecord = {
      reassignedAt: new Date().toISOString(),
      reassignedByUid: currentUser?.uid,
      reassignedByName: currentUser?.fullName || 'Trưởng bộ phận',
      reassignedByRole: currentUser?.role,
      type: reassignType,
      oldOfficer: oldOfficer ? { uid: oldOfficer.uid, fullName: oldOfficer.fullName, role: oldOfficer.role } : null,
      newOfficer: { uid: newOfficer.uid, fullName: newOfficer.fullName, role: newOfficer.role },
      reason: reasonNote || ''
    };

    const updatedReq = {
      ...targetReq,
      assignedRecipients: updatedRecipients,
      reassignHistory: [...(targetReq.reassignHistory || []), reassignRecord],
      updatedAt: new Date().toISOString()
    };

    // 1. Cập nhật state requests, LocalStorage, IndexedDB & Firestore
    setRequests(prev => {
      const next = prev.map(r => r.id === updatedReq.id ? updatedReq : r);
      safeSaveLocalStorage(REQUESTS_STORAGE_KEY, next);
      try {
        if (typeof saveToIndexedDB === 'function') saveToIndexedDB('requests', next);
      } catch (err) {
        console.warn('Lỗi saveToIndexedDB requests:', err);
      }
      return next;
    });

    if (selectedRequest && selectedRequest.id === updatedReq.id) {
      setSelectedRequest(updatedReq);
    }

    try {
      await saveInspectionRequest(updatedReq);
    } catch (e) {
      console.warn('Lỗi saveInspectionRequest:', e);
    }

    // 2. Cập nhật Biên bản nghiệm thu tương ứng (nếu đã tạo)
    const targetReport = reports.find(r => 
      (updatedReq.reportId && r.id === updatedReq.reportId) ||
      (r.requestId && r.requestId === updatedReq.id) ||
      (r.reportNumber && updatedReq.requestNumber && (
        r.reportNumber.replace('BBNT-APG', 'PYC').replace('BBNT-VL', 'PYC') === updatedReq.requestNumber ||
        r.reportNumber.replace('BBNT', 'PYC') === updatedReq.requestNumber
      ))
    );

    let updatedReport = null;
    if (targetReport) {
      const updatedAttendees = { ...(targetReport.attendees || {}) };

      if (isSupervisor) {
        updatedAttendees.supervisor = {
          ...(updatedAttendees.supervisor || {}),
          uid: newOfficer.uid,
          company: newOfficer.company || updatedAttendees.supervisor?.company || 'Công ty CP TVXD và TM GELICON',
          person: newOfficer.fullName,
          position: newOfficer.position || 'Cán bộ TVGS',
          email: newOfficer.email || '',
          signed: false, // Reset quyền ký số sang cho cán bộ mới
          signature: null,
          signDate: null
        };
      } else {
        updatedAttendees.investor = {
          ...(updatedAttendees.investor || {}),
          uid: newOfficer.uid,
          company: newOfficer.company || updatedAttendees.investor?.company || 'Công ty TNHH An Phú Cần Thơ',
          person: newOfficer.fullName,
          position: newOfficer.position || 'Cán bộ ban QLDA',
          email: newOfficer.email || '',
          signed: false, // Reset quyền ký số sang cho cán bộ mới
          signature: null,
          signDate: null
        };
      }

      let repStatus = targetReport.status;
      if (repStatus === 'COMPLETED') {
        repStatus = isSupervisor ? 'PENDING_APPROVAL' : 'WAITING_INVESTOR';
      }

      updatedReport = {
        ...targetReport,
        assignedRecipients: updatedRecipients,
        attendees: updatedAttendees,
        status: repStatus,
        updatedAt: new Date().toISOString()
      };

      setReports(prev => {
        const matchFn = r => r.id === updatedReport.id || (updatedReport.requestId && r.requestId === updatedReport.requestId);
        const filtered = prev.filter(r => !matchFn(r));
        const next = [updatedReport, ...filtered];
        safeSaveLocalStorage(REPORTS_STORAGE_KEY, next);
        try {
          if (typeof saveToIndexedDB === 'function') saveToIndexedDB('reports', next);
        } catch (err) {
          console.warn('Lỗi saveToIndexedDB reports:', err);
        }
        return next;
      });

      if (selectedReport && (selectedReport.id === updatedReport.id || selectedReport.requestId === updatedReq.id)) {
        setSelectedReport(updatedReport);
      }

      try {
        await saveInspectionReport(updatedReport);
      } catch (e) {
        console.warn('Lỗi saveInspectionReport:', e);
      }
    }

    // 3. Gửi thông báo đến: người tạo, chủ đầu tư, tư vấn giám sát được đổi
    const notifTitle = `🔄 Điều chuyển cán bộ ${isSupervisor ? 'TVGS' : 'CĐT'}: ${targetReq.taskContent || targetReq.requestNumber}`;
    const isContractorUser = currentUser?.role === 'CONTRACTOR';
    const actorLabel = isContractorUser 
      ? `ĐVTC (${currentUser?.fullName || 'Đơn vị thi công'})` 
      : (currentUser?.fullName || 'Trưởng bộ phận');
    const notifBody = `${actorLabel} đã đổi cán bộ ${roleLabel} từ "${oldName}" sang "${newOfficer.fullName}". ${reasonNote ? `Lý do: "${reasonNote}"` : ''}`;

    const notifPayload = {
      id: `notif_${Date.now()}`,
      type: 'REASSIGN',
      title: notifTitle,
      body: notifBody,
      actionText: 'Xem chi tiết phiếu yêu cầu',
      targetRequestId: targetReq.id,
      targetReportId: updatedReport?.id || targetReq.reportId,
      assignedRecipients: updatedRecipients,
      createdByUid: targetReq.createdByUid,
      createdByName: targetReq.createdByName,
      extraRecipientUids: [
        targetReq.createdByUid,
        newOfficer.uid,
        oldOfficer?.uid,
        currentUser?.uid
      ].filter(Boolean),
      targetRoles: ['CONTRACTOR', 'SUPERVISOR', 'LEAD_SUPERVISOR', 'INVESTOR', 'LEAD_INVESTOR'],
      createdAt: new Date().toISOString(),
      time: 'Vừa xong',
      isRead: false
    };

    setNotifications(prev => {
      const nextNotifs = [notifPayload, ...prev.filter(n => n.id !== notifPayload.id)];
      safeSaveLocalStorage(NOTIF_STORAGE_KEY, nextNotifs);
      return nextNotifs;
    });

    if (checkNotificationRecipient(notifPayload, currentUser, [updatedReq, ...requests], [updatedReport, ...reports].filter(Boolean))) {
      setActivePushToast(notifPayload);
      showSystemNotification(notifTitle, notifBody);
    }

    try {
      await saveSystemNotification(notifPayload);
    } catch (e) {
      console.warn('Lỗi lưu notification điều chuyển:', e);
    }

    sendOneSignalPush({
      title: notifTitle,
      message: notifBody,
      targetRoles: ['CONTRACTOR', 'SUPERVISOR', 'LEAD_SUPERVISOR', 'INVESTOR', 'LEAD_INVESTOR'],
      url: 'https://app-apct-nghiemthu.web.app'
    }).catch(console.warn);

    showAlert({
      type: 'success',
      title: 'Điều Chuyển Cán Bộ Thành Công',
      message: `Đã chuyển quyền kiểm tra, nghiệm thu và ký số sang cán bộ ${newOfficer.fullName} (${roleLabel}). Thông báo đã được gửi đến các bên liên quan.`
    });
  };

  // Cập nhật thời gian nghiệm thu khi TVGS / Ban QLDA chưa xác nhận nghiệm thu
  const handleUpdateRequestTime = async (requestId, timeData) => {
    const targetReq = requests.find(r => r.id === requestId);
    if (!targetReq) return;

    const { scheduledDate, startTime, scheduledTime } = timeData;
    const oldTime = targetReq.scheduledTime || `${targetReq.startTime} ${targetReq.scheduledDate}`;
    const newScheduledTime = scheduledTime || `${startTime} ${scheduledDate}`;

    const updatedReq = {
      ...targetReq,
      scheduledDate: scheduledDate || targetReq.scheduledDate,
      startTime: startTime || targetReq.startTime,
      scheduledTime: newScheduledTime,
      updatedAt: new Date().toISOString()
    };

    // 1. Cập nhật state requests & cache (LocalStorage + IndexedDB)
    setRequests(prev => {
      const next = prev.map(r => r.id === updatedReq.id ? updatedReq : r);
      safeSaveLocalStorage(REQUESTS_STORAGE_KEY, next);
      try {
        if (typeof saveToIndexedDB === 'function') saveToIndexedDB('requests', next);
      } catch (err) {
        console.warn('Lỗi saveToIndexedDB requests:', err);
      }
      return next;
    });

    if (selectedRequest && selectedRequest.id === updatedReq.id) {
      setSelectedRequest(updatedReq);
    }

    try {
      await saveInspectionRequest(updatedReq);
    } catch (e) {
      console.warn('Lỗi saveInspectionRequest:', e);
    }

    // 2. Cập nhật biên bản tương ứng (nếu có)
    const targetReport = reports.find(r => 
      (updatedReq.reportId && r.id === updatedReq.reportId) ||
      (r.requestId && r.requestId === updatedReq.id) ||
      (r.reportNumber && updatedReq.requestNumber && (
        r.reportNumber.replace('BBNT-APG', 'PYC').replace('BBNT-VL', 'PYC') === updatedReq.requestNumber ||
        r.reportNumber.replace('BBNT', 'PYC') === updatedReq.requestNumber
      ))
    );

    let updatedReport = null;
    if (targetReport) {
      updatedReport = {
        ...targetReport,
        time: {
          ...(targetReport.time || {}),
          startTime: startTime ? `${startTime}, ${scheduledDate || targetReq.scheduledDate}` : newScheduledTime,
          endTime: targetReport.time?.endTime || `16h30, ${scheduledDate || 'hôm nay'}`
        },
        updatedAt: new Date().toISOString()
      };

      setReports(prev => {
        const matchFn = r => r.id === updatedReport.id || (updatedReport.requestId && r.requestId === updatedReport.requestId);
        const filtered = prev.filter(r => !matchFn(r));
        const next = [updatedReport, ...filtered];
        safeSaveLocalStorage(REPORTS_STORAGE_KEY, next);
        try {
          if (typeof saveToIndexedDB === 'function') saveToIndexedDB('reports', next);
        } catch (err) {
          console.warn('Lỗi saveToIndexedDB reports:', err);
        }
        return next;
      });

      if (selectedReport && (selectedReport.id === updatedReport.id || selectedReport.requestId === updatedReq.id)) {
        setSelectedReport(updatedReport);
      }

      try {
        await saveInspectionReport(updatedReport);
      } catch (e) {
        console.warn('Lỗi saveInspectionReport:', e);
      }
    }

    // 3. Gửi thông báo đến những người liên quan (TVGS, Ban QLDA, các Trưởng, ĐVTC)
    const notifTitle = `⏰ Cập nhật thời gian nghiệm thu: ${targetReq.taskContent || targetReq.requestNumber}`;
    const notifBody = `ĐVTC (${currentUser?.fullName || 'Đơn vị thi công'}) đã đổi thời gian nghiệm thu từ "${oldTime}" sang "${newScheduledTime}". Phiếu: ${targetReq.requestNumber}.`;

    const recipientUids = (targetReq.assignedRecipients || []).map(r => r.uid).filter(Boolean);
    const extraUids = Array.from(new Set([
      targetReq.createdByUid,
      currentUser?.uid,
      ...recipientUids
    ])).filter(Boolean);

    const notifPayload = {
      id: `notif_${Date.now()}`,
      type: 'TIME_UPDATED',
      title: notifTitle,
      body: notifBody,
      actionText: 'Xem chi tiết phiếu yêu cầu',
      targetRequestId: targetReq.id,
      targetReportId: updatedReport?.id || targetReq.reportId,
      assignedRecipients: targetReq.assignedRecipients || [],
      createdByUid: targetReq.createdByUid,
      createdByName: targetReq.createdByName,
      extraRecipientUids: extraUids,
      targetRoles: ['CONTRACTOR', 'SUPERVISOR', 'LEAD_SUPERVISOR', 'INVESTOR', 'LEAD_INVESTOR'],
      createdAt: new Date().toISOString(),
      time: 'Vừa xong',
      isRead: false
    };

    setNotifications(prev => {
      const nextNotifs = [notifPayload, ...prev.filter(n => n.id !== notifPayload.id)];
      safeSaveLocalStorage(NOTIF_STORAGE_KEY, nextNotifs);
      return nextNotifs;
    });

    if (checkNotificationRecipient(notifPayload, currentUser, [updatedReq, ...requests], [updatedReport, ...reports].filter(Boolean))) {
      setActivePushToast(notifPayload);
      showSystemNotification(notifTitle, notifBody);
    }

    try {
      await saveSystemNotification(notifPayload);
    } catch (e) {
      console.warn('Lỗi lưu notification đổi thời gian:', e);
    }

    sendOneSignalPush({
      title: notifTitle,
      message: notifBody,
      targetRoles: ['CONTRACTOR', 'SUPERVISOR', 'LEAD_SUPERVISOR', 'INVESTOR', 'LEAD_INVESTOR'],
      url: 'https://app-apct-nghiemthu.web.app'
    }).catch(console.warn);

    showAlert({
      type: 'success',
      title: 'Đã Cập Nhật Thời Gian Nghiệm Thu',
      message: `Thời gian nghiệm thu mới: ${newScheduledTime}. Thông báo đã được gửi đến Tư vấn giám sát và Ban QLDA.`
    });
  };

  // Hủy phiếu yêu cầu nghiệm thu khi TVGS / Ban QLDA chưa xác nhận nghiệm thu
  const handleCancelRequest = async (requestId, cancellationReason) => {
    const targetReq = requests.find(r => r.id === requestId);
    if (!targetReq) return;

    const reason = (cancellationReason || '').trim() || 'Đơn vị thi công hủy phiếu.';
    const cancelledAt = new Date().toISOString();
    const cancelledByName = currentUser?.fullName || 'Đơn vị thi công';
    const cancelledByUid = currentUser?.uid || '';

    const updatedReq = {
      ...targetReq,
      status: 'CANCELLED',
      cancellationReason: reason,
      cancelledAt: cancelledAt,
      cancelledByName: cancelledByName,
      cancelledByUid: cancelledByUid,
      updatedAt: cancelledAt
    };

    // 1. Cập nhật state requests & cache
    setRequests(prev => {
      const next = prev.map(r => r.id === updatedReq.id ? updatedReq : r);
      safeSaveLocalStorage(REQUESTS_STORAGE_KEY, next);
      try {
        if (typeof saveToIndexedDB === 'function') saveToIndexedDB('requests', next);
      } catch (err) {
        console.warn('Lỗi saveToIndexedDB requests:', err);
      }
      return next;
    });

    if (selectedRequest && selectedRequest.id === updatedReq.id) {
      setSelectedRequest(updatedReq);
    }

    try {
      await saveInspectionRequest(updatedReq);
    } catch (e) {
      console.warn('Lỗi saveInspectionRequest:', e);
    }

    // 2. Cập nhật biên bản tương ứng (nếu có)
    const targetReport = reports.find(r => 
      (updatedReq.reportId && r.id === updatedReq.reportId) ||
      (r.requestId && r.requestId === updatedReq.id) ||
      (r.reportNumber && updatedReq.requestNumber && (
        r.reportNumber.replace('BBNT-APG', 'PYC').replace('BBNT-VL', 'PYC') === updatedReq.requestNumber ||
        r.reportNumber.replace('BBNT', 'PYC') === updatedReq.requestNumber
      ))
    );

    let updatedReport = null;
    if (targetReport) {
      updatedReport = {
        ...targetReport,
        status: 'CANCELLED',
        cancellationReason: reason,
        cancelledAt: cancelledAt,
        cancelledByName: cancelledByName,
        updatedAt: cancelledAt
      };

      setReports(prev => {
        const matchFn = r => r.id === updatedReport.id || (updatedReport.requestId && r.requestId === updatedReport.requestId);
        const filtered = prev.filter(r => !matchFn(r));
        const next = [updatedReport, ...filtered];
        safeSaveLocalStorage(REPORTS_STORAGE_KEY, next);
        try {
          if (typeof saveToIndexedDB === 'function') saveToIndexedDB('reports', next);
        } catch (err) {
          console.warn('Lỗi saveToIndexedDB reports:', err);
        }
        return next;
      });

      if (selectedReport && (selectedReport.id === updatedReport.id || selectedReport.requestId === updatedReq.id)) {
        setSelectedReport(updatedReport);
      }

      try {
        await saveInspectionReport(updatedReport);
      } catch (e) {
        console.warn('Lỗi saveInspectionReport:', e);
      }
    }

    // 3. Gửi thông báo đến những người liên quan (TVGS, Ban QLDA, các Trưởng, ĐVTC)
    const notifTitle = `🚫 Hủy phiếu yêu cầu nghiệm thu: ${targetReq.taskContent || targetReq.requestNumber}`;
    const notifBody = `ĐVTC (${cancelledByName}) đã hủy phiếu yêu cầu nghiệm thu ${targetReq.requestNumber}. Lý do: "${reason}".`;

    const recipientUids = (targetReq.assignedRecipients || []).map(r => r.uid).filter(Boolean);
    const extraUids = Array.from(new Set([
      targetReq.createdByUid,
      currentUser?.uid,
      ...recipientUids
    ])).filter(Boolean);

    const notifPayload = {
      id: `notif_${Date.now()}`,
      type: 'REQUEST_CANCELLED',
      title: notifTitle,
      body: notifBody,
      actionText: 'Xem phiếu đã hủy',
      targetRequestId: targetReq.id,
      targetReportId: updatedReport?.id || targetReq.reportId,
      assignedRecipients: targetReq.assignedRecipients || [],
      createdByUid: targetReq.createdByUid,
      createdByName: targetReq.createdByName,
      extraRecipientUids: extraUids,
      targetRoles: ['CONTRACTOR', 'SUPERVISOR', 'LEAD_SUPERVISOR', 'INVESTOR', 'LEAD_INVESTOR'],
      createdAt: cancelledAt,
      time: 'Vừa xong',
      isRead: false
    };

    setNotifications(prev => {
      const nextNotifs = [notifPayload, ...prev.filter(n => n.id !== notifPayload.id)];
      safeSaveLocalStorage(NOTIF_STORAGE_KEY, nextNotifs);
      return nextNotifs;
    });

    if (checkNotificationRecipient(notifPayload, currentUser, [updatedReq, ...requests], [updatedReport, ...reports].filter(Boolean))) {
      setActivePushToast(notifPayload);
      showSystemNotification(notifTitle, notifBody);
    }

    try {
      await saveSystemNotification(notifPayload);
    } catch (e) {
      console.warn('Lỗi lưu notification hủy phiếu:', e);
    }

    sendOneSignalPush({
      title: notifTitle,
      message: notifBody,
      targetRoles: ['CONTRACTOR', 'SUPERVISOR', 'LEAD_SUPERVISOR', 'INVESTOR', 'LEAD_INVESTOR'],
      url: 'https://app-apct-nghiemthu.web.app'
    }).catch(console.warn);

    showAlert({
      type: 'info',
      title: 'Đã Hủy Phiếu Yêu Cầu Nghiệm Thu',
      message: `Phiếu yêu cầu và biên bản liên quan đã chuyển sang trạng thái ĐÃ HỦY. Thông báo đã được gửi đến các bên liên quan.`
    });
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
        (updatedReport.requestId && r.requestId === updatedReport.requestId)
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
      assignedRecipients: updatedReq?.assignedRecipients || targetReport.assignedRecipients || [],
      createdByUid: updatedReq?.createdByUid || targetReport.createdByUid,
      createdByName: updatedReq?.createdByName || targetReport.createdByName,
      rejectedByRole: isInvestorReject ? 'INVESTOR' : 'SUPERVISOR',
      targetRoles: isInvestorReject
        ? ['CONTRACTOR', 'SUPERVISOR', 'LEAD_SUPERVISOR', 'LEAD_INVESTOR']
        : ['CONTRACTOR', 'LEAD_SUPERVISOR', 'LEAD_INVESTOR'],
      createdAt: new Date().toISOString(),
      time: 'Vừa xong',
      isRead: false
    };

    if (checkNotificationRecipient(pushPayload, currentUser, requests, [updatedReport, ...reports])) {
      setActivePushToast(pushPayload);
      showSystemNotification(notifTitle, notifBody);
    }

    try {
      // BẮT BUỘC AWAIT ĐỂ LƯU CHẮC CHẮN LÊN CLOUD FIRESTORE TRƯỚC KHI ĐỔI TÀI KHOẢN
      await saveInspectionReport(updatedReport);
      if (updatedReq) {
        await saveInspectionRequest(updatedReq);
      }
      await saveSystemNotification(pushPayload);

      // Kích hoạt nổ thông báo màn hình khóa: CĐT hủy -> báo TVGS + ĐVTC + Trưởng; TVGS hủy -> báo ĐVTC + Trưởng
      sendOneSignalPush({
        title: notifTitle,
        message: notifBody,
        targetRoles: isInvestorReject
          ? ['CONTRACTOR', 'SUPERVISOR', 'LEAD_SUPERVISOR', 'LEAD_INVESTOR']
          : ['CONTRACTOR', 'LEAD_SUPERVISOR', 'LEAD_INVESTOR'],
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
      const matchFn = r => r.id === targetReport.id || (updatedReport.requestId && r.requestId === updatedReport.requestId);
      const filtered = prev.filter(r => !matchFn(r));
      const nextReports = [updatedReport, ...filtered];
      safeSaveLocalStorage(REPORTS_STORAGE_KEY, nextReports);
      try {
        if (typeof saveToIndexedDB === 'function') saveToIndexedDB('reports', nextReports);
      } catch (err) {
        console.warn('Lỗi saveToIndexedDB reports:', err);
      }
      return nextReports;
    });

    setSelectedReport(updatedReport);
    setInitialOpenRectify(false);

    if (updatedReq) {
      setRequests(prev => {
        const nextRequests = prev.map(r => r.id === updatedReq.id ? updatedReq : r);
        safeSaveLocalStorage(REQUESTS_STORAGE_KEY, nextRequests);
        try {
          if (typeof saveToIndexedDB === 'function') saveToIndexedDB('requests', nextRequests);
        } catch (err) {
          console.warn('Lỗi saveToIndexedDB requests:', err);
        }
        return nextRequests;
      });
    }

    // Nếu TVGS vừa duyệt đạt sau sửa chữa -> Bắn thông báo mời CĐT
    if (!isFullyCompleted && isSupervisorSigned) {
      const notifTitle = `✍️ [TVGS Đã Phê Duyệt] Mời CĐT duyệt: ${targetReport.reportNumber || ''}`;
      const notifBody = `Tư Vấn Giám Sát đã kiểm tra lại kết quả sửa chữa và nghiệm thu đạt. Kính mời Chủ Đầu Tư kiểm tra hồ sơ, ảnh và ký phê duyệt!`;

      const pushPayload = {
        id: `notif_${Date.now()}`,
        type: 'APPROVAL',
        title: notifTitle,
        body: notifBody,
        actionText: 'Mở biên bản để ký duyệt',
        targetReportId: targetReport.id,
        targetRequestId: updatedReq?.id || targetReport.requestId,
        assignedRecipients: updatedReq?.assignedRecipients || targetReport.assignedRecipients || [],
        createdByUid: updatedReq?.createdByUid || targetReport.createdByUid,
        createdByName: updatedReq?.createdByName || targetReport.createdByName,
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
      if (checkNotificationRecipient(pushPayload, currentUser, requests, [updatedReport, ...reports])) {
        setActivePushToast(pushPayload);
        showSystemNotification(notifTitle, notifBody);
      }

      try {
        await saveInspectionReport(updatedReport);
        if (updatedReq) await saveInspectionRequest(updatedReq);
        await saveSystemNotification(pushPayload);
        sendOneSignalPush({
          title: notifTitle,
          message: notifBody,
          targetRoles: ['INVESTOR', 'LEAD_INVESTOR', 'CONTRACTOR', 'LEAD_SUPERVISOR'],
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
        assignedRecipients: updatedReq?.assignedRecipients || targetReport.assignedRecipients || [],
        createdByUid: updatedReq?.createdByUid || targetReport.createdByUid,
        createdByName: updatedReq?.createdByName || targetReport.createdByName,
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
      if (checkNotificationRecipient(pushPayload, currentUser, requests, [updatedReport, ...reports])) {
        setActivePushToast(pushPayload);
        showSystemNotification(notifTitle, notifBody);
      }

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
    } else if (updatedReport.status === 'WAITING_INVESTOR' || isSupervisorSigned) {
      finalStatus = 'WAITING_INVESTOR';
    } else if (updatedReport.status === 'REJECTED' || updatedReport.status === 'RECTIFIED') {
      finalStatus = updatedReport.status;
    }

    const finalReport = {
      ...updatedReport,
      status: finalStatus,
      updatedAt: new Date().toISOString()
    };

    setReports(prev => {
      const matchFn = r => r.id === finalReport.id || (finalReport.requestId && r.requestId === finalReport.requestId);
      const filtered = prev.filter(r => !matchFn(r));
      const nextReports = [finalReport, ...filtered];
      safeSaveLocalStorage(REPORTS_STORAGE_KEY, nextReports);
      return nextReports;
    });

    if (selectedReport && selectedReport.id === finalReport.id) {
      setSelectedReport(finalReport);
    }

    let updatedReq = null;
    const newContCompany = finalReport.attendees?.contractor?.company || finalReport.contractorCompany;
    const targetReq = requests.find(r => 
      (finalReport.requestId && r.id === finalReport.requestId) ||
      (r.reportId && r.reportId === finalReport.id)
    );
    if (targetReq) {
      updatedReq = {
        ...targetReq,
        status: finalReport.status,
        contractorCompany: newContCompany || targetReq.contractorCompany,
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
        const notifTitle = `✍️ [TVGS Đã Phê Duyệt] Mời Ban QLDA ký duyệt: ${finalReport.reportNumber || 'Biên bản'}`;
        const notifBody = `Tư vấn giám sát (${finalReport.attendees?.supervisor?.person || 'TVGS'}) đã nghiệm thu đạt và ký duyệt. Kính mời Ban Quản Lý Dự Án vào kiểm tra & ký xác nhận!`;

        const pushPayload = {
          id: `notif_${Date.now()}`,
          type: 'APPROVAL',
          title: notifTitle,
          body: notifBody,
          actionText: 'Mở biên bản để ký duyệt',
          targetReportId: finalReport.id,
          targetRequestId: finalReport.requestId,
          assignedRecipients: updatedReq?.assignedRecipients || finalReport.assignedRecipients || [],
          createdByUid: updatedReq?.createdByUid || finalReport.createdByUid,
          createdByName: updatedReq?.createdByName || finalReport.createdByName,
          targetRoles: ['INVESTOR', 'LEAD_INVESTOR', 'CONTRACTOR', 'LEAD_SUPERVISOR'],
          createdAt: new Date().toISOString(),
          time: 'Vừa xong',
          isRead: false
        };

        if (checkNotificationRecipient(pushPayload, currentUser, requests, [finalReport, ...reports])) {
          setActivePushToast(pushPayload);
          showSystemNotification(notifTitle, notifBody);
        }
        await saveSystemNotification(pushPayload);

        sendOneSignalPush({
          title: notifTitle,
          message: notifBody,
          targetRoles: ['INVESTOR', 'LEAD_INVESTOR', 'CONTRACTOR', 'LEAD_SUPERVISOR'],
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
          assignedRecipients: updatedReq?.assignedRecipients || finalReport.assignedRecipients || [],
          createdByUid: updatedReq?.createdByUid || finalReport.createdByUid,
          createdByName: updatedReq?.createdByName || finalReport.createdByName,
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
        if (checkNotificationRecipient(pushPayload, currentUser, requests, [finalReport, ...reports])) {
          setActivePushToast(pushPayload);
          showSystemNotification(notifTitle, notifBody);
        }
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

    // Tăng số lần sửa chữa lên 1: 01.01 -> 02.01, 03.01...
    // Chỉ tăng khi ĐVTC gửi lại; nếu fullReport đã mang revisionNumber chuẩn từ InspectionReportModal thì dùng luôn
    const nextRevision = fullReport?.revisionNumber 
      ? Number(fullReport.revisionNumber)
      : (targetReport.rectificationHistory?.length || 0) + 2;

    const projectCode = targetReport.projectCode || '2203';
    const reportDocCode = (targetReport.reportTemplate === 'FORM_12' || targetReport.inspectionType === 'MATERIAL') ? 'MI' : 'WA';
    const repCreatedAt = targetReport.createdAt || new Date();

    const newReportDocNum = generateDocumentCode(projectCode, reportDocCode, repCreatedAt, nextRevision);
    const newReqDocNum = generateDocumentCode(projectCode, 'IR', repCreatedAt, nextRevision);

    const [ry, rm, rd] = (safeRectificationData.suggestedDate || '').split('-');
    const formattedDate = (rd && rm && ry) ? `${rd}/${rm}/${ry}` : '';
    const newScheduledTime = formattedDate
      ? `${safeRectificationData.suggestedHour || '16:30'} ${formattedDate}`
      : (safeRectificationData.scheduledTime || safeRectificationData.suggestedTime || targetReport.time?.scheduledTime || '16:30 hôm nay');

    const updatedReport = {
      ...targetReport,
      id: targetReport.id || reportId || `rep_${Date.now()}`,
      revisionNumber: nextRevision,
      referenceDocNumber: newReportDocNum,
      projectCategoryCode: newReportDocNum,
      rectification: safeRectificationData,
      status: 'RECTIFIED',
      time: {
        ...(targetReport.time || {}),
        startTime: safeRectificationData.suggestedTime || targetReport.time?.startTime,
        scheduledTime: newScheduledTime,
        startTimeText: `${(safeRectificationData.suggestedHour || '16:30').replace(':', 'h')}, ngày ${formattedDate || 'hôm nay'}`
      },
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
        revisionNumber: nextRevision,
        referenceDocNumber: newReqDocNum,
        projectCategoryCode: newReqDocNum,
        status: 'RECTIFIED',
        hasReport: true,
        reportId: updatedReport.id,
        rectificationNotes: safeRectificationData.description,
        rectificationPhotos: safePhotos,
        // CẬP NHẬT THỜI GIAN MỜI NGHIỆM THU LẠI VÀO PHIẾU YÊU CẦU / MỜI NGHIỆM THU:
        scheduledTime: newScheduledTime,
        scheduledDate: safeRectificationData.suggestedDate || targetReq.scheduledDate,
        startTime: safeRectificationData.suggestedHour || targetReq.startTime,
        formattedStartTime: `${(safeRectificationData.suggestedHour || '16:30').replace(':', 'h')}, ngày ${formattedDate || targetReq.scheduledDate}`,
        updatedAt: new Date().toISOString()
      };
    }

    // 1. Cập nhật mảng reports vào React State, IndexedDB & LocalStorage tức thì
    setReports(prev => {
      const matchFn = r => (
        r.id === updatedReport.id || 
        (updatedReport.requestId && r.requestId === updatedReport.requestId) ||
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
          (r.reportId && (r.reportId === updatedReport.id || r.reportId === reportId))
        );
        const filtered = prev.filter(r => !matchReqFn(r));
        const nextRequests = [updatedReq, ...filtered];
        safeSaveLocalStorage(REQUESTS_STORAGE_KEY, nextRequests);
        return nextRequests;
      });

      if (selectedRequest && (selectedRequest.id === updatedReq.id || selectedRequest.reportId === updatedReport.id)) {
        setSelectedRequest(updatedReq);
      }
    }

    // 4. Bắn thông báo Toast & Notification Bell cho ĐÚNG người nhận theo Sơ đồ hoạt động
    const targetName = targetReviewer === 'INVESTOR' ? 'Chủ Đầu Tư' : 'Tư Vấn Giám Sát';
    const notifTitle = `🔄 [Đã sửa lỗi] Biên bản ${targetReport.reportNumber || ''}`;
    const newTimeForNotif = safeRectificationData.suggestedTime || updatedReq?.scheduledTime || '16h30';
    const notifBody = `${rectificationData.submittedBy?.name || 'ĐVTC'} đã sửa xong lỗi và gửi ${safePhotos.length} ảnh hiện trường. Lịch hẹn nghiệm thu lại: ${newTimeForNotif}. Mời ${targetName} kiểm tra lại kết quả!`;

    const pushPayload = {
      id: `notif_${Date.now()}`,
      type: 'INVITATION',
      title: notifTitle,
      body: notifBody,
      actionText: 'Xem ảnh sửa & Kiểm tra lại',
      targetReportId: targetReport.id,
      targetRequestId: updatedReq?.id || targetReport.requestId,
      assignedRecipients: updatedReq?.assignedRecipients || targetReport.assignedRecipients || [],
      createdByUid: updatedReq?.createdByUid || targetReport.createdByUid,
      createdByName: updatedReq?.createdByName || targetReport.createdByName,
      targetRoles: [targetReviewer, 'LEAD_SUPERVISOR', 'LEAD_INVESTOR'],
      createdAt: new Date().toISOString(),
      time: 'Vừa xong',
      isRead: false
    };

    if (checkNotificationRecipient(pushPayload, currentUser, requests, [updatedReport, ...reports])) {
      setActivePushToast(pushPayload);
      showSystemNotification(notifTitle, notifBody);
    }

    try {
      await saveInspectionReport(updatedReport);
      if (updatedReq) {
        await saveInspectionRequest(updatedReq);
      }
      await saveSystemNotification(pushPayload);

      // Kích hoạt nổ thông báo màn hình khóa cho đúng vai trò và các Trưởng
      sendOneSignalPush({
        title: notifTitle,
        message: notifBody,
        targetRoles: [targetReviewer, 'LEAD_SUPERVISOR', 'LEAD_INVESTOR'],
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
      (report.requestId && r.requestId === report.requestId)
    ) || report;

    // Tìm request liên quan để đồng bộ
    let targetReq = requests.find(r => 
      r.id === rep.requestId || 
      r.reportId === rep.id || 
      r.id === report.requestId || 
      r.reportId === report.id
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

        const effectiveRev = getDocumentRevisionNumber(rep, targetReq);
        const projectCode = rep.projectCode || targetReq?.projectCode || '2203';
        const reportDocCode = (rep.reportTemplate === 'FORM_12' || rep.inspectionType === 'MATERIAL') ? 'MI' : 'WA';
        const repCreatedAt = rep.createdAt || targetReq?.createdAt || new Date();
        const newReportDocNum = generateDocumentCode(projectCode, reportDocCode, repCreatedAt, effectiveRev);

        rep = {
          ...rep,
          revisionNumber: effectiveRev,
          referenceDocNumber: newReportDocNum,
          projectCategoryCode: newReportDocNum,
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
            (rep.requestId && r.requestId === rep.requestId)
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
    setReportInitialTab(options.initialTab || (options.openRectify ? 'DEFECTS' : 'INVITATION'));
  };


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

  // 5. Hàm điều hướng khi click chọn thông báo trong trung tâm thông báo hoặc popup toast
  const handleSelectNotification = (notif) => {
    if (!notif) return;
    setInitialOpenRectify(false);

    // 1. Biên bản nghiệm thu liên quan
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

    // 2. Nhật ký thi công
    if (notif.targetDailyLogId) {
      const dl = dailyLogs.find(l => l.id === notif.targetDailyLogId);
      if (dl) {
        setSelectedDailyLog(dl);
        setIsDailyLogDetailModalOpen(true);
        return;
      }
    }

    // 3. Biên bản hoàn thành
    if (notif.targetCompletionReportId) {
      const cr = completionReports.find(l => l.id === notif.targetCompletionReportId);
      if (cr) {
        setSelectedCompletionReport(cr);
        setIsCompletionDetailModalOpen(true);
        return;
      }
    }

    // 4. Hồ sơ shop
    if (notif.targetShopDocId) {
      const sDoc = shopDocuments.find(d => d.id === notif.targetShopDocId);
      if (sDoc) {
        setSelectedShopDoc(sDoc);
        return;
      }
    }

    // 5. Hồ sơ thanh toán
    if (notif.targetPaymentDocId) {
      const pDoc = paymentDocuments.find(d => d.id === notif.targetPaymentDocId);
      if (pDoc) {
        setSelectedPaymentDoc(pDoc);
        return;
      }
    }

    // 6. Phiếu yêu cầu nghiệm thu
    if (notif.targetRequestId) {
      const target = requests.find(r => r.id === notif.targetRequestId);
      if (target) {
        setSelectedRequest(target);
        return;
      }
    }

    if (showAlert) {
      showAlert({
        type: 'info',
        title: 'Thông báo',
        message: 'Hồ sơ hoặc biên bản này hiện không tồn tại hoặc bạn chưa được phân quyền truy cập.'
      });
    }
  };

  const accessibleRequests = useMemo(() => {
    return requests.filter(req => {
      const matchingRep = reports.find(r => 
        (r.requestId && r.requestId === req.id) || 
        (r.id && r.id === req.reportId)
      );
      return canAccessInspection(req, matchingRep, currentUser, users);
    });
  }, [requests, reports, currentUser, users]);

  const accessibleReports = useMemo(() => {
    return reports.filter(rep => {
      const matchingReq = requests.find(r => 
        (r.id && r.id === rep.requestId) || 
        (r.reportId && r.reportId === rep.id)
      );
      return canAccessInspection(matchingReq, rep, currentUser, users);
    });
  }, [reports, requests, currentUser, users]);

  const filteredRequests = accessibleRequests.filter(req => {
    if (!req) return false;
    const q = (searchQuery || '').toLowerCase().trim();
    const task = String(req.taskContent || req.itemName || req.inspectionObject || '').toLowerCase();
    const num = String(req.requestNumber || req.referenceDocNumber || '').toLowerCase();
    const building = String(req.buildingName || req.projectInfo?.buildingName || '').toLowerCase();

    const matchesSearch = !q || task.includes(q) || num.includes(q) || building.includes(q);

    let matchesStatus = true;
    if (statusFilter === 'SENT') matchesStatus = req.status === 'SENT' || !req.status;
    if (statusFilter === 'HAS_REJECTIONS') matchesStatus = req.status === 'HAS_REJECTIONS';
    if (statusFilter === 'RECTIFIED') matchesStatus = req.status === 'RECTIFIED';
    if (statusFilter === 'COMPLETED') matchesStatus = req.status === 'COMPLETED';

    return matchesSearch && matchesStatus;
  });

  // Lọc thông báo phù hợp: CHỈ người được chọn + các Trưởng liên quan + Admin mới nhận được
  const userNotifications = notifications.filter(notif => 
    checkNotificationRecipient(notif, currentUser, requests, reports, users)
  );

  const unreadCount = userNotifications.filter(n => !n.isRead).length;

  const stats = {
    total: accessibleRequests.length,
    sent: accessibleRequests.filter(r => r.status === 'SENT' || !r.status).length,
    rejected: accessibleRequests.filter(r => r.status === 'HAS_REJECTIONS').length,
    rectified: accessibleRequests.filter(r => r.status === 'RECTIFIED').length,
    completed: accessibleRequests.filter(r => r.status === 'COMPLETED').length,
    myInvitations: accessibleRequests.length
  };

  // NẾU CHƯA ĐĂNG NHẬP -> HIỆN MÀN HÌNH LOGIN (Đặt sau toàn bộ Hooks để tuân thủ quy tắc React Hook)
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} users={users} />;
  }

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
          handleSelectNotification(notif);
        }}
        pushPermissionGranted={pushPermissionGranted}
        onEnablePush={handleEnablePush}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        onOpenProfile={() => setActiveTab('PROFILE')}
        onLogout={handleLogout}
      />

      {/* PUSH NOTIFICATION TOAST POPUP */}
      <PushNotificationToast 
        notification={activePushToast}
        onClose={() => setActivePushToast(null)}
        onAction={(notif) => {
          handleMarkNotificationAsRead(notif.id);
          handleSelectNotification(notif);
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
                  <span>Thư Viện TCVN ({(standardsData?.works?.length || 0) + (standardsData?.materials?.length || 0)} hạng mục)</span>
                </li>
                <li 
                  className={`sidebar-nav-item ${activeTab === 'ADMIN_PROJECTS' ? 'active' : ''}`}
                  onClick={() => setActiveTab('ADMIN_PROJECTS')}
                >
                  <Building2 size={18} />
                  <span>Quản Lý Công Trình & Mã ({projectsList.length} DA / {docTypesList.length} Mã)</span>
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
                <li 
                  className={`sidebar-nav-item ${activeTab === 'DAILY_LOGS' ? 'active' : ''}`}
                  onClick={() => setActiveTab('DAILY_LOGS')}
                >
                  <NotebookPen size={18} />
                  <span>Nhật Ký Thi Công ({dailyLogs.length})</span>
                </li>
                <li 
                  className={`sidebar-nav-item ${activeTab === 'COMPLETION' ? 'active' : ''}`}
                  onClick={() => setActiveTab('COMPLETION')}
                >
                  <Award size={18} />
                  <span>Nghiệm Thu Hoàn Thành ({completionReports.length})</span>
                </li>
                <li 
                  className={`sidebar-nav-item ${activeTab === 'SHOP_DOCUMENTS' ? 'active' : ''}`}
                  onClick={() => setActiveTab('SHOP_DOCUMENTS')}
                >
                  <Layers size={18} />
                  <span>Hồ Sơ Bộ Phận Shop ({shopDocuments.length})</span>
                </li>
                <li 
                  className={`sidebar-nav-item ${activeTab === 'PAYMENT_DOCUMENTS' ? 'active' : ''}`}
                  onClick={() => setActiveTab('PAYMENT_DOCUMENTS')}
                >
                  <CreditCard size={18} />
                  <span>Hồ Sơ Thanh Toán ({paymentDocuments.length})</span>
                </li>
                <li 
                  className={`sidebar-nav-item ${activeTab === 'PROFILE' ? 'active' : ''}`}
                  onClick={() => setActiveTab('PROFILE')}
                >
                  <UserCheck size={18} />
                  <span>Hồ Sơ Cá Nhân</span>
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

                <li 
                  className={`sidebar-nav-item ${activeTab === 'DAILY_LOGS' ? 'active' : ''}`}
                  onClick={() => setActiveTab('DAILY_LOGS')}
                >
                  <NotebookPen size={18} />
                  <span>Nhật Ký Thi Công ({dailyLogs.length})</span>
                </li>

                <li 
                  className={`sidebar-nav-item ${activeTab === 'COMPLETION' ? 'active' : ''}`}
                  onClick={() => setActiveTab('COMPLETION')}
                >
                  <Award size={18} />
                  <span>Nghiệm Thu Hoàn Thành ({completionReports.length})</span>
                </li>

                <li 
                  className={`sidebar-nav-item ${activeTab === 'SHOP_DOCUMENTS' ? 'active' : ''}`}
                  onClick={() => setActiveTab('SHOP_DOCUMENTS')}
                >
                  <Layers size={18} />
                  <span>Hồ Sơ Bộ Phận Shop ({shopDocuments.length})</span>
                </li>

                <li 
                  className={`sidebar-nav-item ${activeTab === 'PAYMENT_DOCUMENTS' ? 'active' : ''}`}
                  onClick={() => setActiveTab('PAYMENT_DOCUMENTS')}
                >
                  <CreditCard size={18} />
                  <span>Hồ Sơ Thanh Toán ({paymentDocuments.length})</span>
                </li>

                <li 
                  className={`sidebar-nav-item ${activeTab === 'PROFILE' ? 'active' : ''}`}
                  onClick={() => setActiveTab('PROFILE')}
                >
                  <UserCheck size={18} />
                  <span>Hồ Sơ Cá Nhân</span>
                </li>
              </>
            )}
          </ul>
        </aside>

        {/* NỘI DUNG CHÍNH (GIAO DIỆN CHUYÊN BIỆT TỪNG VAI TRÒ) */}
        <main className="app-main">
          {/* MÀN HÌNH HỒ SƠ CÁ NHÂN & ĐỔI MẬT KHẨU (PROFILE) */}
          {activeTab === 'PROFILE' ? (
            <ProfileView 
              currentUser={currentUser}
              users={users}
              onUpdateProfile={handleUpdateUserProfile}
            />
          ) : activeTab === 'SHOP_DOCUMENTS' ? (
            <ShopDocumentsView 
              shopDocuments={shopDocuments}
              currentUser={currentUser}
              currentRole={currentRole}
              onOpenCreateModal={() => setIsCreateShopModalOpen(true)}
              onOpenDetailModal={(doc) => setSelectedShopDoc(doc)}
            />
          ) : activeTab === 'PAYMENT_DOCUMENTS' ? (
            <PaymentDocumentsView 
              paymentDocuments={paymentDocuments}
              currentUser={currentUser}
              currentRole={currentRole}
              onOpenCreateModal={() => setIsCreatePaymentModalOpen(true)}
              onOpenDetailModal={(doc) => setSelectedPaymentDoc(doc)}
            />
          ) : activeTab === 'REPORTS' ? (
            <ReportsListView 
              reports={accessibleReports}
              currentRole={currentRole}
              currentUser={currentUser}
              onOpenReport={handleOpenReport}
            />
          ) : activeTab === 'DAILY_LOGS' ? (
            <DailyLogsListView 
              dailyLogs={dailyLogs}
              currentUser={currentUser}
              currentRole={currentRole}
              onCreateDailyLog={() => setIsCreateDailyLogModalOpen(true)}
              onCreateLog={() => setIsCreateDailyLogModalOpen(true)}
              onOpenDailyLog={handleOpenDailyLog}
              onOpenLog={handleOpenDailyLog}
              onDeleteDailyLog={handleDeleteDailyLog}
              onDeleteLog={handleDeleteDailyLog}
            />
          ) : activeTab === 'COMPLETION' ? (
            <CompletionReportsListView 
              reports={completionReports}
              completionReports={completionReports}
              currentUser={currentUser}
              currentRole={currentRole}
              onCreateReport={() => setIsCreateCompletionModalOpen(true)}
              onOpenReport={handleOpenCompletionReport}
              onDeleteReport={handleDeleteCompletionReport}
            />
          ) : currentRole === 'ADMIN' && (activeTab === 'ADMIN_USERS' || activeTab === 'ADMIN_STANDARDS' || activeTab === 'ADMIN_PROJECTS') ? (
            <div>
              <div className="dashboard-header" style={{ marginBottom: '16px' }}>
                <div className="dashboard-title-row">
                  <div className="dashboard-title">
                    <h2>Bảng Quản Trị Hệ Thống APCT (Admin Portal)</h2>
                  </div>
                </div>

                {/* Sub-tabs for quick switching in Admin mode */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '14px', borderBottom: '2px solid #e2e8f0', paddingBottom: '2px', overflowX: 'auto' }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('ADMIN_PROJECTS')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px 8px 0 0',
                      border: 'none',
                      background: activeTab === 'ADMIN_PROJECTS' ? '#7e22ce' : '#f1f5f9',
                      color: activeTab === 'ADMIN_PROJECTS' ? '#ffffff' : '#475569',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Building2 size={16} />
                    <span>Quản Lý Công Trình & Mã ({projectsList.length} DA / {docTypesList.length} Mã)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('ADMIN_USERS')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px 8px 0 0',
                      border: 'none',
                      background: activeTab === 'ADMIN_USERS' ? '#7e22ce' : '#f1f5f9',
                      color: activeTab === 'ADMIN_USERS' ? '#ffffff' : '#475569',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Users size={16} />
                    <span>Quản Lý Cán Bộ ({users.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('ADMIN_STANDARDS')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px 8px 0 0',
                      border: 'none',
                      background: activeTab === 'ADMIN_STANDARDS' ? '#7e22ce' : '#f1f5f9',
                      color: activeTab === 'ADMIN_STANDARDS' ? '#ffffff' : '#475569',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <BookOpen size={16} />
                    <span>Thư Viện TCVN</span>
                  </button>
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
                  onSyncAllUsersToCloud={handleSyncAllUsersToCloud}
                />
              ) : activeTab === 'ADMIN_STANDARDS' ? (
                <StandardsManagementView
                  standardsData={standardsData}
                  onSaveStandards={handleSaveStandards}
                  onSyncStandardsToCloud={handleSyncStandardsToCloud}
                  showAlert={showAlert}
                />
              ) : (
                <ProjectManagementView
                  projects={projectsList}
                  docTypes={docTypesList}
                  onSaveProjects={handleSaveProjects}
                  onSaveDocTypes={handleSaveDocTypes}
                  showAlert={showAlert}
                />
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
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn-primary mobile-create-btn" onClick={() => setIsCreateModalOpen(true)}>
                        <Plus size={16} />
                        <span>Phiếu Y/C</span>
                      </button>
                      <button 
                        className="btn-secondary mobile-create-btn" 
                        onClick={() => setIsCreateDailyLogModalOpen(true)}
                        style={{ background: '#0284c7', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <NotebookPen size={16} />
                        <span>Nhật Ký</span>
                      </button>
                      <button 
                        className="btn-secondary mobile-create-btn" 
                        onClick={() => {
                          setActiveTab('COMPLETION');
                          setIsCreateCompletionModalOpen(true);
                        }}
                        style={{ background: '#d97706', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Award size={16} />
                        <span>NT Hoàn Thành</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="dashboard-title-row desktop-only-flex">
                  <div className="dashboard-title">
                    <h2>
                      {currentRole === 'CONTRACTOR' && '👷‍♂️ Phân Hệ Đơn Vị Thi Công'}
                      {currentRole === 'SUPERVISOR' && '👁️ Phân Hệ Tư Vấn Giám Sát (TVGS)'}
                      {currentRole === 'LEAD_SUPERVISOR' && '👁️ Phân Hệ Tư Vấn Giám Sát Trưởng'}
                      {currentRole === 'INVESTOR' && '🏢 Phân Hệ Ban Quản Lý Dự Án (Ban QLDA)'}
                      {currentRole === 'LEAD_INVESTOR' && '🏢 Phân Hệ Trưởng Ban Quản Lý Dự Án'}
                      {currentRole === 'ADMIN' && '🛡️ Giám Sát Hồ Sơ Nghiệm Thu (Chủ Đầu Tư - CĐT)'}
                    </h2>
                  </div>

                  {/* CHỈ HIỂN THỊ NÚT TẠO PHIẾU NẾU LÀ ĐƠN VỊ THI CÔNG */}
                  {currentRole === 'CONTRACTOR' && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button className="btn-primary" onClick={() => setIsCreateModalOpen(true)}>
                        <Plus size={18} />
                        <span>Tạo Phiếu Yêu Cầu Nghiệm Thu</span>
                      </button>
                      <button 
                        className="btn-secondary" 
                        onClick={() => setIsCreateDailyLogModalOpen(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0284c7', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 4px rgba(2,132,199,0.2)' }}
                      >
                        <NotebookPen size={18} />
                        <span>Tạo Nhật Ký Thi Công</span>
                      </button>
                      <button 
                        className="btn-secondary" 
                        onClick={() => {
                          setActiveTab('COMPLETION');
                          setIsCreateCompletionModalOpen(true);
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#d97706', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 4px rgba(217,119,6,0.2)' }}
                      >
                        <Award size={18} />
                        <span>Nghiệm Thu Hoàn Thành</span>
                      </button>
                    </div>
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
                    const isCancelled = req.status === 'CANCELLED';
                    const isRejected = req.status === 'HAS_REJECTIONS';
                    const isRectified = req.status === 'RECTIFIED';
                    const matchingRep = reports.find(r => r.id === req.reportId || r.requestId === req.id);

                    const isSupervisorSigned = Boolean(
                      matchingRep?.signatures?.supervisor?.signed || 
                      matchingRep?.attendees?.supervisor?.signed
                    );
                    const isInvestorSigned = Boolean(
                      matchingRep?.signatures?.investor?.signed || 
                      matchingRep?.attendees?.investor?.signed
                    );
                    const isConfirmed = isSupervisorSigned || isInvestorSigned || isCompleted || req.status === 'WAITING_INVESTOR';

                    const isCreator = Boolean(
                      (currentUser?.uid && req.createdByUid === currentUser.uid) ||
                      currentRole === 'CONTRACTOR' ||
                      currentRole === 'ADMIN' ||
                      (currentUser?.company && req.contractorCompany === currentUser.company)
                    );
                    const canModify = !isConfirmed && !isCancelled && isCreator;

                    const isLeadSupervisor = currentRole !== 'ADMIN' && (currentRole === 'LEAD_SUPERVISOR' || Boolean(currentUser?.isLead && currentRole === 'SUPERVISOR'));
                    const isLeadInvestor = currentRole !== 'ADMIN' && (currentRole === 'LEAD_INVESTOR' || Boolean(currentUser?.isLead && currentRole === 'INVESTOR'));

                    return (
                      <div 
                        key={req.id} 
                        className="inspection-card"
                        style={{
                          border: isCancelled
                            ? '1.5px solid #fca5a5'
                            : isRejected 
                            ? '1.5px solid #fca5a5' 
                            : isRectified 
                            ? '1.5px solid #d8b4fe' 
                            : isCompleted 
                            ? '1.5px solid #a7f3d0' 
                            : '1px solid #e2e8f0',
                          background: (isRejected || isCancelled) ? '#fffafa' : '#ffffff'
                        }}
                      >
                        <div className="card-top-bar">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span className="card-req-number">{req.requestNumber}</span>
                            {isCompleted ? (
                              <span className="badge-status badge-approved">
                                <CheckCircle2 size={13} /> Đã Hoàn Thành
                              </span>
                            ) : isCancelled ? (
                              <span className="badge-status" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #f87171', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Ban size={13} color="#dc2626" /> Đã Hủy Phiếu
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
                            <span>Nghiệm thu: <strong>{req.scheduledTime}</strong></span>
                          </div>
                        </div>

                        <h3 className="card-task-title">{req.taskContent}</h3>

                        <div className="card-hierarchy-breadcrumb">
                          <span>🏢 {req.buildingName}</span>
                          <span>›</span>
                          <span>📑 {req.itemName}</span>
                        </div>

                        {/* THÔNG BÁO KHI PHIẾU BỊ HỦY */}
                        {isCancelled && (
                          <div style={{
                            background: '#fef2f2',
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
                            <Ban size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#dc2626' }} />
                            <div>
                              <div style={{ fontWeight: 700 }}>Phiếu yêu cầu nghiệm thu đã được hủy:</div>
                              <div style={{ color: '#7f1d1d', marginTop: '3px' }}>
                                "{req.cancellationReason || 'Đã hủy theo yêu cầu của đơn vị thi công.'}"
                              </div>
                              <div style={{ fontSize: '0.74rem', color: '#991b1b', marginTop: '2px' }}>
                                Người hủy: {req.cancelledByName || 'ĐVTC'} • {new Date(req.cancelledAt || Date.now()).toLocaleDateString('vi-VN')}
                              </div>
                            </div>
                          </div>
                        )}

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
                          <div className="recipients-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                            <span>Thành phần tiếp nhận yêu cầu ({req.assignedRecipients?.length || 0}):</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {((isLeadSupervisor && !isCompleted && !isCancelled) || canModify) && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenReassignModal(req, 'SUPERVISOR');
                                  }}
                                  style={{
                                    fontSize: '0.74rem',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid #86efac',
                                    background: '#f0fdf4',
                                    color: '#15803d',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                  title="Đổi cán bộ Tư Vấn Giám Sát tiếp nhận phiếu này"
                                >
                                  <ArrowLeftRight size={12} />
                                  <span>Đổi TVGS</span>
                                </button>
                              )}
                              {((isLeadInvestor && !isCompleted && !isCancelled) || canModify) && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenReassignModal(req, 'INVESTOR');
                                  }}
                                  style={{
                                    fontSize: '0.74rem',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid #fde68a',
                                    background: '#fffbeb',
                                    color: '#b45309',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                  title="Đổi cán bộ Ban QLDA tiếp nhận phiếu này"
                                >
                                  <ArrowLeftRight size={12} />
                                  <span>Đổi CĐT</span>
                                </button>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                            {req.assignedRecipients?.map((rec, idx) => {
                              const isSup = rec.role === 'SUPERVISOR' || rec.role === 'LEAD_SUPERVISOR';
                              const canReassignThis = !isCancelled && (
                                (!isCompleted && ((isSup && isLeadSupervisor) || (!isSup && isLeadInvestor))) ||
                                canModify
                              );

                              return (
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
                                    background: isSup ? '#059669' : '#d97706' 
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
                                  {canReassignThis && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenReassignModal(req, isSup ? 'SUPERVISOR' : 'INVESTOR');
                                      }}
                                      style={{
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '0 2px',
                                        color: isSup ? '#059669' : '#d97706',
                                        display: 'flex',
                                        alignItems: 'center'
                                      }}
                                      title={`Đổi người ${isSup ? 'TVGS' : 'CĐT'} này`}
                                    >
                                      <ArrowLeftRight size={13} />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* NÚT HÀNH ĐỘNG CHUẨN NGHIỆP VỤ: MỞ XEM HỒ SƠ TỔNG HỢP (PHIẾU YÊU CẦU & BIÊN BẢN) */}
                        <div className="card-actions-row" style={{ justifyContent: 'flex-end' }}>
                          {isCancelled ? (
                            <button 
                              className="btn-secondary" 
                              style={{ color: '#64748b', padding: '7px 18px', fontSize: '0.86rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                              onClick={() => {
                                if (matchingRep) {
                                  handleOpenReport(matchingRep, { initialTab: 'INVITATION' });
                                } else {
                                  handleOpenOrCreateReport(req.reportId || req.id, false, 'INVITATION');
                                }
                              }}
                            >
                              <Eye size={16} />
                              <span>Xem</span>
                            </button>
                          ) : isRejected ? (
                            currentRole === 'CONTRACTOR' ? (
                              <button 
                                className="btn-primary" 
                                style={{ background: '#7c3aed', padding: '7px 18px', fontSize: '0.86rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                onClick={() => {
                                  if (matchingRep) {
                                    handleOpenReport(matchingRep, { openRectify: true, initialTab: 'DEFECTS' });
                                  } else {
                                    handleOpenOrCreateReport(req.reportId || req.id, false, 'DEFECTS');
                                  }
                                }}
                              >
                                <Wrench size={16} />
                                <span>Khắc Phục & Mời Lại</span>
                              </button>
                            ) : (
                              <button 
                                className="btn-secondary" 
                                style={{ borderColor: '#fca5a5', color: '#b91c1c', background: '#fff', padding: '7px 18px', fontSize: '0.86rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                onClick={() => handleOpenOrCreateReport(req.reportId || req.id, false, 'DEFECTS')}
                              >
                                <AlertTriangle size={16} color="#dc2626" />
                                <span>Xem</span>
                              </button>
                            )
                          ) : isRectified ? (
                            <button 
                              className="btn-primary" 
                              style={{ background: '#7c3aed', padding: '7px 18px', fontSize: '0.86rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                              onClick={() => handleOpenOrCreateReport(req.reportId || req.id, false, 'RECTIFIED')}
                            >
                              <RotateCcw size={16} />
                              <span>Xem</span>
                            </button>
                          ) : (
                            <button 
                              className="btn-primary" 
                              style={{ background: '#059669', padding: '7px 20px', fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                              onClick={() => handleOpenOrCreateReport(req.reportId || req.id, false, 'INVITATION')}
                            >
                              <Eye size={16} />
                              <span>Xem</span>
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
          <span>Phiếu Y/C</span>
        </button>

        <button 
          className={`bottom-nav-item ${activeTab === 'DAILY_LOGS' ? 'active' : ''}`}
          onClick={() => setActiveTab('DAILY_LOGS')}
        >
          <NotebookPen size={20} />
          <span>Nhật Ký</span>
        </button>

        <button 
          className={`bottom-nav-item ${activeTab === 'REPORTS' ? 'active' : ''}`}
          onClick={() => setActiveTab('REPORTS')}
        >
          <FileText size={20} />
          <span>Biên Bản</span>
        </button>

        <button 
          className={`bottom-nav-item ${activeTab === 'COMPLETION' ? 'active' : ''}`}
          onClick={() => setActiveTab('COMPLETION')}
        >
          <Award size={20} />
          <span>Hoàn Thành</span>
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
        onNavigateProfile={() => setActiveTab('PROFILE')}
        onLogout={handleLogout}
        pushPermissionGranted={pushPermissionGranted}
        onEnablePush={handleEnablePush}
      />

      {/* MODALS */}
      <CreateRequestModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        users={users}
        currentUser={currentUser}
        standardsData={standardsData}
        projects={projectsList}
        docTypes={docTypesList}
        onSubmitRequest={handleCreateRequest}
        showAlert={showAlert}
      />

      <InvitationDetailModal 
        isOpen={Boolean(selectedRequest)}
        onClose={() => setSelectedRequest(null)}
        request={selectedRequest}
        reports={reports}
        currentRole={currentRole}
        currentUser={currentUser}
        projects={projectsList}
        docTypes={docTypesList}
        onOpenReport={(reportId, isCreate) => {
          setSelectedRequest(null);
          handleOpenOrCreateReport(reportId, isCreate);
        }}
        onReassign={(req, type) => {
          handleOpenReassignModal(req, type);
        }}
        onUpdateTime={handleUpdateRequestTime}
        onCancelRequest={handleCancelRequest}
      />

      <InspectionReportModal 
        isOpen={Boolean(selectedReport)}
        onClose={() => {
          setSelectedReport(null);
          setInitialOpenRectify(false);
          setReportInitialTab('INVITATION');
        }}
        report={selectedReport}
        currentRole={currentRole}
        currentUser={currentUser}
        users={users}
        requests={requests}
        standardsData={standardsData}
        projects={projectsList}
        docTypes={docTypesList}
        onSaveReport={handleSaveReport}
        onRejectReport={handleRejectReport}
        onReinspectReport={handleReinspectReport}
        onResubmitReport={handleResubmitReport}
        initialOpenRectify={initialOpenRectify}
        initialTab={reportInitialTab}
        showAlert={showAlert}
        onReassign={(req, type) => {
          handleOpenReassignModal(req, type);
        }}
      />

      <ReassignRecipientModal 
        isOpen={reassignModalState.isOpen}
        onClose={() => setReassignModalState({ isOpen: false, request: null, reassignType: 'SUPERVISOR' })}
        request={reassignModalState.request}
        reassignType={reassignModalState.reassignType}
        users={users}
        currentUser={currentUser}
        onConfirmReassign={handleConfirmReassign}
      />

      <AdminPortalModal 
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        users={users}
        currentUser={currentUser}
        standardsData={standardsData}
        projects={projectsList}
        docTypes={docTypesList}
        slaConfigs={shopSlaConfigs}
        onSaveProjects={handleSaveProjects}
        onSaveDocTypes={handleSaveDocTypes}
        onSaveStandards={handleSaveStandards}
        onSyncStandardsToCloud={handleSyncStandardsToCloud}
        onSaveSlaConfigs={handleSaveShopSlaConfigs}
        onSyncSlaToCloud={handleSyncShopSlaToCloud}
        onAddUser={handleAddUser}
        onUpdateUser={handleUpdateUser}
        onDeleteUser={handleDeleteUser}
        onUpdateUserRole={handleUpdateUserRole}
        onToggleUserStatus={handleToggleUserStatus}
        onSyncAllUsersToCloud={handleSyncAllUsersToCloud}
        showAlert={showAlert}
      />

      {/* MODAL TẠO HỒ SƠ BỘ PHẬN SHOP */}
      <CreateShopDocumentModal 
        isOpen={isCreateShopModalOpen}
        onClose={() => setIsCreateShopModalOpen(false)}
        users={users}
        currentUser={currentUser}
        slaConfigs={shopSlaConfigs}
        onSubmitShopDocument={handleCreateShopDocument}
        showAlert={showAlert}
      />

      {/* MODAL XEM CHI TIẾT & THẨM ĐỊNH HỒ SƠ BỘ PHẬN SHOP */}
      <ShopDocumentDetailModal 
        isOpen={Boolean(selectedShopDoc)}
        onClose={() => setSelectedShopDoc(null)}
        document={selectedShopDoc}
        currentUser={currentUser}
        currentRole={currentRole}
        users={users}
        onApprove={handleApproveShopDocument}
        onReject={handleRejectShopDocument}
        onAssign={handleAssignShopDocument}
        onResubmit={handleResubmitShopDocument}
        onDelete={handleDeleteShopDocument}
        showAlert={showAlert}
      />

      {/* MODAL TẠO HỒ SƠ THANH TOÁN */}
      <CreatePaymentDocumentModal 
        isOpen={isCreatePaymentModalOpen}
        onClose={() => setIsCreatePaymentModalOpen(false)}
        users={users}
        currentUser={currentUser}
        slaConfigs={paymentSlaConfigs}
        onSubmitPaymentDocument={handleCreatePaymentDocument}
        showAlert={showAlert}
      />

      {/* MODAL XEM CHI TIẾT & THẨM ĐỊNH HỒ SƠ THANH TOÁN */}
      <PaymentDocumentDetailModal 
        isOpen={Boolean(selectedPaymentDoc)}
        onClose={() => setSelectedPaymentDoc(null)}
        document={selectedPaymentDoc}
        currentUser={currentUser}
        currentRole={currentRole}
        users={users}
        onApprove={handleApprovePaymentDocument}
        onReject={handleRejectPaymentDocument}
        onAssign={handleAssignPaymentDocument}
        onResubmit={handleResubmitPaymentDocument}
        onDelete={handleDeletePaymentDocument}
        showAlert={showAlert}
      />

      {/* MODAL HƯỚNG DẪN BẬT THÔNG BÁO CHO IPHONE (IOS) VÀ TRÌNH DUYỆT */}
      <PushGuideModal 
        isOpen={pushGuideModal.isOpen}
        onClose={() => setPushGuideModal(prev => ({ ...prev, isOpen: false }))}
        reason={pushGuideModal.reason}
        onRetry={handleEnablePush}
      />

      {/* MODAL TẠO NHẬT KÝ THI CÔNG */}
      <CreateDailyLogModal 
        isOpen={isCreateDailyLogModalOpen}
        onClose={() => setIsCreateDailyLogModalOpen(false)}
        currentUser={currentUser}
        users={users}
        projects={projectsList}
        onSaveProjects={handleSaveProjects}
        onSubmitDailyLog={handleCreateDailyLog}
        showAlert={showAlert}
      />

      {/* MODAL XEM CHI TIẾT & KÝ DUYỆT / IN NHẬT KÝ THI CÔNG */}
      <DailyLogDetailModal 
        isOpen={isDailyLogDetailModalOpen}
        onClose={() => {
          setIsDailyLogDetailModalOpen(false);
          setSelectedDailyLog(null);
        }}
        log={selectedDailyLog}
        dailyLog={selectedDailyLog}
        currentUser={currentUser}
        currentRole={currentRole}
        onConfirmLog={handleConfirmDailyLog}
        onConfirmDailyLog={handleConfirmDailyLog}
        showAlert={showAlert}
      />

      {/* MODAL TẠO BIÊN BẢN NGHIỆM THU HOÀN THÀNH MỚI */}
      <CreateCompletionReportModal 
        isOpen={isCreateCompletionModalOpen}
        onClose={() => setIsCreateCompletionModalOpen(false)}
        currentUser={currentUser}
        users={users}
        onSubmitCompletionReport={handleCreateCompletionReport}
        showAlert={showAlert}
      />

      {/* MODAL XEM CHI TIẾT & KÝ DUYỆT / IN BIÊN BẢN HOÀN THÀNH */}
      <CompletionReportDetailModal 
        isOpen={isCompletionDetailModalOpen}
        onClose={() => {
          setIsCompletionDetailModalOpen(false);
          setSelectedCompletionReport(null);
        }}
        report={selectedCompletionReport}
        currentUser={currentUser}
        currentRole={currentRole}
        onSignReport={handleSignCompletionReport}
        showAlert={showAlert}
      />

      {/* MODAL POPUP CONFIRM & ALERT TÙY CHỈNH CHUẨN APCT (THAY THẾ WINDOW.CONFIRM/ALERT) */}
      <ConfirmDialogModal {...confirmDialog} />
    </div>
  );
}
