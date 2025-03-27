import type { Metadata, ResolvingMetadata } from "next";

export const metadata: Metadata = {
  title: "Blog | Pixelynth",
  description: "Découvrez les derniers articles et actualités sur Pixelynth.",
  keywords: "blog, pixelynth, AI images, articles, actualités",
  openGraph: {
    title: "Blog | Pixelynth",
    description: "Découvrez les derniers articles et actualités sur Pixelynth.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog | Pixelynth",
    description: "Découvrez les derniers articles et actualités sur Pixelynth.",
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
