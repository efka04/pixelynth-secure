'use strict'; // Ajoute cette ligne en haut du fichier

const functions = require("firebase-functions");
const admin = require('firebase-admin');
admin.initializeApp();

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
