import React, { useRef } from 'react';
import { 
  X, Printer, CheckCircle2, Clock, AlertTriangle, ShieldCheck, 
  Award, FileText, Download, Building, MapPin, Calendar, CheckSquare
} from 'lucide-react';
import { getContractorChief } from '../data/mockData';

export default function CompletionReportDetailModal({
  isOpen,
  onClose,
  report,
  currentUser,
  currentRole,
  onSignReport,
  showAlert
}) {
  const printRef = useRef(null);

  if (!isOpen || !report) return null;

  const contChief = getContractorChief(report.representatives?.contractor?.company, null, {
    itemName: report.projectInfo?.itemName || report.itemName,
    packageName: report.projectInfo?.packageName || report.packageName,
    taskContent: report.workContent || report.taskContent,
    inspectionObject: report.inspectionObject,
    createdByRole: report.representatives?.contractor?.createdPosition || report.createdByRole,
    createdByName: report.representatives?.contractor?.createdBy || report.createdByName,
    createdByUid: report.representatives?.contractor?.uid || report.createdByUid
  });
  const contLeadName = contChief.fullName;
  const contLeadPosition = 'Chỉ huy trưởng';

  const isCompleted = report.status === 'COMPLETED' || (
    report.signatures?.investor?.signed && 
    report.signatures?.supervisor?.signed && 
    report.signatures?.contractor?.signed
  );

  const isAdmin = currentRole === 'ADMIN';
  const isSupervisorUser = !isAdmin && (currentRole === 'SUPERVISOR' || currentRole === 'LEAD_SUPERVISOR');
  const isInvestorUser = !isAdmin && (currentRole === 'INVESTOR' || currentRole === 'LEAD_INVESTOR');

  const canSupervisorSign = isSupervisorUser && !report.signatures?.supervisor?.signed;
  const canInvestorSign = isInvestorUser && !report.signatures?.investor?.signed;

  const handlePrint = () => {
    window.print();
  };

  const handleSign = (role) => {
    if (onSignReport) {
      onSignReport(report.id, role);
    }
  };

  const completionType = report.completionType || 'STAGE';
  const is4Parties = completionType === 'PROJECT_USE';

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '940px', maxHeight: '94vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* MODAL HEADER */}
        <div className="modal-header no-print" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '14px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#eff6ff', padding: '8px', borderRadius: '10px', color: '#2563eb' }}>
              <Award size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a' }}>
                  {completionType === 'PROJECT_USE' 
                    ? 'Biên Bản Nghiệm Thu Hoàn Thành Công Trình Đưa Vào Sử Dụng'
                    : completionType === 'DOSSIER'
                    ? 'Biên Bản Kiểm Tra Hồ Sơ Nghiệm Thu Hoàn Thành Giai Đoạn'
                    : 'Biên Bản Nghiệm Thu Hoàn Thành Giai Đoạn Thi Công'}
                </h3>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: isCompleted ? '#ecfdf5' : '#eff6ff',
                  color: isCompleted ? '#059669' : '#2563eb',
                  border: isCompleted ? '1px solid #a7f3d0' : '1px solid #bfdbfe'
                }}>
                  {isCompleted ? '✓ ĐÃ KÝ DUYỆT HOÀN TẤT' : '⏳ CHỜ KÝ DUYỆT ĐẦY ĐỦ'}
                </span>
                {isAdmin && (
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: '#faf5ff',
                    color: '#7e22ce',
                    border: '1px solid #e9d5ff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <ShieldCheck size={12} /> Admin (Chỉ xem)
                  </span>
                )}
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Số: <strong>{report.reportNumber}</strong> • Ngày lập: {report.date}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={handlePrint}
              style={{ padding: '7px 14px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={16} />
              <span>In A4</span>
            </button>
            <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        {/* MODAL BODY (PRINTABLE A4 DOCUMENT) */}
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '24px 30px', background: '#f1f5f9' }}>
          
          {/* BANNER DÀNH CHO ADMIN VIEW-ONLY */}
          {isAdmin && (
            <div className="no-print" style={{
              background: '#faf5ff',
              border: '1.5px solid #d8b4fe',
              borderRadius: '12px',
              padding: '12px 18px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: '#6b21a8'
            }}>
              <ShieldCheck size={22} color="#7e22ce" style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: '0.92rem' }}>Chế Độ Giám Sát Hồ Sơ (CĐT View-Only)</strong>
                <div style={{ fontSize: '0.82rem', color: '#9333ea', marginTop: '2px' }}>
                  Chủ đầu tư (Admin) có quyền xem văn bản và giám sát tiến độ ký duyệt. Quyền ký duyệt thuộc về TVGS Trưởng và Trưởng Ban QLDA.
                </div>
              </div>
            </div>
          )}

          {/* ACTION BANNER NẾU CẦN KÝ (CHỈ DÀNH CHO TVGS/CĐT, ADMIN KHÔNG KÝ) */}
          {!isCompleted && !isAdmin && (canSupervisorSign || canInvestorSign) && (
            <div className="no-print" style={{
              background: '#eff6ff',
              border: '1.5px solid #60a5fa',
              borderRadius: '12px',
              padding: '14px 18px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
              boxShadow: '0 4px 12px rgba(37,99,235,0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={22} color="#2563eb" />
                <div>
                  <strong style={{ color: '#1e40af', fontSize: '0.94rem' }}>
                    Yêu Cầu Ký Duyệt Nghiệm Thu Hoàn Thành
                  </strong>
                  <div style={{ fontSize: '0.82rem', color: '#3b82f6', marginTop: '2px' }}>
                    {canSupervisorSign && canInvestorSign 
                      ? 'Biên bản đang chờ Tư Vấn Giám Sát Trưởng và Chủ Đầu Tư Trưởng ký duyệt.'
                      : canSupervisorSign 
                      ? 'Bạn là Tư Vấn Giám Sát. Vui lòng rà soát nội dung hiện trường và ký xác nhận.'
                      : 'Bạn là Chủ Đầu Tư. Vui lòng kiểm tra và ký phê duyệt hoàn tất văn bản.'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {canSupervisorSign && (
                  <button
                    type="button"
                    onClick={() => handleSign('SUPERVISOR')}
                    className="btn-primary"
                    style={{ background: '#059669', padding: '8px 16px', fontSize: '0.84rem', fontWeight: 700 }}
                  >
                    ✓ TVGS Trưởng Ký Duyệt
                  </button>
                )}
                {canInvestorSign && (
                  <button
                    type="button"
                    onClick={() => handleSign('INVESTOR')}
                    className="btn-primary"
                    style={{ background: '#d97706', padding: '8px 16px', fontSize: '0.84rem', fontWeight: 700 }}
                  >
                    ✓ Trưởng Ban QLDA Ký Phê Duyệt
                  </button>
                )}
              </div>
            </div>
          )}

          {/* VĂN BẢN KHỔ GIẤY A4 CHUẨN */}
          <div 
            ref={printRef}
            className="a4-document-print" 
            style={{ 
              background: '#ffffff', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)', 
              borderRadius: '8px', 
              padding: '40px 48px', 
              color: '#000000', 
              fontFamily: '"Times New Roman", Times, serif', 
              lineHeight: 1.5,
              fontSize: '11pt',
              maxWidth: '820px',
              margin: '0 auto'
            }}
          >
            {/* QUỐC HIỆU TIÊU NGỮ */}
            <div style={{ textAlign: 'center', marginBottom: '14px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '12pt', textTransform: 'uppercase' }}>
                CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM
              </div>
              <div style={{ fontWeight: 'bold', fontSize: '11.5pt', fontStyle: 'italic' }}>
                Độc lập - Tự do - Hạnh phúc
              </div>
              <div style={{ margin: '4px auto 8px auto', width: '160px', borderBottom: '1px solid #000' }}></div>
              <div style={{ textAlign: 'right', fontStyle: 'italic', fontSize: '10.5pt', marginTop: '6px' }}>
                {report.cityDate || 'Cần Thơ, Ngày .... tháng .... năm 2026'}
              </div>
            </div>

            {/* TIÊU ĐỀ BIÊN BẢN (THEO TỪNG MẪU ẢNH) */}
            <div style={{ textAlign: 'center', margin: '18px 0 16px 0' }}>
              <h2 style={{ 
                fontSize: '13pt', 
                fontWeight: 'bold', 
                textTransform: 'uppercase', 
                margin: '0 0 4px 0', 
                lineHeight: 1.3 
              }}>
                {completionType === 'PROJECT_USE' && (
                  <>
                    BIÊN BẢN NGHIỆM THU HOÀN THÀNH<br />
                    HẠNG MỤC CÔNG TRÌNH HOẶC CÔNG TRÌNH ĐƯA VÀO SỬ DỤNG
                  </>
                )}
                {completionType === 'EQUIPMENT_STAGE' && (
                  <>
                    BIÊN BẢN NGHIỆM THU HOÀN THÀNH BỘ PHẬN CÔNG TRÌNH XÂY DỰNG,<br />
                    GIAI ĐOẠN LẮP ĐẶT THIẾT BỊ
                  </>
                )}
                {completionType === 'STAGE' && (
                  <>
                    BIÊN BẢN NGHIỆM THU HOÀN THÀNH GIAI ĐOẠN THI CÔNG
                  </>
                )}
                {completionType === 'DOSSIER' && (
                  <>
                    BIÊN BẢN KIỂM TRA HỒ SƠ NGHIỆM THU CHẤT LƯỢNG<br />
                    HOÀN THÀNH GIAI ĐOẠN THI CÔNG HẠNG MỤC CÔNG TRÌNH
                  </>
                )}
              </h2>

              <div style={{ color: '#000000', fontWeight: 'bold', fontSize: '10.5pt' }}>
                Số: {report.reportNumber}
              </div>
              {report.referenceDocNumber && (
                <div style={{ color: '#000000', fontWeight: 'bold', fontSize: '10.5pt' }}>
                  Số tài liệu căn cứ: {report.referenceDocNumber}
                </div>
              )}
            </div>

            {/* THÔNG TIN DỰ ÁN */}
            <div style={{ marginBottom: '14px', fontSize: '11pt' }}>
              <div style={{ marginBottom: '4px' }}>
                <strong>Dự án : </strong>
                <span>{report.projectName}</span>
              </div>
              <div style={{ marginBottom: '4px' }}>
                <strong>Công trình : </strong>
                <span>{report.buildingName}</span>
              </div>
              <div style={{ marginBottom: '4px' }}>
                <strong>Hạng mục : </strong>
                <span>{report.itemName}</span>
              </div>
              <div style={{ marginBottom: '4px' }}>
                <strong>Địa điểm xây dựng: </strong>
                <span style={{ color: '#dc2626' }}>{report.location && !report.location.includes('Thường Thạnh') && !report.location.includes('Quận Cái Răng') ? report.location : 'Phường Cái Răng - TP. Cần Thơ'}</span>
              </div>
              <div>
                <strong>{completionType === 'DOSSIER' ? 'Đối tượng kiểm tra:' : 'Đối tượng nghiệm thu:'} </strong>
                <span>{report.inspectionObject}</span>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* NỘI DUNG MẪU 1: HOÀN THÀNH HẠNG MỤC / CÔNG TRÌNH ĐƯA VÀO SỬ DỤNG (ẢNH 1 & 2) */}
            {/* ========================================================================= */}
            {completionType === 'PROJECT_USE' && (
              <div>
                {/* 1. THÀNH PHẦN THAM GIA NGHIỆM THU */}
                <div style={{ marginBottom: '14px' }}>
                  <strong>1. Thành phần tham gia nghiệm thu :</strong>
                  
                  {/* HIỂN THỊ TRÊN MÀN HÌNH APP */}
                  <div className="screen-only" style={{ paddingLeft: '14px', marginTop: '4px' }}>
                    <div><strong>a) Chủ đầu tư – Ban QLDA:</strong> {report.representatives?.investor?.company}</div>
                    <div style={{ paddingLeft: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1.65 }}>
                        <span style={{ width: '240px', flexShrink: 0 }}>- Ông (bà): {report.representatives?.investor?.leadName}</span>
                        <span>Chức vụ: {report.representatives?.investor?.leadPosition}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1.65 }}>
                        <span style={{ width: '240px', flexShrink: 0 }}>- Ông (bà): {report.representatives?.investor?.officerName || 'Nguyễn Thành Trung'}</span>
                        <span>Chức vụ: {report.representatives?.investor?.officerPosition || 'Cán bộ Ban QLDA'}</span>
                      </div>
                    </div>

                    <div style={{ marginTop: '4px' }}><strong>b) Tư vấn thiết kế:</strong> {report.representatives?.designer?.company || 'Công ty CP Tư vấn Thiết kế Xây dựng APCT'}</div>
                    <div style={{ paddingLeft: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1.65 }}>
                        <span style={{ width: '240px', flexShrink: 0 }}>- Ông (bà): {report.representatives?.designer?.leadName || 'KTS. Lê Quang Thiết Kế'}</span>
                        <span>Chức vụ: {report.representatives?.designer?.leadPosition || 'Giám đốc thiết kế'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1.65 }}>
                        <span style={{ width: '240px', flexShrink: 0 }}>- Ông (bà): {report.representatives?.designer?.officerName || 'KTS. Trần Văn Vẽ'}</span>
                        <span>Chức vụ: {report.representatives?.designer?.officerPosition || 'Chủ trì kiến trúc'}</span>
                      </div>
                    </div>

                    <div style={{ marginTop: '4px' }}><strong>c) Tư vấn giám sát:</strong> {report.representatives?.supervisor?.company}</div>
                    <div style={{ paddingLeft: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1.65 }}>
                        <span style={{ width: '240px', flexShrink: 0 }}>- Ông (bà): {report.representatives?.supervisor?.leadName}</span>
                        <span>Chức vụ: {report.representatives?.supervisor?.leadPosition}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1.65 }}>
                        <span style={{ width: '240px', flexShrink: 0 }}>- Ông (bà): {report.representatives?.supervisor?.officerName || 'Đỗ Văn Trường'}</span>
                        <span>Chức vụ: {report.representatives?.supervisor?.officerPosition || 'Cán bộ TVGS'}</span>
                      </div>
                    </div>

                    <div style={{ marginTop: '4px' }}><strong>d) Đơn vị thi công:</strong> {report.representatives?.contractor?.company}</div>
                    <div style={{ paddingLeft: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1.65 }}>
                        <span style={{ width: '240px', flexShrink: 0 }}>- Ông (bà): {contLeadName}</span>
                        <span>Chức vụ: {contLeadPosition}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1.65 }}>
                        <span style={{ width: '240px', flexShrink: 0 }}>- Ông (bà): {report.representatives?.contractor?.officerName || 'Nguyễn Hoàng Bách'}</span>
                        <span>Chức vụ: {report.representatives?.contractor?.officerPosition || 'Kỹ thuật hiện trường'}</span>
                      </div>
                    </div>
                  </div>

                  {/* KHI IN RA GIẤY: DẠNG DẤU CHẤM .... HẾT THEO YÊU CẦU */}
                  <div className="print-only" style={{ paddingLeft: '14px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', width: '100%', overflow: 'hidden' }}>
                      <strong style={{ whiteSpace: 'nowrap', marginRight: '4px' }}>a) Chủ đầu tư – Ban QLDA:</strong>
                      <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>
                        ................................................................................................................................................................
                      </span>
                    </div>
                    <div style={{ paddingLeft: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', width: '100%', overflow: 'hidden' }}>
                        <span style={{ whiteSpace: 'nowrap', marginRight: '4px' }}>- Ông (bà):</span>
                        <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>................................................................................................</span>
                        <span style={{ whiteSpace: 'nowrap', margin: '0 6px 0 16px' }}>Chức vụ:</span>
                        <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>................................................................................................</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', width: '100%', overflow: 'hidden', marginTop: '2px' }}>
                        <span style={{ whiteSpace: 'nowrap', marginRight: '4px' }}>- Ông (bà):</span>
                        <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>................................................................................................</span>
                        <span style={{ whiteSpace: 'nowrap', margin: '0 6px 0 16px' }}>Chức vụ:</span>
                        <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>................................................................................................</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', width: '100%', overflow: 'hidden', marginTop: '4px' }}>
                      <strong style={{ whiteSpace: 'nowrap', marginRight: '4px' }}>b) Tư vấn thiết kế:</strong>
                      <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>
                        ................................................................................................................................................................
                      </span>
                    </div>
                    <div style={{ paddingLeft: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', width: '100%', overflow: 'hidden' }}>
                        <span style={{ whiteSpace: 'nowrap', marginRight: '4px' }}>- Ông (bà):</span>
                        <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>................................................................................................</span>
                        <span style={{ whiteSpace: 'nowrap', margin: '0 6px 0 16px' }}>Chức vụ:</span>
                        <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>................................................................................................</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', width: '100%', overflow: 'hidden', marginTop: '2px' }}>
                        <span style={{ whiteSpace: 'nowrap', marginRight: '4px' }}>- Ông (bà):</span>
                        <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>................................................................................................</span>
                        <span style={{ whiteSpace: 'nowrap', margin: '0 6px 0 16px' }}>Chức vụ:</span>
                        <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>................................................................................................</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', width: '100%', overflow: 'hidden', marginTop: '4px' }}>
                      <strong style={{ whiteSpace: 'nowrap', marginRight: '4px' }}>c) Tư vấn giám sát:</strong>
                      <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>
                        ................................................................................................................................................................
                      </span>
                    </div>
                    <div style={{ paddingLeft: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', width: '100%', overflow: 'hidden' }}>
                        <span style={{ whiteSpace: 'nowrap', marginRight: '4px' }}>- Ông (bà):</span>
                        <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>................................................................................................</span>
                        <span style={{ whiteSpace: 'nowrap', margin: '0 6px 0 16px' }}>Chức vụ:</span>
                        <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>................................................................................................</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', width: '100%', overflow: 'hidden', marginTop: '2px' }}>
                        <span style={{ whiteSpace: 'nowrap', marginRight: '4px' }}>- Ông (bà):</span>
                        <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>................................................................................................</span>
                        <span style={{ whiteSpace: 'nowrap', margin: '0 6px 0 16px' }}>Chức vụ:</span>
                        <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>................................................................................................</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', width: '100%', overflow: 'hidden', marginTop: '4px' }}>
                      <strong style={{ whiteSpace: 'nowrap', marginRight: '4px' }}>d) Đơn vị thi công:</strong>
                      <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>
                        ................................................................................................................................................................
                      </span>
                    </div>
                    <div style={{ paddingLeft: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', width: '100%', overflow: 'hidden' }}>
                        <span style={{ whiteSpace: 'nowrap', marginRight: '4px' }}>- Ông (bà):</span>
                        <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>................................................................................................</span>
                        <span style={{ whiteSpace: 'nowrap', margin: '0 6px 0 16px' }}>Chức vụ:</span>
                        <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>................................................................................................</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', width: '100%', overflow: 'hidden', marginTop: '2px' }}>
                        <span style={{ whiteSpace: 'nowrap', marginRight: '4px' }}>- Ông (bà):</span>
                        <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>................................................................................................</span>
                        <span style={{ whiteSpace: 'nowrap', margin: '0 6px 0 16px' }}>Chức vụ:</span>
                        <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>................................................................................................</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. THỜI GIAN NGHIỆM THU */}
                <div style={{ marginBottom: '14px' }}>
                  <strong>2. Thời gian nghiệm thu:</strong>
                  <div style={{ paddingLeft: '20px' }}>
                    Bắt đầu: {report.time?.startTime || '09h00, ngày 22/10/2026'}<br />
                    Kết thúc: {report.time?.endTime || '11h30, ngày 22/10/2026'}<br />
                    Tại: {report.time?.place || 'Hiện trường công trình Dự án An Phú Eco City'}
                  </div>
                </div>

                {/* 3. ĐÁNH GIÁ HẠNG MỤC CÔNG TRÌNH XÂY DỰNG */}
                <div style={{ marginBottom: '14px' }}>
                  <strong>3. Đánh giá hạng mục công trình xây dựng:</strong>
                  <div style={{ paddingLeft: '14px', marginTop: '4px' }}>
                    <div><strong>a) Tài liệu căn cứ nghiệm thu :</strong></div>
                    <div style={{ paddingLeft: '14px' }}>
                      - Phiếu yêu cầu nghiệm thu của nhà thầu thi công: <strong>{report.reportNumber.replace('BBNT', 'PYC')}</strong><br />
                      - Hồ sơ thiết kế TKBVTC (đã được chủ đầu tư phê duyệt ngày {report.designApprovedDate || '15/01/2026'})<br />
                      &nbsp;&nbsp;+ Những thay đổi thiết kế đã được chấp thuận (<em>nếu có</em>) : {report.designChanges || 'Được sự chấp thuận của CĐT và TVTK tại biên bản xử lý hiện trường số 01/BB-XLHT'}<br />
                      - Qui chuẩn, tiêu chuẩn xây dựng được áp dụng (nêu rõ tên và số hiệu qui chuẩn, tiêu chuẩn):
                      <div style={{ paddingLeft: '14px' }}>
                        {report.standardsApplied?.map((std, i) => (
                          <div key={i}>+ {std}</div>
                        ))}
                      </div>
                      - Tài liệu chỉ dẫn kỹ thuật kèm theo hợp đồng xây dựng: Chỉ dẫn kỹ thuật ban hành kèm theo Hợp đồng số {report.contractNumber || '0203/HĐXD/APCT-GHVP'}<br />
                      - Nhật ký thi công và các văn bản khác (<em>nếu có và được đính kèm toàn bộ</em>): Nhật ký thi công công trình đã được ghi chép và ký xác nhận hàng ngày.<br />
                      - Các biên bản nghiệm thu các bộ phận công trình xây dựng, giai đoạn thi công xây dựng (<em>đính kèm</em>): Đầy đủ biên bản nghiệm thu bộ phận, giai đoạn.<br />
                      - Kết quả thí nghiệm, hiệu chỉnh, vận hành liên động có tải hệ thống thiết bị công nghệ: Đạt yêu cầu theo quy chuẩn kỹ thuật.<br />
                      - Bản vẽ hoàn công hạng mục (hoặc toàn bộ) công trình xây dựng (<em>đính kèm</em>): Bản vẽ hoàn công số BVHC-01 đến 28/APCT.<br />
                      - Văn bản chấp thuận của cơ quan quản lý nhà nước có thẩm quyền về phòng chống cháy, nổ ; an toàn môi trường; an toàn vận hành theo qui định: {report.authorityApprovals || 'Biên bản nghiệm thu PCCC số 128/PCCC-CT; Báo cáo quan trắc môi trường đạt chuẩn.'}
                    </div>

                    <div style={{ marginTop: '6px' }}><strong>b) Khối lượng của công trình:</strong> Theo phụ lục kèm theo biên bản này.</div>
                    <div style={{ marginTop: '6px' }}>
                      <strong>c) Về chất lượng công việc xây dựng:</strong> Đối chiếu với thiết kế, tiêu chuẩn, qui phạm kỹ thuật, tài liệu chỉ dẫn kỹ thuật chuyên môn và yêu cầu kỹ thuật của công trình xây dựng có liên quan đến đối tượng nghiệm thu, chúng tôi thống nhất nghiệm thu công trình để đưa vào sử dụng với chất lượng: <strong>Đạt yêu cầu thiết kế và tiêu chuẩn xây dựng hiện hành.</strong>
                    </div>
                    <div style={{ marginTop: '6px' }}><strong>d) Những sửa đổi trong quá trình thi công so với thiết kế được duyệt:</strong> Được liệt kê trong phụ lục kèm theo biên bản này.</div>
                    <div style={{ marginTop: '6px' }}><strong>e) Các ý kiến khác nếu có:</strong> <em>Không có ý kiến gì thêm.</em></div>
                  </div>
                </div>

                {/* 4. KẾT LUẬN */}
                <div style={{ marginBottom: '24px' }}>
                  <strong>4. Kết luận :</strong>
                  <div style={{ paddingLeft: '14px', marginTop: '4px' }}>
                    - Chấp nhận nghiệm thu hoàn thành hạng mục công trình/ công trình xây dựng để đưa vào sử dụng: <strong style={{ color: '#059669' }}>ĐỒNG Ý CHẤP THUẬN</strong><br />
                    - Yêu cầu sửa chữa, hoàn thiện bổ sung : <em>Không có</em><br />
                    - Các yêu cầu khác (<em>nếu có</em>) : <em>Nhà thầu thực hiện nghĩa vụ bảo hành công trình theo đúng quy định của hợp đồng và pháp luật.</em>
                  </div>
                  <div style={{ fontStyle: 'italic', marginTop: '6px', textAlign: 'center' }}>
                    Các bên trực tiếp nghiệm thu chịu trách nhiệm trước pháp luật về quyết định nghiệm thu này .
                  </div>
                </div>

                {/* 4 CHỮ KÝ: CHỦ ĐẦU TƯ / BAN QLDA | TƯ VẤN THIẾT KẾ | TƯ VẤN GIÁM SÁT | ĐƠN VỊ THI CÔNG */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', textAlign: 'center', gap: '8px' }}>
                  {/* CHỦ ĐẦU TƯ */}
                  <div>
                    <strong>CHỦ ĐẦU TƯ<br />BAN QLDA</strong>
                    <div style={{ height: '75px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div className="screen-only">
                        {report.signatures?.investor?.signed ? (
                          <div style={{ color: '#047857' }}>
                            <div style={{ fontFamily: 'cursive', fontSize: '1.1rem', fontWeight: 'bold' }}>
                              {report.signatures.investor.name}
                            </div>
                            <div style={{ fontSize: '0.65rem' }}>✓ Đã ký số</div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', fontStyle: 'italic', color: '#64748b' }}>(Chờ ký)</span>
                        )}
                      </div>
                    </div>
                    <strong className="screen-only">{report.representatives?.investor?.leadName || 'Ngô Quý Linh'}</strong>
                  </div>

                  {/* TƯ VẤN THIẾT KẾ */}
                  <div>
                    <strong>TƯ VẤN THIẾT KẾ</strong>
                    <div style={{ height: '75px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div className="screen-only">
                        <div style={{ color: '#047857' }}>
                          <div style={{ fontFamily: 'cursive', fontSize: '1.1rem', fontWeight: 'bold' }}>
                            {report.signatures?.designer?.name || 'Lê Quang Thiết Kế'}
                          </div>
                          <div style={{ fontSize: '0.65rem' }}>✓ Đã ký số</div>
                        </div>
                      </div>
                    </div>
                    <strong className="screen-only">{report.representatives?.designer?.leadName || 'KTS. Lê Quang Thiết Kế'}</strong>
                  </div>

                  {/* TƯ VẤN GIÁM SÁT */}
                  <div>
                    <strong>TƯ VẤN GIÁM SÁT</strong>
                    <div style={{ height: '75px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div className="screen-only">
                        {report.signatures?.supervisor?.signed ? (
                          <div style={{ color: '#047857' }}>
                            <div style={{ fontFamily: 'cursive', fontSize: '1.1rem', fontWeight: 'bold' }}>
                              {report.signatures.supervisor.name}
                            </div>
                            <div style={{ fontSize: '0.65rem' }}>✓ Đã ký số</div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', fontStyle: 'italic', color: '#64748b' }}>(Chờ ký)</span>
                        )}
                      </div>
                    </div>
                    <strong className="screen-only">{report.representatives?.supervisor?.leadName || 'Đinh Xuân Thám'}</strong>
                  </div>

                  {/* ĐƠN VỊ THI CÔNG */}
                  <div>
                    <strong>ĐƠN VỊ THI CÔNG</strong>
                    <div style={{ height: '75px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div className="screen-only">
                        <div style={{ color: '#047857' }}>
                          <div style={{ fontFamily: 'cursive', fontSize: '1.1rem', fontWeight: 'bold' }}>
                            {report.signatures?.contractor?.name || contLeadName}
                          </div>
                          <div style={{ fontSize: '0.65rem' }}>✓ Đã ký số</div>
                        </div>
                      </div>
                    </div>
                    <strong className="screen-only">{contLeadName}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* NỘI DUNG MẪU 2: HOÀN THÀNH GIAI ĐOẠN THI CÔNG (ẢNH 3 & 4) */}
            {/* ========================================================================= */}
            {completionType === 'STAGE' && (
              <div>
                {/* 1. THÀNH PHẦN TRỰC TIẾP KIỂM TRA */}
                <div style={{ marginBottom: '14px' }}>
                  <strong>1. Thành phần trực tiếp kiểm tra :</strong>
                  
                  {/* HIỂN THỊ TRÊN MÀN HÌNH APP */}
                  <div className="screen-only" style={{ paddingLeft: '14px', marginTop: '4px' }}>
                    <div><strong>a) Đại diện Chủ đầu tư – Ban QLDA:</strong> {report.representatives?.investor?.company}</div>
                    <div style={{ paddingLeft: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1.65 }}>
                        <span style={{ width: '240px', flexShrink: 0 }}>- Ông(bà): {report.representatives?.investor?.leadName}</span>
                        <span>Chức vụ: {report.representatives?.investor?.leadPosition}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1.65 }}>
                        <span style={{ width: '240px', flexShrink: 0 }}>- Ông(bà): {report.representatives?.investor?.officerName || 'Nguyễn Thành Trung'}</span>
                        <span>Chức vụ: {report.representatives?.investor?.officerPosition || 'Cán bộ Ban QLDA'}</span>
                      </div>
                    </div>

                    <div style={{ marginTop: '4px' }}><strong>b) Đại diện Tư vấn giám sát:</strong> {report.representatives?.supervisor?.company}</div>
                    <div style={{ paddingLeft: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1.65 }}>
                        <span style={{ width: '240px', flexShrink: 0 }}>- Ông(bà): {report.representatives?.supervisor?.leadName}</span>
                        <span>Chức vụ: {report.representatives?.supervisor?.leadPosition}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1.65 }}>
                        <span style={{ width: '240px', flexShrink: 0 }}>- Ông(bà): {report.representatives?.supervisor?.officerName || 'Đỗ Văn Trường'}</span>
                        <span>Chức vụ: {report.representatives?.supervisor?.officerPosition || 'Cán bộ TVGS'}</span>
                      </div>
                    </div>

                    <div style={{ marginTop: '4px' }}><strong>c) Đại diện Đơn vị thi công:</strong> {report.representatives?.contractor?.company}</div>
                    <div style={{ paddingLeft: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1.65 }}>
                        <span style={{ width: '240px', flexShrink: 0 }}>- Ông(bà): {contLeadName}</span>
                        <span>Chức vụ: {contLeadPosition}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1.65 }}>
                        <span style={{ width: '240px', flexShrink: 0 }}>- Ông(bà): {report.representatives?.contractor?.officerName || 'Nguyễn Hoàng Bách'}</span>
                        <span>Chức vụ: {report.representatives?.contractor?.officerPosition || 'Kỹ thuật hiện trường'}</span>
                      </div>
                    </div>
                  </div>

                  {/* KHI IN RA GIẤY: DẠNG DẤU CHẤM .... HẾT THEO YÊU CẦU */}
                  <div className="print-only" style={{ paddingLeft: '14px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', width: '100%', overflow: 'hidden' }}>
                      <strong style={{ whiteSpace: 'nowrap', marginRight: '4px' }}>a) Đại diện Chủ đầu tư – Ban QLDA:</strong>
                      <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>
                        ................................................................................................................................................................
                      </span>
                    </div>
                    <div style={{ paddingLeft: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', width: '100%', overflow: 'hidden' }}>
                        <span style={{ whiteSpace: 'nowrap', marginRight: '4px' }}>- Ông (bà):</span>
                        <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>................................................................................................</span>
                        <span style={{ whiteSpace: 'nowrap', margin: '0 6px 0 16px' }}>Chức vụ:</span>
                        <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>................................................................................................</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', width: '100%', overflow: 'hidden', marginTop: '2px' }}>
                        <span style={{ whiteSpace: 'nowrap', marginRight: '4px' }}>- Ông (bà):</span>
                        <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>................................................................................................</span>
                        <span style={{ whiteSpace: 'nowrap', margin: '0 6px 0 16px' }}>Chức vụ:</span>
                        <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>................................................................................................</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', width: '100%', overflow: 'hidden', marginTop: '4px' }}>
                      <strong style={{ whiteSpace: 'nowrap', marginRight: '4px' }}>b) Đại diện Tư vấn giám sát:</strong>
                      <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>
                        ................................................................................................................................................................
                      </span>
                    </div>
                    <div style={{ paddingLeft: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', width: '100%', overflow: 'hidden' }}>
                        <span style={{ whiteSpace: 'nowrap', marginRight: '4px' }}>- Ông (bà):</span>
                        <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>................................................................................................</span>
                        <span style={{ whiteSpace: 'nowrap', margin: '0 6px 0 16px' }}>Chức vụ:</span>
                        <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>................................................................................................</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', width: '100%', overflow: 'hidden', marginTop: '2px' }}>
                        <span style={{ whiteSpace: 'nowrap', marginRight: '4px' }}>- Ông (bà):</span>
                        <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>................................................................................................</span>
                        <span style={{ whiteSpace: 'nowrap', margin: '0 6px 0 16px' }}>Chức vụ:</span>
                        <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>................................................................................................</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', width: '100%', overflow: 'hidden', marginTop: '4px' }}>
                      <strong style={{ whiteSpace: 'nowrap', marginRight: '4px' }}>c) Đại diện Đơn vị thi công:</strong>
                      <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>
                        ................................................................................................................................................................
                      </span>
                    </div>
                    <div style={{ paddingLeft: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', width: '100%', overflow: 'hidden' }}>
                        <span style={{ whiteSpace: 'nowrap', marginRight: '4px' }}>- Ông (bà):</span>
                        <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>................................................................................................</span>
                        <span style={{ whiteSpace: 'nowrap', margin: '0 6px 0 16px' }}>Chức vụ:</span>
                        <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>................................................................................................</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', width: '100%', overflow: 'hidden', marginTop: '2px' }}>
                        <span style={{ whiteSpace: 'nowrap', marginRight: '4px' }}>- Ông (bà):</span>
                        <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>................................................................................................</span>
                        <span style={{ whiteSpace: 'nowrap', margin: '0 6px 0 16px' }}>Chức vụ:</span>
                        <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>................................................................................................</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. THỜI GIAN NGHIỆM THU */}
                <div style={{ marginBottom: '14px' }}>
                  <strong>2. Thời gian nghiệm thu :</strong>
                  <div style={{ paddingLeft: '20px' }}>
                    Bắt đầu: {report.time?.startTime || '08h30, ngày 20/10/2026'}<br />
                    Kết thúc: {report.time?.endTime || '11h00, ngày 20/10/2026'}
                  </div>
                </div>

                {/* 4. ĐÁNH GIÁ BỘ PHẬN CÔNG TRÌNH XÂY DỰNG, GIAI ĐOẠN THI CÔNG ĐÃ THỰC HIỆN */}
                <div style={{ marginBottom: '14px' }}>
                  <strong>4. Đánh giá bộ phận công trình xây dựng, giai đoạn thi công đã thực hiện:</strong>
                  
                  <div style={{ paddingLeft: '14px', marginTop: '4px' }}>
                    <div><strong>4.1. Tài liệu căn cứ nghiệm thu:</strong></div>
                    <div style={{ paddingLeft: '14px' }}>
                      - Phiếu yêu cầu nghiệm thu của nhà thầu thi công: <strong>{report.reportNumber.replace('BBNT', 'PYC')}</strong><br />
                      - Các biên bản nghiệm thu công việc xây dựng: Đầy đủ biên bản các bước thi công đã được ký duyệt.<br />
                      - Hợp đồng xây dựng số: <strong>{report.contractNumber || '0203/HĐXD/APCT-GHVP ký ngày 02 tháng 03 năm 2026'}</strong><br />
                      - Nhật ký công trình của nhà thầu: Ghi chép đầy đủ các hoạt động thi công và xác nhận hàng ngày.<br />
                      - Tiêu chuẩn, quy phạm xây dựng áp dụng:
                      <div style={{ paddingLeft: '14px' }}>
                        {report.standardsApplied?.map((std, i) => (
                          <div key={i}>+ {std}</div>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginTop: '6px' }}><strong>4.2. Các vật liệu chính sử dụng thi công:</strong></div>
                    <div style={{ paddingLeft: '14px' }}>
                      {report.mainMaterials || 'Bê tông thương phẩm mác M300, M350; Cốt thép CB400-V, CB500-V Hòa Phát; Xi măng Insee; Cốp pha định hình phủ phim.'}
                    </div>

                    <div style={{ marginTop: '6px' }}><strong>4.3. Nhật ký thi công:</strong></div>
                    <div style={{ paddingLeft: '14px' }}>
                      Nhật ký phản ánh đầy đủ những hoạt động trên công trường và các bên ký xác nhận hàng ngày.
                    </div>

                    <div style={{ marginTop: '6px' }}><strong>4.4. Bản vẽ hoàn công:</strong></div>
                    <div style={{ paddingLeft: '14px' }}>
                      Bản vẽ hoàn thành công việc có đầy đủ, thực hiện đúng theo hướng dẫn trong nghị định số 06/2021/NĐ-CP ngày 26/01/2021 của Chính phủ về việc quy định chi tiết một số nội dung về quản lý chất lượng, thi công xây dựng và bảo trì công trình xây dựng.
                    </div>

                    <div style={{ marginTop: '6px' }}><strong>4.5. Các biên bản nghiệm thu:</strong></div>
                    <div style={{ paddingLeft: '14px' }}>
                      - Trong quá trình thi công, các bên đã tiến hành nghiệm thu đầy đủ, trình tự nghiệm thu theo đúng quy chuẩn hiện hành.<br />
                      - Hồ sơ nghiệm thu vật tư, vật liệu bao gồm: Biên bản lấy mẫu vật liệu, chứng chỉ chất lượng, kết quả thí nghiệm, phiếu yêu cầu nghiệm thu, biên bản nghiệm thu vật tư, vật liệu trước khi đưa vào sử dụng.<br />
                      - Hồ sơ nghiệm thu công việc xây dựng gồm: Phiếu yêu cầu nghiệm thu, biên bản nghiệm thu công việc xây dựng.
                    </div>

                    <div style={{ marginTop: '6px' }}><strong>4.6. Đánh giá chất lượng, công trình xây dựng:</strong></div>
                    <div style={{ paddingLeft: '14px' }}>
                      - Tiến độ thi công các công việc trên đảm bảo đúng tiến độ theo hợp đồng<br />
                      - Đối chiếu với TKBVTC : <strong>Đảm bảo yêu cầu</strong><br />
                      - Đánh giá sự phù hợp của công việc xây dựng so với tiêu chuẩn hiện hành : <strong>Đảm bảo yêu cầu</strong><br />
                      - Kiểm tra việc thực hiện theo yêu cầu kỹ thuật của công trình xây dựng: <strong>Đảm bảo yêu cầu</strong>
                    </div>

                    <div style={{ marginTop: '6px' }}><strong>4.7. Khối lượng thực hiện:</strong></div>
                    <div style={{ paddingLeft: '14px' }}>- Bảng diễn giải khối lượng kèm theo.</div>

                    <div style={{ marginTop: '6px' }}><strong>4.8. An toàn lao động và vệ sinh môi trường:</strong></div>
                    <div style={{ paddingLeft: '14px' }}>
                      - Đơn vị thi công trang bị đầy đủ bảo hộ cho cán bộ công nhân tham gia thi công, thực hiện treo các biển báo hiệu về an toàn lao động.<br />
                      - Công tác vệ sinh được thực hiện liên tục hàng ngày đảm bảo vệ sinh sạch sẽ.
                    </div>
                  </div>
                </div>

                {/* 5. KẾT LUẬN */}
                <div style={{ marginBottom: '24px' }}>
                  <strong>5. Kết luận:</strong>
                  <div style={{ paddingLeft: '14px', marginTop: '4px' }}>
                    - Thi công đúng thiết kế được duyệt, theo đúng quy trình kỹ thuật và các tiêu chuẩn, quy phạm xây dựng hiện hành, đảm bảo chất lượng.<br />
                    - Đồng ý nghiệm thu hoàn thành giai đoạn thi công đợt <strong>{report.paymentBatch || '02'}</strong> để làm cơ sở thanh toán cho nhà thầu.
                  </div>
                </div>

                {/* 3 CHỮ KÝ: ĐD. CHỦ ĐẦU TƯ / BAN QLDA | ĐD. TƯ VẤN GIÁM SÁT | ĐD. ĐƠN VỊ THI CÔNG */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center', gap: '12px' }}>
                  {/* CHỦ ĐẦU TƯ */}
                  <div>
                    <strong>ĐD. CHỦ ĐẦU TƯ<br />BAN QLDA</strong>
                    <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div className="screen-only">
                        {report.signatures?.investor?.signed ? (
                          <div style={{ color: '#047857' }}>
                            <div style={{ fontFamily: 'cursive', fontSize: '1.2rem', fontWeight: 'bold' }}>
                              {report.signatures.investor.name}
                            </div>
                            <div style={{ fontSize: '0.68rem' }}>✓ Đã ký số điện tử</div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.78rem', fontStyle: 'italic', color: '#64748b' }}>(Chờ CĐT duyệt)</span>
                        )}
                      </div>
                    </div>
                    <strong className="screen-only">{report.representatives?.investor?.leadName || 'Ngô Quý Linh'}</strong>
                  </div>

                  {/* TƯ VẤN GIÁM SÁT */}
                  <div>
                    <strong>ĐD. TƯ VẤN GIÁM SÁT</strong>
                    <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div className="screen-only">
                        {report.signatures?.supervisor?.signed ? (
                          <div style={{ color: '#047857' }}>
                            <div style={{ fontFamily: 'cursive', fontSize: '1.2rem', fontWeight: 'bold' }}>
                              {report.signatures.supervisor.name}
                            </div>
                            <div style={{ fontSize: '0.68rem' }}>✓ Đã ký số điện tử</div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.78rem', fontStyle: 'italic', color: '#64748b' }}>(Chờ TVGS ký)</span>
                        )}
                      </div>
                    </div>
                    <strong className="screen-only">{report.representatives?.supervisor?.leadName || 'Đinh Xuân Thám'}</strong>
                  </div>

                  {/* ĐƠN VỊ THI CÔNG */}
                  <div>
                    <strong>ĐD. ĐƠN VỊ THI CÔNG</strong>
                    <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div className="screen-only">
                        <div style={{ color: '#047857' }}>
                          <div style={{ fontFamily: 'cursive', fontSize: '1.2rem', fontWeight: 'bold' }}>
                            {report.signatures?.contractor?.name || contLeadName}
                          </div>
                          <div style={{ fontSize: '0.68rem' }}>✓ Đã ký số điện tử</div>
                        </div>
                      </div>
                    </div>
                    <strong className="screen-only">{contLeadName}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* NỘI DUNG MẪU 3: KIỂM TRA HỒ SƠ NGHIỆM THU CHẤT LƯỢNG HOÀN THÀNH GIAI ĐOẠN (ẢNH 5) */}
            {/* ========================================================================= */}
            {completionType === 'DOSSIER' && (
              <div>
                {/* 1. THÀNH PHẦN TRỰC TIẾP KIỂM TRA */}
                <div style={{ marginBottom: '14px' }}>
                  <strong>1. Thành phần trực tiếp kiểm tra :</strong>
                  
                  {/* HIỂN THỊ TRÊN MÀN HÌNH APP */}
                  <div className="screen-only" style={{ paddingLeft: '14px', marginTop: '4px' }}>
                    <div><strong>a) Đại diện Chủ đầu tư – Ban QLDA:</strong> {report.representatives?.investor?.company}</div>
                    <div style={{ paddingLeft: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1.65 }}>
                        <span style={{ width: '240px', flexShrink: 0 }}>- Ông(bà): {report.representatives?.investor?.leadName}</span>
                        <span>Chức vụ: {report.representatives?.investor?.leadPosition}</span>
                      </div>
                    </div>

                    <div style={{ marginTop: '4px' }}><strong>b) Đại diện Tư vấn giám sát:</strong> {report.representatives?.supervisor?.company}</div>
                    <div style={{ paddingLeft: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1.65 }}>
                        <span style={{ width: '240px', flexShrink: 0 }}>- Ông(bà): {report.representatives?.supervisor?.leadName}</span>
                        <span>Chức vụ: {report.representatives?.supervisor?.leadPosition}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1.65 }}>
                        <span style={{ width: '240px', flexShrink: 0 }}>- Ông(bà): {report.representatives?.supervisor?.officerName || 'Đỗ Văn Trường'}</span>
                        <span>Chức vụ: {report.representatives?.supervisor?.officerPosition || 'Cán bộ TVGS'}</span>
                      </div>
                    </div>

                    <div style={{ marginTop: '4px' }}><strong>c) Đại diện Đơn vị thi công:</strong> {report.representatives?.contractor?.company}</div>
                    <div style={{ paddingLeft: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1.65 }}>
                        <span style={{ width: '240px', flexShrink: 0 }}>- Ông(bà): {contLeadName}</span>
                        <span>Chức vụ: {contLeadPosition}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1.65 }}>
                        <span style={{ width: '240px', flexShrink: 0 }}>- Ông(bà): {report.representatives?.contractor?.officerName || 'Nguyễn Hoàng Bách'}</span>
                        <span>Chức vụ: {report.representatives?.contractor?.officerPosition || 'Kỹ thuật hiện trường'}</span>
                      </div>
                    </div>
                  </div>

                  {/* KHI IN RA GIẤY: DẠNG DẤU CHẤM .... HẾT THEO YÊU CẦU */}
                  <div className="print-only" style={{ paddingLeft: '14px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', width: '100%', overflow: 'hidden' }}>
                      <strong style={{ whiteSpace: 'nowrap', marginRight: '4px' }}>a) Đại diện Chủ đầu tư – Ban QLDA:</strong>
                      <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>
                        ................................................................................................................................................................
                      </span>
                    </div>
                    <div style={{ paddingLeft: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', width: '100%', overflow: 'hidden' }}>
                        <span style={{ whiteSpace: 'nowrap', marginRight: '4px' }}>- Ông (bà):</span>
                        <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>................................................................................................</span>
                        <span style={{ whiteSpace: 'nowrap', margin: '0 6px 0 16px' }}>Chức vụ:</span>
                        <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>................................................................................................</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', width: '100%', overflow: 'hidden', marginTop: '2px' }}>
                        <span style={{ whiteSpace: 'nowrap', marginRight: '4px' }}>- Ông (bà):</span>
                        <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>................................................................................................</span>
                        <span style={{ whiteSpace: 'nowrap', margin: '0 6px 0 16px' }}>Chức vụ:</span>
                        <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>................................................................................................</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', width: '100%', overflow: 'hidden', marginTop: '4px' }}>
                      <strong style={{ whiteSpace: 'nowrap', marginRight: '4px' }}>b) Đại diện Tư vấn giám sát:</strong>
                      <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>
                        ................................................................................................................................................................
                      </span>
                    </div>
                    <div style={{ paddingLeft: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', width: '100%', overflow: 'hidden' }}>
                        <span style={{ whiteSpace: 'nowrap', marginRight: '4px' }}>- Ông (bà):</span>
                        <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>................................................................................................</span>
                        <span style={{ whiteSpace: 'nowrap', margin: '0 6px 0 16px' }}>Chức vụ:</span>
                        <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>................................................................................................</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', width: '100%', overflow: 'hidden', marginTop: '2px' }}>
                        <span style={{ whiteSpace: 'nowrap', marginRight: '4px' }}>- Ông (bà):</span>
                        <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>................................................................................................</span>
                        <span style={{ whiteSpace: 'nowrap', margin: '0 6px 0 16px' }}>Chức vụ:</span>
                        <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>................................................................................................</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', width: '100%', overflow: 'hidden', marginTop: '4px' }}>
                      <strong style={{ whiteSpace: 'nowrap', marginRight: '4px' }}>c) Đại diện Đơn vị thi công:</strong>
                      <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>
                        ................................................................................................................................................................
                      </span>
                    </div>
                    <div style={{ paddingLeft: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', width: '100%', overflow: 'hidden' }}>
                        <span style={{ whiteSpace: 'nowrap', marginRight: '4px' }}>- Ông (bà):</span>
                        <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>................................................................................................</span>
                        <span style={{ whiteSpace: 'nowrap', margin: '0 6px 0 16px' }}>Chức vụ:</span>
                        <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>................................................................................................</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', width: '100%', overflow: 'hidden', marginTop: '2px' }}>
                        <span style={{ whiteSpace: 'nowrap', marginRight: '4px' }}>- Ông (bà):</span>
                        <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>................................................................................................</span>
                        <span style={{ whiteSpace: 'nowrap', margin: '0 6px 0 16px' }}>Chức vụ:</span>
                        <span style={{ letterSpacing: '2px', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>................................................................................................</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. THỜI GIAN KIỂM TRA */}
                <div style={{ marginBottom: '14px' }}>
                  <strong>2. Thời gian kiểm tra :</strong>
                  <div style={{ paddingLeft: '20px' }}>
                    Bắt đầu: {report.time?.startTime || '14h00, ngày 21/10/2026'}<br />
                    Kết thúc: {report.time?.endTime || '16h30, ngày 21/10/2026'}<br />
                    Tại: {report.time?.place || 'Văn phòng Ban Điều hành Dự án An Phú Eco City'}
                  </div>
                </div>

                {/* 3. NỘI DUNG KIỂM TRA */}
                <div style={{ marginBottom: '14px' }}>
                  <strong>3. Nội dung kiểm tra :</strong>
                  <div style={{ paddingLeft: '14px', marginTop: '4px' }}>
                    - Kiểm tra danh mục hồ sơ nghiệm thu giai đoạn thi công xây dựng: Đầy đủ danh mục hồ sơ nghiệm thu giai đoạn, chứng chỉ chất lượng vật liệu, kết quả thí nghiệm nén bê tông, kết quả kéo thép, chứng chỉ CO/CQ.<br />
                    - Kiểm tra tính pháp lý và chất lượng của hồ sơ nghiệm thu giai đoạn thi công xây dựng hoàn thành <strong>{report.stageName || 'phần kết cấu dầm sàn'}</strong> hạng mục công trình <strong>{report.itemName}</strong>: Hồ sơ lập đúng biểu mẫu, đầy đủ con dấu, chữ ký của các bên tham gia theo Nghị định 06/2021/NĐ-CP.
                  </div>
                </div>

                {/* 4. Ý KIẾN SAU KHI KIỂM TRA */}
                <div style={{ marginBottom: '24px' }}>
                  <strong>4. Ý kiến sau khi kiểm tra</strong>
                  <div style={{ paddingLeft: '14px', marginTop: '4px' }}>
                    - Hồ sơ trình để nghiệm thu giai đoạn hoàn thành xây dựng <strong>{report.stageName || 'phần kết cấu dầm sàn'}</strong> hạng mục <strong>{report.itemName}</strong> đã lập có đủ tính pháp lý theo quy định.<br />
                    - Hồ sơ nghiệm thu có danh mục kèm theo biên bản này đảm bảo đủ căn cứ để thực hiện các công tác tiếp theo.
                  </div>
                </div>

                {/* 3 CHỮ KÝ: ĐD. CHỦ ĐẦU TƯ / BAN QLDA | ĐD. TƯ VẤN GIÁM SÁT | ĐD. ĐƠN VỊ THI CÔNG */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center', gap: '12px' }}>
                  {/* CHỦ ĐẦU TƯ */}
                  <div>
                    <strong>ĐD. CHỦ ĐẦU TƯ<br />BAN QLDA</strong>
                    <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div className="screen-only">
                        {report.signatures?.investor?.signed ? (
                          <div style={{ color: '#047857' }}>
                            <div style={{ fontFamily: 'cursive', fontSize: '1.2rem', fontWeight: 'bold' }}>
                              {report.signatures.investor.name}
                            </div>
                            <div style={{ fontSize: '0.68rem' }}>✓ Đã ký số</div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.78rem', fontStyle: 'italic', color: '#64748b' }}>(Chờ CĐT duyệt)</span>
                        )}
                      </div>
                    </div>
                    <strong className="screen-only">{report.representatives?.investor?.leadName || 'Ngô Quý Linh'}</strong>
                  </div>

                  {/* TƯ VẤN GIÁM SÁT */}
                  <div>
                    <strong>ĐD. TƯ VẤN GIÁM SÁT</strong>
                    <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div className="screen-only">
                        {report.signatures?.supervisor?.signed ? (
                          <div style={{ color: '#047857' }}>
                            <div style={{ fontFamily: 'cursive', fontSize: '1.2rem', fontWeight: 'bold' }}>
                              {report.signatures.supervisor.name}
                            </div>
                            <div style={{ fontSize: '0.68rem' }}>✓ Đã ký số</div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.78rem', fontStyle: 'italic', color: '#64748b' }}>(Chờ TVGS ký)</span>
                        )}
                      </div>
                    </div>
                    <strong className="screen-only">{report.representatives?.supervisor?.leadName || 'Đinh Xuân Thám'}</strong>
                  </div>

                  {/* ĐƠN VỊ THI CÔNG */}
                  <div>
                    <strong>ĐD. ĐƠN VỊ THI CÔNG</strong>
                    <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div className="screen-only">
                        <div style={{ color: '#047857' }}>
                          <div style={{ fontFamily: 'cursive', fontSize: '1.2rem', fontWeight: 'bold' }}>
                            {report.signatures?.contractor?.name || contLeadName}
                          </div>
                          <div style={{ fontSize: '0.68rem' }}>✓ Đã ký số</div>
                        </div>
                      </div>
                    </div>
                    <strong className="screen-only">{contLeadName}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
