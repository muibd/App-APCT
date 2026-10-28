import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X, Send, Users, Calendar, Clock, FileText, UploadCloud,
  Camera, ImagePlus, Trash2, CheckCircle2, AlertCircle, File, Eye, ChevronRight
} from 'lucide-react';
import { compressImageFile } from '../utils/storageHelper';
import { 
  DEFAULT_SHOP_SLA_CONFIGS, 
  calculateDueDate,
  getShopLeadSupervisor,
  getShopLeadInvestor 
} from '../data/shopDocumentConstants';
import { uploadPdfDocument } from '../services/storageService';
import { openPdfInNewTab } from '../utils/pdfHelper';

export default function CreateShopDocumentModal({
  isOpen,
  onClose,
  users = [],
  currentUser,
  slaConfigs = DEFAULT_SHOP_SLA_CONFIGS,
  onSubmitShopDocument,
  showAlert
}) {
  if (!isOpen) return null;

  // Tìm Tư vấn giám sát trưởng (Đinh Xuân Thám)
  const leadSupervisor = useMemo(() => getShopLeadSupervisor(users), [users]);

  // Tìm Trưởng Ban Quản lý dự án (Ngô Quý Linh)
  const leadInvestor = useMemo(() => getShopLeadInvestor(users), [users]);

  // Danh sách loại hồ sơ (lấy từ cấu hình SLA của admin hoặc mặc định)
  const typeOptions = useMemo(() => {
    return (slaConfigs && slaConfigs.length > 0) ? slaConfigs : DEFAULT_SHOP_SLA_CONFIGS;
  }, [slaConfigs]);

  // State form
  const [title, setTitle] = useState('');
  const [selectedTypeCode, setSelectedTypeCode] = useState(typeOptions[0]?.typeCode || 'BIEN_PHAP_THI_CONG');
  const [notes, setNotes] = useState('');
  
  // Tự động lấy ngày giờ hiện tại
  const [createdAtState] = useState(() => new Date());
  const formattedDateTime = useMemo(() => {
    const d = createdAtState;
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${hours}:${mins} - Ngày ${day}/${month}/${year}`;
  }, [createdAtState]);

  // PDF đính kèm (hỗ trợ nhiều file)
  const [pdfFiles, setPdfFiles] = useState([]);
  const pdfInputRef = useRef(null);

  // Ảnh chụp hiện trường / bản vẽ
  const [photos, setPhotos] = useState([]);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lấy cấu hình SLA của loại hồ sơ đang chọn
  const currentSlaConfig = useMemo(() => {
    return typeOptions.find(t => t.typeCode === selectedTypeCode) || typeOptions[0];
  }, [typeOptions, selectedTypeCode]);

  // Xử lý upload file PDF
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
        setPdfFiles(prev => [
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
    setPdfFiles(prev => prev.filter(p => p.id !== pdfId));
  };

  // Xử lý chụp ảnh / chọn ảnh
  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    for (const file of files) {
      const compressedUrl = await compressImageFile(file);
      if (!compressedUrl) continue;
      const now = new Date();
      const timeStr = `${now.toLocaleTimeString('vi-VN')} ngày ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
      setPhotos(prev => [
        ...prev,
        {
          id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          url: compressedUrl,
          caption: file.name ? file.name.replace(/\.[^/.]+$/, '') : 'Bản vẽ / Ảnh hiện trường',
          time: timeStr
        }
      ]);
    }
    e.target.value = '';
  };

  const handleDeletePhoto = (photoId) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  const handleUpdateCaption = (photoId, caption) => {
    setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, caption } : p));
  };

  // Submit tạo hồ sơ
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      if (showAlert) showAlert({ type: 'warning', title: 'Thiếu thông tin', message: 'Vui lòng nhập Tên hồ sơ!' });
      return;
    }

    setIsSubmitting(true);

    try {
      const slaDays = Number(currentSlaConfig?.slaDays || 3);
      const nowIso = createdAtState.toISOString();
      const assignmentDeadlineIso = new Date(createdAtState.getTime() + 24 * 60 * 60 * 1000).toISOString(); // 1 ngày để 2 Trưởng ban chọn cán bộ
      const dueDateIso = calculateDueDate(nowIso, slaDays).toISOString();
      const docCode = `HSS-${Date.now().toString().slice(-6)}`;

      // Xử lý lưu trữ PDF: Thử upload Cloud Storage trước nếu có file gốc
      const finalPdfFiles = [];
      for (const pdf of pdfFiles) {
        let cloudUrl = null;
        if (pdf.rawFile) {
          try {
            cloudUrl = await uploadPdfDocument(pdf.rawFile, docCode);
          } catch (uploadErr) {
            console.warn('[CreateShopDoc] Upload PDF Cloud Error, dùng dataUrl:', uploadErr);
          }
        }
        finalPdfFiles.push({
          id: pdf.id,
          name: pdf.name,
          size: pdf.size,
          dataUrl: cloudUrl || pdf.dataUrl
        });
      }

      const newShopDoc = {
        id: `shop_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        docCode,
        title: title.trim(),
        typeCode: currentSlaConfig?.typeCode || selectedTypeCode,
        typeName: currentSlaConfig?.typeName || 'Hồ sơ kỹ thuật',
        slaDays,
        createdAt: nowIso,
        submittedAt: nowIso,
        dueDate: dueDateIso,
        assignmentDeadline: assignmentDeadlineIso,
        assignmentTvgsOverdueNotified: false,
        assignmentInvestorOverdueNotified: false,
        tvgsReviewOverdueNotified: false,
        investorReviewOverdueNotified: false,
        notes: notes.trim(),
        pdfFile: finalPdfFiles[0] || null,
        pdfFiles: finalPdfFiles,
        photos: photos || [],
        createdByUid: currentUser?.uid || 'contractor_uid',
        createdByName: currentUser?.fullName || 'Đơn Vị Thi Công',
        createdByRole: currentUser?.role || 'CONTRACTOR',
        contractorCompany: currentUser?.company || 'Công ty TNHH Gia Huy Vĩnh Phúc',
        
        // Mặc định gửi cho 2 Trưởng ban, mỗi người có 1 ngày để chọn cán bộ và ấn định thời hạn
        assignedTvgs: {
          assignee: null,
          assignedBy: null,
          assignedAt: null,
          slaDays,
          dueDate: null,
          status: 'WAITING_ASSIGNMENT', // 'WAITING_ASSIGNMENT' | 'PENDING' | 'ACCEPTED' | 'REJECTED'
          reviewedAt: null,
          note: ''
        },
        assignedInvestor: {
          assignee: null,
          assignedBy: null,
          assignedAt: null,
          slaDays,
          dueDate: null,
          status: 'WAITING_ASSIGNMENT', // 'WAITING_ASSIGNMENT' | 'PENDING' | 'ACCEPTED' | 'REJECTED'
          reviewedAt: null,
          note: ''
        },

        // Danh sách recipients để phân phối notification chuẩn xác: TVGS Trưởng & Trưởng Ban QLDA
        assignedRecipients: [
          { uid: leadSupervisor.uid, role: 'LEAD_SUPERVISOR', name: leadSupervisor.fullName, position: leadSupervisor.position },
          { uid: leadInvestor.uid, role: 'LEAD_INVESTOR', name: leadInvestor.fullName, position: leadInvestor.position }
        ],

        // Trạng thái khởi tạo: CHỜ PHÂN CÔNG (Hạn 1 ngày)
        status: 'WAITING_ASSIGNMENT',
        rejectedBy: null,
        rejectionReason: '',
        history: [
          {
            action: 'CREATED',
            by: currentUser?.fullName || 'Đơn Vị Thi Công',
            role: currentUser?.role || 'CONTRACTOR',
            time: nowIso,
            note: `Khởi tạo hồ sơ, gửi mặc định đến TVGS Trưởng (${leadSupervisor.fullName}) và Trưởng Ban QLDA (${leadInvestor.fullName}) để phân công cán bộ (Hạn phân công: 1 ngày)`
          }
        ]
      };

      await onSubmitShopDocument(newShopDoc);
      onClose();
    } catch (err) {
      console.error('Lỗi khi tạo hồ sơ shop:', err);
      if (showAlert) showAlert({ type: 'error', title: 'Lỗi', message: 'Không thể tạo hồ sơ shop: ' + (err.message || 'Lỗi không xác định') });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      {/* HIỆU ỨNG XOAY TOÀN MÀN HÌNH KHI ĐANG TẠO HỒ SƠ */}
      {isSubmitting && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(15, 23, 42, 0.72)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '36px 40px',
              maxWidth: '440px',
              width: '92%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0,0,0,0.06)',
              textAlign: 'center',
              position: 'relative'
            }}
          >
            {/* SPINNER VÒNG TRÒN XOAY KÉP NỔI BẬT */}
            <div style={{ position: 'relative', width: '86px', height: '86px', marginBottom: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Outer dashed spinning ring */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  border: '3px dashed #6ee7b7',
                  animation: 'spinReverse 3s linear infinite'
                }}
              />
              {/* Inner gradient spinning ring */}
              <div
                style={{
                  position: 'absolute',
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  border: '4px solid #f1f5f9',
                  borderTopColor: '#059669',
                  borderRightColor: '#10b981',
                  animation: 'spin 0.8s linear infinite'
                }}
              />
              {/* Center icon with gentle pulse */}
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: '#dcfce7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#16a34a',
                  zIndex: 2,
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)'
                }}
              >
                <FileText size={24} />
              </div>
            </div>

            {/* TIÊU ĐỀ & MÔ TẢ TRẠNG THÁI */}
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.25rem', color: '#0f172a', fontWeight: 800 }}>
              Đang Khởi Tạo Hồ Sơ Shop...
            </h3>
            <p style={{ margin: '0 0 18px 0', fontSize: '0.9rem', color: '#64748b', lineHeight: 1.55 }}>
              Hệ thống đang tải tài liệu đính kèm, lưu trữ dữ liệu an toàn và phân phối thông báo thẩm định đến Tư Vấn Giám Sát.
            </p>

            {/* THANH TIẾN TRÌNH & CHẤM XUNG ĐỘNG */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: '#f0fdf4', borderRadius: '20px', border: '1px solid #bbf7d0' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669', animation: 'pulse 1.2s infinite 0s' }} />
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', animation: 'pulse 1.2s infinite 0.2s' }} />
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', animation: 'pulse 1.2s infinite 0.4s' }} />
              <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#15803d', marginLeft: '4px' }}>
                Vui lòng đợi trong giây lát...
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="modal-content" style={{ maxWidth: '780px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* HEADER */}
        <div className="modal-header" style={{ background: '#f0fdf4', borderBottom: '1px solid #bbf7d0', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#dcfce7', padding: '8px', borderRadius: '10px', color: '#16a34a' }}>
              <FileText size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#14532d', fontWeight: 700 }}>
                Tạo Hồ Sơ Bộ Phận Shop
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#166534' }}>
                Trình duyệt biện pháp thi công, shop drawing, tiến độ & bản vẽ hoàn công
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {/* FORM BODY */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* TÊN HỒ SƠ & THỜI GIAN */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.86rem', color: '#1e293b', marginBottom: '6px' }}>
                Tên hồ sơ <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input 
                type="text"
                placeholder="VD: Bản vẽ Shop kết cấu dầm sàn tầng 3 Block B..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.86rem', color: '#1e293b', marginBottom: '6px' }}>
                Ngày giờ tạo
              </label>
              <div style={{
                padding: '9px 12px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.85rem',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 500
              }}>
                <Clock size={15} color="#0284c7" />
                <span>{formattedDateTime}</span>
              </div>
            </div>
          </div>

          {/* CHỌN LOẠI HỒ SƠ DẠNG SELECT GỌN GÀNG */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.86rem', color: '#1e293b', marginBottom: '6px' }}>
              Loại hồ sơ <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <select
              value={selectedTypeCode}
              onChange={(e) => setSelectedTypeCode(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                border: '1.5px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.9rem',
                color: '#1e293b',
                background: '#ffffff',
                outline: 'none',
                boxSizing: 'border-box',
                cursor: 'pointer'
              }}
            >
              {typeOptions.map(t => (
                <option key={t.typeCode || t.id} value={t.typeCode}>
                  {t.typeName}
                </option>
              ))}
            </select>
          </div>

          {/* GHI CHÚ */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.86rem', color: '#1e293b', marginBottom: '6px' }}>
              Ghi chú
            </label>
            <textarea
              rows={3}
              placeholder="Nhập ghi chú gửi kèm nếu có..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                border: '1.5px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.88rem',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* TỆP ĐÍNH KÈM: PDF & ẢNH HIỆN TRƯỜNG */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            
            {/* UPLOAD PDF */}
            <div style={{ border: '1px dashed #94a3b8', borderRadius: '8px', padding: '12px', background: '#fafaf9' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '4px' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155' }}>
                  Tệp PDF Hồ Sơ ({pdfFiles.length})
                </span>
                <button
                  type="button"
                  onClick={() => pdfInputRef.current?.click()}
                  style={{ border: 'none', background: 'transparent', color: '#1d4ed8', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                >
                  <UploadCloud size={13} /> + Thêm PDF
                </button>
              </div>

              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf,.pdf"
                multiple
                style={{ display: 'none' }}
                onChange={handlePdfUpload}
              />

              {pdfFiles.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {pdfFiles.map((f, idx) => (
                    <div key={f.id || idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fef2f2', border: '1px solid #fecaca', padding: '6px 8px', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                        <File size={18} color="#dc2626" style={{ flexShrink: 0 }} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#991b1b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {f.name}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#b91c1c' }}>{f.size}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px' }}>
                        <button
                          type="button"
                          onClick={() => openPdfInNewTab(f.dataUrl, f.name)}
                          title="Xem thử"
                          style={{ border: 'none', background: 'transparent', color: '#1d4ed8', cursor: 'pointer', padding: '2px 4px' }}
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePdf(f.id)}
                          title="Xóa PDF"
                          style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer', padding: '2px 4px' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <button
                    type="button"
                    onClick={() => pdfInputRef.current?.click()}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px dashed #cbd5e1',
                      borderRadius: '6px',
                      background: '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#475569'
                    }}
                  >
                    <UploadCloud size={20} color="#0284c7" />
                    <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>Tải lên file PDF (có thể chọn nhiều tệp)</span>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Dung lượng tối đa 25MB</span>
                  </button>
                </div>
              )}
            </div>

            {/* ẢNH CHỤP / TẢI ẢNH */}
            <div style={{ border: '1px dashed #94a3b8', borderRadius: '8px', padding: '12px', background: '#fafaf9' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155' }}>
                  Ảnh chụp ({photos.length})
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                    onChange={handlePhotoUpload}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handlePhotoUpload}
                  />
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    title="Mở camera chụp ảnh"
                    style={{
                      padding: '4px 8px',
                      background: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      borderRadius: '4px',
                      color: '#059669',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      fontSize: '0.72rem',
                      fontWeight: 600
                    }}
                  >
                    <Camera size={13} /> Chụp
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Chọn ảnh từ thư viện"
                    style={{
                      padding: '4px 8px',
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: '4px',
                      color: '#2563eb',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      fontSize: '0.72rem',
                      fontWeight: 600
                    }}
                  >
                    <ImagePlus size={13} /> Thêm ảnh
                  </button>
                </div>
              </div>

              {photos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '12px', color: '#94a3b8', fontSize: '0.78rem' }}>
                  Chưa có ảnh chụp đính kèm (có thể bấm chụp hoặc tải ảnh)
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '6px', maxHeight: '110px', overflowY: 'auto' }}>
                  {photos.map(p => (
                    <div key={p.id} style={{ position: 'relative', borderRadius: '4px', overflow: 'hidden', border: '1px solid #e2e8f0', height: '65px' }}>
                      <img src={p.url} alt="Shop" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(p.id)}
                        style={{
                          position: 'absolute',
                          top: '2px',
                          right: '2px',
                          background: 'rgba(220, 38, 38, 0.85)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '16px',
                          height: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* QUY TRÌNH PHÂN CÔNG TỰ ĐỘNG CHO 2 TRƯỞNG BAN */}
          <div style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
            border: '1.5px solid #a7f3d0',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} color="#059669" />
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#065f46' }}>
                Quy trình tiếp nhận & phân công tự động (Hạn xử lý: 1 ngày)
              </span>
            </div>

            <p style={{ margin: 0, fontSize: '0.82rem', color: '#047857', lineHeight: 1.5 }}>
              Hồ sơ sau khi tạo sẽ được <strong>gửi mặc định</strong> đến 2 vị trí Trưởng ban để xem xét và giao nhiệm vụ cho cán bộ chuyên môn trực tiếp thụ lý:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {/* TVGS TRƯỞNG CARD */}
              <div style={{ background: '#ffffff', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '4px' }}>
                    TƯ VẤN GIÁM SÁT
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 600 }}>Hạn giao: 1 ngày</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#0f172a' }}>
                  {leadSupervisor.fullName}
                </div>
                <div style={{ fontSize: '0.73rem', color: '#64748b' }}>
                  {leadSupervisor.position} • {leadSupervisor.company}
                </div>
                <div style={{ marginTop: '6px', fontSize: '0.71rem', color: '#059669', fontStyle: 'italic' }}>
                  👉 Sẽ chọn kỹ sư TVGS và ấn định thời hạn phản hồi
                </div>
              </div>

              {/* TRƯỞNG BAN QLDA CARD */}
              <div style={{ background: '#ffffff', border: '1px solid #fed7aa', borderRadius: '8px', padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, background: '#ffedd5', color: '#9a3412', padding: '2px 6px', borderRadius: '4px' }}>
                    BAN QUẢN LÝ DỰ ÁN
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 600 }}>Hạn giao: 1 ngày</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#0f172a' }}>
                  {leadInvestor.fullName}
                </div>
                <div style={{ fontSize: '0.73rem', color: '#64748b' }}>
                  {leadInvestor.position} • {leadInvestor.company}
                </div>
                <div style={{ marginTop: '6px', fontSize: '0.71rem', color: '#d97706', fontStyle: 'italic' }}>
                  👉 Sẽ chọn cán bộ QLDA và ấn định thời hạn phê duyệt
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', background: '#ffffff', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <Clock size={14} color="#ea580c" />
              <span>Nếu sau 1 ngày (24h) chưa chọn cán bộ, hệ thống sẽ tự động gửi thông báo chậm đến Chủ Đầu Tư và Trưởng ban chưa giao việc.</span>
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
              style={{
                background: '#16a34a',
                borderColor: '#15803d',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 600,
                padding: '9px 20px'
              }}
            >
              <Send size={16} />
              <span>{isSubmitting ? 'Đang gửi hồ sơ...' : 'Gửi Hồ Sơ Phê Duyệt'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
