import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBAJvY6Pn3TjruubE-QN9ItcNL8Q5RHPK0",
  authDomain: "app-apct-nghiemthu.firebaseapp.com",
  projectId: "app-apct-nghiemthu",
  storageBucket: "app-apct-nghiemthu.firebasestorage.app",
  messagingSenderId: "1019219852691",
  appId: "1:1019219852691:web:27d14ee00994cd078a3c66"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkSize() {
  const repDoc = await getDoc(doc(db, 'inspection_reports', 'rep_1793579203522'));
  const repData = repDoc.data();
  const str = JSON.stringify(repData);
  console.log('Size of rep_1793579203522 JSON:', str.length, 'bytes');
  console.log('evidencePhotos count:', repData.evidencePhotos?.length);
  if (repData.evidencePhotos) {
    repData.evidencePhotos.forEach((p, idx) => {
      console.log(`photo ${idx}: url length = ${p.url?.length}, type = ${p.url?.substring(0, 30)}`);
    });
  }
  process.exit(0);
}

checkSize().catch(e => {
  console.error(e);
  process.exit(1);
});
