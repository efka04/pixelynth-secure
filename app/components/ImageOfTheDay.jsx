'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { collection, query, where, getDocs } from 'firebase/firestore';
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
          where('highlight', '==', 1)
          // SUPPRIMER limit(3)
        );
        const snapshot = await getDocs(q);

        const highlightedImages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Mélange la liste d'images de façon déterministe selon la date du jour
        function seededShuffle(array, seed) {
          let m = array.length, t, i;
          let random = mulberry32(seed);
          while (m) {
            i = Math.floor(random() * m--);
            t = array[m];
            array[m] = array[i];
            array[i] = t;
          }
          return array;
        }

        // Générateur pseudo-aléatoire basé sur la date (seed)
        function mulberry32(a) {
          return function() {
            var t = a += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
          }
        }

        // Utilise la date du jour comme seed
        const today = new Date();
        const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        const shuffledImages = seededShuffle([...highlightedImages], seed);

        const dailyImage = shuffledImages[0];

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
