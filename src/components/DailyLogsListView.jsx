import React, { useState } from 'react';
import { 
  NotebookPen, Plus, Search, Calendar, Clock, Sun, CloudRain, 
  Users, CheckCircle2, AlertCircle, FileText, ChevronRight, Eye, Wrench, ShieldCheck, Trash2
} from 'lucide-react';

export default function DailyLogsListView({
  dailyLogs = [],
  currentRole,
  currentUser,
  onOpenLog,
  onOpenDailyLog,
  onCreateLog,
  onCreateDailyLog,
  onDeleteLog,
  onDeleteDailyLog
}) {
  const handleOpen = onOpenDailyLog || onOpenLog;
  const handleCreate = onCreateDailyLog || onCreateLog;
  const handleDelete = onDeleteDailyLog || onDeleteLog;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'SUBMITTED' | 'CONFIRMED'
  const [buildingFilter, setBuildingFilter] = useState('ALL');

  // Thống kê
  const stats = {
    total: dailyLogs.length,
    submitted: dailyLogs.filter(l => l.status === 'SUBMITTED').length,
    confirmed: dailyLogs.filter(l => l.status === 'CONFIRMED').length
  };

  // Danh sách công trình độc nhất
  const buildings = Array.from(new Set(dailyLogs.map(l => l.buildingName).filter(Boolean)));

  // Lọc
  const filteredLogs = dailyLogs.filter(log => {
    if (statusFilter !== 'ALL' && log.status !== statusFilter) return false;
    if (buildingFilter !== 'ALL' && log.buildingName !== buildingFilter) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchNum = log.logNumber?.toLowerCase().includes(q);
      const matchWork = log.workContent?.toLowerCase().includes(q);
      const matchBuilding = log.buildingName?.toLowerCase().includes(q);
      const matchItem = log.itemName?.toLowerCase().includes(q);
      const matchCreator = log.createdByName?.toLowerCase().includes(q);
      if (!matchNum && !matchWork && !matchBuilding && !matchItem && !matchCreator) return false;
    }
    return true;
  });

  return (
    <div>
      {/* HEADER BANNER */}
      <div className="dashboard-header" style={{ marginBottom: '20px' }}>
        <div className="dashboard-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div className="dashboard-title">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <NotebookPen size={24} color="#059669" />
              <span>Sổ Nhật Ký Thi Công Xây Dựng</span>
            </h2>
            <div style={{ fontSize: '0.86rem', color: '#64748b', marginTop: '4px' }}>
              Quyển số: 01/2026 - Theo mẫu 1. Nhat ky thi cong.doc (Nghị định số 06/2021/NĐ-CP)
            </div>
          </div>

          {currentRole === 'CONTRACTOR' && (
            <button 
              type="button" 
              className="btn-primary"
              onClick={handleCreate}
              style={{ background: '#059669', borderColor: '#059669', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
            >
              <Plus size={18} />
              <span>Tạo Nhật Ký Thi Công</span>
            </button>
          )}
        </div>

        {/* THỐNG KÊ METRIC CARDS */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginTop: '16px' }}>
          <div 
            className="stat-card" 
            style={{ cursor: 'pointer', border: statusFilter === 'ALL' ? '2px solid #059669' : '1px solid #e2e8f0' }}
            onClick={() => setStatusFilter('ALL')}
          >
            <div className="stat-icon-wrapper stat-icon-blue">
              <NotebookPen size={20} />
            </div>
            <div>
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Tổng ngày nhật ký</div>
            </div>
          </div>

          <div 
            className="stat-card" 
            style={{ cursor: 'pointer', border: statusFilter === 'SUBMITTED' ? '2px solid #f59e0b' : '1px solid #e2e8f0' }}
            onClick={() => setStatusFilter('SUBMITTED')}
          >
            <div className="stat-icon-wrapper stat-icon-amber">
              <Clock size={20} />
            </div>
            <div>
              <div className="stat-value">{stats.submitted}</div>
              <div className="stat-label">Chờ TVGS xác nhận</div>
            </div>
          </div>

          <div 
            className="stat-card" 
            style={{ cursor: 'pointer', border: statusFilter === 'CONFIRMED' ? '2px solid #10b981' : '1px solid #e2e8f0' }}
            onClick={() => setStatusFilter('CONFIRMED')}
          >
            <div className="stat-icon-wrapper stat-icon-green">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div className="stat-value">{stats.confirmed}</div>
              <div className="stat-label">Đã xác nhận 3 bên</div>
            </div>
          </div>
        </div>
      </div>

      {/* THANH TÌM KIẾM VÀ BỘ LỌC */}
      <div className="filter-card" style={{ marginBottom: '18px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px' }}
              placeholder="Tìm theo số nhật ký, nội dung công việc, kỹ thuật viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {buildings.length > 0 && (
            <select
              className="form-select"
              style={{ width: 'auto', minWidth: '180px' }}
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
            >
              <option value="ALL">🏢 Tất cả công trình</option>
              {buildings.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          )}

          <div className="filter-pills-row" style={{ margin: 0 }}>
            <button
              className={`filter-pill ${statusFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setStatusFilter('ALL')}
            >
              Tất cả ({stats.total})
            </button>
            <button
              className={`filter-pill ${statusFilter === 'SUBMITTED' ? 'active' : ''}`}
              onClick={() => setStatusFilter('SUBMITTED')}
            >
              Chờ duyệt ({stats.submitted})
            </button>
            <button
              className={`filter-pill ${statusFilter === 'CONFIRMED' ? 'active' : ''}`}
              onClick={() => setStatusFilter('CONFIRMED')}
            >
              Đã xong ({stats.confirmed})
            </button>
          </div>
        </div>
      </div>

      {/* DANH SÁCH THẺ NHẬT KÝ */}
      <div className="cards-list">
        {filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <NotebookPen size={48} color="#94a3b8" style={{ marginBottom: '12px' }} />
            <h3 style={{ color: '#334155', marginBottom: '6px' }}>Không có nhật ký thi công nào</h3>
            <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
              {currentRole === 'CONTRACTOR' 
                ? 'Bấm nút "+ Tạo Nhật Ký Thi Công" ở góc trên để lập trang nhật ký thi công mới cho ngày hôm nay.' 
                : 'Chưa có bản ghi nhật ký thi công nào phù hợp với bộ lọc.'}
            </p>
          </div>
        ) : (
          filteredLogs.map(log => {
            const isConfirmed = log.status === 'CONFIRMED';

            return (
              <div 
                key={log.id} 
                className="inspection-card"
                style={{
                  border: isConfirmed ? '1.5px solid #a7f3d0' : '1.5px solid #fde68a',
                  background: '#ffffff',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
                onClick={() => handleOpen && handleOpen(log)}
              >
                {/* TOP BAR */}
                <div className="card-top-bar">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span className="card-req-number" style={{ background: '#ecfdf5', color: '#065f46', borderColor: '#a7f3d0' }}>
                      {log.logNumber}
                    </span>

                    {isConfirmed ? (
                      <span className="badge-status badge-approved" style={{ background: '#ecfdf5', color: '#059669', borderColor: '#a7f3d0' }}>
                        <CheckCircle2 size={13} /> Đã Xác Nhận 3 Bên (ĐVTC, TVGS, CĐT)
                      </span>
                    ) : (
                      <span className="badge-status" style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} color="#d97706" /> Chờ TVGS Xác Nhận
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '0.82rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <Calendar size={14} color="#059669" />
                    <span>{log.date ? log.date.split('-').reverse().join('/') : 'Hôm nay'}</span>
                  </div>
                </div>

                {/* THỜI TIẾT TÓM TẮT */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  margin: '8px 0 10px 0',
                  padding: '6px 12px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Sun size={14} color="#d97706" />
                    <span>Sáng: <strong>{log.weather?.morning === 'MƯA' ? '🌧️ Mưa' : '☀️ Nắng'}</strong></span>
                  </div>
                  <span style={{ color: '#cbd5e1' }}>•</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Sun size={14} color="#d97706" />
                    <span>Chiều: <strong>{log.weather?.afternoon === 'MƯA' ? '🌧️ Mưa' : '☀️ Nắng'}</strong></span>
                  </div>
                  <span style={{ color: '#cbd5e1' }}>•</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={14} color="#64748b" />
                    <span>Tối: <strong>{log.weather?.evening === 'MƯA' ? '🌧️ Mưa' : log.weather?.evening === 'KHÔNG THI CÔNG' ? '⛔ Nghỉ' : '🌙 Tạnh'}</strong></span>
                  </div>
                </div>

                {/* CÔNG TÁC THI CÔNG CHÍNH */}
                <h3 className="card-task-title" style={{ fontSize: '0.98rem', marginBottom: '8px', color: '#0f172a' }}>
                  {log.workContent}
                </h3>

                {/* BREADCRUMB CÔNG TRÌNH / HẠNG MỤC */}
                <div className="card-hierarchy-breadcrumb" style={{ marginBottom: '10px' }}>
                  <span>🏢 {log.buildingName}</span>
                  <span>›</span>
                  <span>📑 {log.itemName}</span>
                </div>

                {/* TÌNH HÌNH NHÂN LỰC & THIẾT BỊ */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px', fontSize: '0.82rem', color: '#475569', marginBottom: '12px', padding: '8px 10px', background: '#f1f5f9', borderRadius: '8px' }}>
                  <div>
                    👷‍♂️ <strong>Kỹ thuật:</strong> {log.createdByName || 'KS. Lê Văn Kỹ Thuật'}
                    {log.manpower?.otherPersonnel?.length > 0 && (
                      <span style={{ color: '#2563eb' }}> (+{log.manpower.otherPersonnel.length} KT khác)</span>
                    )}
                  </div>
                  <div>
                    👥 <strong>Công nhân:</strong> {log.manpower?.workers || '35 công nhân'}
                  </div>
                </div>

                {/* Ý KIẾN TVGS NẾU ĐÃ KÝ */}
                {isConfirmed && log.supervisorComments && (
                  <div style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    marginBottom: '10px',
                    fontSize: '0.82rem',
                    color: '#166534'
                  }}>
                    <strong>Ý kiến TVGS:</strong> "{log.supervisorComments}"
                  </div>
                )}

                {/* FOOTER ACTIONS */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px dashed #e2e8f0' }}>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    {isConfirmed ? (
                      <span style={{ color: '#059669', fontWeight: 600 }}>✓ TVGS ({log.signatures?.supervisor?.name || 'Đinh Xuân Thám'}) & CĐT đã xác nhận</span>
                    ) : (
                      <span style={{ color: '#d97706', fontWeight: 600 }}>⏳ Chờ TVGS ({log.assignedSupervisor?.name || log.representatives?.supervisor?.representative || 'TVGS'}) ký duyệt</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {onDeleteLog && (currentRole === 'ADMIN' || !isConfirmed) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Bạn có chắc muốn xóa nhật ký ${log.logNumber}?`)) {
                            handleDelete && handleDelete(log.id);
                          }
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc2626',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Xóa nhật ký này"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: '4px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpen && handleOpen(log);
                      }}
                    >
                      <Eye size={14} />
                      <span>Xem Nhật Ký</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
