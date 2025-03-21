export const BLUR_DATA_URL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4dHRsdHR4dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR3/2wBDABUREREeHR0jIyMeHR0eHR0eHR0eHR0eHR0eHR0eHR0eHR0eHR0eHR0eHR0eHR0eHR0eHR0eHR0eHR0eHR0eHR0eHR0eHR3/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';

export const preloadImage = (src) => {
  if (typeof window === 'undefined') return;
  const img = new Image();
  img.src = src;
};

export const convertToJpgUrl = (url) => {
  if (!url) return '';
  if (url.includes('/o/jpg%2F')) return url;
  
  try {
    const filenameMatch = url.match(/\/o\/images%2F([^?]+)/);
    if (!filenameMatch) return url;
    
    const filename = filenameMatch[1]
      .replace('.png', '')
      .split('&')[0];
    
    return `https://firebasestorage.googleapis.com/v0/b/pixelynth-c41ea.firebasestorage.app/o/jpg%2F${filename}.jpg?alt=media`;
  } catch (error) {
    console.error('Error converting URL:', error);
    return url;
  }
};

export const resizeImage = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          orientation: determineOrientation(img)
        });
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

export const determineOrientation = (img) => {
    if (img.width === img.height) return 'square';
    return img.width > img.height ? 'horizontal' : 'vertical';
};

const proxyServices = [
  {
    name: 'direct-nocors',
    fetch: async (url) => fetch(url, { mode: 'no-cors' })
  },
  {
    name: 'allorigins',
    fetch: async (url) => fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`)
  },
  {
    name: 'corsproxy',
    fetch: async (url) => fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`)
  }
];

export const fetchWithProxy = async (url, serviceIndex = 0) => {
  if (serviceIndex >= proxyServices.length) {
    throw new Error('All proxy services failed');
  }

  try {
    const service = proxyServices[serviceIndex];
    const response = await service.fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response;
  } catch (proxyError) {
    console.debug(`Proxy ${proxyServices[serviceIndex].name} failed:`, proxyError.message);
    return fetchWithProxy(url, serviceIndex + 1);
  }
};