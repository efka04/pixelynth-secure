'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, doc, getDoc, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/app/db/firebaseConfig';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import LoadingSpinner from '@/app/components/ArticleList/LoadingSpinner';
import NewCollectionButton from './NewCollectionButton';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

// Constante pour garantir une casse uniforme dans le chemin Firestore
const COLLECTIONS_PATH = 'collections';
const MAX_COLLECTIONS_DISPLAY = 100; // Limite d'affichage des collections
const MAX_TITLE_LENGTH = 40;
const MAX_DESCRIPTION_LENGTH = 200;

export default function CollectionsList({ userEmail, isOwner }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingCollection, setDeletingCollection] = useState(null);
  const [error, setError] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [collectionToRename, setCollectionToRename] = useState(null);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newDescription, setNewDescription] = useState('');
  const [selectedThumbnail, setSelectedThumbnail] = useState(null);
  const [collectionImages, setCollectionImages] = useState([]);

  useEffect(() => {
    const fetchCollections = async () => {
      if (!userEmail) {
        console.error('fetchCollections: userEmail is undefined');
        setError('User email is missing.');
        return;
      }

      setLoading(true);
      setError('');

      try {
        // Fetch the user document
        const userDocRef = doc(db, 'users', userEmail);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          throw new Error('User document not found.');
        }

        const username = userDocSnap.data().username || null;

        if (!username) {
          throw new Error('Username not found in user document.');
        }

        // Fetch collections directly from the correct Firestore path
        const collectionsRef = collection(db, 'users', userEmail, COLLECTIONS_PATH);
        const collectionsQuery = query(
          collectionsRef,
          orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(collectionsQuery);

        if (snapshot.empty) {
          console.warn('No collections found for the user.');
          setCollections([]);
          return;
        }

        const collectionsData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            username: username || 'unknown-user', // Fallback for missing username
            name: data.name || 'untitled-collection', // Fallback for missing collection name
          };
        });

        setCollections(collectionsData);
      } catch (error) {
        console.error('Error fetching collections:', error.message);
        setError('Failed to load collections. Please try again later.');
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
    
    // Vérification de sécurité : l'utilisateur doit avoir la permission de supprimer
    if (!isOwner || !collectionId || (session?.user?.email !== userEmail && !session?.user?.isAdmin)) {
      console.error('Tentative de suppression non autorisée par :', session?.user?.email);
      setError('Vous navez pas la permission de supprimer cette collection');
      return;
    }
    
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette collection ? Cette action est irréversible.')) {
      return;
    }
    
    setDeletingCollection(collectionId);
    setError('');
    
    try {
      // Vérifier que la collection existe et appartient à l'utilisateur
      const collectionRef = doc(db, 'users', userEmail, COLLECTIONS_PATH, collectionId);
      const collectionDoc = await getDoc(collectionRef);
      
      if (!collectionDoc.exists()) {
        throw new Error('Collection non trouvée ou vous navez pas la permission de la supprimer');
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

  const handleRenameClick = async (e, collection) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isOwner || (session?.user?.email !== userEmail && !session?.user?.isAdmin)) {
      console.error('Tentative de modification non autorisée par :', session?.user?.email);
      setError('Vous n\'avez pas la permission de modifier cette collection');
      return;
    }
    
    try {
      // Récupérer les images de la collection
      if (collection.imageIds && collection.imageIds.length > 0) {
        const imagePromises = collection.imageIds.map(async (imageId) => {
          const imageRef = doc(db, 'post', imageId);
          const imageSnap = await getDoc(imageRef);
          if (imageSnap.exists()) {
            return {
              id: imageSnap.id,
              ...imageSnap.data(),
              url: imageSnap.data().url || imageSnap.data().imageUrl || imageSnap.data().webpURL,
            };
          }
          return null;
        });
        
        const imagesData = await Promise.all(imagePromises);
        setCollectionImages(imagesData.filter(img => img !== null));
      } else {
        setCollectionImages([]);
      }
      
      setCollectionToRename(collection);
      setNewCollectionName(collection.name);
      setNewDescription(collection.description || '');
      setSelectedThumbnail(collection.thumbnailUrl);
      setIsRenaming(true);
    } catch (error) {
      console.error('Erreur lors de la récupération des images:', error);
      setError('Erreur lors de la récupération des images de la collection');
    }
  };

  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    
    if (!newCollectionName.trim()) {
      setError('Le nom de la collection ne peut pas être vide');
      return;
    }

    if (newCollectionName.length > MAX_TITLE_LENGTH) {
      setError(`Le nom de la collection ne peut pas dépasser ${MAX_TITLE_LENGTH} caractères`);
      return;
    }

    if (newDescription.length > MAX_DESCRIPTION_LENGTH) {
      setError(`La description ne peut pas dépasser ${MAX_DESCRIPTION_LENGTH} caractères`);
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    try {
      const collectionRef = doc(db, 'users', userEmail, COLLECTIONS_PATH, collectionToRename.id);
      
      await updateDoc(collectionRef, {
        name: newCollectionName.trim(),
        description: newDescription.trim(),
        thumbnailUrl: selectedThumbnail
      });
      
      setCollections(prevCollections => 
        prevCollections.map(collection => 
          collection.id === collectionToRename.id 
            ? { 
                ...collection, 
                name: newCollectionName.trim(),
                description: newDescription.trim(),
                thumbnailUrl: selectedThumbnail
              } 
            : collection
        )
      );
      
      setIsRenaming(false);
      setCollectionToRename(null);
    } catch (error) {
      console.error('Erreur lors de la modification de la collection:', error);
      setError('Une erreur est survenue lors de la modification de la collection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRenameCancel = () => {
    setIsRenaming(false);
    setCollectionToRename(null);
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
          {isOwner ? 'You havent created any collections yet.' : 'No collection found.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map(collection => (
            <div key={collection.id} className="relative group">
              <Link 
                href={`/account/${encodeURIComponent(collection.username)}/collections/${encodeURIComponent(collection.name)}`}
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
                    'No descriptions'}
                </p>
                <p className="text-gray-500 text-xs">
                  {collection.imageCount || 0} {collection.imageCount === 1 ? 'image' : 'images'}
                </p>
              </Link>
              
              {isOwner && session?.user?.email === userEmail && (
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={(e) => handleRenameClick(e, collection)}
                    className="p-2 bg-blue-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    title="Modifier la collection"
                  >
                    <FaEdit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteCollection(e, collection.id)}
                    disabled={deletingCollection === collection.id}
                    className="p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de modification */}
      {isRenaming && collectionToRename && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Edit collection</h2>
            
            {error && (
              <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>
            )}
            
            <form onSubmit={handleRenameSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name of the collection ({newCollectionName.length}/{MAX_TITLE_LENGTH})
                </label>
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  maxLength={MAX_TITLE_LENGTH}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description ({newDescription.length}/{MAX_DESCRIPTION_LENGTH})
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  rows="3"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose a thumbnail Picture
                </label>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[300px] overflow-y-auto p-2">
                  {collectionImages.map((image) => (
                    <div
                      key={image.id}
                      onClick={() => setSelectedThumbnail(image.url)}
                      className={`relative aspect-square cursor-pointer rounded-lg overflow-hidden border-2 
                        ${selectedThumbnail === image.url ? 'border-blue-500' : 'border-transparent'}`}
                    >
                      <Image
                        src={image.url}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleRenameCancel}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                  disabled={isSubmitting || !newCollectionName.trim()}
                >
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
