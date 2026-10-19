import React, { useState, useRef } from 'react';
import { X, ShieldCheck, Users, BookOpen, Settings, Activity, Plus, Check, Cloud, RotateCcw, FileSpreadsheet, Upload } from 'lucide-react';
import { STANDARD_CRITERIA_LIST } from '../data/mockData';
import { 
  CONSTRUCTION_WORK_STANDARDS, 
  MATERIAL_STANDARDS, 
  GENERAL_MANDATORY_STANDARDS, 
  parseStandardsExcel 
} from '../data/standardsRules';
import UserManagementView from './UserManagementView';

export default function AdminPortalModal({ 
  isOpen, 
  onClose, 
  users, 
  currentUser,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onUpdateUserRole,
  onToggleUserStatus,
  onResetAllData,
  showAlert
}) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('USERS'); // 'USERS' | 'STANDARDS' | 'CONFIG' | 'LOGS'
  const [standards, setStandards] = useState(STANDARD_CRITERIA_LIST);
  const [newStandardCode, setNewStandardCode] = useState('');
  const [newStandardTitle, setNewStandardTitle] = useState('');

  // Phân hệ Tiêu chuẩn động theo Excel
  const [standardsSubTab, setStandardsSubTab] = useState('ALL'); // 'ALL' | 'WORK' | 'MATERIAL' | 'MANDATORY'
  const [workStandardsList, setWorkStandardsList] = useState(CONSTRUCTION_WORK_STANDARDS);
  const [materialStandardsList, setMaterialStandardsList] = useState(MATERIAL_STANDARDS);
  const excelInputRef = useRef(null);

  const handleUploadExcelStandards = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      if (data) {
        const parsed = parseStandardsExcel(data);
        if (parsed && (parsed.works.length > 0 || parsed.materials.length > 0)) {
          if (parsed.works.length > 0) setWorkStandardsList(parsed.works);
          if (parsed.materials.length > 0) setMaterialStandardsList(parsed.materials);
          if (showAlert) {
            showAlert({
              type: 'success',
              title: 'Đồng Bộ Tiêu Chuẩn Thành Công',
              message: `Đã nạp thành công tiêu chuẩn từ file Excel:\n• ${parsed.works.length} nhóm công việc xây dựng (Sheet A)\n• ${parsed.materials.length} loại vật liệu nghiệm thu (Sheet B)`
            });
          } else {
            alert(`✅ Đã đồng bộ thành công tiêu chuẩn từ file Excel!\n• ${parsed.works.length} nhóm công việc xây dựng (Sheet A)\n• ${parsed.materials.length} loại vật liệu nghiệm thu (Sheet B)`);
          }
        } else {
          if (showAlert) {
            showAlert({
              type: 'danger',
              title: 'Lỗi Đọc File Excel',
              message: 'Không thể đọc dữ liệu tiêu chuẩn từ file này. Vui lòng kiểm tra lại định dạng file Excel (.xls, .xlsx).'
            });
          } else {
            alert('Không thể đọc dữ liệu tiêu chuẩn từ file này. Vui lòng kiểm tra lại định dạng file Excel.');
          }
        }
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleAddStandard = (e) => {
    e.preventDefault();
    if (!newStandardCode || !newStandardTitle) return;
    setStandards(prev => [
      ...prev,
      { id: `tcvn_${Date.now()}`, code: newStandardCode.trim(), title: newStandardTitle.trim() }
    ]);
    setNewStandardCode('');
    setNewStandardTitle('');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '1050px', height: '90vh' }}>
        <div className="modal-header" style={{ background: '#faf5ff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#f3e8ff', padding: '8px', borderRadius: '10px', color: '#7e22ce' }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#581c87' }}>
                Phân Hệ Quản Trị Hệ Thống (Admin Portal)
              </h3>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '0 24px', overflowX: 'auto' }}>
          <button 
            style={{
              padding: '12px 18px',
              border: 'none',
              background: activeTab === 'USERS' ? '#ffffff' : 'transparent',
              fontWeight: 700,
              fontSize: '0.88rem',
              color: activeTab === 'USERS' ? '#7e22ce' : '#64748b',
              borderBottom: activeTab === 'USERS' ? '2px solid #7e22ce' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
            onClick={() => setActiveTab('USERS')}
          >
            <Users size={16} />
            <span>Quản Lý Cán Bộ ({users.length})</span>
          </button>

          <button 
            style={{
              padding: '12px 18px',
              border: 'none',
              background: activeTab === 'STANDARDS' ? '#ffffff' : 'transparent',
              fontWeight: 700,
              fontSize: '0.88rem',
              color: activeTab === 'STANDARDS' ? '#7e22ce' : '#64748b',
              borderBottom: activeTab === 'STANDARDS' ? '2px solid #7e22ce' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
            onClick={() => setActiveTab('STANDARDS')}
          >
            <BookOpen size={16} />
            <span>Thư Viện Tiêu Chuẩn (TCVN)</span>
          </button>

          <button 
            style={{
              padding: '12px 18px',
              border: 'none',
              background: activeTab === 'CONFIG' ? '#ffffff' : 'transparent',
              fontWeight: 700,
              fontSize: '0.88rem',
              color: activeTab === 'CONFIG' ? '#7e22ce' : '#64748b',
              borderBottom: activeTab === 'CONFIG' ? '2px solid #7e22ce' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
            onClick={() => setActiveTab('CONFIG')}
          >
            <Settings size={16} />
            <span>Cấu Hình Firebase & Cloudinary</span>
          </button>
        </div>

        <div className="modal-body" style={{ padding: '24px' }}>
          {/* TAB 1: DANH SÁCH NGƯỜI DÙNG */}
          {activeTab === 'USERS' && (
            <UserManagementView
              users={users}
              currentUser={currentUser}
              onAddUser={onAddUser}
              onUpdateUser={onUpdateUser}
              onDeleteUser={onDeleteUser}
              onUpdateUserRole={onUpdateUserRole}
              onToggleUserStatus={onToggleUserStatus}
            />
          )}

          {/* TAB 2: THƯ VIỆN TIÊU CHUẨN XÂY DỰNG THEO FILE EXCEL */}
          {activeTab === 'STANDARDS' && (
            <div>
              {/* THANH CÔNG CỤ NHẬP EXCEL & PHÂN LOẠI */}
              <div style={{
                background: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                borderRadius: '12px',
                padding: '14px 18px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileSpreadsheet size={20} color="#16a34a" />
                    <strong style={{ fontSize: '1rem', color: '#1e293b' }}>
                      Thư Viện Tiêu Chuẩn Nghiệm Thu Động (Excel Engine)
                    </strong>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                    Đã nạp toàn bộ danh mục từ <strong>DANH MỤC TIÊU CHUẨN NGHIỆM THU.xls</strong> & <strong>Mẫu số 12</strong>
                  </div>
                </div>

                <div>
                  <input 
                    ref={excelInputRef}
                    type="file"
                    accept=".xls,.xlsx"
                    style={{ display: 'none' }}
                    onChange={handleUploadExcelStandards}
                  />
                  <button
                    type="button"
                    onClick={() => excelInputRef.current?.click()}
                    style={{
                      background: '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Upload size={16} />
                    <span>Tải Lên File Excel Tiêu Chuẩn Mới</span>
                  </button>
                </div>
              </div>

              {/* SUB-TABS PHÂN LOẠI */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setStandardsSubTab('ALL')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: standardsSubTab === 'ALL' ? '#1e293b' : '#ffffff',
                    color: standardsSubTab === 'ALL' ? '#ffffff' : '#475569',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Tất Cả ({workStandardsList.length + materialStandardsList.length + GENERAL_MANDATORY_STANDARDS.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStandardsSubTab('WORK')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #93c5fd',
                    background: standardsSubTab === 'WORK' ? '#2563eb' : '#eff6ff',
                    color: standardsSubTab === 'WORK' ? '#ffffff' : '#1d4ed8',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🏗️ Sheet A: Công Việc Xây Dựng ({workStandardsList.length} nhóm)
                </button>
                <button
                  type="button"
                  onClick={() => setStandardsSubTab('MATERIAL')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #86efac',
                    background: standardsSubTab === 'MATERIAL' ? '#16a34a' : '#f0fdf4',
                    color: standardsSubTab === 'MATERIAL' ? '#ffffff' : '#15803d',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  📦 Sheet B: Vật Liệu Đầu Vào - Mẫu 12 ({materialStandardsList.length} loại)
                </button>
                <button
                  type="button"
                  onClick={() => setStandardsSubTab('MANDATORY')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #fde047',
                    background: standardsSubTab === 'MANDATORY' ? '#ca8a04' : '#fefce8',
                    color: standardsSubTab === 'MANDATORY' ? '#ffffff' : '#a16207',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ⚖️ Bắt Buộc Chung ({GENERAL_MANDATORY_STANDARDS.length})
                </button>
              </div>

              {/* DANH SÁCH TIÊU CHUẨN HIỂN THỊ */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '55vh', overflowY: 'auto' }}>
                {/* 1. Tiêu chuẩn bắt buộc chung */}
                {(standardsSubTab === 'ALL' || standardsSubTab === 'MANDATORY') && (
                  <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: '10px', padding: '14px' }}>
                    <div style={{ fontWeight: 800, color: '#854d0e', fontSize: '0.92rem', marginBottom: '8px' }}>
                      ⚖️ TIÊU CHUẨN PHÁP LÝ BẮT BUỘC CHUNG
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {GENERAL_MANDATORY_STANDARDS.map((std, idx) => (
                        <div key={idx} style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '6px', fontSize: '0.84rem', border: '1px solid #fef9c3', display: 'flex', gap: '8px' }}>
                          <span style={{ color: '#b91c1c', fontWeight: 700 }}>•</span>
                          <span style={{ color: '#1e293b' }}>{std}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Sheet A: Công việc xây dựng */}
                {(standardsSubTab === 'ALL' || standardsSubTab === 'WORK') && (
                  <div>
                    <div style={{ fontWeight: 800, color: '#1e40af', fontSize: '0.92rem', margin: '8px 0' }}>
                      🏗️ NHÓM CÔNG VIỆC XÂY DỰNG (SHEET A - {workStandardsList.length} MỤC)
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {workStandardsList.map(item => (
                        <div key={item.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <strong style={{ color: '#0f172a', fontSize: '0.9rem' }}>
                              Mục {item.stt}: {item.name}
                            </strong>
                            <span style={{ fontSize: '0.72rem', background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                              {item.standards.length} tiêu chuẩn áp dụng
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '8px' }}>
                            {item.standards.map((s, idx) => (
                              <div key={idx} style={{ fontSize: '0.82rem', color: '#475569', display: 'flex', gap: '6px' }}>
                                <span style={{ color: '#b91c1c', fontWeight: 700 }}>+</span>
                                <span>{s}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Sheet B: Vật liệu đầu vào */}
                {(standardsSubTab === 'ALL' || standardsSubTab === 'MATERIAL') && (
                  <div>
                    <div style={{ fontWeight: 800, color: '#166534', fontSize: '0.92rem', margin: '12px 0 8px 0' }}>
                      📦 VẬT LIỆU ĐẦU VÀO TRƯỚC KHI ĐƯA VÀO SỬ DỤNG - MẪU SỐ 12 (SHEET B - {materialStandardsList.length} LOẠI)
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {materialStandardsList.map(item => (
                        <div key={item.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <strong style={{ color: '#0f172a', fontSize: '0.9rem' }}>
                              Mục {item.stt}: {item.name}
                            </strong>
                            <span style={{ fontSize: '0.72rem', background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                              {item.standards.length} tiêu chuẩn áp dụng
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '8px' }}>
                            {item.standards.map((s, idx) => (
                              <div key={idx} style={{ fontSize: '0.82rem', color: '#475569', display: 'flex', gap: '6px' }}>
                                <span style={{ color: '#b91c1c', fontWeight: 700 }}>+</span>
                                <span>{s}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CẤU HÌNH CLOUD & ENVIRONMENT */}
          {activeTab === 'CONFIG' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Cloud size={18} color="#2563eb" />
                  <strong style={{ fontSize: '0.95rem' }}>Trạng Thái Kết Nối Firebase & Firestore:</strong>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.6 }}>
                  • <strong>Chế độ hoạt động hiện tại:</strong> <span style={{ color: '#059669', fontWeight: 'bold' }}>Demo Mode (Mô phỏng đầy đủ dữ liệu offline)</span><br />
                  • <strong>Firestore Collection:</strong> <code>projects</code>, <code>inspection_requests</code>, <code>inspection_reports</code>, <code>users</code><br />
                  • <strong>Firebase Cloud Messaging (FCM):</strong> Đã tích hợp sẵn Service Worker mẫu <code>firebase-messaging-sw.js</code><br />
                  • <strong>File cấu hình:</strong> Sẵn sàng tại <code>.env.example</code>. Chỉ cần điền các khóa API thật là hệ thống tự động kết nối Real Cloud!
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Cloud size={18} color="#059669" />
                  <strong style={{ fontSize: '0.95rem' }}>Trạng Thái Lưu Trữ Ảnh Hiện Trường (Cloudinary):</strong>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.6 }}>
                  • <strong>Preset Upload:</strong> <code>apct_unsigned</code> (Hỗ trợ upload ảnh trực tiếp không lộ secret key)<br />
                  • <strong>Tự động đóng dấu GPS & Timestamp:</strong> Kích hoạt trên ảnh hiện trường<br />
                  • <strong>Định dạng nén tự động:</strong> WebP (Giảm 75% dung lượng để tải siêu nhanh ngoài công trường sóng yếu)
                </div>
              </div>

              {/* KHU VỰC RESET DỮ LIỆU ĐỂ TEST LẠI */}
              {onResetAllData && (
                <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '10px', padding: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <RotateCcw size={18} color="#e11d48" />
                        <strong style={{ fontSize: '0.95rem', color: '#9f1239' }}>Khởi Động Lại Toàn Bộ Dữ Liệu Nghiệm Thu:</strong>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#881337', lineHeight: 1.5 }}>
                        Xóa sạch toàn bộ Phiếu yêu cầu, Biên bản nghiệm thu và Thông báo trên Cloud Firestore & bộ nhớ máy để bắt đầu kiểm thử lại quy trình từ đầu.
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={onResetAllData}
                      style={{
                        background: '#e11d48',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 16px',
                        fontWeight: 700,
                        fontSize: '0.86rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 2px 8px rgba(225, 29, 72, 0.25)'
                      }}
                    >
                      <RotateCcw size={16} />
                      <span>Xóa Dữ Liệu & Test Lại Từ Đầu</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Đóng Admin Portal
          </button>
        </div>
      </div>
    </div>
  );
}
