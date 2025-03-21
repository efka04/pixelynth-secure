import { collection, query, orderBy, limit, startAfter, getDocs, where } from "firebase/firestore";
import { db } from '../app/db/firebaseConfig';

export async function getPostsPaginated(lastDoc = null, pageSize = 20, filters = {}) {
  let q = collection(db, "post");

  let constraints = [];

  // 🔍 DEBUG: Vérifier le tri sélectionné
  console.log("Fetching posts with sort:", filters.selectedSort);

  // Appliquer le tri en fonction de `selectedSort`
  if (filters.selectedSort === "newest") {
    constraints.push(orderBy("timestamp", "desc")); // Trier uniquement par date
  } else if (filters.selectedSort === "popular") {
    constraints.push(orderBy("downloadCount", "desc")); // Trier par le nombre de téléchargements
  } else {
    constraints.push(orderBy("highlight", "desc"), orderBy("timestamp", "desc")); // Par défaut (relevance)
  }

  // Filtrer les résultats selon les critères sélectionnés
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

  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }
  
  constraints.push(limit(pageSize));
  
  const qFinal = query(q, ...constraints);
  const snapshot = await getDocs(qFinal);
  const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const lastVisible = snapshot.docs[snapshot.docs.length - 1];

  return { posts, lastVisible };
}
