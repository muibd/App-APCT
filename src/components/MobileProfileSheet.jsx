import React from 'react';
import { 
  X, UserCircle, ShieldCheck, BellRing, LogOut, Building, 
  HardHat, Eye, Briefcase, CheckCircle2, ChevronRight, Sparkles, RotateCcw 
} from 'lucide-react';
import { isIOSDevice, isStandalonePWA } from '../services/notificationService';

export default function MobileProfileSheet({
  isOpen,
  onClose,
  currentUser,
  currentRole,
  users = [],
  onSwitchUser,
  onOpenAdmin,
  onLogout,
  pushPermissionGranted,
  onEnablePush,
  onResetAllData
}) {
  if (!isOpen) return null;

  const getRoleDetails = (role) => {
    switch (role) {
      case 'ADMIN':
        return { 
          name: 'Quản Trị Viên (Admin)', 
          icon: ShieldCheck, 
          bg: '#f3e8ff', 
          color: '#7e22ce',
          desc: 'Toàn quyền quản trị nhân sự, TCVN & phân quyền'
        };
      case 'CONTRACTOR':
        return { 
          name: 'Đơn Vị Thi Công (ĐVTC)', 
          icon: HardHat, 
          bg: '#eff6ff', 
          color: '#1d4ed8',
          desc: 'Lập phiếu yêu cầu nghiệm thu, khắc phục lỗi & gửi lại'
        };
      case 'SUPERVISOR':
        return { 
          name: 'Tư Vấn Giám Sát (TVGS)', 
          icon: Eye, 
          bg: '#ecfdf5', 
          color: '#047857',
          desc: 'Trực tiếp đánh giá tại hiện trường, duyệt hoặc từ chối NT'
        };
      case 'INVESTOR':
        return { 
          name: 'Chủ Đầu Tư (Ban QLDA)', 
          icon: Briefcase, 
          bg: '#fffbeb', 
          color: '#b45309',
          desc: 'Giám sát chủ quản, ký xác nhận & phê duyệt hoàn tất'
        };
      default:
        return { 
          name: role, 
          icon: UserCircle, 
          bg: '#f1f5f9', 
          color: '#475569',
          desc: 'Cán bộ kỹ thuật'
        };
    }
  };

  const currentRoleInfo = getRoleDetails(currentRole);
  const CurrentIcon = currentRoleInfo.icon;

  return (
    <div className="mobile-sheet-overlay" onClick={onClose}>
      <div 
        className="mobile-sheet-content" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* DRAG HANDLE */}
        <div className="sheet-drag-handle-bar">
          <div className="sheet-drag-pill" />
        </div>

        {/* SHEET HEADER */}
        <div className="sheet-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div 
              className="avatar-circle" 
              style={{ 
                width: '48px', 
                height: '48px', 
                fontSize: '1.1rem',
                background: currentRoleInfo.color,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              {currentUser?.avatar || 'NV'}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>
                {currentUser?.fullName || 'Người dùng'}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                <span 
                  style={{ 
                    fontSize: '0.72rem', 
                    padding: '2px 8px', 
                    borderRadius: '9999px',
                    background: currentRoleInfo.bg,
                    color: currentRoleInfo.color,
                    fontWeight: 700 
                  }}
                >
                  {currentRoleInfo.name}
                </span>
              </div>
            </div>
          </div>

          <button 
            className="sheet-close-btn" 
            onClick={onClose}
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* SHEET BODY */}
        <div className="sheet-body">
          {/* USER INFO CARD */}
          <div className="sheet-info-card">
            <div className="sheet-info-row">
              <span className="sheet-info-label">🏢 Đơn vị:</span>
              <strong className="sheet-info-value">{currentUser?.company || 'Công ty CP Xây Dựng'}</strong>
            </div>
            <div className="sheet-info-row">
              <span className="sheet-info-label">💼 Chức vụ:</span>
              <strong className="sheet-info-value">{currentUser?.position || 'Kỹ thuật'}</strong>
            </div>
            <div className="sheet-info-row">
              <span className="sheet-info-label">📍 Dự án:</span>
              <strong className="sheet-info-value" style={{ color: '#2563eb' }}>An Phú Eco City - Cần Thơ</strong>
            </div>
          </div>

          {/* NHANH CHUYỂN ĐỔI TÀI KHOẢN / VAI TRÒ ĐỂ TEST */}
          <div className="sheet-section">
            <div className="sheet-section-title">
              <Sparkles size={16} color="#7e22ce" />
              <span>Chuyển Đổi Nhanh Tài Khoản (Để Thử Nghiệm)</span>
            </div>
            <p className="sheet-section-desc">
              Chạm vào bất kỳ cán bộ dưới đây để đổi ngay vai trò mà không cần đăng nhập lại:
            </p>

            <div className="sheet-users-list">
              {users.map((u) => {
                const info = getRoleDetails(u.role);
                const isCurrent = u.uid === currentUser?.uid;
                const RoleIcon = info.icon;

                return (
                  <button
                    key={u.uid}
                    type="button"
                    className={`sheet-user-item ${isCurrent ? 'active' : ''}`}
                    onClick={() => {
                      if (onSwitchUser) onSwitchUser(u);
                      onClose();
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div 
                        className="avatar-circle" 
                        style={{ 
                          width: '36px', 
                          height: '36px', 
                          fontSize: '0.85rem',
                          background: isCurrent ? '#2563eb' : '#94a3b8' 
                        }}
                      >
                        {u.avatar || u.fullName.slice(0, 2)}
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: isCurrent ? '#1e3a8a' : '#0f172a' }}>
                          {u.fullName} {isCurrent && '✓'}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                          {u.position} • {info.name}
                        </div>
                      </div>
                    </div>

                    <span 
                      style={{ 
                        fontSize: '0.7rem', 
                        padding: '3px 8px', 
                        borderRadius: '6px',
                        background: info.bg,
                        color: info.color,
                        fontWeight: 700
                      }}
                    >
                      {u.role}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* QUẢN TRỊ ADMIN (NẾU ROLE LÀ ADMIN) */}
          {currentRole === 'ADMIN' && (
            <button 
              type="button"
              className="sheet-action-button"
              style={{ background: '#f5f3ff', borderColor: '#ddd6fe', color: '#7c3aed' }}
              onClick={() => {
                onClose();
                if (onOpenAdmin) onOpenAdmin();
              }}
            >
              <ShieldCheck size={18} />
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Mở Bảng Quản Trị Hệ Thống (Admin Portal)</div>
                <div style={{ fontSize: '0.74rem', color: '#6b21a8' }}>Quản lý cán bộ & Tiêu chuẩn TCVN</div>
              </div>
              <ChevronRight size={16} />
            </button>
          )}

          {/* THÔNG BÁO PUSH FCM */}
          {(() => {
            const isIOS = isIOSDevice();
            const isStandalone = isStandalonePWA();
            const isIOSNeedsPWA = isIOS && !isStandalone;

            return (
              <div className="sheet-push-box" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: pushPermissionGranted ? '#dcfce7' : '#fef3c7', padding: '8px', borderRadius: '10px', color: pushPermissionGranted ? '#16a34a' : '#d97706' }}>
                      <BellRing size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>
                        Thông báo đẩy Web Push
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        {pushPermissionGranted 
                          ? 'Đã kích hoạt trên thiết bị này' 
                          : isIOSNeedsPWA 
                            ? 'Chưa bật (iOS: Cần cài ra MH chính)'
                            : 'Chưa bật thông báo nền'}
                      </div>
                    </div>
                  </div>

                  {!pushPermissionGranted && onEnablePush && (
                    <button 
                      type="button"
                      className="btn-enable-push"
                      style={{ padding: '6px 14px', fontSize: '0.78rem', flexShrink: 0 }}
                      onClick={() => {
                        onEnablePush();
                      }}
                    >
                      Bật Thông Báo
                    </button>
                  )}
                </div>

                {!pushPermissionGranted && isIOSNeedsPWA && (
                  <div 
                    onClick={onEnablePush}
                    style={{ 
                      background: '#f8fafc', 
                      border: '1px dashed #cbd5e1', 
                      borderRadius: '10px', 
                      padding: '8px 12px', 
                      fontSize: '0.74rem', 
                      color: '#475569',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '6px'
                    }}
                  >
                    <span>📱 iPhone cần thêm vào MH chính & tắt tab "Riêng tư"</span>
                    <span style={{ color: '#2563eb', fontWeight: 700, flexShrink: 0 }}>Xem cách làm →</span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* NÚT XÓA DỮ LIỆU ĐỂ TEST LẠI TỪ ĐẦU */}
          {onResetAllData && (
            <div style={{ marginTop: '14px' }}>
              <button 
                type="button"
                className="sheet-action-button"
                style={{ 
                  background: '#fef2f2', 
                  borderColor: '#fca5a5', 
                  color: '#dc2626' 
                }}
                onClick={() => {
                  onClose();
                  onResetAllData();
                }}
              >
                <RotateCcw size={18} />
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Xóa Biên Bản & Test Lại Từ Đầu</div>
                  <div style={{ fontSize: '0.74rem', color: '#991b1b' }}>Dọn sạch phiếu và biên bản trên toàn hệ thống</div>
                </div>
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* NÚT ĐĂNG XUẤT */}
          <div style={{ marginTop: '20px', paddingBottom: '10px' }}>
            <button 
              type="button"
              className="sheet-logout-btn"
              onClick={() => {
                onClose();
                onLogout();
              }}
            >
              <LogOut size={18} />
              <span>Đăng Xuất Khỏi Hệ Thống</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
