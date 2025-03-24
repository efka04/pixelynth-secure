// Fichier: /app/photos/components/PhotosContent.jsx
'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaHeart, FaRegHeart, FaEdit, FaTrash, FaEllipsisV } from 'react-icons/fa';
import { MdOutlineFileDownload } from 'react-icons/md';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/app/db/firebaseConfig';
import DownloadButton from '@/app/components/DownloadButton';
import AddToCollectionButton from '@/app/components/collections/AddToCollectionButton';
import ArticleImage from '@/app/components/ArticleImage';
import ArticleInfo from '@/app/components/ArticleInfo';
import NextImage from 'next/image';
import { categories as mainCategories } from '@/app/utils/constants';

// Category colors for visual display
const categoryColors = {
  'Food': '#FFD700',
  'Beauty': '#FF69B4',
  'Fashion': '#00CED1',
  'Travel': '#32CD32',
  'Nature': '#7CFC00',
  'Technology': '#1E90FF',
  'Business': '#FF8C00',
  'Health': '#FF6347',
  'Education': '#9370DB',
  'Sports': '#20B2AA',
  'Art': '#FF4500',
  'Music': '#BA55D3',
  'Home': '#3CB371',
  'Lifestyle': '#FF7F50',
  'Animals': '#6495ED',
};

export default function PhotosContent({
  articleDetails,
  authorData,
  isFavorite = false,
  handleAddFavorite = () => {},
  handleEdit = () => {},
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  // Function to check if a category is a main category that should be indexed
  const isMainCategory = (category) => {
    return mainCategories.some(mainCat => 
      mainCat.toLowerCase() === category.toLowerCase() || 
      mainCat.toLowerCase().includes(category.toLowerCase()) ||
      category.toLowerCase().includes(mainCat.toLowerCase())
    );
  };

  const handleDelete = async () => {
    if (!session || session.user.email !== articleDetails.userEmail) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'post', articleDetails.id));
      router.push('/');
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete the image. Please try again.');
    }
  };

  return (
    <>
      {/* Article Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          {/* Actions dropdown */}
          {session && (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-2 rounded-full hover:bg-gray-100"
                aria-label="More options"
              >
                <FaEllipsisV className="text-gray-500" />
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        handleEdit();
                      }}
                      className="w-full text-left hover:bg-gray-100 px-4 py-2 text-sm text-gray-700 flex items-center gap-2"
                    >
                      <FaEdit className="text-black" />
                      <span>Edit</span>
                    </button>
                    
                    {session && session.user && session.user.email === articleDetails.userEmail && (
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          if (window.confirm('Are you sure you want to delete this image?')) {
                            handleDelete();
                          }
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <FaTrash className="text-red-500" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Main Article Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ArticleImage articleId={articleDetails.id} articleDetails={articleDetails} />
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            {authorData && (
              <Link
                href={`/account/${articleDetails.userName}`}
                className="flex items-center gap-2 hover:bg-gray-50 p-0 rounded-md transition-colors"
              >
                <div className="relative w-8 h-8">
                  <NextImage
                    src={authorData.profileImage || '/default-avatar.webp'}
                    alt={articleDetails.userName}
                    fill
                    className="rounded-full object-cover border border-black"
                  />
                </div>
                <span className="text-sm font-medium">{articleDetails.userName}</span>
              </Link>
            )}
          </div>
          <ArticleInfo articleDetails={articleDetails} />
          
          {/* Categories Display */}
          {articleDetails.categories && articleDetails.categories.length > 0 && (
            <div className="mt-2 mb-2 overflow-x-auto">
              <div className="flex gap-1 flex-wrap">
                {articleDetails.categories.map((category, index) => {
                  const color = categoryColors[category] || '#CCCCCC';
                  // Only add nofollow if it's not a main category
                  const shouldNofollow = !isMainCategory(category);
                  return (
                    <Link
                      key={index}
                      href={`/category/${encodeURIComponent(category)}`}
                      className="px-4 py-1 rounded-full cursor-pointer text-sm"
                      style={{
                        backgroundColor: color,
                        color: 'black',
                        fontWeight: 300,
                      }}
                      {...(shouldNofollow ? { rel: "nofollow" } : {})}
                    >
                      {category}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
          
          <div className="mt-3 flex flex-col gap-2">
            {/* Metadata Display */}
            <div className="flex justify-between mb-2 text-sm text-gray-600">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <FaHeart className="text-red-500 text-1xl" />
                  <span>{articleDetails.likes || 0} likes</span>
                </div>
                <div className="flex items-center gap-1">
                  <MdOutlineFileDownload />
                  <span>{articleDetails.downloadCount || 0} downloads</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>In {articleDetails.collectionCount || 0} collections</span>
                </div>
              </div>
              <Link href="/license" className="text-blue-600 hover:underline">
                See License
              </Link>
            </div>
            
            {/* Buttons */}
            <div className="flex gap-2">
              <div className="flex-1">
                <DownloadButton item={articleDetails} variant="text" />
              </div>
              <div className="flex-2">
                <AddToCollectionButton imageId={articleDetails.id} />
              </div>
              <button
                onClick={handleAddFavorite}
                className={`px-4 py-2 rounded-md ${
                  isFavorite
                    ? 'text-red-500'
                    : 'bg-white'
                }`}
                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                {isFavorite ? <FaHeart className="text-2xl" /> : <FaRegHeart className="text-2xl"/>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
