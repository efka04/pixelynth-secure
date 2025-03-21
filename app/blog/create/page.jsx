'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createArticle } from '@/services/firebaseService';
import ImageUploader from '../components/ImageUploader';
import RichTextEditor from '../components/RichTextEditor';

const CreateArticle = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    coverImage: '',
    tags: '',
  });
  const [titleError, setTitleError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTitleError('');

    try {
      const response = await createArticle({
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()),
        author: 'Guest'
      });
      
      router.push('/blog');
    } catch (error) {
      if (error.message.includes('titre existe déjà')) {
        setTitleError('Ce titre est déjà utilisé. Veuillez en choisir un autre.');
      } else {
        console.error('Error creating article:', error);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUploaded = (imageUrl) => {
    setFormData(prev => ({ ...prev, coverImage: imageUrl }));
  };

  const handleContentChange = (content) => {
    setFormData(prev => ({ ...prev, content }));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Create New Article</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block mb-2">Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`w-full p-2 border rounded ${titleError ? 'border-red-500' : ''}`}
            required
          />
          {titleError && (
            <p className="text-red-500 text-sm mt-1">{titleError}</p>
          )}
        </div>
        
        <div>
          <label className="block mb-2">Cover Image</label>
          <ImageUploader onImageUploaded={handleImageUploaded} />
          {formData.coverImage && (
            <input
              type="text"
              value={formData.coverImage}
              className="w-full mt-2 p-2 border rounded bg-gray-50"
              readOnly
            />
          )}
        </div>
        
        <div>
          <label className="block mb-2">Excerpt</label>
          <textarea
            name="excerpt"
            value={formData.excerpt}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            rows="3"
            required
          />
        </div>
        
        <div>
          <label className="block mb-2">Content</label>
          <div className="border rounded overflow-hidden">
            <RichTextEditor
              value={formData.content}
              onChange={handleContentChange}
            />
          </div>
        </div>
        
        <div>
          <label className="block mb-2">Tags (comma separated)</label>
          <input
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            placeholder="tag1, tag2, tag3"
          />
        </div>
        
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Publish Article
        </button>
      </form>
    </div>
  );
};

export default CreateArticle;
