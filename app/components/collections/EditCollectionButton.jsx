'use client';

import { useState } from 'react';
import { doc, updateDoc, arrayRemove, increment } from 'firebase/firestore';
import { db } from '@/app/db/firebaseConfig';
import Image from 'next/image';

export default function EditCollectionButton({ 
  userEmail, 
  collectionData, 
  images, 
  onCollectionUpdated 
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [mainImageId, setMainImageId] = useState(
    collectionData?.imageIds && collectionData.imageIds.length > 0 
      ? collectionData.imageIds[0] 
      : null
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const openModal = () => {
    setSelectedImages([]);
    setMainImageId(
      collectionData?.imageIds && collectionData.imageIds.length > 0 
        ? collectionData.imageIds[0] 
        : null
    );
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const toggleImageSelection = (imageId) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId) 
        : [...prev, imageId]
    );
  };

  const setAsMainImage = (imageId) => {
    setMainImageId(imageId);
  };

  const handleRemoveSelectedImages = async () => {
    if (selectedImages.length === 0) return;
    
    setIsProcessing(true);
    try {
      const collectionRef = doc(db, 'users', userEmail, 'collections', collectionData.id);
      
      // Create a new imageIds array with the selected images removed
      const updatedImageIds = collectionData.imageIds.filter(id => !selectedImages.includes(id));
      
      // If the main image is being removed, set a new main image
      let newMainImageId = mainImageId;
      if (selectedImages.includes(mainImageId) && updatedImageIds.length > 0) {
        newMainImageId = updatedImageIds[0];
      } else if (updatedImageIds.length === 0) {
        newMainImageId = null;
      }
      
      // Update the collection document
      await updateDoc(collectionRef, {
        imageIds: updatedImageIds,
        imageCount: updatedImageIds.length
      });
      
      // Call the callback to refresh the collection data
      if (onCollectionUpdated) {
        onCollectionUpdated();
      }
      
      // Close the modal
      closeModal();
    } catch (error) {
      console.error('Error removing images from collection:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateMainImage = async () => {
    if (!mainImageId || mainImageId === collectionData.imageIds[0]) return;
    
    setIsProcessing(true);
    try {
      const collectionRef = doc(db, 'users', userEmail, 'collections', collectionData.id);
      
      // Create a new imageIds array with the main image at the beginning
      const updatedImageIds = [
        mainImageId,
        ...collectionData.imageIds.filter(id => id !== mainImageId)
      ];
      
      // Update the collection document
      await updateDoc(collectionRef, {
        imageIds: updatedImageIds
      });
      
      // Call the callback to refresh the collection data
      if (onCollectionUpdated) {
        onCollectionUpdated();
      }
      
      // Close the modal
      closeModal();
    } catch (error) {
      console.error('Error updating main image of collection:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveChanges = async () => {
    // If there are selected images to remove, remove them
    if (selectedImages.length > 0) {
      await handleRemoveSelectedImages();
    } 
    // If the main image has changed, update it
    else if (mainImageId !== collectionData.imageIds[0]) {
      await handleUpdateMainImage();
    } 
    // If nothing has changed, just close the modal
    else {
      closeModal();
    }
  };

  return (
    <>
      <button
        onClick={openModal}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
        </svg>
        Éditer la collection
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold">Éditer la collection: {collectionData.name}</h2>
            </div>
            
            <div className="p-4 overflow-y-auto flex-grow">
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Image principale de la collection</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Sélectionnez une image comme image principale de la collection. Cette image sera affichée comme illustration de la collection.
                </p>
                {mainImageId && (
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-1">Image principale actuelle:</p>
                    <div className="relative w-full h-40 bg-gray-100 rounded overflow-hidden">
                      {images.find(img => img.id === mainImageId) && (
                        <Image
                          src={images.find(img => img.id === mainImageId).image}
                          alt="Image principale"
                          fill
                          style={{ objectFit: 'cover' }}
                          unoptimized={true}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Images de la collection</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Sélectionnez des images pour les supprimer ou définir l'image principale de la collection.
                </p>
                
                {images.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Cette collection ne contient aucune image.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {images.map(image => (
                      <div 
                        key={image.id} 
                        className={`relative rounded-lg overflow-hidden border-2 ${
                          selectedImages.includes(image.id) 
                            ? 'border-red-500' 
                            : image.id === mainImageId 
                              ? 'border-blue-500' 
                              : 'border-transparent'
                        }`}
                      >
                        <div className="relative w-full h-32">
                          <Image
                            src={image.image}
                            alt={image.title || 'Image'}
                            fill
                            style={{ objectFit: 'cover' }}
                            unoptimized={true}
                          />
                        </div>
                        
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                          <div className="absolute top-2 right-2 flex space-x-2">
                            <button
                              onClick={() => toggleImageSelection(image.id)}
                              className={`p-1 rounded-full ${
                                selectedImages.includes(image.id) 
                                  ? 'bg-red-500 text-white' 
                                  : 'bg-white text-gray-700'
                              }`}
                              title={selectedImages.includes(image.id) ? "Désélectionner" : "Sélectionner pour supprimer"}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                {selectedImages.includes(image.id) ? (
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                ) : (
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                )}
                              </svg>
                            </button>
                            
                            <button
                              onClick={() => setAsMainImage(image.id)}
                              className={`p-1 rounded-full ${
                                image.id === mainImageId 
                                  ? 'bg-blue-500 text-white' 
                                  : 'bg-white text-gray-700'
                              }`}
                              title={image.id === mainImageId ? "Image principale actuelle" : "Définir comme image principale"}
                              disabled={image.id === mainImageId}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t flex justify-between">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                disabled={isProcessing}
              >
                Annuler
              </button>
              
              <div className="flex space-x-2">
                {selectedImages.length > 0 && (
                  <button
                    onClick={handleRemoveSelectedImages}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Suppression...' : `Supprimer (${selectedImages.length})`}
                  </button>
                )}
                
                <button
                  onClick={handleSaveChanges}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={isProcessing || (selectedImages.length === 0 && mainImageId === collectionData.imageIds[0])}
                >
                  {isProcessing ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
