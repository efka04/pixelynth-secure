'use client';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs,
  or,
  and,
  getCountFromServer
} from 'firebase/firestore';
import { db } from '../db/firebaseConfig';

/**
 * Construit une requête optimisée pour la recherche d'images
 * @param {object} options - Options de recherche
 * @param {string} options.searchTerm - Terme de recherche
 * @param {string} options.category - Catégorie sélectionnée
 * @param {string} options.people - Filtre de personnes
 * @param {string} options.orientation - Orientation de l'image
 * @param {string} options.color - Couleur sélectionnée
 * @param {string} options.sortBy - Critère de tri
 * @param {number} options.pageSize - Nombre d'éléments par page
 * @param {object} options.lastDoc - Dernier document pour pagination
 * @returns {object} - Requête Firestore optimisée
 */
export const buildOptimizedQuery = ({
  searchTerm = '',
  category = '',
  people = 'all',
  orientation = 'all',
  color = '',
  sortBy = 'relevance',
  pageSize = 20,
  lastDoc = null
}) => {
  // Référence à la collection
  const postsRef = collection(db, 'post');
  
  // Conditions de filtrage
  const conditions = [];
  
  // Ajouter les filtres de base
  if (category) {
    conditions.push(where('categories', 'array-contains', category));
  }
  
  if (people !== 'all') {
    conditions.push(where('people', '==', people));
  }
  
  if (orientation !== 'all') {
    conditions.push(where('orientation', '==', orientation));
  }
  
  if (color) {
    conditions.push(where('color', '==', color));
  }
  
  // Ajouter la condition de recherche si un terme est fourni
  if (searchTerm && searchTerm.trim() !== '') {
    const term = searchTerm.trim().toLowerCase();
    
    // Recherche dans les tags, titres et descriptions
    conditions.push(
      or(
        where('tags', 'array-contains', term),
        and(
          where('lowercaseTitle', '>=', term),
          where('lowercaseTitle', '<=', term + '\uf8ff')
        ),
        and(
          where('lowercaseDesc', '>=', term),
          where('lowercaseDesc', '<=', term + '\uf8ff')
        )
      )
    );
  }
  
  // Construire la requête de base
  let q;
  
  if (conditions.length > 0) {
    q = query(postsRef, and(...conditions));
  } else {
    q = query(postsRef);
  }
  
  // Ajouter le tri
  if (sortBy === 'newest') {
    q = query(q, orderBy('timestamp', 'desc'));
  } else if (sortBy === 'popular') {
    q = query(q, orderBy('downloadCount', 'desc'));
  } else {
    // Pour "relevance", utiliser un tri par défaut
    q = query(q, orderBy('timestamp', 'desc'));
  }
  
  // Ajouter la pagination
  q = query(q, limit(pageSize));
  
  // Si un dernier document est fourni, commencer après celui-ci
  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }
  
  return q;
};

/**
 * Exécute une requête avec mise en cache
 * @param {object} q - Requête Firestore
 * @param {string} cacheKey - Clé de cache
 * @param {number} cacheDuration - Durée de validité du cache en ms
 * @returns {Promise<Array>} - Résultats de la requête
 */
export const executeQueryWithCache = async (q, cacheKey, cacheDuration = 5 * 60 * 1000) => {
  // Vérifier si les résultats sont en cache et valides
  if (typeof window !== 'undefined') {
    const cachedData = localStorage.getItem(cacheKey);
    
    if (cachedData) {
      try {
        const { data, timestamp } = JSON.parse(cachedData);
        const isValid = Date.now() - timestamp < cacheDuration;
        
        if (isValid) {
          return data;
        }
      } catch (error) {
        console.error('Erreur lors de la lecture du cache:', error);
      }
    }
  }
  
  // Si pas de cache valide, exécuter la requête
  try {
    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Mettre en cache les résultats
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          data: results,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.error('Erreur lors de la mise en cache:', error);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Erreur lors de l\'exécution de la requête:', error);
    return [];
  }
};

/**
 * Génère une clé de cache basée sur les paramètres de recherche
 * @param {object} params - Paramètres de recherche
 * @returns {string} - Clé de cache
 */
export const generateCacheKey = (params) => {
  return `search_${Object.values(params).join('_')}`;
};

/**
 * Précharge les résultats de recherche courants pour améliorer les performances
 * @param {object} params - Paramètres de recherche actuels
 */
export const preloadNextPage = async (params) => {
  if (!params.lastDoc) return;
  
  // Construire une requête pour la page suivante
  const nextPageParams = {
    ...params,
    lastDoc: params.lastDoc
  };
  
  const q = buildOptimizedQuery(nextPageParams);
  const cacheKey = generateCacheKey(nextPageParams);
  
  // Exécuter la requête en arrière-plan et mettre en cache les résultats
  try {
    executeQueryWithCache(q, cacheKey);
  } catch (error) {
    console.error('Erreur lors du préchargement:', error);
  }
};

/**
 * Optimise les termes de recherche pour améliorer les résultats
 * @param {string} searchTerm - Terme de recherche brut
 * @returns {string} - Terme de recherche optimisé
 */
export const optimizeSearchTerm = (searchTerm) => {
  if (!searchTerm || typeof searchTerm !== 'string') return '';
  
  // Normaliser le terme (minuscules, suppression des espaces superflus)
  let term = searchTerm.trim().toLowerCase();
  
  // Supprimer les mots vides courants
  const stopWords = ['le', 'la', 'les', 'un', 'une', 'des', 'et', 'ou', 'de', 'du', 'a', 'au', 'aux'];
  let words = term.split(/\s+/);
  words = words.filter(word => !stopWords.includes(word) && word.length > 1);
  
  // Si tous les mots ont été filtrés, revenir au terme original
  if (words.length === 0) {
    return term;
  }
  
  // Reconstruire le terme optimisé
  return words.join(' ');
};
