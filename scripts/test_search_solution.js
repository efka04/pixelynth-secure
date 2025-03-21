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
 * Teste la création d'un document avec les champs de recherche
 * @returns {Promise<string>} - ID du document créé
 */
async function testCreateDocument() {
  console.log('\n--- Test de création de document ---');
  
  const testData = {
    title: 'Test de recherche ' + Date.now(),
    description: 'Ceci est un document de test pour vérifier la fonctionnalité de recherche',
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    color: 'blue',
    orientation: 'landscape',
    people: 'none'
  };
  
  // Enrichir les données avec les champs de recherche
  const enrichedData = {
    ...testData,
    lowercaseTitle: testData.title.toLowerCase(),
    lowercaseDesc: testData.description.toLowerCase(),
    tags: testData.title.toLowerCase().split(/\s+/).concat(
      testData.description.toLowerCase().split(/\s+/)
    ).filter(word => word.length > 2)
  };
  
  try {
    const docRef = await db.collection('post').add(enrichedData);
    console.log('✅ Document créé avec succès, ID:', docRef.id);
    console.log('Données:', enrichedData);
    return docRef.id;
  } catch (error) {
    console.error('❌ Erreur lors de la création du document:', error);
    throw error;
  }
}

/**
 * Teste la recherche d'un document par titre
 * @param {string} term - Terme de recherche
 * @returns {Promise<Array>} - Résultats de la recherche
 */
async function testSearchByTitle(term) {
  console.log(`\n--- Test de recherche par titre: "${term}" ---`);
  
  try {
    const lowerTerm = term.toLowerCase();
    
    const query = db.collection('post')
      .where('lowercaseTitle', '>=', lowerTerm)
      .where('lowercaseTitle', '<=', lowerTerm + '\uf8ff')
      .limit(5);
    
    const snapshot = await query.get();
    
    console.log(`✅ Recherche par titre effectuée, ${snapshot.docs.length} résultats trouvés`);
    
    const results = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    results.forEach(doc => {
      console.log(`- Document ${doc.id}: ${doc.title}`);
    });
    
    return results;
  } catch (error) {
    console.error('❌ Erreur lors de la recherche par titre:', error);
    throw error;
  }
}

/**
 * Teste la recherche d'un document par description
 * @param {string} term - Terme de recherche
 * @returns {Promise<Array>} - Résultats de la recherche
 */
async function testSearchByDescription(term) {
  console.log(`\n--- Test de recherche par description: "${term}" ---`);
  
  try {
    const lowerTerm = term.toLowerCase();
    
    const query = db.collection('post')
      .where('lowercaseDesc', '>=', lowerTerm)
      .where('lowercaseDesc', '<=', lowerTerm + '\uf8ff')
      .limit(5);
    
    const snapshot = await query.get();
    
    console.log(`✅ Recherche par description effectuée, ${snapshot.docs.length} résultats trouvés`);
    
    const results = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    results.forEach(doc => {
      console.log(`- Document ${doc.id}: ${doc.title}`);
      console.log(`  Description: ${doc.description.substring(0, 50)}...`);
    });
    
    return results;
  } catch (error) {
    console.error('❌ Erreur lors de la recherche par description:', error);
    throw error;
  }
}

/**
 * Teste la recherche d'un document par tag
 * @param {string} tag - Tag à rechercher
 * @returns {Promise<Array>} - Résultats de la recherche
 */
async function testSearchByTag(tag) {
  console.log(`\n--- Test de recherche par tag: "${tag}" ---`);
  
  try {
    const lowerTag = tag.toLowerCase();
    
    const query = db.collection('post')
      .where('tags', 'array-contains', lowerTag)
      .limit(5);
    
    const snapshot = await query.get();
    
    console.log(`✅ Recherche par tag effectuée, ${snapshot.docs.length} résultats trouvés`);
    
    const results = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    results.forEach(doc => {
      console.log(`- Document ${doc.id}: ${doc.title}`);
      console.log(`  Tags: ${doc.tags.join(', ')}`);
    });
    
    return results;
  } catch (error) {
    console.error('❌ Erreur lors de la recherche par tag:', error);
    throw error;
  }
}

/**
 * Supprime un document de test
 * @param {string} docId - ID du document à supprimer
 */
async function cleanupTestDocument(docId) {
  console.log(`\n--- Nettoyage du document de test ${docId} ---`);
  
  try {
    await db.collection('post').doc(docId).delete();
    console.log('✅ Document supprimé avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du document:', error);
  }
}

/**
 * Exécute tous les tests
 */
async function runAllTests() {
  console.log('=== DÉBUT DES TESTS DE LA SOLUTION DE RECHERCHE ===\n');
  
  try {
    // Créer un document de test
    const docId = await testCreateDocument();
    
    // Attendre que le document soit indexé
    console.log('\nAttente de l\'indexation du document...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Tester la recherche par titre
    await testSearchByTitle('Test de recherche');
    
    // Tester la recherche par description
    await testSearchByDescription('document de test');
    
    // Tester la recherche par tag
    await testSearchByTag('recherche');
    
    // Nettoyer le document de test
    await cleanupTestDocument(docId);
    
    console.log('\n=== TESTS TERMINÉS AVEC SUCCÈS ===');
  } catch (error) {
    console.error('\n=== ERREUR LORS DES TESTS ===');
    console.error(error);
  } finally {
    // Terminer le processus
    process.exit(0);
  }
}

// Exécuter les tests
runAllTests();
