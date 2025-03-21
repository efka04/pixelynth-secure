'use client';
import React from 'react';
import Link from 'next/link';

const CreateArticleButton = () => {
  return (
    <Link
      href="/blog/create"
      className="bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-700 flex items-center space-x-2 z-50"
    >
      <span className="text-2xl font-bold">+</span>
      <span className="font-medium">Créer un article</span>
    </Link>
  );
};

export default CreateArticleButton;
