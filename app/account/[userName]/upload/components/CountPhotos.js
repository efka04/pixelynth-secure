import { doc, updateDoc, increment, setDoc } from 'firebase/firestore';
import { db } from '@/app/db/firebaseConfig'

export async function updateUserPhotoCount(userEmail) {
  console.log("Mise à jour du compteur pour l'utilisateur :", userEmail);
  const userDocRef = doc(db, 'users', userEmail);
  try {
    await updateDoc(userDocRef, { photoCount: increment(1) });
    console.log("Compteur incrémenté avec succès pour", userEmail);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du compteur de photos:", error);
    try {
      // Si le document n'existe pas, on le crée avec photoCount initialisé à 1
      await setDoc(userDocRef, { photoCount: 1 }, { merge: true });
      console.log("Document créé avec photoCount initialisé à 1 pour", userEmail);
    } catch (setError) {
      console.error("Erreur lors de la création du document :", setError);
    }
  }
}

