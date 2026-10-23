import React, { useState } from 'react';
import { 
  Award, Plus, Search, Filter, CheckCircle2, Clock, 
  FileText, Building, MapPin, Calendar, Layers, Eye, Trash2, Printer, Check, ChevronRight
} from 'lucide-react';

export default function CompletionReportsListView({
  reports = [],
  currentUser,
  currentRole,
  onCreateReport,
  onOpenReport,
  onDeleteReport
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [templateFilter, setTemplateFilter] = useState('ALL'); // 'ALL' | 'PROJECT_USE' | 'STAGE' | 'DOSSIER'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'COMPLETED' | 'PENDING'

  const filteredReports = reports.filter(rep => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      rep.reportNumber?.toLowerCase().includes(query) ||
      rep.inspectionObject?.toLowerCase().includes(query) ||
      rep.buildingName?.toLowerCase().includes(query) ||
      rep.itemName?.toLowerCase().includes(query) ||
      rep.stageName?.toLowerCase().includes(query);

    const matchesTemplate = templateFilter === 'ALL' || rep.completionType === templateFilter;

    const isCompleted = rep.status === 'COMPLETED' || (
      rep.signatures?.investor?.signed && 
      rep.signatures?.supervisor?.signed && 
      rep.signatures?.contractor?.signed
    );

    const matchesStatus = 
      statusFilter === 'ALL' ||
      (statusFilter === 'COMPLETED' && isCompleted) ||
      (statusFilter === 'PENDING' && !isCompleted);

    return matchesSearch && matchesTemplate && matchesStatus;
  });

  const stats = {
    total: reports.length,
    projectUse: reports.filter(r => r.completionType === 'PROJECT_USE').length,
    stage: reports.filter(r => r.completionType === 'STAGE').length,
    dossier: reports.filter(r => r.completionType === 'DOSSIER').length,
    completed: reports.filter(r => r.status === 'COMPLETED' || (r.signatures?.investor?.signed && r.signatures?.supervisor?.signed)).length,
    pending: reports.filter(r => r.status !== 'COMPLETED' && (!r.signatures?.investor?.signed || !r.signatures?.supervisor?.signed)).length
  };

  const getTemplateLabel = (type) => {
    switch (type) {
      case 'PROJECT_USE':
        return {
          title: 'Mẫu 1: Hoàn Thành Công Trình',
          badge: '🏛️ Hạng Mục / Công Trình Đưa Vào Sử Dụng',
          color: '#1d4ed8',
          bg: '#eff6ff',
          border: '#bfdbfe'
        };
      case 'DOSSIER':
        return {
          title: 'Mẫu 3: Kiểm Tra Hồ Sơ Hoàn Thành',
          badge: '📁 Kiểm Tra Hồ Sơ Chất Lượng Hoàn Thành',
          color: '#b45309',
          bg: '#fef3c7',
          border: '#fde68a'
        };
      case 'STAGE':
      default:
        return {
          title: 'Mẫu 2: Hoàn Thành Giai Đoạn Thi Công',
          badge: '📑 Hoàn Thành Giai Đoạn Thi Công',
          color: '#047857',
          bg: '#ecfdf5',
          border: '#a7f3d0'
        };
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
      {/* HEADER */}
      <div className="dashboard-header" style={{ marginBottom: '20px' }}>
        <div className="dashboard-title-row">
          <div className="dashboard-title">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>🏆 Phân Hệ Biên Bản Nghiệm Thu Hoàn Thành</span>
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: '#64748b' }}>
              Quy chuẩn Nghị định 06/2021/NĐ-CP • Nghiệm thu giai đoạn & công trình đưa vào sử dụng • Ký duyệt cấp Trưởng
            </p>
          </div>

          {currentRole === 'CONTRACTOR' && (
            <button 
              className="btn-primary" 
              onClick={onCreateReport}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
                boxShadow: '0 4px 12px rgba(37,99,235,0.2)'
              }}
            >
              <Plus size={18} />
              <span>Lập Biên Bản Hoàn Thành Mới</span>
            </button>
          )}
        </div>

        {/* 4 STAT CARDS */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginTop: '16px' }}>
          <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => { setTemplateFilter('ALL'); setStatusFilter('ALL'); }}>
            <div className="stat-icon-wrapper stat-icon-blue">
              <Award size={22} />
            </div>
            <div>
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Tổng biên bản hoàn thành</div>
            </div>
          </div>

          <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => { setTemplateFilter('STAGE'); setStatusFilter('ALL'); }}>
            <div className="stat-icon-wrapper" style={{ background: '#ecfdf5', color: '#059669' }}>
              <FileText size={22} />
            </div>
            <div>
              <div className="stat-value">{stats.stage}</div>
              <div className="stat-label">Giai đoạn thi công (Mẫu 2)</div>
            </div>
          </div>

          <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => { setTemplateFilter('PROJECT_USE'); setStatusFilter('ALL'); }}>
            <div className="stat-icon-wrapper" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
              <Building size={22} />
            </div>
            <div>
              <div className="stat-value">{stats.projectUse}</div>
              <div className="stat-label">Đưa vào sử dụng (Mẫu 1)</div>
            </div>
          </div>

          <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => { setTemplateFilter('ALL'); setStatusFilter('COMPLETED'); }}>
            <div className="stat-icon-wrapper stat-icon-green">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <div className="stat-value">{stats.completed}</div>
              <div className="stat-label">Đã duyệt hoàn tất ({stats.completed}/{stats.total})</div>
            </div>
          </div>
        </div>

        {/* TOOLBAR SEARCH & FILTERS */}
        <div className="toolbar-row" style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-input-box" style={{ flex: 1, minWidth: '280px' }}>
            <Search size={18} />
            <input 
              type="text" 
              className="search-input"
              placeholder="Tìm theo số hiệu BB (02/BBNT-GDTC), công trình, giai đoạn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* TEMPLATE FILTER PILLS */}
          <div className="filter-pills" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button 
              className={`filter-pill ${templateFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setTemplateFilter('ALL')}
            >
              Tất cả mẫu ({stats.total})
            </button>
            <button 
              className={`filter-pill ${templateFilter === 'STAGE' ? 'active' : ''}`}
              onClick={() => setTemplateFilter('STAGE')}
            >
              📑 Giai đoạn ({stats.stage})
            </button>
            <button 
              className={`filter-pill ${templateFilter === 'PROJECT_USE' ? 'active' : ''}`}
              onClick={() => setTemplateFilter('PROJECT_USE')}
            >
              🏛️ Đưa vào sử dụng ({stats.projectUse})
            </button>
            <button 
              className={`filter-pill ${templateFilter === 'DOSSIER' ? 'active' : ''}`}
              onClick={() => setTemplateFilter('DOSSIER')}
            >
              📁 Kiểm tra hồ sơ ({stats.dossier})
            </button>
          </div>

          {/* STATUS FILTER PILLS */}
          <div className="filter-pills" style={{ display: 'flex', gap: '6px' }}>
            <button 
              className={`filter-pill ${statusFilter === 'COMPLETED' ? 'active' : ''}`}
              onClick={() => setStatusFilter(statusFilter === 'COMPLETED' ? 'ALL' : 'COMPLETED')}
              style={{ background: statusFilter === 'COMPLETED' ? '#059669' : '' }}
            >
              ✓ Đã duyệt ({stats.completed})
            </button>
            <button 
              className={`filter-pill ${statusFilter === 'PENDING' ? 'active' : ''}`}
              onClick={() => setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
              style={{ background: statusFilter === 'PENDING' ? '#d97706' : '' }}
            >
              ⏳ Chờ ký ({stats.pending})
            </button>
          </div>
        </div>
      </div>

      {/* DANH SÁCH BIÊN BẢN HOÀN THÀNH */}
      {filteredReports.length === 0 ? (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <Award size={54} color="#94a3b8" style={{ margin: '0 auto 12px auto', display: 'block' }} />
          <h3 style={{ fontSize: '1.15rem', color: '#1e293b', margin: '0 0 6px 0' }}>
            Chưa có biên bản nghiệm thu hoàn thành nào
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0 }}>
            {currentRole === 'CONTRACTOR' 
              ? 'Bấm nút "+ Lập Biên Bản Hoàn Thành Mới" ở góc trên để tạo biên bản theo quy chuẩn Nghị định 06/2021/NĐ-CP.' 
              : 'Hiện chưa có biên bản hoàn thành nào được Đơn vị thi công gửi lên.'}
          </p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 450px), 1fr))', 
          gap: '16px',
          alignItems: 'stretch'
        }}>
          {filteredReports.map((report) => {
            const isCompleted = report.status === 'COMPLETED' || (
              report.signatures?.investor?.signed && 
              report.signatures?.supervisor?.signed && 
              report.signatures?.contractor?.signed
            );

            const tmpl = getTemplateLabel(report.completionType);
            const totalSignatures = report.completionType === 'PROJECT_USE' ? 4 : 3;
            const signedCount = [
              report.signatures?.contractor?.signed,
              report.signatures?.supervisor?.signed,
              report.signatures?.investor?.signed,
              report.completionType === 'PROJECT_USE' ? report.signatures?.designer?.signed : null
            ].filter(Boolean).length;

            return (
              <div
                key={report.id}
                style={{
                  background: '#ffffff',
                  border: isCompleted ? '1.5px solid #a7f3d0' : '1px solid #e2e8f0',
                  borderRadius: '16px',
                  boxShadow: isCompleted 
                    ? '0 4px 16px rgba(16,185,129,0.08)' 
                    : '0 4px 16px rgba(15,23,42,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onClick={() => onOpenReport(report)}
              >
                {/* DẢI MÀU TRÊN ĐẦU CARD */}
                <div style={{
                  height: '4px',
                  background: isCompleted 
                    ? 'linear-gradient(90deg, #10b981, #059669)' 
                    : tmpl.color === '#047857'
                    ? 'linear-gradient(90deg, #059669, #10b981)'
                    : tmpl.color === '#1d4ed8'
                    ? 'linear-gradient(90deg, #2563eb, #3b82f6)'
                    : 'linear-gradient(90deg, #d97706, #f59e0b)'
                }} />

                {/* CARD HEADER */}
                <div style={{
                  padding: '14px 18px 10px 18px',
                  background: '#fafafa',
                  borderBottom: '1px solid #f1f5f9',
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
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '0.84rem',
                      fontFamily: 'monospace'
                    }}>
                      {report.reportNumber}
                    </div>

                    <span style={{
                      background: tmpl.bg,
                      color: tmpl.color,
                      border: `1px solid ${tmpl.border}`,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.74rem',
                      fontWeight: 700
                    }}>
                      {tmpl.badge}
                    </span>
                  </div>

                  {/* STATUS BADGE */}
                  <div>
                    {isCompleted ? (
                      <span style={{
                        background: '#ecfdf5',
                        color: '#047857',
                        border: '1px solid #a7f3d0',
                        padding: '3px 8px',
                        borderRadius: '20px',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <CheckCircle2 size={13} color="#10b981" />
                        <span>Đã Hoàn Tất ({signedCount}/{totalSignatures})</span>
                      </span>
                    ) : (
                      <span style={{
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        border: '1px solid #bfdbfe',
                        padding: '3px 8px',
                        borderRadius: '20px',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Clock size={13} color="#2563eb" />
                        <span>Chờ Ký Duyệt ({signedCount}/{totalSignatures})</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* CARD BODY */}
                <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{
                    margin: '0 0 8px 0',
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    lineHeight: 1.4
                  }}>
                    {report.inspectionObject}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.82rem', color: '#475569', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Building size={14} color="#64748b" />
                      <span>{report.buildingName} • {report.itemName}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} color="#64748b" />
                      <span>Ngày lập: {report.date}</span>
                    </div>
                    {report.paymentBatch && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#047857', fontWeight: 600 }}>
                        <Award size={14} color="#059669" />
                        <span>Thanh toán đợt: {report.paymentBatch}</span>
                      </div>
                    )}
                  </div>

                  {/* TIẾN ĐỘ KÝ SỐ */}
                  <div style={{ 
                    marginTop: 'auto', 
                    paddingTop: '10px', 
                    borderTop: '1px dashed #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    fontSize: '0.76rem'
                  }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ 
                        color: report.signatures?.contractor?.signed ? '#047857' : '#94a3b8',
                        fontWeight: 600 
                      }}>
                        {report.signatures?.contractor?.signed ? '✓' : '○'} ĐVTC
                      </span>
                      <span>•</span>
                      <span style={{ 
                        color: report.signatures?.supervisor?.signed ? '#047857' : '#d97706',
                        fontWeight: 600 
                      }}>
                        {report.signatures?.supervisor?.signed ? '✓ TVGS Trưởng' : '⏳ TVGS Trưởng'}
                      </span>
                      <span>•</span>
                      <span style={{ 
                        color: report.signatures?.investor?.signed ? '#047857' : '#d97706',
                        fontWeight: 600 
                      }}>
                        {report.signatures?.investor?.signed ? '✓ CĐT Trưởng' : '⏳ CĐT Trưởng'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {currentRole === 'CONTRACTOR' && onDeleteReport && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteReport(report.id);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px'
                          }}
                          title="Xóa biên bản hoàn thành"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                      <span style={{ color: '#2563eb', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <span>Xem chi tiết</span>
                        <ChevronRight size={14} />
                      </span>
                    </div>
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
