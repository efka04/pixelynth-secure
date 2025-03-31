'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ArticleList from './ArticleList';
import { getPostsPaginated } from '../../services/postsService';
import { useSearch } from '../context/OptimizedSearchContext';
import { useColor } from '../context/ColorContext';
import { useCategory } from '@/app/context/CategoryContext';

const PostsGrid = ({ userEmail, listPosts: initialPosts = [] }) => {
  const { selectedPeople, selectedOrientation, selectedSort } = useSearch();
  const { selectedColor } = useColor();
  const { selectedCategory } = useCategory();

  const [posts, setPosts] = useState(initialPosts);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const observerRef = useRef(null);

  const loadPosts = useCallback(async (reset = false) => {
    if (loading || (!hasMore && !reset)) return;
    setLoading(true);


    try {
      const { posts: newPosts, lastVisible } = await getPostsPaginated(
        reset ? null : lastDoc,
        24,
        { 
          selectedPeople, 
          selectedOrientation, 
          selectedColor, 
          selectedCategory, 
          selectedSort, 
          userEmail 
        }
      );

      setPosts(prevPosts => reset ? newPosts : [...prevPosts, ...newPosts]);
      setLastDoc(lastVisible);
      setHasMore(newPosts.length === 24);
    } catch (error) {
      console.error("Erreur lors du chargement des posts:", error);
    }
    
    setLoading(false);
  }, [
    lastDoc, loading, hasMore,
    selectedPeople, selectedOrientation, selectedColor, selectedCategory, userEmail,
    selectedSort // ✅ Ajout ici pour mettre à jour le tri
  ]);

  useEffect(() => {
    loadPosts(true);
  }, [userEmail, selectedPeople, selectedOrientation, selectedColor, selectedCategory, selectedSort]);

  useEffect(() => {
    const handleScroll = () => setUserHasScrolled(true);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const sentinelRef = useCallback((node) => {
    if (!userHasScrolled) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        loadPosts();
      }
    }, { root: null, threshold: 1.0, rootMargin: '200px' });
    if (node) observerRef.current.observe(node);
  }, [hasMore, loading, loadPosts, userHasScrolled]);

  return (
    <div>
      <ArticleList listPosts={posts} />
      {hasMore && <div ref={sentinelRef} style={{ height: '50px' }} />}
    </div>
  );
};

export default PostsGrid;