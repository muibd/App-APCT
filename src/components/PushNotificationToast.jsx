import React, { useEffect } from 'react';
import { Bell, X, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function PushNotificationToast({ notification, onClose, onAction }) {
  if (!notification) return null;

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 8000);
    return () => clearTimeout(timer);
  }, [notification, onClose]);

  const isWarning = notification.type === 'REJECTION' || notification.title?.includes('Từ chối');
  const isSuccess = notification.type === 'APPROVAL' || notification.title?.includes('Đồng ý');

  return (
    <div className="push-toast-container">
      <div className="push-toast-card" style={{
        borderColor: isWarning ? '#ef4444' : isSuccess ? '#10b981' : '#3b82f6',
        boxShadow: isWarning 
          ? '0 10px 30px rgba(239, 68, 68, 0.25)' 
          : isSuccess 
          ? '0 10px 30px rgba(16, 185, 129, 0.25)' 
          : '0 10px 30px rgba(37, 99, 235, 0.25)'
      }}>
        <div className="push-toast-header">
          <div className="push-toast-app-info">
            {isWarning ? <AlertTriangle size={15} color="#ef4444" /> : isSuccess ? <CheckCircle2 size={15} color="#10b981" /> : <Bell size={15} color="#60a5fa" />}
            <span style={{ color: isWarning ? '#fca5a5' : isSuccess ? '#6ee7b7' : '#93c5fd' }}>
              Thông báo hệ thống (FCM Push) • Vừa xong
            </span>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="push-toast-title">
          {notification.title}
        </div>

        <div className="push-toast-body">
          {notification.body}
        </div>

        {notification.actionText && (
          <button 
            className="push-toast-action-btn"
            style={{
              background: isWarning ? '#dc2626' : isSuccess ? '#059669' : '#2563eb'
            }}
            onClick={() => {
              if (onAction) onAction(notification);
              onClose();
            }}
          >
            <span>{notification.actionText}</span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
