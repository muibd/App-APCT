import React, { useState, useMemo } from 'react';
import { 
  Users, UserPlus, Search, Filter, Mail, Lock, Phone, Building, 
  Briefcase, ShieldCheck, HardHat, Eye, EyeOff, Edit3, Trash2, 
  KeyRound, Check, Copy, AlertTriangle, X, ShieldAlert, CheckCircle2,
  ToggleLeft, ToggleRight, Sparkles, RefreshCw, Award
} from 'lucide-react';

export default function UserManagementView({ 
  users = [], 
  currentUser, 
  onAddUser, 
  onUpdateUser, 
  onDeleteUser, 
  onUpdateUserRole,
  onToggleUserStatus,
  onSyncAllUsersToCloud
}) {
  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isSyncing, setIsSyncing] = useState(false);

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

  const handleSyncCloud = async () => {
    if (!onSyncAllUsersToCloud) return;
    setIsSyncing(true);
    try {
      const ok = await onSyncAllUsersToCloud();
      if (ok) {
        showToast('☁️ Đã đồng bộ thành công toàn bộ cán bộ lên Google Firestore!');
      } else {
        showToast('⚠️ Lỗi khi đồng bộ lên Firestore!');
      }
    } catch {
      showToast('⚠️ Lỗi kết nối Firestore!');
    } finally {
      setIsSyncing(false);
    }
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
    leadSupervisor: users.filter(u => u.role === 'LEAD_SUPERVISOR').length,
    investor: users.filter(u => u.role === 'INVESTOR').length,
    leadInvestor: users.filter(u => u.role === 'LEAD_INVESTOR').length,
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
      case 'LEAD_SUPERVISOR':
        return { label: 'TVGS Trưởng (Giám sát trưởng)', bg: '#f0fdf4', color: '#15803d', border: '#86efac', icon: Award };
      case 'INVESTOR':
        return { label: 'Đại diện CĐT (Ban QLDA)', bg: '#fffbeb', color: '#d97706', border: '#fde68a', icon: Briefcase };
      case 'LEAD_INVESTOR':
        return { label: 'Đại diện CĐT Trưởng (Trưởng Ban QLDA)', bg: '#fef3c7', color: '#b45309', border: '#fcd34d', icon: Award };
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {onSyncAllUsersToCloud && (
            <button
              type="button"
              className="btn-secondary"
              onClick={handleSyncCloud}
              disabled={isSyncing}
              style={{
                background: '#faf5ff',
                borderColor: '#c084fc',
                color: '#7e22ce',
                fontWeight: 700,
                padding: '10px 18px',
                fontSize: '0.88rem',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(126, 34, 206, 0.1)'
              }}
              title="Đồng bộ danh sách 39 cán bộ chính thức lên Google Firestore Cloud"
            >
              <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Đang đồng bộ...' : '☁️ Đồng Bộ 39 Cán Bộ Lên Cloud'}</span>
            </button>
          )}

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
            <option value="LEAD_SUPERVISOR">TVGS Trưởng ({stats.leadSupervisor})</option>
            <option value="INVESTOR">Đại diện CĐT ({stats.investor})</option>
            <option value="LEAD_INVESTOR">Đại diện CĐT Trưởng ({stats.leadInvestor})</option>
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
                      <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, color: '#334155' }}>{user.position || 'Cán bộ'}</span>
                        <span>•</span>
                        <span>{user.company}</span>
                        <span>•</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Phone size={11} /> {user.phone || 'Chưa có SĐT'}
                        </span>
                      </div>

                      {/* Hiển thị quan hệ Trưởng - Cấp dưới trực thuộc */}
                      {user.role === 'LEAD_SUPERVISOR' && (
                        <div style={{ marginTop: '5px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.73rem', background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                            👥 Quản lý: {
                              users.filter(u => (user.subordinateIds && user.subordinateIds.includes(u.uid)) || u.leaderId === user.uid).length
                            } TVGS dưới quyền
                          </span>
                          <span style={{ fontSize: '0.73rem', color: '#64748b' }}>
                            ({
                              users.filter(u => (user.subordinateIds && user.subordinateIds.includes(u.uid)) || u.leaderId === user.uid).map(u => u.fullName).join(', ') || 'Chưa gán cán bộ'
                            })
                          </span>
                        </div>
                      )}

                      {user.role === 'LEAD_INVESTOR' && (
                        <div style={{ marginTop: '5px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.73rem', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                            👥 Quản lý: {
                              users.filter(u => (user.subordinateIds && user.subordinateIds.includes(u.uid)) || u.leaderId === user.uid).length
                            } CĐT dưới quyền
                          </span>
                          <span style={{ fontSize: '0.73rem', color: '#64748b' }}>
                            ({
                              users.filter(u => (user.subordinateIds && user.subordinateIds.includes(u.uid)) || u.leaderId === user.uid).map(u => u.fullName).join(', ') || 'Chưa gán cán bộ'
                            })
                          </span>
                        </div>
                      )}

                      {user.role === 'SUPERVISOR' && (
                        <div style={{ marginTop: '5px' }}>
                          {(() => {
                            const leader = users.find(u => u.uid === user.leaderId || (u.subordinateIds && u.subordinateIds.includes(user.uid)));
                            return leader ? (
                              <span style={{ fontSize: '0.73rem', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                                👑 TVGS Trưởng: <strong>{leader.fullName}</strong>
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.73rem', background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '2px 8px', borderRadius: '6px' }}>
                                ⚠️ Chưa gán TVGS Trưởng phụ trách
                              </span>
                            );
                          })()}
                        </div>
                      )}

                      {user.role === 'INVESTOR' && (
                        <div style={{ marginTop: '5px' }}>
                          {(() => {
                            const leader = users.find(u => u.uid === user.leaderId || (u.subordinateIds && u.subordinateIds.includes(user.uid)));
                            return leader ? (
                              <span style={{ fontSize: '0.73rem', background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                                👑 CĐT Trưởng: <strong>{leader.fullName}</strong>
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.73rem', background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '2px 8px', borderRadius: '6px' }}>
                                ⚠️ Chưa gán CĐT Trưởng phụ trách
                              </span>
                            );
                          })()}
                        </div>
                      )}
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
                      <option value="LEAD_SUPERVISOR">LEAD_SUPERVISOR (TVGS Trưởng)</option>
                      <option value="INVESTOR">INVESTOR (Đại diện CĐT)</option>
                      <option value="LEAD_INVESTOR">LEAD_INVESTOR (CĐT Trưởng)</option>
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
function AddUserModal({ isOpen, onClose, onSave, existingUsers = [] }) {
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

  // Quan hệ phân cấp Trưởng - Cán bộ dưới quyền:
  const [leaderId, setLeaderId] = useState('');
  const [subordinateIds, setSubordinateIds] = useState([]);

  const candidateSupervisors = useMemo(() => {
    return (existingUsers || []).filter(u => u.role === 'SUPERVISOR');
  }, [existingUsers]);

  const candidateInvestors = useMemo(() => {
    return (existingUsers || []).filter(u => u.role === 'INVESTOR');
  }, [existingUsers]);

  const leadSupervisors = useMemo(() => {
    return (existingUsers || []).filter(u => u.role === 'LEAD_SUPERVISOR');
  }, [existingUsers]);

  const leadInvestors = useMemo(() => {
    return (existingUsers || []).filter(u => u.role === 'LEAD_INVESTOR');
  }, [existingUsers]);

  if (!isOpen) return null;

  // Gợi ý nhanh các công ty trong dự án
  const companyPresets = [
    { label: 'ĐVTC: Cty TNHH TVTK Bình Hoà', name: 'Công ty TNHH Tư vấn Thiết kế Bình Hoà', role: 'CONTRACTOR', pos: 'Chỉ huy trưởng' },
    { label: 'ĐVTC: Công ty CP Xây dựng An Phú Gia', name: 'Công ty CP Xây dựng An Phú Gia', role: 'CONTRACTOR', pos: 'Kỹ thuật hiện trường' },
    { label: 'TVGS: Công ty CP TVXD và TM GELICON', name: 'Công ty CP Tư vấn Xây dựng và Thương mại GELICON', role: 'SUPERVISOR', pos: 'Cán bộ tư vấn giám sát' },
    { label: 'TVGS Trưởng: GELICON', name: 'Công ty CP Tư vấn Xây dựng và Thương mại GELICON', role: 'LEAD_SUPERVISOR', pos: 'Tư vấn giám sát trưởng' },
    { label: 'CĐT: Công ty TNHH An Phú Cần Thơ', name: 'Công ty TNHH An Phú Cần Thơ', role: 'INVESTOR', pos: 'Cán bộ ban QLDA' },
    { label: 'CĐT Trưởng: Ban QLDA An Phú', name: 'Công ty TNHH An Phú Cần Thơ', role: 'LEAD_INVESTOR', pos: 'Trưởng Ban QLDA' },
    { label: 'Admin: Ban Quản Trị Hệ Thống APCT', name: 'Ban Quản Trị Hệ Thống APCT', role: 'ADMIN', pos: 'Quản trị viên Hệ thống' }
  ];

  const handleSelectPreset = (preset) => {
    setCompany(preset.name);
    setRole(preset.role);
    setPosition(preset.pos);
    if (preset.role !== 'SUPERVISOR' && preset.role !== 'INVESTOR') setLeaderId('');
    if (preset.role !== 'LEAD_SUPERVISOR' && preset.role !== 'LEAD_INVESTOR') setSubordinateIds([]);
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
      createdAt: new Date().toISOString(),
      ...((role === 'SUPERVISOR' || role === 'INVESTOR') && leaderId ? { leaderId } : {}),
      ...((role === 'LEAD_SUPERVISOR' || role === 'LEAD_INVESTOR') ? { subordinateIds } : {})
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
                  <option value="LEAD_SUPERVISOR">LEAD_SUPERVISOR (Tư vấn giám sát trưởng)</option>
                  <option value="INVESTOR">INVESTOR (Đại diện chủ đầu tư - QLDA)</option>
                  <option value="LEAD_INVESTOR">LEAD_INVESTOR (Đại diện chủ đầu tư trưởng)</option>
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

              {/* 1. NẾU TẠO CÁN BỘ TVGS THƯỜNG -> CHỌN TVGS TRƯỞNG PHỤ TRÁCH */}
              {role === 'SUPERVISOR' && (
                <div className="form-group" style={{ gridColumn: 'span 2', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '12px 14px' }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#15803d', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <Award size={15} color="#16a34a" />
                    <span>Chỉ định TVGS Trưởng trực tiếp quản lý cán bộ này:</span>
                  </label>
                  <select
                    className="form-select"
                    value={leaderId}
                    onChange={(e) => setLeaderId(e.target.value)}
                    style={{ background: '#ffffff', borderColor: '#86efac', fontWeight: 600, color: '#0f172a' }}
                  >
                    <option value="">-- Chưa chỉ định (Không trực thuộc ai) --</option>
                    {leadSupervisors.map(ls => (
                      <option key={ls.uid} value={ls.uid}>
                        👑 {ls.fullName} ({ls.position} • {ls.company})
                      </option>
                    ))}
                  </select>
                  <div style={{ fontSize: '0.74rem', color: '#166534', marginTop: '4px' }}>
                    💡 Khi cán bộ này được chỉ định kiểm tra nghiệm thu, vị TVGS Trưởng được chọn ở trên sẽ tự động xem được phiếu.
                  </div>
                </div>
              )}

              {/* 2. NẾU TẠO CÁN BỘ CĐT THƯỜNG -> CHỌN CĐT TRƯỞNG (TRƯỞNG BAN QLDA) PHỤ TRÁCH */}
              {role === 'INVESTOR' && (
                <div className="form-group" style={{ gridColumn: 'span 2', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px 14px' }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#b45309', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <Award size={15} color="#d97706" />
                    <span>Chỉ định CĐT Trưởng (Trưởng Ban QLDA) trực tiếp quản lý cán bộ này:</span>
                  </label>
                  <select
                    className="form-select"
                    value={leaderId}
                    onChange={(e) => setLeaderId(e.target.value)}
                    style={{ background: '#ffffff', borderColor: '#fde68a', fontWeight: 600, color: '#0f172a' }}
                  >
                    <option value="">-- Chưa chỉ định (Không trực thuộc ai) --</option>
                    {leadInvestors.map(li => (
                      <option key={li.uid} value={li.uid}>
                        👑 {li.fullName} ({li.position} • {li.company})
                      </option>
                    ))}
                  </select>
                  <div style={{ fontSize: '0.74rem', color: '#92400e', marginTop: '4px' }}>
                    💡 Khi cán bộ này được chỉ định phê duyệt nghiệm thu, vị CĐT Trưởng được chọn ở trên sẽ tự động xem được phiếu.
                  </div>
                </div>
              )}

              {/* 3. NẾU TẠO TVGS TRƯỞNG -> TICK CÁC CHECKBOX TVGS DƯỚI QUYỀN */}
              {role === 'LEAD_SUPERVISOR' && (
                <div className="form-group" style={{ gridColumn: 'span 2', background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '12px', padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                    <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#15803d', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Award size={16} color="#16a34a" />
                      <span>Tick chọn các Cán bộ Tư Vấn Giám Sát dưới quyền quản lý:</span>
                    </label>
                    {candidateSupervisors.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (subordinateIds.length === candidateSupervisors.length) {
                            setSubordinateIds([]);
                          } else {
                            setSubordinateIds(candidateSupervisors.map(c => c.uid));
                          }
                        }}
                        style={{ background: 'none', border: 'none', color: '#16a34a', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        {subordinateIds.length === candidateSupervisors.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#475569', marginBottom: '10px' }}>
                    💡 TVGS Trưởng này sẽ xem được tất cả các phiếu yêu cầu & biên bản nghiệm thu do những cán bộ được tick chọn dưới đây phụ trách:
                  </div>
                  {candidateSupervisors.length === 0 ? (
                    <div style={{ padding: '10px 14px', background: '#ffffff', borderRadius: '8px', border: '1px dashed #86efac', fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>
                      Chưa có cán bộ TVGS thường nào trong hệ thống. Hãy tạo cán bộ TVGS trước hoặc bổ sung sau.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '8px' }}>
                      {candidateSupervisors.map(sub => {
                        const isChecked = subordinateIds.includes(sub.uid);
                        return (
                          <label
                            key={sub.uid}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '8px 12px',
                              background: isChecked ? '#dcfce7' : '#ffffff',
                              border: isChecked ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setSubordinateIds(prev => 
                                  prev.includes(sub.uid) ? prev.filter(id => id !== sub.uid) : [...prev, sub.uid]
                                );
                              }}
                              style={{ width: '16px', height: '16px', accentColor: '#16a34a' }}
                            />
                            <div style={{ overflow: 'hidden' }}>
                              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>
                                {sub.fullName}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                {sub.position} • {sub.email}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 4. NẾU TẠO CĐT TRƯỞNG -> TICK CÁC CHECKBOX CĐT DƯỚI QUYỀN */}
              {role === 'LEAD_INVESTOR' && (
                <div className="form-group" style={{ gridColumn: 'span 2', background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '12px', padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                    <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#b45309', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Award size={16} color="#d97706" />
                      <span>Tick chọn các Cán bộ Chủ Đầu Tư dưới quyền quản lý:</span>
                    </label>
                    {candidateInvestors.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (subordinateIds.length === candidateInvestors.length) {
                            setSubordinateIds([]);
                          } else {
                            setSubordinateIds(candidateInvestors.map(c => c.uid));
                          }
                        }}
                        style={{ background: 'none', border: 'none', color: '#b45309', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        {subordinateIds.length === candidateInvestors.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#475569', marginBottom: '10px' }}>
                    💡 CĐT Trưởng này sẽ xem được tất cả các phiếu yêu cầu & biên bản nghiệm thu do những cán bộ được tick chọn dưới đây phụ trách:
                  </div>
                  {candidateInvestors.length === 0 ? (
                    <div style={{ padding: '10px 14px', background: '#ffffff', borderRadius: '8px', border: '1px dashed #fde68a', fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>
                      Chưa có cán bộ CĐT thường nào trong hệ thống. Hãy tạo cán bộ CĐT trước hoặc bổ sung sau.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '8px' }}>
                      {candidateInvestors.map(sub => {
                        const isChecked = subordinateIds.includes(sub.uid);
                        return (
                          <label
                            key={sub.uid}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '8px 12px',
                              background: isChecked ? '#fef3c7' : '#ffffff',
                              border: isChecked ? '1.5px solid #d97706' : '1px solid #cbd5e1',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setSubordinateIds(prev => 
                                  prev.includes(sub.uid) ? prev.filter(id => id !== sub.uid) : [...prev, sub.uid]
                                );
                              }}
                              style={{ width: '16px', height: '16px', accentColor: '#d97706' }}
                            />
                            <div style={{ overflow: 'hidden' }}>
                              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>
                                {sub.fullName}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                {sub.position} • {sub.email}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

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
function EditUserModal({ user, onClose, onSave, existingUsers = [] }) {
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

  // Quan hệ Trưởng - Cấp dưới:
  const initialLeaderId = user.leaderId || (
    existingUsers.find(u => Array.isArray(u.subordinateIds) && u.subordinateIds.includes(user.uid))?.uid || ''
  );
  const [leaderId, setLeaderId] = useState(initialLeaderId);

  const initialSubordinates = useMemo(() => {
    const fromUser = Array.isArray(user.subordinateIds) ? user.subordinateIds : [];
    const fromSubs = (existingUsers || []).filter(u => u.leaderId === user.uid).map(u => u.uid);
    return Array.from(new Set([...fromUser, ...fromSubs]));
  }, [user, existingUsers]);

  const [subordinateIds, setSubordinateIds] = useState(initialSubordinates);

  const candidateSupervisors = useMemo(() => {
    return (existingUsers || []).filter(u => u.role === 'SUPERVISOR' && u.uid !== user.uid);
  }, [existingUsers, user]);

  const candidateInvestors = useMemo(() => {
    return (existingUsers || []).filter(u => u.role === 'INVESTOR' && u.uid !== user.uid);
  }, [existingUsers, user]);

  const leadSupervisors = useMemo(() => {
    return (existingUsers || []).filter(u => u.role === 'LEAD_SUPERVISOR' && u.uid !== user.uid);
  }, [existingUsers, user]);

  const leadInvestors = useMemo(() => {
    return (existingUsers || []).filter(u => u.role === 'LEAD_INVESTOR' && u.uid !== user.uid);
  }, [existingUsers, user]);

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
      status,
      leaderId: (role === 'SUPERVISOR' || role === 'INVESTOR') ? (leaderId || null) : null,
      subordinateIds: (role === 'LEAD_SUPERVISOR' || role === 'LEAD_INVESTOR') ? subordinateIds : []
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
                  <option value="LEAD_SUPERVISOR">LEAD_SUPERVISOR (Tư vấn giám sát trưởng)</option>
                  <option value="INVESTOR">INVESTOR (Đại diện chủ đầu tư)</option>
                  <option value="LEAD_INVESTOR">LEAD_INVESTOR (Đại diện chủ đầu tư trưởng)</option>
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

              {/* 1. NẾU SỬA CÁN BỘ TVGS THƯỜNG -> CHỌN TVGS TRƯỞNG PHỤ TRÁCH */}
              {role === 'SUPERVISOR' && (
                <div className="form-group" style={{ gridColumn: 'span 2', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '12px 14px' }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#15803d', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <Award size={15} color="#16a34a" />
                    <span>Chỉ định TVGS Trưởng trực tiếp quản lý cán bộ này:</span>
                  </label>
                  <select
                    className="form-select"
                    value={leaderId}
                    onChange={(e) => setLeaderId(e.target.value)}
                    style={{ background: '#ffffff', borderColor: '#86efac', fontWeight: 600, color: '#0f172a' }}
                  >
                    <option value="">-- Chưa chỉ định (Không trực thuộc ai) --</option>
                    {leadSupervisors.map(ls => (
                      <option key={ls.uid} value={ls.uid}>
                        👑 {ls.fullName} ({ls.position} • {ls.company})
                      </option>
                    ))}
                  </select>
                  <div style={{ fontSize: '0.74rem', color: '#166534', marginTop: '4px' }}>
                    💡 Khi cán bộ này được chỉ định kiểm tra nghiệm thu, vị TVGS Trưởng được chọn ở trên sẽ tự động xem được phiếu.
                  </div>
                </div>
              )}

              {/* 2. NẾU SỬA CÁN BỘ CĐT THƯỜNG -> CHỌN CĐT TRƯỞNG (TRƯỞNG BAN QLDA) PHỤ TRÁCH */}
              {role === 'INVESTOR' && (
                <div className="form-group" style={{ gridColumn: 'span 2', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px 14px' }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#b45309', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <Award size={15} color="#d97706" />
                    <span>Chỉ định CĐT Trưởng (Trưởng Ban QLDA) trực tiếp quản lý cán bộ này:</span>
                  </label>
                  <select
                    className="form-select"
                    value={leaderId}
                    onChange={(e) => setLeaderId(e.target.value)}
                    style={{ background: '#ffffff', borderColor: '#fde68a', fontWeight: 600, color: '#0f172a' }}
                  >
                    <option value="">-- Chưa chỉ định (Không trực thuộc ai) --</option>
                    {leadInvestors.map(li => (
                      <option key={li.uid} value={li.uid}>
                        👑 {li.fullName} ({li.position} • {li.company})
                      </option>
                    ))}
                  </select>
                  <div style={{ fontSize: '0.74rem', color: '#92400e', marginTop: '4px' }}>
                    💡 Khi cán bộ này được chỉ định phê duyệt nghiệm thu, vị CĐT Trưởng được chọn ở trên sẽ tự động xem được phiếu.
                  </div>
                </div>
              )}

              {/* 3. NẾU SỬA TVGS TRƯỞNG -> TICK CÁC CHECKBOX TVGS DƯỚI QUYỀN */}
              {role === 'LEAD_SUPERVISOR' && (
                <div className="form-group" style={{ gridColumn: 'span 2', background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '12px', padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                    <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#15803d', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Award size={16} color="#16a34a" />
                      <span>Tick chọn các Cán bộ Tư Vấn Giám Sát dưới quyền quản lý:</span>
                    </label>
                    {candidateSupervisors.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (subordinateIds.length === candidateSupervisors.length) {
                            setSubordinateIds([]);
                          } else {
                            setSubordinateIds(candidateSupervisors.map(c => c.uid));
                          }
                        }}
                        style={{ background: 'none', border: 'none', color: '#16a34a', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        {subordinateIds.length === candidateSupervisors.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#475569', marginBottom: '10px' }}>
                    💡 TVGS Trưởng này sẽ xem được tất cả các phiếu yêu cầu & biên bản nghiệm thu do những cán bộ được tick chọn dưới đây phụ trách:
                  </div>
                  {candidateSupervisors.length === 0 ? (
                    <div style={{ padding: '10px 14px', background: '#ffffff', borderRadius: '8px', border: '1px dashed #86efac', fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>
                      Chưa có cán bộ TVGS thường nào trong hệ thống. Hãy tạo cán bộ TVGS trước hoặc bổ sung sau.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '8px' }}>
                      {candidateSupervisors.map(sub => {
                        const isChecked = subordinateIds.includes(sub.uid);
                        return (
                          <label
                            key={sub.uid}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '8px 12px',
                              background: isChecked ? '#dcfce7' : '#ffffff',
                              border: isChecked ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setSubordinateIds(prev => 
                                  prev.includes(sub.uid) ? prev.filter(id => id !== sub.uid) : [...prev, sub.uid]
                                );
                              }}
                              style={{ width: '16px', height: '16px', accentColor: '#16a34a' }}
                            />
                            <div style={{ overflow: 'hidden' }}>
                              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>
                                {sub.fullName}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                {sub.position} • {sub.email}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 4. NẾU SỬA CĐT TRƯỞNG -> TICK CÁC CHECKBOX CĐT DƯỚI QUYỀN */}
              {role === 'LEAD_INVESTOR' && (
                <div className="form-group" style={{ gridColumn: 'span 2', background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '12px', padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                    <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#b45309', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Award size={16} color="#d97706" />
                      <span>Tick chọn các Cán bộ Chủ Đầu Tư dưới quyền quản lý:</span>
                    </label>
                    {candidateInvestors.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (subordinateIds.length === candidateInvestors.length) {
                            setSubordinateIds([]);
                          } else {
                            setSubordinateIds(candidateInvestors.map(c => c.uid));
                          }
                        }}
                        style={{ background: 'none', border: 'none', color: '#b45309', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        {subordinateIds.length === candidateInvestors.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#475569', marginBottom: '10px' }}>
                    💡 CĐT Trưởng này sẽ xem được tất cả các phiếu yêu cầu & biên bản nghiệm thu do những cán bộ được tick chọn dưới đây phụ trách:
                  </div>
                  {candidateInvestors.length === 0 ? (
                    <div style={{ padding: '10px 14px', background: '#ffffff', borderRadius: '8px', border: '1px dashed #fde68a', fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>
                      Chưa có cán bộ CĐT thường nào trong hệ thống. Hãy tạo cán bộ CĐT trước hoặc bổ sung sau.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '8px' }}>
                      {candidateInvestors.map(sub => {
                        const isChecked = subordinateIds.includes(sub.uid);
                        return (
                          <label
                            key={sub.uid}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '8px 12px',
                              background: isChecked ? '#fef3c7' : '#ffffff',
                              border: isChecked ? '1.5px solid #d97706' : '1px solid #cbd5e1',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setSubordinateIds(prev => 
                                  prev.includes(sub.uid) ? prev.filter(id => id !== sub.uid) : [...prev, sub.uid]
                                );
                              }}
                              style={{ width: '16px', height: '16px', accentColor: '#d97706' }}
                            />
                            <div style={{ overflow: 'hidden' }}>
                              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>
                                {sub.fullName}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                {sub.position} • {sub.email}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

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
