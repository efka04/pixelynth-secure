'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/app/db/firebaseConfig';

export default function ImageOfTheDay() {
  const [image, setImage] = useState({
    id: 'daily-highlight',
    title: 'Image of the day',
    src: '/images/image-of-the-day.jpg', // Chemin par défaut, à remplacer par une image réelle
    alt: 'Image of the day',
    author: 'Pixelynth',
    slug: 'image-of-the-day'
  });

  // Fetch image of the day from Firestore
  useEffect(() => {
    const fetchImageOfTheDay = async () => {
      try {
        // Query Firestore for vertical highlighted images with a limit of 10
        const imagesRef = collection(db, 'post');
        const q = query(
          imagesRef,
          where('orientation', '==', 'vertical'),
          where('highlight', '==', 1),
          limit(3)
        );
        const snapshot = await getDocs(q);

        const highlightedImages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log('Fetched highlighted vertical images:', highlightedImages); // Debug log

        if (highlightedImages.length === 0) {
          console.error('No vertical highlighted images available');
          setImage({
            id: 'default',
            title: 'Default Image',
            src: '/images/default-image.jpg',
            alt: 'Default Image',
            author: 'Pixelynth',
            slug: 'default-image',
          });
          return;
        }

        // Use the current date to select an image
        const today = new Date();
        const index = today.getDate() % highlightedImages.length;
        const dailyImage = highlightedImages[index];

        console.log('Selected daily image:', dailyImage); // Debug log

        setImage(dailyImage);
      } catch (error) {
        console.error('Error fetching image of the day from Firestore:', error);
      }
    };

    fetchImageOfTheDay();
  }, []);

  return (
    <div className="relative h-full rounded-xl border-[1px] border-black overflow-hidden">
      {/* Badge en haut */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-full px-3 py-1 text-sm font-medium">
        Image of the day
      </div>

      {/* Image */}
      <div className="w-full h-full">
        {image && image.webpURL ? (
          <Link href={`/photos/${image.id}`}>
            <div className="relative w-full h-full min-h-[400px]">
              <img
                src={image.webpURL}
                alt={image.title || 'Image of the day'}
                className="w-full h-full object-cover"
                style={{ aspectRatio: '3/4' }}
              />
            </div>
          </Link>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No image available
          </div>
        )}
      </div>
    </div>
  );
}
