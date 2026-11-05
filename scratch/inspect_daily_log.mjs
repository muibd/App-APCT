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

async function inspectDoc() {
  const ref = doc(db, 'construction_daily_logs', 'log_1793843022688');
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    console.log('Doc does not exist!');
    process.exit(0);
  }
  const data = snap.data();
  console.log('Doc keys:', Object.keys(data));
  console.log('Doc size stringified bytes:', JSON.stringify(data).length);
  console.log('Doc summary:', {
    id: snap.id,
    logNumber: data.logNumber,
    date: data.date,
    status: data.status,
    contractorName: data.contractorName,
    createdByName: data.createdByName,
    evidencePhotosCount: data.evidencePhotos?.length,
    hasBase64: JSON.stringify(data).includes('data:image'),
    evidencePhotosSamples: data.evidencePhotos?.map(p => ({
      caption: p.caption,
      urlLen: p.url?.length,
      isBase64: p.url?.startsWith('data:')
    }))
  });
  process.exit(0);
}

inspectDoc().catch(e => {
  console.error(e);
  process.exit(1);
});
