import React, { useState, useMemo } from 'react';
import { 
  Building2, Hash, Plus, Trash2, Edit3, Save, X, Check, 
  Layers, Package, CheckSquare, FileText, ArrowRight, RefreshCw, AlertCircle,
  ChevronDown, ChevronUp, FolderTree, ListFilter, CheckCircle2, Search
} from 'lucide-react';
import { generateDocumentCode } from '../data/projectCatalog';

export default function ProjectManagementView({
  projects = [],
  docTypes = [],
  onSaveProjects,
  onSaveDocTypes,
  showAlert
}) {
  const [activeSubTab, setActiveSubTab] = useState('PROJECTS'); // 'PROJECTS' | 'PACKAGES_TASKS' | 'DOCTYPES'

  // State cho Công trình
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editProjectForm, setEditProjectForm] = useState({ name: '', code: '', location: '' });
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectForm, setNewProjectForm] = useState({ name: '', code: '', location: '' });

  // State cho Phân Cấp Gói Thầu (Level 3) & Hạng Mục Công Việc (Level 4)
  const [selectedHierarchyProjId, setSelectedHierarchyProjId] = useState(() => projects[0]?.id || '');
  const [selectedHierarchyContId, setSelectedHierarchyContId] = useState('');
  const [expandedPackageIds, setExpandedPackageIds] = useState({});
  const [isAddingPackage, setIsAddingPackage] = useState(false);
  const [newPackageForm, setNewPackageForm] = useState({ name: '', initialTasks: '' });
  const [editingPackageId, setEditingPackageId] = useState(null);
  const [editingPackageName, setEditingPackageName] = useState('');
  const [addingTaskForPkgId, setAddingTaskForPkgId] = useState(null);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [editingTaskKey, setEditingTaskKey] = useState(null); // `${pkgId}_${taskIdx}`
  const [editingTaskInput, setEditingTaskInput] = useState('');
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [isAddingContractor, setIsAddingContractor] = useState(false);
  const [newContractorForm, setNewContractorForm] = useState({ name: '', shortName: '' });

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
      location: newProjectForm.location.trim() || 'Phường Cái Răng - TP. Cần Thơ',
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

  // --- Handlers Phân Cấp Gói Thầu (Level 3) & Hạng Mục Công Việc (Level 4) ---
  const currentHierarchyProject = useMemo(() => {
    return projects.find(p => p.id === selectedHierarchyProjId) || projects[0] || null;
  }, [projects, selectedHierarchyProjId]);

  const currentHierarchyContractors = useMemo(() => {
    return currentHierarchyProject?.contractors || [];
  }, [currentHierarchyProject]);

  const effectiveContId = useMemo(() => {
    if (selectedHierarchyContId && currentHierarchyContractors.some(c => c.id === selectedHierarchyContId)) {
      return selectedHierarchyContId;
    }
    return currentHierarchyContractors[0]?.id || '';
  }, [selectedHierarchyContId, currentHierarchyContractors]);

  const currentHierarchyContractor = useMemo(() => {
    return currentHierarchyContractors.find(c => c.id === effectiveContId) || currentHierarchyContractors[0] || null;
  }, [currentHierarchyContractors, effectiveContId]);

  const handleToggleExpandPackage = (pkgId) => {
    setExpandedPackageIds(prev => ({
      ...prev,
      [pkgId]: !prev[pkgId]
    }));
  };

  const handleCreatePackage = () => {
    const pkgName = newPackageForm.name.trim();
    if (!pkgName) {
      if (showAlert) showAlert('warning', 'Vui lòng nhập tên gói thầu (Level 3)!');
      return;
    }
    if (!currentHierarchyProject || !currentHierarchyContractor) {
      if (showAlert) showAlert('warning', 'Chưa chọn nhà thầu!');
      return;
    }

    const tasksList = (newPackageForm.initialTasks || '')
      .split(/[\n,;]+/)
      .map(t => t.trim())
      .filter(Boolean);

    const newPkg = {
      id: `pkg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: pkgName,
      tasks: tasksList.length > 0 ? tasksList : ['Hạng mục công việc 1']
    };

    const updatedProjects = projects.map(p => {
      if (p.id !== currentHierarchyProject.id) return p;
      return {
        ...p,
        contractors: (p.contractors || []).map(c => {
          if (c.id !== currentHierarchyContractor.id) return c;
          return {
            ...c,
            packages: [...(c.packages || []), newPkg]
          };
        })
      };
    });

    onSaveProjects(updatedProjects);
    setNewPackageForm({ name: '', initialTasks: '' });
    setIsAddingPackage(false);
    setExpandedPackageIds(prev => ({ ...prev, [newPkg.id]: true }));
    if (showAlert) showAlert('success', `Đã thêm gói thầu: "${pkgName}" (${newPkg.tasks.length} công việc)!`);
  };

  const handleStartEditPackageName = (pkg) => {
    setEditingPackageId(pkg.id);
    setEditingPackageName(pkg.name || '');
  };

  const handleSaveEditPackageName = (pkgId) => {
    const trimmed = editingPackageName.trim();
    if (!trimmed) {
      if (showAlert) showAlert('warning', 'Tên gói thầu không được để trống!');
      return;
    }
    const updatedProjects = projects.map(p => ({
      ...p,
      contractors: (p.contractors || []).map(c => ({
        ...c,
        packages: (c.packages || []).map(pkg => {
          if (pkg.id === pkgId) return { ...pkg, name: trimmed };
          return pkg;
        })
      }))
    }));
    onSaveProjects(updatedProjects);
    setEditingPackageId(null);
    setEditingPackageName('');
    if (showAlert) showAlert('success', `Đã đổi tên gói thầu thành: "${trimmed}"`);
  };

  const handleDeletePackage = (pkgId, pkgName) => {
    if (!window.confirm(`Bạn có chắc muốn xóa gói thầu "${pkgName}" và toàn bộ công việc trực thuộc?`)) return;
    const updatedProjects = projects.map(p => ({
      ...p,
      contractors: (p.contractors || []).map(c => ({
        ...c,
        packages: (c.packages || []).filter(pkg => pkg.id !== pkgId)
      }))
    }));
    onSaveProjects(updatedProjects);
    if (showAlert) showAlert('info', `Đã xóa gói thầu: "${pkgName}"`);
  };

  const handleAddTaskToPackage = (pkgId) => {
    const trimmed = newTaskInput.trim();
    if (!trimmed) return;

    const newTasks = trimmed.split(/[\n,;]+/).map(t => t.trim()).filter(Boolean);
    if (newTasks.length === 0) return;

    const updatedProjects = projects.map(p => ({
      ...p,
      contractors: (p.contractors || []).map(c => ({
        ...c,
        packages: (c.packages || []).map(pkg => {
          if (pkg.id === pkgId) {
            const existing = pkg.tasks || [];
            const toAdd = newTasks.filter(t => !existing.includes(t));
            return {
              ...pkg,
              tasks: [...existing, ...toAdd]
            };
          }
          return pkg;
        })
      }))
    }));

    onSaveProjects(updatedProjects);
    setNewTaskInput('');
    setAddingTaskForPkgId(null);
    if (showAlert) showAlert('success', `Đã thêm ${newTasks.length} hạng mục công việc vào gói thầu!`);
  };

  const handleStartEditTask = (pkgId, taskIdx, taskName) => {
    setEditingTaskKey(`${pkgId}_${taskIdx}`);
    setEditingTaskInput(taskName);
  };

  const handleSaveEditTask = (pkgId, taskIdx) => {
    const trimmed = editingTaskInput.trim();
    if (!trimmed) {
      if (showAlert) showAlert('warning', 'Tên hạng mục công việc không được rỗng!');
      return;
    }

    const updatedProjects = projects.map(p => ({
      ...p,
      contractors: (p.contractors || []).map(c => ({
        ...c,
        packages: (c.packages || []).map(pkg => {
          if (pkg.id === pkgId) {
            const nextTasks = [...(pkg.tasks || [])];
            nextTasks[taskIdx] = trimmed;
            return { ...pkg, tasks: nextTasks };
          }
          return pkg;
        })
      }))
    }));

    onSaveProjects(updatedProjects);
    setEditingTaskKey(null);
    setEditingTaskInput('');
    if (showAlert) showAlert('success', 'Đã cập nhật hạng mục công việc!');
  };

  const handleDeleteTask = (pkgId, taskIdx, taskName) => {
    if (!window.confirm(`Xóa hạng mục công việc "${taskName}" khỏi gói thầu?`)) return;

    const updatedProjects = projects.map(p => ({
      ...p,
      contractors: (p.contractors || []).map(c => ({
        ...c,
        packages: (c.packages || []).map(pkg => {
          if (pkg.id === pkgId) {
            return {
              ...pkg,
              tasks: (pkg.tasks || []).filter((_, i) => i !== taskIdx)
            };
          }
          return pkg;
        })
      }))
    }));

    onSaveProjects(updatedProjects);
    if (showAlert) showAlert('info', `Đã xóa công việc: "${taskName}"`);
  };

  const handleCreateContractor = () => {
    const name = newContractorForm.name.trim();
    if (!name) {
      if (showAlert) showAlert('warning', 'Vui lòng nhập tên đơn vị thi công!');
      return;
    }
    if (!currentHierarchyProject) return;

    const newCont = {
      id: `cont_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      shortName: newContractorForm.shortName.trim() || name,
      packages: []
    };

    const updatedProjects = projects.map(p => {
      if (p.id !== currentHierarchyProject.id) return p;
      return {
        ...p,
        contractors: [...(p.contractors || []), newCont]
      };
    });

    onSaveProjects(updatedProjects);
    setSelectedHierarchyContId(newCont.id);
    setNewContractorForm({ name: '', shortName: '' });
    setIsAddingContractor(false);
    if (showAlert) showAlert('success', `Đã thêm đơn vị thi công: "${name}"`);
  };
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
      <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', gap: '8px', overflowX: 'auto' }}>
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
            marginBottom: '-2px',
            whiteSpace: 'nowrap'
          }}
        >
          <Building2 size={18} />
          <span>Danh Sách Công Trình ({projects.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('PACKAGES_TASKS')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            fontWeight: 700,
            fontSize: '0.92rem',
            color: activeSubTab === 'PACKAGES_TASKS' ? '#2563eb' : '#64748b',
            borderBottom: activeSubTab === 'PACKAGES_TASKS' ? '2px solid #2563eb' : 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '-2px',
            whiteSpace: 'nowrap'
          }}
        >
          <FolderTree size={18} />
          <span>Phân Cấp Gói Thầu (L3) & Công Việc (L4)</span>
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
            marginBottom: '-2px',
            whiteSpace: 'nowrap'
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
                    placeholder="Phường Cái Răng - TP. Cần Thơ..."
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
                            <div key={cont.id || cIdx} style={{ background: '#ffffff', borderRadius: '8px', padding: '10px 14px', border: '1px solid #e2e8f0' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.88rem' }}>
                                  🏢 {cont.name}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedHierarchyProjId(proj.id);
                                    setSelectedHierarchyContId(cont.id);
                                    setActiveSubTab('PACKAGES_TASKS');
                                  }}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    background: '#eff6ff',
                                    color: '#2563eb',
                                    border: '1px solid #bfdbfe',
                                    borderRadius: '6px',
                                    padding: '4px 10px',
                                    fontSize: '0.76rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  <FolderTree size={13} /> Quản lý Gói thầu & Công việc (L3 & L4) ➔
                                </button>
                              </div>
                              <div style={{ paddingLeft: '16px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.82rem', color: '#475569' }}>
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

      {/* SUB-TAB 2: PHÂN CẤP GÓI THẦU (LEVEL 3) & HẠNG MỤC CÔNG VIỆC (LEVEL 4) */}
      {activeSubTab === 'PACKAGES_TASKS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* HEADER & CONTROLS */}
          <div style={{
            background: '#ffffff',
            border: '1.5px solid #bfdbfe',
            borderRadius: '12px',
            padding: '16px 20px',
            boxShadow: '0 2px 6px rgba(37,99,235,0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FolderTree size={20} color="#2563eb" />
                  Quản Lý Phân Cấp: Gói Thầu (Level 3) & Hạng Mục Công Việc (Level 4)
                </h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  Cấu hình các Gói thầu thi công thực tế và danh sách Hạng mục công việc trực thuộc để tự động liên kết khi Lập phiếu nghiệm thu
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {!isAddingPackage && (
                  <button
                    type="button"
                    onClick={() => setIsAddingPackage(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(22,163,74,0.2)'
                    }}
                  >
                    <Plus size={15} /> Thêm Gói Thầu Mới (Level 3)
                  </button>
                )}
                {!isAddingContractor && (
                  <button
                    type="button"
                    onClick={() => setIsAddingContractor(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#eff6ff',
                      color: '#2563eb',
                      border: '1px solid #bfdbfe',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={15} /> Thêm ĐVTC Mới
                  </button>
                )}
              </div>
            </div>

            {/* BỘ LỌC CÔNG TRÌNH & ĐƠN VỊ THI CÔNG */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '12px',
              background: '#f8fafc',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  1. Chọn Công Trình (Level 1):
                </label>
                <select
                  className="form-select"
                  value={currentHierarchyProject?.id || ''}
                  onChange={(e) => {
                    setSelectedHierarchyProjId(e.target.value);
                    const pr = projects.find(p => p.id === e.target.value);
                    setSelectedHierarchyContId(pr?.contractors?.[0]?.id || '');
                  }}
                  style={{ width: '100%', padding: '7px 10px', fontSize: '0.85rem', fontWeight: 600 }}
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      [{p.code}] {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  2. Chọn Đơn Vị Thi Công (Level 2):
                </label>
                <select
                  className="form-select"
                  value={effectiveContId}
                  onChange={(e) => setSelectedHierarchyContId(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', fontSize: '0.85rem', fontWeight: 600 }}
                >
                  {currentHierarchyContractors.map(c => (
                    <option key={c.id} value={c.id}>
                      🏢 {c.name} ({c.packages?.length || 0} gói thầu)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* FORM THÊM ĐVTC MỚI NẾU CẦN */}
            {isAddingContractor && (
              <div style={{ background: '#f0fdf4', border: '1.5px dashed #86efac', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.85rem', marginBottom: '8px' }}>
                  Thêm Đơn Vị Thi Công Mới cho Công Trình "{currentHierarchyProject?.name}":
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={newContractorForm.name}
                    onChange={(e) => setNewContractorForm({ ...newContractorForm, name: e.target.value })}
                    placeholder="Tên đầy đủ ĐVTC, VD: Công ty TNHH Cơ Điện & PCCC Sao Việt..."
                    style={{ padding: '6px 10px', fontSize: '0.82rem' }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    value={newContractorForm.shortName}
                    onChange={(e) => setNewContractorForm({ ...newContractorForm, shortName: e.target.value })}
                    placeholder="Tên viết tắt (VD: Sao Việt)..."
                    style={{ padding: '6px 10px', fontSize: '0.82rem' }}
                  />
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setIsAddingContractor(false)}
                      style={{ padding: '6px 10px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateContractor}
                      style={{ padding: '6px 12px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Lưu ĐVTC
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* FORM THÊM GÓI THẦU MỚI (LEVEL 3) */}
          {isAddingPackage && (
            <div style={{
              background: '#f8fafc',
              border: '2px dashed #3b82f6',
              borderRadius: '12px',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ color: '#1d4ed8', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={16} /> Thêm Gói Thầu (Level 3) Cho Nhà Thầu "{currentHierarchyContractor?.name}":
                </strong>
                <button
                  type="button"
                  onClick={() => setIsAddingPackage(false)}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>
                  Tên Gói Thầu / Hạng Mục Thi Công (Level 3): *
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={newPackageForm.name}
                  onChange={(e) => setNewPackageForm({ ...newPackageForm, name: e.target.value })}
                  placeholder="Ví dụ: Thi công hệ thống PCCC trong và ngoài nhà / Thi công phần kết cấu..."
                  style={{ width: '100%', padding: '8px 12px', fontSize: '0.88rem', fontWeight: 600 }}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>
                  Danh Sách Hạng Mục Công Việc Đi Kèm Ban Đầu (Level 4) (Mỗi dòng một công việc):
                </label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={newPackageForm.initialTasks}
                  onChange={(e) => setNewPackageForm({ ...newPackageForm, initialTasks: e.target.value })}
                  placeholder="Ví dụ:&#10;Lắp đặt mạng lưới đường ống cấp nước chữa cháy vách tường&#10;Lắp đặt đầu phun Sprinkler chữa cháy tự động&#10;Thử áp lực tĩnh và thử nghiệm liên động hệ thống PCCC"
                  style={{ width: '100%', padding: '8px 12px', fontSize: '0.84rem' }}
                />
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  💡 Bạn có thể dán danh sách công việc theo dòng, hoặc bổ sung từng công việc sau khi tạo gói thầu.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddingPackage(false)}
                  style={{ padding: '6px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleCreatePackage}
                  style={{ padding: '6px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Tạo Gói Thầu Mới
                </button>
              </div>
            </div>
          )}

          {/* THANH TÌM KIẾM CÔNG VIỆC TRONG GÓI THẦU */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155' }}>
              Danh sách Gói Thầu ({currentHierarchyContractor?.packages?.length || 0} gói thầu):
            </div>
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Tìm công việc hoặc gói thầu..."
                value={taskSearchQuery}
                onChange={(e) => setTaskSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '6px 10px 6px 30px', fontSize: '0.82rem', borderRadius: '8px' }}
              />
            </div>
          </div>

          {/* DANH SÁCH GÓI THẦU (LEVEL 3) VÀ CÔNG VIỆC (LEVEL 4) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(currentHierarchyContractor?.packages || []).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                <Package size={36} color="#94a3b8" style={{ marginBottom: '8px' }} />
                <p style={{ margin: 0, fontWeight: 600, color: '#64748b' }}>Đơn vị thi công này chưa có gói thầu nào.</p>
                <button
                  type="button"
                  onClick={() => setIsAddingPackage(true)}
                  style={{ marginTop: '10px', padding: '6px 14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  <Plus size={14} /> Thêm Gói Thầu Đầu Tiên
                </button>
              </div>
            ) : (
              (currentHierarchyContractor?.packages || []).map((pkg, pkgIdx) => {
                const isExpanded = expandedPackageIds[pkg.id] !== false; // Mặc định mở
                const isEditingThisPkg = editingPackageId === pkg.id;
                const isAddingTaskThisPkg = addingTaskForPkgId === pkg.id;
                const tasks = pkg.tasks || [];
                const q = (taskSearchQuery || '').toLowerCase().trim();
                const filteredTasks = q ? tasks.filter(t => t.toLowerCase().includes(q) || pkg.name.toLowerCase().includes(q)) : tasks;

                return (
                  <div
                    key={pkg.id || pkgIdx}
                    style={{
                      background: '#ffffff',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}
                  >
                    {/* GÓI THẦU HEADER (LEVEL 3) */}
                    <div style={{
                      background: '#f8fafc',
                      padding: '12px 16px',
                      borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                        <button
                          type="button"
                          onClick={() => handleToggleExpandPackage(pkg.id)}
                          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', padding: '2px' }}
                        >
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>

                        <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '6px', borderRadius: '6px' }}>
                          <Package size={16} />
                        </div>

                        {isEditingThisPkg ? (
                          <div style={{ display: 'flex', gap: '6px', flex: 1, maxWidth: '400px' }}>
                            <input
                              type="text"
                              className="form-input"
                              value={editingPackageName}
                              onChange={(e) => setEditingPackageName(e.target.value)}
                              autoFocus
                              style={{ padding: '4px 8px', fontSize: '0.88rem', fontWeight: 700 }}
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEditPackageName(pkg.id)}
                              style={{ padding: '4px 8px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingPackageId(null)}
                              style={{ padding: '4px 8px', background: '#94a3b8', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                                GÓI #{pkgIdx + 1}
                              </span>
                              <strong style={{ fontSize: '0.98rem', color: '#0f172a' }}>{pkg.name}</strong>
                              <span style={{ fontSize: '0.76rem', color: '#0369a1', background: '#f0f9ff', border: '1px solid #bae6fd', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                                {tasks.length} hạng mục công việc
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setAddingTaskForPkgId(pkg.id);
                            setNewTaskInput('');
                            setExpandedPackageIds(prev => ({ ...prev, [pkg.id]: true }));
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#f0fdf4',
                            color: '#16a34a',
                            border: '1px solid #bbf7d0',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                          title="Thêm công việc vào gói này"
                        >
                          <Plus size={13} /> Thêm công việc (L4)
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStartEditPackageName(pkg)}
                          style={{ padding: '4px 8px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#334155', cursor: 'pointer' }}
                          title="Sửa tên gói thầu"
                        >
                          <Edit3 size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeletePackage(pkg.id, pkg.name)}
                          style={{ padding: '4px 8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '6px', cursor: 'pointer' }}
                          title="Xóa gói thầu này"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* DANH SÁCH CÔNG VIỆC TRỰC THUỘC (LEVEL 4) */}
                    {isExpanded && (
                      <div style={{ padding: '14px 16px', background: '#ffffff' }}>
                        {/* FORM NHẬP THÊM CÔNG VIỆC */}
                        {isAddingTaskThisPkg && (
                          <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#166534' }}>
                                Nhập Tên Hạng Mục Công Việc Mới (Level 4):
                              </label>
                              <button
                                type="button"
                                onClick={() => setAddingTaskForPkgId(null)}
                                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                              >
                                <X size={14} />
                              </button>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <input
                                type="text"
                                className="form-input"
                                value={newTaskInput}
                                onChange={(e) => setNewTaskInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddTaskToPackage(pkg.id);
                                  }
                                }}
                                placeholder="VD: Lắp đặt mạng lưới đường ống cấp nước chữa cháy... (có thể dán nhiều dòng)"
                                autoFocus
                                style={{ flex: 1, padding: '6px 10px', fontSize: '0.82rem' }}
                              />
                              <button
                                type="button"
                                onClick={() => handleAddTaskToPackage(pkg.id)}
                                style={{
                                  background: '#16a34a',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '6px 14px',
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                Thêm
                              </button>
                            </div>
                            <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                              💡 Có thể nhập nhiều công việc cùng lúc, phân cách bởi dấu phẩy hoặc xuống dòng.
                            </span>
                          </div>
                        )}

                        {filteredTasks.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', fontSize: '0.82rem' }}>
                            Chưa có hạng mục công việc nào. Bấm <strong>"+ Thêm công việc"</strong> ở trên để thêm.
                          </div>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '8px' }}>
                            {filteredTasks.map((taskName, tIdx) => {
                              const originalIdx = tasks.indexOf(taskName);
                              const isEditingTask = editingTaskKey === `${pkg.id}_${originalIdx}`;

                              return (
                                <div
                                  key={originalIdx}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '8px 12px',
                                    background: '#f8fafc',
                                    borderRadius: '6px',
                                    border: '1px solid #e2e8f0',
                                    gap: '8px',
                                    fontSize: '0.82rem'
                                  }}
                                >
                                  {isEditingTask ? (
                                    <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                                      <input
                                        type="text"
                                        className="form-input"
                                        value={editingTaskInput}
                                        onChange={(e) => setEditingTaskInput(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleSaveEditTask(pkg.id, originalIdx);
                                          }
                                        }}
                                        autoFocus
                                        style={{ flex: 1, padding: '4px 6px', fontSize: '0.8rem' }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleSaveEditTask(pkg.id, originalIdx)}
                                        style={{ padding: '3px 6px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                      >
                                        <Check size={12} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingTaskKey(null)}
                                        style={{ padding: '3px 6px', background: '#94a3b8', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                      >
                                        <X size={12} />
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', minWidth: '18px' }}>
                                          {originalIdx + 1}.
                                        </span>
                                        <span style={{ color: '#1e293b', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={taskName}>
                                          {taskName}
                                        </span>
                                      </div>

                                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                        <button
                                          type="button"
                                          onClick={() => handleStartEditTask(pkg.id, originalIdx, taskName)}
                                          style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '3px' }}
                                          title="Sửa tên công việc"
                                        >
                                          <Edit3 size={13} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteTask(pkg.id, originalIdx, taskName)}
                                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '3px' }}
                                          title="Xóa công việc"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: QUẢN LÝ LOẠI PHIẾU / BIÊN BẢN */}
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
