import React, { useState } from 'react';
import {
  User, Mail, Lock, Phone, Building, ShieldCheck, Eye, EyeOff,
  CheckCircle2, AlertCircle, Save, KeyRound, Award, HardHat,
  Briefcase, Sparkles, Check, ChevronRight
} from 'lucide-react';

export default function ProfileView({ currentUser, users = [], onUpdateProfile }) {
  // State Thông tin cá nhân
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [infoSuccessMsg, setInfoSuccessMsg] = useState('');
  const [infoErrorMsg, setInfoErrorMsg] = useState('');
  const [isSavingInfo, setIsSavingInfo] = useState(false);

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
          border: '#d8b4fe',
          desc: 'Chủ đầu tư quản lý toàn bộ hệ thống, phân quyền và cấu hình dự án.'
        };
      case 'CONTRACTOR':
        return {
          name: 'Đơn Vị Thi Công (ĐVTC)',
          tag: 'ĐVTC',
          icon: HardHat,
          bg: '#eff6ff',
          color: '#1d4ed8',
          border: '#bfdbfe',
          desc: 'Lập phiếu yêu cầu nghiệm thu, chụp ảnh hiện trường, khắc phục khiếm khuyết.'
        };
      case 'SUPERVISOR':
        return {
          name: 'Tư Vấn Giám Sát (TVGS)',
          tag: 'TVGS',
          icon: Eye,
          bg: '#ecfdf5',
          color: '#047857',
          border: '#a7f3d0',
          desc: 'Trực tiếp đánh giá tại hiện trường, duyệt hoặc từ chối phiếu yêu cầu.'
        };
      case 'LEAD_SUPERVISOR':
        return {
          name: 'Tư Vấn Giám Sát Trưởng',
          tag: 'TVGS Trưởng',
          icon: Award,
          bg: '#f0fdf4',
          color: '#15803d',
          border: '#86efac',
          desc: 'Quản lý toàn bộ phiếu TVGS, xác nhận và ký biên bản nghiệm thu.'
        };
      case 'INVESTOR':
        return {
          name: 'Ban Quản Lý Dự Án (Ban QLDA)',
          tag: 'Ban QLDA',
          icon: Briefcase,
          bg: '#fffbeb',
          color: '#b45309',
          border: '#fde68a',
          desc: 'Cán bộ Ban QLDA kiểm tra, theo dõi chất lượng và tham gia nghiệm thu.'
        };
      case 'LEAD_INVESTOR':
        return {
          name: 'Trưởng Ban Quản Lý Dự Án',
          tag: 'Trưởng Ban QLDA',
          icon: Award,
          bg: '#fef3c7',
          color: '#b45309',
          border: '#fcd34d',
          desc: 'Trưởng Ban QLDA, quản lý các cán bộ Ban QLDA và phê duyệt biên bản nghiệm thu.'
        };
      default:
        return {
          name: role || 'Cán Bộ Kỹ Thuật',
          tag: role,
          icon: User,
          bg: '#f1f5f9',
          color: '#475569',
          border: '#cbd5e1',
          desc: 'Cán bộ kỹ thuật dự án'
        };
    }
  };

  const roleInfo = getRoleDetails(currentUser.role);
  const RoleIcon = roleInfo.icon;

  // Tìm thông tin cán bộ cấp trên / cấp dưới
  const directLeader = currentUser.leaderId ? users.find(u => u.uid === currentUser.leaderId) : null;
  const directSubordinates = Array.isArray(currentUser.subordinateIds)
    ? users.filter(u => currentUser.subordinateIds.includes(u.uid))
    : [];

  // Xử lý Cập nhật Họ Tên & Thông tin cá nhân
  const handleSaveProfileInfo = async (e) => {
    e.preventDefault();
    setInfoSuccessMsg('');
    setInfoErrorMsg('');

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setInfoErrorMsg('Họ và tên không được để trống!');
      return;
    }
    if (trimmedName.length < 2) {
      setInfoErrorMsg('Họ và tên phải có ít nhất 2 ký tự!');
      return;
    }

    // Tạo avatar viết tắt
    const words = trimmedName.split(' ').filter(Boolean);
    const newAvatar = words.length >= 2
      ? (words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase()
      : trimmedName.slice(0, 2).toUpperCase();

    setIsSavingInfo(true);
    try {
      if (onUpdateProfile) {
        await onUpdateProfile({
          fullName: trimmedName,
          phone: phone.trim() || 'Chưa cập nhật',
          avatar: newAvatar
        });
      }
      setInfoSuccessMsg('Đã cập nhật thông tin họ và tên thành công!');
      setTimeout(() => setInfoSuccessMsg(''), 4000);
    } catch (err) {
      setInfoErrorMsg('Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại!');
    } finally {
      setIsSavingInfo(false);
    }
  };

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
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>
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
            <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
              Chỉnh sửa họ tên hiển thị, thông tin liên hệ và đổi mật khẩu bảo mật tài khoản cá nhân
            </p>
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
              <span style={{
                background: '#ecfdf5',
                color: '#065f46',
                border: '1px solid #a7f3d0',
                padding: '3px 8px',
                borderRadius: '8px',
                fontSize: '0.74rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <CheckCircle2 size={13} />
                Đang Hoạt Động
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

        {/* Cán bộ quản lý hoặc cấp dưới */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '12px 16px',
          fontSize: '0.8rem',
          minWidth: '240px'
        }}>
          <div style={{ fontWeight: 700, color: '#334155', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} color="#3b82f6" />
            <span>Phân Quyền Dự Án</span>
          </div>
          <div style={{ color: '#64748b', lineHeight: 1.4 }}>
            {directLeader ? (
              <div>
                Trực tiếp báo cáo: <strong style={{ color: '#0f172a' }}>{directLeader.fullName}</strong>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>({directLeader.email})</div>
              </div>
            ) : directSubordinates.length > 0 ? (
              <div>
                Trực tiếp quản lý: <strong style={{ color: '#0f172a' }}>{directSubordinates.length} cán bộ</strong>
              </div>
            ) : (
              <div>{roleInfo.desc}</div>
            )}
          </div>
        </div>
      </div>

      {/* GRID 2 CỘT: THÔNG TIN HỌ TÊN VÀ ĐỔI MẬT KHẨU */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '24px'
      }}>
        {/* KHỐI 1: CHỈNH SỬA THÔNG TIN CÁ NHÂN (ĐỔI TÊN) */}
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
              background: '#eff6ff',
              color: '#2563eb',
              padding: '10px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <User size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: 700 }}>
                Thông Tin Cá Nhân
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                Cập nhật Họ và tên hiển thị trong hệ thống & biên bản
              </p>
            </div>
          </div>

          {infoSuccessMsg && (
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
              <span>{infoSuccessMsg}</span>
            </div>
          )}

          {infoErrorMsg && (
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
              <span>{infoErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfileInfo} style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
            {/* Họ và tên (Cho phép đổi) */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                Họ và Tên Cán Bộ <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-input"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (infoErrorMsg) setInfoErrorMsg('');
                  }}
                  placeholder="Nhập họ và tên đầy đủ"
                  style={{ paddingLeft: '38px', borderRadius: '10px', height: '42px', fontSize: '0.9rem', width: '100%' }}
                  required
                />
              </div>
              <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Tên này sẽ hiển thị trên chữ ký biên bản nghiệm thu & phiếu yêu cầu.
              </span>
            </div>

            {/* Số điện thoại (Cho phép đổi) */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                Số Điện Thoại Liên Hệ
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="tel"
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ví dụ: 0912 345 678"
                  style={{ paddingLeft: '38px', borderRadius: '10px', height: '42px', fontSize: '0.9rem', width: '100%' }}
                />
              </div>
            </div>

            {/* Email tài khoản (Chỉ đọc) */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>
                Tài Khoản Email (Đăng Nhập)
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  className="form-input"
                  value={currentUser.email}
                  disabled
                  style={{
                    paddingLeft: '38px',
                    borderRadius: '10px',
                    height: '42px',
                    fontSize: '0.9rem',
                    background: '#f8fafc',
                    color: '#64748b',
                    cursor: 'not-allowed',
                    border: '1px dashed #cbd5e1',
                    width: '100%'
                  }}
                />
              </div>
            </div>

            {/* Đơn vị công tác (Chỉ đọc) */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>
                Đơn Vị / Công Ty Phụ Trách
              </label>
              <div style={{ position: 'relative' }}>
                <Building size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-input"
                  value={currentUser.company || 'An Phú Gia'}
                  disabled
                  style={{
                    paddingLeft: '38px',
                    borderRadius: '10px',
                    height: '42px',
                    fontSize: '0.9rem',
                    background: '#f8fafc',
                    color: '#64748b',
                    cursor: 'not-allowed',
                    border: '1px dashed #cbd5e1',
                    width: '100%'
                  }}
                />
              </div>
            </div>

            {/* Nút Submit cập nhật thông tin */}
            <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
              <button
                type="submit"
                className="btn-primary"
                disabled={isSavingInfo}
                style={{
                  width: '100%',
                  height: '42px',
                  borderRadius: '10px',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  fontWeight: 600
                }}
              >
                <Save size={16} />
                <span>{isSavingInfo ? 'Đang lưu...' : 'Lưu Thay Đổi Thông Tin'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* KHỐI 2: ĐỔI MẬT KHẨU TÀI KHOẢN */}
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

          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
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
                  placeholder="Nhập mật khẩu đang dùng"
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
            <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
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
    </div>
  );
}
