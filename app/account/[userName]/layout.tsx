import type { Metadata, ResolvingMetadata } from "next";

// Define interface for User type
interface User {
  userName: string;
  displayName?: string;
  bio?: string;
  profileImage?: string;
}

type Params = {
  userName: string;
};

type Props = {
  params: Promise<Params>;
  children: React.ReactNode;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Get username from parameters - using await with params
  const { userName } = await params;
  
  // Here, you could retrieve user data from an API or database
  // const user = await getUserByUserName(userName) as User | null;
  
  return {
    title: `${userName}'s Profile | Pixelynth`,
    description: `Discover ${userName}'s profile and image collections on Pixelynth. Explore their creations and favorite images.`,
    keywords: "AI images, stock photos, free images, artificial intelligence, digital art, stock images, AI generated images, AI pictures, royalty-free, commercial use",
    openGraph: {
      title: `${userName}'s Profile | Pixelynth`,
      description: `Discover ${userName}'s profile and image collections on Pixelynth. Explore their creations and favorite images.`,
      type: "profile",
    },
    twitter: {
      card: "summary",
      title: `${userName}'s Profile | Pixelynth`,
      description: `Discover ${userName}'s profile and image collections on Pixelynth. Explore their creations and favorite images.`,
    },
    robots: {
      index: false,
      follow: true,
    }
  };
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
