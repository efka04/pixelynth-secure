const functions = require("firebase-functions");
const admin = require('firebase-admin');
const os = require('os');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Pas besoin d'initialiser admin ici, cela sera fait dans index.js

exports.compressImage = functions.storage.object().onFinalize(async (object) => {
  // Récupérer le chemin du fichier
  const filePath = object.name;
  const contentType = object.contentType;
  const fileName = path.basename(filePath);
  
  // Vérifier si c'est une image et si elle est dans le dossier 'images'
  if (!contentType.startsWith('image/') || !filePath.startsWith('images/')) {
    console.log('Ce n\'est pas une image ou pas dans le dossier images, ignoré.');
    return null;
  }
  
  // Vérifier si c'est déjà une version compressée
  if (filePath.includes('webp/')) {
    console.log('C\'est déjà une version WebP, ignoré.');
    return null;
  }
  
  // Créer des chemins temporaires pour le téléchargement et le traitement
  const tempFilePath = path.join(os.tmpdir(), fileName);
  const webpFileName = fileName.replace(/\.[^/.]+$/, ".webp");
  const webpFilePath = path.join(os.tmpdir(), webpFileName);
  
  // Définir le chemin de destination dans Storage
  const webpStoragePath = `webp/${webpFileName}`;
  
  try {
    // Récupérer le bucket Storage
    const bucket = admin.storage().bucket(object.bucket);
    
    // Télécharger l'image originale dans un fichier temporaire
    await bucket.file(filePath).download({
      destination: tempFilePath
    });
    
    console.log(`Image téléchargée à ${tempFilePath}`);
    
    // Compresser l'image avec Sharp en utilisant les paramètres spécifiés
    const webpBuffer = await sharp(tempFilePath)
      .webp({ 
        quality: 80,       // Qualité réduite pour diminuer la taille
        lossless: false,
        effort: 6,         // Effort de compression élevé
        preset: 'photo'
      })
      .toBuffer();
    
    // Écrire le buffer dans un fichier temporaire
    fs.writeFileSync(webpFilePath, webpBuffer);
    
    console.log(`Image compressée en WebP à ${webpFilePath}`);
    
    // Télécharger la version WebP dans Storage
    await bucket.upload(webpFilePath, {
      destination: webpStoragePath,
      metadata: {
        contentType: 'image/webp',
        metadata: {
          originalPath: filePath,
          firebaseStorageDownloadTokens: object.metadata?.firebaseStorageDownloadTokens
        }
      }
    });
    
    console.log(`Version WebP téléchargée à ${webpStoragePath}`);
    
    // Obtenir l'URL de téléchargement de la version WebP
    const webpFile = bucket.file(webpStoragePath);
    const [webpURL] = await webpFile.getSignedUrl({
      action: 'read',
      expires: '01-01-2100' // URL à long terme
    });
    
    // Nettoyer les fichiers temporaires
    fs.unlinkSync(tempFilePath);
    fs.unlinkSync(webpFilePath);
    
    console.log('Compression terminée avec succès');
    
    return {
      originalPath: filePath,
      webpPath: webpStoragePath,
      webpURL: webpURL
    };
    
  } catch (error) {
    console.error('Erreur lors de la compression de l\'image:', error);
    
    // Nettoyer les fichiers temporaires en cas d'erreur
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    if (fs.existsSync(webpFilePath)) {
      fs.unlinkSync(webpFilePath);
    }
    
    return null;
  }
});
