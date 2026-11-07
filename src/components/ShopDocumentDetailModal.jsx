import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X, CheckCircle2, XCircle, AlertCircle, Clock, FileText, FileArchive,
  Download, Eye, User, Building, Calendar, Layers, Check, MessageSquare, Trash2,
  UserCheck, Send, RotateCcw, UploadCloud, Camera, ImagePlus, AlertTriangle
} from 'lucide-react';
import {
  getEffectiveShopStatus,
  getShopStatusBadgeConfig,
  SHOP_STATUS,
  calculateDueDate,
  isAsBuiltDoc,
  getShopTvgsOverdueInfo,
  getShopInvestorOverdueInfo,
  getDocumentAttachmentVersions
} from '../data/shopDocumentConstants';
import { openPdfInNewTab } from '../utils/pdfHelper';
import { compressImageFile } from '../utils/storageHelper';
import { uploadPdfDocument } from '../services/storageService';
import { getDocHierarchyInfo } from './ShopDocumentsView';
import ImagePreviewModal from './ImagePreviewModal';
import { isSupervisorLeadOrDeputy, isInvestorLeadOrDeputy } from '../data/mockData';

export default function ShopDocumentDetailModal({
  isOpen,
  onClose,
  document: shopDoc,
  projects = [],
  currentUser,
  currentRole,
  users = [],
  onApprove,
  onReject,
  onAssign,
  onResubmit,
  onDelete,
  showAlert
}) {
  if (!isOpen || !shopDoc) return null;

  const docHierarchy = useMemo(() => getDocHierarchyInfo(shopDoc), [shopDoc]);

  // Review states
  const [reviewNote, setReviewNote] = useState('');
  const [isRejecting, setIsRejecting] = useState(false); // false | 'SUPERVISOR' | 'INVESTOR'
  const [rejectReason, setRejectReason] = useState('');
  const [activePhoto, setActivePhoto] = useState(null);

  // Assignment states (dành cho 2 anh Trưởng)
  const [tvgsAssigneeUid, setTvgsAssigneeUid] = useState('');
  const [tvgsSlaDays, setTvgsSlaDays] = useState(shopDoc.assignedTvgs?.slaDays || shopDoc.slaDays || 3);
  const [isAssigningTvgs, setIsAssigningTvgs] = useState(false);

  const [investorAssigneeUid, setInvestorAssigneeUid] = useState('');
  const [investorSlaDays, setInvestorSlaDays] = useState(shopDoc.assignedInvestor?.slaDays || shopDoc.slaDays || 3);
  const [isAssigningInvestor, setIsAssigningInvestor] = useState(false);

  // Danh sách các phiên bản tệp đính kèm (v1 ban đầu, v2, v3...)
  const allAttachmentVersions = useMemo(() => {
    return getDocumentAttachmentVersions(shopDoc);
  }, [shopDoc]);

  const nextVersionNumber = allAttachmentVersions.length + 1;

  // Editing & Resubmission states (dành cho ĐVTC khi hồ sơ bị từ chối)
  const [editNotes, setEditNotes] = useState(shopDoc.notes || '');
  const [newVersionPdfFiles, setNewVersionPdfFiles] = useState([]);
  const [editPhotos, setEditPhotos] = useState(Array.isArray(shopDoc.photos) ? shopDoc.photos : []);
  const [isSubmittingResubmit, setIsSubmittingResubmit] = useState(false);

  const editPdfInputRef = useRef(null);
  const editPhotoInputRef = useRef(null);
  const editCameraInputRef = useRef(null);

  // Tự động đồng bộ lại khi shopDoc thay đổi
  useEffect(() => {
    if (shopDoc) {
      setEditNotes(shopDoc.notes || '');
      setNewVersionPdfFiles([]);
      setEditPhotos(Array.isArray(shopDoc.photos) ? [...shopDoc.photos] : []);
    }
  }, [shopDoc]);

  const isArchiveFile = (fileName = '') => {
    const name = (fileName || '').toLowerCase();
    return name.endsWith('.zip') || name.endsWith('.rar') || name.endsWith('.7z') || name.endsWith('.tar') || name.endsWith('.gz');
  };

  const handleDownloadFile = async (customUrl, customName) => {
    const targetUrl = customUrl || shopDoc?.pdfFile?.dataUrl || allAttachmentVersions[0]?.files?.[0]?.dataUrl;
    const targetName = customName || shopDoc?.pdfFile?.name || allAttachmentVersions[0]?.files?.[0]?.name || 'tep_dinh_kem';
    if (!targetUrl) {
      if (showAlert) showAlert({ type: 'warning', title: 'Thông báo', message: 'Hồ sơ không có tệp đính kèm để tải về.' });
      return;
    }
    try {
      if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
        const response = await fetch(targetUrl);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = blobUrl;
        a.download = targetName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
      } else {
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = targetUrl;
        a.download = targetName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      console.warn('Lỗi tải file bằng fetch blob, tải trực tiếp:', err);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = targetUrl;
      a.download = targetName;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleOpenPdf = async (customUrl, customName) => {
    const targetUrl = customUrl || editPdfFiles[0]?.dataUrl || shopDoc?.pdfFile?.dataUrl;
    const targetName = customName || editPdfFiles[0]?.name || shopDoc?.pdfFile?.name || 'Ho_so_shop.pdf';
    if (!targetUrl) {
      if (showAlert) showAlert({ type: 'warning', title: 'Thông báo', message: 'Hồ sơ không có tệp PDF đính kèm.' });
      return;
    }
    try {
      const ok = await openPdfInNewTab(targetUrl, targetName);
      if (!ok && showAlert) {
        showAlert({ type: 'error', title: 'Lỗi Mở Tệp', message: 'Không thể mở tệp PDF trực tiếp.' });
      }
    } catch (err) {
      console.error('Lỗi mở PDF:', err);
      if (showAlert) showAlert({ type: 'error', title: 'Lỗi Mở Tệp', message: 'Không thể mở tệp PDF: ' + (err.message || err) });
    }
  };

  const effectiveStatus = getEffectiveShopStatus(shopDoc);
  const badgeConfig = getShopStatusBadgeConfig(effectiveStatus);

  // Phân quyền người xem
  const isSuperAdmin = currentRole === 'ADMIN';
  const isLeadSupervisor = isSupervisorLeadOrDeputy(currentUser);
  const isLeadInvestor = isInvestorLeadOrDeputy(currentUser);

  // Kiểm tra cán bộ đã được phân công chưa
  const tvgsAssignee = shopDoc.assignedTvgs?.assignee || (shopDoc.assignedTvgs?.uid ? shopDoc.assignedTvgs : null);
  const isTvgsAssigned = Boolean(tvgsAssignee?.uid);

  const investorAssignee = shopDoc.assignedInvestor?.assignee || (shopDoc.assignedInvestor?.uid ? shopDoc.assignedInvestor : null);
  const isInvestorAssigned = Boolean(investorAssignee?.uid);

  // Điều kiện tuần tự: TVGS phải duyệt đạt trước thì Ban QLDA mới đến lượt
  const isTvgsApproved = shopDoc.assignedTvgs?.status === 'ACCEPTED';

  // 1. Thời hạn 1 ngày phân công của TVGS: 24h kể từ thời điểm tạo phiếu
  const tvgsAssignmentDeadlineTime = useMemo(() => {
    if (shopDoc.assignmentDeadline) {
      return new Date(shopDoc.assignmentDeadline).getTime();
    }
    const baseTime = shopDoc.submittedAt || shopDoc.createdAt;
    if (baseTime) {
      return new Date(baseTime).getTime() + 24 * 60 * 60 * 1000;
    }
    return Date.now() + 24 * 60 * 60 * 1000;
  }, [shopDoc.assignmentDeadline, shopDoc.submittedAt, shopDoc.createdAt]);

  const isWithin1DayTvgsAssignment = Date.now() <= tvgsAssignmentDeadlineTime;
  const remainingTvgs1DayHours = useMemo(() => {
    const diffMs = tvgsAssignmentDeadlineTime - Date.now();
    if (diffMs <= 0) return 0;
    return Math.ceil(diffMs / (60 * 60 * 1000));
  }, [tvgsAssignmentDeadlineTime]);

  // 2. Thời hạn 1 ngày phân công của Ban QLDA: 24h KỂ TỪ KHI TVGS DUYỆT ĐẠT
  const investorAssignmentDeadlineTime = useMemo(() => {
    if (!isTvgsApproved) return null;
    const tvgsReviewTime = shopDoc.assignedTvgs?.reviewedAt
      ? new Date(shopDoc.assignedTvgs.reviewedAt).getTime()
      : Date.now();
    return tvgsReviewTime + 24 * 60 * 60 * 1000;
  }, [isTvgsApproved, shopDoc.assignedTvgs?.reviewedAt]);

  const isWithin1DayInvestorAssignment = !isTvgsApproved
    ? true
    : (investorAssignmentDeadlineTime ? Date.now() <= investorAssignmentDeadlineTime : true);

  const remainingInvestor1DayHours = useMemo(() => {
    if (!isTvgsApproved) return 24;
    if (!investorAssignmentDeadlineTime) return 24;
    const diffMs = investorAssignmentDeadlineTime - Date.now();
    if (diffMs <= 0) return 0;
    return Math.ceil(diffMs / (60 * 60 * 1000));
  }, [isTvgsApproved, investorAssignmentDeadlineTime]);

  // Alias để tương thích
  const remaining1DayHours = remainingTvgs1DayHours;
  const isWithin1DayAssignment = isWithin1DayTvgsAssignment;

  // Kiểm tra hồ sơ Bản vẽ hoàn công: chỉ qua TVGS, không qua Ban QLDA
  const isAsBuilt = isAsBuiltDoc(shopDoc);

  // Quyền phân công lần đầu
  const canAssignTvgs = (isLeadSupervisor || isSuperAdmin) && (!isTvgsAssigned || shopDoc.assignedTvgs?.status === 'WAITING_ASSIGNMENT');
  const canAssignInvestor = !isAsBuilt && (isLeadInvestor || isSuperAdmin) && (!isInvestorAssigned || shopDoc.assignedInvestor?.status === 'WAITING_ASSIGNMENT');

  // Quyền sửa ngày, đổi người trong thời hạn 1 ngày
  const canReassignTvgs = (isLeadSupervisor || isSuperAdmin) && isTvgsAssigned && isWithin1DayTvgsAssignment && shopDoc.assignedTvgs?.status !== 'ACCEPTED';
  const canReassignInvestor = !isAsBuilt && (isLeadInvestor || isSuperAdmin) && isInvestorAssigned && isWithin1DayInvestorAssignment && shopDoc.assignedInvestor?.status !== 'ACCEPTED';

  // Danh sách cán bộ TVGS để giao việc (cho phép chọn cả cán bộ cấp dưới VÀ bản thân 2 anh trưởng)
  const availableSupervisors = useMemo(() => {
    const list = (users || []).filter(u => {
      if (u.status === 'INACTIVE') return false;
      if (u.role === 'SUPERVISOR' || u.role === 'LEAD_SUPERVISOR') return true;
      const pos = (u.position || '').toLowerCase();
      if (pos.includes('giám sát') || pos.includes('tvgs') || pos.includes('gelicon')) return true;
      return false;
    });
    // Bổ sung currentUser nếu là TVGS / Giám sát trưởng mà chưa có trong danh sách
    if (currentUser && (currentUser.role === 'SUPERVISOR' || currentUser.role === 'LEAD_SUPERVISOR' || (currentUser.position || '').toLowerCase().includes('giám sát')) && !list.some(u => u.uid === currentUser.uid)) {
      list.unshift(currentUser);
    }
    // Sắp xếp đưa Bản thân hoặc Trưởng đoàn lên đầu để dễ tìm kiếm
    return list.sort((a, b) => {
      if (a.uid === currentUser?.uid) return -1;
      if (b.uid === currentUser?.uid) return 1;
      const isLeadA = a.role === 'LEAD_SUPERVISOR' || Boolean(a.isLead) || (a.position || '').toLowerCase().includes('trưởng');
      const isLeadB = b.role === 'LEAD_SUPERVISOR' || Boolean(b.isLead) || (b.position || '').toLowerCase().includes('trưởng');
      if (isLeadA && !isLeadB) return -1;
      if (!isLeadA && isLeadB) return 1;
      return (a.fullName || '').localeCompare(b.fullName || '');
    });
  }, [users, currentUser]);

  // Alias để tương thích
  const subordinateSupervisors = availableSupervisors;

  // Danh sách cán bộ Ban QLDA để giao việc (cho phép chọn cả cán bộ cấp dưới VÀ bản thân 2 anh trưởng)
  const availableInvestors = useMemo(() => {
    const list = (users || []).filter(u => {
      if (u.status === 'INACTIVE') return false;
      if (u.role === 'INVESTOR' || u.role === 'LEAD_INVESTOR') return true;
      const pos = (u.position || '').toLowerCase();
      if (pos.includes('quản lý dự án') || pos.includes('qlda') || pos.includes('chủ đầu tư') || pos.includes('coninco')) return true;
      return false;
    });
    // Bổ sung currentUser nếu là QLDA / Trưởng ban mà chưa có trong danh sách
    if (currentUser && (currentUser.role === 'INVESTOR' || currentUser.role === 'LEAD_INVESTOR' || (currentUser.position || '').toLowerCase().includes('quản lý dự án') || (currentUser.position || '').toLowerCase().includes('trưởng ban')) && !list.some(u => u.uid === currentUser.uid)) {
      list.unshift(currentUser);
    }
    // Sắp xếp đưa Bản thân hoặc Trưởng ban lên đầu
    return list.sort((a, b) => {
      if (a.uid === currentUser?.uid) return -1;
      if (b.uid === currentUser?.uid) return 1;
      const isLeadA = a.role === 'LEAD_INVESTOR' || Boolean(a.isLead) || (a.position || '').toLowerCase().includes('trưởng');
      const isLeadB = b.role === 'LEAD_INVESTOR' || Boolean(b.isLead) || (b.position || '').toLowerCase().includes('trưởng');
      if (isLeadA && !isLeadB) return -1;
      if (!isLeadA && isLeadB) return 1;
      return (a.fullName || '').localeCompare(b.fullName || '');
    });
  }, [users, currentUser]);

  // Alias để tương thích
  const subordinateInvestors = availableInvestors;

  // Quyền thẩm định & phê duyệt
  const isAssignedTvgs = (tvgsAssignee?.uid === currentUser?.uid) || isLeadSupervisor || isSuperAdmin;
  const isAssignedInvestor = (investorAssignee?.uid === currentUser?.uid) || isLeadInvestor || isSuperAdmin;
  const isContractorCreator = (shopDoc.createdByUid === currentUser?.uid) || currentRole === 'CONTRACTOR' || isSuperAdmin;
  const isDocRejected = shopDoc.status === SHOP_STATUS.REJECTED;
  const canEditDoc = isDocRejected && (isContractorCreator || isSuperAdmin);

  // TVGS có thể duyệt nếu đã được phân công, trạng thái đang là PENDING và hồ sơ chưa bị từ chối
  const canTvgsReview = isAssignedTvgs && isTvgsAssigned && shopDoc.assignedTvgs?.status === 'PENDING' && shopDoc.status !== SHOP_STATUS.REJECTED;

  // Ban QLDA CHỈ ĐƯỢC PHÊ DUYỆT HOẶC HỦY KHI TVGS ĐÃ PHÊ DUYỆT ĐẠT TRƯỚC (và không áp dụng với Bản vẽ hoàn công)
  const canInvestorReview = !isAsBuilt && isAssignedInvestor && isInvestorAssigned && isTvgsApproved && shopDoc.assignedInvestor?.status === 'PENDING' && shopDoc.status !== SHOP_STATUS.REJECTED;

  // Format date helper
  const formatDateStr = (iso) => {
    if (!iso) return '---';
    try {
      const d = new Date(iso);
      return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ngày ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    } catch {
      return iso;
    }
  };

  // 1. Xử lý phân công / đổi người / sửa ngày TVGS
  const handleConfirmAssignTvgs = () => {
    if (!tvgsAssigneeUid) {
      if (showAlert) showAlert({ type: 'warning', title: 'Thiếu thông tin', message: 'Vui lòng chọn 1 cán bộ TVGS trực tiếp thụ lý!' });
      return;
    }
    const assigneeUser = availableSupervisors.find(u => u.uid === tvgsAssigneeUid) || (users || []).find(u => u.uid === tvgsAssigneeUid);
    if (!assigneeUser) return;

    if (onAssign) {
      onAssign({
        docId: shopDoc.id,
        roleType: 'SUPERVISOR',
        assignee: {
          uid: assigneeUser.uid,
          fullName: assigneeUser.fullName,
          email: assigneeUser.email || '',
          position: assigneeUser.position || (assigneeUser.uid === currentUser?.uid ? currentUser?.position : 'Cán bộ tư vấn giám sát'),
          company: assigneeUser.company || 'Công ty CP Tư vấn Xây dựng và Thương mại GELICON'
        },
        slaDays: Number(tvgsSlaDays || 3),
        leader: currentUser
      });
      setIsAssigningTvgs(false);
    }
  };

  // 2. Xử lý phân công / đổi người / sửa ngày Ban QLDA
  const handleConfirmAssignInvestor = () => {
    if (!investorAssigneeUid) {
      if (showAlert) showAlert({ type: 'warning', title: 'Thiếu thông tin', message: 'Vui lòng chọn 1 cán bộ Ban QLDA trực tiếp thụ lý!' });
      return;
    }
    const assigneeUser = availableInvestors.find(u => u.uid === investorAssigneeUid) || (users || []).find(u => u.uid === investorAssigneeUid);
    if (!assigneeUser) return;

    if (onAssign) {
      onAssign({
        docId: shopDoc.id,
        roleType: 'INVESTOR',
        assignee: {
          uid: assigneeUser.uid,
          fullName: assigneeUser.fullName,
          email: assigneeUser.email || '',
          position: assigneeUser.position || (assigneeUser.uid === currentUser?.uid ? currentUser?.position : 'Cán bộ ban QLDA'),
          company: assigneeUser.company || 'Ban Quản Lý Dự Án An Phú Eco City'
        },
        slaDays: Number(investorSlaDays || 3),
        leader: currentUser
      });
      setIsAssigningInvestor(false);
    }
  };

  // 3. Xử lý xác nhận đạt
  const handleConfirmApproval = (roleType) => {
    if (roleType === 'INVESTOR' && !isTvgsApproved) {
      if (showAlert) showAlert({
        type: 'warning',
        title: 'Chưa đủ điều kiện',
        message: 'Tư Vấn Giám Sát chưa thẩm định đạt. Ban QLDA chỉ được phê duyệt sau khi TVGS đã duyệt đạt!'
      });
      return;
    }
    if (onApprove) {
      onApprove(shopDoc.id, {
        roleType, // 'SUPERVISOR' | 'INVESTOR'
        note: reviewNote.trim(),
        reviewer: currentUser
      });
      onClose();
    }
  };

  // 4. Xử lý yêu cầu sửa / từ chối
  const handleConfirmRejection = (roleType) => {
    if (roleType === 'INVESTOR' && !isTvgsApproved) {
      if (showAlert) showAlert({
        type: 'warning',
        title: 'Chưa đủ điều kiện',
        message: 'Tư Vấn Giám Sát chưa thẩm định đạt. Ban QLDA chỉ được thao tác sau khi TVGS đã duyệt đạt!'
      });
      return;
    }
    if (!rejectReason.trim()) {
      if (showAlert) showAlert({ type: 'warning', title: 'Thiếu lý do', message: 'Vui lòng nhập lý do yêu cầu chỉnh sửa!' });
      return;
    }
    if (onReject) {
      onReject(shopDoc.id, {
        roleType,
        reason: rejectReason.trim(),
        reviewer: currentUser
      });
      onClose();
    }
  };

  // 5. Xử lý sửa & nộp lại trực tiếp cho người từ chối (Bypasses 2 leaders)
  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    for (const file of files) {
      const compressedUrl = await compressImageFile(file);
      if (!compressedUrl) continue;
      const now = new Date();
      const timeStr = `${now.toLocaleTimeString('vi-VN')} ngày ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
      setEditPhotos(prev => [
        ...prev,
        {
          id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          url: compressedUrl,
          caption: file.name ? file.name.replace(/\.[^/.]+$/, '') : 'Ảnh hiện trường / bản vẽ',
          time: timeStr
        }
      ]);
    }
    e.target.value = '';
  };

  const handleDeletePhoto = (photoId) => {
    setEditPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  const handleUpdateCaption = (photoId, caption) => {
    setEditPhotos(prev => prev.map(p => p.id === photoId ? { ...p, caption } : p));
  };

  const handlePdfUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    for (const file of files) {
      const fileNameLower = file.name.toLowerCase();
      const isAllowed =
        file.type === 'application/pdf' ||
        fileNameLower.endsWith('.pdf') ||
        fileNameLower.endsWith('.zip') ||
        fileNameLower.endsWith('.rar') ||
        fileNameLower.endsWith('.7z') ||
        fileNameLower.endsWith('.tar') ||
        fileNameLower.endsWith('.gz') ||
        fileNameLower.endsWith('.doc') ||
        fileNameLower.endsWith('.docx') ||
        fileNameLower.endsWith('.xls') ||
        fileNameLower.endsWith('.xlsx');

      if (!isAllowed) {
        if (showAlert) showAlert({
          type: 'warning',
          title: 'Định dạng tệp',
          message: `Tệp "${file.name}" không hợp lệ! Vui lòng chọn tệp PDF hoặc tệp nén (ZIP, RAR, 7Z).`
        });
        continue;
      }

      const sizeMB = file.size / (1024 * 1024);
      const formattedSize = sizeMB >= 1 ? `${sizeMB.toFixed(2)} MB` : `${(file.size / 1024).toFixed(1)} KB`;

      // Nếu file lớn hơn 8MB, tránh đọc base64 gây tràn bộ nhớ trình duyệt, lưu rawFile để upload thẳng lên Cloud Storage
      if (file.size > 8 * 1024 * 1024) {
        setNewVersionPdfFiles(prev => [
          ...prev,
          {
            id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: file.name,
            size: formattedSize,
            dataUrl: null,
            rawFile: file
          }
        ]);
        continue;
      }

      const reader = new FileReader();
      reader.onload = () => {
        let dataUrl = reader.result;
        setNewVersionPdfFiles(prev => [
          ...prev,
          {
            id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: file.name,
            size: formattedSize,
            dataUrl,
            rawFile: file
          }
        ]);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleDeletePdf = (pdfId) => {
    setNewVersionPdfFiles(prev => prev.filter(p => p.id !== pdfId));
  };

  const handleExecuteResubmit = async () => {
    if (!editNotes.trim()) {
      if (showAlert) showAlert({ type: 'warning', title: 'Thiếu nội dung', message: 'Vui lòng nhập nội dung / ghi chú kỹ thuật đã chỉnh sửa!' });
      return;
    }

    setIsSubmittingResubmit(true);
    try {
      const finalNewPdfFiles = [];
      for (const pdf of newVersionPdfFiles) {
        if (pdf.rawFile) {
          try {
            const cloudUrl = await uploadPdfDocument(pdf.rawFile, `${shopDoc.docCode || 'HSS'}_v${nextVersionNumber}`);
            if (cloudUrl) {
              finalNewPdfFiles.push({
                id: pdf.id,
                name: pdf.name,
                size: pdf.size,
                dataUrl: cloudUrl
              });
              continue;
            }
          } catch (uploadErr) {
            console.warn('[Resubmit] Lỗi upload PDF cloud, dùng dataUrl cục bộ:', uploadErr);
          }
        }
        finalNewPdfFiles.push({
          id: pdf.id,
          name: pdf.name,
          size: pdf.size,
          dataUrl: pdf.dataUrl
        });
      }

      // Xây dựng phiên bản mới (v2, v3...) nếu có tệp mới được tải lên
      let updatedVersions = allAttachmentVersions;
      let newVersionObj = null;

      if (finalNewPdfFiles.length > 0) {
        newVersionObj = {
          version: nextVersionNumber,
          versionName: `v${nextVersionNumber}`,
          label: `Tệp đính kèm v${nextVersionNumber}`,
          title: `Tệp đính kèm v${nextVersionNumber}`,
          createdAt: new Date().toISOString(),
          createdByName: currentUser?.fullName || 'Đơn Vị Thi Công',
          files: finalNewPdfFiles
        };
        updatedVersions = [...allAttachmentVersions, newVersionObj];
      }

      const activeFiles = finalNewPdfFiles.length > 0
        ? finalNewPdfFiles
        : (allAttachmentVersions[allAttachmentVersions.length - 1]?.files || shopDoc.pdfFiles || []);

      if (onResubmit) {
        await onResubmit(shopDoc.id, {
          notes: editNotes.trim(),
          pdfFile: activeFiles[0] || null,
          pdfFiles: activeFiles,
          attachmentVersions: updatedVersions,
          newAttachmentVersion: newVersionObj,
          photos: editPhotos,
          resubmittedBy: currentUser
        });
      }
      onClose();
    } catch (err) {
      console.error('Lỗi nộp lại hồ sơ:', err);
      if (showAlert) showAlert({ type: 'error', title: 'Lỗi', message: err.message || err });
    } finally {
      setIsSubmittingResubmit(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1150 }}>
      <div className="modal-content" style={{ maxWidth: '860px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>

        {/* MODAL HEADER */}
        <div className="modal-header" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: badgeConfig.bg, padding: '8px', borderRadius: '10px', color: badgeConfig.color }}>
              <FileText size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#e2e8f0', color: '#475569' }}>
                  {shopDoc.docCode || 'HSS'}
                </span>
                <span style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: badgeConfig.bg,
                  color: badgeConfig.color,
                  border: `1px solid ${badgeConfig.border}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: badgeConfig.dotColor }} />
                  {badgeConfig.label}
                </span>
              </div>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '1.15rem', color: '#1e293b', fontWeight: 700 }}>
                {shopDoc.title}
              </h3>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {/* MODAL BODY */}
        <div className="modal-body" style={{ overflowY: 'auto', padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* CẢNH BÁO BỊ TỪ CHỐI / CẦN SỬA */}
          {shopDoc.status === SHOP_STATUS.REJECTED && (
            <div style={{
              background: '#fef2f2',
              border: '1.5px solid #fecaca',
              borderRadius: '10px',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#991b1b', fontWeight: 700, fontSize: '0.9rem' }}>
                  <AlertTriangle size={18} color="#dc2626" />
                  <span>Hồ sơ đang ở trạng thái YÊU CẦU CHỈNH SỬA (Cần sửa)</span>
                </div>
                {canEditDoc && (
                  <button
                    type="button"
                    onClick={handleExecuteResubmit}
                    disabled={isSubmittingResubmit}
                    style={{
                      padding: '7px 16px',
                      background: '#dc2626',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: isSubmittingResubmit ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 4px rgba(220, 38, 38, 0.25)'
                    }}
                  >
                    <RotateCcw size={14} /> {isSubmittingResubmit ? 'Đang lưu & gửi...' : 'Lưu & Gửi lại trực tiếp'}
                  </button>
                )}
              </div>
              <div style={{ fontSize: '0.84rem', color: '#7f1d1d', lineHeight: 1.5 }}>
                <strong>Người yêu cầu:</strong> {shopDoc.rejectedBy?.fullName || 'Cán bộ thẩm định'} ({shopDoc.rejectedBy?.role === 'SUPERVISOR' ? 'Tư Vấn Giám Sát' : 'Ban QLDA'})
                {shopDoc.rejectedBy?.time && <span> • {formatDateStr(shopDoc.rejectedBy.time)}</span>}
              </div>
              <div style={{ fontSize: '0.84rem', color: '#991b1b', background: '#fee2e2', padding: '8px 12px', borderRadius: '6px', border: '1px solid #fca5a5' }}>
                <strong>Lý do:</strong> {shopDoc.rejectionReason || shopDoc.rejectedBy?.reason || 'Chưa cung cấp lý do chi tiết'}
              </div>
              {canEditDoc && (
                <div style={{ fontSize: '0.8rem', color: '#1e40af', background: '#eff6ff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #bfdbfe', lineHeight: 1.5 }}>
                  ✍️ <strong>Chế độ chỉnh sửa hồ sơ:</strong> Bạn có thể sửa trực tiếp <em>Nội dung / Ghi chú kỹ thuật</em>, <em>Tệp PDF</em> và <em>Ảnh bản vẽ & hiện trường</em> ở các phần bên dưới, sau đó bấm nút <strong>Lưu & Gửi lại trực tiếp</strong> để gửi thẳng cho {shopDoc.rejectedBy?.fullName || 'người yêu cầu sửa'} thẩm định lại.
                </div>
              )}
            </div>
          )}

          {/* THÔNG TIN CHUNG */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>🏢 Công Trình</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a' }}>{docHierarchy.projectName || 'Chung cư nhà ở xã hội 2'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>📦 Gói Thầu</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a' }}>{docHierarchy.packageName || 'Chung cho dự án'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>📑 Công Tác</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a' }}>{docHierarchy.itemName || 'Toàn bộ công tác'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Loại Hồ Sơ</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a' }}>{shopDoc.typeName}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Ngày Tạo / Phát Hành</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#334155' }}>{formatDateStr(shopDoc.submittedAt || shopDoc.createdAt)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Hạn Phân Công (24h)</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: (isAsBuilt ? isTvgsAssigned : (isTvgsAssigned && isInvestorAssigned)) ? '#15803d' : '#ea580c' }}>
                {isAsBuilt ? (
                  isTvgsAssigned ? '✓ Đã hoàn tất phân công' : formatDateStr(shopDoc.assignmentDeadline)
                ) : (isTvgsAssigned && isInvestorAssigned) ? (
                  '✓ Đã hoàn tất phân công'
                ) : !isTvgsAssigned ? (
                  `TVGS: ${formatDateStr(shopDoc.assignmentDeadline)}`
                ) : !isTvgsApproved ? (
                  '✓ TVGS đã giao (QLDA tính sau)'
                ) : (
                  `QLDA: ${formatDateStr(new Date(new Date(shopDoc.assignedTvgs?.reviewedAt || Date.now()).getTime() + 24 * 3600 * 1000).toISOString())}`
                )}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Đơn Vị Trình Duyệt</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#166534' }}>{shopDoc.createdByName}</div>
            </div>
          </div>

          {/* HIDDEN INPUTS CHO TẢI FILE / CHỤP ẢNH KHI SỬA HỒ SƠ */}
          {canEditDoc && (
            <>
              <input
                ref={editPdfInputRef}
                type="file"
                accept=".pdf,.zip,.rar,.7z,.tar,.gz,.doc,.docx,.xls,.xlsx,application/pdf,application/zip,application/x-zip-compressed,application/x-rar-compressed,application/octet-stream"
                multiple
                style={{ display: 'none' }}
                onChange={handlePdfUpload}
              />
              <input
                ref={editPhotoInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handlePhotoUpload}
              />
              <input
                ref={editCameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={handlePhotoUpload}
              />
            </>
          )}

          {/* NỘI DUNG / GHI CHÚ KỸ THUẬT */}
          {(canEditDoc || shopDoc.notes) && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <h4 style={{ margin: 0, fontSize: '0.86rem', color: '#1e293b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Nội dung / Ghi chú kỹ thuật:
                  {canEditDoc && (
                    <span style={{ fontSize: '0.72rem', color: '#2563eb', background: '#eff6ff', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, border: '1px solid #bfdbfe' }}>
                      Cho phép sửa
                    </span>
                  )}
                </h4>
              </div>
              {canEditDoc ? (
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Nhập nội dung / ghi chú kỹ thuật, giải trình sửa chữa..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #3b82f6',
                    fontSize: '0.88rem',
                    lineHeight: 1.5,
                    boxSizing: 'border-box',
                    outline: 'none',
                    background: '#ffffff',
                    color: '#0f172a',
                    boxShadow: '0 1px 2px rgba(59, 130, 246, 0.08)'
                  }}
                />
              ) : (
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', fontSize: '0.86rem', color: '#1e293b', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                  {shopDoc.notes}
                </div>
              )}
            </div>
          )}

          {/* FILE ĐÍNH KÈM PHÂN THEO PHIÊN BẢN (v1, v2, v3...) */}
          {(allAttachmentVersions.length > 0 || canEditDoc) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <h4 style={{ margin: 0, fontSize: '0.88rem', color: '#1e293b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} color="#2563eb" />
                  <span>Danh Sách Tệp Đính Kèm Qua Các Lần Trình Duyệt:</span>
                </h4>
              </div>

              {/* 1. HIỂN THỊ CÁC PHIÊN BẢN ĐÃ CÓ (v1 ban đầu, v2, v3...) */}
              {allAttachmentVersions.map((ver, vIdx) => {
                const isLatest = vIdx === allAttachmentVersions.length - 1 && !canEditDoc;
                const isV1 = ver.version === 1 || ver.versionName === 'v1' || vIdx === 0;
                const verFiles = ver.files || [];

                return (
                  <div
                    key={ver.version || vIdx}
                    style={{
                      background: '#ffffff',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                    }}
                  >
                    {/* TIÊU ĐỀ PHIÊN BẢN */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '0.86rem',
                          fontWeight: 700,
                          color: isV1 ? '#0f172a' : '#1e40af'
                        }}>
                          📁 {ver.label || `Tệp đính kèm v${ver.version || (vIdx + 1)}`} ({verFiles.length}):
                        </span>
                        {isV1 ? (
                          <span style={{ fontSize: '0.7rem', color: '#475569', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, border: '1px solid #e2e8f0' }}>
                            Ban đầu
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.7rem', color: '#1d4ed8', background: '#eff6ff', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, border: '1px solid #bfdbfe' }}>
                            {isLatest ? 'Mới nhất' : `Gửi lại lần ${ver.version - 1}`}
                          </span>
                        )}
                      </div>
                      {ver.createdAt && (
                        <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> {formatDateStr(ver.createdAt)} {ver.createdByName ? `• ${ver.createdByName}` : ''}
                        </span>
                      )}
                    </div>

                    {/* DANH SÁCH FILE CỦA PHIÊN BẢN */}
                    {verFiles.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {verFiles.map((pdf, idx) => (
                          <div
                            key={pdf.id || idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              padding: '10px 14px',
                              borderRadius: '8px',
                              flexWrap: 'wrap',
                              gap: '12px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '220px', flex: 1 }}>
                              {isArchiveFile(pdf.name) ? (
                                <FileArchive size={26} color="#d97706" style={{ flexShrink: 0 }} />
                              ) : (
                                <FileText size={26} color="#2563eb" style={{ flexShrink: 0 }} />
                              )}
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0f172a', wordBreak: 'break-all' }}>
                                  {pdf.name || `Tệp đính kèm ${idx + 1}`}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                  {pdf.size || 'Tài liệu đính kèm'}
                                </div>
                              </div>
                            </div>

                            {pdf.dataUrl && (
                              <button
                                type="button"
                                onClick={() => handleDownloadFile(pdf.dataUrl, pdf.name)}
                                title={`Tải về ${pdf.name || 'tệp đính kèm'}`}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '8px 16px',
                                  background: '#2563eb',
                                  border: 'none',
                                  borderRadius: '6px',
                                  color: '#ffffff',
                                  cursor: 'pointer',
                                  fontSize: '0.82rem',
                                  fontWeight: 600,
                                  boxShadow: '0 1px 2px rgba(37,99,235,0.2)'
                                }}
                              >
                                <Download size={14} /> Tải Về Tệp
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic', padding: '6px 0' }}>
                        Không có tệp đính kèm trong phiên bản này.
                      </div>
                    )}
                  </div>
                );
              })}

              {/* 2. KHU VỰC TẢI LÊN PHIÊN BẢN MỚI (v2, v3...) KHI BỊ TỪ CHỐI (canEditDoc) */}
              {canEditDoc && (
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '2px dashed #16a34a',
                    borderRadius: '10px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#15803d' }}>
                        📤 Tệp đính kèm v{nextVersionNumber} ({newVersionPdfFiles.length}):
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#166534', background: '#dcfce7', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, border: '1px solid #bbf7d0' }}>
                        Tự động tạo phiên bản mới • File cũ v1 được giữ nguyên
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => editPdfInputRef.current?.click()}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: '1px solid #16a34a',
                        background: '#16a34a',
                        color: '#ffffff',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <UploadCloud size={14} /> + Thêm tệp v{nextVersionNumber}
                    </button>
                  </div>

                  {newVersionPdfFiles.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {newVersionPdfFiles.map((pdf, idx) => (
                        <div
                          key={pdf.id || idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: '#ffffff',
                            border: '1.5px solid #86efac',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            flexWrap: 'wrap',
                            gap: '10px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '200px', flex: 1 }}>
                            {isArchiveFile(pdf.name) ? (
                              <FileArchive size={26} color="#d97706" style={{ flexShrink: 0 }} />
                            ) : (
                              <FileText size={26} color="#16a34a" style={{ flexShrink: 0 }} />
                            )}
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0f172a', wordBreak: 'break-all' }}>
                                {pdf.name || `Tệp mới ${idx + 1}`}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 600 }}>
                                {pdf.size || 'Tài liệu'} • (Tệp phiên bản v{nextVersionNumber})
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {pdf.dataUrl && (
                              <button
                                type="button"
                                onClick={() => handleDownloadFile(pdf.dataUrl, pdf.name)}
                                title={`Tải về ${pdf.name || 'tệp đính kèm'}`}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '6px 12px',
                                  background: '#16a34a',
                                  border: 'none',
                                  borderRadius: '6px',
                                  color: '#ffffff',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                  fontWeight: 600
                                }}
                              >
                                <Download size={14} /> Xem / Tải về
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeletePdf(pdf.id)}
                              title="Bỏ chọn tệp này"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 10px',
                                background: '#ffffff',
                                border: '1px solid #fecaca',
                                borderRadius: '6px',
                                color: '#dc2626',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: 600
                              }}
                            >
                              <Trash2 size={14} /> Xóa
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      onClick={() => editPdfInputRef.current?.click()}
                      style={{
                        border: '1.5px dashed #86efac',
                        background: '#ffffff',
                        borderRadius: '8px',
                        padding: '18px',
                        textAlign: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <UploadCloud size={30} color="#16a34a" style={{ margin: '0 auto 6px' }} />
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#15803d' }}>
                        + Bấm vào đây để tải lên tệp đính kèm mới cho phiên bản v{nextVersionNumber}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                        File cũ ở trên (v1) sẽ được giữ nguyên không đổi. Hỗ trợ PDF, ZIP, RAR, 7Z (Không giới hạn dung lượng)
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ẢNH HIỆN TRƯỜNG / BẢN VẼ */}
          {(canEditDoc || (Array.isArray(shopDoc.photos) && shopDoc.photos.length > 0)) && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                <h4 style={{ margin: 0, fontSize: '0.86rem', color: '#1e293b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Ảnh Chụp Bản Vẽ & Hiện Trường ({canEditDoc ? editPhotos.length : (shopDoc.photos?.length || 0)}):
                  {canEditDoc && (
                    <span style={{ fontSize: '0.72rem', color: '#2563eb', background: '#eff6ff', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, border: '1px solid #bfdbfe' }}>
                      Có thể thêm, sửa chú thích, xóa ảnh
                    </span>
                  )}
                </h4>

                {canEditDoc && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => editCameraInputRef.current?.click()}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#0f172a',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <Camera size={14} color="#0284c7" /> Chụp ảnh
                    </button>
                    <button
                      type="button"
                      onClick={() => editPhotoInputRef.current?.click()}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid #93c5fd',
                        background: '#eff6ff',
                        color: '#2563eb',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <ImagePlus size={14} /> Thêm ảnh từ máy
                    </button>
                  </div>
                )}
              </div>

              {canEditDoc ? (
                editPhotos.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                    {editPhotos.map((p, idx) => (
                      <div
                        key={p.id || idx}
                        style={{
                          borderRadius: '8px',
                          border: '1.5px solid #e2e8f0',
                          background: '#ffffff',
                          padding: '6px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          position: 'relative',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        }}
                      >
                        <div
                          style={{
                            height: '90px',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            position: 'relative',
                            cursor: 'pointer',
                            background: '#f1f5f9'
                          }}
                          onClick={() => setActivePhoto(p.url)}
                          title="Bấm để phóng to xem ảnh"
                        >
                          <img src={p.url} alt={p.caption || 'Ảnh shop'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePhoto(p.id);
                            }}
                            title="Xóa ảnh này"
                            style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              background: 'rgba(220, 38, 38, 0.9)',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '50%',
                              width: '22px',
                              height: '22px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                              zIndex: 2
                            }}
                          >
                            <X size={13} />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={p.caption || ''}
                          placeholder={`Ghi chú ảnh ${idx + 1}...`}
                          onChange={(e) => handleUpdateCaption(p.id, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '4px 6px',
                            fontSize: '0.72rem',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            boxSizing: 'border-box',
                            color: '#334155'
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    onClick={() => editPhotoInputRef.current?.click()}
                    style={{
                      border: '2px dashed #cbd5e1',
                      borderRadius: '8px',
                      padding: '16px',
                      textAlign: 'center',
                      background: '#f8fafc',
                      cursor: 'pointer'
                    }}
                  >
                    <ImagePlus size={24} color="#64748b" style={{ margin: '0 auto 4px' }} />
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Chưa có hình ảnh nào. Bấm vào đây để tải ảnh lên.
                    </div>
                  </div>
                )
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px' }}>
                  {shopDoc.photos.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      onClick={() => setActivePhoto(p.url)}
                      style={{
                        borderRadius: '6px',
                        overflow: 'hidden',
                        border: '1px solid #e2e8f0',
                        cursor: 'pointer',
                        height: '85px',
                        position: 'relative'
                      }}
                    >
                      <img src={p.url} alt={p.caption || 'Ảnh shop'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'rgba(0,0,0,0.6)',
                        color: '#ffffff',
                        fontSize: '0.65rem',
                        padding: '2px 4px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {p.caption || `Ảnh ${idx + 1}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PHẦN PHÂN CÔNG & ĐÁNH GIÁ CỦA 2 BÊN (TVGS & BAN QLDA) */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#1e293b', fontWeight: 700 }}>
              Tiến Trình Phân Công, Thẩm Định & Phê Duyệt:
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

              {/* 1. TVGS CARD */}
              <div style={{
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '14px',
                background: shopDoc.assignedTvgs?.status === 'ACCEPTED'
                  ? '#f0fdf4'
                  : shopDoc.assignedTvgs?.status === 'REJECTED'
                    ? '#fef2f2'
                    : !isTvgsAssigned
                      ? '#fffbeb'
                      : '#ffffff'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={16} color="#047857" />
                    <strong style={{ fontSize: '0.86rem', color: '#047857' }}>Tư Vấn Giám Sát (TVGS)</strong>
                  </div>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: !isTvgsAssigned
                      ? (getShopTvgsOverdueInfo(shopDoc).isOverdue ? '#fee2e2' : '#fef3c7')
                      : shopDoc.assignedTvgs?.status === 'ACCEPTED'
                        ? '#dcfce7'
                        : shopDoc.assignedTvgs?.status === 'REJECTED'
                          ? '#fee2e2'
                          : (getShopTvgsOverdueInfo(shopDoc).isOverdue ? '#fee2e2' : '#eff6ff'),
                    color: !isTvgsAssigned
                      ? (getShopTvgsOverdueInfo(shopDoc).isOverdue ? '#b91c1c' : '#b45309')
                      : shopDoc.assignedTvgs?.status === 'ACCEPTED'
                        ? '#15803d'
                        : shopDoc.assignedTvgs?.status === 'REJECTED'
                          ? '#b91c1c'
                          : (getShopTvgsOverdueInfo(shopDoc).isOverdue ? '#b91c1c' : '#1d4ed8')
                  }}>
                    {!isTvgsAssigned
                      ? (getShopTvgsOverdueInfo(shopDoc).isOverdue ? '⚠️ Chậm phân công' : '⏳ Chờ phân công')
                      : shopDoc.assignedTvgs?.status === 'ACCEPTED'
                        ? '✓ Đã xác nhận'
                        : shopDoc.assignedTvgs?.status === 'REJECTED'
                          ? '✕ Yêu cầu sửa'
                          : (getShopTvgsOverdueInfo(shopDoc).isOverdue ? '⚠️ Chậm duyệt' : '⏳ Đang thẩm định')}
                  </span>
                </div>

                {/* FORM PHÂN CÔNG / ĐỔI NGƯỜI / SỬA HẠN KHI isAssigningTvgs = true */}
                {isAssigningTvgs ? (
                  <div style={{ background: '#ffffff', border: '1.5px solid #10b981', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#047857', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <UserCheck size={15} />
                      {isTvgsAssigned ? 'Thay đổi cán bộ TVGS / Sửa ngày (Trong hạn 1 ngày):' : 'Phân công cán bộ TVGS thụ lý:'}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#334155', marginBottom: '3px' }}>
                        Chọn cán bộ TVGS (kể cả bản thân Trưởng đoàn):
                      </label>
                      <select
                        value={tvgsAssigneeUid}
                        onChange={(e) => setTvgsAssigneeUid(e.target.value)}
                        style={{ width: '100%', padding: '7px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                      >
                        <option value="">-- Chọn cán bộ TVGS --</option>
                        {availableSupervisors.map(u => {
                          const isMe = u.uid === currentUser?.uid;
                          const isLead = u.role === 'LEAD_SUPERVISOR' || Boolean(u.isLead) || (u.position || '').toLowerCase().includes('trưởng');
                          return (
                            <option key={u.uid} value={u.uid}>
                              {u.fullName} ({u.position || 'TVGS'}) {isMe ? '⭐ (Bản thân)' : isLead ? '👑 (Trưởng đoàn)' : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#334155', marginBottom: '3px' }}>
                        Thời hạn phản hồi (SLA):
                      </label>
                      <select
                        value={tvgsSlaDays}
                        onChange={(e) => setTvgsSlaDays(e.target.value)}
                        style={{ width: '100%', padding: '7px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                      >
                        <option value={1}>1 ngày</option>
                        <option value={2}>2 ngày</option>
                        <option value={3}>3 ngày (Quy chuẩn)</option>
                        <option value={5}>5 ngày</option>
                        <option value={7}>7 ngày</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '4px' }}>
                      <button
                        type="button"
                        onClick={() => setIsAssigningTvgs(false)}
                        style={{ padding: '4px 10px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '4px', fontSize: '0.74rem', cursor: 'pointer' }}
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmAssignTvgs}
                        style={{ padding: '5px 14px', background: '#059669', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        {isTvgsAssigned ? 'Lưu thay đổi' : 'Xác nhận giao việc'}
                      </button>
                    </div>
                  </div>
                ) : !isTvgsAssigned ? (
                  /* NẾU CHƯA PHÂN CÔNG */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                    <div style={{ fontSize: '0.78rem', color: '#92400e', background: '#fef3c7', padding: '8px 10px', borderRadius: '6px', border: '1px solid #fde68a' }}>
                      Hồ sơ đã gửi đến <strong>TVGS Trưởng (Đinh Xuân Thám)</strong>. Thời hạn phân công cán bộ: 1 ngày (24h).
                    </div>

                    {/* NÚT MỞ FORM PHÂN CÔNG NẾU LÀ TVGS TRƯỞNG HOẶC ADMIN */}
                    {canAssignTvgs && (
                      <button
                        type="button"
                        onClick={() => {
                          setTvgsAssigneeUid(currentUser?.uid || '');
                          setTvgsSlaDays(shopDoc.assignedTvgs?.slaDays || 3);
                          setIsAssigningTvgs(true);
                        }}
                        style={{
                          padding: '7px 12px',
                          background: '#059669',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <UserCheck size={14} /> Phân công cán bộ TVGS
                      </button>
                    )}
                  </div>
                ) : (
                  /* NẾU ĐÃ PHÂN CÔNG */
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px', marginBottom: '4px' }}>
                      <div style={{ fontSize: '0.82rem', color: '#334155' }}>
                        <strong>Cán bộ thụ lý:</strong> {tvgsAssignee?.fullName || 'Tư Vấn Giám Sát'} {tvgsAssignee?.uid === currentUser?.uid ? '⭐ (Bản thân)' : ''}
                      </div>

                      {/* NÚT ĐỔI NGƯỜI / SỬA HẠN TRONG THỜI HẠN 1 NGÀY */}
                      {canReassignTvgs && (
                        <button
                          type="button"
                          onClick={() => {
                            setTvgsAssigneeUid(tvgsAssignee?.uid || '');
                            setTvgsSlaDays(shopDoc.assignedTvgs?.slaDays || 3);
                            setIsAssigningTvgs(true);
                          }}
                          title="Trong hạn 1 ngày: Được phép sửa ngày phản hồi hoặc đổi cán bộ khác"
                          style={{
                            padding: '3px 8px',
                            background: '#eff6ff',
                            border: '1px solid #93c5fd',
                            borderRadius: '5px',
                            color: '#1d4ed8',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            flexShrink: 0
                          }}
                        >
                          <RotateCcw size={11} /> Đổi người / Sửa ngày
                        </button>
                      )}
                    </div>

                    <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                      {tvgsAssignee?.company || 'Tư Vấn Giám Sát Gelicon'}
                    </div>

                    {shopDoc.assignedTvgs?.assignedBy && (
                      <div style={{ fontSize: '0.72rem', color: '#047857', marginTop: '4px' }}>
                        Phân công bởi: {shopDoc.assignedTvgs.assignedBy.fullName} lúc {formatDateStr(shopDoc.assignedTvgs.assignedAt)}
                      </div>
                    )}
                    <div style={{ fontSize: '0.72rem', color: '#0284c7', marginTop: '2px', fontWeight: 600 }}>
                      Thời hạn hoàn thành: {shopDoc.assignedTvgs?.slaDays || 3} ngày (Hạn: {formatDateStr(shopDoc.assignedTvgs?.dueDate || shopDoc.dueDate)})
                    </div>

                    {isWithin1DayAssignment && canReassignTvgs && (
                      <div style={{ fontSize: '0.71rem', color: '#047857', background: '#ecfdf5', padding: '3px 6px', borderRadius: '4px', border: '1px solid #a7f3d0', marginTop: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        ⏱️ Hạn đổi người & sửa ngày: còn <strong>{remaining1DayHours}h</strong> (trong vòng 1 ngày).
                      </div>
                    )}

                    {shopDoc.assignedTvgs?.reviewedAt && (
                      <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '6px' }}>
                        Thời gian duyệt: {formatDateStr(shopDoc.assignedTvgs.reviewedAt)}
                      </div>
                    )}

                    {shopDoc.assignedTvgs?.note && (
                      <div style={{ marginTop: '8px', background: 'rgba(255,255,255,0.7)', padding: '6px 8px', borderRadius: '4px', fontSize: '0.78rem', color: '#1e293b', border: '1px solid #e2e8f0' }}>
                        <strong>Ý kiến TVGS:</strong> {shopDoc.assignedTvgs.note}
                      </div>
                    )}

                    {/* THAO TÁC DUYỆT DÀNH CHO CÁN BỘ TVGS ĐƯỢC CHỌN HOẶC TRƯỞNG */}
                    {canTvgsReview && !isRejecting && (
                      <div style={{ marginTop: '12px' }}>
                        {isAsBuilt && (
                          <div style={{
                            marginBottom: '8px',
                            padding: '6px 10px',
                            background: '#ecfdf5',
                            border: '1px solid #a7f3d0',
                            borderRadius: '6px',
                            fontSize: '0.74rem',
                            color: '#065f46',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <CheckCircle2 size={14} color="#059669" />
                            <span>Bản vẽ hoàn công chỉ trình qua TVGS. Khi ký duyệt đạt, hồ sơ sẽ hoàn thiện ngay.</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleConfirmApproval('SUPERVISOR')}
                            style={{
                              flex: 1,
                              padding: '7px 10px',
                              background: '#16a34a',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              fontWeight: 600,
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px'
                            }}
                          >
                            <CheckCircle2 size={14} /> {isAsBuilt ? 'TVGS Ký Duyệt & Hoàn Tất' : 'TVGS Xác Nhận Đạt'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsRejecting('SUPERVISOR')}
                            style={{
                              padding: '7px 10px',
                              background: '#fee2e2',
                              color: '#b91c1c',
                              border: '1px solid #fecaca',
                              borderRadius: '6px',
                              fontWeight: 600,
                              fontSize: '0.78rem',
                              cursor: 'pointer'
                            }}
                          >
                            Cần sửa
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 2. BAN QLDA CARD */}
              {isAsBuilt ? (
                <div style={{
                  border: '1.5px dashed #cbd5e1',
                  borderRadius: '8px',
                  padding: '24px 16px',
                  background: '#f8fafc',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  gap: '10px'
                }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: '#e0f2fe',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(2, 132, 199, 0.15)'
                  }}>
                    <UserCheck size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Ban Quản Lý Dự Án
                    </div>
                    <span style={{
                      display: 'inline-block',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 10px',
                      borderRadius: '12px',
                      background: '#ecfdf5',
                      color: '#059669',
                      border: '1px solid #a7f3d0'
                    }}>
                      ✓ Không qua Ban QLDA
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.55, maxWidth: '300px' }}>
                    Theo quy trình quy định, hồ sơ <strong>Bản vẽ hoàn công</strong> chỉ trình qua <strong>Tư Vấn Giám Sát (TVGS)</strong> thẩm tra & ký duyệt. Khi TVGS ký duyệt đạt, hồ sơ sẽ được hoàn thiện trực tiếp mà không cần qua Ban QLDA.
                  </p>
                </div>
              ) : (
                <div style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '14px',
                  background: shopDoc.assignedInvestor?.status === 'ACCEPTED'
                    ? '#f0fdf4'
                    : shopDoc.assignedInvestor?.status === 'REJECTED'
                      ? '#fef2f2'
                      : !isInvestorAssigned
                        ? '#fffbeb'
                        : '#ffffff'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={16} color="#b45309" />
                      <strong style={{ fontSize: '0.86rem', color: '#b45309' }}>Ban Quản Lý Dự Án</strong>
                    </div>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: !isInvestorAssigned
                        ? (getShopInvestorOverdueInfo(shopDoc).isOverdue ? '#fee2e2' : '#fef3c7')
                        : shopDoc.assignedInvestor?.status === 'ACCEPTED'
                          ? '#dcfce7'
                          : shopDoc.assignedInvestor?.status === 'REJECTED'
                            ? '#fee2e2'
                            : !isTvgsApproved
                              ? '#f1f5f9'
                              : (getShopInvestorOverdueInfo(shopDoc).isOverdue ? '#fee2e2' : '#eff6ff'),
                      color: !isInvestorAssigned
                        ? (getShopInvestorOverdueInfo(shopDoc).isOverdue ? '#b91c1c' : '#b45309')
                        : shopDoc.assignedInvestor?.status === 'ACCEPTED'
                          ? '#15803d'
                          : shopDoc.assignedInvestor?.status === 'REJECTED'
                            ? '#b91c1c'
                            : !isTvgsApproved
                              ? '#64748b'
                              : (getShopInvestorOverdueInfo(shopDoc).isOverdue ? '#b91c1c' : '#1d4ed8')
                    }}>
                      {!isInvestorAssigned
                        ? (getShopInvestorOverdueInfo(shopDoc).isOverdue ? '⚠️ Chậm phân công' : '⏳ Chờ phân công')
                        : shopDoc.assignedInvestor?.status === 'ACCEPTED'
                          ? '✓ Đã xác nhận'
                          : shopDoc.assignedInvestor?.status === 'REJECTED'
                            ? '✕ Yêu cầu sửa'
                            : !isTvgsApproved
                              ? '⏳ Chờ TVGS duyệt trước'
                              : (getShopInvestorOverdueInfo(shopDoc).isOverdue ? '⚠️ Chậm duyệt' : '⏳ Chờ Ban QLDA duyệt')}
                    </span>
                  </div>

                  {/* FORM PHÂN CÔNG / ĐỔI NGƯỜI / SỬA HẠN KHI isAssigningInvestor = true */}
                  {isAssigningInvestor ? (
                    <div style={{ background: '#ffffff', border: '1.5px solid #f59e0b', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#b45309', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <UserCheck size={15} />
                        {isInvestorAssigned ? 'Thay đổi cán bộ Ban QLDA / Sửa ngày (Trong hạn 1 ngày):' : 'Phân công cán bộ Ban QLDA thụ lý:'}
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#334155', marginBottom: '3px' }}>
                          Chọn cán bộ Ban QLDA (kể cả bản thân Trưởng ban):
                        </label>
                        <select
                          value={investorAssigneeUid}
                          onChange={(e) => setInvestorAssigneeUid(e.target.value)}
                          style={{ width: '100%', padding: '7px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                        >
                          <option value="">-- Chọn cán bộ QLDA --</option>
                          {availableInvestors.map(u => {
                            const isMe = u.uid === currentUser?.uid;
                            const isLead = u.role === 'LEAD_INVESTOR' || Boolean(u.isLead) || (u.position || '').toLowerCase().includes('trưởng');
                            return (
                              <option key={u.uid} value={u.uid}>
                                {u.fullName} ({u.position || 'QLDA'}) {isMe ? '⭐ (Bản thân)' : isLead ? '👑 (Trưởng ban)' : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#334155', marginBottom: '3px' }}>
                          Thời hạn phản hồi (SLA):
                        </label>
                        <select
                          value={investorSlaDays}
                          onChange={(e) => setInvestorSlaDays(e.target.value)}
                          style={{ width: '100%', padding: '7px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                        >
                          <option value={1}>1 ngày</option>
                          <option value={2}>2 ngày</option>
                          <option value={3}>3 ngày (Quy chuẩn)</option>
                          <option value={5}>5 ngày</option>
                          <option value={7}>7 ngày</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '4px' }}>
                        <button
                          type="button"
                          onClick={() => setIsAssigningInvestor(false)}
                          style={{ padding: '4px 10px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '4px', fontSize: '0.74rem', cursor: 'pointer' }}
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmAssignInvestor}
                          style={{ padding: '5px 14px', background: '#d97706', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer' }}
                        >
                          {isInvestorAssigned ? 'Lưu thay đổi' : 'Xác nhận giao việc'}
                        </button>
                      </div>
                    </div>
                  ) : !isInvestorAssigned ? (
                    /* NẾU CHƯA PHÂN CÔNG */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                      <div style={{ fontSize: '0.78rem', color: '#92400e', background: '#fef3c7', padding: '8px 10px', borderRadius: '6px', border: '1px solid #fde68a', lineHeight: 1.45 }}>
                        {!isTvgsApproved ? (
                          <>Hồ sơ đã gửi đến <strong>Trưởng Ban QLDA (Ngô Quý Linh)</strong>. Trưởng ban có thể phân công cán bộ trước; thời hạn tính giao việc (24h) sẽ <em>chính thức tính từ khi TVGS thẩm định ĐẠT</em>.</>
                        ) : (
                          <>TVGS đã duyệt đạt! Thời hạn phân công cán bộ Ban QLDA (24h): còn <strong>{remainingInvestor1DayHours}h</strong>{investorAssignmentDeadlineTime ? ` (Hạn: ${formatDateStr(new Date(investorAssignmentDeadlineTime).toISOString())})` : ''}.</>
                        )}
                      </div>

                      {/* NÚT MỞ FORM PHÂN CÔNG NẾU LÀ TRƯỞNG BAN HOẶC ADMIN */}
                      {canAssignInvestor && (
                        <button
                          type="button"
                          onClick={() => {
                            setInvestorAssigneeUid(currentUser?.uid || '');
                            setInvestorSlaDays(shopDoc.assignedInvestor?.slaDays || 3);
                            setIsAssigningInvestor(true);
                          }}
                          style={{
                            padding: '7px 12px',
                            background: '#d97706',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          <UserCheck size={14} /> Phân công cán bộ Ban QLDA
                        </button>
                      )}
                    </div>
                  ) : (
                    /* NẾU ĐÃ PHÂN CÔNG */
                    <div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px', marginBottom: '4px' }}>
                        <div style={{ fontSize: '0.82rem', color: '#334155' }}>
                          <strong>Cán bộ thụ lý:</strong> {investorAssignee?.fullName || 'Ban Quản Lý Dự Án'} {investorAssignee?.uid === currentUser?.uid ? '⭐ (Bản thân)' : ''}
                        </div>

                        {/* NÚT ĐỔI NGƯỜI / SỬA HẠN TRONG THỜI HẠN 1 NGÀY */}
                        {canReassignInvestor && (
                          <button
                            type="button"
                            onClick={() => {
                              setInvestorAssigneeUid(investorAssignee?.uid || '');
                              setInvestorSlaDays(shopDoc.assignedInvestor?.slaDays || 3);
                              setIsAssigningInvestor(true);
                            }}
                            title="Trong hạn 1 ngày: Được phép sửa ngày phản hồi hoặc đổi cán bộ khác"
                            style={{
                              padding: '3px 8px',
                              background: '#fffbeb',
                              border: '1px solid #fde68a',
                              borderRadius: '5px',
                              color: '#b45309',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              flexShrink: 0
                            }}
                          >
                            <RotateCcw size={11} /> Đổi người / Sửa ngày
                          </button>
                        )}
                      </div>

                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        {investorAssignee?.company || 'Ban Quản Lý Dự Án An Phú'}
                      </div>

                      {shopDoc.assignedInvestor?.assignedBy && (
                        <div style={{ fontSize: '0.72rem', color: '#b45309', marginTop: '4px' }}>
                          Phân công bởi: {shopDoc.assignedInvestor.assignedBy.fullName} lúc {formatDateStr(shopDoc.assignedInvestor.assignedAt)}
                        </div>
                      )}
                      <div style={{ fontSize: '0.72rem', color: '#0284c7', marginTop: '2px', fontWeight: 600 }}>
                        {!isTvgsApproved ? (
                          <span>Thời hạn hoàn thành: {shopDoc.assignedInvestor?.slaDays || 3} ngày (Bắt đầu tính khi TVGS duyệt đạt)</span>
                        ) : (
                          <span>Thời hạn hoàn thành: {shopDoc.assignedInvestor?.slaDays || 3} ngày (Hạn: {formatDateStr(shopDoc.assignedInvestor?.dueDate || (shopDoc.assignedTvgs?.reviewedAt ? new Date(new Date(shopDoc.assignedTvgs.reviewedAt).getTime() + (shopDoc.assignedInvestor?.slaDays || 3) * 24 * 3600 * 1000).toISOString() : shopDoc.dueDate))})</span>
                        )}
                      </div>

                      {isWithin1DayInvestorAssignment && canReassignInvestor && (
                        <div style={{ fontSize: '0.71rem', color: '#b45309', background: '#fffbeb', padding: '3px 6px', borderRadius: '4px', border: '1px solid #fde68a', marginTop: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          ⏱️ Hạn đổi người & sửa ngày: còn <strong>{remainingInvestor1DayHours}h</strong> (trong vòng 1 ngày).
                        </div>
                      )}

                      {shopDoc.assignedInvestor?.reviewedAt && (
                        <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '6px' }}>
                          Thời gian duyệt: {formatDateStr(shopDoc.assignedInvestor.reviewedAt)}
                        </div>
                      )}

                      {shopDoc.assignedInvestor?.note && (
                        <div style={{ marginTop: '8px', background: 'rgba(255,255,255,0.7)', padding: '6px 8px', borderRadius: '4px', fontSize: '0.78rem', color: '#1e293b', border: '1px solid #e2e8f0' }}>
                          <strong>Ý kiến Ban QLDA:</strong> {shopDoc.assignedInvestor.note}
                        </div>
                      )}

                      {/* THÔNG BÁO CHỜ TVGS DUYỆT TRƯỚC */}
                      {!isTvgsApproved && shopDoc.assignedInvestor?.status === 'PENDING' && shopDoc.status !== SHOP_STATUS.REJECTED && (
                        <div style={{
                          marginTop: '12px',
                          padding: '8px 10px',
                          background: '#fffbeb',
                          border: '1px solid #fde68a',
                          borderRadius: '6px',
                          fontSize: '0.76rem',
                          color: '#92400e',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          lineHeight: 1.4
                        }}>
                          <Clock size={15} style={{ flexShrink: 0, color: '#d97706' }} />
                          <span>Chờ Tư Vấn Giám Sát kiểm tra và duyệt đạt trước, sau đó Ban QLDA mới có thể phê duyệt hoặc yêu cầu sửa.</span>
                        </div>
                      )}

                      {/* THAO TÁC DUYỆT DÀNH CHO BAN QLDA (CHỈ KÍCH HOẠT KHI TVGS ĐÃ DUYỆT ĐẠT) */}
                      {canInvestorReview && !isRejecting && (
                        <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleConfirmApproval('INVESTOR')}
                            style={{
                              flex: 1,
                              padding: '7px 10px',
                              background: '#16a34a',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              fontWeight: 600,
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px'
                            }}
                          >
                            <CheckCircle2 size={14} /> Ban QLDA Xác Nhận Đạt
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsRejecting('INVESTOR')}
                            style={{
                              padding: '7px 10px',
                              background: '#fee2e2',
                              color: '#b91c1c',
                              border: '1px solid #fecaca',
                              borderRadius: '6px',
                              fontWeight: 600,
                              fontSize: '0.78rem',
                              cursor: 'pointer'
                            }}
                          >
                            Cần sửa
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* FORM NHẬP LÝ DO TỪ CHỐI / CẦN SỬA */}
            {isRejecting && (
              <div style={{ marginTop: '16px', background: '#fef2f2', border: '1.5px solid #fca5a5', padding: '14px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#991b1b', fontWeight: 700, fontSize: '0.86rem' }}>
                  <XCircle size={16} />
                  <span>Yêu cầu Đơn vị thi công chỉnh sửa hồ sơ ({isRejecting === 'SUPERVISOR' ? 'Tư Vấn Giám Sát' : 'Ban QLDA'})</span>
                </div>
                <textarea
                  rows={3}
                  placeholder="Ghi rõ các nội dung sai lệch, bản vẽ thiếu chi tiết, hoặc các điểm cần chỉnh sửa lại..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #f87171',
                    fontSize: '0.84rem',
                    boxSizing: 'border-box',
                    marginBottom: '10px'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => { setIsRejecting(false); setRejectReason(''); }}
                    style={{ padding: '6px 12px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '6px', fontSize: '0.78rem', cursor: 'pointer' }}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfirmRejection(isRejecting)}
                    style={{ padding: '6px 14px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Gửi Yêu Cầu Sửa
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* LỊCH SỬ TIẾN TRÌNH (AUDIT TRAIL) */}
          {Array.isArray(shopDoc.history) && shopDoc.history.length > 0 && (
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.86rem', color: '#475569', fontWeight: 600 }}>
                Nhật Ký Xử Lý Hồ Sơ:
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {shopDoc.history.map((h, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.78rem', color: '#475569' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284c7', marginTop: '4px' }} />
                    <div style={{ flex: 1 }}>
                      <strong>{h.by}</strong> ({h.role}): {h.note}
                      <span style={{ marginLeft: '6px', color: '#94a3b8' }}>• {formatDateStr(h.time)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="modal-footer" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <div>
            {(isContractorCreator || isSuperAdmin) && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Bạn có chắc chắn muốn xóa hồ sơ shop này không?')) {
                    if (onDelete) onDelete(shopDoc.id);
                    onClose();
                  }
                }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#dc2626',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Trash2 size={14} /> Xóa hồ sơ
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {canEditDoc && (
              <button
                type="button"
                onClick={handleExecuteResubmit}
                disabled={isSubmittingResubmit}
                style={{
                  padding: '8px 20px',
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: isSubmittingResubmit ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)',
                  transition: 'all 0.15s ease'
                }}
              >
                <RotateCcw size={15} /> {isSubmittingResubmit ? 'Đang lưu & gửi...' : `Lưu & Gửi lại trực tiếp (${shopDoc.rejectedBy?.fullName || 'Người yêu cầu'})`}
              </button>
            )}

            <button className="btn-secondary" onClick={onClose} style={{ padding: '8px 18px' }}>
              Đóng
            </button>
          </div>
        </div>

      </div>

      {/* MODAL PHÓNG TO XEM ẢNH */}
      <ImagePreviewModal
        isOpen={Boolean(activePhoto)}
        onClose={() => setActivePhoto(null)}
        photos={activePhoto ? [activePhoto] : []}
      />

    </div>
  );
}
