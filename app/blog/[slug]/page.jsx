// Composant serveur (par défaut dans Next.js App Router)
import React from 'react';
import { getArticleBySlug } from '@/services/firebaseService';
import ClientBlogPost from '../components/ClientBlogPost';

// Fonction pour récupérer les données de l'article côté serveur
export async function generateMetadata({ params }) {
  const article = await getArticleBySlug(params.slug);
  
  if (!article) {
    return {
      title: 'Article Not Found | Pixelynth',
      description: 'The article you are looking for does not exist or has been removed.',
    };
  }
  
  return {
    title: `${article.title} | Pixelynth Blog`,
    description: article.excerpt || `Découvrez ${article.title} sur le blog Pixelynth.`,
    keywords: article.tags?.join(', ') || 'AI images, stock photos, free images, artificial intelligence',
  };
}

export default async function BlogPostPage({ params }) {
  // Récupération des données côté serveur
  const article = await getArticleBySlug(params.slug);
  
  if (!article) {
    return <div>Article not found</div>;
  }
  
  // Rendu initial côté serveur pour le contenu statique
  return (
    <div className="container mx-auto px-4 py-8 max-w-[700px]">
      {/* Section image héro - rendue côté serveur */}
      <div className="relative w-full h-[50vh] min-h-[400px] mb-8">
        {article?.coverImage && (
          <div className="border rounded-md overflow-hidden h-full">
            <div
              className="h-full bg-gray-200 bg-cover bg-center"
              style={{ backgroundImage: `url(${article.coverImage})` }}
            />
          </div>
        )}

        {/* Overlay du titre sur l'image */}
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <h1 className="text-4xl font-bold mb-4 drop-shadow-lg">
            {article.title}
          </h1>
          <div className="flex items-center gap-4 text-white/90">
            <span className="drop-shadow-md">{article.author}</span>
            <span>•</span>
            <span className="drop-shadow-md">
              {new Date(article.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Composant client pour les fonctionnalités interactives */}
      <ClientBlogPost article={article} />
    </div>
  );
}
