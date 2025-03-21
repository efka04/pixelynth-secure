'use client';

import React from 'react';
import PhotosContent from '@/app/photos/components/PhotosContent';
import SimilarPosts from '@/app/photos/components/SimilarPosts';
import Spinner from '@/app/photos/components/Spinner';
import usePhotos from '@/app/photos/hooks/usePhotos';

export default function ArticlePage() {
  const {
    isLoading,
    articleDetails,
    authorData,
    isFavorite,
    morePosts,
    loadingMorePosts,
    handleEdit,
    handleAddFavorite,
  } = usePhotos();

  if (isLoading) return <Spinner />;
  if (!articleDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">No article found</p>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      {/* Main Article Content */}
      <PhotosContent
        articleDetails={articleDetails}
        authorData={authorData}
        isFavorite={isFavorite}
        handleAddFavorite={handleAddFavorite}
        handleEdit={handleEdit}
      />

      {/* Similar Posts Section */}
      <SimilarPosts morePosts={morePosts} loadingMorePosts={loadingMorePosts} />
    </div>
  );
}