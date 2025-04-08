'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useSearch } from '@/app/context/OptimizedSearchContext';
import { useColor } from '@/app/context/ColorContext';
import { useCategory } from '@/app/context/CategoryContext';
import { getEnhancedPostsPaginated } from '@/services/enhancedSearchService';
import ArticleList from '@/app/components/ArticleList';
import FilterBar from '../../../components/filterBar/FilterBar';

export default function OptimizedSearchResults() {
    const { query } = useParams();
    const { 
        performSearch, 
        selectedPeople,
        selectedOrientation,
        selectedSort
    } = useSearch();
    const { selectedColor } = useColor();
    const { selectedCategory } = useCategory();
    
    const [decodedQuery, setDecodedQuery] = useState('');
    const [posts, setPosts] = useState([]);
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);
    const [totalResults, setTotalResults] = useState(0);
    
    // Référence pour suivre les filtres actuels
    const currentFiltersRef = useRef({});
    // Référence pour le timeout de debounce
    const debounceTimerRef = useRef(null);
    
    // Décoder le paramètre de requête
    useEffect(() => {
        if (query) {
          let decoded = decodeURIComponent(query);
          decoded = decoded.replace(/-/g, ' ');
          setDecodedQuery(decoded);
          performSearch(decoded);
        }
    }, [query, performSearch]);

    // Charger les résultats avec debounce pour éviter le flickering
    const loadResults = useCallback(async (reset = false) => {
        if (!decodedQuery) return;
        
        if (reset) {
            // Ne pas vider les posts immédiatement pour éviter le flickering
            // Attendre d'avoir les nouveaux résultats avant de mettre à jour l'UI
            setLoading(true);
        }
        
        try {
            const { posts: newPosts, lastVisible, hasMore: more, total } = await getEnhancedPostsPaginated(
                reset ? null : lastDoc,
                100,
                { 
                    selectedPeople, 
                    selectedOrientation, 
                    selectedColor, 
                    selectedCategory, 
                    selectedSort,
                    searchQuery: decodedQuery
                }
            );
            
            // Mettre à jour les posts seulement après avoir reçu les nouveaux résultats
            if (reset) {
                setPosts(newPosts);
            } else {
                setPosts(prevPosts => [...prevPosts, ...newPosts]);
            }
            
            setLastDoc(lastVisible);
            setHasMore(more);
            setTotalResults(total);
        } catch (error) {
        } finally {
            setLoading(false);
        }
    }, [decodedQuery, lastDoc, selectedPeople, selectedOrientation, selectedColor, selectedCategory, selectedSort]);

    // Utiliser un effet avec debounce pour éviter les requêtes multiples rapprochées
    useEffect(() => {
        if (!decodedQuery) return;
        
        // Créer un objet représentant les filtres actuels
        const currentFilters = {
            query: decodedQuery,
            people: selectedPeople,
            orientation: selectedOrientation,
            color: selectedColor,
            category: selectedCategory,
            sort: selectedSort
        };
        
        // Vérifier si les filtres ont changé
        const filtersChanged = JSON.stringify(currentFilters) !== JSON.stringify(currentFiltersRef.current);
        currentFiltersRef.current = currentFilters;
        
        if (!filtersChanged) return;
        
        // Annuler tout timer de debounce précédent
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        
        // Définir un nouveau timer de debounce (300ms)
        debounceTimerRef.current = setTimeout(() => {
            loadResults(true);
            debounceTimerRef.current = null;
        }, 300);
        
        // Nettoyage
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [decodedQuery, selectedPeople, selectedOrientation, selectedColor, selectedCategory, selectedSort, loadResults]);

    // Fonction pour charger plus de résultats
    const handleLoadMore = useCallback(() => {
        if (!loading && hasMore) {
            loadResults(false);
        }
    }, [loadResults, loading, hasMore]);

    return (
        <main className="min-h-screen p-4 md:p-2">
            <div className="max-w-7xl mx-auto">
                <FilterBar />
                <div className="flex justify-between items-center my-0 mb-2">
                    <h1 className="font-bold text-4xl"></h1>
                    <p className="text-gray-500">
                        {posts.length} {totalResults > 0 ? `sur ${totalResults}` : ''} result{posts.length !== 1 ? 's' : ''}
                    </p>
                </div>

                {loading && posts.length === 0 ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-black" />
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-xl text-gray-500">
                            No results found for "{decodedQuery}"
                        </p>
                        <p className="text-gray-400 mt-2">
                        Try adjusting your filters or using different search terms                        </p>
                    </div>
                ) : (
                    <>
                        {/* Overlay de chargement semi-transparent pendant le rechargement */}
                        {loading && (
                            <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-black" />
                            </div>
                        )}
                        <ArticleList 
                            listPosts={posts} 
                            onLoadMore={handleLoadMore}
                            hasMore={hasMore}
                        />
                    </>
                )}
            </div>
        </main>
    );
}
