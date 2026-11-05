import React, { useState, useMemo } from 'react';
import {
  Search, Plus, Calendar, Filter, Clock, FileText, CheckCircle2,
  AlertTriangle, XCircle, Eye, Download, UserCheck, ShieldAlert,
  ArrowUpDown, RefreshCw, Layers, FileSpreadsheet, Paperclip, CreditCard, Trash2,
  RotateCcw
} from 'lucide-react';
import {
  getEffectivePaymentStatus,
  getPaymentStatusBadgeConfig,
  PAYMENT_STATUS
} from '../data/paymentDocumentConstants';
import { getDocHierarchyInfo } from './ShopDocumentsView';

export default function PaymentDocumentsView({
  paymentDocuments = [],
  projects = [],
  currentUser,
  currentRole,
  onOpenCreateModal,
  onOpenDetailModal,
  onDeletePaymentDocument
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

  // Tính toán SLA còn lại hoặc quá hạn
  const getSlaRemainingInfo = (doc) => {
    if (doc.status === PAYMENT_STATUS.APPROVED) {
      return { text: 'Đã hoàn thành', isOverdue: false, color: '#15803d', bg: '#f0fdf4' };
    }
    if (doc.status === PAYMENT_STATUS.REJECTED) {
      return { text: 'Yêu cầu sửa lại', isOverdue: false, color: '#b91c1c', bg: '#fef2f2' };
    }

    const effStatus = getEffectivePaymentStatus(doc);

    // 1. Nếu đang chờ phân công hoặc chậm phân công
    const isTvgsAssigned = Boolean(doc.assignedTvgs?.assignee || doc.assignedTvgs?.uid);
    const isInvestorAssigned = Boolean(doc.assignedInvestor?.assignee || doc.assignedInvestor?.uid);

    if (effStatus === PAYMENT_STATUS.OVERDUE_ASSIGNMENT) {
      return {
        text: 'Chậm phân công',
        isOverdue: true,
        color: '#be185d',
        bg: '#fdf2f8'
      };
    }

    if (doc.status === PAYMENT_STATUS.WAITING_ASSIGNMENT || (!isTvgsAssigned || !isInvestorAssigned)) {
      const deadline = doc.assignmentDeadline 
        ? new Date(doc.assignmentDeadline).getTime() 
        : (new Date(doc.createdAt || doc.submittedAt || Date.now()).getTime() + 24 * 60 * 60 * 1000);
      const diffHours = Math.round((deadline - Date.now()) / (3600 * 1000));
      if (diffHours < 0) {
        return {
          text: `Chậm giao ${Math.abs(diffHours) === 0 ? 1 : Math.abs(diffHours)}h`,
          isOverdue: true,
          color: '#be185d',
          bg: '#fdf2f8'
        };
      } else {
        return {
          text: `Hạn giao: ${diffHours}h`,
          isOverdue: false,
          color: '#b45309',
          bg: '#fffbeb'
        };
      }
    }

    // 2. Nếu đã phân công -> Kiểm tra thời hạn thẩm định
    if (effStatus === PAYMENT_STATUS.OVERDUE_TVGS) {
      return {
        text: 'TVGS Chậm',
        isOverdue: true,
        color: '#e11d48',
        bg: '#fff1f2'
      };
    }
    if (effStatus === PAYMENT_STATUS.OVERDUE_INVESTOR) {
      return {
        text: 'Ban QLDA Chậm',
        isOverdue: true,
        color: '#be185d',
        bg: '#fdf2f8'
      };
    }
    if (effStatus === PAYMENT_STATUS.OVERDUE_REVIEW) {
      return {
        text: 'Chậm phản hồi',
        isOverdue: true,
        color: '#e11d48',
        bg: '#fff1f2'
      };
    }

    // Xác định mốc hạn chót đang chờ xử lý theo quy trình tuần tự:
    // - TVGS chưa duyệt: tính theo hạn của TVGS
    // - TVGS đã duyệt: tính theo hạn của Ban QLDA
    const isTvgsApproved = doc.assignedTvgs?.status === 'ACCEPTED';
    let targetDueTime = null;

    if (!isTvgsApproved) {
      targetDueTime = doc.assignedTvgs?.dueDate 
        ? new Date(doc.assignedTvgs.dueDate).getTime() 
        : (doc.dueDate ? new Date(doc.dueDate).getTime() : null);
    } else {
      const tvgsReviewedTime = doc.assignedTvgs?.reviewedAt ? new Date(doc.assignedTvgs.reviewedAt).getTime() : Date.now();
      const invSlaDays = Number(doc.assignedInvestor?.slaDays || doc.slaDays || 3);
      targetDueTime = doc.assignedInvestor?.dueDate && new Date(doc.assignedInvestor.dueDate).getTime() > tvgsReviewedTime
        ? new Date(doc.assignedInvestor.dueDate).getTime()
        : (tvgsReviewedTime + invSlaDays * 24 * 3600 * 1000);
    }

    if (!targetDueTime) return { text: '---', isOverdue: false, diffDays: 0 };
    const now = Date.now();
    const diffMs = targetDueTime - now;
    const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));

    if (diffMs < 0) {
      const overdueDays = Math.abs(diffDays);
      return {
        text: `Quá hạn ${overdueDays === 0 ? '1' : overdueDays} ngày`,
        isOverdue: true,
        color: '#e11d48',
        bg: '#fff1f2'
      };
    } else if (diffDays === 0) {
      return {
        text: 'Đến hạn hôm nay',
        isOverdue: false,
        color: '#ea580c',
        bg: '#fff7ed'
      };
    } else {
      return {
        text: `Còn ${diffDays} ngày`,
        isOverdue: false,
        color: '#0284c7',
        bg: '#f0f9ff'
      };
    }
  };

  // Thống kê đếm số lượng hồ sơ theo từng trạng thái
  const counts = useMemo(() => {
    let waitingAssignment = 0;
    let sent = 0;
    let approved = 0;
    let rejected = 0;
    let overdue = 0;

    paymentDocuments.forEach(doc => {
      const effStatus = getEffectivePaymentStatus(doc);
      if (effStatus === PAYMENT_STATUS.APPROVED) approved++;
      else if (effStatus === PAYMENT_STATUS.REJECTED) rejected++;
      else if (
        effStatus === PAYMENT_STATUS.OVERDUE_ASSIGNMENT ||
        effStatus === PAYMENT_STATUS.OVERDUE_REVIEW ||
        effStatus === PAYMENT_STATUS.OVERDUE ||
        effStatus === PAYMENT_STATUS.OVERDUE_TVGS ||
        effStatus === PAYMENT_STATUS.OVERDUE_INVESTOR
      ) overdue++;
      else if (effStatus === PAYMENT_STATUS.WAITING_ASSIGNMENT) waitingAssignment++;
      else sent++;
    });

    return {
      total: paymentDocuments.length,
      waitingAssignment,
      sent,
      approved,
      rejected,
      overdue
    };
  }, [paymentDocuments]);

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
    // Bổ sung từ paymentDocuments nếu có
    (paymentDocuments || []).forEach(d => {
      const { projectName } = getDocHierarchyInfo(d);
      if (projectName && !list.some(x => x.name === projectName)) {
        list.push({ code: d.projectCode || projectName, name: projectName, id: projectName });
      }
    });
    return list;
  }, [projects, paymentDocuments]);

  // Danh sách Gói thầu (Level 2 - phụ thuộc vào Công trình nếu có chọn)
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
    // Bổ sung từ paymentDocuments
    (paymentDocuments || []).forEach(d => {
      const { projectName, packageName } = getDocHierarchyInfo(d);
      if (packageName && !list.some(x => x.name === packageName)) {
        if (selectedProject === 'ALL' || selectedProject === projectName || (projects || []).some(p => (p.code === selectedProject || p.id === selectedProject) && p.name === projectName)) {
          list.push({ id: packageName, name: packageName });
        }
      }
    });
    return list;
  }, [projects, paymentDocuments, selectedProject]);

  // Danh sách Hạng mục/Công tác (Level 3 - phụ thuộc vào Công trình & Gói thầu nếu có chọn)
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
    // Bổ sung từ paymentDocuments
    (paymentDocuments || []).forEach(d => {
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
  }, [projects, paymentDocuments, selectedProject, selectedPackage]);

  // Lọc danh sách hồ sơ
  const filteredDocuments = useMemo(() => {
    return paymentDocuments.filter(doc => {
      const { projectName: docProjName, packageName: docPkgName, itemName: docItemName } = getDocHierarchyInfo(doc);

      // 1. Lọc theo text search (tên hồ sơ, mã số, người tạo, loại hồ sơ, công trình, gói thầu, hạng mục)
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
        const effStatus = getEffectivePaymentStatus(doc);
        if (selectedStatus === PAYMENT_STATUS.OVERDUE) {
          const isOverdue = 
            effStatus === PAYMENT_STATUS.OVERDUE_TVGS ||
            effStatus === PAYMENT_STATUS.OVERDUE_INVESTOR ||
            effStatus === PAYMENT_STATUS.OVERDUE || 
            effStatus === PAYMENT_STATUS.OVERDUE_ASSIGNMENT || 
            effStatus === PAYMENT_STATUS.OVERDUE_REVIEW;
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

      // 7. Lọc theo Hạng mục / Công tác
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
  }, [paymentDocuments, searchTerm, selectedDate, selectedStatus, selectedType, selectedProject, selectedPackage, selectedItem, projectOptions]);

  return (
    <div className="payment-documents-view" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. HEADER & METRIC SUMMARY CARDS */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CreditCard size={26} color="#059669" />
            Hồ Sơ Thanh Toán
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Quản lý, phân công cán bộ, giám sát tiến độ thẩm định hồ sơ Tạm ứng, Thanh toán & Quyết toán
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
          onClick={() => setSelectedStatus(PAYMENT_STATUS.WAITING_ASSIGNMENT)}
          style={{
            background: '#ffffff',
            border: selectedStatus === PAYMENT_STATUS.WAITING_ASSIGNMENT ? '2px solid #f59e0b' : '1px solid #e2e8f0',
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
          onClick={() => setSelectedStatus(PAYMENT_STATUS.SENT)}
          style={{
            background: '#ffffff',
            border: selectedStatus === PAYMENT_STATUS.SENT ? '2px solid #2563eb' : '1px solid #e2e8f0',
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
          onClick={() => setSelectedStatus(PAYMENT_STATUS.APPROVED)}
          style={{
            background: '#ffffff',
            border: selectedStatus === PAYMENT_STATUS.APPROVED ? '2px solid #059669' : '1px solid #e2e8f0',
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
          onClick={() => setSelectedStatus(PAYMENT_STATUS.REJECTED)}
          style={{
            background: '#ffffff',
            border: selectedStatus === PAYMENT_STATUS.REJECTED ? '2px solid #dc2626' : '1px solid #e2e8f0',
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
          onClick={() => setSelectedStatus(PAYMENT_STATUS.OVERDUE)}
          style={{
            background: '#ffffff',
            border: selectedStatus === PAYMENT_STATUS.OVERDUE ? '2px solid #e11d48' : '1px solid #e2e8f0',
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

      {/* 2. THANH TÌM KIẾM & BỘ LỌC (HÀNG 1 + HÀNG 2 PHÂN CẤP CÔNG TRÌNH - GÓI THẦU - CÔNG TÁC) */}
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
        {/* HÀNG 1: TÌM KIẾM, NGÀY, TRẠNG THÁI */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '12px'
        }}>
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
          <div style={{ flex: '1 1 160px', position: 'relative' }}>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              title="Lọc theo ngày tạo hồ sơ"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: selectedDate ? '1.5px solid #0284c7' : '1.5px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.86rem',
                color: selectedDate ? '#0369a1' : '#334155',
                background: selectedDate ? '#f0f9ff' : '#fff',
                fontWeight: selectedDate ? 600 : 400,
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
                border: selectedStatus !== 'ALL' ? '1.5px solid #0284c7' : '1.5px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.86rem',
                color: selectedStatus !== 'ALL' ? '#0369a1' : '#334155',
                background: selectedStatus !== 'ALL' ? '#f0f9ff' : '#fff',
                fontWeight: selectedStatus !== 'ALL' ? 600 : 400,
                outline: 'none',
                cursor: 'pointer',
                boxSizing: 'border-box'
              }}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value={PAYMENT_STATUS.WAITING_ASSIGNMENT}>Chờ phân công (24h)</option>
              <option value={PAYMENT_STATUS.SENT}>Đang thẩm định</option>
              <option value={PAYMENT_STATUS.APPROVED}>Đã xác nhận</option>
              <option value={PAYMENT_STATUS.REJECTED}>Cần sửa</option>
              <option value={PAYMENT_STATUS.OVERDUE}>Tất cả hồ sơ Chậm</option>
              <option value={PAYMENT_STATUS.OVERDUE_TVGS}>⚠️ TVGS Chậm</option>
              <option value={PAYMENT_STATUS.OVERDUE_INVESTOR}>⚠️ Ban QLDA Chậm</option>
            </select>
          </div>
        </div>

        {/* HÀNG 2: PHÂN CẤP CÔNG TRÌNH - GÓI THẦU - HẠNG MỤC / CÔNG TÁC */}
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

          {/* LỌC THEO HẠNG MỤC CÔNG VIỆC / CÔNG TÁC */}
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
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <RotateCcw size={14} />
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
            <CreditCard size={42} color="#cbd5e1" style={{ marginBottom: '10px' }} />
            <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', color: '#334155' }}>Không tìm thấy hồ sơ thanh toán nào</h4>
            <p style={{ margin: 0, fontSize: '0.84rem' }}>
              Chưa có hồ sơ phù hợp với điều kiện tìm kiếm. Nhấn <strong>"+ Tạo Hồ Sơ"</strong> để lập hồ sơ mới.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#475569', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  <th style={{ padding: '12px 16px', minWidth: '220px' }}>Tên Hồ Sơ Thanh Toán</th>
                  <th style={{ padding: '12px 14px', minWidth: '150px' }}>Ngày Gửi</th>
                  <th style={{ padding: '12px 14px', minWidth: '130px' }}>Trạng Thái</th>
                  <th style={{ padding: '12px 16px', minWidth: '170px' }}>Tư Vấn Giám Sát</th>
                  <th style={{ padding: '12px 16px', minWidth: '170px' }}>Ban QLDA</th>
                  <th style={{ padding: '12px 14px', minWidth: '130px' }}>Hạn Phản Hồi</th>
                  <th style={{ padding: '12px 16px', minWidth: '110px', textAlign: 'center' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc, idx) => {
                  const effectiveStatus = getEffectivePaymentStatus(doc);
                  const badgeConfig = getPaymentStatusBadgeConfig(effectiveStatus);
                  const slaInfo = getSlaRemainingInfo(doc);
                  const { projectName: docProjName, packageName: docPkgName, itemName: docItemName } = getDocHierarchyInfo(doc);

                  const tvgsUser = doc.assignedTvgs?.assignee || (doc.assignedTvgs?.uid ? doc.assignedTvgs : null);
                  const isTvgsAssigned = Boolean(tvgsUser?.uid);

                  const investorUser = doc.assignedInvestor?.assignee || (doc.assignedInvestor?.uid ? doc.assignedInvestor : null);
                  const isInvestorAssigned = Boolean(investorUser?.uid);

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
                      {/* TÊN HỒ SƠ */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <div style={{ marginTop: '2px' }}>
                            <FileText size={18} color="#0284c7" />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem', lineHeight: 1.35 }}>
                              {doc.title}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '1px 6px', borderRadius: '4px', background: '#e0f2fe', color: '#0369a1' }}>
                                {doc.docCode || 'HSTT'}
                              </span>
                              <span style={{ fontSize: '0.72rem', fontWeight: 500, padding: '1px 6px', borderRadius: '4px', background: '#f1f5f9', color: '#475569' }}>
                                {doc.typeName}
                              </span>
                              {(doc.pdfFile || (Array.isArray(doc.pdfFiles) && doc.pdfFiles.length > 0)) && (
                                <span
                                  title={`${doc.pdfFiles?.length || 1} tệp đính kèm`}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '0.7rem', color: '#2563eb', fontWeight: 600 }}
                                >
                                  <Paperclip size={11} /> Tệp {doc.pdfFiles?.length > 1 ? `(${doc.pdfFiles.length})` : ''}
                                </span>
                              )}
                              {Array.isArray(doc.photos) && doc.photos.length > 0 && (
                                <span title={`${doc.photos.length} ảnh đính kèm`} style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '0.7rem', color: '#059669', fontWeight: 600 }}>
                                  📷 {doc.photos.length}
                                </span>
                              )}
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

                      {/* NGÀY GỬI */}
                      <td style={{ padding: '12px 14px', color: '#334155', fontSize: '0.82rem' }}>
                        <div>{formatDateDisplay(doc.submittedAt || doc.createdAt)}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Bởi: {doc.createdByName || 'ĐVTC'}</div>
                      </td>

                      {/* TRẠNG THÁI */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          background: badgeConfig.bg,
                          color: badgeConfig.color,
                          border: `1px solid ${badgeConfig.border}`
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: badgeConfig.dotColor }} />
                          {badgeConfig.label}
                        </span>
                      </td>

                      {/* TÊN TVGS */}
                      <td style={{ padding: '12px 16px' }}>
                        {!isTvgsAssigned ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#b45309',
                            background: '#fffbeb',
                            border: '1px solid #fde68a',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.74rem',
                            fontWeight: 600
                          }}>
                            ⏳ Chờ TVGS Trưởng giao
                          </span>
                        ) : (
                          <div>
                            <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.84rem' }}>
                              {tvgsUser?.fullName || '---'}
                            </div>
                            <div style={{ fontSize: '0.72rem', marginTop: '2px' }}>
                              {doc.assignedTvgs?.status === 'ACCEPTED' ? (
                                <span style={{ color: '#15803d', fontWeight: 600 }}>✓ Đã xác nhận</span>
                              ) : doc.assignedTvgs?.status === 'REJECTED' ? (
                                <span style={{ color: '#b91c1c', fontWeight: 600 }}>✕ Yêu cầu sửa</span>
                              ) : (
                                <span style={{ color: '#0284c7' }}>⏳ Đang thẩm định</span>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* TÊN BAN QLDA */}
                      <td style={{ padding: '12px 16px' }}>
                        {!isInvestorAssigned ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#b45309',
                            background: '#fffbeb',
                            border: '1px solid #fde68a',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.74rem',
                            fontWeight: 600
                          }}>
                            ⏳ Chờ Trưởng Ban giao
                          </span>
                        ) : (
                          <div>
                            <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.84rem' }}>
                              {investorUser?.fullName || '---'}
                            </div>
                            <div style={{ fontSize: '0.72rem', marginTop: '2px' }}>
                              {doc.assignedInvestor?.status === 'ACCEPTED' ? (
                                <span style={{ color: '#15803d', fontWeight: 600 }}>✓ Đã xác nhận</span>
                              ) : doc.assignedInvestor?.status === 'REJECTED' ? (
                                <span style={{ color: '#b91c1c', fontWeight: 600 }}>✕ Yêu cầu sửa</span>
                              ) : doc.assignedTvgs?.status !== 'ACCEPTED' ? (
                                <span style={{ color: '#94a3b8' }}>⏳ Chờ TVGS duyệt trước</span>
                              ) : (
                                <span style={{ color: '#b45309', fontWeight: 600 }}>⏳ Chờ Ban QLDA duyệt</span>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* HẠN PHẢN HỒI (SLA) */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 7px',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          background: slaInfo.bg,
                          color: slaInfo.color
                        }}>
                          {slaInfo.text}
                        </span>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                          SLA: {doc.slaDays || 3} ngày
                        </div>
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

                          {(currentUser?.role === 'ADMIN' || currentUser?.isSuperAdmin || currentRole === 'ADMIN' || doc.createdByUid === currentUser?.uid) && onDeletePaymentDocument && (
                            <button
                              type="button"
                              title="Xóa hồ sơ này"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn hồ sơ "${doc.title}" (${doc.docCode}) không?`)) {
                                  onDeletePaymentDocument(doc.id);
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
