import fs from 'fs';

const buf = fs.readFileSync('12. BIÊN BẢN NGHIỆM THU VẬT LIỆU,THIẾT BỊ, SẢN PHẨM CHẾ TẠO SẴN.doc');

// Search for utf-16le or utf-8 strings in word binary format
function extractStrings(buffer) {
  let text = '';
  // Word doc usually stores unicode text in UTF-16LE
  const strUtf16 = buffer.toString('utf16le');
  const strUtf8 = buffer.toString('utf8');

  // Let's filter printable Vietnamese/ASCII characters
  const clean16 = strUtf16.replace(/[^\x20-\x7E\u00C0-\u1EF9\n\r\t]/g, ' ');
  const clean8 = strUtf8.replace(/[^\x20-\x7E\u00C0-\u1EF9\n\r\t]/g, ' ');
  
  return { utf16: clean16, utf8: clean8 };
}

const extracted = extractStrings(buf);
fs.writeFileSync('scratch/doc_extracted_utf16.txt', extracted.utf16);
fs.writeFileSync('scratch/doc_extracted_utf8.txt', extracted.utf8);
console.log('Extracted strings length 16:', extracted.utf16.length, 'length 8:', extracted.utf8.length);
