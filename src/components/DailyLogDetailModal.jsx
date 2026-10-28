import React, { useState, useEffect } from 'react';
import { 
  X, Printer, CheckCircle2, ShieldCheck, Sun, CloudRain, Clock, 
  Users, Wrench, AlertCircle, Camera, Check, FileSpreadsheet, Eye, PenTool
} from 'lucide-react';
import { getContractorChief } from '../data/mockData';

export default function DailyLogDetailModal({
  isOpen,
  onClose,
  log: rawLog,
  dailyLog,
  currentUser,
  currentRole,
  onConfirmLog: rawOnConfirmLog,
  onConfirmDailyLog,
  showAlert
}) {
  const log = rawLog || dailyLog;
  const onConfirmLog = onConfirmDailyLog || rawOnConfirmLog;
  if (!isOpen || !log) return null;

  const isConfirmed = log.status === 'CONFIRMED';
  const isSupervisorRole = currentRole === 'SUPERVISOR' || currentRole === 'LEAD_SUPERVISOR';
  const isAdmin = currentRole === 'ADMIN';
  const canConfirm = !isConfirmed && isSupervisorRole && !isAdmin;

  // State cho form xác nhận của TVGS (Mục 5, 6, 7)
  const [isConfirming, setIsConfirming] = useState(false);
  const [supervisorCommentsInput, setSupervisorCommentsInput] = useState(
    log.supervisorComments || ''
  );
  const [investorCommentsInput, setInvestorCommentsInput] = useState(
    log.investorComments || ''
  );
  const [contractorCommentsInput, setContractorCommentsInput] = useState(
    log.contractorComments || ''
  );

  useEffect(() => {
    if (log) {
      setSupervisorCommentsInput(log.supervisorComments || '');
      setInvestorCommentsInput(log.investorComments || '');
      setContractorCommentsInput(log.contractorComments || '');
    }
  }, [log?.id]);

  const handlePrint = () => {
    // 1. Tạm gỡ class modal-open để layout trang web mở khóa hoàn toàn cho print engine
    document.body.classList.remove('modal-open');
    document.documentElement.classList.remove('modal-open');

    const executePrint = () => {
      window.print();

      // Sau khi đóng hộp thoại in thì phục hồi lại class modal-open nếu modal vẫn mở
      setTimeout(() => {
        if (document.querySelector('.modal-overlay')) {
          document.body.classList.add('modal-open');
          document.documentElement.classList.add('modal-open');
        }
      }, 400);
    };

    setTimeout(executePrint, 100);
  };

  const handleConfirmSubmit = (e) => {
    e.preventDefault();

    if (!supervisorCommentsInput.trim()) {
      if (showAlert) {
        showAlert({
          type: 'warning',
          title: 'Thiếu Nhận Xét TVGS',
          message: 'Vui lòng nhập nhận xét và yêu cầu của Cán bộ Giám sát thi công (Mục 5)!'
        });
      } else {
        alert('Vui lòng nhập nhận xét của Cán bộ Giám sát thi công tại Mục 5!');
      }
      return;
    }

    if (!investorCommentsInput.trim()) {
      if (showAlert) {
        showAlert({
          type: 'warning',
          title: 'Thiếu Nhận Xét CĐT',
          message: 'Vui lòng nhập nhận xét và yêu cầu của Chủ đầu tư (Mục 6)!'
        });
      } else {
        alert('Vui lòng nhập nhận xét của Chủ đầu tư tại Mục 6!');
      }
      return;
    }

    if (!contractorCommentsInput.trim()) {
      if (showAlert) {
        showAlert({
          type: 'warning',
          title: 'Thiếu Ý Kiến ĐVTC',
          message: 'Vui lòng nhập ý kiến của Nhà thầu thi công xây dựng (Mục 7)!'
        });
      } else {
        alert('Vui lòng nhập ý kiến của Nhà thầu thi công xây dựng tại Mục 7!');
      }
      return;
    }

    const updatedLog = {
      ...log,
      status: 'CONFIRMED',
      supervisorComments: supervisorCommentsInput.trim(),
      investorComments: investorCommentsInput.trim(),
      contractorComments: contractorCommentsInput.trim(),
      signatures: {
        ...log.signatures,
        supervisor: {
          signed: true,
          name: currentUser?.fullName || log.assignedSupervisor?.name || log.representatives?.supervisor?.representative || 'Đinh Xuân Thám',
          position: currentUser?.position || 'Tư vấn giám sát trưởng',
          signedAt: new Date().toISOString()
        },
        investor: {
          signed: true,
          name: 'Ngô Quý Linh',
          position: 'Trưởng Ban QLDA',
          signedAt: new Date().toISOString()
        }
      },
      updatedAt: new Date().toISOString()
    };

    onConfirmLog(updatedLog);
    setIsConfirming(false);

    if (showAlert) {
      showAlert({
        type: 'success',
        title: 'Đã Ký Xác Nhận Nhật Ký',
        message: 'TVGS đã ký duyệt và CĐT đã đồng thời xác nhận nhật ký thi công thành công!'
      });
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '900px', maxHeight: '94vh', padding: 0 }}>
        
        {/* MODAL TOP BAR (KHÔNG IN) */}
        <div className="no-print" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          background: '#0f172a',
          color: '#ffffff',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 700 }}>
              📜 {log.logNumber} - Nhật Ký Thi Công
            </span>
            {isConfirmed ? (
              <span style={{
                background: '#059669',
                color: '#ffffff',
                fontSize: '0.74rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <CheckCircle2 size={12} /> Đã Xác Nhận 3 Bên
              </span>
            ) : (
              <span style={{
                background: '#d97706',
                color: '#ffffff',
                fontSize: '0.74rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Clock size={12} /> Chờ TVGS Xác Nhận
              </span>
            )}

            {isAdmin && (
              <span style={{
                background: '#7e22ce',
                color: '#ffffff',
                fontSize: '0.74rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <ShieldCheck size={12} /> Admin (Chỉ xem)
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {canConfirm && !isConfirming && (
              <button
                type="button"
                className="btn-primary"
                onClick={() => setIsConfirming(true)}
                style={{
                  background: '#16a34a',
                  borderColor: '#16a34a',
                  padding: '6px 14px',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 700
                }}
              >
                <PenTool size={14} />
                <span>✍️ Xác Nhận & Ký Nhật Ký</span>
              </button>
            )}

            <button
              type="button"
              className="btn-secondary"
              onClick={handlePrint}
              style={{
                background: '#334155',
                borderColor: '#475569',
                color: '#ffffff',
                padding: '6px 12px',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="In Nhật Ký Thi Công Khổ A4"
            >
              <Printer size={15} />
              <span>In A4</span>
            </button>

            <button
              type="button"
              className="modal-close-btn"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* NỘI DUNG VĂN BẢN KHỔ A4 (THEO MẪU 1. NHAT KY THI CONG.DOC) */}
        <div className="modal-body document-paper daily-log-paper report-print-sheet" style={{
          padding: '28px 36px',
          background: '#ffffff',
          overflowY: 'auto',
          maxHeight: 'calc(94vh - 60px)',
          fontFamily: '"Times New Roman", Times, serif',
          color: '#000000',
          lineHeight: 1.5,
          fontSize: '0.96rem'
        }}>
          
          {/* BANNER THÔNG BÁO XÁC NHẬN CỦA TVGS */}
          {canConfirm && isConfirming && (
            <div className="no-print" style={{
              background: '#f0fdf4',
              border: '2px solid #86efac',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <PenTool size={18} color="#15803d" />
                <strong style={{ fontSize: '1rem', color: '#166534' }}>
                  Xác Nhận Cán Bộ Giám Sát Thi Công (Điền Mục 5, 6, 7)
                </strong>
              </div>

              <form onSubmit={handleConfirmSubmit}>
                <div style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ fontWeight: 700, color: '#14532d', fontSize: '0.86rem' }}>
                    5. Nhận xét và yêu cầu của cán bộ giám sát thi công <span style={{ color: '#ef4444' }}>*</span>:
                  </label>
                  <textarea 
                    className="form-textarea" 
                    rows={2}
                    value={supervisorCommentsInput}
                    onChange={(e) => setSupervisorCommentsInput(e.target.value)}
                    placeholder="Nhập nhận xét chất lượng thi công, an toàn, tiến độ và các yêu cầu đối với ĐVTC..."
                    required
                    autoFocus
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ fontWeight: 700, color: '#14532d', fontSize: '0.86rem' }}>
                    6. Nhận xét và yêu cầu của Chủ đầu tư <span style={{ color: '#ef4444' }}>*</span>:
                  </label>
                  <textarea 
                    className="form-textarea" 
                    rows={2}
                    value={investorCommentsInput}
                    onChange={(e) => setInvestorCommentsInput(e.target.value)}
                    placeholder="Nhập ý kiến chỉ đạo, nhận xét và yêu cầu của Chủ đầu tư..."
                    required
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label className="form-label" style={{ fontWeight: 700, color: '#14532d', fontSize: '0.86rem' }}>
                    7. Ý kiến của nhà thầu thi công xây dựng <span style={{ color: '#ef4444' }}>*</span>:
                  </label>
                  <textarea 
                    className="form-textarea" 
                    rows={2}
                    value={contractorCommentsInput}
                    onChange={(e) => setContractorCommentsInput(e.target.value)}
                    placeholder="Nhập ý kiến tiếp thu, cam kết thực hiện của Đơn vị thi công..."
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={() => setIsConfirming(false)}
                    style={{ fontSize: '0.84rem' }}
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary" 
                    style={{ background: '#15803d', borderColor: '#15803d', fontSize: '0.84rem', fontWeight: 700 }}
                  >
                    ✓ Ký Duyệt TVGS & Xác Nhận CĐT
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* QUỐC HIỆU TIÊU NGỮ */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ width: '45%', textAlign: 'center', fontSize: '0.88rem' }}>
              <strong>{(log.contractorName || log.contractorCompany || 'Công ty TNHH Gia Huy Vĩnh Phúc').toUpperCase()}</strong><br />
              Số: <strong>{log.logNumber}</strong><br />
              <em>{log.bookNumber || 'Quyển số: 01/2026'}</em>
            </div>
            <div style={{ width: '50%', textAlign: 'center', fontSize: '0.88rem' }}>
              <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br />
              <u>Độc lập - Tự do - Hạnh phúc</u><br /><br />
              <em>{log.cityDateFormatted || 'Cần Thơ, Ngày 22 tháng 10 năm 2026'}</em>
            </div>
          </div>

          {/* TIÊU ĐỀ */}
          <div style={{ textAlign: 'center', margin: '14px 0 20px 0' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              NHẬT KÝ THI CÔNG XÂY DỰNG CÔNG TRÌNH
            </h2>
            <div style={{ fontSize: '0.88rem', fontStyle: 'italic', color: '#475569' }}>
              (Theo mẫu chuẩn Nghị định số 06/2021/NĐ-CP của Chính phủ)
            </div>
          </div>

          {/* BÌA: NHỮNG THÔNG TIN CHUNG */}
          <div style={{
            background: '#fafafa',
            border: '1px solid #cbd5e1',
            padding: '12px 16px',
            marginBottom: '16px',
            borderRadius: '4px'
          }}>
            <div style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px', fontSize: '0.94rem', color: '#1e3a8a' }}>
              NHỮNG THÔNG TIN CHUNG
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.92rem' }}>
              <div><strong>1. Tên dự án:</strong> {log.projectName || 'Đầu tư xây dựng nhà ở Phường Thường Thạnh- An Phú Eco City'}</div>
              <div><strong>2. Tên công trình:</strong> {log.buildingName || 'Chung cư nhà ở xã hội 2'}</div>
              <div><strong>3. Tên hạng mục, gói thầu:</strong> {log.itemName || 'Thi công phần kết cấu – Tòa A và Tòa B (Gói thầu số 02)'}</div>
              <div><strong>4. Địa điểm xây dựng:</strong> {log.location || 'Phường Thường Thạnh - Quận Cái Răng – TP. Cần Thơ.'}</div>
              <div><strong>5. Chủ đầu tư – Ban QLDA:</strong> {log.investorName || 'Công ty TNHH An Phú Cần Thơ'}</div>
              <div>
                <strong>6. Đơn vị giám sát thi công:</strong> {log.supervisorName || 'Công ty CP Tư vấn xây dựng và Thương mại Gelicon'}
                <div style={{ paddingLeft: '16px', fontStyle: 'italic' }}>
                  - TVGS phụ trách tiếp nhận: {log.assignedSupervisor?.name || log.representatives?.supervisor?.representative || 'Đinh Xuân Thám'} ({log.assignedSupervisor?.position || log.representatives?.supervisor?.position || 'Cán bộ TVGS'})
                </div>
              </div>
              <div>
                <strong>7. Đơn vị thi công xây dựng:</strong> {log.contractorName || log.contractorCompany || log.representatives?.contractor?.company || 'Công ty TNHH Gia Huy Vĩnh Phúc'}
                <div style={{ paddingLeft: '16px', fontStyle: 'italic' }}>
                  - Chỉ huy trưởng công trường: {log.representatives?.contractor?.leader || getContractorChief(log.contractorName || log.contractorCompany || log.representatives?.contractor?.company).fullName}<br />
                  - Cán bộ KT thi công (Người tạo): {log.representatives?.contractor?.createdBy || log.createdByName || 'KS. Lê Văn Kỹ Thuật'}
                </div>
              </div>
            </div>
          </div>

          {/* PHẦN NỘI DUNG NHẬT KÝ HÀNG NGÀY */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px', fontSize: '0.96rem', borderBottom: '1px solid #000', paddingBottom: '2px' }}>
              NỘI DUNG NHẬT KÝ THI CÔNG NGÀY
            </div>

            {/* 1. THỜI TIẾT */}
            <div style={{ marginBottom: '12px' }}>
              <strong>1. Thời tiết:</strong>
              <div style={{ paddingLeft: '18px', marginTop: '4px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px', width: '33.3%' }}>
                        - Sáng (7h - 11h): <strong style={{ color: log.weather?.morning === 'MƯA' ? '#2563eb' : '#d97706' }}>
                          {log.weather?.morning === 'MƯA' ? '🌧️ Trời Mưa' : '☀️ Trời Nắng'}
                        </strong>
                      </td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px', width: '33.3%' }}>
                        - Chiều (13h - 15h): <strong style={{ color: log.weather?.afternoon === 'MƯA' ? '#2563eb' : '#d97706' }}>
                          {log.weather?.afternoon === 'MƯA' ? '🌧️ Trời Mưa' : '☀️ Trời Nắng'}
                        </strong>
                      </td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px', width: '33.3%' }}>
                        - Tối (18h - 24h): <strong>
                          {log.weather?.evening === 'MƯA' ? '🌧️ Trời Mưa' : log.weather?.evening === 'KHÔNG THI CÔNG' ? '⛔ Không thi công' : '🌙 Tạnh ráo'}
                        </strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
                {log.weather?.note && (
                  <div style={{ fontStyle: 'italic', fontSize: '0.86rem', marginTop: '4px' }}>
                    * Ghi chú thời tiết: {log.weather.note}
                  </div>
                )}
              </div>
            </div>

            {/* 2. TÌNH HÌNH NHÂN LỰC, THIẾT BỊ */}
            <div style={{ marginBottom: '12px' }}>
              <strong>2. Tình hình nhân lực, thiết bị thi công:</strong>
              <div style={{ paddingLeft: '18px', marginTop: '4px' }}>
                <div><strong>2.1. Nhân lực:</strong></div>
                <div style={{ paddingLeft: '16px' }}>
                  - <strong>Kỹ thuật:</strong> {log.manpower?.technical || log.createdByName || 'KS. Lê Văn Kỹ Thuật (01 người)'}<br />
                  - <strong>Công nhân:</strong> {log.manpower?.workers || '35 công nhân'}<br />
                  - <strong>Nhân lực khác:</strong> {
                    log.manpower?.otherPersonnel && log.manpower.otherPersonnel.length > 0 
                      ? log.manpower.otherPersonnel.map(p => `${p.name} (${p.position || 'KT'})`).join(', ')
                      : 'Không có'
                  }
                </div>

                <div style={{ marginTop: '6px' }}>
                  <strong>2.2. Thiết bị thi công:</strong> {log.equipment || '01 máy vận thăng, 02 máy trộn bê tông, 04 máy đầm dùi.'}
                </div>
              </div>
            </div>

            {/* 3. NỘI DUNG CÔNG VIỆC THỰC HIỆN */}
            <div style={{ marginBottom: '12px' }}>
              <strong>3. Nội dung công việc thực hiện:</strong>
              <div style={{ paddingLeft: '18px', marginTop: '4px', textAlign: 'justify' }}>
                {log.workContent || 'Thi công gia công lắp dựng ván khuôn, cốt thép dầm sàn tầng 5 Tòa A; Đổ bê tông dầm sàn; Bảo dưỡng bê tông sàn tầng 4.'}
              </div>
            </div>

            {/* 4. TÌNH HÌNH CÔNG TÁC ATLĐ VỆ SINH MÔI TRƯỜNG */}
            <div style={{ marginBottom: '14px' }}>
              <strong>4. Tình hình công tác ATLĐ vệ sinh môi trường:</strong>
              <div style={{ paddingLeft: '18px', marginTop: '4px' }}>
                - Đánh giá: <strong>{log.safetyEnvironment?.status || 'Bình thường'}</strong><br />
                {log.safetyEnvironment?.notes && (
                  <div>- Chi tiết: {log.safetyEnvironment.notes}</div>
                )}
              </div>
            </div>

            {/* ẢNH HIỆN TRƯỜNG ĐÍNH KÈM NẾU CÓ */}
            {log.evidencePhotos && log.evidencePhotos.length > 0 && (
              <div style={{ marginBottom: '16px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <strong>* Ảnh chụp hiện trường thi công ({log.evidencePhotos.length} ảnh):</strong>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', marginTop: '6px' }}>
                  {log.evidencePhotos.map((photo, i) => (
                    <div key={photo.id || i} style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px', textAlign: 'center', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                      <img 
                        src={photo.url} 
                        alt={photo.caption} 
                        style={{ width: '100%', height: '110px', objectFit: 'cover', display: 'block', borderRadius: '2px' }} 
                      />
                      <div style={{ fontSize: '0.74rem', color: '#475569', marginTop: '4px', fontStyle: 'italic' }}>
                        {photo.caption || `Ảnh ${i + 1}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MỤC 5, 6, 7 (ĐƯỢC ĐIỀN KHI TVGS XÁC NHẬN) */}
            <div style={{
              background: isConfirmed ? '#f8fafc' : '#fffbeb',
              border: isConfirmed ? '1px solid #cbd5e1' : '1.5px dashed #f59e0b',
              padding: '12px 16px',
              borderRadius: '6px',
              marginBottom: '18px',
              pageBreakInside: 'avoid',
              breakInside: 'avoid'
            }}>
              {/* 5. TVGS */}
              <div style={{ marginBottom: '10px' }}>
                <strong>5. Nhận xét và yêu cầu của cán bộ giám sát thi công:</strong>
                <div style={{ paddingLeft: '18px', marginTop: '4px', fontStyle: log.supervisorComments ? 'normal' : 'italic', color: log.supervisorComments ? '#0f172a' : '#94a3b8' }}>
                  {log.supervisorComments || '.......................................................................................................................................................................................................................................... (Chờ TVGS xác nhận & cho ý kiến)'}
                </div>
              </div>

              {/* 6. CĐT */}
              <div style={{ marginBottom: '10px' }}>
                <strong>6. Nhận xét và yêu cầu của Chủ đầu tư:</strong>
                <div style={{ paddingLeft: '18px', marginTop: '4px', fontStyle: log.investorComments ? 'normal' : 'italic', color: log.investorComments ? '#0f172a' : '#94a3b8' }}>
                  {log.investorComments || '.......................................................................................................................................................................................................................................... (Xác nhận theo TVGS)'}
                </div>
              </div>

              {/* 7. ĐVTC */}
              <div>
                <strong>7. Ý kiến của nhà thầu thi công xây dựng:</strong>
                <div style={{ paddingLeft: '18px', marginTop: '4px', fontStyle: log.contractorComments ? 'normal' : 'italic', color: log.contractorComments ? '#0f172a' : '#94a3b8' }}>
                  {log.contractorComments || '..........................................................................................................................................................................................................................................'}
                </div>
              </div>
            </div>
          </div>

          {/* CHỮ KÝ 3 BÊN */}
          <div className="doc-signatures-grid" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            textAlign: 'center',
            marginTop: '24px',
            paddingTop: '10px',
            pageBreakInside: 'avoid',
            breakInside: 'avoid'
          }}>
            {/* ĐD. CHỦ ĐẦU TƯ / BAN QLDA */}
            <div style={{ flex: 1, padding: '0 8px', textAlign: 'center' }}>
              <strong style={{ fontSize: '0.92rem' }}>ĐD. CHỦ ĐẦU TƯ / BAN QLDA</strong><br />
              <span style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>(Ký, ghi rõ họ tên)</span>
              
              <div style={{ minHeight: '75px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '8px 0' }}>
                {log.signatures?.investor?.signed ? (
                  <div style={{
                    border: '1.5px solid #059669',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    background: '#f0fdf4',
                    color: '#065f46',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textAlign: 'center'
                  }}>
                    ✓ ĐÃ XÁC NHẬN<br />
                    <span style={{ fontSize: '0.72rem', fontWeight: 500 }}>Chữ ký số điện tử CĐT</span>
                  </div>
                ) : (
                  <span className="no-print" style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.8rem' }}>(Chờ xác nhận)</span>
                )}
              </div>

              <strong style={{ fontSize: '0.92rem', color: '#000000', display: 'block', marginTop: '4px' }}>
                {log.signatures?.investor?.name || log.representatives?.investor?.representative || 'Ngô Quý Linh'}
              </strong>
            </div>

            {/* TƯ VẤN GIÁM SÁT */}
            <div style={{ flex: 1, padding: '0 8px', textAlign: 'center' }}>
              <strong style={{ fontSize: '0.92rem' }}>TƯ VẤN GIÁM SÁT</strong><br />
              <span style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>(Ký, ghi rõ họ tên)</span>
              
              <div style={{ minHeight: '75px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '8px 0' }}>
                {log.signatures?.supervisor?.signed ? (
                  <div style={{
                    border: '1.5px solid #059669',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    background: '#f0fdf4',
                    color: '#065f46',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textAlign: 'center'
                  }}>
                    ✓ ĐÃ KÝ DUYỆT<br />
                    <span style={{ fontSize: '0.72rem', fontWeight: 500 }}>Chữ ký số điện tử TVGS</span>
                  </div>
                ) : (
                  <span className="no-print" style={{ color: '#d97706', fontStyle: 'italic', fontSize: '0.8rem' }}>(Chờ TVGS xác nhận)</span>
                )}
              </div>

              <strong style={{ fontSize: '0.92rem', color: '#000000', display: 'block', marginTop: '4px' }}>
                {log.signatures?.supervisor?.name || log.assignedSupervisor?.name || log.representatives?.supervisor?.representative || 'Đinh Xuân Thám'}
              </strong>
            </div>

            {/* ĐƠN VỊ THI CÔNG */}
            <div style={{ flex: 1, padding: '0 8px', textAlign: 'center' }}>
              <strong style={{ fontSize: '0.92rem' }}>ĐƠN VỊ THI CÔNG</strong><br />
              <span style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>(Ký, ghi rõ họ tên)</span>
              
              <div style={{ minHeight: '75px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '8px 0' }}>
                {log.signatures?.contractor?.signed !== false ? (
                  <div style={{
                    border: '1.5px solid #2563eb',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textAlign: 'center'
                  }}>
                    ✓ ĐÃ LẬP & KÝ<br />
                    <span style={{ fontSize: '0.72rem', fontWeight: 500 }}>Cán bộ KT thi công</span>
                  </div>
                ) : (
                  <span className="no-print" style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.8rem' }}>(Chưa ký)</span>
                )}
              </div>

              <strong style={{ fontSize: '0.92rem', color: '#000000', display: 'block', marginTop: '4px' }}>
                {log.signatures?.contractor?.name || log.createdByName || 'KS. Lê Văn Kỹ Thuật'}
              </strong>
            </div>
          </div>

          <div style={{ textAlign: 'right', marginTop: '20px', fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic' }}>
            Mẫu số 1 - Trang 01
          </div>
        </div>
      </div>
    </div>
  );
}
