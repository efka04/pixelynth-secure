'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, getDocs, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '@/app/db/firebaseConfig';
import ArticleList from '@/app/components/ArticleList';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';
import { categoryColors } from '@/app/utils/constants';
import FilterBar from '@/app/components/filterBar/FilterBar';
import { useInView } from 'react-intersection-observer';
import { getFromCache, saveToCache } from '@/app/utils/cacheUtils';

export default function CategoryPage() {
  const params = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const category = params.category ? decodeURIComponent(params.category) : '';
  const categoryColor = categoryColors[category] || '#CCCCCC';
  const POSTS_PER_PAGE = 20; // Réduit de 50 à 20 pour le chargement initial
  
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  const fetchCategoryPosts = async (isInitial = false) => {
    if (!category || (loading && !isInitial) || (!hasMore && !isInitial)) return;
    
    // Si c'est le chargement initial, vérifier le cache
    if (isInitial) {
      setLoading(true);
      const cacheKey = `category_posts_${category}_initial`;
      const cachedPosts = getFromCache(cacheKey);
      
      if (cachedPosts) {
        setPosts(cachedPosts.items);
        setLastDoc(cachedPosts.lastDocId ? { id: cachedPosts.lastDocId } : null);
        setHasMore(cachedPosts.hasMore);
        setLoading(false);
        
        // Rafraîchir en arrière-plan après un court délai
        setTimeout(() => refreshCategoryPostsInBackground(cacheKey), 100);
        return;
      }
    }
    
    setLoading(true);
    try {
      const postsRef = collection(db, 'post');
      let categoryQuery;
      
      if (isInitial) {
        categoryQuery = query(
          postsRef,
          where('categories', 'array-contains', category),
          orderBy('timestamp', 'desc'),
          limit(POSTS_PER_PAGE)
        );
        setPosts([]);
      } else {
        categoryQuery = query(
          postsRef,
          where('categories', 'array-contains', category),
          orderBy('timestamp', 'desc'),
          startAfter(lastDoc),
          limit(POSTS_PER_PAGE)
        );
      }
      
      const querySnapshot = await getDocs(categoryQuery);
      const fetchedPosts = [];
      
      querySnapshot.forEach((doc) => {
        fetchedPosts.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      if (isInitial) {
        setPosts(fetchedPosts);
        
        // Sauvegarder dans le cache
        const cacheKey = `category_posts_${category}_initial`;
        const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
        saveToCache(cacheKey, {
          items: fetchedPosts,
          lastDocId: lastVisible ? lastVisible.id : null,
          hasMore: querySnapshot.docs.length === POSTS_PER_PAGE
        });
      } else {
        setPosts(prev => [...prev, ...fetchedPosts]);
      }
      
      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      setLastDoc(lastVisible);
      setHasMore(querySnapshot.docs.length === POSTS_PER_PAGE);
    } catch (error) {
      console.error('Error fetching category posts:', error);
      setPosts([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour rafraîchir les données en arrière-plan
  const refreshCategoryPostsInBackground = async (cacheKey) => {
    try {
      const postsRef = collection(db, 'post');
      const categoryQuery = query(
        postsRef,
        where('categories', 'array-contains', category),
        orderBy('timestamp', 'desc'),
        limit(POSTS_PER_PAGE)
      );
      
      const querySnapshot = await getDocs(categoryQuery);
      const fetchedPosts = [];
      
      querySnapshot.forEach((doc) => {
        fetchedPosts.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Mettre à jour le cache avec les données fraîches
      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      saveToCache(cacheKey, {
        items: fetchedPosts,
        lastDocId: lastVisible ? lastVisible.id : null,
        hasMore: querySnapshot.docs.length === POSTS_PER_PAGE
      });
      
      // Mettre à jour l'interface si les données ont changé
      if (JSON.stringify(fetchedPosts) !== JSON.stringify(posts)) {
        setPosts(fetchedPosts);
        setLastDoc(lastVisible);
        setHasMore(querySnapshot.docs.length === POSTS_PER_PAGE);
      }
    } catch (error) {
      console.error('Error refreshing category posts in background:', error);
    }
  };
  
  // Charger les posts initiaux
  useEffect(() => {
    fetchCategoryPosts(true);
  }, [category]);
  
  // Charger plus de posts quand l'utilisateur atteint le bas de la page
  useEffect(() => {
    if (inView && hasMore && !loading) {
      fetchCategoryPosts();
    }
  }, [inView]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-black mb-4">
          <FaArrowLeft />
          <span>Back to Home</span>
        </Link>
        
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-3xl font-bold">Category: </h1>
          <div 
            className="px-6 py-1 rounded-full text-lg"
            style={{
              backgroundColor: categoryColor,
              color: 'black',
              fontWeight: 300,
            }}
          >
            {category}
          </div>
        </div>
        
        <FilterBar />
        
        {loading && posts.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
          </div>
        ) : posts.length > 0 ? (
          <>
            <ArticleList listPosts={posts} />
            {hasMore && <div ref={ref} style={{ height: '50px' }} />}
          </>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-medium mb-2">No images found in this category</h2>
            <p className="text-gray-600 mb-6">Try exploring other categories or return to the home page</p>
            <Link href="/" className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800">
              Return to Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
