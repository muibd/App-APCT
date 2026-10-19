import React, { useState } from 'react';
import { X, ShieldCheck, Users, BookOpen, Settings, Activity, Plus, Check, Cloud, RotateCcw } from 'lucide-react';
import { STANDARD_CRITERIA_LIST } from '../data/mockData';
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
  onResetAllData
}) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('USERS'); // 'USERS' | 'STANDARDS' | 'CONFIG' | 'LOGS'
  const [standards, setStandards] = useState(STANDARD_CRITERIA_LIST);
  const [newStandardCode, setNewStandardCode] = useState('');
  const [newStandardTitle, setNewStandardTitle] = useState('');

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

          {/* TAB 2: THƯ VIỆN TIÊU CHUẨN XÂY DỰNG */}
          {activeTab === 'STANDARDS' && (
            <div>
              <form onSubmit={handleAddStandard} style={{ 
                background: '#f8fafc', 
                border: '1px solid #e2e8f0', 
                borderRadius: '10px', 
                padding: '16px', 
                marginBottom: '20px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr)) 120px',
                gap: '10px',
                alignItems: 'end'
              }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Mã số tiêu chuẩn (Code):</label>
                  <input 
                    type="text" 
                    placeholder="VD: TCVN 4453:1995" 
                    className="form-input" 
                    value={newStandardCode} 
                    onChange={(e) => setNewStandardCode(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Tên tiêu chuẩn / Quy chuẩn:</label>
                  <input 
                    type="text" 
                    placeholder="VD: Kết cấu bê tông và bê tông cốt thép..." 
                    className="form-input" 
                    value={newStandardTitle} 
                    onChange={(e) => setNewStandardTitle(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ padding: '9px 12px', fontSize: '0.85rem' }}>
                  <Plus size={16} />
                  <span>Thêm Mới</span>
                </button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {standards.map(s => (
                  <div key={s.id} style={{ 
                    padding: '10px 14px', 
                    background: '#ffffff', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <span style={{ fontWeight: 'bold', color: '#b91c1c', fontSize: '0.85rem', minWidth: '150px' }}>
                      {s.code}
                    </span>
                    <span style={{ fontSize: '0.88rem', color: '#334155' }}>
                      {s.title}
                    </span>
                  </div>
                ))}
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
