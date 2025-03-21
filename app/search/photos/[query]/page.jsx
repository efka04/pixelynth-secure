'use client';
import { useEffect, useState } from 'react';
import { useSearch } from '@/app/context/OptimizedSearchContext';
import ArticleList from '@/app/components/ArticleList';
import { useParams } from 'next/navigation';
import FilterBar from '../../../components/filterBar/FilterBar';

export default function OptimizedSearchResults() {
    const { query } = useParams();
    const { 
        performSearch, 
        visiblePosts, 
        loadMorePosts, 
        hasMore, 
        isSearching, 
        totalResults 
    } = useSearch();
    const [decodedQuery, setDecodedQuery] = useState('');

    useEffect(() => {
        if (query) {
            const decoded = decodeURIComponent(query);
            setDecodedQuery(decoded);
            performSearch(decoded);
        }
    }, [query, performSearch]);

    return (
        <main className="min-h-screen p-4 md:p-2">
            <div className="max-w-7xl mx-auto">
                <FilterBar />
                <div className="flex justify-between items-center my-5 mb-8">
                    <h1 className="font-bold text-4xl">{decodedQuery}</h1>
                    {!isSearching && (
                        <p className="text-gray-500">
                            {totalResults} result{totalResults !== 1 ? 's' : ''}
                        </p>
                    )}
                </div>

                {isSearching ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-black" />
                    </div>
                ) : visiblePosts.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-xl text-gray-500">No results found for "{decodedQuery}"</p>
                        <p className="text-gray-400 mt-2">Try different Keywords</p>
                    </div>
                ) : (
                    <ArticleList 
                        listPosts={visiblePosts} 
                        onLoadMore={loadMorePosts}
                        hasMore={hasMore}
                    />
                )}
            </div>
        </main>
    );
}
