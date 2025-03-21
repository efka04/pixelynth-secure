'use client';
import React, { useEffect, useState } from 'react';
import { getArticles } from '@/services/firebaseService';
import CreateArticleButton from './components/CreateArticleButton';
import Link from 'next/link';
import { useSession } from 'next-auth/react';


const Blog = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { data: session, status } = useSession();

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const data = await getArticles();
        setArticles(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isAdmin = status === 'authenticated' && session?.user?.email === 'contact@pixelynth.com';

  if (loading) return <div></div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-8 relative min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Blog</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <Link 
            key={article.id} 
            href={`/blog/${article.slug}`}
            className="group border rounded-md overflow-hidden hover:shadow-lg transition-all duration-300"
          >
            <div 
              className="h-48 bg-gray-200 bg-cover bg-center"
              style={{ backgroundImage: `url(${article.coverImage})` }}
            />
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                {article.title}
              </h2>
              <div className="text-sm text-gray-500">
                {formatDate(article.createdAt)}
              </div>
            </div>
          </Link>
        ))}
      </div>
      {isAdmin && (
        <div className="fixed bottom-6 right-6">
          <CreateArticleButton />
        </div>
      )}
    </div>
  );
};

export default Blog;