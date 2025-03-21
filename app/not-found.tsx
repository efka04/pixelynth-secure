import React from 'react';

export const metadata = {
  title: '404 - Page non trouvée',
  robots: {
    index: false,
    follow: false
  }
};

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold">404 - Page Non Trouvée</h1>
      <p className="mt-4">La page que vous recherchez n'existe pas.</p>
      <a href="/" className="mt-8 px-4 py-2 bg-blue-500 text-white rounded">
        Retour à l'accueil
      </a>
    </div>
  );
}
