import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBAJvY6Pn3TjruubE-QN9ItcNL8Q5RHPK0",
  authDomain: "app-apct-nghiemthu.firebaseapp.com",
  projectId: "app-apct-nghiemthu",
  storageBucket: "app-apct-nghiemthu.firebasestorage.app",
  messagingSenderId: "1019219852691",
  appId: "1:1019219852691:web:27d14ee00994cd078a3c66"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

async function testUpload() {
  try {
    const testRef = ref(storage, `test/test_${Date.now()}.txt`);
    const buffer = Buffer.from('Hello Firebase Storage test');
    const snap = await uploadBytes(testRef, buffer, { contentType: 'text/plain' });
    const url = await getDownloadURL(snap.ref);
    console.log('Firebase Storage upload SUCCESS! Download URL:', url);
  } catch (err) {
    console.error('Firebase Storage upload FAILED:', err);
  }
  process.exit(0);
}
testUpload();
