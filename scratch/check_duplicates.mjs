import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

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

async function findDuplicates() {
  console.log('--- SEARCH REQUESTS CONTAINING "râu tường" ---');
  const reqSnap = await getDocs(collection(db, 'inspection_requests'));
  reqSnap.forEach(d => {
    const data = d.data();
    if ((data.taskContent || '').includes('râu tường')) {
      console.log('REQ MATCH:', d.id, {
        taskContent: data.taskContent,
        status: data.status,
        reportId: data.reportId,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        assignedRecipients: data.assignedRecipients?.map(r => r.fullName)
      });
    }
  });

  console.log('\n--- SEARCH REPORTS CONTAINING "râu tường" ---');
  const repSnap = await getDocs(collection(db, 'inspection_reports'));
  repSnap.forEach(d => {
    const data = d.data();
    if ((data.inspectionObject || '').includes('râu tường')) {
      console.log('REP MATCH:', d.id, {
        inspectionObject: data.inspectionObject,
        status: data.status,
        requestId: data.requestId,
        reportNumber: data.reportNumber,
        referenceDocNumber: data.referenceDocNumber,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        supSigned: data.attendees?.supervisor?.signed,
        invSigned: data.attendees?.investor?.signed
      });
    }
  });

  process.exit(0);
}

findDuplicates().catch(e => {
  console.error(e);
  process.exit(1);
});
