'use client';

import { useState, useEffect } from 'react';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  getDocs, 
  updateDoc, 
  arrayRemove, 
  increment, 
  where 
} from 'firebase/firestore';
import { db } from '@/app/db/firebaseConfig';
import { useSession } from 'next-auth/react';
import ArticleList from '@/app/components/ArticleList';
import LoadingSpinner from '@/app/components/ArticleList/LoadingSpinner';

export default function CollectionDetail({ collectionId, userEmail, isUserNameNotEmail }) {
  const { data: session } = useSession();
  const [collectionData, setCollectionData] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [actualUserEmail, setActualUserEmail] = useState(userEmail);
  const [updatingThumbnail, setUpdatingThumbnail] = useState(false);

  useEffect(() => {
    const convertUserNameToEmail = async () => {
      if (isUserNameNotEmail && userEmail) {
        try {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('username', '==', userEmail));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const email = querySnapshot.docs[0].id;
            setActualUserEmail(email);
          } else {
            console.error("Aucun utilisateur trouvé avec le username:", userEmail);
          }
        } catch (error) {
          console.error("Erreur lors de la conversion du username en email:", error);
        }
      }
    };
    
    convertUserNameToEmail();
  }, [userEmail, isUserNameNotEmail]);

  useEffect(() => {
    const fetchCollectionAndImages = async () => {
      if (!actualUserEmail || !collectionId) {
        console.warn("actualUserEmail ou collectionId non défini:", actualUserEmail, collectionId);
        return;
      }

      setLoading(true);
      try {
        const collectionsRef = collection(db, 'users', actualUserEmail, 'collections');
        const querySnapshot = await getDocs(collectionsRef);
        
        const matchingCollection = querySnapshot.docs.find(doc => 
          doc.data().name.toLowerCase() === decodeURIComponent(collectionId).toLowerCase()
        );
        
        if (!matchingCollection) {
          console.warn("Collection non trouvée:", collectionId);
          setCollectionData(null);
          setImages([]);
          return;
        }

        const data = {
          id: matchingCollection.id,
          ...matchingCollection.data()
        };
        
        setCollectionData(data);
        setIsOwner(session?.user?.email === actualUserEmail);
        
        if (data.imageIds && data.imageIds.length > 0) {
          const imagePromises = data.imageIds.map(async (imageId) => {
            const imageRef = doc(db, 'post', imageId);
            const imageSnap = await getDoc(imageRef);
            
            if (imageSnap.exists()) {
              return {
                id: imageSnap.id,
                ...imageSnap.data(),
                image: imageSnap.data().url || imageSnap.data().imageUrl || imageSnap.data().webpURL,
              };
            }
            return null;
          });
          
          const imagesData = await Promise.all(imagePromises);
          setImages(imagesData.filter(img => img !== null));
        } else {
          setImages([]);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des détails de la collection:', error);
        setCollectionData(null);
        setImages([]);
      } finally {
        setLoading(false);
      }
    };
  
    fetchCollectionAndImages();
  }, [actualUserEmail, collectionId, session, userEmail, isUserNameNotEmail]);
  
  const handleRemoveImage = async (imageId) => {
    if (!isOwner || !collectionData) return;
    
    try {
      const collectionRef = doc(db, 'users', actualUserEmail, 'collections', collectionData.id);
      
      await updateDoc(collectionRef, {
        imageIds: arrayRemove(imageId),
        imageCount: increment(-1)
      });
      
      setImages(prevImages => prevImages.filter(img => img.id !== imageId));
      setCollectionData(prev => ({
        ...prev,
        imageCount: (prev.imageCount || 1) - 1
      }));
      
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'image de la collection:', error);
    }
  };

  const handleSetThumbnail = async (imageUrl) => {
    if (!isOwner || !collectionData) return;
    
    setUpdatingThumbnail(true);
    try {
      const collectionRef = doc(db, 'users', actualUserEmail, 'collections', collectionData.id);
      await updateDoc(collectionRef, {
        thumbnailUrl: imageUrl
      });
      
      setCollectionData(prev => ({
        ...prev,
        thumbnailUrl: imageUrl
      }));
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la vignette:', error);
    } finally {
      setUpdatingThumbnail(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500"><LoadingSpinner /></div>;
  }

  if (!collectionData) {
    console.warn("Collection non trouvée pour actualUserEmail:", actualUserEmail, "avec name:", collectionId);
    return <div className="text-center py-12 text-gray-500">Collection not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="border-b pb-4 mb-6">
        <h2 className="text-2xl font-bold mb-2">{collectionData.name}</h2>
        {collectionData.description && (
          <p className="text-gray-600 mb-4">{collectionData.description}</p>
        )}
        <p className="text-sm text-gray-500">
          {collectionData.imageCount || 0} {collectionData.imageCount === 1 ? 'image' : 'images'}
        </p>
      </div>
      
      {images.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Collection empty
        </div>
      ) : (
        <ArticleList 
          listPosts={images} 
          showRemoveButton={isOwner}
          onRemoveImage={handleRemoveImage}
          showSetThumbnail={isOwner}
          onSetThumbnail={handleSetThumbnail}
          currentThumbnailUrl={collectionData.thumbnailUrl}
          updatingThumbnail={updatingThumbnail}
        />
      )}
    </div>
  );
}
