const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialiser l'application Firebase Admin si ce n'est pas déjà fait
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Fonction déclenchée lorsqu'une image est mise à jour dans la collection 'post'
 * Synchronise les modifications avec toutes les collections où cette image est référencée
 */
exports.syncImageUpdate = functions.firestore
  .document('post/{imageId}')
  .onUpdate(async (change, context) => {
    const imageId = context.params.imageId;
    const newData = change.after.data();
    const oldData = change.before.data();
    
    console.log(`Image update detected for ${imageId}`);
    
    // Vérifier si des champs importants ont été modifiés
    if (isSignificantChange(oldData, newData)) {
      console.log(`Significant changes detected for image ${imageId}, starting synchronization`);
      
      // Récupérer les champs à synchroniser
      const fieldsToSync = extractSyncFields(newData);
      
      try {
        // Synchroniser avec toutes les collections
        await Promise.all([
          syncWithFavorites(imageId, fieldsToSync),
          syncWithDownloadHistory(imageId, fieldsToSync),
          syncWithCustomCollections(imageId, fieldsToSync),
          syncWithMyImages(imageId, fieldsToSync),
        ]);
        
        console.log(`Image ${imageId} synchronized successfully across all collections`);
      } catch (error) {
        console.error(`Error synchronizing image ${imageId}:`, error);
      }
    } else {
      console.log(`No significant changes for image ${imageId}, skipping synchronization`);
    }
    
    return null;
  });

/**
 * Fonction déclenchée lorsqu'une image est supprimée dans la collection 'post'
 * Supprime l'image dans toutes les collections où elle est référencée
 */
exports.syncImageDelete = functions.firestore
  .document('post/{imageId}')
  .onDelete(async (snapshot, context) => {
    const imageId = context.params.imageId;
    const imageData = snapshot.data();
    
    console.log(`Image deletion detected for ${imageId}`);
    
    try {
      // Supprimer dans toutes les collections système
      await Promise.all([
        deleteFromFavorites(imageId, imageData),
        deleteFromDownloadHistory(imageId, imageData),
        deleteFromMyImages(imageId, imageData)
      ]);
      
      // Gérer les collections personnalisées
      await deleteFromCustomCollections(imageId, imageData);
      
      console.log(`Image ${imageId} deleted across all collections`);
    } catch (error) {
      console.error(`Error handling deletion for image ${imageId}:`, error);
    }
    
    return null;
  });

/**
 * Vérifie si les modifications apportées à l'image sont significatives et nécessitent une synchronisation
 * @param {Object} oldData Anciennes données de l'image
 * @param {Object} newData Nouvelles données de l'image
 * @returns {boolean} True si les modifications sont significatives
 */
function isSignificantChange(oldData, newData) {
  // Liste des champs à surveiller pour les modifications
  const significantFields = [
    'title', 'description', 'url', 'webpURL', 'imageURL', 
    'tags', 'categories', 'isDeleted', 'isHidden'
  ];
  
  // Vérifier si l'un des champs importants a été modifié
  return significantFields.some(field => {
    // Si le champ est un objet ou un tableau, vérifier s'il a changé en profondeur
    if (typeof oldData[field] === 'object' && oldData[field] !== null) {
      return JSON.stringify(oldData[field]) !== JSON.stringify(newData[field]);
    }
    // Sinon, comparer directement les valeurs
    return oldData[field] !== newData[field];
  });
}

/**
 * Extrait les champs à synchroniser à partir des données de l'image
 * @param {Object} imageData Données de l'image
 * @returns {Object} Champs à synchroniser
 */
function extractSyncFields(imageData) {
  // Liste des champs à synchroniser
  const fieldsToSync = {};
  
  // Champs à synchroniser
  const syncFields = [
    'title', 'description', 'url', 'webpURL', 'imageURL', 
    'tags', 'categories', 'isDeleted', 'isHidden'
  ];
  
  // Extraire uniquement les champs nécessaires
  syncFields.forEach(field => {
    if (imageData[field] !== undefined) {
      fieldsToSync[field] = imageData[field];
    }
  });
  
  // Ajouter un champ indiquant la dernière synchronisation
  fieldsToSync.lastSyncedAt = admin.firestore.FieldValue.serverTimestamp();
  
  return fieldsToSync;
}

/**
 * Synchronise les modifications d'une image avec toutes les collections de favoris
 * @param {string} imageId ID de l'image
 * @param {Object} fieldsToSync Champs à synchroniser
 */
async function syncWithFavorites(imageId, fieldsToSync) {
  console.log(`Synchronizing image ${imageId} with favorites collections`);
  
  try {
    // Récupérer tous les utilisateurs
    const usersRef = db.collection('users');
    const usersSnapshot = await usersRef.get();
    
    if (usersSnapshot.empty) {
      console.log('No users found to sync favorites');
      return;
    }
    
    // Créer un batch pour les mises à jour
    let batch = db.batch();
    let operationCount = 0;
    const MAX_BATCH_SIZE = 500; // Limite de Firestore pour les opérations par lot
    
    // Pour chaque utilisateur, vérifier s'il a l'image dans ses favoris
    for (const userDoc of usersSnapshot.docs) {
      const userEmail = userDoc.id;
      const favoriteRef = db.doc(`users/${userEmail}/favorites/${imageId}`);
      const favoriteDoc = await favoriteRef.get();
      
      if (favoriteDoc.exists) {
        console.log(`Found image ${imageId} in favorites of user ${userEmail}`);
        batch.update(favoriteRef, fieldsToSync);
        operationCount++;
        
        // Si le batch atteint la limite, le soumettre et en créer un nouveau
        if (operationCount >= MAX_BATCH_SIZE) {
          await batch.commit();
          console.log(`Committed batch of ${operationCount} favorites updates`);
          batch = db.batch();
          operationCount = 0;
        }
      }
    }
    
    // Soumettre le dernier batch s'il contient des opérations
    if (operationCount > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${operationCount} favorites updates`);
    }
    
    console.log(`Completed synchronization with favorites for image ${imageId}`);
  } catch (error) {
    console.error(`Error synchronizing with favorites:`, error);
    throw error;
  }
}

/**
 * Synchronise les modifications d'une image avec tous les historiques de téléchargement
 * @param {string} imageId ID de l'image
 * @param {Object} fieldsToSync Champs à synchroniser
 */
async function syncWithDownloadHistory(imageId, fieldsToSync) {
  console.log(`Synchronizing image ${imageId} with download history collections`);
  
  try {
    // Récupérer tous les utilisateurs
    const usersRef = db.collection('users');
    const usersSnapshot = await usersRef.get();
    
    if (usersSnapshot.empty) {
      console.log('No users found to sync download history');
      return;
    }
    
    // Créer un batch pour les mises à jour
    let batch = db.batch();
    let operationCount = 0;
    const MAX_BATCH_SIZE = 500;
    
    // Pour chaque utilisateur, rechercher l'image dans son historique de téléchargement
    for (const userDoc of usersSnapshot.docs) {
      const userEmail = userDoc.id;
      
      // Rechercher les documents dans downloadHistory qui ont originalId ou articleId égal à imageId
      const downloadHistoryRef = db.collection(`users/${userEmail}/downloadHistory`);
      const query1 = downloadHistoryRef.where('originalId', '==', imageId);
      const query2 = downloadHistoryRef.where('articleId', '==', imageId);
      
      // Exécuter les deux requêtes
      const [snapshot1, snapshot2] = await Promise.all([
        query1.get(),
        query2.get()
      ]);
      
      // Traiter les résultats de la première requête
      for (const doc of snapshot1.docs) {
        console.log(`Found image ${imageId} in download history of user ${userEmail} (originalId match)`);
        batch.update(doc.ref, fieldsToSync);
        operationCount++;
        
        if (operationCount >= MAX_BATCH_SIZE) {
          await batch.commit();
          console.log(`Committed batch of ${operationCount} download history updates`);
          batch = db.batch();
          operationCount = 0;
        }
      }
      
      // Traiter les résultats de la deuxième requête (en évitant les doublons)
      for (const doc of snapshot2.docs) {
        // Vérifier si ce document n'a pas déjà été traité dans la première requête
        if (!snapshot1.docs.some(d => d.id === doc.id)) {
          console.log(`Found image ${imageId} in download history of user ${userEmail} (articleId match)`);
          batch.update(doc.ref, fieldsToSync);
          operationCount++;
          
          if (operationCount >= MAX_BATCH_SIZE) {
            await batch.commit();
            console.log(`Committed batch of ${operationCount} download history updates`);
            batch = db.batch();
            operationCount = 0;
          }
        }
      }
    }
    
    // Soumettre le dernier batch s'il contient des opérations
    if (operationCount > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${operationCount} download history updates`);
    }
    
    console.log(`Completed synchronization with download history for image ${imageId}`);
  } catch (error) {
    console.error(`Error synchronizing with download history:`, error);
    throw error;
  }
}

/**
 * Synchronise les modifications d'une image avec toutes les collections personnalisées
 * @param {string} imageId ID de l'image
 * @param {Object} fieldsToSync Champs à synchroniser
 */
async function syncWithCustomCollections(imageId, fieldsToSync) {
  console.log(`Synchronizing image ${imageId} with custom collections`);
  
  try {
    // Récupérer tous les utilisateurs
    const usersRef = db.collection('users');
    const usersSnapshot = await usersRef.get();
    
    if (usersSnapshot.empty) {
      console.log('No users found to sync custom collections');
      return;
    }
    
    // Pour chaque utilisateur, rechercher l'image dans ses collections personnalisées
    for (const userDoc of usersSnapshot.docs) {
      const userEmail = userDoc.id;
      
      // Récupérer toutes les collections de l'utilisateur
      const collectionsRef = db.collection(`users/${userEmail}/collections`);
      const collectionsSnapshot = await collectionsRef.get();
      
      if (collectionsSnapshot.empty) {
        continue; // Passer à l'utilisateur suivant
      }
      
      for (const collectionDoc of collectionsSnapshot.docs) {
        const collectionData = collectionDoc.data();
        
        // Vérifier si la collection contient l'image
        if (collectionData.imageIds && collectionData.imageIds.includes(imageId)) {
          console.log(`Found image ${imageId} in custom collection ${collectionDoc.id} of user ${userEmail}`);
          
          // Note: Comme les collections personnalisées stockent uniquement les IDs des images,
          // nous devons mettre à jour les métadonnées de l'image dans la sous-collection images
          const imagesRef = db.collection(`users/${userEmail}/collections/${collectionDoc.id}/images`);
          const imageDoc = await imagesRef.doc(imageId).get();
          
          if (imageDoc.exists) {
            await imageDoc.ref.update(fieldsToSync);
            console.log(`Updated image metadata in collection ${collectionDoc.id}`);
          } else {
            // Si les métadonnées n'existent pas encore, les créer
            await imagesRef.doc(imageId).set({
              id: imageId,
              ...fieldsToSync
            });
            console.log(`Created image metadata in collection ${collectionDoc.id}`);
          }
        }
      }
    }
    
    console.log(`Completed synchronization with custom collections for image ${imageId}`);
  } catch (error) {
    console.error(`Error synchronizing with custom collections:`, error);
    throw error;
  }
}

/**
 * Synchronise les modifications d'une image avec la collection MyImages de l'utilisateur
 * @param {string} imageId ID de l'image
 * @param {Object} fieldsToSync Champs à synchroniser
 */
async function syncWithMyImages(imageId, fieldsToSync) {
  console.log(`Synchronizing image ${imageId} with MyImages collection`);
  
  try {
    // Récupérer l'email de l'utilisateur à partir des données de l'image
    const imageRef = db.collection('post').doc(imageId);
    const imageDoc = await imageRef.get();
    
    if (!imageDoc.exists) {
      console.log(`Image ${imageId} not found in post collection`);
      return;
    }
    
    const imageData = imageDoc.data();
    const userEmail = imageData.userEmail;
    
    if (!userEmail) {
      console.log(`No userEmail found for image ${imageId}, cannot sync with MyImages`);
      return;
    }
    
    // Mettre à jour l'image dans la collection MyImages de l'utilisateur
    const myImagesRef = db.doc(`users/${userEmail}/MyImages/${imageId}`);
    const myImagesDoc = await myImagesRef.get();
    
    if (myImagesDoc.exists) {
      await myImagesRef.update(fieldsToSync);
      console.log(`Updated image ${imageId} in MyImages for user ${userEmail}`);
    } else {
      // Si l'image n'existe pas encore dans MyImages, la créer
      await myImagesRef.set({
        id: imageId,
        ...fieldsToSync
      });
      console.log(`Created image ${imageId} in MyImages for user ${userEmail}`);
    }
    
    console.log(`Completed synchronization with MyImages for image ${imageId}`);
  } catch (error) {
    console.error(`Error synchronizing with MyImages:`, error);
    throw error;
  }
}

/**
 * Supprime une image de toutes les collections de favoris
 * @param {string} imageId ID de l'image
 * @param {Object} imageData Données de l'image
 */
async function deleteFromFavorites(imageId, imageData) {
  console.log(`Deleting image ${imageId} from favorites collections`);
  
  try {
    // Récupérer tous les utilisateurs
    const usersRef = db.collection('users');
    const usersSnapshot = await usersRef.get();
    
    if (usersSnapshot.empty) {
      console.log('No users found to delete from favorites');
      return;
    }
    
    // Créer un batch pour les suppressions
    let batch = db.batch();
    let operationCount = 0;
    const MAX_BATCH_SIZE = 500;
    
    // Pour chaque utilisateur, vérifier s'il a l'image dans ses favoris
    for (const userDoc of usersSnapshot.docs) {
      const userEmail = userDoc.id;
      const favoriteRef = db.doc(`users/${userEmail}/favorites/${imageId}`);
      const favoriteDoc = await favoriteRef.get();
      
      if (favoriteDoc.exists) {
        console.log(`Found image ${imageId} in favorites of user ${userEmail}`);
        batch.delete(favoriteRef);
        operationCount++;
        
        // Si le batch atteint la limite, le soumettre et en créer un nouveau
        if (operationCount >= MAX_BATCH_SIZE) {
          await batch.commit();
          console.log(`Committed batch of ${operationCount} favorites deletions`);
          batch = db.batch();
          operationCount = 0;
        }
      }
    }
    
    // Soumettre le dernier batch s'il contient des opérations
    if (operationCount > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${operationCount} favorites deletions`);
    }
    
    console.log(`Completed deletion from favorites for image ${imageId}`);
  } catch (error) {
    console.error(`Error deleting from favorites:`, error);
    throw error;
  }
}

/**
 * Supprime une image de tous les historiques de téléchargement
 * @param {string} imageId ID de l'image
 * @param {Object} imageData Données de l'image
 */
async function deleteFromDownloadHistory(imageId, imageData) {
  console.log(`Deleting image ${imageId} from download history collections`);
  
  try {
    // Récupérer tous les utilisateurs
    const usersRef = db.collection('users');
    const usersSnapshot = await usersRef.get();
    
    if (usersSnapshot.empty) {
      console.log('No users found to delete from download history');
      return;
    }
    
    // Créer un batch pour les suppressions
    let batch = db.batch();
    let operationCount = 0;
    const MAX_BATCH_SIZE = 500;
    
    // Pour chaque utilisateur, rechercher l'image dans son historique de téléchargement
    for (const userDoc of usersSnapshot.docs) {
      const userEmail = userDoc.id;
      
      // Rechercher les documents dans downloadHistory qui ont originalId ou articleId égal à imageId
      const downloadHistoryRef = db.collection(`users/${userEmail}/downloadHistory`);
      const query1 = downloadHistoryRef.where('originalId', '==', imageId);
      const query2 = downloadHistoryRef.where('articleId', '==', imageId);
      
      // Exécuter les deux requêtes
      const [snapshot1, snapshot2] = await Promise.all([
        query1.get(),
        query2.get()
      ]);
      
      // Traiter les résultats de la première requête
      for (const doc of snapshot1.docs) {
        console.log(`Found image ${imageId} in download history of user ${userEmail} (originalId match)`);
        batch.delete(doc.ref);
        operationCount++;
        
        if (operationCount >= MAX_BATCH_SIZE) {
          await batch.commit();
          console.log(`Committed batch of ${operationCount} download history deletions`);
          batch = db.batch();
          operationCount = 0;
        }
      }
      
      // Traiter les résultats de la deuxième requête (en évitant les doublons)
      for (const doc of snapshot2.docs) {
        // Vérifier si ce document n'a pas déjà été traité dans la première requête
        if (!snapshot1.docs.some(d => d.id === doc.id)) {
          console.log(`Found image ${imageId} in download history of user ${userEmail} (articleId match)`);
          batch.delete(doc.ref);
          operationCount++;
          
          if (operationCount >= MAX_BATCH_SIZE) {
            await batch.commit();
            console.log(`Committed batch of ${operationCount} download history deletions`);
            batch = db.batch();
            operationCount = 0;
          }
        }
      }
    }
    
    // Soumettre le dernier batch s'il contient des opérations
    if (operationCount > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${operationCount} download history deletions`);
    }
    
    console.log(`Completed deletion from download history for image ${imageId}`);
  } catch (error) {
    console.error(`Error deleting from download history:`, error);
    throw error;
  }
}

/**
 * Supprime une image de toutes les collections personnalisées
 * @param {string} imageId ID de l'image
 * @param {Object} imageData Données de l'image
 */
async function deleteFromCustomCollections(imageId, imageData) {
  console.log(`Deleting image ${imageId} from custom collections`);
  
  try {
    // Récupérer tous les utilisateurs
    const usersRef = db.collection('users');
    const usersSnapshot = await usersRef.get();
    
    if (usersSnapshot.empty) {
      console.log('No users found to delete from custom collections');
      return;
    }
    
    // Pour chaque utilisateur, rechercher l'image dans ses collections personnalisées
    for (const userDoc of usersSnapshot.docs) {
      const userEmail = userDoc.id;
      
      // Récupérer toutes les collections de l'utilisateur
      const collectionsRef = db.collection(`users/${userEmail}/collections`);
      const collectionsSnapshot = await collectionsRef.get();
      
      if (collectionsSnapshot.empty) {
        continue; // Passer à l'utilisateur suivant
      }
      
      // Pour chaque collection, vérifier si elle contient l'image
      for (const collectionDoc of collectionsSnapshot.docs) {
        const collectionData = collectionDoc.data();
        const collectionRef = collectionDoc.ref;
        
        // Vérifier si la collection contient l'image
        if (collectionData.imageIds && collectionData.imageIds.includes(imageId)) {
          console.log(`Found image ${imageId} in custom collection ${collectionDoc.id} of user ${userEmail}`);
          
          // Supprimer l'image de la collection
          await collectionRef.update({
            imageIds: admin.firestore.FieldValue.arrayRemove(imageId),
            imageCount: admin.firestore.FieldValue.increment(-1),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          // Supprimer également les métadonnées de l'image si elles existent
          const imageMetadataRef = db.doc(`users/${userEmail}/collections/${collectionDoc.id}/images/${imageId}`);
          const imageMetadataDoc = await imageMetadataRef.get();
          
          if (imageMetadataDoc.exists) {
            await imageMetadataRef.delete();
          }
          
          console.log(`Removed image ${imageId} from collection ${collectionDoc.id}`);
        }
      }
    }
    
    console.log(`Completed deletion from custom collections for image ${imageId}`);
  } catch (error) {
    console.error(`Error deleting from custom collections:`, error);
    throw error;
  }
}

/**
 * Supprime une image de la collection MyImages de l'utilisateur
 * @param {string} imageId ID de l'image
 * @param {Object} imageData Données de l'image
 */
async function deleteFromMyImages(imageId, imageData) {
  console.log(`Deleting image ${imageId} from MyImages collection`);
  
  try {
    // Récupérer l'email de l'utilisateur à partir des données de l'image
    const userEmail = imageData.userEmail;
    
    if (userEmail) {
      // Accéder à la collection MyImages de l'utilisateur
      const myImagesRef = db.doc(`users/${userEmail}/MyImages/${imageId}`);
      
      // Vérifier si l'image existe dans MyImages
      const myImagesDoc = await myImagesRef.get();
      
      if (myImagesDoc.exists) {
        // Supprimer l'image de MyImages
        await myImagesRef.delete();
        console.log(`Successfully deleted image ${imageId} from MyImages for user ${userEmail}`);
      } else {
        console.log(`Image ${imageId} not found in MyImages for user ${userEmail}`);
      }
    } else {
      console.log(`No userEmail found for image ${imageId}, cannot delete from MyImages`);
    }
  } catch (error) {
    console.error(`Error deleting from MyImages:`, error);
    throw error;
  }
}
