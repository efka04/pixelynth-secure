'use client'
import React, { useState } from 'react'
import { BsFillPersonFill, BsPeople, BsPeopleFill } from 'react-icons/bs'
import { HiUserGroup } from 'react-icons/hi'
import { FaUsers } from 'react-icons/fa'

const peopleOptions = [
  { value: 'all', label: 'Any', icon: <BsPeople size={20} /> },
  { value: '1', label: '1 ', icon: <BsFillPersonFill size={20} /> },
  { value: '2', label: '2 ', icon: <BsPeopleFill size={20} /> },
  { value: '3', label: '3 ', icon: <HiUserGroup size={20} /> },
  { value: '4', label: '4 ', icon: <HiUserGroup size={20} /> },
  { value: '5', label: 'More', icon: <HiUserGroup size={22} /> }
];

const SortPeople = ({ selectedPeople, onPeopleChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getCurrentOption = () => {
    return peopleOptions.find(option => option.value === selectedPeople) || peopleOptions[0];
  };

  const handleSelect = (option) => {
    onPeopleChange(option.value); // Correct - utilise le bon nom de fonction
    setIsOpen(false);
  };

  return (
    <div className="flex items-center gap-2"> {/* Added wrapper div with flex */}
      <div className="relative inline-block w-[110px]"> {/* Fixed width container */}
        {/* Main Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between bg-white text-black px-2 py-1 border border-black rounded-md hover:bg-gray-100"
        >
          <div className="flex items-center gap-2 truncate">
            {getCurrentOption().icon}
            <span className="truncate">{getCurrentOption().label}</span>
          </div>
        </button>

        {/* Dropdown Menu */}
        <div className={`
          absolute left-0 right-0 top-full mt-2
          bg-white rounded-md shadow-lg
          w-full
          transition-all duration-200 z-50
          ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}
        `}>
          <div className="py-2">
            {peopleOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option)}
                className={`
                  w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100
                  ${selectedPeople === option.value ? 'text-black font-medium' : 'text-gray-600'}
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

const sortOptions = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Popular' },
];

const SortGlobal = ({ selectedSort, onSortChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getCurrentOption = () => {
    return sortOptions.find(option => option.value === selectedSort) || sortOptions[0];
  };

  const handleSelect = (option) => {
    onSortChange(option.value);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block w-[150px]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-white text-black px-2 py-1 border border-black rounded-md hover:bg-gray-100"
      >
        <div className="flex items-center gap-2 truncate">
          <span className="truncate">{getCurrentOption().label}</span>
        </div>
      </button>

      <div className={`
  absolute left-0 right-0 top-full mt-2
          bg-white rounded-md shadow-lg border border-black
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
              <span className="truncate">{option.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SortGlobal;
export { SortPeople };
