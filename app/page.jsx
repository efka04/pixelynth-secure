// Composant serveur (par défaut dans Next.js App Router)
import React, { Suspense } from 'react';
import TopContributors from './components/TopContributors';
import ClientHomePage from './components/ClientHomePage';

export default function RootPage() {
  return (
    <main className="min-h-screen flex items-center">
      <div className="pt-2 w-full">
        <div className="max-w-7xl mx-auto px-4">
          {/* Section statique rendue côté serveur */}
          <div className="flex flex-col items-stretch gap-6 mb-4">
            {/* Bloc Titre et Top Contributors alignés */}
            <div className="flex flex-col lg:flex-row items-start gap-6">
              {/* Bloc Titre */}
              <div className="rounded-xl p-8 flex flex-col justify-center items-start text-black py-4 space-y-2 w-full lg:w-2/3">
                <div>
                  <h1 className="text-5xl mt-2 text-left">
                    Free AI-generated Stock Images
                  </h1>
                  <p className="text-md text-left opacity-90 max-w-3xl mt-2 space-y-4">
                    Download high-quality, royalty-free AI-generated stock images for your commercial and personal projects.
                  </p>
                </div>
              </div>

              {/* Top Contributors - rendu côté serveur */}
              <div className="w-full lg:w-1/3">
                <Suspense fallback={<div className="bg-gray-100 rounded-xl p-4 h-full">Loading contributors...</div>}>
                  <div className="bg-gray-100 rounded-xl p-4 h-full">
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
      </div>
    </main>
  );
}