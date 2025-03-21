// Script pour mettre à jour les tags des images existantes
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  writeBatch,
  query,
  limit
} = require('firebase/firestore');
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "pixelynth-c41ea.firebaseapp.com",
  projectId: "pixelynth-c41ea",
  storageBucket: "pixelynth-c41ea.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};


// Fonction d'extraction de tags (copiée depuis app/utils/tagExtraction.js)
const extractTagsFromText = (title = '', description = '', existingTags = [], maxTags = 20) => {
  // Vérifier si nous avons déjà atteint le nombre maximum de tags
  if (existingTags.length >= maxTags) {
    return existingTags;
  }

  // Combiner le titre et la description pour l'analyse
  const combinedText = `${title} ${description}`.toLowerCase();
  
  // Nettoyer le texte et le diviser en mots
  const words = combinedText
    .replace(/[^\w\s]/g, ' ') // Remplacer les caractères spéciaux par des espaces
    .replace(/\s+/g, ' ')     // Remplacer les espaces multiples par un seul espace
    .trim()
    .split(' ');
  
  // Filtrer les mots pour trouver des tags potentiels
  const potentialTags = words
    .filter(word => {
      // Ignorer les mots courts (moins de 3 caractères)
      if (word.length < 3) return false;
      
      // Ignorer les mots communs (articles, prépositions, etc.)
      const commonWords = [
        'the', 'and', 'for', 'with', 'this', 'that', 'from', 'have', 'has',
        'are', 'not', 'but', 'what', 'all', 'was', 'were', 'they', 'their',
        'when', 'will', 'who', 'how', 'where', 'which', 'there', 'been',
        'les', 'des', 'une', 'pour', 'dans', 'avec', 'sur', 'par', 'est',
        'sont', 'vous', 'nous', 'ils', 'elles', 'mais', 'donc', 'car', 'que'
      ];
      
      return !commonWords.includes(word);
    })
    .filter(word => !existingTags.includes(word)) // Éviter les doublons avec les tags existants
    .slice(0, maxTags - existingTags.length);     // Limiter au nombre maximum de tags autorisés
  
  // Combiner les tags existants avec les nouveaux tags extraits
  return [...existingTags, ...potentialTags];
};

// Fonction pour améliorer les données d'image avec des tags extraits
const enhanceImageDataWithTags = (imageData) => {
  if (!imageData) return imageData;
  
  // Extraire des tags à partir du titre et de la description
  const enhancedTags = extractTagsFromText(
    imageData.title,
    imageData.desc,
    imageData.tags || [],
    20 // Limite maximale de tags
  );
  
  // Mettre à jour les tags dans l'objet imageData
  return {
    ...imageData,
    tags: enhancedTags
  };
};

// Fonction pour ajouter les champs lowercaseTitle et lowercaseDesc
const addLowercaseFields = (imageData) => {
  if (!imageData) return imageData;
  
  return {
    ...imageData,
    lowercaseTitle: imageData.title ? imageData.title.toLowerCase() : '',
    lowercaseDesc: imageData.desc ? imageData.desc.toLowerCase() : ''
  };
};

// Fonction principale pour mettre à jour les images
async function updateExistingImages() {
  console.log('Initialisation de la mise à jour des images existantes...');
  
  // Initialiser Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  try {
    // Collections à mettre à jour
    const collections = ['post', 'temporary'];
    let totalUpdated = 0;
    
    for (const collectionName of collections) {
      console.log(`Traitement de la collection: ${collectionName}`);
      
      // Obtenir tous les documents de la collection
      const q = query(collection(db, collectionName));
      const querySnapshot = await getDocs(q);
      
      // Utiliser des lots (batches) pour les mises à jour groupées
      // Firestore limite les lots à 500 opérations
      const BATCH_SIZE = 450;
      let batch = writeBatch(db);
      let operationCount = 0;
      let batchCount = 1;
      
      console.log(`Nombre de documents trouvés: ${querySnapshot.size}`);
      
      for (const docSnapshot of querySnapshot.docs) {
        const imageData = docSnapshot.data();
        
        // Vérifier si les champs lowercaseTitle et lowercaseDesc existent déjà
        const needsLowercaseFields = !imageData.lowercaseTitle || !imageData.lowercaseDesc;
        
        // Appliquer les transformations nécessaires
        let updatedData = imageData;
        
        // Ajouter les champs en minuscules si nécessaire
        if (needsLowercaseFields) {
          updatedData = addLowercaseFields(updatedData);
        }
        
        // Extraire et ajouter des tags supplémentaires
        updatedData = enhanceImageDataWithTags(updatedData);
        
        // Vérifier si des modifications ont été apportées
        const tagsChanged = JSON.stringify(imageData.tags) !== JSON.stringify(updatedData.tags);
        
        if (needsLowercaseFields || tagsChanged) {
          // Préparer les données à mettre à jour
          const updateData = {
            ...(needsLowercaseFields ? { 
              lowercaseTitle: updatedData.lowercaseTitle,
              lowercaseDesc: updatedData.lowercaseDesc 
            } : {}),
            ...(tagsChanged ? { tags: updatedData.tags } : {})
          };
          
          // Ajouter la mise à jour au lot
          const docRef = doc(db, collectionName, docSnapshot.id);
          batch.update(docRef, updateData);
          operationCount++;
          totalUpdated++;
          
          // Si le lot atteint la limite, le soumettre et en créer un nouveau
          if (operationCount >= BATCH_SIZE) {
            console.log(`Soumission du lot #${batchCount} (${operationCount} opérations)`);
            await batch.commit();
            batch = writeBatch(db);
            operationCount = 0;
            batchCount++;
          }
        }
      }
      
      // Soumettre le dernier lot s'il contient des opérations
      if (operationCount > 0) {
        console.log(`Soumission du dernier lot #${batchCount} (${operationCount} opérations)`);
        await batch.commit();
      }
      
      console.log(`Collection ${collectionName} traitée.`);
    }
    
    console.log(`Mise à jour terminée. Total des documents mis à jour: ${totalUpdated}`);
    
    // Mise à jour des images dans les collections MyImages des utilisateurs
    console.log('Mise à jour des collections MyImages des utilisateurs...');
    
    // Obtenir tous les utilisateurs
    const usersSnapshot = await getDocs(collection(db, 'users'));
    let userImagesUpdated = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userEmail = userDoc.id;
      console.log(`Traitement des images de l'utilisateur: ${userEmail}`);
      
      // Obtenir les images de l'utilisateur
      const myImagesRef = collection(db, 'users', userEmail, 'MyImages');
      const myImagesSnapshot = await getDocs(myImagesRef);
      
      let batch = writeBatch(db);
      let operationCount = 0;
      let batchCount = 1;
      
      for (const imageDoc of myImagesSnapshot.docs) {
        const imageData = imageDoc.data();
        
        // Vérifier si les champs lowercaseTitle et lowercaseDesc existent déjà
        const needsLowercaseFields = !imageData.lowercaseTitle || !imageData.lowercaseDesc;
        
        // Appliquer les transformations nécessaires
        let updatedData = imageData;
        
        // Ajouter les champs en minuscules si nécessaire
        if (needsLowercaseFields) {
          updatedData = addLowercaseFields(updatedData);
        }
        
        // Extraire et ajouter des tags supplémentaires
        updatedData = enhanceImageDataWithTags(updatedData);
        
        // Vérifier si des modifications ont été apportées
        const tagsChanged = JSON.stringify(imageData.tags) !== JSON.stringify(updatedData.tags);
        
        if (needsLowercaseFields || tagsChanged) {
          // Préparer les données à mettre à jour
          const updateData = {
            ...(needsLowercaseFields ? { 
              lowercaseTitle: updatedData.lowercaseTitle,
              lowercaseDesc: updatedData.lowercaseDesc 
            } : {}),
            ...(tagsChanged ? { tags: updatedData.tags } : {})
          };
          
          // Ajouter la mise à jour au lot
          const docRef = doc(db, 'users', userEmail, 'MyImages', imageDoc.id);
          batch.update(docRef, updateData);
          operationCount++;
          userImagesUpdated++;
          
          // Si le lot atteint la limite, le soumettre et en créer un nouveau
          if (operationCount >= BATCH_SIZE) {
            console.log(`Soumission du lot utilisateur #${batchCount} (${operationCount} opérations)`);
            await batch.commit();
            batch = writeBatch(db);
            operationCount = 0;
            batchCount++;
          }
        }
      }
      
      // Soumettre le dernier lot s'il contient des opérations
      if (operationCount > 0) {
        console.log(`Soumission du dernier lot utilisateur #${batchCount} (${operationCount} opérations)`);
        await batch.commit();
      }
    }
    
    console.log(`Mise à jour des images utilisateurs terminée. Total des documents mis à jour: ${userImagesUpdated}`);
    console.log(`Mise à jour globale terminée. Total général: ${totalUpdated + userImagesUpdated}`);
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour des images:', error);
  }
}

// Exécuter la fonction principale
updateExistingImages()
  .then(() => {
    console.log('Script terminé avec succès.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Erreur lors de l\'exécution du script:', error);
    process.exit(1);
  });
