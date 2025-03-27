'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteArticle } from '@/services/firebaseService';
import { useSession } from "next-auth/react";
import { auth } from '@/app/db/firebaseConfig';
import ArticleContent from '../components/ArticleContent';

export default function ClientBlogPost({ article }) {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  // Vérifier l'état d'authentification
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(status === 'authenticated');
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, [session, status]);

  // Après rendu de l'article, relancer la conversion du tweet
  useEffect(() => {
    if (article) {
      if (
        window.twttr &&
        window.twttr.widgets &&
        typeof window.twttr.widgets.load === 'function'
      ) {
        window.twttr.widgets.load();
      } else {
        const script = document.createElement('script');
        script.src = 'https://platform.twitter.com/widgets.js';
        script.async = true;
        script.charset = 'utf-8';
        script.onload = () => {
          if (
            window.twttr &&
            window.twttr.widgets &&
            typeof window.twttr.widgets.load === 'function'
          ) {
            window.twttr.widgets.load();
          }
        };
        document.body.appendChild(script);
      }
    }
  }, [article]);

  const handleEdit = () => {
    router.push(`/blog/edit/${article.id}`);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      try {
        await deleteArticle(article.id);
        router.push('/blog');
      } catch (error) {
        console.error('Error deleting article:', error);
      }
    }
  };

  const isAdmin =
    authChecked &&
    status === 'authenticated' &&
    session?.user?.email === 'contact@pixelynth.com';

  return (
    <>
      {authChecked && isAdmin && (
        <div className="flex justify-end items-center gap-4 mb-6">
          <button
            onClick={handleEdit}
            className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      )}

      {/* Contenu de l'article */}
      <div className="prose max-w-none">
        <ArticleContent content={article.content} />
      </div>

      {/* Tags */}
      <div className="mt-6 flex gap-2">
        {article.tags && article.tags.map(tag => (
          <span key={tag} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
            {tag}
          </span>
        ))}
      </div>
    </>
  );
}
