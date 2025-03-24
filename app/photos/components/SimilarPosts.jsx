'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import { ImSpinner8 } from 'react-icons/im';

// Lazy-load the ArticleList with a fallback spinner
const ArticleList = dynamic(
  () => import('@/app/components/ArticleList'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-32 flex items-center justify-center">
        <ImSpinner8 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    ),
  }
);

export default function SimilarPosts({ morePosts, loadingMorePosts }) {
  return (
    <div className="mt-16 mb-8">
      <h4 className="text-2xl font-bold mb-8">More Photos</h4>
      <div className="w-full">
        {loadingMorePosts ? (
          <div className="min-h-32 flex items-center justify-center">
            <ImSpinner8 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : morePosts && morePosts.length > 0 ? (
          <ArticleList listPosts={morePosts} />
        ) : (
          <div className="py-10 text-center text-gray-500">No similar pictures found.</div>
        )}
      </div>
    </div>
  );
}



