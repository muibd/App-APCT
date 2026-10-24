import React, { useState, useMemo, useRef } from 'react';
import {
  BookOpen, Plus, Search, Filter, Edit3, Trash2, CheckCircle2,
  FileSpreadsheet, Upload, RotateCcw, Cloud, Sparkles, X,
  AlertTriangle, Check, Layers, Package, Building2, Scale, ExternalLink
} from 'lucide-react';
import { parseStandardsExcel, INITIAL_STANDARDS_DATA } from '../data/standardsRules';

export default function StandardsManagementView({
  standardsData,
  onSaveStandards,
  onSyncStandardsToCloud,
  showAlert
}) {
  const currentData = standardsData || INITIAL_STANDARDS_DATA;
  const worksList = currentData.works || [];
  const materialsList = currentData.materials || [];

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'WORK' | 'MATERIAL'
  const [isSyncing, setIsSyncing] = useState(false);
  const excelInputRef = useRef(null);

  // Modals state
  const [categoryModal, setCategoryModal] = useState({ isOpen: false, isEdit: false, category: null, section: 'WORK' });
  const [standardModal, setStandardModal] = useState({ isOpen: false, isEdit: false, categoryId: null, standardIndex: null, standardText: '' });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, target: null, parentId: null });

  // Form states inside Modals
  const [catNameInput, setCatNameInput] = useState('');
  const [catSectionInput, setCatSectionInput] = useState('WORK');
  const [catInitialStandardsInput, setCatInitialStandardsInput] = useState('');
  const [stdTextInput, setStdTextInput] = useState('');

  // Toast message
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (text) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // -------------------------------------------------------------
  // STATS SUMMARY
  // -------------------------------------------------------------
  const totalCategories = worksList.length + materialsList.length;
  const totalStandardsCount = useMemo(() => {
    let count = 0;
    worksList.forEach(w => { count += (w.standards?.length || 0); });
    materialsList.forEach(m => { count += (m.standards?.length || 0); });
    return count;
  }, [worksList, materialsList]);

  // -------------------------------------------------------------
  // FILTERING LOGIC
  // -------------------------------------------------------------
  const filteredWorks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return worksList;
    return worksList.filter(item => {
      const matchName = (item.name || '').toLowerCase().includes(q);
      const matchStd = (item.standards || []).some(s => s.toLowerCase().includes(q));
      return matchName || matchStd;
    });
  }, [worksList, searchQuery]);

  const filteredMaterials = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return materialsList;
    return materialsList.filter(item => {
      const matchName = (item.name || '').toLowerCase().includes(q);
      const matchStd = (item.standards || []).some(s => s.toLowerCase().includes(q));
      return matchName || matchStd;
    });
  }, [materialsList, searchQuery]);

  // -------------------------------------------------------------
  // CRUD OPERATIONS FOR CATEGORIES (HẠNG MỤC)
  // -------------------------------------------------------------
  const handleOpenAddCategory = (defaultSection = 'WORK') => {
    setCatNameInput('');
    setCatSectionInput(defaultSection);
    setCatInitialStandardsInput('');
    setCategoryModal({ isOpen: true, isEdit: false, category: null, section: defaultSection });
  };

  const handleOpenEditCategory = (item, section) => {
    setCatNameInput(item.name || '');
    setCatSectionInput(section);
    setCatInitialStandardsInput('');
    setCategoryModal({ isOpen: true, isEdit: true, category: item, section });
  };

  const handleSaveCategory = (e) => {
    e.preventDefault();
    const name = catNameInput.trim();
    if (!name) return;

    const initialStds = catInitialStandardsInput.split('\n')
      .map(s => s.trim().replace(/^\+\s*/, '').replace(/;\s*$/, '').trim())
      .filter(Boolean);

    let nextWorks = [...worksList];
    let nextMaterials = [...materialsList];

    if (categoryModal.isEdit && categoryModal.category) {
      const targetId = categoryModal.category.id;
      const oldSection = categoryModal.section;
      const newSection = catSectionInput;

      if (oldSection === newSection) {
        if (newSection === 'WORK') {
          nextWorks = nextWorks.map(w => w.id === targetId ? { ...w, name } : w);
        } else {
          nextMaterials = nextMaterials.map(m => m.id === targetId ? { ...m, name } : m);
        }
      } else {
        // Moved to another section
        const existingItem = oldSection === 'WORK'
          ? nextWorks.find(w => w.id === targetId)
          : nextMaterials.find(m => m.id === targetId);

        if (oldSection === 'WORK') {
          nextWorks = nextWorks.filter(w => w.id !== targetId);
        } else {
          nextMaterials = nextMaterials.filter(m => m.id !== targetId);
        }

        const migratedItem = {
          ...existingItem,
          id: `${newSection.toLowerCase()}_${Date.now()}`,
          name,
          category: newSection === 'WORK' ? 'CÔNG VIỆC XÂY DỰNG' : 'VẬT LIỆU ĐẦU VÀO'
        };

        if (newSection === 'WORK') nextWorks.push(migratedItem);
        else nextMaterials.push(migratedItem);
      }
      showToast(`✅ Đã cập nhật hạng mục: "${name}"`);
    } else {
      // Add new category
      const targetSection = catSectionInput;
      const newStt = targetSection === 'WORK' ? nextWorks.length + 1 : nextMaterials.length + 1;
      const newItem = {
        id: `${targetSection.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        stt: newStt,
        name,
        category: targetSection === 'WORK' ? 'CÔNG VIỆC XÂY DỰNG' : 'VẬT LIỆU ĐẦU VÀO',
        standards: initialStds
      };

      if (targetSection === 'WORK') nextWorks.push(newItem);
      else nextMaterials.push(newItem);
      showToast(`🎉 Đã thêm mới hạng mục: "${name}"`);
    }

    onSaveStandards({
      works: nextWorks,
      materials: nextMaterials,
      mandatory: []
    });

    setCategoryModal({ isOpen: false, isEdit: false, category: null, section: 'WORK' });
  };

  const handleDeleteCategory = (item, section) => {
    let nextWorks = [...worksList];
    let nextMaterials = [...materialsList];

    if (section === 'WORK') {
      nextWorks = nextWorks.filter(w => w.id !== item.id);
    } else {
      nextMaterials = nextMaterials.filter(m => m.id !== item.id);
    }

    onSaveStandards({
      works: nextWorks,
      materials: nextMaterials,
      mandatory: []
    });

    showToast(`🗑️ Đã xóa hạng mục: "${item.name}"`);
    setDeleteModal({ isOpen: false, type: null, target: null, parentId: null });
  };

  // -------------------------------------------------------------
  // CRUD OPERATIONS FOR STANDARDS (TIÊU CHUẨN ĐI KÈM)
  // -------------------------------------------------------------
  const handleOpenAddStandard = (categoryId, section = 'WORK') => {
    setStdTextInput('');
    setStandardModal({
      isOpen: true,
      isEdit: false,
      categoryId,
      section,
      standardIndex: null,
      standardText: ''
    });
  };

  const handleOpenEditStandard = (categoryId, standardIndex, currentText, section = 'WORK') => {
    setStdTextInput(currentText);
    setStandardModal({
      isOpen: true,
      isEdit: true,
      categoryId,
      section,
      standardIndex,
      standardText: currentText
    });
  };

  const handleSaveStandard = (e) => {
    e.preventDefault();
    const text = stdTextInput.trim();
    if (!text) return;

    const { categoryId, standardIndex, isEdit, section } = standardModal;

    let nextWorks = [...worksList];
    let nextMaterials = [...materialsList];

    if (section === 'WORK') {
      nextWorks = nextWorks.map(w => {
        if (w.id !== categoryId) return w;
        const stds = [...(w.standards || [])];
        if (isEdit && typeof standardIndex === 'number') {
          stds[standardIndex] = text;
        } else {
          stds.push(text);
        }
        return { ...w, standards: stds };
      });
    } else {
      nextMaterials = nextMaterials.map(m => {
        if (m.id !== categoryId) return m;
        const stds = [...(m.standards || [])];
        if (isEdit && typeof standardIndex === 'number') {
          stds[standardIndex] = text;
        } else {
          stds.push(text);
        }
        return { ...m, standards: stds };
      });
    }

    onSaveStandards({
      works: nextWorks,
      materials: nextMaterials,
      mandatory: []
    });

    showToast(isEdit ? '✅ Đã cập nhật tiêu chuẩn!' : '🎉 Đã thêm tiêu chuẩn đi kèm!');
    setStandardModal({ isOpen: false, isEdit: false, categoryId: null, standardIndex: null, standardText: '' });
  };

  const handleDeleteStandard = (categoryId, standardIndex, section = 'WORK') => {
    let nextWorks = [...worksList];
    let nextMaterials = [...materialsList];

    if (section === 'WORK') {
      nextWorks = nextWorks.map(w => {
        if (w.id !== categoryId) return w;
        return { ...w, standards: (w.standards || []).filter((_, idx) => idx !== standardIndex) };
      });
    } else {
      nextMaterials = nextMaterials.map(m => {
        if (m.id !== categoryId) return m;
        return { ...m, standards: (m.standards || []).filter((_, idx) => idx !== standardIndex) };
      });
    }

    onSaveStandards({
      works: nextWorks,
      materials: nextMaterials,
      mandatory: []
    });

    showToast('🗑️ Đã xóa tiêu chuẩn');
    setDeleteModal({ isOpen: false, type: null, target: null, parentId: null });
  };

  // -------------------------------------------------------------
  // EXCEL IMPORT & RESET HELPERS
  // -------------------------------------------------------------
  const handleUploadExcel = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      if (data) {
        const parsed = parseStandardsExcel(data);
        if (parsed && (parsed.works.length > 0 || parsed.materials.length > 0)) {
          onSaveStandards({
            works: parsed.works.length > 0 ? parsed.works : worksList,
            materials: parsed.materials.length > 0 ? parsed.materials : materialsList,
            mandatory: []
          });
          const msg = `Đã nạp thành công từ Excel:\n• ${parsed.works.length} nhóm công việc (Sheet A)\n• ${parsed.materials.length} loại vật liệu (Sheet B)`;
          if (showAlert) showAlert({ type: 'success', title: 'Nạp File Excel Thành Công', message: msg });
          else alert(`✅ ${msg}`);
        } else {
          alert('Không tìm thấy dữ liệu hợp lệ trong file Excel. Vui lòng kiểm tra mẫu DANH MỤC TIÊU CHUẨN NGHIỆM THU.xls!');
        }
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleResetDefaults = () => {
    if (window.confirm('Bạn có chắc chắn muốn khôi phục toàn bộ danh mục tiêu chuẩn về mặc định ban đầu không? Các chỉnh sửa riêng sẽ bị ghi đè.')) {
      onSaveStandards(INITIAL_STANDARDS_DATA);
      showToast('🔄 Đã khôi phục toàn bộ danh mục tiêu chuẩn về mặc định!');
    }
  };

  const handleCloudSync = async () => {
    if (!onSyncStandardsToCloud) return;
    setIsSyncing(true);
    try {
      const ok = await onSyncStandardsToCloud();
      if (ok) showToast('☁️ Đã đồng bộ toàn bộ tiêu chuẩn lên Firestore Cloud thành công!');
      else showToast('⚠️ Đồng bộ Firestore thất bại');
    } catch {
      showToast('⚠️ Lỗi kết nối đám mây');
    } finally {
      setIsSyncing(false);
    }
  };

  // Helper format Standard Code
  const renderStandardItem = (stdStr, categoryId, idx, section) => {
    // Tách mã TCVN (ví dụ TCVN 4453:1995) và phần mô tả còn lại
    const match = stdStr.match(/^([A-Za-z0-9\-–:\.\/]+\s+[A-Za-z0-9\-–:\.\/]+)(.*)$/);
    const codePart = match ? match[1] : '';
    const descPart = match ? match[2] : stdStr;

    return (
      <div
        key={idx}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          gap: '12px',
          fontSize: '0.86rem',
          transition: 'all 0.15s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1, minWidth: 0 }}>
          <span style={{ color: '#dc2626', fontWeight: 800, marginTop: '1px' }}>•</span>
          <div style={{ wordBreak: 'break-word', lineHeight: 1.5 }}>
            {codePart ? (
              <strong style={{
                color: '#b91c1c',
                background: '#fef2f2',
                padding: '1px 6px',
                borderRadius: '4px',
                border: '1px solid #fecaca',
                marginRight: '6px',
                fontSize: '0.82rem',
                display: 'inline-block'
              }}>
                {codePart}
              </strong>
            ) : null}
            <span style={{ color: '#1e293b' }}>{descPart}</span>
          </div>
        </div>

        {/* Action buttons on standard */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => handleOpenEditStandard(categoryId, idx, stdStr, section)}
            title="Sửa tiêu chuẩn này"
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 8px',
              color: '#2563eb',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.74rem',
              fontWeight: 600
            }}
          >
            <Edit3 size={12} />
            <span>Sửa</span>
          </button>
          <button
            type="button"
            onClick={() => setDeleteModal({
              isOpen: true,
              type: 'STANDARD',
              target: { text: stdStr, index: idx },
              parentId: categoryId,
              section
            })}
            title="Xóa tiêu chuẩn này khỏi hạng mục"
            style={{
              background: '#fee2e2',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 8px',
              color: '#dc2626',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              fontSize: '0.74rem'
            }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

      {/* TOAST POPUP */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '24px',
          background: '#0f172a',
          color: '#ffffff',
          padding: '12px 18px',
          borderRadius: '10px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
          zIndex: 9999,
          fontSize: '0.88rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {toastMessage}
        </div>
      )}

      {/* STATS OVERVIEW CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
        <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '14px 18px' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>TỔNG SỐ HẠNG MỤC</div>
          <div style={{ fontSize: '1.55rem', fontWeight: 800, color: '#1e1b4b', marginTop: '2px' }}>
            {totalCategories} <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#64748b' }}>hạng mục</span>
          </div>
        </div>

        <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: '12px', padding: '14px 18px' }}>
          <div style={{ fontSize: '0.8rem', color: '#1d4ed8', fontWeight: 600 }}>CÔNG VIỆC XÂY DỰNG</div>
          <div style={{ fontSize: '1.55rem', fontWeight: 800, color: '#1e40af', marginTop: '2px' }}>
            {worksList.length} <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#3b82f6' }}>hạng mục</span>
          </div>
        </div>

        <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '12px', padding: '14px 18px' }}>
          <div style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: 600 }}>VẬT LIỆU ĐẦU VÀO (MẪU 12)</div>
          <div style={{ fontSize: '1.55rem', fontWeight: 800, color: '#166534', marginTop: '2px' }}>
            {materialsList.length} <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#22c55e' }}>loại vật liệu</span>
          </div>
        </div>

        <div style={{ background: '#fefce8', border: '1.5px solid #fef08a', borderRadius: '12px', padding: '14px 18px' }}>
          <div style={{ fontSize: '0.8rem', color: '#a16207', fontWeight: 600 }}>TỔNG TIÊU CHUẨN ĐI KÈM</div>
          <div style={{ fontSize: '1.55rem', fontWeight: 800, color: '#854d0e', marginTop: '2px' }}>
            {totalStandardsCount} <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#ca8a04' }}>tiêu chuẩn TCVN</span>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTER CONTROLS & COMPACT ACTIONS */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '14px 18px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Search input */}
        <div style={{ position: 'relative', flex: '1 1 260px', minWidth: '240px' }}>
          <Search size={17} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên hạng mục hoặc mã TCVN..."
            style={{ paddingLeft: '38px', borderRadius: '10px' }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
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
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setActiveFilter('ALL')}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: activeFilter === 'ALL' ? '1.5px solid #1e293b' : '1px solid #cbd5e1',
              background: activeFilter === 'ALL' ? '#1e293b' : '#ffffff',
              color: activeFilter === 'ALL' ? '#ffffff' : '#475569',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            Tất Cả ({totalCategories})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('WORK')}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: activeFilter === 'WORK' ? '1.5px solid #2563eb' : '1px solid #bfdbfe',
              background: activeFilter === 'WORK' ? '#2563eb' : '#eff6ff',
              color: activeFilter === 'WORK' ? '#ffffff' : '#1d4ed8',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            🏗️ Công Việc ({worksList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('MATERIAL')}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: activeFilter === 'MATERIAL' ? '1.5px solid #16a34a' : '1px solid #bbf7d0',
              background: activeFilter === 'MATERIAL' ? '#16a34a' : '#f0fdf4',
              color: activeFilter === 'MATERIAL' ? '#ffffff' : '#15803d',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            📦 Vật Liệu ({materialsList.length})
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <input
            ref={excelInputRef}
            type="file"
            accept=".xls,.xlsx"
            style={{ display: 'none' }}
            onChange={handleUploadExcel}
          />
          <button
            type="button"
            onClick={() => handleOpenAddCategory('WORK')}
            style={{
              background: '#16a34a',
              color: '#ffffff',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)'
            }}
          >
            <Plus size={14} />
            <span>Thêm Hạng Mục</span>
          </button>

          {/* <button
            type="button"
            onClick={() => excelInputRef.current?.click()}
            title="Nạp danh mục tiêu chuẩn từ file Excel"
            style={{
              background: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              padding: '8px 10px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Upload size={14} />
            <span>Nạp Excel</span>
          </button> */}

          {/* <button
            type="button"
            onClick={handleCloudSync}
            disabled={isSyncing}
            title="Đồng bộ toàn bộ danh mục lên Firestore Cloud"
            style={{
              background: '#eff6ff',
              color: '#2563eb',
              border: '1px solid #bfdbfe',
              padding: '8px 10px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: isSyncing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          > */}
          {/* <Cloud size={14} />
            <span>{isSyncing ? 'Đang lưu...' : 'Lưu Cloud'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            title="Khôi phục lại danh mục tiêu chuẩn gốc"
            style={{
              background: '#ffffff',
              color: '#64748b',
              border: '1px solid #cbd5e1',
              padding: '8px 9px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <RotateCcw size={14} />
          </button> */}
        </div>
      </div>

      {/* -------------------------------------------------------- */}
      {/* SECTION: CÔNG VIỆC XÂY DỰNG (CHIA THEO HẠNG MỤC) */}
      {/* -------------------------------------------------------- */}
      {(activeFilter === 'ALL' || activeFilter === 'WORK') && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 4px 12px 4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong style={{ fontSize: '1.05rem', color: '#1e3a8a', textTransform: 'uppercase' }}>
                🏗️ Hạng Mục Công Việc Xây Dựng ({filteredWorks.length} hạng mục)
              </strong>
            </div>
            <button
              type="button"
              onClick={() => handleOpenAddCategory('WORK')}
              style={{
                background: '#eff6ff',
                color: '#2563eb',
                border: '1px solid #bfdbfe',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Plus size={14} />
              <span>Thêm Hạng Mục Công Việc</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '14px' }}>
            {filteredWorks.map((item, index) => (
              <div
                key={item.id || index}
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  transition: 'border-color 0.15s ease'
                }}
              >
                {/* CATEGORY HEADER */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                        fontWeight: 800
                      }}>
                        Mục {item.stt || (index + 1)}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        {item.standards?.length || 0} tiêu chuẩn đi kèm
                      </span>
                    </div>
                    <strong style={{ fontSize: '0.96rem', color: '#0f172a', lineHeight: 1.4, display: 'block' }}>
                      {item.name}
                    </strong>
                  </div>

                  {/* Category action buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => handleOpenAddStandard(item.id, 'WORK')}
                      title="Thêm tiêu chuẩn đi kèm cho hạng mục này"
                      style={{
                        background: '#eff6ff',
                        color: '#2563eb',
                        border: '1px solid #bfdbfe',
                        padding: '5px 8px',
                        borderRadius: '6px',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      <Plus size={13} />
                      <span>Thêm TCVN</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditCategory(item, 'WORK')}
                      title="Sửa tên hạng mục"
                      style={{
                        background: '#f8fafc',
                        color: '#475569',
                        border: '1px solid #cbd5e1',
                        padding: '5px 7px',
                        borderRadius: '6px',
                        fontSize: '0.76rem',
                        cursor: 'pointer'
                      }}
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteModal({ isOpen: true, type: 'CATEGORY', target: item, section: 'WORK' })}
                      title="Xóa hạng mục này"
                      style={{
                        background: '#fef2f2',
                        color: '#dc2626',
                        border: '1px solid #fecaca',
                        padding: '5px 7px',
                        borderRadius: '6px',
                        fontSize: '0.76rem',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* ASSOCIATED STANDARDS LIST */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '60px' }}>
                  {item.standards && item.standards.length > 0 ? (
                    item.standards.map((s, sIdx) => renderStandardItem(s, item.id, sIdx, 'WORK'))
                  ) : (
                    <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '8px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic' }}>
                      Chưa có tiêu chuẩn nào được gán cho hạng mục này. Bấm <strong>+ Thêm TCVN</strong> để thêm.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------- */}
      {/* SECTION: VẬT LIỆU ĐẦU VÀO (CHIA THEO HẠNG MỤC) */}
      {/* -------------------------------------------------------- */}
      {(activeFilter === 'ALL' || activeFilter === 'MATERIAL') && (
        <div style={{ marginTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 4px 12px 4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong style={{ fontSize: '1.05rem', color: '#166534', textTransform: 'uppercase' }}>
                📦 Hạng Mục Vật Liệu Đầu Vào - Mẫu Số 12 ({filteredMaterials.length} loại vật liệu)
              </strong>
            </div>
            <button
              type="button"
              onClick={() => handleOpenAddCategory('MATERIAL')}
              style={{
                background: '#f0fdf4',
                color: '#16a34a',
                border: '1px solid #bbf7d0',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Plus size={14} />
              <span>Thêm Hạng Mục Vật Liệu</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '14px' }}>
            {filteredMaterials.map((item, index) => (
              <div
                key={item.id || index}
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #dcfce7',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                }}
              >
                {/* CATEGORY HEADER */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', borderBottom: '1px solid #f0fdf4', paddingBottom: '10px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{
                        background: '#dcfce7',
                        color: '#15803d',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                        fontWeight: 800
                      }}>
                        Mục {item.stt || (index + 1)}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        {item.standards?.length || 0} tiêu chuẩn đi kèm
                      </span>
                    </div>
                    <strong style={{ fontSize: '0.96rem', color: '#0f172a', lineHeight: 1.4, display: 'block' }}>
                      {item.name}
                    </strong>
                  </div>

                  {/* Category action buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => handleOpenAddStandard(item.id, 'MATERIAL')}
                      title="Thêm tiêu chuẩn đi kèm cho loại vật liệu này"
                      style={{
                        background: '#f0fdf4',
                        color: '#16a34a',
                        border: '1px solid #bbf7d0',
                        padding: '5px 8px',
                        borderRadius: '6px',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      <Plus size={13} />
                      <span>Thêm TCVN</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditCategory(item, 'MATERIAL')}
                      title="Sửa tên loại vật liệu"
                      style={{
                        background: '#f8fafc',
                        color: '#475569',
                        border: '1px solid #cbd5e1',
                        padding: '5px 7px',
                        borderRadius: '6px',
                        fontSize: '0.76rem',
                        cursor: 'pointer'
                      }}
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteModal({ isOpen: true, type: 'CATEGORY', target: item, section: 'MATERIAL' })}
                      title="Xóa loại vật liệu này"
                      style={{
                        background: '#fef2f2',
                        color: '#dc2626',
                        border: '1px solid #fecaca',
                        padding: '5px 7px',
                        borderRadius: '6px',
                        fontSize: '0.76rem',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* ASSOCIATED STANDARDS LIST */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '60px' }}>
                  {item.standards && item.standards.length > 0 ? (
                    item.standards.map((s, sIdx) => renderStandardItem(s, item.id, sIdx, 'MATERIAL'))
                  ) : (
                    <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '8px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic' }}>
                      Chưa có tiêu chuẩn nào được gán cho loại vật liệu này. Bấm <strong>+ Thêm TCVN</strong> để thêm.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------- */}
      {/* MODAL 1: THÊM / SỬA HẠNG MỤC (CATEGORY MODAL) */}
      {/* -------------------------------------------------------- */}
      {categoryModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ background: '#eff6ff', padding: '8px', borderRadius: '8px', color: '#2563eb' }}>
                  <Layers size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem' }}>
                    {categoryModal.isEdit ? 'Chỉnh Sửa Hạng Mục Nghiệm Thu' : 'Thêm Hạng Mục Nghiệm Thu Mới'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                    Admin cấu hình phân loại và tiêu chuẩn kỹ thuật đi kèm
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setCategoryModal({ isOpen: false, isEdit: false, category: null, section: 'WORK' })}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="modal-body" style={{ padding: '20px' }}>
              <div className="form-group">
                <label className="form-label">Tên Hạng Mục (*):</label>
                <input
                  type="text"
                  className="form-input"
                  value={catNameInput}
                  onChange={(e) => setCatNameInput(e.target.value)}
                  placeholder="Ví dụ: Thi công cọc khoan nhồi / Cốt thép dầm sàn..."
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phân Loại Hạng Mục (*):</label>
                <select
                  className="form-select"
                  value={catSectionInput}
                  onChange={(e) => setCatSectionInput(e.target.value)}
                  style={{ fontWeight: 600 }}
                >
                  <option value="WORK">🏗️ Công Việc Xây Dựng (Sheet A)</option>
                  <option value="MATERIAL">📦 Vật Liệu Đầu Vào - Mẫu Số 12 (Sheet B)</option>
                </select>
              </div>

              {!categoryModal.isEdit && (
                <div className="form-group">
                  <label className="form-label">
                    Danh Sách Tiêu Chuẩn Đi Kèm Ban Đầu (Mỗi dòng một tiêu chuẩn):
                  </label>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    value={catInitialStandardsInput}
                    onChange={(e) => setCatInitialStandardsInput(e.target.value)}
                    placeholder="Ví dụ:&#10;TCVN 9398:2012 Công tác trắc địa trong xây dựng&#10;TCVN 4453:1995 Kết cấu bê tông và BTCT"
                  />
                  <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '4px' }}>
                    💡 Bạn có thể dán nhiều dòng tiêu chuẩn cùng lúc, hoặc thêm từng tiêu chuẩn sau khi tạo xong.
                  </div>
                </div>
              )}

              <div className="modal-footer" style={{ marginTop: '16px', padding: 0 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setCategoryModal({ isOpen: false, isEdit: false, category: null, section: 'WORK' })}
                >
                  Hủy
                </button>
                <button type="submit" className="btn-primary" style={{ background: '#2563eb' }}>
                  <Check size={16} />
                  <span>{categoryModal.isEdit ? 'Lưu Thay Đổi' : 'Tạo Hạng Mục Mới'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------- */}
      {/* MODAL 2: THÊM / SỬA TIÊU CHUẨN (STANDARD MODAL) */}
      {/* -------------------------------------------------------- */}
      {standardModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ background: '#fef2f2', padding: '8px', borderRadius: '8px', color: '#dc2626' }}>
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem' }}>
                    {standardModal.isEdit ? 'Chỉnh Sửa Tiêu Chuẩn Áp Dụng' : 'Thêm Tiêu Chuẩn Đi Kèm Mới'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                    Áp dụng tiêu chuẩn TCVN / QCVN / ASTM cho hạng mục
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setStandardModal({ isOpen: false, isEdit: false, categoryId: null, standardIndex: null, standardText: '' })}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveStandard} className="modal-body" style={{ padding: '20px' }}>
              <div className="form-group">
                <label className="form-label">Nội Dung Tiêu Chuẩn Áp Dụng (*):</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={stdTextInput}
                  onChange={(e) => setStdTextInput(e.target.value)}
                  placeholder="Ví dụ: TCVN 4453:1995 Kết cấu bê tông và bê tông cốt thép - Thi công và nghiệm thu"
                  required
                  autoFocus
                  style={{ fontWeight: 600, color: '#0f172a' }}
                />
              </div>

              {/* Suggestions chips */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '6px', fontWeight: 600 }}>
                  Gợi ý mã nhanh:
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[
                    'TCVN 5637:1991',
                    'TCVN 4453:1995',
                    'TCVN 4055:2024',
                    'TCVN 4085:2025',
                    'TCVN 9377-1:2012',
                    'TCVN 6415-1:2016'
                  ].map((code, cIdx) => (
                    <button
                      key={cIdx}
                      type="button"
                      onClick={() => setStdTextInput(prev => prev ? `${code} ${prev}` : `${code} `)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: '#f8fafc',
                        fontSize: '0.74rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                        color: '#b91c1c'
                      }}
                    >
                      + {code}
                    </button>
                  ))}
                </div>
              </div>

              <div className="modal-footer" style={{ padding: 0 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setStandardModal({ isOpen: false, isEdit: false, categoryId: null, standardIndex: null, standardText: '' })}
                >
                  Hủy
                </button>
                <button type="submit" className="btn-primary" style={{ background: '#2563eb' }}>
                  <Check size={16} />
                  <span>{standardModal.isEdit ? 'Lưu Tiêu Chuẩn' : 'Thêm Tiêu Chuẩn'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------- */}
      {/* MODAL 3: XÁC NHẬN XÓA (CONFIRM DELETE MODAL) */}
      {/* -------------------------------------------------------- */}
      {deleteModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header" style={{ borderBottom: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: '#fee2e2', padding: '10px', borderRadius: '10px', color: '#dc2626' }}>
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#991b1b' }}>
                    {deleteModal.type === 'CATEGORY' ? 'Xác Nhận Xóa Hạng Mục' : 'Xác Nhận Xóa Tiêu Chuẩn'}
                  </h3>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setDeleteModal({ isOpen: false, type: null, target: null, parentId: null })}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '0 20px 20px 20px', color: '#475569', fontSize: '0.88rem' }}>
              {deleteModal.type === 'CATEGORY' ? (
                <div>
                  Bạn có chắc chắn muốn xóa hạng mục: <br />
                  <strong style={{ color: '#0f172a' }}>"{deleteModal.target?.name}"</strong> cùng tất cả các tiêu chuẩn đi kèm không?
                </div>
              ) : (
                <div>
                  Bạn có chắc chắn muốn xóa tiêu chuẩn này khỏi hạng mục không? <br />
                  <strong style={{ color: '#b91c1c' }}>"{deleteModal.target?.text}"</strong>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ background: '#f8fafc' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeleteModal({ isOpen: false, type: null, target: null, parentId: null })}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ background: '#dc2626' }}
                onClick={() => {
                  if (deleteModal.type === 'CATEGORY') {
                    handleDeleteCategory(deleteModal.target, deleteModal.section);
                  } else {
                    handleDeleteStandard(deleteModal.parentId, deleteModal.target?.index, deleteModal.section);
                  }
                }}
              >
                <Trash2 size={16} />
                <span>Xác Nhận Xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
