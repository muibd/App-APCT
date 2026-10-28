import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Award, Send, Users, Calendar, MapPin, CheckSquare, Square, 
  Building, Camera, ImagePlus, Trash2, Clock, ShieldCheck, FileText, CheckCircle2,
  FileCheck, BookOpen, Layers
} from 'lucide-react';
import { MOCK_PROJECT, MOCK_USERS, getContractorChief } from '../data/mockData';
import { compressImageFile } from '../utils/storageHelper';

export default function CreateCompletionReportModal({ 
  isOpen, 
  onClose, 
  currentUser, 
  users = [], 
  onSubmitCompletionReport, 
  showAlert 
}) {
  if (!isOpen) return null;

  // 1. Tự động xác định Tư Vấn Giám Sát Trưởng và Chủ Đầu Tư Trưởng
  const leadSupervisor = users.find(u => 
    u.role === 'LEAD_SUPERVISOR' || 
    (u.role === 'SUPERVISOR' && (u.position || '').toLowerCase().includes('trưởng'))
  ) || users.find(u => u.uid === 'uid_tvgs_01') || MOCK_USERS.find(u => u.uid === 'uid_tvgs_01');

  const leadInvestor = users.find(u => 
    u.role === 'LEAD_INVESTOR' || 
    (u.role === 'INVESTOR' && (u.position || '').toLowerCase().includes('trưởng'))
  ) || users.find(u => u.uid === 'uid_cdt_01') || MOCK_USERS.find(u => u.uid === 'uid_cdt_01');

  // Phụ tá / cán bộ giám sát đi cùng
  const officerSupervisor = users.find(u => u.role === 'SUPERVISOR' && u.uid !== leadSupervisor?.uid) || {
    fullName: 'Đỗ Văn Trường',
    position: 'Cán bộ TVGS',
    company: 'Công ty CP Tư vấn Xây dựng và Thương mại GELICON'
  };

  const officerInvestor = users.find(u => u.role === 'INVESTOR' && u.uid !== leadInvestor?.uid) || {
    fullName: 'Nguyễn Thành Trung',
    position: 'Cán bộ Ban QLDA',
    company: 'Công ty TNHH An Phú Cần Thơ'
  };

  // 2. State chọn mẫu biên bản hoàn thành (Theo đúng 3 mẫu của người dùng)
  // 'PROJECT_USE': Mẫu 1 (Ảnh 1-2): Nghiệm thu hoàn thành hạng mục / công trình đưa vào sử dụng (Ký 4 bên: CĐT, TVTK, TVGS, ĐVTC)
  // 'STAGE': Mẫu 2 (Ảnh 3-4): Nghiệm thu hoàn thành giai đoạn thi công (Ký 3 bên: CĐT, TVGS, ĐVTC)
  // 'DOSSIER': Mẫu 3 (Ảnh 5): Kiểm tra hồ sơ nghiệm thu chất lượng hoàn thành giai đoạn thi công (Ký 3 bên: CĐT, TVGS, ĐVTC)
  const [completionType, setCompletionType] = useState('STAGE');
  const [contractorCompany, setContractorCompany] = useState(() => currentUser?.company || 'Công ty TNHH Gia Huy Vĩnh Phúc');

  useEffect(() => {
    if (currentUser?.company) {
      setContractorCompany(currentUser.company);
    }
  }, [currentUser?.company]);

  const availableContractorCompanies = Array.from(new Set([
    'Công ty TNHH Gia Huy Vĩnh Phúc',
    'Công ty TNHH Phát Triển Xây Dựng Phan Lê',
    'Công ty TNHH Tư vấn Thiết kế Bình Hoà',
    ...(users || []).filter(u => u.role === 'CONTRACTOR').map(u => u.company).filter(Boolean),
    currentUser?.company
  ].filter(Boolean)));

  // Thông tin chung
  const [buildingName, setBuildingName] = useState(MOCK_PROJECT.buildings[0]?.name || 'Chung cư nhà ở xã hội 2');
  const [itemName, setItemName] = useState('Thi công phần kết cấu – Tòa A và Tòa B');
  const [reportNumber, setReportNumber] = useState('02/BBNT-GDTC');
  const [referenceDocNumber, setReferenceDocNumber] = useState('TLCC-02/2026/APCT');
  const [scheduledDate, setScheduledDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('08h30');
  const [endTime, setEndTime] = useState('11h00');
  const [place, setPlace] = useState('Hiện trường Tòa A và Tòa B - Chung cư nhà ở xã hội 2');

  // Đối tượng nghiệm thu / kiểm tra
  const [inspectionObject, setInspectionObject] = useState('Nghiệm thu hoàn thành giai đoạn thi công: Phần kết cấu dầm sàn từ Tầng 1 đến Tầng 5 Tòa A và Tòa B');

  // Căn cứ pháp lý & hồ sơ
  const [contractNumber, setContractNumber] = useState('0203/HĐXD/APCT-GHVP ký ngày 02 tháng 03 năm 2026');
  const [designApprovedDate, setDesignApprovedDate] = useState('15/01/2026');
  const [designChanges, setDesignChanges] = useState('Được sự chấp thuận của CĐT và TVTK tại biên bản xử lý hiện trường số 01/BB-XLHT');
  const [authorityApprovals, setAuthorityApprovals] = useState('Biên bản nghiệm thu PCCC số 128/PCCC-CT của Cảnh sát PCCC TP. Cần Thơ; Báo cáo quan trắc môi trường đạt chuẩn');

  // Trường riêng cho Mẫu 2 (Giai đoạn thi công)
  const [stageName, setStageName] = useState('Phần kết cấu dầm sàn từ Tầng 1 đến Tầng 5 Tòa A và Tòa B');
  const [paymentBatch, setPaymentBatch] = useState('02');
  const [mainMaterials, setMainMaterials] = useState('Bê tông thương phẩm mác M300, M350; Cốt thép CB400-V, CB500-V Hòa Phát; Xi măng Insee; Cốp pha định hình phủ phim.');

  // Trường riêng cho Mẫu 1 (Tư vấn thiết kế - Ký bên thứ 4)
  const [designerCompany, setDesignerCompany] = useState('Công ty CP Tư vấn Thiết kế Xây dựng APCT');
  const [designerLeadName, setDesignerLeadName] = useState('KTS. Lê Quang Thiết Kế');
  const [designerLeadPosition, setDesignerLeadPosition] = useState('Giám đốc thiết kế');
  const [designerOfficerName, setDesignerOfficerName] = useState('KTS. Trần Văn Vẽ');
  const [designerOfficerPosition, setDesignerOfficerPosition] = useState('Chủ trì kiến trúc');

  // Tiêu chuẩn áp dụng
  const [standardsApplied, setStandardsApplied] = useState([
    'TCVN 4453:1995: Kết cấu bê tông và bê tông cốt thép toàn khối - Quy phạm thi công và nghiệm thu',
    'TCVN 5637:1991: Quản lý chất lượng xây lắp công trình xây dựng - Nguyên tắc cơ bản',
    'QCVN 18:2021/BXD: Quy chuẩn kỹ thuật quốc gia về An toàn trong thi công xây dựng',
    'TCVN 9398:2012: Công tác trắc địa trong xây dựng công trình - Yêu cầu chung'
  ]);

  // Ảnh hiện trường / hồ sơ
  const [evidencePhotos, setEvidencePhotos] = useState([]);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Xử lý chuyển đổi giữa 3 mẫu
  const handleSelectCompletionType = (type) => {
    setCompletionType(type);
    if (type === 'PROJECT_USE') {
      setReportNumber('01/BBNT-HTCT');
      setReferenceDocNumber('TLCC-01/2026/APCT');
      setInspectionObject(`Nghiệm thu hoàn thành hạng mục công trình đưa vào sử dụng: Toàn bộ hạng mục Kết cấu và Hoàn thiện ${buildingName}`);
    } else if (type === 'DOSSIER') {
      setReportNumber('01/BBKT-HSHNT');
      setReferenceDocNumber('TLCC-03/2026/APCT');
      setInspectionObject(`Kiểm tra hồ sơ nghiệm thu chất lượng giai đoạn thi công xây dựng hoàn thành phần kết cấu dầm sàn ${buildingName}`);
    } else {
      setReportNumber('02/BBNT-GDTC');
      setReferenceDocNumber('TLCC-02/2026/APCT');
      setInspectionObject(`Nghiệm thu hoàn thành giai đoạn thi công: ${stageName}`);
    }
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      const compressedUrl = await compressImageFile(file, 1200, 0.8);
      const timeStr = `${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')} ${new Date().toLocaleDateString('vi-VN')}`;
      const newPhoto = {
        id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        url: compressedUrl,
        caption: file.name ? `Minh chứng hoàn thành: ${file.name.replace(/\.[^/.]+$/, '')}` : 'Hiện trường hoàn thành',
        gps: '10.0076° N, 105.7823° E (P. Thường Thạnh, TP. Cần Thơ)',
        time: timeStr,
        photographer: `${currentUser?.fullName || 'Chỉ huy trưởng'} (ĐVTC)`
      };
      setEvidencePhotos(prev => [...prev, newPhoto]);
    }
    e.target.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!inspectionObject.trim()) {
      if (showAlert) {
        showAlert({
          type: 'warning',
          title: 'Thiếu Đối Tượng Nghiệm Thu',
          message: 'Vui lòng nhập đối tượng nghiệm thu hoàn thành!'
        });
      } else {
        alert('Vui lòng nhập đối tượng nghiệm thu hoàn thành!');
      }
      return;
    }

    const dateParts = scheduledDate.split('-');
    const cityDate = `Cần Thơ, Ngày ${dateParts[2]} tháng ${dateParts[1]} năm ${dateParts[0]}`;

    const newReport = {
      id: `comp_${Date.now()}`,
      completionType,
      reportNumber,
      referenceDocNumber,
      date: scheduledDate,
      cityDate,
      projectName: MOCK_PROJECT.projectName,
      buildingName,
      itemName,
      location: MOCK_PROJECT.location,
      inspectionObject,
      contractNumber,
      designApprovedDate,
      designChanges,
      authorityApprovals,
      stageName: completionType === 'STAGE' || completionType === 'DOSSIER' ? stageName : null,
      paymentBatch: completionType === 'STAGE' ? paymentBatch : null,
      mainMaterials: completionType === 'STAGE' ? mainMaterials : null,
      standardsApplied,
      time: {
        startTime: `${startTime}, ngày ${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`,
        endTime: `${endTime}, ngày ${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`,
        place
      },
      representatives: {
        investor: {
          company: leadInvestor?.company || 'Công ty TNHH An Phú Cần Thơ',
          leadName: leadInvestor?.fullName || 'Ngô Quý Linh',
          leadPosition: leadInvestor?.position || 'Trưởng Ban QLDA',
          officerName: officerInvestor?.fullName || 'Nguyễn Thành Trung',
          officerPosition: officerInvestor?.position || 'Cán bộ Ban QLDA',
          uid: leadInvestor?.uid || 'uid_cdt_01'
        },
        supervisor: {
          company: leadSupervisor?.company || 'Công ty CP Tư vấn Xây dựng và Thương mại GELICON',
          leadName: leadSupervisor?.fullName || 'Đinh Xuân Thám',
          leadPosition: leadSupervisor?.position || 'Tư vấn giám sát trưởng',
          officerName: officerSupervisor?.fullName || 'Đỗ Văn Trường',
          officerPosition: officerSupervisor?.position || 'Cán bộ TVGS',
          uid: leadSupervisor?.uid || 'uid_tvgs_01'
        },
        contractor: {
          company: contractorCompany.trim() || currentUser?.company || 'Công ty TNHH Gia Huy Vĩnh Phúc',
          leadName: getContractorChief(contractorCompany || currentUser?.company, users).fullName,
          leadPosition: 'Chỉ huy trưởng',
          officerName: currentUser?.fullName || 'Nguyễn Hoàng Bách',
          officerPosition: currentUser?.position || 'Kỹ thuật hiện trường',
          uid: currentUser?.uid || 'uid_dvtc_apg_01'
        },
        ...(completionType === 'PROJECT_USE' ? {
          designer: {
            company: designerCompany,
            leadName: designerLeadName,
            leadPosition: designerLeadPosition,
            officerName: designerOfficerName,
            officerPosition: designerOfficerPosition
          }
        } : {})
      },
      status: 'PENDING_APPROVAL',
      signatures: {
        contractor: {
          signed: true,
          name: currentUser?.fullName || 'Phạm Thanh Nhàn',
          position: currentUser?.position || 'Chỉ huy trưởng',
          signedAt: new Date().toISOString()
        },
        supervisor: {
          signed: false,
          name: leadSupervisor?.fullName || 'Đinh Xuân Thám',
          position: leadSupervisor?.position || 'Tư vấn giám sát trưởng',
          signedAt: null
        },
        investor: {
          signed: false,
          name: leadInvestor?.fullName || 'Ngô Quý Linh',
          position: leadInvestor?.position || 'Trưởng Ban QLDA',
          signedAt: null
        },
        ...(completionType === 'PROJECT_USE' ? {
          designer: {
            signed: true,
            name: designerLeadName,
            position: designerLeadPosition,
            signedAt: new Date().toISOString()
          }
        } : {})
      },
      evidencePhotos,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdByUid: currentUser?.uid || 'uid_dvtc_apg_01',
      createdByName: currentUser?.fullName || 'Phạm Thanh Nhàn'
    };

    onSubmitCompletionReport(newReport);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '880px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* HEADER */}
        <div className="modal-header" style={{ background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', color: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '8px', borderRadius: '10px' }}>
              <Award size={22} color="#fde047" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#ffffff', fontWeight: 800 }}>
                Lập Biên Bản Nghiệm Thu Hoàn Thành
              </h3>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} style={{ color: '#ffffff' }}>
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <form onSubmit={handleSubmit} className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          
          {/* CHỌN MẪU BIÊN BẢN */}
          <div style={{ marginBottom: '18px' }}>
            <label className="form-label" style={{ fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase', fontSize: '0.84rem', marginBottom: '8px', display: 'block' }}>
              1. Chọn Loại Mẫu Biên Bản Nghiệm Thu Hoàn Thành:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              
              {/* Mẫu 1: Hoàn thành hạng mục / công trình đưa vào sử dụng */}
              <div
                onClick={() => handleSelectCompletionType('PROJECT_USE')}
                style={{
                  border: completionType === 'PROJECT_USE' ? '2.5px solid #2563eb' : '1.5px solid #e2e8f0',
                  background: completionType === 'PROJECT_USE' ? '#eff6ff' : '#ffffff',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  cursor: 'pointer',
                  boxShadow: completionType === 'PROJECT_USE' ? '0 4px 12px rgba(37,99,235,0.12)' : 'none',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {completionType === 'PROJECT_USE' && (
                  <span style={{ position: 'absolute', top: '10px', right: '10px', color: '#2563eb' }}>
                    <CheckCircle2 size={16} />
                  </span>
                )}
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: completionType === 'PROJECT_USE' ? '#1d4ed8' : '#0f172a', paddingRight: '20px' }}>
                  🏛️ Mẫu 1: Hoàn Thành Hạng Mục / Công Trình Đưa Vào Sử Dụng
                </div>
              </div>

              {/* Mẫu 2: Hoàn thành giai đoạn thi công */}
              <div
                onClick={() => handleSelectCompletionType('STAGE')}
                style={{
                  border: completionType === 'STAGE' ? '2.5px solid #059669' : '1.5px solid #e2e8f0',
                  background: completionType === 'STAGE' ? '#ecfdf5' : '#ffffff',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  cursor: 'pointer',
                  boxShadow: completionType === 'STAGE' ? '0 4px 12px rgba(5,150,105,0.12)' : 'none',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {completionType === 'STAGE' && (
                  <span style={{ position: 'absolute', top: '10px', right: '10px', color: '#059669' }}>
                    <CheckCircle2 size={16} />
                  </span>
                )}
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: completionType === 'STAGE' ? '#047857' : '#0f172a', paddingRight: '20px' }}>
                  📑 Mẫu 2: Hoàn Thành Giai Đoạn Thi Công Xây Dựng
                </div>
              </div>
            </div>
          </div>

          {/* THÔNG TIN DỰ ÁN & SỐ HIỆU BIÊN BẢN */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '12px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Mã số biên bản:</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={reportNumber} 
                  onChange={(e) => setReportNumber(e.target.value)} 
                  required 
                  style={{ fontWeight: 700, color: '#1e3a8a' }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Số tài liệu căn cứ:</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={referenceDocNumber} 
                  onChange={(e) => setReferenceDocNumber(e.target.value)} 
                  placeholder="TLCC-01/2026/APCT"
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Công trình / Khối nhà:</label>
                <select 
                  className="form-select" 
                  value={buildingName} 
                  onChange={(e) => setBuildingName(e.target.value)}
                >
                  {MOCK_PROJECT.buildings.map(b => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Hạng mục công trình:</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={itemName} 
                  onChange={(e) => setItemName(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Đơn vị thi công lập biên bản:</span>
                  <span style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 500 }}>✏️ Có thể sửa</span>
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  list="completion-contractor-companies"
                  value={contractorCompany} 
                  onChange={(e) => setContractorCompany(e.target.value)} 
                  placeholder="Nhập tên Đơn vị thi công..."
                  required 
                  style={{ fontWeight: 600, color: '#0f172a' }}
                />
                <datalist id="completion-contractor-companies">
                  {availableContractorCompanies.map((c, i) => (
                    <option key={i} value={c} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* ĐỐI TƯỢNG NGHIỆM THU / KIỂM TRA */}
          <div className="form-group" style={{ marginBottom: '18px' }}>
            <label className="form-label" style={{ fontWeight: 800, color: '#1e3a8a' }}>
              Đối tượng nghiệm thu hoàn thành:
            </label>
            <textarea
              className="form-textarea"
              rows={2}
              value={inspectionObject}
              onChange={(e) => setInspectionObject(e.target.value)}
              placeholder="Nhập đối tượng nghiệm thu hoặc kiểm tra..."
              style={{ fontWeight: 600, color: '#0f172a' }}
              required
            />
          </div>

          {/* CÁC TRƯỜNG ĐẶC THÙ RIÊNG TỪNG MẪU */}
          {completionType === 'STAGE' && (
            <div style={{ background: '#ecfdf5', border: '1.5px solid #a7f3d0', borderRadius: '12px', padding: '16px', marginBottom: '18px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#065f46', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileCheck size={16} />
                <span>Nội Dung Nghiệm Thu Giai Đoạn Thi Công (Mẫu 2)</span>
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '10px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Tên giai đoạn hoàn thành:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={stageName}
                    onChange={(e) => setStageName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Đợt thanh toán số:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={paymentBatch}
                    onChange={(e) => setPaymentBatch(e.target.value)}
                    placeholder="02"
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Hợp đồng xây dựng số:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={contractNumber}
                    onChange={(e) => setContractNumber(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Các vật liệu chính sử dụng thi công (Mục 4.2):</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={mainMaterials}
                  onChange={(e) => setMainMaterials(e.target.value)}
                />
              </div>
            </div>
          )}

          {completionType === 'PROJECT_USE' && (
            <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: '12px', padding: '16px', marginBottom: '18px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building size={16} />
                <span>Thông Tin Đơn Vị Tư Vấn Thiết Kế</span>
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Tên đơn vị thiết kế:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={designerCompany}
                    onChange={(e) => setDesignerCompany(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Đại diện lãnh đạo thiết kế:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={designerLeadName}
                    onChange={(e) => setDesignerLeadName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Chức vụ:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={designerLeadPosition}
                    onChange={(e) => setDesignerLeadPosition(e.target.value)}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Hồ sơ TKBVTC đã được CĐT duyệt ngày:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={designApprovedDate}
                    onChange={(e) => setDesignApprovedDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Văn bản chấp thuận PCCC & Môi trường:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={authorityApprovals}
                    onChange={(e) => setAuthorityApprovals(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}


          {/* THỜI GIAN NGHIỆM THU / KIỂM TRA */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '18px' }}>
            <label className="form-label" style={{ fontWeight: 800, color: '#1e3a8a', marginBottom: '10px' }}>
              Thời Gian & Địa Điểm Nghiệm Thu:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Ngày thực hiện:</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={scheduledDate} 
                  onChange={(e) => setScheduledDate(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Giờ bắt đầu:</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={startTime} 
                  onChange={(e) => setStartTime(e.target.value)} 
                  placeholder="08h30"
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Giờ kết thúc:</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={endTime} 
                  onChange={(e) => setEndTime(e.target.value)} 
                  placeholder="11h00"
                />
              </div>
            </div>
          </div>

          {/* TIÊU CHUẨN XÂY DỰNG ÁP DỤNG */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '18px' }}>
            <label className="form-label" style={{ fontWeight: 800, color: '#1e3a8a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={16} />
              <span>Tiêu Chuẩn, Quy Chuẩn Áp Dụng (TCVN / QCVN):</span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {standardsApplied.map((std, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', color: '#1e293b' }}>
                  <CheckSquare size={16} color="#059669" />
                  <span>{std}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ẢNH HIỆN TRƯỜNG & HỒ SƠ MINH CHỨNG */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={18} color="#2563eb" />
                <strong style={{ fontSize: '0.92rem', color: '#1e293b' }}>
                  Ảnh Hiện Trường & Minh Chứng Hồ Sơ ({evidencePhotos.length} ảnh)
                </strong>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
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
                  className="btn-primary" 
                  style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#2563eb' }}
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera size={14} />
                  <span>Chụp ảnh</span>
                </button>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus size={14} />
                  <span>Tải ảnh lên</span>
                </button>
              </div>
            </div>

            {evidencePhotos.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', marginTop: '10px' }}>
                {evidencePhotos.map(photo => (
                  <div key={photo.id} style={{ position: 'relative', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                    <img src={photo.url} alt="Minh chứng" style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                    <button 
                      type="button"
                      onClick={() => setEvidencePhotos(prev => prev.filter(p => p.id !== photo.id))}
                      style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* FOOTER ACTIONS */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={onClose}
              style={{ padding: '10px 20px', borderRadius: '10px', fontWeight: 600 }}
            >
              Hủy Bỏ
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              style={{ 
                padding: '10px 24px', 
                borderRadius: '10px', 
                fontWeight: 700, 
                background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Send size={18} />
              <span>Ký Số & Phát Hành Biên Bản Hoàn Thành</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
