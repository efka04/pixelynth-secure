// services/enhancedSearchService.js
import { collection, query, orderBy, limit, startAfter, getDocs, where } from "firebase/firestore";
import { db } from '../app/db/firebaseConfig';

/**
 * Divise une requête de recherche en termes individuels et génère leurs variantes
 * @param {string} searchQuery - Requête de recherche complète
 * @returns {Object} - Termes originaux et leurs variantes
 */
export const splitSearchQuery = (searchQuery) => {
  if (!searchQuery || typeof searchQuery !== 'string') return { originalTerms: [], allTerms: [] };
  
  // Normaliser la requête et la diviser en mots
  const terms = searchQuery
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(term => term.length > 0);
  
  // Générer les variantes pour chaque terme
  const termsWithVariants = [];
  const processedTerms = new Set(); // Pour éviter les doublons
  
  terms.forEach(term => {
    // Ajouter le terme original
    if (!processedTerms.has(term)) {
      termsWithVariants.push(term);
      processedTerms.add(term);
      
      // Ajouter des variantes simples
      if (!term.endsWith('s')) {
        const plural = term + 's';
        termsWithVariants.push(plural);
      } else if (term.length > 1) {
        const singular = term.slice(0, -1);
        termsWithVariants.push(singular);
      }
    }
  });
  
  return {
    originalTerms: terms,
    allTerms: termsWithVariants
  };
};

/**
 * Récupère les posts avec pagination et système de points pour les recherches multi-termes
 * @param {object} lastDoc - Dernier document pour la pagination
 * @param {number} pageSize - Nombre de résultats par page
 * @param {object} filters - Filtres à appliquer
 * @returns {Promise<{posts: Array, lastVisible: object}>} - Posts et dernier document visible
 */
export async function getEnhancedPostsPaginated(lastDoc = null, pageSize = 24, filters = {}) {
  try {
    console.log("Début de la recherche avec filtres:", filters);
    const postsRef = collection(db, "post");
    
    // Traitement spécial pour la recherche
    let searchTermsInfo = { originalTerms: [], allTerms: [] };
    if (filters.searchQuery) {
      searchTermsInfo = splitSearchQuery(filters.searchQuery);
      console.log("Termes de recherche:", searchTermsInfo);
    }
    
    // Approche alternative pour les recherches multi-termes
    if (searchTermsInfo.allTerms && searchTermsInfo.allTerms.length > 0) {
      console.log("Utilisation de l'approche multi-requêtes");
      // Utiliser une Map pour stocker les résultats uniques
      const allResults = new Map();
      
      // Pour chaque terme, faire une requête séparée
      const searchPromises = searchTermsInfo.allTerms.map(async (term) => {
        console.log("Recherche pour le terme:", term);
        
        // Créer une requête de base
        let termQuery = query(postsRef);
        
        // Ajouter la contrainte de recherche pour ce terme
        termQuery = query(termQuery, where("tags", "array-contains", term));
        
        // Appliquer le tri
        if (filters.selectedSort === "newest") {
          termQuery = query(termQuery, orderBy("timestamp", "desc"));
        } else if (filters.selectedSort === "popular") {
          termQuery = query(termQuery, orderBy("downloadCount", "desc"));
        } else {
          termQuery = query(termQuery, orderBy("timestamp", "desc"));
        }
        
        // Limiter les résultats pour cette requête
        termQuery = query(termQuery, limit(pageSize * 3));
        
        try {
          // Exécuter la requête
          const termSnapshot = await getDocs(termQuery);
          console.log(`Résultats pour "${term}":`, termSnapshot.docs.length);
          
          // Traiter les résultats
          termSnapshot.docs.forEach(doc => {
            const data = doc.data();
            
            // Si le document existe déjà dans les résultats, mettre à jour son score
            if (allResults.has(doc.id)) {
              const existingPost = allResults.get(doc.id);
              existingPost._score += 5;
              existingPost._matchedTerms.add(term);
              existingPost._exactMatchCount = existingPost._matchedTerms.size;
            } else {
              // Sinon, ajouter le nouveau document
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
          console.error(`Erreur lors de la recherche pour le terme "${term}":`, error);
        }
      });
      
      try {
        // Attendre que toutes les requêtes soient terminées
        await Promise.all(searchPromises);
        
        // Convertir la Map en tableau
        let posts = Array.from(allResults.values());
        console.log("Nombre total de résultats uniques avant filtrage:", posts.length);
        
        // Amélioration de la pertinence pour les recherches multi-termes
        if (searchTermsInfo.originalTerms.length > 1 && posts.length > 0) {
          // 1. Convertir les Set en arrays pour le JSON
          posts.forEach(post => {
            post._matchedTerms = Array.from(post._matchedTerms);
          });
          
          // 2. Calculer le score maximum
          const maxScore = Math.max(...posts.map(post => post._score));
          console.log("Score maximum:", maxScore);
          
          // 3. Calculer le nombre maximum de termes correspondants
          const maxTermsMatched = Math.max(...posts.map(post => post._exactMatchCount));
          console.log("Nombre maximum de termes correspondants:", maxTermsMatched);
          
          // 4. Filtrer les résultats en fonction du nombre de termes correspondants
          const originalPosts = [...posts]; // Sauvegarde des résultats originaux
          
          if (maxTermsMatched > 1) {
            // Si certains résultats correspondent à plusieurs termes, privilégier ceux-ci
            const termThreshold = Math.max(2, maxTermsMatched - 1);
            console.log("Seuil de termes correspondants:", termThreshold);
            
            posts = posts.filter(post => post._exactMatchCount >= termThreshold);
            console.log("Nombre de résultats après filtrage par termes:", posts.length);
            
            // Si trop peu de résultats, revenir aux résultats originaux filtrés par score
            if (posts.length < 3 && originalPosts.length > 5) {
              const scoreThreshold = Math.max(5, maxScore - 5);
              posts = originalPosts.filter(post => post._score >= scoreThreshold);
              console.log("Filtrage par score après échec du filtrage par termes:", posts.length);
            }
          } else {
            // Si aucun résultat ne correspond à plusieurs termes, filtrer par score
            const scoreThreshold = Math.max(5, maxScore - 5);
            console.log("Seuil de score:", scoreThreshold);
            
            posts = posts.filter(post => post._score >= scoreThreshold);
            console.log("Nombre de résultats après filtrage par score:", posts.length);
          }
          
          // 5. Si après filtrage nous avons trop peu de résultats, assouplir les critères
          if (posts.length < 3 && originalPosts.length > 3) {
            console.log("Trop peu de résultats, assouplissement des critères");
            posts = originalPosts;
            
            // Filtrer uniquement sur le score minimum
            const minScoreThreshold = 5; // Au moins une correspondance exacte
            posts = posts.filter(post => post._score >= minScoreThreshold);
            console.log("Nombre de résultats après assouplissement:", posts.length);
          }
        }
        
        // Trier par score pour garantir que les résultats les plus pertinents apparaissent en premier
        posts.sort((a, b) => b._score - a._score);
        
        // NOUVEAU: Appliquer les filtres standards APRÈS avoir obtenu les résultats de recherche
        console.log("Application des filtres standards aux résultats de recherche");
        let filteredPosts = [...posts];
        
        if (filters.userEmail) {
          filteredPosts = filteredPosts.filter(post => post.userEmail === filters.userEmail);
        }
        if (filters.selectedColor) {
          filteredPosts = filteredPosts.filter(post => post.color === filters.selectedColor);
        }
        if (filters.selectedPeople && filters.selectedPeople !== "all") {
          filteredPosts = filteredPosts.filter(post => post.peopleCount === Number(filters.selectedPeople));
        }
        if (filters.selectedOrientation && filters.selectedOrientation !== "all") {
          filteredPosts = filteredPosts.filter(post => post.orientation === filters.selectedOrientation);
        }
        if (filters.selectedCategory) {
          filteredPosts = filteredPosts.filter(post => 
            post.categories && post.categories.includes(filters.selectedCategory)
          );
        }
        
        console.log("Nombre de résultats après application des filtres standards:", filteredPosts.length);
        
        // Limiter aux résultats demandés
        filteredPosts = filteredPosts.slice(0, pageSize);
        
        return { posts: filteredPosts, lastVisible: null };
      } catch (error) {
        console.error("Erreur lors du traitement des résultats de recherche:", error);
        return { posts: [], lastVisible: null };
      }
    } else {
      console.log("Utilisation de l'approche standard sans termes de recherche");
      // Recherche standard sans termes de recherche
      
      try {
        // Créer une requête de base
        let qFinal = query(postsRef);
        
        // Appliquer les filtres standards
        if (filters.userEmail) {
          qFinal = query(qFinal, where("userEmail", "==", filters.userEmail));
        }
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
        
        // Pagination
        if (lastDoc) {
          qFinal = query(qFinal, startAfter(lastDoc));
        }
        
        // Limiter les résultats
        qFinal = query(qFinal, limit(pageSize));
        
        const snapshot = await getDocs(qFinal);
        console.log("Nombre de résultats standard:", snapshot.docs.length);
        
        // Transformer les documents en objets
        const posts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Récupérer le dernier document pour la pagination
        const lastVisible = posts.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
        
        return { posts, lastVisible };
      } catch (error) {
        console.error("Erreur lors de la recherche standard:", error);
        return { posts: [], lastVisible: null };
      }
    }
  } catch (error) {
    console.error('Erreur générale lors de la recherche améliorée:', error);
    return { posts: [], lastVisible: null };
  }
}
