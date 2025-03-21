import React from 'react';
import { categories } from '@/app/utils/constants';
import { useCategory } from '@/app/context/CategoryContext';

export default function Categories({ onSelectCategory }) {
  const { selectedCategory, setSelectedCategory } = useCategory();

  const handleCategoryClick = (categoryValue) => {
    setSelectedCategory(categoryValue);
    if (onSelectCategory) onSelectCategory(categoryValue);
  };

  return (
    <div className="flex gap-4">
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
      {categories.map((category) => (
        <button
          key={category.value}
          onClick={() => handleCategoryClick(category.value)}
          className={`px-4 py-1 rounded-full transition-all ${
            selectedCategory === category.value 
              ? 'bg-black text-white' 
              : 'bg-white border-[1px] border-black hover:bg-black hover:text-white'
          }`}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}