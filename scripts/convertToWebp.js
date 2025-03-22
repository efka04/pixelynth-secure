const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require('/Users/florent/Desktop/pixelynth-c41ea-192f169441e8.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'pixelynth-c41ea.firebasestorage.app',
  databaseURL: 'https://pixelynth-c41ea.firebaseio.com'
});

const bucket = admin.storage().bucket();
const firestore = admin.firestore();

async function updatePostWebpUrls() {
  try {
    console.log('Début de la mise à jour des documents de la collection "post"...');
    
    // Récupérer tous les documents de la collection 'post'
    const postsSnapshot = await firestore.collection('post').get();
    if (postsSnapshot.empty) {
      console.log('Aucun document trouvé dans la collection "post".');
      return;
    }

    for (const doc of postsSnapshot.docs) {
      const data = doc.data();
      
      // Vérifier que le champ webpURL est présent
      if (!data.webpURL) {
        console.log(`Document ${doc.id} ignoré : champ "webpURL" non trouvé.`);
        continue;
      }
      
      let originalFilename;
      const fieldValue = data.webpURL;
      
      // Si la valeur est une URL, on extrait le nom du fichier depuis le pathname
      if (fieldValue.startsWith('http')) {
        try {
          const url = new URL(fieldValue);
          // Le chemin contient typiquement "/o/webp%2Fnomdufichier.ext" ; on récupère la partie après "/o/"
          const pathPart = decodeURIComponent(url.pathname.split('/o/')[1] || '');
          originalFilename = path.basename(pathPart);
        } catch (error) {
          console.error(`Erreur d'analyse de l'URL dans le document ${doc.id} : ${error.message}`);
          continue;
        }
      } else {
        // Si ce n'est pas une URL, on considère que c'est le nom du fichier directement
        originalFilename = fieldValue;
      }
      
      // Vérifier si le fichier (tel qu'extrait) se termine déjà par .webp
      if (originalFilename.toLowerCase().endsWith('.webp')) {
        console.log(`Document ${doc.id} déjà mis à jour (WebP déjà présent).`);
        continue;
      }
      
      // Déduire le nom du fichier WebP en remplaçant l'extension par .webp
      const webpFilename = originalFilename.replace(/\.[^/.]+$/, '.webp');
      const webpFilePath = `webp/${webpFilename}`;
      
      // Obtenir la référence au fichier WebP dans le bucket
      const webpFile = bucket.file(webpFilePath);
      try {
        const [metadata] = await webpFile.getMetadata();
        const token = metadata.metadata.firebaseStorageDownloadTokens;
        const encodedFileName = encodeURIComponent(webpFilePath);
        const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedFileName}?alt=media&token=${token}`;
        
        // Mettre à jour le document Firestore avec le nouveau lien
        await doc.ref.update({ webpURL: publicUrl });
        console.log(`Document ${doc.id} mis à jour : webpURL = ${publicUrl}`);
      } catch (error) {
        console.error(`Erreur pour le document ${doc.id} en traitant ${webpFilePath} : ${error.message}`);
      }
    }

    console.log('Mise à jour terminée.');
  } catch (error) {
    console.error('Erreur lors du traitement des documents :', error.message);
  }
}

updatePostWebpUrls()
  .then(() => {
    console.log('Script terminé avec succès.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script échoué :', error);
    process.exit(1);
  });
