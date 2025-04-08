'use client';
import React, { Suspense, memo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import ArticleImage from './ArticleItem/Image';
import { useSession } from "next-auth/react";
import LikeButton from './ArticleItem/LikeButton';
import { FaTrash, FaImage } from 'react-icons/fa';

// Dynamically import components with loading placeholders
const UserTag = dynamic(() => import('./UserTag'), {
  ssr: false,
  loading: () => <div className="w-32 h-8 bg-transparent" />
});

const DownloadButton = dynamic(() => import('./DownloadButton'), {
  ssr: false,
  loading: () => <div className="w-8 h-8 bg-transparent" />
});

const ArticleActions = dynamic(() => import('./ArticleItem/Actions'), {
  ssr: false,
  loading: () => <div className="h-[40px]" />
});

const ArticleItem = ({ 
  item, 
  priority, 
  loading, 
  index, 
  showRemoveButton, 
  onRemoveImage,
  showSetThumbnail,
  onSetThumbnail,
  currentThumbnailUrl,
  updatingThumbnail
}) => {
  const router = useRouter();
  const { data: session } = useSession();
  
  if (!item) return null;

  const handleImageClick = (e) => {
    // Si la touche Ctrl ou Cmd est enfoncée, ou si c'est un clic du milieu, 
    // laissez le comportement par défaut (ouvrir dans un nouvel onglet)
    if (e.ctrlKey || e.metaKey || e.button === 1) {
      // Créer l'URL mais ne pas empêcher le comportement par défaut
      const formattedTitle = item.title.replace(/\s+/g, '-');
      window.open(`/photos/${formattedTitle}-${item.id}`, '_blank');
      return;
    }
    
    // Comportement normal pour un clic simple
    e.preventDefault();
    const formattedTitle = item.title.replace(/\s+/g, '-');
    router.push(`/photos/${formattedTitle}-${item.id}`);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (onRemoveImage) {
      if (window.confirm('Are you sure you want to remove this image from the collection?')) {
        onRemoveImage(item.id);
      }
    }
  };

  const isPriority = index < 4;

  return (
    <article 
      className="relative group rounded-lg overflow-hidden cursor-pointer"
      onClick={handleImageClick}
    >
      <ArticleImage
        src={item.webpURL || item.image}
        alt={item.title || 'Article image'}
        priority={isPriority}
        loading={isPriority ? 'eager' : 'lazy'}
      />
      
      {/* Like button - hidden by default, shown on hover */}
      <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        onClick={e => e.stopPropagation()}>
        <LikeButton 
          id={item.id} 
          initialLikes={item.likes || 0} 
          postData={{
            imageUrl: item.webpURL || item.imageUrl || item.image,
            url: item.webpURL || item.imageUrl || item.image,
            title: item.title || '',
            description: item.description || '',
            timestamp: item.timestamp || new Date(),
            width: item.width || 800,
            height: item.height || 600,
            userEmail: item.userEmail,
            metadata: {
              width: item.width || 800,
              height: item.height || 600
            }
          }} 
        />
      </div>
      
      {/* Thumbnail and Remove buttons container */}
      {(showRemoveButton || showSetThumbnail) && (
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2"
          onClick={e => e.stopPropagation()}>
          {showSetThumbnail && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onSetThumbnail(item.webpURL || item.image);
              }}
              disabled={updatingThumbnail || currentThumbnailUrl === (item.webpURL || item.image)}
              className={`p-2 rounded-full shadow-md transition-colors
                ${currentThumbnailUrl === (item.webpURL || item.image)
                  ? 'bg-green-500 text-white'
                  : 'bg-white hover:bg-gray-100 text-blue-500'}`}
              title={currentThumbnailUrl === (item.webpURL || item.image)
                ? 'Current thumbnail'
                : 'Set as collection thumbnail'}
            >
              <FaImage className="h-5 w-5" />
            </button>
          )}
          
          {showRemoveButton && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onRemoveImage(item.id);
              }}
              className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
            >
              <FaTrash className="h-5 w-5 text-red-500" />
            </button>
          )}
        </div>
      )}
      
      {/* Bottom controls - hidden by default, shown on hover */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <UserTag 
            userEmail={item.userEmail}
            theme="light" 
            className="text-white" 
          />
          <DownloadButton item={item} session={session} />
        </div>
      </div>
    </article>
  );
};
export default memo(ArticleItem);
