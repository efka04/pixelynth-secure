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
 * Divise une requête de recherche en termes individuels
 * @param {string} query - Requête de recherche complète
 * @returns {Array} - Tableau de termes individuels
 */
export const splitSearchQuery = (query) => {
  if (!query || typeof query !== 'string') return [];
  
  // Normaliser la requête et la diviser en mots
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(term => term.length > 0);
};

/**
 * Construit une condition de recherche pour les tags avec plusieurs termes
 * @param {Array} terms - Termes de recherche normalisés
 * @returns {object} - Condition Firestore pour la recherche dans les tags
 */
export const buildMultiTermTagCondition = (terms) => {
  if (!terms || !Array.isArray(terms) || terms.length === 0) return null;
  
  // Si un seul terme, utiliser la condition simple
  if (terms.length === 1) {
    return where('tags', 'array-contains', terms[0]);
  }
  
  // Pour plusieurs termes, créer une condition OR pour chaque terme
  const conditions = terms.map(term => 
    where('tags', 'array-contains', term)
  );
  
  return or(...conditions);
};

/**
 * Exécute une requête de recherche et attribue des scores aux résultats
 * @param {Array} searchTerms - Termes de recherche individuels
 * @param {object} filterConditions - Conditions de filtrage supplémentaires
 * @param {string} sortOption - Option de tri (relevance, newest, popular)
 * @param {number} resultsLimit - Nombre maximum de résultats à retourner
 * @param {object} lastDoc - Dernier document pour la pagination
 * @returns {Promise<Object>} - Résultats avec scores et métadonnées
 */
export const executeWeightedSearch = async (
  searchTerms, 
  filterConditions = [], 
  sortOption = 'relevance',
  resultsLimit = 20,
  lastDoc = null
) => {
  try {
    // Si aucun terme de recherche, retourner un tableau vide
    if (!searchTerms || searchTerms.length === 0) {
      return { results: [], lastDoc: null, hasMore: false, total: 0 };
    }
    
    // Construire la requête de base
    const postsRef = collection(db, 'post');
    let baseQuery = query(postsRef);
    
    // Appliquer les conditions de filtrage
    if (filterConditions && filterConditions.length > 0) {
      filterConditions.forEach(condition => {
        baseQuery = query(baseQuery, condition);
      });
    }
    
    // Construire la condition de recherche multi-termes pour les tags
    const tagCondition = buildMultiTermTagCondition(searchTerms);
    if (tagCondition) {
      baseQuery = query(baseQuery, tagCondition);
    }
    
    // Appliquer le tri
    if (sortOption === 'newest') {
      baseQuery = query(baseQuery, orderBy('timestamp', 'desc'));
    } else if (sortOption === 'popular') {
      baseQuery = query(baseQuery, orderBy('downloadCount', 'desc'));
    } else {
      // Pour "relevance", utiliser un tri par défaut (sera remplacé par le score)
      baseQuery = query(baseQuery, orderBy('timestamp', 'desc'));
    }
    
    // Limiter le nombre de résultats
    baseQuery = query(baseQuery, limit(resultsLimit * 3)); // Récupérer plus de résultats pour le scoring
    
    // Pour la pagination
    if (lastDoc) {
      baseQuery = query(baseQuery, startAfter(lastDoc));
    }
    
    // Exécuter la requête
    const querySnapshot = await getDocs(baseQuery);
    
    // Calculer le nombre total de résultats
    const countQuery = query(baseQuery);
    const countSnapshot = await getCountFromServer(countQuery);
    const totalCount = countSnapshot.data().count;
    
    // Transformer les documents en objets avec des scores
    let results = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const post = {
        id: doc.id,
        ...data,
        _score: 0 // Score initial
      };
      
      // Calculer le score en fonction des correspondances de tags
      const postTags = (data.tags || []).map(tag => tag.toLowerCase());
      
      // Vérifier la correspondance exacte avec la requête complète
      const fullQuery = searchTerms.join(' ');
      if (postTags.includes(fullQuery)) {
        post._score += 10; // Score élevé pour une correspondance exacte
      }
      
      // Ajouter des points pour chaque terme individuel trouvé
      searchTerms.forEach(term => {
        if (postTags.includes(term)) {
          post._score += 1;
        }
      });
      
      // Bonus pour les correspondances dans le titre
      const lowercaseTitle = (data.lowercaseTitle || data.title || '').toLowerCase();
      searchTerms.forEach(term => {
        if (lowercaseTitle.includes(term)) {
          post._score += 0.5;
        }
      });
      
      // Bonus pour les correspondances dans la description
      const lowercaseDesc = (data.lowercaseDesc || data.desc || '').toLowerCase();
      searchTerms.forEach(term => {
        if (lowercaseDesc.includes(term)) {
          post._score += 0.2;
        }
      });
      
      return post;
    });
    
    // Trier par score (pour l'option 'relevance')
    if (sortOption === 'relevance') {
      results.sort((a, b) => b._score - a._score);
    }
    
    // Limiter aux résultats demandés
    results = results.slice(0, resultsLimit);
    
    // Déterminer s'il y a plus de résultats
    const hasMore = querySnapshot.docs.length > results.length;
    
    // Récupérer le dernier document pour la pagination
    const newLastDoc = results.length > 0 
      ? querySnapshot.docs.find(doc => doc.id === results[results.length - 1].id) 
      : null;
    
    return {
      results,
      lastDoc: newLastDoc,
      hasMore,
      total: totalCount
    };
  } catch (error) {
    console.error('Erreur lors de l\'exécution de la recherche pondérée:', error);
    return { results: [], lastDoc: null, hasMore: false, total: 0 };
  }
};