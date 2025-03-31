'use client';
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getCountFromServer
} from 'firebase/firestore';
import { db } from '../db/firebaseConfig';
import { useColor } from '@/app/context/ColorContext';
import { splitSearchQuery, executeWeightedSearch } from '../utils/weightedSearchUtils';

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
  const [totalResults, setTotalResults] = useState(0);
  
  // Utiliser useRef au lieu de useState pour le timeout
  const searchTimeoutRef = useRef(null);

  const postsPerPage = 20;

  // Fonction pour construire les conditions de filtrage
  const buildFilterConditions = useCallback(() => {
    const conditions = [];
    
    if (selectedCategory) {
      conditions.push(where('categories', 'array-contains', selectedCategory));
    }
    
    if (selectedPeople !== 'all') {
      conditions.push(where('people', '==', selectedPeople));
    }
    
    if (selectedOrientation !== 'all') {
      conditions.push(where('orientation', '==', selectedOrientation));
    }
    
    if (selectedColor) {
      conditions.push(where('color', '==', selectedColor));
    }
    
    return conditions;
  }, [selectedCategory, selectedPeople, selectedOrientation, selectedColor]);

  // Fonction pour effectuer la recherche
  const performSearch = useCallback(async (searchTerm = '') => {
    // Éviter les recherches répétées avec le même terme
    if (isSearching || searchTerm === currentSearchTerm) return;
    
    // Annuler tout timeout précédent
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    
    setIsSearching(true);
    setCurrentSearchTerm(searchTerm);
    
    // Définir un nouveau timeout
    searchTimeoutRef.current = setTimeout(() => {
      setIsSearching(false);
      setSearchResults([]);
      setVisiblePosts([]);
      setHasMore(false);
      searchTimeoutRef.current = null;
    }, 10000);
    
    try {
      setLastDoc(null);
      
      // Diviser la requête en termes individuels pour la recherche pondérée
      const searchTerms = splitSearchQuery(searchTerm);
      
      // Obtenir les conditions de filtrage
      const filterConditions = buildFilterConditions();
      
      // Exécuter la recherche pondérée
      const { results, lastDoc: newLastDoc, hasMore: moreResults, total } = 
        await executeWeightedSearch(
          searchTerms,
          filterConditions,
          selectedSort,
          postsPerPage,
          null
        );
            
      setTotalResults(total);
      setSearchResults(results);
      setVisiblePosts(results);
      setLastDoc(newLastDoc);
      setHasMore(moreResults);
      
      // Annuler le timeout car la recherche est terminée
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setSearchResults([]);
      setVisiblePosts([]);
      setHasMore(false);
      
      // Annuler le timeout en cas d'erreur
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
    } finally {
      setIsSearching(false);
    }
  }, [buildFilterConditions, isSearching, currentSearchTerm, selectedSort]);

  // Fonction pour charger plus de résultats
  const loadMorePosts = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    
    try {
      // Diviser la requête en termes individuels pour la recherche pondérée
      const searchTerms = splitSearchQuery(currentSearchTerm);
      
      // Obtenir les conditions de filtrage
      const filterConditions = buildFilterConditions();
      
      // Exécuter la recherche pondérée avec pagination
      const { results, lastDoc: newLastDoc, hasMore: moreResults } = 
        await executeWeightedSearch(
          searchTerms,
          filterConditions,
          selectedSort,
          postsPerPage,
          lastDoc
        );
      
      setVisiblePosts(prev => [...prev, ...results]);
      setLastDoc(newLastDoc);
      setHasMore(moreResults);
    } catch (error) {
      console.error('Erreur lors du chargement de plus de résultats:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [buildFilterConditions, currentSearchTerm, hasMore, isLoadingMore, lastDoc, selectedSort]);

  // Effet pour recharger les résultats quand les filtres changent
  useEffect(() => {
    if (currentSearchTerm) {
      performSearch(currentSearchTerm);
    }
  }, [selectedCategory, selectedPeople, selectedOrientation, selectedSort, selectedColor, currentSearchTerm, performSearch]);

  // Listener pour l'infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        loadMorePosts();
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMorePosts]);

  // Nettoyer le timeout lors du démontage
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <SearchContext.Provider value={{
      searchResults,
      visiblePosts,
      isSearching,
      hasMore,
      isLoadingMore,
      totalResults,
      currentSearchTerm,
      selectedPeople,
      selectedOrientation,
      selectedSort,
      selectedCategory,
      performSearch,
      loadMorePosts,
      setSelectedPeople,
      setSelectedOrientation,
      setSelectedSort,
      setSelectedCategory
    }}>
      {children}
    </SearchContext.Provider>
  );
}

export const useSearch = () => useContext(SearchContext);