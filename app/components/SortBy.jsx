'use client'
import React, { useState } from 'react'
import { FaFire, FaClock, FaSort } from 'react-icons/fa'

const sortOptions = [
  { value: 'relevance', label: 'Relevance', icon: <FaSort size={20} /> },
  { value: 'popular', label: 'Popular', icon: <FaFire size={20} /> },
  { value: 'newest', label: 'Newest', icon: <FaClock size={20} /> },
];

const SortBy = ({ selectedSort, onSortChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getCurrentOption = () => {
    return sortOptions.find(option => option.value === selectedSort) || sortOptions[0];
  };

  const handleSelect = (option) => {
    onSortChange(option.value);
    setIsOpen(false);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative inline-block w-[120px]">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between bg-white border border-black text-black px-2 py-1 rounded-md hover:bg-gray-100"
        >
          <div className="flex items-center gap-1 truncate">
            {getCurrentOption().icon}
            <span className="truncate">{getCurrentOption().label}</span>
          </div>
        </button>

        <div className={`
          absolute left-0 right-0 top-full mt-2
          bg-white rounded-md shadow-lg
          w-full
          transition-all duration-200 z-50
          ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}
        `}>
          <div className="py-2">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option)}
                className={`
                  w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100
                  ${selectedSort === option.value ? 'text-black font-medium' : 'text-gray-600'}
                `}
              >
                {option.icon}
                <span className="truncate">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SortBy;
