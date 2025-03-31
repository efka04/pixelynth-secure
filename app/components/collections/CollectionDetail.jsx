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
  // On renomme la variable d'état pour éviter le conflit avec la fonction Firestore "collection"
  const [collectionData, setCollectionData] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  // Par défaut, userEmail peut être un username, qui sera converti en email si nécessaire
  const [actualUserEmail, setActualUserEmail] = useState(userEmail);

  // Convertit le username en email si besoin
  useEffect(() => {
    const convertUserNameToEmail = async () => {
      if (isUserNameNotEmail && userEmail) {
        try {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('username', '==', userEmail));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            // L'ID du document est l'email de l'utilisateur
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

  // Récupère la collection en recherchant le document dont le champ "name" correspond au paramètre collectionId (utilisé dans l'URL)
  useEffect(() => {
    const fetchCollectionAndImages = async () => {
      if (!actualUserEmail || !collectionId) {
        console.warn("actualUserEmail ou collectionId non défini:", actualUserEmail, collectionId);
        return;
      }
      
      // Si le username doit être converti et que la conversion n'est pas encore terminée,
      // actualUserEmail sera toujours égal à userEmail (le username initial)
      if (isUserNameNotEmail && actualUserEmail === userEmail) {
        return;
      }
      
      setLoading(true);
      try {
        const collectionsRef = collection(db, 'users', actualUserEmail, 'collections');
        // Normalisation de la casse : conversion en minuscules du paramètre collectionId
        const normalizedCollectionName = collectionId.toLowerCase();
        const q = query(collectionsRef, where('name', '==', normalizedCollectionName));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          setCollectionData(null);
          setImages([]);
          return;
        }
        
        const collectionDoc = querySnapshot.docs[0];
        const data = {
          id: collectionDoc.id,
          ...collectionDoc.data()
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
  
  // Fonction de suppression d'une image de la collection
  const handleRemoveImage = async (imageId) => {
    if (!isOwner || !collectionData) return;
    
    try {
      // On utilise l'identifiant réel du document de la collection pour la mise à jour
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
        />
      )}
    </div>
  );
}
