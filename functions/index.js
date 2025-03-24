// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.searchPosts = functions.https.onCall(async (data, context)  => {
  // Paramètres de recherche
  const { 
    searchQuery, 
    selectedPeople, 
    selectedOrientation, 
    selectedColor, 
    selectedCategory, 
    selectedSort,
    lastDoc,
    pageSize = 24
  } = data;
  
  try {
    const postsRef = admin.firestore().collection('post');
    let query = postsRef;
    
    // Appliquer les filtres standards
    if (selectedColor) {
      query = query.where("color", "==", selectedColor);
    }
    if (selectedPeople && selectedPeople !== "all") {
      query = query.where("peopleCount", "==", Number(selectedPeople));
    }
    if (selectedOrientation && selectedOrientation !== "all") {
      query = query.where("orientation", "==", selectedOrientation);
    }
    if (selectedCategory) {
      query = query.where("categories", "array-contains", selectedCategory);
    }
    
    // Récupérer les documents
    const snapshot = await query.limit(500).get();
    
    // Traitement des résultats
    let allPosts = [];
    
    // Diviser la requête de recherche en termes
    const searchTerms = searchQuery ? searchQuery
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(term => term.length > 0) : [];
    
    // Traiter chaque document
    snapshot.forEach(doc => {
      const data = doc.data();
      const post = {
        id: doc.id,
        ...data,
        _score: 0
      };
      
      // Si nous avons des termes de recherche, calculer le score
      if (searchTerms.length > 0) {
        const postTags = (data.tags || []).map(tag => tag.toLowerCase());
        
        // Vérifier la correspondance exacte avec la requête complète
        const fullQuery = searchQuery.toLowerCase();
        
        // Recherche exacte de la requête complète dans les tags
        if (postTags.includes(fullQuery)) {
          post._score += 10;
        }
        
        // Recherche pour chaque terme individuel dans les tags
        let hasMatchingTerm = false;
        searchTerms.forEach(term => {
          // Correspondance exacte avec un tag
          if (postTags.includes(term)) {
            post._score += 5;
            hasMatchingTerm = true;
          }
          
          // Correspondance partielle mais stricte (le terme doit être un sous-mot du tag)
          postTags.forEach(tag => {
            // Vérifier si le tag contient le terme comme un mot complet ou au début/fin
            const tagWords = tag.split(/\s+/);
            if (tagWords.some(word => word === term || word.startsWith(term + '-') || word.endsWith('-' + term))) {
              post._score += 2;
              hasMatchingTerm = true;
            }
            // Ou si le tag commence par le terme
            else if (tag.startsWith(term)) {
              post._score += 1;
              hasMatchingTerm = true;
            }
          });
        });
        
        // Si aucun terme ne correspond, mettre le score à 0
        if (!hasMatchingTerm) {
          post._score = 0;
        }
      }
      
      // Ajouter tous les posts à la liste
      allPosts.push(post);
    });
    
    // Filtrer et trier les résultats
    let filteredPosts = allPosts;
    
    // Si nous avons des termes de recherche, filtrer par score
    if (searchTerms.length > 0) {
      // Trier par score
      filteredPosts.sort((a, b) => b._score - a._score);
      
      // Ne garder que les posts avec un score positif
      filteredPosts = filteredPosts.filter(post => post._score > 0);
    } else {
      // Pas de termes de recherche, appliquer le tri standard
      if (selectedSort === "newest") {
        filteredPosts.sort((a, b) => b.timestamp - a.timestamp);
      } else if (selectedSort === "popular") {
        filteredPosts.sort((a, b) => b.downloadCount - a.downloadCount);
      } else {
        // Tri par défaut
        filteredPosts.sort((a, b) => {
          if (a.highlight !== b.highlight) {
            return b.highlight - a.highlight;
          }
          return b.timestamp - a.timestamp;
        });
      }
    }
    
    // Gérer la pagination manuellement
    let startIndex = 0;
    if (lastDoc) {
      const lastDocIndex = filteredPosts.findIndex(post => post.id === lastDoc);
      if (lastDocIndex !== -1) {
        startIndex = lastDocIndex + 1;
      }
    }
    
    // Extraire la page courante
    const paginatedPosts = filteredPosts.slice(startIndex, startIndex + pageSize);
    
    // Déterminer le dernier document pour la pagination suivante
    const lastVisible = paginatedPosts.length > 0 ? paginatedPosts[paginatedPosts.length - 1].id : null;
    
    // Ajouter des logs pour le débogage
    console.log(`Recherche: "${searchQuery}" - Termes: [${searchTerms.join(', ')}]`);
    console.log(`Résultats: ${filteredPosts.length} posts trouvés, ${paginatedPosts.length} affichés`);
    
    return { 
      posts: paginatedPosts, 
      lastVisible,
      totalResults: filteredPosts.length
    };
  } catch (error) {
    console.error('Erreur lors de la recherche:', error);
    throw new functions.https.HttpsError('internal', 'Erreur lors de la recherche', error.message) ;
  }
});
