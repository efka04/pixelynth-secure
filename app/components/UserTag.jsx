"use client"
import Image from 'next/image'
import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import { db } from '@/app/db/firebaseConfig'
import { doc, getDoc } from 'firebase/firestore'

function UserTag({ userEmail, theme = 'light', className = "" }) {
  const [imgError, setImgError] = useState(false)
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    profileImage: '',
  })

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userEmail) return;

      try {
        const docRef = doc(db, 'users', userEmail);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            username: data.username || '',
            profileImage: data.profileImage || '',
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setImgError(true);
      }
    };

    fetchUserData();
  }, [userEmail]);

  const displayName = userData.username || 
    (userData.firstName && userData.lastName ? 
     `${userData.firstName} ${userData.lastName}` : 
     '');

  const imageUrl = !imgError && userData.profileImage ? userData.profileImage : null;

  return (
    <Link href={`/account/${userData.username}`} className={`relative inline-block ${className}`}>
      <div className="flex gap-1 sm:gap-2 items-center cursor-pointer hover:opacity-80 transition-opacity">
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={displayName}
            width={30}
            height={30}
            className={`rounded-full sm:w-[40px] sm:h-[40px] w-[30px] h-[30px] border ${theme === 'light' ? 'border-white' : 'border-black'}`}
            onError={() => setImgError(true)}
            unoptimized
          />
        )}
        <div className="min-w-0">
          <h3 className={`text-[12px] sm:text-[14px] font-medium truncate max-w-[80px] sm:max-w-full ${theme === 'light' ? 'text-white' : 'text-black'}`}>
            {displayName}
          </h3>
        </div>
      </div>
    </Link>
  );
}

export default UserTag;