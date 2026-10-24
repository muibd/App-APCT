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
    "fullName": "S Chung",
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
    "fullName": "S Vũ",
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
    "fullName": "Khánh",
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
    "company": "Công ty CP Xây dựng An Phú Gia",
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
    "company": "Công ty CP Xây dựng An Phú Gia",
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
    "company": "Công ty CP Xây dựng An Phú Gia",
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
    "company": "Công ty CP Xây dựng An Phú Gia",
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
    "company": "Công ty CP Xây dựng An Phú Gia",
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
    "company": "Công ty CP Xây dựng An Phú Gia",
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
    "company": "Công ty CP Xây dựng An Phú Gia",
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
    "company": "Công ty CP Xây dựng An Phú Gia",
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
    "company": "Công ty CP Xây dựng An Phú Gia",
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
    "company": "Công ty CP Xây dựng An Phú Gia",
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
    "company": "Công ty CP Xây dựng An Phú Gia",
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
    "company": "Công ty CP Xây dựng An Phú Gia",
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
    "company": "Công ty CP Xây dựng An Phú Gia",
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
    "company": "Công ty CP Xây dựng An Phú Gia",
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
    "company": "Công ty CP Xây dựng An Phú Gia",
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
    "company": "Công ty CP Xây dựng An Phú Gia",
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
    "company": "Công ty CP Xây dựng An Phú Gia",
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
    "company": "Công ty CP Xây dựng An Phú Gia",
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
    "company": "Công ty CP Xây dựng An Phú Gia",
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
    "company": "Công ty CP Xây dựng An Phú Gia",
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
    "company": "Công ty CP Xây dựng An Phú Gia",
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
    "company": "Công ty CP Xây dựng An Phú Gia",
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
    "fullName": "Phan Văn Lê",
    "role": "CONTRACTOR",
    "company": "Công ty TNHH Phát Triển và Xây Dựng Phan Lê",
    "position": "Chỉ huy trưởng",
    "avatar": "PL",
    "phone": "0987654321",
    "email": "lephan.phanle@gmail.com",
    "password": "123456",
    "status": "ACTIVE"
  },
  {
    "uid": "uid_dvtc_phanle_02",
    "fullName": "Trần Kỹ Thuật PCCC",
    "role": "CONTRACTOR",
    "company": "Công ty TNHH Phát Triển và Xây Dựng Phan Lê",
    "position": "Kỹ thuật hiện trường PCCC",
    "avatar": "PC",
    "phone": "0987654322",
    "email": "pccc.phanle@gmail.com",
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

export const INITIAL_DAILY_LOGS = [
  {
    id: "log_mock_01",
    logNumber: "01/NKTC-APG",
    bookNumber: "Quyển số: 01/2026",
    date: "2026-10-21",
    cityDateFormatted: "Cần Thơ, Ngày 21 tháng 10 năm 2026",
    projectName: "Đầu tư xây dựng nhà ở Phường Thường Thạnh- An Phú Eco City",
    buildingName: "Chung cư nhà ở xã hội 2",
    itemName: "Thi công phần kết cấu – Tòa A và Tòa B (Gói thầu số 02)",
    location: "Phường Thường Thạnh - Quận Cái Răng – TP. Cần Thơ.",
    investorName: "Công ty TNHH An Phú Cần Thơ",
    supervisorName: "Công ty CP Tư vấn xây dựng và Thương mại Gelicon",
    contractorName: "Công ty CP Xây dựng An Phú Gia",
    representatives: {
      investor: {
        representative: "Ngô Quý Linh",
        position: "Trưởng Ban QLDA"
      },
      supervisor: {
        representative: "Đinh Xuân Thám",
        position: "Tư vấn giám sát trưởng",
        officer: "Đỗ Văn Trường",
        officerPosition: "Cán bộ TVGS"
      },
      contractor: {
        leader: "Phạm Thanh Nhàn",
        leaderPosition: "Chỉ huy trưởng công trường",
        createdBy: "Phạm Thanh Nhàn",
        createdPosition: "Chỉ huy trưởng"
      }
    },
    weather: {
      morning: "NẮNG",
      morningHours: "7h - 11h",
      afternoon: "NẮNG",
      afternoonHours: "13h - 15h",
      evening: "TẠNH RÁO",
      eveningHours: "18h - 24h",
      note: "Thời tiết khô ráo, thuận lợi cho công tác bê tông."
    },
    manpower: {
      technical: "Phạm Thanh Nhàn (Chỉ huy trưởng)",
      workers: "38 công nhân (Đội ván khuôn: 16 người, Đội cốt thép: 14 người, Đội bê tông: 8 người)",
      otherPersonnel: [
        { uid: "uid_dvtc_apg_02", name: "Nguyễn Hoàng Bách", position: "Kỹ thuật hiện trường" }
      ]
    },
    equipment: "01 máy vận thăng nâng hàng 1000kg, 02 máy trộn bê tông 350L, 04 máy đầm dùi, 01 cần trục tháp 50m.",
    workContent: "Nghiệm thu ván khuôn cốt thép dầm sàn tầng 4 Tòa A trục 1-8; Đổ bê tông dầm sàn diện tích 380m2; Bảo dưỡng bê tông cột vách tầng 3.",
    safetyEnvironment: {
      status: "Bình thường",
      notes: "Công nhân tuân thủ nghiêm ngặt bảo hộ lao động; Lan can an toàn mép sàn được lắp đặt đầy đủ."
    },
    supervisorComments: "ĐVTC thi công đảm bảo biện pháp an toàn và kỹ thuật được duyệt. Yêu cầu duy trì tưới nước giữ ẩm bảo dưỡng sàn bê tông liên tục trong 7 ngày đầu.",
    investorComments: "Thống nhất với đánh giá của TVGS. Đề nghị nhà thầu tập trung vật tư cho phân đoạn tiếp theo.",
    contractorComments: "Đơn vị thi công nghiêm túc tiếp thu ý kiến của TVGS và CĐT, bố trí nhân lực tưới ẩm bảo dưỡng đúng quy trình.",
    status: "CONFIRMED",
    signatures: {
      contractor: {
        signed: true,
        name: "Phạm Thanh Nhàn",
        position: "Chỉ huy trưởng",
        signedAt: "2026-10-21T10:30:00.000Z"
      },
      supervisor: {
        signed: true,
        name: "Đinh Xuân Thám",
        position: "Tư vấn giám sát trưởng",
        signedAt: "2026-10-21T16:00:00.000Z"
      },
      investor: {
        signed: true,
        name: "Ngô Quý Linh",
        position: "Trưởng Ban QLDA",
        signedAt: "2026-10-21T16:05:00.000Z"
      }
    },
    createdAt: "2026-10-21T07:30:00.000Z",
    updatedAt: "2026-10-21T16:05:00.000Z",
    createdByUid: "uid_dvtc_apg_01",
    createdByName: "Phạm Thanh Nhàn",
    contractorCompany: "Công ty CP Xây dựng An Phú Gia"
  }
];

export const INITIAL_COMPLETION_REPORTS = [
  {
    id: "comp_mock_01",
    completionType: "STAGE",
    reportNumber: "02/BBNT-GDTC",
    referenceDocNumber: "TLCC-02/2026/APCT",
    date: "2026-10-20",
    cityDate: "Cần Thơ, Ngày 20 tháng 10 năm 2026",
    projectName: "Đầu tư xây dựng nhà ở Phường Thường Thạnh-An Phú Eco City",
    buildingName: "Chung cư nhà ở xã hội 2",
    itemName: "Thi công phần kết cấu – Tòa A và Tòa B",
    location: "Phường Thường Thạnh - Quận Cái Răng – Thành phố Cần Thơ",
    inspectionObject: "Nghiệm thu hoàn thành giai đoạn thi công: Phần kết cấu dầm sàn từ Tầng 1 đến Tầng 5 Tòa A và Tòa B",
    contractNumber: "0203/HĐXD/APCT-GHVP ký ngày 02 tháng 03 năm 2026",
    designApprovedDate: "15/01/2026",
    paymentBatch: "02",
    stageName: "Phần kết cấu dầm sàn từ Tầng 1 đến Tầng 5 Tòa A và Tòa B",
    mainMaterials: "Bê tông thương phẩm mác M300, M350; Cốt thép CB400-V, CB500-V Hòa Phát; Xi măng Insee; Cốp pha định hình phủ phim.",
    standardsApplied: [
      "TCVN 4453:1995: Kết cấu bê tông và bê tông cốt thép toàn khối - Quy phạm thi công và nghiệm thu",
      "TCVN 5637:1991: Quản lý chất lượng xây lắp công trình xây dựng - Nguyên tắc cơ bản",
      "QCVN 18:2021/BXD: Quy chuẩn kỹ thuật quốc gia về An toàn trong thi công xây dựng",
      "TCVN 9398:2012: Công tác trắc địa trong xây dựng công trình - Yêu cầu chung"
    ],
    time: {
      startTime: "08h30, ngày 20/10/2026",
      endTime: "11h00, ngày 20/10/2026",
      place: "Hiện trường Tòa A và Tòa B - Chung cư nhà ở xã hội 2"
    },
    representatives: {
      investor: {
        company: "Công ty TNHH An Phú Cần Thơ",
        leadName: "Ngô Quý Linh",
        leadPosition: "Trưởng Ban QLDA",
        officerName: "Nguyễn Thành Trung",
        officerPosition: "Cán bộ ban QLDA"
      },
      supervisor: {
        company: "Công ty CP Tư vấn Xây dựng và Thương mại GELICON",
        leadName: "Đinh Xuân Thám",
        leadPosition: "Tư vấn giám sát trưởng",
        officerName: "Đỗ Văn Trường",
        officerPosition: "Cán bộ TVGS"
      },
      contractor: {
        company: "Công ty CP Xây dựng An Phú Gia",
        leadName: "Phạm Thanh Nhàn",
        leadPosition: "Chỉ huy trưởng công trường",
        officerName: "Nguyễn Hoàng Bách",
        officerPosition: "Kỹ thuật hiện trường"
      }
    },
    status: "COMPLETED",
    signatures: {
      contractor: {
        signed: true,
        name: "Phạm Thanh Nhàn",
        position: "Chỉ huy trưởng",
        signedAt: "2026-10-20T08:30:00.000Z"
      },
      supervisor: {
        signed: true,
        name: "Đinh Xuân Thám",
        position: "Tư vấn giám sát trưởng",
        signedAt: "2026-10-20T10:45:00.000Z"
      },
      investor: {
        signed: true,
        name: "Ngô Quý Linh",
        position: "Trưởng Ban QLDA",
        signedAt: "2026-10-20T11:15:00.000Z"
      }
    },
    createdAt: "2026-10-20T08:00:00.000Z",
    updatedAt: "2026-10-20T11:15:00.000Z",
    createdByUid: "uid_dvtc_apg_01",
    createdByName: "Phạm Thanh Nhàn"
  },
  {
    id: "comp_mock_02",
    completionType: "PROJECT_USE",
    reportNumber: "01/BBNT-HTCT",
    referenceDocNumber: "TLCC-01/2026/APCT",
    date: "2026-10-22",
    cityDate: "Cần Thơ, Ngày 22 tháng 10 năm 2026",
    projectName: "Đầu tư xây dựng nhà ở Phường Thường Thạnh-An Phú Eco City",
    buildingName: "Dãy nhà phố liền kề thương mại LK-01",
    itemName: "Thi công phần xây thô và hoàn thiện mặt ngoài",
    location: "Phường Thường Thạnh - Quận Cái Răng – Thành phố Cần Thơ",
    inspectionObject: "Nghiệm thu hoàn thành hạng mục công trình đưa vào sử dụng: Toàn bộ hạng mục Xây thô & Hoàn thiện mặt ngoài Dãy LK-01 (Căn 01 đến 18)",
    contractNumber: "0203/HĐXD/APCT-GHVP",
    designApprovedDate: "15/01/2026",
    designChanges: "Được sự chấp thuận của CĐT và TVTK tại biên bản xử lý hiện trường số 01/BB-XLHT về cốt cao độ vỉa hè",
    authorityApprovals: "Biên bản kiểm tra nghiệm thu PCCC số 128/PCCC-CT của Phòng Cảnh sát PCCC TP. Cần Thơ; Báo cáo giám sát môi trường đạt tiêu chuẩn",
    standardsApplied: [
      "TCVN 4055:2012: Công trình xây dựng - Tổ chức thi công",
      "TCVN 5637:1991: Quản lý chất lượng xây lắp công trình xây dựng - Nguyên tắc cơ bản",
      "QCVN 18:2021/BXD: Quy chuẩn kỹ thuật quốc gia về An toàn trong thi công xây dựng"
    ],
    time: {
      startTime: "09h00, ngày 22/10/2026",
      endTime: "11h30, ngày 22/10/2026",
      place: "Hiện trường Dãy LK-01 - Dự án An Phú Eco City"
    },
    representatives: {
      investor: {
        company: "Công ty TNHH An Phú Cần Thơ",
        leadName: "Ngô Quý Linh",
        leadPosition: "Trưởng Ban QLDA",
        officerName: "Nguyễn Thành Trung",
        officerPosition: "Cán bộ ban QLDA"
      },
      designer: {
        company: "Công ty CP Tư vấn Thiết kế Xây dựng APCT",
        leadName: "KTS. Lê Quang Thiết Kế",
        leadPosition: "Giám đốc thiết kế",
        officerName: "KTS. Trần Văn Vẽ",
        officerPosition: "Chủ trì kiến trúc"
      },
      supervisor: {
        company: "Công ty CP Tư vấn Xây dựng và Thương mại GELICON",
        leadName: "Đinh Xuân Thám",
        leadPosition: "Tư vấn giám sát trưởng",
        officerName: "Đỗ Văn Trường",
        officerPosition: "Cán bộ TVGS"
      },
      contractor: {
        company: "Công ty CP Xây dựng An Phú Gia",
        leadName: "Phạm Thanh Nhàn",
        leadPosition: "Chỉ huy trưởng công trường",
        officerName: "Nguyễn Hoàng Bách",
        officerPosition: "Kỹ thuật hiện trường"
      }
    },
    status: "PENDING_APPROVAL",
    signatures: {
      contractor: {
        signed: true,
        name: "Phạm Thanh Nhàn",
        position: "Chỉ huy trưởng",
        signedAt: "2026-10-22T08:30:00.000Z"
      },
      designer: {
        signed: true,
        name: "KTS. Lê Quang Thiết Kế",
        position: "Giám đốc thiết kế",
        signedAt: "2026-10-22T09:00:00.000Z"
      },
      supervisor: {
        signed: false,
        name: "Đinh Xuân Thám",
        position: "Tư vấn giám sát trưởng",
        signedAt: null
      },
      investor: {
        signed: false,
        name: "Ngô Quý Linh",
        position: "Trưởng Ban QLDA",
        signedAt: null
      }
    },
    createdAt: "2026-10-22T08:30:00.000Z",
    updatedAt: "2026-10-22T09:00:00.000Z",
    createdByUid: "uid_dvtc_apg_01",
    createdByName: "Phạm Thanh Nhàn"
  },
  {
    id: "comp_mock_03",
    completionType: "DOSSIER",
    reportNumber: "01/BBKT-HSHNT",
    date: "2026-10-21",
    cityDate: "Cần Thơ, Ngày 21 tháng 10 năm 2026",
    projectName: "Đầu tư xây dựng nhà ở Phường Thường Thạnh-An Phú Eco City",
    buildingName: "Chung cư nhà ở xã hội 2",
    itemName: "Thi công phần kết cấu – Tòa A và Tòa B",
    location: "Phường Thường Thạnh - Quận Cái Răng – Thành phố Cần Thơ",
    inspectionObject: "Kiểm tra hồ sơ nghiệm thu chất lượng giai đoạn thi công xây dựng hoàn thành phần kết cấu dầm sàn Tòa A-B",
    stageName: "phần kết cấu dầm sàn từ Tầng 1 đến Tầng 5",
    time: {
      startTime: "14h00, ngày 21/10/2026",
      endTime: "16h30, ngày 21/10/2026",
      place: "Văn phòng Ban Điều hành Dự án An Phú Eco City"
    },
    representatives: {
      investor: {
        company: "Công ty TNHH An Phú Cần Thơ",
        leadName: "Ngô Quý Linh",
        leadPosition: "Trưởng Ban QLDA",
        officerName: "Nguyễn Thành Trung",
        officerPosition: "Cán bộ ban QLDA"
      },
      supervisor: {
        company: "Công ty CP Tư vấn Xây dựng và Thương mại GELICON",
        leadName: "Đinh Xuân Thám",
        leadPosition: "Tư vấn giám sát trưởng",
        officerName: "Đỗ Văn Trường",
        officerPosition: "Cán bộ TVGS"
      },
      contractor: {
        company: "Công ty CP Xây dựng An Phú Gia",
        leadName: "Phạm Thanh Nhàn",
        leadPosition: "Chỉ huy trưởng công trường",
        officerName: "Nguyễn Hoàng Bách",
        officerPosition: "Kỹ thuật hiện trường"
      }
    },
    status: "COMPLETED",
    signatures: {
      contractor: {
        signed: true,
        name: "Phạm Thanh Nhàn",
        position: "Chỉ huy trưởng",
        signedAt: "2026-10-21T14:00:00.000Z"
      },
      supervisor: {
        signed: true,
        name: "Đinh Xuân Thám",
        position: "Tư vấn giám sát trưởng",
        signedAt: "2026-10-21T16:00:00.000Z"
      },
      investor: {
        signed: true,
        name: "Ngô Quý Linh",
        position: "Trưởng Ban QLDA",
        signedAt: "2026-10-21T16:20:00.000Z"
      }
    },
    createdAt: "2026-10-21T14:00:00.000Z",
    updatedAt: "2026-10-21T16:20:00.000Z",
    createdByUid: "uid_dvtc_apg_01",
    createdByName: "Phạm Thanh Nhàn"
  }
];



