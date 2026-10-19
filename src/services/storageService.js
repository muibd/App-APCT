// ============================================================================
// GOOGLE FIREBASE STORAGE SERVICE - LƯU TRỮ ẢNH HIỆN TRƯỜNG & CHỨNG TỪ
// Lưu trữ trực tiếp trên Google Cloud Storage của dự án app-apct-nghiemthu
// ============================================================================

import { storage, isFirebaseConfigured } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
