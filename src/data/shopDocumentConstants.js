// ============================================================================
// APCT SHOP DRAWINGS & TECHNICAL DOCUMENTS CONSTANTS & SLA RULES
// Quản lý hồ sơ bộ phận Shop, bản vẽ thi công, biện pháp kỹ thuật và thời hạn phản hồi
// ============================================================================

export const SHOP_DOCUMENTS_STORAGE_KEY = 'apct_shop_documents';
export const SHOP_SLA_STORAGE_KEY = 'apct_shop_sla_configs';

// Cấu hình thời hạn phản hồi (SLA) mặc định theo quy chuẩn hệ thống
export const DEFAULT_SHOP_SLA_CONFIGS = [
  {
    id: 'sla_bptc',
    typeCode: 'BIEN_PHAP_THI_CONG',
    typeName: 'Biện pháp thi công',
    slaDays: 3,
    description: 'Quy trình, giải pháp kỹ thuật và an toàn thi công chi tiết'
  },
  {
    id: 'sla_shop_kc',
    typeCode: 'SHOP_KET_CAU',
    typeName: 'Shop kết cấu',
    slaDays: 3,
    description: 'Bản vẽ shop drawing triển khai thi công phần kết cấu'
  },
  {
    id: 'sla_shop_ht',
    typeCode: 'SHOP_HOAN_THIEN',
    typeName: 'Shop hoàn thiện',
    slaDays: 3,
    description: 'Bản vẽ shop drawing chi tiết hoàn thiện kiến trúc, ốp lát, trần sàn'
  },
  {
    id: 'sla_tdtc',
    typeCode: 'TIEN_DO_THI_CONG',
    typeName: 'Tiến độ thi công',
    slaDays: 2,
    description: 'Kế hoạch và tiến độ thi công tổng thể / phân kỳ dự án'
  },
  {
    id: 'sla_bvhc',
    typeCode: 'BAN_VE_HOAN_CONG',
    typeName: 'Bản vẽ hoàn công',
    slaDays: 3,
    description: 'Hồ sơ bản vẽ hoàn công công trình phục vụ nghiệm thu quyết toán'
  }
];

// Trạng thái hồ sơ
export const SHOP_STATUS = {
  WAITING_ASSIGNMENT: 'WAITING_ASSIGNMENT', // Chờ 2 Trưởng ban phân công cán bộ (Hạn 1 ngày)
  SENT: 'SENT',                            // Đã phân công - đang trong quá trình thẩm định & phê duyệt
  APPROVED: 'APPROVED',                    // Đã xác nhận - cả TVGS và Ban QLDA đều duyệt đạt
  REJECTED: 'REJECTED',                    // Cần sửa - bị yêu cầu chỉnh sửa (sẽ gửi lại trực tiếp người từ chối)
  OVERDUE_ASSIGNMENT: 'OVERDUE_ASSIGNMENT',// Chậm phân công - Quá 1 ngày (24h) chưa chọn cán bộ
  OVERDUE_REVIEW: 'OVERDUE_REVIEW',        // Chậm phản hồi - Quá thời hạn SLA mà cán bộ chưa duyệt
  OVERDUE: 'OVERDUE'                       // Alias tương thích
};

/**
 * Tải cấu hình SLA từ localStorage hoặc lấy mặc định
 */
export const loadStoredShopSlaConfigs = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return DEFAULT_SHOP_SLA_CONFIGS;
  }
  try {
    const raw = localStorage.getItem(SHOP_SLA_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[SLA Config] Lỗi đọc cấu hình SLA từ localStorage:', err);
  }
  return DEFAULT_SHOP_SLA_CONFIGS;
};

/**
 * Lưu cấu hình SLA vào localStorage
 */
export const saveStoredShopSlaConfigs = (configs) => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(SHOP_SLA_STORAGE_KEY, JSON.stringify(configs));
  } catch (err) {
    console.warn('[SLA Config] Lỗi lưu cấu hình SLA:', err);
  }
};

import { safeSaveLocalStorage } from '../utils/storageHelper';

/**
 * Tải danh sách hồ sơ shop từ localStorage
 */
export const loadStoredShopDocuments = () => {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(SHOP_DOCUMENTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('[Shop Documents] Lỗi đọc danh sách hồ sơ shop:', err);
  }
  return [];
};

/**
 * Lưu danh sách hồ sơ shop an toàn vào LocalStorage & sao lưu IndexedDB
 */
export const saveStoredShopDocuments = (docs) => {
  if (typeof window === 'undefined') return;
  try {
    safeSaveLocalStorage(SHOP_DOCUMENTS_STORAGE_KEY, docs);
  } catch (err) {
    console.warn('[Shop Documents] Lỗi lưu danh sách hồ sơ shop:', err);
  }
};

/**
 * Tính toán ngày hạn chót phản hồi theo SLA
 * @param {string|Date} submittedAt Thời điểm gửi / phân công
 * @param {number} slaDays Số ngày quy định
 * @returns {Date}
 */
export const calculateDueDate = (submittedAt, slaDays = 3) => {
  const submitTime = submittedAt ? new Date(submittedAt).getTime() : Date.now();
  const days = Number(slaDays) > 0 ? Number(slaDays) : 3;
  return new Date(submitTime + days * 24 * 60 * 60 * 1000);
};

/**
 * Kiểm tra hồ sơ có bị Chậm Phân Công hay không (Quy tắc: 1 ngày / 24h kể từ khi tạo phiếu)
 */
export const isShopAssignmentOverdue = (doc) => {
  if (!doc) return false;
  if (doc.status === SHOP_STATUS.APPROVED || doc.status === SHOP_STATUS.REJECTED) return false;
  
  // Kiểm tra nếu ít nhất 1 bên chưa phân công cán bộ
  const isTvgsAssigned = Boolean(doc.assignedTvgs?.assignee || doc.assignedTvgs?.uid);
  const isInvestorAssigned = Boolean(doc.assignedInvestor?.assignee || doc.assignedInvestor?.uid);
  
  if (isTvgsAssigned && isInvestorAssigned) return false;

  const deadlineTime = doc.assignmentDeadline 
    ? new Date(doc.assignmentDeadline).getTime() 
    : (new Date(doc.createdAt || doc.submittedAt || Date.now()).getTime() + 24 * 60 * 60 * 1000);

  return Date.now() > deadlineTime;
};

/**
 * Kiểm tra hồ sơ có bị Chậm Phản Hồi (Quá hạn SLA của cán bộ thẩm định) hay không
 */
export const isShopReviewOverdue = (doc) => {
  if (!doc) return false;
  if (doc.status === SHOP_STATUS.APPROVED || doc.status === SHOP_STATUS.REJECTED) return false;

  const now = Date.now();

  // Kiểm tra TVGS: Nếu đã được giao và đang chờ duyệt mà quá hạn dueDate
  const tvgsAssigned = doc.assignedTvgs?.assignee || doc.assignedTvgs?.uid;
  if (tvgsAssigned && doc.assignedTvgs?.status === 'PENDING') {
    const tvgsDue = doc.assignedTvgs?.dueDate 
      ? new Date(doc.assignedTvgs.dueDate).getTime() 
      : (doc.dueDate ? new Date(doc.dueDate).getTime() : null);
    if (tvgsDue && now > tvgsDue) return true;
  }

  // Kiểm tra Ban QLDA: Nếu đã được giao và đang chờ duyệt mà quá hạn dueDate
  const invAssigned = doc.assignedInvestor?.assignee || doc.assignedInvestor?.uid;
  if (invAssigned && doc.assignedInvestor?.status === 'PENDING') {
    const invDue = doc.assignedInvestor?.dueDate 
      ? new Date(doc.assignedInvestor.dueDate).getTime() 
      : (doc.dueDate ? new Date(doc.dueDate).getTime() : null);
    if (invDue && now > invDue) return true;
  }

  return false;
};

/**
 * Kiểm tra hồ sơ có bị Chậm (hàm tương thích ngược)
 */
export const isShopDocumentOverdue = (doc) => {
  return isShopAssignmentOverdue(doc) || isShopReviewOverdue(doc);
};

/**
 * Lấy trạng thái hiển thị thực tế (tính toán realtime theo các mốc thời gian SLA)
 */
export const getEffectiveShopStatus = (doc) => {
  if (!doc) return SHOP_STATUS.SENT;
  if (doc.status === SHOP_STATUS.APPROVED) return SHOP_STATUS.APPROVED;
  if (doc.status === SHOP_STATUS.REJECTED) return SHOP_STATUS.REJECTED;

  // Kiểm tra chậm phân công trước
  if (isShopAssignmentOverdue(doc)) {
    return SHOP_STATUS.OVERDUE_ASSIGNMENT;
  }

  // Nếu vẫn đang chờ phân công
  const isTvgsAssigned = Boolean(doc.assignedTvgs?.assignee || doc.assignedTvgs?.uid);
  const isInvestorAssigned = Boolean(doc.assignedInvestor?.assignee || doc.assignedInvestor?.uid);
  if (doc.status === SHOP_STATUS.WAITING_ASSIGNMENT || (!isTvgsAssigned || !isInvestorAssigned)) {
    return SHOP_STATUS.WAITING_ASSIGNMENT;
  }

  // Nếu đã phân công đầy đủ -> Kiểm tra chậm phản hồi thẩm định
  if (isShopReviewOverdue(doc)) {
    return SHOP_STATUS.OVERDUE_REVIEW;
  }

  return SHOP_STATUS.SENT;
};

/**
 * Thông tin chi tiết cấu hình màu sắc, nhãn cho từng trạng thái
 */
export const getShopStatusBadgeConfig = (status) => {
  switch (status) {
    case SHOP_STATUS.APPROVED:
      return {
        label: 'Đã xác nhận',
        bg: '#ecfdf5',
        color: '#059669',
        border: '#a7f3d0',
        dotColor: '#10b981'
      };
    case SHOP_STATUS.REJECTED:
      return {
        label: 'Cần sửa',
        bg: '#fef2f2',
        color: '#dc2626',
        border: '#fecaca',
        dotColor: '#ef4444'
      };
    case SHOP_STATUS.WAITING_ASSIGNMENT:
      return {
        label: 'Chờ phân công',
        bg: '#fffbeb',
        color: '#b45309',
        border: '#fde68a',
        dotColor: '#f59e0b'
      };
    case SHOP_STATUS.OVERDUE_ASSIGNMENT:
      return {
        label: 'Chậm phân công',
        bg: '#fdf2f8',
        color: '#be185d',
        border: '#fbcfe8',
        dotColor: '#ec4899'
      };
    case SHOP_STATUS.OVERDUE_REVIEW:
    case SHOP_STATUS.OVERDUE:
      return {
        label: 'Chậm phản hồi',
        bg: '#fff1f2',
        color: '#e11d48',
        border: '#fecdd3',
        dotColor: '#f43f5e'
      };
    case SHOP_STATUS.SENT:
    default:
      return {
        label: 'Đang thẩm định',
        bg: '#eff6ff',
        color: '#2563eb',
        border: '#bfdbfe',
        dotColor: '#3b82f6'
      };
  }
};

/**
 * Tìm Tư vấn giám sát trưởng tiếp nhận hồ sơ Shop (Dữ liệu chính thức: Đinh Xuân Thám)
 */
export const getShopLeadSupervisor = (users = []) => {
  return (users || []).find(u => {
    if (u.status === 'INACTIVE') return false;
    const roleStr = (u.role || '').toUpperCase();
    if (roleStr === 'LEAD_SUPERVISOR' || Boolean(u.isLead && roleStr === 'SUPERVISOR')) return true;
    const pos = (u.position || '').toLowerCase();
    return pos.includes('giám sát trưởng') || (pos.includes('trưởng') && pos.includes('giám sát'));
  }) || {
    uid: 'uid_tvgs_01',
    fullName: 'Đinh Xuân Thám',
    email: 'tham.dinhxuan@gelicon.vn',
    role: 'LEAD_SUPERVISOR',
    position: 'Tư vấn giám sát trưởng',
    company: 'Công ty CP Tư vấn Xây dựng và Thương mại GELICON'
  };
};

/**
 * Tìm Trưởng Ban Quản lý dự án tiếp nhận hồ sơ Shop (Dữ liệu chính thức: Ngô Quý Linh)
 */
export const getShopLeadInvestor = (users = []) => {
  return (users || []).find(u => {
    if (u.status === 'INACTIVE') return false;
    const roleStr = (u.role || '').toUpperCase();
    if (roleStr === 'LEAD_INVESTOR' || Boolean(u.isLead && roleStr === 'INVESTOR')) return true;
    const pos = (u.position || '').toLowerCase();
    return pos.includes('trưởng ban') || (pos.includes('trưởng') && (pos.includes('dự án') || pos.includes('qlda')));
  }) || {
    uid: 'uid_cdt_01',
    fullName: 'Ngô Quý Linh',
    email: 'linh.ngoquy@cncmi.vn',
    role: 'LEAD_INVESTOR',
    position: 'Trưởng Ban QLDA',
    company: 'Công ty cổ phần CONINCO Máy xây dựng và Công trình công nghiệp (CONINCO-MI)'
  };
};

