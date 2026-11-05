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

async function checkDetails() {
  const snap = await getDocs(collection(db, 'construction_daily_logs'));
  console.log(`Count: ${snap.size}`);
  snap.forEach(d => {
    const data = d.data();
    console.log({
      id: d.id,
      logNumber: data.logNumber,
      date: data.date,
      projectId: data.projectId,
      projectName: data.projectName,
      buildingName: data.buildingName,
      contractorName: data.contractorName,
      createdByName: data.createdByName,
      createdByUid: data.createdByUid,
      createdAt: data.createdAt
    });
  });
  process.exit(0);
}

checkDetails().catch(e => {
  console.error(e);
  process.exit(1);
});
