// ============================================================================
// DỮ LIỆU CÁN BỘ & TÀI KHOẢN HỆ THỐNG QUẢN LÝ NGHIỆM THU (APCT)
// Chuẩn hóa theo dự án thực tế: Chung cư nhà ở xã hội 2 - An Phú Eco City
// Đồng bộ chính xác theo các danh sách nhân sự chính thức:
// 1. Chủ đầu tư: Công ty TNHH An Phú Cần Thơ (File: 20251001. ĐK mẫu chữ ký ban QLDA.xls)
// 2. Tư vấn giám sát: Công ty CP TVXD & TM GELICON (File: DANH SACH TV.xlsx)
// 3. Đơn vị thi công: Công ty CP Xây dựng An Phú Gia (File: ĐANH SÁCH THÔNG TIN CÁ NHÂN.xlsx)
// 4. Đơn vị thi công: Công ty TNHH Tư vấn Thiết kế Bình Hoà (Bổ sung mới)
// ============================================================================

export const MOCK_USERS = [
  {
    "uid": "uid_admin_01",
    "fullName": "Nguyễn Thị Kim Chung - Chủ tịch HĐQT",
    "role": "ADMIN",
    "company": "Chủ Đầu Tư APCT",
    "position": "Chủ Đầu Tư (CĐT)",
    "avatar": "SC",
    "phone": "0901.888.001",
    "email": "schung@apct.vn",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_admin_02",
    "fullName": "Vương Xuân Vũ - Giám đốc",
    "role": "ADMIN",
    "company": "Chủ Đầu Tư APCT",
    "position": "Chủ Đầu Tư (CĐT)",
    "avatar": "SV",
    "phone": "0901.888.002",
    "email": "svu@apct.vn",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_admin_03",
    "fullName": "Phạm Minh Khánh - Phó giám đốc",
    "role": "ADMIN",
    "company": "Chủ Đầu Tư APCT",
    "position": "Chủ Đầu Tư (CĐT)",
    "avatar": "KH",
    "phone": "0901.888.003",
    "email": "khanh@apct.vn",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_admin_04",
    "fullName": "Mùi",
    "role": "ADMIN",
    "company": "Chủ Đầu Tư APCT",
    "position": "Chủ Đầu Tư (CĐT)",
    "avatar": "MU",
    "phone": "0901.888.004",
    "email": "mui@apct.vn",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_admin_05",
    "fullName": "Nhựt",
    "role": "ADMIN",
    "company": "Chủ Đầu Tư APCT",
    "position": "Chủ Đầu Tư (CĐT)",
    "avatar": "NH",
    "phone": "0901.888.005",
    "email": "nhut@apct.vn",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_cdt_01",
    "fullName": "Ngô Quý Linh",
    "role": "LEAD_INVESTOR",
    "leaderId": null,
    "subordinateIds": [
      "uid_cdt_02",
      "uid_cdt_03",
      "uid_cdt_04",
      "uid_cdt_05",
      "uid_cdt_06"
    ],
    "company": "Công ty cổ phần CONINCO Máy xây dựng và Công trình công nghiệp (CONINCO-MI)",
    "position": "Trưởng Ban QLDA",
    "avatar": "QL",
    "phone": "0982290673",
    "email": "linh.ngoquy@cncmi.vn",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_cdt_02",
    "fullName": "Nguyễn Thành Trung",
    "role": "INVESTOR",
    "leaderId": "uid_cdt_01",
    "company": "Công ty cổ phần CONINCO Máy xây dựng và Công trình công nghiệp (CONINCO-MI)",
    "position": "Cán bộ ban QLDA",
    "avatar": "TT",
    "phone": "0932989091",
    "email": "trungnguyenme1984@gmail.com",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_cdt_03",
    "fullName": "Phạm Tiến Hỷ",
    "role": "INVESTOR",
    "leaderId": "uid_cdt_01",
    "company": "Công ty cổ phần CONINCO Máy xây dựng và Công trình công nghiệp (CONINCO-MI)",
    "position": "Cán bộ ban QLDA",
    "avatar": "TH",
    "phone": "0968838488",
    "email": "phamtienhyctt@gmail.com",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_cdt_04",
    "fullName": "Nguyễn Văn Lóng",
    "role": "INVESTOR",
    "leaderId": "uid_cdt_01",
    "company": "Công ty cổ phần CONINCO Máy xây dựng và Công trình công nghiệp (CONINCO-MI)",
    "position": "Cán bộ ban QLDA",
    "avatar": "VL",
    "phone": "0966610640",
    "email": "vanlong.anphuct@gmail.com",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_cdt_05",
    "fullName": "Bành Nguyễn Hậu",
    "role": "INVESTOR",
    "leaderId": "uid_cdt_01",
    "company": "Công ty cổ phần CONINCO Máy xây dựng và Công trình công nghiệp (CONINCO-MI)",
    "position": "Cán bộ ban QLDA",
    "avatar": "NH",
    "phone": "0913635566",
    "email": "banhhau@yahoo.com.vn",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_cdt_06",
    "fullName": "Trần Nam Huân",
    "role": "INVESTOR",
    "leaderId": "uid_cdt_01",
    "company": "Công ty cổ phần CONINCO Máy xây dựng và Công trình công nghiệp (CONINCO-MI)",
    "position": "Cán bộ ban QLDA",
    "avatar": "NH",
    "phone": "0941906019",
    "email": "tranamhuan@gmail.com",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_tvgs_01",
    "fullName": "Đinh Xuân Thám",
    "role": "LEAD_SUPERVISOR",
    "leaderId": null,
    "subordinateIds": [
      "uid_tvgs_02",
      "uid_tvgs_03",
      "uid_tvgs_04",
      "uid_tvgs_05",
      "uid_tvgs_06",
      "uid_tvgs_07",
      "uid_tvgs_08"
    ],
    "company": "Công ty CP Tư vấn Xây dựng và Thương mại GELICON",
    "position": "Tư vấn giám sát trưởng",
    "avatar": "XT",
    "phone": "0904214957",
    "email": "tham.dinhxuan@gelicon.vn",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_tvgs_02",
    "fullName": "Nguyễn Đông Vũ",
    "role": "SUPERVISOR",
    "leaderId": "uid_tvgs_01",
    "company": "Công ty CP Tư vấn Xây dựng và Thương mại GELICON",
    "position": "Cán bộ tư vấn giám sát",
    "avatar": "ĐV",
    "phone": "0942569652",
    "email": "dongvug@gmail.com",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_tvgs_03",
    "fullName": "Đào Công Tùng",
    "role": "SUPERVISOR",
    "leaderId": "uid_tvgs_01",
    "company": "Công ty CP Tư vấn Xây dựng và Thương mại GELICON",
    "position": "Cán bộ tư vấn giám sát",
    "avatar": "CT",
    "phone": "0988323119",
    "email": "tung49c3@gmail.com",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_tvgs_04",
    "fullName": "Bành Nguyên Hoàng",
    "role": "SUPERVISOR",
    "leaderId": "uid_tvgs_01",
    "company": "Công ty CP Tư vấn Xây dựng và Thương mại GELICON",
    "position": "Cán bộ tư vấn giám sát",
    "avatar": "NH",
    "phone": "0939493698",
    "email": "banhnguyenhoang@gmail.com",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_tvgs_05",
    "fullName": "Kiều Đỗ Minh Luân",
    "role": "SUPERVISOR",
    "leaderId": "uid_tvgs_01",
    "company": "Công ty CP Tư vấn Xây dựng và Thương mại GELICON",
    "position": "Cán bộ tư vấn giám sát",
    "avatar": "ML",
    "phone": "0913510948",
    "email": "kdmluan@gmail.com",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_tvgs_06",
    "fullName": "Nguyễn Xuân Sang",
    "role": "SUPERVISOR",
    "leaderId": "uid_tvgs_01",
    "company": "Công ty CP Tư vấn Xây dựng và Thương mại GELICON",
    "position": "Cán bộ tư vấn giám sát",
    "avatar": "XS",
    "phone": "0373434453",
    "email": "xuansangnguyen19@gmail.com",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_tvgs_07",
    "fullName": "Võ Văn Tón",
    "role": "SUPERVISOR",
    "leaderId": "uid_tvgs_01",
    "company": "Công ty CP Tư vấn Xây dựng và Thương mại GELICON",
    "position": "Cán bộ tư vấn giám sát",
    "avatar": "VT",
    "phone": "0911986601",
    "email": "toncauduongic35@gmail.com",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_tvgs_08",
    "fullName": "Nguyễn Văn Thái",
    "role": "SUPERVISOR",
    "leaderId": "uid_tvgs_01",
    "company": "Công ty CP Tư vấn Xây dựng và Thương mại GELICON",
    "position": "Cán bộ tư vấn giám sát",
    "avatar": "VT",
    "phone": "0901009600",
    "email": "nvthai07y@gmail.com",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_dvtc_binhhoa_01",
    "fullName": "Phan Văn Khương",
    "role": "CONTRACTOR",
    "company": "Công ty TNHH Tư vấn Thiết kế Bình Hoà",
    "position": "Chỉ huy trưởng",
    "avatar": "VK",
    "phone": "0772728885",
    "email": "pkhuong03@gmail.com",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_dvtc_binhhoa_02",
    "fullName": "Nguyễn Hoàng Khiêm",
    "role": "CONTRACTOR",
    "company": "Công ty TNHH Tư vấn Thiết kế Bình Hoà",
    "position": "Chỉ huy phó",
    "avatar": "HK",
    "phone": "0788751914",
    "email": "oiracil014@gmail.com",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_dvtc_apg_01",
    "fullName": "Phạm Thanh Nhàn",
    "role": "CONTRACTOR",
    "company": "Công ty TNHH Gia Huy Vĩnh Phúc",
    "position": "Chỉ huy trưởng",
    "avatar": "TN",
    "phone": "0869266264",
    "email": "phamnhanktxd2014@gmail.com",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_dvtc_apg_02",
    "fullName": "Nguyễn Hoàng Bách",
    "role": "CONTRACTOR",
    "company": "Công ty TNHH Gia Huy Vĩnh Phúc",
    "position": "Kỹ thuật hiện trường",
    "avatar": "HB",
    "phone": "0939343486",
    "email": "hoangbach.ct@gmail.com",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_dvtc_apg_03",
    "fullName": "Nguyễn Phạm Mạnh Duy",
    "role": "CONTRACTOR",
    "company": "Công ty TNHH Gia Huy Vĩnh Phúc",
    "position": "Kỹ thuật hiện trường",
    "avatar": "MD",
    "phone": "0932093636",
    "email": "manhduyxd@gmail.com",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_dvtc_apg_04",
    "fullName": "Lê Bảo Khang",
    "role": "CONTRACTOR",
    "company": "Công ty TNHH Gia Huy Vĩnh Phúc",
    "position": "Kỹ thuật hiện trường",
    "avatar": "BK",
    "phone": "0981256942",
    "email": "khangib@apland.vn",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_dvtc_apg_05",
    "fullName": "Huỳnh Nguyên Khoa",
    "role": "CONTRACTOR",
    "company": "Công ty TNHH Gia Huy Vĩnh Phúc",
    "position": "Kỹ thuật hiện trường",
    "avatar": "NK",
    "phone": "0838776638",
    "email": "huynhkhoa792002@gmail.com",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_dvtc_apg_06",
    "fullName": "Trần Hoài Bảo",
    "role": "CONTRACTOR",
    "company": "Công ty TNHH Gia Huy Vĩnh Phúc",
    "position": "Kỹ thuật hiện trường",
    "avatar": "HB",
    "phone": "0373992929",
    "email": "baoth@apland.vn",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_dvtc_apg_07",
    "fullName": "Bùi Thanh Tiếng",
    "role": "CONTRACTOR",
    "company": "Công ty TNHH Gia Huy Vĩnh Phúc",
    "position": "Kỹ thuật hiện trường",
    "avatar": "TT",
    "phone": "0907923822",
    "email": "tiengbt@apland.vn",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_dvtc_apg_08",
    "fullName": "Phan Hoàng Huy",
    "role": "CONTRACTOR",
    "company": "Công ty TNHH Gia Huy Vĩnh Phúc",
    "position": "Kỹ thuật hiện trường",
    "avatar": "HH",
    "phone": "0971734011",
    "email": "huykgctu@gmail.com",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_dvtc_apg_09",
    "fullName": "Trần Gia Linh",
    "role": "CONTRACTOR",
    "company": "Công ty TNHH Gia Huy Vĩnh Phúc",
    "position": "Kỹ thuật hiện trường",
    "avatar": "GL",
    "phone": "0366937078",
    "email": "linhlinh2525n@gmail.com",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_dvtc_apg_10",
    "fullName": "Trương Minh Hiếu",
    "role": "CONTRACTOR",
    "company": "Công ty TNHH Gia Huy Vĩnh Phúc",
    "position": "Kỹ thuật hiện trường",
    "avatar": "MH",
    "phone": "0944144080",
    "email": "hieutm@apland.vn",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_dvtc_apg_11",
    "fullName": "Nguyễn Văn Đời",
    "role": "CONTRACTOR",
    "company": "Công ty TNHH Gia Huy Vĩnh Phúc",
    "position": "Kỹ thuật hiện trường",
    "avatar": "VĐ",
    "phone": "0945625261",
    "email": "nguyenvandoihg@gmail.com",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_dvtc_apg_12",
    "fullName": "Lâm Tự Hữu Duy",
    "role": "CONTRACTOR",
    "company": "Công ty TNHH Gia Huy Vĩnh Phúc",
    "position": "Kỹ thuật hiện trường",
    "avatar": "HD",
    "phone": "0846602068",
    "email": "huuduy.vn@gmail.com",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_dvtc_apg_13",
    "fullName": "Nguyễn Hoàng Kha",
    "role": "CONTRACTOR",
    "company": "Công ty TNHH Gia Huy Vĩnh Phúc",
    "position": "Kỹ thuật hiện trường",
    "avatar": "HK",
    "phone": "0327429936",
    "email": "nguyenhoangkha081104@gmail.com",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_dvtc_apg_14",
    "fullName": "Trần Thanh Huy",
    "role": "CONTRACTOR",
    "company": "Công ty TNHH Gia Huy Vĩnh Phúc",
    "position": "Kỹ thuật hiện trường",
    "avatar": "TH",
    "phone": "0389662427",
    "email": "thanhhuy.tran1806@gmail.com",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_dvtc_apg_15",
    "fullName": "Nguyễn Văn lĩnh",
    "role": "CONTRACTOR",
    "company": "Công ty TNHH Gia Huy Vĩnh Phúc",
    "position": "Kỹ thuật hiện trường",
    "avatar": "VL",
    "phone": "0866831870",
    "email": "linhnguyen19977777@gmail.com",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_dvtc_apg_16",
    "fullName": "Phan Nhật Hậu",
    "role": "CONTRACTOR",
    "company": "Công ty TNHH Gia Huy Vĩnh Phúc",
    "position": "Kỹ thuật hiện trường",
    "avatar": "NH",
    "phone": "0366118014",
    "email": "hau6656@gmail.com",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_dvtc_apg_17",
    "fullName": "Nguyễn Văn Huy",
    "role": "CONTRACTOR",
    "company": "Công ty TNHH Gia Huy Vĩnh Phúc",
    "position": "Kỹ thuật hiện trường",
    "avatar": "VH",
    "phone": "0765984259",
    "email": "nguyenvanhuy3141999@gmail.com",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_dvtc_apg_18",
    "fullName": "Dương Hoàng Khang",
    "role": "CONTRACTOR",
    "company": "Công ty TNHH Gia Huy Vĩnh Phúc",
    "position": "Kỹ thuật hiện trường",
    "avatar": "HK",
    "phone": "0945195646",
    "email": "duonghoangkhang03@gmail.com",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_dvtc_apg_19",
    "fullName": "Phan Trung Nghĩa",
    "role": "CONTRACTOR",
    "company": "Công ty TNHH Gia Huy Vĩnh Phúc",
    "position": "Kỹ thuật hiện trường",
    "avatar": "TN",
    "phone": "0907001906",
    "email": "nghiaphan871998@gmail.com",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_dvtc_apg_20",
    "fullName": "Trà Hoàng Anh",
    "role": "CONTRACTOR",
    "company": "Công ty TNHH Gia Huy Vĩnh Phúc",
    "position": "Kỹ thuật hiện trường",
    "avatar": "HA",
    "phone": "0842698168",
    "email": "hoanganh.vng12@gmail.com",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_dvtc_apg_21",
    "fullName": "Trần Văn Trung",
    "role": "CONTRACTOR",
    "company": "Công ty TNHH Gia Huy Vĩnh Phúc",
    "position": "Kỹ thuật hiện trường",
    "avatar": "VT",
    "phone": "0907135279",
    "email": "tranvtrung03kdd@gmail.com",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_dvtc_apg_22",
    "fullName": "Nguyễn Thanh Tuấn",
    "role": "CONTRACTOR",
    "company": "Công ty TNHH Gia Huy Vĩnh Phúc",
    "position": "Kỹ thuật hiện trường",
    "avatar": "TT",
    "phone": "0961015448",
    "email": "nguyenthanhtuan24122001@gmail.com",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_dvtc_ghvp_01",
    "fullName": "Trần Mạnh Hưng",
    "role": "CONTRACTOR",
    "company": "Công ty TNHH Gia Huy Vĩnh Phúc",
    "position": "Chỉ huy trưởng",
    "avatar": "MH",
    "phone": "0912345678",
    "email": "hungtm.giahuy@gmail.com",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_dvtc_ghvp_02",
    "fullName": "Lê Văn Kỹ Thuật",
    "role": "CONTRACTOR",
    "company": "Công ty TNHH Gia Huy Vĩnh Phúc",
    "position": "Kỹ thuật hiện trường",
    "avatar": "KT",
    "phone": "0912345679",
    "email": "thuatlv.giahuy@gmail.com",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_dvtc_ghvp_03",
    "fullName": "Nguyễn Văn QC",
    "role": "CONTRACTOR",
    "company": "Công ty TNHH Gia Huy Vĩnh Phúc",
    "position": "Nhân viên QA/QC",
    "avatar": "QC",
    "phone": "0912345680",
    "email": "qcvn.giahuy@gmail.com",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_dvtc_phanle_01",
    "fullName": "Đào Thanh Thảo",
    "role": "CONTRACTOR",
    "company": "Công ty TNHH Phát Triển Xây Dựng Phan Lê",
    "position": "Chỉ huy trưởng",
    "avatar": "TT",
    "phone": "0917355318",
    "email": "daothanhthao@gmail.com",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_dvtc_phanle_02",
    "fullName": "Lâm Ước Mơ",
    "role": "CONTRACTOR",
    "company": "Công ty TNHH Phát Triển Xây Dựng Phan Lê",
    "position": "Chỉ huy phó kiêm QS,QC",
    "avatar": "UM",
    "phone": "0379600330",
    "email": "molam200297@gmail.com",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_custom_1792999445622",
    "fullName": "Lo Thanh Cao",
    "role": "CONTRACTOR",
    "company": "Công ty TNHH Phát Triển Xây Dựng Phan Lê",
    "position": "Chỉ huy phó",
    "avatar": "TC",
    "phone": "0909094864",
    "email": "lothanhcao@gmail.com",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_custom_1792999632414",
    "fullName": "Phạm Duy Minh",
    "role": "CONTRACTOR",
    "company": "Công ty TNHH Phát Triển Xây Dựng Phan Lê",
    "position": "Cán bộ kỹ thuật",
    "avatar": "DM",
    "phone": "0332268561",
    "email": "minhpham06081999@gmail.com",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_custom_1792725029651",
    "fullName": "Minh Nhựt QC",
    "role": "CONTRACTOR",
    "company": "Công ty TNHH Gia Huy Vĩnh Phúc",
    "position": "Qc",
    "avatar": "MN",
    "phone": "0947016236",
    "email": "minhnhutbl96@gmail.com",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_custom_1792994756719",
    "fullName": "Hà Văn Thủy",
    "role": "CONTRACTOR",
    "company": "Công ty TNHH Gia Huy Vĩnh Phúc",
    "position": "Kỹ thuật hiện trường",
    "avatar": "VT",
    "phone": "0968686868",
    "email": "hathuyxd@gmail.com",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_custom_1792995066959",
    "fullName": "Trần Hậu Giang",
    "role": "CONTRACTOR",
    "company": "Công ty TNHH Gia Huy Vĩnh Phúc",
    "position": "Kỹ thuật hiện trường",
    "avatar": "HG",
    "phone": "0979797979",
    "email": "haugiangkysuxd@gmail.com",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_custom_1792573564813",
    "fullName": "Admin Khánh",
    "role": "ADMIN",
    "company": "Công ty TNHH An Phú Cần Thơ",
    "position": "Chủ Đầu Tư (CĐT)",
    "avatar": "KH",
    "phone": "0901888003",
    "email": "khanhpm@apland.vn",
    "password": "123456",
    "status": "ACTIVE"
  }
];

export const MOCK_PROJECT = {
  id: "proj_anphu_01",
  projectName: "Đầu tư Xây Dựng Nhà Ở Phường Thường Thạnh - An Phú Eco City",
  location: "Đường Trương Vĩnh Nguyên – Phường Cái Răng – Thành phố Cần Thơ",
  investor: "Công ty TNHH An Phú Cần Thơ",
  contractor: "Công ty CP Xây dựng An Phú Gia",
  supervisor: "Công ty CP Tư vấn Xây dựng và Thương mại GELICON",
  
  buildings: [
    {
      id: "bld_chungcu_02",
      code: "2203",
      name: "Chung cư nhà ở xã hội 2",
      items: [
        {
          id: "item_hoanthien_AB",
          name: "Thi công phần hoàn thiện Tòa A và Tòa B",
          tasks: [
            "Cốt thép, ván khuôn, bê tông",
            "Xây tường",
            "Trát tường",
            "Chống thấm",
            "Cán nền",
            "Ốp lát gạch",
            "Ốp lát đá",
            "Ốp bậc nhựa giả gỗ",
            "Lắp đặt trần thạch cao",
            "Bả matit",
            "Sơn lót, sơn hoàn thiện",
            "Lắp đặt lan can"
          ]
        },
        {
          id: "item_mep_AB",
          name: "Thi công hệ thống Mep Tòa A và Tòa B",
          tasks: [
            "Lắp đặt đường ống cấp thoát nước",
            "Lắp đặt thiết bị vệ sinh",
            "Lắp đặt ống luồn dây điện và kéo dây",
            "Lắp đặt tủ điện, thiết bị đóng cắt",
            "Lắp đặt hệ thống chiếu sáng",
            "Lắp đặt hệ thống hút mùi, thông gió"
          ]
        },
        {
          id: "item_cuago",
          name: "Cung cấp, lắp đặt cửa gỗ",
          tasks: [
            "Lắp đặt khuôn cửa gỗ",
            "Lắp đặt cánh cửa gỗ và phụ kiện khóa"
          ]
        },
        {
          id: "item_cuathep",
          name: "Cung cấp, lắp đặt cửa thép chống cháy",
          tasks: [
            "Lắp đặt khuôn cửa thép chống cháy",
            "Lắp đặt cánh cửa thép chống cháy và tay co thủy lực"
          ]
        },
        {
          id: "item_cuanhomkinh",
          name: "Cung cấp, lắp đặt cửa nhôm kính",
          tasks: [
            "Lắp đặt khung nhôm định hình",
            "Lắp đặt kính an toàn và phụ kiện"
          ]
        },
        {
          id: "item_pccc_2203",
          name: "Thi công hệ thống PCCC trong và ngoài nhà",
          tasks: [
            "Lắp đặt đường ống cấp nước chữa cháy vách tường",
            "Lắp đặt đầu phun Sprinkler",
            "Lắp đặt van báo động, trụ chữa cháy ngoài nhà",
            "Lắp đặt tủ trung tâm báo cháy và đầu báo khói/nhiệt",
            "Thử áp lực đường ống chữa cháy"
          ]
        }
      ]
    },
    {
      id: "bld_chungcu_caotang",
      code: "2204",
      name: "Chung cư nhà ở cao tầng",
      items: [
        {
          id: "item_mep_2204",
          name: "Thi công hệ thống Mep",
          tasks: [
            "Lắp đặt đường ống cấp thoát nước",
            "Lắp đặt thiết bị vệ sinh",
            "Lắp đặt ống luồn dây điện và kéo dây",
            "Lắp đặt tủ điện, thiết bị đóng cắt",
            "Lắp đặt hệ thống chiếu sáng"
          ]
        },
        {
          id: "item_pccc_2204",
          name: "Thi công hệ thống PCCC trong và ngoài nhà",
          tasks: [
            "Lắp đặt đường ống cấp nước chữa cháy vách tường",
            "Lắp đặt đầu phun Sprinkler",
            "Lắp đặt tủ trung tâm báo cháy và đầu báo khói/nhiệt",
            "Thử áp lực đường ống chữa cháy"
          ]
        }
      ]
    }
  ]
};

export const STANDARD_CRITERIA_LIST = [
  { id: "tcvn_5637", code: "TCVN 5637:1991", title: "Quản lý chất lượng xây lắp công trình xây dựng – Nguyên tắc cơ bản." },
  { id: "tcvn_9398", code: "TCVN 9398:2012", title: "Công tác trắc địa trong xây dựng công trình – Yêu cầu chung." },
  { id: "tcvn_4055", code: "TCVN 4055:2012", title: "Công trình xây dựng - Tổ chức thi công." },
  { id: "qcvn_18", code: "QCVN 18:2021/BXD", title: "Quy chuẩn kỹ thuật quốc gia về An toàn trong thi công xây dựng." },
  { id: "tcvn_5308", code: "TCVN 5308:1991", title: "Quy phạm kỹ thuật an toàn trong xây dựng." },
  { id: "tcvn_4453", code: "TCVN 4453:1995", title: "Kết cấu bê tông và bê tông cốt thép - Thi công và nghiệm thu." }
];

export const INITIAL_REQUESTS = [];

export const INITIAL_REPORTS = [];

export const INITIAL_NOTIFICATIONS = [];

export const INITIAL_DAILY_LOGS = [];

export const INITIAL_COMPLETION_REPORTS = [];
export const MOCK_COMPLETION_REPORTS = [];

/**
 * Lấy chuẩn xác Chỉ huy trưởng theo công ty nhà thầu (Đơn vị thi công)
 * - Tuyệt đối không lấy nhầm sang Chỉ huy phó hoặc Kỹ thuật hiện trường
 * - Luôn trả về position: 'Chỉ huy trưởng'
 * - Tự động tra cứu danh sách cán bộ thật (users), nếu chưa có thì ánh xạ theo các nhà thầu chính thức của dự án:
 *   + Công ty TNHH Gia Huy Vĩnh Phúc (hoặc An Phú Gia cũ): Phạm Thanh Nhàn (Chỉ huy trưởng)
 *   + Công ty TNHH Phát Triển Xây Dựng Phan Lê: Đào Thanh Thảo (Chỉ huy trưởng)
 *   + Công ty TNHH Tư vấn Thiết kế Bình Hoà: Phan Văn Khương (Chỉ huy trưởng)
 */
export function getContractorChief(companyName, usersList = []) {
  const cleanComp = (companyName || '').toLowerCase().trim();
  const pool = (Array.isArray(usersList) && usersList.length > 0) ? usersList : MOCK_USERS;

  // Lọc các cán bộ thuộc Đơn vị thi công và thuộc công ty tương ứng
  const contractorUsers = pool.filter(u => {
    if (u.role !== 'CONTRACTOR') return false;
    const uComp = (u.company || '').toLowerCase().trim();
    if (!cleanComp) return true;
    if (cleanComp.includes('gia huy') || cleanComp.includes('an phú gia')) {
      return uComp.includes('gia huy') || uComp.includes('an phú gia');
    }
    if (cleanComp.includes('phan lê')) {
      return uComp.includes('phan lê');
    }
    if (cleanComp.includes('bình hoà') || cleanComp.includes('bình hòa')) {
      return uComp.includes('bình hoà') || uComp.includes('bình hòa');
    }
    return uComp.includes(cleanComp) || cleanComp.includes(uComp);
  });

  // Tìm cán bộ giữ chức vụ CHỈ HUY TRƯỞNG (loại trừ tuyệt đối bất kỳ chức danh 'phó' nào)
  const chief = contractorUsers.find(u => {
    const pos = (u.position || '').toLowerCase().trim();
    if (pos.includes('phó')) return false;
    return pos.includes('chỉ huy trưởng') || (pos.includes('chỉ huy') && !pos.includes('phó'));
  });

  if (chief) {
    return {
      fullName: chief.fullName,
      position: 'Chỉ huy trưởng',
      uid: chief.uid,
      company: chief.company || companyName,
      phone: chief.phone,
      email: chief.email
    };
  }

  // Fallback chuẩn theo từng đơn vị thi công chính thức của dự án
  if (cleanComp.includes('phan lê')) {
    return {
      fullName: 'Đào Thanh Thảo',
      position: 'Chỉ huy trưởng',
      company: 'Công ty TNHH Phát Triển Xây Dựng Phan Lê',
      phone: '0917355318',
      email: 'daothanhthao@gmail.com'
    };
  }

  if (cleanComp.includes('bình hoà') || cleanComp.includes('bình hòa')) {
    return {
      fullName: 'Phan Văn Khương',
      position: 'Chỉ huy trưởng',
      company: 'Công ty TNHH Tư vấn Thiết kế Bình Hoà',
      phone: '0772728885',
      email: 'pkhuong03@gmail.com'
    };
  }

  // Mặc định là nhà thầu chính Gia Huy Vĩnh Phúc (hoặc các dự án thay thế An Phú Gia)
  return {
    fullName: 'Phạm Thanh Nhàn',
    position: 'Chỉ huy trưởng',
    company: 'Công ty TNHH Gia Huy Vĩnh Phúc',
    phone: '0869266264',
    email: 'phamnhanktxd2014@gmail.com'
  };
}
