'use client';
import React, { useState } from 'react';
import { useSearch } from '../../context/OptimizedSearchContext';
import pluralize from 'pluralize';

const SearchBar = () => {
  const { performSearch } = useSearch();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    
    const lowerCaseTerm = searchTerm.toLowerCase().trim();
    
    // Create variations of the search term to handle plurals and common misspellings
    const searchTerms = generateSearchVariations(lowerCaseTerm);
    
    // Perform search with all variations
    performSearch(searchTerms);
  };

  // Generate variations of the search term to improve search results
  const generateSearchVariations = (term) => {
    const variations = new Set();
    
    // Add original term
    variations.add(term);
    
    // Add singular and plural forms
    variations.add(pluralize(term));
    variations.add(pluralize.singular(term));
    
    // Handle common misspellings by adding variations with:
    // 1. Vowel substitutions (e.g., "color" vs "colour")
    const vowelSubstitutions = term
      .replace(/a/g, '[ae]')
      .replace(/e/g, '[ei]')
      .replace(/i/g, '[iy]')
      .replace(/o/g, '[oa]')
      .replace(/u/g, '[ou]');
    variations.add(vowelSubstitutions);
    
    // 2. Common letter doubling mistakes
    const commonDoubles = ['s', 't', 'p', 'l', 'n', 'm'];
    commonDoubles.forEach(letter => {
      if (term.includes(letter + letter)) {
        variations.add(term.replace(letter + letter, letter));
      } else if (term.includes(letter)) {
        const position = term.indexOf(letter);
        if (position > 0 && position < term.length - 1) {
          variations.add(
            term.substring(0, position) + letter + letter + term.substring(position + 1)
          );
        }
      }
    });
    
    // Return array of unique variations
    return Array.from(variations);
  };

  return (
    <form onSubmit={handleSearch} className="flex items-center w-full">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search..."
        className="flex-1 px-4 py-2 border border-gray-300 rounded-md"
      />
      <button type="submit" className="ml-2 px-4 py-2 bg-black text-white rounded-md">
        Search
      </button>
    </form>
  );
};

export default SearchBar;
