import React, { useState } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { HiArrowSmallLeft } from 'react-icons/hi2';
import { FaEdit, FaHeart, FaRegHeart, FaTrash, FaEllipsisV } from 'react-icons/fa';
import { MdOutlineFileDownload } from 'react-icons/md';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/app/db/firebaseConfig';
import dynamic from 'next/dynamic';
import AddToCollectionButton from '@/app/components/collections/AddToCollectionButton';
import { categoryColors } from '@/app/utils/constants';
import { HiDotsHorizontal } from 'react-icons/hi';

// Lazy-load non-critical UI components
const ArticleImage = dynamic(() => import('@/app/components/ArticleImage'), { ssr: false });
const ArticleInfo = dynamic(() => import('@/app/components/ArticleInfo'), { ssr: false });
const DownloadButton = dynamic(() => import('@/app/components/DownloadButton'), { ssr: false });

export default function PhotosContent({
  articleDetails,
  authorData,
  isFavorite,
  handleAddFavorite,
  handleEdit,
}) {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const { data: session } = useSession();
  
  const handleDelete = async () => {
    try {
      if (!articleDetails || !articleDetails.id) return;
      
      // Référence au document à supprimer
      const postRef = doc(db, 'post', articleDetails.id);
      
      // Supprimer le document
      await deleteDoc(postRef);
      
      // Rediriger vers la page d'accueil
      router.back();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete the post. Please try again.');
    }
  };

  return (
    <>
 
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => router.back()}
            className="flex gap-2 items-center hover:bg-gray-100 p-2 rounded-md"
          >
            <HiArrowSmallLeft className="text-2xl" />
            <span>Back</span>
          </button>
          <div className="flex gap-2">
            {articleDetails.userEmail && (
          <div className="relative">
            <button
              onClick={() => setShowDropdown(prev => !prev)}
              className="bg-white text-gray-700 p-2 rounded-md hover:bg-gray-100"
              aria-label="Options"
            >
              <HiDotsHorizontal />
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md z-10 border border-black">
            <div className="py-1">
              <button
                onClick={() => {
                        setShowDropdown(false);
                        handleEdit();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 flex items-center gap-2"
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
                className={`px-4 py-2 rounded-md  ${
                  isFavorite
                    ? '  text-red-500'
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
