import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Pixelynth",
  description: "Learn how Pixelynth protects your personal data and respects your privacy. Read our complete privacy policy.",
  keywords: "AI images, stock photos, free images, artificial intelligence, digital art, stock images, AI generated images, AI pictures, royalty-free, commercial use",
  openGraph: {
    title: "Privacy Policy | Pixelynth",
    description: "Learn how Pixelynth protects your personal data and respects your privacy. Read our complete privacy policy.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Privacy Policy | Pixelynth",
    description: "Learn how Pixelynth protects your personal data and respects your privacy. Read our complete privacy policy.",
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
