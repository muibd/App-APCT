import React from 'react';
import { Shield, HardHat, Eye, Briefcase, Bell, BellRing, Check, Award } from 'lucide-react';

export default function RoleBanner({ 
  currentRole, 
  onSelectRole, 
  onTriggerDemoPush,
  onEnablePush,
  pushPermissionGranted
}) {
  const roles = [
    { id: 'ADMIN', label: '1. Admin', sub: 'Quản trị hệ thống', icon: Shield, color: '#9333ea' },
    { id: 'CONTRACTOR', label: '2. ĐV Thi công', sub: 'Tạo phiếu nghiệm thu', icon: HardHat, color: '#2563eb' },
    { id: 'SUPERVISOR', label: '3. TV Giám sát', sub: 'Kiểm tra & ký duyệt', icon: Eye, color: '#059669' },
    { id: 'LEAD_SUPERVISOR', label: '4. TVGS Trưởng', sub: 'Xem mọi phiếu TVGS & duyệt phiếu của mình', icon: Award, color: '#047857' },
    { id: 'INVESTOR', label: '5. Đại diện CĐT', sub: 'Ban QLDA kiểm tra', icon: Briefcase, color: '#d97706' },
    { id: 'LEAD_INVESTOR', label: '6. CĐT Trưởng', sub: 'Trưởng ban QLDA xem mọi phiếu CĐT & duyệt phiếu của mình', icon: Award, color: '#b45309' },
  ];

  return (
    <div className="role-banner">
      <div className="role-banner-info">
        <span>🔄 Chuyển vai trò thử nghiệm:</span>
        <span className="role-banner-badge" style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}>
          Đang là: {roles.find(r => r.id === currentRole)?.label || currentRole}
        </span>
      </div>

      <div className="role-switcher-buttons">
        {roles.map((r) => {
          const Icon = r.icon;
          const isActive = currentRole === r.id;
          return (
            <button
              key={r.id}
              onClick={() => onSelectRole(r.id)}
              className={`role-btn ${isActive ? 'active' : ''}`}
              title={r.sub}
            >
              <Icon size={14} />
              <span>{r.label}</span>
            </button>
          );
        })}

        {!pushPermissionGranted ? (
          <button
            onClick={onEnablePush}
            className="role-btn"
            style={{ background: 'rgba(16, 185, 129, 0.25)', borderColor: '#10b981', color: '#6ee7b7' }}
            title="Cấp quyền Web Push để nhận thông báo cả khi tắt màn hình"
          >
            <BellRing size={13} />
            <span>Bật Web Push</span>
          </button>
        ) : (
          <span style={{ fontSize: '0.75rem', color: '#6ee7b7', display: 'flex', alignItems: 'center', gap: '4px', padding: '0 6px' }}>
            <Check size={13} /> Web Push Đã Bật
          </span>
        )}

        <button
          onClick={onTriggerDemoPush}
          className="role-btn"
          style={{ background: 'rgba(245, 158, 11, 0.2)', borderColor: '#f59e0b', color: '#fbbf24' }}
          title="Mô phỏng nhận Push Notification khi tắt app"
        >
          <Bell size={13} />
          <span>Mô phỏng Push FCM</span>
        </button>
      </div>
    </div>
  );
}
