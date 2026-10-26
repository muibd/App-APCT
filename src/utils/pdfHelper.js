// ============================================================================
// PDF HELPER UTILITIES - XỬ LÝ XEM VÀ TẢI TỆP PDF AN TOÀN
// Giải quyết dứt điểm các lỗi của trình duyệt khi tải hoặc mở tệp PDF:
// 1. Chuyển đổi Base64 / DataURL sang Blob nhị phân chuẩn 'application/pdf'
// 2. Tự động kiểm tra và thêm đuôi mở rộng .pdf nếu thiếu
// 3. Tải tệp xuống máy tính đúng định dạng tài liệu PDF, Windows mở bằng Acrobat/Edge 100%
// 4. Mở trực tiếp trong tab mới bằng trình xem PDF tích hợp của trình duyệt (Chrome PDF Viewer)
// ============================================================================

import { fetchPdfBlobFromStorage } from '../services/storageService';

/**
 * Chuyển đổi chuỗi Base64 / DataURL thành Blob nhị phân chuẩn 'application/pdf'
 * @param {string} dataUrlOrBase64 
 * @returns {Blob|null}
 */
export function dataUrlToPdfBlob(dataUrlOrBase64) {
  if (!dataUrlOrBase64 || typeof dataUrlOrBase64 !== 'string') return null;

  try {
    let base64String = dataUrlOrBase64;
    
    // Nếu có tiền tố data:...;base64,
    if (dataUrlOrBase64.includes(',')) {
      base64String = dataUrlOrBase64.split(',')[1];
    }

    // Loại bỏ khoảng trắng hoặc ký tự xuống dòng
    base64String = base64String.replace(/\s/g, '');

    // Giải mã Base64 sang chuỗi nhị phân
    const byteCharacters = atob(base64String);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    // Luôn ép kiểu MIME chính xác là application/pdf
    return new Blob([byteArray], { type: 'application/pdf' });
  } catch (err) {
    console.error('[pdfHelper] Lỗi chuyển đổi Base64 sang PDF Blob:', err);
    return null;
  }
}

/**
 * Tải tệp PDF về máy tính người dùng đúng chuẩn định dạng file .pdf
 * Đảm bảo: LUÔN TẢI XUỐNG MÁY, TUYỆT ĐỐI KHÔNG BỊ MỞ RA TAB MỚI!
 * @param {string} pdfSource - DataURL, Base64 hoặc URL mạng (Firebase Storage)
 * @param {string} fileName - Tên tệp mong muốn khi lưu
 */
export async function downloadPdfFile(pdfSource, fileName = 'Ho_so_shop.pdf') {
  if (!pdfSource) {
    console.warn('[pdfHelper] Không có nguồn tệp PDF để tải về.');
    return false;
  }

  // Đảm bảo tên file luôn có đuôi .pdf
  let cleanName = (fileName || 'Ho_so_shop.pdf').trim();
  if (!cleanName.toLowerCase().endsWith('.pdf')) {
    cleanName += '.pdf';
  }

  let pdfBlob = null;

  // 1. Trường hợp là DataURL hoặc Base64 -> chuyển đổi Blob tức thì trong bộ nhớ
  if (pdfSource.startsWith('data:') || pdfSource.startsWith('JVBERi')) {
    pdfBlob = dataUrlToPdfBlob(pdfSource);
  }

  // 2. Trường hợp là URL mạng từ xa (Firebase Cloud Storage: https://firebasestorage.googleapis.com/...)
  if (!pdfBlob && (pdfSource.startsWith('http://') || pdfSource.startsWith('https://'))) {
    // Ưu tiên 1: Tải trực tiếp dữ liệu nhị phân qua Firebase SDK (vượt qua hoàn toàn lỗi CORS của trình duyệt)
    try {
      pdfBlob = await fetchPdfBlobFromStorage(pdfSource);
    } catch (e) {
      console.warn('[pdfHelper] fetchPdfBlobFromStorage không thành công:', e);
    }

    // Ưu tiên 2: Thử fetch thông thường
    if (!pdfBlob) {
      try {
        const response = await fetch(pdfSource);
        if (response.ok) {
          const blobData = await response.blob();
          pdfBlob = new Blob([blobData], { type: 'application/pdf' });
        }
      } catch (fetchErr) {
        console.warn('[pdfHelper] Fetch trực tiếp bị hạn chế CORS:', fetchErr);
      }
    }
  }

  // 3. Nếu đã lấy được Blob nhị phân -> Tải file sạch sẽ bằng Blob URL
  if (pdfBlob) {
    const blobUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', cleanName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
    return true;
  }

  // 4. Fallback trường hợp đặc biệt không thể tạo Blob: dùng iframe ẩn để kích hoạt tải mà KHÔNG nhảy tab
  try {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = pdfSource;
    document.body.appendChild(iframe);
    setTimeout(() => {
      try { document.body.removeChild(iframe); } catch {}
    }, 15000);
    return true;
  } catch (err) {
    console.error('[pdfHelper] Lỗi fallback tải file:', err);
    return false;
  }
}

/**
 * Mở tệp PDF trực tiếp trong tab mới của trình duyệt
 * @param {string} pdfSource - DataURL, Base64 hoặc URL mạng (Firebase Storage)
 * @param {string} fileName - Tên tệp
 */
export async function openPdfInNewTab(pdfSource, fileName = 'Ho_so_shop.pdf') {
  if (!pdfSource) return false;

  // 1. Nếu là URL mạng từ xa (Firebase Storage) -> mở trực tiếp tab mới
  if (pdfSource.startsWith('http://') || pdfSource.startsWith('https://')) {
    window.open(pdfSource, '_blank');
    return true;
  }

  // 2. Nếu là DataURL hoặc Base64 -> chuyển Blob rồi mở tab mới bằng PDF Reader của trình duyệt
  const blob = dataUrlToPdfBlob(pdfSource);
  if (blob) {
    const blobUrl = URL.createObjectURL(blob);
    const win = window.open(blobUrl, '_blank');
    if (!win) {
      console.warn('[pdfHelper] Trình duyệt chặn popup tab mới, chuyển sang tải tệp');
      downloadPdfFile(pdfSource, fileName);
    }
    setTimeout(() => URL.revokeObjectURL(blobUrl), 180000);
    return true;
  }

  return false;
}
