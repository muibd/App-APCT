import fs from 'fs';
import * as XLSX from 'xlsx';

try {
  const buf = fs.readFileSync('DANH MỤC TIÊU CHUẨN NGHIỆM THU.xls');
  const workbook = XLSX.read(buf, { type: 'buffer' });
  console.log('Sheet Names in DANH MỤC TIÊU CHUẨN NGHIỆM THU.xls:', workbook.SheetNames);

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log(`\n--- Sheet: ${sheetName} (Rows: ${data.length}) ---`);
    console.log(JSON.stringify(data.slice(0, 30), null, 2));
  }
} catch (e) {
  console.error('Error reading xls:', e);
}

// Check doc file
try {
  const docBuf = fs.readFileSync('12. BIÊN BẢN NGHIỆM THU VẬT LIỆU,THIẾT BỊ, SẢN PHẨM CHẾ TẠO SẴN.doc');
  console.log('\n--- Doc file length:', docBuf.length);
  // Check if it's text/html or binary
  const textSample = docBuf.slice(0, 1500).toString('utf8');
  console.log('Doc file sample (utf8):', textSample);
} catch (e) {
  console.error('Error reading doc:', e);
}
