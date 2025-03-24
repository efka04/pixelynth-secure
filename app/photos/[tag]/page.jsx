// This file creates a dynamic route for tag-based photo pages
// It will only render pages with 30+ photos and includes custom metadata
// File: app/photos/[tag]/page.jsx

'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/app/db/firebaseConfig';
import { collection, query, where, getDocs, limit, startAfter } from 'firebase/firestore';
import ArticleList from '@/app/components/ArticleList';
import { ImSpinner8 } from 'react-icons/im';
import Head from 'next/head';

const PAGE_SIZE = 30;

export default function TagPhotosPage() {
  const { slug } = useParams();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [photoCount, setPhotoCount] = useState(0);
  const [error, setError] = useState(null);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    setPhotos([]);
    setLastDoc(null);
    setHasMore(true);
    setLoading(true);
    setError(null);
    if (slug) {
      fetchPhotos();
    }
  }, [slug]);

  const fetchPhotos = async () => {
    try {
      console.log("Fetching photos for tag:", slug);
      const postsRef = collection(db, "post");
      let q;
      
      if (lastDoc) {
        // Paginate after the last document fetched
        q = query(
          postsRef,
          where("tags", "array-contains", slug.toLowerCase()),
          startAfter(lastDoc),
          limit(PAGE_SIZE)
        );
      } else {
        q = query(
          postsRef,
          where("tags", "array-contains", slug.toLowerCase()),
          limit(PAGE_SIZE)
        );
      }
      
      const querySnapshot = await getDocs(q);
      const fetchedPhotos = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          updatedAt: data.updatedAt?.toDate().toISOString(), // Convert Firestore Timestamp to ISO string
          createdAt: data.createdAt?.toDate().toISOString(), // Convert Firestore Timestamp to ISO string
        };
      });

      // If fewer than PAGE_SIZE docs were returned, there are no more photos
      if (querySnapshot.docs.length < PAGE_SIZE) {
        setHasMore(false);
      }

      if (querySnapshot.docs.length > 0) {
        setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
      }

      // Count total photos for this tag (only on initial load)
      if (!lastDoc) {
        const countQuery = query(
          postsRef,
          where("tags", "array-contains", slug.toLowerCase())
        );
        const countSnapshot = await getDocs(countQuery);
        setPhotoCount(countSnapshot.size);
      }

      setPhotos((prev) => [...prev, ...fetchedPhotos]);
    } catch (err) {
      console.error("Error fetching photos:", err);
      setError("Failed to load photos");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loadingMore) {
      setLoadingMore(true);
      fetchPhotos();
    }
  };

  // Generate custom metadata description
  const metaDescription = `More than ${photoCount} pictures of ${slug}. Free AI-generated ${slug} images for commercial use.`;
  const pageTitle = `${slug.charAt(0).toUpperCase() + slug.slice(1)} Images - Pixelynth`;

  if (loading && photos.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ImSpinner8 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) return <p className="text-red-500">{error}</p>;

  // Only render the page if we have at least 30 photos
  if (photoCount < 30) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Not enough photos for this tag</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://pixelynth.com/photos/${slug}`} />
        <link rel="canonical" href={`https://pixelynth.com/photos/${slug}`} />
      </Head>
      <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 capitalize">{slug} Images</h1>
        <p className="text-gray-600 mb-6">{metaDescription}</p>
        
        {photos.length > 0 ? (
          <>
            <ArticleList listPosts={photos} />
            {hasMore && (
              <div className="flex justify-center my-4">
                <button
                  onClick={loadMore}
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                  {loadingMore ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </>
        ) : (
          <p>No photos found for "{slug}".</p>
        )}
      </div>
    </>
  );
}
