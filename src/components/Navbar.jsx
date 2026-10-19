import React, { useState } from 'react';
import { Building2, Bell, ShieldCheck, UserCircle, LogOut, BellRing, RotateCcw } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar({ 
  currentRole, 
  currentUser, 
  unreadCount = 0,
  notifications = [],
  onMarkAllAsRead,
  onMarkAsRead,
  onDeleteNotification,
  onClearAllNotifications,
  onSelectNotification,
  onOpenAdmin,
  onOpenProfile,
  onLogout,
  pushPermissionGranted,
  onEnablePush,
  onResetAllData
}) {
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'ADMIN': return { bg: '#f3e8ff', color: '#7e22ce', text: 'Admin', fullText: 'Quản Trị Viên (Admin)' };
      case 'CONTRACTOR': return { bg: '#eff6ff', color: '#1d4ed8', text: 'ĐVTC', fullText: 'Đơn Vị Thi Công (ĐVTC)' };
      case 'SUPERVISOR': return { bg: '#ecfdf5', color: '#047857', text: 'TVGS', fullText: 'Tư Vấn Giám Sát (TVGS)' };
      case 'LEAD_SUPERVISOR': return { bg: '#f0fdf4', color: '#15803d', text: 'TVGS Trưởng', fullText: 'Tư Vấn Giám Sát Trưởng' };
      case 'INVESTOR': return { bg: '#fffbeb', color: '#b45309', text: 'CĐT', fullText: 'Đại Diện Chủ Đầu Tư (CĐT)' };
      case 'LEAD_INVESTOR': return { bg: '#fef3c7', color: '#b45309', text: 'CĐT Trưởng', fullText: 'Đại Diện Chủ Đầu Tư Trưởng' };
      default: return { bg: '#f1f5f9', color: '#475569', text: role, fullText: role };
    }
  };

  const badge = getRoleBadgeStyle(currentRole);

  return (
    <header className="app-header">
      {/* BRAND & LOGO */}
      <div className="header-left">
        <div className="brand-box">
          <div className="brand-logo-icon">
            <Building2 size={20} />
          </div>
          <div className="brand-text">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h1 className="brand-title">APCT</h1>
              <span 
                className="brand-role-chip"
                style={{ 
                  background: badge.bg, 
                  color: badge.color, 
                  borderColor: badge.color 
                }}
              >
                {badge.text}
              </span>
            </div>
            <span className="brand-subtitle-desktop">Quản Lý Chất Lượng Xây Dựng</span>
          </div>
        </div>

        <div className="project-selector">
          🏢 <strong>Dự án:</strong> An Phú Eco City - Cần Thơ
        </div>
      </div>

      {/* HEADER ACTIONS */}
      <div className="header-right">
        {/* PUSH BUTTON (DESKTOP ONLY) */}
        {!pushPermissionGranted && onEnablePush && (
          <button 
            className="btn-enable-push desktop-only-action"
            onClick={onEnablePush}
            title="Bật nhận thông báo đẩy Web Push FCM"
          >
            <BellRing size={14} />
            <span className="push-btn-text">Bật Push</span>
          </button>
        )}

        {/* ADMIN PORTAL BUTTON (DESKTOP ONLY) */}
        {currentRole === 'ADMIN' && (
          <button 
            className="btn-secondary desktop-only-action" 
            style={{ padding: '6px 12px', fontSize: '0.82rem' }}
            onClick={onOpenAdmin}
          >
            <ShieldCheck size={16} color="#7e22ce" />
            <span>Admin Portal</span>
          </button>
        )}

        {/* NÚT RESET DỮ LIỆU ĐỂ TEST TỪ ĐẦU (DESKTOP ONLY) */}
        {onResetAllData && (
          <button 
            className="btn-secondary desktop-only-action" 
            style={{ 
              padding: '6px 12px', 
              fontSize: '0.82rem', 
              borderColor: '#fca5a5', 
              color: '#dc2626', 
              background: '#fff5f5' 
            }}
            onClick={onResetAllData}
            title="Xóa toàn bộ biên bản & phiếu để test lại từ đầu"
          >
            <RotateCcw size={14} color="#dc2626" />
            <span>Reset Data</span>
          </button>
        )}

        {/* NOTIFICATION BELL */}
        <div style={{ position: 'relative' }}>
          <button 
            className="btn-icon-badge"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            title="Thông báo hệ thống"
            aria-label="Thông báo"
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="badge-count">{unreadCount}</span>}
          </button>

          <NotificationDropdown
            isOpen={isNotifOpen}
            onClose={() => setIsNotifOpen(false)}
            notifications={notifications}
            onMarkAllAsRead={onMarkAllAsRead}
            onMarkAsRead={onMarkAsRead}
            onDeleteNotification={onDeleteNotification}
            onClearAllNotifications={onClearAllNotifications}
            onSelectNotification={(notif) => {
              if (onSelectNotification) onSelectNotification(notif);
              setIsNotifOpen(false);
            }}
          />
        </div>

        {/* USER PROFILE AVATAR / PILL */}
        <div 
          className="user-profile-pill" 
          onClick={onOpenProfile}
          title="Thông tin tài khoản & Cài đặt"
          role="button"
          tabIndex={0}
        >
          <div 
            className="avatar-circle"
            style={{ background: badge.color }}
          >
            {currentUser?.avatar || 'NV'}
          </div>
          <div className="user-meta-text">
            <div className="user-name">{currentUser?.fullName || 'Người dùng'}</div>
            <div className="user-role-title" style={{ color: badge.color, fontWeight: 700 }}>
              {badge.fullText}
            </div>
          </div>
        </div>

        {/* LOGOUT BUTTON (DESKTOP ONLY) */}
        <button
          onClick={onLogout}
          className="btn-secondary desktop-only-action"
          style={{ 
            padding: '6px 12px', 
            fontSize: '0.82rem', 
            color: '#ef4444', 
            borderColor: '#fecaca', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px' 
          }}
          title="Đăng xuất khỏi hệ thống"
        >
          <LogOut size={15} />
          <span className="logout-btn-text">Đăng xuất</span>
        </button>
      </div>
    </header>
  );
}
