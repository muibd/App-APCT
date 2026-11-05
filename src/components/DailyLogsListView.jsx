import React, { useState, useMemo } from 'react';
import { 
  NotebookPen, Plus, Search, Calendar, Clock, Sun, CloudRain, 
  Users, CheckCircle2, AlertCircle, FileText, ChevronRight, Eye, Wrench, ShieldCheck, Trash2, RotateCw,
  RotateCcw
} from 'lucide-react';
import { getDocHierarchyInfo } from './ShopDocumentsView';

export default function DailyLogsListView({
  dailyLogs = [],
  projects = [],
  currentRole,
  currentUser,
  onRefreshLogs,
  onRefreshDailyLogs,
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
  const [selectedDate, setSelectedDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'SUBMITTED' | 'CONFIRMED'
  const [selectedProject, setSelectedProject] = useState('ALL');
  const [selectedPackage, setSelectedPackage] = useState('ALL');
  const [selectedItem, setSelectedItem] = useState('ALL');
  const [isSyncing, setIsSyncing] = useState(false);

  // Thống kê
  const stats = useMemo(() => ({
    total: dailyLogs.length,
    submitted: dailyLogs.filter(l => l.status === 'SUBMITTED').length,
    confirmed: dailyLogs.filter(l => l.status === 'CONFIRMED').length
  }), [dailyLogs]);

  // Danh sách Công trình (Level 1)
  const projectOptions = useMemo(() => {
    const list = [];
    (projects || []).forEach(p => {
      const code = p.code || p.id;
      const name = p.name || p.projectName || `Công trình ${code}`;
      if (!list.some(x => x.name === name)) {
        list.push({ code, name, id: p.id });
      }
    });
    // Bổ sung từ dailyLogs nếu có
    (dailyLogs || []).forEach(l => {
      const { projectName } = getDocHierarchyInfo(l);
      if (projectName && !list.some(x => x.name === projectName)) {
        list.push({ code: l.projectCode || projectName, name: projectName, id: projectName });
      }
    });
    return list;
  }, [projects, dailyLogs]);

  // Danh sách Gói thầu (Level 2 - phụ thuộc vào Công trình nếu có chọn)
  const packageOptions = useMemo(() => {
    const list = [];
    (projects || []).forEach(p => {
      const projCode = p.code || p.id;
      const projName = p.name || p.projectName;
      if (selectedProject !== 'ALL' && selectedProject !== projCode && selectedProject !== projName && selectedProject !== p.id) {
        return;
      }
      (p.contractors || []).forEach(c => {
        (c.packages || []).forEach(pkg => {
          if (!list.some(x => x.name === pkg.name)) {
            list.push({ id: pkg.id, name: pkg.name });
          }
        });
      });
    });
    // Bổ sung từ dailyLogs
    (dailyLogs || []).forEach(l => {
      const { projectName, packageName } = getDocHierarchyInfo(l);
      if (packageName && !list.some(x => x.name === packageName)) {
        if (selectedProject === 'ALL' || selectedProject === projectName || (projects || []).some(p => (p.code === selectedProject || p.id === selectedProject) && p.name === projectName)) {
          list.push({ id: packageName, name: packageName });
        }
      }
    });
    return list;
  }, [projects, dailyLogs, selectedProject]);

  // Danh sách Hạng mục / Công tác (Level 3 - phụ thuộc vào Công trình & Gói thầu nếu có chọn)
  const itemOptions = useMemo(() => {
    const list = [];
    (projects || []).forEach(p => {
      const projCode = p.code || p.id;
      const projName = p.name || p.projectName;
      if (selectedProject !== 'ALL' && selectedProject !== projCode && selectedProject !== projName && selectedProject !== p.id) {
        return;
      }
      (p.contractors || []).forEach(c => {
        (c.packages || []).forEach(pkg => {
          if (selectedPackage !== 'ALL' && pkg.id !== selectedPackage && pkg.name !== selectedPackage) {
            return;
          }
          (pkg.tasks || []).forEach(t => {
            const taskName = typeof t === 'string' ? t : (t.name || t.taskName);
            if (taskName && !list.includes(taskName)) {
              list.push(taskName);
            }
          });
        });
      });
    });
    // Bổ sung từ dailyLogs
    (dailyLogs || []).forEach(l => {
      const { projectName, packageName, itemName } = getDocHierarchyInfo(l);
      if (itemName && !list.includes(itemName)) {
        const matchProj = selectedProject === 'ALL' || selectedProject === projectName || (projects || []).some(p => (p.code === selectedProject || p.id === selectedProject) && p.name === projectName);
        const matchPkg = selectedPackage === 'ALL' || selectedPackage === packageName;
        if (matchProj && matchPkg) {
          list.push(itemName);
        }
      }
    });
    return list;
  }, [projects, dailyLogs, selectedProject, selectedPackage]);

  // Lọc danh sách nhật ký
  const filteredLogs = useMemo(() => {
    return dailyLogs.filter(log => {
      const { projectName: docProjName, packageName: docPkgName, itemName: docItemName } = getDocHierarchyInfo(log);

      // 1. Text search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchNum = (log.logNumber || '').toLowerCase().includes(q);
        const matchWork = (log.workContent || '').toLowerCase().includes(q);
        const matchBuilding = (log.buildingName || docProjName || '').toLowerCase().includes(q);
        const matchPkg = (log.packageName || docPkgName || '').toLowerCase().includes(q);
        const matchItem = (log.itemName || docItemName || '').toLowerCase().includes(q);
        const matchCreator = (log.createdByName || '').toLowerCase().includes(q);
        if (!matchNum && !matchWork && !matchBuilding && !matchPkg && !matchItem && !matchCreator) return false;
      }

      // 2. Lọc theo ngày
      if (selectedDate) {
        const logDate = (log.date || '').slice(0, 10);
        if (logDate !== selectedDate) return false;
      }

      // 3. Lọc theo trạng thái
      if (statusFilter !== 'ALL' && log.status !== statusFilter) {
        return false;
      }

      // 4. Lọc theo Công trình
      if (selectedProject !== 'ALL') {
        const projObj = projectOptions.find(p => p.code === selectedProject || p.id === selectedProject || p.name === selectedProject);
        const targetName = projObj?.name || selectedProject;
        const targetCode = projObj?.code || selectedProject;
        const match = docProjName === targetName ||
          log.buildingName === targetName ||
          log.projectId === selectedProject ||
          log.projectCode === targetCode ||
          (log.buildingName && log.buildingName.toLowerCase().includes(targetName.toLowerCase())) ||
          (log.projectName && log.projectName.toLowerCase().includes(targetName.toLowerCase()));
        if (!match) return false;
      }

      // 5. Lọc theo Gói thầu
      if (selectedPackage !== 'ALL') {
        const match = docPkgName === selectedPackage ||
          log.packageName === selectedPackage ||
          log.packageId === selectedPackage ||
          (log.workContent && log.workContent.toLowerCase().includes(selectedPackage.toLowerCase()));
        if (!match) return false;
      }

      // 6. Lọc theo Hạng mục / Công tác
      if (selectedItem !== 'ALL') {
        const match = docItemName === selectedItem ||
          log.itemName === selectedItem ||
          log.itemId === selectedItem ||
          log.taskName === selectedItem ||
          (log.workContent && log.workContent.toLowerCase().includes(selectedItem.toLowerCase()));
        if (!match) return false;
      }

      return true;
    });
  }, [dailyLogs, searchTerm, selectedDate, statusFilter, selectedProject, selectedPackage, selectedItem, projectOptions]);

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

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {(onRefreshDailyLogs || onRefreshLogs) && (
              <button
                type="button"
                onClick={async () => {
                  const fn = onRefreshDailyLogs || onRefreshLogs;
                  if (!fn) return;
                  setIsSyncing(true);
                  try {
                    await fn();
                  } finally {
                    setTimeout(() => setIsSyncing(false), 600);
                  }
                }}
                className="btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  background: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '8px',
                  cursor: isSyncing ? 'not-allowed' : 'pointer'
                }}
                title="Đồng bộ danh sách nhật ký từ Cloud"
                disabled={isSyncing}
              >
                <RotateCw size={15} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
                <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng Bộ Cloud'}</span>
              </button>
            )}

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

      {/* THANH TÌM KIẾM VÀ BỘ LỌC (HÀNG 1 + HÀNG 2 PHÂN CẤP CÔNG TRÌNH - GÓI THẦU - CÔNG TÁC) */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '14px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginBottom: '18px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        {/* HÀNG 1: TÌM KIẾM, NGÀY, TRẠNG THÁI */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* TÌM KIẾM THEO TỪ KHÓA */}
          <div style={{ position: 'relative', flex: '2 1 240px' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Tìm theo số nhật ký, nội dung công việc, kỹ thuật viên, công trình..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                border: '1.5px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.86rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* LỌC THEO NGÀY NHẬT KÝ */}
          <div style={{ flex: '1 1 160px', position: 'relative' }}>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              title="Lọc theo ngày ghi nhật ký"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: selectedDate ? '1.5px solid #059669' : '1.5px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.86rem',
                color: selectedDate ? '#047857' : '#334155',
                background: selectedDate ? '#f0fdf4' : '#fff',
                fontWeight: selectedDate ? 600 : 400,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* LỌC THEO TRẠNG THÁI (PILLS) */}
          <div className="filter-pills-row" style={{ margin: 0, flexWrap: 'wrap' }}>
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

        {/* HÀNG 2: PHÂN CẤP CÔNG TRÌNH - GÓI THẦU - HẠNG MỤC / CÔNG TÁC */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '12px',
          paddingTop: '10px',
          borderTop: '1px dashed #e2e8f0'
        }}>
          {/* LỌC THEO CÔNG TRÌNH */}
          <div style={{ flex: '1 1 200px' }}>
            <select
              value={selectedProject}
              onChange={(e) => {
                setSelectedProject(e.target.value);
                setSelectedPackage('ALL');
                setSelectedItem('ALL');
              }}
              style={{
                width: '100%',
                padding: '9px 12px',
                border: selectedProject !== 'ALL' ? '1.5px solid #059669' : '1.5px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.86rem',
                fontWeight: selectedProject !== 'ALL' ? 700 : 500,
                color: selectedProject !== 'ALL' ? '#047857' : '#334155',
                background: selectedProject !== 'ALL' ? '#f0fdf4' : '#fff',
                outline: 'none',
                cursor: 'pointer',
                boxSizing: 'border-box'
              }}
            >
              <option value="ALL">🏢 Tất cả công trình</option>
              {projectOptions.map(p => (
                <option key={p.id || p.code} value={p.name}>
                  🏢 {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* LỌC THEO GÓI THẦU */}
          <div style={{ flex: '1 1 220px' }}>
            <select
              value={selectedPackage}
              onChange={(e) => {
                setSelectedPackage(e.target.value);
                setSelectedItem('ALL');
              }}
              style={{
                width: '100%',
                padding: '9px 12px',
                border: selectedPackage !== 'ALL' ? '1.5px solid #d97706' : '1.5px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.86rem',
                fontWeight: selectedPackage !== 'ALL' ? 700 : 500,
                color: selectedPackage !== 'ALL' ? '#b45309' : '#334155',
                background: selectedPackage !== 'ALL' ? '#fffbeb' : '#fff',
                outline: 'none',
                cursor: 'pointer',
                boxSizing: 'border-box'
              }}
            >
              <option value="ALL">📦 Tất cả gói thầu</option>
              {packageOptions.map(pkg => (
                <option key={pkg.id || pkg.name} value={pkg.name}>
                  📦 {pkg.name}
                </option>
              ))}
            </select>
          </div>

          {/* LỌC THEO HẠNG MỤC CÔNG VIỆC / CÔNG TÁC */}
          <div style={{ flex: '1 1 200px' }}>
            <select
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                border: selectedItem !== 'ALL' ? '1.5px solid #4f46e5' : '1.5px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.86rem',
                fontWeight: selectedItem !== 'ALL' ? 700 : 500,
                color: selectedItem !== 'ALL' ? '#4338ca' : '#334155',
                background: selectedItem !== 'ALL' ? '#eef2ff' : '#fff',
                outline: 'none',
                cursor: 'pointer',
                boxSizing: 'border-box'
              }}
            >
              <option value="ALL">📑 Tất cả công tác</option>
              {itemOptions.map((item, idx) => (
                <option key={idx} value={item}>
                  📑 {item}
                </option>
              ))}
            </select>
          </div>

          {/* NÚT XÓA BỘ LỌC */}
          {(searchTerm || selectedDate || statusFilter !== 'ALL' || selectedProject !== 'ALL' || selectedPackage !== 'ALL' || selectedItem !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedDate('');
                setStatusFilter('ALL');
                setSelectedProject('ALL');
                setSelectedPackage('ALL');
                setSelectedItem('ALL');
              }}
              style={{
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#475569',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <RotateCcw size={14} />
              <span>Xóa lọc</span>
            </button>
          )}
        </div>
      </div>

      {/* DANH SÁCH THẺ NHẬT KÝ */}
      <div className="cards-list">
        {filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <NotebookPen size={48} color="#94a3b8" style={{ marginBottom: '12px' }} />
            <h3 style={{ color: '#334155', marginBottom: '6px' }}>Không có nhật ký thi công nào</h3>
            <p style={{ color: '#64748b', fontSize: '0.88rem', maxWidth: '520px', margin: '0 auto 16px auto' }}>
              {currentRole === 'CONTRACTOR' 
                ? 'Bấm nút "+ Tạo Nhật Ký Thi Công" ở góc trên để lập trang nhật ký thi công mới cho ngày hôm nay.' 
                : 'Chưa có bản ghi nhật ký nào hiển thị. Nếu ĐVTC vừa lập trên thiết bị khác, hãy bấm nút bên dưới để đồng bộ dữ liệu ngay lập tức.'}
            </p>
            {(onRefreshDailyLogs || onRefreshLogs) && (
              <button
                type="button"
                onClick={async () => {
                  const fn = onRefreshDailyLogs || onRefreshLogs;
                  if (!fn) return;
                  setIsSyncing(true);
                  try {
                    await fn();
                  } finally {
                    setTimeout(() => setIsSyncing(false), 600);
                  }
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 18px',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  cursor: isSyncing ? 'not-allowed' : 'pointer'
                }}
                disabled={isSyncing}
              >
                <RotateCw size={15} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
                <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng Bộ Từ Cloud Ngay'}</span>
              </button>
            )}
          </div>
        ) : (
          filteredLogs.map(log => {
            const isConfirmed = log.status === 'CONFIRMED';
            const { projectName: docProjName, packageName: docPkgName, itemName: docItemName } = getDocHierarchyInfo(log);

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

                {/* BREADCRUMB CÔNG TRÌNH / GÓI THẦU / HẠNG MỤC */}
                <div className="card-hierarchy-breadcrumb" style={{ marginBottom: '10px' }}>
                  <span>🏢 {log.buildingName || docProjName}</span>
                  {docPkgName && (
                    <>
                      <span>›</span>
                      <span>📦 {docPkgName}</span>
                    </>
                  )}
                  <span>›</span>
                  <span>📑 {log.itemName || docItemName}</span>
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
                    {onDeleteLog && (currentRole === 'CONTRACTOR' && !isConfirmed) && (
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
