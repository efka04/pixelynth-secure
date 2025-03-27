import type { Metadata, ResolvingMetadata } from "next";
import { getPostBySlug } from "@/services/firebaseService";

// Define interface for Photo type
interface Photo {
  id?: string;
  title?: string;
  slug: string;
  description?: string;
  imageUrl: string;
  tags?: string[];
  createdAt?: string;
  author?: string;
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
  // Retrieve photo data - using await with params
  const { slug } = await params;
  const photo = await getPostBySlug(slug) as Photo | null;
  
  if (!photo) {
    return {
      title: "Photo Not Found | Pixelynth",
      description: "The photo you are looking for does not exist or has been removed.",
    };
  }
  
  // Create metadata based on photo data
  return {
    title: `Free Photo of a ${photo.title} | Pixelynth`,
    description: `Discover this AI-generated image on Pixelynth. Download it for free for commercial or personal use.`,
    keywords: "AI images, stock photos, free images, artificial intelligence, digital art, stock images, AI generated images, AI pictures, royalty-free, commercial use",
    openGraph: {
        title: photo.title || 'Pixelynth Photo',
        description: photo.description || `Discover this AI-generated image on Pixelynth. Download it for free for commercial or personal use.`,
        images: [photo.imageUrl],
        type: 'website', // Changed from 'image' to 'website' to match OpenGraph standard types
      },
    twitter: {
      card: 'summary_large_image',
      title: photo.title || 'Pixelynth Photo',
      description: photo.description || `Discover this AI-generated image on Pixelynth. Download it for free for commercial or personal use.`,
      images: [photo.imageUrl],
    },
  };
}

export default function PhotoDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
