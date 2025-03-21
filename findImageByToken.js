const admin = require('firebase-admin');
const serviceAccount = require('./pixelynth-c41ea-firebase-adminsdk-as8n5-d5bc520bb9.json'); // Adjust the path if necessary

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'pixelynth-c41ea.firebasestorage.app' // Replace with your Firebase storage bucket
});

const bucket = admin.storage().bucket();

async function findImageByToken(token) {
  try {
    const [files] = await bucket.getFiles({ prefix: 'images/' });

    console.log(`Found ${files.length} files in 'images/' folder.`);

    for (const file of files) {
      console.log(`Checking file: ${file.name}`);
      const [metadata] = await file.getMetadata();
      console.log(`Metadata for file ${file.name}:`, metadata);

      if (metadata.metadata) {
        const fileToken = metadata.metadata.firebaseStorageDownloadTokens;
        console.log(`Token for file ${file.name}: ${fileToken}`);

        if (fileToken === token) {
          console.log(`Found file: ${file.name}`);
          console.log(`Public URL: https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(file.name)}?alt=media&token=${token}`);
          return;
        }
      } else {
        console.log(`No metadata for file ${file.name}`);
      }
    }

    console.log('No file found with the specified token.');
  } catch (error) {
    console.error('Error finding image by token:', error);
  }
}

const token = 'a040277f-0d83-42f3-a4fa-a7cbe2264b80'; // Replace with the token you are looking for
findImageByToken(token);
