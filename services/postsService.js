import { collection, query, orderBy, limit, startAfter, getDocs, where, and } from "firebase/firestore";
import { db } from '../app/db/firebaseConfig';

export async function getPostsPaginated(lastDoc = null, pageSize = 20, filters = {}) {
  const postsRef = collection(db, "post");
  
  // Séparer les contraintes de filtrage des autres contraintes
  let filterConstraints = [];
  let otherConstraints = [];

  // 🔍 DEBUG: Vérifier le tri sélectionné
  console.log("Fetching posts with sort:", filters.selectedSort);

  // Appliquer le tri en fonction de `selectedSort`
  if (filters.selectedSort === "newest") {
    otherConstraints.push(orderBy("timestamp", "desc")); // Trier uniquement par date
  } else if (filters.selectedSort === "popular") {
    otherConstraints.push(orderBy("downloadCount", "desc")); // Trier par le nombre de téléchargements
  } else {
    otherConstraints.push(orderBy("highlight", "desc"), orderBy("timestamp", "desc")); // Par défaut (relevance)
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
  const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const lastVisible = snapshot.docs[snapshot.docs.length - 1];

  return { posts, lastVisible };
}
