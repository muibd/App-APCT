import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Send, Users, Calendar, MapPin, CheckSquare, Square, 
  AlertCircle, Building, Camera, ImagePlus, Zap, Trash2, Plus, Clock, FileSpreadsheet, Package 
} from 'lucide-react';
import { MOCK_PROJECT, MOCK_USERS } from '../data/mockData';
import { saveBuilding } from '../services/firestoreService';
import { compressImageFile } from '../utils/storageHelper';
import { 
  CONSTRUCTION_WORK_STANDARDS, 
  MATERIAL_STANDARDS, 
  GENERAL_MANDATORY_STANDARDS, 
  getSuggestedStandards 
} from '../data/standardsRules';



export default function CreateRequestModal({ isOpen, onClose, users, currentUser, onSubmitRequest, showAlert, standardsData }) {
  if (!isOpen) return null;

  const activeWorks = (standardsData?.works && standardsData.works.length > 0) ? standardsData.works : CONSTRUCTION_WORK_STANDARDS;
  const activeMaterials = (standardsData?.materials && standardsData.materials.length > 0) ? standardsData.materials : MATERIAL_STANDARDS;
  const activeMandatory = (standardsData?.mandatory && standardsData.mandatory.length > 0) ? standardsData.mandatory : GENERAL_MANDATORY_STANDARDS;

  // Filter recipient groups
  const supervisorList = users.filter(u => u.role === 'SUPERVISOR' || u.role === 'LEAD_SUPERVISOR');
  const investorList = users.filter(u => u.role === 'INVESTOR' || u.role === 'LEAD_INVESTOR');

  // Form State
  const [requestNumber, setRequestNumber] = useState(`0${Math.floor(Math.random() * 80) + 10}/PYC-APG`);
  const [contractorCompany, setContractorCompany] = useState(() => currentUser?.company || 'Công ty CP Xây dựng An Phú Gia');

  useEffect(() => {
    if (currentUser?.company) {
      setContractorCompany(currentUser.company);
    }
  }, [currentUser?.company]);

  const availableContractorCompanies = Array.from(new Set([
    'Công ty CP Xây dựng An Phú Gia',
    'Công ty TNHH Tư vấn Thiết kế Bình Hoà',
    ...(users || []).filter(u => u.role === 'CONTRACTOR').map(u => u.company).filter(Boolean),
    currentUser?.company
  ].filter(Boolean)));
  
  // Danh sách công trình / tòa nhà (kết hợp mặc định và bổ sung)
  const [buildingsList, setBuildingsList] = useState(() => {
    try {
      const saved = localStorage.getItem('apct_custom_buildings');
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged = [...MOCK_PROJECT.buildings];
        parsed.forEach(p => {
          if (!merged.some(b => b.name === p.name)) merged.push(p);
        });
        return merged;
      }
    } catch (e) {
      console.warn(e);
    }
    return MOCK_PROJECT.buildings;
  });
  const [isAddingBuilding, setIsAddingBuilding] = useState(false);
  const [newBuildingInput, setNewBuildingInput] = useState('');

  const [selectedBuilding, setSelectedBuilding] = useState(() => {
    return buildingsList[0]?.name || MOCK_PROJECT.buildings[0].name;
  });
  const [customItems, setCustomItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(() => {
    return buildingsList[0]?.items?.[0]?.name || 'Thi công phần kết cấu – Tòa A và Tòa B';
  });
  const [customItemInput, setCustomItemInput] = useState('');
  const [taskContent, setTaskContent] = useState(() => {
    return buildingsList[0]?.items?.[0]?.tasks?.[0] || 'Nghiệm thu công tác định vị tim trục dầm sàn';
  });
  const [customTask, setCustomTask] = useState('');

  // -------------------------------------------------------------
  // HỆ THỐNG ĐỘNG THEO FILE EXCEL & MẪU SỐ 12
  // -------------------------------------------------------------
  // Loại hình nghiệm thu: 'WORK' (Công việc xây dựng) | 'MATERIAL' (Vật liệu đầu vào - Mẫu số 12)
  const [inspectionType, setInspectionType] = useState('WORK');

  // Cho Công việc xây dựng (Theo danh mục Admin quản lý)
  const [selectedWorkGroup, setSelectedWorkGroup] = useState(() => activeWorks[0]?.name || 'Cốt thép, ván khuôn, bê tông');

  // Cho Vật liệu đầu vào (Theo danh mục Admin quản lý)
  const [selectedMaterialGroup, setSelectedMaterialGroup] = useState(() => activeMaterials[0]?.name || 'Gạch ốp lát');
  const [materialsList, setMaterialsList] = useState([
    {
      id: 'mat_1',
      name: 'Gạch ốp lát granite 600x600',
      origin: 'Đồng Nai, Việt Nam',
      unit: 'm2',
      quantity: '500',
      certificateNumber: 'CCXX-2026/01/ĐN'
    }
  ]);

  // Tiêu chuẩn áp dụng (Tự động cập nhật theo cấu hình tiêu chuẩn do Admin quản lý)
  const [suggestedStandardsList, setSuggestedStandardsList] = useState(() => {
    return getSuggestedStandards(activeWorks[0]?.name || 'Cốt thép, ván khuôn, bê tông', 'WORK', activeWorks, activeMaterials, activeMandatory);
  });
  const [selectedStandards, setSelectedStandards] = useState(() => {
    return getSuggestedStandards(activeWorks[0]?.name || 'Cốt thép, ván khuôn, bê tông', 'WORK', activeWorks, activeMaterials, activeMandatory);
  });

  const updateStandards = (query, type) => {
    const suggested = getSuggestedStandards(query, type, activeWorks, activeMaterials, activeMandatory);
    setSuggestedStandardsList(suggested);
    setSelectedStandards(suggested);
  };

  const refreshStandardsForMaterials = (mats) => {
    const allSuggested = [];
    mats.forEach(m => {
      if (m.name && m.name.trim().length > 1) {
        const stds = getSuggestedStandards(m.name, 'MATERIAL', activeWorks, activeMaterials, activeMandatory);
        stds.forEach(s => {
          if (!allSuggested.includes(s)) allSuggested.push(s);
        });
      }
    });
    if (allSuggested.length > 0) {
      setSuggestedStandardsList(allSuggested);
      setSelectedStandards(prev => {
        const combined = [...prev];
        allSuggested.forEach(s => {
          if (!combined.includes(s)) combined.push(s);
        });
        return combined;
      });
    }
  };

  const handleAddMaterial = () => {
    const newId = `mat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setMaterialsList(prev => [
      ...prev,
      {
        id: newId,
        name: '',
        origin: '',
        unit: '',
        quantity: '',
        certificateNumber: ''
      }
    ]);
  };

  const handleRemoveMaterial = (index) => {
    if (materialsList.length <= 1) return;
    setMaterialsList(prev => {
      const next = prev.filter((_, i) => i !== index);
      refreshStandardsForMaterials(next);
      return next;
    });
  };

  const handleUpdateMaterial = (index, field, value) => {
    setMaterialsList(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (field === 'name' && value.trim().length > 2) {
        refreshStandardsForMaterials(next);
      }
      return next;
    });
  };

  const handleSelectMaterialGroupForAdd = (groupName) => {
    setSelectedMaterialGroup(groupName);
    if (!groupName || groupName === '__CUSTOM_MAT__') return;
    setMaterialsList(prev => {
      const next = [...prev];
      if (next.length === 1 && !next[0].name.trim()) {
        next[0] = {
          ...next[0],
          name: groupName,
          origin: next[0].origin || 'Đồng Nai, Việt Nam',
          unit: next[0].unit || 'm2',
          quantity: next[0].quantity || '100',
          certificateNumber: next[0].certificateNumber || 'CCXX-2026/01/ĐN'
        };
      } else {
        next.push({
          id: `mat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: groupName,
          origin: 'Việt Nam',
          unit: 'lô',
          quantity: '1',
          certificateNumber: ''
        });
      }
      refreshStandardsForMaterials(next);
      return next;
    });
  };

  const handleInspectionTypeChange = (type) => {
    setInspectionType(type);
    if (type === 'MATERIAL') {
      refreshStandardsForMaterials(materialsList);
    } else {
      const currentTask = customTask.trim() || taskContent || selectedWorkGroup;
      updateStandards(currentTask, 'WORK');
    }
  };

  const handleWorkGroupChange = (groupName) => {
    setSelectedWorkGroup(groupName);
    if (groupName !== '__CUSTOM_WORK__') {
      setTaskContent(`Nghiệm thu công tác ${groupName.toLowerCase()}`);
      setCustomTask('');
      updateStandards(groupName, 'WORK');
    }
  };

  const handleWorkTaskSelect = (task) => {
    setTaskContent(task);
    setCustomTask('');
    if (task !== '__custom__') {
      updateStandards(task, 'WORK');
    }
  };

  const toggleApplicableStandard = (std) => {
    setSelectedStandards(prev => 
      prev.includes(std) ? prev.filter(s => s !== std) : [...prev, std]
    );
  };

  // Ngày thực hiện
  const [scheduledDate, setScheduledDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Hàm tính giờ kết thúc tự động = giờ bắt đầu + 30 phút
  const calculateEndTime = (timeStr, addMinutes = 30) => {
    if (!timeStr) return '';
    const [hStr, mStr] = timeStr.split(':');
    let h = parseInt(hStr, 10);
    let m = parseInt(mStr, 10);
    if (isNaN(h) || isNaN(m)) return '';
    const totalMinutes = h * 60 + m + addMinutes;
    const newH = Math.floor(totalMinutes / 60) % 24;
    const newM = totalMinutes % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
  };

  // Giờ bắt đầu: Mặc định lấy giờ hiện tại khi lập phiếu, người dùng được quyền chỉnh sửa
  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });

  const [inspectionPlace, setInspectionPlace] = useState(MOCK_PROJECT.projectName);

  // Evidence / Construction Photos State
  const [evidencePhotos, setEvidencePhotos] = useState([]);
  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Computed building items & tasks
  const currentBuilding = buildingsList.find(b => b.name === selectedBuilding) || buildingsList[0] || MOCK_PROJECT.buildings[0];
  const buildingItems = [
    ...(currentBuilding?.items || []),
    ...customItems.filter(ci => ci.buildingName === selectedBuilding)
  ];
  const currentItemObj = buildingItems.find(it => it.name === selectedItem);
  const availableTasks = currentItemObj?.tasks || [];

  const handleAddNewBuilding = () => {
    if (!newBuildingInput.trim()) return;
    const name = newBuildingInput.trim();
    if (buildingsList.some(b => b.name.toLowerCase() === name.toLowerCase())) {
      setSelectedBuilding(name);
      setIsAddingBuilding(false);
      setNewBuildingInput('');
      return;
    }
    const newBld = {
      id: `bld_${Date.now()}`,
      name: name,
      items: [
        {
          id: `item_${Date.now()}`,
          name: 'Phần hoàn thiện & Nghiệm thu công tác',
          tasks: [
            `Nghiệm thu công tác thi công tại ${name}`
          ]
        }
      ]
    };
    const updated = [...buildingsList, newBld];
    setBuildingsList(updated);
    try {
      localStorage.setItem('apct_custom_buildings', JSON.stringify(updated.filter(b => !MOCK_PROJECT.buildings.some(mb => mb.id === b.id))));
      saveBuilding(newBld).catch(() => {});
    } catch (e) {
      console.warn(e);
    }
    setSelectedBuilding(name);
    setSelectedItem(newBld.items[0].name);
    setTaskContent(newBld.items[0].tasks[0]);
    setIsAddingBuilding(false);
    setNewBuildingInput('');
  };

  const handleBuildingChange = (bName) => {
    if (bName === '__NEW_BUILDING__') {
      setIsAddingBuilding(true);
      return;
    }
    setSelectedBuilding(bName);
    const b = buildingsList.find(x => x.name === bName) || buildingsList[0] || MOCK_PROJECT.buildings[0];
    const bItems = [
      ...(b?.items || []),
      ...customItems.filter(ci => ci.buildingName === bName)
    ];
    const firstItem = bItems[0]?.name || '__NEW_ITEM__';
    setSelectedItem(firstItem);
    if (bItems[0]?.tasks?.[0]) {
      setTaskContent(bItems[0].tasks[0]);
      setCustomTask('');
    } else {
      setTaskContent('__custom__');
    }
  };

  const handleItemChange = (iName) => {
    setSelectedItem(iName);
    if (iName === '__NEW_ITEM__') {
      setTaskContent('__custom__');
    } else {
      const it = buildingItems.find(x => x.name === iName);
      if (it?.tasks?.length) {
        setTaskContent(it.tasks[0]);
        setCustomTask('');
      } else {
        setTaskContent('__custom__');
      }
    }
  };

  // Upload/capture handlers (Tự động nén siêu nhẹ ~35KB để bảo vệ bộ nhớ)
  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    for (const file of files) {
      const compressedUrl = await compressImageFile(file);
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
      const newPhoto = {
        id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        url: compressedUrl,
        caption: file.name ? `Ảnh thi công: ${file.name.replace(/\.[^/.]+$/, '')}` : 'Hiện trường thi công thực tế',
        gps: '10.0076° N, 105.7823° E (P. Thường Thạnh, TP. Cần Thơ)',
        time: timeStr,
        photographer: `${currentUser?.fullName || 'KS. Lê Văn Kỹ Thuật'} (ĐVTC)`
      };
      setEvidencePhotos(prev => [...prev, newPhoto]);
    }
    e.target.value = '';
  };



  const handleDeletePhoto = (photoId) => {
    setEvidencePhotos(prev => prev.filter(p => p.id !== photoId));
  };

  const handleUpdatePhotoCaption = (photoId, newCaption) => {
    setEvidencePhotos(prev => prev.map(p => p.id === photoId ? { ...p, caption: newCaption } : p));
  };

  // Chọn dạng Radio: Chỉ chọn duy nhất 1 cán bộ TVGS và 1 cán bộ CĐT
  const [selectedSupervisor, setSelectedSupervisor] = useState(() => supervisorList[0]?.uid || '');
  const [selectedInvestor, setSelectedInvestor] = useState(() => investorList[0]?.uid || '');

  useEffect(() => {
    if (!selectedSupervisor && supervisorList.length > 0) {
      setSelectedSupervisor(supervisorList[0]?.uid || '');
    }
    if (!selectedInvestor && investorList.length > 0) {
      setSelectedInvestor(investorList[0]?.uid || '');
    }
  }, [supervisorList, investorList, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedSupervisor) {
      if (showAlert) {
        showAlert({
          type: 'warning',
          title: 'Chưa Chọn TVGS',
          message: 'Vui lòng chọn 1 cán bộ Tư Vấn Giám Sát tiếp nhận nghiệm thu!'
        });
      } else {
        alert('Vui lòng chọn 1 cán bộ TVGS!');
      }
      return;
    }

    const finalItem = (selectedItem === '__NEW_ITEM__' && customItemInput.trim()) 
      ? customItemInput.trim() 
      : selectedItem;

    if (selectedItem === '__NEW_ITEM__' && !customItemInput.trim()) {
      if (showAlert) {
        showAlert({
          type: 'warning',
          title: 'Thiếu Tên Hạng Mục',
          message: 'Vui lòng nhập tên hạng mục mới trước khi gửi!'
        });
      } else {
        alert('Vui lòng nhập tên hạng mục mới!');
      }
      return;
    }

    if (inspectionType === 'MATERIAL') {
      const invalidMat = materialsList.find(m => !m.name.trim() || !m.quantity.toString().trim() || !m.unit.trim());
      if (invalidMat || materialsList.length === 0) {
        if (showAlert) {
          showAlert({
            type: 'warning',
            title: 'Chưa Điền Đủ Vật Liệu',
            message: 'Vui lòng điền đầy đủ Tên, Đơn vị tính và Khối lượng cho tất cả các dòng vật liệu đầu vào!'
          });
        } else {
          alert('Vui lòng điền đầy đủ Tên, Đơn vị tính và Khối lượng cho tất cả các dòng vật liệu đầu vào!');
        }
        return;
      }
    }

    const selectedUids = [selectedSupervisor, selectedInvestor].filter(Boolean);
    const assignedRecipients = selectedUids.map(uid => {
      const u = users.find(x => x.uid === uid);
      return {
        uid: u?.uid || uid,
        fullName: u?.fullName || 'Cán bộ tiếp nhận',
        role: u?.role || 'SUPERVISOR',
        leaderId: u?.leaderId || null,
        company: u?.company || 'Ban QLDA / GELICON',
        position: u?.position || 'Cán bộ giám sát',
        email: u?.email || '',
        receivedAt: new Date().toISOString()
      };
    });

    let finalRecipients = assignedRecipients;
    if (finalRecipients.length === 0) {
      const sup = users.find(u => u.role === 'SUPERVISOR' || u.role === 'LEAD_SUPERVISOR') || MOCK_USERS.find(u => u.role === 'SUPERVISOR' || u.role === 'LEAD_SUPERVISOR');
      const inv = users.find(u => u.role === 'INVESTOR' || u.role === 'LEAD_INVESTOR') || MOCK_USERS.find(u => u.role === 'INVESTOR' || u.role === 'LEAD_INVESTOR');
      finalRecipients = [sup, inv].filter(Boolean).map(u => ({
        uid: u.uid,
        fullName: u.fullName,
        role: u.role,
        leaderId: u.leaderId || null,
        company: u.company || 'GELICON / An Phú Cần Thơ',
        position: u.position || 'Cán bộ nghiệm thu',
        email: u.email || '',
        receivedAt: new Date().toISOString()
      }));
    }

    const materialNamesStr = materialsList.map(m => m.name.trim()).filter(Boolean).join(', ');

    const finalTask = inspectionType === 'MATERIAL'
      ? `Nghiệm thu vật liệu đầu vào: ${materialNamesStr || 'Vật tư thi công'}`
      : (customTask.trim() ? customTask : taskContent);

    const finalItemName = finalItem;

    const calculatedEndTime = calculateEndTime(startTime, 30);
    const dateFormatted = scheduledDate.split('-').reverse().join('/');
    const formattedStartTime = `${startTime.replace(':', 'h')}, ngày ${dateFormatted}`;
    const formattedEndTime = `${calculatedEndTime.replace(':', 'h')}, ngày ${dateFormatted}`;

    const newRequest = {
      id: `req_${Date.now()}`,
      requestNumber,
      projectId: MOCK_PROJECT.id,
      projectName: MOCK_PROJECT.projectName,
      buildingName: selectedBuilding,
      itemName: finalItemName,
      location: MOCK_PROJECT.location,
      contractorCompany: contractorCompany.trim() || currentUser?.company || 'Công ty CP Xây dựng An Phú Gia',
      createdByUid: currentUser?.uid || 'uid_dvtc_01',
      createdByName: currentUser?.fullName || 'KS. Lê Văn Kỹ Thuật',
      createdByRole: currentUser?.position || 'Kỹ thuật hiện trường',
      taskContent: finalTask,
      startTime: formattedStartTime,
      endTime: formattedEndTime,
      scheduledTime: `${startTime} ${dateFormatted}`,
      inspectionPlace,
      status: 'SENT',
      createdAt: new Date().toISOString(),
      hasReport: true,
      reportId: null,
      assignedRecipients: finalRecipients,
      evidencePhotos: evidencePhotos,
      // DỮ LIỆU ĐỘNG THEO EXCEL & MẪU SỐ 12:
      inspectionType, // 'WORK' | 'MATERIAL'
      standardsApplied: selectedStandards,
      reportTemplate: inspectionType === 'MATERIAL' ? 'FORM_12' : 'CONSTRUCTION_WORK',
      materials: inspectionType === 'MATERIAL' ? materialsList : null,
      materialDetails: inspectionType === 'MATERIAL' ? {
        name: materialNamesStr || materialsList[0]?.name || '',
        origin: materialsList[0]?.origin || '',
        unit: materialsList[0]?.unit || '',
        quantity: materialsList.map(m => `${m.quantity} ${m.unit}`).join(', '),
        certificateNumber: Array.from(new Set(materialsList.map(m => m.certificateNumber).filter(Boolean))).join(', '),
        materials: materialsList,
        isPass: true
      } : null
    };

    onSubmitRequest(newRequest);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '820px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#eff6ff', padding: '8px', borderRadius: '10px', color: '#2563eb' }}>
              <Send size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Lập Phiếu Yêu Cầu Nghiệm Thu</h3>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* CHỌN LOẠI HÌNH NGHIỆM THU: CÔNG VIỆC XÂY DỰNG vs VẬT LIỆU ĐẦU VÀO (MẪU SỐ 12) */}
          <div style={{
            display: 'flex',
            background: '#f1f5f9',
            padding: '4px',
            borderRadius: '12px',
            marginBottom: '16px',
            border: '1.5px solid #e2e8f0'
          }}>
            <button
              type="button"
              onClick={() => handleInspectionTypeChange('WORK')}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: inspectionType === 'WORK' ? '#ffffff' : 'transparent',
                color: inspectionType === 'WORK' ? '#1d4ed8' : '#64748b',
                boxShadow: inspectionType === 'WORK' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <span>🏗️</span>
              <span>1. Biên Bản Công Việc Xây Dựng</span>
            </button>
            <button
              type="button"
              onClick={() => handleInspectionTypeChange('MATERIAL')}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: inspectionType === 'MATERIAL' ? '#ffffff' : 'transparent',
                color: inspectionType === 'MATERIAL' ? '#059669' : '#64748b',
                boxShadow: inspectionType === 'MATERIAL' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Package size={17} color={inspectionType === 'MATERIAL' ? '#059669' : '#64748b'} />
              <span>2. Vật Liệu Đầu Vào</span>
            </button>
          </div>

          {/* Row 1: Số phiếu & Đơn vị thi công */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '14px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Mã số phiếu:</label>
              <input 
                type="text" 
                className="form-input" 
                value={requestNumber} 
                onChange={(e) => setRequestNumber(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Đơn vị thi công:</span>
                <span style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 500 }}>✏️ Có thể sửa</span>
              </label>
              <input 
                type="text" 
                className="form-input" 
                list="req-contractor-companies"
                value={contractorCompany} 
                onChange={(e) => setContractorCompany(e.target.value)} 
                placeholder="Nhập tên Đơn vị thi công..."
                required 
                style={{ color: '#0f172a', fontWeight: '600' }} 
              />
              <datalist id="req-contractor-companies">
                {availableContractorCompanies.map((c, i) => (
                  <option key={i} value={c} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Row 1.5: Dự án */}
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label">Dự án:</label>
            <input 
              type="text" 
              className="form-input" 
              value={MOCK_PROJECT.projectName} 
              disabled 
              style={{ background: '#f8fafc', color: '#475569', cursor: 'not-allowed' }} 
            />
          </div>

          {/* NẾU LÀ CÔNG VIỆC XÂY DỰNG */}
          {inspectionType === 'WORK' ? (
            <>
              {/* Row 2: Công trình & Hạng mục */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Công trình / Khối nhà:</label>
                    <button
                      type="button"
                      onClick={() => setIsAddingBuilding(!isAddingBuilding)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563eb',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: 0
                      }}
                    >
                      <Plus size={13} />
                      <span>{isAddingBuilding ? 'Hủy thêm' : 'Thêm công trình'}</span>
                    </button>
                  </div>
                  <select 
                    className="form-select" 
                    value={selectedBuilding} 
                    onChange={(e) => handleBuildingChange(e.target.value)}
                  >
                    {buildingsList.map(b => (
                      <option key={b.id || b.name} value={b.name}>{b.name}</option>
                    ))}
                    <option value="__NEW_BUILDING__">➕ -- Thêm công trình / tòa nhà mới --</option>
                  </select>

                  {isAddingBuilding && (
                    <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Nhập tên công trình mới (VD: Chung cư NOXH 3, Tòa C...)"
                        value={newBuildingInput}
                        onChange={(e) => setNewBuildingInput(e.target.value)}
                        style={{ flex: 1, borderColor: '#2563eb', background: '#f8fafc' }}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ padding: '0 12px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                        onClick={handleAddNewBuilding}
                      >
                        Lưu
                      </button>
                    </div>
                  )}
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Hạng mục:</span>
                    {selectedItem === '__NEW_ITEM__' && (
                      <span style={{ color: '#2563eb', fontSize: '0.74rem', fontWeight: 700 }}>
                        ✨ Thêm mới
                      </span>
                    )}
                  </label>
                  <select 
                    className="form-select" 
                    value={selectedItem} 
                    onChange={(e) => handleItemChange(e.target.value)}
                  >
                    {buildingItems.map(it => (
                      <option key={it.id || it.name} value={it.name}>{it.name}</option>
                    ))}
                    <option value="__NEW_ITEM__">➕ -- Thêm hạng mục mới --</option>
                  </select>
                  {selectedItem === '__NEW_ITEM__' && (
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Nhập tên hạng mục mới (VD: Thi công trần thạch cao, Thi công M&E...)" 
                      value={customItemInput} 
                      onChange={(e) => setCustomItemInput(e.target.value)} 
                      style={{ marginTop: '8px', borderColor: '#2563eb', background: '#f8fafc' }}
                      autoFocus
                      required 
                    />
                  )}
                </div>
              </div>

              {/* Chọn Hạng Mục Tiêu Chuẩn Công Việc Xây Dựng (Admin quản lý) */}
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Hạng mục công việc:</span>
                  <span style={{ color: '#16a34a', fontSize: '0.74rem', fontWeight: 600 }}>⚡ {activeWorks.length} hạng mục tiêu chuẩn</span>
                </label>
                <select 
                  className="form-select" 
                  value={selectedWorkGroup} 
                  onChange={(e) => handleWorkGroupChange(e.target.value)}
                  style={{ background: '#f0fdf4', borderColor: '#86efac', fontWeight: 600 }}
                >
                  {activeWorks.map((w, idx) => (
                    <option key={w.id || idx} value={w.name}>
                      Mục {w.stt || idx + 1}: {w.name} ({w.standards?.length || 0} tiêu chuẩn đi kèm)
                    </option>
                  ))}
                  <option value="__CUSTOM_WORK__">-- Nhập công tác ngoài danh mục --</option>
                </select>
              </div>

              {/* Công tác xây dựng yêu cầu nghiệm thu chi tiết */}
              <div className="form-group">
                <label className="form-label">Nội dung chi tiết (*):</label>
                {availableTasks.length > 0 && selectedItem !== '__NEW_ITEM__' ? (
                  <select 
                    className="form-select" 
                    value={taskContent} 
                    onChange={(e) => {
                      handleWorkTaskSelect(e.target.value);
                    }}
                    style={{ marginBottom: '8px' }}
                  >
                    {availableTasks.map((t, idx) => (
                      <option key={idx} value={t}>{t}</option>
                    ))}
                    <option value="__custom__">-- Tự nhập nội dung khác --</option>
                  </select>
                ) : null}
                {(taskContent === '__custom__' || selectedItem === '__NEW_ITEM__' || availableTasks.length === 0) && (
                  <textarea 
                    className="form-textarea" 
                    placeholder="Nhập chi tiết công tác xây dựng cần nghiệm thu..."
                    value={customTask}
                    onChange={(e) => {
                      setCustomTask(e.target.value);
                      if (e.target.value.trim().length > 3) {
                        updateStandards(e.target.value, 'WORK');
                      }
                    }}
                    required
                  />
                )}
              </div>
            </>
          ) : (
            /* NẾU LÀ VẬT LIỆU ĐẦU VÀO - MẪU SỐ 12 (SHEET B) */
            <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
              
              {/* Row: Công trình & Hạng mục cho Vật liệu đầu vào */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Công trình / Khối nhà:</label>
                    <button
                      type="button"
                      onClick={() => setIsAddingBuilding(!isAddingBuilding)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#059669',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: 0
                      }}
                    >
                      <Plus size={13} />
                      <span>{isAddingBuilding ? 'Hủy thêm' : 'Thêm công trình'}</span>
                    </button>
                  </div>
                  <select 
                    className="form-select" 
                    value={selectedBuilding} 
                    onChange={(e) => handleBuildingChange(e.target.value)}
                  >
                    {buildingsList.map(b => (
                      <option key={b.id || b.name} value={b.name}>{b.name}</option>
                    ))}
                    <option value="__NEW_BUILDING__">➕ -- Thêm công trình / tòa nhà mới --</option>
                  </select>

                  {isAddingBuilding && (
                    <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Nhập tên công trình mới..."
                        value={newBuildingInput}
                        onChange={(e) => setNewBuildingInput(e.target.value)}
                        style={{ flex: 1, borderColor: '#059669', background: '#f8fafc' }}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ padding: '0 12px', fontSize: '0.8rem', whiteSpace: 'nowrap', background: '#059669' }}
                        onClick={handleAddNewBuilding}
                      >
                        Lưu
                      </button>
                    </div>
                  )}
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Hạng mục công trình (*):</span>
                    {selectedItem === '__NEW_ITEM__' && (
                      <span style={{ color: '#059669', fontSize: '0.74rem', fontWeight: 700 }}>
                        ✨ Thêm mới
                      </span>
                    )}
                  </label>
                  <select 
                    className="form-select" 
                    value={selectedItem} 
                    onChange={(e) => handleItemChange(e.target.value)}
                  >
                    {buildingItems.map(it => (
                      <option key={it.id || it.name} value={it.name}>{it.name}</option>
                    ))}
                    <option value="__NEW_ITEM__">➕ -- Thêm hạng mục mới --</option>
                  </select>
                  {selectedItem === '__NEW_ITEM__' && (
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Nhập tên hạng mục mới (VD: Phần hoàn thiện, Xây tô, Thi công M&E...)" 
                      value={customItemInput} 
                      onChange={(e) => setCustomItemInput(e.target.value)} 
                      style={{ marginTop: '8px', borderColor: '#059669', background: '#f8fafc' }}
                      autoFocus
                      required 
                    />
                  )}
                </div>
              </div>

              {/* BẢNG DANH SÁCH VẬT LIỆU ĐẦU VÀO ĐƯỢC CHỌN NHIỀU */}
              <div style={{
                background: '#ffffff',
                border: '1.5px solid #a7f3d0',
                borderRadius: '10px',
                padding: '12px 14px',
                marginBottom: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Package size={18} color="#059669" />
                    <strong style={{ fontSize: '0.94rem', color: '#065f46' }}>
                      Bảng Danh Sách Vật Liệu Đầu Vào ({materialsList.length} loại)
                    </strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 600 }}>Thêm nhanh từ {activeMaterials.length} hạng mục vật liệu:</span>
                    <select 
                      className="form-select" 
                      value={selectedMaterialGroup} 
                      onChange={(e) => handleSelectMaterialGroupForAdd(e.target.value)}
                      style={{ padding: '4px 8px', fontSize: '0.8rem', fontWeight: 600, color: '#065f46', background: '#f0fdf4', borderColor: '#86efac', maxWidth: '240px' }}
                      title={`Chọn nhanh từ danh mục ${activeMaterials.length} loại vật liệu tiêu chuẩn`}
                    >
                      <option value="">+ Chọn hạng mục vật liệu...</option>
                      {activeMaterials.map((m, idx) => (
                        <option key={m.id || idx} value={m.name}>
                          Mục {m.stt || idx + 1}: {m.name} ({m.standards?.length || 0} tiêu chuẩn đi kèm)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', color: '#334155', borderBottom: '1.5px solid #cbd5e1' }}>
                        <th style={{ padding: '8px 6px', textAlign: 'center', width: '34px' }}>#</th>
                        <th style={{ padding: '8px 8px', textAlign: 'left', minWidth: '170px' }}>Tên / Chủng loại vật liệu (*)</th>
                        <th style={{ padding: '8px 8px', textAlign: 'left', minWidth: '140px' }}>Xuất xứ / Nhà máy (*)</th>
                        <th style={{ padding: '8px 6px', textAlign: 'center', width: '70px' }}>ĐVT (*)</th>
                        <th style={{ padding: '8px 8px', textAlign: 'right', width: '85px' }}>K.Lượng (*)</th>
                        <th style={{ padding: '8px 8px', textAlign: 'left', minWidth: '125px' }}>Số CCXX / CO-CQ</th>
                        <th style={{ padding: '8px 6px', textAlign: 'center', width: '38px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {materialsList.map((mat, idx) => (
                        <tr key={mat.id || idx} style={{ borderBottom: idx < materialsList.length - 1 ? '1px solid #e2e8f0' : 'none', background: idx % 2 === 0 ? '#ffffff' : '#fcfdfd' }}>
                          <td style={{ padding: '6px', textAlign: 'center', color: '#059669', fontWeight: 700 }}>
                            {idx + 1}
                          </td>
                          <td style={{ padding: '6px 8px' }}>
                            <input 
                              type="text" 
                              className="form-input" 
                              style={{ padding: '5px 8px', fontSize: '0.84rem', width: '100%' }}
                              value={mat.name} 
                              onChange={(e) => handleUpdateMaterial(idx, 'name', e.target.value)} 
                              placeholder="VD: Xi măng PCB 40, Gạch 600x600..."
                              required 
                            />
                          </td>
                          <td style={{ padding: '6px 8px' }}>
                            <input 
                              type="text" 
                              className="form-input" 
                              style={{ padding: '5px 8px', fontSize: '0.84rem', width: '100%' }}
                              value={mat.origin} 
                              onChange={(e) => handleUpdateMaterial(idx, 'origin', e.target.value)} 
                              placeholder="VD: Kiên Lương, Kiên Giang..."
                              required 
                            />
                          </td>
                          <td style={{ padding: '6px 6px' }}>
                            <input 
                              type="text" 
                              className="form-input" 
                              style={{ padding: '5px 6px', fontSize: '0.84rem', width: '100%', textAlign: 'center' }}
                              value={mat.unit} 
                              onChange={(e) => handleUpdateMaterial(idx, 'unit', e.target.value)} 
                              placeholder="tấn, m2..."
                              required 
                            />
                          </td>
                          <td style={{ padding: '6px 8px' }}>
                            <input 
                              type="text" 
                              className="form-input" 
                              style={{ padding: '5px 8px', fontSize: '0.84rem', width: '100%', textAlign: 'right', fontWeight: 600 }}
                              value={mat.quantity} 
                              onChange={(e) => handleUpdateMaterial(idx, 'quantity', e.target.value)} 
                              placeholder="50, 500..."
                              required 
                            />
                          </td>
                          <td style={{ padding: '6px 8px' }}>
                            <input 
                              type="text" 
                              className="form-input" 
                              style={{ padding: '5px 8px', fontSize: '0.84rem', width: '100%' }}
                              value={mat.certificateNumber} 
                              onChange={(e) => handleUpdateMaterial(idx, 'certificateNumber', e.target.value)} 
                              placeholder="CCXX-2026/01..."
                            />
                          </td>
                          <td style={{ padding: '6px', textAlign: 'center' }}>
                            {materialsList.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveMaterial(idx)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#ef4444',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  borderRadius: '4px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                title="Xóa dòng vật liệu này"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleAddMaterial}
                    style={{
                      background: '#ffffff',
                      border: '1.5px dashed #059669',
                      color: '#065f46',
                      borderRadius: '8px',
                      padding: '6px 14px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Plus size={15} />
                    <span>+ Thêm Dòng Vật Liệu Khác</span>
                  </button>
                  <span style={{ fontSize: '0.76rem', color: '#64748b', fontStyle: 'italic' }}>
                    ✓ Bạn có thể thêm nhiều vật liệu cùng đợt nghiệm thu (sẽ hiển thị dạng bảng trong biên bản)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Thời gian nghiệm thu: Chỉ hiển thị Giờ bắt đầu, Ngày thực hiện, Tại địa điểm (Giờ kết thúc tự động = Giờ bắt đầu + 30p, chỉ hiển thị ở biên bản nghiệm thu) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px', marginBottom: '18px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Giờ bắt đầu:</label>
              <input 
                type="time" 
                className="form-input" 
                value={startTime} 
                onChange={(e) => setStartTime(e.target.value)} 
                title="Giờ bắt đầu nghiệm thu"
                required 
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Ngày thực hiện:</label>
              <input 
                type="date" 
                className="form-input" 
                value={scheduledDate} 
                onChange={(e) => setScheduledDate(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Tại địa điểm:</label>
              <input 
                type="text" 
                className="form-input" 
                value={inspectionPlace} 
                onChange={(e) => setInspectionPlace(e.target.value)} 
              />
            </div>
          </div>

          {/* KHU VỰC TIÊU CHUẨN ĐỘNG THEO FILE EXCEL */}
          <div style={{
            background: '#fffbeb',
            border: '1.5px solid #fde68a',
            borderRadius: '12px',
            padding: '14px 16px',
            marginBottom: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <FileSpreadsheet size={18} color="#b45309" />
              <strong style={{ fontSize: '0.92rem', color: '#92400e' }}>
                Tiêu Chuẩn & Quy Chuẩn Áp Dụng
              </strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '180px', overflowY: 'auto', background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #fef08a' }}>
              {suggestedStandardsList.map((std, idx) => {
                const isChecked = selectedStandards.includes(std);
                return (
                  <label key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.82rem', cursor: 'pointer', lineHeight: 1.4 }}>
                    <input 
                      type="checkbox" 
                      checked={isChecked} 
                      onChange={() => toggleApplicableStandard(std)}
                      style={{ marginTop: '2px', cursor: 'pointer' }}
                    />
                    <span style={{ color: isChecked ? '#1e293b' : '#64748b' }}>
                      <strong style={{ color: isChecked ? '#b91c1c' : '#94a3b8' }}>{std.split(' ')[0]} {std.split(' ')[1]}</strong> {std.split(' ').slice(2).join(' ')}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* KHU VỰC ẢNH CHỤP HIỆN TRƯỜNG THI CÔNG (MỚI) */}
          <div style={{ 
            background: '#f8fafc', 
            border: '1.5px solid #e2e8f0', 
            borderRadius: '12px', 
            padding: '16px', 
            marginBottom: '18px' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={18} color="#2563eb" />
                <div>
                  <strong style={{ fontSize: '0.95rem', color: '#1e293b' }}>
                    Ảnh Chụp Hiện Trường Thi Công ({evidencePhotos.length} ảnh)
                  </strong>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {/* Inputs ẩn */}
                <input 
                  ref={cameraInputRef} 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  style={{ display: 'none' }} 
                  onChange={handlePhotoUpload} 
                />
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  style={{ display: 'none' }} 
                  onChange={handlePhotoUpload} 
                />
                <button 
                  type="button" 
                  className="btn-primary" 
                  style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#2563eb' }}
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera size={14} />
                  <span>Chụp ảnh</span>
                </button>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus size={14} />
                  <span>Tải ảnh lên</span>
                </button>
              </div>
            </div>

            {/* Danh sách ảnh */}
            {evidencePhotos.length === 0 ? (
              <div style={{ 
                border: '2px dashed #cbd5e1', 
                borderRadius: '10px', 
                padding: '24px 16px', 
                textAlign: 'center', 
                background: '#ffffff' 
              }}>
                <Camera size={32} color="#94a3b8" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#475569' }}>
                  Chưa có ảnh thi công nào được đính kèm
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
                  Bấm <strong>Chụp ảnh</strong> (trên điện thoại/tablet) hoặc <strong>Tải ảnh lên</strong> từ thiết bị để đính kèm minh chứng cho TVGS & CĐT
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                {evidencePhotos.map((photo, index) => (
                  <div 
                    key={photo.id || index}
                    style={{ 
                      background: '#ffffff', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '10px', 
                      overflow: 'hidden',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                      position: 'relative'
                    }}
                  >
                    <div style={{ position: 'relative' }}>
                      <img 
                        src={photo.url} 
                        alt={photo.caption} 
                        style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }}
                      />
                      <span style={{ 
                        position: 'absolute', 
                        top: '6px', 
                        left: '6px', 
                        background: '#2563eb', 
                        color: '#ffffff', 
                        fontSize: '0.7rem', 
                        fontWeight: 800, 
                        padding: '2px 6px', 
                        borderRadius: '4px' 
                      }}>
                        #{index + 1}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => handleDeletePhoto(photo.id)}
                        style={{ 
                          position: 'absolute', 
                          top: '6px', 
                          right: '6px', 
                          background: 'rgba(239, 68, 68, 0.9)', 
                          color: '#ffffff', 
                          border: 'none', 
                          borderRadius: '6px', 
                          width: '24px', 
                          height: '24px', 
                          cursor: 'pointer',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center' 
                        }}
                        title="Xóa ảnh"
                      >
                        <Trash2 size={13} />
                      </button>
                      <div style={{ 
                        position: 'absolute', 
                        bottom: '4px', 
                        left: '4px', 
                        right: '4px', 
                        background: 'rgba(15, 23, 42, 0.88)', 
                        backdropFilter: 'blur(3px)', 
                        color: '#ffffff', 
                        padding: '4px 6px', 
                        borderRadius: '4px', 
                        fontSize: '0.68rem',
                        lineHeight: 1.3
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <MapPin size={10} color="#60a5fa" />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{photo.gps}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '1px' }}>
                          <Clock size={10} color="#34d399" />
                          <span>{photo.time}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: '8px' }}>
                      <input 
                        type="text" 
                        value={photo.caption} 
                        onChange={(e) => handleUpdatePhotoCaption(photo.id, e.target.value)}
                        placeholder="Nhập chú thích ảnh..."
                        style={{ 
                          width: '100%', 
                          fontSize: '0.78rem', 
                          border: '1px solid #cbd5e1', 
                          borderRadius: '6px', 
                          padding: '4px 8px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* KHU VỰC CHỌN NGƯỜI NHẬN (TVGS & CĐT) */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Users size={18} color="#2563eb" />
              <strong style={{ fontSize: '0.95rem', color: '#1e293b' }}>
                Chỉ định Cán bộ Nhận Thư Mời Nghiệm Thu
              </strong>
            </div>

            {/* NHÓM 1: TƯ VẤN GIÁM SÁT */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#047857', textTransform: 'uppercase' }}>
                  1. Cán bộ Tư Vấn Giám Sát:
                </span>
              </div>

              <div className="recipients-selection-grid">
                {supervisorList.map(u => {
                  const isSelected = selectedSupervisor === u.uid;
                  return (
                    <div 
                      key={u.uid}
                      className={`recipient-checkbox-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedSupervisor(u.uid)}
                      style={{ cursor: 'pointer' }}
                    >
                      <input 
                        type="radio" 
                        name="selectedSupervisorRadio"
                        value={u.uid}
                        checked={isSelected} 
                        onChange={() => setSelectedSupervisor(u.uid)} 
                        onClick={(e) => e.stopPropagation()}
                        style={{ cursor: 'pointer' }}
                      />
                      <div className="avatar-circle" style={{ width: '30px', height: '30px', fontSize: '0.75rem', background: '#059669' }}>
                        {u.avatar}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{u.fullName}</span>
                          {u.role === 'LEAD_SUPERVISOR' && (
                            <span style={{ fontSize: '0.68rem', background: '#dcfce7', color: '#15803d', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                              Trưởng TVGS
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{u.position} • {u.phone}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* NHÓM 2: ĐẠI DIỆN CHỦ ĐẦU TƯ */}
            <div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#b45309', textTransform: 'uppercase' }}>
                  2. Đại Diện Chủ Đầu Tư:
                </span>
              </div>

              <div className="recipients-selection-grid">
                {investorList.map(u => {
                  const isSelected = selectedInvestor === u.uid;
                  return (
                    <div 
                      key={u.uid}
                      className={`recipient-checkbox-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedInvestor(u.uid)}
                      style={{ cursor: 'pointer' }}
                    >
                      <input 
                        type="radio" 
                        name="selectedInvestorRadio"
                        value={u.uid}
                        checked={isSelected} 
                        onChange={() => setSelectedInvestor(u.uid)} 
                        onClick={(e) => e.stopPropagation()}
                        style={{ cursor: 'pointer' }}
                      />
                      <div className="avatar-circle" style={{ width: '30px', height: '30px', fontSize: '0.75rem', background: '#d97706' }}>
                        {u.avatar}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{u.fullName}</span>
                          {u.role === 'LEAD_INVESTOR' && (
                            <span style={{ fontSize: '0.68rem', background: '#fef3c7', color: '#b45309', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                              Trưởng CĐT
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{u.position} • {u.phone}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="modal-footer" style={{ margin: '20px -24px -24px -24px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Hủy bỏ
            </button>
            <button type="submit" className="btn-primary" style={{ background: '#059669' }}>
              <Send size={16} />
              <span>Gửi Phiếu Yêu Cầu & Biên Bản Nghiệm Thu</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
