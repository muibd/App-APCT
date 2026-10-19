import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Send, Users, Calendar, MapPin, CheckSquare, Square, 
  AlertCircle, Building, Camera, ImagePlus, Zap, Trash2, Plus, Clock 
} from 'lucide-react';
import { MOCK_PROJECT, MOCK_USERS } from '../data/mockData';
import { saveBuilding } from '../services/firestoreService';
import { compressImageFile } from '../utils/storageHelper';

const SAMPLE_CONSTRUCTION_PHOTOS = [
  {
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615b3?auto=format&fit=crop&w=800&q=80',
    caption: 'Kiểm tra định vị tim trục dầm sàn và cao độ cốp pha',
    gps: '10.0076° N, 105.7823° E (Tòa A - Trục 1-13/A-D)',
  },
  {
    url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
    caption: 'Lắp dựng cốt thép dầm sàn hoàn thiện đạt yêu cầu thiết kế',
    gps: '10.0078° N, 105.7825° E (Sàn tầng 2 Tháp A)',
  },
  {
    url: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80',
    caption: 'Kiểm tra con kê bảo vệ bê tông, đai thép và vệ sinh ván khuôn',
    gps: '10.0075° N, 105.7821° E (Khu vực dầm D1 Tòa A)',
  },
  {
    url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80',
    caption: 'Trắc đạc hiện trường kiểm tra độ thẳng đứng cột vách trước khi đổ bê tông',
    gps: '10.0080° N, 105.7828° E (Trục C1-C4 Tòa B)',
  }
];

export default function CreateRequestModal({ isOpen, onClose, users, currentUser, onSubmitRequest }) {
  if (!isOpen) return null;

  // Filter recipient groups
  const supervisorList = users.filter(u => u.role === 'SUPERVISOR');
  const investorList = users.filter(u => u.role === 'INVESTOR');

  // Form State
  const [requestNumber, setRequestNumber] = useState(`0${Math.floor(Math.random() * 80) + 10}/PYC-APG`);
  
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

  // Ngày thực hiện
  const [scheduledDate, setScheduledDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Giờ bắt đầu: Tự động lấy giờ hiện tại khi lập phiếu
  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });

  // Giờ kết thúc: Cho người dùng tự điền lúc tạo phiếu (mặc định sau 1 giờ)
  const [endTime, setEndTime] = useState(() => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
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

  const handleAddSamplePhoto = () => {
    const sample = SAMPLE_CONSTRUCTION_PHOTOS[evidencePhotos.length % SAMPLE_CONSTRUCTION_PHOTOS.length];
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const newPhoto = {
      id: `sample_photo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      url: sample.url,
      caption: sample.caption,
      gps: sample.gps,
      time: timeStr,
      photographer: `${currentUser?.fullName || 'KS. Lê Văn Kỹ Thuật'} (ĐVTC)`
    };
    setEvidencePhotos(prev => [...prev, newPhoto]);
  };

  const handleDeletePhoto = (photoId) => {
    setEvidencePhotos(prev => prev.filter(p => p.id !== photoId));
  };

  const handleUpdatePhotoCaption = (photoId, newCaption) => {
    setEvidencePhotos(prev => prev.map(p => p.id === photoId ? { ...p, caption: newCaption } : p));
  };

  // Selected Recipient IDs
  const [selectedRecipients, setSelectedRecipients] = useState(() => [
    supervisorList[0]?.uid, // Default pre-select first TVGS (e.g. KS. Võ Văn Tón)
    investorList[0]?.uid    // Default pre-select first CĐT (e.g. Ông Bành Nguyễn Hậu)
  ].filter(Boolean));

  useEffect(() => {
    if (selectedRecipients.length === 0 && users.length > 0) {
      const s = users.filter(u => u.role === 'SUPERVISOR');
      const i = users.filter(u => u.role === 'INVESTOR');
      setSelectedRecipients([s[0]?.uid, i[0]?.uid].filter(Boolean));
    }
  }, [users, isOpen]);

  // Toggle recipient
  const toggleRecipient = (uid) => {
    setSelectedRecipients(prev => 
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const selectAllGroup = (groupUsers) => {
    const groupUids = groupUsers.map(u => u.uid);
    const allSelected = groupUids.every(id => selectedRecipients.includes(id));
    if (allSelected) {
      setSelectedRecipients(prev => prev.filter(id => !groupUids.includes(id)));
    } else {
      setSelectedRecipients(prev => Array.from(new Set([...prev, ...groupUids])));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (selectedRecipients.length === 0) {
      alert('Vui lòng chọn ít nhất 1 cán bộ TVGS hoặc CĐT để nhận thông báo!');
      return;
    }

    const finalItem = (selectedItem === '__NEW_ITEM__' && customItemInput.trim()) 
      ? customItemInput.trim() 
      : selectedItem;

    if (selectedItem === '__NEW_ITEM__' && !customItemInput.trim()) {
      alert('Vui lòng nhập tên hạng mục mới!');
      return;
    }

    const assignedRecipients = selectedRecipients.map(uid => {
      const u = users.find(x => x.uid === uid);
      return {
        uid: u?.uid || uid,
        fullName: u?.fullName || 'Cán bộ tiếp nhận',
        role: u?.role || 'SUPERVISOR',
        company: u?.company || 'Ban QLDA / GELICON',
        position: u?.position || 'Cán bộ giám sát',
        email: u?.email || '',
        receivedAt: new Date().toISOString()
      };
    });

    let finalRecipients = assignedRecipients;
    if (finalRecipients.length === 0) {
      const sup = users.find(u => u.role === 'SUPERVISOR') || MOCK_USERS.find(u => u.role === 'SUPERVISOR');
      const inv = users.find(u => u.role === 'INVESTOR') || MOCK_USERS.find(u => u.role === 'INVESTOR');
      finalRecipients = [sup, inv].filter(Boolean).map(u => ({
        uid: u.uid,
        fullName: u.fullName,
        role: u.role,
        company: u.company || 'GELICON / An Phú Cần Thơ',
        position: u.position || 'Cán bộ nghiệm thu',
        email: u.email || '',
        receivedAt: new Date().toISOString()
      }));
    }

    const finalTask = customTask.trim() ? customTask : taskContent;

    const dateFormatted = scheduledDate.split('-').reverse().join('/');
    const formattedStartTime = `${startTime.replace(':', 'h')}, ngày ${dateFormatted}`;
    const formattedEndTime = `${endTime.replace(':', 'h')}, ngày ${dateFormatted}`;

    const newRequest = {
      id: `req_${Date.now()}`,
      requestNumber,
      projectId: MOCK_PROJECT.id,
      projectName: MOCK_PROJECT.projectName,
      buildingName: selectedBuilding,
      itemName: finalItem,
      location: MOCK_PROJECT.location,
      contractorCompany: currentUser?.company || 'Công ty CP Xây dựng An Phú Gia',
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
      evidencePhotos: evidencePhotos
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
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                Chỉ dành riêng cho: <strong>Đại diện Đơn vị Thi công (ĐVTC)</strong>
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Row 1: Số phiếu & Dự án */}
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
              <label className="form-label">Dự án:</label>
              <input 
                type="text" 
                className="form-input" 
                value={MOCK_PROJECT.projectName} 
                disabled 
                style={{ background: '#f8fafc', color: '#475569' }} 
              />
            </div>
          </div>

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
                  <span>{isAddingBuilding ? 'Hủy thêm' : '+ Thêm công trình'}</span>
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

          {/* Công tác xây dựng yêu cầu nghiệm thu */}
          <div className="form-group">
            <label className="form-label">Công tác xây dựng yêu cầu nghiệm thu (*):</label>
            {availableTasks.length > 0 && selectedItem !== '__NEW_ITEM__' ? (
              <select 
                className="form-select" 
                value={taskContent} 
                onChange={(e) => {
                  setTaskContent(e.target.value);
                  setCustomTask('');
                }}
                style={{ marginBottom: '8px' }}
              >
                {availableTasks.map((t, idx) => (
                  <option key={idx} value={t}>{t}</option>
                ))}
                <option value="__custom__">-- Tự nhập công tác khác --</option>
              </select>
            ) : null}
            {(taskContent === '__custom__' || selectedItem === '__NEW_ITEM__' || availableTasks.length === 0) && (
              <textarea 
                className="form-textarea" 
                placeholder="Nhập chi tiết công tác xây dựng cần nghiệm thu..."
                value={customTask}
                onChange={(e) => setCustomTask(e.target.value)}
                required
              />
            )}
          </div>

          {/* Thời gian nghiệm thu: Giờ bắt đầu (giờ tạo phiếu) & Giờ kết thúc (cho điền) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '18px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Giờ bắt đầu:</span>
                <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600 }}>⚡ Giờ tạo phiếu</span>
              </label>
              <input 
                type="time" 
                className="form-input" 
                value={startTime} 
                onChange={(e) => setStartTime(e.target.value)} 
                title="Tự động lấy giờ hiện tại khi lập phiếu"
                required 
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Giờ kết thúc:</span>
                <span style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 600 }}>✍️ Tự điền</span>
              </label>
              <input 
                type="time" 
                className="form-input" 
                value={endTime} 
                onChange={(e) => setEndTime(e.target.value)} 
                title="Điền giờ kết thúc nghiệm thu"
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
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Chụp hoặc tải ảnh hiện trường công việc sẵn sàng nghiệm thu (kèm GPS & thời gian)
                  </div>
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="#2563eb" />
                <strong style={{ fontSize: '0.95rem', color: '#1e293b' }}>
                  Chỉ định Cán bộ Nhận Thư Mời Nghiệm Thu
                </strong>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Đã chọn: <strong>{selectedRecipients.length} cán bộ</strong>
              </span>
            </div>

            {/* NHÓM 1: TƯ VẤN GIÁM SÁT */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#047857', textTransform: 'uppercase' }}>
                  1. Cán bộ Tư Vấn Giám Sát (TVGS GELICON):
                </span>
                <button 
                  type="button" 
                  onClick={() => selectAllGroup(supervisorList)}
                  style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.78rem', cursor: 'pointer', fontWeight: '600' }}
                >
                  Chọn / Bỏ tất cả TVGS
                </button>
              </div>

              <div className="recipients-selection-grid">
                {supervisorList.map(u => {
                  const isSelected = selectedRecipients.includes(u.uid);
                  return (
                    <div 
                      key={u.uid}
                      className={`recipient-checkbox-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleRecipient(u.uid)}
                    >
                      <input 
                        type="checkbox" 
                        checked={isSelected} 
                        onChange={() => {}} 
                      />
                      <div className="avatar-circle" style={{ width: '30px', height: '30px', fontSize: '0.75rem', background: '#059669' }}>
                        {u.avatar}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#0f172a' }}>{u.fullName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{u.position} • {u.phone}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* NHÓM 2: ĐẠI DIỆN CHỦ ĐẦU TƯ */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#b45309', textTransform: 'uppercase' }}>
                  2. Đại Diện Chủ Đầu Tư (Ban QLDA An Phú Cần Thơ):
                </span>
                <button 
                  type="button" 
                  onClick={() => selectAllGroup(investorList)}
                  style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.78rem', cursor: 'pointer', fontWeight: '600' }}
                >
                  Chọn / Bỏ tất cả CĐT
                </button>
              </div>

              <div className="recipients-selection-grid">
                {investorList.map(u => {
                  const isSelected = selectedRecipients.includes(u.uid);
                  return (
                    <div 
                      key={u.uid}
                      className={`recipient-checkbox-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleRecipient(u.uid)}
                    >
                      <input 
                        type="checkbox" 
                        checked={isSelected} 
                        onChange={() => {}} 
                      />
                      <div className="avatar-circle" style={{ width: '30px', height: '30px', fontSize: '0.75rem', background: '#d97706' }}>
                        {u.avatar}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#0f172a' }}>{u.fullName}</div>
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
