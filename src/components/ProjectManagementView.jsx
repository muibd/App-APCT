import React, { useState } from 'react';
import { 
  Building2, Hash, Plus, Trash2, Edit3, Save, X, Check, 
  Layers, Package, CheckSquare, FileText, ArrowRight, RefreshCw, AlertCircle
} from 'lucide-react';
import { generateDocumentCode } from '../data/projectCatalog';

export default function ProjectManagementView({
  projects = [],
  docTypes = [],
  onSaveProjects,
  onSaveDocTypes,
  showAlert
}) {
  const [activeSubTab, setActiveSubTab] = useState('PROJECTS'); // 'PROJECTS' | 'DOCTYPES'

  // State cho Công trình
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editProjectForm, setEditProjectForm] = useState({ name: '', code: '', location: '' });
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectForm, setNewProjectForm] = useState({ name: '', code: '', location: '' });

  // State cho Loại văn bản
  const [editingDocTypeId, setEditingDocTypeId] = useState(null);
  const [editDocTypeForm, setEditDocTypeForm] = useState({ name: '', code: '', description: '' });
  const [isAddingDocType, setIsAddingDocType] = useState(false);
  const [newDocTypeForm, setNewDocTypeForm] = useState({ name: '', code: '', description: '' });

  // Quick preview test generator
  const [testProjectCode, setTestProjectCode] = useState(projects[0]?.code || '2203');
  const [testDocTypeCode, setTestDocTypeCode] = useState(docTypes[0]?.code || 'MI');
  const [testRevision, setTestRevision] = useState(1);

  // --- Handlers Công trình ---
  const handleStartEditProject = (p) => {
    setEditingProjectId(p.id);
    setEditProjectForm({ name: p.name, code: p.code, location: p.location || '' });
  };

  const handleSaveEditProject = (pId) => {
    if (!editProjectForm.name.trim() || !editProjectForm.code.trim()) {
      if (showAlert) showAlert('warning', 'Vui lòng nhập đầy đủ tên và mã công trình!');
      return;
    }
    const updated = projects.map(p => {
      if (p.id === pId) {
        return {
          ...p,
          name: editProjectForm.name.trim(),
          code: editProjectForm.code.trim(),
          location: editProjectForm.location.trim()
        };
      }
      return p;
    });
    onSaveProjects(updated);
    setEditingProjectId(null);
    if (showAlert) showAlert('success', 'Đã cập nhật thông tin công trình thành công!');
  };

  const handleCreateProject = () => {
    if (!newProjectForm.name.trim() || !newProjectForm.code.trim()) {
      if (showAlert) showAlert('warning', 'Vui lòng nhập tên và mã công trình!');
      return;
    }
    const newProj = {
      id: `proj_${Date.now()}`,
      name: newProjectForm.name.trim(),
      code: newProjectForm.code.trim(),
      projectName: 'Đầu tư xây dựng nhà ở Phường Thường Thạnh - An Phú Eco City',
      location: newProjectForm.location.trim() || 'Phường Thường Thạnh - Quận Cái Răng - TP. Cần Thơ',
      investor: 'Công ty TNHH An Phú Cần Thơ',
      supervisor: 'Công ty CP Tư vấn Xây dựng và Thương mại GELICON',
      contractors: [
        {
          id: `cont_${Date.now()}_1`,
          name: 'Công ty TNHH Gia Huy Vĩnh Phúc',
          shortName: 'Gia Huy Vĩnh Phúc',
          packages: [
            {
              id: `pkg_${Date.now()}_1`,
              name: 'Thi công phần hoàn thiện Tòa A và Tòa B',
              tasks: ['Cốt thép, ván khuôn, bê tông', 'Xây tường', 'Trát tường', 'Chống thấm']
            }
          ]
        }
      ]
    };
    onSaveProjects([...projects, newProj]);
    setNewProjectForm({ name: '', code: '', location: '' });
    setIsAddingProject(false);
    if (showAlert) showAlert('success', 'Đã thêm công trình mới thành công!');
  };

  const handleDeleteProject = (pId) => {
    if (projects.length <= 1) {
      if (showAlert) showAlert('warning', 'Hệ thống cần tối thiểu 1 công trình để hoạt động!');
      return;
    }
    if (window.confirm('Bạn có chắc chắn muốn xóa công trình này?')) {
      const updated = projects.filter(p => p.id !== pId);
      onSaveProjects(updated);
      if (showAlert) showAlert('info', 'Đã xóa công trình.');
    }
  };

  // --- Handlers Loại phiếu / Biên bản ---
  const handleStartEditDocType = (d) => {
    setEditingDocTypeId(d.id);
    setEditDocTypeForm({ name: d.name, code: d.code, description: d.description || '' });
  };

  const handleSaveEditDocType = (dId) => {
    if (!editDocTypeForm.name.trim() || !editDocTypeForm.code.trim()) {
      if (showAlert) showAlert('warning', 'Vui lòng nhập đầy đủ tên và mã viết tắt loại văn bản!');
      return;
    }
    const updated = docTypes.map(d => {
      if (d.id === dId) {
        return {
          ...d,
          name: editDocTypeForm.name.trim(),
          code: editDocTypeForm.code.trim().toUpperCase(),
          description: editDocTypeForm.description.trim()
        };
      }
      return d;
    });
    onSaveDocTypes(updated);
    setEditingDocTypeId(null);
    if (showAlert) showAlert('success', 'Đã cập nhật mã loại văn bản thành công!');
  };

  const handleCreateDocType = () => {
    if (!newDocTypeForm.name.trim() || !newDocTypeForm.code.trim()) {
      if (showAlert) showAlert('warning', 'Vui lòng nhập tên và mã viết tắt!');
      return;
    }
    const codeUpper = newDocTypeForm.code.trim().toUpperCase();
    if (docTypes.some(d => d.code === codeUpper)) {
      if (showAlert) showAlert('warning', `Mã "${codeUpper}" đã tồn tại! Vui lòng chọn mã khác.`);
      return;
    }
    const newDoc = {
      id: codeUpper,
      code: codeUpper,
      name: newDocTypeForm.name.trim(),
      description: newDocTypeForm.description.trim()
    };
    onSaveDocTypes([...docTypes, newDoc]);
    setNewDocTypeForm({ name: '', code: '', description: '' });
    setIsAddingDocType(false);
    if (showAlert) showAlert('success', 'Đã thêm mã loại văn bản mới!');
  };

  const handleDeleteDocType = (dId) => {
    if (docTypes.length <= 1) {
      if (showAlert) showAlert('warning', 'Cần tối thiểu 1 loại văn bản trong hệ thống!');
      return;
    }
    if (window.confirm('Bạn có chắc chắn muốn xóa loại văn bản này?')) {
      const updated = docTypes.filter(d => d.id !== dId);
      onSaveDocTypes(updated);
      if (showAlert) showAlert('info', 'Đã xóa loại văn bản.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* BANNER THÔNG TIN QUY TẮC MÃ */}
      <div style={{
        background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
        border: '1.5px solid #bfdbfe',
        borderRadius: '12px',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1d4ed8' }}>
          <Hash size={20} />
          <strong style={{ fontSize: '1rem' }}>Cấu Trúc Sinh Số Văn Bản & Mã Hạng Mục Tự Động:</strong>
        </div>
        <div style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.6 }}>
          Mã hạng mục công trình / Số tài liệu căn cứ được sinh theo chuẩn pháp lý: <br />
          <code style={{ background: '#ffffff', padding: '3px 8px', borderRadius: '6px', fontWeight: 700, color: '#097969', border: '1px solid #bbf7d0' }}>
            [Mã công trình]/[Mã yêu cầu nghiệm thu]/[Ngày tháng năm ddmmyy]-[Số lần sửa/gửi lại].01
          </code>
        </div>
        
        {/* THANH THỬ NGHIỆM SINH MÃ TỨC THÌ */}
        <div style={{
          marginTop: '6px',
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Xem trước kết quả sinh mã:</span>
          <select 
            value={testProjectCode} 
            onChange={e => setTestProjectCode(e.target.value)}
            style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          >
            {projects.map(p => (
              <option key={p.id} value={p.code}>{p.code} - {p.name}</option>
            ))}
          </select>
          <select 
            value={testDocTypeCode} 
            onChange={e => setTestDocTypeCode(e.target.value)}
            style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          >
            {docTypes.map(d => (
              <option key={d.id} value={d.code}>{d.code} - {d.name}</option>
            ))}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
            <span>Lần gửi:</span>
            <input 
              type="number" 
              min="1" 
              max="99" 
              value={testRevision} 
              onChange={e => setTestRevision(Math.max(1, parseInt(e.target.value) || 1))}
              style={{ width: '50px', padding: '3px 6px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>
          <ArrowRight size={16} color="#64748b" />
          <span style={{ 
            fontSize: '0.98rem', 
            fontWeight: 800, 
            color: '#dc2626', 
            fontFamily: 'monospace',
            background: '#fef2f2',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid #fecaca'
          }}>
            {generateDocumentCode(testProjectCode, testDocTypeCode, new Date(), testRevision)}
          </span>
        </div>
      </div>

      {/* SUB-TABS */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', gap: '8px' }}>
        <button
          onClick={() => setActiveSubTab('PROJECTS')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            fontWeight: 700,
            fontSize: '0.92rem',
            color: activeSubTab === 'PROJECTS' ? '#2563eb' : '#64748b',
            borderBottom: activeSubTab === 'PROJECTS' ? '2px solid #2563eb' : 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '-2px'
          }}
        >
          <Building2 size={18} />
          <span>Danh Sách Công Trình & Gói Thầu ({projects.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('DOCTYPES')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            fontWeight: 700,
            fontSize: '0.92rem',
            color: activeSubTab === 'DOCTYPES' ? '#2563eb' : '#64748b',
            borderBottom: activeSubTab === 'DOCTYPES' ? '2px solid #2563eb' : 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '-2px'
          }}
        >
          <FileText size={18} />
          <span>Mã Loại Phiếu / Biên Bản ({docTypes.length})</span>
        </button>
      </div>

      {/* SUB-TAB 1: QUẢN LÝ CÔNG TRÌNH */}
      {activeSubTab === 'PROJECTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a' }}>Danh Sách Công Trình Áp Dụng</h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Quản lý mã hiệu công trình để tự động sinh số tài liệu căn cứ & phân cấp gói thầu
              </p>
            </div>
            {!isAddingProject && (
              <button
                type="button"
                onClick={() => setIsAddingProject(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} /> Thêm Công Trình Mới
              </button>
            )}
          </div>

          {/* FORM THÊM MỚI CÔNG TRÌNH */}
          {isAddingProject && (
            <div style={{ background: '#f8fafc', border: '1.5px dashed #3b82f6', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontWeight: 700, color: '#1e40af', marginBottom: '12px' }}>Thêm Công Trình & Mã Số Mới:</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Tên Công trình: *</label>
                  <input
                    type="text"
                    value={newProjectForm.name}
                    onChange={e => setNewProjectForm({ ...newProjectForm, name: e.target.value })}
                    placeholder="Ví dụ: Chung cư nhà ở cao tầng"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Mã Công trình (Số hiệu): *</label>
                  <input
                    type="text"
                    value={newProjectForm.code}
                    onChange={e => setNewProjectForm({ ...newProjectForm, code: e.target.value })}
                    placeholder="Ví dụ: 2204"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Địa điểm:</label>
                  <input
                    type="text"
                    value={newProjectForm.location}
                    onChange={e => setNewProjectForm({ ...newProjectForm, location: e.target.value })}
                    placeholder="Phường Thường Thạnh - Quận Cái Răng..."
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddingProject(false)}
                  style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleCreateProject}
                  style={{ padding: '6px 14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Lưu Công Trình
                </button>
              </div>
            </div>
          )}

          {/* DANH SÁCH CARDS CÔNG TRÌNH */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {projects.map((proj) => {
              const isEditing = editingProjectId === proj.id;
              return (
                <div 
                  key={proj.id} 
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Tên Công Trình:</label>
                          <input
                            type="text"
                            value={editProjectForm.name}
                            onChange={e => setEditProjectForm({ ...editProjectForm, name: e.target.value })}
                            style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #3b82f6' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Mã Công Trình:</label>
                          <input
                            type="text"
                            value={editProjectForm.code}
                            onChange={e => setEditProjectForm({ ...editProjectForm, code: e.target.value })}
                            style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #3b82f6', fontWeight: 700 }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Địa điểm:</label>
                          <input
                            type="text"
                            value={editProjectForm.location}
                            onChange={e => setEditProjectForm({ ...editProjectForm, location: e.target.value })}
                            style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #3b82f6' }}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setEditingProjectId(null)}
                          style={{ padding: '5px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff' }}
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEditProject(proj.id)}
                          style={{ padding: '5px 14px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600 }}
                        >
                          Lưu Thay Đổi
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              fontWeight: 800,
                              fontSize: '1rem',
                              padding: '4px 10px',
                              borderRadius: '8px',
                              border: '1.5px solid #bfdbfe',
                              fontFamily: 'monospace'
                            }}>
                              Mã: {proj.code}
                            </span>
                            <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>{proj.name}</h4>
                          </div>
                          <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '6px' }}>
                            📍 Địa điểm: {proj.location || 'Phường Thường Thạnh - Quận Cái Răng - TP. Cần Thơ'}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleStartEditProject(proj)}
                            title="Sửa công trình"
                            style={{ padding: '6px 10px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
                          >
                            <Edit3 size={14} /> Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(proj.id)}
                            title="Xóa công trình"
                            style={{ padding: '6px 10px', background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
                          >
                            <Trash2 size={14} /> Xóa
                          </button>
                        </div>
                      </div>

                      {/* DANH SÁCH NHÀ THẦU & GÓI THẦU CỦA CÔNG TRÌNH */}
                      <div style={{ marginTop: '14px', background: '#f8fafc', borderRadius: '8px', padding: '12px 14px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>
                          Các đơn vị thi công & Gói thầu trực thuộc ({proj.contractors?.length || 0} nhà thầu):
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {(proj.contractors || []).map((cont, cIdx) => (
                            <div key={cont.id || cIdx} style={{ background: '#ffffff', borderRadius: '6px', padding: '8px 12px', border: '1px solid #e2e8f0' }}>
                              <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.88rem' }}>
                                🏢 {cont.name}
                              </div>
                              <div style={{ paddingLeft: '16px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.82rem', color: '#475569' }}>
                                {(cont.packages || []).map((pkg, pIdx) => (
                                  <div key={pkg.id || pIdx}>
                                    • <strong style={{ color: '#0369a1' }}>{pkg.name}</strong> 
                                    <span style={{ color: '#64748b', fontSize: '0.78rem' }}> ({pkg.tasks?.length || 0} hạng mục công việc)</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: QUẢN LÝ LOẠI PHIẾU / BIÊN BẢN */}
      {activeSubTab === 'DOCTYPES' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a' }}>Danh Sách Loại Văn Bản & Mã Viết Tắt</h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Mã viết tắt (IR, WA, MI...) được dùng làm tiền tố số và cấu thành mã hồ sơ
              </p>
            </div>
            {!isAddingDocType && (
              <button
                type="button"
                onClick={() => setIsAddingDocType(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} /> Thêm Loại Văn Bản
              </button>
            )}
          </div>

          {/* FORM THÊM MỚI LOẠI VĂN BẢN */}
          {isAddingDocType && (
            <div style={{ background: '#f8fafc', border: '1.5px dashed #3b82f6', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontWeight: 700, color: '#1e40af', marginBottom: '12px' }}>Thêm Loại Văn Bản & Mã Viết Tắt Mới:</div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Mã viết tắt: *</label>
                  <input
                    type="text"
                    value={newDocTypeForm.code}
                    onChange={e => setNewDocTypeForm({ ...newDocTypeForm, code: e.target.value.toUpperCase() })}
                    placeholder="VD: MI"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 800, textTransform: 'uppercase' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Tên loại văn bản: *</label>
                  <input
                    type="text"
                    value={newDocTypeForm.name}
                    onChange={e => setNewDocTypeForm({ ...newDocTypeForm, name: e.target.value })}
                    placeholder="VD: Biên bản nghiệm thu đầu vào"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Ghi chú / Mẫu áp dụng:</label>
                  <input
                    type="text"
                    value={newDocTypeForm.description}
                    onChange={e => setNewDocTypeForm({ ...newDocTypeForm, description: e.target.value })}
                    placeholder="Mẫu số 12..."
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddingDocType(false)}
                  style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleCreateDocType}
                  style={{ padding: '6px 14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Lưu Loại Văn Bản
                </button>
              </div>
            </div>
          )}

          {/* BẢNG QUẢN LÝ LOẠI VĂN BẢN */}
          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#fff' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '12px 16px', width: '90px' }}>MÃ LOẠI</th>
                  <th style={{ padding: '12px 16px' }}>TÊN LOẠI PHIẾU / BIÊN BẢN</th>
                  <th style={{ padding: '12px 16px' }}>MẪU VĂN BẢN QUY CHUẨN</th>
                  <th style={{ padding: '12px 16px', width: '140px', textAlign: 'right' }}>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {docTypes.map((doc) => {
                  const isEditing = editingDocTypeId === doc.id;
                  return (
                    <tr key={doc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px' }}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editDocTypeForm.code}
                            onChange={e => setEditDocTypeForm({ ...editDocTypeForm, code: e.target.value.toUpperCase() })}
                            style={{ width: '70px', padding: '4px 6px', fontWeight: 800, textTransform: 'uppercase' }}
                          />
                        ) : (
                          <span style={{
                            background: '#fef2f2',
                            color: '#b91c1c',
                            fontWeight: 800,
                            fontFamily: 'monospace',
                            fontSize: '0.95rem',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: '1px solid #fca5a5'
                          }}>
                            {doc.code}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editDocTypeForm.name}
                            onChange={e => setEditDocTypeForm({ ...editDocTypeForm, name: e.target.value })}
                            style={{ width: '100%', padding: '4px 8px' }}
                          />
                        ) : (
                          <strong>{doc.name}</strong>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.82rem' }}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editDocTypeForm.description}
                            onChange={e => setEditDocTypeForm({ ...editDocTypeForm, description: e.target.value })}
                            style={{ width: '100%', padding: '4px 8px' }}
                          />
                        ) : (
                          doc.description || doc.sampleDoc || 'Mẫu chuẩn hệ thống'
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => setEditingDocTypeId(null)}
                              style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#fff' }}
                            >
                              Hủy
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditDocType(doc.id)}
                              style={{ padding: '4px 10px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 600 }}
                            >
                              Lưu
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => handleStartEditDocType(doc)}
                              style={{ padding: '4px 8px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
                              title="Sửa loại văn bản"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDocType(doc.id)}
                              style={{ padding: '4px 8px', background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '4px', cursor: 'pointer' }}
                              title="Xóa"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
