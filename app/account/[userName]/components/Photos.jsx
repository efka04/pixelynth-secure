'use client'
import { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy, limit, startAfter } from 'firebase/firestore'
import { db } from '@/app/db/firebaseConfig'
import { useInView } from 'react-intersection-observer'
import { useSession } from 'next-auth/react'
import ArticleList from '@/app/components/ArticleList'
import LoadingSpinner from '@/app/components/ArticleList/LoadingSpinner'
import { getUserPhotoCount } from '@/app/utils/statsUtils'
import { getFromCache, saveToCache } from '@/app/utils/cacheUtils'

export default function Photos({ userEmail }) {
    const { data: session } = useSession()
    const [photos, setPhotos] = useState([])
    const [loading, setLoading] = useState(true)
    const [lastDoc, setLastDoc] = useState(null)
    const [hasMore, setHasMore] = useState(true)
    const [photoCount, setPhotoCount] = useState(0)
    const PHOTOS_PER_PAGE = 12
    
    const { ref, inView } = useInView({
        threshold: 0,
        rootMargin: '100px',
    });

    // Fonction pour charger le compteur de photos
    useEffect(() => {
        const fetchPhotoCount = async () => {
            if (!userEmail) return;
            const count = await getUserPhotoCount(userEmail);
            setPhotoCount(count);
        };
        
        fetchPhotoCount();
    }, [userEmail]);
    
    const fetchPhotos = async (isInitial = false) => {
        if (!userEmail || (loading && !isInitial) || (!hasMore && !isInitial)) return;
        
        // Si c'est le chargement initial, vérifier le cache
        if (isInitial) {
            setLoading(true);
            const cacheKey = `user_photos_${userEmail}_initial`;
            const cachedPhotos = getFromCache(cacheKey);
            
            if (cachedPhotos) {
                setPhotos(cachedPhotos.items);
                setLastDoc(cachedPhotos.lastDocId ? { id: cachedPhotos.lastDocId } : null);
                setHasMore(cachedPhotos.hasMore);
                setLoading(false);
                
                // Rafraîchir en arrière-plan après un court délai
                setTimeout(() => refreshPhotosInBackground(cacheKey), 100);
                return;
            }
        }
        
        setLoading(true);
        try {
            const photosRef = collection(db, 'users', userEmail, 'MyImages');
            let photoQuery;
            
            if (isInitial) {
                photoQuery = query(
                    photosRef, 
                    orderBy('timestamp', 'desc'),
                    limit(PHOTOS_PER_PAGE)
                );
                setPhotos([]);
            } else {
                photoQuery = query(
                    photosRef,
                    orderBy('timestamp', 'desc'),
                    startAfter(lastDoc),
                    limit(PHOTOS_PER_PAGE)
                );
            }
            const snapshot = await getDocs(photoQuery);
            
            const newPhotos = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                image: doc.data().url || doc.data().imageUrl || doc.data().webpURL,
            }));
            
            if (isInitial) {
                setPhotos(newPhotos);
                
                // Sauvegarder dans le cache
                const cacheKey = `user_photos_${userEmail}_initial`;
                const lastVisible = snapshot.docs[snapshot.docs.length - 1];
                saveToCache(cacheKey, {
                    items: newPhotos,
                    lastDocId: lastVisible ? lastVisible.id : null,
                    hasMore: snapshot.docs.length === PHOTOS_PER_PAGE
                });
            } else {
                setPhotos(prev => [...prev, ...newPhotos]);
            }
            
            const lastVisible = snapshot.docs[snapshot.docs.length - 1];
            setLastDoc(lastVisible);
            setHasMore(snapshot.docs.length === PHOTOS_PER_PAGE);
            
        } catch (error) {
            console.error('Error fetching photos:', error);
            setPhotos([]);
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    };

    // Nouvelle fonction pour rafraîchir les données en arrière-plan
    const refreshPhotosInBackground = async (cacheKey) => {
        try {
            const photosRef = collection(db, 'users', userEmail, 'MyImages');
            const photoQuery = query(
                photosRef, 
                orderBy('timestamp', 'desc'),
                limit(PHOTOS_PER_PAGE)
            );
            
            const snapshot = await getDocs(photoQuery);
            
            const newPhotos = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                image: doc.data().url || doc.data().imageUrl || doc.data().webpURL,
            }));
            
            // Mettre à jour le cache avec les données fraîches
            const lastVisible = snapshot.docs[snapshot.docs.length - 1];
            saveToCache(cacheKey, {
                items: newPhotos,
                lastDocId: lastVisible ? lastVisible.id : null,
                hasMore: snapshot.docs.length === PHOTOS_PER_PAGE
            });
            
            // Mettre à jour l'interface si les données ont changé
            if (JSON.stringify(newPhotos) !== JSON.stringify(photos)) {
                setPhotos(newPhotos);
                setLastDoc(lastVisible);
                setHasMore(snapshot.docs.length === PHOTOS_PER_PAGE);
            }
        } catch (error) {
            console.error('Error refreshing photos in background:', error);
        }
    };
    
    useEffect(() => {
        fetchPhotos(true);
    }, [userEmail]);
    
    useEffect(() => {
        if (inView && hasMore && !loading) {
            fetchPhotos();
        }
    }, [inView]);
    
    if (loading && photos.length === 0) {
        return <div className="text-center py-12 text-gray-500"><LoadingSpinner /></div>;
    }
    
    if (photos.length === 0) {
        return <div className="text-center py-12 text-gray-500">No Images yet</div>;
    }
    
    return (
        <div>
            <ArticleList listPosts={photos} />
            {hasMore && <div ref={ref} style={{ height: '50px' }} />}
        </div>
    );
}
