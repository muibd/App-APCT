import React, { useState } from 'react';
import {
  Clock, Plus, Edit2, Check, X, Trash2, Cloud, AlertCircle,
  FileSpreadsheet, Sparkles, Copy, CheckCheck
} from 'lucide-react';
import { DEFAULT_SHOP_SLA_CONFIGS } from '../data/shopDocumentConstants';

export default function ShopSlaManagementView({
  slaConfigs = DEFAULT_SHOP_SLA_CONFIGS,
  onSaveSlaConfigs,
  onSyncSlaToCloud,
  showAlert
}) {
  const [configs, setConfigs] = useState(slaConfigs);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ typeName: '', slaDays: 3, description: '' });

  // Form thêm loại mới
  const [isAdding, setIsAdding] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newSlaDays, setNewSlaDays] = useState(3);
  const [newDescription, setNewDescription] = useState('');

  // Trạng thái copy script
  const [copiedScript, setCopiedScript] = useState(false);

  // Bắt đầu sửa một loại hồ sơ
  const handleStartEdit = (cfg) => {
    setEditingId(cfg.id);
    setEditForm({
      typeName: cfg.typeName,
      slaDays: cfg.slaDays,
      description: cfg.description || ''
    });
  };

  // Lưu sửa
  const handleSaveEdit = (id) => {
    if (!editForm.typeName.trim()) {
      if (showAlert) showAlert({ type: 'warning', title: 'Thiếu tên', message: 'Tên loại hồ sơ không được để trống!' });
      return;
    }
    const days = Math.max(1, parseInt(editForm.slaDays, 10) || 1);
    const updated = configs.map(c => {
      if (c.id === id) {
        return {
          ...c,
          typeName: editForm.typeName.trim(),
          slaDays: days,
          description: editForm.description.trim()
        };
      }
      return c;
    });

    setConfigs(updated);
    setEditingId(null);
    if (onSaveSlaConfigs) onSaveSlaConfigs(updated);
    if (showAlert) showAlert({ type: 'success', title: 'Thành công', message: 'Đã cập nhật thời hạn phản hồi thành công!' });
  };

  // Thêm loại mới
  const handleAddNew = (e) => {
    e.preventDefault();
    if (!newTypeName.trim()) {
      if (showAlert) showAlert({ type: 'warning', title: 'Thiếu tên', message: 'Vui lòng nhập tên loại hồ sơ mới!' });
      return;
    }

    const typeCode = `TYPE_${Date.now().toString().slice(-6)}`;
    const newConfig = {
      id: `sla_${Date.now()}`,
      typeCode,
      typeName: newTypeName.trim(),
      slaDays: Math.max(1, parseInt(newSlaDays, 10) || 3),
      description: newDescription.trim() || 'Hồ sơ kỹ thuật bổ sung'
    };

    const updated = [...configs, newConfig];
    setConfigs(updated);
    setIsAdding(false);
    setNewTypeName('');
    setNewSlaDays(3);
    setNewDescription('');

    if (onSaveSlaConfigs) onSaveSlaConfigs(updated);
    if (showAlert) showAlert({ type: 'success', title: 'Thành công', message: `Đã thêm loại hồ sơ "${newConfig.typeName}" với hạn phản hồi ${newConfig.slaDays} ngày!` });
  };

  // Xóa loại hồ sơ
  const handleDelete = (id, name) => {
    if (configs.length <= 1) {
      if (showAlert) showAlert({ type: 'warning', title: 'Không thể xóa', message: 'Cần giữ ít nhất 1 loại hồ sơ trong hệ thống!' });
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa loại hồ sơ "${name}"?`)) {
      const updated = configs.filter(c => c.id !== id);
      setConfigs(updated);
      if (onSaveSlaConfigs) onSaveSlaConfigs(updated);
      if (showAlert) showAlert({ type: 'success', title: 'Đã xóa', message: `Đã xóa loại hồ sơ "${name}"!` });
    }
  };

  // Mã Google Apps Script mẫu cho trigger 5h sáng
  const googleAppsScriptCode = `/**
 * GOOGLE APPS SCRIPT - TỰ ĐỘNG CHẠY LÚC 5:00 SÁNG HÀNG NGÀY
 * Quét các Hồ sơ bộ phận Shop quá hạn phản hồi (SLA) và gửi thông báo đến 3 bên:
 * 1. Đơn Vị Thi Công (ĐVTC)
 * 2. Tư Vấn Giám Sát (TVGS)
 * 3. Ban Quản Lý Dự Án (Ban QLDA)
 */

function checkOverdueShopDocumentsDaily() {
  const FIRESTORE_PROJECT_ID = "YOUR_FIREBASE_PROJECT_ID";
  const FIRESTORE_API_KEY = "YOUR_API_KEY_OR_OAUTH";
  
  // 1. Lấy danh sách hồ sơ shop đang ở trạng thái 'SENT' (chưa hoàn tất duyệt / chưa hủy)
  const firestoreUrl = "https://firestore.googleapis.com/v1/projects/" + FIRESTORE_PROJECT_ID + "/databases/(default)/documents/shop_documents";
  
  const response = UrlFetchApp.fetch(firestoreUrl, {
    method: "get",
    muteHttpExceptions: true
  });
  
  const data = JSON.parse(response.getContentText());
  const now = new Date().getTime();
  
  if (!data.documents) return;
  
  data.documents.forEach(function(docItem) {
    const fields = docItem.fields;
    const status = fields.status ? fields.status.stringValue : 'SENT';
    
    // Chỉ kiểm tra hồ sơ đang chờ duyệt
    if (status === 'SENT') {
      const dueDateStr = fields.dueDate ? fields.dueDate.stringValue : null;
      if (dueDateStr) {
        const dueTime = new Date(dueDateStr).getTime();
        
        // Nếu quá hạn phản hồi
        if (now > dueTime) {
          const title = fields.title ? fields.title.stringValue : 'Hồ sơ shop';
          const docCode = fields.docCode ? fields.docCode.stringValue : 'HSS';
          const slaDays = fields.slaDays ? fields.slaDays.integerValue : 3;
          
          Logger.log("QUÁ HẠN: " + docCode + " - " + title + " (SLA: " + slaDays + " ngày)");
          
          // Gửi thông báo đến Webhook / FCM / OneSignal / Telegram cho 3 bên:
          // ĐVTC, TVGS và Ban QLDA
          sendOverdueAlertToThreeParties(docCode, title, slaDays);
        }
      }
    }
  });
}

function sendOverdueAlertToThreeParties(docCode, title, slaDays) {
  // Gửi thông báo cảnh báo quá hạn phản hồi
  Logger.log("Đã gửi cảnh báo quá hạn hồ sơ " + docCode + " đến TVGS, QLDA và ĐVTC");
}`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(googleAppsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
    if (showAlert) showAlert({ type: 'success', title: 'Đã sao chép', message: 'Đã copy mã Google Apps Script mẫu vào bộ nhớ tạm!' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* HEADER CARD */}
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#dcfce7', padding: '10px', borderRadius: '8px', color: '#15803d' }}>
            <Clock size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#14532d', fontWeight: 700 }}>
              Quản Lý Thời Hạn Phản Hồi (SLA) Hồ Sơ Bộ Phận Shop
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#166534' }}>
              Quy định số ngày xử lý tối đa cho từng loại hồ sơ. Quá thời hạn này, hệ thống tự động gán nhãn Chậm và phát cảnh báo đến 3 bên.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            style={{
              padding: '8px 14px',
              background: '#16a34a',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Plus size={15} /> Thêm loại hồ sơ
          </button>

          {onSyncSlaToCloud && (
            <button
              type="button"
              onClick={() => onSyncSlaToCloud(configs)}
              style={{
                padding: '8px 14px',
                background: '#ffffff',
                color: '#15803d',
                border: '1px solid #16a34a',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Cloud size={15} /> Đồng bộ Cloud
            </button>
          )}
        </div>
      </div>

      {/* FORM THÊM MỚI LOẠI HỒ SƠ */}
      {isAdding && (
        <form onSubmit={handleAddNew} style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>
            + Thêm Mới Loại Hồ Sơ & Thời Hạn Phản Hồi
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Tên loại hồ sơ <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="VD: Bản vẽ Shop cơ điện (MEP), Phương án cẩu lắp..."
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Số ngày phản hồi (SLA) <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={newSlaDays}
                  onChange={(e) => setNewSlaDays(e.target.value)}
                  style={{ width: '80px', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  required
                />
                <span style={{ fontSize: '0.84rem', color: '#475569' }}>ngày làm việc</span>
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
              Mô tả chi tiết / Tiêu chí kỹ thuật
            </label>
            <input
              type="text"
              placeholder="VD: Triển khai thi công hệ thống ống gió, cấp thoát nước và cứu hỏa..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              style={{ padding: '6px 14px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              Hủy
            </button>
            <button
              type="submit"
              style={{ padding: '6px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Lưu loại hồ sơ
            </button>
          </div>
        </form>
      )}

      {/* BẢNG DANH SÁCH CÁC LOẠI HỒ SƠ & NGÀY PHẢN HỒI */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 16px' }}>Loại Hồ Sơ Trình Duyệt</th>
              <th style={{ padding: '12px 16px', width: '220px' }}>Thời Hạn Phản Hồi (SLA)</th>
              <th style={{ padding: '12px 16px' }}>Mô Tả Áp Dụng</th>
              <th style={{ padding: '12px 16px', width: '140px', textAlign: 'center' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {configs.map(cfg => {
              const isEditing = editingId === cfg.id;

              return (
                <tr key={cfg.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  
                  {/* TÊN LOẠI HỒ SƠ */}
                  <td style={{ padding: '12px 16px' }}>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.typeName}
                        onChange={(e) => setEditForm(prev => ({ ...prev, typeName: e.target.value }))}
                        style={{ width: '100%', padding: '6px 10px', border: '1.5px solid #0284c7', borderRadius: '6px', fontSize: '0.86rem', boxSizing: 'border-box' }}
                      />
                    ) : (
                      <div>
                        <strong style={{ color: '#0f172a', fontSize: '0.88rem' }}>{cfg.typeName}</strong>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>Mã: {cfg.typeCode || cfg.id}</div>
                      </div>
                    )}
                  </td>

                  {/* THỜI HẠN PHẢN HỒI */}
                  <td style={{ padding: '12px 16px' }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={editForm.slaDays}
                          onChange={(e) => setEditForm(prev => ({ ...prev, slaDays: e.target.value }))}
                          style={{ width: '65px', padding: '6px 8px', border: '1.5px solid #0284c7', borderRadius: '6px', fontSize: '0.86rem' }}
                        />
                        <span style={{ fontSize: '0.82rem', color: '#475569' }}>ngày làm việc</span>
                      </div>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: '#f0fdf4',
                        color: '#166534',
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        border: '1px solid #bbf7d0'
                      }}>
                        <Clock size={14} /> {cfg.slaDays} ngày
                      </span>
                    )}
                  </td>

                  {/* MÔ TẢ */}
                  <td style={{ padding: '12px 16px', color: '#475569', fontSize: '0.82rem' }}>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        style={{ width: '100%', padding: '6px 10px', border: '1.5px solid #0284c7', borderRadius: '6px', fontSize: '0.84rem', boxSizing: 'border-box' }}
                      />
                    ) : (
                      cfg.description || '---'
                    )}
                  </td>

                  {/* THAO TÁC */}
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(cfg.id)}
                          title="Lưu thay đổi"
                          style={{ padding: '5px 8px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          title="Hủy"
                          style={{ padding: '5px 8px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(cfg)}
                          title="Chỉnh sửa tên và số ngày phản hồi"
                          style={{ padding: '5px 8px', background: '#f1f5f9', color: '#0284c7', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(cfg.id, cfg.typeName)}
                          title="Xóa loại hồ sơ"
                          style={{ padding: '5px 8px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '4px', cursor: 'pointer' }}
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

      {/* SECTION GOOGLE APPS SCRIPT CHO TRIGGER 5H SÁNG */}
      <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '10px', padding: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="#9333ea" />
            <strong style={{ fontSize: '0.92rem', color: '#581c87' }}>
              Tự Động Quét & Báo Cáo Quá Hạn Hàng Ngày (Google Apps Script - 5:00 AM)
            </strong>
          </div>
          <button
            type="button"
            onClick={handleCopyScript}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              background: '#9333ea',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.76rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {copiedScript ? <CheckCheck size={14} /> : <Copy size={14} />}
            <span>{copiedScript ? 'Đã sao chép!' : 'Copy Code Script'}</span>
          </button>
        </div>

        <div style={{ fontSize: '0.82rem', color: '#6b21a8', lineHeight: 1.5, marginBottom: '12px' }}>
          Bạn có thể gắn mã Google Apps Script này vào <strong>script.google.com</strong> và đặt lịch <strong>Time-driven trigger: chạy mỗi ngày từ 5h00 đến 6h00 sáng</strong>. Nếu hồ sơ nào vượt quá số ngày SLA đã cấu hình ở trên mà TVGS hoặc Ban QLDA chưa xác nhận/hủy, script sẽ tự động gửi cảnh báo tới cả 3 bên!
        </div>

        <pre style={{
          background: '#1e1e2e',
          color: '#cdd6f4',
          padding: '12px 14px',
          borderRadius: '8px',
          fontSize: '0.74rem',
          maxHeight: '160px',
          overflowY: 'auto',
          margin: 0,
          fontFamily: 'Consolas, monospace'
        }}>
          {googleAppsScriptCode}
        </pre>
      </div>

    </div>
  );
}
