'use client';
import React, { useEffect, useRef } from 'react';
import { convertFromRaw } from 'draft-js';
import '../components/RichTextEditor.css';
import DOMPurify from 'dompurify';

const ArticleContent = ({ content }) => {
  const twitterLoaded = useRef(false);
  
  // Function to load Twitter widgets script and handle visibility changes
  useEffect(() => {
    // Initial load of Twitter widgets
    loadTwitterWidgets();
    
    // Set up visibility change detection
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    // Clean up function
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [content]); // Re-run when content changes
  
  // Function to handle visibility change events
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      reloadTwitterWidgets();
    }
  };
  
  // Function to handle window focus events
  const handleFocus = () => {
    reloadTwitterWidgets();
  };
  
  // Function to load Twitter widgets initially
  const loadTwitterWidgets = () => {
    // Check if the script is already loaded
    if (!window.twttr) {
      const script = document.createElement('script');
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      script.charset = 'utf-8';
      
      script.onload = () => {
        // This will parse and render any tweet embeds on the page
        if (window.twttr && window.twttr.widgets) {
          window.twttr.widgets.load();
          twitterLoaded.current = true;
        }
      };
      
      document.body.appendChild(script);
    } else if (window.twttr && window.twttr.widgets) {
      // If the script is already loaded, just call load()
      window.twttr.widgets.load();
      twitterLoaded.current = true;
    }
  };
  
  // Function to reload Twitter widgets
  const reloadTwitterWidgets = () => {
    if (twitterLoaded.current && window.twttr && window.twttr.widgets) {
      // Find all Twitter embeds and reset them
      const twitterContainers = document.querySelectorAll('.twitter-embed-container');
      
      // If we found containers, reload the widgets
      if (twitterContainers.length > 0) {
        window.twttr.widgets.load();
      }
    } else {
      // If Twitter hasn't loaded yet, try loading it
      loadTwitterWidgets();
    }
  };

  try {
    const contentState = convertFromRaw(JSON.parse(content));
    
    const renderBlock = (block) => {
      const blockText = block.getText().trim();
      
      // Detect Twitter embed
      if (
        blockText.includes('<blockquote') ||
        blockText.includes('<script') ||
        (blockText.includes('twitter.com') && blockText.includes('pic.twitter.com'))
      ) {
        // Create a unique ID for this embed container
        const embedId = `twitter-embed-${block.getKey()}`;
        
        // For Twitter embeds that don't have full HTML
        if (!blockText.includes('<blockquote') && 
            (blockText.includes('twitter.com') && blockText.includes('pic.twitter.com'))) {
          // Create proper blockquote for plain text Twitter URLs
          const tweetUrl = blockText.match(/https:\/\/twitter\.com\/[^\s]+/);
          if (tweetUrl) {
            return (
              <div key={block.getKey()} id={embedId} className="twitter-embed-container">
                <blockquote className="twitter-tweet">
                  <a href={tweetUrl[0]}></a>
                </blockquote>
              </div>
            );
          }
        }
        
        // For embeds with HTML already
        return (
          <div 
          key={block.getKey()}
          id={embedId}
          className="twitter-embed-container"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(blockText) }}
        />
        );
      }
      
      // Rest of your existing block rendering code
      let Element = 'p';
      let className = '';
      
      // Segment text to integrate links if present
      const textSegments = [];
      let currentPosition = 0;
      
      block.findEntityRanges(
        (character) => character.getEntity() !== null,
        (start, end) => {
          if (currentPosition < start) {
            textSegments.push({
              type: 'text',
              text: blockText.slice(currentPosition, start),
              key: `text-${block.getKey()}-${currentPosition}`
            });
          }
          
          const entityKey = block.getEntityAt(start);
          const entity = contentState.getEntity(entityKey);
          
          if (entity.getType() === 'LINK') {
            textSegments.push({
              type: 'link',
              text: blockText.slice(start, end),
              data: entity.getData(),
              key: `link-${block.getKey()}-${start}`
            });
          }
          
          currentPosition = end;
        }
      );
      
      if (currentPosition < blockText.length) {
        textSegments.push({
          type: 'text',
          text: blockText.slice(currentPosition),
          key: `text-${block.getKey()}-${currentPosition}`
        });
      }
      
      const children = textSegments.map(segment => {
        if (segment.type === 'link') {
          return (
            <a
              key={segment.key}
              href={segment.data.url}
              className="editor-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              {segment.text}
            </a>
          );
        }
        return <span key={segment.key}>{segment.text}</span>;
      });
      
      if (children.length === 0) {
        children.push(blockText);
      }
      
      switch (block.getType()) {
        case 'header-one':
          Element = 'h1';
          className = 'header-one';
          break;
        case 'header-two':
          Element = 'h2';
          className = 'header-two';
          break;
        case 'header-three':
          Element = 'h3';
          className = 'header-three';
          break;
        case 'unordered-list-item':
          Element = 'li';
          className = 'unordered-list-item';
          break;
        case 'ordered-list-item':
          Element = 'li';
          className = 'ordered-list-item';
          break;
        default:
          className = 'paragraph';
      }
      
      return React.createElement(Element, { key: block.getKey(), className }, children);
    };
    
    // Trigger Twitter widget load after render
    useEffect(() => {
      if (window.twttr && window.twttr.widgets) {
        window.twttr.widgets.load();
      }
    }, []);
    
    return (
      <div className="article-content">
        {contentState.getBlocksAsArray().map(renderBlock)}
      </div>
    );
  } catch (error) {
    console.error('Error parsing content:', error);
    return <div>{content}</div>;
  }
};

export default ArticleContent;