import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X, Send, Users, Calendar, MapPin, CheckSquare, Square,
  AlertCircle, Building, Camera, ImagePlus, Zap, Trash2, Plus, Clock,
  FileSpreadsheet, Package, Hash, ChevronRight, Check, Layers, Building2
} from 'lucide-react';
import { MOCK_PROJECT, MOCK_USERS } from '../data/mockData';
import { compressImageFile } from '../utils/storageHelper';
import {
  CONSTRUCTION_WORK_STANDARDS,
  MATERIAL_STANDARDS,
  GENERAL_MANDATORY_STANDARDS,
  getSuggestedStandards
} from '../data/standardsRules';
import {
  loadStoredProjects,
  loadStoredDocTypes,
  generateDocumentCode
} from '../data/projectCatalog';

export default function CreateRequestModal({
  isOpen,
  onClose,
  users = [],
  currentUser,
  onSubmitRequest,
  showAlert,
  standardsData,
  projects: catalogProjects = null,
  docTypes: catalogDocTypes = null
}) {
  if (!isOpen) return null;

  const activeWorks = (standardsData?.works && standardsData.works.length > 0) ? standardsData.works : CONSTRUCTION_WORK_STANDARDS;
  const activeMaterials = (standardsData?.materials && standardsData.materials.length > 0) ? standardsData.materials : MATERIAL_STANDARDS;
  const activeMandatory = (standardsData?.mandatory && standardsData.mandatory.length > 0) ? standardsData.mandatory : GENERAL_MANDATORY_STANDARDS;

  // Lọc danh sách cán bộ tiếp nhận nghiệm thu:
  // QUY TẮC NGHIỆP VỤ: KHÔNG hiển thị các anh Trưởng (TVGS Trưởng, Trưởng Ban QLDA) để chọn.
  // Chỉ hiển thị các cán bộ cấp dưới trực tiếp nghiệm thu tại hiện trường.
  // Các anh Trưởng sẽ tự động theo dõi / quản lý hồ sơ của cấp dưới mình.
  const supervisorList = useMemo(() => {
    return (users || []).filter(u => {
      if (u.status === 'INACTIVE') return false;
      const roleStr = (u.role || '').toUpperCase();
      if (roleStr !== 'SUPERVISOR') return false;
      if (roleStr === 'LEAD_SUPERVISOR' || Boolean(u.isLead)) return false;
      const pos = (u.position || '').toLowerCase();
      if (pos.includes('trưởng') || pos.includes('chỉ huy') || pos.includes('giám đốc')) return false;
      if (pos.includes('thi công') || pos.includes('nhà thầu') || pos.includes('quản lý dự án') || pos.includes('ban qlda')) return false;
      const comp = (u.company || '').toLowerCase();
      if (comp.includes('an phú gia') || comp.includes('bình hoà') || comp.includes('gia huy') || comp.includes('an phú cần thơ')) return false;
      return true;
    });
  }, [users]);

  const investorList = useMemo(() => {
    return (users || []).filter(u => {
      if (u.status === 'INACTIVE') return false;
      const roleStr = (u.role || '').toUpperCase();
      if (roleStr !== 'INVESTOR') return false;
      if (roleStr === 'LEAD_INVESTOR' || Boolean(u.isLead)) return false;
      const pos = (u.position || '').toLowerCase();
      if (pos.includes('trưởng') || pos.includes('giám đốc') || pos.includes('chỉ huy')) return false;
      if (pos.includes('tư vấn') || pos.includes('giám sát') || pos.includes('thi công')) return false;
      const comp = (u.company || '').toLowerCase();
      if (comp.includes('gelicon') || comp.includes('an phú gia') || comp.includes('bình hoà') || comp.includes('gia huy')) return false;
      return true;
    });
  }, [users]);

  // Danh sách công trình & loại phiếu từ catalog
  const projectsList = useMemo(() => {
    return (catalogProjects && catalogProjects.length > 0) ? catalogProjects : loadStoredProjects();
  }, [catalogProjects]);

  const docTypesList = useMemo(() => {
    return (catalogDocTypes && catalogDocTypes.length > 0) ? catalogDocTypes : loadStoredDocTypes();
  }, [catalogDocTypes]);

  // -------------------------------------------------------------
  // LOẠI HÌNH NGHIỆM THU: 'WORK' (Công việc xây dựng) | 'MATERIAL' (Vật liệu đầu vào)
  // -------------------------------------------------------------
  const [inspectionType, setInspectionType] = useState('WORK');

  // Ngày thực hiện
  const [scheduledDate, setScheduledDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Số lần sửa / gửi lại yêu cầu (bắt đầu từ 1 -> 01)
  const [revisionNumber, setRevisionNumber] = useState(1);

  // -------------------------------------------------------------
  // BẬC 1: CHỌN CÔNG TRÌNH (VÍ DỤ: 2203, 2204)
  // -------------------------------------------------------------
  const [selectedProjectCode, setSelectedProjectCode] = useState(() => {
    return projectsList[0]?.code || '2203';
  });

  const currentProject = useMemo(() => {
    return projectsList.find(p => p.code === selectedProjectCode) || projectsList[0];
  }, [projectsList, selectedProjectCode]);

  // -------------------------------------------------------------
  // BẬC 2: CHỌN CÔNG TY TRONG CÔNG TRÌNH ĐÓ
  // -------------------------------------------------------------
  const availableContractors = useMemo(() => {
    return currentProject?.contractors || [];
  }, [currentProject]);

  const [selectedContractorName, setSelectedContractorName] = useState(() => {
    return availableContractors[0]?.name || 'Công ty TNHH Gia Huy Vĩnh Phúc';
  });

  // Tự động đồng bộ contractor khi đổi công trình
  useEffect(() => {
    if (availableContractors.length > 0) {
      const exists = availableContractors.some(c => c.name === selectedContractorName);
      if (!exists) {
        setSelectedContractorName(availableContractors[0].name);
      }
    }
  }, [availableContractors, selectedContractorName]);

  const currentContractor = useMemo(() => {
    return availableContractors.find(c => c.name === selectedContractorName) || availableContractors[0];
  }, [availableContractors, selectedContractorName]);

  // -------------------------------------------------------------
  // BẬC 3: CHỌN HẠNG MỤC (GÓI THẦU) CÓ TRONG CÔNG TY ĐÓ
  // -------------------------------------------------------------
  const availablePackages = useMemo(() => {
    return currentContractor?.packages || [];
  }, [currentContractor]);

  const [selectedPackageName, setSelectedPackageName] = useState(() => {
    return availablePackages[0]?.name || 'Thi công phần hoàn thiện Tòa A và Tòa B';
  });

  useEffect(() => {
    if (availablePackages.length > 0) {
      const exists = availablePackages.some(p => p.name === selectedPackageName);
      if (!exists) {
        setSelectedPackageName(availablePackages[0].name);
      }
    } else {
      setSelectedPackageName('Thi công hoàn thiện');
    }
  }, [availablePackages, selectedPackageName]);

  const currentPackage = useMemo(() => {
    return availablePackages.find(p => p.name === selectedPackageName) || availablePackages[0];
  }, [availablePackages, selectedPackageName]);

  // -------------------------------------------------------------
  // BẬC 4: CHỌN HẠNG MỤC CÔNG VIỆC CỦA HẠNG MỤC ĐƯỢC CHỌN
  // -------------------------------------------------------------
  const availableTasks = useMemo(() => {
    return currentPackage?.tasks || [];
  }, [currentPackage]);

  const [selectedTaskName, setSelectedTaskName] = useState(() => {
    return availableTasks[0] || 'Cốt thép, ván khuôn, bê tông';
  });
  const [customTaskInput, setCustomTaskInput] = useState('');

  useEffect(() => {
    if (availableTasks.length > 0) {
      const exists = availableTasks.includes(selectedTaskName);
      if (!exists && selectedTaskName !== '__CUSTOM_TASK__') {
        setSelectedTaskName(availableTasks[0]);
      }
    }
  }, [availableTasks, selectedTaskName]);

  // -------------------------------------------------------------
  // BẬC 5: CÁC QUY CHUẨN LẤY THEO HẠNG MỤC CÔNG VIỆC
  // -------------------------------------------------------------
  const activeTaskForStandards = selectedTaskName === '__CUSTOM_TASK__' ? customTaskInput : selectedTaskName;

  const [suggestedStandardsList, setSuggestedStandardsList] = useState(() => {
    return getSuggestedStandards(activeTaskForStandards || 'Cốt thép, ván khuôn, bê tông', 'WORK', activeWorks, activeMaterials, activeMandatory);
  });
  const [selectedStandards, setSelectedStandards] = useState(() => {
    return getSuggestedStandards(activeTaskForStandards || 'Cốt thép, ván khuôn, bê tông', 'WORK', activeWorks, activeMaterials, activeMandatory);
  });

  const updateStandards = (query, type) => {
    const suggested = getSuggestedStandards(query, type, activeWorks, activeMaterials, activeMandatory);
    setSuggestedStandardsList(suggested);
    setSelectedStandards(suggested);
  };

  // Cập nhật tiêu chuẩn khi công việc thay đổi
  useEffect(() => {
    if (inspectionType === 'WORK') {
      const query = selectedTaskName === '__CUSTOM_TASK__' ? customTaskInput : selectedTaskName;
      if (query && query.trim()) {
        updateStandards(query, 'WORK');
      }
    }
  }, [selectedTaskName, customTaskInput, inspectionType]);

  // -------------------------------------------------------------
  // MÃ HẠNG MỤC CÔNG TRÌNH (PHIẾU YÊU CẦU NGHIỆM THU LUÔN LÀ IR):
  // Định dạng: [Mã công trình]/IR/[ngày tháng năm ddmmyy]-01.01
  // Ví dụ: 2203/IR/231026-01.01
  // -------------------------------------------------------------
  const currentDocTypeCode = 'IR';

  const autoGeneratedCategoryCode = useMemo(() => {
    return generateDocumentCode(selectedProjectCode, 'IR', scheduledDate, 1);
  }, [selectedProjectCode, scheduledDate]);

  const effectiveCategoryCode = autoGeneratedCategoryCode;
  const requestNumber = 'IR';

  // Vật liệu đầu vào (nếu chọn MATERIAL)
  const [materialsList, setMaterialsList] = useState([
    {
      id: 'mat_1',
      name: '',
      origin: '',
      unit: '',
      quantity: '',
      certificateNumber: ''
    }
  ]);

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

  const handleInspectionTypeChange = (type) => {
    setInspectionType(type);
    if (type === 'MATERIAL') {
      refreshStandardsForMaterials(materialsList);
    } else {
      const currentTask = selectedTaskName === '__CUSTOM_TASK__' ? customTaskInput : selectedTaskName;
      updateStandards(currentTask, 'WORK');
    }
  };

  const toggleApplicableStandard = (std) => {
    setSelectedStandards(prev =>
      prev.includes(std) ? prev.filter(s => s !== std) : [...prev, std]
    );
  };

  // Giờ bắt đầu & kết thúc
  const [startTime, setStartTime] = useState('08:30');
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

  const [inspectionPlace, setInspectionPlace] = useState(
    () => currentProject?.location || 'Phường Thường Thạnh - Quận Cái Răng - TP. Cần Thơ'
  );

  useEffect(() => {
    if (currentProject?.location) {
      setInspectionPlace(currentProject.location);
    }
  }, [currentProject]);

  // Ảnh hiện trường đính kèm
  const [evidencePhotos, setEvidencePhotos] = useState([]);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handlePhotoCapture = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    for (const file of files) {
      const compressedUrl = await compressImageFile(file);
      if (!compressedUrl) continue;
      const now = new Date();
      const timeStr = `${now.toLocaleTimeString('vi-VN')} ngày ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
      setEvidencePhotos(prev => [
        ...prev,
        {
          id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          url: compressedUrl,
          caption: file.name ? file.name.replace(/\.[^/.]+$/, '') : 'Hiện trường trước nghiệm thu',
          gps: '10.0076° N, 105.7823° E (P. Thường Thạnh, Cần Thơ)',
          time: timeStr
        }
      ]);
    }
    e.target.value = '';
  };

  const handleDeletePhoto = (photoId) => {
    setEvidencePhotos(prev => prev.filter(p => p.id !== photoId));
  };

  const handleUpdatePhotoCaption = (photoId, caption) => {
    setEvidencePhotos(prev => prev.map(p => p.id === photoId ? { ...p, caption } : p));
  };

  // Chọn cán bộ TVGS và CĐT (chỉ chọn cán bộ cấp dưới trực tiếp nghiệm thu, không chọn các anh Trưởng)
  const [selectedSupervisor, setSelectedSupervisor] = useState('');
  const [selectedInvestor, setSelectedInvestor] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedSupervisor('');
      setSelectedInvestor('');
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedSupervisor) {
      if (showAlert) {
        showAlert({
          type: 'warning',
          title: 'Chưa Chọn Cán Bộ TVGS',
          message: 'Vui lòng chọn 1 cán bộ Tư Vấn Giám Sát trực tiếp tiếp nhận nghiệm thu!'
        });
      } else {
        alert('Vui lòng chọn 1 cán bộ TVGS trực tiếp tiếp nhận nghiệm thu!');
      }
      return;
    }

    const materialNamesStr = materialsList.map(m => m.name.trim()).filter(Boolean).join(', ');

    const finalTask = inspectionType === 'MATERIAL'
      ? `Nghiệm thu vật liệu đầu vào: ${materialNamesStr || 'Vật tư thi công'}`
      : (selectedTaskName === '__CUSTOM_TASK__' ? customTaskInput.trim() : selectedTaskName);

    if (!finalTask) {
      if (showAlert) {
        showAlert({
          type: 'warning',
          title: 'Thiếu Hạng Mục Công Việc',
          message: 'Vui lòng chọn hoặc nhập hạng mục công việc nghiệm thu!'
        });
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
        }
        return;
      }
    }

    const leadSupervisorUser = (users || []).find(u => u.role === 'LEAD_SUPERVISOR' || (u.role === 'SUPERVISOR' && (u.position || '').toLowerCase().includes('trưởng')));
    const leadInvestorUser = (users || []).find(u => u.role === 'LEAD_INVESTOR' || (u.role === 'INVESTOR' && (u.position || '').toLowerCase().includes('trưởng')));

    const selectedUids = [selectedSupervisor, selectedInvestor].filter(Boolean);
    const assignedRecipients = selectedUids.map(uid => {
      const u = users.find(x => x.uid === uid);
      const isSup = u?.role === 'SUPERVISOR' || supervisorList.some(s => s.uid === uid);
      const defaultLeaderId = isSup ? (leadSupervisorUser?.uid || 'uid_tvgs_01') : (leadInvestorUser?.uid || 'uid_cdt_01');
      return {
        uid: u?.uid || uid,
        fullName: u?.fullName || 'Cán bộ tiếp nhận',
        role: u?.role || (isSup ? 'SUPERVISOR' : 'INVESTOR'),
        leaderId: u?.leaderId || defaultLeaderId,
        company: u?.company || (isSup ? 'Công ty CP Tư vấn Xây dựng và Thương mại GELICON' : 'Công ty TNHH An Phú Cần Thơ'),
        position: u?.position || (isSup ? 'Cán bộ tư vấn giám sát' : 'Cán bộ ban QLDA'),
        email: u?.email || '',
        receivedAt: new Date().toISOString()
      };
    });

    const calculatedEndTime = calculateEndTime(startTime, 30);
    const dateFormatted = scheduledDate.split('-').reverse().join('/');
    const formattedStartTime = `${startTime.replace(':', 'h')}, ngày ${dateFormatted}`;
    const formattedEndTime = `${calculatedEndTime.replace(':', 'h')}, ngày ${dateFormatted}`;

    const newRequest = {
      id: `req_${Date.now()}`,
      requestNumber: 'IR',
      // Mã hạng mục công trình / Số tài liệu căn cứ chuẩn theo yêu cầu:
      projectCategoryCode: effectiveCategoryCode,
      referenceDocNumber: effectiveCategoryCode,
      revisionNumber: 1,
      // Cấu trúc phân cấp Công trình -> Công ty -> Hạng mục -> Công việc:
      projectId: currentProject?.id || 'proj_2203',
      projectCode: currentProject?.code || selectedProjectCode,
      projectName: currentProject?.projectName || 'Đầu tư xây dựng nhà ở Phường Thường Thạnh - An Phú Eco City',
      buildingName: currentProject?.name || 'Chung cư nhà ở xã hội 2',
      contractorCompany: selectedContractorName,
      packageName: selectedPackageName,
      itemName: selectedPackageName,
      location: currentProject?.location || inspectionPlace,
      createdByUid: currentUser?.uid || 'uid_dvtc_ghvp_01',
      createdByName: currentUser?.fullName || 'Trần Mạnh Hưng',
      createdByRole: currentUser?.position || 'Chỉ huy trưởng',
      taskContent: finalTask,
      startTime: formattedStartTime,
      endTime: formattedEndTime,
      scheduledTime: `${startTime} ${dateFormatted}`,
      inspectionPlace,
      status: 'SENT',
      createdAt: new Date().toISOString(),
      hasReport: true,
      reportId: null,
      assignedRecipients,
      evidencePhotos,
      inspectionType, // 'WORK' | 'MATERIAL'
      docTypeCode: currentDocTypeCode,
      reportDocTypeCode: inspectionType === 'MATERIAL' ? 'MI' : 'WA',
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
      <div className="modal-content" style={{ maxWidth: '880px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>

        {/* HEADER */}
        <div className="modal-header" style={{ background: '#f8fafc', padding: '16px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#eff6ff', padding: '8px', borderRadius: '10px', color: '#2563eb' }}>
              <Send size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Lập Phiếu Yêu Cầu Nghiệm Thu</h3>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body" style={{ padding: '20px 24px', overflowY: 'auto' }}>

          {/* TAB CHỌN LOẠI HÌNH NGHIỆM THU */}
          <div style={{
            display: 'flex',
            background: '#f1f5f9',
            padding: '4px',
            borderRadius: '12px',
            gap: '6px',
            marginBottom: '18px'
          }}>
            <button
              type="button"
              onClick={() => handleInspectionTypeChange('WORK')}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                border: 'none',
                background: inspectionType === 'WORK' ? '#2563eb' : 'transparent',
                color: inspectionType === 'WORK' ? '#ffffff' : '#475569',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              <Package size={17} />
              <span>1. Nghiệm Thu Công Việc Xây Dựng</span>
            </button>

            <button
              type="button"
              onClick={() => handleInspectionTypeChange('MATERIAL')}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                border: 'none',
                background: inspectionType === 'MATERIAL' ? '#059669' : 'transparent',
                color: inspectionType === 'MATERIAL' ? '#ffffff' : '#475569',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              <FileSpreadsheet size={17} />
              <span>2. Nghiệm Thu Vật Liệu Đầu Vào</span>
            </button>
          </div>

          {/* BANNER HIỂN THỊ MÃ HẠNG MỤC CÔNG TRÌNH */}
          <div style={{
            background: '#f8fafc',
            border: '1.5px solid #e2e8f0',
            borderRadius: '10px',
            padding: '12px 18px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Hash size={18} color="#2563eb" />
              <span style={{ fontWeight: 700, color: '#1e3a8a', fontSize: '0.92rem' }}>
                Mã Hạng Mục Công Trình:
              </span>
            </div>

            <div style={{
              fontFamily: 'monospace',
              fontWeight: 800,
              fontSize: '1.15rem',
              color: '#0f172a',
              background: '#ffffff',
              padding: '6px 14px',
              borderRadius: '6px',
              border: '1.5px solid #cbd5e1',
              letterSpacing: '0.04em'
            }}>
              {effectiveCategoryCode}
            </div>
          </div>

          {/* NGÀY THỰC HIỆN KIỂM TRA */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ fontWeight: 600, color: '#334155' }}>
              Ngày thực hiện kiểm tra: <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="date"
              className="form-input"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              required
              style={{ maxWidth: '320px' }}
            />
          </div>

          {/* ============================================================== */}
          {/* QUY TRÌNH PHÂN CẤP THEO ẢNH:                                    */}
          {/* Chọn Công Trình -> Chọn Công Ty -> Chọn Hạng Mục -> Chọn Công Việc */}
          {/* ============================================================== */}
          <div style={{
            background: '#f8fafc',
            border: '1.5px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px 18px',
            marginBottom: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#1e3a8a' }}>
              <Layers size={18} />
              <strong style={{ fontSize: '0.95rem' }}>Phân Cấp Hạng Mục Thi Công Theo Thực Tế:</strong>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>

              {/* BƯỚC 1: CHỌN CÔNG TRÌNH */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700, color: '#0f172a' }}>
                  1. Chọn Công trình:
                </label>
                <select
                  className="form-select"
                  value={selectedProjectCode}
                  onChange={(e) => setSelectedProjectCode(e.target.value)}
                  style={{ fontWeight: 700, borderColor: '#3b82f6', background: '#eff6ff' }}
                >
                  {projectsList.map(p => (
                    <option key={p.id || p.code} value={p.code}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* BƯỚC 2: CHỌN CÔNG TY THUỘC CÔNG TRÌNH */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700, color: '#0f172a' }}>
                  2. Chọn Công ty (Đơn vị thi công):
                </label>
                <select
                  className="form-select"
                  value={selectedContractorName}
                  onChange={(e) => setSelectedContractorName(e.target.value)}
                  style={{ fontWeight: 600, borderColor: '#3b82f6' }}
                >
                  {availableContractors.map((c, i) => (
                    <option key={c.id || i} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* BƯỚC 3: CHỌN HẠNG MỤC (GÓI THẦU) TRONG CÔNG TY ĐÓ */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700, color: '#0f172a' }}>
                  3. Chọn Hạng mục (Gói thầu):
                </label>
                <select
                  className="form-select"
                  value={selectedPackageName}
                  onChange={(e) => setSelectedPackageName(e.target.value)}
                  style={{ fontWeight: 600, borderColor: '#3b82f6' }}
                >
                  {availablePackages.map((pkg, i) => (
                    <option key={pkg.id || i} value={pkg.name}>
                      {pkg.name}
                    </option>
                  ))}
                  <option value="__CUSTOM_PKG__">➕ -- Hạng mục / Gói thầu khác --</option>
                </select>
              </div>

              {/* BƯỚC 4: CHỌN HẠNG MỤC CÔNG VIỆC CỦA HẠNG MỤC ĐƯỢC CHỌN */}
              {inspectionType === 'WORK' && (
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700, color: '#0f172a' }}>
                    4. Chọn Hạng mục công việc:
                  </label>
                  <select
                    className="form-select"
                    value={selectedTaskName}
                    onChange={(e) => setSelectedTaskName(e.target.value)}
                    style={{ fontWeight: 600, borderColor: '#16a34a', background: '#f0fdf4' }}
                  >
                    {availableTasks.map((task, i) => (
                      <option key={i} value={task}>
                        {task}
                      </option>
                    ))}
                    <option value="__CUSTOM_TASK__">✏️ -- Tự nhập hạng mục công việc khác --</option>
                  </select>
                </div>
              )}
            </div>

            {/* NẾU TỰ NHẬP HẠNG MỤC CÔNG VIỆC */}
            {inspectionType === 'WORK' && selectedTaskName === '__CUSTOM_TASK__' && (
              <div style={{ marginTop: '12px' }}>
                <label className="form-label">Nhập chi tiết hạng mục công việc:</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: Lắp đặt đường ống thoát nước tầng 5 trục A-C..."
                  value={customTaskInput}
                  onChange={(e) => setCustomTaskInput(e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          {/* NẾU LÀ VẬT LIỆU ĐẦU VÀO - MẪU SỐ 12 (MI) */}
          {inspectionType === 'MATERIAL' && (
            <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '12px', padding: '16px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <strong style={{ color: '#166534', fontSize: '0.95rem' }}>
                  Danh Mục Vật Liệu, Thiết Bị, Sản Phẩm Chế Tạo Sẵn (Mẫu số 12):
                </strong>
                <button
                  type="button"
                  onClick={handleAddMaterial}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={14} /> Thêm Dòng Vật Liệu
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {materialsList.map((mat, idx) => (
                  <div key={mat.id || idx} style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr)) 40px', gap: '8px', alignItems: 'center' }}>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          Chủng loại vật liệu: <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          value={mat.name}
                          onChange={(e) => handleUpdateMaterial(idx, 'name', e.target.value)}
                          placeholder="Tên vật liệu..."
                          required
                          style={{ padding: '6px 8px', fontSize: '0.82rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          Xuất xứ: <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          value={mat.origin}
                          onChange={(e) => handleUpdateMaterial(idx, 'origin', e.target.value)}
                          placeholder="Nơi sản xuất..."
                          required
                          style={{ padding: '6px 8px', fontSize: '0.82rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          Đơn vị tính: <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          value={mat.unit}
                          onChange={(e) => handleUpdateMaterial(idx, 'unit', e.target.value)}
                          placeholder="m2, tấn, cái..."
                          required
                          style={{ padding: '6px 8px', fontSize: '0.82rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          Khối lượng: <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          value={mat.quantity}
                          onChange={(e) => handleUpdateMaterial(idx, 'quantity', e.target.value)}
                          placeholder="Số lượng..."
                          required
                          style={{ padding: '6px 8px', fontSize: '0.82rem' }}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                        {materialsList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMaterial(idx)}
                            style={{ background: '#fee2e2', border: 'none', color: '#b91c1c', borderRadius: '6px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Xóa dòng"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BƯỚC 5: TIÊU CHUẨN NGHIỆM THU TỰ ĐỘNG THEO HẠNG MỤC CÔNG VIỆC */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a', fontWeight: 700, fontSize: '0.92rem' }}>
                <CheckSquare size={18} color="#16a34a" />
                <span>5. Quy Chuẩn & Tiêu Chuẩn Áp Dụng:</span>
              </div>
              <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 600 }}>
                ✓ {selectedStandards.length} tiêu chuẩn được áp dụng
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
              {suggestedStandardsList.map((std, idx) => {
                const isChecked = selectedStandards.includes(std);
                return (
                  <div
                    key={idx}
                    onClick={() => toggleApplicableStandard(std)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      background: isChecked ? '#f0fdf4' : '#ffffff',
                      border: isChecked ? '1px solid #86efac' : '1px solid #e2e8f0',
                      cursor: 'pointer',
                      fontSize: '0.82rem'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleApplicableStandard(std)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span style={{ color: isChecked ? '#166534' : '#475569', fontWeight: isChecked ? 600 : 400 }}>
                      + {std}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* THỜI GIAN & ĐỊA ĐIỂM NGHIỆM THU */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '18px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Thời gian bắt đầu:</label>
              <input
                type="time"
                className="form-input"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Địa điểm kiểm tra:</label>
              <input
                type="text"
                className="form-input"
                value={inspectionPlace}
                onChange={(e) => setInspectionPlace(e.target.value)}
                required
              />
            </div>
          </div>

          {/* ĐÍNH KÈM ẢNH HIỆN TRƯỜNG */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={18} color="#2563eb" />
                <strong style={{ fontSize: '0.92rem' }}>Đính Kèm Ảnh Hiện Trường (GPS & Thời Gian):</strong>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="file"
                  ref={cameraInputRef}
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoCapture}
                  style={{ display: 'none' }}
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  multiple
                  onChange={handlePhotoCapture}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  style={{ padding: '6px 10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Camera size={13} /> Chụp ảnh
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ padding: '6px 10px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <ImagePlus size={13} /> Chọn từ máy
                </button>
              </div>
            </div>

            {evidencePhotos.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                {evidencePhotos.map((p, i) => (
                  <div key={p.id || i} style={{ position: 'relative', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                    <img src={p.url} alt={p.caption} style={{ width: '100%', height: '110px', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(p.id)}
                      style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(239, 68, 68, 0.9)', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 5px', cursor: 'pointer' }}
                    >
                      <Trash2 size={12} />
                    </button>
                    <input
                      type="text"
                      value={p.caption}
                      onChange={(e) => handleUpdatePhotoCaption(p.id, e.target.value)}
                      style={{ width: '100%', fontSize: '0.75rem', padding: '4px 6px', border: 'none', borderTop: '1px solid #e2e8f0' }}
                      placeholder="Chú thích ảnh..."
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CHỈ ĐỊNH CÁN BỘ TIẾP NHẬN (TVGS & CĐT) */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="#2563eb" />
                <strong style={{ fontSize: '0.92rem', color: '#1e293b' }}>
                  Chỉ Định Cán Bộ Tiếp Nhận Nghiệm Thu:
                </strong>
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '3px', paddingLeft: '26px' }}>
                * Chỉ chọn cán bộ kỹ thuật trực tiếp nghiệm thu hiện trường. Các anh Trưởng bộ phận (TVGS Trưởng, Trưởng Ban QLDA) sẽ tự động theo dõi và duyệt hồ sơ của cấp dưới.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#047857', margin: 0 }}>
                    1. CÁN BỘ TƯ VẤN GIÁM SÁT: <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>({supervisorList.length} cán bộ trực tiếp)</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                  {supervisorList.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', padding: '10px', background: '#fff', borderRadius: '6px', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                      Chưa có cán bộ TVGS trực tiếp khả dụng
                    </div>
                  ) : (
                    supervisorList.map(u => (
                      <label
                        key={u.uid}
                        onClick={() => setSelectedSupervisor(u.uid)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', background: selectedSupervisor === u.uid ? '#ecfdf5' : '#fff', border: selectedSupervisor === u.uid ? '1.5px solid #10b981' : '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem', transition: 'all 0.15s ease' }}
                      >
                        <input
                          type="radio"
                          name="selectedSup"
                          checked={selectedSupervisor === u.uid}
                          onChange={() => setSelectedSupervisor(u.uid)}
                        />
                        <div>
                          <strong>{u.fullName}</strong> - {u.position}
                          {u.company ? <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{u.company}</div> : null}
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#b45309', margin: 0 }}>
                    2. CÁN BỘ BAN QLDA:
                  </label>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>(Tùy chọn • Nhấn lại để bỏ chọn)</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                  {investorList.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', padding: '10px', background: '#fff', borderRadius: '6px', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                      Chưa có cán bộ Ban QLDA trực tiếp khả dụng
                    </div>
                  ) : (
                    investorList.map(u => (
                      <label
                        key={u.uid}
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedInvestor(prev => prev === u.uid ? '' : u.uid);
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', background: selectedInvestor === u.uid ? '#fffbeb' : '#fff', border: selectedInvestor === u.uid ? '1.5px solid #f59e0b' : '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem', transition: 'all 0.15s ease' }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedInvestor === u.uid}
                          onChange={() => { }}
                        />
                        <div>
                          <strong>{u.fullName}</strong> - {u.position}
                          {u.company ? <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{u.company}</div> : null}
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="modal-footer" style={{ margin: '20px -24px -24px -24px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Hủy bỏ
            </button>
            <button type="submit" className="btn-primary" style={{ background: '#059669' }}>
              <Send size={16} />
              <span>Gửi Phiếu Yêu Cầu & Khởi Tạo Biên Bản</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
