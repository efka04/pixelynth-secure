import { collection, getCountFromServer } from 'firebase/firestore';
import { db } from '@/app/db/firebaseConfig';
import { getFromCache, saveToCache } from './cacheUtils';

/**
 * Obtient le nombre total de photos pour un utilisateur
 * @param {string} userEmail - Email de l'utilisateur
 * @returns {Promise<number>} - Nombre total de photos
 */
export const getUserPhotoCount = async (userEmail) => {
  if (!userEmail) return 0;
  
  // Vérifier le cache d'abord
  const cacheKey = `user_photo_count_${userEmail}`;
  const cachedCount = getFromCache(cacheKey);
  
  if (cachedCount !== null) {
    // Rafraîchir en arrière-plan
    setTimeout(() => refreshUserPhotoCount(userEmail, cacheKey), 100);
    return cachedCount;
  }
  
  try {
    const photosRef = collection(db, 'users', userEmail, 'MyImages');
    const snapshot = await getCountFromServer(photosRef);
    const count = snapshot.data().count;
    
    // Mettre en cache le résultat
    saveToCache(cacheKey, count);
    
    return count;
  } catch (error) {
    console.error('Error getting user photo count:', error);
    return 0;
  }
};

/**
 * Rafraîchit le compteur de photos en arrière-plan
 * @param {string} userEmail - Email de l'utilisateur
 * @param {string} cacheKey - Clé de cache à mettre à jour
 */
const refreshUserPhotoCount = async (userEmail, cacheKey) => {
  try {
    const photosRef = collection(db, 'users', userEmail, 'MyImages');
    const snapshot = await getCountFromServer(photosRef);
    const count = snapshot.data().count;
    
    // Mettre à jour le cache
    saveToCache(cacheKey, count);
  } catch (error) {
    console.error('Error refreshing user photo count:', error);
  }
};

/**
 * Obtient le nombre total de favoris pour un utilisateur
 * @param {string} userEmail - Email de l'utilisateur
 * @returns {Promise<number>} - Nombre total de favoris
 */
export const getUserFavoritesCount = async (userEmail) => {
  if (!userEmail) return 0;
  
  // Vérifier le cache d'abord
  const cacheKey = `user_favorites_count_${userEmail}`;
  const cachedCount = getFromCache(cacheKey);
  
  if (cachedCount !== null) {
    // Rafraîchir en arrière-plan
    setTimeout(() => refreshUserFavoritesCount(userEmail, cacheKey), 100);
    return cachedCount;
  }
  
  try {
    const favoritesRef = collection(db, 'users', userEmail, 'favorites');
    const snapshot = await getCountFromServer(favoritesRef);
    const count = snapshot.data().count;
    
    // Mettre en cache le résultat
    saveToCache(cacheKey, count);
    
    return count;
  } catch (error) {
    console.error('Error getting user favorites count:', error);
    return 0;
  }
};

/**
 * Rafraîchit le compteur de favoris en arrière-plan
 * @param {string} userEmail - Email de l'utilisateur
 * @param {string} cacheKey - Clé de cache à mettre à jour
 */
const refreshUserFavoritesCount = async (userEmail, cacheKey) => {
  try {
    const favoritesRef = collection(db, 'users', userEmail, 'favorites');
    const snapshot = await getCountFromServer(favoritesRef);
    const count = snapshot.data().count;
    
    // Mettre à jour le cache
    saveToCache(cacheKey, count);
  } catch (error) {
    console.error('Error refreshing user favorites count:', error);
  }
};