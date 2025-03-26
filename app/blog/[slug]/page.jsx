'use client';
import React, { useEffect, useState } from 'react';
import { getArticleBySlug, deleteArticle } from '@/services/firebaseService';
import { useParams, useRouter } from 'next/navigation';
import { convertFromRaw } from 'draft-js';
import { convertToHTML } from 'draft-convert';
import { auth } from '@/app/db/firebaseConfig';
import { useSession } from "next-auth/react";
import ArticleContent from '../components/ArticleContent';

const ArticlePage = () => {
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  // Récupérer l'article selon le slug
  useEffect(() => {
    const fetchArticle = async () => {
      const data = await getArticleBySlug(params.slug);
      console.log('Full article data:', data);
      setArticle(data);
      setLoading(false);
    };
    fetchArticle();
  }, [params.slug]);

  // Vérifier l'état d'authentification
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log('NextAuth session:', session);
      console.log('Firebase user:', user);
      setUserEmail(session?.user?.email || null);
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

  if (loading) return <div>Loading...</div>;
  if (!article) return <div>Article not found</div>;

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

  const customHTMLConverter = {
    styleToHTML: (style) => {
      switch (style) {
        case 'BOLD':
          return <strong />;
        case 'ITALIC':
          return <em />;
        case 'UNDERLINE':
          return <u />;
        case 'STRIKETHROUGH':
          return <s />;
        case 'CODE':
          return <code className="bg-gray-100 px-1 font-mono" />;
        case 'HEADER_ONE':
          return <span className="text-4xl font-bold" />;
        case 'HEADER_TWO':
          return <span className="text-3xl font-bold" />;
        case 'HEADER_THREE':
          return <span className="text-2xl font-bold" />;
        default:
          return null;
      }
    },
    blockToHTML: (block) => {
      switch (block.type) {
        case 'blockquote':
          return <blockquote className="border-l-4 border-gray-300 pl-4 italic" />;
        case 'ordered-list-item':
          return {
            element: <li />,
            wrapper: <ol className="list-decimal ml-4" />
          };
        case 'unordered-list-item':
          return {
            element: <li />,
            wrapper: <ul className="list-disc ml-4" />
          };
        case 'atomic':
          return {
            element: <figure className="my-4" />,
          };
        default:
          return <p className="mb-4" />;
      }
    },
    entityToHTML: (entity, originalText) => {
      if (entity.type === 'LINK') {
        return <a href={entity.data.url} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">{originalText}</a>;
      }
      if (entity.type === 'IMAGE') {
        return <img src={entity.data.src} className="max-w-full h-auto my-2" alt="" />;
      }
      return originalText;
    }
  };

  const renderContent = (content) => {
    try {
      const parsedContent = JSON.parse(content);
      // Si le contenu contient déjà du HTML, l'utiliser directement
      if (parsedContent.html) {
        return parsedContent.html;
      }
      // Sinon, convertir le contenu brut
      const contentState = convertFromRaw(parsedContent.raw || parsedContent);
      return convertToHTML(customHTMLConverter)(contentState);
    } catch (e) {
      console.error('Error rendering content:', e);
      return content;
    }
  };

  const isAdmin =
    authChecked &&
    status === 'authenticated' &&
    session?.user?.email === 'contact@pixelynth.com';

  return (
    <div className="container mx-auto px-4 py-8 max-w-[700px]">
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

      {/* Section image héro */}
      <div className="relative w-full h-[50vh] min-h-[400px] mb-8">
        {article?.coverImage && (
          <div className="border rounded-md overflow-hidden h-full">
            <div
              className="h-full bg-gray-200 bg-cover bg-center"
              style={{ backgroundImage: `url(${article.coverImage})` }}
            />
          </div>
        )}

        {/* Overlay du titre sur l'image */}
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <h1 className="text-4xl font-bold mb-4 drop-shadow-lg">
            {article.title}
          </h1>
          <div className="flex items-center gap-4 text-white/90">
            <span className="drop-shadow-md">{article.author}</span>
            <span>•</span>
            <span className="drop-shadow-md">
              {new Date(article.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Contenu de l'article */}
      <div className="prose max-w-none">
        <ArticleContent content={article.content} />
      </div>

      {/* Tags */}
      <div className="mt-6 flex gap-2">
        {article.tags.map(tag => (
          <span key={tag} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ArticlePage;
