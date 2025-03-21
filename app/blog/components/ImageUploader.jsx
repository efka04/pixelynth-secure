'use client';
import React, { useState } from 'react';
import { storage } from '@/app/db/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const ImageUploader = ({ onImageUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('File must be an image');
      return;
    }

    try {
      setError('');
      setUploading(true);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);

      // Upload to Firebase Storage
      const storageRef = ref(storage, `blog-images/${Date.now()}-${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      
      onImageUploaded(downloadUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      setError(error.message || 'Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className={`relative border-2 border-dashed rounded-md p-4 transition-colors ${
        error ? 'border-red-500' : 'border-gray-300 hover:border-blue-500'
      }`}>
        <input
          type="file"
          onChange={handleImageChange}
          accept="image/*"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="text-center">
          {uploading ? (
            <p>Uploading...</p>
          ) : (
            <p>Drop an image here or click to select</p>
          )}
        </div>
      </div>
      
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
      
      {previewUrl && (
        <div className="relative aspect-video">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-full object-cover rounded-md"
          />
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
