'use client';

import React, { useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearch } from '@/app/context/OptimizedSearchContext';
import { CategoryProvider } from '@/app/context/CategoryContext';
import CategoryBar from '@/app/components/CategoryBar';
import PostsGrid from '@/app/components/PostsGrid';
import { usePathname } from 'next/navigation';

// Import dynamique d'ArticleList avec Suspense
const ArticleList = dynamic(() => import('@/app/components/ArticleList'), {
  suspense: true,
});

export default function ClientHomePage() {
  const { searchResults, performSearch, selectedPeople } = useSearch();
  const pathname = usePathname();

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        })
        .catch((error) => {
          console.log('ServiceWorker registration failed: ', error);
        });
    }
  }, []);

  return (
    <CategoryProvider>
      <div className="w-full">
        <CategoryBar isSticky={pathname === '/'} />
        <div className="mb-4"></div>
        <Suspense fallback={<div>Loading images...</div>}>
          <PostsGrid listPosts={searchResults} selectedPeople={selectedPeople} />
        </Suspense>
      </div>
    </CategoryProvider>
  );
}