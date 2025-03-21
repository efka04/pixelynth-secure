import { MetadataRoute } from 'next';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './db/firebaseConfig';
import fs from 'fs';
import path from 'path';

type ChangeFrequency = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';

interface SitemapEntry {
  url: string;
  lastModified: string;
  changeFrequency: ChangeFrequency;
  priority: number;
}

const generateSitemapXML = (entries: SitemapEntry[]): string => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(entry => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastModified}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
};

async function fetchPosts(): Promise<{ entries: SitemapEntry[]; uniqueTags: Set<string>; tagCounts: Map<string, number> }> {
  const postsRef = collection(db, 'post');
  const snapshot = await getDocs(postsRef);
  const uniqueTags = new Set<string>();
  const tagCounts = new Map<string, number>();

  const entries = snapshot.docs.map(doc => {
    const data = doc.data();
    if (Array.isArray(data.tags)) {
      data.tags.forEach((tag: string) => {
        uniqueTags.add(tag);
        // Incrémenter le compteur pour ce tag
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    }
    const sanitizedTitle = data.title
      ?.toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
      
    return {
      url: `https://pixelynth.com/photos/${sanitizedTitle}-${doc.id}`,
      lastModified: new Date(data.timestamp?.seconds * 1000 || Date.now()).toISOString(),
      changeFrequency: 'weekly' as ChangeFrequency,
      priority: 0.7
    };
  }).filter(post => post.url);

  return { entries, uniqueTags, tagCounts };
}

async function fetchBlogs(): Promise<SitemapEntry[]> {
  try {
    const articlesRef = collection(db, 'articles');
    const snapshot = await getDocs(articlesRef);
    console.log(`Found ${snapshot.size} article documents`);

    if (snapshot.empty) {
      console.warn('No article documents found. Verify that your collection name and Firebase rules are correct.');
    }

    return snapshot.docs.map(doc => {
      const data = doc.data();
      if (!data.slug) {
        console.warn(`Article document ${doc.id} is missing a slug.`);
        return null;
      }
      
      return {
        url: `https://pixelynth.com/blog/${data.slug}`,
        lastModified: new Date(data.timestamp?.seconds * 1000 || Date.now()).toISOString(),
        changeFrequency: 'weekly' as ChangeFrequency,
        priority: 0.9
      };
    }).filter((blog): blog is SitemapEntry => blog !== null);
  } catch (error) {
    console.error('Error fetching article documents:', error);
    return [];
  }
}

function generateStaticRoutes(): SitemapEntry[] {
  return [
    {
      url: 'https://pixelynth.com',
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily',
      priority: 1.0
    },
    {
      url: 'https://pixelynth.com/license',
      lastModified: new Date().toISOString(),
      changeFrequency: 'yearly',
      priority: 0.3
    }
  ];
}

function generateTagEntries(uniqueTags: Set<string>, tagCounts: Map<string, number>): SitemapEntry[] {
  // Filtrer pour ne garder que les tags avec plus de 10 photos
  return Array.from(uniqueTags)
    .filter(tag => (tagCounts.get(tag) || 0) >= 10)
    .map(tag => ({
      url: `https://pixelynth.com/tag/${encodeURIComponent(tag)}`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly' as ChangeFrequency,
      priority: 0.5
    }));
}

async function createSitemaps() {
  const publicDir = path.join(process.cwd(), 'public');

  const { entries: postEntries, uniqueTags, tagCounts } = await fetchPosts();
  const blogEntries = await fetchBlogs();

  console.log(`Generated ${postEntries.length} post entries`);
  console.log(`Generated ${blogEntries.length} blog entries`);

  const staticEntries = generateStaticRoutes();
  const tagEntries = generateTagEntries(uniqueTags, tagCounts);
  
  console.log(`Generated ${tagEntries.length} tag entries (filtered to include only tags with 10+ photos)`);

  const postsXML = generateSitemapXML(postEntries);
  const blogsXML = generateSitemapXML(blogEntries);
  const tagsXML = generateSitemapXML(tagEntries);
  const staticXML = generateSitemapXML(staticEntries);

  fs.writeFileSync(path.join(publicDir, 'sitemap-posts.xml'), postsXML);
  fs.writeFileSync(path.join(publicDir, 'sitemap-blogs.xml'), blogsXML);
  fs.writeFileSync(path.join(publicDir, 'sitemap-tags.xml'), tagsXML);
  fs.writeFileSync(path.join(publicDir, 'sitemap-static.xml'), staticXML);

  const today = new Date().toISOString().split('T')[0];
  const sitemapIndexXML = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://pixelynth.com/sitemap-static.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://pixelynth.com/sitemap-posts.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://pixelynth.com/sitemap-tags.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://pixelynth.com/sitemap-blogs.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`;

  fs.writeFileSync(path.join(publicDir, 'sitemap-index.xml'), sitemapIndexXML);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await createSitemaps();
  return generateStaticRoutes();
}
