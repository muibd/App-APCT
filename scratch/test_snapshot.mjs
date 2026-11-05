import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';

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

console.log('Testing onSnapshot on construction_daily_logs...');
const unsubscribe = onSnapshot(collection(db, 'construction_daily_logs'), (snapshot) => {
  console.log('Snapshot received! Docs count:', snapshot.size);
  snapshot.forEach(d => {
    console.log(`Doc ID: ${d.id}, logNumber: ${d.data().logNumber}, date: ${d.data().date}`);
  });
  unsubscribe();
  process.exit(0);
}, (error) => {
  console.error('onSnapshot ERROR:', error);
  process.exit(1);
});
