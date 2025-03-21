const admin = require('firebase-admin');
const serviceAccount = require('./pixelynth-c41ea-firebase-adminsdk-as8n5-d5bc520bb9.json'); // Adjust the path if necessary

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'pixelynth-c41ea.firebasestorage.app' // Replace with your Firebase storage bucket
});

const db = admin.firestore();

async function countImages() {
  const postsRef = db.collection('post');
  const snapshot = await postsRef.get();

  let imageCount = 0;

  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.imageURL) {
      imageCount++;
    }
  });

  console.log(`Total number of images in 'post' collection: ${imageCount}`);
}

countImages().then(() => {
  console.log('Image count completed.');
}).catch((error) => {
  console.error('Error counting images:', error);
});
