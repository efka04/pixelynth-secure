import React, { useEffect, useState } from 'react';
import { collection, getDocs, setDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/db/firebaseConfig';

export default function FeaturedCollectionsManager() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);

        const allCollections = [];

        for (const userDoc of usersSnapshot.docs) {
          const userCollectionsRef = collection(db, 'users', userDoc.id, 'collections');
          const userCollectionsSnapshot = await getDocs(userCollectionsRef);

          userCollectionsSnapshot.forEach((doc) => {
            allCollections.push({
              id: doc.id,
              ...doc.data(),
              userEmail: userDoc.id, // Include user email for context
            });
          });
        }

        setCollections(allCollections);
      } catch (error) {
        console.error('Error fetching collections:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  const toggleFeatured = async (collectionId, isFeatured, userEmail, collectionData) => {
    try {
      const featuredCollectionRef = doc(db, 'featuredCollections', collectionId);

      if (isFeatured) {
        // Remove from featuredCollections
        await deleteDoc(featuredCollectionRef);
      } else {
        // Fetch the username from the users collection
        const userDocRef = doc(db, 'users', userEmail);
        const userDocSnap = await getDoc(userDocRef);
        const username = userDocSnap.exists() ? userDocSnap.data().username : null;

        if (!username) {
          console.error('Username not found for user:', userEmail);
          return;
        }

        // Add to featuredCollections
        await setDoc(featuredCollectionRef, {
          ...collectionData,
          userEmail,
          id: collectionId,
          username, // Use the fetched username
          url: `/account/${username}/collections/${encodeURIComponent(collectionData.name)}` // Construct URL dynamically
        });
      }

      setCollections(prevCollections =>
        prevCollections.map(collection =>
          collection.id === collectionId
            ? { ...collection, isFeatured: !isFeatured }
            : collection
        )
      );
    } catch (error) {
      console.error('Error updating featured collections:', error);
    }
  };

  if (loading) {
    return <div>Loading collections...</div>;
  }

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-lg font-bold mb-4">Manage Featured Collections</h2>
      <ul className="space-y-3">
        {collections.map(collection => (
          <li key={collection.id} className="flex items-center justify-between">
            <span>
              {collection.name || 'Unnamed Collection'} ({collection.userEmail})
            </span>
            <button
              onClick={() => toggleFeatured(collection.id, collection.isFeatured, collection.userEmail, collection)}
              className={`px-3 py-1 rounded ${
                collection.isFeatured ? 'bg-green-500 text-white' : 'bg-gray-200 text-black'
              }`}
            >
              {collection.isFeatured ? 'Unfeature' : 'Feature'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}