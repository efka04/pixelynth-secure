'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getArticleById, updateArticle } from '@/services/firebaseService';
import ImageUploader from '../../components/ImageUploader';
import RichTextEditor from '../../components/RichTextEditor';

const EditArticle = () => {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    coverImage: '',
    tags: '',
  });

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const article = await getArticleById(params.id);
        // S'assurer que le content est une chaîne JSON valide
        const content = typeof article.content === 'string' 
          ? article.content 
          : JSON.stringify(article.content);
          
        setFormData({
          title: article.title,
          content: content, // Utiliser la version traitée du content
          excerpt: article.excerpt,
          coverImage: article.coverImage,
          tags: article.tags.join(', '),
          slug: article.slug, // Important pour la redirection
        });
      } catch (err) {
        console.error('Error loading article:', err);
        setError('Failed to load article');
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [params.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateArticle(params.id, {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()),
        updatedAt: new Date(),
      });
      router.push(`/blog/${formData.slug}`);
    } catch (error) {
      setError(error.message);
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Edit Article</h1>
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-800"
        >
          ← Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block mb-2">Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div>
          <label className="block mb-2">Cover Image</label>
          {formData.coverImage && (
            <div className="mb-4">
              <img 
                src={formData.coverImage} 
                alt="Current cover" 
                className="max-h-48 rounded"
              />
            </div>
          )}
          <ImageUploader onImageUploaded={handleImageUploaded} />
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
          <RichTextEditor
            value={formData.content}
            onChange={handleContentChange}
          />
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
        
        <div className="flex gap-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Save Changes
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border rounded hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditArticle;
