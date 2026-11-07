// ============================================================================
// APCT PAYMENT DOCUMENTS CONSTANTS & SLA RULES
// Quản lý hồ sơ thanh toán, tạm ứng, quyết toán và thời hạn phản hồi
// ============================================================================

import { safeSaveLocalStorage } from '../utils/storageHelper';

export const PAYMENT_DOCUMENTS_STORAGE_KEY = 'apct_payment_documents';
export const PAYMENT_SLA_STORAGE_KEY = 'apct_payment_sla_configs';

// Cấu hình thời hạn phản hồi (SLA) mặc định theo 3 loại: Tạm ứng, Thanh toán, Quyết toán
export const DEFAULT_PAYMENT_SLA_CONFIGS = [
  {
    id: 'sla_tam_ung',
    typeCode: 'TAM_UNG',
    typeName: 'Tạm ứng',
    slaDays: 3,
    description: 'Hồ sơ đề nghị tạm ứng hợp đồng / thi công công trình'
  },
  {
    id: 'sla_thanh_toan',
    typeCode: 'THANH_TOAN',
    typeName: 'Thanh toán',
    slaDays: 3,
    description: 'Hồ sơ đề nghị thanh toán theo đợt / khối lượng hoàn thành'
  },
  {
    id: 'sla_quyet_toan',
    typeCode: 'QUYET_TOAN',
    typeName: 'Quyết toán',
    slaDays: 5,
    description: 'Hồ sơ đề nghị quyết toán giai đoạn / hoàn thành công trình'
  }
];

// Trạng thái hồ sơ thanh toán (tương tự 100% hồ sơ shop, phân biệt TVGS Chậm và Ban QLDA Chậm)
export const PAYMENT_STATUS = {
  WAITING_ASSIGNMENT: 'WAITING_ASSIGNMENT', // Chờ 2 Trưởng ban phân công cán bộ (Hạn 1 ngày)
  SENT: 'SENT',                            // Đã phân công - đang trong quá trình thẩm định & phê duyệt
  APPROVED: 'APPROVED',                    // Đã xác nhận - cả TVGS và Ban QLDA đều duyệt đạt
  REJECTED: 'REJECTED',                    // Cần sửa - bị yêu cầu chỉnh sửa (sẽ gửi lại trực tiếp người từ chối)
  OVERDUE_TVGS: 'OVERDUE_TVGS',           // TVGS Chậm (Chậm giao hoặc chậm duyệt)
  OVERDUE_INVESTOR: 'OVERDUE_INVESTOR',   // Ban QLDA Chậm (Chậm giao hoặc chậm duyệt)
  OVERDUE_ASSIGNMENT: 'OVERDUE_ASSIGNMENT',// Chậm phân công - Quá 1 ngày (24h) chưa chọn cán bộ
  OVERDUE_REVIEW: 'OVERDUE_REVIEW',        // Chậm phản hồi - Quá thời hạn SLA mà cán bộ chưa duyệt
  OVERDUE: 'OVERDUE'                       // Alias tương thích
};

/**
 * Tải cấu hình SLA từ localStorage hoặc lấy mặc định
 */
export const loadStoredPaymentSlaConfigs = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return DEFAULT_PAYMENT_SLA_CONFIGS;
  }
  try {
    const raw = localStorage.getItem(PAYMENT_SLA_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[Payment SLA Config] Lỗi đọc cấu hình SLA từ localStorage:', err);
  }
  return DEFAULT_PAYMENT_SLA_CONFIGS;
};

/**
 * Lưu cấu hình SLA vào localStorage
 */
export const saveStoredPaymentSlaConfigs = (configs) => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(PAYMENT_SLA_STORAGE_KEY, JSON.stringify(configs));
  } catch (err) {
    console.warn('[Payment SLA Config] Lỗi lưu cấu hình SLA:', err);
  }
};

/**
 * Tải danh sách hồ sơ thanh toán từ localStorage
 */
export const loadStoredPaymentDocuments = () => {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(PAYMENT_DOCUMENTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('[Payment Documents] Lỗi đọc danh sách hồ sơ thanh toán:', err);
  }
  return [];
};

/**
 * Lưu danh sách hồ sơ thanh toán an toàn vào LocalStorage & sao lưu IndexedDB
 */
export const saveStoredPaymentDocuments = (docs) => {
  if (typeof window === 'undefined') return;
  try {
    safeSaveLocalStorage(PAYMENT_DOCUMENTS_STORAGE_KEY, docs);
  } catch (err) {
    console.warn('[Payment Documents] Lỗi lưu danh sách hồ sơ thanh toán:', err);
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
 * Kiểm tra hồ sơ thanh toán có bị Chậm từ phía Tư Vấn Giám Sát (TVGS) hay không:
 * - Bước 1 của quy trình: TVGS nhận hồ sơ ngay khi tạo
 *   1. Chậm giao: Quá 24h kể từ khi tạo phiếu mà TVGS Trưởng chưa giao cán bộ
 *   2. Chậm duyệt: Cán bộ TVGS quá hạn SLA (dueDate) mà chưa xác nhận đạt hoặc yêu cầu sửa
 */
export const getPaymentTvgsOverdueInfo = (doc) => {
  if (!doc) return { isOverdue: false };
  if (doc.status === PAYMENT_STATUS.APPROVED || doc.status === PAYMENT_STATUS.REJECTED) {
    return { isOverdue: false };
  }

  // Nếu TVGS đã duyệt đạt -> TVGS không còn chậm
  if (doc.assignedTvgs?.status === 'ACCEPTED') {
    return { isOverdue: false };
  }

  const now = Date.now();
  const isTvgsAssigned = Boolean(doc.assignedTvgs?.assignee || doc.assignedTvgs?.uid);

  // 1. Kiểm tra chậm giao việc (Hạn 1 ngày / 24h kể từ khi tạo phiếu)
  if (!isTvgsAssigned || doc.assignedTvgs?.status === 'WAITING_ASSIGNMENT') {
    const deadlineTime = doc.assignmentDeadline 
      ? new Date(doc.assignmentDeadline).getTime() 
      : (new Date(doc.createdAt || doc.submittedAt || Date.now()).getTime() + 24 * 60 * 60 * 1000);
    if (now > deadlineTime) {
      return { isOverdue: true, type: 'ASSIGNMENT', reason: 'TVGS Chậm giao' };
    }
    return { isOverdue: false };
  }

  // 2. Kiểm tra chậm duyệt (Cán bộ TVGS được giao nhưng quá dueDate)
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
 * Kiểm tra hồ sơ thanh toán có bị Chậm từ phía Ban Quản Lý Dự Án (Ban QLDA) hay không:
 * NGUYÊN TẮC TUẦN TỰ NỐI TIẾP (CHUẨN XÁC THEO QUY TRÌNH & YÊU CẦU NGƯỜI DÙNG):
 * CHỈ TÍNH HẠN KHI TVGS ĐÃ XÁC NHẬN ĐẠT!
 * - Khi TVGS chưa duyệt đạt: Ban QLDA tuyệt đối KHÔNG bị tính là chậm (vẫn đang chờ TVGS duyệt trước).
 * - Khi TVGS đã duyệt đạt (mốc thời gian TVGS duyệt đạt là điểm bắt đầu tính giờ):
 *   1. Chậm giao: Quá 24h kể từ thời điểm TVGS xác nhận Đạt mà Trưởng Ban QLDA chưa giao cán bộ.
 *   2. Chậm duyệt: Cán bộ Ban QLDA quá hạn SLA (tính từ thời điểm TVGS xác nhận Đạt) mà chưa phê duyệt.
 */
export const getPaymentInvestorOverdueInfo = (doc) => {
  if (!doc) return { isOverdue: false };
  if (doc.status === PAYMENT_STATUS.APPROVED || doc.status === PAYMENT_STATUS.REJECTED) {
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

  const isInvestorAssigned = Boolean(doc.assignedInvestor?.assignee || doc.assignedInvestor?.uid);

  // 1. Kiểm tra chậm giao: Trưởng Ban QLDA có 1 ngày (24h) kể từ khi TVGS duyệt đạt để chọn cán bộ
  if (!isInvestorAssigned || doc.assignedInvestor?.status === 'WAITING_ASSIGNMENT') {
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
export const isPaymentAssignmentOverdue = (doc) => {
  return getPaymentTvgsOverdueInfo(doc).type === 'ASSIGNMENT' || getPaymentInvestorOverdueInfo(doc).type === 'ASSIGNMENT';
};

/**
 * Kiểm tra hồ sơ có bị Chậm Phản Hồi (Quá hạn SLA của cán bộ thẩm định) hay không
 */
export const isPaymentReviewOverdue = (doc) => {
  return getPaymentTvgsOverdueInfo(doc).type === 'REVIEW' || getPaymentInvestorOverdueInfo(doc).type === 'REVIEW';
};

/**
 * Kiểm tra hồ sơ có bị Chậm (hàm tương thích ngược)
 */
export const isPaymentDocumentOverdue = (doc) => {
  return getPaymentTvgsOverdueInfo(doc).isOverdue || getPaymentInvestorOverdueInfo(doc).isOverdue;
};

/**
 * Lấy trạng thái hiển thị thực tế (tính toán realtime theo các mốc thời gian SLA tuần tự)
 */
export const getEffectivePaymentStatus = (doc) => {
  if (!doc) return PAYMENT_STATUS.SENT;
  if (doc.status === PAYMENT_STATUS.APPROVED) return PAYMENT_STATUS.APPROVED;
  if (doc.status === PAYMENT_STATUS.REJECTED) return PAYMENT_STATUS.REJECTED;

  // 1. ƯU TIÊN KIỂM TRA CHẬM CỦA TVGS TRƯỚC (Vì TVGS là bước 1)
  const tvgsOverdue = getPaymentTvgsOverdueInfo(doc);
  if (tvgsOverdue.isOverdue) {
    return PAYMENT_STATUS.OVERDUE_TVGS;
  }

  // 2. NẾU TVGS CHƯA DUYỆT ĐẠT:
  if (doc.assignedTvgs?.status !== 'ACCEPTED') {
    const isTvgsAssigned = Boolean(doc.assignedTvgs?.assignee || doc.assignedTvgs?.uid);
    if (!isTvgsAssigned || doc.assignedTvgs?.status === 'WAITING_ASSIGNMENT') {
      return PAYMENT_STATUS.WAITING_ASSIGNMENT;
    }
    return PAYMENT_STATUS.SENT;
  }

  // 3. NẾU TVGS ĐÃ DUYỆT ĐẠT: KIỂM TRA BƯỚC BAN QLDA
  const investorOverdue = getPaymentInvestorOverdueInfo(doc);
  if (investorOverdue.isOverdue) {
    return PAYMENT_STATUS.OVERDUE_INVESTOR;
  }

  const isInvestorAssigned = Boolean(doc.assignedInvestor?.assignee || doc.assignedInvestor?.uid);
  if (!isInvestorAssigned || doc.assignedInvestor?.status === 'WAITING_ASSIGNMENT') {
    return PAYMENT_STATUS.WAITING_ASSIGNMENT;
  }

  return PAYMENT_STATUS.SENT;
};

/**
 * Thông tin chi tiết cấu hình màu sắc, nhãn cho từng trạng thái
 */
export const getPaymentStatusBadgeConfig = (status) => {
  switch (status) {
    case PAYMENT_STATUS.APPROVED:
      return {
        label: 'Đã xác nhận',
        bg: '#ecfdf5',
        color: '#059669',
        border: '#a7f3d0',
        dotColor: '#10b981'
      };
    case PAYMENT_STATUS.REJECTED:
      return {
        label: 'Cần sửa',
        bg: '#fef2f2',
        color: '#dc2626',
        border: '#fecaca',
        dotColor: '#ef4444'
      };
    case PAYMENT_STATUS.WAITING_ASSIGNMENT:
      return {
        label: 'Chờ phân công',
        bg: '#fffbeb',
        color: '#b45309',
        border: '#fde68a',
        dotColor: '#f59e0b'
      };
    case PAYMENT_STATUS.OVERDUE_TVGS:
      return {
        label: 'TVGS Chậm',
        bg: '#fff1f2',
        color: '#e11d48',
        border: '#fecdd3',
        dotColor: '#f43f5e'
      };
    case PAYMENT_STATUS.OVERDUE_INVESTOR:
      return {
        label: 'Ban QLDA Chậm',
        bg: '#fdf2f8',
        color: '#be185d',
        border: '#fbcfe8',
        dotColor: '#ec4899'
      };
    case PAYMENT_STATUS.OVERDUE_ASSIGNMENT:
      return {
        label: 'Chậm phân công',
        bg: '#fdf2f8',
        color: '#be185d',
        border: '#fbcfe8',
        dotColor: '#ec4899'
      };
    case PAYMENT_STATUS.OVERDUE_REVIEW:
    case PAYMENT_STATUS.OVERDUE:
      return {
        label: 'Chậm phản hồi',
        bg: '#fff1f2',
        color: '#e11d48',
        border: '#fecdd3',
        dotColor: '#f43f5e'
      };
    case PAYMENT_STATUS.SENT:
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
 * Tìm Tư vấn giám sát trưởng tiếp nhận hồ sơ thanh toán (Dữ liệu chính thức: Đinh Xuân Thám)
 */
export const getPaymentLeadSupervisor = (users = []) => {
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
 * Tìm Trưởng Ban Quản lý dự án tiếp nhận hồ sơ thanh toán (Dữ liệu chính thức: Ngô Quý Linh)
 */
export const getPaymentLeadInvestor = (users = []) => {
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


