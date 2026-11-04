import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';

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

async function syncCompleted() {
  const repRef = doc(db, 'inspection_reports', 'rep_1793579203522');
  const repDoc = await getDoc(repRef);
  if (!repDoc.exists()) {
    console.error('Report rep_1793579203522 not found!');
    return;
  }
  const repData = repDoc.data();

  const updatedRepAttendees = {
    ...repData.attendees,
    contractor: {
      ...repData.attendees?.contractor,
      signed: true,
      signedAt: repData.attendees?.contractor?.signedAt || '09:30 02/11/2026'
    },
    supervisor: {
      ...repData.attendees?.supervisor,
      signed: true,
      signedAt: '10:00 02/11/2026'
    },
    investor: {
      ...repData.attendees?.investor,
      signed: true,
      signedAt: '10:00 02/11/2026'
    }
  };

  const updatedRep = {
    status: 'COMPLETED',
    attendees: updatedRepAttendees,
    conclusion: {
      ...repData.conclusion,
      isAccepted: true,
      repairRequired: 'Đã nghiệm thu đạt yêu cầu',
      rejectionReason: '',
      otherRequirements: 'Không có'
    },
    updatedAt: new Date().toISOString()
  };

  await updateDoc(repRef, updatedRep);
  console.log('✅ Updated report rep_1793579203522 to COMPLETED in Firestore');

  const reqRef = doc(db, 'inspection_requests', 'req_1793579203521');
  const reqDoc = await getDoc(reqRef);
  if (reqDoc.exists()) {
    await updateDoc(reqRef, {
      status: 'COMPLETED',
      updatedAt: new Date().toISOString()
    });
    console.log('✅ Updated request req_1793579203521 to COMPLETED in Firestore');
  }

  process.exit(0);
}

syncCompleted().catch(e => {
  console.error(e);
  process.exit(1);
});
