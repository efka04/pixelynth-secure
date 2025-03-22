const functions = require('firebase-functions');
const admin = require('firebase-admin');
const os = require('os');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// On suppose que admin.initializeApp() a déjà été appelé dans votre index.js

exports.compressWebpImage = functions.storage.object().onFinalize(async (object) => {
  // Récupérer les informations du fichier
  const filePath = object.name;
  const contentType = object.contentType;

  // Ne traiter que les images
  if (!contentType || !contentType.startsWith('image/')) {
    console.log('Ce n\'est pas une image. Fonction terminée.');
    return null;
  }

  // Ne traiter que les fichiers situés dans le dossier 'webp/'
  if (!filePath.startsWith('webp/')) {
    console.log('L\'image n\'est pas dans le dossier "webp". Fonction terminée.');
    return null;
  }

  const fileName = path.basename(filePath);
  const tempFilePath = path.join(os.tmpdir(), fileName);
  // Fichier temporaire pour le fichier compressé
  const compressedFilePath = path.join(os.tmpdir(), 'compressed-' + fileName);

  const bucket = admin.storage().bucket(object.bucket);

  try {
    // Télécharger l'image dans le répertoire temporaire
    await bucket.file(filePath).download({ destination: tempFilePath });
    console.log(`Image téléchargée à ${tempFilePath}`);

    // Ouvrir l'image avec Sharp et récupérer ses métadonnées
    let image = sharp(tempFilePath);
    const metadata = await image.metadata();

    // Si la largeur de l'image est > 650px, redimensionner à 650px de largeur
    if (metadata.width > 650) {
      console.log(`Redimensionnement de ${fileName} de ${metadata.width}px à 650px de largeur.`);
      image = image.resize({ width: 650, withoutEnlargement: true, fit: 'inside' });
    } else {
      console.log(`La largeur de ${fileName} (${metadata.width}px) est déjà inférieure ou égale à 650px.`);
    }

    // Recompresser l'image en WebP avec les paramètres souhaités
    const buffer = await image.webp({
      quality: 80,
      lossless: false,
      effort: 6,
      preset: 'photo'
    }).toBuffer();

    // Sauvegarder le buffer dans un fichier temporaire compressé
    fs.writeFileSync(compressedFilePath, buffer);
    console.log(`Image compressée enregistrée à ${compressedFilePath}`);

    // Réécrire le fichier compressé dans le bucket (remplacement du fichier original)
    await bucket.upload(compressedFilePath, {
      destination: filePath,
      metadata: {
        contentType: 'image/webp',
        metadata: {
          recompressed: 'true',
          compressionDate: new Date().toISOString()
        }
      }
    });
    console.log(`Image ${filePath} recompresse et réuploadée avec succès.`);

    // Nettoyer les fichiers temporaires
    fs.unlinkSync(tempFilePath);
    fs.unlinkSync(compressedFilePath);

    return null;
  } catch (error) {
    console.error('Erreur lors de la compression de l\'image:', error);
    // Nettoyage en cas d'erreur
    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    if (fs.existsSync(compressedFilePath)) fs.unlinkSync(compressedFilePath);
    throw error;
  }
});
