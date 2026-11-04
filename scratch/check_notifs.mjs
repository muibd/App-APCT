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

async function checkNotifs() {
  const notifSnap = await getDocs(collection(db, 'system_notifications'));
  console.log('Total notifications:', notifSnap.size);
  notifSnap.forEach(d => {
    const data = d.data();
    if (data.createdAt?.includes('2026-11-02') || data.title?.includes('râu tường') || data.body?.includes('râu tường')) {
      console.log('NOTIF:', data.createdAt, data.type, data.title, data.body);
    }
  });
  process.exit(0);
}

checkNotifs().catch(e => {
  console.error(e);
  process.exit(1);
});
