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
  const ref = doc(db, 'inspection_requests', 'req_1793763670607');
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const data = snap.data();
    console.log('Request keys:', Object.keys(data));
    console.log('evidencePhotos:', data.evidencePhotos);
    console.log('taskContent:', data.taskContent);
    console.log('createdByName:', data.createdByName);
  }
  process.exit(0);
}
run();
