'use client';
import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, startAfter, doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/db/firebaseConfig';
import { useInView } from 'react-intersection-observer';
import { useSession } from 'next-auth/react';
import ArticleList from '@/app/components/ArticleList';
import LoadingSpinner from '@/app/components/ArticleList/LoadingSpinner';

export default function Downloaded({ userEmail }) {
  const { data: session } = useSession();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const PHOTOS_PER_PAGE = 12;

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  // Fonction pour récupérer les téléchargements
  const fetchDownloads = async (isInitial = false) => {
    if (!userEmail) {
      return;
    }

    setLoading(true);
    try {
      const downloadsRef = collection(db, 'users', userEmail, 'downloadHistory');

      let constraints = [orderBy('timestamp', 'desc')];
      if (!isInitial && lastDoc) {
        constraints.push(startAfter(lastDoc));
      }
      constraints.push(limit(PHOTOS_PER_PAGE));

      const downloadQuery = query(downloadsRef, ...constraints);
      const snapshot = await getDocs(downloadQuery);

      // Traitement des documents
      const downloadedItems = await Promise.all(snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();

        if (data.articleId) {
          const postRef = doc(db, 'post', data.articleId);
          const postDoc = await getDoc(postRef);
          if (postDoc.exists()) {
            return {
              id: data.articleId,
              ...postDoc.data(),
              downloadedAt: data.timestamp,
              image: data.imageUrl || postDoc.data().url || postDoc.data().webpURL,
            };
          }
        }

        return {
          id: docSnap.id,
          ...data,
          image: data.imageUrl || data.url || data.webpURL,
        };
      }));

      if (isInitial) {
        setPhotos(downloadedItems);
      } else {
        setPhotos(prev => [...prev, ...downloadedItems]);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length > 0 && snapshot.docs.length === PHOTOS_PER_PAGE);
      
    } catch (error) {
      console.error('Error fetching downloads:', error);
      setPhotos([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  // Chargement initial
  useEffect(() => {
    fetchDownloads(true);
  }, [userEmail]);

  // Chargement des données supplémentaires
  useEffect(() => {
    if (inView && hasMore && !loading && photos.length > 0) {
      fetchDownloads();
    }
  }, [inView, hasMore, loading]);

  if (loading && photos.length === 0) {
    return <div className="text-center py-12 text-gray-500"><LoadingSpinner /></div>;
  }

  if (!loading && photos.length === 0) {
    return <div className="text-center py-12 text-gray-500">No downloads yet</div>;
  }

  return (
    <div>
      <ArticleList listPosts={photos} />
      {hasMore && <div ref={ref} className="h-10" />}
    </div>
  );
}
