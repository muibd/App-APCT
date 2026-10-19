import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Bell, BellOff, X, CheckCheck, Trash2, ArrowRight, 
  AlertTriangle, CheckCircle2, Clock, Send, FileText 
} from 'lucide-react';

export default function NotificationDropdown({
  isOpen,
  onClose,
  notifications = [],
  onMarkAllAsRead,
  onMarkAsRead,
  onDeleteNotification,
  onClearAllNotifications,
  onSelectNotification
}) {
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        if (e.target.closest('.btn-icon-badge')) return;
        onClose();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotifIcon = (type) => {
    switch (type) {
      case 'REJECTION':
        return {
          icon: AlertTriangle,
          bg: '#fee2e2',
          color: '#dc2626',
          border: '#fca5a5'
        };
      case 'APPROVAL':
        return {
          icon: CheckCircle2,
          bg: '#d1fae5',
          color: '#059669',
          border: '#a7f3d0'
        };
      case 'INVITATION':
        return {
          icon: Send,
          bg: '#dbeafe',
          color: '#2563eb',
          border: '#bfdbfe'
        };
      default:
        return {
          icon: Bell,
          bg: '#f1f5f9',
          color: '#475569',
          border: '#e2e8f0'
        };
    }
  };

  const modalContent = (
    <div className="notif-wrapper-backdrop" onClick={onClose}>
      <div
        ref={dropdownRef}
        className="notif-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* DRAG HANDLE FOR MOBILE */}
        <div className="notif-drag-bar">
          <div className="sheet-drag-pill" />
        </div>

        {/* HEADER */}
        <div className="notif-header">
          <div className="notif-header-left">
            <Bell size={18} color="#2563eb" />
            <span className="notif-header-title">Thông Báo</span>
          </div>

          <div className="notif-header-right">
            {unreadCount > 0 && (
              <button
                type="button"
                className="notif-mark-read-btn"
                onClick={onMarkAllAsRead}
                title="Đánh dấu tất cả là đã đọc"
              >
                <CheckCheck size={15} />
                <span>Đã đọc tất cả</span>
              </button>
            )}

            <button
              type="button"
              className="notif-close-btn"
              onClick={onClose}
              aria-label="Đóng thông báo"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* LIST OF NOTIFICATIONS */}
        <div className="notif-list">
          {notifications.length === 0 ? (
            <div style={{
              padding: '48px 20px',
              textAlign: 'center',
              color: '#64748b'
            }}>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: '#f1f5f9',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
                color: '#94a3b8'
              }}>
                <BellOff size={26} />
              </div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#1e293b' }}>
                Không có thông báo mới
              </div>
              <p style={{ fontSize: '0.82rem', margin: '4px 0 0 0', color: '#94a3b8' }}>
                Khi có phiếu nghiệm thu mới hoặc biên bản phản hồi, thông báo sẽ xuất hiện tại đây.
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const styleMeta = getNotifIcon(notif.type);
              const Icon = styleMeta.icon;

              return (
                <div
                  key={notif.id}
                  className={`notif-card-item ${!notif.isRead ? 'unread' : ''}`}
                  onClick={() => {
                    if (!notif.isRead && onMarkAsRead) onMarkAsRead(notif.id);
                    if (onSelectNotification) onSelectNotification(notif);
                    onClose();
                  }}
                >
                  {/* ICON */}
                  <div 
                    className="notif-icon-badge"
                    style={{
                      background: styleMeta.bg,
                      color: styleMeta.color,
                      border: `1px solid ${styleMeta.border}`
                    }}
                  >
                    <Icon size={18} />
                  </div>

                  {/* CONTENT */}
                  <div className="notif-card-content">
                    <div className="notif-card-title-row">
                      <span className="notif-card-title">
                        {notif.title}
                      </span>
                      {!notif.isRead && (
                        <span style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: '#2563eb',
                          flexShrink: 0
                        }} />
                      )}
                    </div>

                    <p className="notif-card-body">
                      {notif.body}
                    </p>

                    <div className="notif-card-footer">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        <span>{notif.time || 'Vừa xong'}</span>
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {(notif.targetReportId || notif.targetRequestId) && (
                          <span className="notif-action-chip">
                            <span>{notif.targetReportId ? 'Xem biên bản' : 'Xem phiếu'}</span>
                            <ArrowRight size={11} />
                          </span>
                        )}

                        <button
                          type="button"
                          className="notif-delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onDeleteNotification) onDeleteNotification(notif.id);
                          }}
                          title="Xóa thông báo này"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER */}
        {notifications.length > 0 && (
          <div className="notif-footer-bar">
            <span>Tổng cộng {notifications.length} thông báo</span>
            <button
              type="button"
              className="notif-clear-all-btn"
              onClick={onClearAllNotifications}
            >
              <Trash2 size={13} />
              <span>Xóa tất cả</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
}
