import { db } from '@/app/db/firebaseConfig';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';

export const toggleFavorite = async (userId, articleId, articleData) => {
  if (!userId) throw new Error('User ID is required');
  
  const favoriteRef = doc(db, 'users', userId, 'favorites', articleId);
  const docSnap = await getDoc(favoriteRef);

  if (docSnap.exists()) {
    await deleteDoc(favoriteRef);
    return false;
  } else {
    await setDoc(favoriteRef, {
      articleId,
      ...articleData,
      createdAt: new Date().toISOString(),
    });
    return true;
  }
};

export const getFavorites = async (userId) => {
  if (!userId) throw new Error('User ID is required');
  
  const favoritesRef = collection(db, 'users', userId, 'favorites');
  const snapshot = await getDocs(favoritesRef);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};