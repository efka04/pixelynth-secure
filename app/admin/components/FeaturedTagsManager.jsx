import React, { useEffect, useState } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/app/db/firebaseConfig';

export default function FeaturedTagsManager() {
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const tagsRef = collection(db, 'featuredTags');
        const snapshot = await getDocs(tagsRef);
        const fetchedTags = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTags(fetchedTags);
      } catch (error) {
        console.error('Error fetching tags:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  const addTag = async () => {
    if (!newTag.trim()) return;

    try {
      const tagsRef = collection(db, 'featuredTags');
      const docRef = await addDoc(tagsRef, { name: newTag.trim() });
      setTags([...tags, { id: docRef.id, name: newTag.trim() }]);
      setNewTag('');
    } catch (error) {
      console.error('Error adding tag:', error);
    }
  };

  const removeTag = async (tagId) => {
    try {
      const tagRef = doc(db, 'featuredTags', tagId);
      await deleteDoc(tagRef);
      setTags(tags.filter(tag => tag.id !== tagId));
    } catch (error) {
      console.error('Error removing tag:', error);
    }
  };

  if (loading) {
    return <div>Loading tags...</div>;
  }

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-lg font-bold mb-4">Manage Featured Tags</h2>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          placeholder="Enter a tag"
          className="flex-1 px-3 py-2 border rounded"
        />
        <button
          onClick={addTag}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Tag
        </button>
      </div>
      <ul className="space-y-3">
        {tags.map(tag => (
          <li key={tag.id} className="flex items-center justify-between">
            <span>{tag.name}</span>
            <button
              onClick={() => removeTag(tag.id)}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}