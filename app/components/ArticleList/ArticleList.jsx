'use client';
import React, { useEffect, useState } from 'react';
import { useSearch } from '../../context/SearchContext';
import { db } from '@/app/db/firebaseConfig';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import LoadingSpinner from './LoadingSpinner';
import Article from './Article';

export default function ArticleList() {
  const { selectedSort } = useSearch();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        let articlesQuery = collection(db, 'articles');

        if (selectedSort === 'newest') {
          articlesQuery = query(articlesQuery, orderBy('timestamp', 'desc'));
        } else if (selectedSort === 'popular') {
          articlesQuery = query(articlesQuery, orderBy('downloadCount', 'desc'));
        } else {
          // Default to relevance or any other default sorting logic
          articlesQuery = query(articlesQuery, orderBy('relevance', 'desc'));
        }

        const querySnapshot = await getDocs(articlesQuery);
        const articlesList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setArticles(articlesList);
      } catch (error) {
        console.error('Error fetching articles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [selectedSort]);

  if (loading) {
    <LoadingSpinner />;
  }

 
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {articles.map(article => (
        <Article key={article.id} article={article} />
      ))}
    </div>
  );
}
