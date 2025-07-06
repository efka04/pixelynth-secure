import type { Metadata, ResolvingMetadata } from "next";

export const metadata: Metadata = {
  title: "Blog | Pixelynth",
  description: "Discover the latest articles and news on Pixelynth.",
  keywords: "blog, pixelynth, AI images, articles, News",
  openGraph: {
    title: "Blog | Pixelynth",
    description: "Discover the latest articles and news on Pixelynth.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog | Pixelynth",
    description: "Discover the latest articles and news on Pixelynth.",
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
