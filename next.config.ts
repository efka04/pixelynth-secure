import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["lh3.googleusercontent.com", "firebasestorage.googleapis.com"],
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: "/photo/fashion-design-streetwear-3",
        destination: "/photos/Fashion-design-streetwear-2-hQ52YzrEkzUKaz3Ip3Qh",
        permanent: true, // 301 redirect
      },
      {
        source: "/photos/fried-fish",
        destination: "/photos/Fried-Fish-8F7WbZiIryHqHGMEdHsH",
        permanent: true, // 301 redirect
      },
      {
        source: "/photo/gloves-holding-a-bag-02",
        destination: "/photos/Gloves-holding-a-bag-03-xROkU90prMJvsOBvYITP",
        permanent: true, // 301 redirect
      },
      {
        source: "/photo-tag/cosmetics",
        destination: "/tag/cosmetics",
        permanent: true, // 301 redirect
      },
      {
        source: "/photo/stew-soup",
        destination: "/photos/Hawaiian-Beef-Stew-2-djmpPf4n9Gxmq8tJ4goW",
        permanent: true, // 301 redirect
      },
      {
        source: "/photo/oil-drop-2",
        destination: "/photos/Gloves-holding-a-bag-03-xROkU90prMJvsOBvYITP",
        permanent: true, // 301 redirect
      },
      {
        source: "/photo/basketball-player-2",
        destination: "/photos/Basketball-Player-OQuVMqo2yoIxLvj8PLIL",
        permanent: true, // 301 redirect
      },
      {
        source: "/photo/oil-drop",
        destination: "/photos/Gloves-holding-a-bag-03-xROkU90prMJvsOBvYITP",
        permanent: true, // 301 redirect
      },
      {
        source: "/photo/a-golden-tray-reflecting-a-woman-face",
        destination: "/photos/A-golden-tray-reflecting-a-woman-face-nKkmfA1jSLy9AkzMJ01d",
        permanent: true, // 301 redirect
      },
      {
        source: "/photo/digital-human-light-2",
        destination: "/photos/Digital-human-light-1Kr2HOjH3GDKbhP3Gt4Q",
        permanent: true, // 301 redirect
      },
      {
        source: "/photo/car-on-fire-falling-of-cliff",
        destination: "/photos/Car-on-fire-falling-off-cliff-FUFZwMJZnKTAMy0R5H9K",
        permanent: true, // 301 redirect
      },
      {
        source: "/photo/pink-lipstick-product-photography",
        destination: "/photos/Pink-lipstick-product-photography-lZp0GK32seINVn8zLFny",
        permanent: true, // 301 redirect
      },
      {
        source: "/photo/water-droplets-on-a-window",
        destination: "/photos/Water-droplets-on-a-window-eSLVEvefjF6pcPO4oWsA",
        permanent: true, // 301 redirect
      },
      {
        source: "/photo/fried-fish",
        destination: "/photos/Fried-Fish-8F7WbZiIryHqHGMEdHsH",
        permanent: true, // 301 redirect
      },
      {
        source: "/photo/tennis-socks-3",
        destination: "/photos/Tennis-&-socks-1mCF09IfSOBoyaroAmZC",
        permanent: true, // 301 redirect
      },
      {
        source: "/photos/Suitcase-lk2KN6mHoRH9RsC5rEBl",
        destination: "/photos/Suitcase-on-a-tennis-court-wPxdX4Ahcy6VEKGP6twi",
        permanent: true, // 301 redirect
      },
      {
        source: "/photo/black-clay-texture",
        destination: "/photos/Black-clay-texture-5lUXOF5vqN3gDj88h2CG",
        permanent: true, // 301 redirect
      },
      {
        source: "/photo/black-coffee-and-croissant",
        destination: "/photos/Black-coffee-and-Croissant-dxdQHdM0oUaxFBpe4faj",
        permanent: true, // 301 redirect
      },
      {
        source: "/photo/fashion-spacesuit-model",
        destination: "/photos/Astronaut-stands-on-the-moon’s-surface-CzuipzBfizGOKSBOvUNM",
        permanent: true, // 301 redirect
      },
      {
        source: "/photo/male-silhouette-on-a-roof",
        destination: "/photos/Male-silhouette-on-a-roof-PhJ1Kv7BbnSDbSnn2N40",
        permanent: true, // 301 redirect
      }

    ];
  },
  // Ensure no custom rewrites or redirects override the 404 behavior
  // If you have rewrites or redirects, make sure they don't conflict with unmatched routes
};
export default nextConfig;


