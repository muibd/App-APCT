import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  X, NotebookPen, Sun, CloudRain, Users, Wrench, ShieldCheck, 
  Calendar, Camera, Trash2, Plus, Clock, Check, Sparkles, Eye
} from 'lucide-react';
import { MOCK_PROJECT, MOCK_USERS, getContractorChief } from '../data/mockData';
import { compressImageFile } from '../utils/storageHelper';

const STORAGE_CUSTOM_BUILDING_ITEMS_KEY = 'apct_building_custom_items_v2';

const DEFAULT_BUILDING_ITEMS_MAP = {
  'Chung cư nhà ở xã hội 2': [
    'Thi công phần kết cấu – Tòa A và Tòa B (Gói thầu số 02)',
    'Thi công phần móng và hầm (Gói thầu số 01)',
    'Thi công phần hoàn thiện Tòa A và Tòa B',
    'Thi công hệ thống Mep Tòa A và Tòa B',
    'Cung cấp, lắp đặt cửa gỗ',
    'Cung cấp, lắp đặt cửa thép chống cháy',
    'Cung cấp, lắp đặt cửa nhôm kính',
    'Thi công hệ thống PCCC trong và ngoài nhà'
  ],
  'Chung cư nhà ở cao tầng': [
    'Thi công phần kết cấu – Khối cao tầng',
    'Thi công phần móng và cọc khoan nhồi',
    'Thi công hệ thống Mep',
    'Thi công hệ thống PCCC trong và ngoài nhà',
    'Thi công hoàn thiện kiến trúc'
  ]
};

function loadCustomBuildingItems() {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_BUILDING_ITEMS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (e) {
    console.warn('Lỗi đọc custom building items:', e);
  }
  return {};
}

function saveCustomBuildingItems(map) {
  try {
    localStorage.setItem(STORAGE_CUSTOM_BUILDING_ITEMS_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('Lỗi lưu custom building items:', e);
  }
}

export default function CreateDailyLogModal({
  isOpen,
  onClose,
  users = [],
  currentUser,
  projects = [],
  onSaveProjects,
  onSubmitDailyLog,
  showAlert
}) {
  if (!isOpen) return null;

  // Danh sách các cán bộ kỹ thuật của ĐVTC trên app (trừ người tạo hiện tại)
  // Danh sách cán bộ TVGS trên app
  const allSupervisors = (users && users.length > 0 ? users : MOCK_USERS).filter(
    u => u.role === 'SUPERVISOR' || u.role === 'LEAD_SUPERVISOR'
  );

  const [selectedSupervisorUid, setSelectedSupervisorUid] = useState(() => {
    return allSupervisors[0]?.uid || 'uid_tvgs_01';
  });

  useEffect(() => {
    if (!selectedSupervisorUid && allSupervisors.length > 0) {
      setSelectedSupervisorUid(allSupervisors[0].uid);
    }
  }, [users]);

  const otherContractors = users.filter(
    u => u.role === 'CONTRACTOR' && u.uid !== currentUser?.uid
  );

  // Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const [logDate, setLogDate] = useState(todayStr);
  const [logNumber, setLogNumber] = useState(() => {
    const randomNum = Math.floor(Math.random() * 80) + 10;
    return `${randomNum}/NKTC`;
  });
  const [bookNumber, setBookNumber] = useState('Quyển số: 01/2026');
  const [contractorCompany, setContractorCompany] = useState(() => currentUser?.company || 'Công ty TNHH Gia Huy Vĩnh Phúc');

  useEffect(() => {
    if (currentUser?.company) {
      setContractorCompany(currentUser.company);
    }
  }, [currentUser?.company]);

  const availableContractorCompanies = Array.from(new Set([
    'Công ty TNHH Gia Huy Vĩnh Phúc',
    'Công ty TNHH Phát Triển Xây Dựng Phan Lê',
    'Công ty TNHH Tư vấn Thiết kế Bình Hoà',
    ...(users || []).filter(u => u.role === 'CONTRACTOR').map(u => u.company).filter(Boolean),
    currentUser?.company
  ].filter(Boolean)));

  // Danh sách Công trình / Khối nhà
  const buildingOptions = useMemo(() => {
    if (projects && projects.length > 0) {
      return projects.map(p => ({
        id: p.id || p.code,
        name: p.name,
        code: p.code,
        projectName: p.projectName || MOCK_PROJECT.projectName,
        location: p.location || 'Phường Thường Thạnh, Q. Cái Răng, TP. Cần Thơ',
        investor: p.investor || 'Công ty TNHH An Phú Cần Thơ',
        supervisor: p.supervisor || 'Công ty CP TVXD & TM Gelicon'
      }));
    }
    return MOCK_PROJECT.buildings.map(b => ({
      id: b.id || b.name,
      name: b.name,
      code: b.code,
      projectName: MOCK_PROJECT.projectName,
      location: 'Phường Thường Thạnh, Q. Cái Răng, TP. Cần Thơ',
      investor: 'Công ty TNHH An Phú Cần Thơ',
      supervisor: 'Công ty CP TVXD & TM Gelicon'
    }));
  }, [projects]);

  // Thông tin công trình được chọn
  const [selectedBuilding, setSelectedBuilding] = useState(() => {
    if (projects && projects.length > 0 && projects[0]?.name) {
      return projects[0].name;
    }
    return MOCK_PROJECT.buildings[0]?.name || 'Chung cư nhà ở xã hội 2';
  });

  const selectedBuildingObj = useMemo(() => {
    return buildingOptions.find(b => b.name === selectedBuilding) || buildingOptions[0];
  }, [buildingOptions, selectedBuilding]);

  // Custom items map lưu theo công trình (tự động load từ localStorage)
  const [customItemsMap, setCustomItemsMap] = useState(loadCustomBuildingItems);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  // Danh sách hạng mục gắn đi kèm với công trình hiện tại
  const currentBuildingItems = useMemo(() => {
    const project = (projects || []).find(p => p.name === selectedBuilding);
    const projectPackages = project?.contractors?.flatMap(c => (c.packages || []).map(pkg => pkg.name)) || [];
    
    const mockBld = MOCK_PROJECT.buildings.find(b => b.name === selectedBuilding);
    const mockItems = mockBld?.items?.map(it => it.name) || [];

    const defaultItems = DEFAULT_BUILDING_ITEMS_MAP[selectedBuilding] || [];
    const customItems = customItemsMap[selectedBuilding] || [];

    const combined = Array.from(new Set([
      ...customItems,
      ...defaultItems,
      ...projectPackages,
      ...mockItems
    ])).filter(Boolean);

    return combined.length > 0 ? combined : [
      'Thi công phần kết cấu',
      'Thi công phần hoàn thiện',
      'Thi công hệ thống M&E'
    ];
  }, [selectedBuilding, projects, customItemsMap]);

  // Hạng mục được chọn
  const [selectedItem, setSelectedItem] = useState(() => {
    const defaultItems = DEFAULT_BUILDING_ITEMS_MAP['Chung cư nhà ở xã hội 2'] || [];
    return defaultItems[0] || 'Thi công phần kết cấu – Tòa A và Tòa B (Gói thầu số 02)';
  });

  // Khi đổi công trình -> Cập nhật hạng mục tương ứng của công trình đó
  const handleBuildingChange = (newBuilding) => {
    setSelectedBuilding(newBuilding);
    const customItems = customItemsMap[newBuilding] || [];
    const defaultItems = DEFAULT_BUILDING_ITEMS_MAP[newBuilding] || [];
    const project = (projects || []).find(p => p.name === newBuilding);
    const projectPackages = project?.contractors?.flatMap(c => (c.packages || []).map(pkg => pkg.name)) || [];
    const mockBld = MOCK_PROJECT.buildings.find(b => b.name === newBuilding);
    const mockItems = mockBld?.items?.map(it => it.name) || [];
    const list = Array.from(new Set([...customItems, ...defaultItems, ...projectPackages, ...mockItems])).filter(Boolean);
    if (list.length > 0) {
      setSelectedItem(list[0]);
    }
    setIsAddingItem(false);
  };

  // Thêm mới hạng mục và gắn đi kèm với công trình vĩnh viễn
  const handleAddNewItem = () => {
    const trimmed = newItemName.trim();
    if (!trimmed) {
      if (showAlert) {
        showAlert({
          type: 'warning',
          title: 'Thiếu Tên Hạng Mục',
          message: 'Vui lòng nhập tên hạng mục, gói thầu mới!'
        });
      } else {
        alert('Vui lòng nhập tên hạng mục, gói thầu mới!');
      }
      return;
    }

    // 1. Lưu vào customItemsMap gắn theo công trình được chọn
    setCustomItemsMap(prev => {
      const existing = prev[selectedBuilding] || [];
      if (existing.includes(trimmed)) return prev;
      const updated = {
        ...prev,
        [selectedBuilding]: [trimmed, ...existing]
      };
      saveCustomBuildingItems(updated);
      return updated;
    });

    // 2. Cập nhật projects catalog nếu có
    if (onSaveProjects && projects && projects.length > 0) {
      const updatedProjects = projects.map(p => {
        if (p.name === selectedBuilding) {
          const firstContractor = p.contractors?.[0];
          if (firstContractor) {
            const hasPkg = firstContractor.packages?.some(pkg => pkg.name === trimmed);
            if (!hasPkg) {
              const newPkg = {
                id: `pkg_custom_${Date.now()}`,
                name: trimmed,
                tasks: ['Nghiệm thu công việc', 'Kiểm tra chất lượng']
              };
              const updatedContractors = p.contractors.map((c, idx) => {
                if (idx === 0) {
                  return {
                    ...c,
                    packages: [newPkg, ...(c.packages || [])]
                  };
                }
                return c;
              });
              return { ...p, contractors: updatedContractors };
            }
          }
        }
        return p;
      });
      onSaveProjects(updatedProjects);
    }

    // 3. Tự động chọn hạng mục mới vừa thêm
    setSelectedItem(trimmed);
    setNewItemName('');
    setIsAddingItem(false);

    if (showAlert) {
      showAlert({
        type: 'success',
        title: 'Đã Thêm Hạng Mục',
        message: `Đã thêm hạng mục mới và gắn liền với công trình "${selectedBuilding}"!`
      });
    }
  };

  // 1. THỜI TIẾT (3 khung giờ: Sáng 7h-11h, Chiều 13h-15h, Tối 18h-24h + chọn Nắng / Mưa)
  const [morningWeather, setMorningWeather] = useState('NẮNG');
  const [afternoonWeather, setAfternoonWeather] = useState('NẮNG');
  const [eveningWeather, setEveningWeather] = useState('TẠNH RÁO');
  const [weatherNote, setWeatherNote] = useState('');

  // 2. TÌNH HÌNH NHÂN LỰC, THIẾT BỊ THI CÔNG
  // 2.1. Nhân lực:
  // - Kỹ thuật: là người tạo (currentUser)
  // - Công nhân: người tạo nhập
  // - Nhân lực khác: chọn các kỹ thuật có trên app
  const [workersCount, setWorkersCount] = useState('35');
  const [workersDetail, setWorkersDetail] = useState('Đội coffa: 15 người, Đội sắt: 12 người, Đội đổ bê tông: 8 người');
  const [selectedOtherPersonnel, setSelectedOtherPersonnel] = useState([]);

  // 2.2. Thiết bị thi công (để trống, bắt buộc điền)
  const [equipment, setEquipment] = useState('');

  // 3. NỘI DUNG CÔNG VIỆC THỰC HIỆN (để trống, bắt buộc điền)
  const [workContent, setWorkContent] = useState('');

  // 4. TÌNH HÌNH CÔNG TÁC ATLĐ VỆ SINH MÔI TRƯỜNG
  const [safetyStatus, setSafetyStatus] = useState('Bình thường'); // 'Bình thường' | 'Tốt' | 'Có nhắc nhở'
  const [safetyNotes, setSafetyNotes] = useState(
    'Trang bị đầy đủ mũ BHLĐ, áo phản quang, dây an toàn làm việc trên cao; Mặt bằng thi công được thu dọn gọn gàng, có rào chắn bảo vệ an toàn mép sàn.'
  );

  // Ảnh hiện trường đính kèm
  const [evidencePhotos, setEvidencePhotos] = useState([]);
  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Toggle chọn nhân lực khác
  const toggleOtherPersonnel = (user) => {
    setSelectedOtherPersonnel(prev => {
      const exists = prev.some(p => p.uid === user.uid);
      if (exists) {
        return prev.filter(p => p.uid !== user.uid);
      } else {
        return [
          ...prev, 
          { 
            uid: user.uid, 
            name: user.fullName, 
            position: user.position || 'Kỹ thuật hiện trường',
            company: user.company || 'Công ty TNHH Gia Huy Vĩnh Phúc'
          }
        ];
      }
    });
  };

  // Upload ảnh hiện trường
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
        caption: file.name ? `Ảnh nhật ký: ${file.name.replace(/\.[^/.]+$/, '')}` : 'Hiện trường thi công thực tế trong ngày',
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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!equipment.trim()) {
      if (showAlert) {
        showAlert({
          type: 'warning',
          title: 'Thiếu Thiết Bị Thi Công',
          message: 'Vui lòng nhập danh sách thiết bị thi công trên công trường!'
        });
      } else {
        alert('Vui lòng nhập danh sách thiết bị thi công trên công trường!');
      }
      return;
    }

    if (!workContent.trim()) {
      if (showAlert) {
        showAlert({
          type: 'warning',
          title: 'Thiếu Nội Dung Công Việc',
          message: 'Vui lòng nhập tóm tắt nội dung công việc thực hiện trong ngày!'
        });
      } else {
        alert('Vui lòng nhập nội dung công việc thực hiện trong ngày!');
      }
      return;
    }

    const selectedSupervisorUser = allSupervisors.find(u => u.uid === selectedSupervisorUid) || allSupervisors[0];

    if (!selectedSupervisorUser) {
      if (showAlert) {
        showAlert({
          type: 'warning',
          title: 'Chưa Chọn TVGS',
          message: 'Vui lòng chọn Cán bộ Tư Vấn Giám Sát xác nhận!'
        });
      } else {
        alert('Vui lòng chọn Cán bộ Tư Vấn Giám Sát xác nhận!');
      }
      return;
    }

    const dateParts = logDate.split('-');
    const cityDateFormatted = `Cần Thơ, Ngày ${dateParts[2]} tháng ${dateParts[1]} năm ${dateParts[0]}`;

    // Tạo bản ghi Nhật Ký Thi Công chuẩn theo Template 1. Nhat ky thi cong.doc
    const newDailyLog = {
      id: `log_${Date.now()}`,
      logNumber,
      bookNumber,
      date: logDate,
      cityDateFormatted,

      // Thông tin chung (tự fill theo công trình được chọn)
      projectName: selectedBuildingObj?.projectName || MOCK_PROJECT.projectName,
      buildingName: selectedBuilding,
      itemName: selectedItem,
      location: selectedBuildingObj?.location || 'Phường Cái Răng - TP. Cần Thơ',
      investorName: selectedBuildingObj?.investor || 'Công ty TNHH An Phú Cần Thơ',
      supervisorName: selectedBuildingObj?.supervisor || 'Công ty CP Tư vấn xây dựng và Thương mại Gelicon',
      contractorName: contractorCompany.trim() || currentUser?.company || 'Công ty TNHH Gia Huy Vĩnh Phúc',
      supervisorUid: selectedSupervisorUser?.uid,
      supervisorFullName: selectedSupervisorUser?.fullName,
      assignedSupervisor: {
        uid: selectedSupervisorUser?.uid,
        name: selectedSupervisorUser?.fullName,
        position: selectedSupervisorUser?.position || 'Cán bộ TVGS',
        company: selectedSupervisorUser?.company || 'Công ty CP Tư vấn xây dựng và Thương mại Gelicon',
        phone: selectedSupervisorUser?.phone || '',
        avatar: selectedSupervisorUser?.avatar || 'GS'
      },

      // Đại diện các bên theo file .doc
      representatives: {
        investor: {
          representative: 'Ngô Quý Linh',
          position: 'Trưởng Ban QLDA'
        },
        supervisor: {
          representative: selectedSupervisorUser ? selectedSupervisorUser.fullName : 'Đinh Xuân Thám',
          position: selectedSupervisorUser ? (selectedSupervisorUser.position || (selectedSupervisorUser.role === 'LEAD_SUPERVISOR' ? 'Tư vấn giám sát trưởng' : 'Cán bộ TVGS')) : 'Tư vấn giám sát trưởng',
          officer: selectedSupervisorUser ? selectedSupervisorUser.fullName : 'Đỗ Văn Trường',
          officerPosition: selectedSupervisorUser ? (selectedSupervisorUser.position || 'Cán bộ TVGS') : 'Cán bộ TVGS',
          uid: selectedSupervisorUser?.uid,
          phone: selectedSupervisorUser?.phone
        },
        contractor: {
          company: contractorCompany.trim() || currentUser?.company || 'Công ty TNHH Gia Huy Vĩnh Phúc',
          leader: getContractorChief(contractorCompany.trim() || currentUser?.company, users).fullName,
          leaderPosition: 'Chỉ huy trưởng công trường',
          createdBy: currentUser?.fullName || 'KS. Lê Văn Kỹ Thuật',
          createdPosition: currentUser?.position || 'Cán bộ KT thi công'
        }
      },

      // 1. THỜI TIẾT
      weather: {
        morning: morningWeather,
        morningHours: '7h - 11h',
        afternoon: afternoonWeather,
        afternoonHours: '13h - 15h',
        evening: eveningWeather,
        eveningHours: '18h - 24h',
        note: weatherNote.trim()
      },

      // 2. NHÂN LỰC, THIẾT BỊ
      manpower: {
        technical: `${currentUser?.fullName || 'KS. Lê Văn Kỹ Thuật'} (${currentUser?.position || 'Cán bộ KT thi công'})`,
        workers: `${workersCount} công nhân${workersDetail ? ` (${workersDetail})` : ''}`,
        otherPersonnel: selectedOtherPersonnel
      },
      equipment: equipment.trim(),

      // 3. NỘI DUNG CÔNG VIỆC THỰC HIỆN
      workContent: workContent.trim(),

      // 4. ATLĐ & VSMT
      safetyEnvironment: {
        status: safetyStatus,
        notes: safetyNotes.trim()
      },

      // ẢNH HIỆN TRƯỜNG
      evidencePhotos: evidencePhotos,

      // MỤC 5, 6, 7 (Sẽ được TVGS điền và CĐT tự động xác nhận theo khi duyệt)
      supervisorComments: '',
      investorComments: '',
      contractorComments: '',

      // TRẠNG THÁI & CHỮ KÝ
      status: 'SUBMITTED', // 'SUBMITTED' (Chờ TVGS xác nhận) | 'CONFIRMED' (Đã xác nhận 3 bên)
      signatures: {
        contractor: {
          signed: true,
          name: currentUser?.fullName || 'KS. Lê Văn Kỹ Thuật',
          position: currentUser?.position || 'Cán bộ KT thi công',
          signedAt: new Date().toISOString()
        },
        supervisor: {
          signed: false,
          name: null,
          position: null,
          signedAt: null
        },
        investor: {
          signed: false,
          name: null,
          position: null,
          signedAt: null
        }
      },

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdByUid: currentUser?.uid || 'uid_dvtc_01',
      createdByName: currentUser?.fullName || 'KS. Lê Văn Kỹ Thuật',
      contractorCompany: contractorCompany.trim() || currentUser?.company || 'Công ty TNHH Gia Huy Vĩnh Phúc'
    };

    onSubmitDailyLog(newDailyLog);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '860px', maxHeight: '92vh' }}>
        {/* HEADER */}
        <div className="modal-header" style={{ borderBottom: '1.5px solid #e2e8f0', padding: '14px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#ecfdf5', padding: '8px', borderRadius: '10px', color: '#059669' }}>
              <NotebookPen size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.18rem', color: '#0f172a' }}>
                Lập Nhật Ký Thi Công Xây Dựng
              </h3>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Theo mẫu chuẩn Template: 1. Nhat ky thi cong.doc (Nghị định 06/2021/NĐ-CP)
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {/* BODY */}
        <form onSubmit={handleSubmit} className="modal-body" style={{ padding: '18px 20px' }}>
          
          {/* PHẦN THÔNG TIN CHUNG (TỰ ĐỘNG FILL THEO TEMPLATE .DOC) */}
          <div style={{
            background: '#f8fafc',
            border: '1.5px solid #e2e8f0',
            borderRadius: '12px',
            padding: '14px 16px',
            marginBottom: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                📋 NHỮNG THÔNG TIN CHUNG (Tự Động Điền)
              </span>
              <span style={{ fontSize: '0.78rem', background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                {bookNumber}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '10px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Mã số nhật ký / Ngày:</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={logNumber} 
                    onChange={(e) => setLogNumber(e.target.value)} 
                    style={{ flex: 1, fontWeight: 700, color: '#0f172a' }}
                    required 
                  />
                  <input 
                    type="date" 
                    className="form-input" 
                    value={logDate} 
                    onChange={(e) => setLogDate(e.target.value)} 
                    style={{ width: '145px', fontWeight: 600 }}
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Đơn vị thi công (ĐVTC):</span>
                  <span style={{ fontSize: '0.7rem', color: '#2563eb' }}>✏️ Có thể sửa</span>
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  list="daily-contractor-companies"
                  value={contractorCompany} 
                  onChange={(e) => setContractorCompany(e.target.value)} 
                  placeholder="Nhập tên Đơn vị thi công..."
                  required 
                  style={{ fontWeight: 600, color: '#0f172a' }}
                />
                <datalist id="daily-contractor-companies">
                  {availableContractorCompanies.map((c, i) => (
                    <option key={i} value={c} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Công trình / Khối nhà:</label>
                <select 
                  className="form-select" 
                  value={selectedBuilding} 
                  onChange={(e) => handleBuildingChange(e.target.value)}
                  style={{ fontWeight: 600, color: '#0f172a' }}
                >
                  {buildingOptions.map(b => (
                    <option key={b.id || b.name} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', margin: 0 }}>
                    Hạng mục, gói thầu:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingItem(!isAddingItem);
                      setNewItemName('');
                    }}
                    style={{
                      background: isAddingItem ? '#fee2e2' : '#eff6ff',
                      color: isAddingItem ? '#b91c1c' : '#2563eb',
                      border: isAddingItem ? '1px solid #fca5a5' : '1px solid #bfdbfe',
                      borderRadius: '6px',
                      padding: '2px 8px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Thêm mới hạng mục và gắn đi kèm với công trình này"
                  >
                    {isAddingItem ? <X size={12} /> : <Plus size={12} />}
                    <span>{isAddingItem ? 'Hủy' : '+ Thêm mới'}</span>
                  </button>
                </div>

                {isAddingItem && (
                  <div style={{
                    marginBottom: '8px',
                    padding: '8px 10px',
                    background: '#f0fdf4',
                    border: '1.5px solid #86efac',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 600, marginBottom: '4px' }}>
                      Thêm hạng mục mới vào &quot;{selectedBuilding}&quot;:
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Nhập tên hạng mục, gói thầu mới..."
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddNewItem();
                          }
                        }}
                        style={{ flex: 1, fontSize: '0.82rem', padding: '5px 8px' }}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={handleAddNewItem}
                        style={{
                          background: '#16a34a',
                          borderColor: '#16a34a',
                          padding: '5px 12px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        ✓ Lưu & Gắn
                      </button>
                    </div>
                  </div>
                )}

                <select 
                  className="form-select" 
                  value={selectedItem} 
                  onChange={(e) => {
                    if (e.target.value === '__ADD_NEW__') {
                      setIsAddingItem(true);
                    } else {
                      setSelectedItem(e.target.value);
                    }
                  }}
                  style={{ fontWeight: 500 }}
                >
                  {currentBuildingItems.map((item, idx) => (
                    <option key={idx} value={item}>{item}</option>
                  ))}
                  <option value="__ADD_NEW__" style={{ color: '#2563eb', fontWeight: 600 }}>
                    + Thêm hạng mục, gói thầu mới cho công trình này...
                  </option>
                </select>
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: '#475569', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '6px', paddingTop: '8px', borderTop: '1px dashed #cbd5e1' }}>
              <div>🏢 <strong>Dự án:</strong> {selectedBuildingObj?.projectName || MOCK_PROJECT.projectName}</div>
              <div>📍 <strong>Địa điểm:</strong> {selectedBuildingObj?.location || 'Phường Thường Thạnh, Q. Cái Răng, TP. Cần Thơ'}</div>
              <div>🏗️ <strong>ĐVTC:</strong> <span style={{ color: '#1d4ed8', fontWeight: 600 }}>{contractorCompany || 'Công ty TNHH Gia Huy Vĩnh Phúc'}</span></div>
              <div>👁️ <strong>TVGS:</strong> {selectedBuildingObj?.supervisor || 'Công ty CP TVXD & TM Gelicon'}</div>
            </div>
          </div>

          {/* MỤC 1. THỜI TIẾT (3 KHUNG GIỜ: SÁNG, CHIỀU, TỐI + NẮNG / MƯA) */}
          <div style={{
            background: '#fffbeb',
            border: '1.5px solid #fde68a',
            borderRadius: '12px',
            padding: '14px 16px',
            marginBottom: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sun size={18} color="#d97706" />
                <strong style={{ fontSize: '0.94rem', color: '#92400e' }}>
                  1. THỜI TIẾT TRONG NGÀY
                </strong>
              </div>
              <span style={{ fontSize: '0.78rem', color: '#b45309', fontStyle: 'italic' }}>
                * Chọn tình trạng thời tiết cho 3 khung giờ
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              {/* SÁNG: 7h - 11h */}
              <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '10px', border: '1px solid #fef08a' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Clock size={14} color="#d97706" />
                  <span>Sáng (7h00 - 11h00):</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setMorningWeather('NẮNG')}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1.5px solid',
                      borderColor: morningWeather === 'NẮNG' ? '#f59e0b' : '#e2e8f0',
                      background: morningWeather === 'NẮNG' ? '#fef3c7' : '#ffffff',
                      color: morningWeather === 'NẮNG' ? '#b45309' : '#64748b',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px'
                    }}
                  >
                    <Sun size={15} color={morningWeather === 'NẮNG' ? '#d97706' : '#94a3b8'} />
                    <span>Nắng</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMorningWeather('MƯA')}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1.5px solid',
                      borderColor: morningWeather === 'MƯA' ? '#3b82f6' : '#e2e8f0',
                      background: morningWeather === 'MƯA' ? '#eff6ff' : '#ffffff',
                      color: morningWeather === 'MƯA' ? '#1d4ed8' : '#64748b',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px'
                    }}
                  >
                    <CloudRain size={15} color={morningWeather === 'MƯA' ? '#2563eb' : '#94a3b8'} />
                    <span>Mưa</span>
                  </button>
                </div>
              </div>

              {/* CHIỀU: 13h - 15h */}
              <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '10px', border: '1px solid #fef08a' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Clock size={14} color="#d97706" />
                  <span>Chiều (13h00 - 15h00):</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setAfternoonWeather('NẮNG')}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1.5px solid',
                      borderColor: afternoonWeather === 'NẮNG' ? '#f59e0b' : '#e2e8f0',
                      background: afternoonWeather === 'NẮNG' ? '#fef3c7' : '#ffffff',
                      color: afternoonWeather === 'NẮNG' ? '#b45309' : '#64748b',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px'
                    }}
                  >
                    <Sun size={15} color={afternoonWeather === 'NẮNG' ? '#d97706' : '#94a3b8'} />
                    <span>Nắng</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAfternoonWeather('MƯA')}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1.5px solid',
                      borderColor: afternoonWeather === 'MƯA' ? '#3b82f6' : '#e2e8f0',
                      background: afternoonWeather === 'MƯA' ? '#eff6ff' : '#ffffff',
                      color: afternoonWeather === 'MƯA' ? '#1d4ed8' : '#64748b',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px'
                    }}
                  >
                    <CloudRain size={15} color={afternoonWeather === 'MƯA' ? '#2563eb' : '#94a3b8'} />
                    <span>Mưa</span>
                  </button>
                </div>
              </div>

              {/* TỐI: 18h - 24h */}
              <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '10px', border: '1px solid #fef08a' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Clock size={14} color="#d97706" />
                  <span>Tối (18h00 - 24h00):</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setEveningWeather('TẠNH RÁO')}
                    style={{
                      flex: 1,
                      padding: '8px 6px',
                      borderRadius: '8px',
                      border: '1.5px solid',
                      borderColor: eveningWeather === 'TẠNH RÁO' ? '#f59e0b' : '#e2e8f0',
                      background: eveningWeather === 'TẠNH RÁO' ? '#fef3c7' : '#ffffff',
                      color: eveningWeather === 'TẠNH RÁO' ? '#b45309' : '#64748b',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>Tạnh ráo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEveningWeather('MƯA')}
                    style={{
                      flex: 1,
                      padding: '8px 6px',
                      borderRadius: '8px',
                      border: '1.5px solid',
                      borderColor: eveningWeather === 'MƯA' ? '#3b82f6' : '#e2e8f0',
                      background: eveningWeather === 'MƯA' ? '#eff6ff' : '#ffffff',
                      color: eveningWeather === 'MƯA' ? '#1d4ed8' : '#64748b',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <CloudRain size={14} color={eveningWeather === 'MƯA' ? '#2563eb' : '#94a3b8'} />
                    <span>Mưa</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEveningWeather('KHÔNG THI CÔNG')}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      borderRadius: '8px',
                      border: '1.5px solid',
                      borderColor: eveningWeather === 'KHÔNG THI CÔNG' ? '#94a3b8' : '#e2e8f0',
                      background: eveningWeather === 'KHÔNG THI CÔNG' ? '#f1f5f9' : '#ffffff',
                      color: eveningWeather === 'KHÔNG THI CÔNG' ? '#334155' : '#64748b',
                      fontWeight: 600,
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <span>Nghỉ tối</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* MỤC 2. TÌNH HÌNH NHÂN LỰC, THIẾT BỊ THI CÔNG */}
          <div style={{
            background: '#eff6ff',
            border: '1.5px solid #bfdbfe',
            borderRadius: '12px',
            padding: '14px 16px',
            marginBottom: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Users size={18} color="#2563eb" />
              <strong style={{ fontSize: '0.94rem', color: '#1e40af' }}>
                2. TÌNH HÌNH NHÂN LỰC, THIẾT BỊ THI CÔNG
              </strong>
            </div>

            {/* 2.1. Nhân lực */}
            <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #dbeafe', marginBottom: '12px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#1e3a8a', marginBottom: '10px' }}>
                2.1. Nhân lực thi công:
              </div>

              {/* Kỹ thuật: Là người tạo */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>
                    - Kỹ thuật phụ trách chính (Người tạo):
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={`${currentUser?.fullName || 'KS. Lê Văn Kỹ Thuật'} (${currentUser?.position || 'Cán bộ kỹ thuật thi công'})`}
                    disabled 
                    readOnly 
                    style={{ background: '#f8fafc', fontWeight: 600, color: '#0f172a', borderColor: '#cbd5e1', cursor: 'not-allowed' }}
                    title="Cố định là cán bộ kỹ thuật lập nhật ký"
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>
                    - Số lượng công nhân <span style={{ color: '#ef4444' }}>*</span>:
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={workersCount} 
                    onChange={(e) => setWorkersCount(e.target.value)} 
                    placeholder="VD: 35 công nhân..."
                    required 
                  />
                </div>
              </div>

              {/* Chi tiết phân bổ công nhân */}
              <div style={{ marginBottom: '12px' }}>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>
                  Phân bổ đội thợ công nhân:
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={workersDetail} 
                  onChange={(e) => setWorkersDetail(e.target.value)} 
                  placeholder="VD: Đội coffa: 15 người, Đội sắt: 12 người, Đội đổ bê tông: 8 người..."
                />
              </div>

              {/* Nhân lực khác: Chọn các kỹ thuật có trên app */}
              <div>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                  <span>- Nhân lực kỹ thuật khác (Chọn từ danh sách cán bộ trên App):</span>
                  <span style={{ color: '#2563eb', fontWeight: 600 }}>
                    Đã chọn: {selectedOtherPersonnel.length} kỹ thuật viên
                  </span>
                </label>
                
                <div style={{
                  maxHeight: '130px',
                  overflowY: 'auto',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '8px',
                  background: '#f8fafc',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px'
                }}>
                  {otherContractors.length === 0 ? (
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Không có cán bộ kỹ thuật khác trên hệ thống.</span>
                  ) : (
                    otherContractors.map(u => {
                      const isSelected = selectedOtherPersonnel.some(p => p.uid === u.uid);
                      return (
                        <button
                          key={u.uid}
                          type="button"
                          onClick={() => toggleOtherPersonnel(u)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            border: '1.5px solid',
                            borderColor: isSelected ? '#2563eb' : '#cbd5e1',
                            background: isSelected ? '#eff6ff' : '#ffffff',
                            color: isSelected ? '#1d4ed8' : '#334155',
                            fontSize: '0.78rem',
                            fontWeight: isSelected ? 700 : 500,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {isSelected && <Check size={13} color="#2563eb" />}
                          <span>{u.fullName}</span>
                          <span style={{ fontSize: '0.7rem', color: isSelected ? '#3b82f6' : '#94a3b8' }}>
                            ({u.position || 'KT'})
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* 2.2. Thiết bị thi công */}
            <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #dbeafe' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Wrench size={15} color="#2563eb" />
                <label className="form-label" style={{ margin: 0, fontWeight: 700, fontSize: '0.86rem', color: '#1e3a8a' }}>
                  2.2. Thiết bị thi công trên công trường <span style={{ color: '#ef4444' }}>*</span>:
                </label>
              </div>
              <textarea 
                className="form-textarea" 
                rows={2}
                value={equipment} 
                onChange={(e) => setEquipment(e.target.value)} 
                placeholder="Nhập danh sách thiết bị thi công hoạt động trong ngày..."
                required 
              />
            </div>
          </div>

          {/* MỤC 3. NỘI DUNG CÔNG VIỆC THỰC HIỆN */}
          <div style={{
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '12px',
            padding: '14px 16px',
            marginBottom: '18px'
          }}>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a', marginBottom: '8px' }}>
              3. NỘI DUNG CÔNG VIỆC THỰC HIỆN TRONG NGÀY <span style={{ color: '#ef4444' }}>*</span>:
            </label>
            <textarea 
              className="form-textarea" 
              rows={3}
              value={workContent} 
              onChange={(e) => setWorkContent(e.target.value)} 
              placeholder="Ghi chi tiết vị trí, phân đoạn, các công tác thi công chính diễn ra trong ngày..."
              required 
            />
          </div>

          {/* MỤC 4. TÌNH HÌNH CÔNG TÁC ATLĐ VỆ SINH MÔI TRƯỜNG */}
          <div style={{
            background: '#f0fdf4',
            border: '1.5px solid #bbf7d0',
            borderRadius: '12px',
            padding: '14px 16px',
            marginBottom: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} color="#16a34a" />
                <strong style={{ fontSize: '0.94rem', color: '#166534' }}>
                  4. TÌNH HÌNH CÔNG TÁC ATLĐ VỆ SINH MÔI TRƯỜNG
                </strong>
              </div>
              
              <div style={{ display: 'flex', gap: '6px' }}>
                {['Bình thường', 'Tốt', 'Có nhắc nhở'].map(stt => (
                  <button
                    key={stt}
                    type="button"
                    onClick={() => setSafetyStatus(stt)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1.5px solid',
                      borderColor: safetyStatus === stt ? '#16a34a' : '#cbd5e1',
                      background: safetyStatus === stt ? '#dcfce7' : '#ffffff',
                      color: safetyStatus === stt ? '#15803d' : '#64748b',
                      fontSize: '0.78rem',
                      fontWeight: safetyStatus === stt ? 700 : 500,
                      cursor: 'pointer'
                    }}
                  >
                    {stt}
                  </button>
                ))}
              </div>
            </div>

            <textarea 
              className="form-textarea" 
              rows={2}
              value={safetyNotes} 
              onChange={(e) => setSafetyNotes(e.target.value)} 
              placeholder="Ghi nhận tình hình an toàn lao động, vệ sinh môi trường, PCCC..."
            />
          </div>

          {/* ẢNH CHỤP HIỆN TRƯỜNG ĐÍNH KÈM */}
          <div style={{ 
            background: '#f8fafc', 
            border: '1.5px solid #e2e8f0', 
            borderRadius: '12px', 
            padding: '14px 16px', 
            marginBottom: '18px' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={18} color="#2563eb" />
                <strong style={{ fontSize: '0.92rem', color: '#1e293b' }}>
                  Ảnh Hiện Trường Thi Công Trong Ngày ({evidencePhotos.length} ảnh)
                </strong>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
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
                  style={{ padding: '5px 10px', fontSize: '0.78rem', background: '#2563eb' }}
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera size={13} />
                  <span>Chụp ảnh</span>
                </button>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus size={13} />
                  <span>Chọn ảnh</span>
                </button>
              </div>
            </div>

            {evidencePhotos.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px', marginTop: '10px' }}>
                {evidencePhotos.map((photo, i) => (
                  <div key={photo.id || i} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                    <img 
                      src={photo.url} 
                      alt={photo.caption} 
                      style={{ width: '100%', height: '90px', objectFit: 'cover', display: 'block' }} 
                    />
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(photo.id)}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: 'rgba(239, 68, 68, 0.9)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '22px',
                        height: '22px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>



                    {/* MỤC 5. CÁN BỘ TƯ VẤN GIÁM SÁT TIẾP NHẬN & XÁC NHẬN */}
          <div style={{
            background: '#f0fdf4',
            border: '1.5px solid #86efac',
            borderRadius: '12px',
            padding: '14px 16px',
            marginBottom: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={18} color="#15803d" />
                <strong style={{ fontSize: '0.94rem', color: '#166534' }}>
                  5. CÁN BỘ TƯ VẤN GIÁM SÁT XÁC NHẬN <span style={{ color: '#ef4444' }}>*</span>
                </strong>
              </div>
              <span style={{ fontSize: '0.78rem', color: '#15803d', fontStyle: 'italic' }}>
                * Chọn cán bộ TVGS phụ trách tiếp nhận & ký duyệt nhật ký
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px' }}>
              {allSupervisors.map(u => {
                const isSelected = selectedSupervisorUid === u.uid;
                return (
                  <div
                    key={u.uid}
                    onClick={() => setSelectedSupervisorUid(u.uid)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1.5px solid',
                      borderColor: isSelected ? '#16a34a' : '#cbd5e1',
                      background: isSelected ? '#ffffff' : '#f8fafc',
                      boxShadow: isSelected ? '0 2px 8px rgba(22, 163, 74, 0.15)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <input
                      type="radio"
                      name="supervisorRadio"
                      checked={isSelected}
                      onChange={() => setSelectedSupervisorUid(u.uid)}
                      style={{ cursor: 'pointer', accentColor: '#16a34a' }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: '#059669',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        flexShrink: 0
                      }}
                    >
                      {u.avatar || u.fullName?.charAt(0) || 'GS'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.fullName}</span>
                        {u.role === 'LEAD_SUPERVISOR' && (
                          <span style={{ fontSize: '0.65rem', background: '#dcfce7', color: '#15803d', padding: '1px 5px', borderRadius: '4px', fontWeight: 700, flexShrink: 0 }}>
                            Trưởng TVGS
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.position || 'Cán bộ TVGS'} {u.phone ? '• ' + u.phone : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              style={{ background: '#059669', borderColor: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <NotebookPen size={16} />
              <span>Gửi Nhật Ký Thi Công</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
