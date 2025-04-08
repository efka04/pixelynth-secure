'use client'
import { IoSearchOutline } from "react-icons/io5";
import { AiOutlineClose } from "react-icons/ai";
import { useSearch } from '../../context/OptimizedSearchContext';
import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { useColor } from '@/app/context/ColorContext';
import { useCategory } from '@/app/context/CategoryContext';


export default function SearchBar() {
    const { performSearch, isSearching } = useSearch();
    const [searchTerm, setSearchTerm] = useState('');
    const router = useRouter();
    const { setSelectedPeople, setSelectedOrientation, setSelectedSort } = useSearch();
    const { setSelectedColor } = useColor();
    const { selectedCategory, setSelectedCategory } = useCategory();
    

    const handleSearch = useCallback((value) => {
        setSearchTerm(value);
        // Removed performSearch to disable searching on input change
    }, []);

    const resetFilters = () => {
        setSelectedColor(null);
        setSelectedPeople('all');
        setSelectedOrientation('all');
        setSelectedSort('relevance');
        setSelectedCategory(''); // Ensure this line is present
    };



    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter') {   
            e.preventDefault();
            if (searchTerm.trim()) {
                const encodedSearchTerm = encodeURIComponent(searchTerm.trim().replace(/\s+/g, '-'));
                router.push(`/search/photos/${encodedSearchTerm}`);
            }
            resetFilters();
        }
    }, [searchTerm, performSearch, router]);

    const clearSearch = useCallback(() => {
        setSearchTerm('');
        performSearch('');
    }, [performSearch]);

    return (
        <form onSubmit={(e) => e.preventDefault()} className="relative ">
            <div className="bg-white border-[1px] border-black transition-all rounded-full p-2 flex items-center gap-3 w-full md:w-[800px]">
                <IoSearchOutline className="text-2xl text-gray-500 ml-2" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search..."
                    className="bg-transparent outline-none w-full"
                    aria-label="Search"
                />
                {searchTerm && (
                    <div className="flex items-center">
                        {isSearching && searchTerm.length >= 2 && (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 border-t-transparent mr-2" />
                        )}
                        <button
                            type="button"
                            onClick={() => {
                                clearSearch();
                                if (window.location.pathname.startsWith('/search/photos/')) {
                                    router.push('/');
                                }
                            }}
                            className="text-gray-500 hover:text-gray-700 focus:outline-none mr-2"
                            aria-label="Clear search"
                        >
                            <AiOutlineClose className="text-2xl" />
                        </button>
                    </div>
                )}
            </div>
        </form>
    );
}
