const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc } = require('firebase/firestore');
const { getStorage, ref, getDownloadURL } = require('firebase/storage');
const admin = require('firebase-admin');
const serviceAccount = require('/Users/florent/Downloads/pixelynth-c41ea-firebase-adminsdk-as8n5-5c70fe6823.json'); // Update with the correct path

const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "pixelynth-c41ea.firebaseapp.com",
    projectId: "pixelynth-c41ea",
    storageBucket: "pixelynth-c41ea.appspot.com",
    messagingSenderId: "your-messaging-sender-id",
    appId: "your-app-id"
};

// Initialiser l'application Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/**
 * Crée une version en minuscules d'une chaîne de caractères
 * @param {string} text - Texte à convertir
 * @returns {string} - Version en minuscules
 */
function toLowercase(text) {
  if (!text || typeof text !== 'string') return '';
  return text.toLowerCase().trim();
}

/**
 * Extrait des tags à partir d'un titre et d'une description
 * @param {string} title - Titre du document
 * @param {string} description - Description du document
 * @returns {Array} - Tableau de tags
 */
function extractTags(title, description) {
  const tags = new Set();
  
  // Extraire les mots du titre et de la description
  const words = `${title || ''} ${description || ''}`.toLowerCase()
    .replace(/[^\w\s]/g, '') // Supprimer la ponctuation
    .split(/\s+/) // Diviser par espaces
    .filter(word => word.length > 2); // Ignorer les mots trop courts
  
  // Ajouter les mots comme tags
  words.forEach(word => tags.add(word));
  
  return Array.from(tags);
}

/**
 * Met à jour un lot de documents
 * @param {Array} batch - Lot de documents à mettre à jour
 * @returns {Promise} - Promesse résolue lorsque les mises à jour sont terminées
 */
async function updateBatch(batch) {
  console.log(`Mise à jour d'un lot de ${batch.length} documents...`);
  
  const updatePromises = batch.map(async (doc) => {
    const data = doc.data();
    const updates = {};
    
    // Ajouter lowercaseTitle si title existe
    if (data.title && !data.lowercaseTitle) {
      updates.lowercaseTitle = toLowercase(data.title);
    }
    
    // Ajouter lowercaseDesc si description existe
    if (data.description && !data.lowercaseDesc) {
      updates.lowercaseDesc = toLowercase(data.description);
    }
    
    // Ajouter tags s'ils n'existent pas ou sont vides
    if (!data.tags || data.tags.length === 0) {
      updates.tags = extractTags(data.title, data.description);
    }
    
    // Mettre à jour le document si des modifications sont nécessaires
    if (Object.keys(updates).length > 0) {
      try {
        await db.collection('post').doc(doc.id).update(updates);
        console.log(`Document ${doc.id} mis à jour avec succès`);
        return { success: true, id: doc.id };
      } catch (error) {
        console.error(`Erreur lors de la mise à jour du document ${doc.id}:`, error);
        return { success: false, id: doc.id, error };
      }
    } else {
      console.log(`Document ${doc.id} déjà à jour`);
      return { success: true, id: doc.id, noChanges: true };
    }
  });
  
  return Promise.all(updatePromises);
}

/**
 * Met à jour tous les documents de la collection post
 */
async function updateAllDocuments() {
  try {
    console.log('Début de la mise à jour des documents...');
    
    // Statistiques
    let totalDocuments = 0;
    let updatedDocuments = 0;
    let failedDocuments = 0;
    let alreadyUpdatedDocuments = 0;
    
    // Récupérer tous les documents par lots
    const processNextBatch = async (lastDoc = null) => {
      let query = db.collection('post').limit(500);
      
      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }
      
      const snapshot = await query.get();
      
      if (snapshot.empty) {
        console.log('Plus de documents à traiter.');
        return;
      }
      
      totalDocuments += snapshot.docs.length;
      console.log(`Traitement de ${snapshot.docs.length} documents...`);
      
      // Mettre à jour le lot actuel
      const results = await updateBatch(snapshot.docs);
      
      // Mettre à jour les statistiques
      results.forEach(result => {
        if (result.success) {
          if (result.noChanges) {
            alreadyUpdatedDocuments++;
          } else {
            updatedDocuments++;
          }
        } else {
          failedDocuments++;
        }
      });
      
      // Traiter le lot suivant s'il y a plus de documents
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      if (snapshot.docs.length === 500) {
        await processNextBatch(lastVisible);
      }
    };
    
    // Commencer le traitement
    await processNextBatch();
    
    // Afficher les statistiques finales
    console.log('\n--- Statistiques finales ---');
    console.log(`Total de documents traités: ${totalDocuments}`);
    console.log(`Documents mis à jour: ${updatedDocuments}`);
    console.log(`Documents déjà à jour: ${alreadyUpdatedDocuments}`);
    console.log(`Échecs: ${failedDocuments}`);
    
    console.log('\nMise à jour terminée avec succès!');
  } catch (error) {
    console.error('Erreur lors de la mise à jour des documents:', error);
  } finally {
    // Terminer le processus
    process.exit(0);
  }
}

// Exécuter la fonction principale
updateAllDocuments();
