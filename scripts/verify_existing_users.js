const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc } = require('firebase/firestore');
const { getStorage, ref, getDownloadURL } = require('firebase/storage');

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

async function verifyAllUsers() {
  try {
    console.log('Début de la vérification des emails des utilisateurs existants...');
    
    // Récupérer tous les utilisateurs
    const listAllUsers = async (nextPageToken) => {
      const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
      
      // Pour chaque utilisateur, vérifier si son email est déjà vérifié
      const updatePromises = listUsersResult.users.map(async (userRecord) => {
        if (!userRecord.emailVerified) {
          console.log(`Vérification de l'email pour l'utilisateur: ${userRecord.email}`);
          
          // Mettre à jour l'utilisateur pour marquer son email comme vérifié
          return admin.auth().updateUser(userRecord.uid, {
            emailVerified: true
          });
        }
        return Promise.resolve();
      });
      
      await Promise.all(updatePromises);
      
      // Si plus d'utilisateurs à traiter, continuer avec la page suivante
      if (listUsersResult.pageToken) {
        return listAllUsers(listUsersResult.pageToken);
      }
      
      return listUsersResult.users.length;
    };
    
    const usersCount = await listAllUsers();
    console.log(`Terminé! ${usersCount} utilisateurs traités.`);
    
  } catch (error) {
    console.error('Erreur lors de la vérification des emails:', error);
  }
}

// Exécuter la fonction
verifyAllUsers()
  .then(() => {
    console.log('Script terminé avec succès.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erreur lors de l\'exécution du script:', error);
    process.exit(1);
  });
