import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Info, HelpCircle, X } from 'lucide-react';

/**
 * ConfirmDialogModal - Modal xác nhận & thông báo tùy chỉnh chuẩn giao diện APCT
 * Thay thế 100% window.confirm và window.alert của trình duyệt
 */
export default function ConfirmDialogModal({
  isOpen,
  type = 'confirm', // 'danger' | 'warning' | 'info' | 'success' | 'confirm'
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  onConfirm,
  onCancel,
  loading = false
}) {
  // Lắng nghe phím ESC để đóng modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (onCancel) onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  // Cấu hình Icon & Màu sắc theo type
  const isDanger = type === 'danger';
  const isWarning = type === 'warning';
  const isSuccess = type === 'success';
  const isInfo = type === 'info';

  const getIconConfig = () => {
    if (isDanger) {
      return {
        icon: <AlertTriangle size={32} color="#dc2626" />,
        bg: '#fee2e2',
        border: '#fca5a5',
        confirmBtnBg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        confirmBtnShadow: '0 4px 12px rgba(220, 38, 38, 0.35)'
      };
    }
    if (isWarning) {
      return {
        icon: <AlertTriangle size={32} color="#d97706" />,
        bg: '#fef3c7',
        border: '#fcd34d',
        confirmBtnBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        confirmBtnShadow: '0 4px 12px rgba(217, 119, 6, 0.35)'
      };
    }
    if (isSuccess) {
      return {
        icon: <CheckCircle2 size={32} color="#059669" />,
        bg: '#d1fae5',
        border: '#6ee7b7',
        confirmBtnBg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        confirmBtnShadow: '0 4px 12px rgba(5, 150, 105, 0.35)'
      };
    }
    if (isInfo) {
      return {
        icon: <Info size={32} color="#2563eb" />,
        bg: '#dbeafe',
        border: '#93c5fd',
        confirmBtnBg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        confirmBtnShadow: '0 4px 12px rgba(37, 99, 235, 0.35)'
      };
    }
    // Default: confirm
    return {
      icon: <HelpCircle size={32} color="#4f46e5" />,
      bg: '#e0e7ff',
      border: '#a5b4fc',
      confirmBtnBg: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
      confirmBtnShadow: '0 4px 12px rgba(79, 70, 229, 0.35)'
    };
  };

  const config = getIconConfig();

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && onCancel) onCancel();
      }}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
          animation: 'scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative'
        }}
      >
        {/* Nút đóng góc phải */}
        <button
          onClick={onCancel}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Đóng"
        >
          <X size={18} />
        </button>

        <div style={{ padding: '28px 24px 20px 24px', textAlign: 'center' }}>
          {/* Icon Badge */}
          <div 
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: config.bg,
              border: `2px solid ${config.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}
          >
            {config.icon}
          </div>

          {/* Tiêu đề */}
          <h3 
            style={{
              fontSize: '1.15rem',
              fontWeight: 800,
              color: isDanger ? '#b91c1c' : '#0f172a',
              margin: '0 0 10px 0',
              lineHeight: 1.4
            }}
          >
            {title || (isDanger ? 'Xác Nhận Hành Động' : 'Thông Báo')}
          </h3>

          {/* Nội dung thông báo */}
          <div 
            style={{
              fontSize: '0.9rem',
              color: '#475569',
              lineHeight: 1.6,
              whiteSpace: 'pre-line',
              textAlign: 'left',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '12px 16px',
              maxHeight: '260px',
              overflowY: 'auto'
            }}
          >
            {message}
          </div>
        </div>

        {/* Nút hành động */}
        <div 
          style={{
            padding: '14px 24px 20px 24px',
            background: '#ffffff',
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            borderTop: '1px solid #f1f5f9'
          }}
        >
          {cancelText && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              style={{
                flex: 1,
                padding: '11px 18px',
                borderRadius: '10px',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: '#475569',
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: cancelText ? 1.3 : 1,
              padding: '11px 18px',
              borderRadius: '10px',
              fontSize: '0.9rem',
              fontWeight: 700,
              color: '#ffffff',
              background: config.confirmBtnBg,
              boxShadow: config.confirmBtnShadow,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {loading ? 'Đang xử lý...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
