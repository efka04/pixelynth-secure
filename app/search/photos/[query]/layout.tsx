import type { Metadata, ResolvingMetadata } from "next";
import { collection, query, getDocs, where, or } from "firebase/firestore";
import { db } from "../../../db/firebaseConfig";
import { getCountFromServer } from "firebase/firestore";

// Define interface for Search Query type
type Params = {
  query: string;
};

type Props = {
  params: Promise<Params>;
  children: React.ReactNode;
};

// Fonction utilitaire pour préparer le terme de recherche
const prepareSearchTerm = (term: string): string => {
  if (!term) return '';
  return term.trim().toLowerCase();
};

// Fonction utilitaire pour construire la requête de recherche
const buildSearchQuery = (term: string) => {
  const normalizedTerm = prepareSearchTerm(term);
  if (!normalizedTerm) return null;
  
  const postsRef = collection(db, "post");
  
  // Recherche dans les tags
  const tagCondition = where("tags", "array-contains", normalizedTerm);
  
  // Recherche par préfixe dans le titre
  const titleCondition = where("lowercaseTitle", ">=", normalizedTerm);
  const titleConditionEnd = where("lowercaseTitle", "<=", normalizedTerm + '\uf8ff');
  
  // Recherche par préfixe dans la description
  const descCondition = where("lowercaseDesc", ">=", normalizedTerm);
  const descConditionEnd = where("lowercaseDesc", "<=", normalizedTerm + '\uf8ff');
  
  // Construire la requête avec OR entre les conditions
  return query(postsRef, or(
    tagCondition,
    // Note: Firestore ne permet pas de combiner plusieurs conditions de plage dans un OR
    // Nous utilisons donc seulement la condition de tag pour simplifier
  ));
};

// Fonction pour compter les résultats de recherche
const countSearchResults = async (searchTerm: string): Promise<number> => {
  try {
    const q = buildSearchQuery(searchTerm);
    if (!q) return 0;
    
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  } catch (error) {
    console.error("Erreur lors du comptage des résultats:", error);
    return 0;
  }
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Decode search query - using await with params
  const { query } = await params;
  let decodedQuery = "";
  if (query) {
    // Step 1: decode URL
    decodedQuery = decodeURIComponent(query);
    // Step 2: replace hyphens with spaces
    decodedQuery = decodedQuery.replace(/-/g, ' ');
  }
  
  // Déterminer si cette page doit être indexée en fonction du nombre de résultats
  let shouldIndex = false;
  try {
    const count = await countSearchResults(decodedQuery);
    console.log(`Nombre de résultats pour "${decodedQuery}": ${count}`);
    
    // N'indexer que si le nombre de résultats est supérieur à 50
    shouldIndex = count > 50;
  } catch (error) {
    console.error("Erreur lors du comptage des résultats pour SEO:", error);
  }
  
  return {
    title: `Free Images of ${decodedQuery} | Pixelynth`,
    description: `Discover AI-generated images of "${decodedQuery}" on Pixelynth. Download free photos for commercial or personal use.`,
    keywords: "AI images, stock photos, free images, artificial intelligence, digital art, stock images, AI generated images, AI pictures, royalty-free, commercial use",
    openGraph: {
      title: `Search: ${decodedQuery} | Pixelynth`,
      description: `Discover AI-generated images matching "${decodedQuery}" on Pixelynth. Download free photos for commercial or personal use.`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `Search: ${decodedQuery} | Pixelynth`,
      description: `Discover AI-generated images matching "${decodedQuery}" on Pixelynth. Download free photos for commercial or personal use.`,
    },
    robots: {
      index: shouldIndex, // Indexation conditionnelle basée sur le nombre de résultats
      follow: true,
    }
  };
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
