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

async function run() {
  const repSnap = await getDocs(collection(db, 'inspection_reports'));
  console.log(`Total reports in Firestore: ${repSnap.size}`);
  repSnap.forEach(d => {
    const data = d.data();
    const photosCount = Array.isArray(data.evidencePhotos) ? data.evidencePhotos.length : 0;
    const reqPhotosCount = Array.isArray(data.photos) ? data.photos.length : 0;
    console.log(`Report ID: ${d.id}, num: ${data.reportNumber || data.referenceDocNumber}, status: ${data.status}, reqId: ${data.requestId}, evidencePhotos: ${photosCount}, photos: ${reqPhotosCount}`);
  });

  const reqSnap = await getDocs(collection(db, 'inspection_requests'));
  console.log(`\nTotal requests in Firestore: ${reqSnap.size}`);
  reqSnap.forEach(d => {
    const data = d.data();
    const photosCount = Array.isArray(data.evidencePhotos) ? data.evidencePhotos.length : 0;
    console.log(`Req ID: ${d.id}, num: ${data.requestNumber}, status: ${data.status}, reportId: ${data.reportId}, evidencePhotos: ${photosCount}`);
  });
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
