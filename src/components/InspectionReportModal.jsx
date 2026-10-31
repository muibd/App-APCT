import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  X, Printer, CheckCircle2, ShieldCheck, Camera, MapPin, Clock, 
  Download, PenTool, AlertCircle, AlertTriangle, Trash2, ImagePlus, 
  Zap, RotateCcw, FileWarning, Eye, User, Wrench, Send, ChevronRight, XCircle,
  ArrowLeftRight, Calendar, ArrowRight, Ban, UserCheck, FileText, Check
} from 'lucide-react';
import { STANDARD_CRITERIA_LIST, getContractorChief } from '../data/mockData';
import { getSuggestedStandards, GENERAL_MANDATORY_STANDARDS } from '../data/standardsRules';
import { triggerSafeConfetti } from '../utils/confettiHelper';
import { compressImageFile } from '../utils/storageHelper';
import { generateDocumentCode, getDocumentRevisionNumber } from '../data/projectCatalog';



const COMMON_DEFECT_CHIPS = [
  'Cốt thép sai khoảng cách, đai dầm a200 thay vì a150',
  'Thiếu con kê lớp bê tông bảo vệ (dưới 25mm)',
  'Sai lệch tim trục định vị dầm/cột vượt dung sai cho phép',
  'Cốp pha hở mép, rò rỉ nước xi măng, chưa vệ sinh sạch',
  'Thiếu thép tăng cường vị trí gối dầm và lỗ mở sàn',
  'Chưa có kết quả thí nghiệm nén mẫu / chứng chỉ xuất xưởng'
];

const COMMON_RECTIFIED_CHIPS = [
  'Đã nắn chỉnh lại khoảng cách đai thép đúng a150 theo thiết kế',
  'Đã kê bổ sung đầy đủ con kê bê tông bảo vệ đạt độ dày 25mm',
  'Đã kiểm tra lại tim trục định vị dầm cột bằng máy toàn đạc Leica đạt dung sai',
  'Đã bịt kín các khe hở cốp pha và dọn sạch mạt sắt, rác trước khi đổ bê tông',
  'Đã bổ sung chứng chỉ xuất xưởng và kết quả thí nghiệm nén mẫu bê tông'
];

export default function InspectionReportModal({ 
  isOpen, 
  onClose, 
  report, 
  request = null,
  currentRole, 
  currentUser,
  users = [],
  requests = [],
  standardsData = null,
  projects = [],
  docTypes = [],
  onSaveReport,
  onRejectReport,
  onReinspectReport,
  onResubmitReport,
  initialOpenRectify = false,
  initialTab = null,
  showAlert,
  onReassign
}) {
  // Tabs: 'INVITATION' | 'DOCUMENT' | 'EVIDENCE' | 'DEFECTS' | 'RECTIFIED'
  const isInitiallyRectified = report?.status === 'RECTIFIED';
  const [activeTab, setActiveTab] = useState(
    initialTab || (isInitiallyRectified ? 'RECTIFIED' : 'INVITATION')
  );
  const [reportState, setReportState] = useState(report || {});

  // Digital Signatures state for 3 parties
  const [signatures, setSignatures] = useState({
    investor: report?.attendees?.investor?.signed || false,
    supervisor: report?.attendees?.supervisor?.signed || false,
    contractor: report?.attendees?.contractor?.signed || true
  });

  const isMaterialReport = Boolean(
    report?.reportTemplate === 'FORM_12' || 
    report?.inspectionType === 'MATERIAL' ||
    reportState?.reportTemplate === 'FORM_12' ||
    reportState?.inspectionType === 'MATERIAL'
  );

  const rawMaterialsList = (reportState?.materials && reportState.materials.length > 0)
    ? reportState.materials
    : (report?.materials && report.materials.length > 0)
      ? report.materials
      : (reportState?.materialDetails?.materials && reportState.materialDetails.materials.length > 0)
        ? reportState.materialDetails.materials
        : (report?.materialDetails?.materials && report.materialDetails.materials.length > 0)
          ? report.materialDetails.materials
          : reportState?.materialDetails?.name
            ? [{
                name: reportState.materialDetails.name,
                origin: reportState.materialDetails.origin || 'Nhà máy sản xuất chính hãng',
                unit: reportState.materialDetails.unit || 'Lô',
                quantity: reportState.materialDetails.quantity || '01 Lô',
                certificateNumber: reportState.materialDetails.certificateNumber || 'Số CCXX-2026/VL-APG'
              }]
            : [{
                name: reportState?.inspectionObject?.replace(/^Nghiệm thu vật liệu đầu vào:\s*/i, '') || 'Vật tư thi công',
                origin: 'Nhà máy sản xuất chính hãng',
                unit: 'Lô',
                quantity: '01 Lô nghiệm thu',
                certificateNumber: 'Số CCXX-2026/VL-APG'
              }];

  const [selectedStandards, setSelectedStandards] = useState(() => {
    if (report?.standardsApplied && Array.isArray(report.standardsApplied) && report.standardsApplied.length > 0) {
      return report.standardsApplied;
    }
    return getSuggestedStandards(
      report?.inspectionObject || report?.projectInfo?.itemName || '', 
      (report?.reportTemplate === 'FORM_12' || report?.inspectionType === 'MATERIAL') ? 'MATERIAL' : 'WORK',
      standardsData?.works,
      standardsData?.materials,
      standardsData?.mandatory
    );
  });

  // Modal Từ chối nghiệm thu state
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState(reportState?.conclusion?.rejectionReason || '');
  const [repairRequired, setRepairRequired] = useState(reportState?.conclusion?.repairRequired || '');
  const [repairDeadline, setRepairDeadline] = useState(reportState?.conclusion?.deadline || 'Trước 17h00 ngày hôm nay');
  const [defectPhotos, setDefectPhotos] = useState(reportState?.defectPhotos || []);

  // Modal Báo cáo khắc phục lỗi (Dành cho ĐVTC)
  const [isRectifyModalOpen, setIsRectifyModalOpen] = useState(Boolean(initialOpenRectify));
  const [rectifyDesc, setRectifyDesc] = useState(reportState?.rectification?.description || '');
  const [rectifyPhotos, setRectifyPhotos] = useState(reportState?.rectification?.photos || []);
  const [evidencePhotos, setEvidencePhotos] = useState(report?.evidencePhotos || reportState?.evidencePhotos || []);

  const getInitialRectifyDate = () => {
    if (reportState?.rectification?.suggestedDate && /^\d{4}-\d{2}-\d{2}$/.test(reportState.rectification.suggestedDate)) {
      return reportState.rectification.suggestedDate;
    }
    const rawTime = reportState?.rectification?.suggestedTime || '';
    const match = rawTime.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (match) {
      return `${match[3]}-${match[2]}-${match[1]}`;
    }
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getInitialRectifyTime = () => {
    if (reportState?.rectification?.suggestedHour && /^\d{1,2}:\d{2}$/.test(reportState.rectification.suggestedHour)) {
      return reportState.rectification.suggestedHour.padStart(5, '0');
    }
    const rawTime = reportState?.rectification?.suggestedTime || '';
    const match = rawTime.match(/(\d{1,2})[h:](\d{2})/i);
    if (match) {
      return `${match[1].padStart(2, '0')}:${match[2]}`;
    }
    return '16:30';
  };

  const [rectifyDate, setRectifyDate] = useState(getInitialRectifyDate);
  const [rectifyTime, setRectifyTime] = useState(getInitialRectifyTime);
  const [suggestedTime, setSuggestedTime] = useState(reportState?.rectification?.suggestedTime || '16h30 ngày hôm nay');

  // Ngày phê duyệt HSTK BVTC & Số biện pháp thi công cho phép chỉnh sửa
  const [designApprovalDate, setDesignApprovalDate] = useState(
    reportState?.designApprovalDate || report?.designApprovalDate || '16/12/2025'
  );
  const [constructionMethodCode, setConstructionMethodCode] = useState(
    reportState?.constructionMethodCode || report?.constructionMethodCode || '01/BPTC-APG'
  );

  // Helper tính toán ngày giờ nghiệm thu chuẩn theo thông tin người dùng chọn lúc tạo
  // Bắt đầu: {HH}h{mm}, ngày {D} tháng {M} năm {YYYY}
  // Kết thúc tự động: {HH}h{mm} + 30 phút, ngày {D} tháng {M} năm {YYYY}
  const getAutoInspectionTimes = (req, rep) => {
    let hour = 13;
    let min = 30;
    let day = 26;
    let month = 10;
    let year = 2026;

    const dateCandidates = [
      req?.scheduledDate,
      req?.startTime,
      req?.scheduledTime,
      rep?.time?.startTime,
      rep?.date,
      rep?.cityDate,
      req?.createdAt,
      rep?.createdAt
    ];

    let dateFound = false;
    for (const cand of dateCandidates) {
      if (!cand || typeof cand !== 'string') continue;
      const isoMatch = cand.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (isoMatch) {
        year = parseInt(isoMatch[1], 10);
        month = parseInt(isoMatch[2], 10);
        day = parseInt(isoMatch[3], 10);
        dateFound = true;
        break;
      }
      const dmyMatch = cand.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (dmyMatch) {
        day = parseInt(dmyMatch[1], 10);
        month = parseInt(dmyMatch[2], 10);
        year = parseInt(dmyMatch[3], 10);
        dateFound = true;
        break;
      }
      const textMatch = cand.match(/ngày\s*(\d{1,2})\s*tháng\s*(\d{1,2})\s*năm\s*(\d{4})/i);
      if (textMatch) {
        day = parseInt(textMatch[1], 10);
        month = parseInt(textMatch[2], 10);
        year = parseInt(textMatch[3], 10);
        dateFound = true;
        break;
      }
    }

    if (!dateFound) {
      const d = new Date(req?.createdAt || rep?.createdAt || Date.now());
      day = d.getDate();
      month = d.getMonth() + 1;
      year = d.getFullYear();
    }

    const timeCandidates = [
      req?.startTime,
      req?.scheduledTime,
      rep?.time?.startTime,
      req?.createdAt,
      rep?.createdAt
    ];

    let timeFound = false;
    for (const cand of timeCandidates) {
      if (!cand || typeof cand !== 'string') continue;
      const timeMatch = cand.match(/(\d{1,2})[h:](\d{2})/i);
      if (timeMatch) {
        hour = parseInt(timeMatch[1], 10);
        min = parseInt(timeMatch[2], 10);
        timeFound = true;
        break;
      }
    }

    if (!timeFound) {
      const d = new Date(req?.createdAt || rep?.createdAt || Date.now());
      hour = d.getHours();
      min = d.getMinutes();
    }

    // Giờ kết thúc tự động = giờ bắt đầu + 30 phút
    const startTotalMin = hour * 60 + min;
    const endTotalMin = startTotalMin + 30;
    const endHour = Math.floor(endTotalMin / 60) % 24;
    const endMin = endTotalMin % 60;

    const pad = (n) => String(n).padStart(2, '0');
    const startStr = `${pad(hour)}h${pad(min)}, ngày ${day} tháng ${month} năm ${year}`;
    const endStr = `${pad(endHour)}h${pad(endMin)}, ngày ${day} tháng ${month} năm ${year}`;

    return { startStr, endStr };
  };

  const isPlaceholderTime = (txt) => {
    if (!txt || typeof txt !== 'string') return true;
    return txt.includes('...h...') || txt.includes('....tháng') || txt.includes('...tháng') || txt.includes('202...') || txt.trim() === '';
  };

  const matchedInitialReq = (requests || []).find(r => 
    (reportState?.requestId && r.id === reportState.requestId) || 
    (reportState?.id && (r.reportId === reportState.id || r.id === reportState.id)) ||
    (reportState?.requestNumber && r.requestNumber === reportState.requestNumber)
  );

  const initialTimes = getAutoInspectionTimes(matchedInitialReq, reportState || report);

  // Thời gian nghiệm thu chuẩn theo thông tin người dùng chọn lúc tạo:
  // Bắt đầu: {HH}h{mm}, ngày {D} tháng {M} năm {YYYY} (Ví dụ: 13h30, ngày 26 tháng 10 năm 2026)
  // Kết thúc auto = Giờ bắt đầu + 30 phút (Ví dụ: 14h00, ngày 26 tháng 10 năm 2026)
  const [startTimeText, setStartTimeText] = useState(() => {
    const saved = reportState?.time?.startTimeText || report?.time?.startTimeText;
    if (saved && !isPlaceholderTime(saved)) return saved;
    return initialTimes.startStr;
  });
  const [endTimeText, setEndTimeText] = useState(() => {
    const saved = reportState?.time?.endTimeText || report?.time?.endTimeText;
    if (saved && !isPlaceholderTime(saved)) return saved;
    return initialTimes.endStr;
  });

  const handleUpdateStartTimeText = (val) => {
    const trimmed = (val || '').trim();
    if (!trimmed) return;
    setStartTimeText(trimmed);

    // Tự động tính lại giờ kết thúc = giờ bắt đầu mới + 30 phút
    let updatedEnd = endTimeText;
    const timeMatch = trimmed.match(/(\d{1,2})[h:](\d{2})/i);
    const dateMatch = trimmed.match(/ngày\s*(\d{1,2})\s*tháng\s*(\d{1,2})\s*năm\s*(\d{4})/i);
    if (timeMatch) {
      const h = parseInt(timeMatch[1], 10);
      const m = parseInt(timeMatch[2], 10);
      const total = h * 60 + m + 30;
      const endH = Math.floor(total / 60) % 24;
      const endM = total % 60;
      const pad = (n) => String(n).padStart(2, '0');
      if (dateMatch) {
        updatedEnd = `${pad(endH)}h${pad(endM)}, ngày ${dateMatch[1]} tháng ${dateMatch[2]} năm ${dateMatch[3]}`;
      } else {
        updatedEnd = `${pad(endH)}h${pad(endM)}${trimmed.includes(',') ? trimmed.substring(trimmed.indexOf(',')) : ''}`;
      }
      setEndTimeText(updatedEnd);
    }

    const updated = {
      ...reportState,
      time: {
        ...(reportState.time || {}),
        startTimeText: trimmed,
        endTimeText: updatedEnd
      }
    };
    setReportState(updated);
    if (onSaveReport) onSaveReport(updated);
  };

  const handleUpdateEndTimeText = (val) => {
    const trimmed = (val || '').trim();
    if (!trimmed) return;
    setEndTimeText(trimmed);
    const updated = {
      ...reportState,
      time: {
        ...(reportState.time || {}),
        endTimeText: trimmed
      }
    };
    setReportState(updated);
    if (onSaveReport) onSaveReport(updated);
  };

  const handleUpdateDesignApprovalDate = (val) => {
    setDesignApprovalDate(val);
    const updated = { ...reportState, designApprovalDate: val };
    setReportState(updated);
    if (onSaveReport) onSaveReport(updated);
  };

  const handleUpdateConstructionMethodCode = (val) => {
    setConstructionMethodCode(val);
    const updated = { ...reportState, constructionMethodCode: val };
    setReportState(updated);
    if (onSaveReport) onSaveReport(updated);
  };

  // Kiểm tra trạng thái ký số độc lập của 3 bên
  const isSupervisorSigned = Boolean(signatures?.supervisor || reportState?.attendees?.supervisor?.signed);
  const isInvestorSigned = Boolean(signatures?.investor || reportState?.attendees?.investor?.signed);
  const isContractorSigned = Boolean(signatures?.contractor || reportState?.attendees?.contractor?.signed !== false);

  // Trạng thái hoàn tất nghiệm thu đủ điều kiện:
  // CHỈ hoàn tất khi status là 'COMPLETED' HOẶC cả 3 bên độc lập đều đã ký số!
  const isCompleted = 
    reportState?.status === 'COMPLETED' || 
    report?.status === 'COMPLETED' || 
    (isSupervisorSigned && isInvestorSigned && isContractorSigned);

  // Trạng thái chờ CĐT phê duyệt (sau khi TVGS đã duyệt đạt):
  const isWaitingInvestor = !isCompleted && (
    reportState?.status === 'WAITING_INVESTOR' ||
    report?.status === 'WAITING_INVESTOR' ||
    (isSupervisorSigned && !isInvestorSigned && reportState?.conclusion?.isAccepted !== false)
  );

  // Trạng thái từ chối & đã sửa chữa (CHỈ KHI CHƯA HOÀN THÀNH VÀ CHƯA ĐƯỢC DUYỆT ĐẠT):
  const isRectified = !isCompleted && !isWaitingInvestor && (
    reportState?.status === 'RECTIFIED' || 
    report?.status === 'RECTIFIED'
  );
  const isRejected = !isCompleted && !isWaitingInvestor && !isRectified && (
    reportState?.status === 'REJECTED' || 
    report?.status === 'REJECTED' ||
    reportState?.conclusion?.isAccepted === false
  );
  const rejectionInfo = reportState?.conclusion?.rejectedBy || null;

  // Phân biệt vai trò và quyền duyệt / hủy ("xác nhận/hủy những phiếu mà mình là người duyệt"):
  const isAdmin = currentRole === 'ADMIN';
  const isSupervisorRole = currentRole === 'SUPERVISOR' || currentRole === 'LEAD_SUPERVISOR';
  const isInvestorRole = currentRole === 'INVESTOR' || currentRole === 'LEAD_INVESTOR';

  // Lấy yêu cầu nghiệm thu tương ứng (nếu có) để truy xuất danh sách cán bộ được chọn
  const relatedRequest = request || (requests || []).find(r => 
    (reportState.requestId && r.id === reportState.requestId) || 
    (reportState.id && (r.reportId === reportState.id || r.id === reportState.id)) ||
    (reportState.inspectionObject && r.taskContent && reportState.inspectionObject.trim() === r.taskContent.trim())
  );

  const isCancelled = reportState?.status === 'CANCELLED' || relatedRequest?.status === 'CANCELLED';

  const docCode = isMaterialReport ? 'MI' : 'WA';
  const projCode = reportState.projectCode || relatedRequest?.projectCode || (
    (reportState.projectInfo?.buildingName || '').includes('2204') || (reportState.projectInfo?.buildingName || '').includes('cao tầng') ? '2204' : '2203'
  );

  // Chuẩn hóa số biên bản: WA hoặc MI (hoặc [Số]/WA, [Số]/MI nếu có số thứ tự), tuyệt đối không để IR hoặc ...... IR
  const cleanReportNum = (() => {
    let raw = (reportState.reportNumber || '').trim();
    raw = raw.replace(/^\.\.\.\.\.\.\s*/, '').replace(/^\.\.\.\s*/, '').trim();
    raw = raw.replace(/^IR[\/\s-]*/i, '').replace(/[\/\s-]IR$/i, '').trim();
    if (!raw || raw === '......' || raw === 'IR' || raw === docCode) {
      return docCode;
    }
    if (!raw.includes(docCode)) {
      return `${raw}/${docCode}`;
    }
    return raw;
  })();

  // Chuẩn hóa số tài liệu căn cứ: [Mã CT]/[WA hoặc MI]/[ddMMyy]-[Lần sửa].01 (VD: 2203/WA/241026-01.01, sửa xong gửi lại tăng lên 02.01, 03.01...)
  // Loại bỏ hoàn toàn mã cũ dạng TLCC-...
  const cleanRefCode = (() => {
    const rev = getDocumentRevisionNumber(reportState, relatedRequest);
    const revStr = String(rev).padStart(2, '0');

    const rawRef = (reportState.projectCategoryCode || reportState.referenceDocNumber || relatedRequest?.projectCategoryCode || '').trim();
    if (rawRef && !rawRef.startsWith('TLCC') && !rawRef.includes('TLCC') && rawRef.includes('/')) {
      const baseRef = rawRef.replace(/\/(IR|MI|WA)\//, `/${docCode}/`);
      if (/-\d+(\.\d+)?$/.test(baseRef)) {
        return baseRef.replace(/-\d+(\.\d+)?$/, `-${revStr}.01`);
      }
      return `${baseRef}-${revStr}.01`;
    }
    return generateDocumentCode(
      projCode,
      docCode,
      reportState.createdAt || new Date(),
      rev
    );
  })();

  // Chuẩn hóa số Phiếu yêu cầu nghiệm thu (của nhà thầu thi công) dùng làm tài liệu căn cứ:
  // Định dạng chuẩn: [Mã công trình]/IR/[ddMMyy]-[Lần sửa].01 (Ví dụ: 2203/IR/241026-01.01, sửa xong gửi lại tăng lên 02.01, 03.01...)
  const cleanReqCode = (() => {
    const rev = getDocumentRevisionNumber(reportState, relatedRequest);
    const revStr = String(rev).padStart(2, '0');

    const updateRevSuffix = (code) => {
      if (!code) return '';
      const trimmed = code.trim();
      if (/-\d+(\.\d+)?$/.test(trimmed)) {
        return trimmed.replace(/-\d+(\.\d+)?$/, `-${revStr}.01`);
      }
      return `${trimmed}-${revStr}.01`;
    };

    const reqRef = (relatedRequest?.referenceDocNumber || relatedRequest?.projectCategoryCode || '').trim();
    if (reqRef && !reqRef.startsWith('TLCC') && !reqRef.includes('TLCC') && reqRef.includes('/')) {
      const baseRef = reqRef.replace(/\/(WA|MI)\//, '/IR/');
      return updateRevSuffix(baseRef);
    }

    const repRef = (reportState.referenceDocNumber || reportState.projectCategoryCode || '').trim();
    if (repRef && !repRef.startsWith('TLCC') && !repRef.includes('TLCC') && repRef.includes('/')) {
      const baseRef = repRef.replace(/\/(WA|MI)\//, '/IR/');
      return updateRevSuffix(baseRef);
    }

    const rawReq = (relatedRequest?.requestNumber || reportState.requestNumber || '').trim();
    const cleanRaw = rawReq.replace(/^\.\.\.\.\.\.\s*/, '').replace(/^\.\.\.\s*/, '').trim();
    if (cleanRaw && cleanRaw.includes('/') && cleanRaw !== 'IR' && cleanRaw !== '...... IR') {
      return updateRevSuffix(cleanRaw);
    }

    return generateDocumentCode(
      projCode,
      'IR',
      relatedRequest?.createdAt || reportState.createdAt || new Date(),
      rev
    );
  })();

  // Số biên bản nghiệm thu: Lấy mã số đầy đủ (nhấc số ở dưới lên: ví dụ 2203/WA/261026-01.01 hoặc 2203/MI/261026-01.01)
  const reportDisplayNumber = (() => {
    let raw = (reportState.reportNumber || '').trim();
    raw = raw.replace(/^\.\.\.\.\.\.\s*/, '').replace(/^\.\.\.\s*/, '').trim();
    if (raw && raw.includes('/') && raw !== docCode && raw !== 'IR' && !raw.startsWith('......')) {
      return raw;
    }
    return cleanRefCode;
  })();

  // Tự động đồng bộ giờ nghiệm thu khi nạp phiếu liên quan
  useEffect(() => {
    const autoTimes = getAutoInspectionTimes(relatedRequest, reportState);
    if (isPlaceholderTime(startTimeText)) {
      setStartTimeText(autoTimes.startStr);
      handleUpdateStartTimeText(autoTimes.startStr);
    }
    if (isPlaceholderTime(endTimeText)) {
      setEndTimeText(autoTimes.endStr);
      handleUpdateEndTimeText(autoTimes.endStr);
    }
  }, [relatedRequest?.id, reportState?.id, reportState?.time?.startTime, relatedRequest?.scheduledTime]);

  const effectiveAssignedRecipients = (reportState.assignedRecipients && reportState.assignedRecipients.length > 0)
    ? reportState.assignedRecipients
    : (relatedRequest?.assignedRecipients || []);

  const assignedInv = effectiveAssignedRecipients.find(r => r.role === 'INVESTOR' || r.role === 'LEAD_INVESTOR') || reportState.attendees?.investor;
  const assignedSup = effectiveAssignedRecipients.find(r => r.role === 'SUPERVISOR' || r.role === 'LEAD_SUPERVISOR') || reportState.attendees?.supervisor;

  const cleanContractorCompany = (rawComp, personName, uid) => {
    // 1. Ưu tiên cao nhất: Lấy trực tiếp từ tên công ty đã lưu trên phiếu/biên bản
    if (rawComp && !rawComp.includes('An Phú Gia') && rawComp.trim().length > 3) {
      return rawComp.trim();
    }

    // 2. Tra cứu trực tiếp người tạo trong danh sách tài khoản người dùng (users)
    const effectiveUid = uid || relatedRequest?.createdByUid || reportState.createdByUid;
    const effectiveName = personName || relatedRequest?.createdByName || reportState.attendees?.contractor?.person;
    const foundUser = (users || []).find(u => 
      (effectiveUid && u.uid === effectiveUid) || 
      (effectiveName && (u.fullName || '').trim().toLowerCase() === (effectiveName || '').trim().toLowerCase())
    );
    if (foundUser?.company && !foundUser.company.includes('An Phú Gia')) {
      return foundUser.company;
    }

    // 3. Nếu người dùng đang đăng nhập có thông tin công ty ĐVTC
    if (currentUser?.company && !currentUser.company.includes('An Phú Gia') && (currentUser.uid === effectiveUid || currentRole === 'CONTRACTOR')) {
      return currentUser.company;
    }

    return 'Công ty TNHH Gia Huy Vĩnh Phúc';
  };

  const formatReportLocation = (loc) => {
    if (!loc || loc.includes('Thường Thạnh') || loc.includes('Quận Cái Răng')) {
      return 'Phường Cái Răng - TP. Cần Thơ';
    }
    return loc;
  };

  const effectiveRequestContCompany = cleanContractorCompany(
    relatedRequest?.contractorCompany || reportState.contractorCompany || reportState.attendees?.contractor?.company,
    relatedRequest?.createdByName || reportState.attendees?.contractor?.person,
    relatedRequest?.createdByUid || reportState.createdByUid
  );

  const effectiveRequest = {
    ...(relatedRequest || {}),
    id: relatedRequest?.id || reportState.requestId || reportState.id,
    requestNumber: cleanReqCode,
    projectName: relatedRequest?.projectName || reportState.projectInfo?.projectName || 'Đầu tư xây dựng nhà ở Phường Thường Thạnh - An Phú Eco City',
    buildingName: relatedRequest?.buildingName || reportState.projectInfo?.buildingName || 'Chung cư nhà ở xã hội 2',
    itemName: relatedRequest?.itemName || reportState.projectInfo?.itemName || reportState.projectInfo?.packageName || 'Thi công hệ thống PCCC trong và ngoài nhà',
    packageName: relatedRequest?.packageName || reportState.projectInfo?.packageName,
    location: formatReportLocation(relatedRequest?.location || reportState.projectInfo?.location || reportState.location),
    contractorCompany: effectiveRequestContCompany,
    taskContent: relatedRequest?.taskContent || reportState.inspectionObject || 'Nghiệm thu công việc xây dựng',
    inspectionType: (relatedRequest?.inspectionType || reportState.inspectionType) === 'MATERIAL' ? 'MATERIAL' : 'WORK',
    materials: relatedRequest?.materials || rawMaterialsList,
    scheduledTime: relatedRequest?.scheduledTime || (reportState.time ? `${reportState.time} ${reportState.date || ''}`.trim() : (reportState.date || 'Theo thông báo')),
    scheduledDate: relatedRequest?.scheduledDate || reportState.date,
    inspectionPlace: relatedRequest?.inspectionPlace || reportState.location || 'Dự án Đầu tư xây dựng nhà ở Phường Thường Thạnh - An Phú Eco City',
    createdByName: relatedRequest?.createdByName || reportState.attendees?.contractor?.person || 'KS. Trần Văn Trung',
    createdByRole: relatedRequest?.createdByRole || reportState.attendees?.contractor?.position || 'Kỹ thuật hiện trường',
    createdAt: relatedRequest?.createdAt || reportState.createdAt || new Date(),
    assignedRecipients: effectiveAssignedRecipients,
    evidencePhotos: evidencePhotos
  };

  const createdTimeFormatted = (() => {
    try {
      const dt = new Date(effectiveRequest.createdAt || Date.now());
      if (isNaN(dt.getTime())) return 'Hôm nay';
      const timeStr = dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const dateStr = dt.toLocaleDateString('vi-VN');
      return `${timeStr} ngày ${dateStr}`;
    } catch {
      return 'Hôm nay';
    }
  })();

  const invitationCityDate = (() => {
    try {
      const dt = new Date(effectiveRequest.createdAt || reportState.createdAt || Date.now());
      if (isNaN(dt.getTime())) return 'Cần Thơ, ngày 27 tháng 10 năm 2026';
      return `Cần Thơ, ngày ${String(dt.getDate()).padStart(2, '0')} tháng ${String(dt.getMonth() + 1).padStart(2, '0')} năm ${dt.getFullYear()}`;
    } catch {
      return 'Cần Thơ, ngày 27 tháng 10 năm 2026';
    }
  })();

  const invitationScheduledTimeFormatted = (() => {
    const raw = (effectiveRequest.scheduledTime || '').trim();
    if (!raw) return '........ giờ ........ ngày ........ tháng ........ năm 20...';
    const m = raw.match(/(\d{1,2})[:h](\d{2})\s*(?:ngày|,)?\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i);
    if (m) {
      const hh = m[1];
      const mm = m[2];
      const dd = m[3];
      const MM = m[4];
      const yyyy = m[5];
      return `${hh} giờ ${mm} ngày ${dd} tháng ${MM} năm ${yyyy}`;
    }
    const mt = raw.match(/(\d{1,2})[:h](\d{2})/);
    const md = raw.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (mt && md) {
      return `${mt[1]} giờ ${mt[2]} ngày ${md[1]} tháng ${md[2]} năm ${md[3]}`;
    }
    if (raw.includes('giờ') && raw.includes('ngày')) {
      return raw;
    }
    return raw;
  })();

  const assignedSupCompany = assignedSup?.company || 'Công ty CP Tư vấn Xây dựng và Thương mại GELICON';
  const assignedInvCompany = assignedInv?.company || 'Ban QLDA - Công ty TNHH An Phú Cần Thơ';

  // Lãnh đạo các bên từ danh sách users
  const leadInvUser = (users || []).find(u => u.role === 'LEAD_INVESTOR') || { fullName: 'Ngô Quý Linh', position: 'Trưởng Ban QLDA', company: 'Công ty TNHH An Phú Cần Thơ' };
  const leadSupUser = (users || []).find(u => u.role === 'LEAD_SUPERVISOR') || { fullName: 'Đinh Xuân Thám', position: 'Tư vấn giám sát trưởng', company: 'Công ty CP TVXD và TM GELICON' };

  // a) Đại diện Chủ đầu tư
  const invCompany = assignedInv?.company || reportState.attendees?.investor?.company || leadInvUser.company || 'Công ty TNHH An Phú Cần Thơ';
  const invLeadName = reportState.attendees?.investor?.leadPerson || leadInvUser.fullName;
  const invLeadPosition = reportState.attendees?.investor?.leadPosition || leadInvUser.position;
  const invOfficerName = assignedInv?.fullName || reportState.attendees?.investor?.person || 'Bành Nguyễn Hậu';
  const invOfficerPosition = assignedInv?.position || reportState.attendees?.investor?.position || 'Cán bộ ban QLDA';

  // b) Tư vấn giám sát
  const supCompany = assignedSup?.company || reportState.attendees?.supervisor?.company || leadSupUser.company || 'Công ty CP TVXD và TM GELICON';
  const supLeadName = reportState.attendees?.supervisor?.leadPerson || leadSupUser.fullName;
  const supLeadPosition = reportState.attendees?.supervisor?.leadPosition || leadSupUser.position;
  const supOfficerName = assignedSup?.fullName || reportState.attendees?.supervisor?.person || 'Võ Văn Tón';
  const supOfficerPosition = assignedSup?.position || reportState.attendees?.supervisor?.position || 'Cán bộ tư vấn giám sát';

  // c) Đơn vị thi công: Luôn lấy chuẩn xác Chỉ huy trưởng theo công ty nhà thầu, không lấy Chỉ huy phó
  const contCompany = cleanContractorCompany(
    reportState.attendees?.contractor?.company || reportState.contractorCompany || relatedRequest?.contractorCompany,
    reportState.attendees?.contractor?.person || relatedRequest?.createdByName,
    reportState.createdByUid || relatedRequest?.createdByUid
  );

  const contractorChief = getContractorChief(contCompany, users, {
    itemName: reportState.itemName || relatedRequest?.itemName || reportState.projectInfo?.itemName,
    packageName: reportState.packageName || relatedRequest?.packageName || reportState.projectInfo?.packageName,
    taskContent: reportState.taskContent || relatedRequest?.taskContent,
    inspectionObject: reportState.inspectionObject || relatedRequest?.inspectionObject,
    projectInfo: reportState.projectInfo || relatedRequest?.projectInfo,
    createdByRole: reportState.attendees?.contractor?.position || relatedRequest?.createdByRole,
    createdByName: reportState.attendees?.contractor?.person || relatedRequest?.createdByName,
    createdByUid: reportState.createdByUid || relatedRequest?.createdByUid
  });
  const contLeadName = contractorChief.fullName;
  const contLeadPosition = 'Chỉ huy trưởng';
  const contOfficerName = reportState.attendees?.contractor?.person || relatedRequest?.createdByName || 'KS. Lê Văn Kỹ Thuật';
  const contOfficerPosition = reportState.attendees?.contractor?.position || relatedRequest?.createdByRole || 'Kỹ thuật hiện trường';

  const supAttendee = reportState?.attendees?.supervisor;
  const invAttendee = reportState?.attendees?.investor;

  const curUid = currentUser?.uid;
  const curEmail = (currentUser?.email || '').trim().toLowerCase();
  const curName = (currentUser?.fullName || '').trim().toLowerCase();

  const assignedSupRecipients = effectiveAssignedRecipients.filter(
    r => r.role === 'SUPERVISOR' || r.role === 'LEAD_SUPERVISOR'
  );
  const assignedInvRecipients = effectiveAssignedRecipients.filter(
    r => r.role === 'INVESTOR' || r.role === 'LEAD_INVESTOR'
  );

  const assignedSupPerson = (assignedSupRecipients.length > 0
    ? assignedSupRecipients.map(r => r.fullName).filter(Boolean).join(', ')
    : (assignedSup?.fullName || assignedSup?.person || supOfficerName || 'Cán bộ TVGS')
  );
  const assignedInvPerson = (assignedInvRecipients.length > 0
    ? assignedInvRecipients.map(r => r.fullName).filter(Boolean).join(', ')
    : (assignedInv?.fullName || assignedInv?.person || invOfficerName || 'Cán bộ Ban QLDA')
  );

  // Người dùng có phải là người duyệt TVGS được chỉ định trên phiếu này không (Admin chỉ xem, không duyệt):
  const isSupervisorReviewer = Boolean(
    !isAdmin &&
    isSupervisorRole && (
      (supAttendee?.uid && curUid && supAttendee.uid === curUid) ||
      (supAttendee?.email && curEmail && supAttendee.email.toLowerCase() === curEmail) ||
      (supAttendee?.person && curName && (
        supAttendee.person.toLowerCase().includes(curName) ||
        curName.includes(supAttendee.person.toLowerCase())
      )) ||
      (assignedSupRecipients.some(r => 
        (curUid && r.uid === curUid) ||
        (curEmail && r.email && r.email.toLowerCase() === curEmail) ||
        (curName && r.fullName && (
          curName.includes(r.fullName.toLowerCase()) ||
          r.fullName.toLowerCase().includes(curName)
        ))
      )) ||
      (assignedSupRecipients.length === 0 && !supAttendee?.person)
    )
  );

  // Người dùng có phải là người duyệt CĐT được chỉ định trên phiếu này không (Admin chỉ xem, không duyệt):
  const isInvestorReviewer = Boolean(
    !isAdmin &&
    isInvestorRole && (
      (invAttendee?.uid && curUid && invAttendee.uid === curUid) ||
      (invAttendee?.email && curEmail && invAttendee.email.toLowerCase() === curEmail) ||
      (invAttendee?.person && curName && (
        invAttendee.person.toLowerCase().includes(curName) ||
        curName.includes(invAttendee.person.toLowerCase())
      )) ||
      (assignedInvRecipients.some(r => 
        (curUid && r.uid === curUid) ||
        (curEmail && r.email && r.email.toLowerCase() === curEmail) ||
        (curName && r.fullName && (
          curName.includes(r.fullName.toLowerCase()) ||
          r.fullName.toLowerCase().includes(curName)
        ))
      )) ||
      (assignedInvRecipients.length === 0 && !invAttendee?.person)
    )
  );

  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraRectifyRef = useRef(null);
  const fileRectifyRef = useRef(null);
  const cameraEvidenceRef = useRef(null);
  const fileEvidenceRef = useRef(null);
  
  // Tùy chọn in: Mặc định FALSE để xuất nhanh đúng 1 trang Biên bản A4 chuẩn pháp lý, tránh treo Print Preview vì ảnh lớn
  const [includePhotosInPrint, setIncludePhotosInPrint] = useState(false);
  const totalPhotos = (evidencePhotos?.length || 0) + (defectPhotos?.length || 0) + (rectifyPhotos?.length || 0);

  // Tham chiếu ID của biên bản trước đó để tránh wipe ảnh khi component re-render cùng 1 biên bản
  const prevReportIdRef = useRef(null);

  // Sync when report prop changes
  useEffect(() => {
    if (!report) return;
    const isDifferentReport = prevReportIdRef.current !== report.id;
    prevReportIdRef.current = report.id;

    setReportState(report);

    // Đồng bộ lại chữ ký theo dữ liệu report hiện hành
    setSignatures({
      investor: Boolean(report.attendees?.investor?.signed),
      supervisor: Boolean(report.attendees?.supervisor?.signed),
      contractor: report.attendees?.contractor?.signed !== false
    });

    if (report.evidencePhotos) {
      setEvidencePhotos(report.evidencePhotos);
    } else {
      setEvidencePhotos([]);
    }

    if (report.time?.startTimeText) {
      setStartTimeText(report.time.startTimeText);
    } else {
      setStartTimeText('...h..., ngày ...tháng ... năm 202...');
    }
    if (report.time?.endTimeText) {
      setEndTimeText(report.time.endTimeText);
    } else {
      setEndTimeText('...h..., ngày ....tháng ... năm 202...');
    }

    if (isDifferentReport) {
      setRejectReason(report.conclusion?.rejectionReason || '');
      setRepairRequired(report.conclusion?.repairRequired || '');
      setRepairDeadline(report.conclusion?.deadline || 'Trước 17h00 ngày hôm nay');
      setDefectPhotos(report.defectPhotos || []);
    } else {
      if (!isRejectModalOpen) {
        if (report.conclusion?.rejectionReason !== undefined) {
          setRejectReason(report.conclusion.rejectionReason);
        }
        if (report.conclusion?.repairRequired !== undefined) {
          setRepairRequired(report.conclusion.repairRequired);
        }
        if (report.conclusion?.deadline !== undefined) {
          setRepairDeadline(report.conclusion.deadline);
        }
        if (report.defectPhotos) {
          setDefectPhotos(report.defectPhotos);
        }
      }
    }

    if (report.standardsApplied && Array.isArray(report.standardsApplied) && report.standardsApplied.length > 0) {
      setSelectedStandards(report.standardsApplied);
    }

    // ĐỒNG BỘ TRẠNG THÁI SỬA CHỮA / KHẮC PHỤC KHI ĐỔI BIÊN BẢN:
    if (isDifferentReport) {
      if (report.status === 'RECTIFIED' && report.rectification) {
        setRectifyDesc(report.rectification.description || '');
        setRectifyPhotos(Array.isArray(report.rectification.photos) ? report.rectification.photos : []);
        setSuggestedTime(report.rectification.suggestedTime || '16h30 ngày hôm nay');
        if (report.rectification.suggestedDate) {
          setRectifyDate(report.rectification.suggestedDate);
        } else {
          setRectifyDate(getInitialRectifyDate());
        }
        if (report.rectification.suggestedHour) {
          setRectifyTime(report.rectification.suggestedHour);
        } else {
          setRectifyTime(getInitialRectifyTime());
        }
        setActiveTab(initialTab || 'DOCUMENT');
        setIsRectifyModalOpen(false);
      } else if (report.status === 'REJECTED' || report.conclusion?.isAccepted === false) {
        const existingPhotos = report.rectification?.photos;
        setRectifyPhotos(Array.isArray(existingPhotos) ? existingPhotos : []);
        setRectifyDesc(report.rectification?.description || '');
        setRectifyDate(getInitialRectifyDate());
        setRectifyTime('16:30');
        setActiveTab(initialTab || (initialOpenRectify ? 'DEFECTS' : 'INVITATION'));
        setIsRectifyModalOpen(Boolean(initialOpenRectify));
      } else {
        // TẤT CẢ CÁC TRƯỜNG HỢP CÒN LẠI (TẠO MỚI, CHỜ DUYỆT, HOÀN TẤT, CHỜ CĐT...):
        // Bắt buộc reset về rỗng, TUYỆT ĐỐI không để lọt ảnh demo hay ảnh rác từ biên bản khác!
        const existingPhotos = report.rectification?.photos;
        setRectifyPhotos(Array.isArray(existingPhotos) ? existingPhotos : []);
        setRectifyDesc(report.rectification?.description || '');
        setRectifyDate(getInitialRectifyDate());
        setRectifyTime('16:30');
        setActiveTab(initialTab || 'INVITATION');
        setIsRectifyModalOpen(false);
      }
    } else {
      // CÙNG 1 BIÊN BẢN: Nếu cloud cập nhật trạng thái RECTIFIED thì đồng bộ mượt mà
      if (report.status === 'RECTIFIED' && reportState.status !== 'RECTIFIED') {
        const existingPhotos = report.rectification?.photos;
        if (Array.isArray(existingPhotos) && existingPhotos.length > 0) {
          setRectifyPhotos(existingPhotos);
        }
        if (report.rectification?.description) {
          setRectifyDesc(report.rectification.description);
        }
        setIsRectifyModalOpen(false);
      }
    }
  }, [report, initialOpenRectify]);

  useEffect(() => {
    if (initialOpenRectify) {
      setIsRectifyModalOpen(true);
    }
  }, [initialOpenRectify]);

  const toggleStandard = (text) => {
    setSelectedStandards(prev => {
      const cur = Array.isArray(prev) ? prev : [];
      return cur.includes(text) ? cur.filter(t => t !== text) : [...cur, text];
    });
  };

  const handleSign = (party) => {
    try {
      const nextSignatures = { ...signatures, [party]: true };
      setSignatures(nextSignatures);

      const now = new Date().toISOString();
      const nowFormatted = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN');

      // Cả 3 bên ký số độc lập: Chỉ khi cả 3 bên đều hoàn thành thì mới là COMPLETED
      const isAllSigned = 
        (party === 'investor' || nextSignatures.investor) &&
        (party === 'supervisor' || nextSignatures.supervisor) &&
        (party === 'contractor' || nextSignatures.contractor !== false);

      const nextStatus = isAllSigned 
        ? 'COMPLETED' 
        : (party === 'supervisor' ? 'WAITING_INVESTOR' : (reportState.status === 'REJECTED' || reportState.status === 'RECTIFIED' ? 'WAITING_INVESTOR' : (reportState.status || 'PENDING_APPROVAL')));

      const updated = {
        ...reportState,
        conclusion: {
          ...reportState.conclusion,
          isAccepted: true,
          rejectionReason: isAllSigned ? '' : (reportState.conclusion?.rejectionReason || ''),
          repairRequired: isAllSigned ? 'Đã nghiệm thu đạt yêu cầu' : (reportState.conclusion?.repairRequired || 'Đang thực hiện ký duyệt các bên')
        },
        attendees: {
          ...reportState.attendees,
          [party]: {
            ...reportState.attendees?.[party],
            signed: true,
            signedAt: nowFormatted
          }
        },
        status: nextStatus,
        updatedAt: now
      };

      setReportState(updated);
      setActiveTab('DOCUMENT');

      if (onSaveReport) {
        onSaveReport(updated);
      }

      if (isAllSigned) {
        triggerSafeConfetti();
      }
    } catch (err) {
      console.error('[Error in handleSign]:', err);
    }
  };

  // Tự động lắng nghe sự kiện In từ trình duyệt (Ctrl+P / Cmd+P)
  useEffect(() => {
    if (!isOpen) return;

    const handleBeforePrint = () => {
      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');
      if (activeTab !== 'DOCUMENT' && activeTab !== 'INVITATION') {
        setActiveTab('DOCUMENT');
      }
    };

    const handleAfterPrint = () => {
      if (document.querySelector('.modal-overlay')) {
        document.body.classList.add('modal-open');
        document.documentElement.classList.add('modal-open');
      }
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [isOpen, activeTab]);

  const handlePrint = () => {
    // 1. Tạm gỡ class modal-open để layout trang web mở khóa hoàn toàn cho print engine
    document.body.classList.remove('modal-open');
    document.documentElement.classList.remove('modal-open');

    const executePrint = () => {
      window.print();

      // Sau khi đóng hộp thoại in thì phục hồi lại class modal-open
      setTimeout(() => {
        if (document.querySelector('.modal-overlay')) {
          document.body.classList.add('modal-open');
          document.documentElement.classList.add('modal-open');
        }
      }, 400);
    };

    if (activeTab !== 'DOCUMENT' && activeTab !== 'INVITATION') {
      setActiveTab('DOCUMENT');
      setTimeout(executePrint, 250);
    } else {
      setTimeout(executePrint, 60);
    }
  };

  // Thêm ảnh chụp lỗi từ Camera hoặc Thư viện (Tự động nén tối ưu & Lưu tức thì)
  const handleFileCapture = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newPhotos = [];
    for (const file of files) {
      const compressedUrl = await compressImageFile(file);
      if (!compressedUrl) continue;
      const now = new Date();
      const timeStr = `${now.toLocaleTimeString('vi-VN')} ngày ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
      newPhotos.push({
        id: `defect_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        url: compressedUrl,
        caption: file.name ? `Hiện trường lỗi: ${file.name.replace(/\.[^/.]+$/, '')}` : 'Hiện trường kiểm tra không đạt',
        gps: '10.0076° N, 105.7823° E (P. Thường Thạnh, TP. Cần Thơ)',
        time: timeStr,
        photographer: `${currentUser?.fullName || 'Kỹ sư'} (${currentRole === 'LEAD_SUPERVISOR' ? 'TVGS Trưởng' : currentRole === 'SUPERVISOR' ? 'TVGS' : currentRole === 'LEAD_INVESTOR' ? 'Trưởng Ban QLDA' : currentRole === 'INVESTOR' ? 'Ban QLDA' : currentRole === 'ADMIN' ? 'CĐT' : 'ĐVTC'})`
      });
    }

    if (newPhotos.length > 0) {
      setDefectPhotos(prev => [...newPhotos, ...prev]);
      setReportState(prev => ({
        ...prev,
        defectPhotos: [...newPhotos, ...(prev.defectPhotos || [])]
      }));
    }
    e.target.value = '';
  };

  // Thêm ảnh chụp đã sửa từ Camera hoặc Thư viện (Tự động nén tối ưu & Lưu tức thì)
  const handleFileCaptureRectify = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newPhotos = [];
    for (const file of files) {
      const compressedUrl = await compressImageFile(file);
      if (!compressedUrl) continue;
      const now = new Date();
      const timeStr = `${now.toLocaleTimeString('vi-VN')} ngày ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
      newPhotos.push({
        id: `rectify_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        url: compressedUrl,
        caption: file.name ? `Ảnh sửa chữa: ${file.name.replace(/\.[^/.]+$/, '')}` : 'Hiện trường sau khi khắc phục xong',
        gps: '10.0076° N, 105.7823° E (P. Thường Thạnh, TP. Cần Thơ)',
        time: timeStr,
        photographer: `${currentUser?.fullName || 'KS. Lê Văn Kỹ Thuật'} (ĐVTC ${contCompany.includes('Phan Lê') ? 'Phan Lê' : contCompany.includes('Bình Hoà') ? 'Bình Hoà' : 'Gia Huy Vĩnh Phúc'})`
      });
    }

    if (newPhotos.length > 0) {
      setRectifyPhotos(prev => {
        const next = [...newPhotos, ...prev];
        const updated = {
          ...reportState,
          rectification: {
            ...(reportState.rectification || {}),
            photos: next,
            description: rectifyDesc || reportState.rectification?.description || ''
          },
          updatedAt: new Date().toISOString()
        };
        setReportState(updated);
        // CHỈ đồng bộ cloud nếu đã ở trạng thái RECTIFIED; nếu đang trong REJECTED thì chỉ lưu khi bấm Gửi
        if (reportState.status === 'RECTIFIED' && onSaveReport) {
          onSaveReport(updated);
        }
        return next;
      });
    }
    e.target.value = '';
  };



  const handleDeletePhoto = (photoId) => {
    setDefectPhotos(prev => {
      const next = prev.filter(p => p.id !== photoId);
      const updated = {
        ...reportState,
        defectPhotos: next,
        updatedAt: new Date().toISOString()
      };
      setReportState(updated);
      if (onSaveReport) onSaveReport(updated);
      return next;
    });
  };

  const handleDeleteRectifyPhoto = (photoId) => {
    setRectifyPhotos(prev => {
      const next = prev.filter(p => p.id !== photoId);
      const updated = {
        ...reportState,
        rectification: {
          ...(reportState.rectification || {}),
          photos: next
        },
        updatedAt: new Date().toISOString()
      };
      setReportState(updated);
      if (reportState.status === 'RECTIFIED' && onSaveReport) {
        onSaveReport(updated);
      }
      return next;
    });
  };

  // Quản lý ảnh nghiệm thu hiện trường (Tự động nén tối ưu)
  const handleCaptureEvidencePhoto = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    for (const file of files) {
      const compressedUrl = await compressImageFile(file);
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
      const newPhoto = {
        id: `evidence_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        url: compressedUrl,
        caption: file.name ? `Hiện trường: ${file.name.replace(/\.[^/.]+$/, '')}` : 'Hình ảnh nghiệm thu hiện trường',
        gps: '10.0076° N, 105.7823° E (P. Thường Thạnh, TP. Cần Thơ)',
        time: timeStr,
        photographer: `${currentUser?.fullName || 'Kỹ sư'} (${currentRole === 'LEAD_SUPERVISOR' ? 'TVGS Trưởng' : currentRole === 'SUPERVISOR' ? 'TVGS' : currentRole === 'LEAD_INVESTOR' ? 'Trưởng Ban QLDA' : currentRole === 'INVESTOR' ? 'Ban QLDA' : currentRole === 'ADMIN' ? 'CĐT' : 'ĐVTC'})`
      };
      setEvidencePhotos(prev => {
        const next = [...prev, newPhoto];
        const updated = { ...reportState, evidencePhotos: next };
        setReportState(updated);
        if (onSaveReport) onSaveReport(updated);
        return next;
      });
    }
    e.target.value = '';
  };



  const handleDeleteEvidencePhoto = (photoId) => {
    setEvidencePhotos(prev => {
      const next = prev.filter(p => p.id !== photoId);
      const updated = { ...reportState, evidencePhotos: next };
      setReportState(updated);
      if (onSaveReport) onSaveReport(updated);
      return next;
    });
  };

  const handleUpdateEvidenceCaption = (photoId, newCaption) => {
    setEvidencePhotos(prev => {
      const next = prev.map(p => p.id === photoId ? { ...p, caption: newCaption } : p);
      const updated = { ...reportState, evidencePhotos: next };
      setReportState(updated);
      if (onSaveReport) onSaveReport(updated);
      return next;
    });
  };

  const handleAddChipToReason = (chipText) => {
    if (!rejectReason.trim()) {
      setRejectReason(chipText);
    } else if (!rejectReason.includes(chipText)) {
      setRejectReason(prev => `${prev}; ${chipText}`);
    }
  };

  const handleAddChipToRectify = (chipText) => {
    if (!rectifyDesc.trim()) {
      setRectifyDesc(chipText);
    } else if (!rectifyDesc.includes(chipText)) {
      setRectifyDesc(prev => `${prev}; ${chipText}`);
    }
  };

  // Xác nhận Không đồng ý nghiệm thu
  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      if (showAlert) {
        showAlert({
          type: 'warning',
          title: 'Thiếu Lý Do Từ Chối',
          message: 'Vui lòng nhập lý do không nghiệm thu để lập biên bản yêu cầu ĐVTC sửa chữa!'
        });
      } else {
        alert('Vui lòng nhập lý do không nghiệm thu để lập biên bản!');
      }
      return;
    }

    const now = new Date();
    const timeStr = `${now.toLocaleTimeString('vi-VN')} ngày ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;

    const rejectPayload = {
      rejectionReason: rejectReason.trim(),
      repairRequired: repairRequired.trim() || 'Yêu cầu ĐVTC căn chỉnh, khắc phục triệt để các tồn tại kỹ thuật và dọn vệ sinh trước khi mời nghiệm thu lại.',
      deadline: repairDeadline.trim() || 'Trước 17h00 ngày hôm nay',
      rejectedBy: {
        name: currentUser?.fullName || 'Cán bộ kiểm tra',
        role: currentRole,
        roleTitle: currentRole === 'LEAD_SUPERVISOR' ? 'Tư Vấn Giám Sát Trưởng' :
                   currentRole === 'SUPERVISOR' ? 'Tư Vấn Giám Sát' :
                   currentRole === 'LEAD_INVESTOR' ? 'Trưởng Ban QLDA' :
                   currentRole === 'INVESTOR' ? 'Ban QLDA' : 'Chủ Đầu Tư (CĐT)',
        company: currentUser?.company || 'Ban QLDA / GELICON',
        timestamp: timeStr
      },
      defectPhotos: defectPhotos
    };

    // Lưu lại lịch sử khắc phục của lần trước (nếu có) vào rectificationHistory để không bị mất minh chứng ảnh
    const previousHistory = reportState?.rectificationHistory || [];
    const updatedHistory = reportState?.rectification 
      ? [...previousHistory, { ...reportState.rectification, rejectedAt: timeStr, rejectionReason: rejectPayload.rejectionReason }]
      : previousHistory;

    // QUAN TRỌNG THEO SƠ ĐỒ HOẠT ĐỘNG:
    // Nếu Chủ đầu tư từ chối: TVGS đã nghiệm thu đạt trước đó nên chữ ký của TVGS vẫn giữ nguyên!
    // Nếu TVGS từ chối: Cả TVGS và CĐT đều chưa ký.
    const isSupervisorAlreadySigned = Boolean(signatures.supervisor || reportState.attendees?.supervisor?.signed);
    const keepSupervisorSigned = isInvestorRole ? isSupervisorAlreadySigned : false;

    const updated = {
      ...reportState,
      conclusion: {
        ...reportState.conclusion,
        isAccepted: false,
        rejectionReason: rejectPayload.rejectionReason,
        repairRequired: rejectPayload.repairRequired,
        deadline: rejectPayload.deadline,
        rejectedBy: rejectPayload.rejectedBy
      },
      attendees: {
        ...reportState.attendees,
        supervisor: {
          ...reportState.attendees?.supervisor,
          signed: keepSupervisorSigned
        },
        investor: {
          ...reportState.attendees?.investor,
          signed: false
        }
      },
      defectPhotos: defectPhotos,
      status: 'REJECTED',
      rectification: null,
      rectificationHistory: updatedHistory
    };

    setReportState(updated);
    setSignatures(prev => ({
      ...prev,
      supervisor: keepSupervisorSigned,
      investor: false
    }));
    setRectifyDesc('');
    setRectifyPhotos([]);
    setIsRejectModalOpen(false);
    setActiveTab('DOCUMENT');

    if (onRejectReport) {
      onRejectReport(reportState.id || report?.id, { ...rejectPayload, rectificationHistory: updatedHistory, keepSupervisorSigned });
    }
  };

  // Xác nhận ĐVTC Gửi ảnh sửa & Mời nghiệm thu lại
  const handleConfirmRectification = () => {
    if (!rectifyDesc.trim()) {
      if (showAlert) {
        showAlert({
          type: 'warning',
          title: 'Thiếu Nội Dung Khắc Phục',
          message: 'Vui lòng nhập nội dung biện pháp đã sửa chữa, khắc phục trước khi gửi TVGS / CĐT!'
        });
      } else {
        alert('Vui lòng nhập nội dung biện pháp đã sửa chữa, khắc phục!');
      }
      return;
    }

    const now = new Date();
    const timeStr = `${now.toLocaleTimeString('vi-VN')} ngày ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;

    // Tạo chuỗi ngày giờ nghiệm thu lại chuẩn từ date picker & time picker
    const [ry, rm, rd] = (rectifyDate || '').split('-');
    const dateFormatted = (rd && rm && ry) ? `${rd}/${rm}/${ry}` : `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
    const safeHour = rectifyTime || '16:30';
    const formattedSuggestedTime = `${safeHour} ngày ${dateFormatted}`;
    const standardScheduledTime = `${safeHour} ${dateFormatted}`;

    // Xác định đúng người nhận theo sơ đồ hoạt động:
    // CĐT từ chối -> gửi trực tiếp cho CĐT
    // TVGS từ chối -> gửi cho TVGS
    const isRejectedByInvestor = reportState?.conclusion?.rejectedBy?.role === 'INVESTOR' || reportState?.conclusion?.rejectedBy?.role === 'LEAD_INVESTOR';
    const targetReviewer = isRejectedByInvestor ? 'INVESTOR' : 'SUPERVISOR';

    // Chỉ lấy ảnh hiện trường thực tế đã chụp / tải lên
    const finalPhotos = Array.isArray(rectifyPhotos) ? rectifyPhotos : [];

    const rectificationPayload = {
      description: rectifyDesc.trim(),
      photos: finalPhotos,
      suggestedTime: formattedSuggestedTime,
      suggestedDate: rectifyDate || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
      suggestedHour: safeHour,
      scheduledTime: standardScheduledTime,
      target: targetReviewer,
      submittedBy: {
        name: currentUser?.fullName || 'KS. Lê Văn Kỹ Thuật',
        role: currentRole,
        roleTitle: 'Kỹ Thuật Đơn Vị Thi Công',
        company: currentUser?.company || contCompany || 'Công ty TNHH Gia Huy Vĩnh Phúc',
        timestamp: timeStr
      }
    };

    // Tăng số lần sửa chữa lên 1: 01.01 -> 02.01, 03.01...
    // Chỉ tăng khi ĐVTC bấm gửi lại, số lần tăng = (số lần trong lịch sử sửa + 2)
    const nextRevision = (reportState.rectificationHistory?.length || 0) + 2;
    const newReportDocNum = generateDocumentCode(projCode, docCode, reportState.createdAt || new Date(), nextRevision);

    const newStartTimeText = `${safeHour.replace(':', 'h')}, ngày ${dateFormatted}`;
    const updated = {
      ...reportState,
      revisionNumber: nextRevision,
      referenceDocNumber: newReportDocNum,
      projectCategoryCode: newReportDocNum,
      status: 'RECTIFIED',
      rectification: rectificationPayload,
      time: {
        ...(reportState.time || {}),
        startTime: formattedSuggestedTime,
        startTimeText: newStartTimeText
      }
    };

    setReportState(updated);
    setStartTimeText(newStartTimeText);
    setSuggestedTime(formattedSuggestedTime);
    setRectifyPhotos(finalPhotos);
    setIsRectifyModalOpen(false);
    setActiveTab('RECTIFIED'); // Chuyển sang tab xem ảnh sửa chữa

    const targetReportId = reportState.id || report?.id;
    if (onResubmitReport) {
      onResubmitReport(targetReportId, rectificationPayload, updated);
    }
  };

  // TVGS Chấp thuận nghiệm thu lại sau sửa chữa -> Chuyển sang Chủ đầu tư phê duyệt
  const handleReinspectSupervisor = () => {
    try {
      const now = new Date().toISOString();
      const nowFormatted = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN');

      const updated = {
        ...reportState,
        conclusion: {
          ...reportState.conclusion,
          isAccepted: true,
          rejectionReason: '',
          repairRequired: 'TVGS đã kiểm tra và nghiệm thu đạt sau sửa chữa',
          otherRequirements: 'Chuyển Chủ đầu tư kiểm tra và phê duyệt'
        },
        attendees: {
          ...reportState.attendees,
          supervisor: {
            ...reportState.attendees?.supervisor,
            signed: true,
            signedAt: nowFormatted
          },
          investor: {
            ...reportState.attendees?.investor,
            signed: false // CĐT chưa ký, chờ CĐT kiểm tra!
          },
          contractor: {
            ...reportState.attendees?.contractor,
            signed: true
          }
        },
        status: 'WAITING_INVESTOR',
        updatedAt: now
      };

      setSignatures(prev => ({
        ...prev,
        supervisor: true,
        investor: false,
        contractor: true
      }));
      setReportState(updated);
      setActiveTab('DOCUMENT');

      const targetReportId = reportState.id || report?.id;
      if (onReinspectReport) {
        onReinspectReport(targetReportId, updated);
      } else if (onSaveReport) {
        onSaveReport(updated);
      }
    } catch (err) {
      console.error('[Error in handleReinspectSupervisor]:', err);
    }
  };

  // CĐT Chấp thuận nghiệm thu lại sau sửa chữa -> Cả 3 bên hoàn tất nghiệm thu & ký số
  const handleReinspectInvestor = () => {
    try {
      const now = new Date().toISOString();
      const nowFormatted = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN');

      const updated = {
        ...reportState,
        conclusion: {
          ...reportState.conclusion,
          isAccepted: true,
          rejectionReason: '',
          repairRequired: 'Đã hoàn thành khắc phục các tồn tại kỹ thuật và nghiệm thu đạt',
          otherRequirements: 'Đạt yêu cầu nghiệm thu sau sửa chữa'
        },
        attendees: {
          ...reportState.attendees,
          supervisor: {
            ...reportState.attendees?.supervisor,
            signed: true,
            signedAt: reportState.attendees?.supervisor?.signedAt || nowFormatted
          },
          investor: {
            ...reportState.attendees?.investor,
            signed: true,
            signedAt: nowFormatted
          },
          contractor: {
            ...reportState.attendees?.contractor,
            signed: true
          }
        },
        status: 'COMPLETED',
        updatedAt: now
      };

      setSignatures({
        investor: true,
        supervisor: true,
        contractor: true
      });
      setReportState(updated);
      setActiveTab('DOCUMENT');

      triggerSafeConfetti();

      const targetReportId = reportState.id || report?.id;
      if (onReinspectReport) {
        onReinspectReport(targetReportId, updated);
      } else if (onSaveReport) {
        onSaveReport(updated);
      }
    } catch (err) {
      console.error('[Error in handleReinspectInvestor]:', err);
    }
  };

  // Phân luồng kiểm tra lại sau sửa chữa chuẩn theo vai trò:
  // - Nếu CĐT từ chối hoặc người dùng là INVESTOR -> CĐT nghiệm thu đạt & hoàn tất
  // - Nếu TVGS từ chối hoặc người dùng là TVGS -> TVGS nghiệm thu đạt & chuyển sang CĐT
  const handleReinspect = () => {
    const isInvestorReview = 
      reportState?.status === 'WAITING_INVESTOR' || 
      reportState?.rectification?.target === 'INVESTOR' || 
      reportState?.conclusion?.rejectedBy?.role === 'INVESTOR' || 
      reportState?.conclusion?.rejectedBy?.role === 'LEAD_INVESTOR' || 
      currentRole === 'INVESTOR' ||
      currentRole === 'LEAD_INVESTOR';

    if (isInvestorReview) {
      handleReinspectInvestor();
    } else {
      handleReinspectSupervisor();
    }
  };

  if (!isOpen || !report) return null;

  const initialStandardsList = (reportState?.standardsApplied && Array.isArray(reportState.standardsApplied) && reportState.standardsApplied.length > 0)
    ? reportState.standardsApplied
    : (report?.standardsApplied && Array.isArray(report.standardsApplied) && report.standardsApplied.length > 0)
        ? report.standardsApplied
        : getSuggestedStandards(
            reportState?.inspectionObject || reportState?.projectInfo?.itemName || '', 
            isMaterialReport ? 'MATERIAL' : 'WORK'
          );

  const safeInitialStandards = Array.isArray(initialStandardsList) 
    ? initialStandardsList 
    : (initialStandardsList && typeof initialStandardsList === 'object' ? Object.values(initialStandardsList) : []);

  const safeSelectedStandards = Array.isArray(selectedStandards)
    ? selectedStandards
    : (selectedStandards && typeof selectedStandards === 'object' ? Object.values(selectedStandards) : []);

  const displayStandards = Array.from(new Set([
    ...safeInitialStandards,
    ...safeSelectedStandards
  ]));

  return (
    <div className="modal-overlay">
      <div className="modal-content inspection-report-modal" style={{ maxWidth: '1280px' }}>
        {/* Persistent Hidden File Inputs for Cameras and File Uploads */}
        <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} style={{ display: 'none' }} onChange={handleFileCapture} />
        <input type="file" accept="image/*" multiple ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileCapture} />
        <input type="file" accept="image/*" capture="environment" ref={cameraRectifyRef} style={{ display: 'none' }} onChange={handleFileCaptureRectify} />
        <input type="file" accept="image/*" multiple ref={fileRectifyRef} style={{ display: 'none' }} onChange={handleFileCaptureRectify} />
        <input type="file" accept="image/*" capture="environment" ref={cameraEvidenceRef} style={{ display: 'none' }} onChange={handleCaptureEvidencePhoto} />
        <input type="file" accept="image/*" multiple ref={fileEvidenceRef} style={{ display: 'none' }} onChange={handleCaptureEvidencePhoto} />

        {/* MODAL HEADER */}
        <div className="modal-header no-print" style={{ background: '#f8fafc', padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', minWidth: 0, flex: 1 }}>
              <div style={{ 
                background: isCompleted ? '#ecfdf5' : isRectified ? '#f3e8ff' : isRejected ? '#fee2e2' : '#ecfdf5', 
                padding: '8px', 
                borderRadius: '10px', 
                color: isCompleted ? '#059669' : isRectified ? '#7c3aed' : isRejected ? '#dc2626' : '#10b981',
                flexShrink: 0,
                marginTop: '2px'
              }}>
                {isCompleted ? <ShieldCheck size={20} /> : isRectified ? <RotateCcw size={20} /> : isRejected ? <AlertTriangle size={20} /> : <ShieldCheck size={20} />}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: '1.12rem', color: '#0f172a', lineHeight: 1.35 }}>
                    {activeTab === 'INVITATION'
                      ? (isMaterialReport ? 'Phiếu Yêu Cầu Nghiệm Thu Vật Liệu (Mẫu 12)' : 'Phiếu Yêu Cầu Nghiệm Thu Công Việc Xây Dựng')
                      : (isMaterialReport ? 'Biên Bản Nghiệm Thu Vật Liệu (Mẫu 12)' : 'Biên Bản Nghiệm Thu Công Việc Xây Dựng')}
                  </h3>
                  {isCompleted ? (
                    <span style={{ 
                      background: '#059669', 
                      color: '#ffffff', 
                      fontSize: '0.72rem', 
                      fontWeight: 700, 
                      padding: '2px 8px', 
                      borderRadius: '4px',
                      whiteSpace: 'nowrap'
                    }}>
                      ✓ ĐÃ HOÀN TẤT
                    </span>
                  ) : isWaitingInvestor ? (
                    <span style={{ 
                      background: '#2563eb', 
                      color: '#ffffff', 
                      fontSize: '0.72rem', 
                      fontWeight: 700, 
                      padding: '2px 8px', 
                      borderRadius: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      whiteSpace: 'nowrap'
                    }}>
                      ⏳ CHỜ CĐT DUYỆT
                    </span>
                  ) : isRectified ? (
                    <span style={{ 
                      background: '#7c3aed', 
                      color: '#ffffff', 
                      fontSize: '0.72rem', 
                      fontWeight: 700, 
                      padding: '2px 8px', 
                      borderRadius: '4px',
                      whiteSpace: 'nowrap'
                    }}>
                      🔄 ĐÃ SỬA - CHỜ DUYỆT LẠI
                    </span>
                  ) : isRejected && (
                    <span style={{ 
                      background: '#ef4444', 
                      color: '#ffffff', 
                      fontSize: '0.72rem', 
                      fontWeight: 700, 
                      padding: '2px 8px', 
                      borderRadius: '4px',
                      whiteSpace: 'nowrap'
                    }}>
                      KHÔNG ĐẠT
                    </span>
                  )}
                </div>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                  {activeTab === 'INVITATION' ? (
                    <>Mã phiếu: <strong style={{ color: '#0f172a' }}>{cleanReqCode}</strong> • Căn cứ: Nghị định 06/2021/NĐ-CP</>
                  ) : (
                    <>Mã biên bản: <strong style={{ color: '#0f172a' }}>{cleanReportNum}</strong> • Căn cứ: Nghị định 06/2021/NĐ-CP</>
                  )}
                </p>
              </div>
            </div>

            {/* Close Button ALWAYS visible and reachable on top right */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <div className="report-header-desktop-actions">
                {totalPhotos > 0 && (
                  <label 
                    className="no-print" 
                    style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '5px', 
                      fontSize: '0.76rem', 
                      color: includePhotosInPrint ? '#1d4ed8' : '#64748b', 
                      cursor: 'pointer',
                      background: includePhotosInPrint ? '#eff6ff' : '#ffffff',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: includePhotosInPrint ? '1.5px solid #3b82f6' : '1px solid #cbd5e1',
                      fontWeight: includePhotosInPrint ? 700 : 500,
                      userSelect: 'none',
                      whiteSpace: 'nowrap'
                    }}
                    title="Tích chọn để in kèm phụ lục ảnh hiện trường"
                  >
                    <input 
                      type="checkbox" 
                      checked={includePhotosInPrint} 
                      onChange={(e) => setIncludePhotosInPrint(e.target.checked)}
                      style={{ width: '13px', height: '13px', cursor: 'pointer', accentColor: '#2563eb' }}
                    />
                    <span>In kèm ảnh ({totalPhotos})</span>
                  </label>
                )}
                <button className="btn-secondary" onClick={handlePrint} style={{ padding: '5px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                  <Printer size={14} />
                  <span>{includePhotosInPrint ? 'In A4 + Ảnh' : (activeTab === 'INVITATION' ? 'In A4 Phiếu Yêu Cầu' : 'In A4 Biên Bản')}</span>
                </button>
              </div>
              <button className="modal-close-btn" onClick={onClose} style={{ marginLeft: '4px', padding: '6px', background: '#f1f5f9', borderRadius: '50%' }} title="Đóng biên bản">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Sub-row for Print buttons on mobile screens */}
          <div className="report-header-mobile-actions no-print">
            {totalPhotos > 0 && (
              <label 
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '5px', 
                  fontSize: '0.74rem', 
                  color: includePhotosInPrint ? '#1d4ed8' : '#64748b', 
                  cursor: 'pointer',
                  background: includePhotosInPrint ? '#eff6ff' : '#ffffff',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: includePhotosInPrint ? '1.5px solid #3b82f6' : '1px solid #cbd5e1',
                  fontWeight: includePhotosInPrint ? 700 : 500,
                  whiteSpace: 'nowrap'
                }}
              >
                <input 
                  type="checkbox" 
                  checked={includePhotosInPrint} 
                  onChange={(e) => setIncludePhotosInPrint(e.target.checked)}
                  style={{ width: '13px', height: '13px', cursor: 'pointer', accentColor: '#2563eb' }}
                />
                <span>In kèm ảnh ({totalPhotos})</span>
              </label>
            )}
            <button className="btn-secondary" onClick={handlePrint} style={{ padding: '4px 10px', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <Printer size={14} />
              <span>{includePhotosInPrint ? 'In A4 + Phụ Lục Ảnh' : (activeTab === 'INVITATION' ? 'In A4 Phiếu Yêu Cầu' : 'In A4 Biên Bản')}</span>
            </button>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="report-modal-tabs no-print" style={{ 
          display: 'flex', 
          flexShrink: 0, 
          minHeight: '48px', 
          height: '48px', 
          background: '#f1f5f9', 
          borderBottom: '1px solid #cbd5e1', 
          padding: '0 8px', 
          overflowX: 'auto', 
          overflowY: 'hidden', 
          flexWrap: 'nowrap', 
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          alignItems: 'stretch',
          position: 'relative',
          zIndex: 10
        }}>
          {/* TAB 1: PHIẾU YÊU CẦU NGHIỆM THU */}
          <button 
            style={{
              padding: '0 16px',
              height: '100%',
              minHeight: '48px',
              border: 'none',
              background: activeTab === 'INVITATION' ? '#ffffff' : 'transparent',
              fontWeight: 700,
              fontSize: '0.86rem',
              color: activeTab === 'INVITATION' ? '#2563eb' : '#64748b',
              borderBottom: activeTab === 'INVITATION' ? '3px solid #2563eb' : '3px solid transparent',
              borderRadius: 0,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxSizing: 'border-box'
            }}
            onClick={() => setActiveTab('INVITATION')}
          >
            📋 Phiếu Yêu Cầu Nghiệm Thu
          </button>

          {/* TAB 2: BIÊN BẢN NGHIỆM THU */}
          <button 
            style={{
              padding: '0 16px',
              height: '100%',
              minHeight: '48px',
              border: 'none',
              background: activeTab === 'DOCUMENT' ? '#ffffff' : 'transparent',
              fontWeight: 700,
              fontSize: '0.86rem',
              color: activeTab === 'DOCUMENT' ? '#2563eb' : '#64748b',
              borderBottom: activeTab === 'DOCUMENT' ? '3px solid #2563eb' : '3px solid transparent',
              borderRadius: 0,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxSizing: 'border-box'
            }}
            onClick={() => setActiveTab('DOCUMENT')}
          >
            📄 Biên Bản Nghiệm Thu (A4)
          </button>

          {/* TAB 3: ẢNH HIỆN TRƯỜNG */}
          <button 
            style={{
              padding: '0 16px',
              height: '100%',
              minHeight: '48px',
              border: 'none',
              background: activeTab === 'EVIDENCE' ? '#ffffff' : 'transparent',
              fontWeight: 700,
              fontSize: '0.86rem',
              color: activeTab === 'EVIDENCE' ? '#2563eb' : '#64748b',
              borderBottom: activeTab === 'EVIDENCE' ? '3px solid #2563eb' : '3px solid transparent',
              borderRadius: 0,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxSizing: 'border-box'
            }}
            onClick={() => setActiveTab('EVIDENCE')}
          >
            📸 Ảnh Hiện Trường ({evidencePhotos.length})
          </button>

          {/* TAB ẢNH LỖI KHIẾM KHUYẾT */}
          {(isRejected || defectPhotos.length > 0) && (
            <button 
              style={{
                padding: '0 16px',
                height: '100%',
                minHeight: '48px',
                border: 'none',
                background: activeTab === 'DEFECTS' ? '#ffffff' : 'transparent',
                fontWeight: 700,
                fontSize: '0.86rem',
                color: activeTab === 'DEFECTS' ? '#dc2626' : '#b91c1c',
                borderBottom: activeTab === 'DEFECTS' ? '3px solid #dc2626' : '3px solid transparent',
                borderRadius: 0,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxSizing: 'border-box'
              }}
              onClick={() => setActiveTab('DEFECTS')}
            >
              <AlertCircle size={15} />
              <span>Ảnh Lỗi Khiếm Khuyết ({defectPhotos.length})</span>
            </button>
          )}

          {/* TAB BẰNG CHỨNG ĐÃ KHẮC PHỤC SỬA CHỮA: CHỈ HIỆN KHI ĐÃ SỬA CHỮA HOẶC HOÀN THÀNH SAU SỬA */}
          {(isRectified || reportState?.status === 'RECTIFIED' || (isCompleted && Boolean(reportState?.rectification?.description))) && (
            <button 
              style={{
                padding: '0 16px',
                height: '100%',
                minHeight: '48px',
                border: 'none',
                background: activeTab === 'RECTIFIED' ? '#ffffff' : 'transparent',
                fontWeight: 700,
                fontSize: '0.86rem',
                color: activeTab === 'RECTIFIED' ? '#7c3aed' : '#6d28d9',
                borderBottom: activeTab === 'RECTIFIED' ? '3px solid #7c3aed' : '3px solid transparent',
                borderRadius: 0,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxSizing: 'border-box'
              }}
              onClick={() => setActiveTab('RECTIFIED')}
            >
              <CheckCircle2 size={15} />
              <span>Ảnh Đã Sửa Chữa ({rectifyPhotos.length})</span>
            </button>
          )}
        </div>

        {/* MODAL BODY */}
        <div className="modal-body" style={{ background: '#f8fafc' }}>
          {activeTab === 'INVITATION' ? (
            /* TRÌNH BÀY CHUẨN PHIẾU YÊU CẦU NGHIỆM THU (MẪU 03) */
            <div className="document-paper invitation-paper" style={{ maxWidth: '820px', width: '100%', margin: '0 auto', fontSize: '0.92rem', boxSizing: 'border-box' }}>
              {/* BANNER KHI PHIẾU BỊ HỦY */}
              {isCancelled && (
                <div className="no-print" style={{
                  background: '#fef2f2',
                  border: '1.5px solid #f87171',
                  borderRadius: '10px',
                  padding: '14px 18px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  color: '#991b1b'
                }}>
                  <div style={{ background: '#fee2e2', borderRadius: '50%', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Ban size={22} color="#dc2626" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '0.98rem', display: 'block', color: '#991b1b' }}>
                      🚫 PHIẾU YÊU CẦU NGHIỆM THU ĐÃ BỊ HỦY
                    </strong>
                    <div style={{ fontSize: '0.88rem', marginTop: '4px', color: '#7f1d1d' }}>
                      <strong>Lý do hủy:</strong> "{effectiveRequest.cancellationReason || 'Đã hủy theo yêu cầu của đơn vị thi công.'}"
                    </div>
                  </div>
                </div>
              )}

              {/* BANNER CẢNH BÁO TRẠNG THÁI NGHIỆM THU */}
              {isRejected && (
                <div className="no-print" style={{
                  background: '#fef2f2',
                  border: '1.5px solid #fca5a5',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  color: '#991b1b'
                }}>
                  <AlertTriangle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>⚠️ KẾT QUẢ KIỂM TRA: CHƯA ĐẠT (CẦN SỬA CHỮA)</strong>
                    <div style={{ fontSize: '0.84rem', marginTop: '3px', color: '#b91c1c' }}>
                      Lý do: "{reportState?.conclusion?.notes || reportState?.conclusion?.comments || 'Có khiếm khuyết kỹ thuật hiện trường cần khắc phục sửa chữa.'}"
                    </div>
                  </div>
                </div>
              )}

              {isRectified && (
                <div className="no-print" style={{
                  background: '#f5f3ff',
                  border: '1.5px solid #d8b4fe',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  color: '#6b21a8'
                }}>
                  <RotateCcw size={20} color="#7c3aed" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>🔄 ĐÃ KHẮC PHỤC SỬA CHỮA - CHỜ KIỂM TRA LẠI</strong>
                    <div style={{ fontSize: '0.84rem', marginTop: '3px', color: '#7e22ce' }}>
                      {reportState?.rectification?.description ? `Nội dung đã sửa: "${reportState.rectification.description}"` : 'ĐVTC đã bổ sung bằng chứng ảnh sửa chữa.'}
                    </div>
                  </div>
                </div>
              )}

              {isCompleted && (
                <div className="no-print" style={{
                  background: '#ecfdf5',
                  border: '1.5px solid #a7f3d0',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#065f46'
                }}>
                  <CheckCircle2 size={20} color="#059669" style={{ flexShrink: 0 }} />
                  <div>
                    <strong>✅ ĐÃ HOÀN TẤT NGHIỆM THU ĐẠT</strong>
                    <div style={{ fontSize: '0.84rem', marginTop: '2px', color: '#047857' }}>
                      Công tác đã được CĐT, TVGS và ĐVTC ký duyệt hoàn tất theo quy định.
                    </div>
                  </div>
                </div>
              )}

              {/* VĂN BẢN NỘI DUNG PHIẾU YÊU CẦU THEO ĐÚNG CHUẨN MẪU SỐ 6 */}
              <div 
                className="invitation-sheet"
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '36px 40px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  fontFamily: '"Times New Roman", Times, serif',
                  lineHeight: 1.5,
                  color: '#000000',
                  boxSizing: 'border-box'
                }}
              >
                {/* Header Quốc hiệu tiêu ngữ */}
                <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '12pt', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                    CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '11.5pt', marginTop: '2px' }}>
                    Độc lập - Tự do - Hạnh phúc
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#000000', marginTop: '1px' }}>
                    ---------***---------
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '11pt', fontStyle: 'italic', marginTop: '10px' }}>
                    {invitationCityDate}
                  </div>
                </div>

                {/* Tiêu đề & Mã số */}
                <div style={{
                  textAlign: 'center',
                  margin: '14px 0 18px 0'
                }}>
                  <h2 style={{ fontSize: '14pt', color: '#000000', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.02em', fontWeight: 'bold' }}>
                    PHIẾU YÊU CẦU NGHIỆM THU
                  </h2>
                  <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>
                    Số: {cleanReqCode}
                  </div>
                </div>

                {/* Bảng thông tin dự án, công trình, hạng mục - căn chuẩn dấu 2 chấm : */}
                <table style={{ width: '100%', borderCollapse: 'collapse', margin: '14px 0 10px 0', fontSize: '12pt' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '215px', verticalAlign: 'top', fontWeight: 'bold', padding: '4px 0' }}>Dự án</td>
                      <td style={{ width: '16px', verticalAlign: 'top', fontWeight: 'bold', padding: '4px 0' }}>:</td>
                      <td style={{ verticalAlign: 'top', padding: '4px 0' }}>{effectiveRequest.projectName || 'Đầu tư xây dựng nhà ở Phường Thường Thạnh- An Phú Eco City'}</td>
                    </tr>
                    <tr>
                      <td style={{ width: '215px', verticalAlign: 'top', fontWeight: 'bold', padding: '4px 0' }}>Công trình</td>
                      <td style={{ width: '16px', verticalAlign: 'top', fontWeight: 'bold', padding: '4px 0' }}>:</td>
                      <td style={{ verticalAlign: 'top', padding: '4px 0' }}>{effectiveRequest.buildingName || 'Chung cư nhà ở xã hội 2'}</td>
                    </tr>
                    <tr>
                      <td style={{ width: '215px', verticalAlign: 'top', fontWeight: 'bold', padding: '4px 0' }}>Hạng mục</td>
                      <td style={{ width: '16px', verticalAlign: 'top', fontWeight: 'bold', padding: '4px 0' }}>:</td>
                      <td style={{ verticalAlign: 'top', padding: '4px 0' }}>{effectiveRequest.itemName || effectiveRequest.packageName || 'Thi công hệ thống PCCC trong và ngoài nhà'}</td>
                    </tr>
                    <tr>
                      <td style={{ width: '215px', verticalAlign: 'top', fontWeight: 'bold', padding: '4px 0' }}>Địa điểm xây dựng</td>
                      <td style={{ width: '16px', verticalAlign: 'top', fontWeight: 'bold', padding: '4px 0' }}>:</td>
                      <td style={{ verticalAlign: 'top', padding: '4px 0' }}>{formatReportLocation(effectiveRequest.location)}</td>
                    </tr>
                    <tr>
                      <td style={{ width: '215px', verticalAlign: 'top', fontWeight: 'bold', padding: '4px 0' }}>Đơn vị yêu cầu nghiệm thu</td>
                      <td style={{ width: '16px', verticalAlign: 'top', fontWeight: 'bold', padding: '4px 0' }}>:</td>
                      <td style={{ verticalAlign: 'top', padding: '4px 0' }}>{effectiveRequest.contractorCompany || effectiveRequestContCompany}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Công tác xây dựng yêu cầu nghiệm thu */}
                <div style={{ marginTop: '12px', fontSize: '12pt' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>
                    Công tác xây dựng yêu cầu nghiệm thu:
                  </div>

                  <div style={{ fontWeight: 'bold', fontSize: '12pt', margin: '6px 0 6px 0', lineHeight: 1.5 }}>
                    {effectiveRequest.taskContent || (effectiveRequest.materials && effectiveRequest.materials.length > 0 ? effectiveRequest.materials.map(m => m.name || m.materialName).filter(Boolean).join(', ') : '') || reportState.inspectionObject || 'Nghiệm thu công việc xây dựng'}
                  </div>


                </div>

                {/* Câu cam kết pháp lý đúng chuẩn quy định trong ảnh 3 */}
                <div style={{ marginTop: '14px', fontSize: '12pt', lineHeight: 1.55, textAlign: 'justify' }}>
                  Sau khi kiểm tra chất lượng, đối chiếu với bản vẽ thiết kế và các tiêu chuẩn kỹ thuật được áp dụng, chúng tôi đã nghiệm thu nội bộ. Vậy nhà thầu thi công đề nghị Chủ đầu tư và Tư vấn giám sát nghiệm thu.
                </div>

                {/* Thời gian & Địa điểm */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '14px', fontSize: '12pt' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '190px', verticalAlign: 'top', fontWeight: 'bold', padding: '4px 0' }}>Thời gian nghiệm thu</td>
                      <td style={{ width: '16px', verticalAlign: 'top', fontWeight: 'bold', padding: '4px 0' }}>:</td>
                      <td style={{ verticalAlign: 'top', padding: '4px 0' }}>{invitationScheduledTimeFormatted}</td>
                    </tr>
                    <tr>
                      <td style={{ width: '190px', verticalAlign: 'top', fontWeight: 'bold', padding: '4px 0' }}>Tại</td>
                      <td style={{ width: '16px', verticalAlign: 'top', fontWeight: 'bold', padding: '4px 0' }}>:</td>
                      <td style={{ verticalAlign: 'top', padding: '4px 0' }}>{effectiveRequest.inspectionPlace || effectiveRequest.location || 'Dự án Đầu tư xây dựng nhà ở Phường Thường Thạnh - An Phú Eco City'}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Ký tên Đơn vị thi công bên phải */}
                <div style={{ marginTop: '22px', display: 'flex', justifyContent: 'flex-end', fontSize: '12pt' }}>
                  <div style={{ textAlign: 'center', width: '280px' }}>
                    <div style={{ fontWeight: 'bold' }}>Đại diện đơn vị thi công</div>
                    <div style={{ fontStyle: 'italic', fontSize: '11pt', marginTop: '2px' }}>(Ký, ghi rõ họ tên)</div>
                    <div style={{ height: '70px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ fontFamily: 'Dancing Script, cursive, serif', fontSize: '1.4rem', color: '#0f172a' }}>
                        {effectiveRequest.createdByName || 'Trần Văn Trung'}
                      </div>
                      <div className="no-print" style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 600 }}>✓ ĐVTC đã ký</div>
                    </div>
                    <div style={{ fontWeight: 'bold', fontSize: '12pt' }}>
                      {effectiveRequest.createdByName || 'Trần Văn Trung'}
                    </div>
                    <div className="no-print" style={{ fontSize: '10.5pt', color: '#475569' }}>
                      ({effectiveRequest.createdByRole || 'Kỹ thuật hiện trường'})
                    </div>
                  </div>
                </div>

                {/* Nơi nhận theo đúng chuẩn Mẫu số 6 từ Ảnh 3 */}
                <div style={{ marginTop: '24px', fontSize: '11pt', lineHeight: 1.5 }}>
                  <div>
                    <strong>Nơi nhận:</strong> <span style={{ fontStyle: 'italic' }}>(Thời gian nhận.......giờ.......ngày.....tháng..... năm 20...)</span>
                  </div>
                  <table style={{ borderCollapse: 'collapse', marginLeft: '12px', marginTop: '4px' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '150px', verticalAlign: 'top' }}>- TVGS</td>
                        <td style={{ width: '16px', verticalAlign: 'top' }}>:</td>
                        <td style={{ verticalAlign: 'top' }}>{assignedSupPerson}</td>
                      </tr>
                      <tr>
                        <td style={{ width: '150px', verticalAlign: 'top' }}>- CĐT – Ban QLDA</td>
                        <td style={{ width: '16px', verticalAlign: 'top' }}>:</td>
                        <td style={{ verticalAlign: 'top' }}>{assignedInvPerson}</td>
                      </tr>
                      <tr>
                        <td style={{ width: '150px', verticalAlign: 'top' }}>- Lưu</td>
                        <td style={{ width: '16px', verticalAlign: 'top' }}>:</td>
                        <td style={{ verticalAlign: 'top' }}>{effectiveRequest.contractorCompany || effectiveRequestContCompany}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* DANH SÁCH CÁN BỘ TIẾP NHẬN PHIẾU YÊU CẦU */}
              {effectiveAssignedRecipients && effectiveAssignedRecipients.length > 0 && (
                <div className="no-print" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', marginTop: '18px' }}>
                  <div style={{ margin: '0 0 10px 0', fontSize: '0.86rem', color: '#1e293b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <UserCheck size={16} color="#2563eb" />
                    <span>Thành phần tiếp nhận phiếu yêu cầu ({effectiveAssignedRecipients.length}):</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {effectiveAssignedRecipients.map((rec, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: '#ffffff',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="avatar-circle" style={{
                            width: '30px',
                            height: '30px',
                            fontSize: '0.74rem',
                            background: (rec.role === 'SUPERVISOR' || rec.role === 'LEAD_SUPERVISOR') ? '#059669' : '#d97706'
                          }}>
                            {(rec.role === 'SUPERVISOR' || rec.role === 'LEAD_SUPERVISOR') ? 'TV' : 'ĐT'}
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '0.86rem', color: '#0f172a' }}>
                              {rec.fullName}
                              {rec.uid === currentUser?.uid && (
                                <span style={{ marginLeft: '6px', fontSize: '0.72rem', background: '#e0e7ff', color: '#3730a3', padding: '2px 6px', borderRadius: '4px' }}>
                                  (Bạn)
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                              {rec.position} • {rec.company}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="badge-status badge-confirmed" style={{ fontSize: '0.74rem', padding: '3px 8px' }}>
                            {rec.role === 'LEAD_SUPERVISOR'
                              ? 'TVGS Trưởng'
                              : rec.role === 'SUPERVISOR'
                                ? 'Đại diện TVGS'
                                : rec.role === 'LEAD_INVESTOR'
                                  ? 'Trưởng Ban QLDA'
                                  : 'Ban QLDA'}
                          </span>

                          {(() => {
                            const isSup = rec.role === 'SUPERVISOR' || rec.role === 'LEAD_SUPERVISOR';
                            const isLeadSup = currentRole === 'LEAD_SUPERVISOR' || Boolean(currentUser?.isLead && currentRole === 'SUPERVISOR');
                            const isLeadInv = currentRole === 'LEAD_INVESTOR' || Boolean(currentUser?.isLead && currentRole === 'INVESTOR');
                            const canReassign = onReassign && !isCompleted && !isCancelled && (isAdmin || (isSup && isLeadSup) || (!isSup && isLeadInv));

                            if (!canReassign) return null;

                            return (
                              <button
                                type="button"
                                onClick={() => onReassign(effectiveRequest, isSup ? 'SUPERVISOR' : 'INVESTOR')}
                                style={{
                                  background: isSup ? '#f0fdf4' : '#fffbeb',
                                  border: isSup ? '1px solid #86efac' : '1px solid #fde68a',
                                  color: isSup ? '#15803d' : '#b45309',
                                  borderRadius: '6px',
                                  padding: '3px 8px',
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                title={`Điều chuyển người nhận ${isSup ? 'TVGS' : 'CĐT'} khác`}
                              >
                                <ArrowLeftRight size={12} />
                                <span>Đổi cán bộ</span>
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BANNER ĐIỀU HƯỚNG SANG BIÊN BẢN */}
              <div className="no-print" style={{
                marginTop: '20px',
                padding: '14px 18px',
                background: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)',
                border: '1.5px solid #bfdbfe',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <div style={{ fontWeight: 800, color: '#1e40af', fontSize: '0.92rem' }}>
                    📑 Biên Bản Nghiệm Thu Đi Kèm: Mẫu {isMaterialReport ? '12 (Vật Liệu)' : 'Công Việc Xây Dựng'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '2px' }}>
                    Chuyển sang tab Biên Bản để kiểm tra nội dung A4, tiêu chuẩn, ký số và phê duyệt đạt.
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ background: '#2563eb', padding: '8px 16px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => setActiveTab('DOCUMENT')}
                >
                  <span>Mở Biên Bản Nghiệm Thu</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          ) : activeTab === 'DOCUMENT' ? (
            /* TRÌNH BÀY CHUẨN BIÊN BẢN KHỔ A4 */
            <div className="document-paper" style={{ maxWidth: '820px', width: '100%', margin: '0 auto', fontSize: '0.92rem', boxSizing: 'border-box' }}>
              {/* THÔNG BÁO HOÀN TẤT NẾU ĐÃ NGHIỆM THU ĐẠT SAU SỬA CHỮA */}
              {isCompleted && Boolean(reportState?.rectification?.description || report?.rectification?.description) ? (
                <div className="no-print" style={{
                  background: '#ecfdf5',
                  border: '1.5px solid #a7f3d0',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                    <div style={{ background: '#d1fae5', padding: '6px', borderRadius: '50%', color: '#059669', flexShrink: 0 }}>
                      <CheckCircle2 size={20} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 800, color: '#065f46', fontSize: '0.95rem' }}>
                        BIÊN BẢN ĐÃ ĐƯỢC NGHIỆM THU ĐẠT & PHÊ DUYỆT HOÀN TẤT
                      </div>
                      <div style={{ fontSize: '0.84rem', color: '#047857', marginTop: '2px' }}>
                        TVGS & Ban QLDA đã kiểm tra hiện trường, xác nhận ĐVTC khắc phục đạt chuẩn và đã ký số điện tử đầy đủ 3 bên.
                      </div>
                    </div>
                  </div>
                  {rectifyPhotos.length > 0 && (
                    <button 
                      style={{ 
                        background: '#059669', 
                        color: '#ffffff', 
                        border: 'none', 
                        borderRadius: '6px', 
                        padding: '6px 12px', 
                        fontSize: '0.8rem', 
                        fontWeight: 700, 
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                      onClick={() => setActiveTab('RECTIFIED')}
                    >
                      Xem {rectifyPhotos.length} ảnh đã sửa ›
                    </button>
                  )}
                </div>
              ) : isRectified ? (
                <div className="no-print" style={{
                  background: '#f3e8ff',
                  border: '1.5px solid #d8b4fe',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', minWidth: 0, flex: 1 }}>
                    <div style={{ background: '#e9d5ff', padding: '6px', borderRadius: '50%', color: '#7c3aed', marginTop: '2px', flexShrink: 0 }}>
                      <RotateCcw size={20} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 800, color: '#6b21a8', fontSize: '0.95rem', wordBreak: 'break-word' }}>
                        ĐƠN VỊ THI CÔNG ĐÃ BÁO CÁO KHẮC PHỤC XONG - MỜI NGHIỆM THU LẠI
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#7e22ce', marginTop: '3px' }}>
                        Người gửi: <strong>{reportState.rectification?.submittedBy?.name || 'KS. Lê Văn Kỹ Thuật'}</strong> (ĐVTC) • {reportState.rectification?.submittedBy?.timestamp || 'Hôm nay'}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#581c87', marginTop: '4px', wordBreak: 'break-word' }}>
                        Biện pháp đã làm: <em>"{reportState.rectification?.description || rectifyDesc}"</em>
                      </div>
                    </div>
                  </div>
                  {rectifyPhotos.length > 0 && (
                    <button 
                      style={{ 
                        background: '#7c3aed', 
                        color: '#ffffff', 
                        border: 'none', 
                        borderRadius: '6px', 
                        padding: '6px 12px', 
                        fontSize: '0.8rem', 
                        fontWeight: 700, 
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        alignSelf: 'center'
                      }}
                      onClick={() => setActiveTab('RECTIFIED')}
                    >
                      Xem {rectifyPhotos.length} ảnh đã sửa ›
                    </button>
                  )}
                </div>
              ) : isRejected && (
                /* CẢNH BÁO NẾU BIÊN BẢN BỊ TỪ CHỐI */
                <div className="no-print" style={{
                  background: '#fef2f2',
                  border: '1.5px solid #f87171',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', minWidth: 0, flex: 1 }}>
                    <div style={{ background: '#fee2e2', padding: '6px', borderRadius: '50%', color: '#dc2626', marginTop: '2px', flexShrink: 0 }}>
                      <AlertTriangle size={20} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 800, color: '#991b1b', fontSize: '0.95rem', wordBreak: 'break-word' }}>
                        CẢNH BÁO: BIÊN BẢN CHƯA ĐẠT NGHIỆM THU - YÊU CẦU SỬA CHỮA KHẮC PHỤC
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#b91c1c', marginTop: '3px' }}>
                        Người lập: <strong>{rejectionInfo?.name || 'Cán bộ giám sát'}</strong> ({rejectionInfo?.roleTitle || rejectionInfo?.role || 'TVGS'}) • {rejectionInfo?.timestamp || 'Hôm nay'}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#7f1d1d', marginTop: '4px', wordBreak: 'break-word' }}>
                        Lý do: <em>"{reportState.conclusion?.rejectionReason}"</em>
                      </div>
                    </div>
                  </div>
                  {defectPhotos.length > 0 && (
                    <button 
                      style={{ 
                        background: '#dc2626', 
                        color: '#ffffff', 
                        border: 'none', 
                        borderRadius: '6px', 
                        padding: '6px 12px', 
                        fontSize: '0.8rem', 
                        fontWeight: 700, 
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        alignSelf: 'center'
                      }}
                      onClick={() => setActiveTab('DEFECTS')}
                    >
                      Xem {defectPhotos.length} ảnh lỗi hiện trường ›
                    </button>
                  )}
                </div>
              )}

              {/* Quốc hiệu tiêu ngữ & ngày tháng căn phải chuẩn Image 2 */}
              <div className="doc-header-national" style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.98rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                  CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '0.92rem', marginTop: '2px' }}>
                  <u>Độc lập - Tự do - Hạnh phúc</u>
                </div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '1px' }}>
                  --------***--------
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.86rem', fontStyle: 'italic', marginTop: '8px' }}>
                  {reportState.cityDate || 'Cần Thơ, ngày .....tháng.....năm 202...'}
                </div>
              </div>

              {/* Tiêu đề biên bản & Mã Số - Số Tài Liệu Căn Cứ chuẩn */}
              <div className="doc-main-title" style={{
                textAlign: 'center',
                margin: '14px 0 18px 0',
                padding: '8px 12px'
              }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 6px 0', textTransform: 'uppercase', color: '#0f172a', lineHeight: 1.35 }}>
                  {isMaterialReport 
                    ? 'BIÊN BẢN NGHIỆM THU VẬT LIỆU, THIẾT BỊ, SẢN PHẨM CHẾ TẠO SẴN TRƯỚC KHI ĐƯA VÀO SỬ DỤNG'
                    : 'BIÊN BẢN NGHIỆM THU CÔNG VIỆC XÂY DỰNG'}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', fontSize: '0.92rem' }}>
                  <div>
                    <strong>Số:</strong> <strong style={{ color: '#0f172a', fontSize: '1rem' }}>{reportDisplayNumber}</strong>
                  </div>
                  <div>
                    <strong>Số tài liệu căn cứ:</strong> <strong style={{ color: '#0f172a', fontSize: '0.98rem' }}>{cleanReqCode}</strong>
                  </div>
                </div>
              </div>

              {/* Thông tin dự án */}
              <div style={{ marginBottom: '14px', lineHeight: 1.6 }}>
                <div><strong>Dự án:</strong> {effectiveRequest.projectName || reportState.projectInfo?.projectName || 'Đầu tư xây dựng nhà ở Phường Thường Thạnh - An Phú Eco City'}</div>
                <div><strong>Công trình:</strong> {effectiveRequest.buildingName || reportState.projectInfo?.buildingName || 'Chung cư nhà ở xã hội 2'}</div>
                <div><strong>Hạng mục:</strong> {effectiveRequest.itemName || reportState.projectInfo?.itemName || 'Thi công hệ thống PCCC trong và ngoài nhà'}</div>
                <div><strong>Địa điểm xây dựng:</strong> {formatReportLocation(effectiveRequest.location || reportState.projectInfo?.location)}</div>
              </div>

              {/* 1. Đối tượng nghiệm thu */}
              <div style={{ marginBottom: '14px' }}>
                <strong>1. Đối tượng nghiệm thu:</strong>
                <div style={{ paddingLeft: '20px', fontWeight: 'bold', color: '#1e3a8a' }}>
                  {isMaterialReport ? (
                    rawMaterialsList.length > 1 ? (
                      <div>
                        <div>- Nghiệm thu danh mục {rawMaterialsList.length} loại vật liệu đầu vào gồm:</div>
                        <div style={{ paddingLeft: '14px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '3px', fontWeight: 600, color: '#1e3a8a' }}>
                          {rawMaterialsList.map((m, idx) => (
                            <span key={idx}>+ {idx + 1}. {m.name} ({m.quantity} {m.unit})</span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        - Nghiệm thu vật liệu đầu vào: {rawMaterialsList[0]?.name || reportState.materialDetails?.name || 'Vật tư thi công'} ({rawMaterialsList[0]?.quantity} {rawMaterialsList[0]?.unit})
                      </div>
                    )
                  ) : (
                    <div>- {effectiveRequest.taskContent || reportState.inspectionObject || 'Nghiệm thu công việc xây dựng'}</div>
                  )}
                </div>
              </div>

              {/* 2. Thành phần trực tiếp nghiệm thu (Căn thẳng hàng chức vụ chuẩn theo yêu cầu) */}
              <div style={{ marginBottom: '14px' }}>
                <strong>2. Thành phần trực tiếp nghiệm thu:</strong>
                
                <div style={{ paddingLeft: '16px', marginTop: '4px' }}>
                  {/* a) Đại diện Chủ đầu tư */}
                  <div><strong>a) Đại diện Chủ đầu tư:</strong> {invCompany}</div>
                  <div style={{ paddingLeft: '16px' }}>
                    {invOfficerName.trim().toLowerCase() === invLeadName.trim().toLowerCase() || assignedInv?.role === 'LEAD_INVESTOR' ? (
                      <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1.65 }}>
                        <span style={{ width: '240px', flexShrink: 0 }}>- Ông: {invLeadName}</span>
                        <span>Chức vụ: {invLeadPosition}</span>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1.65 }}>
                          <span style={{ width: '240px', flexShrink: 0 }}>- Ông: {invLeadName}</span>
                          <span>Chức vụ: {invLeadPosition}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1.65 }}>
                          <span style={{ width: '240px', flexShrink: 0 }}>- Ông: {invOfficerName}</span>
                          <span>Chức vụ: {invOfficerPosition}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* b) Tư vấn giám sát */}
                  <div style={{ marginTop: '4px' }}><strong>b) Tư vấn giám sát:</strong> {supCompany}</div>
                  <div style={{ paddingLeft: '16px' }}>
                    {supOfficerName.trim().toLowerCase() === supLeadName.trim().toLowerCase() || assignedSup?.role === 'LEAD_SUPERVISOR' ? (
                      <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1.65 }}>
                        <span style={{ width: '240px', flexShrink: 0 }}>- Ông: {supLeadName}</span>
                        <span>Chức vụ: {supLeadPosition}</span>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1.65 }}>
                          <span style={{ width: '240px', flexShrink: 0 }}>- Ông: {supLeadName}</span>
                          <span>Chức vụ: {supLeadPosition}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1.65 }}>
                          <span style={{ width: '240px', flexShrink: 0 }}>- Ông: {supOfficerName}</span>
                          <span>Chức vụ: {supOfficerPosition}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* c) Đơn vị thi công */}
                  <div style={{ marginTop: '4px' }}>
                    <strong>c) Đơn vị thi công:</strong> <span>{contCompany}</span>
                  </div>
                  <div style={{ paddingLeft: '16px' }}>
                    {contOfficerName.trim().toLowerCase() === contLeadName.trim().toLowerCase() ? (
                      <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1.65 }}>
                        <span style={{ width: '240px', flexShrink: 0 }}>- Ông: {contLeadName}</span>
                        <span>Chức vụ: {contLeadPosition}</span>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1.65 }}>
                          <span style={{ width: '240px', flexShrink: 0 }}>- Ông: {contLeadName}</span>
                          <span>Chức vụ: {contLeadPosition}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1.65 }}>
                          <span style={{ width: '240px', flexShrink: 0 }}>- Ông: {contOfficerName}</span>
                          <span>Chức vụ: {contOfficerPosition}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Thời gian nghiệm thu chuẩn theo mẫu */}
              <div style={{ marginBottom: '14px', lineHeight: 1.65 }}>
                <div><strong>3.  Thời gian nghiệm thu:</strong></div>
                <div style={{ paddingLeft: '28px', margin: '2px 0' }}>
                  <div>
                    Bắt đầu:{' '}
                    <span
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => handleUpdateStartTimeText(e.currentTarget.textContent)}
                      style={{
                        outline: 'none',
                        cursor: 'text',
                        borderBottom: '1px dashed transparent',
                        transition: 'border-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderBottom = '1px dashed #3b82f6'}
                      onMouseLeave={(e) => e.currentTarget.style.borderBottom = '1px dashed transparent'}
                      title="Bấm vào để chỉnh sửa nếu cần"
                    >
                      {startTimeText}
                    </span>
                  </div>
                  <div>
                    Kết thúc:{' '}
                    <span
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => handleUpdateEndTimeText(e.currentTarget.textContent)}
                      style={{
                        outline: 'none',
                        cursor: 'text',
                        borderBottom: '1px dashed transparent',
                        transition: 'border-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderBottom = '1px dashed #3b82f6'}
                      onMouseLeave={(e) => e.currentTarget.style.borderBottom = '1px dashed transparent'}
                      title="Bấm vào để chỉnh sửa nếu cần"
                    >
                      {endTimeText}
                    </span>
                  </div>
                </div>
                <div>
                  Tại: Dự án Đầu tư xây dựng nhà ở Phường Thường Thạnh - An Phú Eco City
                </div>
              </div>

              {/* 4. Nội dung và đánh giá nghiệm thu */}
              {isMaterialReport ? (
                /* NỘI DUNG MẪU SỐ 12: NGHIỆM THU VẬT LIỆU ĐẦU VÀO */
                <div style={{ marginBottom: '14px' }}>
                  <strong>4. Nội dung và kết quả kiểm tra (Theo Mẫu số 12):</strong>
                  <div style={{ paddingLeft: '16px', marginTop: '4px' }}>
                    <div><strong>4.1. Các tài liệu làm căn cứ nghiệm thu:</strong></div>
                    <div style={{ paddingLeft: '16px' }}>
                      - Phiếu yêu cầu nghiệm thu của nhà thầu thi công xây dựng số: <strong>{cleanReqCode}</strong><br />
                      - Hồ sơ thiết kế bản vẽ thi công được chủ đầu tư phê duyệt.<br />
                      - Tiêu chuẩn, quy phạm xây dựng được áp dụng (Động theo file Excel DANH MỤC TIÊU CHUẨN NGHIỆM THU.xls):
                      <div className="doc-standards-list" style={{ paddingLeft: '16px', color: '#b91c1c' }}>
                        {displayStandards.map((stdStr, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', margin: '2px 0' }}>
                            <input 
                              type="checkbox" 
                              checked={selectedStandards.includes(stdStr)} 
                              onChange={() => toggleStandard(stdStr)}
                              style={{ marginTop: '3px' }}
                            />
                            <span>+ {stdStr}</span>
                          </div>
                        ))}
                      </div>
                      - Hồ sơ thầu và hợp đồng xây dựng số: 0203/HĐXD/APCT-GHVP ký ngày 02 tháng 03 năm 2026.<br />
                      - Hồ sơ xuất xứ, Chứng chỉ kỹ thuật xuất xưởng: <strong>{
                        Array.from(new Set(rawMaterialsList.map(m => m.certificateNumber).filter(Boolean))).join(', ') ||
                        reportState.materialDetails?.certificateNumber || 
                        'Số CCXX-2026/VL-APG'
                      }</strong><br />
                      - Kết quả thí nghiệm mẫu kiểm nghiệm chất lượng: Đạt yêu cầu.<br />
                      - Danh mục tính năng kỹ thuật của các đối tượng nghiệm thu.<br />
                      - Nhật ký thi công: Đã ghi chép đầy đủ theo quy định.
                    </div>

                    <div style={{ marginTop: '12px' }}>
                      <strong>4.2. Bảng kết quả kiểm tra vật liệu đối chiếu thực tế (Danh mục {rawMaterialsList.length} vật liệu):</strong>
                      <div style={{ overflowX: 'auto', marginTop: '6px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.86rem' }}>
                          <thead>
                            <tr style={{ background: '#f8fafc', fontWeight: 700, color: '#334155' }}>
                              <th style={{ border: '1px solid #94a3b8', padding: '6px', width: '38px' }}>STT</th>
                              <th style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'left', minWidth: '150px' }}>Chủng loại vật liệu</th>
                              <th style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'left', minWidth: '130px' }}>Xuất xứ</th>
                              <th style={{ border: '1px solid #94a3b8', padding: '6px', width: '60px' }}>Đơn vị</th>
                              <th style={{ border: '1px solid #94a3b8', padding: '6px', width: '80px', textAlign: 'right' }}>Khối lượng</th>
                              <th style={{ border: '1px solid #94a3b8', padding: '6px', textAlign: 'left', minWidth: '120px' }}>Số CCXX / CO-CQ</th>
                              <th style={{ border: '1px solid #94a3b8', padding: '6px', width: '100px' }}>Đánh giá</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rawMaterialsList.map((mat, idx) => (
                              <tr key={idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                                <td style={{ border: '1px solid #cbd5e1', padding: '7px 4px', color: '#475569' }}>{idx + 1}</td>
                                <td style={{ border: '1px solid #cbd5e1', padding: '7px 8px', fontWeight: 600, textAlign: 'left', color: '#0f172a' }}>
                                  {mat.name || 'Vật tư thi công'}
                                </td>
                                <td style={{ border: '1px solid #cbd5e1', padding: '7px 8px', textAlign: 'left', color: '#334155' }}>
                                  {mat.origin || 'Nhà máy sản xuất chính hãng'}
                                </td>
                                <td style={{ border: '1px solid #cbd5e1', padding: '7px 4px', textAlign: 'center', color: '#475569' }}>
                                  {mat.unit || 'Lô'}
                                </td>
                                <td style={{ border: '1px solid #cbd5e1', padding: '7px 8px', fontWeight: 600, textAlign: 'right', color: '#059669' }}>
                                  {mat.quantity || '—'}
                                </td>
                                <td style={{ border: '1px solid #cbd5e1', padding: '7px 8px', fontSize: '0.8rem', textAlign: 'left', color: '#64748b' }}>
                                  {mat.certificateNumber || reportState.materialDetails?.certificateNumber || '—'}
                                </td>
                                <td style={{ border: '1px solid #cbd5e1', padding: '7px 6px' }}>
                                  <strong style={{ color: (isCompleted && (reportState?.rectification || report?.rectification)) || isRectified ? '#059669' : isRejected ? '#dc2626' : '#059669', fontSize: '0.82rem' }}>
                                    {isRejected ? '[ ] Đạt  [X] K.Đạt' : '[X] Đạt  [ ] K.Đạt'}
                                  </strong>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div style={{ marginTop: '10px' }}>
                      <strong>4.3. Các ý kiến khác nếu có:</strong> <em>{isRejected ? 'Chưa đủ chứng chỉ xuất xưởng hoặc kết quả thí nghiệm' : 'Không'}</em>
                    </div>
                  </div>
                </div>
              ) : (
                /* NỘI DUNG BIÊN BẢN CÔNG VIỆC XÂY DỰNG */
                <div style={{ marginBottom: '14px' }}>
                  <strong>4. Đánh giá công việc xây dựng đã thực hiện:</strong>
                  <div style={{ paddingLeft: '16px', marginTop: '4px' }}>
                    <div><strong>4.1. Tài liệu căn cứ nghiệm thu:</strong></div>
                    <div style={{ paddingLeft: '16px' }}>
                      4.1.1 Phiếu yêu cầu nghiệm thu của nhà thầu thi công số: <strong>{cleanReqCode}</strong><br />
                      4.1.2 Hồ sơ thiết kế BVTC (đã được Chủ đầu tư phê duyệt ngày{' '}
                      <span className="screen-only">
                        <input
                          type="text"
                          value={designApprovalDate}
                          onChange={(e) => handleUpdateDesignApprovalDate(e.target.value)}
                          style={{
                            border: 'none',
                            borderBottom: '1px dashed #2563eb',
                            background: 'rgba(37, 99, 235, 0.05)',
                            color: '#0f172a',
                            padding: '1px 4px',
                            fontSize: 'inherit',
                            fontWeight: 'bold',
                            width: '110px',
                            textAlign: 'center',
                            borderRadius: '3px'
                          }}
                          title="Bấm vào để chỉnh sửa ngày phê duyệt thiết kế"
                        />
                      </span>
                      <span className="print-only"><strong>{designApprovalDate}</strong></span>
                      ):<br />
                      &nbsp;&nbsp;&nbsp;&nbsp;+ Tên hồ sơ thiết kế: Hồ sơ thiết kế xây dựng triển khai sau hồ sơ TKCS.<br />
                      &nbsp;&nbsp;&nbsp;&nbsp;+ Những thay đổi thiết kế đã được chấp thuận: Không.<br />
                      4.1.3 Biện pháp thi công đã được phê duyệt: Biện pháp thi công số{' '}
                      <span className="screen-only">
                        <input
                          type="text"
                          value={constructionMethodCode}
                          onChange={(e) => handleUpdateConstructionMethodCode(e.target.value)}
                          style={{
                            border: 'none',
                            borderBottom: '1px dashed #2563eb',
                            background: 'rgba(37, 99, 235, 0.05)',
                            color: '#0f172a',
                            padding: '1px 4px',
                            fontSize: 'inherit',
                            fontWeight: 'bold',
                            width: '130px',
                            textAlign: 'center',
                            borderRadius: '3px'
                          }}
                          title="Bấm vào để chỉnh sửa số biện pháp thi công"
                        />
                      </span>
                      <span className="print-only"><strong>{constructionMethodCode}</strong></span>
                      .<br />
                      4.1.4 Quy chuẩn, tiêu chuẩn xây dựng được áp dụng:
                      <div className="doc-standards-list" style={{ paddingLeft: '16px', color: '#b91c1c' }}>
                        {displayStandards.map((stdStr, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', margin: '2px 0' }}>
                            <input 
                              type="checkbox" 
                              checked={selectedStandards.includes(stdStr)} 
                              onChange={() => toggleStandard(stdStr)}
                              style={{ marginTop: '3px' }}
                            />
                            <span>+ {stdStr}</span>
                          </div>
                        ))}
                      </div>
                      4.1.5 Biên bản nghiệm thu vật liệu đầu vào: Đạt yêu cầu.<br />
                      4.1.6 Các kết quả kiểm tra, thí nghiệm chất lượng vật liệu, thiết bị: Đạt yêu cầu.<br />
                      4.1.7 Nhật ký thi công: Đã ghi đầy đủ theo quy định.
                    </div>

                    <div style={{ marginTop: '6px' }}><strong>4.2. Chất lượng công việc xây dựng:</strong></div>
                    <div style={{ paddingLeft: '16px' }}>
                      - Đối chiếu với hồ sơ thiết kế được duyệt: <strong>[X] Đạt yêu cầu</strong><br />
                      - Đánh giá sự phù hợp của công việc xây dựng so với TCXD:{' '}
                      <strong style={{ color: (isCompleted && (reportState?.rectification || report?.rectification)) || isRectified ? '#059669' : isRejected ? '#dc2626' : 'inherit' }}>
                        {(isCompleted && (reportState?.rectification || report?.rectification)) || isRectified ? '[X] ĐÃ SỬA CHỮA ĐẠT YÊU CẦU' : isRejected ? '[X] KHÔNG ĐẠT YÊU CẦU' : '[X] Đạt yêu cầu'}
                      </strong><br />
                      - Kiểm tra việc thực hiện theo yêu cầu kỹ thuật của công trình xây dựng:{' '}
                      <strong style={{ color: (isCompleted && (reportState?.rectification || report?.rectification)) || isRectified ? '#059669' : isRejected ? '#dc2626' : 'inherit' }}>
                        {(isCompleted && (reportState?.rectification || report?.rectification)) || isRectified ? '[X] ĐÃ KHẮC PHỤC XONG' : isRejected ? '[X] CẦN SỬA CHỮA KHẮC PHỤC' : '[X] Đạt yêu cầu'}
                      </strong>
                    </div>

                    <div style={{ marginTop: '6px' }}><strong>4.3. Các ý kiến khác nếu có:</strong> <em>{isRejected ? 'Có tồn tại khiếm khuyết' : 'Không'}</em></div>
                  </div>
                </div>
              )}

              {/* 5. Kết luận */}
              <div style={{ marginBottom: '20px' }}>
                <strong>5. Kết luận:</strong>
                <div style={{ paddingLeft: '20px', marginTop: '4px' }}>
                  {isMaterialReport ? (
                    <div style={{ lineHeight: 1.6 }}>
                      {isRejected ? (
                        <div style={{ color: '#dc2626', fontWeight: 700 }}>
                          ❌ Chưa chấp thuận nghiệm thu. Yêu cầu ĐVTC cung cấp bổ sung đầy đủ chứng chỉ xuất xưởng, kết quả thí nghiệm hoặc khắc phục trước khi mời nghiệm thu lại.
                        </div>
                      ) : (
                        <div>
                          Đối với các loại vật liệu, thiết bị, sản phẩm chế tạo sẵn liệt kê trong bảng nêu trên được đánh giá là <strong style={{ color: '#059669' }}>đạt yêu cầu</strong> và được chấp thuận đưa vào sử dụng cho công trình.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      - Chấp thuận nghiệm thu, đồng ý cho triển khai công việc tiếp theo:{' '}
                      {isCompleted ? (
                        <span><strong>☑ Đồng ý</strong> &nbsp;&nbsp; ☐ Không đồng ý</span>
                      ) : isRectified ? (
                        <span>
                          <strong style={{ color: '#059669', background: '#ecfdf5', padding: '3px 10px', borderRadius: '4px', border: '1.5px solid #a7f3d0' }}>
                            ☑ ĐÃ KHẮC PHỤC (CHỜ DUYỆT LẠI)
                          </strong>
                        </span>
                      ) : isRejected ? (
                        <span>
                          ☐ Đồng ý &nbsp;&nbsp;&nbsp;&nbsp;
                          <strong style={{ 
                            color: '#dc2626', 
                            background: '#fee2e2', 
                            padding: '3px 10px', 
                            borderRadius: '4px', 
                            border: '1.5px solid #f87171' 
                          }}>
                            ☑ KHÔNG ĐỒNG Ý
                          </strong>
                        </span>
                      ) : (
                        <span><strong>☑ Đồng ý</strong> &nbsp;&nbsp; ☐ Không đồng ý</span>
                      )}
                    </div>
                  )}

                  {/* NỘI DUNG SỬA CHỮA HOẶC LÝ DO TỪ CHỐI */}
                  {((isRectified || reportState.status === 'RECTIFIED') && !isCompleted && Boolean(reportState.rectification?.description || report?.rectification?.description)) ? (
                    <div style={{ 
                      marginTop: '8px', 
                      background: '#f5f3ff', 
                      borderLeft: '4px solid #7c3aed', 
                      padding: '10px 14px', 
                      borderRadius: '0 8px 8px 0' 
                    }}>
                      <div style={{ color: '#6b21a8', fontWeight: 700, marginBottom: '2px' }}>
                        🔄 Báo cáo khắc phục của ĐVTC:
                      </div>
                      <div style={{ color: '#581c87', fontSize: '0.88rem' }}>
                        "{reportState.rectification?.description || rectifyDesc}"
                      </div>
                      <div style={{ color: '#6d28d9', fontSize: '0.82rem', marginTop: '4px' }}>
                        • Kèm {rectifyPhotos.length} ảnh hiện trường sau sửa chữa (Xem tab 🛠️ Ảnh Đã Sửa)
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '2px' }}>
                        • Người báo cáo: {reportState.rectification?.submittedBy?.name || currentUser?.fullName} ({reportState.rectification?.submittedBy?.timestamp || 'Hôm nay'})
                      </div>
                    </div>
                  ) : isRejected ? (
                    <div style={{ 
                      marginTop: '8px', 
                      background: '#fff1f2', 
                      borderLeft: '4px solid #ef4444', 
                      padding: '10px 14px', 
                      borderRadius: '0 8px 8px 0' 
                    }}>
                      <div style={{ color: '#b91c1c', marginBottom: '4px' }}>
                        <strong>• Lý do không nghiệm thu:</strong> {reportState.conclusion?.rejectionReason || rejectReason}
                      </div>
                      <div style={{ color: '#b91c1c', marginBottom: '4px' }}>
                        <strong>• Yêu cầu sửa chữa, khắc phục:</strong> {reportState.conclusion?.repairRequired || repairRequired || 'Sửa chữa và mời nghiệm thu lại'}
                      </div>
                      {reportState.conclusion?.deadline && (
                        <div style={{ color: '#475569', fontSize: '0.85rem' }}>
                          <strong>• Thời hạn hoàn thành:</strong> {reportState.conclusion.deadline}
                        </div>
                      )}
                      {reportState.rectificationHistory?.length > 0 && (
                        <div style={{ color: '#7c3aed', fontSize: '0.82rem', marginTop: '6px', fontWeight: 600 }}>
                          • Lịch sử: Đã qua {reportState.rectificationHistory.length} đợt sửa chữa trước đó chưa đạt chuẩn. Yêu cầu ĐVTC tiếp tục khắc phục.
                        </div>
                      )}
                      {defectPhotos.length > 0 && (
                        <div style={{ color: '#2563eb', fontSize: '0.85rem', marginTop: '4px' }}>
                          <strong>• Ảnh khiếm khuyết đính kèm:</strong> {defectPhotos.length} ảnh hiện trường kèm tọa độ GPS (xem tab ⚠️ Ảnh Lỗi)
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div>- Yêu cầu sửa chữa, hoàn thiện công việc xây dựng đã thực hiện: <em>Không có</em></div>
                      <div>- Các yêu cầu khác (nếu có): <em>Không có</em></div>
                    </>
                  )}
                </div>
              </div>

              {/* CHỮ KÝ 3 BÊN */}
              <div className="doc-signatures-grid">
                {/* 1. CHỦ ĐẦU TƯ */}
                <div>
                  <strong style={{ fontSize: '0.95rem' }}>CHỦ ĐẦU TƯ / BAN QLDA</strong><br />
                  <span style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>(Ký, ghi rõ họ tên)</span>
                  <div style={{ height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="screen-only">
                      {isInvestorSigned ? (
                        <div style={{ color: '#047857', fontWeight: 'bold', textAlign: 'center' }}>
                          <div style={{ fontSize: '1.2rem', fontFamily: 'cursive' }}>
                            {invOfficerName || reportState.attendees?.investor?.person || 'Ngô Quý Linh'}
                          </div>
                          <div style={{ fontSize: '0.72rem' }}>✓ Đã ký số điện tử</div>
                          {reportState.attendees?.investor?.signedAt && (
                            <div style={{ fontSize: '0.65rem', color: '#64748b' }}>
                              {reportState.attendees.investor.signedAt}
                            </div>
                          )}
                        </div>
                      ) : isRejected && (rejectionInfo?.role === 'INVESTOR' || rejectionInfo?.role === 'LEAD_INVESTOR') ? (
                        <div style={{ border: '2px dashed #dc2626', background: '#fef2f2', padding: '6px 10px', borderRadius: '6px', textAlign: 'center' }}>
                          <div style={{ color: '#dc2626', fontWeight: 800, fontSize: '0.85rem' }}>❌ TỪ CHỐI DUYỆT</div>
                          <div style={{ fontSize: '0.72rem', color: '#991b1b' }}>{rejectionInfo?.name}</div>
                          <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{rejectionInfo?.timestamp}</div>
                        </div>
                      ) : isRectified && (rejectionInfo?.role === 'INVESTOR' || rejectionInfo?.role === 'LEAD_INVESTOR' || reportState.rectification?.target === 'INVESTOR') ? (
                        <span style={{ color: '#7c3aed', fontStyle: 'italic', fontSize: '0.8rem', fontWeight: 600 }}>(Chờ CĐT kiểm tra lại)</span>
                      ) : !isSupervisorSigned ? (
                        <span style={{ color: '#d97706', fontStyle: 'italic', fontSize: '0.8rem' }}>(Chờ TVGS duyệt trước)</span>
                      ) : (
                        <span style={{ color: '#d97706', fontStyle: 'italic', fontSize: '0.8rem', fontWeight: 600 }}>(Chờ CĐT ký duyệt)</span>
                      )}
                    </div>
                  </div>
                  <strong className="screen-only">{invOfficerName || reportState.attendees?.investor?.person || 'Ngô Quý Linh'}</strong>
                </div>

                {/* 2. TƯ VẤN GIÁM SÁT */}
                <div>
                  <strong style={{ fontSize: '0.95rem' }}>TƯ VẤN GIÁM SÁT</strong><br />
                  <span style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>(Ký, ghi rõ họ tên)</span>
                  <div style={{ height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="screen-only">
                      {isSupervisorSigned ? (
                        <div style={{ color: '#047857', fontWeight: 'bold', textAlign: 'center' }}>
                          <div style={{ fontSize: '1.2rem', fontFamily: 'cursive' }}>
                            {supOfficerName || reportState.attendees?.supervisor?.person || 'Đinh Xuân Thám'}
                          </div>
                          <div style={{ fontSize: '0.72rem' }}>✓ Đã ký số điện tử</div>
                          {reportState.attendees?.supervisor?.signedAt && (
                            <div style={{ fontSize: '0.65rem', color: '#64748b' }}>
                              {reportState.attendees.supervisor.signedAt}
                            </div>
                          )}
                        </div>
                      ) : isRejected && (rejectionInfo?.role === 'SUPERVISOR' || rejectionInfo?.role === 'LEAD_SUPERVISOR') ? (
                        <div style={{ border: '2px dashed #dc2626', background: '#fef2f2', padding: '6px 10px', borderRadius: '6px', textAlign: 'center' }}>
                          <div style={{ color: '#dc2626', fontWeight: 800, fontSize: '0.85rem' }}>❌ TỪ CHỐI NGHIỆM THU</div>
                          <div style={{ fontSize: '0.72rem', color: '#991b1b' }}>{rejectionInfo?.name}</div>
                          <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{rejectionInfo?.timestamp}</div>
                        </div>
                      ) : isRectified && (rejectionInfo?.role === 'SUPERVISOR' || rejectionInfo?.role === 'LEAD_SUPERVISOR' || reportState.rectification?.target === 'SUPERVISOR') ? (
                        <span style={{ color: '#7c3aed', fontStyle: 'italic', fontSize: '0.8rem', fontWeight: 600 }}>(Chờ TVGS nghiệm thu lại)</span>
                      ) : (
                        <span style={{ color: '#059669', fontStyle: 'italic', fontSize: '0.8rem', fontWeight: 600 }}>(Chờ TVGS kiểm tra & ký)</span>
                      )}
                    </div>
                  </div>
                  <strong className="screen-only">{supOfficerName || reportState.attendees?.supervisor?.person || 'Đinh Xuân Thám'}</strong>
                </div>

                {/* 3. ĐƠN VỊ THI CÔNG */}
                <div>
                  <strong style={{ fontSize: '0.95rem' }}>ĐƠN VỊ THI CÔNG</strong><br />
                  <span style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>(Ký, ghi rõ họ tên)</span>
                  <div style={{ height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="screen-only">
                      {isContractorSigned ? (
                        <div style={{ color: '#047857', fontWeight: 'bold', textAlign: 'center' }}>
                          <div style={{ fontSize: '1.2rem', fontFamily: 'cursive' }}>
                            {contOfficerName || reportState.attendees?.contractor?.person || contLeadName || 'Trần Mạnh Hưng'}
                          </div>
                          <div style={{ fontSize: '0.72rem' }}>✓ Đã ký số điện tử</div>
                        </div>
                      ) : (
                        <span style={{ color: '#2563eb', fontStyle: 'italic', fontSize: '0.8rem', fontWeight: 600 }}>(Chờ ĐVTC ký)</span>
                      )}
                    </div>
                  </div>
                  <strong className="screen-only">{contOfficerName || reportState.attendees?.contractor?.person || contLeadName || 'Trần Mạnh Hưng'}</strong>
                </div>
              </div>

              {/* THANH TÙY CHỌN IN KÈM PHỤ LỤC ẢNH HAY CHỈ IN 1 TRANG BIÊN BẢN */}
              {totalPhotos > 0 && (
                <div className="no-print" style={{ 
                  marginTop: '28px', 
                  padding: '14px 18px', 
                  background: includePhotosInPrint ? '#eff6ff' : '#f8fafc', 
                  border: includePhotosInPrint ? '1.5px solid #3b82f6' : '1px dashed #cbd5e1', 
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '14px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ 
                      background: includePhotosInPrint ? '#dbeafe' : '#e2e8f0', 
                      color: includePhotosInPrint ? '#2563eb' : '#64748b', 
                      padding: '8px', 
                      borderRadius: '8px' 
                    }}>
                      <Camera size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>
                        Phụ Lục Hình Ảnh Hiện Trường ({totalPhotos} ảnh)
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                        {includePhotosInPrint 
                          ? '✓ Đang BẬT in kèm ảnh: Bản in sẽ gồm Trang 1 (Biên bản A4) + Các trang sau (Ảnh GPS & timestamp).' 
                          : 'Đang TẮT in kèm ảnh: Bản in sẽ chỉ có DUY NHẤT 1 trang Biên bản A4 chuẩn (in siêu nhanh, không lo lỗi/treo máy).'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setIncludePhotosInPrint(prev => !prev)}
                      style={{
                        padding: '7px 14px',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: 'none',
                        background: includePhotosInPrint ? '#2563eb' : '#0284c7',
                        color: '#ffffff'
                      }}
                    >
                      {includePhotosInPrint ? '✕ Bỏ In Kèm Ảnh (Chỉ in 1 trang)' : '＋ Bật In Kèm Cả Ảnh'}
                    </button>
                  </div>
                </div>
              )}

              {/* PHỤ LỤC HÌNH ẢNH HIỆN TRƯỜNG KÈM THEO BIÊN BẢN (IN KÈM THEO BIÊN BẢN) */}
              {includePhotosInPrint && (
                <div className="doc-photo-appendix" style={{ marginTop: '36px', pageBreakBefore: 'always', breakBefore: 'page' }}>
                  <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ width: '45%', textAlign: 'center', fontSize: '0.82rem' }}>
                        <strong>{(contCompany || reportState.attendees?.contractor?.company || 'Công ty TNHH Gia Huy Vĩnh Phúc').toUpperCase()}</strong><br />
                        Số: {cleanReportNum}
                      </div>
                      <div style={{ width: '50%', textAlign: 'center', fontSize: '0.82rem' }}>
                        <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br />
                        <u>Độc lập - Tự do - Hạnh phúc</u>
                      </div>
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 'bold', margin: '14px 0 4px 0', textTransform: 'uppercase' }}>
                      PHỤ LỤC HÌNH ẢNH HIỆN TRƯỜNG KÈM THEO BIÊN BẢN
                    </h3>
                    <div style={{ fontSize: '0.88rem', fontStyle: 'italic', color: '#334155' }}>
                      (Kèm theo Biên bản nghiệm thu số: <strong>{cleanReportNum}</strong> - Ngày: {reportState.time?.startTime || reportState.cityDate})
                    </div>
                  </div>

                  {/* 1. ẢNH HIỆN TRƯỜNG THI CÔNG BAN ĐẦU */}
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ 
                      background: '#f1f5f9', 
                      borderLeft: '4px solid #2563eb', 
                      padding: '8px 12px', 
                      marginBottom: '12px',
                      fontSize: '0.96rem', 
                      fontWeight: 'bold',
                      color: '#0f172a'
                    }}>
                      I. ẢNH HIỆN TRƯỜNG THI CÔNG BAN ĐẦU ({evidencePhotos.length} ảnh)
                    </div>
                    {evidencePhotos.length === 0 ? (
                      <div style={{ fontStyle: 'italic', color: '#64748b', fontSize: '0.85rem', padding: '6px 12px' }}>
                        (Không có ảnh hiện trường ban đầu đính kèm)
                      </div>
                    ) : (
                      <div className="doc-photo-grid">
                        {evidencePhotos.map((photo, idx) => (
                          <div key={photo.id || idx} className="doc-photo-card">
                            <div className="doc-photo-card-img-wrapper" style={{ height: '210px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#f8fafc', borderRadius: '6px', marginBottom: '8px' }}>
                              <img 
                                src={photo.url} 
                                alt={photo.caption || `Ảnh hiện trường ${idx + 1}`} 
                                loading="lazy"
                                onError={(e) => { e.target.style.display = 'none'; }}
                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                              />
                            </div>
                            <div style={{ fontSize: '0.82rem', lineHeight: 1.45, color: '#1e293b' }}>
                              <strong>Hình {idx + 1}:</strong> {photo.caption || 'Hiện trường thi công công tác xây dựng'}<br />
                              {photo.timestamp && <span style={{ color: '#475569' }}>⏰ <strong>Thời gian:</strong> {photo.timestamp}<br /></span>}
                              {photo.gps && <span style={{ color: '#475569' }}>📍 <strong>GPS:</strong> {typeof photo.gps === 'object' && photo.gps?.lat ? `${photo.gps.lat.toFixed(5)}, ${photo.gps.lng.toFixed(5)}` : String(photo.gps)}<br /></span>}
                              {photo.photographer && <span style={{ color: '#475569' }}>👤 <strong>Người chụp:</strong> {photo.photographer}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 2. ẢNH KHIẾM KHUYẾT / TỒN TẠI KỸ THUẬT (NẾU CÓ) */}
                  {(defectPhotos.length > 0 || isRejected) && (
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ 
                        background: '#fef2f2', 
                        borderLeft: '4px solid #dc2626', 
                        padding: '8px 12px', 
                        marginBottom: '12px',
                        fontSize: '0.96rem', 
                        fontWeight: 'bold',
                        color: '#991b1b'
                      }}>
                        II. ẢNH KHIẾM KHUYẾT / LỖI KỸ THUẬT CẦN KHẮC PHỤC ({defectPhotos.length} ảnh)
                      </div>
                      {defectPhotos.length === 0 ? (
                        <div style={{ fontStyle: 'italic', color: '#64748b', fontSize: '0.85rem', padding: '6px 12px' }}>
                          (Không ghi nhận khiếm khuyết tồn tại)
                        </div>
                      ) : (
                        <div className="doc-photo-grid">
                          {defectPhotos.map((photo, idx) => (
                            <div key={photo.id || idx} className="doc-photo-card">
                              <div className="doc-photo-card-img-wrapper" style={{ height: '210px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#fef2f2', borderRadius: '6px', marginBottom: '8px' }}>
                                <img 
                                  src={photo.url} 
                                  alt={photo.note || `Ảnh lỗi ${idx + 1}`} 
                                  loading="lazy"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                />
                              </div>
                              <div style={{ fontSize: '0.82rem', lineHeight: 1.45, color: '#1e293b' }}>
                                <strong style={{ color: '#dc2626' }}>Lỗi {idx + 1}:</strong> {photo.note || 'Tồn tại kỹ thuật cần sửa chữa'}<br />
                                {photo.timestamp && <span style={{ color: '#475569' }}>⏰ <strong>Thời gian:</strong> {photo.timestamp}<br /></span>}
                                {photo.gps && <span style={{ color: '#475569' }}>📍 <strong>GPS:</strong> {typeof photo.gps === 'object' && photo.gps?.lat ? `${photo.gps.lat.toFixed(5)}, ${photo.gps.lng.toFixed(5)}` : String(photo.gps)}<br /></span>}
                                {photo.photographer && <span style={{ color: '#475569' }}>👤 <strong>Người lập:</strong> {photo.photographer}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. ẢNH HIỆN TRƯỜNG SAU KHI KHẮC PHỤC SỬA CHỮA (NẾU CÓ) */}
                  {(rectifyPhotos.length > 0 || isRectified) && (
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ 
                        background: '#faf5ff', 
                        borderLeft: '4px solid #7c3aed', 
                        padding: '8px 12px', 
                        marginBottom: '12px',
                        fontSize: '0.96rem', 
                        fontWeight: 'bold',
                        color: '#6b21a8'
                      }}>
                        III. ẢNH HIỆN TRƯỜNG SAU KHI SỬA CHỮA KHẮC PHỤC ({rectifyPhotos.length} ảnh)
                      </div>
                      {rectifyPhotos.length === 0 ? (
                        <div style={{ fontStyle: 'italic', color: '#64748b', fontSize: '0.85rem', padding: '6px 12px' }}>
                          (Chưa có ảnh khắc phục)
                        </div>
                      ) : (
                        <div className="doc-photo-grid">
                          {rectifyPhotos.map((photo, idx) => (
                            <div key={photo.id || idx} className="doc-photo-card">
                              <div className="doc-photo-card-img-wrapper" style={{ height: '210px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#faf5ff', borderRadius: '6px', marginBottom: '8px' }}>
                                <img 
                                  src={photo.url} 
                                  alt={photo.caption || photo.note || `Ảnh khắc phục ${idx + 1}`} 
                                  loading="lazy"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                />
                              </div>
                              <div style={{ fontSize: '0.82rem', lineHeight: 1.45, color: '#1e293b' }}>
                                <strong style={{ color: '#7c3aed' }}>Khắc phục {idx + 1}:</strong> {photo.caption || photo.note || reportState.rectification?.description || 'Hiện trường đã khắc phục hoàn thiện'}<br />
                                {photo.timestamp && <span style={{ color: '#475569' }}>⏰ <strong>Thời gian:</strong> {photo.timestamp}<br /></span>}
                                {photo.gps && <span style={{ color: '#475569' }}>📍 <strong>GPS:</strong> {typeof photo.gps === 'object' && photo.gps?.lat ? `${photo.gps.lat.toFixed(5)}, ${photo.gps.lng.toFixed(5)}` : String(photo.gps)}<br /></span>}
                                {photo.photographer && <span style={{ color: '#475569' }}>👤 <strong>Người gửi:</strong> {photo.photographer}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : activeTab === 'EVIDENCE' ? (
            /* TAB ẢNH HIỆN TRƯỜNG NGHIỆM THU DYNAMIC */
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '16px',
                background: '#eff6ff',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid #bfdbfe',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.98rem', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Camera size={18} />
                    <span>Hình Ảnh Nghiệm Thu Hiện Trường ({evidencePhotos.length} ảnh)</span>
                  </h4>
                  <div style={{ fontSize: '0.8rem', color: '#2563eb', marginTop: '2px' }}>
                    Đóng dấu GPS & Thời gian thực • Minh chứng công tác xây dựng đã thực hiện
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <input 
                    ref={cameraEvidenceRef} 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    style={{ display: 'none' }} 
                    onChange={handleCaptureEvidencePhoto} 
                  />
                  <input 
                    ref={fileEvidenceRef} 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    style={{ display: 'none' }} 
                    onChange={handleCaptureEvidencePhoto} 
                  />
                  <button 
                    type="button" 
                    className="btn-primary" 
                    style={{ padding: '7px 12px', fontSize: '0.82rem', background: '#2563eb' }}
                    onClick={() => cameraEvidenceRef.current?.click()}
                  >
                    <Camera size={14} />
                    <span>Chụp ảnh</span>
                  </button>
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    style={{ padding: '7px 12px', fontSize: '0.82rem' }}
                    onClick={() => fileEvidenceRef.current?.click()}
                  >
                    <ImagePlus size={14} />
                    <span>Tải ảnh lên</span>
                  </button>
                </div>
              </div>

              {evidencePhotos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', background: '#ffffff', borderRadius: '12px', border: '2px dashed #cbd5e1' }}>
                  <Camera size={44} color="#94a3b8" style={{ margin: '0 auto 10px auto', display: 'block' }} />
                  <div style={{ fontWeight: 600, color: '#334155', fontSize: '1rem' }}>
                    Chưa có hình ảnh nghiệm thu hiện trường
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '6px' }}>
                    Bấm nút "Chụp ảnh" hoặc "Tải ảnh lên" ở trên để lưu trữ minh chứng nghiệm thu thực tế
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  {evidencePhotos.map((photo, idx) => (
                    <div 
                      key={photo.id || idx} 
                      style={{ 
                        background: '#ffffff', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '12px', 
                        overflow: 'hidden', 
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        position: 'relative'
                      }}
                    >
                      <div style={{ position: 'relative' }}>
                        <img 
                          src={photo.url} 
                          alt={photo.caption || `Ảnh ${idx + 1}`}
                          style={{ width: '100%', height: '210px', objectFit: 'cover', display: 'block' }}
                        />
                        <span style={{ 
                          position: 'absolute', 
                          top: '10px', 
                          left: '10px', 
                          background: '#2563eb', 
                          color: '#ffffff', 
                          fontSize: '0.72rem', 
                          fontWeight: 800, 
                          padding: '3px 8px', 
                          borderRadius: '4px' 
                        }}>
                          ẢNH #{idx + 1}
                        </span>
                        <button 
                          type="button" 
                          onClick={() => handleDeleteEvidencePhoto(photo.id)}
                          style={{ 
                            position: 'absolute', 
                            top: '10px', 
                            right: '10px', 
                            background: 'rgba(239, 68, 68, 0.9)', 
                            color: '#ffffff', 
                            border: 'none', 
                            borderRadius: '6px', 
                            width: '26px', 
                            height: '26px', 
                            cursor: 'pointer',
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center' 
                          }}
                          title="Xóa ảnh này"
                        >
                          <Trash2 size={14} />
                        </button>
                        <div style={{ 
                          position: 'absolute', 
                          bottom: '8px', 
                          left: '8px', 
                          right: '8px', 
                          background: 'rgba(15, 23, 42, 0.88)', 
                          backdropFilter: 'blur(4px)', 
                          color: '#ffffff', 
                          padding: '6px 10px', 
                          borderRadius: '6px', 
                          fontSize: '0.72rem',
                          lineHeight: 1.3
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} color="#60a5fa" />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              GPS: {photo.gps || '10.0076° N, 105.7823° E (P. Thường Thạnh, TP. Cần Thơ)'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <Clock size={12} color="#34d399" />
                            <span>{photo.time} {photo.photographer ? `• ${photo.photographer}` : ''}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b', marginBottom: '6px' }}>
                          {photo.caption || 'Ảnh thi công nghiệm thu hiện trường'}
                        </div>
                        <input 
                          type="text" 
                          value={photo.caption || ''} 
                          onChange={(e) => handleUpdateEvidenceCaption(photo.id, e.target.value)}
                          placeholder="Chỉnh sửa ghi chú ảnh..."
                          style={{ 
                            width: '100%', 
                            fontSize: '0.78rem', 
                            border: '1px solid #e2e8f0', 
                            borderRadius: '6px', 
                            padding: '4px 8px',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'DEFECTS' ? (
            /* TAB ẢNH LỖI KHIẾM KHUYẾT */
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '16px',
                background: '#fef2f2',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid #fecaca'
              }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.98rem', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={18} />
                    <span>Hình Ảnh Khiếm Khuyết Không Đạt Nghiệm Thu</span>
                  </h4>
                  <div style={{ fontSize: '0.8rem', color: '#b91c1c', marginTop: '2px' }}>
                    Căn cứ TVGS/CĐT yêu cầu Đơn vị thi công sửa chữa khắc phục
                  </div>
                </div>

                {/* Nút hành động dựa trên vai trò */}
                {(currentRole === 'CONTRACTOR' || currentRole === 'ADMIN') ? null : (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button 
                      type="button"
                      className="btn-primary" 
                      style={{ background: '#dc2626', padding: '8px 14px', fontSize: '0.82rem' }}
                      onClick={() => cameraInputRef.current?.click()}
                    >
                      <Camera size={15} />
                      <span>📸 Chụp Ảnh Lỗi</span>
                    </button>
                    <button 
                      type="button"
                      className="btn-secondary" 
                      style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImagePlus size={15} />
                      <span>📁 Tải Ảnh Lỗi</span>
                    </button>
                    <button 
                      type="button"
                      className="btn-danger" 
                      style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                      onClick={() => {
                        setRejectReason(reportState.conclusion?.rejectionReason || '');
                        setIsRejectModalOpen(true);
                      }}
                      title="Lập yêu cầu ĐVTC sửa chữa"
                    >
                      <AlertTriangle size={15} />
                      <span>Yêu Cầu Sửa Chữa</span>
                    </button>
                  </div>
                )}
              </div>

              {defectPhotos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', background: '#ffffff', borderRadius: '12px', border: '2px dashed #fecaca' }}>
                  <Camera size={40} color="#f87171" style={{ marginBottom: '10px' }} />
                  <div style={{ fontWeight: 600, color: '#991b1b' }}>Chưa có hình ảnh khiếm khuyết nào được lưu</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px', marginBottom: '16px' }}>
                    Bấm các nút dưới đây để chụp ảnh camera hoặc tải ảnh hiện trường lỗi để lập bằng chứng yêu cầu ĐVTC khắc phục.
                  </div>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button 
                      type="button" 
                      className="btn-primary" 
                      style={{ background: '#dc2626' }}
                      onClick={() => cameraInputRef.current?.click()}
                    >
                      <Camera size={16} /> <span>📸 Chụp Ảnh Camera Ngay</span>
                    </button>
                    <button 
                      type="button" 
                      className="btn-secondary"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImagePlus size={16} /> <span>📁 Tải Ảnh Lên</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                  {defectPhotos.map((photo, idx) => (
                    <div 
                      key={photo.id || idx} 
                      style={{ 
                        background: '#ffffff', 
                        border: '1.5px solid #fca5a5', 
                        borderRadius: '12px', 
                        overflow: 'hidden', 
                        boxShadow: '0 2px 6px rgba(239, 68, 68, 0.1)',
                        position: 'relative'
                      }}
                    >
                      <div style={{ position: 'relative' }}>
                        <img 
                          src={photo.url} 
                          alt={`Lỗi ${idx + 1}`}
                          style={{ width: '100%', height: '220px', objectFit: 'cover' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleDeletePhoto(photo.id)}
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            background: '#ef4444',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '26px',
                            height: '26px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                            zIndex: 10
                          }}
                          title="Xóa ảnh lỗi này"
                        >
                          <Trash2 size={14} />
                        </button>
                        <div style={{
                          position: 'absolute',
                          top: '10px',
                          left: '10px',
                          background: '#dc2626',
                          color: '#ffffff',
                          fontWeight: 800,
                          fontSize: '0.72rem',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          letterSpacing: '0.04em'
                        }}>
                          LỖI HIỆN TRƯỜNG #{idx + 1}
                        </div>
                        <div style={{ 
                          position: 'absolute', 
                          bottom: '8px', 
                          left: '8px', 
                          right: '8px', 
                          background: 'rgba(15, 23, 42, 0.88)', 
                          backdropFilter: 'blur(4px)', 
                          color: '#ffffff', 
                          padding: '6px 10px', 
                          borderRadius: '6px', 
                          fontSize: '0.72rem' 
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} color="#60a5fa" />
                            <span>{photo.gps || '10.0076° N, 105.7823° E'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <Clock size={12} color="#f87171" />
                            <span>{photo.time} • {photo.photographer || 'Cán bộ giám sát'}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#991b1b' }}>
                          {photo.caption}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* TAB ẢNH ĐÃ KHẮC PHỤC SỬA CHỮA (MỚI) */
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '16px',
                background: '#f5f3ff',
                padding: '14px 18px',
                borderRadius: '12px',
                border: '1.5px solid #d8b4fe',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', color: '#6b21a8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={18} color="#7c3aed" />
                    <span>Hình Ảnh Hiện Trường Sau Khi ĐVTC Khắc Phục Sửa Chữa</span>
                  </h4>
                  <div style={{ fontSize: '0.82rem', color: '#7e22ce', marginTop: '2px' }}>
                    Biện pháp đã làm: <strong>"{reportState.rectification?.description || rectifyDesc || 'Đã nắn chỉnh và khắc phục đạt yêu cầu'}"</strong>
                  </div>
                </div>

                  {currentRole === 'CONTRACTOR' && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button 
                      type="button"
                      className="btn-primary" 
                      style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', padding: '8px 14px', fontSize: '0.82rem' }}
                      onClick={() => cameraRectifyRef.current?.click()}
                    >
                      <Camera size={15} />
                      <span>Chụp Thêm Ảnh Sửa</span>
                    </button>
                    <button 
                      type="button"
                      className="btn-secondary" 
                      style={{ borderColor: '#d8b4fe', color: '#6b21a8', padding: '8px 14px', fontSize: '0.82rem' }}
                      onClick={() => fileRectifyRef.current?.click()}
                    >
                      <ImagePlus size={15} />
                      <span>Tải Ảnh Sửa</span>
                    </button>
                    <button 
                      type="button"
                      className="btn-secondary" 
                      style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                      onClick={() => setIsRectifyModalOpen(true)}
                    >
                      <Wrench size={15} />
                      <span>Sửa Nội Dung Khắc Phục</span>
                    </button>
                  </div>
                )}
              </div>

              {rectifyPhotos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', background: '#ffffff', borderRadius: '12px', border: '2px dashed #d8b4fe' }}>
                  <Wrench size={40} color="#a855f7" style={{ marginBottom: '10px' }} />
                  <div style={{ fontWeight: 600, color: '#6b21a8' }}>Chưa có hình ảnh khắc phục nào được gửi</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px', marginBottom: '14px' }}>
                    Bấm nút bên dưới để tải ảnh chụp sửa chữa hoặc chèn ảnh mẫu hiện trường làm bằng chứng nghiệm thu.
                  </div>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>

                    {currentRole === 'CONTRACTOR' && (
                      <button 
                        type="button"
                        className="btn-primary" 
                        style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' }}
                        onClick={() => setIsRectifyModalOpen(true)}
                      >
                        <Camera size={16} />
                        <span>Chụp & Gửi Ảnh Khắc Phục Ngay</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                  {rectifyPhotos.map((photo, idx) => (
                    <div 
                      key={photo.id || idx} 
                      style={{ 
                        background: '#ffffff', 
                        border: '1.5px solid #a7f3d0', 
                        borderRadius: '12px', 
                        overflow: 'hidden', 
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.1)' 
                      }}
                    >
                      <div style={{ position: 'relative' }}>
                        <img 
                          src={photo.url} 
                          alt={`Đã sửa ${idx + 1}`}
                          style={{ width: '100%', height: '220px', objectFit: 'cover' }}
                        />
                        <div style={{
                          position: 'absolute',
                          top: '10px',
                          left: '10px',
                          background: '#059669',
                          color: '#ffffff',
                          fontWeight: 800,
                          fontSize: '0.72rem',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          letterSpacing: '0.04em'
                        }}>
                          ✓ ĐÃ SỬA CHỮA #{idx + 1}
                        </div>
                        <div style={{ 
                          position: 'absolute', 
                          bottom: '8px', 
                          left: '8px', 
                          right: '8px', 
                          background: 'rgba(15, 23, 42, 0.88)', 
                          backdropFilter: 'blur(4px)', 
                          color: '#ffffff', 
                          padding: '6px 10px', 
                          borderRadius: '6px', 
                          fontSize: '0.72rem' 
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} color="#60a5fa" />
                            <span>{photo.gps || '10.0076° N, 105.7823° E'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <Clock size={12} color="#34d399" />
                            <span>{photo.time} • {photo.photographer || `ĐVTC ${contCompany.includes('Phan Lê') ? 'Phan Lê' : contCompany.includes('Bình Hoà') ? 'Bình Hoà' : 'Gia Huy Vĩnh Phúc'}`}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#065f46' }}>
                          {photo.caption}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="modal-footer no-print" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <button className="btn-secondary" onClick={onClose} style={{ padding: '8px 16px' }}>
              Đóng
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {/* 1. NẾU ĐÃ HOÀN TẤT TOÀN DIỆN */}
            {isCompleted ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#065f46',
                background: '#ecfdf5',
                border: '1.5px solid #a7f3d0',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.88rem',
                whiteSpace: 'nowrap'
              }}>
                <CheckCircle2 size={18} color="#059669" />
                <span>Biên bản đã hoàn tất nghiệm thu đủ 3 bên</span>
              </div>
            ) : isWaitingInvestor ? (
              /* GIAI ĐOẠN 2: TVGS ĐÃ ĐẠT -> CĐT PHÊ DUYỆT & KÝ SỐ */
              <>
                {currentRole === 'ADMIN' ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#6b21a8',
                    background: '#faf5ff',
                    border: '1.5px solid #d8b4fe',
                    padding: '7px 14px',
                    borderRadius: '8px',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap'
                  }}>
                    <ShieldCheck size={16} color="#7e22ce" />
                    <span>Admin: Chế độ chỉ xem giám sát • Đang chờ CĐT phê duyệt</span>
                  </div>
                ) : currentRole === 'INVESTOR' ? (
                  <>
                    <button 
                      className="btn-danger" 
                      onClick={() => {
                        setRejectReason('');
                        setIsRejectModalOpen(true);
                      }}
                      title="CĐT: Không đồng ý nghiệm thu, gửi yêu cầu trực tiếp cho ĐVTC sửa chữa"
                      style={{ padding: '8px 14px', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <XCircle size={16} />
                      <span>Không đồng ý</span>
                    </button>

                    <button 
                      className="btn-primary" 
                      style={{ background: '#d97706', padding: '8px 16px', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '6px' }} 
                      onClick={() => handleSign('investor')}
                      title="CĐT: Phê duyệt nghiệm thu đạt và ký số hoàn tất biên bản"
                    >
                      <CheckCircle2 size={16} />
                      <span>Đồng ý</span>
                    </button>
                  </>
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#059669',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    padding: '7px 14px',
                    borderRadius: '8px',
                    whiteSpace: 'nowrap'
                  }}>
                    <CheckCircle2 size={16} color="#059669" />
                    <span>TVGS đã duyệt đạt. Chờ CĐT phê duyệt & ký số.</span>
                  </div>
                )}
              </>
            ) : isRectified ? (
              /* 2. ĐÃ SỬA CHỮA - CHỜ DUYỆT LẠI */
              (() => {
                const targetReviewer = reportState?.rectification?.target || (
                  (reportState?.conclusion?.rejectedBy?.role === 'INVESTOR' || reportState?.conclusion?.rejectedBy?.role === 'LEAD_INVESTOR')
                    ? 'INVESTOR'
                    : 'SUPERVISOR'
                );
                return (
                  <>

                    {/* ĐVTC bổ sung thêm ảnh sửa nếu cần */}
                    {currentRole === 'CONTRACTOR' && (
                      <button 
                        className="btn-primary" 
                        style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', padding: '8px 14px', fontSize: '0.84rem' }}
                        onClick={() => setIsRectifyModalOpen(true)}
                      >
                        <Camera size={15} />
                        <span>Cập nhật ảnh sửa</span>
                      </button>
                    )}

                    {/* TVGS DUYỆT LẠI (Khi TVGS là người từ chối) */}
                    {targetReviewer === 'SUPERVISOR' && (
                      isSupervisorReviewer ? (
                        <>
                          <button 
                            className="btn-danger" 
                            style={{ padding: '8px 14px', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => {
                              setRejectReason('');
                              setIsRejectModalOpen(true);
                            }}
                            title="Sau sửa chữa vẫn chưa đạt chuẩn, TVGS yêu cầu ĐVTC sửa tiếp"
                          >
                            <XCircle size={16} />
                            <span>Không đồng ý</span>
                          </button>

                          <button 
                            className="btn-success" 
                            style={{ padding: '8px 16px', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                            onClick={handleReinspectSupervisor}
                            title="TVGS nghiệm thu đạt sau sửa chữa và chuyển CĐT phê duyệt"
                          >
                            <CheckCircle2 size={16} />
                            <span>Đồng ý</span>
                          </button>
                        </>
                      ) : isSupervisorRole ? (
                        <div style={{ color: '#15803d', fontSize: '0.82rem', fontWeight: 600, padding: '7px 12px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                          <Eye size={15} color="#16a34a" />
                          <span>Phiếu do <strong>{supAttendee?.person || 'Cán bộ TVGS'}</strong> kiểm tra lại</span>
                        </div>
                      ) : null
                    )}

                    {/* CĐT DUYỆT LẠI (Khi CĐT là người từ chối trực tiếp) */}
                    {targetReviewer === 'INVESTOR' && (
                      isInvestorReviewer ? (
                        <>
                          <button 
                            className="btn-danger" 
                            style={{ padding: '8px 14px', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => {
                              setRejectReason('');
                              setIsRejectModalOpen(true);
                            }}
                            title="Chủ đầu tư kiểm tra lại chưa đạt, yêu cầu ĐVTC sửa tiếp"
                          >
                            <XCircle size={16} />
                            <span>Không đồng ý</span>
                          </button>

                          <button 
                            className="btn-success" 
                            style={{ padding: '8px 16px', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                            onClick={handleReinspectInvestor}
                            title="Chủ đầu tư nghiệm thu đạt và ký phê duyệt hoàn tất"
                          >
                            <CheckCircle2 size={16} />
                            <span>Đồng ý</span>
                          </button>
                        </>
                      ) : isInvestorRole ? (
                        <div style={{ color: '#b45309', fontSize: '0.82rem', fontWeight: 600, padding: '7px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Eye size={15} color="#d97706" />
                          <span>Phiếu do <strong>{invAttendee?.person || 'Cán bộ CĐT'}</strong> kiểm tra lại</span>
                        </div>
                      ) : null
                    )}

                    {/* Thông báo tiến độ cho các bên khác */}
                    {targetReviewer === 'SUPERVISOR' && isInvestorRole && (
                      <div style={{ color: '#64748b', fontSize: '0.82rem', fontStyle: 'italic', padding: '6px 10px', background: '#f8fafc', borderRadius: '6px' }}>
                        ⏳ Chờ TVGS kiểm tra ảnh sửa trước. CĐT sẽ duyệt sau khi TVGS đạt.
                      </div>
                    )}
                    {targetReviewer === 'INVESTOR' && isSupervisorRole && (
                      <div style={{ color: '#047857', fontSize: '0.82rem', fontWeight: 600, padding: '6px 10px', background: '#ecfdf5', borderRadius: '6px' }}>
                        ✓ TVGS đã duyệt đạt. Chủ Đầu Tư đang trực tiếp kiểm tra lại kết quả sửa chữa.
                      </div>
                    )}
                  </>
                );
              })()
            ) : isRejected ? (
              /* 3. NẾU ĐANG BỊ TỪ CHỐI (CHỜ ĐVTC SỬA) */
              <>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  background: '#fee2e2', 
                  border: '1px solid #fecaca', 
                  padding: '6px 12px', 
                  borderRadius: '8px', 
                  color: '#dc2626', 
                  fontSize: '0.84rem', 
                  fontWeight: 600 
                }}>
                  <AlertCircle size={16} />
                  <span>
                    {rejectionInfo?.role === 'INVESTOR' || rejectionInfo?.role === 'LEAD_INVESTOR'
                      ? 'Chủ Đầu Tư yêu cầu sửa chữa. Đang chờ ĐVTC khắc phục.' 
                      : 'TVGS yêu cầu sửa chữa. Đang chờ ĐVTC khắc phục.'}
                  </span>
                </div>

                {/* ĐVTC BÁO CÁO ĐÃ SỬA & GỬI LẠI */}
                {currentRole === 'CONTRACTOR' && (
                  <button 
                    className="btn-primary" 
                    style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', padding: '8px 16px', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => setIsRectifyModalOpen(true)}
                  >
                    <Wrench size={16} />
                    <span>Sửa chữa & Gửi lại</span>
                  </button>
                )}

                {/* TVGS DUYỆT ĐẠT & CHUYỂN CĐT (Nếu người dùng là TVGS phụ trách) */}
                {isSupervisorReviewer && !isInvestorRole && (
                  <button 
                    className="btn-success" 
                    style={{ padding: '8px 16px', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={handleReinspectSupervisor}
                    title="TVGS xác nhận nghiệm thu đạt và chuyển Chủ đầu tư phê duyệt"
                  >
                    <CheckCircle2 size={16} />
                    <span>Đồng ý</span>
                  </button>
                )}

                {/* CĐT DUYỆT ĐẠT & KÝ PHÊ DUYỆT (Nếu người dùng là CĐT phụ trách) */}
                {isInvestorReviewer && (
                  <button 
                    className="btn-success" 
                    style={{ padding: '8px 16px', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={handleReinspectInvestor}
                    title="CĐT phê duyệt nghiệm thu đạt và ký số hoàn tất"
                  >
                    <CheckCircle2 size={16} />
                    <span>Đồng ý</span>
                  </button>
                )}

                {/* TVGS / CĐT chụp thêm ảnh lỗi (Admin không chụp lỗi/từ chối) */}
                {!isAdmin && ((isSupervisorRole && isSupervisorReviewer) || (isInvestorRole && isInvestorReviewer)) && (
                  <button 
                    className="btn-danger" 
                    style={{ padding: '8px 14px', fontSize: '0.84rem' }}
                    onClick={() => setIsRejectModalOpen(true)}
                  >
                    <Camera size={15} />
                    <span>Chụp Thêm Lỗi</span>
                  </button>
                )}
              </>
            ) : (
              /* 4. BIÊN BẢN BÌNH THƯỜNG / DUYỆT LẦN ĐẦU */
              <>
                {/* GIAI ĐOẠN 1: TVGS KIỂM TRA & DUYỆT TRƯỚC */}
                {!isSupervisorSigned ? (
                  <>
                    {isSupervisorReviewer ? (
                      <>
                        <button 
                          className="btn-danger" 
                          onClick={() => setIsRejectModalOpen(true)}
                          title="TVGS: Từ chối nghiệm thu, chụp ảnh lỗi hiện trường và yêu cầu ĐVTC sửa chữa"
                          style={{ padding: '8px 14px', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <XCircle size={16} />
                          <span>Không đồng ý</span>
                        </button>

                        <button 
                          className="btn-primary" 
                          style={{ background: '#059669', padding: '8px 16px', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '6px' }} 
                          onClick={() => handleSign('supervisor')}
                          title="TVGS: Xác nhận nghiệm thu đạt và ký số chuyển Chủ Đầu Tư"
                        >
                          <CheckCircle2 size={16} />
                          <span>Đồng ý</span>
                        </button>
                      </>
                    ) : isSupervisorRole ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        background: '#f0fdf4',
                        border: '1.5px solid #86efac',
                        color: '#166534',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        flexWrap: 'wrap'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Eye size={16} color="#15803d" />
                          <span>
                            👁️ Phiếu do <strong>{supAttendee?.person || 'Cán bộ TVGS'}</strong> phụ trách duyệt • Bạn đang xem với quyền TVGS Trưởng
                          </span>
                        </div>
                        {onReassign && (
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ borderColor: '#86efac', color: '#15803d', background: '#ffffff', padding: '4px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                            onClick={() => onReassign(relatedRequest || { id: reportState.requestId || reportState.id, requestNumber: reportState.requestNumber, buildingName: reportState.projectInfo?.buildingName, taskContent: reportState.inspectionObject, assignedRecipients: effectiveAssignedRecipients }, 'SUPERVISOR')}
                          >
                            <ArrowLeftRight size={13} />
                            <span>Đổi TVGS</span>
                          </button>
                        )}
                      </div>
                    ) : isInvestorRole ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: '#fffbeb',
                        border: '1.5px solid #fde68a',
                        color: '#b45309',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: 600
                      }}>
                        <Clock size={16} />
                        <span>Chờ TVGS duyệt trước: CĐT chỉ phê duyệt sau khi TVGS xác nhận đạt</span>
                      </div>
                    ) : null}
                  </>
                ) : (
                  /* GIAI ĐOẠN 2: TVGS ĐÃ ĐẠT -> CĐT PHÊ DUYỆT & KÝ SỐ */
                  <>
                    {!isInvestorSigned ? (
                      <>
                        {isInvestorReviewer ? (
                          <>
                            <button 
                              className="btn-danger" 
                              onClick={() => setIsRejectModalOpen(true)}
                              title="CĐT: Không đồng ý nghiệm thu, gửi yêu cầu trực tiếp cho ĐVTC sửa chữa"
                              style={{ padding: '8px 14px', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                              <XCircle size={16} />
                              <span>Không đồng ý</span>
                            </button>

                            <button 
                              className="btn-primary" 
                              style={{ background: '#d97706', padding: '8px 16px', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '6px' }} 
                              onClick={() => handleSign('investor')}
                              title="CĐT: Phê duyệt nghiệm thu đạt và ký số hoàn tất biên bản"
                            >
                              <CheckCircle2 size={16} />
                              <span>Đồng ý</span>
                            </button>
                          </>
                        ) : isInvestorRole ? (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px',
                            background: '#fffbeb',
                            border: '1.5px solid #fde68a',
                            color: '#b45309',
                            padding: '8px 14px',
                            borderRadius: '8px',
                            fontSize: '0.84rem',
                            fontWeight: 600,
                            flexWrap: 'wrap'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Eye size={16} color="#d97706" />
                              <span>
                                👁️ Phiếu do <strong>{invAttendee?.person || 'Cán bộ Ban QLDA'}</strong> phụ trách phê duyệt • Bạn đang xem với quyền Trưởng Ban QLDA
                              </span>
                            </div>
                            {onReassign && (
                              <button
                                type="button"
                                className="btn-secondary"
                                style={{ borderColor: '#fde68a', color: '#b45309', background: '#ffffff', padding: '4px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                onClick={() => onReassign(relatedRequest || { id: reportState.requestId || reportState.id, requestNumber: reportState.requestNumber, buildingName: reportState.projectInfo?.buildingName, taskContent: reportState.inspectionObject, assignedRecipients: effectiveAssignedRecipients }, 'INVESTOR')}
                              >
                                <ArrowLeftRight size={13} />
                                <span>Đổi CĐT</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: '#059669',
                            fontSize: '0.84rem',
                            fontWeight: 600,
                            background: '#ecfdf5',
                            border: '1px solid #a7f3d0',
                            padding: '7px 14px',
                            borderRadius: '8px'
                          }}>
                            <CheckCircle2 size={16} color="#059669" />
                            <span>TVGS đã ký duyệt đạt. Đang chờ Chủ Đầu Tư phê duyệt & ký số.</span>
                          </div>
                        )}
                      </>
                    ) : null}
                  </>
                )}

                {/* ĐVTC KÝ SỐ ĐỘC LẬP */}
                {currentRole === 'CONTRACTOR' && !isContractorSigned && (
                  <button className="btn-primary" onClick={() => handleSign('contractor')}>
                    <PenTool size={16} />
                    <span>Đơn Vị Thi Công Ký</span>
                  </button>
                )}

                {currentRole === 'ADMIN' && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#6b21a8',
                    background: '#faf5ff',
                    border: '1.5px solid #d8b4fe',
                    padding: '7px 14px',
                    borderRadius: '8px',
                    fontSize: '0.84rem',
                    fontWeight: 600
                  }}>
                    <ShieldCheck size={16} color="#7e22ce" />
                    <span>Admin: Chế độ chỉ xem giám sát hồ sơ (View-Only)</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          SUB-MODAL 1: TỪ CHỐI NGHIỆM THU (DÀNH CHO TVGS & CĐT)
          ========================================================================= */}
      {isRejectModalOpen && currentRole !== 'CONTRACTOR' && (
        <div className="modal-overlay no-print" style={{ zIndex: 160, background: 'rgba(15, 23, 42, 0.75)' }}>
          <div className="modal-content" style={{ maxWidth: '680px', maxHeight: '92vh', border: '1.5px solid #fca5a5' }}>
            <div className="modal-header" style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: '#fee2e2', padding: '8px', borderRadius: '10px', color: '#dc2626' }}>
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#991b1b' }}>
                    {isInvestorRole
                      ? (isRectified ? 'Chủ Đầu Tư: Không Đồng Ý Sau Sửa & Yêu Cầu Sửa Tiếp' : 'Chủ Đầu Tư: Không Đồng Ý Phê Duyệt & Yêu Cầu Sửa Chữa')
                      : (isRectified ? 'TVGS: Không Đồng Ý Sau Sửa & Yêu Cầu Sửa Tiếp' : 'TVGS: Không Đồng Ý Nghiệm Thu & Yêu Cầu Sửa Chữa')}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#b91c1c' }}>
                    Thông báo gửi trực tiếp đến <strong>Đơn Vị Thi Công</strong> • Biên bản số: <strong>{cleanReportNum}</strong>
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setIsRejectModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px' }}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ color: '#991b1b', fontWeight: 700 }}>
                  1. Lý do không nghiệm thu / Khiếm khuyết hiện trường (*):
                </label>
                <textarea 
                  className="form-textarea"
                  style={{ minHeight: '95px', borderColor: '#fca5a5' }}
                  placeholder="Nhập chi tiết các lỗi không đạt kỹ thuật..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ margin: '0 0 10px 0', fontWeight: 700, color: '#991b1b' }}>
                  2. Hình ảnh chụp lỗi hiện trường ({defectPhotos.length} ảnh):
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px', marginBottom: '14px' }}>
                  <button type="button" className="btn-secondary" style={{ borderColor: '#3b82f6', color: '#1d4ed8', background: '#eff6ff', justifyContent: 'center' }} onClick={() => cameraInputRef.current?.click()}>
                    <Camera size={16} /> <span>Chụp Ảnh Camera</span>
                  </button>
                  <button type="button" className="btn-secondary" style={{ justifyContent: 'center' }} onClick={() => fileInputRef.current?.click()}>
                    <ImagePlus size={16} /> <span>Tải Ảnh Từ Máy</span>
                  </button>
                </div>

                {defectPhotos.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                    {defectPhotos.map((photo, idx) => (
                      <div key={photo.id || idx} style={{ border: '1px solid #fecaca', borderRadius: '8px', overflow: 'hidden', background: '#fff', position: 'relative' }}>
                        <img src={photo.url} alt={`Lỗi ${idx + 1}`} style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                        <button type="button" onClick={() => handleDeletePhoto(photo.id)} style={{ position: 'absolute', top: '4px', right: '4px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <Trash2 size={12} />
                        </button>
                        <div style={{ padding: '6px' }}>
                          <input type="text" value={photo.caption} onChange={(e) => setDefectPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, caption: e.target.value } : p))} style={{ width: '100%', fontSize: '0.76rem', padding: '4px', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
              <button type="button" className="btn-secondary" onClick={() => setIsRejectModalOpen(false)}>Hủy bỏ</button>
              <button type="button" className="btn-danger" onClick={handleConfirmReject}>
                <AlertTriangle size={16} /> <span>
                  {isInvestorRole
                    ? (isRectified ? 'CĐT: Xác Nhận Không Đạt & Bắt Buộc Sửa Lại' : 'CĐT: Xác Nhận Không Đồng Ý & Gửi ĐVTC Sửa')
                    : (isRectified ? 'TVGS: Xác Nhận Không Đạt & Bắt Buộc Sửa Lại' : 'TVGS: Xác Nhận Không Đồng Ý & Gửi ĐVTC Sửa')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-MODAL 2: ĐVTC BÁO CÁO KHẮC PHỤC & GỬI ẢNH ĐÃ SỬA CHỮA (MỚI)
          ========================================================================= */}
      {isRectifyModalOpen && (
        <div className="modal-overlay no-print" style={{ zIndex: 170, background: 'rgba(15, 23, 42, 0.78)' }}>
          <div className="modal-content" style={{ maxWidth: '700px', maxHeight: '92vh', border: '2px solid #a855f7' }}>
            <div className="modal-header" style={{ background: '#f5f3ff', borderBottom: '1px solid #d8b4fe' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: '#e9d5ff', padding: '8px', borderRadius: '10px', color: '#7c3aed' }}>
                  <Wrench size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#6b21a8' }}>
                    {(reportState.conclusion?.rejectedBy?.role === 'INVESTOR' || reportState.conclusion?.rejectedBy?.role === 'LEAD_INVESTOR')
                      ? 'Báo Cáo Sửa Chữa Khắc Phục & Gửi Trực Tiếp Cho Ban QLDA'
                      : 'Báo Cáo Sửa Chữa Khắc Phục & Gửi Cho TVGS Duyệt Lại'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#7e22ce' }}>
                    Người nhận duyệt: <strong>{(reportState.conclusion?.rejectedBy?.role === 'INVESTOR' || reportState.conclusion?.rejectedBy?.role === 'LEAD_INVESTOR') ? 'Ban Quản Lý Dự Án' : 'Tư Vấn Giám Sát'}</strong> • Biên bản: {cleanReportNum}
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setIsRectifyModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px' }}>
              {/* TÓM TẮT LỖI YÊU CẦU SỬA */}
              <div style={{ 
                background: '#fff1f2', 
                border: '1px solid #fecaca', 
                borderRadius: '8px', 
                padding: '10px 14px', 
                marginBottom: '16px',
                fontSize: '0.84rem'
              }}>
                <div style={{ color: '#991b1b', fontWeight: 700, marginBottom: '2px' }}>
                  ⚠️ Yêu cầu sửa chữa từ {(reportState.conclusion?.rejectedBy?.role === 'INVESTOR' || reportState.conclusion?.rejectedBy?.role === 'LEAD_INVESTOR') ? 'Ban QLDA' : 'TVGS'} ({reportState.conclusion?.rejectedBy?.name || 'Cán bộ kiểm tra'}):
                </div>
                <div style={{ color: '#7f1d1d' }}>
                  "{reportState.conclusion?.rejectionReason || 'Cần nắn chỉnh và kiểm tra lại vị trí kỹ thuật'}"
                </div>
              </div>

              {/* 1. NỘI DUNG ĐÃ SỬA CHỮA */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ color: '#6b21a8', fontWeight: 700 }}>
                  1. Biện pháp & Nội dung ĐVTC đã khắc phục xong (*):
                </label>
                <textarea 
                  className="form-textarea"
                  style={{ minHeight: '95px', borderColor: '#d8b4fe' }}
                  placeholder="Ghi rõ công việc đã khắc phục (Ví dụ: Đã nắn chỉnh lại thép đai dầm D1 về đúng khoảng cách a150 theo bản vẽ BVTC-KC-12, kê thêm con kê bê tông 25mm và dọn sạch hộc cốp pha...)"
                  value={rectifyDesc}
                  onChange={(e) => setRectifyDesc(e.target.value)}
                />
              </div>

              {/* 2. CHỤP / GỬI ẢNH ĐÃ SỬA CHỮA */}
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label className="form-label" style={{ fontWeight: 700, color: '#6b21a8' }}>
                  2. Chụp & Đính kèm ảnh hiện trường sau khi sửa chữa ({rectifyPhotos.length} ảnh):
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px', marginBottom: '12px' }}>
                  <button type="button" className="btn-secondary" style={{ borderColor: '#7c3aed', color: '#6d28d9', background: '#f5f3ff', justifyContent: 'center' }} onClick={() => cameraRectifyRef.current?.click()}>
                    <Camera size={16} /> <span>Chụp Ảnh Camera</span>
                  </button>
                  <button type="button" className="btn-secondary" style={{ justifyContent: 'center' }} onClick={() => fileRectifyRef.current?.click()}>
                    <ImagePlus size={16} /> <span>Tải Ảnh Từ Máy</span>
                  </button>
                </div>

                {/* DANH SÁCH ẢNH ĐÃ SỬA CHỮA */}
                {rectifyPhotos.length === 0 ? (
                  <div style={{ border: '2px dashed #d8b4fe', borderRadius: '10px', padding: '20px', textAlign: 'center', background: '#faf5ff' }}>
                    <Camera size={30} color="#c084fc" style={{ marginBottom: '6px' }} />
                    <div style={{ fontSize: '0.84rem', color: '#6b21a8', fontWeight: 600 }}>Chưa có ảnh sửa chữa nào được đính kèm</div>
                    <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>Bấm nút phía trên để chụp ảnh hiện trường làm bằng chứng nghiệm thu</div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                    {rectifyPhotos.map((photo, idx) => (
                      <div key={photo.id || idx} style={{ border: '1.5px solid #a7f3d0', borderRadius: '8px', overflow: 'hidden', background: '#fff', position: 'relative' }}>
                        <img src={photo.url} alt={`Ảnh sửa ${idx + 1}`} style={{ width: '100%', height: '125px', objectFit: 'cover' }} />
                        <button type="button" onClick={() => handleDeleteRectifyPhoto(photo.id)} style={{ position: 'absolute', top: '4px', right: '4px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <Trash2 size={12} />
                        </button>
                        <div style={{ position: 'absolute', bottom: '26px', left: '4px', right: '4px', background: 'rgba(15, 23, 42, 0.85)', color: '#fff', padding: '2px 6px', borderRadius: '3px', fontSize: '0.64rem' }}>
                          <div>📍 {photo.gps?.split('(')[0] || '10.0076° N, 105.7823° E'}</div>
                        </div>
                        <div style={{ padding: '6px' }}>
                          <input type="text" value={photo.caption} onChange={(e) => setRectifyPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, caption: e.target.value } : p))} style={{ width: '100%', fontSize: '0.74rem', padding: '4px', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. THỜI GIAN ĐỀ NGHỊ NGHIỆM THU LẠI */}
              <div style={{
                background: '#faf5ff',
                border: '1.5px solid #d8b4fe',
                borderRadius: '10px',
                padding: '14px',
                marginTop: '14px'
              }}>
                <label className="form-label" style={{ fontWeight: 700, color: '#6b21a8', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Clock size={16} color="#7c3aed" />
                  <span>3. Thời gian đề nghị {(reportState.conclusion?.rejectedBy?.role === 'INVESTOR' || reportState.conclusion?.rejectedBy?.role === 'LEAD_INVESTOR') ? 'Ban QLDA' : 'TVGS'} kiểm tra lại:</span>
                </label>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Ngày nghiệm thu lại:
                    </label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={rectifyDate} 
                      onChange={(e) => setRectifyDate(e.target.value)} 
                      style={{ background: '#ffffff', width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Giờ hẹn kiểm tra:
                    </label>
                    <input 
                      type="time" 
                      className="form-input" 
                      value={rectifyTime} 
                      onChange={(e) => setRectifyTime(e.target.value)} 
                      style={{ background: '#ffffff', width: '100%' }}
                    />
                  </div>
                </div>

                {rectifyDate && rectifyTime && (
                  <div style={{ marginTop: '10px', fontSize: '0.82rem', color: '#7c3aed', background: '#f3e8ff', padding: '6px 10px', borderRadius: '6px', fontWeight: 600 }}>
                    📅 Lịch hẹn nghiệm thu lại: {rectifyTime} ngày {rectifyDate.split('-').reverse().join('/')}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '10px' }}>
              <button type="button" className="btn-secondary" onClick={() => setIsRectifyModalOpen(false)}>Hủy bỏ</button>
              <button 
                type="button" 
                className="btn-primary" 
                style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' }}
                onClick={handleConfirmRectification}
              >
                <Send size={16} /> <span>Gửi Nghiệm Thu Lại</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
