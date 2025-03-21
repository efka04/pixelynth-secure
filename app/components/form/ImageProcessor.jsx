
import React from 'react';

const ImageProcessor = ({ onProcessed }) => {
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (event) => {
      img.src = event.target.result;
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 150;
      canvas.height = 150;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, 150, 150);
      canvas.toBlob(
        (blob) => {
          const processedFile = new File([blob], 'profile.webp', {
            type: 'image/webp',
          });
          const processedUrl = URL.createObjectURL(blob);
          onProcessed(processedFile, processedUrl);
        },
        'image/webp',
        0.8
      );
    };

    reader.readAsDataURL(file);
  };

  return (
    <input
      type="file"
      accept="image/*"
      onChange={handleImageChange}
      className="hidden"
    />
  );
};

export default ImageProcessor;