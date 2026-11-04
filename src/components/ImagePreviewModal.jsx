import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, 
  RotateCcw, Download, MapPin, Clock, User, Maximize2 
} from 'lucide-react';

/**
 * Modal xem ảnh phóng to toàn màn hình (Lightbox)
 * Hỗ trợ:
 * - Phóng to / Thu nhỏ (Zoom In/Out) lên tới 400%
 * - Kéo rê ảnh (Pan) khi đã phóng to
 * - Xoay ảnh 90° từng bước
 * - Chuyển qua lại giữa danh sách ảnh (Prev / Next, vuốt cảm ứng trên điện thoại, phím mũi tên)
 * - Hiển thị đầy đủ thông tin: Chú thích, Tọa độ GPS, Thời gian chụp, Người chụp
 * - Tải ảnh gốc về máy
 */
export default function ImagePreviewModal({
  isOpen,
  onClose,
  photos = [],
  initialIndex = 0
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Touch swipe handling
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });

  // Chuẩn hóa danh sách ảnh (chấp nhận cả mảng object {url, caption...} hoặc mảng string url)
  const normalizedPhotos = React.useMemo(() => {
    if (!Array.isArray(photos)) return [];
    return photos.map((item, idx) => {
      if (typeof item === 'string') {
        return {
          id: `photo_${idx}`,
          url: item,
          caption: `Hình ảnh #${idx + 1}`
        };
      }
      return {
        id: item?.id || `photo_${idx}`,
        url: item?.url || item?.src || '',
        caption: item?.caption || item?.note || `Hình ảnh #${idx + 1}`,
        gps: item?.gps || '',
        time: item?.time || item?.timestamp || '',
        photographer: item?.photographer || item?.createdByName || ''
      };
    }).filter(p => Boolean(p.url));
  }, [photos]);

  // Đồng bộ index khi mở modal hoặc thay đổi initialIndex
  useEffect(() => {
    if (isOpen) {
      const validIndex = Math.max(0, Math.min(initialIndex, normalizedPhotos.length - 1));
      setCurrentIndex(validIndex);
      setScale(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, initialIndex, normalizedPhotos.length]);

  // Reset zoom & pan khi đổi ảnh
  const resetTransform = useCallback(() => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handlePrev = useCallback(() => {
    if (normalizedPhotos.length <= 1) return;
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : normalizedPhotos.length - 1));
    resetTransform();
  }, [normalizedPhotos.length, resetTransform]);

  const handleNext = useCallback(() => {
    if (normalizedPhotos.length <= 1) return;
    setCurrentIndex(prev => (prev < normalizedPhotos.length - 1 ? prev + 1 : 0));
    resetTransform();
  }, [normalizedPhotos.length, resetTransform]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.35, 4));
  };

  const handleZoomOut = () => {
    setScale(prev => {
      const next = Math.max(prev - 0.35, 0.7);
      if (next <= 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleToggleZoom = () => {
    if (scale > 1.2) {
      resetTransform();
    } else {
      setScale(2.2);
    }
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        handleZoomOut();
      } else if (e.key === '0') {
        resetTransform();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePrev, handleNext, onClose, resetTransform]);

  // Mouse drag when zoomed
  const handleMouseDown = (e) => {
    if (scale <= 1) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch swipe & drag handling on mobile
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };
      if (scale > 1) {
        setIsDragging(true);
        dragStartRef.current = {
          x: touch.clientX - position.x,
          y: touch.clientY - position.y
        };
      }
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && scale > 1 && isDragging) {
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragStartRef.current.x,
        y: touch.clientY - dragStartRef.current.y
      });
    }
  };

  const handleTouchEnd = (e) => {
    if (scale > 1) {
      setIsDragging(false);
      return;
    }
    if (e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;

      // Vuốt ngang > 50px trong < 400ms -> Chuyển ảnh
      if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 60 && deltaTime < 400) {
        if (deltaX > 0) {
          handlePrev();
        } else {
          handleNext();
        }
      }
    }
  };

  if (!isOpen || normalizedPhotos.length === 0) return null;

  const currentPhoto = normalizedPhotos[currentIndex] || normalizedPhotos[0];

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(10, 15, 29, 0.96)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
        overflow: 'hidden'
      }}
      onMouseUp={handleMouseUp}
    >
      {/* HEADER / TOOLBAR */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          background: 'rgba(15, 23, 42, 0.85)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#ffffff',
          zIndex: 10
        }}
      >
        {/* Số thứ tự ảnh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ 
            background: '#2563eb', 
            color: '#fff', 
            fontSize: '0.82rem', 
            fontWeight: 700, 
            padding: '3px 10px', 
            borderRadius: '6px' 
          }}>
            ẢNH #{currentIndex + 1} / {normalizedPhotos.length}
          </span>
          <span style={{ 
            fontSize: '0.85rem', 
            color: '#cbd5e1', 
            maxWidth: '320px', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap' 
          }}>
            {currentPhoto.caption}
          </span>
        </div>

        {/* Nút điều khiển zoom, xoay, tải về, đóng */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Thu nhỏ (-)"
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              padding: '7px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ZoomOut size={18} />
          </button>

          <button
            type="button"
            onClick={handleToggleZoom}
            title={scale > 1 ? "Về 100%" : "Phóng to 200%"}
            style={{
              background: scale > 1 ? '#2563eb' : 'rgba(255, 255, 255, 0.12)',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              padding: '6px 10px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {Math.round(scale * 100)}%
          </button>

          <button
            type="button"
            onClick={handleZoomIn}
            title="Phóng to (+)"
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              padding: '7px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ZoomIn size={18} />
          </button>

          <button
            type="button"
            onClick={handleRotate}
            title="Xoay ảnh 90°"
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              padding: '7px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <RotateCw size={18} />
          </button>

          <a
            href={currentPhoto.url}
            target="_blank"
            rel="noopener noreferrer"
            download={`anh_nghiem_thu_${currentIndex + 1}.jpg`}
            title="Tải ảnh gốc về máy"
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              padding: '7px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none'
            }}
          >
            <Download size={18} />
          </a>

          <button
            type="button"
            onClick={onClose}
            title="Đóng (Esc)"
            style={{
              background: '#ef4444',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              padding: '7px 12px',
              marginLeft: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
          >
            <X size={18} />
            <span>Đóng</span>
          </button>
        </div>
      </div>

      {/* VIEWPORT HIỂN THỊ ẢNH CHÍNH */}
      <div 
        style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleToggleZoom}
      >
        <img
          src={currentPhoto.url}
          alt={currentPhoto.caption}
          draggable={false}
          style={{
            maxWidth: scale > 1 ? 'none' : '92%',
            maxHeight: scale > 1 ? 'none' : '82vh',
            objectFit: 'contain',
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.18s ease-out',
            boxShadow: '0 20px 45px rgba(0,0,0,0.6)',
            borderRadius: scale === 1 ? '8px' : '0'
          }}
        />

        {/* Nút lùi ảnh (◀) */}
        {normalizedPhotos.length > 1 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            title="Ảnh trước (Phím mũi tên trái)"
            style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '50%',
              width: '46px',
              height: '46px',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              zIndex: 20
            }}
          >
            <ChevronLeft size={28} />
          </button>
        )}

        {/* Nút tiến ảnh (▶) */}
        {normalizedPhotos.length > 1 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            title="Ảnh tiếp theo (Phím mũi tên phải)"
            style={{
              position: 'absolute',
              right: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '50%',
              width: '46px',
              height: '46px',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              zIndex: 20
            }}
          >
            <ChevronRight size={28} />
          </button>
        )}
      </div>

      {/* FOOTER: GPS, THỜI GIAN, CHÚ THÍCH & DANH SÁCH THUMBNAIL */}
      <div 
        style={{
          background: 'rgba(15, 23, 42, 0.92)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '12px 18px',
          color: '#ffffff',
          zIndex: 10
        }}
      >
        {/* Thông tin chi tiết ảnh */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
          <div>
            <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
              {currentPhoto.caption || 'Ảnh nghiệm thu hiện trường'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', fontSize: '0.78rem', color: '#94a3b8' }}>
              {currentPhoto.gps && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#60a5fa' }}>
                  <MapPin size={13} />
                  <span>GPS: {currentPhoto.gps}</span>
                </div>
              )}
              {currentPhoto.time && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#34d399' }}>
                  <Clock size={13} />
                  <span>{currentPhoto.time}</span>
                </div>
              )}
              {currentPhoto.photographer && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#cbd5e1' }}>
                  <User size={13} />
                  <span>Người chụp: {currentPhoto.photographer}</span>
                </div>
              )}
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            * Nhấn đúp để phóng to • Kéo rê để di chuyển • Vuốt sang ngang để xem ảnh tiếp
          </div>
        </div>

        {/* Thanh dải thumbnail nhỏ ở dưới cùng */}
        {normalizedPhotos.length > 1 && (
          <div 
            style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              paddingTop: '6px',
              paddingBottom: '2px',
              maxWidth: '100%'
            }}
          >
            {normalizedPhotos.map((p, idx) => {
              const isSelected = idx === currentIndex;
              return (
                <button
                  key={p.id || idx}
                  type="button"
                  onClick={() => {
                    setCurrentIndex(idx);
                    resetTransform();
                  }}
                  style={{
                    border: isSelected ? '2px solid #3b82f6' : '2px solid transparent',
                    opacity: isSelected ? 1 : 0.6,
                    borderRadius: '6px',
                    padding: 0,
                    background: 'transparent',
                    cursor: 'pointer',
                    flexShrink: 0,
                    width: '54px',
                    height: '42px',
                    overflow: 'hidden',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <img
                    src={p.url}
                    alt={p.caption}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
