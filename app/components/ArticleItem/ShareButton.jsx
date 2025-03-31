'use client';
import { FaShare } from 'react-icons/fa';

const ShareButton = ({ id }) => {
  const handleShare = async () => {
    const url = `${window.location.origin}/article/${id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check this out!',
          url: url
        });
      } catch (err) {
      }
    } else {
      await navigator.clipboard.writeText(url);
      // Here you could add a toast notification
    }
  };

  return (
    <button
      onClick={handleShare}
      className="text-gray-400 hover:text-gray-600 transition-colors"
      aria-label="Share"
    >
      <FaShare />
    </button>
  );
};

export default ShareButton;
