import React, { useState, useEffect } from 'react';
import { X, ArrowLeftRight, UserCheck, CheckCircle2, Shield, Users, Phone, AlertCircle, Sparkles } from 'lucide-react';

export default function ReassignRecipientModal({
  isOpen,
  onClose,
  request,
  reassignType, // 'SUPERVISOR' | 'INVESTOR'
  users = [],
  currentUser,
  onConfirmReassign
}) {
  if (!isOpen || !request) return null;

  const isSupervisor = reassignType === 'SUPERVISOR';
  const roleTitle = isSupervisor ? 'Tư Vấn Giám Sát (TVGS)' : 'Ban Quản Lý Dự Án (Ban QLDA)';

  // Tìm cán bộ hiện tại đang được chỉ định
  const currentOfficer = (request.assignedRecipients || []).find(r => 
    isSupervisor 
      ? (r.role === 'SUPERVISOR' || r.role === 'LEAD_SUPERVISOR')
      : (r.role === 'INVESTOR' || r.role === 'LEAD_INVESTOR')
  );

  // Danh sách ứng viên hợp lệ (chỉ chọn cán bộ cấp dưới trực tiếp nghiệm thu, không chọn các anh Trưởng)
  const candidateList = users.filter(u => {
    if (u.status === 'INACTIVE') return false;
    const roleStr = (u.role || '').toUpperCase();
    const pos = (u.position || '').toLowerCase();
    if (pos.includes('trưởng') || pos.includes('chỉ huy') || pos.includes('giám đốc') || Boolean(u.isLead)) return false;
    if (isSupervisor) {
      if (roleStr !== 'SUPERVISOR' || roleStr === 'LEAD_SUPERVISOR') return false;
      if (pos.includes('thi công') || pos.includes('nhà thầu') || pos.includes('quản lý dự án') || pos.includes('ban qlda')) return false;
      return true;
    } else {
      if (roleStr !== 'INVESTOR' || roleStr === 'LEAD_INVESTOR') return false;
      if (pos.includes('tư vấn') || pos.includes('giám sát') || pos.includes('thi công')) return false;
      return true;
    }
  });

  // State chọn cán bộ mới
  const [selectedUid, setSelectedUid] = useState(() => {
    // Mặc định chọn người khác với người hiện tại (nếu có)
    const otherCandidate = candidateList.find(u => u.uid !== currentOfficer?.uid);
    return otherCandidate?.uid || candidateList[0]?.uid || '';
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const otherCandidate = candidateList.find(u => u.uid !== currentOfficer?.uid);
    setSelectedUid(otherCandidate?.uid || candidateList[0]?.uid || '');
  }, [request?.id, reassignType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUid) {
      alert('Vui lòng chọn cán bộ mới tiếp nhận nghiệm thu!');
      return;
    }

    const newOfficer = candidateList.find(u => u.uid === selectedUid);
    if (!newOfficer) return;

    if (currentOfficer && newOfficer.uid === currentOfficer.uid) {
      alert('Cán bộ mới đang trùng với cán bộ hiện tại. Vui lòng chọn cán bộ khác!');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirmReassign(request.id, reassignType, newOfficer, '');
      onClose();
    } catch (err) {
      console.error('Lỗi điều chuyển cán bộ:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }}>
      <div className="modal-content" style={{ maxWidth: '680px', width: '92%', borderRadius: '16px' }}>
        {/* Header */}
        <div className="modal-header" style={{ 
          background: isSupervisor ? 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)' : 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
          borderBottom: isSupervisor ? '1px solid #bbf7d0' : '1px solid #fde68a',
          padding: '16px 20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              background: isSupervisor ? '#059669' : '#d97706', 
              color: '#ffffff', 
              width: '40px', 
              height: '40px', 
              borderRadius: '10px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
            }}>
              <ArrowLeftRight size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: isSupervisor ? '#065f46' : '#92400e', fontWeight: 800 }}>
                Điều Chuyển Cán Bộ {roleTitle}
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#475569' }}>
                Phiếu số: <strong style={{ color: '#2563eb' }}>{request.requestNumber}</strong> • {request.buildingName}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '18px 20px', maxHeight: '72vh', overflowY: 'auto' }}>
            {/* Banner công tác nghiệm thu */}
            <div style={{ 
              background: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: '10px', 
              padding: '12px 14px', 
              marginBottom: '16px',
              fontSize: '0.86rem'
            }}>
              <div style={{ color: '#64748b', fontSize: '0.76rem', fontWeight: 600, textTransform: 'uppercase' }}>
                Công tác yêu cầu nghiệm thu:
              </div>
              <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                {request.taskContent}
              </div>
            </div>

            {/* Thông tin Cán bộ hiện tại */}
            <div style={{ 
              background: '#fff1f2', 
              border: '1.5px solid #fecaca', 
              borderRadius: '10px', 
              padding: '12px 14px', 
              marginBottom: '18px' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#991b1b', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                <AlertCircle size={15} />
                <span>CÁN BỘ ĐANG ĐƯỢC CHỈ ĐỊNH HIỆN TẠI:</span>
              </div>
              {currentOfficer ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ 
                      width: '34px', 
                      height: '34px', 
                      borderRadius: '50%', 
                      background: isSupervisor ? '#059669' : '#d97706', 
                      color: '#ffffff', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontWeight: 700, 
                      fontSize: '0.8rem' 
                    }}>
                      {currentOfficer.fullName ? currentOfficer.fullName.split(' ').pop().slice(0, 2).toUpperCase() : 'CB'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>
                        {currentOfficer.fullName}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                        {currentOfficer.position || (isSupervisor ? 'Cán bộ TVGS' : 'Cán bộ ban QLDA')} • {currentOfficer.phone || 'Chưa có SĐT'}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.72rem', background: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                    Sẽ được thay thế
                  </span>
                </div>
              ) : (
                <div style={{ color: '#64748b', fontSize: '0.84rem', fontStyle: 'italic' }}>
                  Chưa có cán bộ nào được chỉ định trước đó.
                </div>
              )}
            </div>

            {/* Danh sách chọn Cán bộ Mới */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label className="form-label" style={{ margin: 0, fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>
                  Chọn Cán Bộ Mới Tiếp Nhận Nghiệm Thu: <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <span style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600 }}>
                  ({candidateList.length} nhân sự sẵn sàng)
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px', maxHeight: '340px', overflowY: 'auto', padding: '2px' }}>
                {candidateList.map(u => {
                  const isSelected = selectedUid === u.uid;
                  const isCurrent = currentOfficer && u.uid === currentOfficer.uid;

                  return (
                    <div
                      key={u.uid}
                      onClick={() => !isCurrent && setSelectedUid(u.uid)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        border: isSelected ? '2px solid #2563eb' : isCurrent ? '1px dashed #cbd5e1' : '1px solid #e2e8f0',
                        borderRadius: '10px',
                        background: isSelected ? '#eff6ff' : isCurrent ? '#f8fafc' : '#ffffff',
                        cursor: isCurrent ? 'not-allowed' : 'pointer',
                        opacity: isCurrent ? 0.6 : 1,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <input 
                        type="radio" 
                        name="reassignRadio" 
                        checked={isSelected} 
                        disabled={isCurrent}
                        onChange={() => setSelectedUid(u.uid)} 
                        onClick={(e) => e.stopPropagation()}
                        style={{ cursor: isCurrent ? 'not-allowed' : 'pointer', width: '16px', height: '16px', accentColor: '#2563eb' }}
                      />
                      <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        background: isSupervisor ? '#059669' : '#d97706', 
                        color: '#ffffff', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontWeight: 700, 
                        fontSize: '0.76rem',
                        flexShrink: 0
                      }}>
                        {u.avatar || u.fullName.split(' ').pop().slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.fullName}</span>
                          {(u.role === 'LEAD_SUPERVISOR' || u.role === 'LEAD_INVESTOR') && (
                            <span style={{ fontSize: '0.66rem', background: '#dcfce7', color: '#15803d', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                              Trưởng
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                          {u.position} • {u.phone || 'SĐT'}
                        </div>
                      </div>
                      {isCurrent && (
                        <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontStyle: 'italic' }}>
                          Hiện tại
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer" style={{ padding: '14px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Hủy bỏ
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={isSubmitting}
              style={{ background: isSupervisor ? '#059669' : '#d97706' }}
            >
              <CheckCircle2 size={16} />
              <span>{isSubmitting ? 'Đang điều chuyển...' : 'Xác Nhận Đổi Cán Bộ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
