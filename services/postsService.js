// Modification du fichier postsService.js
import { collection, query, orderBy, limit, startAfter, getDocs, where, and, or } from "firebase/firestore";
import { db } from '../app/db/firebaseConfig';

export async function getPostsPaginated(lastDoc = null, pageSize = 20, filters = {}) {
  const postsRef = collection(db, "post");
  
  // Séparer les contraintes de filtrage des autres contraintes
  let filterConstraints = [];
  let otherConstraints = [];

  // Appliquer le tri en fonction de `selectedSort`
  if (filters.selectedSort === "newest") {
    otherConstraints.push(orderBy("timestamp", "desc"));
  } else if (filters.selectedSort === "popular") {
    otherConstraints.push(orderBy("downloadCount", "desc"));
  } else {
    // Par défaut, on utilise highlight mais on s'assure que tous les documents sont inclus
    otherConstraints.push(orderBy("highlight", "desc"));
  }

  // Filtrer les résultats selon les critères sélectionnés
  if (filters.userEmail) {
    filterConstraints.push(where("userEmail", "==", filters.userEmail));
  }
  if (filters.selectedColor) {
    filterConstraints.push(where("color", "==", filters.selectedColor));
  }
  if (filters.selectedPeople && filters.selectedPeople !== "all") {
    filterConstraints.push(where("peopleCount", "==", Number(filters.selectedPeople)));
  }
  if (filters.selectedOrientation && filters.selectedOrientation !== "all") {
    filterConstraints.push(where("orientation", "==", filters.selectedOrientation));
  }
  if (filters.selectedCategory) {
    filterConstraints.push(where("categories", "array-contains", filters.selectedCategory));
  }
  
  // Ajouter le filtre de recherche si présent
  if (filters.searchQuery) {
    filterConstraints.push(where("tags", "array-contains", filters.searchQuery.toLowerCase()));
  }

  if (lastDoc) {
    otherConstraints.push(startAfter(lastDoc));
  }
  
  otherConstraints.push(limit(pageSize));
  
  // Construire la requête finale avec and() pour les filtres
  let qFinal;
  if (filterConstraints.length > 0) {
    qFinal = query(postsRef, and(...filterConstraints), ...otherConstraints);
  } else {
    qFinal = query(postsRef, ...otherConstraints);
  }
  
  const snapshot = await getDocs(qFinal);
  
  // Récupérer tous les posts
  let posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  // Trier manuellement pour mettre les highlight=1 en premier, puis par timestamp
  posts.sort((a, b) => {
    // D'abord par highlight (1 avant 0 ou undefined)
    const highlightA = a.highlight === 1 ? 1 : 0;
    const highlightB = b.highlight === 1 ? 1 : 0;
    
    if (highlightA !== highlightB) {
      return highlightB - highlightA; // Ordre décroissant pour highlight
    }
    
    // Ensuite par timestamp (du plus récent au plus ancien)
    const timeA = a.timestamp?.seconds || 0;
    const timeB = b.timestamp?.seconds || 0;
    return timeB - timeA;
  });
  
  const lastVisible = snapshot.docs[snapshot.docs.length - 1];

  return { posts, lastVisible };
}
