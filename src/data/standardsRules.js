// ============================================================================
// HỆ THỐNG TIÊU CHUẨN ĐỘNG THEO FILE EXCEL: DANH MỤC TIÊU CHUẨN NGHIỆM THU.xls
// Chuẩn hóa cho cả 2 loại: Công việc xây dựng & Vật liệu đầu vào (Mẫu số 12)
// ============================================================================

import * as XLSX from 'xlsx';

export const GENERAL_MANDATORY_STANDARDS = [
  "TCVN 5637:1991 Quản lý chất lượng xây lắp công trình xây dựng - Nguyên tắc cơ bản",
  "TCVN 4055:2024 Tổ chức thi công",
  "TCVN 5308:1991 Quy phạm kỹ thuật an toàn trong xây dựng"
];

// 1. DANH MỤC TIÊU CHUẨN CÔNG VIỆC XÂY DỰNG (Sheet A)
export const CONSTRUCTION_WORK_STANDARDS = [
  {
    "id": "work_1",
    "stt": 1,
    "name": "Cốt thép, ván khuôn, bê tông",
    "category": "CÔNG VIỆC XÂY DỰNG",
    "standards": [
      "TCVN 4453:1995 Kết cấu bê tông và bê tông cốt thép  -Thi công và nghiệm thu"
    ]
  },
  {
    "id": "work_2",
    "stt": 2,
    "name": "Xây tường",
    "category": "CÔNG VIỆC XÂY DỰNG",
    "standards": [
      "TCVN 4085:2025 Thi công kết cấu khối xây - Yêu cầu kỹ thuật",
      "TCVN 4314:2022 Vữa xây dựng - Yêu cầu kỹ thuật"
    ]
  },
  {
    "id": "work_3",
    "stt": 3,
    "name": "Trát tường",
    "category": "CÔNG VIỆC XÂY DỰNG",
    "standards": [
      "TCVN 4085:2025 Thi công kết cấu khối xây - Yêu cầu kỹ thuật",
      "TCVN 9377-2:2012 Công tác hoàn thiện trong xây dựng - Thi công và nghiệm thu - Phần 2: Công tác trát trong xây dựng"
    ]
  },
  {
    "id": "work_4",
    "stt": 4,
    "name": "Chống thấm",
    "category": "CÔNG VIỆC XÂY DỰNG",
    "standards": [
      "TCVN 9345:2012 – Kết cấu bê tông và bê tông cốt thép – Hưỡng dẫn kỹ thuật phòng chống nứt dưới tác động của khí hậu nóng ẩm"
    ]
  },
  {
    "id": "work_5",
    "stt": 5,
    "name": "Cán nền",
    "category": "CÔNG VIỆC XÂY DỰNG",
    "standards": [
      "TCVN 9377-1:2012: Công tác hoàn thiện trong xây dựng - Thi công và nghiệm thu - Phần 1: Công tác lát và láng trong xây dựng",
      "TCVN 4314:2022 Vữa xây dựng - Yêu cầu kỹ thuật."
    ]
  },
  {
    "id": "work_6",
    "stt": 6,
    "name": "Ốp lát gạch",
    "category": "CÔNG VIỆC XÂY DỰNG",
    "standards": [
      "TCVN 9377-1:2012: Công tác hoàn thiện trong xây dựng - Thi công và nghiệm thu - Phần 1: Công tác lát và láng trong xây dựng",
      "TCVN 9377-3:2012 Công tác hoàn thiện trong xây dựng - Thi công và nghiệm thu - Phần 3: Công tác ốp trong xây dựng.",
      "TCVN 8264:2009 Gạch ốp lát - Quy phạm thi công và nghiệm thu.",
      "TCVN 4314:2022 Vữa xây dựng - Yêu cầu kỹ thuật."
    ]
  },
  {
    "id": "work_7",
    "stt": 7,
    "name": "Ốp lát đá",
    "category": "CÔNG VIỆC XÂY DỰNG",
    "standards": [
      "TCVN 9377-1:2012 Công tác hoàn thiện trong xây dựng - Thi công và nghiệm thu - Phần 1: Công tác lát và láng trong xây dựng.",
      "TCVN 9377-3:2012 Công tác hoàn thiện trong xây dựng - Thi công và nghiệm thu - Phần 3: Công tác ốp trong xây dựng."
    ]
  },
  {
    "id": "work_8",
    "stt": 8,
    "name": "Ốp bậc nhựa giả gỗ",
    "category": "CÔNG VIỆC XÂY DỰNG",
    "standards": [
      "TCVN 9377-1:2012 Công tác hoàn thiện trong xây dựng - Thi công và nghiệm thu - Phần 1: Công tác lát và láng trong xây dựng.",
      "TCVN 7955:2008 Lắp đặt ván sàn - Quy phạm thi công và nghiệm thu."
    ]
  },
  {
    "id": "work_9",
    "stt": 9,
    "name": "Lắp đặt trần thạch cao",
    "category": "CÔNG VIỆC XÂY DỰNG",
    "standards": [
      "TCVN 10701:2016 Tấm thạch cao - Yêu cầu lắp đặt, hoàn thiện"
    ]
  },
  {
    "id": "work_10",
    "stt": 10,
    "name": "Lắp đặt cửa nhôm kính",
    "category": "CÔNG VIỆC XÂY DỰNG",
    "standards": [
      "TCVN 9366-2:2012 Cửa đi, cửa sổ - Phần 2: Cửa kim loại"
    ]
  },
  {
    "id": "work_11",
    "stt": 11,
    "name": "Lắp đặt cửa gỗ",
    "category": "CÔNG VIỆC XÂY DỰNG",
    "standards": [
      "TCVN 9366-1:2012 Cửa đi, cửa sổ - Phần 1: Cửa gỗ"
    ]
  },
  {
    "id": "work_12",
    "stt": 12,
    "name": "Bả matit",
    "category": "CÔNG VIỆC XÂY DỰNG",
    "standards": [
      "TCVN 7239:2014 Bột bả tường gốc xi măng poóc lăng."
    ]
  },
  {
    "id": "work_13",
    "stt": 13,
    "name": "Sơn lót, sơn hoàn thiện",
    "category": "CÔNG VIỆC XÂY DỰNG",
    "standards": [
      "TCVN 8652:2020 Sơn tường dạng nhũ tương -Yêu cầu kỹ thuật"
    ]
  },
  {
    "id": "work_14",
    "stt": 14,
    "name": "Lắp đặt lan can",
    "category": "CÔNG VIỆC XÂY DỰNG",
    "standards": [
      "TCVN 4431:1987 Lan can an toàn - Điều kiện kĩ thuật"
    ]
  },
  {
    "id": "work_15",
    "stt": 15,
    "name": "Chống mối",
    "category": "CÔNG VIỆC XÂY DỰNG",
    "standards": [
      "TCVN 7958:2017 Bảo vệ công trình xây dựng - Phòng chống mối cho công trình xây dựng mới"
    ]
  }
];

// 2. DANH MỤC TIÊU CHUẨN VẬT LIỆU ĐẦU VÀO (Sheet B - MẪU SỐ 12)
export const MATERIAL_STANDARDS = [
  {
    "id": "mat_1",
    "stt": 1,
    "name": "Gạch ống, gạch thẻ không nung",
    "category": "VẬT LIỆU ĐẦU VÀO",
    "standards": [
      "QCVN 16:2023/BXD Sản phẩm, hàng hóa vật liệu xây dựng",
      "TCVN 6477:2016 Gạch bê tông",
      "TCVN 6355:2009 Gạch xây - Phương pháp thử"
    ]
  },
  {
    "id": "mat_2",
    "stt": 2,
    "name": "Gạch ống, gạch thẻ đất sét nung",
    "category": "VẬT LIỆU ĐẦU VÀO",
    "standards": [
      "QCVN 16:2023/BXD Sản phẩm, hàng hóa vật liệu xây dựng",
      "TCVN 1451:1998 Gạch đặc đất sét nung",
      "TCVN 6355:2009 Gạch xây - Phương pháp thử"
    ]
  },
  {
    "id": "mat_3",
    "stt": 3,
    "name": "Xi măng",
    "category": "VẬT LIỆU ĐẦU VÀO",
    "standards": [
      "QCVN 16:2023/BXD Sản phẩm, hàng hóa vật liệu xây dựng.",
      "TCVN 4787:2009 Lấy mẫu xi măng.",
      "TCVN 9202:2009 Xi măng xây trát.",
      "TCVN 6016:2011 Xi măng - Phương pháp thử - Xác định cường độ.",
      "TCVN 4314:2022 Vữa xây dựng - Yêu cầu kỹ thuật"
    ]
  },
  {
    "id": "mat_4",
    "stt": 4,
    "name": "Cát xây trát",
    "category": "VẬT LIỆU ĐẦU VÀO",
    "standards": [
      "QCVN 16:2023/BXD Sản phẩm, hàng hóa vật liệu xây dựng",
      "TCVN 7570:2006 Cốt liệu cho bê tông và vữa - Yêu cầu kỹ thuật",
      "TCVN 7572:2006 Cốt liệu cho bê tông và vữa - Phương pháp thử",
      "TCVN 4314:2022 Vữa xây dựng - Yêu cầu kỹ thuật"
    ]
  },
  {
    "id": "mat_5",
    "stt": 5,
    "name": "Keo khoan cấy",
    "category": "VẬT LIỆU ĐẦU VÀO",
    "standards": [
      "TCVN 9490:2012 Bê tông - Xác định cường độ kéo nhổ."
    ]
  },
  {
    "id": "mat_6",
    "stt": 6,
    "name": "Gạch ốp lát",
    "category": "VẬT LIỆU ĐẦU VÀO",
    "standards": [
      "QCVN 16:2023/BXD Sản phẩm, hàng hóa vật liệu xây dựng.",
      "TCVN 7745:2007 Gạch gốm ốp lát ép bán khô - Yêu cầu kỹ thuật",
      "TCVN 6415:2016 Gạch gốm ốp, lát - Phương pháp thử",
      "TCVN 8264:2009 Gạch ốp lát - Quy phạm thi công và nghiệm thu"
    ]
  },
  {
    "id": "mat_7",
    "stt": 7,
    "name": "Keo chà ron",
    "category": "VẬT LIỆU ĐẦU VÀO",
    "standards": [
      "TCVN 7899:2008 Gạch gốm ốp lát - Vữa, keo chít mạch và dán gạch",
      "TCVN 8264:2009 Gạch ốp lát - Quy phạm thi công và nghiệm thu"
    ]
  },
  {
    "id": "mat_8",
    "stt": 8,
    "name": "Sàn nhựa giả gỗ",
    "category": "VẬT LIỆU ĐẦU VÀO",
    "standards": [
      "TCVN 11352:2016 Ván sàn composite gỗ nhựa"
    ]
  },
  {
    "id": "mat_9",
    "stt": 9,
    "name": "Đá granite tự nhiên",
    "category": "VẬT LIỆU ĐẦU VÀO",
    "standards": [
      "QCVN 16:2023/BXD Sản phẩm, hàng hóa vật liệu xây dựng.",
      "TCVN 4732:2016 Đá ốp, lát tự nhiên"
    ]
  },
  {
    "id": "mat_10",
    "stt": 10,
    "name": "Bột bả matit",
    "category": "VẬT LIỆU ĐẦU VÀO",
    "standards": [
      "TCVN 7239:2014 Bột bả tường gốc xi măng Poóc Lăng."
    ]
  },
  {
    "id": "mat_11",
    "stt": 11,
    "name": "Sơn lót, sơn hoàn thiện",
    "category": "VẬT LIỆU ĐẦU VÀO",
    "standards": [
      "QCVN 16:2023/BXD Sản phẩm, hàng hóa vật liệu xây dựng.",
      "TCVN 8652:2012 Sơn tường dạng nhũ tương - Yêu cầu kỹ thuật.",
      "TCVN 8653:2012 Sơn tường dạng nhũ tương - Phương pháp thử.",
      "TCVN 9404:2012 Sơn xây dựng - Phân loại"
    ]
  },
  {
    "id": "mat_12",
    "stt": 12,
    "name": "Khung xương trần, tấm trần thạch cao",
    "category": "VẬT LIỆU ĐẦU VÀO",
    "standards": [
      "QCVN 16:2023/BXD Sản phẩm, hàng hóa vật liệu xây dựng.",
      "TCVN 8256:2022 Tấm thạch cao - Yêu cầu kỹ thuật",
      "TCVN 8257:2022 Tấm thạch cao - Phương pháp thử"
    ]
  },
  {
    "id": "mat_13",
    "stt": 13,
    "name": "Tấm cemboard",
    "category": "VẬT LIỆU ĐẦU VÀO",
    "standards": [
      "QCVN 16:2023/BXD Sản phẩm, hàng hóa vật liệu xây dựng.",
      "TCVN 8258:2009 Tấm xi măng sợi - Yêu cầu kỹ thuật",
      "TCVN 8259:2009 Tấm xi măng sợi - Phương pháp thử"
    ]
  },
  {
    "id": "mat_14",
    "stt": 14,
    "name": "Chống thấm gốc xi măng",
    "category": "VẬT LIỆU ĐẦU VÀO",
    "standards": [
      "TCVN 9204:2012 Vữa xi măng khô trộn sẵn không co",
      "TCVN 12692:2020 Vật liệu chống thấm nước thi công dạng lỏng sử dụng bên dưới lớp chất kết kính dính dán gạch gốm ốp lát - Yêu cầu kỹ thuật, phương pháp thử"
    ]
  },
  {
    "id": "mat_15",
    "stt": 15,
    "name": "Chống thấm gốc bitum",
    "category": "VẬT LIỆU ĐẦU VÀO",
    "standards": [
      "TCVN 9065:2012 Vật liệu chống thấm - Sơn nhũ tương Bitum"
    ]
  },
  {
    "id": "mat_16",
    "stt": 16,
    "name": "Chống mối",
    "category": "VẬT LIỆU ĐẦU VÀO",
    "standards": [
      "TCVN 7958:2017 Bảo vệ công trình xây dựng - Phòng chống mối cho công trình xây dựng mới"
    ]
  },
  {
    "id": "mat_17",
    "stt": 17,
    "name": "Cửa nhôm kính",
    "category": "VẬT LIỆU ĐẦU VÀO",
    "standards": [
      "TCVN 5838:1994 Nhôm và hợp kim nhôm – Thanh, thỏi, ống và profin – Yêu cầu kỹ thuật chung",
      "TCVN 12513:2018 Nhôm và hợp kim nhôm gia công áp lực - Que/thanh, ống và sản phẩm định hình ép đùn",
      "QCVN 16:2023/BXD Sản phẩm, hàng hóa vật liệu xây dựng.",
      "TCVN 7218:2018 Kính tấm xây dựng - Kính nổi - Yêu cầu kĩ thuật",
      "TCVN 7219:2018 Kính tấm xây dựng - Phương pháp xác định kích thước và khuyết tật ngoại quan",
      "TCVN 7364:2018 Kính xây dựng - Kính dán nhiều lớp và kính an toàn nhiều lớp - Phương pháp thử",
      "TCVN 7368:2012 Kính xây dựng - Kính dán an toàn nhiều lớp - Phương pháp thử độ bền va đập"
    ]
  },
  {
    "id": "mat_18",
    "stt": 18,
    "name": "Lam nhôm",
    "category": "VẬT LIỆU ĐẦU VÀO",
    "standards": [
      "TCVN 5838:1994 Nhôm và hợp kim nhôm – Thanh, thỏi, ống và profin – Yêu cầu kỹ thuật chung",
      "TCVN 13065:2020 Nhôm và hợp kim nhôm gia công áp lực – Tấm mỏng, băng và tấm"
    ]
  },
  {
    "id": "mat_19",
    "stt": 19,
    "name": "Cửa gỗ",
    "category": "VẬT LIỆU ĐẦU VÀO",
    "standards": [
      "TCVN 11903:2017 Ván gỗ nhân tạo - Lấy mẫu và cắt mẫu thử",
      "TCVN 7756:2007 Ván gỗ nhân tạo - Phương pháp thử nghiệm",
      "TCVN 9383:2012 Thử nghiệm khả năng chịu lửa của cửa đi và cửa chắn ngăn cháy"
    ]
  },
  {
    "id": "mat_20",
    "stt": 20,
    "name": "Cửa thép chống cháy",
    "category": "VẬT LIỆU ĐẦU VÀO",
    "standards": [
      "QCVN 06/2021 Quy chuẩn kỹ thuật quốc gia về an toàn cháy cho nhà và công trình",
      "TCVN 9383:2012 Thử nghiệm khả năng chịu lửa của cửa đi và cửa chắn ngăn cháy"
    ]
  },
  {
    "id": "mat_21",
    "stt": 21,
    "name": "Lan can",
    "category": "VẬT LIỆU ĐẦU VÀO",
    "standards": [
      "TCVN 4431:1987 Lan can an toàn - Điều kiện kỹ thuật"
    ]
  },
  {
    "id": "mat_22",
    "stt": 22,
    "name": "Thép",
    "category": "VẬT LIỆU ĐẦU VÀO",
    "standards": [
      "QCVN 16:2023/BXD Sản phẩm, hàng hóa vật liệu xây dựng.",
      "TCVN 1651:2018 Vật liệu thép cốt thép bê tông"
    ]
  },
  {
    "id": "mat_23",
    "stt": 23,
    "name": "Tủ bếp",
    "category": "VẬT LIỆU ĐẦU VÀO",
    "standards": [
      "TCVN 11903:2017 Ván gỗ nhân tạo - Lấy mẫu và cắt mẫu thử",
      "TCVN 7756:2007 Ván gỗ nhân tạo - Phương pháp thử nghiệm"
    ]
  },
  {
    "id": "mat_24",
    "stt": 24,
    "name": "Giàn giáo bao che",
    "category": "VẬT LIỆU ĐẦU VÀO",
    "standards": [
      "TCVN 4431:1987 Lan can an toàn - Điều kiện kỹ thuật",
      "TCXDVN 296:2004 Giàn giáo các yêu cầu về an toàn"
    ]
  }
];

/**
 * Tìm kiếm tiêu chuẩn tương ứng theo công việc hoặc chủng loại vật liệu (Rule Engine)
 */
export function getSuggestedStandards(taskOrMaterialName, inspectionType = 'WORK') {
  if (!taskOrMaterialName) return [...GENERAL_MANDATORY_STANDARDS];

  const lower = taskOrMaterialName.toLowerCase();
  const pool = inspectionType === 'MATERIAL' 
    ? MATERIAL_STANDARDS 
    : [...CONSTRUCTION_WORK_STANDARDS, ...MATERIAL_STANDARDS];

  let matched = pool.find(item => lower.includes(item.name.toLowerCase()));
  if (!matched) {
    // Tìm kiếm mờ theo từng từ khóa
    matched = pool.find(item => {
      const parts = item.name.toLowerCase().split(/[\s,]+/);
      return parts.some(p => p.length > 2 && lower.includes(p));
    });
  }

  const standards = [...GENERAL_MANDATORY_STANDARDS];
  if (matched && Array.isArray(matched.standards)) {
    matched.standards.forEach(std => {
      if (!standards.includes(std)) standards.push(std);
    });
  }

  return standards;
}

/**
 * Đọc động file Excel Danh mục tiêu chuẩn nghiệm thu từ mảng byte hoặc File/Blob
 */
export function parseStandardsExcel(fileBuffer) {
  try {
    const workbook = XLSX.read(fileBuffer, { type: 'binary' });
    const sheetName = workbook.SheetNames.find(n => n.includes('TIÊU CHUẨN')) || workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const works = [];
    const materials = [];
    let curSection = 'WORK';

    for (const row of rows) {
      if (!row || !row.length) continue;
      const c0 = String(row[0] || '').trim();
      const c1 = String(row[1] || '').trim();
      const c2 = String(row[2] || '').trim();

      if (c0 === 'A' || c1.includes('CÔNG VIỆC')) {
        curSection = 'WORK';
        continue;
      }
      if (c0 === 'B' || c1.includes('VẬT LIỆU')) {
        curSection = 'MATERIAL';
        continue;
      }

      const stt = parseInt(c0, 10);
      if (!isNaN(stt) && c1) {
        const stds = c2.split('\n')
          .map(s => s.trim().replace(/^\+\s*/, '').replace(/;\s*$/, '').trim())
          .filter(Boolean);

        const item = {
          id: curSection === 'WORK' ? `work_${stt}` : `mat_${stt}`,
          stt,
          name: c1,
          category: curSection === 'WORK' ? 'CÔNG VIỆC XÂY DỰNG' : 'VẬT LIỆU ĐẦU VÀO',
          standards: stds
        };

        if (curSection === 'WORK') works.push(item);
        else materials.push(item);
      }
    }

    return { works, materials };
  } catch (err) {
    console.error('Lỗi phân tích file Excel tiêu chuẩn:', err);
    return null;
  }
}
