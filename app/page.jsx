import React, { Suspense } from 'react';
import TopContributors from './components/TopContributors';
import ClientHomePage from './components/ClientHomePage';
import TopSearches from './components/TopSearches';
import ImageOfTheDay from './components/ImageOfTheDay';
import TopCollections from './components/TopCollections';

export default function RootPage() {
  return (
    <main className="min-h-screen pt-4">
      <div className="w-full">
        <div className="max-w-7xl mx-auto px-4">
          {/* Grille principale avec effet masonry */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 mb-8 grid-flow-dense">
            {/* Section Hero - occupe 5 colonnes sur grand écran */}
            <div className="lg:col-span-5 bg-black rounded-xl p-6 flex flex-col justify-center">
              <h1 className="text-5xl mt-2 text-left text-white">
                Free AI-generated Stock Images
              </h1>
              <p className="text-md text-left text-white opacity-90 max-w-3xl mt-2">
                Download high-quality, royalty-free AI-generated stock images for your commercial and personal projects.
              </p>
            </div>
            
            {/* Image of the Day - occupe 3 colonnes et 2 lignes sur grand écran */}
            <div className="lg:col-span-3 lg:row-span-2">
              <Suspense fallback={<div className="bg-gray-100 rounded-xl p-4 h-full min-h-[400px]">Loading image of the day...</div>}>
                <ImageOfTheDay />
              </Suspense>
            </div>
            
            {/* Top Collections - occupe 4 colonnes sur grand écran */}
            <div className="lg:col-span-4">
              <Suspense fallback={<div className="bg-gray-100 rounded-xl p-4 h-full">Loading collections...</div>}>
                <TopCollections />
              </Suspense>
            </div>
            
            {/* Logo Pixelynth - occupe 2 colonnes sur grand écran */}
            <div className="lg:col-span-2 bg-gray-100 rounded-xl border-[1px] border-black flex items-center justify-center p-6">
              <span
                className="font-bold text-6xl"
                style={{ fontFamily: 'Kdam Thmor Pro', fontWeight: 800 }}
              >
                P
              </span>
            </div>
            
            {/* Top Searches - occupe 2 colonnes et démarre à la 3ème colonne sur grand écran */}
            <div className="lg:col-span-3 lg:col-start-3">
              <Suspense fallback={<div className="bg-purple-100 rounded-xl p-4 h-full">Loading top searches...</div>}>
                <TopSearches />
              </Suspense>
            </div>
            
            {/* Top Contributors - occupe 4 colonnes, placé automatiquement dans le flux (effet masonry) */}
            <div className="lg:col-span-4">
              <Suspense fallback={<div className="bg-white rounded-xl p-4 h-full">Loading contributors...</div>}>
                <div className="bg-white border-[1px] border-black rounded-xl p-4 h-full">
                  <TopContributors />
                </div>
              </Suspense>
            </div>
          </div>

          {/* Composant client pour la galerie et les fonctionnalités interactives */}
          <Suspense fallback={<div>Loading gallery...</div>}>
            <ClientHomePage />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
