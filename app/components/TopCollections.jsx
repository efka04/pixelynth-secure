'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/app/db/firebaseConfig';

export default function TopCollections() {
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    const fetchFeaturedCollections = async () => {
      try {
        const featuredCollectionsRef = collection(db, 'featuredCollections');
        const snapshot = await getDocs(featuredCollectionsRef);

        const featuredCollections = snapshot.docs.map(doc => {
          const data = doc.data();
          if (!data.username) {
            console.error(`Missing username for collection: ${data.name}`);
          }
          return {
            id: doc.id,
            ...data,
            url: data.username
              ? `/account/${data.username}/collections/${encodeURIComponent(data.name)}`
              : null, // Skip invalid URLs
            thumbnail: data.thumbnailUrl || '/default-thumbnail.jpg',
          };
        }).filter(collection => collection.url); // Filter out collections with invalid URLs

        setCollections(featuredCollections);
      } catch (error) {
        console.error('Error fetching featured collections:', error);
      }
    };

    fetchFeaturedCollections();
  }, []);

  return (
    <div className="bg-gray-100 rounded-xl p-4 h-full">
      <h2 className="text-sm font-medium border-[1px] border-black rounded-2xl font-semibold px-3 py-1 inline-block">Top Collections</h2>
      <div className="space-y-3">
        {collections.map((collection) => (
          <Link 
            key={collection.id}
            href={`/account/${collection.url.split('/')[2]}/collections/${encodeURIComponent(collection.name)}`} // Correction de l'URL avec le username
            className="flex items-center gap-3 hover:bg-gray-200 rounded-md transition-colors p-2"
          >
            <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0">
              <img 
                src={collection.thumbnail || '/default-thumbnail.jpg'} 
                alt={collection.name || 'Collection'} 
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-sm">{collection.name || 'Unnamed Collection'}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
