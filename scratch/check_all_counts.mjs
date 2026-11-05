import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

async function checkAllCounts() {
  const cols = [
    'inspection_requests',
    'inspection_reports',
    'construction_daily_logs',
    'completion_reports',
    'shop_documents',
    'payment_documents',
    'system_users'
  ];

  for (const c of cols) {
    const snap = await getDocs(collection(db, c));
    console.log(`${c}: ${snap.size}`);
  }
  process.exit(0);
}

checkAllCounts().catch(e => {
  console.error(e);
  process.exit(1);
});
