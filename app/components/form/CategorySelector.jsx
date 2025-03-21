// CategorySelector.jsx
import React from 'react';
import { categories } from '@/app/utils/constants';

const CategorySelector = ({ selectedCategories, onToggle }) => (
  <div className="space-y-2 my-2 md:my-3">
    <label className="block text-xs md:text-sm font-medium">
      Categories (select multiple)
    </label>
    <div className="flex flex-wrap gap-1 md:gap-1.5 max-h-[100px] md:max-h-[120px] overflow-y-auto p-1">
      {categories.map((category) => (
        <button
          key={`cat-${category}`}
          type="button"
          onClick={() => onToggle(category)}
          className={`px-2 md:px-3 py-0.5 text-xs rounded-full transition-all ${
            selectedCategories.includes(category)
              ? 'bg-black text-white'
              : 'bg-white border border-black hover:bg-black hover:text-white'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  </div>
);

export default CategorySelector;
