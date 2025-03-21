'use client';
import { useState, useEffect } from 'react';
import { FaHeart } from 'react-icons/fa';
import { db } from '@/app/db/firebaseConfig';
import { doc, updateDoc, increment, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '@/app/context/AuthContext';
import { useSession } from 'next-auth/react';

const LikeButton = ({ id, initialLikes = 0, postData }) => {
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);
  const { user } = useAuth();
  const { data: session } = useSession();

  const userEmail = user?.email || session?.user?.email;

  useEffect(() => {
    if (userEmail) {
      const checkLikeStatus = async () => {
        try {
          const favoriteRef = doc(db, 'users', userEmail, 'favorites', id);
          const docSnap = await getDoc(favoriteRef);
          setIsLiked(docSnap.exists());
        } catch (error) {
          console.error('Error checking like status:', error);
        }
      };
      checkLikeStatus();
    }
  }, [userEmail, id]);

  const handleLike = async () => {
    if (!userEmail) {
      alert('Please login to like photos');
      return;
    }

    try {
      const postRef = doc(db, 'post', id);
      const favoriteRef = doc(db, 'users', userEmail, 'favorites', id);

      if (!isLiked) {
        // Get original document data
        const originalDoc = await getDoc(postRef);
        if (originalDoc.exists()) {
          // Create exact copy of original document
          await setDoc(favoriteRef, {
            ...originalDoc.data(),
            addedToFavorites: new Date(), // Only add this timestamp
          });
        }
      } else {
        await deleteDoc(favoriteRef);
      }

      // Update likes count
      await updateDoc(postRef, {
        likes: increment(isLiked ? -1 : 1)
      });

      setIsLiked(!isLiked);
      setLikes(prev => isLiked ? prev - 1 : prev + 1);

    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  return (
    <button
      onClick={handleLike}
      className="flex items-center gap-1 text-sm bg-black/30 backdrop-blur-sm rounded-full p-2 text-white hover:bg-black/50 transition-colors"
      aria-label={isLiked ? "Unlike" : "Like"}
    >
      <FaHeart className={`transition-colors ${isLiked ? 'text-red-500' : 'text-white'}`} />
    </button>
  );
};

export default LikeButton;
