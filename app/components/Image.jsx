import React from 'react'
import Image from 'next/image'

const ArticleImage = ({ src, alt }) => {
  return (
    <div className="relative w-full h-full">
      <Image
        src={src}
        alt={alt || 'Article image'}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        priority={false}
        className="object-cover rounded-md"
        onLoad={(e) => {
          // Add any loading complete logic here if needed
          const img = e.target;
          if (img.complete) {
            // Image is loaded
          }
        }}
      />
    </div>
  )
}

export default ArticleImage
