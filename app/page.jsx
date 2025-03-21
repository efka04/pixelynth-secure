"use client";
import React, { useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useSearch } from '@/app/context/OptimizedSearchContext';
import { CategoryProvider } from '@/app/context/CategoryContext';
import FilterBar from '@/app/components/filterBar/FilterBar';
import CategoryBar from '@/app/components/CategoryBar';
import TopContributors from '@/app/components/TopContributors'; // Import TopContributors component
import PostsPage from '@/app/posts/page';
import { useRouter } from 'next/router'; // Import useRouter
import { usePathname } from 'next/navigation'; // Import usePathname

// Import dynamique d'ArticleList avec Suspense
const ArticleList = dynamic(() => import('@/app/components/ArticleList'), {
  suspense: true,
});

export default function RootPage() {
  const { searchResults, performSearch, selectedPeople } = useSearch();
  const pathname = usePathname(); // Get the current route

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
      <main className="min-h-screen flex items-center">
        <Head>
          <meta name="keywords" content="AI images, stock photos, free images, artificial intelligence, digital art, stock images, AI generated images, AI pictures" />
        </Head>
        <div className="pt-2 w-full">
          <div className="max-w-7xl mx-auto px-4"> {/* Add pt-16 for spacing */}
            <CategoryBar isSticky={pathname === '/'} /> {/* Pass isSticky prop */}

            <div className="flex flex-col md:flex-row items-stretch gap-6 mb-4">
              {/* Bloc Titre (2/3) */}
              <div className="md:w-2/3 rounded-xl p-8 flex flex-col justify-center items-start text-black py-4 space-y-2">
                <div>
                  <h1 className="text-5xl mt-2 text-left">
                    Free AI-generated Stock Images
                  </h1>
                  <p className="text-md text-left opacity-90 max-w-3xl mt-2 space-y-4">
                    Download high-quality, royalty-free AI-generated stock images for your commercial and personal projects.
                  </p>
                </div>
              </div>
              {/* Bloc Top Contributors */}
              <TopContributors />
            </div>
            <div className="mb-4">
            </div>
            <Suspense fallback={<div></div>}>
              <PostsPage listPosts={searchResults} selectedPeople={selectedPeople} />
            </Suspense>
          </div>
        </div>
      </main>
    </CategoryProvider>
  );
}