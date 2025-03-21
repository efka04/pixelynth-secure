import React, { useCallback, useMemo, useRef } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useCategory } from '../context/CategoryContext';
import { categories, categoryColors } from '@/app/utils/constants';

export default function CategoryBar() {
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
                            fontFamily: 'PPNeueMachina', // Apply font family
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
        <div className="relative bg-white -translate-y-2 mb-0">
            <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-gradient-to-r from-white to-transparent w-5"
            >
                <FaChevronLeft className="text-xl -translate-x-1" />
            </button>

            <div
                ref={categoriesRef}
                className="overflow-x-auto whitespace-nowrap py-2 px-6 bg-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
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

            <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gradient-to-r from-transparent to-white h-9 w-16"
            >
                <FaChevronRight className="text-xl translate-x-10" />
            </button>
        </div>
    );
}
