# HƯỚNG DẪN CẤU HÌNH & KẾT NỐI CLOUD
## DỰ ÁN QUẢN LÝ NGHIỆM THU XÂY DỰNG (APCT)

---

Ứng dụng hiện tại đã được tích hợp đầy đủ kiến trúc:
1. **PWA (Progressive Web App):** Đã có `manifest.json`, icon app độ nét cao `512x512` và `192x192`, Service Worker chạy nền.
2. **Hệ thống Service tự động:** Tự động phát hiện nếu có file `.env` thì sẽ lưu dữ liệu trực tiếp lên **Google Cloud Firestore** và **Cloudinary**. Nếu chưa cấu hình, ứng dụng sẽ chạy ở chế độ **Demo Offline Mode** hoàn hảo mà không hề phát sinh lỗi.

---

### BƯỚC 1: CÁCH CÀI ĐẶT ỨNG DỤNG LÊN MÀN HÌNH ĐIỆN THOẠI (PWA)

#### Trên điện thoại Android (Chrome / Cốc Cốc):
1. Mở trình duyệt Chrome trên điện thoại, truy cập vào đường dẫn app (khi deploy lên hosting hoặc truy cập IP nội bộ máy tính qua cùng Wi-Fi: `http://[IP_MAY_TINH]:5173`).
2. Bấm vào biểu tượng **3 dấu chấm** ở góc trên bên phải trình duyệt.
3. Chọn **"Cài đặt ứng dụng"** (Install App) hoặc **"Thêm vào Màn hình chính"** (Add to Home screen).
4. Biểu tượng ứng dụng **APCT Nghiệm Thu** sẽ xuất hiện ngoài màn hình điện thoại như ứng dụng tải từ CH Play.

#### Trên điện thoại iPhone / iPad (Safari iOS):
1. Mở trình duyệt **Safari**, truy cập vào ứng dụng.
2. Bấm vào nút **Chia sẻ (Share)** (biểu tượng hình vuông có mũi tên hướng lên ở thanh công cụ dưới).
3. Cuộn xuống và chọn **"Thêm vào MH chính" (Add to Home Screen)**.
4. Bấm **Thêm (Add)** ở góc phải trên. Ứng dụng sẽ chạy toàn màn hình, mượt mà và nhận thông báo Web Push (từ iOS 16.4 trở lên).

---

### BƯỚC 2: CÁCH ĐIỀN THÔNG TIN FIREBASE & CLOUDINARY (KHI CẦN KẾT NỐI THẬT)

Trong thư mục dự án đã có sẵn file mẫu [`.env.example`](file:///c:/Users/Admin/Desktop/App%20APCT/.env.example). Bạn chỉ cần:

1. **Tạo file `.env`:** Copy nội dung từ `.env.example` và tạo file tên `.env` ngay tại thư mục gốc `c:\Users\Admin\Desktop\App APCT\.env`.
2. **Điền thông số Google Firebase:**
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy... (Lấy từ Firebase Console > Project Settings > Your apps)
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
   VITE_FIREBASE_APP_ID=1:1234567890:web:...
   VITE_FIREBASE_VAPID_KEY=BExampleKey_... (Lấy từ Project Settings > Cloud Messaging > Web Push certificates)
   ```
3. **Điền thông số Cloudinary:**
   ```env
   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name (Lấy từ Cloudinary Dashboard)
   VITE_CLOUDINARY_UPLOAD_PRESET=apct_unsigned (Tạo trong Cloudinary Settings > Upload > Add preset mode Unsigned)
   ```
4. Khi bạn lưu file `.env`, hệ thống Vite sẽ tự động nạp lại (Hot-reload) và chuyển sang lưu trữ đám mây thực tế 100%!
