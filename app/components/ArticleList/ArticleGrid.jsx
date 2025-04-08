import React, { useMemo, memo } from 'react';

import Masonry from "react-masonry-css";
import ArticleItem from "@/app/components/ArticleItem";
import usePreloadImages from '@/app/hooks/usePreloadImages';

const breakpointColumns = {
  default: 3,
  1536: 3,
  1280: 3,
  1024: 3,
  768: 2,
  640: 2,
  300: 1,
};


const ArticleGrid = ({ posts, loadingRef, showRemoveButton, onRemoveImage }) => {
  // Preload images only for the first few posts
  const imagesToPreload = useMemo(() => posts.slice(0, 9), [posts]);
  usePreloadImages(imagesToPreload);

  return (
    <>
      <Masonry
        breakpointCols={breakpointColumns}
        className="flex w-auto -ml-4"
        columnClassName="pl-4 bg-clip-padding"
      >
        {posts.map((item, index) => (
          <div 
            key={item.id} 
            className="mb-4 w-full"
            data-index={index}
          >
            <ArticleItem 
              item={item}
              index={index}
              priority={index < 9} // Priority for first 6 items
              loading={index < 24 ? 'eager' : 'lazy'} // Load the first 24 eagerly
              showRemoveButton={showRemoveButton}
              onRemoveImage={onRemoveImage}
            />
          </div>
        ))}
      </Masonry>

      {loadingRef && (
        <div ref={loadingRef} className="w-full py-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-black" />
        </div>
      )}
    </>
  );
};
export default memo(ArticleGrid);

// Memoize the ArticleGrid component to prevent unnecessary re-renders
