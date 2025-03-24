// services/enhancedSearchService.js
import { collection, query, orderBy, limit, startAfter, getDocs, where, or } from "firebase/firestore";
import { db } from '../app/db/firebaseConfig';

/**
 * Divise une requête de recherche en termes individuels et génère leurs variantes (pluriels/singuliers)
 * @param {string} query - Requête de recherche complète
 * @returns {Array} - Tableau de termes individuels et leurs variantes
 */
export const splitSearchQuery = (query) => {
  if (!query || typeof query !== 'string') return [];
  
  // Normaliser la requête et la diviser en mots
  const terms = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(term => term.length > 0);
  
  // Générer les variantes (singulier/pluriel) pour chaque terme
  const termsWithVariants = [];
  const processedTerms = new Set(); // Pour éviter les doublons
  
  terms.forEach(term => {
    // Ajouter le terme original s'il n'est pas déjà traité
    if (!processedTerms.has(term)) {
      termsWithVariants.push(term);
      processedTerms.add(term);
      
      // Générer et ajouter le pluriel si le terme se termine par une consonne
      if (!term.endsWith('s')) {
        const plural = term + 's';
        termsWithVariants.push(plural);
        processedTerms.add(plural);
      }
      // Générer et ajouter le singulier si le terme se termine par 's'
      else if (term.length > 1 && term.endsWith('s')) {
        const singular = term.slice(0, -1);
        if (singular.length > 1) { // Éviter les termes trop courts
          termsWithVariants.push(singular);
          processedTerms.add(singular);
        }
      }
    }
  });
  
  return {
    originalTerms: terms,           // Termes originaux de la recherche
    allTerms: termsWithVariants     // Tous les termes avec leurs variantes
  };
};

/**
 * Récupère les posts avec pagination et système de points pour les recherches multi-termes
 * @param {object} lastDoc - Dernier document pour la pagination
 * @param {number} pageSize - Nombre de résultats par page
 * @param {object} filters - Filtres à appliquer (couleur, orientation, etc.)
 * @returns {Promise<{posts: Array, lastVisible: object}>} - Posts et dernier document visible
 */
export async function getEnhancedPostsPaginated(lastDoc = null, pageSize = 24, filters = {}) {
  try {
    const postsRef = collection(db, "post");
    let constraints = [];
    
    // Appliquer les filtres standards
    if (filters.userEmail) {
      constraints.push(where("userEmail", "==", filters.userEmail));
    }
    if (filters.selectedColor) {
      constraints.push(where("color", "==", filters.selectedColor));
    }
    if (filters.selectedPeople && filters.selectedPeople !== "all") {
      constraints.push(where("peopleCount", "==", Number(filters.selectedPeople)));
    }
    if (filters.selectedOrientation && filters.selectedOrientation !== "all") {
      constraints.push(where("orientation", "==", filters.selectedOrientation));
    }
    if (filters.selectedCategory) {
      constraints.push(where("categories", "array-contains", filters.selectedCategory));
    }
    
    // Traitement spécial pour la recherche
    let searchTermsInfo = { originalTerms: [], allTerms: [] };
    if (filters.searchQuery) {
      searchTermsInfo = splitSearchQuery(filters.searchQuery);
      
      // Si nous avons des termes de recherche, créer une condition OR pour chaque terme et ses variantes
      if (searchTermsInfo.allTerms.length > 0) {
        const tagConditions = searchTermsInfo.allTerms.map(term => 
          where("tags", "array-contains", term)
        );
        
        // Ajouter la condition OR aux contraintes
        if (tagConditions.length === 1) {
          constraints.push(tagConditions[0]);
        } else if (tagConditions.length > 1) {
          constraints.push(or(...tagConditions));
        }
      }
    }
    
    // Appliquer le tri en fonction de `selectedSort`
    if (filters.selectedSort === "newest") {
      constraints.push(orderBy("timestamp", "desc"));
    } else if (filters.selectedSort === "popular") {
      constraints.push(orderBy("downloadCount", "desc"));
    } else {
      constraints.push(orderBy("highlight", "desc"), orderBy("timestamp", "desc"));
    }
    
    // Pagination
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }
    
    // Récupérer plus de résultats que nécessaire pour le scoring
    constraints.push(limit(pageSize * 3));
    
    // Exécuter la requête
    const qFinal = query(postsRef, ...constraints);
    const snapshot = await getDocs(qFinal);
    
    // Transformer les documents en objets avec des scores
    let posts = snapshot.docs.map(doc => {
      const data = doc.data();
      const post = {
        id: doc.id,
        ...data,
        _score: 0, // Score initial
        _exactMatchCount: 0, // Compteur de mots exacts trouvés (termes originaux uniquement)
        _matchedTerms: new Set() // Ensemble des termes originaux qui ont été trouvés
      };
      
      // Si nous avons des termes de recherche, calculer le score
      if (searchTermsInfo.originalTerms.length > 0) {
        const postTags = (data.tags || []).map(tag => tag.toLowerCase());
        
        // Vérifier la correspondance exacte avec la requête complète
        const fullQuery = filters.searchQuery.toLowerCase();
        if (postTags.includes(fullQuery)) {
          post._score += 10; // Score élevé pour une correspondance exacte
          // Tous les termes originaux sont considérés comme trouvés
          searchTermsInfo.originalTerms.forEach(term => post._matchedTerms.add(term));
        } else {
          // Pour chaque tag, vérifier s'il correspond à un terme original ou sa variante
          postTags.forEach(tag => {
            // Vérifier chaque terme original
            searchTermsInfo.originalTerms.forEach(originalTerm => {
              // Si le tag correspond exactement au terme original ou à sa variante
              if (tag === originalTerm || 
                  (originalTerm + 's' === tag) || 
                  (originalTerm.endsWith('s') && originalTerm.slice(0, -1) === tag)) {
                post._score += 5;
                post._matchedTerms.add(originalTerm);
              }
            });
          });
        }
        
        // Mettre à jour le compteur de mots exacts trouvés
        post._exactMatchCount = post._matchedTerms.size;
      }
      
      return post;
    });
    
    // Filtrer les posts en fonction du nombre de mots dans la recherche
    if (searchTermsInfo.originalTerms.length > 0) {
      if (searchTermsInfo.originalTerms.length >= 2) {
        // Pour 2 mots ou plus, exiger au moins 2 mots exacts (ou leurs variantes) dans les tags
        posts = posts.filter(post => post._exactMatchCount >= 2);
      } else {
        // Pour 1 mot, exiger au moins 1 mot exact (ou sa variante) dans les tags
        posts = posts.filter(post => post._exactMatchCount >= 1);
      }
    }
    
    // Trier par score si nous avons des termes de recherche et le tri est par pertinence
    if (searchTermsInfo.originalTerms.length > 0 && filters.selectedSort === "relevance") {
      posts.sort((a, b) => b._score - a._score);
    }
    
    // Limiter aux résultats demandés
    posts = posts.slice(0, pageSize);
    
    // Récupérer le dernier document pour la pagination
    const lastVisible = posts.length > 0 
      ? snapshot.docs.find(doc => doc.id === posts[posts.length - 1].id) 
      : null;
    
    return { posts, lastVisible };
  } catch (error) {
    console.error('Erreur lors de la recherche améliorée:', error);
    return { posts: [], lastVisible: null };
  }
}
