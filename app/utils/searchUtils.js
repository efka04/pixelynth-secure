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
 * Prépare un terme de recherche pour les requêtes Firestore
 * @param {string} term - Terme de recherche brut
 * @returns {string} - Terme de recherche normalisé
 */
export const prepareSearchTerm = (term) => {
  if (!term || typeof term !== 'string') return '';
  return term.trim().toLowerCase();
};

/**
 * Construit une condition de recherche pour les descriptions
 * @param {string} term - Terme de recherche normalisé
 * @returns {object} - Condition Firestore pour la recherche dans les descriptions
 */
export const buildDescriptionSearchCondition = (term) => {
  if (!term) return null;
  
  // Recherche par préfixe dans le champ lowercaseDesc
  return and(
    where('lowercaseDesc', '>=', term),
    where('lowercaseDesc', '<=', term + '\uf8ff')
  );
};

/**
 * Construit une condition de recherche pour les titres
 * @param {string} term - Terme de recherche normalisé
 * @returns {object} - Condition Firestore pour la recherche dans les titres
 */
export const buildTitleSearchCondition = (term) => {
  if (!term) return null;
  
  // Recherche par préfixe dans le champ lowercaseTitle
  return and(
    where('lowercaseTitle', '>=', term),
    where('lowercaseTitle', '<=', term + '\uf8ff')
  );
};

/**
 * Construit une condition de recherche pour les tags
 * @param {string} term - Terme de recherche normalisé
 * @returns {object} - Condition Firestore pour la recherche dans les tags
 */
export const buildTagSearchCondition = (term) => {
  if (!term) return null;
  
  // Recherche exacte dans le tableau de tags
  return where('tags', 'array-contains', term);
};

/**
 * Construit une condition de recherche complète (OR entre titre, description et tags)
 * @param {string} term - Terme de recherche brut
 * @returns {object|null} - Condition Firestore combinée ou null si terme vide
 */
export const buildSearchCondition = (term) => {
  const normalizedTerm = prepareSearchTerm(term);
  if (!normalizedTerm) return null;
  
  // Combiner les conditions avec OR
  return or(
    buildTagSearchCondition(normalizedTerm),
    buildTitleSearchCondition(normalizedTerm),
    buildDescriptionSearchCondition(normalizedTerm)
  );
};

/**
 * Exécute une requête de recherche optimisée
 * @param {object} q - Requête Firestore construite
 * @returns {Promise<Array>} - Tableau de résultats
 */
export const executeSearchQuery = async (q) => {
  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Erreur lors de l\'exécution de la requête de recherche:', error);
    return [];
  }
};

/**
 * Obtient le nombre total de résultats pour une requête
 * @param {object} q - Requête Firestore (sans limit/startAfter)
 * @returns {Promise<number>} - Nombre total de résultats
 */
export const getTotalResultsCount = async (q) => {
  try {
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  } catch (error) {
    console.error('Erreur lors du comptage des résultats:', error);
    return 0;
  }
};
