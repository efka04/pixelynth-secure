// recompress-webp.js
// Script pour recompresser les images WebP trop volumineuses dans Firebase Storage

const admin = require('firebase-admin');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Chemin vers votre fichier de clé de service Firebase
const serviceAccount = require('/Users/florent/Desktop/pixelynth-c41ea-192f169441e8.json');

// Taille maximale souhaitée en octets (100KB)
const MAX_SIZE = 100 * 1024;

// Paramètres de retry
const MAX_RETRIES = 5;
const RETRY_DELAY = 3000;
const BATCH_SIZE = 20; // Traiter 20 fichiers à la fois
const BATCH_DELAY = 1000; // Attendre 1 seconde entre les lots

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'pixelynth-c41ea.firebasestorage.app' // Mettez à jour avec le nom de votre bucket
});

const bucket = admin.storage().bucket();

// Fonction pour uploader avec retry
const uploadWithRetry = async (file, buffer, metadata, maxRetries = MAX_RETRIES, delay = RETRY_DELAY) => {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      await file.save(buffer, { metadata });
      
      // Si l'original était public, rendre la version recompressée publique aussi
      if (metadata.acl && metadata.acl.some(acl => acl.entity === 'allUsers')) {
        await file.makePublic();
      }
      
      return true;
    } catch (error) {
      retries++;
      console.log(`Erreur d'upload (tentative ${retries}/${maxRetries}): ${error.message}`);
      
      if (retries >= maxRetries) {
        throw error;
      }
      
      // Attendre avant de réessayer
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Fonction pour traiter un seul fichier
const processFile = async (file, tempDir) => {
  try {
    // Obtenir les métadonnées du fichier pour vérifier sa taille
    const [metadata] = await file.getMetadata();
    const fileSize = parseInt(metadata.size);
    const fileName = file.name.split('/').pop();
    
    // Vérifier si le fichier est trop volumineux
    if (fileSize > MAX_SIZE) {
      console.log(`Traitement de ${fileName} (${(fileSize / 1024).toFixed(2)} KB)...`);
      
      // Télécharger le fichier
      const tempFilePath = path.join(tempDir, fileName);
      await file.download({ destination: tempFilePath });
      
      // Créer une instance Sharp pour lire l'image
      const image = sharp(tempFilePath);
      const imageMetadata = await image.metadata();
      
      // Si la largeur est > 650px, redimensionner à 650px de largeur
      if (imageMetadata.width > 650) {
        console.log(`Redimensionnement de ${fileName} de ${imageMetadata.width}px à 650px de largeur.`);
        image.resize({ width: 650, withoutEnlargement: true, fit: 'inside' });
      }
      
      // Recompresser l'image avec Sharp en WebP
      const webpBuffer = await image
        .webp({ 
          quality: 90,
          lossless: false,
          effort: 6,
          preset: 'photo'
        })
        .toBuffer();
      
      // Vérifier si la nouvelle taille est inférieure à la taille maximale
      if (webpBuffer.length <= MAX_SIZE) {
        console.log(`Recompression réussie: ${(webpBuffer.length / 1024).toFixed(2)} KB (était ${(fileSize / 1024).toFixed(2)} KB)`);
        
        // Sauvegarder la version recompressée
        // Créer une sauvegarde de l'original d'abord
        const backupFile = bucket.file(`webp-originals/${fileName}`);
        await file.copy(backupFile);
        
        // Remplacer le fichier original par la version recompressée
        await uploadWithRetry(file, webpBuffer, {
          contentType: 'image/webp',
          metadata: {
            ...metadata.metadata,
            recompressed: 'true',
            originalSize: fileSize.toString(),
            compressionDate: new Date().toISOString()
          }
        });
        
        // Nettoyer le fichier temporaire
        fs.unlinkSync(tempFilePath);
        return { status: 'recompressed', fileName };
      } else {
        console.log(`Échec de la recompression: ${(webpBuffer.length / 1024).toFixed(2)} KB est toujours > ${(MAX_SIZE / 1024).toFixed(2)} KB`);
        
        // Essayer avec une qualité encore plus basse pour les cas difficiles
        const lastChanceBuffer = await sharp(tempFilePath)
          .webp({ 
            quality: 80, // Qualité très réduite pour les cas difficiles
            lossless: false,
            effort: 6,
            preset: 'photo'
          })
          .toBuffer();
        
        if (lastChanceBuffer.length <= MAX_SIZE) {
          console.log(`Recompression de secours réussie: ${(lastChanceBuffer.length / 1024).toFixed(2)} KB`);
          
          // Sauvegarder la version recompressée
          const backupFile = bucket.file(`webp-originals/${fileName}`);
          await file.copy(backupFile);
          
          await uploadWithRetry(file, lastChanceBuffer, {
            contentType: 'image/webp',
            metadata: {
              ...metadata.metadata,
              recompressed: 'true',
              originalSize: fileSize.toString(),
              compressionDate: new Date().toISOString(),
              lowQualityFallback: 'true'
            }
          });
          
          // Nettoyer le fichier temporaire
          fs.unlinkSync(tempFilePath);
          return { status: 'recompressed-low', fileName };
        } else {
          console.log(`Impossible de recompresser ${fileName} sous ${(MAX_SIZE / 1024).toFixed(2)} KB`);
          // Nettoyer le fichier temporaire
          fs.unlinkSync(tempFilePath);
          return { status: 'failed', fileName };
        }
      }
    } else {
      // Le fichier est déjà sous la taille maximale
      return { status: 'skipped', fileName };
    }
  } catch (error) {
    console.error(`Erreur lors du traitement de ${file.name}:`, error);
    return { status: 'error', fileName: file.name, error: error.message };
  }
};

async function recompressLargeWebpImages() {
  let tempDir = null;
  
  try {
    console.log('Démarrage de la recompression des images WebP trop volumineuses...');
    
    // Récupérer tous les fichiers WebP
    const [webpFiles] = await bucket.getFiles({ prefix: 'webp/' });
    console.log(`Trouvé ${webpFiles.length} fichiers WebP à analyser`);
    
    // Créer un dossier temporaire pour les téléchargements
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'webp-recompress-'));
    
    // Statistiques
    let recompressedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Traiter les fichiers par lots
    const batchSize = BATCH_SIZE;
    for (let i = 0; i < webpFiles.length; i += batchSize) {
      const endIndex = Math.min(i + batchSize, webpFiles.length);
      const batch = webpFiles.slice(i, endIndex);
      
      console.log(`Traitement du lot ${Math.floor(i / batchSize) + 1}/${Math.ceil(webpFiles.length / batchSize)} (fichiers ${i + 1}-${endIndex} sur ${webpFiles.length})`);
      
      for (const file of batch) {
        try {
          const result = await processFile(file, tempDir);
          
          if (result.status === 'recompressed' || result.status === 'recompressed-low') {
            recompressedCount++;
          } else if (result.status === 'failed') {
            failedCount++;
          } else if (result.status === 'skipped') {
            skippedCount++;
          } else if (result.status === 'error') {
            errorCount++;
          }
        } catch (error) {
          console.error(`Erreur lors du traitement du fichier ${file.name}:`, error);
          errorCount++;
        }
      }
      
      if (i + batchSize < webpFiles.length) {
        console.log(`Pause de ${BATCH_DELAY / 1000} secondes avant le prochain lot...`);
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
      }
    }
    
    console.log(`
      Recompression terminée!
      Fichiers recompressés avec succès: ${recompressedCount}
      Fichiers non recompressables: ${failedCount}
      Fichiers ignorés (déjà sous la taille limite): ${skippedCount}
      Erreurs: ${errorCount}
      Total traité: ${webpFiles.length}
    `);
    
    process.exit(0);
  } catch (error) {
    console.error('Erreur générale:', error);
    process.exit(1);
  } finally {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmdirSync(tempDir, { recursive: true });
    }
  }
}

// Exécuter le script
recompressLargeWebpImages();