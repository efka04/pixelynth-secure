import type { Metadata, ResolvingMetadata } from "next";

// Define interface for Search Query type
type Params = {
  query: string;
};

type Props = {
  params: Promise<Params>;
  children: React.ReactNode;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Decode search query - using await with params
  const { query } = await params;
  let decodedQuery = "";
  if (query) {
    // Step 1: decode URL
    decodedQuery = decodeURIComponent(query);
    // Step 2: replace hyphens with spaces
    decodedQuery = decodedQuery.replace(/-/g, ' ');
  }
  
  return {
    title: `Free Images of ${decodedQuery} | Pixelynth`,
    description: `Discover AI-generated images of "${decodedQuery}" on Pixelynth. Download free photos for commercial or personal use.`,
    keywords: "AI images, stock photos, free images, artificial intelligence, digital art, stock images, AI generated images, AI pictures, royalty-free, commercial use",
    openGraph: {
      title: `Search: ${decodedQuery} | Pixelynth`,
      description: `Discover AI-generated images matching "${decodedQuery}" on Pixelynth. Download free photos for commercial or personal use.`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `Search: ${decodedQuery} | Pixelynth`,
      description: `Discover AI-generated images matching "${decodedQuery}" on Pixelynth. Download free photos for commercial or personal use.`,
    },
    robots: {
      index: false,
      follow: true,
    }
  };
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
