import { collection, query, orderBy, limit, startAfter, getDocs, where, or } from "firebase/firestore";
import { db } from '../app/db/firebaseConfig';

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
 * Récupère les posts avec pagination et système de points pour les recherches multi-termes
 * @param {object} lastDoc - Dernier document pour la pagination
 * @param {number} pageSize - Nombre de résultats par page
 * @param {object} filters - Filtres à appliquer (couleur, orientation, etc.)
 * @returns {Promise<{posts: Array, lastVisible: object}>} - Posts et dernier document visible
 */
export async function getEnhancedPostsPaginated(lastDoc = null, pageSize = 20, filters = {}) {
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
    let searchTerms = [];
    if (filters.searchQuery) {
      searchTerms = splitSearchQuery(filters.searchQuery);
      
      // Si nous avons des termes de recherche, créer une condition OR pour chaque terme
      if (searchTerms.length > 0) {
        const tagConditions = searchTerms.map(term => 
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
        _score: 0 // Score initial
      };
      
      // Si nous avons des termes de recherche, calculer le score
      if (searchTerms.length > 0) {
        const postTags = (data.tags || []).map(tag => tag.toLowerCase());
        
        // Vérifier la correspondance exacte avec la requête complète
        const fullQuery = filters.searchQuery.toLowerCase();
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
      }
      
      return post;
    });
    
    // Trier par score si nous avons des termes de recherche et le tri est par pertinence
    if (searchTerms.length > 0 && filters.selectedSort === "relevance") {
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
