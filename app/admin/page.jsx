'use client';

import React, { useEffect, useState } from 'react';
import { getDoc, increment, collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/app/db/firebaseConfig';
import { useRouter } from 'next/navigation'; // Use next/navigation instead of next/router
import { useSession } from 'next-auth/react'; // Assuming you are using next-auth for authentication
import FeaturedCollectionsManager from './components/FeaturedCollectionsManager';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage] = useState(20); // Increased number of posts per page
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    if (status === 'loading') return; // Do nothing while loading
    if (!session || session.user.email !== 'contact@pixelynth.com') {
      router.push('/'); // Redirect if not authorized
    }
  }, [session, status, router]);

  useEffect(() => {
    const fetchPosts = async () => {
      const postsRef = collection(db, 'post');
      const postsSnapshot = await getDocs(postsRef);
      const fetchedPosts = postsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        highlight: doc.data().highlight || 0  // Ensure highlight is initialized
      }));
      // Sort by timestamp in descending order (newest first)
      fetchedPosts.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setPosts(fetchedPosts);
    };

    fetchPosts();
  }, []);

  useEffect(() => {
    const fetchCollections = async () => {
      const collectionsRef = collection(db, 'collections');
      const collectionsSnapshot = await getDocs(collectionsRef);
      const fetchedCollections = collectionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isFeatured: doc.data().isFeatured || false // Ensure isFeatured is initialized
      }));
      setCollections(fetchedCollections);
    };

    fetchCollections();
  }, []);

  const handleSelectPost = (postId) => {
    setSelectedPosts(prevSelected =>
      prevSelected.includes(postId)
        ? prevSelected.filter(id => id !== postId)
        : [...prevSelected, postId]
    );
  };

  const handleDeleteSelected = async () => {
    for (const postId of selectedPosts) {
      // Référence et récupération du document du post
      const postRef = doc(db, 'post', postId);
      const postSnapshot = await getDoc(postRef);
      if (postSnapshot.exists()) {
        const postData = postSnapshot.data();
        // Référence vers le document de l'utilisateur à qui appartient la photo
        const userDocRef = doc(db, 'users', postData.userEmail);
        // Décrémenter le compteur de photos pour cet utilisateur
        await updateDoc(userDocRef, {
          photoCount: increment(-1)
        });
      }
      // Suppression du post
      await deleteDoc(postRef);
    }
    // Mise à jour de l'état local
    setPosts(prevPosts => prevPosts.filter(post => !selectedPosts.includes(post.id)));
    setSelectedPosts([]);
  };

  const handleToggleHighlight = async (postId, currentHighlight) => {
    const postRef = doc(db, 'post', postId);
    await updateDoc(postRef, { highlight: currentHighlight ? 0 : 1 });
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId ? { ...post, highlight: currentHighlight ? 0 : 1 } : post
      )
    );
  };

  const handleToggleFeatured = async (collectionId, currentFeatured) => {
    const collectionRef = doc(db, 'collections', collectionId);
    await updateDoc(collectionRef, { isFeatured: !currentFeatured });
    setCollections(prevCollections =>
      prevCollections.map(collection =>
        collection.id === collectionId ? { ...collection, isFeatured: !currentFeatured } : collection
      )
    );
  };

  const handleEditPost = (postId) => {
    router.push(`/photos/${postId}/edit`);
  };

  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const navigateToAdministrationArea = () => {
    router.push('/admin/administrationArea');
  };

  const renderPagination = () => {
    const totalPages = Math.ceil(posts.length / postsPerPage);
    const pageNumbers = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pageNumbers.push(1, 2, 3, 4, 'ellipsis1', totalPages);
      } else if (currentPage > totalPages - 3) {
        pageNumbers.push(1, 'ellipsis2', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pageNumbers.push(1, 'ellipsis3', currentPage - 1, currentPage, currentPage + 1, 'ellipsis4', totalPages);
      }
    }

    return pageNumbers.map((number, index) =>
      typeof number === 'string' ? (
        <span key={number} className="mx-2">...</span>
      ) : (
        <button
          key={number}
          onClick={() => paginate(number)}
          className={`px-3 py-1 mx-1 rounded ${
            currentPage === number 
              ? 'bg-black text-white' 
              : 'bg-white text-black border border-black hover:bg-gray-100'
          }`}
        >
          {number}
        </button>
      )
    );
  };

  if (status === 'loading' || !session || session.user.email !== 'contact@pixelynth.com') {
    return <div>Loading...</div>;
  }

  return (
    <main className="p-5 font-sans">
      <h1 className="text-2xl font-bold mb-4">Page d'administration</h1>
      <button 
        className="bg-red-500 text-white px-5 py-2 rounded disabled:bg-gray-300 disabled:cursor-not-allowed mr-2" 
        onClick={handleDeleteSelected} 
        disabled={selectedPosts.length === 0}
      >
        Supprimer les éléments sélectionnés
      </button>
      <button 
        className="bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700" 
        onClick={navigateToAdministrationArea}
      >
        Zone d'administration
      </button>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
        {currentPosts.map(post => (
          <div key={post.id} className="border rounded p-4 relative">
            <input
              type="checkbox"
              checked={selectedPosts.includes(post.id)}
              onChange={() => handleSelectPost(post.id)}
              className="absolute top-2 left-2"
            />
            <div className="h-48 flex items-center justify-center">
              <img src={post.webpURL} alt={post.title} className="max-w-full max-h-full object-cover" />
            </div>
            <p className="mt-2 font-semibold truncate">{post.title}</p>
            <p className="text-sm text-gray-600">User: {post.userName}</p>
            <p className="text-sm text-gray-600">Description: {post.desc}</p>
            <p className="text-sm text-gray-600">Categories: {post.categories?.join(', ')}</p>
            <p className="text-sm text-gray-600">Color: {post.color}</p>
            <p className="text-sm text-gray-600">Downloaded Times: {post.downloadCount}</p>
            <p className="text-sm text-gray-600">Likes: {post.likes}</p>
            <p className="text-sm text-gray-600">People: {post.peopleCount}</p>
            <p className="text-sm text-gray-600">Tags: {post.tags?.join(', ')}</p>
            <button 
              className="bg-blue-500 text-white px-3 py-1 rounded mt-2 mr-2" 
              onClick={() => handleEditPost(post.id)}
            >
              Modifier
            </button>
            <button
              className={`px-3 py-1 rounded mt-2 ${
                post.highlight 
                  ? 'bg-yellow-400 text-black' 
                  : 'bg-white text-black border border-black'
              }`}
              onClick={() => handleToggleHighlight(post.id, post.highlight)}
            >
              {post.highlight ? 'Unhighlight' : 'Highlight'}
            </button>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
        {collections.map(collection => (
          <div key={collection.id} className="border rounded p-4">
            <p className="font-semibold">{collection.name}</p>
            <button
              className={`px-3 py-1 rounded mt-2 ${
                collection.isFeatured ? 'bg-green-500 text-white' : 'bg-white text-black border border-black'
              }`}
              onClick={() => handleToggleFeatured(collection.id, collection.isFeatured)}
            >
              {collection.isFeatured ? 'Unfeature' : 'Feature'}
            </button>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-2 mt-6">
        {renderPagination()}
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Manage Featured Collections</h2>
        <FeaturedCollectionsManager />
      </div>
    </main>
  );
}
