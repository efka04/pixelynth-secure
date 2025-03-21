// Utilitaires de mise en cache pour réduire les lectures Firebase
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes en millisecondes

/**
 * Vérifie si des données en cache sont disponibles et valides
 * @param {string} cacheKey - Clé unique pour identifier les données en cache
 * @returns {object|null} - Données en cache ou null si non disponibles/expirées
 */
export const getFromCache = (cacheKey) => {
  try {
    const cachedData = localStorage.getItem(cacheKey);
    
    if (!cachedData) return null;
    
    const { data, timestamp } = JSON.parse(cachedData);
    const cacheAge = Date.now() - timestamp;
    
    // Retourner les données si le cache est encore valide
    if (cacheAge < CACHE_DURATION) {
      return data;
    }
    
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération du cache:', error);
    return null;
  }
};

/**
 * Sauvegarde des données dans le cache local
 * @param {string} cacheKey - Clé unique pour identifier les données
 * @param {object} data - Données à mettre en cache
 */
export const saveToCache = (cacheKey, data) => {
  try {
    localStorage.setItem(cacheKey, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde dans le cache:', error);
  }
};

/**
 * Supprime une entrée spécifique du cache
 * @param {string} cacheKey - Clé du cache à supprimer
 */
export const invalidateCache = (cacheKey) => {
  try {
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.error('Erreur lors de l\'invalidation du cache:', error);
  }
};

/**
 * Supprime toutes les entrées de cache commençant par un préfixe
 * @param {string} prefix - Préfixe des clés de cache à supprimer
 */
export const invalidateCacheByPrefix = (prefix) => {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(prefix)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'invalidation du cache par préfixe:', error);
  }
};
