import React, { useState } from 'react';
import { 
  Building2, Mail, Lock, Eye, EyeOff, ArrowRight, 
  AlertCircle, ShieldCheck, HardHat, Briefcase, CheckCircle2, Award 
} from 'lucide-react';
import { MOCK_USERS } from '../data/mockData';

export default function LoginScreen({ onLogin, users = MOCK_USERS }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Danh sách tài khoản demo giúp người dùng test nhanh bằng 1 cú click để điền email & pass
  const demoAccounts = [
    {
      roleName: 'Quản Trị Viên (Admin)',
      email: 'admin@apct.vn',
      pass: '123456',
      icon: ShieldCheck,
      color: '#7e22ce',
      bg: '#faf5ff'
    },
    {
      roleName: 'ĐVTC: Cty Bình Hoà (CHT Khương)',
      email: 'pkhuong03@gmail.com',
      pass: '123456',
      icon: HardHat,
      color: '#2563eb',
      bg: '#eff6ff'
    },
    {
      roleName: 'ĐVTC: An Phú Gia (CHT Nhàn)',
      email: 'phamnhanktxd2014@gmail.com',
      pass: '123456',
      icon: HardHat,
      color: '#1d4ed8',
      bg: '#eff6ff'
    },
    {
      roleName: 'Tư Vấn Giám Sát (TVGS)',
      email: 'dongvug@gmail.com',
      pass: '123456',
      icon: Eye,
      color: '#059669',
      bg: '#ecfdf5'
    },
    {
      roleName: 'TVGS Trưởng (Đinh Xuân Thám)',
      email: 'tham.dinhxuan@gelicon.vn',
      pass: '123456',
      icon: Award,
      color: '#047857',
      bg: '#ecfdf5'
    },
    {
      roleName: 'Đại Diện CĐT (CB MEP Trung)',
      email: 'trungnguyenme1984@gmail.com',
      pass: '123456',
      icon: Briefcase,
      color: '#d97706',
      bg: '#fffbeb'
    },
    {
      roleName: 'CĐT Trưởng (Ngô Quý Linh)',
      email: 'linh.ngoquy@cncmi.vn',
      pass: '123456',
      icon: Award,
      color: '#b45309',
      bg: '#fffbeb'
    }
  ];

  const handleFillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg('');
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPass = password.trim();

    if (!trimmedEmail) {
      setErrorMsg('Vui lòng nhập tài khoản email!');
      return;
    }
    if (!trimmedPass) {
      setErrorMsg('Vui lòng nhập mật khẩu!');
      return;
    }

    setIsLoading(true);

    // Tìm tài khoản trong danh sách users
    setTimeout(() => {
      const foundUser = users.find(u => (u.email || '').toLowerCase() === trimmedEmail);

      if (!foundUser) {
        setIsLoading(false);
        setErrorMsg('Email không tồn tại trong hệ thống. Vui lòng liên hệ Quản trị viên để cấp tài khoản!');
        return;
      }

      // Kiểm tra trạng thái tài khoản
      if (foundUser.status === 'INACTIVE') {
        setIsLoading(false);
        setErrorMsg('Tài khoản này đã bị khóa hoặc tạm ngưng. Vui lòng liên hệ Quản trị viên!');
        return;
      }

      // Kiểm tra mật khẩu (hỗ trợ mật khẩu mặc định 123456 nếu tài khoản chưa có pass)
      const userPassword = foundUser.password || '123456';
      if (userPassword !== trimmedPass) {
        setIsLoading(false);
        setErrorMsg('Mật khẩu không chính xác. Vui lòng kiểm tra lại!');
        return;
      }

      // Đăng nhập thành công
      setIsLoading(false);
      onLogin(foundUser);
    }, 250);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #090d16 0%, #0f172a 40%, #1e293b 80%, #090d16 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative background glow circles */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        left: '-10%',
        width: '550px',
        height: '550px',
        background: 'radial-gradient(circle, rgba(37,99,235,0.2) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-15%',
        right: '-10%',
        width: '550px',
        height: '550px',
        background: 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '480px',
        padding: '36px 32px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.08)',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Header Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            borderRadius: '18px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 10px 25px rgba(37, 99, 235, 0.35)',
            marginBottom: '14px'
          }}>
            <Building2 size={32} />
          </div>
          <h1 style={{ fontSize: '1.55rem', color: '#0f172a', margin: '0 0 6px 0', fontWeight: '800', letterSpacing: '-0.02em' }}>
            APCT NGHIỆM THU
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
            Hệ thống Quản lý Nghiệm thu Công trình Xây dựng Chuyên nghiệp
          </p>
        </div>

        {/* Form Đăng Nhập Duy Nhất: Email & Mật Khẩu */}
        <form onSubmit={handleLoginSubmit}>
          {/* Thông báo lỗi nếu có */}
          {errorMsg && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              color: '#991b1b',
              fontSize: '0.84rem'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* Trường Email */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
              Tài khoản Email <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Mail 
                size={18} 
                color="#94a3b8" 
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} 
              />
              <input
                type="email"
                className="form-input"
                placeholder="vidu: admin@apct.vn hoặc email cán bộ"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                style={{ 
                  paddingLeft: '42px',
                  height: '46px',
                  borderRadius: '12px',
                  border: '1.5px solid #e2e8f0',
                  fontSize: '0.92rem',
                  width: '100%'
                }}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Trường Mật khẩu */}
          <div className="form-group" style={{ marginBottom: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155', margin: 0 }}>
                Mật khẩu <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Mặc định: <strong>123456</strong>
              </span>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock 
                size={18} 
                color="#94a3b8" 
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} 
              />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Nhập mật khẩu của bạn"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                style={{ 
                  paddingLeft: '42px',
                  paddingRight: '44px',
                  height: '46px',
                  borderRadius: '12px',
                  border: '1.5px solid #e2e8f0',
                  fontSize: '0.92rem',
                  width: '100%'
                }}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Nút Submit Đăng Nhập */}
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={isLoading}
            style={{ 
              width: '100%', 
              justifyContent: 'center', 
              height: '46px',
              borderRadius: '12px',
              fontSize: '0.95rem',
              fontWeight: 700,
              boxShadow: '0 6px 18px rgba(37, 99, 235, 0.35)',
              cursor: isLoading ? 'wait' : 'pointer'
            }}
          >
            <span>{isLoading ? 'Đang xác thực...' : 'Đăng Nhập Vào Hệ Thống'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Gợi ý nhanh tài khoản mẫu (Click để điền tự động) */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: '#f8fafc',
          borderRadius: '14px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: '#475569',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>💡 GỢI Ý TÀI KHOẢN MẪU (CLICK ĐỂ ĐIỀN)</span>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>MK: 123456</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {demoAccounts.map(demo => {
              const Icon = demo.icon;
              return (
                <button
                  key={demo.email}
                  type="button"
                  onClick={() => handleFillDemo(demo.email, demo.pass)}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '8px 10px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = demo.color;
                    e.currentTarget.style.background = demo.bg;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.background = '#ffffff';
                  }}
                >
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '8px',
                    background: demo.bg,
                    color: demo.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Icon size={14} />
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {demo.roleName.split(' (')[0]}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {demo.email.split('@')[0]}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid #f1f5f9',
          textAlign: 'center',
          fontSize: '0.76rem',
          color: '#64748b',
          lineHeight: 1.5
        }}>
          Dự án: <strong>An Phú Eco City - Chung cư nhà ở xã hội 2</strong><br />
          Chuẩn thể thức Nghị định 06/2021/NĐ-CP • Quản lý chất lượng & Nghiệm thu
        </div>
      </div>
    </div>
  );
}
