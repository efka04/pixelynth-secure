'use client';
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
    EditorState, 
    RichUtils, 
    CompositeDecorator, 
    convertToRaw, 
    convertFromRaw,
    getDefaultKeyBinding,
    Modifier
} from 'draft-js';
import {
    FaBold,
    FaCode,
    FaHeading,
    FaItalic,
    FaListOl,
    FaListUl,
    FaUnderline,
    FaChevronDown,
    FaLink,
    FaImage,
} from 'react-icons/fa';
import './RichTextEditor.css';

const HeadingControls = [
    { label: 'Normal Text', name: 'unstyled' },
    { label: 'Heading 1', name: 'header-one' },
    { label: 'Heading 2', name: 'header-two' },
    { label: 'Heading 3', name: 'header-three' },
];

const InlineControls = [
    {
        icon: <FaBold title="bold" />,
        name: 'BOLD',
    },
    {
        icon: <FaItalic title="italic" />,
        name: 'ITALIC',
    },
    {
        icon: <FaUnderline title="underline" />,
        name: 'UNDERLINE',
    },
    {
        icon: <FaCode title="code" />,
        name: 'CODE',
    },
    {
        icon: <FaLink title="link" />,
        name: 'LINK',
    },
    {
        icon: <FaImage title="image" />,
        name: 'IMAGE',
    }
];

const BlockControls = [
    {
        icon: <FaListUl title="unordered list" />,
        name: 'unordered-list-item',
    },
    {
        icon: <FaListOl title="ordered list" />,
        name: 'ordered-list-item',
    },
];

const Link = (props) => {
  const { url } = props.contentState.getEntity(props.entityKey).getData();
  return (
    <a href={url} className="editor-link">
      {props.children}
    </a>
  );
};

const Image = (props) => {
  const { src, alt, width, height } = props.contentState.getEntity(props.entityKey).getData();
  return (
    <img 
      src={src} 
      alt={alt || ''} 
      style={{ 
        width: width || 'auto', 
        height: height || 'auto',
        maxWidth: '100%',
        display: 'block',
        margin: '10px 0'
      }}
      className="editor-image" 
    />
  );
};

const findLinkEntities = (contentBlock, callback, contentState) => {
  contentBlock.findEntityRanges(
    (character) => {
      const entityKey = character.getEntity();
      return (
        entityKey !== null &&
        contentState.getEntity(entityKey).getType() === 'LINK'
      );
    },
    callback
  );
};

const findImageEntities = (contentBlock, callback, contentState) => {
  contentBlock.findEntityRanges(
    (character) => {
      const entityKey = character.getEntity();
      return (
        entityKey !== null &&
        contentState.getEntity(entityKey).getType() === 'IMAGE'
      );
    },
    callback
  );
};

const decorator = new CompositeDecorator([
  {
    strategy: findLinkEntities,
    component: Link,
  },
  {
    strategy: findImageEntities,
    component: Image,
  }
]);

const DraftEditor = dynamic(
  () => import('draft-js').then(mod => {
    const { Editor } = mod;
    return props => <Editor {...props} />;
  }),
  {
    ssr: false,
    loading: () => <div className="editor-placeholder">Loading editor...</div>
  }
);

const App = ({ value, onChange }) => {
    const [editorState, setEditorState] = useState(() => {
        if (value) {
            try {
                const contentState = convertFromRaw(JSON.parse(value));
                return EditorState.createWithContent(contentState, decorator);
            } catch (error) {
                return EditorState.createEmpty(decorator);
            }
        }
        return EditorState.createEmpty(decorator);
    });

    const [showHeadingMenu, setShowHeadingMenu] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [showImageInput, setShowImageInput] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    const [imageAlt, setImageAlt] = useState('');
    const [imageWidth, setImageWidth] = useState('auto');
    const [imageHeight, setImageHeight] = useState('auto');

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (value) {
            try {
                const contentState = convertFromRaw(JSON.parse(value));
                const newEditorState = EditorState.createWithContent(contentState, decorator);
                setEditorState(newEditorState);
            } catch (error) {
            }
        }
    }, [value]);

    const toggleBlockType = (blockType) => {
        const newState = RichUtils.toggleBlockType(editorState, blockType);
        handleEditorChange(newState);
    };

    const toggleInlineStyle = (inlineStyle) => {
        if (inlineStyle === 'LINK') {
            setShowLinkInput(!showLinkInput);
            setShowImageInput(false);
            return;
        }
        if (inlineStyle === 'IMAGE') {
            setShowImageInput(!showImageInput);
            setShowLinkInput(false);
            return;
        }
        setEditorState(RichUtils.toggleInlineStyle(editorState, inlineStyle));
    };

    const addLink = () => {
        const selection = editorState.getSelection();
        if (!selection.isCollapsed()) {
            const contentState = editorState.getCurrentContent();
            const contentStateWithEntity = contentState.createEntity(
                'LINK',
                'MUTABLE',
                { url: linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}` }
            );
            const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
            let newEditorState = EditorState.set(editorState, {
                currentContent: contentStateWithEntity
            });
            newEditorState = RichUtils.toggleLink(
                newEditorState,
                selection,
                entityKey
            );
            handleEditorChange(newEditorState);
            setShowLinkInput(false);
            setLinkUrl('');
        }
    };

    const addImage = () => {
        const contentState = editorState.getCurrentContent();
        const contentStateWithEntity = contentState.createEntity(
            'IMAGE',
            'IMMUTABLE',
            { 
                src: imageUrl,
                alt: imageAlt,
                width: imageWidth,
                height: imageHeight
            }
        );
        const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
        
        const selection = editorState.getSelection();
        const textWithEntity = Modifier.insertText(
            contentStateWithEntity,
            selection,
            ' ', // Espace pour contenir l'entité
            null,
            entityKey
        );
        
        let newEditorState = EditorState.push(
            editorState,
            textWithEntity,
            'insert-characters'
        );
        
        // Déplacer le curseur après l'image
        newEditorState = EditorState.moveSelectionToEnd(newEditorState);
        
        handleEditorChange(newEditorState);
        setShowImageInput(false);
        setImageUrl('');
        setImageAlt('');
        setImageWidth('auto');
        setImageHeight('auto');
    };

    const controlButton = (index, isSelected, toggle, icon) => (
        <div
            key={index}
            className={`button ${isSelected ? 'selected' : ''}`}
            onClick={toggle}
        >
            {icon}
        </div>
    );

    const getCurrentBlockType = () => {
        const selection = editorState.getSelection();
        return editorState
            .getCurrentContent()
            .getBlockForKey(selection.getStartKey())
            .getType();
    };

    const getCurrentHeadingLabel = () => {
        const currentType = getCurrentBlockType();
        const heading = HeadingControls.find(h => h.name === currentType);
        return heading ? heading.label : 'Normal Text';
    };

    const blockStyleFn = (contentBlock) => {
        const type = contentBlock.getType();
        switch (type) {
            case 'header-one':
                return 'header-one text-direction-ltr';
            case 'header-two':
                return 'header-two text-direction-ltr';
            case 'header-three':
                return 'header-three text-direction-ltr';
            case 'unstyled':
                return 'paragraph text-direction-ltr';
            default:
                return `${type} text-direction-ltr`;
        }
    };

    const handleEditorChange = (newEditorState) => {
        setEditorState(newEditorState);
        const contentState = newEditorState.getCurrentContent();
        const rawContent = convertToRaw(contentState);
        onChange(JSON.stringify(rawContent));
    };

    const handleKeyCommand = (command, editorState) => {
        if (command === 'split-block') {
            const newState = RichUtils.handleKeyCommand(editorState, command);
            if (newState) {
                handleEditorChange(newState);
                return 'handled';
            }
        }
        
        const newState = RichUtils.handleKeyCommand(editorState, command);
        if (newState) {
            handleEditorChange(newState);
            return 'handled';
        }
        return 'not-handled';
    };

    const keyBindingFn = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            return 'split-block';
        }
        return getDefaultKeyBinding(e);
    };

    if (!isMounted) {
        return <div className="editor-placeholder">Loading editor...</div>;
    }

    return (
        <div className="editor-wrapper">
            <div className="editor-top">
                <div className="heading-dropdown">
                    <div
                        className="dropdown-button"
                        onClick={() => setShowHeadingMenu(!showHeadingMenu)}
                    >
                        <span>{getCurrentHeadingLabel()}</span>
                        <FaChevronDown />
                    </div>
                    {showHeadingMenu && (
                        <div className="dropdown-content">
                            {HeadingControls.map((heading, index) => (
                                <div
                                    key={index}
                                    className={`dropdown-item ${getCurrentBlockType() === heading.name ? 'selected' : ''}`}
                                    onClick={() => {
                                        toggleBlockType(heading.name);
                                        setShowHeadingMenu(false);
                                    }}
                                >
                                    {heading.label}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {InlineControls.map((control, index) => {
                    const currentStyle = editorState.getCurrentInlineStyle();
                    return controlButton(
                        index,
                        currentStyle.has(control.name),
                        () => toggleInlineStyle(control.name),
                        control.icon
                    );
                })}

                {BlockControls.map((control, index) => {
                    const selection = editorState.getSelection();
                    const blockType = editorState
                        .getCurrentContent()
                        .getBlockForKey(selection.getStartKey())
                        .getType();
                    return controlButton(
                        index,
                        control.name === blockType,
                        () => toggleBlockType(control.name),
                        control.icon
                    );
                })}

                {showLinkInput && (
                    <div className="link-input-wrapper">
                        <input
                            type="url"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            placeholder="Entrez l'URL..."
                            className="link-input"
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    addLink();
                                }
                            }}
                        />
                        <button
                            className="button"
                            onClick={addLink}
                        >
                            Ajouter
                        </button>
                    </div>
                )}

                {showImageInput && (
                    <div className="image-input-wrapper">
                        <input
                            type="url"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            placeholder="URL de l'image..."
                            className="image-input"
                        />
                        <input
                            type="text"
                            value={imageAlt}
                            onChange={(e) => setImageAlt(e.target.value)}
                            placeholder="Description (alt)..."
                            className="image-input"
                        />
                        <div className="image-dimensions">
                            <input
                                type="text"
                                value={imageWidth}
                                onChange={(e) => setImageWidth(e.target.value)}
                                placeholder="Largeur (auto, px, %)"
                                className="image-dimension-input"
                            />
                            <input
                                type="text"
                                value={imageHeight}
                                onChange={(e) => setImageHeight(e.target.value)}
                                placeholder="Hauteur (auto, px, %)"
                                className="image-dimension-input"
                            />
                        </div>
                        <button
                            className="button"
                            onClick={addImage}
                        >
                            Insérer l'image
                        </button>
                    </div>
                )}
            </div>
            <div className="editor-content">
                <DraftEditor
                    editorState={editorState}
                    onChange={handleEditorChange}
                    blockStyleFn={blockStyleFn}
                    handleKeyCommand={handleKeyCommand}
                    keyBindingFn={keyBindingFn}
                    textDirection="ltr"
                />
            </div>
        </div>
    );
};

export default App;