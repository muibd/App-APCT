import React from 'react';
import { 
  X, 
  Share2, 
  PlusSquare, 
  BellRing, 
  AlertTriangle, 
  EyeOff, 
  Smartphone, 
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { isIOSDevice, isStandalonePWA } from '../services/notificationService';

export default function PushGuideModal({ isOpen, onClose, reason, onRetry }) {
  if (!isOpen) return null;

  const isIOS = isIOSDevice();
  const isStandalone = isStandalonePWA();
  const isDenied = reason === 'denied';
  const isIOSNeedsPWA = isIOS && !isStandalone;

  return (
    <div className="modal-overlay" style={{ zIndex: 200, padding: '16px' }} onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '520px', 
          borderRadius: '20px', 
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
          border: '1px solid #e2e8f0'
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div 
          className="modal-header" 
          style={{ 
            background: isDenied 
              ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)' 
              : 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)',
            borderBottom: isDenied ? '1px solid #fecaca' : '1px solid #cbd5e1',
            padding: '18px 20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div 
              style={{ 
                width: '42px', 
                height: '42px', 
                borderRadius: '12px', 
                background: isDenied ? '#ef4444' : '#2563eb', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: '#fff',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
              }}
            >
              {isDenied ? <AlertTriangle size={22} /> : <BellRing size={22} />}
            </div>
            <div>
              <h3 style={{ fontSize: '1.08rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                {isDenied 
                  ? 'Quyền Thông Báo Đã Bị Chặn' 
                  : isIOS 
                    ? 'Hướng Dẫn Bật Thông Báo Trên iPhone' 
                    : 'Hướng Dẫn Bật Thông Báo Đẩy'}
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0 0' }}>
                {isIOSNeedsPWA 
                  ? 'Apple iOS yêu cầu cài ứng dụng ra Màn hình chính' 
                  : 'Cần sự cho phép của thiết bị để nhận thông báo nghiệm thu'}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="modal-body" style={{ padding: '20px', maxHeight: '72vh', overflowY: 'auto' }}>
          
          {/* CẢNH BÁO TAB RIÊNG TƯ / ẨN DANH */}
          <div 
            style={{ 
              background: '#fffbeb', 
              border: '1.5px solid #fde68a', 
              borderRadius: '14px', 
              padding: '14px 16px', 
              marginBottom: '18px',
              display: 'flex',
              gap: '12px'
            }}
          >
            <div style={{ color: '#d97706', marginTop: '2px' }}>
              <EyeOff size={22} />
            </div>
            <div style={{ fontSize: '0.84rem', color: '#78350f', lineHeight: 1.5 }}>
              <strong style={{ color: '#92400e', display: 'block', marginBottom: '4px', fontSize: '0.88rem' }}>
                ⚠️ Bạn đang ở tab "Riêng tư" (Ẩn danh)?
              </strong>
              Trình duyệt <strong>Safari trên iPhone hoàn toàn khóa tính năng thông báo</strong> khi duyệt web ở chế độ Riêng tư (Private mode). Bạn vui lòng <strong>tắt tab Riêng tư và mở bằng tab thường</strong>.
            </div>
          </div>

          {/* HƯỚNG DẪN DÀNH CHO IPHONE (IOS PWA) */}
          {isIOSNeedsPWA && (
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Smartphone size={18} color="#2563eb" />
                <span>Quy định của Apple trên iPhone (iOS 16.4 trở lên):</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* BƯỚC 1 */}
                <div style={{ display: 'flex', gap: '12px', background: '#f8fafc', padding: '12px 14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#2563eb', color: '#fff', fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    1
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.5 }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Nhấn nút Chia sẻ (Share) ở Safari
                      <Share2 size={15} color="#2563eb" />
                    </div>
                    Nhấn vào biểu tượng ô vuông có mũi tên hướng lên <strong>(📤)</strong> ở thanh công cụ dưới đáy Safari (hoặc trên iPad ở góc trên).
                  </div>
                </div>

                {/* BƯỚC 2 */}
                <div style={{ display: 'flex', gap: '12px', background: '#f8fafc', padding: '12px 14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#2563eb', color: '#fff', fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    2
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.5 }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Chọn "Thêm vào MH chính" (Add to Home Screen)
                      <PlusSquare size={15} color="#059669" />
                    </div>
                    Cuộn bảng tùy chọn xuống, tìm và chạm vào dòng <strong>"Thêm vào Màn hình chính"</strong>, sau đó nhấn nút <strong>"Thêm"</strong> ở góc trên bên phải.
                  </div>
                </div>

                {/* BƯỚC 3 */}
                <div style={{ display: 'flex', gap: '12px', background: '#f8fafc', padding: '12px 14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#2563eb', color: '#fff', fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    3
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.5 }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Mở app trên Màn hình chính & Bật thông báo
                      <CheckCircle2 size={15} color="#16a34a" />
                    </div>
                    Thoát ra màn hình điện thoại, nhấn vào biểu tượng <strong>"APCT Nghiệm Thu"</strong> vừa được tạo. Tại đây vào lại mục này bấm <strong>"Bật Thông Báo"</strong> rồi chọn <strong>"Cho phép"</strong> (Allow).
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* HƯỚNG DẪN KHI BỊ CHẶN QUYỀN (DENIED) */}
          {isDenied && (
            <div style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.5 }}>
              <p style={{ margin: '0 0 10px 0' }}>
                Trình duyệt đã ghi nhớ lựa chọn <strong>"Chặn"</strong> quyền thông báo cho trang web này.
              </p>
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <strong style={{ display: 'block', marginBottom: '6px', color: '#0f172a' }}>Cách khắc phục:</strong>
                <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li>Nhấn vào biểu tượng ổ khóa hoặc cài đặt trang web cạnh thanh địa chỉ URL.</li>
                  <li>Tìm mục <strong>Thông báo (Notifications)</strong>.</li>
                  <li>Chuyển trạng thái từ <strong>Chặn (Block)</strong> sang <strong>Cho phép (Allow)</strong> hoặc <strong>Hỏi lại</strong>.</li>
                  <li>Tải lại trang và bấm nút "Bật Thông Báo".</li>
                </ol>
              </div>
            </div>
          )}

          {/* HƯỚNG DẪN KHI BỊ UNSUPPORTED HOẶC KHÁC */}
          {!isIOSNeedsPWA && !isDenied && (
            <div style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.5 }}>
              <p>
                Trình duyệt hiện tại không hỗ trợ Web Notification hoặc đang chạy trong ứng dụng nhúng (như Zalo, Facebook In-App Browser).
              </p>
              <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '10px' }}>
                Vui lòng mở trang web bằng trình duyệt chính thống: <strong>Safari</strong> (trên iOS) hoặc <strong>Google Chrome</strong> (trên Android / PC).
              </div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div 
          className="modal-footer" 
          style={{ 
            background: '#f8fafc', 
            padding: '14px 20px', 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: '10px' 
          }}
        >
          {onRetry && !isIOSNeedsPWA && (
            <button 
              type="button" 
              className="btn-secondary" 
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              onClick={onRetry}
            >
              Thử lại
            </button>
          )}
          <button 
            type="button" 
            className="btn-primary" 
            style={{ padding: '8px 20px', fontSize: '0.85rem' }}
            onClick={onClose}
          >
            Đã Hiểu
          </button>
        </div>
      </div>
    </div>
  );
}
