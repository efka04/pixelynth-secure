'use client';

import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/app/db/firebaseConfig';
import { useRouter } from 'next/navigation'; // Assuming you are using Next.js
import { useSession } from 'next-auth/react'; // Assuming you are using next-auth for authentication
import { updateUserPhotoCount } from '@/app/account/[userName]/upload/components/CountPhotos';
import ContributorManager from '../components/ContributorManager';
import UserManager from '../components/UserManager';
import FeaturedCollectionsManager from '../components/FeaturedCollectionsManager';
import FeaturedTagsManager from '../components/FeaturedTagsManager';

export default function AdministrationArea() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts', 'contributors', 'users', 'featuredCollections', 'featuredTags'

  useEffect(() => {
    if (status === 'loading') return; // Do nothing while loading
    if (!session || session.user.email !== 'contact@pixelynth.com') {
      router.push('/'); // Redirect if not authorized
    }
  }, [session, status, router]);

  useEffect(() => {
    const fetchPosts = async () => {
      const tempRef = collection(db, 'temporary');
      const tempSnapshot = await getDocs(tempRef);
      setPosts(tempSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    fetchPosts();
  }, []);

  const handleApprovePost = async (postId) => {
    const tempRef = doc(db, 'temporary', postId);
    const postRef = doc(db, 'post', postId);
    const postSnap = await getDoc(tempRef);

    if (!postSnap.exists()) {
      console.error("Document temporaire introuvable pour l'ID:", postId);
      return;
    }
    const postData = postSnap.data();

    if (!postData.userEmail) {
      return;
    }

    try {
      await setDoc(postRef, postData);
      await deleteDoc(tempRef);
      await updateUserPhotoCount(postData.userEmail); // Incrémentation du compteur
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    } catch (error) {
    }
  };

  const handleRejectPost = async (postId) => {
    const tempRef = doc(db, 'temporary', postId);
    await deleteDoc(tempRef);
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
  };

  const navigateToAllPictures = () => {
    router.push('/admin');
  };

  if (status === 'loading' || !session || session.user.email !== 'contact@pixelynth.com') {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-5 font-sans">
      <h1 className="text-2xl font-bold mb-4">Zone d'administration</h1>
      <div className="flex gap-4 mb-4">
        <button 
          className="bg-blue-500 text-white px-5 py-2 rounded hover:bg-blue-600"
          onClick={navigateToAllPictures}
        >
          All Pictures
        </button>
        <button 
          className={`px-5 py-2 rounded ${activeTab === 'posts' ? 'bg-black text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('posts')}
        >
          Posts en attente
        </button>
        <button 
          className={`px-5 py-2 rounded ${activeTab === 'contributors' ? 'bg-black text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('contributors')}
        >
          Contributeurs
        </button>
        <button 
          className={`px-5 py-2 rounded ${activeTab === 'users' ? 'bg-black text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('users')}
        >
          Utilisateurs
        </button>
        <button 
          className={`px-5 py-2 rounded ${activeTab === 'featuredCollections' ? 'bg-black text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('featuredCollections')}
        >
          Featured Collections
        </button>
        <button 
          className={`px-5 py-2 rounded ${activeTab === 'featuredTags' ? 'bg-black text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('featuredTags')}
        >
          Featured Tags
        </button>
      </div>

      {activeTab === 'posts' && (
        <div className="p-5 font-sans">
          <h2 className="text-2xl font-bold mb-4">Zone d'administration</h2>
          <button 
            className="bg-blue-500 text-white px-5 py-2 rounded hover:bg-blue-600 mb-4"
            onClick={navigateToAllPictures}
          >
            All Pictures
          </button>
          {posts.length === 0 ? (
            <p className="text-center text-lg text-gray-600">No pictures to administrate</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {posts.map(post => (
                <div key={post.id} className="border rounded p-4 relative">
                  <div className="h-48 flex items-center justify-center">
                    <img src={post.webpURL} alt={post.title} className="max-w-full max-h-full object-cover" />
                  </div>
                  <p className="mt-2 font-semibold truncate">{post.title}</p>
                  <p className="text-sm text-gray-600 mb-2">{post.userName}</p>
                  <div className="flex gap-2">
                    <button 
                      className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                      onClick={() => handleApprovePost(post.id)}
                    >
                      Approuver
                    </button>
                    <button 
                      className="flex-1 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                      onClick={() => handleRejectPost(post.id)}
                    >
                      Rejeter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'contributors' && (
        <ContributorManager />
      )}

      {activeTab === 'users' && (
        <UserManager />
      )}

      {activeTab === 'featuredCollections' && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Manage Featured Collections</h2>
          <FeaturedCollectionsManager />
        </div>
      )}

      {activeTab === 'featuredTags' && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Manage Featured Tags</h2>
          <FeaturedTagsManager />
        </div>
      )}
    </div>
  );
}