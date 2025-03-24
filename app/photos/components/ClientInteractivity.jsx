'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { db } from '@/app/db/firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export default function ClientInteractivity({ articleId, children }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);
  const [articleData, setArticleData] = useState(null);
  
  // Récupérer les données de l'article si nécessaire
  useEffect(() => {
    const fetchArticleData = async () => {
      if (!articleId) return;
      
      try {
        const docRef = doc(db, 'post', articleId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setArticleData(docSnap.data());
        }
      } catch (error) {
        console.error('Error fetching article data:', error);
      }
    };
    
    fetchArticleData();
  }, [articleId]);
  
  // Vérifier si l'article est dans les favoris de l'utilisateur
  useEffect(() => {
    const checkIfFavorite = async () => {
      try {
        if (!session?.user?.email || !articleId) return;
        
        const favoritesRef = collection(db, 'users', session.user.email, 'favorites');
        const favQuery = query(favoritesRef, where('articleId', '==', articleId));
        const querySnapshot = await getDocs(favQuery);
        
        setIsFavorite(!querySnapshot.empty);
      } catch (error) {
        console.error('Error checking favorites:', error);
      }
    };
    
    checkIfFavorite();
  }, [session, articleId]);

  // Fonction pour basculer l'état favori d'un article
  const toggleFavorite = async (userEmail, articleId, articleInfo) => {
    try {
      const favoritesRef = collection(db, 'users', userEmail, 'favorites');
      const favQuery = query(favoritesRef, where('articleId', '==', articleId));
      const querySnapshot = await getDocs(favQuery);
      
      if (querySnapshot.empty) {
        // Ajouter aux favoris
        await addDoc(favoritesRef, {
          articleId,
          timestamp: serverTimestamp(),
          ...articleInfo
        });
        return true;
      } else {
        // Retirer des favoris
        const docToDelete = querySnapshot.docs[0];
        await deleteDoc(doc(db, 'users', userEmail, 'favorites', docToDelete.id));
        return false;
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return false;
    }
  };

  const handleAddFavorite = async (e) => {
    e?.stopPropagation();
    
    if (!session?.user?.email) {
      router.push('/signin');
      return;
    }
    
    if (!articleId || !articleData) {
      console.error('Missing article ID or data');
      return;
    }
    
    try {
      const articleInfo = {
        title: articleData.title,
        image: articleData.image || articleData.webpURL,
        userName: articleData.userName,
        userImage: articleData.userImage,
      };
      
      const newFavoriteStatus = await toggleFavorite(session.user.email, articleId, articleInfo);
      setIsFavorite(newFavoriteStatus);
    } catch (error) {
      console.error('Error updating favorites:', error);
    }
  };

  const handleEdit = () => {
    router.push(`/photos/${articleId}/edit`);
  };

  // Cloner l'enfant et lui passer les props d'interactivité
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        isFavorite,
        handleAddFavorite,
        handleEdit
      });
    }
    return child;
  });

  return <>{childrenWithProps}</>;
}
