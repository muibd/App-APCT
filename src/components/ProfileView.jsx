import React, { useState } from 'react';
import {
  User, Mail, Lock, Phone, Building, ShieldCheck, Eye, EyeOff,
  CheckCircle2, AlertCircle, KeyRound, Award, HardHat
} from 'lucide-react';

export default function ProfileView({ currentUser, onUpdateProfile }) {
  // State Đổi mật khẩu
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passSuccessMsg, setPassSuccessMsg] = useState('');
  const [passErrorMsg, setPassErrorMsg] = useState('');
  const [isSavingPass, setIsSavingPass] = useState(false);

  if (!currentUser) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
        Không tìm thấy thông tin tài khoản hiện tại.
      </div>
    );
  }

  // Lấy chi tiết vai trò
  const getRoleDetails = (role) => {
    switch (role) {
      case 'ADMIN':
        return {
          name: 'Chủ Đầu Tư - CĐT (Admin)',
          tag: 'CĐT',
          icon: ShieldCheck,
          bg: '#f3e8ff',
          color: '#7e22ce',
          border: '#d8b4fe'
        };
      case 'CONTRACTOR':
        return {
          name: 'Đơn Vị Thi Công (ĐVTC)',
          tag: 'ĐVTC',
          icon: HardHat,
          bg: '#eff6ff',
          color: '#1d4ed8',
          border: '#bfdbfe'
        };
      case 'SUPERVISOR':
        return {
          name: 'Tư Vấn Giám Sát (TVGS)',
          tag: 'TVGS',
          icon: Eye,
          bg: '#ecfdf5',
          color: '#047857',
          border: '#a7f3d0'
        };
      case 'LEAD_SUPERVISOR':
        return {
          name: 'Tư Vấn Giám Sát Trưởng',
          tag: 'TVGS Trưởng',
          icon: Award,
          bg: '#f0fdf4',
          color: '#15803d',
          border: '#86efac'
        };
      case 'INVESTOR':
        return {
          name: 'Ban Quản Lý Dự Án (Ban QLDA)',
          tag: 'Ban QLDA',
          icon: ShieldCheck,
          bg: '#fffbeb',
          color: '#b45309',
          border: '#fde68a'
        };
      case 'LEAD_INVESTOR':
        return {
          name: 'Trưởng Ban Quản Lý Dự Án',
          tag: 'Trưởng Ban QLDA',
          icon: Award,
          bg: '#fef3c7',
          color: '#b45309',
          border: '#fcd34d'
        };
      default:
        return {
          name: role || 'Cán Bộ Kỹ Thuật',
          tag: role,
          icon: User,
          bg: '#f1f5f9',
          color: '#475569',
          border: '#cbd5e1'
        };
    }
  };

  const roleInfo = getRoleDetails(currentUser.role);
  const RoleIcon = roleInfo.icon;

  // Xử lý Đổi Mật Khẩu
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassSuccessMsg('');
    setPassErrorMsg('');

    const actualPass = currentUser.password || '123456';

    if (!currentPassword) {
      setPassErrorMsg('Vui lòng nhập mật khẩu hiện tại!');
      return;
    }

    if (currentPassword !== actualPass) {
      setPassErrorMsg('Mật khẩu hiện tại không chính xác!');
      return;
    }

    if (!newPassword.trim()) {
      setPassErrorMsg('Vui lòng nhập mật khẩu mới!');
      return;
    }

    if (newPassword.trim().length < 4) {
      setPassErrorMsg('Mật khẩu mới phải có tối thiểu 4 ký tự!');
      return;
    }

    if (newPassword === currentPassword) {
      setPassErrorMsg('Mật khẩu mới không được trùng với mật khẩu hiện tại!');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassErrorMsg('Xác nhận mật khẩu mới không khớp!');
      return;
    }

    setIsSavingPass(true);
    try {
      if (onUpdateProfile) {
        await onUpdateProfile({
          password: newPassword.trim()
        });
      }
      setPassSuccessMsg('Đổi mật khẩu thành công! Mật khẩu mới đã được cập nhật.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPassSuccessMsg(''), 5000);
    } catch (err) {
      setPassErrorMsg('Có lỗi xảy ra khi cập nhật mật khẩu. Vui lòng thử lại!');
    } finally {
      setIsSavingPass(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* HEADER BANNER */}
      <div className="dashboard-header" style={{ marginBottom: '24px' }}>
        <div className="dashboard-title-row">
          <div className="dashboard-title">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#ffffff',
                padding: '8px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(37,99,235,0.25)'
              }}>
                <User size={22} />
              </div>
              <span>Hồ Sơ Cá Nhân & Cài Đặt Tài Khoản</span>
            </h2>
          </div>
        </div>
      </div>

      {/* CARD 1: OVERVIEW HERO */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '20px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '20px',
            background: `linear-gradient(135deg, ${roleInfo.color}, #0f172a)`,
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.6rem',
            fontWeight: 800,
            boxShadow: `0 8px 20px ${roleInfo.color}35`,
            flexShrink: 0
          }}>
            {currentUser.avatar || 'NV'}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <h3 style={{ margin: 0, fontSize: '1.35rem', color: '#0f172a', fontWeight: 800 }}>
                {currentUser.fullName}
              </h3>
              <span style={{
                background: roleInfo.bg,
                color: roleInfo.color,
                border: `1px solid ${roleInfo.border}`,
                padding: '3px 10px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <RoleIcon size={14} />
                {roleInfo.tag}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', color: '#64748b', fontSize: '0.84rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Mail size={15} color="#94a3b8" />
                {currentUser.email}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Building size={15} color="#94a3b8" />
                {currentUser.company || 'Dự án An Phú Eco City'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Phone size={15} color="#94a3b8" />
                {currentUser.phone || 'Chưa cập nhật'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ĐỔI MẬT KHẨU TÀI KHOẢN */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 4px 16px -2px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '18px',
          paddingBottom: '14px',
          borderBottom: '1px solid #f1f5f9'
        }}>
          <div style={{
            background: '#fef2f2',
            color: '#dc2626',
            padding: '10px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <KeyRound size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: 700 }}>
              Đổi Mật Khẩu Đăng Nhập
            </h3>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
              Bảo vệ tài khoản cá nhân với mật khẩu an toàn
            </p>
          </div>
        </div>

        {passSuccessMsg && (
          <div style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '10px',
            padding: '10px 14px',
            color: '#065f46',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{passSuccessMsg}</span>
          </div>
        )}

        {passErrorMsg && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '10px',
            padding: '10px 14px',
            color: '#991b1b',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{passErrorMsg}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Mật khẩu hiện tại */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', margin: 0 }}>
                Mật khẩu hiện tại <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                (Mặc định ban đầu: 123456)
              </span>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={showCurrentPass ? 'text' : 'password'}
                className="form-input"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (passErrorMsg) setPassErrorMsg('');
                }}
                placeholder="Nhập mật khẩu hiện tại"
                style={{ paddingLeft: '38px', paddingRight: '38px', borderRadius: '10px', height: '42px', fontSize: '0.9rem', width: '100%' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPass(!showCurrentPass)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Mật khẩu mới */}
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
              Mật khẩu mới <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={showNewPass ? 'text' : 'password'}
                className="form-input"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (passErrorMsg) setPassErrorMsg('');
                }}
                placeholder="Tối thiểu 4 ký tự"
                style={{ paddingLeft: '38px', paddingRight: '38px', borderRadius: '10px', height: '42px', fontSize: '0.9rem', width: '100%' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Xác nhận mật khẩu mới */}
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
              Xác nhận mật khẩu mới <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={showConfirmPass ? 'text' : 'password'}
                className="form-input"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (passErrorMsg) setPassErrorMsg('');
                }}
                placeholder="Nhập lại chính xác mật khẩu mới"
                style={{ paddingLeft: '38px', paddingRight: '38px', borderRadius: '10px', height: '42px', fontSize: '0.9rem', width: '100%' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Nút Submit Đổi Mật Khẩu */}
          <div style={{ marginTop: '10px', paddingTop: '10px' }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSavingPass}
              style={{
                width: '100%',
                height: '42px',
                borderRadius: '10px',
                justifyContent: 'center',
                fontSize: '0.9rem',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                borderColor: '#b91c1c'
              }}
            >
              <KeyRound size={16} />
              <span>{isSavingPass ? 'Đang cập nhật...' : 'Xác Nhận Đổi Mật Khẩu'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
