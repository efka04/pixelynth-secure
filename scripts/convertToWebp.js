const admin = require('firebase-admin');
const sharp = require('sharp');
const serviceAccount = require('./pixelynth-c41ea-192f169441e8.json');

// Initialisation de Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'pixelynth-c41ea.firebasestorage.app' // Assurez-vous d'utiliser le nom correct du bucket
});

const bucket = admin.storage().bucket();

// Taille limite en octets (100ko)
const SIZE_LIMIT = 100 * 1024;

async function compressWebpFiles() {
  try {
    // Liste les fichiers dans le dossier webp/
    const [webpFiles] = await bucket.getFiles({ prefix: 'webp/' });
    console.log(`Nombre de fichiers dans le dossier webp: ${webpFiles.length}`);

    let compressedCount = 0;
    let skippedCount = 0;

    for (const file of webpFiles) {
      // Récupérer les métadonnées du fichier pour connaître la taille
      const [metadata] = await file.getMetadata();
      const fileSize = parseInt(metadata.size, 10);

      // Si le fichier est inférieur ou égal à 100ko, on le passe
      if (fileSize <= SIZE_LIMIT) {
        console.log(`Fichier ${file.name} (taille: ${fileSize} octets) est en dessous de la limite, on passe.`);
        skippedCount++;
        continue;
      }

      console.log(`Compression de ${file.name} (taille: ${fileSize} octets)...`);

      // Télécharger le fichier temporairement
      const tempFilePath = `/tmp/${file.name.split('/').pop()}`;
      await file.download({ destination: tempFilePath });

      // Utiliser sharp pour compresser l'image WebP. Vous pouvez ajuster les paramètres de qualité
      const compressedBuffer = await sharp(tempFilePath)
        // Vous pouvez ne pas redimensionner, ici on garde la taille d'origine
        .webp({ quality: 80, lossless: false, effort: 6, preset: 'photo' })
        .toBuffer();

      // Sauvegarder le fichier compressé en écrasant l'original
      await file.save(compressedBuffer, {
        metadata: {
          contentType: 'image/webp',
          // Conserver éventuellement les métadonnées personnalisées
          metadata: metadata.metadata || {}
        }
      });

      // Optionnel : rendre le fichier public s'il l'était déjà
      await file.makePublic();

      // Mise à jour éventuelle des métadonnées pour inclure la nouvelle taille ou URL si nécessaire
      console.log(`Fichier ${file.name} compressé avec succès.`);
      compressedCount++;
    }

    console.log(`
      Compression terminée !
      Fichiers compressés : ${compressedCount}
      Fichiers ignorés   : ${skippedCount}
    `);
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la compression:', error);
    process.exit(1);
  }
}

compressWebpFiles();
