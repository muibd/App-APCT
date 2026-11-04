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

async function listUsers() {
  const userSnap = await getDocs(collection(db, 'system_users'));
  console.log('Count users in Firestore:', userSnap.size);
  userSnap.forEach(d => {
    const u = d.data();
    if (u.fullName?.includes('Hoàng') || u.fullName?.includes('Huân') || u.fullName?.includes('Thám') || u.fullName?.includes('Linh')) {
      console.log(u.uid, u.fullName, u.role, u.email);
    }
  });
  process.exit(0);
}

listUsers().catch(e => {
  console.error(e);
  process.exit(1);
});
