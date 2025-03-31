'use client';

import { useState, useEffect } from 'react';
import { doc, updateDoc, arrayUnion, increment, collection, query, orderBy, getDocs, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '@/app/db/firebaseConfig';
import { useSession } from 'next-auth/react';

export default function AddToCollectionButton({ imageId, userEmail }) {
  const { data: session } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fallback to session user email if userEmail prop is not provided
  const effectiveUserEmail = userEmail || session?.user?.email;

  useEffect(() => {
  }, [effectiveUserEmail]);

  const fetchUserCollections = async () => {
    if (loading) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Security check: Ensure we're only fetching collections for the current user
      if (session.user.email !== effectiveUserEmail && !session.user.isAdmin) {
        console.error('Unauthorized access attempt by:', session.user.email);
        throw new Error('Unauthorized access to collections');
      }
      
      const collectionsRef = collection(db, 'users', effectiveUserEmail, 'collections');
      const collectionsQuery = query(collectionsRef, orderBy('name', 'asc'));
      const snapshot = await getDocs(collectionsQuery);
      
      const collectionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setCollections(collectionsData);
      
      if (collectionsData.length === 0) {
        setError('You don\'t have any collections yet. Create a collection first.');
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
      setError('Failed to load your collections. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = async () => {
    await fetchUserCollections();
    setIsModalOpen(true);
  };

  const handleAddToCollection = async () => {
    if (!selectedCollection) {
      setError('Please select a collection');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Security check: Verify the collection belongs to the current user
      const collectionRef = doc(db, 'users', session.user.email, 'collections', selectedCollection);
      const collectionDoc = await getDoc(collectionRef);
      
      if (!collectionDoc.exists()) {
        throw new Error('Collection not found or you do not have permission to modify it');
      }
      
      // Security check: Verify the image exists before adding it
      const imageRef = doc(db, 'post', imageId);
      const imageDoc = await getDoc(imageRef);
      
      if (!imageDoc.exists()) {
        throw new Error('Image not found');
      }
      
      // Check if image is already in the collection
      const collectionData = collectionDoc.data();
      if (collectionData.imageIds && collectionData.imageIds.includes(imageId)) {
        setSuccess('Image is already in this collection');
        setTimeout(() => {
          setIsModalOpen(false);
          setSuccess('');
          setSelectedCollection('');
        }, 1500);
        return;
      }
      
      // Update the collection document to add the image ID
      await updateDoc(collectionRef, {
        imageIds: arrayUnion(imageId),
        imageCount: increment(1),
        updatedAt: serverTimestamp()
      });
      
      setSuccess('Image added to collection successfully!');
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccess('');
        setSelectedCollection('');
      }, 1500);
    } catch (error) {
      console.error('Error adding image to collection:', error);
      setError('Failed to add image to collection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="px-4 py-2 bg-white text-black border border-black rounded-md hover:bg-gray-100 transition-colors"
      >
        Add to Collection
      </button>
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add to Collection</h2>
            
            {error && (
              <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>
            )}
            
            {success && (
              <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">{success}</div>
            )}
            
            {collections.length > 0 && (
              <div className="mb-4">
                <label htmlFor="collectionSelect" className="block text-sm font-medium text-gray-700 mb-1">
                  Select Collection
                </label>
                <select
                  id="collectionSelect"
                  value={selectedCollection}
                  onChange={(e) => setSelectedCollection(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  disabled={loading}
                >
                  <option value="">Select a collection</option>
                  {collections.map(collection => (
                    <option key={collection.id} value={collection.id}>
                      {collection.name} ({collection.imageCount || 0} images)
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddToCollection}
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                disabled={loading || !selectedCollection}
              >
                {loading ? 'Adding...' : 'Add to Collection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}