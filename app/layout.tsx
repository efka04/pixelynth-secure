import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Provider from "./Provider";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import Script from 'next/script';


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  keywords: "AI images, stock photos, free images, artificial intelligence, digital art, stock images, AI generated images, AI pictures, royalty-free, commercial use",
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

const schemaMarkup = {
  "@context": "http://schema.org",
  "@type": "WebSite",
  "url": "https://www.pixelynth.com",
  "name": "Pixelynth",
  "description": "Free AI-generated stock images for commercial and personal use",
  "provider": {
    "@type": "Organization",
    "name": "Pixelynth",
    "logo": {
      "@type": "ImageObject",
      "url": "https://pixelynth.com/logo-pixelynth.svg"
    }
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} strategy="lazyOnload" defer />
        <Script id="google-analytics" strategy="lazyOnload" defer>
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', { send_page_view: false });
          `}
        </Script>
        <script type="application/ld+json">
          {JSON.stringify(schemaMarkup)}
        </script>

        {/* Open Graph */}
        <meta property="og:title" content="Pixelynth - Free AI-Generated Stock Images for commercial use" />
        <meta property="og:description" content="Discover and download high-quality AI-generated stock images for free. Browse through categories like Food, Beauty, Fashion, and more. Start exploring now!" />
        <meta property="og:image" content="/opengraph-image.jpg" />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://www.pixelynth.com" />

        {/* Robots meta tag */}
        <meta name="robots" content="index, follow" />

        {/* Language meta tag */}
        <meta httpEquiv="Content-Language" content="en" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen pt-[60px]`}>
        <Provider> {/* Assure que toute l'app peut accéder à la session */}
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <SpeedInsights />
          <Analytics debug={false} />
        </Provider>
      </body>
    </html>
  );
}
