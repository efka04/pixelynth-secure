// Fichier : /app/components/ArticleList.jsx
'use client';
import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import LoadingSpinner from "./ArticleList/LoadingSpinner";
import NoResults from "./ArticleList/NoResults";
import ArticleGrid from "./ArticleList/ArticleGrid";

const ITEMS_PER_PAGE = 24;

const ArticleList = React.memo(({ listPosts }) => {
  const [displayedItems, setDisplayedItems] = useState(ITEMS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const loadingRef = useRef(null);

  // On élimine ici le filtrage local car Firestore renvoie déjà les posts filtrés
  const uniquePosts = useMemo(() => {
    const seen = new Set();
    // Vérifier si listPosts est défini avant d'appliquer filter
    return (listPosts || []).filter((post) => {
      if (seen.has(post.id)) return false;
      seen.add(post.id);
      return true;
    });
  }, [listPosts]);

  useEffect(() => {
    if (uniquePosts?.length > 0 && isInitialLoad) {
      setIsInitialLoad(false);
      console.log("Fin du chargement initial, uniquePosts.length =", uniquePosts.length);
    }
  }, [uniquePosts, isInitialLoad]);

  const visiblePosts = useMemo(() => {
    const visible = uniquePosts.slice(0, displayedItems);
    console.log("visiblePosts =", visible.length, "sur", uniquePosts.length);
    return visible;
  }, [uniquePosts, displayedItems]);

  const loadMore = useCallback(() => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    console.log("Chargement de posts supplémentaires...");
    setDisplayedItems((prev) => Math.min(prev + ITEMS_PER_PAGE, uniquePosts.length));
    setIsLoadingMore(false);
  }, [uniquePosts.length, isLoadingMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        console.log("IntersectionObserver entry:", entry.isIntersecting);
        if (
          entry.isIntersecting &&
          !isLoadingMore &&
          !isInitialLoad &&
          displayedItems < uniquePosts.length
        ) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "400px" }
    );
    const currentRef = loadingRef.current;
    if (currentRef) observer.observe(currentRef);
    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [displayedItems, uniquePosts.length, isLoadingMore, isInitialLoad, loadMore]);

  return (
    <div className="w-full">
      {isInitialLoad && uniquePosts.length === 0 ? (
        <LoadingSpinner />
      ) : uniquePosts.length === 0 ? (
        <NoResults />
      ) : (
        <ArticleGrid posts={visiblePosts} loadingRef={displayedItems < uniquePosts.length ? loadingRef : null} />
      )}
    </div>
  );
});

ArticleList.displayName = "ArticleList";
export default ArticleList;