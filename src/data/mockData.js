// ============================================================================
// DỮ LIỆU MẪU MÔ PHỎNG HỆ THỐNG QUẢN LÝ NGHIỆM THU (APCT)
// Chuẩn hóa theo dự án thực tế: Chung cư nhà ở xã hội 2 - An Phú Eco City
// ============================================================================

export const MOCK_USERS = [
  // 1. ADMIN - Quản trị viên
  {
    uid: "uid_admin_01",
    fullName: "Nguyễn Văn Admin",
    role: "ADMIN",
    company: "Ban Quản Trị Hệ Thống APCT",
    position: "Quản trị viên Hệ thống",
    avatar: "AD",
    phone: "0901.888.999",
    email: "admin@apct.vn",
    password: "123456",
    status: "ACTIVE"
  },

  // 2. CONTRACTOR - Đại diện Đơn vị Thi công
  {
    uid: "uid_dvtc_01",
    fullName: "KS. Lê Văn Kỹ Thuật",
    role: "CONTRACTOR",
    company: "Công ty CP Xây dựng An Phú Gia",
    position: "Kỹ thuật hiện trường",
    avatar: "KT",
    phone: "0939.112.233",
    email: "kythuat.anphugia@gmail.com",
    password: "123456",
    status: "ACTIVE"
  },
  {
    uid: "uid_dvtc_02",
    fullName: "KS. Trần Hữu Chỉ Huy",
    role: "CONTRACTOR",
    company: "Công ty CP Xây dựng An Phú Gia",
    position: "Chỉ huy trưởng công trường",
    avatar: "CH",
    phone: "0939.445.566",
    email: "chihuy.anphugia@gmail.com",
    password: "123456",
    status: "ACTIVE"
  },

  // 3. SUPERVISOR - Tư vấn Giám sát
  {
    uid: "uid_tvgs_01",
    fullName: "KS. Võ Văn Tón",
    role: "SUPERVISOR",
    company: "Công ty CP Tư vấn Xây dựng và Thương mại GELICON",
    position: "Cán bộ tư vấn giám sát",
    avatar: "VT",
    phone: "0918.776.554",
    email: "vovanton.gelicon@gmail.com",
    password: "123456",
    status: "ACTIVE"
  },
  {
    uid: "uid_tvgs_02",
    fullName: "ThS. Đinh Xuân Thám",
    role: "SUPERVISOR",
    company: "Công ty CP Tư vấn Xây dựng và Thương mại GELICON",
    position: "Tư vấn giám sát trưởng",
    avatar: "ĐT",
    phone: "0913.889.900",
    email: "dinhxuantham.gelicon@gmail.com",
    password: "123456",
    status: "ACTIVE"
  },
  {
    uid: "uid_tvgs_03",
    fullName: "KS. Nguyễn Hoàng Nam",
    role: "SUPERVISOR",
    company: "Công ty CP Tư vấn Xây dựng và Thương mại GELICON",
    position: "Cán bộ trắc đạc TVGS",
    avatar: "HN",
    phone: "0915.223.344",
    email: "nam.gelicon@gmail.com",
    password: "123456",
    status: "ACTIVE"
  },

  // 4. INVESTOR - Đại diện Chủ đầu tư
  {
    uid: "uid_cdt_01",
    fullName: "Ông Bành Nguyễn Hậu",
    role: "INVESTOR",
    company: "Công ty TNHH An Phú Cần Thơ",
    position: "Cán bộ ban QLDA",
    avatar: "BH",
    phone: "0944.556.677",
    email: "nguyenhau.anphuct@gmail.com",
    password: "123456",
    status: "ACTIVE"
  },
  {
    uid: "uid_cdt_02",
    fullName: "Ông Ngô Quý Linh",
    role: "INVESTOR",
    company: "Công ty TNHH An Phú Cần Thơ",
    position: "Trưởng Ban QLDA",
    avatar: "QL",
    phone: "0908.123.456",
    email: "ngoquylinh.anphuct@gmail.com",
    password: "123456",
    status: "ACTIVE"
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
      name: "Chung cư nhà ở xã hội 2",
      items: [
        {
          id: "item_ketcau_AB",
          name: "Thi công phần kết cấu – Tòa A và Tòa B",
          tasks: [
            "Nghiệm thu công tác định vị tim trục dầm sàn tầng 2 trục 1-13/A-D Tòa A",
            "Nghiệm thu cốt thép dầm sàn tầng 2 trục 1-13/A-D Tòa A",
            "Nghiệm thu ván khuôn dầm sàn tầng 2 Tòa A",
            "Nghiệm thu công tác đổ bê tông dầm sàn tầng 2 Tòa A"
          ]
        },
        {
          id: "item_mong_AB",
          name: "Thi công phần móng và hầm",
          tasks: [
            "Nghiệm thu trắc đạc tim cọc đài móng ĐM-01 Tòa A",
            "Nghiệm thu cốt thép đài móng và giằng móng Tòa B"
          ]
        }
      ]
    },
    {
      id: "bld_nhapho_01",
      name: "Dãy nhà phố liền kề thương mại LK-01",
      items: [
        {
          id: "item_xaytho",
          name: "Thi công phần xây thô tường tầng 1",
          tasks: [
            "Nghiệm thu xây tường bao gạch ống dày 200mm LK-01"
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

