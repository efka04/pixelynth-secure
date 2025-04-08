'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, doc, getDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '@/app/db/firebaseConfig';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import LoadingSpinner from '@/app/components/ArticleList/LoadingSpinner';
import NewCollectionButton from './NewCollectionButton';

// Constante pour garantir une casse uniforme dans le chemin Firestore
const COLLECTIONS_PATH = 'collections';
const MAX_COLLECTIONS_DISPLAY = 100; // Limite d'affichage des collections

export default function CollectionsList({ userEmail, isOwner }) {
  const { data: session } = useSession();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingCollection, setDeletingCollection] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCollections = async () => {
      if (!userEmail) {
        console.error('fetchCollections: userEmail est indéfini');
        return;
      }

      setLoading(true);
      setError('');

      try {
        // Récupérer le username depuis Firestore
        const userDocRef = doc(db, 'users', userEmail);
        const userDocSnap = await getDoc(userDocRef);
        const username = userDocSnap.exists() ? userDocSnap.data().username : null;

        if (!username) {
          console.error('fetchCollections: username introuvable');
          setError('Erreur lors de la récupération du username.');
          return;
        }

        const collectionsRef = collection(db, 'users', userEmail, COLLECTIONS_PATH);
        const collectionsQuery = query(
          collectionsRef,
          orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(collectionsQuery);

        const collectionsData = snapshot.docs.map(doc => {
          console.log('Collection thumbnailUrl:', doc.data().thumbnailUrl);
          console.log('Collection data:', doc.data());
          return {
            id: doc.id,
            ...doc.data(),
            username, // Ajouter le username pour générer l'URL
          };
        });

        setCollections(collectionsData);
      } catch (error) {
        console.error('Erreur lors de la récupération des collections :', error);
        setError('Erreur lors du chargement des collections. Veuillez réessayer plus tard.');
        setCollections([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, [userEmail, session, isOwner]);

  const handleDeleteCollection = async (e, collectionId) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Vérification de sécurité : l’utilisateur doit avoir la permission de supprimer
    if (!isOwner || !collectionId || (session?.user?.email !== userEmail && !session?.user?.isAdmin)) {
      console.error('Tentative de suppression non autorisée par :', session?.user?.email);
      setError('Vous n’avez pas la permission de supprimer cette collection');
      return;
    }
    
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette collection ? Cette action est irréversible.')) {
      return;
    }
    
    setDeletingCollection(collectionId);
    setError('');
    
    try {
      // Vérifier que la collection existe et appartient à l’utilisateur
      const collectionRef = doc(db, 'users', userEmail, COLLECTIONS_PATH, collectionId);
      const collectionDoc = await getDoc(collectionRef);
      
      if (!collectionDoc.exists()) {
        throw new Error('Collection non trouvée ou vous n’avez pas la permission de la supprimer');
      }
      
      await deleteDoc(collectionRef);
      
      // Mettre à jour la liste des collections
      setCollections(prevCollections => 
        prevCollections.filter(collection => collection.id !== collectionId)
      );
    } catch (error) {
      console.error('Erreur lors de la suppression de la collection :', error);
      setError('Une erreur est survenue lors de la suppression de la collection.');
    } finally {
      setDeletingCollection(null);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500"><LoadingSpinner /></div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 mb-4">
          {error}
        </div>
      )}
      
      {isOwner && (
        <div className="mb-6">
          <NewCollectionButton userEmail={userEmail} onCollectionCreated={() => setLoading(true)} />
        </div>
      )}
      
      {collections.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {isOwner ? 'You haven’t created any collections yet.' : 'No collection found.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map(collection => (
            <div key={collection.id} className="relative group">
              <Link 
                href={`/account/${collection.username}/collections/${encodeURIComponent(collection.name)}`}
                className="block p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                {collection.thumbnailUrl && (
                  <div className="mb-3 relative w-full h-40 overflow-hidden rounded">
                    <Image 
                      src={collection.thumbnailUrl} 
                      alt={collection.name ? collection.name.substring(0, 40) : 'Collection'}
                      fill
                      style={{ objectFit: 'cover' }}
                      unoptimized={true}
                    />
                  </div>
                )}
                <h3 className="text-lg font-semibold mb-2">
                  {collection.name ? 
                    (collection.name.length > 40 ? 
                      collection.name.substring(0, 40) + '...' : 
                      collection.name) : 
                    'Untitled Collection'}
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  {collection.description ? 
                    (collection.description.length > 300 ? 
                      collection.description.substring(0, 300) + '...' : 
                      collection.description) : 
                    'Pas de description'}
                </p>
                <p className="text-gray-500 text-xs">
                  {collection.imageCount || 0} {collection.imageCount === 1 ? 'image' : 'images'}
                </p>
              </Link>
              
              {isOwner && session?.user?.email === userEmail && (
                <button
                  onClick={(e) => handleDeleteCollection(e, collection.id)}
                  disabled={deletingCollection === collection.id}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  title="Supprimer la collection"
                >
                  {deletingCollection === collection.id ? (
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
