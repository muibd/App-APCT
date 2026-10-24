import React from 'react';
import { X, MapPin, FileText, Calendar, Award, Building, UserCheck, Camera, Clock, AlertTriangle, RotateCcw, CheckCircle2, ArrowLeftRight } from 'lucide-react';
import { getDocumentRevisionNumber } from '../data/projectCatalog';

export default function InvitationDetailModal({
  isOpen,
  onClose,
  request,
  reports = [],
  currentRole,
  currentUser,
  onOpenReport,
  onReassign
}) {
  if (!isOpen || !request) return null;

  const createdTimeFormatted = (() => {
    if (!request.createdAt) return 'Chưa ghi nhận';
    try {
      const d = new Date(request.createdAt);
      if (isNaN(d.getTime())) return request.createdAt;
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${hours}:${minutes} ${day}/${month}/${year}`;
    } catch {
      return request.createdAt;
    }
  })();

  const docCode = request.docTypeCode || (request.inspectionType === 'MATERIAL' ? 'MI' : 'IR');
  let rawReqNum = (request.requestNumber || '').trim();
  rawReqNum = rawReqNum.replace(/^\.\.\.\.\.\.\s*/, '').replace(/^\.\.\.\s*/, '').trim();
  let cleanReqNumber = rawReqNum;
  if (!cleanReqNumber || cleanReqNumber === '......' || cleanReqNumber === docCode) {
    cleanReqNumber = docCode;
  } else if (!cleanReqNumber.includes(docCode)) {
    cleanReqNumber = `${cleanReqNumber}/${docCode}`;
  }

  const relatedReport = (reports || []).find(r => 
    (request.reportId && r.id === request.reportId) ||
    r.requestId === request.id ||
    (request.requestNumber && r.requestNumber === request.requestNumber)
  );

  const rev = getDocumentRevisionNumber(request, relatedReport);
  const revStr = String(rev).padStart(2, '0');

  let cleanRefDocCode = (request.projectCategoryCode || request.referenceDocNumber || '').trim();
  if (!cleanRefDocCode || cleanRefDocCode.startsWith('TLCC') || cleanRefDocCode.includes('TLCC')) {
    cleanRefDocCode = `2203/IR/231026-${revStr}.01`;
  } else {
    cleanRefDocCode = cleanRefDocCode.replace(/\/(WA|MI)\//, '/IR/');
    if (/-\d+(\.\d+)?$/.test(cleanRefDocCode)) {
      cleanRefDocCode = cleanRefDocCode.replace(/-\d+(\.\d+)?$/, `-${revStr}.01`);
    } else {
      cleanRefDocCode = `${cleanRefDocCode}-${revStr}.01`;
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '780px' }}>
        <div className="modal-header" style={{ background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#eff6ff', padding: '8px', borderRadius: '10px', color: '#2563eb' }}>
              <FileText size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Phiếu Yêu Cầu Nghiệm Thu</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                Mã số: <strong>{cleanReqNumber}</strong> • Ngày gửi: {new Date(request.createdAt).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body" style={{ padding: '20px 24px' }}>
          {/* BANNER CẢNH BÁO TRẠNG THÁI NGHIỆM THU */}
          {request.status === 'HAS_REJECTIONS' && (
            <div style={{
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
                <strong>⚠️ KẾT QUẢ KIỂM TRA: CHƯA ĐẠT (KHÔNG ĐỒNG Ý NGHIỆM THU)</strong>
                <div style={{ fontSize: '0.84rem', marginTop: '3px', color: '#b91c1c' }}>
                  Lý do: "{request.rejectionNotes || 'Có khiếm khuyết kỹ thuật hiện trường cần khắc phục sửa chữa.'}"
                </div>
              </div>
            </div>
          )}

          {request.status === 'RECTIFIED' && (
            <div style={{
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
                <strong>🔄 ĐÃ BÁO CÁO KHẮC PHỤC SỬA CHỮA (CHỜ DUYỆT LẠI)</strong>
                <div style={{ fontSize: '0.84rem', marginTop: '3px', color: '#581c87' }}>
                  Biện pháp xử lý: "{request.rectificationNotes || 'ĐVTC đã nắn chỉnh và hoàn thiện theo yêu cầu.'}"
                </div>
              </div>
            </div>
          )}

          {request.status === 'WAITING_INVESTOR' && (
            <div style={{
              background: '#eff6ff',
              border: '1.5px solid #bfdbfe',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#1e40af'
            }}>
              <Clock size={20} color="#2563eb" style={{ flexShrink: 0 }} />
              <div>
                <strong>⏳ CHỜ BAN QLDA PHÊ DUYỆT & KÝ SỐ</strong>
                <div style={{ fontSize: '0.84rem', marginTop: '2px', color: '#1d4ed8' }}>
                  TVGS đã kiểm tra và nghiệm thu đạt. Đang chờ Ban Quản Lý Dự Án vào xem xét và ký số.
                </div>
              </div>
            </div>
          )}

          {request.status === 'COMPLETED' && (
            <div style={{
              background: '#f0fdf4',
              border: '1.5px solid #bbf7d0',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#166534'
            }}>
              <CheckCircle2 size={20} color="#16a34a" style={{ flexShrink: 0 }} />
              <div>
                <strong>✅ ĐÃ HOÀN TẤT NGHIỆM THU ĐẠT</strong>
                <div style={{ fontSize: '0.84rem', marginTop: '2px', color: '#15803d' }}>
                  Công tác đã được CĐT, TVGS và ĐVTC ký duyệt hoàn tất theo quy định.
                </div>
              </div>
            </div>
          )}

          {/* VĂN BẢN NỘI DUNG PHIẾU YÊU CẦU THEO CHUẨN MẪU */}
          <div 
            className="document-paper invitation-paper"
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              marginBottom: '20px',
              fontFamily: '"Times New Roman", Times, serif'
            }}>
            {/* Header Quốc hiệu tiêu ngữ */}
            <div style={{ textAlign: 'center', marginBottom: '14px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '0.98rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM
              </div>
              <div style={{ fontWeight: 'bold', fontSize: '0.92rem', marginTop: '2px' }}>
                <u>Độc lập - Tự do - Hạnh phúc</u>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '1px' }}>
                ----------***---------
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.85rem', fontStyle: 'italic', marginTop: '6px' }}>
                Cần Thơ, ngày ... tháng ... năm 20...
              </div>
            </div>

            {/* Tiêu đề & Mã số */}
            <div style={{
              textAlign: 'center',
              margin: '12px 0 16px 0',
              padding: '8px 12px'
            }}>
              <h2 style={{ fontSize: '1.25rem', color: '#0f172a', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.02em', fontWeight: 800 }}>
                PHIẾU YÊU CẦU NGHIỆM THU
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', fontSize: '0.9rem' }}>
                <div>
                  <strong>Số:</strong> <strong style={{ color: '#0f172a' }}>{cleanReqNumber}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', lineHeight: 1.6 }}>
              <div><strong>Dự án:</strong> {request.projectName || 'Đầu tư xây dựng nhà ở Phường Thường Thạnh - An Phú Eco City'}</div>
              <div><strong>Công trình:</strong> {request.buildingName}</div>
              <div><strong>Hạng mục:</strong> {request.itemName || request.packageName}</div>
              <div><strong>Địa điểm xây dựng:</strong> {request.location || 'Phường Thường Thạnh - Quận Cái Răng - Thành phố Cần Thơ'}</div>
              <div><strong>Đơn vị yêu cầu nghiệm thu:</strong> {request.contractorCompany}</div>

              <div style={{
                background: request.inspectionType === 'MATERIAL' ? '#f0fdf4' : '#f1f5f9',
                padding: '12px',
                borderRadius: '8px',
                margin: '8px 0',
                borderLeft: request.inspectionType === 'MATERIAL' ? '4px solid #059669' : '4px solid #2563eb'
              }}>
                <strong style={{ color: request.inspectionType === 'MATERIAL' ? '#065f46' : '#1e40af' }}>
                  {request.inspectionType === 'MATERIAL' ? 'Vật liệu đầu vào yêu cầu nghiệm thu (Mẫu số 12):' : 'Công tác xây dựng yêu cầu nghiệm thu:'}
                </strong>

                {request.materials && request.materials.length > 0 ? (
                  <div style={{ marginTop: '8px', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', background: '#ffffff', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                      <thead>
                        <tr style={{ background: '#ecfdf5', color: '#065f46', borderBottom: '1px solid #a7f3d0' }}>
                          <th style={{ padding: '6px 8px', textAlign: 'center', width: '32px' }}>#</th>
                          <th style={{ padding: '6px 8px', textAlign: 'left' }}>Tên / Chủng loại vật liệu</th>
                          <th style={{ padding: '6px 8px', textAlign: 'left' }}>Xuất xứ</th>
                          <th style={{ padding: '6px 8px', textAlign: 'center', width: '55px' }}>ĐVT</th>
                          <th style={{ padding: '6px 8px', textAlign: 'right', width: '75px' }}>K.Lượng</th>
                          <th style={{ padding: '6px 8px', textAlign: 'left' }}>Số CCXX</th>
                        </tr>
                      </thead>
                      <tbody>
                        {request.materials.map((mat, idx) => (
                          <tr key={idx} style={{ borderBottom: idx < request.materials.length - 1 ? '1px solid #f0fdf4' : 'none' }}>
                            <td style={{ padding: '6px 8px', textAlign: 'center', color: '#059669', fontWeight: 600 }}>{idx + 1}</td>
                            <td style={{ padding: '6px 8px', fontWeight: 600, color: '#0f172a' }}>{mat.name}</td>
                            <td style={{ padding: '6px 8px', color: '#334155' }}>{mat.origin}</td>
                            <td style={{ padding: '6px 8px', textAlign: 'center', color: '#475569' }}>{mat.unit}</td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: '#059669' }}>{mat.quantity}</td>
                            <td style={{ padding: '6px 8px', color: '#64748b', fontSize: '0.78rem' }}>{mat.certificateNumber || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>
                    {request.taskContent}
                  </div>
                )}

                <p style={{ fontSize: '0.83rem', color: '#475569', margin: '6px 0 0 0', fontStyle: 'italic' }}>
                  Sau khi kiểm tra chất lượng, đối chiếu với bản vẽ thiết kế và các tiêu chuẩn kỹ thuật được áp dụng, chúng tôi đã nghiệm thu nội bộ. Đơn vị thi công kính mời Chủ đầu tư và Tư vấn giám sát tiến hành nghiệm thu.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '10px 16px', marginTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={16} color="#2563eb" style={{ flexShrink: 0 }} />
                  <strong>Thời gian nghiệm thu: {request.scheduledTime}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} color="#64748b" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#334155' }}>Thời gian tạo phiếu: {createdTimeFormatted}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', gridColumn: '1 / -1' }}>
                  <MapPin size={16} color="#2563eb" style={{ flexShrink: 0 }} />
                  <span><strong>Tại:</strong> {request.inspectionPlace}</span>
                </div>
              </div>

              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: '#64748b' }}>
                <div>Đại diện đơn vị thi công: <strong>{request.createdByName || 'KS. Lê Văn Kỹ Thuật'}</strong> ({request.createdByRole || 'Kỹ thuật hiện trường'})</div>
                <span style={{ color: '#059669', fontWeight: 600 }}>✓ ĐVTC đã ký xác nhận gửi</span>
              </div>

              {/* Nơi nhận theo mẫu 03 */}
              <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #e2e8f0', fontSize: '0.82rem', color: '#475569' }}>
                <strong>Nơi nhận:</strong>
                <div style={{ paddingLeft: '14px', marginTop: '3px', lineHeight: 1.5 }}>
                  - TVGS: Công ty CP Tư vấn Xây dựng và Thương mại GELICON<br />
                  - CĐT: Ban QLDA - Công ty TNHH An Phú Cần Thơ<br />
                  - Lưu: {request.contractorCompany || 'Đơn vị thi công'}
                </div>
              </div>
            </div>
          </div>

          {/* ẢNH THI CÔNG HIỆN TRƯỜNG ĐÍNH KÈM (NẾU CÓ) */}
          {request.evidencePhotos && request.evidencePhotos.length > 0 && (
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '18px'
            }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '0.88rem', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Camera size={16} color="#2563eb" />
                <span>Ảnh chụp thi công do ĐVTC đính kèm ({request.evidencePhotos.length} ảnh):</span>
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                {request.evidencePhotos.map((photo, i) => (
                  <div key={photo.id || i} style={{
                    background: '#ffffff',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{ position: 'relative' }}>
                      <img
                        src={photo.url}
                        alt={photo.caption || `Ảnh ${i + 1}`}
                        style={{ width: '100%', height: '130px', objectFit: 'cover', display: 'block' }}
                      />
                      <div style={{
                        position: 'absolute',
                        bottom: '4px',
                        left: '4px',
                        right: '4px',
                        background: 'rgba(15, 23, 42, 0.85)',
                        color: '#ffffff',
                        padding: '4px 6px',
                        borderRadius: '4px',
                        fontSize: '0.66rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Clock size={10} color="#34d399" />
                          <span>{photo.time}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: '8px', fontSize: '0.78rem', color: '#334155', fontWeight: 600 }}>
                      {photo.caption || 'Hiện trường thi công thực tế'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DANH SÁCH CÁN BỘ ĐƯỢC MỜI TIẾP NHẬN PHIẾU */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '18px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.88rem', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserCheck size={16} color="#2563eb" />
              <span>Thành phần tiếp nhận phiếu yêu cầu ({request.assignedRecipients?.length || 0}):</span>
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {request.assignedRecipients?.map((rec, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 14px',
                  background: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="avatar-circle" style={{
                      width: '32px',
                      height: '32px',
                      fontSize: '0.75rem',
                      background: (rec.role === 'SUPERVISOR' || rec.role === 'LEAD_SUPERVISOR') ? '#059669' : '#d97706'
                    }}>
                      {(rec.role === 'SUPERVISOR' || rec.role === 'LEAD_SUPERVISOR') ? 'TV' : 'ĐT'}
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#0f172a' }}>
                        {rec.fullName}
                        {rec.uid === currentUser?.uid && (
                          <span style={{ marginLeft: '6px', fontSize: '0.72rem', background: '#e0e7ff', color: '#3730a3', padding: '2px 6px', borderRadius: '4px' }}>
                            (Bạn)
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {rec.position} • {rec.company}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge-status badge-confirmed" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
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
                      const canReassign = request.status !== 'COMPLETED' && currentRole !== 'ADMIN' && ((isSup && isLeadSup) || (!isSup && isLeadInv));

                      if (!canReassign) return null;

                      return (
                        <button
                          type="button"
                          onClick={() => onReassign && onReassign(request, isSup ? 'SUPERVISOR' : 'INVESTOR')}
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
                          title={`Điều chuyển người nhận ${isSup ? 'TVGS' : 'CĐT'} khác cho phiếu này`}
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

          {/* HƯỚNG DẪN ĐỒNG BỘ VỚI BIÊN BẢN */}
          {/* <div style={{ 
            background: '#f0fdf4', 
            border: '1px solid #bbf7d0', 
            borderRadius: '10px', 
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#166534',
            fontSize: '0.85rem'
          }}>
            <Award size={20} color="#16a34a" style={{ flexShrink: 0 }} />
            <div>
              <strong>Biên bản nghiệm thu công việc xây dựng tương ứng đã được khởi tạo sẵn.</strong>
              <div style={{ fontSize: '0.8rem', color: '#15803d', marginTop: '2px' }}>
                TVGS và CĐT trực tiếp kiểm tra tại hiện trường và tiến hành nghiệm thu (Đồng ý hoặc Không đồng ý) trên biên bản.
              </div>
            </div>
          </div> */}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Đóng
          </button>

          <button
            className="btn-primary"
            style={{ background: '#059669' }}
            onClick={() => {
              onClose();
              if (onOpenReport) {
                onOpenReport(request.reportId || request.id, false);
              }
            }}
          >
            <Award size={16} />
            <span>{currentRole === 'ADMIN' ? 'Mở Xem Biên Bản Nghiệm Thu (Chỉ Xem)' : 'Mở Biên Bản Nghiệm Thu Để Đánh Giá'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
