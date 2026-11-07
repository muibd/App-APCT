import React, { useState, useMemo } from 'react';
import {
  Search, Plus, Calendar, Filter, Clock, FileText, CheckCircle2,
  AlertTriangle, XCircle, Eye, Download, UserCheck, ShieldAlert,
  ArrowUpDown, RefreshCw, Layers, FileSpreadsheet, Paperclip, Trash2,
  Building2, Briefcase, RotateCcw
} from 'lucide-react';
import {
  getEffectiveShopStatus,
  getShopStatusBadgeConfig,
  SHOP_STATUS,
  isAsBuiltDoc,
  getShopTvgsOverdueInfo,
  getShopInvestorOverdueInfo
} from '../data/shopDocumentConstants';

// Hàm trích xuất / suy luận Công trình, Gói thầu, Hạng mục/Công tác của hồ sơ, biên bản, nhật ký
export const getDocHierarchyInfo = (doc) => {
  if (!doc) return { projectName: '', packageName: '', itemName: '' };
  const content = `${(doc.title || '')} ${(doc.notes || '')} ${(doc.inspectionObject || '')} ${(doc.taskContent || '')} ${(doc.workContent || '')} ${(doc.buildingName || '')} ${(doc.itemName || '')}`.toLowerCase();

  // 1. Tên công trình
  let projectName = doc.projectName || doc.buildingName || doc.projectInfo?.buildingName || doc.projectInfo?.projectName || '';
  if (!projectName) {
    if (content.includes('noxh2') || content.includes('nhà ở xã hội 2') || content.includes('2203')) {
      projectName = 'Chung cư nhà ở xã hội 2';
    } else if (content.includes('cao tầng') || content.includes('2204')) {
      projectName = 'Chung cư nhà ở cao tầng';
    }
  }

  // 2. Tên gói thầu
  let packageName = doc.packageName || doc.contractorInfo?.packageName || '';
  if (!packageName) {
    if (content.includes('xt-lt-bt') || content.includes('hoàn thiện') || content.includes('xây trát') || content.includes('ốp lát') || content.includes('trát tường') || content.includes('cán nền') || content.includes('sơn lót')) {
      packageName = 'Thi công phần hoàn thiện Tòa A và Tòa B';
    } else if (content.includes('hạ tầng') || content.includes('sân đường') || content.includes('cảnh quan')) {
      packageName = 'Thi công cảnh quan sân vườn và hạ tầng kỹ thuật';
    } else if (content.includes('kết cấu') || content.includes('cột') || content.includes('dầm') || content.includes('sàn') || content.includes('móng') || content.includes('hầm') || content.includes('cốt thép') || content.includes('bê tông')) {
      packageName = 'Thi công phần kết cấu – Tòa A và Tòa B';
    } else if (content.includes('mep') || content.includes('điện') || content.includes('nước') || content.includes('thoát nước')) {
      packageName = 'Thi công hệ thống Mep Tòa A và Tòa B';
    } else if (content.includes('pccc') || content.includes('chữa cháy') || content.includes('báo cháy')) {
      packageName = 'Thi công hệ thống PCCC trong và ngoài nhà';
    }
  }

  // 3. Tên hạng mục / công tác công việc
  let itemName = doc.itemName || doc.taskName || doc.inspectionObject || doc.taskContent || doc.projectInfo?.itemName || '';
  if (!itemName) {
    if (content.includes('xt-lt-bt') || (content.includes('xây') && content.includes('trát'))) {
      itemName = 'Xây trát tường & Ốp lát gạch';
    } else if (content.includes('hạ tầng')) {
      itemName = 'Hạ tầng kỹ thuật & sân đường';
    }
  }

  return { projectName, packageName, itemName };
};

export default function ShopDocumentsView({
  shopDocuments = [],
  projects = [],
  currentUser,
  currentRole,
  onOpenCreateModal,
  onOpenDetailModal,
  onDeleteShopDocument
}) {
  // State tìm kiếm & bộ lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL'); // 'ALL' | 'SENT' | 'APPROVED' | 'REJECTED' | 'OVERDUE'
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedProject, setSelectedProject] = useState('ALL');
  const [selectedPackage, setSelectedPackage] = useState('ALL');
  const [selectedItem, setSelectedItem] = useState('ALL');

  // Format date helper
  const formatDateDisplay = (iso) => {
    if (!iso) return '---';
    try {
      const d = new Date(iso);
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${hours}:${mins} - ${day}/${month}/${year}`;
    } catch {
      return iso;
    }
  };

  // Tính toán SLA còn lại hoặc quá hạn tuần tự theo 2 cấp
  const getSlaRemainingInfo = (doc) => {
    if (doc.status === SHOP_STATUS.APPROVED) {
      return { text: 'Đã hoàn thành', isOverdue: false, color: '#15803d', bg: '#f0fdf4' };
    }
    if (doc.status === SHOP_STATUS.REJECTED) {
      return { text: 'Yêu cầu sửa lại', isOverdue: false, color: '#b91c1c', bg: '#fef2f2' };
    }

    const effStatus = getEffectiveShopStatus(doc);
    const isAsBuilt = isAsBuiltDoc(doc);
    const now = Date.now();

    // 1. Kiểm tra chậm TVGS
    if (effStatus === SHOP_STATUS.OVERDUE_TVGS) {
      const tvgsOverdue = getShopTvgsOverdueInfo(doc);
      return {
        text: tvgsOverdue.reason || 'TVGS Chậm',
        isOverdue: true,
        color: '#e11d48',
        bg: '#fff1f2'
      };
    }

    // 2. Kiểm tra chậm Ban QLDA
    if (effStatus === SHOP_STATUS.OVERDUE_INVESTOR) {
      const invOverdue = getShopInvestorOverdueInfo(doc);
      return {
        text: invOverdue.reason || 'Ban QLDA Chậm',
        isOverdue: true,
        color: '#be185d',
        bg: '#fdf2f8'
      };
    }

    // Tương thích cũ nếu còn
    if (effStatus === SHOP_STATUS.OVERDUE_ASSIGNMENT || effStatus === SHOP_STATUS.OVERDUE_REVIEW || effStatus === SHOP_STATUS.OVERDUE) {
      return {
        text: 'Chậm phản hồi',
        isOverdue: true,
        color: '#e11d48',
        bg: '#fff1f2'
      };
    }

    const isTvgsAssigned = Boolean(doc.assignedTvgs?.assignee || doc.assignedTvgs?.uid);
    const isTvgsApproved = doc.assignedTvgs?.status === 'ACCEPTED';

    // 3. Nếu TVGS chưa duyệt đạt:
    if (!isTvgsApproved) {
      // 3.1. TVGS chưa phân công cán bộ (Đang trong hạn 24h)
      if (!isTvgsAssigned || doc.assignedTvgs?.status === 'WAITING_ASSIGNMENT') {
        const deadline = doc.assignmentDeadline 
          ? new Date(doc.assignmentDeadline).getTime() 
          : (new Date(doc.createdAt || doc.submittedAt || now).getTime() + 24 * 60 * 60 * 1000);
        const diffHours = Math.round((deadline - now) / (3600 * 1000));
        return {
          text: `Hạn TVGS giao: ${Math.max(0, diffHours)}h`,
          isOverdue: false,
          color: '#b45309',
          bg: '#fffbeb'
        };
      }

      // 3.2. TVGS đã phân công cán bộ -> Đang trong hạn duyệt của TVGS
      const tvgsDue = doc.assignedTvgs?.dueDate 
        ? new Date(doc.assignedTvgs.dueDate).getTime() 
        : (doc.dueDate ? new Date(doc.dueDate).getTime() : (now + 3 * 24 * 3600 * 1000));
      const diffDays = Math.ceil((tvgsDue - now) / (24 * 3600 * 1000));

      if (diffDays <= 0) {
        return { text: 'TVGS hạn hôm nay', isOverdue: false, color: '#ea580c', bg: '#fff7ed' };
      }
      return { text: `TVGS còn: ${diffDays} ngày`, isOverdue: false, color: '#0284c7', bg: '#f0f9ff' };
    }

    // 4. Nếu TVGS ĐÃ DUYỆT ĐẠT:
    // Bản vẽ hoàn công: TVGS duyệt đạt là xong
    if (isAsBuilt) {
      return { text: 'Đã hoàn thành', isOverdue: false, color: '#15803d', bg: '#f0fdf4' };
    }

    // Hồ sơ thường -> Tính hạn cho Ban QLDA:
    const tvgsReviewedTime = doc.assignedTvgs?.reviewedAt 
      ? new Date(doc.assignedTvgs.reviewedAt).getTime() 
      : (doc.updatedAt ? new Date(doc.updatedAt).getTime() : now);

    const isInvestorAssigned = Boolean(doc.assignedInvestor?.assignee || doc.assignedInvestor?.uid);

    // 4.1. Ban QLDA chưa phân công cán bộ (Đang trong hạn 24h tính từ lúc TVGS duyệt)
    if (!isInvestorAssigned || doc.assignedInvestor?.status === 'WAITING_ASSIGNMENT') {
      const invAssignDeadline = tvgsReviewedTime + 24 * 60 * 60 * 1000;
      const diffHours = Math.round((invAssignDeadline - now) / (3600 * 1000));
      return {
        text: `Hạn QLDA giao: ${Math.max(0, diffHours)}h`,
        isOverdue: false,
        color: '#b45309',
        bg: '#fffbeb'
      };
    }

    // 4.2. Ban QLDA đã phân công cán bộ -> Đang trong hạn duyệt của Ban QLDA (tính từ lúc TVGS duyệt)
    const invSlaDays = Number(doc.assignedInvestor?.slaDays || doc.slaDays || 3);
    const invDueTime = doc.assignedInvestor?.dueDate && new Date(doc.assignedInvestor.dueDate).getTime() > tvgsReviewedTime
      ? new Date(doc.assignedInvestor.dueDate).getTime()
      : (tvgsReviewedTime + invSlaDays * 24 * 60 * 60 * 1000);
    const diffDays = Math.ceil((invDueTime - now) / (24 * 3600 * 1000));

    if (diffDays <= 0) {
      return { text: 'QLDA hạn hôm nay', isOverdue: false, color: '#ea580c', bg: '#fff7ed' };
    }
    return { text: `QLDA còn: ${diffDays} ngày`, isOverdue: false, color: '#0284c7', bg: '#f0f9ff' };
  };

  // Thống kê đếm số lượng hồ sơ theo từng trạng thái
  const counts = useMemo(() => {
    let waitingAssignment = 0;
    let sent = 0;
    let approved = 0;
    let rejected = 0;
    let overdue = 0;

    shopDocuments.forEach(doc => {
      const effStatus = getEffectiveShopStatus(doc);
      if (effStatus === SHOP_STATUS.APPROVED) approved++;
      else if (effStatus === SHOP_STATUS.REJECTED) rejected++;
      else if (
        effStatus === SHOP_STATUS.OVERDUE_TVGS ||
        effStatus === SHOP_STATUS.OVERDUE_INVESTOR ||
        effStatus === SHOP_STATUS.OVERDUE_ASSIGNMENT ||
        effStatus === SHOP_STATUS.OVERDUE_REVIEW ||
        effStatus === SHOP_STATUS.OVERDUE
      ) overdue++;
      else if (effStatus === SHOP_STATUS.WAITING_ASSIGNMENT) waitingAssignment++;
      else sent++;
    });

    return {
      total: shopDocuments.length,
      waitingAssignment,
      sent,
      approved,
      rejected,
      overdue
    };
  }, [shopDocuments]);

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
    // Bổ sung từ shopDocuments nếu có
    shopDocuments.forEach(d => {
      const { projectName } = getDocHierarchyInfo(d);
      if (projectName && !list.some(x => x.name === projectName)) {
        list.push({ code: d.projectCode || projectName, name: projectName, id: projectName });
      }
    });
    return list;
  }, [projects, shopDocuments]);

  // Danh sách Gói thầu (Level 3 - phụ thuộc vào Công trình nếu có chọn)
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
    // Bổ sung từ shopDocuments
    shopDocuments.forEach(d => {
      const { projectName, packageName } = getDocHierarchyInfo(d);
      if (packageName && !list.some(x => x.name === packageName)) {
        if (selectedProject === 'ALL' || selectedProject === projectName || (projects || []).some(p => (p.code === selectedProject || p.id === selectedProject) && p.name === projectName)) {
          list.push({ id: packageName, name: packageName });
        }
      }
    });
    return list;
  }, [projects, shopDocuments, selectedProject]);

  // Danh sách Hạng mục (Level 4 - phụ thuộc vào Công trình & Gói thầu nếu có chọn)
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
    // Bổ sung từ shopDocuments
    shopDocuments.forEach(d => {
      const { projectName, packageName, itemName } = getDocHierarchyInfo(d);
      if (itemName && !list.includes(itemName)) {
        const matchProj = selectedProject === 'ALL' || selectedProject === projectName || (projects || []).some(p => (p.code === selectedProject || p.id === selectedProject) && p.name === projectName);
        const matchPkg = selectedPackage === 'ALL' || selectedPackage === packageName;
        if (matchProj && matchPkg) {
          list.push(itemName);
        }
      }
    });
    return list;
  }, [projects, shopDocuments, selectedProject, selectedPackage]);

  // Lọc danh sách hồ sơ
  const filteredDocuments = useMemo(() => {
    return shopDocuments.filter(doc => {
      const { projectName: docProjName, packageName: docPkgName, itemName: docItemName } = getDocHierarchyInfo(doc);

      // 1. Lọc theo text search (tên hồ sơ, mã số, người lập, loại hồ sơ, công trình, gói thầu)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const title = (doc.title || '').toLowerCase();
        const docCode = (doc.docCode || '').toLowerCase();
        const typeName = (doc.typeName || '').toLowerCase();
        const creator = (doc.createdByName || '').toLowerCase();
        const tvgs = (doc.assignedTvgs?.assignee?.fullName || doc.assignedTvgs?.fullName || '').toLowerCase();
        const investor = (doc.assignedInvestor?.assignee?.fullName || doc.assignedInvestor?.fullName || '').toLowerCase();
        const pName = docProjName.toLowerCase();
        const pkgName = docPkgName.toLowerCase();
        const iName = docItemName.toLowerCase();

        const match = title.includes(query) ||
          docCode.includes(query) ||
          typeName.includes(query) ||
          creator.includes(query) ||
          tvgs.includes(query) ||
          investor.includes(query) ||
          pName.includes(query) ||
          pkgName.includes(query) ||
          iName.includes(query);

        if (!match) return false;
      }

      // 2. Lọc theo ngày tạo
      if (selectedDate) {
        const docDateStr = (doc.submittedAt || doc.createdAt || '').slice(0, 10);
        if (docDateStr !== selectedDate) return false;
      }

      // 3. Lọc theo trạng thái
      if (selectedStatus !== 'ALL') {
        const effStatus = getEffectiveShopStatus(doc);
        if (selectedStatus === SHOP_STATUS.OVERDUE) {
          const isOverdue = 
            effStatus === SHOP_STATUS.OVERDUE_TVGS ||
            effStatus === SHOP_STATUS.OVERDUE_INVESTOR ||
            effStatus === SHOP_STATUS.OVERDUE || 
            effStatus === SHOP_STATUS.OVERDUE_ASSIGNMENT || 
            effStatus === SHOP_STATUS.OVERDUE_REVIEW;
          if (!isOverdue) return false;
        } else if (effStatus !== selectedStatus) {
          return false;
        }
      }

      // 4. Lọc theo loại hồ sơ
      if (selectedType !== 'ALL') {
        if (doc.typeCode !== selectedType) return false;
      }

      // 5. Lọc theo Công trình
      if (selectedProject !== 'ALL') {
        const projObj = projectOptions.find(p => p.code === selectedProject || p.id === selectedProject || p.name === selectedProject);
        const targetName = projObj?.name || selectedProject;
        const targetCode = projObj?.code || selectedProject;

        const match = docProjName === targetName ||
          doc.projectId === selectedProject ||
          doc.projectCode === targetCode ||
          (doc.projectName && doc.projectName.toLowerCase().includes(targetName.toLowerCase()));

        if (!match) return false;
      }

      // 6. Lọc theo Gói thầu
      if (selectedPackage !== 'ALL') {
        const match = docPkgName === selectedPackage ||
          doc.packageId === selectedPackage ||
          (doc.packageName && doc.packageName.toLowerCase().includes(selectedPackage.toLowerCase()));

        if (!match) return false;
      }

      // 7. Lọc theo Hạng mục
      if (selectedItem !== 'ALL') {
        const match = docItemName === selectedItem ||
          doc.itemId === selectedItem ||
          doc.itemName === selectedItem ||
          doc.taskName === selectedItem ||
          (doc.title && doc.title.toLowerCase().includes(selectedItem.toLowerCase()));

        if (!match) return false;
      }

      return true;
    });
  }, [shopDocuments, searchTerm, selectedDate, selectedStatus, selectedType, selectedProject, selectedPackage, selectedItem, projectOptions]);

  return (
    <div className="shop-documents-view" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. HEADER & METRIC SUMMARY CARDS */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={26} color="#059669" />
            Hồ Sơ Bộ Phận Shop
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Quản lý, phân công cán bộ, giám sát tiến độ thẩm định Biện pháp thi công, Shop drawings & Bản vẽ hoàn công
          </p>
        </div>

        {/* NÚT TẠO HỒ SƠ MỚI */}
        <button
          type="button"
          onClick={onOpenCreateModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 18px',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
            transition: 'all 0.2s ease'
          }}
        >
          <Plus size={18} />
          <span>Tạo Hồ Sơ</span>
        </button>
      </div>

      {/* METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
        
        {/* TỔNG SỐ */}
        <div 
          onClick={() => setSelectedStatus('ALL')}
          style={{
            background: '#ffffff',
            border: selectedStatus === 'ALL' ? '2px solid #0284c7' : '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '14px 16px',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
            Tổng hồ sơ
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>
            {counts.total}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 600 }}>Tất cả các loại</div>
        </div>

        {/* CHỜ PHÂN CÔNG */}
        <div 
          onClick={() => setSelectedStatus(SHOP_STATUS.WAITING_ASSIGNMENT)}
          style={{
            background: '#ffffff',
            border: selectedStatus === SHOP_STATUS.WAITING_ASSIGNMENT ? '2px solid #f59e0b' : '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '14px 16px',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#b45309', textTransform: 'uppercase' }}>
            Chờ phân công
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#b45309', margin: '4px 0' }}>
            {counts.waitingAssignment || 0}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#d97706' }}>2 Trưởng ban giao việc (1 ngày)</div>
        </div>

        {/* ĐANG THẨM ĐỊNH */}
        <div 
          onClick={() => setSelectedStatus(SHOP_STATUS.SENT)}
          style={{
            background: '#ffffff',
            border: selectedStatus === SHOP_STATUS.SENT ? '2px solid #2563eb' : '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '14px 16px',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2563eb', textTransform: 'uppercase' }}>
            Đang thẩm định
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2563eb', margin: '4px 0' }}>
            {counts.sent}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Cán bộ đang xử lý</div>
        </div>

        {/* ĐÃ XÁC NHẬN */}
        <div 
          onClick={() => setSelectedStatus(SHOP_STATUS.APPROVED)}
          style={{
            background: '#ffffff',
            border: selectedStatus === SHOP_STATUS.APPROVED ? '2px solid #059669' : '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '14px 16px',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#059669', textTransform: 'uppercase' }}>
            Đã xác nhận
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669', margin: '4px 0' }}>
            {counts.approved}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#16a34a' }}>2/2 bên đã đồng ý</div>
        </div>

        {/* CẦN SỬA */}
        <div 
          onClick={() => setSelectedStatus(SHOP_STATUS.REJECTED)}
          style={{
            background: '#ffffff',
            border: selectedStatus === SHOP_STATUS.REJECTED ? '2px solid #dc2626' : '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '14px 16px',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#dc2626', textTransform: 'uppercase' }}>
            Cần sửa
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#dc2626', margin: '4px 0' }}>
            {counts.rejected}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#ef4444' }}>Yêu cầu chỉnh sửa lại</div>
        </div>

        {/* CHẬM (QUÁ HẠN) */}
        <div 
          onClick={() => setSelectedStatus(SHOP_STATUS.OVERDUE)}
          style={{
            background: '#ffffff',
            border: selectedStatus === SHOP_STATUS.OVERDUE ? '2px solid #e11d48' : '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '14px 16px',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e11d48', textTransform: 'uppercase' }}>
            Chậm (Quá hạn)
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#e11d48', margin: '4px 0' }}>
            {counts.overdue}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#f43f5e' }}>Chậm giao hoặc chậm duyệt</div>
        </div>

      </div>

      {/* 2. THANH TÌM KIẾM & BỘ LỌC */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '14px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        {/* HÀNG 1: TÌM KIẾM TỪ KHÓA, NGÀY VÀ TRẠNG THÁI */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
          
          {/* TÌM KIẾM THEO TÊN HỒ SƠ / MÃ */}
          <div style={{ flex: '2 1 240px', position: 'relative' }}>
            <Search size={17} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Tìm theo tên hồ sơ, mã số, người lập, cán bộ, công trình..."
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

          {/* LỌC THEO NGÀY TẠO */}
          <div style={{ flex: '1 1 150px', position: 'relative' }}>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              title="Lọc theo ngày tạo hồ sơ"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1.5px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.86rem',
                color: '#334155',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* LỌC THEO TRẠNG THÁI */}
          <div style={{ flex: '1 1 180px' }}>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                border: '1.5px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.86rem',
                color: '#334155',
                background: '#fff',
                outline: 'none',
                cursor: 'pointer',
                boxSizing: 'border-box'
              }}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value={SHOP_STATUS.WAITING_ASSIGNMENT}>Chờ phân công (24h)</option>
              <option value={SHOP_STATUS.SENT}>Đang thẩm định</option>
              <option value={SHOP_STATUS.APPROVED}>Đã xác nhận</option>
              <option value={SHOP_STATUS.REJECTED}>Cần sửa</option>
              <option value={SHOP_STATUS.OVERDUE}>Tất cả hồ sơ Chậm</option>
              <option value={SHOP_STATUS.OVERDUE_TVGS}>⚠️ TVGS Chậm</option>
              <option value={SHOP_STATUS.OVERDUE_INVESTOR}>⚠️ Ban QLDA Chậm</option>
            </select>
          </div>
        </div>

        {/* HÀNG 2: PHÂN CẤP CÔNG TRÌNH - GÓI THẦU - HẠNG MỤC */}
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

          {/* LỌC THEO HẠNG MỤC CÔNG VIỆC */}
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
          {(searchTerm || selectedDate || selectedStatus !== 'ALL' || selectedProject !== 'ALL' || selectedPackage !== 'ALL' || selectedItem !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedDate('');
                setSelectedStatus('ALL');
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
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <RotateCcw size={13} />
              <span>Xóa lọc</span>
            </button>
          )}

        </div>

      </div>

      {/* 3. BẢNG HIỂN THỊ DỮ LIỆU */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        
        {filteredDocuments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
            <Layers size={42} color="#cbd5e1" style={{ marginBottom: '10px' }} />
            <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', color: '#334155' }}>Không tìm thấy hồ sơ nào</h4>
            <p style={{ margin: 0, fontSize: '0.84rem' }}>
              Chưa có hồ sơ phù hợp với điều kiện tìm kiếm. Nhấn <strong>"+ Tạo Hồ Sơ"</strong> để lập hồ sơ mới.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#475569', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  <th style={{ padding: '12px 16px', minWidth: '220px' }}>Tên Hồ Sơ / Bản Vẽ</th>
                  <th style={{ padding: '12px 14px', minWidth: '150px' }}>Đơn Vị Thi Công</th>
                  <th style={{ padding: '12px 14px', minWidth: '160px' }}>Giám Sát Trưởng</th>
                  <th style={{ padding: '12px 16px', minWidth: '160px' }}>TVGS Kiểm Tra</th>
                  <th style={{ padding: '12px 16px', minWidth: '160px' }}>T. Ban Phân Công</th>
                  <th style={{ padding: '12px 14px', minWidth: '160px' }}>CB Ban Kiểm Tra</th>
                  <th style={{ padding: '12px 16px', minWidth: '110px', textAlign: 'center' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc, idx) => {
                  const { projectName: docProjName, packageName: docPkgName, itemName: docItemName } = getDocHierarchyInfo(doc);
                  const isAsBuilt = isAsBuiltDoc(doc);

                  // 1. THÔNG TIN GIÁM SÁT TRƯỞNG PHÂN CÔNG
                  const isTvgsAssigned = Boolean(doc.assignedTvgs?.assignee?.uid || doc.assignedTvgs?.uid);
                  const tvgsAssignee = doc.assignedTvgs?.assignee || (doc.assignedTvgs?.uid ? doc.assignedTvgs : null);
                  const tvgsAssignDeadline = doc.assignmentDeadline 
                    ? new Date(doc.assignmentDeadline).getTime() 
                    : (new Date(doc.createdAt || doc.submittedAt || Date.now()).getTime() + 24 * 60 * 60 * 1000);
                  const isTvgsAssignOverdue = !isTvgsAssigned && (Date.now() > tvgsAssignDeadline);

                  // 2. THÔNG TIN TVGS KIỂM TRA
                  const tvgsStatus = doc.assignedTvgs?.status || 'WAITING_ASSIGNMENT';
                  const tvgsDueDate = doc.assignedTvgs?.dueDate 
                    ? new Date(doc.assignedTvgs.dueDate).getTime() 
                    : (doc.assignedTvgs?.assignedAt 
                        ? new Date(doc.assignedTvgs.assignedAt).getTime() + (doc.assignedTvgs?.slaDays || 3) * 24 * 3600 * 1000 
                        : null);
                  const isTvgsReviewOverdue = isTvgsAssigned && tvgsStatus === 'PENDING' && tvgsDueDate && (Date.now() > tvgsDueDate);
                  const isTvgsApproved = tvgsStatus === 'ACCEPTED';

                  // 3. THÔNG TIN TRƯỞNG BAN PHÂN CÔNG (TUẦN TỰ: CHỈ BẮT ĐẦU KHI TVGS ĐÃ DUYỆT ĐẠT, NẾU KHÔNG PHẢI HOÀN CÔNG)
                  const tvgsReviewedTime = doc.assignedTvgs?.reviewedAt 
                    ? new Date(doc.assignedTvgs.reviewedAt).getTime() 
                    : (doc.updatedAt ? new Date(doc.updatedAt).getTime() : Date.now());
                  const investorAssignDeadline = tvgsReviewedTime + 24 * 60 * 60 * 1000;
                  const isInvestorAssigned = Boolean(doc.assignedInvestor?.assignee?.uid || doc.assignedInvestor?.uid);
                  const investorAssignee = doc.assignedInvestor?.assignee || (doc.assignedInvestor?.uid ? doc.assignedInvestor : null);
                  const isInvestorAssignOverdue = !isAsBuilt && isTvgsApproved && !isInvestorAssigned && (Date.now() > investorAssignDeadline);

                  // 4. THÔNG TIN CÁN BỘ BAN KIỂM TRA (CHỈ TÍNH HẠN SAU KHI TRƯỞNG BAN PHÂN CÔNG)
                  const investorStatus = doc.assignedInvestor?.status || 'WAITING_ASSIGNMENT';
                  const investorDueDate = doc.assignedInvestor?.dueDate 
                    ? new Date(doc.assignedInvestor.dueDate).getTime() 
                    : (doc.assignedInvestor?.assignedAt 
                        ? new Date(doc.assignedInvestor.assignedAt).getTime() + (doc.assignedInvestor?.slaDays || 3) * 24 * 3600 * 1000 
                        : (tvgsReviewedTime + (doc.assignedInvestor?.slaDays || doc.slaDays || 3) * 24 * 3600 * 1000));
                  const isInvestorReviewOverdue = !isAsBuilt && isTvgsApproved && isInvestorAssigned && investorStatus === 'PENDING' && investorDueDate && (Date.now() > investorDueDate);

                  return (
                    <tr 
                      key={doc.id || idx}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.15s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      onClick={() => onOpenDetailModal(doc)}
                    >
                      {/* 1. TÊN HỒ SƠ / BẢN VẼ */}
                      <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <div style={{ marginTop: '2px' }}>
                            <FileText size={18} color="#0284c7" />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem', lineHeight: 1.35 }}>
                              {doc.title}
                            </div>

                            {/* BADGES PHÂN CẤP CÔNG TRÌNH / GÓI THẦU / HẠNG MỤC */}
                            {(docProjName || docPkgName || docItemName) && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px', flexWrap: 'wrap' }}>
                                {docProjName && (
                                  <span style={{ fontSize: '0.7rem', color: '#0f766e', background: '#f0fdfa', border: '1px solid #ccfbf1', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                                    🏢 {docProjName}
                                  </span>
                                )}
                                {docPkgName && (
                                  <span style={{ fontSize: '0.7rem', color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                                    📦 {docPkgName}
                                  </span>
                                )}
                                {docItemName && (
                                  <span style={{ fontSize: '0.7rem', color: '#4338ca', background: '#eef2ff', border: '1px solid #c7d2fe', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                                    📑 {docItemName}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. ĐƠN VỊ THI CÔNG */}
                      <td style={{ padding: '12px 14px', minWidth: '150px', verticalAlign: 'top' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.84rem' }}>
                            {doc.createdByName || 'ĐVTC'}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px' }}>
                            {formatDateDisplay(doc.submittedAt || doc.createdAt)}
                          </div>
                          {(doc.status === 'REJECTED' || doc.assignedTvgs?.status === 'REJECTED' || doc.assignedInvestor?.status === 'REJECTED') && (
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              color: '#dc2626',
                              background: '#fef2f2',
                              border: '1px solid #fca5a5',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: 700,
                              fontSize: '0.7rem',
                              marginTop: '4px'
                            }}>
                              ⚠️ Đang sửa để trình lại
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 3. GIÁM SÁT TRƯỞNG PHÂN CÔNG */}
                      <td style={{ padding: '12px 14px', minWidth: '160px', verticalAlign: 'top' }}>
                        {!isTvgsAssigned ? (
                          <div>
                            <div>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                color: isTvgsAssignOverdue ? '#b91c1c' : '#b45309',
                                background: isTvgsAssignOverdue ? '#fef2f2' : '#fffbeb',
                                border: `1px solid ${isTvgsAssignOverdue ? '#fca5a5' : '#fde68a'}`,
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.74rem',
                                fontWeight: 700
                              }}>
                                ⏳ Đang phân công {isTvgsAssignOverdue ? '(Trễ)' : ''}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.71rem', color: isTvgsAssignOverdue ? '#dc2626' : '#64748b', marginTop: '4px', fontWeight: isTvgsAssignOverdue ? 600 : 400 }}>
                              Hạn: {formatDateDisplay(tvgsAssignDeadline)}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.84rem' }}>
                              {tvgsAssignee?.fullName || '---'}
                            </div>
                            <div style={{ fontSize: '0.71rem', color: '#15803d', marginTop: '3px', fontWeight: 500 }}>
                              ✓ Hoàn thành: {formatDateDisplay(doc.assignedTvgs?.assignedAt || doc.createdAt)}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 4. TVGS KIỂM TRA */}
                      <td style={{ padding: '12px 16px', minWidth: '160px', verticalAlign: 'top' }}>
                        {!isTvgsAssigned ? (
                          <div>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: '#64748b',
                              background: '#f1f5f9',
                              border: '1px solid #e2e8f0',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.74rem',
                              fontWeight: 600
                            }}>
                              ⏳ Chờ phân công
                            </span>
                            <div style={{ fontSize: '0.71rem', color: '#94a3b8', marginTop: '4px' }}>---</div>
                          </div>
                        ) : (
                          <div>
                            <div>
                              {tvgsStatus === 'ACCEPTED' ? (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  color: '#15803d',
                                  background: '#f0fdf4',
                                  border: '1px solid #bbf7d0',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.74rem',
                                  fontWeight: 700
                                }}>
                                  ✓ Đã kiểm tra (Đạt)
                                </span>
                              ) : tvgsStatus === 'REJECTED' ? (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  color: '#b91c1c',
                                  background: '#fef2f2',
                                  border: '1px solid #fecaca',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.74rem',
                                  fontWeight: 700
                                }}>
                                  ✕ Yêu cầu sửa
                                </span>
                              ) : (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  color: isTvgsReviewOverdue ? '#b91c1c' : '#0284c7',
                                  background: isTvgsReviewOverdue ? '#fef2f2' : '#f0f9ff',
                                  border: `1px solid ${isTvgsReviewOverdue ? '#fca5a5' : '#bae6fd'}`,
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.74rem',
                                  fontWeight: 700
                                }}>
                                  ⏳ Đang kiểm tra {isTvgsReviewOverdue ? '(Trễ)' : ''}
                                </span>
                              )}
                            </div>

                            <div style={{ fontSize: '0.71rem', marginTop: '4px', color: (tvgsStatus === 'ACCEPTED' ? '#15803d' : tvgsStatus === 'REJECTED' ? '#b91c1c' : isTvgsReviewOverdue ? '#dc2626' : '#64748b') }}>
                              {tvgsStatus === 'ACCEPTED' || tvgsStatus === 'REJECTED' ? (
                                <span>Xong: {formatDateDisplay(doc.assignedTvgs?.reviewedAt)}</span>
                              ) : (
                                <span>Hạn: {formatDateDisplay(tvgsDueDate)}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 5. T. BAN PHÂN CÔNG */}
                      <td style={{ padding: '12px 16px', minWidth: '160px', verticalAlign: 'top' }}>
                        {isAsBuilt ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#64748b',
                            background: '#f1f5f9',
                            border: '1px solid #e2e8f0',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.74rem',
                            fontWeight: 500,
                            fontStyle: 'italic'
                          }}>
                            — Không qua Ban QLDA
                          </span>
                        ) : !isTvgsApproved ? (
                          <div>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: '#94a3b8',
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.74rem',
                              fontWeight: 500
                            }}>
                              ⏳ Chờ TVGS kiểm tra
                            </span>
                            <div style={{ fontSize: '0.71rem', color: '#cbd5e1', marginTop: '4px' }}>---</div>
                          </div>
                        ) : !isInvestorAssigned ? (
                          <div>
                            <div>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                color: isInvestorAssignOverdue ? '#b91c1c' : '#b45309',
                                background: isInvestorAssignOverdue ? '#fef2f2' : '#fffbeb',
                                border: `1px solid ${isInvestorAssignOverdue ? '#fca5a5' : '#fde68a'}`,
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.74rem',
                                fontWeight: 700
                              }}>
                                ⏳ Đang phân công {isInvestorAssignOverdue ? '(Trễ)' : ''}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.71rem', color: isInvestorAssignOverdue ? '#dc2626' : '#64748b', marginTop: '4px', fontWeight: isInvestorAssignOverdue ? 600 : 400 }}>
                              Hạn: {formatDateDisplay(investorAssignDeadline)}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.84rem' }}>
                              {investorAssignee?.fullName || '---'}
                            </div>
                            <div style={{ fontSize: '0.71rem', color: '#15803d', marginTop: '3px', fontWeight: 500 }}>
                              ✓ Hoàn thành: {formatDateDisplay(doc.assignedInvestor?.assignedAt)}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 6. CB BAN KIỂM TRA (CHỈ TÍNH HẠN SAU KHI TRƯỞNG BAN PHÂN CÔNG) */}
                      <td style={{ padding: '12px 14px', minWidth: '160px', verticalAlign: 'top' }}>
                        {isAsBuilt ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#64748b',
                            background: '#f1f5f9',
                            border: '1px solid #e2e8f0',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.74rem',
                            fontWeight: 500,
                            fontStyle: 'italic'
                          }}>
                            — Không qua Ban QLDA
                          </span>
                        ) : !isTvgsApproved ? (
                          /* Lúc TVGS kiểm tra, cột này không hiện thông báo */
                          <div>
                            <span style={{ color: '#94a3b8', fontSize: '0.76rem', fontStyle: 'italic' }}>
                              ---
                            </span>
                          </div>
                        ) : !isInvestorAssigned ? (
                          <div>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: '#94a3b8',
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.74rem',
                              fontWeight: 500
                            }}>
                              ⏳ Chờ Trưởng ban giao
                            </span>
                            <div style={{ fontSize: '0.71rem', color: '#cbd5e1', marginTop: '4px' }}>---</div>
                          </div>
                        ) : (
                          <div>
                            <div>
                              {investorStatus === 'ACCEPTED' ? (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  color: '#15803d',
                                  background: '#f0fdf4',
                                  border: '1px solid #bbf7d0',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.74rem',
                                  fontWeight: 700
                                }}>
                                  ✓ Đã kiểm tra (Đạt)
                                </span>
                              ) : investorStatus === 'REJECTED' ? (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  color: '#b91c1c',
                                  background: '#fef2f2',
                                  border: '1px solid #fecaca',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.74rem',
                                  fontWeight: 700
                                }}>
                                  ✕ Yêu cầu sửa
                                </span>
                              ) : (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  color: isInvestorReviewOverdue ? '#b91c1c' : '#0284c7',
                                  background: isInvestorReviewOverdue ? '#fef2f2' : '#f0f9ff',
                                  border: `1px solid ${isInvestorReviewOverdue ? '#fca5a5' : '#bae6fd'}`,
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.74rem',
                                  fontWeight: 700
                                }}>
                                  ⏳ Đang kiểm tra {isInvestorReviewOverdue ? '(Trễ)' : ''}
                                </span>
                              )}
                            </div>

                            <div style={{ fontSize: '0.71rem', marginTop: '4px', color: (investorStatus === 'ACCEPTED' ? '#15803d' : investorStatus === 'REJECTED' ? '#b91c1c' : isInvestorReviewOverdue ? '#dc2626' : '#64748b') }}>
                              {investorStatus === 'ACCEPTED' || investorStatus === 'REJECTED' ? (
                                <span>Xong: {formatDateDisplay(doc.assignedInvestor?.reviewedAt)}</span>
                              ) : (
                                <span>Hạn: {formatDateDisplay(investorDueDate)}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* THAO TÁC */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenDetailModal(doc);
                            }}
                            style={{
                              padding: '6px 12px',
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              borderRadius: '6px',
                              color: '#1d4ed8',
                              fontSize: '0.76rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <Eye size={13} /> Xem
                          </button>

                          {(currentUser?.role === 'ADMIN' || currentUser?.isSuperAdmin || currentRole === 'ADMIN' || doc.createdByUid === currentUser?.uid) && onDeleteShopDocument && (
                            <button
                              type="button"
                              title="Xóa hồ sơ này"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn hồ sơ "${doc.title}" (${doc.docCode}) không?`)) {
                                  onDeleteShopDocument(doc.id);
                                }
                              }}
                              style={{
                                padding: '6px 8px',
                                background: '#fef2f2',
                                border: '1px solid #fecaca',
                                borderRadius: '6px',
                                color: '#dc2626',
                                fontSize: '0.76rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}
