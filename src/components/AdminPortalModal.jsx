import React, { useState } from 'react';
import { X, ShieldCheck, Users, BookOpen, Settings, Cloud, Building2, Clock } from 'lucide-react';
import UserManagementView from './UserManagementView';
import StandardsManagementView from './StandardsManagementView';
import ProjectManagementView from './ProjectManagementView';
import ShopSlaManagementView from './ShopSlaManagementView';

export default function AdminPortalModal({ 
  isOpen, 
  onClose, 
  users, 
  currentUser,
  standardsData,
  projects = [],
  docTypes = [],
  slaConfigs = [],
  onSaveProjects,
  onSaveDocTypes,
  onSaveStandards,
  onSyncStandardsToCloud,
  onSaveSlaConfigs,
  onSyncSlaToCloud,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onUpdateUserRole,
  onToggleUserStatus,
  onSyncAllUsersToCloud,
  showAlert
}) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('PROJECTS'); // 'PROJECTS' | 'USERS' | 'STANDARDS' | 'SHOP_SLA' | 'CONFIG'
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
              background: activeTab === 'PROJECTS' ? '#ffffff' : 'transparent',
              fontWeight: 700,
              fontSize: '0.88rem',
              color: activeTab === 'PROJECTS' ? '#7e22ce' : '#64748b',
              borderBottom: activeTab === 'PROJECTS' ? '2px solid #7e22ce' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
            onClick={() => setActiveTab('PROJECTS')}
          >
            <Building2 size={16} />
            <span>Quản Lý Công Trình & Mã Loại ({projects.length})</span>
          </button>

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
              background: activeTab === 'SHOP_SLA' ? '#ffffff' : 'transparent',
              fontWeight: 700,
              fontSize: '0.88rem',
              color: activeTab === 'SHOP_SLA' ? '#7e22ce' : '#64748b',
              borderBottom: activeTab === 'SHOP_SLA' ? '2px solid #7e22ce' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
            onClick={() => setActiveTab('SHOP_SLA')}
          >
            <Clock size={16} />
            <span>Thời Hạn Phản Hồi Shop</span>
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
          {/* TAB 0: QUẢN LÝ CÔNG TRÌNH & MÃ LOẠI VĂN BẢN */}
          {activeTab === 'PROJECTS' && (
            <ProjectManagementView
              projects={projects}
              docTypes={docTypes}
              onSaveProjects={onSaveProjects}
              onSaveDocTypes={onSaveDocTypes}
              showAlert={showAlert}
            />
          )}

          {/* TAB SHOP SLA: QUẢN LÝ THỜI HẠN PHẢN HỒI HỒ SƠ SHOP */}
          {activeTab === 'SHOP_SLA' && (
            <ShopSlaManagementView
              slaConfigs={slaConfigs}
              onSaveSlaConfigs={onSaveSlaConfigs}
              onSyncSlaToCloud={onSyncSlaToCloud}
              showAlert={showAlert}
            />
          )}

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
              onSyncAllUsersToCloud={onSyncAllUsersToCloud}
            />
          )}

          {/* TAB 2: THƯ VIỆN TIÊU CHUẨN XÂY DỰNG THEO HẠNG MỤC (ADMIN QUẢN LÝ) */}
          {activeTab === 'STANDARDS' && (
            <StandardsManagementView
              standardsData={standardsData}
              onSaveStandards={onSaveStandards}
              onSyncStandardsToCloud={onSyncStandardsToCloud}
              showAlert={showAlert}
            />
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
