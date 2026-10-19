import fs from 'fs';
import * as XLSX from 'xlsx';

const buf = fs.readFileSync('DANH MỤC TIÊU CHUẨN NGHIỆM THU.xls');
const workbook = XLSX.read(buf, { type: 'buffer' });
const sheet = workbook.Sheets['DANH MỤC TIÊU CHUẨN NGHIỆM THU'];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

const workStandards = [];
const materialStandards = [];

let currentSection = 'WORK'; // 'WORK' | 'MATERIAL'

for (let i = 0; i < rows.length; i++) {
  const row = rows[i];
  if (!row || row.length === 0) continue;
  
  const col0 = String(row[0] || '').trim();
  const col1 = String(row[1] || '').trim();
  const col2 = String(row[2] || '').trim();

  if (col0 === 'A' || col1.includes('CÔNG VIỆC XÂY DỰNG')) {
    currentSection = 'WORK';
    continue;
  }
  if (col0 === 'B' || col1.includes('VẬT LIỆU ĐẦU VÀO')) {
    currentSection = 'MATERIAL';
    continue;
  }

  // Check if it's a valid data row (number or valid name)
  const stt = parseInt(col0, 10);
  if (!isNaN(stt) && col1) {
    const rawStandards = col2.split('\n')
      .map(s => s.trim().replace(/^\+\s*/, '').replace(/;\s*$/, '').trim())
      .filter(Boolean);

    const item = {
      id: currentSection === 'WORK' ? `work_${stt}` : `mat_${stt}`,
      stt: stt,
      name: col1,
      category: currentSection === 'WORK' ? 'CÔNG VIỆC XÂY DỰNG' : 'VẬT LIỆU ĐẦU VÀO',
      standards: rawStandards
    };

    if (currentSection === 'WORK') {
      workStandards.push(item);
    } else {
      materialStandards.push(item);
    }
  }
}

console.log(`Parsed ${workStandards.length} work standards and ${materialStandards.length} material standards.`);

const fileContent = `// ============================================================================
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
export const CONSTRUCTION_WORK_STANDARDS = ${JSON.stringify(workStandards, null, 2)};

// 2. DANH MỤC TIÊU CHUẨN VẬT LIỆU ĐẦU VÀO (Sheet B - MẪU SỐ 12)
export const MATERIAL_STANDARDS = ${JSON.stringify(materialStandards, null, 2)};

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
      const parts = item.name.toLowerCase().split(/[\\s,]+/);
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
        const stds = c2.split('\\n')
          .map(s => s.trim().replace(/^\\+\\s*/, '').replace(/;\\s*$/, '').trim())
          .filter(Boolean);

        const item = {
          id: curSection === 'WORK' ? \`work_\${stt}\` : \`mat_\${stt}\`,
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
`;

fs.writeFileSync('src/data/standardsRules.js', fileContent, 'utf8');
console.log('Successfully generated src/data/standardsRules.js!');
