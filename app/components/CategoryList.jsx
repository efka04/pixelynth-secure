'use client'
import React, { useState } from 'react';
import { useCategory } from '@/app/context/CategoryContext';
import Image from 'next/image';

const CategoryList = () => {
    const { categories } = useCategory();
    const [loadedImages, setLoadedImages] = useState({});

    const handleImageLoad = (categoryValue) => {
        setLoadedImages(prev => ({
            ...prev,
            [categoryValue]: true
        }));
    };

    const handleImageError = (category) => (e) => {
        console.error(`Failed to load image for ${category.label}:`, category.imageUrl);
        setLoadedImages(prev => ({
            ...prev,
            [category.value]: 'error'
        }));
    };

    return (
        <div className="category-list">
            {categories.map((category) => (
                <div key={category.value} className="category-item relative">
                    {!loadedImages[category.value] && (
                        <div className="absolute inset-0 bg-gray-100 animate-pulse" />
                    )}
                    <Image
                        src={category.imageUrl}
                        alt={category.label}
                        width={100}
                        height={100}
                        priority={true}
                        onLoad={() => handleImageLoad(category.value)}
                        onError={handleImageError(category)}
                        style={{
                            opacity: loadedImages[category.value] === true ? 1 : 0,
                            transition: 'opacity 0.3s ease-in-out'
                        }}
                    />
                    <span>{category.label}</span>
                </div>
            ))}
        </div>
    );
};

export default CategoryList;