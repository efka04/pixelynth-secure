'use client';

import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/app/db/firebaseConfig';

export default function NewCollectionButton({ userEmail, onCollectionCreated }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [collectionName, setCollectionName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const MAX_TITLE_LENGTH = 40;
  const MAX_DESCRIPTION_LENGTH = 300;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Input validation
    if (!collectionName.trim()) {
      setError('Collection name is required');
      return;
    }

    if (collectionName.trim().length > MAX_TITLE_LENGTH) {
      setError(`Collection name must be ${MAX_TITLE_LENGTH} characters or less`);
      return;
    }

    if (description.trim().length > MAX_DESCRIPTION_LENGTH) {
      setError(`Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`);
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const collectionsRef = collection(db, 'users', userEmail, 'collections');
      await addDoc(collectionsRef, {
        name: collectionName.trim(),
        description: description.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        imageCount: 0
      });
      
      setCollectionName('');
      setDescription('');
      setIsModalOpen(false);
      
      if (onCollectionCreated) {
        onCollectionCreated();
      }
    } catch (error) {
      console.error('Error creating collection:', error);
      setError('Failed to create collection. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
      >
        Create New Collection
      </button>
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Collection</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="collectionName" className="block text-sm font-medium text-gray-700 mb-1">
                  Collection Name * <span className="text-xs text-gray-500">({collectionName.length}/{MAX_TITLE_LENGTH})</span>
                </label>
                <input
                  type="text"
                  id="collectionName"
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  className={`w-full px-3 py-2 border ${collectionName.length > MAX_TITLE_LENGTH ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-black`}
                  placeholder="My Collection"
                  maxLength={MAX_TITLE_LENGTH}
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional) <span className="text-xs text-gray-500">({description.length}/{MAX_DESCRIPTION_LENGTH})</span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full px-3 py-2 border ${description.length > MAX_DESCRIPTION_LENGTH ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-black`}
                  placeholder="Add a description for your collection"
                  rows={3}
                  maxLength={MAX_DESCRIPTION_LENGTH}
                />
              </div>
              
              {error && (
                <div className="mb-4 text-red-500 text-sm">{error}</div>
              )}
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                  disabled={isSubmitting || collectionName.length > MAX_TITLE_LENGTH || description.length > MAX_DESCRIPTION_LENGTH}
                >
                  {isSubmitting ? 'Creating...' : 'Create Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
