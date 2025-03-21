import Image from 'next/image'
import React from 'react'

function ArticleImage({ articleDetails }) {
  // Utiliser directement webpURL avec fallback sur image
  const imageUrl = articleDetails?.webpURL || articleDetails?.image;

  return (
    <div>
      {articleDetails && 
        <Image 
          src={imageUrl}
          alt={articleDetails?.title || 'Article image'}
          width={1000}
          height={1000}
          onClick={articleDetails?.link ? () => window.open(articleDetails.link) : undefined}
          className={`rounded-3xl ${articleDetails?.link ? 'cursor-pointer' : 'cursor-default'}`}
          priority={true}
        />
      }
    </div>
  )
}

export default ArticleImage;

<button 
onClick={() => router.push('/license')} 
className='bg-white border border-gray-300 hover:bg-gray-50 px-3 py-2 text-sm text-gray-600 rounded-md'
>
View License
</button>
