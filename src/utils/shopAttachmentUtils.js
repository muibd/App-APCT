/**
 * Helper chia sẻ xử lý ảnh và tệp đính kèm cho Hồ sơ Bộ Phận Shop
 * (trình duyệt, nộp lại bản mới và yêu cầu chỉnh sửa).
 */

export const SHOP_ALLOWED_FILE_EXTENSIONS = [
  '.pdf', '.zip', '.rar', '.7z', '.tar', '.gz', '.doc', '.docx', '.xls', '.xlsx'
];

export const SHOP_FILE_ACCEPT =
  '.pdf,.zip,.rar,.7z,.tar,.gz,.doc,.docx,.xls,.xlsx,application/pdf,application/zip,application/x-zip-compressed,application/x-rar-compressed,application/vnd.rar';

export const MAX_INLINE_FILE_BYTES = 8 * 1024 * 1024; // >8MB: giữ rawFile upload trực tiếp lên Cloud Storage
export const MAX_FIRESTORE_STRING_LEN = 700000;

export function formatShopFileSize(bytes = 0) {
  const num = Number(bytes) || 0;
  const sizeMB = num / (1024 * 1024);
  return sizeMB >= 1 ? `${sizeMB.toFixed(2)} MB` : `${(num / 1024).toFixed(1)} KB`;
}

export function isAllowedShopFile(file) {
  if (!file || !file.name) return false;
  if (file.type === 'application/pdf') return true;
  const lower = String(file.name).toLowerCase();
  return SHOP_ALLOWED_FILE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function isPdfAttachment(name = '', dataUrl = '') {
  const lowerName = String(name || '').toLowerCase();
  const lowerUrl = String(dataUrl || '').toLowerCase();
  return lowerName.endsWith('.pdf') || lowerUrl.startsWith('data:application/pdf') || lowerUrl.includes('.pdf?');
}

export function isArchiveAttachment(name = '') {
  const lower = String(name || '').toLowerCase();
  return (
    lower.endsWith('.zip') ||
    lower.endsWith('.rar') ||
    lower.endsWith('.7z') ||
    lower.endsWith('.tar') ||
    lower.endsWith('.gz')
  );
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result || null);
    reader.onerror = () => reject(new Error(`Không thể đọc tệp "${file?.name || ''}"`));
    reader.readAsDataURL(file);
  });
}

/**
 * Kiểm tra định dạng và đọc danh sách tệp đính kèm người dùng chọn.
 */
export async function prepareShopAttachmentFiles(fileList) {
  const files = Array.from(fileList || []);
  const accepted = [];
  const rejected = [];

  for (const file of files) {
    if (!isAllowedShopFile(file)) {
      rejected.push(file);
      continue;
    }

    const formattedSize = formatShopFileSize(file.size);
    const id = `file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    if (file.size > MAX_INLINE_FILE_BYTES) {
      accepted.push({
        id,
        name: file.name,
        size: formattedSize,
        dataUrl: null,
        rawFile: file
      });
      continue;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      accepted.push({
        id,
        name: file.name,
        size: formattedSize,
        dataUrl,
        rawFile: file
      });
    } catch {
      accepted.push({
        id,
        name: file.name,
        size: formattedSize,
        dataUrl: null,
        rawFile: file
      });
    }
  }

  return { accepted, rejected };
}

/**
 * Nén và chuẩn hóa danh sách ảnh chọn từ máy / camera.
 */
export async function prepareShopPhotos(fileList, compressFn, defaultCaption = 'Ảnh hiện trường / bản vẽ') {
  const files = Array.from(fileList || []);
  const photos = [];
  for (const file of files) {
    const compressedUrl = await compressFn(file);
    if (!compressedUrl) continue;
    const now = new Date();
    const timeStr = `${now.toLocaleTimeString('vi-VN')} ngày ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
    photos.push({
      id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      url: compressedUrl,
      caption: file.name ? file.name.replace(/\.[^/.]+$/, '') : defaultCaption,
      time: timeStr
    });
  }
  return photos;
}

/**
 * Tải các tệp có rawFile lên Cloud Storage và loại bỏ tham chiếu File trước khi lưu state/Firestore.
 */
export async function uploadShopFilesToCloud(files = [], docCodePrefix, uploadFileFn) {
  const result = [];
  for (const f of Array.isArray(files) ? files : []) {
    if (!f) continue;
    let finalUrl = f.dataUrl || null;
    if (f.rawFile && typeof uploadFileFn === 'function') {
      try {
        const cloudUrl = await uploadFileFn(f.rawFile, docCodePrefix);
        if (cloudUrl) {
          finalUrl = cloudUrl;
        }
      } catch (err) {
        console.warn('[Shop Attachment] Lỗi upload file cloud, dùng dữ liệu cục bộ:', err);
      }
    }
    result.push({
      id: f.id,
      name: f.name,
      size: f.size,
      dataUrl: finalUrl
    });
  }
  return result;
}

/**
 * Tải các ảnh Base64 lên Cloud Storage (giữ nguyên URL mạng hoặc ảnh nén khi offline).
 */
export async function uploadShopPhotosToCloud(photos = [], metadata = {}, uploadBase64Fn) {
  const result = [];
  for (const p of Array.isArray(photos) ? photos : []) {
    if (!p) continue;
    let finalUrl = p.url;
    if (typeof p.url === 'string' && p.url.startsWith('data:image/') && typeof uploadBase64Fn === 'function') {
      try {
        const cloudUrl = await uploadBase64Fn(p.url, {
          ...metadata,
          caption: p.caption || '',
          time: p.time || ''
        });
        if (cloudUrl) {
          finalUrl = cloudUrl;
        }
      } catch (err) {
        console.warn('[Shop Attachment] Lỗi upload ảnh cloud, giữ ảnh nén cục bộ:', err);
      }
    }
    result.push({
      id: p.id,
      url: finalUrl,
      caption: p.caption || '',
      time: p.time || ''
    });
  }
  return result;
}

/**
 * Lược bỏ dataUrl quá lớn (>700KB) khỏi mảng tệp để không vượt giới hạn 1MB/tài liệu của Firestore.
 */
export function sanitizeOversizedShopFiles(files, maxLen = MAX_FIRESTORE_STRING_LEN) {
  if (!Array.isArray(files)) return files;
  return files.map((f) => {
    if (f && typeof f.dataUrl === 'string' && f.dataUrl.length > maxLen) {
      return {
        ...(f.id !== undefined ? { id: f.id } : {}),
        name: f.name || '',
        size: f.size || '',
        isStoredLocally: true
      };
    }
    return f;
  });
}

/**
 * Lược bỏ url base64 ảnh quá lớn (>700KB) nếu không thể nén nhỏ hoặc chưa tải lên Cloud Storage.
 */
export function sanitizeOversizedShopPhotos(photos, maxLen = MAX_FIRESTORE_STRING_LEN) {
  if (!Array.isArray(photos)) return photos;
  return photos.map((p) => {
    if (p && typeof p.url === 'string' && p.url.length > maxLen) {
      return {
        ...(p.id !== undefined ? { id: p.id } : {}),
        caption: p.caption || '',
        time: p.time || '',
        isStoredLocally: true
      };
    }
    return p;
  });
}
