'use client';

import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/app/db/firebaseConfig';
import Link from 'next/link';

export default function TopSearches() {
  const [featuredTags, setFeaturedTags] = useState([]);

  useEffect(() => {
    const fetchFeaturedTags = async () => {
      try {
        const tagsRef = collection(db, 'featuredTags');
        const snapshot = await getDocs(tagsRef);
        const tags = snapshot.docs.map(doc => doc.data().name);
        setFeaturedTags(tags);
      } catch (error) {
        console.error('Error fetching featured tags:', error);
      }
    };

    fetchFeaturedTags();
  }, []);

  return (
    <div className="bg-[#D9D0EB] rounded-xl p-4 h-full">
      <h2 className="text-sm font-medium border-[1px] border-black rounded-2xl font-semibold mb-3 inline-block px-3 py-1">Top Searches</h2>
      <div className="flex flex-wrap gap-2">
        {featuredTags.length > 0 ? (
          featuredTags.map((tag, index) => (
            <Link
              key={index}
              href={`/tag/${encodeURIComponent(tag)}`}
              className="text-sm text-black bg-white hover:cursor-pointer hover:bg-gray-100 px-3 py-1 rounded-full "
            >
              {tag}
            </Link>
          ))
        ) : (
          <div className="text-gray-500">No featured tags available</div>
        )}
      </div>
    </div>
  );
}
