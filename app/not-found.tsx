import React from 'react';

export const metadata = {
  title: '404 - Page not found',
  robots: {
    index: false,
    follow: false
  }
};

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold">404 - Page not found</h1>
      <p className="mt-4">The page you are looking for does not exist.</p>
      <a href="/" className="mt-8 px-4 py-2 bg-black text-white rounded-xl">
        Back home
      </a>
    </div>
  );
}
