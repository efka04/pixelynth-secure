'use client';
import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '@/app/db/firebaseConfig';
import { useSession } from 'next-auth/react';
import LoadingSpinner from '@/app/components/ArticleList/LoadingSpinner';
import ArticleList from '@/app/components/ArticleList';
import { useInView } from 'react-intersection-observer';

export default function Favorites({ userEmail }) {
    const { data: session } = useSession();
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const FAVORITES_PER_PAGE = 12;
    
    const { ref, inView } = useInView({
        threshold: 0,
        rootMargin: '100px',
    });

    const fetchFavorites = async (isInitial = false) => {
        if (!userEmail || (loading && !isInitial) || (!hasMore && !isInitial)) return;
        
        setLoading(true);
        try {
            const favoritesRef = collection(db, 'users', userEmail, 'favorites');
            let favoritesQuery;
            
            if (isInitial) {
                favoritesQuery = query(
                    favoritesRef, 
                    orderBy('addedToFavorites', 'desc'),
                    limit(FAVORITES_PER_PAGE)
                );
                setFavorites([]);
            } else {
                favoritesQuery = query(
                    favoritesRef,
                    orderBy('addedToFavorites', 'desc'),
                    startAfter(lastDoc),
                    limit(FAVORITES_PER_PAGE)
                );
            }
            
            const snapshot = await getDocs(favoritesQuery);
            
            const newFavorites = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                originalId: doc.data().originalId || doc.id,
                image: doc.data().image || doc.data().imageURL || doc.data().url || '',
            }));
            
            if (isInitial) {
                setFavorites(newFavorites);
            } else {
                setFavorites(prev => [...prev, ...newFavorites]);
            }
            
            const lastVisible = snapshot.docs[snapshot.docs.length - 1];
            setLastDoc(lastVisible);
            setHasMore(snapshot.docs.length === FAVORITES_PER_PAGE);
            
        } catch (error) {
            console.error('Error fetching favorites:', error);
            setFavorites([]);
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFavorites(true);
    }, [userEmail]);

    useEffect(() => {
        if (inView && hasMore && !loading) {
            fetchFavorites();
        }
    }, [inView]);

    if (loading && favorites.length === 0) {
        return <div className="text-center py-12 text-gray-500"><LoadingSpinner /></div>;
    }

    if (favorites.length === 0) {
        return <div className="text-center py-12 text-gray-500">No favorites yet</div>;
    }

    return (
        <div>
            <ArticleList listPosts={favorites} />
            {hasMore && <div ref={ref} style={{ height: '50px' }} />}
        </div>
    );
}
