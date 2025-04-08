'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearch } from '@/app/context/OptimizedSearchContext';
import ArticleList from '@/app/components/ArticleList';
import { useParams } from 'next/navigation';
import FilterBar from '../../../components/filterBar/FilterBar';
import { useColor } from '@/app/context/ColorContext';
import { useCategory } from '@/app/context/CategoryContext';
import { getEnhancedPostsPaginated } from '@/services/enhancedSearchService';

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
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const [activeFilters, setActiveFilters] = useState([]);
    
    // Refs to track filter changes and prevent unnecessary loading states
    const pendingSearchRef = useRef(false);
    const searchTimeoutRef = useRef(null);
    const currentFiltersRef = useRef({});

    // Decode query parameter
    useEffect(() => {
        if (query) {
          // Première étape : décoder l'URL
          let decoded = decodeURIComponent(query);
          // Deuxième étape : remplacer les tirets par des espaces
          decoded = decoded.replace(/-/g, ' ');
          setDecodedQuery(decoded);
          performSearch(decoded);
        }
      }, [query, performSearch]);

    // Update active filters list for better user feedback
    useEffect(() => {
        const filters = [];
        if (selectedPeople && selectedPeople !== 'all') filters.push(`People: ${selectedPeople}`);
        if (selectedOrientation && selectedOrientation !== 'all') filters.push(`Orientation: ${selectedOrientation}`);
        if (selectedColor) filters.push(`Color: ${selectedColor}`);
        if (selectedCategory) filters.push(`Category: ${selectedCategory}`);
        if (selectedSort && selectedSort !== 'relevance') filters.push(`Sort: ${selectedSort}`);
        setActiveFilters(filters);
    }, [selectedPeople, selectedOrientation, selectedColor, selectedCategory, selectedSort]);

    // Load filtered posts when any filter changes
    const loadFilteredPosts = useCallback(async (reset = false) => {
        if (!decodedQuery) return;
        
        // Don't set loading state if we're just loading more (not resetting)
        if (reset && initialLoadComplete) {
            pendingSearchRef.current = true;
        }
        
        try {
            // Utiliser le nouveau service de recherche amélioré avec système de points
            const { posts: newPosts, lastVisible } = await getEnhancedPostsPaginated(
                reset ? null : lastDoc,
                24,
                { 
                    selectedPeople, 
                    selectedOrientation, 
                    selectedColor, 
                    selectedCategory, 
                    selectedSort,
                    searchQuery: decodedQuery // Add search query as an additional filter
                }
            );
            
            // Only update state if this is still the most recent search
            if (pendingSearchRef.current || !initialLoadComplete) {
                setPosts(prevPosts => reset ? newPosts : [...prevPosts, ...newPosts]);
                setLastDoc(lastVisible);
                setHasMore(newPosts.length === 24);
                setInitialLoadComplete(true);
                pendingSearchRef.current = false;
            }
        } catch (error) {
            console.error("Error loading filtered search results:", error);
            if (pendingSearchRef.current || !initialLoadComplete) {
                pendingSearchRef.current = false;
            }
        } finally {
            setLoading(false);
        }
    }, [
        decodedQuery, lastDoc, initialLoadComplete,
        selectedPeople, selectedOrientation, selectedColor, selectedCategory, selectedSort
    ]);

    // Handle filter changes with advanced anti-flickering
    useEffect(() => {
        if (!decodedQuery) return;
        
        // Store current filters for comparison
        const newFilters = {
            query: decodedQuery,
            people: selectedPeople,
            orientation: selectedOrientation,
            color: selectedColor,
            category: selectedCategory,
            sort: selectedSort
        };
        
        // Check if filters have actually changed
        const filtersChanged = JSON.stringify(newFilters) !== JSON.stringify(currentFiltersRef.current);
        currentFiltersRef.current = newFilters;
        
        if (!filtersChanged && initialLoadComplete) {
            return; // Skip if filters haven't changed and initial load is done
        }
        
        // Clear any pending timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        // Only show loading state on initial load
        if (!initialLoadComplete) {
            setLoading(true);
        }
        
        // Debounce filter changes
        searchTimeoutRef.current = setTimeout(() => {
            loadFilteredPosts(true);
            searchTimeoutRef.current = null;
        }, 500);
        
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [decodedQuery, selectedPeople, selectedOrientation, selectedColor, selectedCategory, selectedSort, loadFilteredPosts, initialLoadComplete]);

    // Function to load more posts
    const handleLoadMore = useCallback(() => {
        if (!loading && hasMore) {
            loadFilteredPosts(false);
        }
    }, [loadFilteredPosts, loading, hasMore]);

    // Determine what to display based on loading and results state
    const renderContent = () => {
        if (!initialLoadComplete && loading) {
            return (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-black" />
                </div>
            );
        }
        
        if (posts.length === 0) {
            return (
                <div className="text-center py-12">
                    <p className="text-xl text-gray-500">
                        {activeFilters.length > 0 
                            ? "No images found matching your filters" 
                            : `No results found for "${decodedQuery}"`}
                    </p>
                    {activeFilters.length === 0 && (
                        <p className="text-gray-400 mt-2">Try different keywords</p>
                    )}
                </div>
            );
        }
        
        return (
            <ArticleList 
                listPosts={posts} 
                onLoadMore={handleLoadMore}
                hasMore={hasMore}
            />
        );
    };

    return (
        
        <main className="max-w-7xl mx-auto px-4 md:p-2">
            <div className="max-w-7xl mx-auto px-4">
                <FilterBar />
                <div className="flex justify-between items-center my-0 mb-2">
                    <h1 className="font-bold text-4xl"></h1>
                    {initialLoadComplete && (
                        <p className="text-gray-500">
                            {posts.length} result{posts.length !== 1 ? 's' : ''}
                        </p>
                    )}
                </div>

                {renderContent()}
            </div>
        </main>
    );
}
