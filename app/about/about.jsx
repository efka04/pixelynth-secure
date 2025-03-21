import React from 'react';

const About = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-6">About Us</h2>
      <div className="prose max-w-none">
        <p className="text-lg mb-4">
          Welcome to Pixelynth, where we combine creativity with technology.
        </p>
        <div className="grid md:grid-cols-2 gap-8 mt-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
            <p>At Pixelynth, our mission is to democratize access to high-quality stock images through AI technology. We believe that creative professionals and businesses of all sizes should have access to diverse, unique, and professional imagery without the high costs traditionally associated with stock photography.</p>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
            <p>We envision a future where AI-generated imagery becomes the standard for digital content creation, enabling unlimited creative possibilities while maintaining the highest quality standards. Pixelynth aims to be at the forefront of this revolution, providing the most comprehensive library of AI-generated stock images for commercial and personal use.</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default About;
