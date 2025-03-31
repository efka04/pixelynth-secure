'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs
} from 'firebase/firestore';
import { db } from '../db/firebaseConfig';
import { useColor } from '@/app/context/ColorContext';
import pluralize from 'pluralize';
import Fuse from 'fuse.js';

const SearchContext = createContext();

export function SearchProvider({ children }) {
  // Récupération de la couleur sélectionnée depuis ColorContext
  const { selectedColor } = useColor();

  const [searchResults, setSearchResults] = useState([]);
  const [visiblePosts, setVisiblePosts] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPeople, setSelectedPeople] = useState('all');
  const [selectedOrientation, setSelectedOrientation] = useState('all');
  const [selectedSort, setSelectedSort] = useState('relevance');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');
  const [currentSearchTerms, setCurrentSearchTerms] = useState([]);

  const postsPerPage = 10;

  // Construction de la requête de base pour le listing et la pagination
  const buildQuery = (reset = false, searchTerm = '') => {
    let q = collection(db, 'post');

    // Filtrer par catégorie si défini
    if (selectedCategory) {
      q = query(q, where('categories', 'array-contains', selectedCategory));
    }

    // Si un terme de recherche est fourni, on filtre sur le champ tags (en minuscules)
    if (searchTerm) {
      q = query(q, where('tags', 'array-contains', searchTerm.toLowerCase()));
    }

    // Filtrer par people si différent de "all"
    if (selectedPeople !== 'all') {
      q = query(q, where('people', '==', selectedPeople));
    }

    // Filtrer par orientation si différent de "all"
    if (selectedOrientation !== 'all') {
      q = query(q, where('orientation', '==', selectedOrientation));
    }

    // Filtrer par couleur si sélectionnée
    if (selectedColor) {
      q = query(q, where('color', '==', selectedColor));
    }

    // Appliquer le tri
    if (searchTerm) {
      if (selectedSort === 'newest') {
        q = query(q, orderBy('timestamp', 'desc'));
      } else if (selectedSort === 'popular') {
        q = query(q, orderBy('downloadCount', 'desc'));
      }
      // Pour "relevance", on laisse l'ordre par défaut de Firestore
    } else {
      if (selectedSort === 'newest') {
        q = query(q, orderBy('timestamp', 'desc'));
      } else if (selectedSort === 'popular') {
        q = query(q, orderBy('downloadCount', 'desc'));
      } else {
        q = query(q, orderBy('relevance', 'desc'));
      }
    }

    // Limiter le nombre de posts par page
    q = query(q, limit(postsPerPage));

    // Pour la pagination : si on ne réinitialise pas et qu'un dernier document existe, démarrer après celui-ci
    if (!reset && lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    return q;
  };

  // Chargement initial des posts
  const loadInitialPosts = useCallback(async (searchTerms = []) => {
    setIsSearching(true);
    
    // Définir un timeout pour s'assurer que le spinner ne tourne pas indéfiniment
    const searchTimeout = setTimeout(() => {
      setIsSearching(false);
      setSearchResults([]);
      setVisiblePosts([]);
    }, 10000); // 10 secondes maximum pour la recherche
    
    try {
      setLastDoc(null);
      
      if (searchTerms && searchTerms.length > 0) {
        // Si des termes de recherche sont fournis, on effectue une recherche multi-champs
        // Convertir en tableau si c'est une chaîne
        const terms = Array.isArray(searchTerms) ? searchTerms : [searchTerms];
        
        // Collecter tous les résultats de recherche
        const allResults = new Map();
        
        // Pour chaque terme de recherche, effectuer des requêtes parallèles
        const searchPromises = terms.map(async (term) => {
          const lowerCaseTerm = typeof term === 'string' ? term.toLowerCase() : term;
          
          // Requête sur les tags (déjà en minuscules)
          const qTags = query(
            collection(db, 'post'),
            where('tags', 'array-contains', lowerCaseTerm),
            limit(postsPerPage)
          );
          
          // Requête sur le titre (recherche par préfixe insensible à la casse via lowercaseTitle)
          const qTitle = query(
            collection(db, 'post'),
            where('lowercaseTitle', '>=', lowerCaseTerm),
            where('lowercaseTitle', '<=', lowerCaseTerm + '\uf8ff'),
            orderBy('lowercaseTitle'),
            limit(postsPerPage)
          );
          
          // Requête sur la description (recherche par préfixe insensible à la casse via lowercaseDesc)
          const qDesc = query(
            collection(db, 'post'),
            where('lowercaseDesc', '>=', lowerCaseTerm),
            where('lowercaseDesc', '<=', lowerCaseTerm + '\uf8ff'),
            orderBy('lowercaseDesc'),
            limit(postsPerPage)
          );
          
          try {
            const [tagsSnapshot, titleSnapshot, descSnapshot] = await Promise.all([
              getDocs(qTags),
              getDocs(qTitle),
              getDocs(qDesc)
            ]);
            
            // Ajouter les résultats à la Map globale
            tagsSnapshot.docs.forEach(doc => 
              allResults.set(doc.id, { id: doc.id, ...doc.data(), relevanceScore: (allResults.get(doc.id)?.relevanceScore || 0) + 3 })
            );
            titleSnapshot.docs.forEach(doc => 
              allResults.set(doc.id, { id: doc.id, ...doc.data(), relevanceScore: (allResults.get(doc.id)?.relevanceScore || 0) + 2 })
            );
            descSnapshot.docs.forEach(doc => 
              allResults.set(doc.id, { id: doc.id, ...doc.data(), relevanceScore: (allResults.get(doc.id)?.relevanceScore || 0) + 1 })
            );
          } catch (error) {
            console.error(`Erreur lors de la recherche pour le terme "${term}":`, error);
          }
        });
        
        // Attendre que toutes les recherches soient terminées
        await Promise.all(searchPromises);
        
        // Convertir la Map en tableau
        let posts = Array.from(allResults.values());
        
        // Appliquer les autres filtres
        if (selectedCategory)
          posts = posts.filter(post => post.categories && post.categories.includes(selectedCategory));
        if (selectedPeople !== 'all')
          posts = posts.filter(post => post.people === selectedPeople);
        if (selectedOrientation !== 'all')
          posts = posts.filter(post => post.orientation === selectedOrientation);
        if (selectedColor)
          posts = posts.filter(post => post.color === selectedColor);
        
        // Tri en fonction du tri sélectionné
        if (selectedSort === 'newest') {
          posts.sort((a, b) => b.timestamp - a.timestamp);
        } else if (selectedSort === 'popular') {
          posts.sort((a, b) => b.downloadCount - a.downloadCount);
        } else {
          // Pour "relevance", trier par le score de pertinence calculé
          posts.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
        }
        
        // Utiliser Fuse.js pour la recherche floue et améliorer les résultats
        // Combiner tous les termes de recherche en une seule chaîne pour Fuse
        const combinedSearchTerm = terms.join(' ');
        const fuse = new Fuse(posts, {
          keys: ['title', 'description', 'tags'],
          threshold: 0.4, // Augmenter le seuil pour plus de tolérance aux erreurs
          distance: 100,  // Augmenter la distance pour plus de flexibilité
          includeScore: true,
        });
        
        const fuseResults = fuse.search(combinedSearchTerm);
        
        // Si nous avons des résultats de Fuse, les utiliser, sinon garder les résultats originaux
        if (fuseResults.length > 0) {
          posts = fuseResults.map(result => ({
            ...result.item,
            fuseScore: result.score
          }));
        }
        
        // Annuler le timeout car la recherche est terminée
        clearTimeout(searchTimeout);
        
        setSearchResults(posts);
        setVisiblePosts(posts);
        // Pour la recherche multi-champs, la pagination est plus complexe et est désactivée ici
        setLastDoc(null);
        setHasMore(false);
      } else {
        // Aucun terme de recherche : utiliser la requête de base avec pagination
        const q = buildQuery(true, '');
        const querySnapshot = await getDocs(q);
        const posts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Annuler le timeout car la recherche est terminée
        clearTimeout(searchTimeout);
        
        setSearchResults(posts);
        setVisiblePosts(posts);
        setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1] || null);
        setHasMore(querySnapshot.docs.length === postsPerPage);
      }
    } catch (error) {
      console.error('Erreur lors du chargement initial des posts:', error);
      setSearchResults([]);
      setVisiblePosts([]);
      setHasMore(false);
      
      // Annuler le timeout en cas d'erreur
      clearTimeout(searchTimeout);
    } finally {
      setIsSearching(false);
    }
  }, [selectedCategory, selectedPeople, selectedOrientation, selectedSort, selectedColor, lastDoc]);

  // Chargement de posts supplémentaires (pagination) - uniquement si aucun terme de recherche n'est appliqué
  const loadMorePosts = useCallback(async () => {
    if (isLoadingMore || !hasMore || currentSearchTerms.length > 0) return;
    setIsLoadingMore(true);
    try {
      const q = buildQuery(false, '');
      const querySnapshot = await getDocs(q);
      const posts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVisiblePosts(prev => [...prev, ...posts]);
      setSearchResults(prev => [...prev, ...posts]);
      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1] || null);
      setHasMore(querySnapshot.docs.length === postsPerPage);
    } catch (error) {
      console.error('Erreur lors du chargement de posts supplémentaires:', error);
    }
    setIsLoadingMore(false);
  }, [
    lastDoc,
    isLoadingMore,
    hasMore,
    currentSearchTerms,
    selectedCategory,
    selectedPeople,
    selectedOrientation,
    selectedSort,
    selectedColor
  ]);

  // Fonction de recherche qui met à jour le terme de recherche et recharge les posts
  const performSearch = useCallback(async (searchTerms = []) => {
    // Si c'est une chaîne, la convertir en tableau
    const terms = Array.isArray(searchTerms) ? searchTerms : [searchTerms];
    
    // Filtrer les termes vides
    const filteredTerms = terms.filter(term => term && term.trim && term.trim().length > 0);
    
    // Enrichir les termes de recherche avec leurs formes singulières et plurielles
    const enrichedTerms = [];
    filteredTerms.forEach(term => {
      if (term && term.trim && term.trim().length > 0) {
        const trimmedTerm = term.trim().toLowerCase();
        enrichedTerms.push(trimmedTerm);
        
        // Ajouter la forme singulière si le terme est au pluriel
        if (pluralize.isPlural(trimmedTerm)) {
          enrichedTerms.push(pluralize.singular(trimmedTerm));
        }
        // Ajouter la forme plurielle si le terme est au singulier
        else if (pluralize.isSingular(trimmedTerm)) {
          enrichedTerms.push(pluralize.plural(trimmedTerm));
        }
      }
    });
    
    // Mettre à jour l'état avec les termes originaux pour l'affichage
    setCurrentSearchTerm(filteredTerms.join(' '));
    // Mais utiliser les termes enrichis pour la recherche
    setCurrentSearchTerms(enrichedTerms);
    
    // Lancer la recherche avec les termes enrichis
    await loadInitialPosts(enrichedTerms);
  }, [loadInitialPosts]);

  // Recharger les posts dès que les filtres ou le terme de recherche changent
  useEffect(() => {
    loadInitialPosts(currentSearchTerms);
  }, [selectedCategory, selectedPeople, selectedOrientation, selectedSort, selectedColor, currentSearchTerms, loadInitialPosts]);

  // Listener pour l'infinite scroll (chargement de posts supplémentaires)
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        loadMorePosts();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMorePosts]);

  return (
    <SearchContext.Provider value={{
      searchResults,
      performSearch,
      selectedPeople,
      setSelectedPeople,
      isSearching,
      selectedOrientation,
      setSelectedOrientation,
      selectedSort,
      setSelectedSort,
      selectedCategory,
      setSelectedCategory,
      visiblePosts,
      loadMorePosts,
      hasMore,
      isLoadingMore,
    }}>
      {children}
    </SearchContext.Provider>
  );
}

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};
