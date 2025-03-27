/**
 * Script de synchronisation des statistiques pour pixelynth-secure
 * 
 * Ce script permet de recalculer et synchroniser toutes les statistiques dans la base de données:
 * - Compteur de photos par utilisateur
 * - Compteur de favoris par utilisateur et par photo
 * - Compteur de téléchargements par photo
 * - Initialisation des compteurs de vues
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialisation de Firebase Admin (à adapter selon votre configuration)
// Vous devez créer un fichier serviceAccountKey.json avec les informations d'identification
try {
  const serviceAccount = require('/Users/florent/Downloads/pixelynth-c41ea-firebase-adminsdk-as8n5-5c70fe6823.json'); // Update with the correct path
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error('Erreur lors de l\'initialisation de Firebase Admin:', error);
  console.log('Assurez-vous d\'avoir un fichier serviceAccountKey.json valide');
  process.exit(1);
}

const db = admin.firestore();

/**
 * Fonction principale qui exécute toutes les synchronisations
 */
async function synchronizeAllStats() {
  console.log('Début de la synchronisation des statistiques...');
  
  try {
    // 1. Récupérer tous les utilisateurs
    const usersSnapshot = await db.collection('users').get();
    const users = [];
    usersSnapshot.forEach(doc => {
      users.push({
        email: doc.id,
        ...doc.data()
      });
    });
    console.log(`Nombre d'utilisateurs trouvés: ${users.length}`);
    
    // 2. Récupérer toutes les photos (posts)
    const postsSnapshot = await db.collection('post').get();
    const posts = [];
    postsSnapshot.forEach(doc => {
      posts.push({
        id: doc.id,
        ...doc.data()
      });
    });
    console.log(`Nombre de photos trouvées: ${posts.length}`);
    
    // 3. Synchroniser les statistiques pour chaque utilisateur
    for (const user of users) {
      await synchronizeUserStats(user.email);
      console.log(`Statistiques synchronisées pour l'utilisateur: ${user.email}`);
    }
    
    // 4. Synchroniser les statistiques pour chaque photo
    for (const post of posts) {
      await synchronizePostStats(post.id);
      console.log(`Statistiques synchronisées pour la photo: ${post.id}`);
    }
    
    console.log('Synchronisation des statistiques terminée avec succès!');
    
    // Générer un rapport de synchronisation
    generateSyncReport(users.length, posts.length);
    
  } catch (error) {
    console.error('Erreur lors de la synchronisation des statistiques:', error);
  }
}

/**
 * Synchronise les statistiques pour un utilisateur spécifique
 * @param {string} userEmail - Email de l'utilisateur
 */
async function synchronizeUserStats(userEmail) {
  try {
    // 1. Compteur de photos
    const myImagesSnapshot = await db.collection('users').doc(userEmail).collection('MyImages').get();
    const photoCount = myImagesSnapshot.size;
    
    // 2. Compteur de favoris
    const favoritesSnapshot = await db.collection('users').doc(userEmail).collection('favorites').get();
    const favoritesCount = favoritesSnapshot.size;
    
    // 3. Mettre à jour le document utilisateur avec les compteurs corrects
    await db.collection('users').doc(userEmail).update({
      photoCount: photoCount,
      favoritesCount: favoritesCount,
      statsLastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // 4. Initialiser le compteur de vues total à 0 s'il n'existe pas
    const userDoc = await db.collection('users').doc(userEmail).get();
    if (!userDoc.data().totalViews) {
      await db.collection('users').doc(userEmail).update({
        totalViews: 0
      });
    }
    
    return {
      photoCount,
      favoritesCount
    };
  } catch (error) {
    console.error(`Erreur lors de la synchronisation des statistiques pour l'utilisateur ${userEmail}:`, error);
    throw error;
  }
}

/**
 * Synchronise les statistiques pour une photo spécifique
 * @param {string} postId - ID de la photo
 */
async function synchronizePostStats(postId) {
  try {
    // 1. Récupérer les données de la photo
    const postDoc = await db.collection('post').doc(postId).get();
    if (!postDoc.exists) {
      console.log(`La photo ${postId} n'existe pas.`);
      return null;
    }
    
    const postData = postDoc.data();
    const userEmail = postData.userEmail;
    
    if (!userEmail) {
      console.log(`La photo ${postId} n'a pas d'utilisateur associé.`);
      return null;
    }
    
    // 2. Compteur de favoris (likes)
    // Compter combien d'utilisateurs ont cette photo dans leurs favoris
    let likesCount = 0;
    const usersSnapshot = await db.collection('users').get();
    for (const userDoc of usersSnapshot.docs) {
      const favoriteDoc = await db.collection('users').doc(userDoc.id).collection('favorites').doc(postId).get();
      if (favoriteDoc.exists) {
        likesCount++;
      }
    }
    
    // 3. Initialiser les compteurs manquants
    const updates = {
      likes: likesCount,
      statsLastUpdated: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Initialiser downloadCount s'il n'existe pas
    if (!postData.downloadCount) {
      updates.downloadCount = 0;
    }
    
    // Initialiser viewCount s'il n'existe pas
    if (!postData.viewCount) {
      updates.viewCount = 0;
    }
    
    // 4. Mettre à jour le document de la photo
    await db.collection('post').doc(postId).update(updates);
    
    // 5. Synchroniser avec MyImages si le document existe
    const myImageDoc = await db.collection('users').doc(userEmail).collection('MyImages').doc(postId).get();
    if (myImageDoc.exists) {
      const myImageUpdates = {
        likes: likesCount,
        statsLastUpdated: admin.firestore.FieldValue.serverTimestamp()
      };
      
      if (!myImageDoc.data().downloadCount) {
        myImageUpdates.downloadCount = postData.downloadCount || 0;
      }
      
      if (!myImageDoc.data().viewCount) {
        myImageUpdates.viewCount = postData.viewCount || 0;
      }
      
      await db.collection('users').doc(userEmail).collection('MyImages').doc(postId).update(myImageUpdates);
    }
    
    return {
      likesCount,
      downloadCount: postData.downloadCount || 0,
      viewCount: postData.viewCount || 0
    };
  } catch (error) {
    console.error(`Erreur lors de la synchronisation des statistiques pour la photo ${postId}:`, error);
    throw error;
  }
}

/**
 * Génère un rapport de synchronisation
 * @param {number} userCount - Nombre d'utilisateurs traités
 * @param {number} postCount - Nombre de photos traitées
 */
function generateSyncReport(userCount, postCount) {
  const reportContent = `
# Rapport de synchronisation des statistiques

Date: ${new Date().toISOString()}

## Résumé

- Nombre d'utilisateurs traités: ${userCount}
- Nombre de photos traitées: ${postCount}

## Opérations effectuées

1. Recalcul des compteurs de photos pour chaque utilisateur
2. Recalcul des compteurs de favoris pour chaque utilisateur
3. Recalcul des compteurs de likes pour chaque photo
4. Initialisation des compteurs de téléchargements manquants
5. Initialisation des compteurs de vues manquants
6. Synchronisation des statistiques entre les collections 'post' et 'MyImages'

## Prochaines étapes

1. Vérifier les statistiques dans l'interface utilisateur
2. Mettre en place les corrections proposées dans le rapport d'analyse
3. Configurer une tâche planifiée pour exécuter ce script périodiquement

`;

  fs.writeFileSync(path.join(__dirname, 'sync_report.md'), reportContent);
  console.log('Rapport de synchronisation généré: sync_report.md');
}

/**
 * Point d'entrée du script
 */
synchronizeAllStats().then(() => {
  console.log('Script terminé.');
  process.exit(0);
}).catch(error => {
  console.error('Erreur lors de l\'exécution du script:', error);
  process.exit(1);
});

/**
 * Instructions d'utilisation:
 * 
 * 1. Créez un fichier serviceAccountKey.json avec les informations d'identification Firebase Admin
 * 2. Installez les dépendances: npm install firebase-admin
 * 3. Exécutez le script: node stats_synchronization_script.js
 * 
 * Note: Ce script doit être exécuté dans un environnement Node.js avec accès à Firebase
 */
