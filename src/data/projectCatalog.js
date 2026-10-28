// ============================================================================
// DANH MỤC CÔNG TRÌNH, NHÀ THẦU, GÓI THẦU & MÃ LOẠI PHIẾU/BIÊN BẢN (APCT)
// Quản lý tập trung bởi Admin, hỗ trợ lưu trữ LocalStorage & Cloud Firestore
// Chuẩn hóa theo bảng phân công thực tế & các mẫu văn bản Word (.doc) mới:
// - 02.Bien ban nghiem thu công việc.doc (WA)
// - 03.Phieu yeu cau nghiem thu.doc (IR)
// - 12. BIÊN BẢN NGHIỆM THU VẬT LIỆU,THIẾT BỊ, SẢN PHẨM CHẾ TẠO SẴN.doc (MI)
// - 07 BIÊN BẢN NGHIỆM THU HOÀN THÀNH HẠNG MỤC CÔNG TRÌNH... (07)
// - 12-2.BBNT hoan thanh giai doan lap dat thiet bi.doc (12-2)
// ============================================================================

export const DEFAULT_PROJECTS = [
  {
    id: "proj_2203",
    code: "2203",
    name: "Chung cư nhà ở xã hội 2",
    projectName: "Đầu tư xây dựng nhà ở Phường Thường Thạnh - An Phú Eco City",
    location: "Phường Thường Thạnh - Quận Cái Răng - Thành phố Cần Thơ",
    investor: "Công ty TNHH An Phú Cần Thơ",
    supervisor: "Công ty CP Tư vấn Xây dựng và Thương mại GELICON",
    contractors: [
      {
        id: "cont_ghvp_2203",
        name: "Công ty TNHH Gia Huy Vĩnh Phúc",
        shortName: "Gia Huy Vĩnh Phúc",
        packages: [
          {
            id: "pkg_hoanthien_ab",
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
            id: "pkg_mep_ab",
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
            id: "pkg_cuago",
            name: "Cung cấp, lắp đặt cửa gỗ",
            tasks: [
              "Lắp đặt khuôn cửa gỗ",
              "Lắp đặt cánh cửa gỗ và phụ kiện khóa",
              "Nghiệm thu hoàn thiện bề mặt cửa gỗ"
            ]
          },
          {
            id: "pkg_cuathep",
            name: "Cung cấp, lắp đặt cửa thép chống cháy",
            tasks: [
              "Lắp đặt khuôn cửa thép chống cháy",
              "Lắp đặt cánh cửa thép chống cháy và tay co thủy lực",
              "Kiểm tra độ khít gioăng ngăn cháy và khóa thoát hiểm"
            ]
          },
          {
            id: "pkg_cuanhomkinh",
            name: "Cung cấp, lắp đặt cửa nhôm kính",
            tasks: [
              "Lắp đặt khung nhôm định hình",
              "Lắp đặt kính an toàn và phụ kiện",
              "Bơm keo silicone chống thấm viền khung"
            ]
          }
        ]
      },
      {
        id: "cont_phanle_2203",
        name: "Công ty TNHH Phát Triển Xây Dựng Phan Lê",
        shortName: "Phát Triển Xây Dựng Phan Lê",
        packages: [
          {
            id: "pkg_pccc_2203",
            name: "Thi công hệ thống PCCC trong và ngoài nhà",
            tasks: [
              "Lắp đặt mạng lưới đường ống cấp nước chữa cháy vách tường",
              "Lắp đặt đầu phun Sprinkler chữa cháy tự động",
              "Lắp đặt van báo động (Alarm Valve) và trụ chữa cháy ngoài nhà",
              "Lắp đặt tủ trung tâm báo cháy và đầu báo khói/nhiệt địa chỉ",
              "Thử áp lực tĩnh và thử nghiệm liên động hệ thống PCCC"
            ]
          }
        ]
      },
      {
        id: "cont_apg_2203",
        name: "Công ty CP Xây dựng An Phú Gia",
        shortName: "An Phú Gia",
        packages: [
          {
            id: "pkg_apg_ketchu_2203",
            name: "Thi công phần kết cấu – Tòa A và Tòa B (Gói thầu số 02)",
            tasks: [
              "Cốt thép, ván khuôn, bê tông",
              "Cốt thép cột, vách, dầm, sàn",
              "Ván khuôn dầm sàn, cột vách",
              "Bê tông thương phẩm dầm, sàn, cột",
              "Bảo dưỡng bê tông",
              "Chống thấm cổ ống xuyên sàn"
            ]
          },
          {
            id: "pkg_apg_mongham_2203",
            name: "Thi công phần móng và hầm (Gói thầu số 01)",
            tasks: [
              "Cốt thép, ván khuôn, bê tông",
              "Đào đất hố móng và tầng hầm",
              "Bê tông lót móng",
              "Cốt thép đài móng, dầm móng",
              "Bê tông đài móng, sàn hầm",
              "Chống thấm sàn và vách tầng hầm"
            ]
          },
          {
            id: "pkg_apg_hoanthien_2203",
            name: "Thi công phần hoàn thiện Tòa A và Tòa B",
            tasks: [
              "Cốt thép, ván khuôn, bê tông",
              "Xây tường gạch",
              "Trát tường trong và ngoài nhà",
              "Chống thấm khu vệ sinh, ban công",
              "Cán nền, láng sàn",
              "Ốp lát gạch ceramic"
            ]
          }
        ]
      },
      {
        id: "cont_binhhoa_2203",
        name: "Công ty TNHH Tư vấn Thiết kế Bình Hoà",
        shortName: "Bình Hoà",
        packages: [
          {
            id: "pkg_binhhoa_kientruc_2203",
            name: "Thi công phần hoàn thiện kiến trúc",
            tasks: [
              "Cốt thép, ván khuôn, bê tông",
              "Xây tường gạch ống",
              "Trát tường trong và ngoài",
              "Chống thấm",
              "Cán nền",
              "Ốp lát gạch men",
              "Sơn bả tường trần"
            ]
          },
          {
            id: "pkg_binhhoa_hatang_2203",
            name: "Thi công cảnh quan sân vườn và hạ tầng kỹ thuật",
            tasks: [
              "Đào đắp đất nền sân đường",
              "Lắp đặt bó vỉa, lát gạch vỉa hè",
              "Lắp đặt ống thoát nước mưa sân đường",
              "Trồng cây xanh và thảm cỏ"
            ]
          }
        ]
      }
    ]
  },
  {
    id: "proj_2204",
    code: "2204",
    name: "Chung cư nhà ở cao tầng",
    projectName: "Đầu tư xây dựng nhà ở Phường Thường Thạnh - An Phú Eco City",
    location: "Phường Thường Thạnh - Quận Cái Răng - Thành phố Cần Thơ",
    investor: "Công ty TNHH An Phú Cần Thơ",
    supervisor: "Công ty CP Tư vấn Xây dựng và Thương mại GELICON",
    contractors: [
      {
        id: "cont_ghvp_2204",
        name: "Công ty TNHH Gia Huy Vĩnh Phúc",
        shortName: "Gia Huy Vĩnh Phúc",
        packages: [
          {
            id: "pkg_mep_2204",
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
            id: "pkg_hoanthien_2204",
            name: "Thi công hoàn thiện kiến trúc",
            tasks: [
              "Cốt thép, ván khuôn, bê tông",
              "Xây tường",
              "Trát tường",
              "Chống thấm",
              "Cán nền",
              "Ốp lát gạch"
            ]
          }
        ]
      },
      {
        id: "cont_phanle_2204",
        name: "Công ty TNHH Phát Triển Xây Dựng Phan Lê",
        shortName: "Phát Triển Xây Dựng Phan Lê",
        packages: [
          {
            id: "pkg_pccc_2204",
            name: "Thi công hệ thống PCCC trong và ngoài nhà",
            tasks: [
              "Lắp đặt mạng lưới đường ống cấp nước chữa cháy vách tường",
              "Lắp đặt đầu phun Sprinkler",
              "Lắp đặt tủ trung tâm báo cháy và đầu báo khói/nhiệt",
              "Thử áp lực đường ống chữa cháy"
            ]
          }
        ]
      },
      {
        id: "cont_apg_2204",
        name: "Công ty CP Xây dựng An Phú Gia",
        shortName: "An Phú Gia",
        packages: [
          {
            id: "pkg_apg_ketchu_2204",
            name: "Thi công phần kết cấu – Khối cao tầng",
            tasks: [
              "Cốt thép, ván khuôn, bê tông",
              "Cốt thép cột, vách, dầm, sàn",
              "Ván khuôn dầm sàn, cột vách",
              "Bê tông thương phẩm",
              "Bảo dưỡng bê tông"
            ]
          },
          {
            id: "pkg_apg_mong_2204",
            name: "Thi công phần móng và cọc khoan nhồi",
            tasks: [
              "Khoan hạ lồng thép cọc khoan nhồi",
              "Đổ bê tông cọc nhồi",
              "Đào đất hố móng",
              "Cốt thép đài móng giằng móng",
              "Bê tông đài móng"
            ]
          }
        ]
      },
      {
        id: "cont_binhhoa_2204",
        name: "Công ty TNHH Tư vấn Thiết kế Bình Hoà",
        shortName: "Bình Hoà",
        packages: [
          {
            id: "pkg_binhhoa_hoanthien_2204",
            name: "Thi công hoàn thiện kiến trúc",
            tasks: [
              "Cốt thép, ván khuôn, bê tông",
              "Xây tường",
              "Trát tường",
              "Chống thấm",
              "Cán nền",
              "Ốp lát gạch men"
            ]
          }
        ]
      }
    ]
  }
];

export const DEFAULT_DOCUMENT_TYPES = [
  {
    id: "IR",
    code: "IR",
    name: "Phiếu yêu cầu nghiệm thu",
    description: "Mẫu 03 - Phiếu yêu cầu nghiệm thu công việc xây dựng & vật liệu",
    sampleDoc: "03.Phieu yeu cau nghiem thu.doc"
  },
  {
    id: "WA",
    code: "WA",
    name: "Biên bản nghiệm thu công việc",
    description: "Mẫu 02 - Biên bản nghiệm thu công việc xây dựng",
    sampleDoc: "02.Bien ban nghiem thu công việc.doc"
  },
  {
    id: "MI",
    code: "MI",
    name: "Biên bản nghiệm thu đầu vào",
    description: "Mẫu 12 - Biên bản nghiệm thu vật liệu, thiết bị, sản phẩm chế tạo sẵn trước khi đưa vào sử dụng",
    sampleDoc: "12. BIÊN BẢN NGHIỆM THU VẬT LIỆU,THIẾT BỊ, SẢN PHẨM CHẾ TẠO SẴN.doc"
  },
  {
    id: "07",
    code: "07",
    name: "Biên bản nghiệm thu hoàn thành đưa vào sử dụng",
    description: "Mẫu 07 - Nghiệm thu hoàn thành hạng mục công trình hoặc công trình đưa vào sử dụng",
    sampleDoc: "07 BIÊN BẢN NGHIỆM THU HOÀN THÀNH HẠNG MỤC CÔNG TRÌNH HOẶC CÔNG TRÌNH ĐƯA VÀO SỬ DỤNG.doc"
  },
  {
    id: "12-2",
    code: "12-2",
    name: "Biên bản nghiệm thu giai đoạn lắp đặt thiết bị",
    description: "Mẫu 12-2 - Nghiệm thu hoàn thành bộ phận công trình xây dựng, giai đoạn lắp đặt thiết bị",
    sampleDoc: "12-2.BBNT hoan thanh giai doan lap dat thiet bi.doc"
  }
];

export const PROJECTS_STORAGE_KEY = 'apct_admin_projects_catalog_v2';
export const DOC_TYPES_STORAGE_KEY = 'apct_admin_doc_types_catalog_v2';

/**
 * Sinh mã hạng mục công trình / số tài liệu căn cứ chuẩn pháp lý:
 * Định dạng: [Mã công trình]/[Mã loại phiếu]/[ddMMyy]-[Số lần sửa, bắt đầu 01].01
 * Ví dụ: 2203/MI/231026-01.01
 */
export function generateDocumentCode(projectCode = '2203', docTypeCode = 'MI', date = new Date(), revision = 1) {
  let d = date;
  if (!(d instanceof Date)) {
    d = new Date(date || Date.now());
    if (isNaN(d.getTime())) d = new Date();
  }
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  const dateStr = `${day}${month}${year}`;
  const revStr = String(revision || 1).padStart(2, '0');
  return `${projectCode}/${docTypeCode}/${dateStr}-${revStr}.01`;
}

/**
 * Tính số lần sửa chữa / revision chuẩn xác:
 * - Khi mới tạo hoặc khi bị từ chối / hủy: KHÔNG tăng (giữ nguyên số hiện tại).
 * - Chỉ khi ĐVTC sửa xong và gửi lại (RECTIFIED): MỚI tăng lên 1 lần (01.01 -> 02.01 -> 03.01...).
 */
export function getDocumentRevisionNumber(item, relatedItem) {
  if (!item && !relatedItem) return 1;
  const history = item?.rectificationHistory || relatedItem?.rectificationHistory || [];
  const histLen = Array.isArray(history) ? history.length : 0;
  
  const isRectified = item?.status === 'RECTIFIED' || 
    Boolean(item?.rectification) || 
    Boolean(item?.rectificationNotes) ||
    relatedItem?.status === 'RECTIFIED' ||
    Boolean(relatedItem?.rectification) ||
    Boolean(relatedItem?.rectificationNotes);

  if (isRectified) {
    return histLen + 2;
  }
  return histLen + 1;
}

/**
 * Đọc danh mục công trình từ LocalStorage hoặc trả về mặc định
 */
export function loadStoredProjects() {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Tự động hợp nhất các nhà thầu chuẩn mới (An Phú Gia, Bình Hoà, Gia Huy...) vào danh mục
        return parsed.map(p => {
          const defP = DEFAULT_PROJECTS.find(dp => dp.code === p.code || dp.id === p.id);
          if (!defP) return p;
          const existingContractorNames = (p.contractors || []).map(c => (c.name || '').toLowerCase().trim());
          const missingContractors = (defP.contractors || []).filter(c => !existingContractorNames.includes((c.name || '').toLowerCase().trim()));
          if (missingContractors.length > 0) {
            return {
              ...p,
              contractors: [...(p.contractors || []), ...missingContractors]
            };
          }
          return p;
        });
      }
    }
  } catch (err) {
    console.warn('Lỗi load danh mục công trình:', err);
  }
  return DEFAULT_PROJECTS;
}

/**
 * Lưu danh mục công trình vào LocalStorage
 */
export function saveStoredProjects(projects) {
  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  } catch (err) {
    console.error('Lỗi lưu danh mục công trình:', err);
  }
}

/**
 * Đọc danh mục loại văn bản từ LocalStorage hoặc trả về mặc định
 */
export function loadStoredDocTypes() {
  try {
    const raw = localStorage.getItem(DOC_TYPES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Lỗi load danh mục loại văn bản:', err);
  }
  return DEFAULT_DOCUMENT_TYPES;
}

/**
 * Lưu danh mục loại văn bản vào LocalStorage
 */
export function saveStoredDocTypes(docTypes) {
  try {
    localStorage.setItem(DOC_TYPES_STORAGE_KEY, JSON.stringify(docTypes));
  } catch (err) {
    console.error('Lỗi lưu danh mục loại văn bản:', err);
  }
}
