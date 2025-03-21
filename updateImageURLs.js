const admin = require('firebase-admin');
const serviceAccount = require('./pixelynth-c41ea-firebase-adminsdk-as8n5-d5bc520bb9.json'); // Adjust the path if necessary

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'pixelynth-c41ea.firebasestorage.app' // Replace with your Firebase storage bucket
});

const db = admin.firestore();

async function updateImageURLs() {
  const postsRef = db.collection('post');
  const snapshot = await postsRef.get();

  let updatedCount = 0;
  let removedImageFieldCount = 0;

  snapshot.forEach(async (doc) => {
    const data = doc.data();
    let updateData = {};

    // Update imageURL if it contains .png
    if (data.imageURL && data.imageURL.includes('.png')) {
      const newURL = data.imageURL.replace('.png', '.jpg');
      updateData.imageURL = newURL;
      console.log(`Updated document ${doc.id}: ${data.imageURL} -> ${newURL}`);
      updatedCount++;
    }

    // Remove the field "image"
    if (data.image) {
      updateData.image = admin.firestore.FieldValue.delete();
      console.log(`Marked field "image" for deletion from document ${doc.id}`);
      removedImageFieldCount++;
    }

    // Update the document if there are changes
    if (Object.keys(updateData).length > 0) {
      try {
        await doc.ref.update(updateData);
        console.log(`Successfully updated document ${doc.id}`);
      } catch (error) {
        console.error(`Error updating document ${doc.id}:`, error);
      }
    }
  });

  console.log(`Total documents updated: ${updatedCount}`);
  console.log(`Total 'image' fields removed: ${removedImageFieldCount}`);
}

updateImageURLs().then(() => {
  console.log('Image URLs update and field removal completed.');
}).catch((error) => {
  console.error('Error updating image URLs and removing fields:', error);
});
