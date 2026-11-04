import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

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
  const snap = await getDocs(collection(db, 'payment_documents'));
  console.log(`Found ${snap.size} payment documents`);
  snap.forEach(d => {
    const data = d.data();
    console.log(`Doc ID: ${d.id}, code: ${data.docCode}, status: ${data.status}`);
    console.log(`  TVGS: status=${data.assignedTvgs?.status}, due=${data.assignedTvgs?.dueDate}, assignedAt=${data.assignedTvgs?.assignedAt}`);
    console.log(`  INV: status=${data.assignedInvestor?.status}, due=${data.assignedInvestor?.dueDate}, assignedAt=${data.assignedInvestor?.assignedAt}`);
    console.log(`  investorReviewOverdueNotified=${data.investorReviewOverdueNotified}`);
  });
  process.exit(0);
}

check().catch(e => {
  console.error(e);
  process.exit(1);
});
