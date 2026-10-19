import fs from 'fs';
import * as XLSX from 'xlsx';

const buf = fs.readFileSync('DANH MỤC TIÊU CHUẨN NGHIỆM THU.xls');
const workbook = XLSX.read(buf, { type: 'buffer' });

const allData = {};
for (const sheetName of workbook.SheetNames) {
  const sheet = workbook.Sheets[sheetName];
  allData[sheetName] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
}

fs.writeFileSync('scratch/excel_dump.json', JSON.stringify(allData, null, 2), 'utf8');
console.log('Saved all sheets to scratch/excel_dump.json');
