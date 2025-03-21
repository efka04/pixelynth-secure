// ImageProcessing.js

// Convertit une image PNG en JPG sans perte
export const convertToJPG = (file, quality) => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      const reader = new FileReader();
  
      reader.onload = (e) => {
        img.src = e.target.result;
      };
  
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
  
        ctx.drawImage(img, 0, 0);
  
        canvas.toBlob((blob) => {
          if (blob) {
            const jpgFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, ".jpg"),
              { type: 'image/jpeg' }
            );
            resolve(jpgFile);
          } else {
            reject(new Error('Canvas is empty'));
          }
        }, 'image/jpeg', quality / 100);
      };
  
      img.onerror = (error) => reject(error);
      reader.onerror = (error) => reject(error);
  
      reader.readAsDataURL(file);
    });
  };
  
  // Redimensionne une image (si nécessaire)
  export const resizeImage = (file, maxWidth, quality) => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      const reader = new FileReader();
  
      reader.onload = (e) => {
        img.src = e.target.result;
      };
  
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
  
        const scaleFactor = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scaleFactor;
  
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, ".jpg"),
              { type: 'image/jpeg' }
            );
            resolve(resizedFile);
          } else {
            reject(new Error('Canvas is empty'));
          }
        }, 'image/jpeg', quality / 100);
      };
  
      img.onerror = (error) => reject(error);
      reader.onerror = (error) => reject(error);
  
      reader.readAsDataURL(file);
    });
  };
  
  // Crée une version WebP de l'image
  export const createWebPVersion = (file, maxWidth, quality) => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      const reader = new FileReader();
  
      reader.onload = (e) => {
        img.src = e.target.result;
      };
  
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
  
        const scaleFactor = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scaleFactor;
  
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
        canvas.toBlob((blob) => {
          if (blob) {
            const webpFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, ".webp"),
              { type: 'image/webp' }
            );
            resolve(webpFile);
          } else {
            reject(new Error('Canvas is empty'));
          }
        }, 'image/webp', quality / 100);
      };
  
      img.onerror = (error) => reject(error);
      reader.onerror = (error) => reject(error);
  
      reader.readAsDataURL(file);
    });
  };
  
  // Détermine l'orientation d'une image
  export const determineOrientation = (img) => {
    if (img.width === img.height) return 'square';
    return img.width > img.height ? 'horizontal' : 'vertical';
  };
  