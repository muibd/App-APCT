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

async function detail() {
  const reqDoc = await getDoc(doc(db, 'inspection_requests', 'req_1793579203521'));
  console.log('=== REQUEST req_1793579203521 ===');
  console.log(JSON.stringify(reqDoc.data(), null, 2));

  const repDoc = await getDoc(doc(db, 'inspection_reports', 'rep_1793579203522'));
  console.log('=== REPORT rep_1793579203522 ===');
  console.log(JSON.stringify(repDoc.data(), null, 2));

  process.exit(0);
}

detail().catch(e => {
  console.error(e);
  process.exit(1);
});
