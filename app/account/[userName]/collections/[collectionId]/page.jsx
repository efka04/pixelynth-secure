'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import CollectionDetail from '@/app/components/collections/CollectionDetail';
import LoadingSpinner from '@/app/components/ArticleList/LoadingSpinner';

export default function CollectionPage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simple effect to simulate loading and ensure the component mounts properly
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <div className="text-center py-12"><LoadingSpinner /></div>;
  }

  // Utiliser l'email de l'utilisateur au lieu du nom d'utilisateur
  // Dans le contexte de Firebase, nous avons besoin de l'email pour accéder aux collections
  return (
    <main className="max-w-6xl mx-auto p-4">
      <CollectionDetail 
        collectionId={params.collectionId} 
        userEmail={params.userName} 
        isUserNameNotEmail={true}
      />
    </main>
  );
}
