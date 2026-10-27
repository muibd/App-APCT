import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X, Send, Users, Calendar, Clock, FileText, UploadCloud,
  Camera, ImagePlus, Trash2, CheckCircle2, AlertCircle, File, Eye, ChevronRight, CreditCard
} from 'lucide-react';
import { compressImageFile } from '../utils/storageHelper';
import { 
  DEFAULT_PAYMENT_SLA_CONFIGS, 
  calculateDueDate,
  getPaymentLeadSupervisor,
  getPaymentLeadInvestor 
} from '../data/paymentDocumentConstants';
import { uploadPdfDocument } from '../services/storageService';
import { openPdfInNewTab } from '../utils/pdfHelper';

export default function CreatePaymentDocumentModal({
  isOpen,
  onClose,
  users = [],
  currentUser,
  slaConfigs = DEFAULT_PAYMENT_SLA_CONFIGS,
  onSubmitPaymentDocument,
  showAlert
}) {
  if (!isOpen) return null;

  // Tìm Tư vấn giám sát trưởng (Đinh Xuân Thám)
  const leadSupervisor = useMemo(() => getPaymentLeadSupervisor(users), [users]);

  // Tìm Trưởng Ban Quản lý dự án (Ngô Quý Linh)
  const leadInvestor = useMemo(() => getPaymentLeadInvestor(users), [users]);

  // Danh sách loại hồ sơ (lấy từ cấu hình SLA của admin hoặc mặc định: Tạm ứng, Thanh toán, Quyết toán)
  const typeOptions = useMemo(() => {
    return (slaConfigs && slaConfigs.length > 0) ? slaConfigs : DEFAULT_PAYMENT_SLA_CONFIGS;
  }, [slaConfigs]);

  // State form
  const [title, setTitle] = useState('');
  const [selectedTypeCode, setSelectedTypeCode] = useState(typeOptions[0]?.typeCode || 'TAM_UNG');
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

  // Ảnh chụp hiện trường / chứng từ / bản vẽ
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
          caption: file.name ? file.name.replace(/\.[^/.]+$/, '') : 'Chứng từ / Bản vẽ thanh toán',
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

  // Submit tạo hồ sơ thanh toán
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      if (showAlert) showAlert({ type: 'warning', title: 'Thiếu thông tin', message: 'Vui lòng nhập Tên hồ sơ thanh toán!' });
      return;
    }

    setIsSubmitting(true);

    try {
      const slaDays = Number(currentSlaConfig?.slaDays || 3);
      const nowIso = createdAtState.toISOString();
      const assignmentDeadlineIso = new Date(createdAtState.getTime() + 24 * 60 * 60 * 1000).toISOString(); // 1 ngày để 2 Trưởng ban chọn cán bộ
      const dueDateIso = calculateDueDate(nowIso, slaDays).toISOString();
      const docCode = `HSTT-${Date.now().toString().slice(-6)}`;

      // Xử lý lưu trữ PDF: Thử upload Cloud Storage trước nếu có file gốc
      const finalPdfFiles = [];
      for (const pdf of pdfFiles) {
        let cloudUrl = null;
        if (pdf.rawFile) {
          try {
            cloudUrl = await uploadPdfDocument(pdf.rawFile, docCode);
          } catch (uploadErr) {
            console.warn('[CreatePaymentDoc] Upload PDF Cloud Error, dùng dataUrl:', uploadErr);
          }
        }
        finalPdfFiles.push({
          id: pdf.id,
          name: pdf.name,
          size: pdf.size,
          dataUrl: cloudUrl || pdf.dataUrl
        });
      }

      const newPaymentDoc = {
        id: `payment_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        docCode,
        title: title.trim(),
        typeCode: currentSlaConfig?.typeCode || selectedTypeCode,
        typeName: currentSlaConfig?.typeName || 'Hồ sơ thanh toán',
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
        contractorCompany: currentUser?.company || 'Công ty CP Đầu Tư & Xây Dựng An Phú Gia',
        
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
            actorUid: currentUser?.uid || 'unknown',
            actorName: currentUser?.fullName || 'ĐVTC',
            actorRole: currentUser?.role || 'CONTRACTOR',
            timestamp: nowIso,
            note: 'Tạo mới hồ sơ thanh toán, chuyển tự động đến TVGS Trưởng & Trưởng Ban QLDA để giao nhiệm vụ.'
          }
        ]
      };

      if (onSubmitPaymentDocument) {
        await onSubmitPaymentDocument(newPaymentDoc);
      }

      if (showAlert) {
        showAlert({
          type: 'success',
          title: 'Tạo hồ sơ thành công',
          message: `Hồ sơ "${title}" (${docCode}) đã được gửi đến TVGS Trưởng và Trưởng Ban QLDA!`
        });
      }

      onClose();
    } catch (err) {
      console.error('Lỗi tạo hồ sơ thanh toán:', err);
      if (showAlert) {
        showAlert({
          type: 'error',
          title: 'Lỗi tạo hồ sơ',
          message: 'Không thể tạo hồ sơ thanh toán: ' + (err.message || err)
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '820px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        animation: 'fadeIn 0.2s ease-out'
      }}>

        {/* 1. MODAL HEADER */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(to right, #f8fafc, #ffffff)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669'
            }}>
              <CreditCard size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 700, color: '#0f172a' }}>
                Tạo Hồ Sơ Thanh Toán
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                Trình duyệt hồ sơ tạm ứng, thanh toán đợt & quyết toán công trình
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: '#f1f5f9',
              borderRadius: '8px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b',
              transition: 'all 0.15s ease'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 2. MODAL BODY (SCROLLABLE) */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <form id="create-payment-doc-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* THÔNG TIN CHUNG: TÊN HỒ SƠ & THỜI ĐIỂM */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              
              {/* TÊN HỒ SƠ */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                  Tên hồ sơ <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Đề nghị thanh toán đợt 3 hạng mục kết cấu thân Block B..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* NGÀY GIỜ TẠO (TỰ ĐỘNG) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                  Ngày giờ tạo
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#475569',
                  fontSize: '0.88rem'
                }}>
                  <Clock size={16} color="#0284c7" />
                  <span>{formattedDateTime}</span>
                </div>
              </div>

            </div>

            {/* LOẠI HỒ SƠ THANH TOÁN (3 LOẠI: TẠM ỨNG, THANH TOÁN, QUYẾT TOÁN) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                Loại hồ sơ <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={selectedTypeCode}
                onChange={(e) => setSelectedTypeCode(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none',
                  background: '#ffffff',
                  color: '#1e293b',
                  cursor: 'pointer',
                  boxSizing: 'border-box'
                }}
              >
                {typeOptions.map(opt => (
                  <option key={opt.typeCode || opt.id} value={opt.typeCode}>
                    {opt.typeName}
                  </option>
                ))}
              </select>
            </div>

            {/* TỆP ĐÍNH KÈM: PDF & HÌNH ẢNH */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              
              {/* 1. TỆP PDF HỒ SƠ (CHỌN NHIỀU FILE) */}
              <div style={{
                background: '#f8fafc',
                border: '1.5px dashed #cbd5e1',
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={16} color="#dc2626" />
                    <span>Tệp PDF Hồ Sơ ({pdfFiles.length})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => pdfInputRef.current?.click()}
                    style={{
                      border: '1px solid #bfdbfe',
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <UploadCloud size={14} /> + Thêm PDF
                  </button>
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handlePdfUpload}
                  />
                </div>

                {pdfFiles.length === 0 ? (
                  <div
                    onClick={() => pdfInputRef.current?.click()}
                    style={{
                      border: '1px dashed #94a3b8',
                      borderRadius: '8px',
                      padding: '20px 12px',
                      textAlign: 'center',
                      background: '#ffffff',
                      cursor: 'pointer'
                    }}
                  >
                    <UploadCloud size={24} color="#0284c7" style={{ margin: '0 auto 6px auto' }} />
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                      Tải lên file PDF (có thể chọn nhiều tệp)
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Dung lượng tối đa 25MB</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                    {pdfFiles.map((pdf, idx) => (
                      <div
                        key={pdf.id || idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: '#ffffff',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                          <FileText size={16} color="#dc2626" style={{ flexShrink: 0 }} />
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {pdf.name}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{pdf.size}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => openPdfInNewTab(pdf.dataUrl, pdf.name)}
                            title="Xem trước PDF"
                            style={{ border: 'none', background: 'transparent', color: '#0284c7', cursor: 'pointer', padding: '4px' }}
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePdf(pdf.id)}
                            title="Xóa tệp PDF"
                            style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. ẢNH CHỨNG TỪ / BẢN VẼ / HIỆN TRƯỜNG */}
              <div style={{
                background: '#f8fafc',
                border: '1.5px dashed #cbd5e1',
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#334155' }}>
                    Ảnh chứng từ & hiện trường ({photos.length})
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      style={{
                        border: '1px solid #bbf7d0',
                        background: '#f0fdf4',
                        color: '#15803d',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Camera size={13} /> Chụp
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        border: '1px solid #bfdbfe',
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <ImagePlus size={13} /> Thêm ảnh
                    </button>
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
                  </div>
                </div>

                {photos.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '16px 8px', color: '#94a3b8', fontSize: '0.8rem' }}>
                    Chưa có ảnh chứng từ đính kèm (có thể bấm chụp hoặc tải ảnh)
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '10px', maxHeight: '180px', overflowY: 'auto' }}>
                    {photos.map(photo => (
                      <div key={photo.id} style={{ position: 'relative', borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                        <img src={photo.url} alt="Bản vẽ" style={{ width: '100%', height: '70px', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => handleDeletePhoto(photo.id)}
                          style={{
                            position: 'absolute',
                            top: '3px',
                            right: '3px',
                            background: 'rgba(239, 68, 68, 0.85)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* QUY TRÌNH TIẾP NHẬN & PHÂN CÔNG TỰ ĐỘNG (1 NGÀY ĐỂ 2 TRƯỞNG BAN CHỌN CÁN BỘ) */}
            <div style={{
              background: '#f0fdf4',
              border: '1.5px solid #bbf7d0',
              borderRadius: '10px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px' }}>
                <Users size={18} />
                <span>Quy trình tiếp nhận & phân công tự động (Hạn xử lý: 1 ngày)</span>
              </div>
              <p style={{ margin: '0 0 12px 0', fontSize: '0.82rem', color: '#15803d', lineHeight: 1.4 }}>
                Hồ sơ thanh toán sau khi tạo sẽ được <strong>gửi mặc định</strong> đến 2 vị trí Trưởng ban để xem xét và giao nhiệm vụ cho cán bộ chuyên môn trực tiếp thụ lý:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                
                {/* TVGS TRƯỞNG */}
                <div style={{ background: '#ffffff', border: '1px solid #dcfce7', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534', background: '#dcfce7', padding: '2px 8px', borderRadius: '4px' }}>
                      TƯ VẤN GIÁM SÁT
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 600 }}>Hạn giao: 1 ngày</span>
                  </div>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>
                    {leadSupervisor.fullName}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                    {leadSupervisor.position} • {leadSupervisor.company}
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '0.72rem', color: '#0284c7', fontStyle: 'italic' }}>
                    👉 Sẽ chọn kỹ sư TVGS và ấn định thời hạn phản hồi
                  </div>
                </div>

                {/* TRƯỞNG BAN QLDA */}
                <div style={{ background: '#ffffff', border: '1px solid #ffedd5', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c2410c', background: '#ffedd5', padding: '2px 8px', borderRadius: '4px' }}>
                      BAN QUẢN LÝ DỰ ÁN
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 600 }}>Hạn giao: 1 ngày</span>
                  </div>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>
                    {leadInvestor.fullName}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                    {leadInvestor.position} • {leadInvestor.company}
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '0.72rem', color: '#c2410c', fontStyle: 'italic' }}>
                    👉 Sẽ chọn cán bộ QLDA và ấn định thời hạn phê duyệt
                  </div>
                </div>

              </div>

              <div style={{ marginTop: '10px', fontSize: '0.76rem', color: '#b45309', background: '#fffbeb', border: '1px solid #fef3c7', padding: '8px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} />
                <span>Nếu sau 1 ngày (24h) chưa chọn cán bộ, hệ thống sẽ tự động gửi thông báo chậm đến Chủ Đầu Tư và Trưởng ban chưa giao việc.</span>
              </div>
            </div>

            {/* NỘI DUNG / GHI CHÚ KỸ THUẬT */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                Nội dung / Ghi chú thanh toán
              </label>
              <textarea
                rows={3}
                placeholder="Nhập diễn giải khối lượng thanh toán, căn cứ nghiệm thu, giá trị tạm ứng/thanh toán..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

          </form>
        </div>

        {/* 3. MODAL FOOTER */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '12px',
          background: '#f8fafc'
        }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              padding: '10px 18px',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              background: '#ffffff',
              color: '#475569',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: isSubmitting ? 'not-allowed' : 'pointer'
            }}
          >
            Hủy bỏ
          </button>

          <button
            type="submit"
            form="create-payment-doc-form"
            disabled={isSubmitting}
            style={{
              padding: '10px 24px',
              border: 'none',
              borderRadius: '8px',
              background: isSubmitting ? '#94a3b8' : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
            }}
          >
            {isSubmitting ? (
              <span>Đang gửi hồ sơ...</span>
            ) : (
              <>
                <Send size={16} />
                <span>Gửi Hồ Sơ</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
