// PeopleOptions.jsx
import React from 'react';

const PeopleOptions = ({ peopleCount, onSelect }) => {
  const options = [
    { value: 0, label: 'No people' },
    { value: 1, label: '1' },
    { value: 2, label: '2' },
    { value: 3, label: '3' },
    { value: 4, label: '4' },
    { value: 5, label: 'More' },
  ];
  return (
    <div className="flex flex-col gap-1 my-1 md:my-2">
      <h3 className="font-semibold text-xs md:text-sm">Number of People</h3>
      <div className="flex flex-wrap gap-1 md:gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onSelect(option.value)}
            className={`px-3 py-1 rounded-md border transition-colors ${
              peopleCount === option.value ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PeopleOptions;
