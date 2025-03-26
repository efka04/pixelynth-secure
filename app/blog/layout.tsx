import type { Metadata, ResolvingMetadata } from "next";
import { getArticleBySlug } from "@/services/firebaseService";

// Définir l'interface pour le type Article
interface Article {
  id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage: string;
  author: string;
  createdAt: string;
  tags: string[];
}

type Props = {
  params: { slug: string };
  children: React.ReactNode;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Récupérer les données de l'article
  const article = await getArticleBySlug(params.slug) as Article | null;
  
  if (!article) {
    return {
      title: "Article non trouvé | Pixelynth",
      description: "L'article que vous recherchez n'existe pas ou a été supprimé.",
    };
  }
  
  // Créer des métadonnées basées sur les données de l'article
  return {
    title: `${article.title} | Pixelynth Blog`,
    description: article.excerpt || `Découvrez ${article.title} sur le blog Pixelynth.`,
    keywords: article.tags?.join(', ') || 'blog, pixelynth, AI images',
    openGraph: {
      title: article.title,
      description: article.excerpt || `Découvrez ${article.title} sur le blog Pixelynth.`,
      images: [article.coverImage],
      type: 'article',
      publishedTime: article.createdAt,
      authors: [article.author],
      tags: article.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt || `Découvrez ${article.title} sur le blog Pixelynth.`,
      images: [article.coverImage],
    },
  };
}

export default function BlogPostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
