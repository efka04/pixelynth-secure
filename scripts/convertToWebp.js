const admin = require('firebase-admin');
const sharp = require('sharp');
const serviceAccount = require('../pixelynth-c41ea-firebase-adminsdk-as8n5-d5bc520bb9.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'pixelynth-c41ea.firebasestorage.app' // Update this with your bucket name
});

const bucket = admin.storage().bucket();

async function convertToWebp() {
  try {
    // Get existing webp files first
    const [webpFiles] = await bucket.getFiles({ prefix: 'webp/' });
    const existingWebpNames = new Set(
      webpFiles.map(file => file.name.split('/').pop())
    );
    console.log(`Found ${webpFiles.length} existing WebP files`);

    // List all files to debug
    const [allFiles] = await bucket.getFiles();
    console.log('Available folders:', new Set(allFiles.map(file => file.name.split('/')[0])));

    // Get files from images folder (corrected path)
    const [files] = await bucket.getFiles({ prefix: 'images/' });
    
    if (files.length === 0) {
      console.log('No files found in images/. Available paths:');
      allFiles.forEach(file => console.log(file.name));
      process.exit(1);
    }
    
    console.log(`Found ${files.length} files to convert`);

    let skippedCount = 0;
    let convertedCount = 0;

    for (const file of files) {
      const filename = file.name.split('/').pop();
      if (!filename) continue; // Skip if no filename

      // Check if WebP version already exists
      const webpFileName = filename.replace(/\.[^/.]+$/, '.webp');
      if (existingWebpNames.has(webpFileName)) {
        console.log(`Skipping ${filename} - WebP version already exists`);
        skippedCount++;
        continue;
      }

      console.log(`Converting ${filename}...`);

      // Download the file
      const tempFilePath = `/tmp/${filename}`;
      await file.download({ destination: tempFilePath });

      // Convert to WebP using sharp with 700px width
      const webpBuffer = await sharp(tempFilePath)
        .resize(700, null, {  // Set width to 700px, height auto to maintain aspect ratio
          withoutEnlargement: true,  // Don't enlarge if image is smaller
          fit: 'inside'
        })
        .webp({ 
          quality: 80,
          lossless: false,
          effort: 6,
          preset: 'photo'
        })
        .toBuffer();

      // Upload with public access and metadata
      const webpFile = bucket.file(`webp/${webpFileName}`);
      
      // First save the file
      await webpFile.save(webpBuffer, {
        metadata: {
          contentType: 'image/webp',
          metadata: {
            originalFile: filename,
            sourceFolder: 'images',
            firebaseStorageDownloadTokens: Date.now() // Add a download token
          }
        }
      });

      // Make the file publicly accessible
      await webpFile.makePublic();

      // Get the token from metadata
      const [metadata] = await webpFile.getMetadata();
      const token = metadata.metadata.firebaseStorageDownloadTokens;

      // Construct the Firebase Storage download URL
      const encodedFileName = encodeURIComponent(`webp/${webpFileName}`);
      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedFileName}?alt=media&token=${token}`;
      
      console.log(`Successfully converted ${filename} to WebP`);
      console.log(`Public URL: ${publicUrl}`);

      // Update the file metadata with the URL
      await webpFile.setMetadata({
        metadata: {
          ...metadata.metadata,
          publicUrl: publicUrl
        }
      });

      convertedCount++;
    }

    console.log(`
      Conversion complete!
      Converted: ${convertedCount}
      Skipped: ${skippedCount}
      Total processed: ${files.length}
    `);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

convertToWebp();
