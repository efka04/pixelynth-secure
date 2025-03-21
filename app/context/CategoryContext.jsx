'use client'
import { createContext, useState, useContext } from 'react';

export const CategoryContext = createContext(undefined);

export function CategoryProvider({ children }) {
    const [selectedCategory, setSelectedCategory] = useState('');
    
    const value = {
        selectedCategory,
        setSelectedCategory
    };

    return (
        <CategoryContext.Provider value={value}>
            {children}
        </CategoryContext.Provider>
    );
}

export function useCategory() {
    const context = useContext(CategoryContext);
    if (context === undefined) {
        throw new Error('useCategory must be used within a CategoryProvider');
    }
    return context;
}