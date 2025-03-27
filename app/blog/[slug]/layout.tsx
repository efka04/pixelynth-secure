import type { Metadata, ResolvingMetadata } from "next";
import { getArticleBySlug } from "@/services/firebaseService";

// Define interface for Article type
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

type Params = {
  slug: string;
};

type Props = {
  params: Promise<Params>;
  children: React.ReactNode;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Retrieve article data - using await with params
  const { slug } = await params;
  const article = await getArticleBySlug(slug) as Article | null;
  
  if (!article) {
    return {
      title: "Article Not Found | Pixelynth",
      description: "The article you are looking for does not exist or has been removed.",
    };
  }
  
  // Extract excerpt from content if possible
  let excerpt = "";
  try {
    const contentObj = JSON.parse(article.content);
    if (contentObj.html) {
      // Extract text from HTML (simplified version)
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = contentObj.html;
      excerpt = tempDiv.textContent || "";
      // Limit to 160 characters for description
      excerpt = excerpt.substring(0, 157) + "...";
    }
  } catch (e) {
    // In case of error, use title as description
    excerpt = `Discover ${article.title} on Pixelynth Blog.`;
  }
  
  // Create metadata based on article data
  return {
    title: `${article.title} | Pixelynth Blog`,
    description: article.excerpt || excerpt,
    keywords: "AI images, stock photos, free images, artificial intelligence, digital art, stock images, AI generated images, AI pictures, royalty-free, commercial use",
    openGraph: {
      title: article.title,
      description: article.excerpt || excerpt,
      images: [article.coverImage],
      type: 'article',
      publishedTime: article.createdAt,
      authors: [article.author],
      tags: article.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt || excerpt,
      images: [article.coverImage],
    },
  };
}

export default function BlogPostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
