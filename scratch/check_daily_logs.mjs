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

async function check() {
  const collectionsToCheck = [
    'construction_daily_logs',
    'daily_logs',
    'dailyLogs',
    'constructionDailyLogs',
    'nhat_ky_thi_cong'
  ];

  for (const colName of collectionsToCheck) {
    try {
      const snap = await getDocs(collection(db, colName));
      console.log(`\n=== Collection: ${colName} (Count: ${snap.size}) ===`);
      snap.forEach(d => {
        const data = d.data();
        console.log(`- ID: ${d.id}`);
        console.log(`  logNumber: ${data.logNumber}`);
        console.log(`  date: ${data.date}`);
        console.log(`  status: ${data.status}`);
        console.log(`  contractorName: ${data.contractorName || data.contractor}`);
        console.log(`  createdByName: ${data.createdByName}`);
        console.log(`  createdAt: ${data.createdAt}`);
      });
    } catch (e) {
      console.error(`Error querying ${colName}:`, e.message);
    }
  }

  process.exit(0);
}

check().catch(e => {
  console.error(e);
  process.exit(1);
});
