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
  console.log('--- INSPECTION REQUESTS ---');
  const reqSnap = await getDocs(collection(db, 'inspection_requests'));
  reqSnap.forEach(d => {
    const data = d.data();
    console.log(`Req: id=${d.id}, reqNum=${data.requestNumber}, status=${data.status}, reportId=${data.reportId}, task=${data.taskContent}`);
  });

  console.log('\n--- INSPECTION REPORTS ---');
  const repSnap = await getDocs(collection(db, 'inspection_reports'));
  repSnap.forEach(d => {
    const data = d.data();
    console.log(`Rep: id=${d.id}, reqId=${data.requestId}, num=${data.reportNumber || data.referenceDocNumber}, status=${data.status}`);
    console.log(`   sup: signed=${data.attendees?.supervisor?.signed}, inv: signed=${data.attendees?.investor?.signed}, cont: signed=${data.attendees?.contractor?.signed}`);
    console.log(`   task: ${data.inspectionObject}`);
  });
  process.exit(0);
}

check().catch(e => {
  console.error(e);
  process.exit(1);
});
