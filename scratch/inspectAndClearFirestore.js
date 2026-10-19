import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

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

async function inspectAndClear() {
  const collectionsToClear = ['inspection_requests', 'inspection_reports', 'system_notifications'];

  for (const colName of collectionsToClear) {
    const colRef = collection(db, colName);
    const snap = await getDocs(colRef);
    console.log(`Collection ${colName}: found ${snap.size} documents.`);
    for (const d of snap.docs) {
      console.log(`Deleting ${colName}/${d.id}...`);
      await deleteDoc(doc(db, colName, d.id));
    }
  }

  console.log('Done clearing Firestore!');
  process.exit(0);
}

inspectAndClear().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
