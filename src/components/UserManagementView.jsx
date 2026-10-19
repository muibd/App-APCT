import React, { useState, useMemo } from 'react';
import { 
  Users, UserPlus, Search, Filter, Mail, Lock, Phone, Building, 
  Briefcase, ShieldCheck, HardHat, Eye, EyeOff, Edit3, Trash2, 
  KeyRound, Check, Copy, AlertTriangle, X, ShieldAlert, CheckCircle2,
  ToggleLeft, ToggleRight, Sparkles, RefreshCw
} from 'lucide-react';

export default function UserManagementView({ 
  users = [], 
  currentUser, 
  onAddUser, 
  onUpdateUser, 
  onDeleteUser, 
  onUpdateUserRole,
  onToggleUserStatus
}) {
  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Password visibility map { [uid]: boolean }
  const [visiblePasswords, setVisiblePasswords] = useState({});

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [resettingPasswordUser, setResettingPasswordUser] = useState(null);

  // Toast / feedback message
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (text) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Toggle reveal password for a specific user
  const togglePasswordVisibility = (uid) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [uid]: !prev[uid]
    }));
  };

  // Copy to clipboard helper
  const handleCopy = (text, label) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      showToast(`Đã sao chép ${label}!`);
    }
  };

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        (u.fullName || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.phone || '').toLowerCase().includes(q) ||
        (u.company || '').toLowerCase().includes(q) ||
        (u.position || '').toLowerCase().includes(q);

      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'ALL' || (u.status || 'ACTIVE') === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Role stats
  const stats = useMemo(() => ({
    total: users.length,
    contractor: users.filter(u => u.role === 'CONTRACTOR').length,
    supervisor: users.filter(u => u.role === 'SUPERVISOR').length,
    investor: users.filter(u => u.role === 'INVESTOR').length,
    admin: users.filter(u => u.role === 'ADMIN').length
  }), [users]);

  // Role badge helper
  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return { label: 'Quản trị viên (Admin)', bg: '#faf5ff', color: '#7e22ce', border: '#e9d5ff', icon: ShieldCheck };
      case 'CONTRACTOR':
        return { label: 'Đơn vị thi công (ĐVTC)', bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', icon: HardHat };
      case 'SUPERVISOR':
        return { label: 'Tư vấn giám sát (TVGS)', bg: '#ecfdf5', color: '#059669', border: '#a7f3d0', icon: Eye };
      case 'INVESTOR':
        return { label: 'Đại diện CĐT (Ban QLDA)', bg: '#fffbeb', color: '#d97706', border: '#fde68a', icon: Briefcase };
      default:
        return { label: role, bg: '#f1f5f9', color: '#475569', border: '#e2e8f0', icon: Users };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Feedback */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: '#0f172a',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.88rem',
          fontWeight: 600,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <CheckCircle2 size={18} color="#10b981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Primary Actions */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: '#f3e8ff',
              color: '#7e22ce',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: 800 }}>
                Quản Lý Cán Bộ & Phân Quyền (RBAC)
              </h2>
            </div>
          </div>
        </div>

        {/* Nút Thêm Mới Cán Bộ */}
        <button
          type="button"
          className="btn-primary"
          onClick={() => setIsAddModalOpen(true)}
          style={{
            background: 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%)',
            boxShadow: '0 4px 14px rgba(126, 34, 206, 0.35)',
            padding: '10px 20px',
            fontSize: '0.92rem',
            borderRadius: '12px'
          }}
        >
          <UserPlus size={18} />
          <span>Thêm Mới Cán Bộ</span>
        </button>
      </div>

      {/* Toolbar: Tìm kiếm & Lọc vai trò */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        {/* Thanh tìm kiếm */}
        <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '450px' }}>
          <Search 
            size={18} 
            color="#94a3b8" 
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} 
          />
          <input
            type="text"
            className="form-input"
            placeholder="Tìm theo tên, email, SĐT, đơn vị..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '38px', height: '40px', fontSize: '0.88rem', width: '100%', borderRadius: '10px' }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94a3b8',
                padding: '2px'
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Bộ lọc vai trò & Trạng thái */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={15} color="#64748b" />
            <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Vai trò:</span>
          </div>
          <select
            className="form-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ padding: '7px 12px', fontSize: '0.84rem', borderRadius: '10px', width: 'auto' }}
          >
            <option value="ALL">Tất cả vai trò ({users.length})</option>
            <option value="ADMIN">Quản trị viên ({stats.admin})</option>
            <option value="CONTRACTOR">Đơn vị thi công ({stats.contractor})</option>
            <option value="SUPERVISOR">Tư vấn giám sát ({stats.supervisor})</option>
            <option value="INVESTOR">Đại diện CĐT ({stats.investor})</option>
          </select>

          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '7px 12px', fontSize: '0.84rem', borderRadius: '10px', width: 'auto' }}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Đã khóa</option>
          </select>
        </div>
      </div>

      {/* Danh sách thẻ cán bộ */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#1e293b' }}>
            Danh sách cán bộ ({filteredUsers.length} tài khoản)
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
            <Users size={40} color="#cbd5e1" style={{ marginBottom: '10px' }} />
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Không tìm thấy cán bộ phù hợp</div>
            <p style={{ fontSize: '0.82rem', margin: '4px 0 0 0' }}>Thử tìm kiếm với từ khóa khác hoặc điều chỉnh bộ lọc.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredUsers.map((user) => {
              const roleMeta = getRoleBadge(user.role);
              const RoleIcon = roleMeta.icon;
              const isPasswordVisible = !!visiblePasswords[user.uid];
              const isCurrentUser = currentUser?.uid === user.uid;
              const isActive = (user.status || 'ACTIVE') === 'ACTIVE';

              return (
                <div
                  key={user.uid}
                  style={{
                    background: isActive ? '#ffffff' : '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '16px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px',
                    transition: 'all 0.2s ease',
                    opacity: isActive ? 1 : 0.75
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Cột 1: Thông tin cá nhân & Liên hệ */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '240px', flex: '1 1 240px' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '14px',
                        background: roleMeta.bg,
                        color: roleMeta.color,
                        border: `1.5px solid ${roleMeta.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.95rem',
                        flexShrink: 0
                      }}
                    >
                      {user.avatar || (user.fullName ? user.fullName.split(' ').slice(-1)[0].slice(0, 2).toUpperCase() : 'NV')}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0f172a' }}>
                          {user.fullName}
                        </span>
                        {isCurrentUser && (
                          <span style={{
                            fontSize: '0.7rem',
                            background: '#dbeafe',
                            color: '#1d4ed8',
                            padding: '2px 6px',
                            borderRadius: '6px',
                            fontWeight: 700
                          }}>
                            Bạn
                          </span>
                        )}
                        <span style={{
                          fontSize: '0.72rem',
                          background: isActive ? '#ecfdf5' : '#fef2f2',
                          color: isActive ? '#059669' : '#dc2626',
                          border: `1px solid ${isActive ? '#a7f3d0' : '#fecaca'}`,
                          padding: '2px 7px',
                          borderRadius: '999px',
                          fontWeight: 700
                        }}>
                          {isActive ? '● Hoạt động' : '○ Tạm khóa'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        <Phone size={12} />
                        <span>{user.phone || 'Chưa có SĐT'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cột 2: Tài khoản đăng nhập (Email & Mật khẩu) */}
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    minWidth: '260px',
                    flex: '1 1 260px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    {/* Email */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                        <Mail size={14} color="#64748b" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b', wordBreak: 'break-all' }}>
                          {user.email}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(user.email, 'Email')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '2px' }}
                        title="Sao chép Email"
                      >
                        <Copy size={13} />
                      </button>
                    </div>

                    {/* Mật khẩu */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Lock size={14} color="#64748b" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: '0.82rem', color: '#334155' }}>MK: </span>
                        <code style={{
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          color: '#0f172a',
                          background: '#ffffff',
                          padding: '1px 6px',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          letterSpacing: isPasswordVisible ? 'normal' : '2px'
                        }}>
                          {isPasswordVisible ? (user.password || '123456') : '••••••'}
                        </code>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(user.uid)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '2px' }}
                          title={isPasswordVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        >
                          {isPasswordVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(user.password || '123456', 'Mật khẩu')}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '2px' }}
                          title="Sao chép Mật khẩu"
                        >
                          <Copy size={13} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Cột 3: Vai trò & Dropdown gán quyền */}
                  <div style={{ minWidth: '220px', display: 'flex', alignItems: 'center' }}>
                    <select
                      value={user.role}
                      onChange={(e) => onUpdateUserRole(user.uid, e.target.value)}
                      className="form-select"
                      style={{
                        padding: '7px 12px',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        borderRadius: '10px',
                        borderColor: roleMeta.border,
                        background: roleMeta.bg,
                        color: roleMeta.color,
                        width: '100%'
                      }}
                    >
                      <option value="ADMIN">ADMIN (Quản trị viên)</option>
                      <option value="CONTRACTOR">CONTRACTOR (Đơn vị thi công)</option>
                      <option value="SUPERVISOR">SUPERVISOR (Tư vấn giám sát)</option>
                      <option value="INVESTOR">INVESTOR (Đại diện CĐT)</option>
                    </select>
                  </div>

                  {/* Cột 4: Bộ nút thao tác quản lý */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {/* Nút Đổi mật khẩu nhanh */}
                    <button
                      type="button"
                      onClick={() => setResettingPasswordUser(user)}
                      className="btn-secondary"
                      style={{ padding: '7px 10px', fontSize: '0.78rem', borderRadius: '8px' }}
                      title="Đổi mật khẩu tài khoản"
                    >
                      <KeyRound size={14} color="#7e22ce" />
                      <span>Đổi MK</span>
                    </button>

                    {/* Nút Sửa thông tin */}
                    <button
                      type="button"
                      onClick={() => setEditingUser(user)}
                      className="btn-secondary"
                      style={{ padding: '7px 10px', fontSize: '0.78rem', borderRadius: '8px' }}
                      title="Chỉnh sửa thông tin cán bộ"
                    >
                      <Edit3 size={14} color="#2563eb" />
                      <span>Sửa</span>
                    </button>

                    {/* Nút Khóa / Mở khóa tài khoản */}
                    <button
                      type="button"
                      onClick={() => onToggleUserStatus && onToggleUserStatus(user.uid)}
                      className="btn-secondary"
                      style={{
                        padding: '7px 10px',
                        fontSize: '0.78rem',
                        borderRadius: '8px',
                        color: isActive ? '#d97706' : '#059669'
                      }}
                      title={isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                    >
                      {isActive ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                    </button>

                    {/* Nút Xóa cán bộ */}
                    <button
                      type="button"
                      onClick={() => setDeletingUser(user)}
                      className="btn-secondary"
                      disabled={isCurrentUser}
                      style={{
                        padding: '7px 10px',
                        fontSize: '0.78rem',
                        borderRadius: '8px',
                        color: isCurrentUser ? '#cbd5e1' : '#dc2626',
                        borderColor: isCurrentUser ? '#f1f5f9' : '#fecaca',
                        cursor: isCurrentUser ? 'not-allowed' : 'pointer'
                      }}
                      title={isCurrentUser ? "Không thể tự xóa tài khoản của chính mình" : "Xóa cán bộ"}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: THÊM MỚI CÁN BỘ */}
      {isAddModalOpen && (
        <AddUserModal
          isOpen={isAddModalOpen}
          existingUsers={users}
          onClose={() => setIsAddModalOpen(false)}
          onSave={(newUser) => {
            onAddUser(newUser);
            setIsAddModalOpen(false);
            showToast('Đã thêm mới cán bộ thành công!');
          }}
        />
      )}

      {/* MODAL 2: CHỈNH SỬA THÔNG TIN CÁN BỘ */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          existingUsers={users}
          onClose={() => setEditingUser(null)}
          onSave={(updated) => {
            onUpdateUser(updated);
            setEditingUser(null);
            showToast('Đã cập nhật thông tin cán bộ!');
          }}
        />
      )}

      {/* MODAL 3: ĐỔI MẬT KHẨU NHANH */}
      {resettingPasswordUser && (
        <ResetPasswordModal
          user={resettingPasswordUser}
          onClose={() => setResettingPasswordUser(null)}
          onSave={(uid, newPass) => {
            onUpdateUser({ ...resettingPasswordUser, password: newPass });
            setResettingPasswordUser(null);
            showToast('Đã cập nhật mật khẩu mới thành công!');
          }}
        />
      )}

      {/* MODAL 4: XÁC NHẬN XÓA CÁN BỘ */}
      {deletingUser && (
        <DeleteConfirmModal
          user={deletingUser}
          onClose={() => setDeletingUser(null)}
          onConfirm={() => {
            onDeleteUser(deletingUser.uid);
            setDeletingUser(null);
            showToast('Đã xóa cán bộ khỏi hệ thống!');
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// SUB-MODAL: THÊM MỚI CÁN BỘ
// ============================================================================
function AddUserModal({ isOpen, onClose, onSave, existingUsers }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('CONTRACTOR');
  const [company, setCompany] = useState('Công ty CP Xây dựng An Phú Gia');
  const [position, setPosition] = useState('Kỹ thuật hiện trường');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Gợi ý nhanh các công ty trong dự án
  const companyPresets = [
    { label: 'ĐVTC: Công ty CP Xây dựng An Phú Gia', name: 'Công ty CP Xây dựng An Phú Gia', role: 'CONTRACTOR', pos: 'Kỹ thuật hiện trường' },
    { label: 'TVGS: Công ty CP TVXD và TM GELICON', name: 'Công ty CP Tư vấn Xây dựng và Thương mại GELICON', role: 'SUPERVISOR', pos: 'Cán bộ tư vấn giám sát' },
    { label: 'CĐT: Công ty TNHH An Phú Cần Thơ', name: 'Công ty TNHH An Phú Cần Thơ', role: 'INVESTOR', pos: 'Cán bộ ban QLDA' },
    { label: 'Admin: Ban Quản Trị Hệ Thống APCT', name: 'Ban Quản Trị Hệ Thống APCT', role: 'ADMIN', pos: 'Quản trị viên Hệ thống' }
  ];

  const handleSelectPreset = (preset) => {
    setCompany(preset.name);
    setRole(preset.role);
    setPosition(preset.pos);
  };

  const handleGeneratePassword = () => {
    const chars = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ';
    let res = '';
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Vui lòng nhập Họ và tên cán bộ');
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMsg('Vui lòng nhập Email đăng nhập');
      return;
    }

    // Kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMsg('Địa chỉ Email không đúng định dạng');
      return;
    }

    // Kiểm tra trùng email
    const duplicate = existingUsers.some(u => (u.email || '').toLowerCase() === trimmedEmail);
    if (duplicate) {
      setErrorMsg('Email này đã được sử dụng bởi một cán bộ khác trong hệ thống!');
      return;
    }

    if (!password.trim()) {
      setErrorMsg('Vui lòng nhập Mật khẩu cho cán bộ');
      return;
    }

    // Tạo avatar viết tắt
    const words = fullName.trim().split(' ');
    const avatar = words.length >= 2 
      ? (words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase()
      : fullName.slice(0, 2).toUpperCase();

    const newUser = {
      uid: `uid_custom_${Date.now()}`,
      fullName: fullName.trim(),
      email: trimmedEmail,
      password: password.trim(),
      role,
      company: company.trim(),
      position: position.trim(),
      phone: phone.trim() || 'Chưa cập nhật',
      status,
      avatar,
      createdAt: new Date().toISOString()
    };

    onSave(newUser);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header" style={{ background: '#faf5ff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#f3e8ff', padding: '8px', borderRadius: '10px', color: '#7e22ce' }}>
              <UserPlus size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#581c87', fontWeight: 800 }}>
                Thêm Mới Cán Bộ Dự Án
              </h3>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {errorMsg && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '10px',
                padding: '10px 14px',
                color: '#991b1b',
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertTriangle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Gợi ý mẫu đơn vị */}
            <div>
              <label style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                💡 Chọn nhanh theo đơn vị tham gia dự án:
              </label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {companyPresets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '4px 8px',
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                      color: '#334155',
                      fontWeight: 500
                    }}
                  >
                    {p.label.split(':')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {/* Họ và tên */}
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  Họ và tên cán bộ <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="VD: KS. Trần Văn Nam"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              {/* Email đăng nhập */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  Email đăng nhập <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="email"
                    className="form-input"
                    placeholder="nam.tvgs@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ paddingLeft: '36px' }}
                    required
                  />
                </div>
              </div>

              {/* Mật khẩu khởi tạo */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, margin: 0 }}>
                    Mật khẩu đăng nhập <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    style={{ background: 'none', border: 'none', color: '#7e22ce', fontSize: '0.74rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    🎲 Tạo ngẫu nhiên
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Nhập mật khẩu (VD: 123456)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingLeft: '36px', paddingRight: '36px' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Vai trò */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  Vai trò hệ thống (RBAC) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  className="form-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="CONTRACTOR">CONTRACTOR (Đơn vị thi công - Tạo phiếu)</option>
                  <option value="SUPERVISOR">SUPERVISOR (Tư vấn giám sát - Ký duyệt)</option>
                  <option value="INVESTOR">INVESTOR (Đại diện chủ đầu tư - QLDA)</option>
                  <option value="ADMIN">ADMIN (Quản trị viên toàn hệ thống)</option>
                </select>
              </div>

              {/* Số điện thoại */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  Số điện thoại liên hệ:
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="0912.345.678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ paddingLeft: '36px' }}
                  />
                </div>
              </div>

              {/* Công ty / Đơn vị */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  Đơn vị / Cơ quan:
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="VD: Công ty CP Xây dựng An Phú Gia"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>

              {/* Chức vụ */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  Chức danh / Chức vụ:
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="VD: Kỹ thuật hiện trường"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                />
              </div>

              {/* Trạng thái hoạt động */}
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  Trạng thái tài khoản:
                </label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="status"
                      checked={status === 'ACTIVE'}
                      onChange={() => setStatus('ACTIVE')}
                    />
                    <span style={{ color: '#059669', fontWeight: 600 }}>🟢 Hoạt động (Cho phép đăng nhập)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="status"
                      checked={status === 'INACTIVE'}
                      onChange={() => setStatus('INACTIVE')}
                    />
                    <span style={{ color: '#dc2626', fontWeight: 600 }}>🔴 Tạm khóa (Chặn đăng nhập)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer" style={{ justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ background: 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%)' }}
            >
              <Check size={16} />
              <span>Lưu Cán Bộ Mới</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-MODAL: CHỈNH SỬA CÁN BỘ
// ============================================================================
function EditUserModal({ user, onClose, onSave, existingUsers }) {
  const [fullName, setFullName] = useState(user.fullName || '');
  const [email, setEmail] = useState(user.email || '');
  const [password, setPassword] = useState(user.password || '123456');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState(user.role || 'CONTRACTOR');
  const [company, setCompany] = useState(user.company || '');
  const [position, setPosition] = useState(user.position || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [status, setStatus] = useState(user.status || 'ACTIVE');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Vui lòng nhập Họ và tên cán bộ');
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMsg('Vui lòng nhập Email đăng nhập');
      return;
    }

    // Kiểm tra trùng email (ngoại trừ chính user này)
    const duplicate = existingUsers.some(u => u.uid !== user.uid && (u.email || '').toLowerCase() === trimmedEmail);
    if (duplicate) {
      setErrorMsg('Email này đã được sử dụng bởi một cán bộ khác trong hệ thống!');
      return;
    }

    if (!password.trim()) {
      setErrorMsg('Mật khẩu không được để trống!');
      return;
    }

    const updatedUser = {
      ...user,
      fullName: fullName.trim(),
      email: trimmedEmail,
      password: password.trim(),
      role,
      company: company.trim(),
      position: position.trim(),
      phone: phone.trim(),
      status
    };

    onSave(updatedUser);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header" style={{ background: '#f0f9ff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#e0f2fe', padding: '8px', borderRadius: '10px', color: '#0284c7' }}>
              <Edit3 size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0369a1', fontWeight: 800 }}>
                Chỉnh Sửa Thông Tin Cán Bộ
              </h3>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {errorMsg && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '10px',
                padding: '10px 14px',
                color: '#991b1b',
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertTriangle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {/* Họ và tên */}
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  Họ và tên cán bộ <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              {/* Email đăng nhập */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  Email đăng nhập <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ paddingLeft: '36px' }}
                    required
                  />
                </div>
              </div>

              {/* Mật khẩu */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  Mật khẩu đăng nhập <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingLeft: '36px', paddingRight: '36px' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Vai trò */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  Vai trò hệ thống (RBAC) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  className="form-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="CONTRACTOR">CONTRACTOR (Đơn vị thi công)</option>
                  <option value="SUPERVISOR">SUPERVISOR (Tư vấn giám sát)</option>
                  <option value="INVESTOR">INVESTOR (Đại diện chủ đầu tư)</option>
                  <option value="ADMIN">ADMIN (Quản trị viên)</option>
                </select>
              </div>

              {/* Số điện thoại */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  Số điện thoại:
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    className="form-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ paddingLeft: '36px' }}
                  />
                </div>
              </div>

              {/* Công ty / Đơn vị */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  Đơn vị / Cơ quan:
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>

              {/* Chức vụ */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  Chức danh / Chức vụ:
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                />
              </div>

              {/* Trạng thái hoạt động */}
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  Trạng thái tài khoản:
                </label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="editStatus"
                      checked={status === 'ACTIVE'}
                      onChange={() => setStatus('ACTIVE')}
                    />
                    <span style={{ color: '#059669', fontWeight: 600 }}>🟢 Hoạt động</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="editStatus"
                      checked={status === 'INACTIVE'}
                      onChange={() => setStatus('INACTIVE')}
                    />
                    <span style={{ color: '#dc2626', fontWeight: 600 }}>🔴 Tạm khóa</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer" style={{ justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-primary">
              <Check size={16} />
              <span>Cập Nhật Thông Tin</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-MODAL: ĐỔI MẬT KHẨU NHANH
// ============================================================================
function ResetPasswordModal({ user, onClose, onSave }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!newPassword.trim()) {
      setErrorMsg('Vui lòng nhập mật khẩu mới');
      return;
    }
    if (newPassword.trim().length < 4) {
      setErrorMsg('Mật khẩu tối thiểu 4 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp');
      return;
    }

    onSave(user.uid, newPassword.trim());
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '440px' }}>
        <div className="modal-header" style={{ background: '#faf5ff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#f3e8ff', padding: '8px', borderRadius: '10px', color: '#7e22ce' }}>
              <KeyRound size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#581c87', fontWeight: 800 }}>
                Đổi Mật Khẩu
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                Cán bộ: <strong>{user.fullName}</strong> ({user.email})
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {errorMsg && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#991b1b',
                fontSize: '0.82rem'
              }}>
                {errorMsg}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Mật khẩu mới:</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Nhập mật khẩu mới"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ paddingLeft: '36px', paddingRight: '36px' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Xác nhận mật khẩu mới:</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ paddingLeft: '36px' }}
                  required
                />
              </div>
            </div>
          </div>

          <div className="modal-footer" style={{ justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Hủy</button>
            <button
              type="submit"
              className="btn-primary"
              style={{ background: 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%)' }}
            >
              Lưu Mật Khẩu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-MODAL: XÁC NHẬN XÓA CÁN BỘ
// ============================================================================
function DeleteConfirmModal({ user, onClose, onConfirm }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '440px' }}>
        <div className="modal-header" style={{ background: '#fef2f2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#fee2e2', padding: '8px', borderRadius: '10px', color: '#dc2626' }}>
              <Trash2 size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#991b1b', fontWeight: 800 }}>
                Xác Nhận Xóa Cán Bộ
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                Hành động này không thể hoàn tác
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body" style={{ padding: '20px' }}>
          <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#334155', lineHeight: 1.5 }}>
            Bạn có chắc chắn muốn xóa cán bộ <strong>{user.fullName}</strong> ({user.email}) khỏi hệ thống dự án không?
          </p>
          <div style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '8px',
            padding: '10px 12px',
            fontSize: '0.78rem',
            color: '#92400e'
          }}>
            ⚠️ Tài khoản này sẽ mất toàn bộ quyền truy cập và không thể đăng nhập vào APCT Nghiệm Thu nữa.
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'flex-end', gap: '8px' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>Hủy bỏ</button>
          <button
            type="button"
            className="btn-danger"
            onClick={onConfirm}
            style={{ padding: '8px 16px', fontSize: '0.88rem' }}
          >
            Xác Nhận Xóa
          </button>
        </div>
      </div>
    </div>
  );
}
