'use client';
import { CategoryProvider } from '@/app/context/CategoryContext';

export default function SearchLayout({ children }) {
    return (
        <CategoryProvider>
            {children}
        </CategoryProvider>
    );
}