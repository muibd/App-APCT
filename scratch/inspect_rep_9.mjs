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

async function run() {
  const ref = doc(db, 'inspection_reports', 'rep_1793583475980');
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const data = snap.data();
    console.log('Photos count:', data.evidencePhotos?.length);
    if (data.evidencePhotos?.length > 0) {
      console.log('Photo 0 url length:', data.evidencePhotos[0].url?.length);
      console.log('Photo 0 url start:', data.evidencePhotos[0].url?.substring(0, 50));
    }
    const jsonStr = JSON.stringify(data);
    console.log('Total doc size in bytes:', Buffer.byteLength(jsonStr, 'utf8'));
  }
  process.exit(0);
}
run();
