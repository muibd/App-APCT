import React, { useState } from 'react';
import { 
  FileText, Search, Filter, CheckCircle2, Clock, XCircle, 
  AlertTriangle, Printer, Eye, Award, MapPin, Calendar, 
  Camera, ShieldCheck, PenTool, ArrowRight, UserCheck, 
  Building2, Layers, Check, ChevronRight, AlertCircle, 
  RotateCcw, Wrench
} from 'lucide-react';

export default function ReportsListView({ 
  reports, 
  currentRole, 
  currentUser, 
  onOpenReport 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'COMPLETED' | 'REJECTED' | 'RECTIFIED' | 'PENDING'

  // Helper tính trạng thái từng biên bản
  const getReportStatus = (report) => {
    const inv = report.attendees?.investor?.signed;
    const sup = report.attendees?.supervisor?.signed;
    const con = report.attendees?.contractor?.signed;
    if (report.status === 'COMPLETED' || (inv && sup && con !== false)) {
      return 'COMPLETED';
    }
    if (report.status === 'WAITING_INVESTOR' || (sup && !inv && report.conclusion?.isAccepted !== false)) {
      return 'WAITING_INVESTOR';
    }
    if (report.status === 'RECTIFIED') {
      return 'RECTIFIED';
    }
    if (report.conclusion?.isAccepted === false || report.status === 'REJECTED') {
      return 'REJECTED';
    }
    return 'PENDING';
  };

  // Lọc theo search & status
  const filteredReports = reports.filter(rep => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      rep.reportNumber?.toLowerCase().includes(query) ||
      rep.inspectionObject?.toLowerCase().includes(query) ||
      rep.projectInfo?.buildingName?.toLowerCase().includes(query) ||
      rep.projectInfo?.itemName?.toLowerCase().includes(query) ||
      rep.referenceDocNumber?.toLowerCase().includes(query);

    const repStatus = getReportStatus(rep);
    let matchesStatus = true;
    if (statusFilter === 'COMPLETED') matchesStatus = repStatus === 'COMPLETED';
    if (statusFilter === 'REJECTED') matchesStatus = repStatus === 'REJECTED';
    if (statusFilter === 'RECTIFIED') matchesStatus = repStatus === 'RECTIFIED';
    if (statusFilter === 'PENDING') matchesStatus = repStatus === 'PENDING' || repStatus === 'WAITING_INVESTOR';

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: reports.length,
    completed: reports.filter(r => getReportStatus(r) === 'COMPLETED').length,
    rejected: reports.filter(r => getReportStatus(r) === 'REJECTED').length,
    rectified: reports.filter(r => getReportStatus(r) === 'RECTIFIED').length,
    pending: reports.filter(r => getReportStatus(r) === 'PENDING').length,
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
      {/* HEADER BẢNG QUẢN LÝ BIÊN BẢN */}
      <div className="dashboard-header" style={{ marginBottom: '20px' }}>
        <div className="dashboard-title-row">
          <div className="dashboard-title">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>📑 Hồ Sơ Biên Bản Nghiệm Thu Công Việc Xây Dựng</span>
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: '#64748b' }}>
              Chuẩn mẫu Nghị định 06/2021/NĐ-CP • Ký số điện tử 3 bên (Chủ đầu tư - TVGS - ĐVTC)
            </p>
          </div>
        </div>

        {/* 4 STAT CARDS */}
        <div className="stats-grid reports-stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrapper stat-icon-blue">
              <FileText size={22} />
            </div>
            <div>
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Tổng biên bản hiện có</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper stat-icon-green">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <div className="stat-value">{stats.completed}</div>
              <div className="stat-label">Đã duyệt hoàn tất (3/3)</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper stat-icon-red">
              <AlertTriangle size={22} />
            </div>
            <div>
              <div className="stat-value">{stats.rejected}</div>
              <div className="stat-label">Chưa đạt (Cần sửa chữa)</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: '#f3e8ff', color: '#7c3aed' }}>
              <RotateCcw size={22} />
            </div>
            <div>
              <div className="stat-value">{stats.rectified}</div>
              <div className="stat-label">Đã sửa (Chờ duyệt lại)</div>
            </div>
          </div>
        </div>

        {/* TOOLBAR SEARCH & FILTERS */}
        <div className="toolbar-row" style={{ marginTop: '16px' }}>
          <div className="search-input-box" style={{ flex: 1, minWidth: '280px' }}>
            <Search size={18} />
            <input 
              type="text" 
              className="search-input"
              placeholder="Tìm theo số hiệu BB (036, 02), nội dung công tác, hạng mục..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-pills">
            <button 
              className={`filter-pill ${statusFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setStatusFilter('ALL')}
            >
              Tất cả ({reports.length})
            </button>
            <button 
              className={`filter-pill ${statusFilter === 'COMPLETED' ? 'active' : ''}`}
              onClick={() => setStatusFilter('COMPLETED')}
            >
              Đã duyệt ({stats.completed})
            </button>
            <button 
              className={`filter-pill ${statusFilter === 'REJECTED' ? 'active' : ''}`}
              onClick={() => setStatusFilter('REJECTED')}
            >
              Chưa đạt ({stats.rejected})
            </button>
            <button 
              className={`filter-pill ${statusFilter === 'RECTIFIED' ? 'active' : ''}`}
              onClick={() => setStatusFilter('RECTIFIED')}
            >
              Đã sửa ({stats.rectified})
            </button>
            <button 
              className={`filter-pill ${statusFilter === 'PENDING' ? 'active' : ''}`}
              onClick={() => setStatusFilter('PENDING')}
            >
              Chờ ký ({stats.pending})
            </button>
          </div>
        </div>
      </div>

      {/* DANH SÁCH BIÊN BẢN (CARD GRID LAYOUT HIỆN ĐẠI) */}
      {filteredReports.length === 0 ? (
        <div className="empty-state-card" style={{ padding: '60px 20px', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <FileText size={54} color="#94a3b8" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.15rem', color: '#1e293b' }}>Không tìm thấy biên bản nghiệm thu nào</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Thử thay đổi từ khóa tìm kiếm hoặc chuyển sang bộ lọc trạng thái khác.</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 460px), 1fr))', 
          gap: '16px',
          alignItems: 'stretch'
        }}>
          {filteredReports.map((report) => {
            const status = getReportStatus(report);
            const isRectified = status === 'RECTIFIED';
            const isRejected = status === 'REJECTED';
            const isCompleted = status === 'COMPLETED';
            const isWaitingInvestor = status === 'WAITING_INVESTOR';

            const investorSigned = report.attendees?.investor?.signed;
            const supervisorSigned = report.attendees?.supervisor?.signed;
            const contractorSigned = report.attendees?.contractor?.signed;

            const signedCount = [investorSigned, supervisorSigned, contractorSigned].filter(Boolean).length;

            return (
              <div 
                key={report.id}
                style={{
                  background: '#ffffff',
                  border: isWaitingInvestor
                    ? '1.5px solid #93c5fd'
                    : isRectified 
                    ? '1.5px solid #d8b4fe' 
                    : isRejected 
                    ? '1.5px solid #fca5a5' 
                    : isCompleted 
                    ? '1.5px solid #a7f3d0' 
                    : '1px solid #e2e8f0',
                  borderRadius: '16px',
                  boxShadow: isWaitingInvestor
                    ? '0 4px 16px rgba(37, 99, 235, 0.08)'
                    : isRectified
                    ? '0 4px 16px rgba(124, 58, 237, 0.08)'
                    : isRejected 
                    ? '0 4px 16px rgba(239, 68, 68, 0.08)' 
                    : isCompleted 
                    ? '0 4px 16px rgba(16, 185, 129, 0.08)' 
                    : '0 4px 16px rgba(15, 23, 42, 0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                {/* DẢI MÀU TRẠNG THÁI TRÊN ĐẦU CARD */}
                <div style={{
                  height: '4px',
                  background: isWaitingInvestor
                    ? 'linear-gradient(90deg, #2563eb, #3b82f6)'
                    : isRectified
                    ? 'linear-gradient(90deg, #7c3aed, #2563eb)'
                    : isRejected 
                    ? 'linear-gradient(90deg, #ef4444, #dc2626)' 
                    : isCompleted 
                    ? 'linear-gradient(90deg, #10b981, #059669)' 
                    : 'linear-gradient(90deg, #f59e0b, #d97706)'
                }} />

                {/* HEADER CỦA CARD */}
                <div style={{ 
                  padding: '16px 20px 12px 20px', 
                  borderBottom: '1px solid #f1f5f9',
                  background: '#fafafa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      background: '#1e3a8a',
                      color: '#ffffff',
                      padding: '5px 10px',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      fontFamily: 'monospace',
                      letterSpacing: '0.03em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <FileText size={14} />
                      <span>{report.reportNumber}</span>
                    </div>

                    {report.referenceDocNumber && (
                      <span style={{ 
                        fontSize: '0.76rem', 
                        color: '#475569', 
                        background: '#e2e8f0', 
                        padding: '4px 8px', 
                        borderRadius: '6px',
                        fontWeight: 600
                      }}>
                        {report.referenceDocNumber}
                      </span>
                    )}
                  </div>

                  {/* STATUS BADGE */}
                  <div>
                    {isRectified && (
                      <span style={{ 
                        background: '#f3e8ff', 
                        color: '#6b21a8', 
                        border: '1px solid #d8b4fe',
                        padding: '4px 10px', 
                        borderRadius: '20px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        <RotateCcw size={14} color="#7c3aed" />
                        <span>Đã Sửa (Chờ Duyệt Lại)</span>
                      </span>
                    )}

                    {isRejected && (
                      <span style={{ 
                        background: '#fee2e2', 
                        color: '#b91c1c', 
                        border: '1px solid #fca5a5',
                        padding: '4px 10px', 
                        borderRadius: '20px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        <XCircle size={14} color="#dc2626" />
                        <span>Chưa Đạt Nghiệm Thu</span>
                      </span>
                    )}

                    {isCompleted && (
                      <span style={{ 
                        background: '#ecfdf5', 
                        color: '#065f46', 
                        border: '1px solid #a7f3d0',
                        padding: '4px 10px', 
                        borderRadius: '20px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        <CheckCircle2 size={14} color="#059669" />
                        <span>Đã Hoàn Tất (3/3)</span>
                      </span>
                    )}

                    {isWaitingInvestor && (
                      <span style={{ 
                        background: '#eff6ff', 
                        color: '#1d4ed8', 
                        border: '1px solid #bfdbfe',
                        padding: '4px 10px', 
                        borderRadius: '20px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        <Clock size={14} color="#2563eb" />
                        <span>Chờ CĐT Phê Duyệt ({signedCount}/3)</span>
                      </span>
                    )}

                    {!isRectified && !isRejected && !isCompleted && !isWaitingInvestor && (
                      <span style={{ 
                        background: '#fffbeb', 
                        color: '#b45309', 
                        border: '1px solid #fde68a',
                        padding: '4px 10px', 
                        borderRadius: '20px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        <Clock size={14} color="#d97706" />
                        <span>Chờ Ký Duyệt ({signedCount}/3)</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* THÂN CARD */}
                <div style={{ padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* TIÊU ĐỀ CÔNG TÁC NGHIỆM THU */}
                  <h3 style={{ 
                    margin: '0 0 10px 0', 
                    fontSize: '1.02rem', 
                    fontWeight: 700, 
                    color: '#0f172a', 
                    lineHeight: 1.4 
                  }}>
                    {report.inspectionObject}
                  </h3>

                  {/* BREADCRUMB VỊ TRÍ HIỆN TRƯỜNG */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    fontSize: '0.8rem', 
                    color: '#64748b', 
                    marginBottom: '14px',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', padding: '3px 8px', borderRadius: '4px', color: '#334155', fontWeight: 600 }}>
                      <Building2 size={13} color="#2563eb" />
                      <span>{report.projectInfo?.buildingName || 'Công trình'}</span>
                    </span>
                    <span>›</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', padding: '3px 8px', borderRadius: '4px', color: '#334155' }}>
                      <Layers size={13} color="#059669" />
                      <span>{report.projectInfo?.itemName || 'Hạng mục'}</span>
                    </span>
                  </div>

                  {/* NGÀY GIỜ LẬP */}
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} color="#94a3b8" />
                    <span>{report.cityDate || 'Tháng 10/2026'} • Tại: {report.time?.place || report.projectInfo?.location}</span>
                  </div>

                  {/* 1. HỘP ĐÃ SỬA CHỮA (NẾU ĐÃ KHẮC PHỤC) */}
                  {isRectified && (
                    <div style={{ 
                      background: '#f5f3ff', 
                      border: '1.5px solid #d8b4fe', 
                      borderRadius: '10px', 
                      padding: '12px 14px', 
                      marginBottom: '14px' 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: '#6b21a8', fontSize: '0.84rem' }}>
                        <RotateCcw size={18} color="#7c3aed" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 700, color: '#6b21a8', marginBottom: '2px' }}>
                            ĐVTC đã báo cáo khắc phục xong:
                          </div>
                          <div style={{ color: '#581c87', fontStyle: 'italic' }}>
                            "{report.rectification?.description}"
                          </div>
                          <div style={{ marginTop: '4px', color: '#7c3aed', fontSize: '0.78rem', fontWeight: 600 }}>
                            📸 Đã đính kèm {report.rectification?.photos?.length || 0} ảnh hiện trường sau sửa chữa
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. HỘP CẢNH BÁO LỖI (NẾU CHƯA SỬA) */}
                  {!isRectified && isRejected && (
                    <div style={{ 
                      background: '#fff1f2', 
                      border: '1.5px solid #fecaca', 
                      borderRadius: '10px', 
                      padding: '12px 14px', 
                      marginBottom: '14px' 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: '#991b1b', fontSize: '0.84rem' }}>
                        <AlertTriangle size={18} color="#dc2626" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 700, color: '#991b1b', marginBottom: '2px' }}>
                            Lý do không nghiệm thu:
                          </div>
                          <div style={{ color: '#7f1d1d', fontStyle: 'italic' }}>
                            "{report.conclusion?.rejectionReason}"
                          </div>
                          {report.conclusion?.repairRequired && (
                            <div style={{ marginTop: '4px', color: '#b91c1c', fontSize: '0.8rem' }}>
                              <strong>Yêu cầu:</strong> {report.conclusion.repairRequired}
                            </div>
                          )}
                          {report.conclusion?.deadline && (
                            <div style={{ marginTop: '2px', color: '#64748b', fontSize: '0.76rem' }}>
                              <strong>Thời hạn:</strong> {report.conclusion.deadline}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* HỘP TIẾN ĐỘ KÝ 3 BÊN */}
                  <div style={{ 
                    background: '#f8fafc', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '12px', 
                    padding: '12px',
                    marginTop: 'auto',
                    marginBottom: '14px'
                  }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Tiến độ ký duyệt 3 bên:
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {/* CĐT */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#ffffff', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.85rem' }}>🏢</span>
                          <div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b' }}>
                              Chủ Đầu Tư: {report.attendees?.investor?.person || 'Ngô Quý Linh'}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Ban QLDA An Phú Cần Thơ</div>
                          </div>
                        </div>
                        <div>
                          {isRectified ? (
                            <span style={{ fontSize: '0.72rem', color: '#7c3aed', fontWeight: 600, background: '#f3e8ff', padding: '2px 8px', borderRadius: '4px' }}>Chờ duyệt lại</span>
                          ) : isRejected && (report.conclusion?.rejectedBy?.role === 'INVESTOR' || report.conclusion?.rejectedBy?.role === 'LEAD_INVESTOR') ? (
                            <span style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 700, background: '#fee2e2', padding: '2px 8px', borderRadius: '4px' }}>❌ Từ chối</span>
                          ) : investorSigned ? (
                            <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700, background: '#ecfdf5', padding: '2px 8px', borderRadius: '4px' }}>✓ Đã ký</span>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>Chờ ký</span>
                          )}
                        </div>
                      </div>

                      {/* TVGS */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#ffffff', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.85rem' }}>👁️</span>
                          <div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b' }}>
                              Tư Vấn Giám Sát: {report.attendees?.supervisor?.person || 'Đinh Xuân Thám'}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>GELICON</div>
                          </div>
                        </div>
                        <div>
                          {isRectified ? (
                            <span style={{ fontSize: '0.72rem', color: '#7c3aed', fontWeight: 600, background: '#f3e8ff', padding: '2px 8px', borderRadius: '4px' }}>Chờ nghiệm thu</span>
                          ) : isRejected && (report.conclusion?.rejectedBy?.role === 'SUPERVISOR' || report.conclusion?.rejectedBy?.role === 'LEAD_SUPERVISOR') ? (
                            <span style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 700, background: '#fee2e2', padding: '2px 8px', borderRadius: '4px' }}>❌ Từ chối</span>
                          ) : supervisorSigned ? (
                            <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700, background: '#ecfdf5', padding: '2px 8px', borderRadius: '4px' }}>✓ Đã ký</span>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>Chờ ký</span>
                          )}
                        </div>
                      </div>

                      {/* ĐVTC */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#ffffff', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.85rem' }}>👷‍♂️</span>
                          <div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b' }}>
                              Đơn Vị Thi Công: {report.attendees?.contractor?.person || 'Phạm Thanh Nhàn'}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                              {report.attendees?.contractor?.company?.includes('Bình Hoà') ? 'Bình Hoà' : 'An Phú Gia'}
                            </div>
                          </div>
                        </div>
                        <div>
                          {contractorSigned ? (
                            <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700, background: '#ecfdf5', padding: '2px 8px', borderRadius: '4px' }}>✓ Đã xác nhận</span>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>Chờ ký</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* THUMBNAIL HOẶC BADGE ẢNH */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {report.rectification?.photos?.length > 0 && (
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '4px', 
                          fontSize: '0.74rem', 
                          color: '#7c3aed', 
                          background: '#f3e8ff', 
                          padding: '3px 8px', 
                          borderRadius: '6px',
                          fontWeight: 700
                        }}>
                          <Camera size={13} />
                          <span>{report.rectification.photos.length} ảnh đã sửa</span>
                        </span>
                      )}

                      {report.defectPhotos?.length > 0 && (
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '4px', 
                          fontSize: '0.74rem', 
                          color: '#dc2626', 
                          background: '#fee2e2', 
                          padding: '3px 8px', 
                          borderRadius: '6px',
                          fontWeight: 700
                        }}>
                          <Camera size={13} />
                          <span>{report.defectPhotos.length} ảnh lỗi hiện trường</span>
                        </span>
                      )}

                      {report.evidencePhotos?.length > 0 && (
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '4px', 
                          fontSize: '0.74rem', 
                          color: '#2563eb', 
                          background: '#eff6ff', 
                          padding: '3px 8px', 
                          borderRadius: '6px',
                          fontWeight: 600
                        }}>
                          <Camera size={13} />
                          <span>{report.evidencePhotos.length} ảnh GPS</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* FOOTER CỦA CARD VỚI NÚT HÀNH ĐỘNG NỔI BẬT */}
                <div style={{ 
                  padding: '12px 20px', 
                  background: '#f8fafc', 
                  borderTop: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                    Mẫu NĐ 06/2021/NĐ-CP
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {/* 1. NẾU ĐÃ SỬA CHỮA XONG (RECTIFIED) */}
                    {isRectified ? (
                      <>
                        {(currentRole === 'SUPERVISOR' || currentRole === 'LEAD_SUPERVISOR' || currentRole === 'INVESTOR' || currentRole === 'LEAD_INVESTOR' || currentRole === 'ADMIN') ? (
                          <button 
                            className="btn-success"
                            style={{ padding: '8px 14px', fontSize: '0.84rem' }}
                            onClick={() => onOpenReport(report)}
                          >
                            <CheckCircle2 size={15} />
                            <span>Kiểm Tra Ảnh Sửa & Nghiệm Thu Lại</span>
                          </button>
                        ) : (
                          <button 
                            className="btn-primary"
                            style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', padding: '8px 14px', fontSize: '0.84rem' }}
                            onClick={() => onOpenReport(report)}
                          >
                            <FileText size={15} />
                            <span>Xem Báo Cáo Sửa & Biên Bản A4</span>
                          </button>
                        )}
                      </>
                    ) : isRejected ? (
                      /* 2. NẾU ĐANG CHƯA ĐẠT (CẦN SỬA) */
                      <>
                        {/* NÚT CHO ĐVTC: GỬI ẢNH SỬA & MỜI NGHIỆM THU LẠI */}
                        {(currentRole === 'CONTRACTOR' || currentRole === 'ADMIN') && (
                          <button 
                            className="btn-primary"
                            style={{ 
                              background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                              padding: '8px 14px',
                              fontSize: '0.84rem'
                            }}
                            onClick={() => onOpenReport(report, { openRectify: true })}
                          >
                            <Wrench size={15} />
                            <span>Gửi Ảnh Sửa & Mời Nghiệm Thu Lại</span>
                          </button>
                        )}

                        <button 
                          className="btn-secondary"
                          style={{ padding: '8px 12px', fontSize: '0.84rem', borderColor: '#fca5a5', color: '#b91c1c' }}
                          onClick={() => onOpenReport(report)}
                        >
                          <FileText size={15} />
                          <span>Xem Lỗi Chi Tiết</span>
                        </button>
                      </>
                    ) : (
                      /* 3. BIÊN BẢN BÌNH THƯỜNG HOẶC ĐÃ HOÀN TẤT */
                      <>
                        {isCompleted && (
                          <button 
                            className="btn-secondary"
                            style={{ padding: '8px 12px', fontSize: '0.84rem' }}
                            onClick={() => onOpenReport(report)}
                            title="In / Xuất PDF Biên Bản A4"
                          >
                            <Printer size={15} />
                            <span>In A4</span>
                          </button>
                        )}
                        <button 
                          className="btn-primary" 
                          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                          onClick={() => onOpenReport(report)}
                        >
                          <FileText size={15} />
                          <span>{isCompleted ? 'Xem Biên Bản A4' : 'Xem & Ký Biên Bản A4'}</span>
                          <ChevronRight size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
