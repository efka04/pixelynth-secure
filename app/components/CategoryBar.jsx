import React, { useCallback, useMemo, useRef } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useCategory } from '../context/CategoryContext';
import { categories, categoryColors } from '@/app/utils/constants';

export default function CategoryBar({ className, isSticky }) {
    const { selectedCategory, setSelectedCategory } = useCategory();
    const categoriesRef = useRef(null);

    const handleCategoryClick = useCallback(
        (category) => {
            setSelectedCategory(category);
        },
        [setSelectedCategory]
    );

    const scroll = useCallback((direction) => {
        if (categoriesRef.current) {
            const scrollAmount = 200;
            categoriesRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
        }
    }, []);

    const categoryButtons = useMemo(
        () =>
            categories.map((cat) => {
                const color = categoryColors[cat] || '#CCCCCC'; // Default to gray
                const isSelected = selectedCategory === cat;

                return (
                    <button
                        key={cat}
                        onClick={() => handleCategoryClick(cat)}
                        className="px-4 py-0 rounded-full transition-all"
                        style={{
                            fontFamily: 'Kdam Thmor Pro', // Apply font family
                            fontWeight: isSelected ? 300 : 300, // Bold when selected, Light otherwise
                            backgroundColor: isSelected ? color : 'white', // Show color when selected, white otherwise
                            border: isSelected ? 'none' : '1px solid black', // Remove border when selected
                            color: isSelected ? 'black' : 'black', // White text when selected, black otherwise
                            transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) => {
                            if (!isSelected) {
                                e.target.style.backgroundColor = color; // Show color on hover
                                e.target.style.color = 'black'; // White text on hover
                                e.target.style.border = 'none'; // Remove border on hover
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isSelected) {
                                e.target.style.backgroundColor = 'white'; // Revert to white
                                e.target.style.color = 'black'; // Revert text to black
                                e.target.style.border = '1px solid black'; // Revert border
                            }
                        }}
                    >
                        {cat}
                    </button>
                );
            }),
        [categories, selectedCategory, handleCategoryClick]
    );

    return (
        <div
            className={`relative bg-red -translate-y-2 mb-0 ${
                isSticky ? 'sticky top-[66px] z-30' : ''
            }`} // Adjust top to match header height
        >
    

            <div
                ref={categoriesRef}
                className="overflow-x-auto whitespace-nowrap py-2 px-6 bg-red [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
                <div className="flex gap-2"> {/* Reduced gap */}
                    <button
                        onClick={() => handleCategoryClick('')}
                        className={`px-4 py-1 rounded-full transition-all ${
                            !selectedCategory
                                ? 'bg-black text-white'
                                : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                    >
                        All
                    </button>
                    {categoryButtons}
                </div>
            </div>

    
        </div>
    );
}
