import NextImage from "next/image";
import { useState, useEffect } from "react";

const ArticleImage = ({ src, alt, priority, loading = "lazy" }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadedSrc, setLoadedSrc] = useState('');

  useEffect(() => {
    setIsLoading(!loadedSrc);
  }, [loadedSrc]);

  if (!src) return null;

  return (
    <div className="relative w-full bg-gray-50">
      <div className={`transition-opacity duration-300 ${loadedSrc === src ? 'opacity-100' : 'opacity-0'}`}>
        <NextImage
          src={src}
          alt={alt}
          width={800}
          height={600}
          className="w-full h-auto"
          priority={priority}
          loading={loading}
          onLoad={() => setLoadedSrc(src)}
          quality={90}
        />
      </div>
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-b from-gray-100 to-gray-200 animate-pulse" />
      )}
    </div>
  );
};

export default ArticleImage;
