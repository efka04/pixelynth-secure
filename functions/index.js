'use strict';

const admin = require('firebase-admin');
admin.initializeApp();

const functions = require("firebase-functions");
const os = require('os');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Fonction de compression d'images directement dans index.js
exports.processImageToWebp = functions.storage
  .bucket('pixelynth-c41ea.firebasestorage.app')
  .object()
  .onFinalize(async (object) => {
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

// Fonction de test HTTP pour vérifier le déploiement
exports.testFunction = functions.https.onRequest((req, res) => {
  res.send("Test function works!");
});

// --- Fonction de synchronisation ---
// Fonction qui se déclenche lorsqu'un document `post` est mis à jour
exports.syncPostToMyImages = functions.firestore
  .document('post/{postId}')
  .onUpdate(async (change, context) => {
    const postId = context.params.postId;
    const beforeData = change.before.data(); // Données avant la mise à jour
    const afterData = change.after.data(); // Données après la mise à jour

    // Si des changements sont détectés dans le document `post`
    if (JSON.stringify(beforeData) !== JSON.stringify(afterData)) {
      // Vérifie si un utilisateur est associé au post (on suppose que le champ `userEmail` existe dans `post`)
      const userEmail = afterData.userEmail;

      if (userEmail) {
        try {
          // Accède à la sous-collection `MyImages` de l'utilisateur
          const userDocRef = admin.firestore().collection('users').doc(userEmail);
          const myImagesRef = userDocRef.collection('MyImages').doc(postId);

          // Synchronise les données de `post` avec la sous-collection `MyImages`
          await myImagesRef.set(afterData, { merge: true });

          console.log(`Post ${postId} synchronisé avec MyImages pour l'utilisateur ${userEmail}`);
        } catch (error) {
          console.error("Erreur de synchronisation avec MyImages:", error);
        }
      }
    }

    return null; // Retourne null pour la fonction Cloud
  });

// Fonction qui se déclenche lors de la suppression d'un document `post`
exports.syncDeletePostToMyImages = functions.firestore
  .document('post/{postId}')
  .onDelete(async (snapshot, context) => {
    const postId = context.params.postId;
    const beforeData = snapshot.data();

    // Si des données existent avant la suppression, on les utilise pour trouver l'email de l'utilisateur
    const userEmail = beforeData.userEmail;

    if (userEmail) {
      try {
        // Accède à la sous-collection `MyImages` de l'utilisateur
        const userDocRef = admin.firestore().collection('users').doc(userEmail);
        const myImagesRef = userDocRef.collection('MyImages').doc(postId);

        // Supprime l'image correspondante de la sous-collection `MyImages`
        await myImagesRef.delete();

        console.log(`Post ${postId} supprimé de MyImages pour l'utilisateur ${userEmail}`);
      } catch (error) {
        console.error("Erreur de suppression dans MyImages:", error);
      }
    }

    return null; // Retourne null pour la fonction Cloud
  });

// Nouvelle fonction qui se déclenche lorsqu'un document dans MyImages est supprimé
exports.syncDeleteMyImagesToPost = functions.firestore
  .document('users/{userEmail}/MyImages/{imageId}')
  .onDelete(async (snapshot, context) => {
    const imageId = context.params.imageId;
    const userEmail = context.params.userEmail;

    try {
      // Vérifie si l'image existe dans la collection post
      const postRef = admin.firestore().collection('post').doc(imageId);
      const postDoc = await postRef.get();

      if (postDoc.exists) {
        // Vérifie que l'utilisateur qui supprime est bien le propriétaire du post
        const postData = postDoc.data();
        
        if (postData.userEmail === userEmail) {
          // Supprime le document de la collection post
          await postRef.delete();
          console.log(`Image ${imageId} supprimée de la collection post suite à la suppression dans MyImages`);
        } else {
          console.log(`Tentative de suppression non autorisée: l'utilisateur ${userEmail} n'est pas le propriétaire du post ${imageId}`);
        }
      } else {
        console.log(`Aucun document correspondant à l'ID ${imageId} trouvé dans la collection post`);
      }
    } catch (error) {
      console.error("Erreur lors de la synchronisation de la suppression de MyImages vers post:", error);
    }

    return null;
  });
