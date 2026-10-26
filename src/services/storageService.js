// ============================================================================
// GOOGLE FIREBASE STORAGE SERVICE - LƯU TRỮ ẢNH HIỆN TRƯỜNG & CHỨNG TỪ
// Lưu trữ trực tiếp trên Google Cloud Storage của dự án app-apct-nghiemthu
// ============================================================================

import { storage, isFirebaseConfigured } from './firebase';
import { ref, uploadBytes, getDownloadURL, getBytes } from 'firebase/storage';

/**
 * Tải ảnh nghiệm thu hiện trường lên Google Firebase Storage
 * @param {File|Blob} file - Tệp ảnh hoặc ảnh chụp từ camera
 * @param {Object} metadata - Thông tin công trình, tọa độ GPS, thời gian
 */
export const uploadEvidenceImage = async (file, metadata = {}) => {
  // Nếu chưa có kết nối Firebase -> Trả về URL blob cục bộ
  if (!isFirebaseConfigured || !storage) {
    console.log('[Firebase Storage Demo] Tạo URL ảnh cục bộ cho demo.');
    return {
      url: URL.createObjectURL(file),
      secure_url: URL.createObjectURL(file),
      public_id: `demo_${Date.now()}`,
      gps: metadata.gps || "10.0076° N, 105.7823° E (P. Thường Thạnh, TP. Cần Thơ)",
      time: metadata.time || new Date().toLocaleString('vi-VN'),
      caption: metadata.caption || "Kiểm tra hiện trường công trình"
    };
  }

  try {
    const timestamp = Date.now();
    const cleanFileName = file.name ? file.name.replace(/[^a-zA-Z0-9.]/g, '_') : `photo_${timestamp}.jpg`;
    const folderPath = `evidence/${metadata.projectId || 'general'}/${timestamp}_${cleanFileName}`;
    
    const storageRef = ref(storage, folderPath);
    
    // Gắn metadata tùy chỉnh vào file Google Cloud Storage
    const customMetadata = {
      customMetadata: {
        gps: metadata.gps || "10.0076° N, 105.7823° E",
        time: metadata.time || new Date().toLocaleString('vi-VN'),
        caption: metadata.caption || "",
        projectId: metadata.projectId || ""
      }
    };

    const snapshot = await uploadBytes(storageRef, file, customMetadata);
    const downloadUrl = await getDownloadURL(snapshot.ref);

    console.log('[Firebase Storage] Tải ảnh lên Google Cloud thành công:', downloadUrl);

    return {
      url: downloadUrl,
      secure_url: downloadUrl,
      fullPath: snapshot.metadata.fullPath,
      gps: metadata.gps || "10.0076° N, 105.7823° E",
      time: metadata.time || new Date().toLocaleString('vi-VN'),
      caption: metadata.caption || ""
    };
  } catch (error) {
    console.error('[Firebase Storage Upload Error]', error);
    throw error;
  }
};

/**
 * Tải tệp PDF Hồ sơ Shop lên Google Cloud Firebase Storage
 * @param {File|Blob} file - File PDF từ thẻ input
 * @param {string} docCode - Mã hồ sơ (VD: HSS-123456)
 * @returns {Promise<string|null>} - Download URL trực tiếp trên Firebase Cloud Storage
 */
export const uploadPdfDocument = async (file, docCode = 'shop_doc') => {
  if (!isFirebaseConfigured || !storage) {
    console.log('[Firebase Storage Demo] Chưa bật Firebase Storage, lưu fallback dataUrl');
    return null;
  }

  try {
    const timestamp = Date.now();
    const cleanFileName = file.name ? file.name.replace(/[^a-zA-Z0-9._-]/g, '_') : `doc_${timestamp}.pdf`;
    const folderPath = `shop_documents/${docCode}/${timestamp}_${cleanFileName}`;
    const storageRef = ref(storage, folderPath);

    const customMetadata = {
      contentType: 'application/pdf',
      customMetadata: {
        originalName: file.name || 'document.pdf',
        docCode,
        uploadedAt: new Date().toISOString()
      }
    };

    // Thêm timeout 1.2 giây để tránh làm chậm trải nghiệm người dùng nếu Cloud Storage chưa mở quyền
    const uploadPromise = uploadBytes(storageRef, file, customMetadata);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firebase Storage timeout (1.2s) - Lưu trữ nội bộ an toàn')), 1200)
    );
    const snapshot = await Promise.race([uploadPromise, timeoutPromise]);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    console.log('[Firebase Storage] Đã tải tài liệu PDF lên Cloud Storage:', downloadUrl);
    return downloadUrl;
  } catch (error) {
    console.warn('[Firebase Storage PDF] Sử dụng lưu trữ PDF nội bộ (offline resilient):', error.message || error);
    return null;
  }
};

/**
 * Tải trực tiếp dữ liệu nhị phân (Blob) của tệp PDF từ Firebase Storage
 * Hoạt động 100% qua Firebase SDK, không bị lỗi CORS của trình duyệt
 * @param {string} urlOrPath - Download URL hoặc đường dẫn file
 * @returns {Promise<Blob|null>}
 */
export const fetchPdfBlobFromStorage = async (urlOrPath) => {
  if (!isFirebaseConfigured || !storage || !urlOrPath) return null;
  try {
    const storageRef = ref(storage, urlOrPath);
    const buffer = await getBytes(storageRef);
    return new Blob([buffer], { type: 'application/pdf' });
  } catch (err) {
    console.warn('[Firebase Storage] Lỗi lấy blob qua getBytes:', err);
    return null;
  }
};
