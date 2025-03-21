'use client';
import React, { Suspense, memo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import ArticleImage from './ArticleItem/Image';
import { useSession } from "next-auth/react";
import LikeButton from './ArticleItem/LikeButton'; // Add this import

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

const ArticleItem = ({ item, priority, loading, index }) => {
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

  const isPriority = index < 4;

  return (
    <article 
      className="relative group rounded-lg overflow-hidden cursor-pointer"
      onClick={handleImageClick}
    >
      <ArticleImage
        src={item.webpURL}
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
            imageUrl: item.webpURL || item.imageUrl,
            url: item.webpURL || item.imageUrl,
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
      
      {/* Bottom controls - hidden by default, shown on hover */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <UserTag 
            userEmail={item.userEmail} // Assurez-vous que `item.userEmail` contient l'email de l'utilisateur
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

// Memoize the ArticleItem component to prevent unnecessary re-renders