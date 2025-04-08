// services/enhancedSearchService.js
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import { db } from '../app/db/firebaseConfig';

// Cache pour stocker les résultats de recherche
const searchResultsCache = new Map();

/**
 * Divise une requête de recherche en termes individuels
 */
export const splitSearchQuery = (searchQuery) => {
  if (!searchQuery || typeof searchQuery !== 'string') return [];
  
  return searchQuery
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(term => term.length > 0);
};

/**
 * Récupère les posts avec pagination et système de points pour les recherches
 */
export async function getEnhancedPostsPaginated(lastDoc = null, pageSize = 100, filters = {}) {
  try {
    console.log("Recherche avec filtres:", filters);
    const postsRef = collection(db, "post");
    
    // Traitement des termes de recherche
    let searchTerms = [];
    if (filters.searchQuery) {
      searchTerms = splitSearchQuery(filters.searchQuery);
      console.log("Termes de recherche:", searchTerms);
    }
    
    // Si nous avons des termes de recherche
    if (searchTerms.length > 0) {
      // Utiliser une Map pour stocker les résultats uniques
      const allResults = new Map();
      
      // Pour chaque terme, faire une requête séparée
      const searchPromises = searchTerms.map(async (term) => {
        console.log("Recherche pour le terme:", term);
        
        // Requête simple pour éviter l'erreur "Cursor has too many values"
        let termQuery = query(
          postsRef,
          where("tags", "array-contains", term),
          limit(200)  // Augmenter la limite pour avoir plus de résultats
        );
        
        try {
          const termSnapshot = await getDocs(termQuery);
          console.log(`Résultats pour "${term}":`, termSnapshot.docs.length);
          
          termSnapshot.docs.forEach(doc => {
            const data = doc.data();
            
            if (allResults.has(doc.id)) {
              const existingPost = allResults.get(doc.id);
              existingPost._score += 5;
              existingPost._matchedTerms.add(term);
              existingPost._exactMatchCount = existingPost._matchedTerms.size;
            } else {
              const post = {
                id: doc.id,
                ...data,
                _score: 5,
                _matchedTerms: new Set([term]),
                _exactMatchCount: 1
              };
              allResults.set(doc.id, post);
            }
          });
        } catch (error) {
          console.error(`Erreur pour "${term}":`, error);
        }
      });
      
      // Attendre que toutes les requêtes soient terminées
      await Promise.all(searchPromises);
      
      // Convertir la Map en tableau
      let posts = Array.from(allResults.values());
      console.log("Résultats uniques avant filtrage:", posts.length);
      
      // Convertir les Set en arrays pour JSON
      posts.forEach(post => {
        post._matchedTerms = Array.from(post._matchedTerms);
      });
      
      // Améliorer la pertinence pour les recherches multi-termes
      if (searchTerms.length > 1 && posts.length > 0) {
        // Calculer le score maximum
        const maxScore = Math.max(...posts.map(post => post._score));
        
        // Calculer le nombre maximum de termes correspondants
        const maxTermsMatched = Math.max(...posts.map(post => post._exactMatchCount));
        
        // Filtrer les résultats en fonction du nombre de termes correspondants
        if (maxTermsMatched > 1) {
          const termThreshold = Math.max(2, maxTermsMatched - 1);
          const filteredByTerms = posts.filter(post => post._exactMatchCount >= termThreshold);
          
          // Si assez de résultats, utiliser ce filtrage
          if (filteredByTerms.length >= 3) {
            posts = filteredByTerms;
          }
        }
      }
      
      // Trier par score
      posts.sort((a, b) => b._score - a._score);
      
      // Appliquer les filtres manuellement
      if (filters.selectedColor) {
        posts = posts.filter(post => post.color === filters.selectedColor);
      }
      if (filters.selectedPeople && filters.selectedPeople !== "all") {
        posts = posts.filter(post => post.peopleCount === Number(filters.selectedPeople));
      }
      if (filters.selectedOrientation && filters.selectedOrientation !== "all") {
        posts = posts.filter(post => post.orientation === filters.selectedOrientation);
      }
      if (filters.selectedCategory) {
        posts = posts.filter(post => 
          post.categories && post.categories.includes(filters.selectedCategory)
        );
      }
      
      console.log("Résultats après filtrage:", posts.length);
      
      // Gérer la pagination
      let startIndex = 0;
      if (lastDoc && lastDoc.index !== undefined) {
        startIndex = lastDoc.index;
      }
      
      const endIndex = startIndex + pageSize;
      const paginatedPosts = posts.slice(startIndex, endIndex);
      
      return {
        posts: paginatedPosts,
        lastVisible: { index: endIndex },
        hasMore: endIndex < posts.length,
        total: posts.length
      };
    } else {
      // Recherche standard sans termes de recherche
      let qFinal = query(postsRef);
      
      // Appliquer les filtres standards
      if (filters.selectedColor) {
        qFinal = query(qFinal, where("color", "==", filters.selectedColor));
      }
      if (filters.selectedPeople && filters.selectedPeople !== "all") {
        qFinal = query(qFinal, where("peopleCount", "==", Number(filters.selectedPeople)));
      }
      if (filters.selectedOrientation && filters.selectedOrientation !== "all") {
        qFinal = query(qFinal, where("orientation", "==", filters.selectedOrientation));
      }
      if (filters.selectedCategory) {
        qFinal = query(qFinal, where("categories", "array-contains", filters.selectedCategory));
      }
      
      // Appliquer le tri
      if (filters.selectedSort === "newest") {
        qFinal = query(qFinal, orderBy("timestamp", "desc"));
      } else if (filters.selectedSort === "popular") {
        qFinal = query(qFinal, orderBy("downloadCount", "desc"));
      } else {
        qFinal = query(qFinal, orderBy("timestamp", "desc"));
      }
      
      // Limiter les résultats
      qFinal = query(qFinal, limit(pageSize));
      
      const snapshot = await getDocs(qFinal);
      
      // Transformer les documents en objets
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return { 
        posts, 
        lastVisible: null, 
        hasMore: posts.length === pageSize,
        total: posts.length
      };
    }
  } catch (error) {
    console.error('Erreur générale:', error);
    return { posts: [], lastVisible: null, hasMore: false, total: 0 };
  }
}
