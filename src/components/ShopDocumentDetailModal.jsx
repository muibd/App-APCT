import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X, CheckCircle2, XCircle, AlertCircle, Clock, FileText,
  Download, Eye, User, Building, Calendar, Layers, Check, MessageSquare, Trash2,
  UserCheck, Send, RotateCcw, UploadCloud, Camera, ImagePlus, AlertTriangle
} from 'lucide-react';
import {
  getEffectiveShopStatus,
  getShopStatusBadgeConfig,
  SHOP_STATUS,
  calculateDueDate
} from '../data/shopDocumentConstants';
import { openPdfInNewTab } from '../utils/pdfHelper';
import { compressImageFile } from '../utils/storageHelper';
import { uploadPdfDocument } from '../services/storageService';

export default function ShopDocumentDetailModal({
  isOpen,
  onClose,
  document: shopDoc,
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

  // Helper lấy danh sách PDF ban đầu (hỗ trợ cả pdfFiles dạng mảng hoặc pdfFile đơn lẻ)
  const getInitialPdfFiles = (doc) => {
    if (!doc) return [];
    if (Array.isArray(doc.pdfFiles) && doc.pdfFiles.length > 0) {
      return [...doc.pdfFiles];
    }
    if (doc.pdfFile) {
      return [{
        id: doc.pdfFile.id || 'pdf_0',
        name: doc.pdfFile.name || 'Ho_so_shop.pdf',
        size: doc.pdfFile.size || 'Tài liệu PDF',
        dataUrl: doc.pdfFile.dataUrl
      }];
    }
    return [];
  };

  // Editing & Resubmission states (dành cho ĐVTC khi hồ sơ bị từ chối)
  const [editNotes, setEditNotes] = useState(shopDoc.notes || '');
  const [editPdfFiles, setEditPdfFiles] = useState(() => getInitialPdfFiles(shopDoc));
  const [editPhotos, setEditPhotos] = useState(Array.isArray(shopDoc.photos) ? shopDoc.photos : []);
  const [isSubmittingResubmit, setIsSubmittingResubmit] = useState(false);

  const editPdfInputRef = useRef(null);
  const editPhotoInputRef = useRef(null);
  const editCameraInputRef = useRef(null);

  // Tự động đồng bộ lại khi shopDoc thay đổi
  useEffect(() => {
    if (shopDoc) {
      setEditNotes(shopDoc.notes || '');
      setEditPdfFiles(getInitialPdfFiles(shopDoc));
      setEditPhotos(Array.isArray(shopDoc.photos) ? [...shopDoc.photos] : []);
    }
  }, [shopDoc]);

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
  const curEmail = (currentUser?.email || '').toLowerCase();
  const curUid = (currentUser?.uid || '').toLowerCase();
  const isLeadSupervisor = currentRole === 'LEAD_SUPERVISOR' || 
    Boolean(currentUser?.isLead && currentRole === 'SUPERVISOR') ||
    (currentRole === 'SUPERVISOR' && (currentUser?.position || '').toLowerCase().includes('giám sát trưởng')) ||
    curEmail.includes('muitvgs') || curUid.includes('muitvgs') || curUid === 'uid_custom_1792576174520';
  
  const isLeadInvestor = currentRole === 'LEAD_INVESTOR' || 
    Boolean(currentUser?.isLead && currentRole === 'INVESTOR') ||
    (currentRole === 'INVESTOR' && (currentUser?.position || '').toLowerCase().includes('trưởng ban')) ||
    curEmail.includes('muicdt') || curUid.includes('muicdt') || curUid === 'uid_custom_1792576233247';

  // Kiểm tra cán bộ đã được phân công chưa
  const tvgsAssignee = shopDoc.assignedTvgs?.assignee || (shopDoc.assignedTvgs?.uid ? shopDoc.assignedTvgs : null);
  const isTvgsAssigned = Boolean(tvgsAssignee?.uid);

  const investorAssignee = shopDoc.assignedInvestor?.assignee || (shopDoc.assignedInvestor?.uid ? shopDoc.assignedInvestor : null);
  const isInvestorAssigned = Boolean(investorAssignee?.uid);

  // Quyền phân công
  const canAssignTvgs = (isLeadSupervisor || isSuperAdmin) && (!isTvgsAssigned || shopDoc.assignedTvgs?.status === 'WAITING_ASSIGNMENT');
  const canAssignInvestor = (isLeadInvestor || isSuperAdmin) && (!isInvestorAssigned || shopDoc.assignedInvestor?.status === 'WAITING_ASSIGNMENT');

  // Danh sách cán bộ cấp dưới để giao việc
  const subordinateSupervisors = useMemo(() => {
    return (users || []).filter(u => {
      if (u.status === 'INACTIVE') return false;
      if (u.role !== 'SUPERVISOR') return false;
      if (u.role === 'LEAD_SUPERVISOR' || Boolean(u.isLead)) return false;
      const pos = (u.position || '').toLowerCase();
      if (pos.includes('trưởng') || pos.includes('chỉ huy') || pos.includes('giám đốc')) return false;
      return true;
    });
  }, [users]);

  const subordinateInvestors = useMemo(() => {
    return (users || []).filter(u => {
      if (u.status === 'INACTIVE') return false;
      if (u.role !== 'INVESTOR') return false;
      if (u.role === 'LEAD_INVESTOR' || Boolean(u.isLead)) return false;
      const pos = (u.position || '').toLowerCase();
      if (pos.includes('trưởng') || pos.includes('giám đốc') || pos.includes('chỉ huy')) return false;
      return true;
    });
  }, [users]);

  // Quyền thẩm định & phê duyệt
  const isAssignedTvgs = (tvgsAssignee?.uid === currentUser?.uid) || isLeadSupervisor || isSuperAdmin;
  const isAssignedInvestor = (investorAssignee?.uid === currentUser?.uid) || isLeadInvestor || isSuperAdmin;
  const isContractorCreator = (shopDoc.createdByUid === currentUser?.uid) || currentRole === 'CONTRACTOR' || isSuperAdmin;
  const isDocRejected = shopDoc.status === SHOP_STATUS.REJECTED;
  const canEditDoc = isDocRejected && (isContractorCreator || isSuperAdmin);

  // Điều kiện tuần tự theo quy chuẩn xây dựng: TVGS phải duyệt đạt trước thì Ban QLDA mới được duyệt/hủy
  const isTvgsApproved = shopDoc.assignedTvgs?.status === 'ACCEPTED';

  // TVGS có thể duyệt nếu đã được phân công, trạng thái đang là PENDING và hồ sơ chưa bị từ chối
  const canTvgsReview = isAssignedTvgs && isTvgsAssigned && shopDoc.assignedTvgs?.status === 'PENDING' && shopDoc.status !== SHOP_STATUS.REJECTED;

  // Ban QLDA CHỈ ĐƯỢC PHÊ DUYỆT HOẶC HỦY KHI TVGS ĐÃ PHÊ DUYỆT ĐẠT TRƯỚC
  const canInvestorReview = isAssignedInvestor && isInvestorAssigned && isTvgsApproved && shopDoc.assignedInvestor?.status === 'PENDING' && shopDoc.status !== SHOP_STATUS.REJECTED;

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

  // 1. Xử lý phân công cán bộ TVGS
  const handleConfirmAssignTvgs = () => {
    if (!tvgsAssigneeUid) {
      if (showAlert) showAlert({ type: 'warning', title: 'Thiếu thông tin', message: 'Vui lòng chọn 1 cán bộ TVGS trực tiếp thụ lý!' });
      return;
    }
    const assigneeUser = users.find(u => u.uid === tvgsAssigneeUid);
    if (!assigneeUser) return;

    if (onAssign) {
      onAssign({
        docId: shopDoc.id,
        roleType: 'SUPERVISOR',
        assignee: {
          uid: assigneeUser.uid,
          fullName: assigneeUser.fullName,
          email: assigneeUser.email || '',
          position: assigneeUser.position || 'Cán bộ tư vấn giám sát',
          company: assigneeUser.company || 'Công ty CP Tư vấn Xây dựng và Thương mại GELICON'
        },
        slaDays: Number(tvgsSlaDays || 3),
        leader: currentUser
      });
      setIsAssigningTvgs(false);
    }
  };

  // 2. Xử lý phân công cán bộ Ban QLDA
  const handleConfirmAssignInvestor = () => {
    if (!investorAssigneeUid) {
      if (showAlert) showAlert({ type: 'warning', title: 'Thiếu thông tin', message: 'Vui lòng chọn 1 cán bộ Ban QLDA trực tiếp thụ lý!' });
      return;
    }
    const assigneeUser = users.find(u => u.uid === investorAssigneeUid);
    if (!assigneeUser) return;

    if (onAssign) {
      onAssign({
        docId: shopDoc.id,
        roleType: 'INVESTOR',
        assignee: {
          uid: assigneeUser.uid,
          fullName: assigneeUser.fullName,
          email: assigneeUser.email || '',
          position: assigneeUser.position || 'Cán bộ ban QLDA',
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
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        if (showAlert) showAlert({ type: 'warning', title: 'Định dạng file', message: `Tệp "${file.name}" không phải định dạng PDF!` });
        continue;
      }
      if (file.size > 25 * 1024 * 1024) {
        if (showAlert) showAlert({ type: 'warning', title: 'Kích thước tệp', message: `Tệp "${file.name}" không được vượt quá 25MB!` });
        continue;
      }
      const reader = new FileReader();
      reader.onload = () => {
        let dataUrl = reader.result;
        if (typeof dataUrl === 'string' && dataUrl.startsWith('data:') && !dataUrl.startsWith('data:application/pdf')) {
          dataUrl = dataUrl.replace(/^data:[^;]*/, 'data:application/pdf');
        }
        setEditPdfFiles(prev => [
          ...prev,
          {
            id: `pdf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: file.name,
            size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
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
    setEditPdfFiles(prev => prev.filter(p => p.id !== pdfId));
  };

  const handleExecuteResubmit = async () => {
    if (!editNotes.trim()) {
      if (showAlert) showAlert({ type: 'warning', title: 'Thiếu nội dung', message: 'Vui lòng nhập nội dung / ghi chú kỹ thuật đã chỉnh sửa!' });
      return;
    }

    setIsSubmittingResubmit(true);
    try {
      const finalPdfFiles = [];
      for (const pdf of editPdfFiles) {
        if (pdf.rawFile) {
          try {
            const cloudUrl = await uploadPdfDocument(pdf.rawFile, shopDoc.docCode || `HSS-${Date.now()}`);
            if (cloudUrl) {
              finalPdfFiles.push({
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
        finalPdfFiles.push({
          id: pdf.id,
          name: pdf.name,
          size: pdf.size,
          dataUrl: pdf.dataUrl
        });
      }

      if (onResubmit) {
        await onResubmit(shopDoc.id, {
          notes: editNotes.trim(),
          pdfFile: finalPdfFiles[0] || null,
          pdfFiles: finalPdfFiles,
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
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Loại Hồ Sơ</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a' }}>{shopDoc.typeName}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Ngày Tạo / Phát Hành</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#334155' }}>{formatDateStr(shopDoc.submittedAt || shopDoc.createdAt)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Hạn Phân Công (24h)</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: isTvgsAssigned && isInvestorAssigned ? '#15803d' : '#ea580c' }}>
                {isTvgsAssigned && isInvestorAssigned ? '✓ Đã hoàn tất phân công' : formatDateStr(shopDoc.assignmentDeadline)}
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
                accept="application/pdf,.pdf"
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

          {/* FILE PDF ĐÍNH KÈM */}
          {(canEditDoc || (Array.isArray(shopDoc.pdfFiles) && shopDoc.pdfFiles.length > 0) || shopDoc.pdfFile) && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                <h4 style={{ margin: 0, fontSize: '0.86rem', color: '#1e293b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Tệp PDF Bản Vẽ / Hồ Sơ Đính Kèm ({canEditDoc ? editPdfFiles.length : (shopDoc.pdfFiles?.length || (shopDoc.pdfFile ? 1 : 0))}):
                  {canEditDoc && (
                    <span style={{ fontSize: '0.72rem', color: '#2563eb', background: '#eff6ff', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, border: '1px solid #bfdbfe' }}>
                      Có thể tải lên nhiều file PDF
                    </span>
                  )}
                </h4>

                {canEditDoc && (
                  <button
                    type="button"
                    onClick={() => editPdfInputRef.current?.click()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      border: '1px solid #93c5fd',
                      background: '#eff6ff',
                      color: '#2563eb',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <UploadCloud size={14} /> + Thêm tệp PDF
                  </button>
                )}
              </div>

              {canEditDoc ? (
                editPdfFiles.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {editPdfFiles.map((pdf, idx) => (
                      <div
                        key={pdf.id || idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: '#fef2f2',
                          border: '1.5px solid #fca5a5',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          flexWrap: 'wrap',
                          gap: '10px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '200px', flex: 1 }}>
                          <FileText size={26} color="#dc2626" style={{ flexShrink: 0 }} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#991b1b', wordBreak: 'break-all' }}>
                              {pdf.name || `Tệp PDF ${idx + 1}`}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#b91c1c' }}>
                              {pdf.size || 'Tài liệu PDF'} {pdf.rawFile ? '• (Tệp mới chọn)' : ''}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {pdf.dataUrl && (
                            <button
                              type="button"
                              onClick={() => handleOpenPdf(pdf.dataUrl, pdf.name)}
                              title="Mở xem trực tiếp PDF"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '6px 12px',
                                background: '#dc2626',
                                border: 'none',
                                borderRadius: '6px',
                                color: '#ffffff',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: 600
                              }}
                            >
                              <Eye size={15} /> Mở Xem PDF
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeletePdf(pdf.id)}
                            title="Xóa tệp PDF này"
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
                      border: '2px dashed #93c5fd',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      padding: '18px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <UploadCloud size={30} color="#2563eb" style={{ margin: '0 auto 6px' }} />
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1e40af' }}>
                      + Bấm vào đây để tải lên tệp PDF (hỗ trợ chọn nhiều file)
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                      Hỗ trợ định dạng .pdf (Tối đa 25MB mỗi tệp)
                    </div>
                  </div>
                )
              ) : (
                /* CHẾ ĐỘ XEM CHỈ ĐỌC (READONLY VIEW) */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(Array.isArray(shopDoc.pdfFiles) && shopDoc.pdfFiles.length > 0 ? shopDoc.pdfFiles : (shopDoc.pdfFile ? [shopDoc.pdfFile] : [])).map((pdf, idx) => (
                    <div
                      key={pdf.id || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '220px' }}>
                        <FileText size={26} color="#dc2626" style={{ flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#991b1b', wordBreak: 'break-all' }}>
                            {pdf.name || 'Ho_so_shop.pdf'}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#b91c1c' }}>
                            {pdf.size || 'Tài liệu PDF'}
                          </div>
                        </div>
                      </div>

                      {pdf.dataUrl && (
                        <button
                          type="button"
                          onClick={() => handleOpenPdf(pdf.dataUrl, pdf.name)}
                          title="Mở xem trực tiếp tài liệu PDF trên tab mới"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#ffffff',
                            cursor: 'pointer',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            boxShadow: '0 2px 4px rgba(220, 38, 38, 0.25)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <Eye size={16} /> Mở Xem PDF
                        </button>
                      )}
                    </div>
                  ))}
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
                      ? '#fef3c7' 
                      : shopDoc.assignedTvgs?.status === 'ACCEPTED' 
                        ? '#dcfce7' 
                        : shopDoc.assignedTvgs?.status === 'REJECTED' 
                          ? '#fee2e2' 
                          : '#eff6ff',
                    color: !isTvgsAssigned 
                      ? '#b45309' 
                      : shopDoc.assignedTvgs?.status === 'ACCEPTED' 
                        ? '#15803d' 
                        : shopDoc.assignedTvgs?.status === 'REJECTED' 
                          ? '#b91c1c' 
                          : '#1d4ed8'
                  }}>
                    {!isTvgsAssigned 
                      ? '⏳ Chờ phân công' 
                      : shopDoc.assignedTvgs?.status === 'ACCEPTED' 
                        ? '✓ Đã xác nhận' 
                        : shopDoc.assignedTvgs?.status === 'REJECTED' 
                          ? '✕ Yêu cầu sửa' 
                          : '⏳ Đang thẩm định'}
                  </span>
                </div>

                {/* NẾU CHƯA PHÂN CÔNG */}
                {!isTvgsAssigned ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                    <div style={{ fontSize: '0.78rem', color: '#92400e', background: '#fef3c7', padding: '8px 10px', borderRadius: '6px', border: '1px solid #fde68a' }}>
                      Hồ sơ đã gửi đến <strong>TVGS Trưởng (Đinh Xuân Thám)</strong>. Thời hạn phân công cán bộ: 1 ngày (24h).
                    </div>

                    {/* NÚT MỞ FORM PHÂN CÔNG NẾU LÀ TVGS TRƯỞNG HOẶC ADMIN */}
                    {canAssignTvgs && !isAssigningTvgs && (
                      <button
                        type="button"
                        onClick={() => setIsAssigningTvgs(true)}
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

                    {/* FORM PHÂN CÔNG */}
                    {isAssigningTvgs && (
                      <div style={{ background: '#ffffff', border: '1px solid #10b981', padding: '10px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#334155', marginBottom: '3px' }}>
                            Chọn cán bộ TVGS thụ lý:
                          </label>
                          <select
                            value={tvgsAssigneeUid}
                            onChange={(e) => setTvgsAssigneeUid(e.target.value)}
                            style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                          >
                            <option value="">-- Chọn cán bộ TVGS --</option>
                            {subordinateSupervisors.map(u => (
                              <option key={u.uid} value={u.uid}>{u.fullName} ({u.position || 'TVGS'})</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#334155', marginBottom: '3px' }}>
                            Thời hạn phản hồi (SLA):
                          </label>
                          <select
                            value={tvgsSlaDays}
                            onChange={(e) => setTvgsSlaDays(e.target.value)}
                            style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
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
                            style={{ padding: '4px 12px', background: '#059669', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Xác nhận giao việc
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* NẾU ĐÃ PHÂN CÔNG */
                  <div>
                    <div style={{ fontSize: '0.82rem', color: '#334155', marginBottom: '4px' }}>
                      <strong>Cán bộ thụ lý:</strong> {tvgsAssignee?.fullName || 'Tư Vấn Giám Sát'}
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
                      <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
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
                          <CheckCircle2 size={14} /> TVGS Xác Nhận Đạt
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
                    )}
                  </div>
                )}
              </div>

              {/* 2. BAN QLDA CARD */}
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
                      ? '#fef3c7' 
                      : shopDoc.assignedInvestor?.status === 'ACCEPTED' 
                        ? '#dcfce7' 
                        : shopDoc.assignedInvestor?.status === 'REJECTED' 
                          ? '#fee2e2' 
                          : !isTvgsApproved 
                            ? '#f1f5f9' 
                            : '#eff6ff',
                    color: !isInvestorAssigned 
                      ? '#b45309' 
                      : shopDoc.assignedInvestor?.status === 'ACCEPTED' 
                        ? '#15803d' 
                        : shopDoc.assignedInvestor?.status === 'REJECTED' 
                          ? '#b91c1c' 
                          : !isTvgsApproved 
                            ? '#64748b' 
                            : '#1d4ed8'
                  }}>
                    {!isInvestorAssigned 
                      ? '⏳ Chờ phân công' 
                      : shopDoc.assignedInvestor?.status === 'ACCEPTED' 
                        ? '✓ Đã xác nhận' 
                        : shopDoc.assignedInvestor?.status === 'REJECTED' 
                          ? '✕ Yêu cầu sửa' 
                          : !isTvgsApproved 
                            ? '⏳ Chờ TVGS duyệt trước' 
                            : '⏳ Chờ Ban QLDA duyệt'}
                  </span>
                </div>

                {/* NẾU CHƯA PHÂN CÔNG */}
                {!isInvestorAssigned ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                    <div style={{ fontSize: '0.78rem', color: '#92400e', background: '#fef3c7', padding: '8px 10px', borderRadius: '6px', border: '1px solid #fde68a' }}>
                      Hồ sơ đã gửi đến <strong>Trưởng Ban QLDA (Ngô Quý Linh)</strong>. Thời hạn phân công cán bộ: 1 ngày (24h).
                    </div>

                    {/* NÚT MỞ FORM PHÂN CÔNG NẾU LÀ TRƯỞNG BAN HOẶC ADMIN */}
                    {canAssignInvestor && !isAssigningInvestor && (
                      <button
                        type="button"
                        onClick={() => setIsAssigningInvestor(true)}
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

                    {/* FORM PHÂN CÔNG BAN QLDA */}
                    {isAssigningInvestor && (
                      <div style={{ background: '#ffffff', border: '1px solid #f59e0b', padding: '10px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#334155', marginBottom: '3px' }}>
                            Chọn cán bộ Ban QLDA thụ lý:
                          </label>
                          <select
                            value={investorAssigneeUid}
                            onChange={(e) => setInvestorAssigneeUid(e.target.value)}
                            style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                          >
                            <option value="">-- Chọn cán bộ QLDA --</option>
                            {subordinateInvestors.map(u => (
                              <option key={u.uid} value={u.uid}>{u.fullName} ({u.position || 'QLDA'})</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#334155', marginBottom: '3px' }}>
                            Thời hạn phản hồi (SLA):
                          </label>
                          <select
                            value={investorSlaDays}
                            onChange={(e) => setInvestorSlaDays(e.target.value)}
                            style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
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
                            style={{ padding: '4px 12px', background: '#d97706', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Xác nhận giao việc
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* NẾU ĐÃ PHÂN CÔNG */
                  <div>
                    <div style={{ fontSize: '0.82rem', color: '#334155', marginBottom: '4px' }}>
                      <strong>Cán bộ thụ lý:</strong> {investorAssignee?.fullName || 'Ban Quản Lý Dự Án'}
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
                      Thời hạn hoàn thành: {shopDoc.assignedInvestor?.slaDays || 3} ngày (Hạn: {formatDateStr(shopDoc.assignedInvestor?.dueDate || shopDoc.dueDate)})
                    </div>

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

      {/* LIGHTBOX XEM ẢNH FULL */}
      {activePhoto && (
        <div 
          onClick={() => setActivePhoto(null)} 
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <img src={activePhoto} alt="Xem đầy đủ" style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }} />
        </div>
      )}

    </div>
  );
}
