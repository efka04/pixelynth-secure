"use client"
import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import UploadImage from '@/app/components/uploadImage';
import { useSession } from 'next-auth/react';
import { getDownloadURL, getStorage, ref as storageRef, uploadBytes } from 'firebase/storage';
import { app, db } from '@/app/db/firebaseConfig';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import NextImage from 'next/image';
import CategorySelector from '@/app/components/form/CategorySelector';
import ColorPicker from '@/app/components/form/ColorPicker';
import PeopleOptions from '@/app/components/form/PeopleOptions';
import TagsInput from '@/app/components/form/TagsInput';
import { convertToJPG, createWebPVersion, determineOrientation } from '@/app/utils/ImageProcessing';
import { enhanceImageDataWithTags } from '@/app/utils/tagExtraction';

// Constants for validation
const MAX_TITLE_LENGTH = 40;
const MAX_DESCRIPTION_LENGTH = 300;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ImageUploadForm = forwardRef(
  ({ initialFile = null, onClose, isBulkUpload = false, isEditing = false, existingData = null }, ref) => {
    const { data: session } = useSession();
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedColor, setSelectedColor] = useState(existingData?.color || 'all');
    const [orientation, setOrientation] = useState(null);
    const [tags, setTags] = useState([]);
    const [currentTag, setCurrentTag] = useState('');
    const [peopleCount, setPeopleCount] = useState(0);
    const [errors, setErrors] = useState([]);
    const [preview, setPreview] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [selectedCategories, setSelectedCategories] = useState(existingData?.categories || []);
    const [isPublished, setIsPublished] = useState(false);
    const [copyrightAgreement, setCopyrightAgreement] = useState(false);
    const router = useRouter();
    const firebaseStorage = getStorage(app);

    // Prévisualisation et détermination de l'orientation
    useEffect(() => {
      if (initialFile) {
        // Validate file size
        if (initialFile.size > MAX_FILE_SIZE) {
          setErrors([`File size exceeds maximum allowed (${MAX_FILE_SIZE / (1024 * 1024)}MB)`]);
          return;
        }
        
        setFile(initialFile);
        const objectUrl = URL.createObjectURL(initialFile);
        setPreview(objectUrl);
        const img = new Image();
        img.onload = () => {
          setOrientation(determineOrientation(img));
        };
        img.src = objectUrl;
        return () => URL.revokeObjectURL(objectUrl);
      }
    }, [initialFile]);

    // Initialisation en mode édition
    useEffect(() => {
      if (isEditing && existingData) {
        setTitle(existingData.title || "");
        setDesc(existingData.desc || "");
        setPreview(existingData.imageURL || null);
        setSelectedColor(existingData.color || 'white');
        setOrientation(existingData.orientation || 'horizontal');
        setTags(existingData.tags || []);
        setPeopleCount(existingData.peopleCount || 0);
        setCopyrightAgreement(true); // Assume agreement for existing content
      }
    }, [isEditing, existingData]);

    const submitHandler = async () => {
      if (!validateForm()) return false;
      setLoading(true);
    
      try {
        let imageUrl = existingData?.imageURL;
        let webpURL = existingData?.webpURL;
        let postId;
    
        // 📌 Upload de l'image si un fichier est sélectionné
        if (file) {
          // Validate file size again before upload
          if (file.size > MAX_FILE_SIZE) {
            throw new Error(`File size exceeds maximum allowed (${MAX_FILE_SIZE / (1024 * 1024)}MB)`);
          }
          
          let uploadFile = file;
    
          if (uploadFile.type === "image/png") {
            uploadFile = await convertToJPG(uploadFile, 80);
          }
    
          const originalFileName = `${Date.now()}-${uploadFile.name}`;
          const originalImageRef = storageRef(firebaseStorage, `images/${originalFileName}`);
    
          await uploadBytes(originalImageRef, uploadFile);
          imageUrl = await getDownloadURL(originalImageRef);
    
          // 📌 Création de la version WebP
          const webpFile = await createWebPVersion(uploadFile, 650, 75);
          const webpFileName = originalFileName.replace(/\.[^/.]+$/, ".webp");
          const webpImageRef = storageRef(firebaseStorage, `webp/${webpFileName}`);
    
          await uploadBytes(webpImageRef, webpFile);
          webpURL = await getDownloadURL(webpImageRef);
        }
    
        if (!imageUrl && !isEditing) {
          throw new Error('No image URL available');
        }
    
        // 📌 Création des données de l'image
        let imageData = {
          title: title.trim(),
          desc: desc.trim(),
          lowercaseTitle: title.trim().toLowerCase(),
          lowercaseDesc: desc.trim().toLowerCase(),
          imageURL: imageUrl,
          webpURL: webpURL,
          categories: selectedCategories,
          color: selectedColor,
          orientation,
          tags,
          peopleCount,
          userName: session?.user?.username || session?.user?.email || 'Anonymous',
          userEmail: session?.user?.email || '',
          userImage: session?.user?.image || '',
          timestamp: new Date(),
          userId: session?.user?.id || session?.user?.email || 'unknown',
          createdAt: new Date().toISOString(),
          copyrightAgreement: true, // Store the copyright agreement status
        };
        
        // Extraire des tags supplémentaires à partir du titre et de la description
        imageData = enhanceImageDataWithTags(imageData);
    
        let docRef;
    
        // 📌 Si on édite un post existant
        if (isEditing && existingData?.id) {
          await setDoc(
            doc(db, "post", existingData.id),
            { ...imageData, updatedAt: new Date().toISOString() },
            { merge: true }
          );
          postId = existingData.id;
    
          // 🔥 Synchronisation avec MyImages
          if (session?.user?.email) {
            const myImagesRef = doc(db, 'users', session.user.email, 'MyImages', existingData.id);
            await setDoc(myImagesRef, { ...imageData, updatedAt: new Date().toISOString() }, { merge: true });
          }
    
        } else {
          // 📌 Création d'un nouveau post
          docRef = await addDoc(collection(db, "temporary"), imageData);
          postId = docRef.id;
    
          // 🔥 Ajout dans MyImages avec le même ID
          if (session?.user?.email) {
            const userDocRef = doc(db, 'users', session.user.email);
            await setDoc(userDocRef, { email: session.user.email, updatedAt: new Date() }, { merge: true });
    
            const myImagesRef = doc(db, 'users', session.user.email, 'MyImages', postId);
            await setDoc(myImagesRef, { ...imageData, originalPostId: postId, addedAt: new Date() });
          }
        }
    
        setIsPublished(true);
        setSuccessMessage('Successfully published!');
    
        if (!isBulkUpload) {
          setTimeout(() => {
            if (onClose) onClose();
            else router.push('/');
          }, 2000);
        }
    
        return true;
    
      } catch (error) {
        console.error('Submit error:', error);
        setErrors([error.message || "Failed to upload image"]);
        return false;
    
      } finally {
        setLoading(false);
      }
    };
    

    useImperativeHandle(ref, () => ({
      submitForm: submitHandler,
      isPublished: isPublished,
    }));

    const validateForm = () => {
      const newErrors = [];
      
      // Title validation
      if (!title) {
        newErrors.push("Title is required");
      } else if (title.trim().length > MAX_TITLE_LENGTH) {
        newErrors.push(`Title must be ${MAX_TITLE_LENGTH} characters or less`);
      }
      
      // Description validation
      if (!desc) {
        newErrors.push("Description is required");
      } else if (desc.trim().length > MAX_DESCRIPTION_LENGTH) {
        newErrors.push(`Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`);
      }
      
      // File validation
      if (!isEditing && !file) {
        newErrors.push("Image is required");
      } else if (file) {
        if (file.type !== "image/jpeg" && file.type !== "image/png") {
          newErrors.push("Only JPG and PNG files are allowed");
        }
        if (file.size > MAX_FILE_SIZE) {
          newErrors.push(`File size exceeds maximum allowed (${MAX_FILE_SIZE / (1024 * 1024)}MB)`);
        }
      }
      
      // Category validation
      if (selectedCategories.length === 0) {
        newErrors.push("At least one category is required");
      }
      
      // Color validation
      if (selectedColor === 'white') {
        newErrors.push("Please select a color");
      }
      
      // Tag validation
      if (tags.length > 20) {
        newErrors.push("Maximum 20 tags allowed");
      }
      
      // Copyright agreement validation
      if (!copyrightAgreement) {
        newErrors.push("You must certify that you own the rights and agree to transfer them");
      }
      
      setErrors(newErrors);
      return newErrors.length === 0;
    };

    const handleAddTag = (e) => {
      e.preventDefault();
      if (currentTag.trim() && tags.length < 20 && !tags.includes(currentTag.trim())) {
        // Limit tag length to 30 characters
        const trimmedTag = currentTag.trim().substring(0, 30);
        setTags([...tags, trimmedTag]);
        setCurrentTag('');
      }
    };

    const removeTag = (tagToRemove) => {
      setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleCategoryToggle = (category) => {
      setSelectedCategories(prev =>
        prev.includes(category)
          ? prev.filter(c => c !== category)
          : [...prev, category]
      );
    };

    if (isPublished) {
      return (
        <div className="w-full min-h-[600px] flex items-center justify-center bg-green-50 rounded-xl border border-green-200 p-4 md:p-6">
          <div className="text-center space-y-4">
            <div className="text-green-500 text-lg md:text-xl font-semibold">
              Successfully Published!
            </div>
            <div className="text-green-600 text-xs md:text-sm">
              Your image has been uploaded
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full">
        <div className="flex flex-col mx-auto gap-0 overflow-y-auto overflow-x-hidden relative bg-white border border-black rounded-xl p-3 md:p-6">
          {preview ? (
            <div className="relative w-full h-[150px] md:h-[200px] flex items-center justify-center bg-gray-50 rounded-md mb-4">
              <div className="relative w-full h-full">
                <NextImage 
                  src={preview}
                  alt="Preview"
                  fill
                  style={{ objectFit: 'contain' }}
                  className="rounded-md"
                  unoptimized={true}
                />
              </div>
            </div>
          ) : (
            <UploadImage setFile={setFile} />
          )}
          
          <div className="relative">
            <input
              type="text"
              placeholder="Add your title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full text-xl md:text-2xl font-bold border-b-2 ${
                title.length > MAX_TITLE_LENGTH ? 'border-red-500' : 'border-gray-200'
              } outline-none py-1 md:py-2 my-1`}
              maxLength={MAX_TITLE_LENGTH + 10} // Allow typing a bit more to show the error
            />
            <div className={`text-xs ${
              title.length > MAX_TITLE_LENGTH ? 'text-red-500' : 'text-gray-500'
            } text-right`}>
              {title.length}/{MAX_TITLE_LENGTH}
            </div>
          </div>
          
          <div className="relative">
            <textarea
              placeholder="Add a detailed description"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className={`w-full h-16 md:h-24 border-b ${
                desc.length > MAX_DESCRIPTION_LENGTH ? 'border-red-500' : 'border-gray-200'
              } outline-none py-1 my-1 resize-none text-sm md:text-base`}
              maxLength={MAX_DESCRIPTION_LENGTH + 50} // Allow typing a bit more to show the error
            />
            <div className={`text-xs ${
              desc.length > MAX_DESCRIPTION_LENGTH ? 'text-red-500' : 'text-gray-500'
            } text-right`}>
              {desc.length}/{MAX_DESCRIPTION_LENGTH}
            </div>
          </div>
          
          <CategorySelector selectedCategories={selectedCategories} onToggle={handleCategoryToggle} />
          <ColorPicker selectedColor={selectedColor} onSelect={setSelectedColor} />
          <PeopleOptions peopleCount={peopleCount} onSelect={setPeopleCount} />
          <TagsInput
            tags={tags}
            currentTag={currentTag}
            onChange={(e) => setCurrentTag(e.target.value.substring(0, 30))} // Limit tag input to 30 chars
            onAdd={handleAddTag}
            onRemove={removeTag}
            disabled={tags.length >= 20}
          />

          <div className="mt-4 mb-2">
            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                checked={copyrightAgreement}
                onChange={(e) => setCopyrightAgreement(e.target.checked)}
                className="mt-1 mr-2 h-4 w-4 text-black border-gray-300 rounded focus:ring-black"
              />
              <span className={`text-sm ${!copyrightAgreement && errors.length > 0 ? 'text-red-500' : 'text-gray-700'}`}>
                I certify that I own the rights and agree to transfer them
              </span>
            </label>
          </div>

          {errors.length > 0 && (
            <div className="mb-3 md:mb-4 p-3 md:p-4 bg-red-50 border border-red-200 rounded-md">
              {errors.map((error, index) => (
                <p key={index} className="text-red-500 text-sm">
                  • {error}
                </p>
              ))}
            </div>
          )}

          <button
            onClick={submitHandler}
            disabled={loading || title.length > MAX_TITLE_LENGTH || desc.length > MAX_DESCRIPTION_LENGTH}
            className="bg-black text-white px-3 md:px-4 py-1 md:py-1.5 rounded-md mt-2 w-full disabled:bg-gray-300 disabled:cursor-not-allowed text-xs md:text-sm"
          >
            {loading ? 'Publishing...' : isEditing ? 'Update' : 'Publish'}
          </button>
          {successMessage && (
            <div className="mt-4 p-2 bg-green-100 border border-green-200 text-green-700 rounded">
              {successMessage}
            </div>
          )}
        </div>
      </div>
    );
  }
);

ImageUploadForm.displayName = 'ImageUploadForm';

export default ImageUploadForm;
