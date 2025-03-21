'use client';
import { useEffect, useCallback, useRef } from 'react';

const usePreloadImages = (images) => {
  const preloadedUrls = useRef(new Set());
  const preloadQueue = useRef([]);
  const isPreloading = useRef(false);

  const preloadImage = useCallback((src) => {
    return new Promise((resolve) => {
      if (!src || preloadedUrls.current.has(src)) {
        resolve();
        return;
      }
      const img = new window.Image();
      img.onload = () => {
        preloadedUrls.current.add(src);
        resolve();
      };
      img.src = src;
    });
  }, []);

  const processQueue = useCallback(async () => {
    if (isPreloading.current || preloadQueue.current.length === 0) return;
    isPreloading.current = true;

    while (preloadQueue.current.length > 0) {
      const nextBatch = preloadQueue.current.splice(0, 8);
      await Promise.all(nextBatch.map(url => preloadImage(url)));
    }

    isPreloading.current = false;
  }, [preloadImage]);

  const queuePreload = useCallback((urls) => {
    preloadQueue.current.push(...urls);
    processQueue();
  }, [processQueue]);

  useEffect(() => {
    if (!images?.length) return;

    // Immediately preload first 16 images
    const initialBatch = images.slice(0, 16).map(img => img.webpURL).filter(Boolean);
    queuePreload(initialBatch);

    // Queue the rest for preloading
    const remainingBatch = images.slice(16).map(img => img.webpURL).filter(Boolean);
    queuePreload(remainingBatch);

  }, [images, queuePreload]);

  return preloadedUrls.current;
};

export default usePreloadImages;
