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
  WAITING_ASSIGNMENT: 'WAITING_ASSIGNMENT', // Chờ phân công cán bộ
  SENT: 'SENT',                            // Đang trong quá trình thẩm định & phê duyệt
  APPROVED: 'APPROVED',                    // Đã xác nhận / Hoàn thành
  REJECTED: 'REJECTED',                    // Cần sửa - bị yêu cầu chỉnh sửa
  OVERDUE_TVGS: 'OVERDUE_TVGS',            // TVGS Chậm (chậm giao 1 ngày hoặc chậm duyệt)
  OVERDUE_INVESTOR: 'OVERDUE_INVESTOR',    // Ban QLDA Chậm (chậm giao 1 ngày hoặc chậm duyệt sau khi TVGS duyệt đạt)
  OVERDUE_ASSIGNMENT: 'OVERDUE_ASSIGNMENT',// Alias tương thích cũ
  OVERDUE_REVIEW: 'OVERDUE_REVIEW',        // Alias tương thích cũ
  OVERDUE: 'OVERDUE'                       // Alias tương thích cũ
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
 * Kiểm tra hồ sơ có phải là Bản vẽ hoàn công hay không
 * (Bản vẽ hoàn công chỉ trình qua TVGS, không qua Ban Quản Lý Dự Án. Khi TVGS duyệt đạt là hoàn thành.)
 */
export const isAsBuiltDoc = (doc) => {
  if (!doc) return false;
  const code = (doc.typeCode || '').toUpperCase();
  const name = (doc.typeName || doc.title || '').toLowerCase();
  return code === 'BAN_VE_HOAN_CONG' || name.includes('hoàn công');
};

/**
 * Kiểm tra một bước thẩm định (assignedTvgs / assignedInvestor) đã thực sự được phân công hay chưa.
 * Chỉ coi là đã phân công khi có uid cán bộ VÀ trạng thái không còn ở WAITING_ASSIGNMENT
 * (tránh kẹt UI khi merge bản ghi chỉ có uid mà chưa hoàn tất phân công).
 */
export const isStageAssigned = (stage) => {
  if (!stage) return false;
  const hasAssigneeUid = Boolean(stage.assignee?.uid || stage.uid || stage.assignee);
  return hasAssigneeUid && stage.status !== 'WAITING_ASSIGNMENT';
};

/**
 * Kiểm tra hồ sơ có bị Chậm từ phía Tư Vấn Giám Sát (TVGS) hay không:
 * 1. Chậm giao: Quá 24h kể từ khi tạo phiếu mà TVGS Trưởng chưa giao cán bộ.
 * 2. Chậm duyệt: Cán bộ TVGS được giao quá hạn SLA mà chưa xác nhận ĐẠT.
 */
export const getShopTvgsOverdueInfo = (doc) => {
  if (!doc) return { isOverdue: false };
  if (doc.status === SHOP_STATUS.APPROVED || doc.status === SHOP_STATUS.REJECTED) {
    return { isOverdue: false };
  }

  // Nếu TVGS đã xác nhận ĐẠT thì TVGS không còn chậm
  if (doc.assignedTvgs?.status === 'ACCEPTED') {
    return { isOverdue: false };
  }

  const now = Date.now();
  const isTvgsAssigned = isStageAssigned(doc.assignedTvgs);

  // 1. Kiểm tra chậm giao việc (Hạn 1 ngày / 24h kể từ thời điểm tạo phiếu)
  if (!isTvgsAssigned) {
    const deadlineTime = doc.assignmentDeadline 
      ? new Date(doc.assignmentDeadline).getTime() 
      : (new Date(doc.createdAt || doc.submittedAt || Date.now()).getTime() + 24 * 60 * 60 * 1000);

    if (now > deadlineTime) {
      return { isOverdue: true, type: 'ASSIGNMENT', reason: 'TVGS Chậm giao' };
    }
    return { isOverdue: false };
  }

  // 2. Kiểm tra chậm duyệt (Quá hạn SLA của cán bộ TVGS)
  if (doc.assignedTvgs?.status === 'PENDING') {
    const tvgsDue = doc.assignedTvgs?.dueDate 
      ? new Date(doc.assignedTvgs.dueDate).getTime() 
      : (doc.dueDate ? new Date(doc.dueDate).getTime() : null);
    if (tvgsDue && now > tvgsDue) {
      return { isOverdue: true, type: 'REVIEW', reason: 'TVGS Chậm duyệt' };
    }
  }

  return { isOverdue: false };
};

/**
 * Kiểm tra hồ sơ có bị Chậm từ phía Ban Quản Lý Dự Án (Ban QLDA) hay không:
 * NGUYÊN TẮC TUẦN TỰ NỐI TIẾP:
 * - Bản vẽ hoàn công: Không qua Ban QLDA -> Không bao giờ chậm.
 * - Hồ sơ thông thường: CHỈ TÍNH HẠN KHI TVGS ĐÃ XÁC NHẬN ĐẠT!
 *   1. Chậm giao: Quá 24h kể từ thời điểm TVGS xác nhận Đạt mà Trưởng Ban QLDA chưa giao cán bộ.
 *   2. Chậm duyệt: Cán bộ Ban QLDA quá hạn SLA (tính từ thời điểm TVGS xác nhận Đạt) mà chưa phê duyệt.
 */
export const getShopInvestorOverdueInfo = (doc) => {
  if (!doc) return { isOverdue: false };
  if (doc.status === SHOP_STATUS.APPROVED || doc.status === SHOP_STATUS.REJECTED) {
    return { isOverdue: false };
  }

  // Nếu là Bản vẽ hoàn công -> không qua Ban QLDA
  if (isAsBuiltDoc(doc)) {
    return { isOverdue: false };
  }

  // Nếu Ban QLDA đã duyệt ĐẠT -> không chậm
  if (doc.assignedInvestor?.status === 'ACCEPTED') {
    return { isOverdue: false };
  }

  // ĐIỀU KIỆN TIÊN QUYẾT: TVGS phải duyệt ĐẠT trước thì Ban QLDA mới đến lượt xử lý!
  // Khi TVGS chưa duyệt đạt: Ban QLDA tuyệt đối KHÔNG bị tính là chậm
  if (doc.assignedTvgs?.status !== 'ACCEPTED') {
    return { isOverdue: false };
  }

  const now = Date.now();
  // Thời điểm TVGS xác nhận Đạt (mốc khởi đầu tính giờ cho Ban QLDA)
  const tvgsReviewedTime = doc.assignedTvgs?.reviewedAt 
    ? new Date(doc.assignedTvgs.reviewedAt).getTime() 
    : (doc.updatedAt ? new Date(doc.updatedAt).getTime() : now);

  const isInvestorAssigned = isStageAssigned(doc.assignedInvestor);

  // 1. Kiểm tra chậm giao: Trưởng Ban QLDA có 1 ngày (24h) kể từ khi TVGS duyệt đạt để chọn cán bộ
  if (!isInvestorAssigned) {
    const invAssignDeadline = tvgsReviewedTime + 24 * 60 * 60 * 1000;
    if (now > invAssignDeadline) {
      return { isOverdue: true, type: 'ASSIGNMENT', reason: 'Ban QLDA Chậm giao' };
    }
    return { isOverdue: false };
  }

  // 2. Kiểm tra chậm duyệt: Cán bộ Ban QLDA có số ngày SLA tính từ thời điểm TVGS duyệt đạt (hoặc từ lúc được phân công)
  if (doc.assignedInvestor?.status === 'PENDING') {
    const invSlaDays = Number(doc.assignedInvestor?.slaDays || doc.slaDays || 3);
    const invAssignedTime = doc.assignedInvestor?.assignedAt ? new Date(doc.assignedInvestor.assignedAt).getTime() : 0;
    const invStartTime = Math.max(tvgsReviewedTime, invAssignedTime);
    const invDueTime = doc.assignedInvestor?.dueDate && new Date(doc.assignedInvestor.dueDate).getTime() > invStartTime
      ? new Date(doc.assignedInvestor.dueDate).getTime()
      : (invStartTime + invSlaDays * 24 * 60 * 60 * 1000);

    if (now > invDueTime) {
      return { isOverdue: true, type: 'REVIEW', reason: 'Ban QLDA Chậm duyệt' };
    }
  }

  return { isOverdue: false };
};

/**
 * Kiểm tra hồ sơ có bị Chậm Phân Công hay không (hàm tương thích)
 */
export const isShopAssignmentOverdue = (doc) => {
  return getShopTvgsOverdueInfo(doc).type === 'ASSIGNMENT' || getShopInvestorOverdueInfo(doc).type === 'ASSIGNMENT';
};

/**
 * Kiểm tra hồ sơ có bị Chậm Phản Hồi (Quá hạn SLA) hay không (hàm tương thích)
 */
export const isShopReviewOverdue = (doc) => {
  return getShopTvgsOverdueInfo(doc).type === 'REVIEW' || getShopInvestorOverdueInfo(doc).type === 'REVIEW';
};

/**
 * Kiểm tra hồ sơ có bị Chậm (hàm tương thích ngược)
 */
export const isShopDocumentOverdue = (doc) => {
  return getShopTvgsOverdueInfo(doc).isOverdue || getShopInvestorOverdueInfo(doc).isOverdue;
};

/**
 * Lấy trạng thái hiển thị thực tế (tính toán realtime theo các mốc thời gian SLA tuần tự)
 */
export const getEffectiveShopStatus = (doc) => {
  if (!doc) return SHOP_STATUS.SENT;
  if (doc.status === SHOP_STATUS.APPROVED) return SHOP_STATUS.APPROVED;
  if (doc.status === SHOP_STATUS.REJECTED) return SHOP_STATUS.REJECTED;

  const isAsBuilt = isAsBuiltDoc(doc);

  // Nếu là Bản vẽ hoàn công: khi TVGS đã duyệt đạt thì đã hoàn thiện (APPROVED)
  if (isAsBuilt && doc.assignedTvgs?.status === 'ACCEPTED') {
    return SHOP_STATUS.APPROVED;
  }

  // 1. ƯU TIÊN KIỂM TRA CHẬM CỦA TVGS TRƯỚC (Vì TVGS là bước 1)
  const tvgsOverdue = getShopTvgsOverdueInfo(doc);
  if (tvgsOverdue.isOverdue) {
    return SHOP_STATUS.OVERDUE_TVGS;
  }

  // 2. NẾU TVGS CHƯA DUYỆT ĐẠT:
  if (doc.assignedTvgs?.status !== 'ACCEPTED') {
    if (!isStageAssigned(doc.assignedTvgs)) {
      return SHOP_STATUS.WAITING_ASSIGNMENT;
    }
    return SHOP_STATUS.SENT;
  }

  // 3. NẾU TVGS ĐÃ DUYỆT ĐẠT: KIỂM TRA BƯỚC BAN QLDA
  const investorOverdue = getShopInvestorOverdueInfo(doc);
  if (investorOverdue.isOverdue) {
    return SHOP_STATUS.OVERDUE_INVESTOR;
  }

  if (!isStageAssigned(doc.assignedInvestor)) {
    return SHOP_STATUS.WAITING_ASSIGNMENT;
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
    case SHOP_STATUS.OVERDUE_TVGS:
      return {
        label: 'TVGS Chậm',
        bg: '#fff1f2',
        color: '#e11d48',
        border: '#fecdd3',
        dotColor: '#f43f5e'
      };
    case SHOP_STATUS.OVERDUE_INVESTOR:
      return {
        label: 'Ban QLDA Chậm',
        bg: '#fdf2f8',
        color: '#be185d',
        border: '#fbcfe8',
        dotColor: '#ec4899'
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

/**
 * Trích xuất danh sách các phiên bản tệp đính kèm (v1, v2, v3...) của hồ sơ
 * Bảo toàn 100% tệp đính kèm v1 ban đầu và các lần sửa gửi lại tiếp theo
 */
export const getDocumentAttachmentVersions = (doc) => {
  if (!doc) return [];
  if (Array.isArray(doc.attachmentVersions) && doc.attachmentVersions.length > 0) {
    return doc.attachmentVersions;
  }
  const initialFiles = Array.isArray(doc.pdfFiles) && doc.pdfFiles.length > 0
    ? doc.pdfFiles
    : (doc.pdfFile ? [doc.pdfFile] : []);
  if (initialFiles.length > 0) {
    return [
      {
        version: 1,
        versionName: 'v1',
        label: 'Tệp đính kèm v1',
        title: 'Tệp đính kèm v1',
        createdAt: doc.createdAt || doc.submittedAt || new Date().toISOString(),
        createdByName: doc.createdByName || 'Đơn Vị Thi Công',
        files: initialFiles
      }
    ];
  }
  return [];
};


