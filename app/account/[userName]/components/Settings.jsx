'use client';
import { useState, useEffect, useRef } from 'react';
import { doc, updateDoc, getDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db, storage } from '@/app/db/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import NextImage from 'next/image'; // Renommé pour éviter le conflit

const MAX_FILE_SIZE = 1024 * 1024; // 1Mo en bytes
const MAX_DIMENSIONS = 500; // 500px max
const TARGET_SIZE = 300; // Taille finale de l'image

function cropAndResizeImage(file) {
    return new Promise((resolve, reject) => {
        const img = new window.Image(); // Utiliser l'objet Image du navigateur explicitement
        img.onload = () => {
            // Créer un canvas
            const canvas = document.createElement('canvas');
            canvas.width = TARGET_SIZE;
            canvas.height = TARGET_SIZE;
            const ctx = canvas.getContext('2d');

            // Calculer les dimensions du crop
            const size = Math.min(img.width, img.height);
            const startX = (img.width - size) / 2;
            const startY = (img.height - size) / 2;

            // Dessiner l'image croppée et redimensionnée
            ctx.drawImage(
                img,
                startX, startY,     // Point de départ du crop
                size, size,         // Taille du crop
                0, 0,               // Position sur le canvas
                TARGET_SIZE, TARGET_SIZE  // Taille finale
            );

            // Convertir en WebP
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(new File([blob], 'profile.webp', { type: 'image/webp' }));
                    } else {
                        reject(new Error('Failed to convert image'));
                    }
                },
                'image/webp',
                0.8  // Qualité de compression
            );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
    });
}

export default function Settings() {
    const { data: session } = useSession();
    const params = useParams();
    const [formData, setFormData] = useState({
        name: '',
        lastName: '',
        username: '',
        bio: '',
        location: '',
        personalSite: '',
        instagram: '',
        profileImage: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const fileInputRef = useRef(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [imageError, setImageError] = useState('');
    const [usernameError, setUsernameError] = useState('');
    const [oldUsername, setOldUsername] = useState('');

    // Charger les données initiales
    useEffect(() => {
        const loadUserData = async () => {
            if (!session?.user?.email) return;
            
            try {
                const userRef = doc(db, 'users', session.user.email);
                const userDoc = await getDoc(userRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setFormData(prev => ({
                        ...prev,
                        ...userData
                    }));
                    setOldUsername(userData.username); // Sauvegarder l'ancien username
                }
            } catch (error) {
                console.error('Error loading user data:', error);
            }
        };

        loadUserData();
    }, [session]);

    const checkUsernameAvailability = async (username) => {
        if (!username || username === formData.username) return true;
        
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', username));
        const querySnapshot = await getDocs(q);
        return querySnapshot.empty;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!session?.user?.email) {
            setMessage('Please login to update your profile');
            return;
        }

        setLoading(true);
        try {
            // Vérifier la disponibilité du username
            setIsCheckingUsername(true);
            const isUsernameAvailable = await checkUsernameAvailability(formData.username);
            
            if (!isUsernameAvailable) {
                setUsernameError('This username is already taken');
                return;
            }
            setUsernameError('');

            // 1. Mettre à jour le profil utilisateur
            const userRef = doc(db, 'users', session.user.email);
            await updateDoc(userRef, {
                ...formData,
                updatedAt: new Date()
            });

            // 2. Mettre à jour le username dans toutes les photos si changé
            if (formData.username !== oldUsername) {
                const postsRef = collection(db, 'post');
                const q = query(postsRef, where('userEmail', '==', session.user.email));
                const querySnapshot = await getDocs(q);

                // Créer un batch pour les mises à jour multiples
                const batch = writeBatch(db);
                
                querySnapshot.forEach((doc) => {
                    batch.update(doc.ref, {
                        userName: formData.username
                    });
                });

                // Exécuter toutes les mises à jour en une seule transaction
                await batch.commit();
                setOldUsername(formData.username); // Mettre à jour l'ancien username
            }

            setMessage('Profile updated successfully!');
        } catch (error) {
            console.error('Update failed:', error);
            setMessage('Failed to update profile');
        } finally {
            setLoading(false);
            setIsCheckingUsername(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Réinitialiser le message d'erreur quand l'utilisateur commence à taper un nouveau username
        if (name === 'username' && message.includes('taken')) {
            setMessage('');
        }
    };

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };
 
    const validateImage = (file) => {
        return new Promise((resolve, reject) => {
            // Vérifier la taille du fichier
            if (file.size > MAX_FILE_SIZE) {
                reject('Image must be less than 1MB');
                return;
            }

            // Vérifier les dimensions
            const img = new Image();
            const objectUrl = URL.createObjectURL(file);

            img.onload = () => {
                URL.revokeObjectURL(objectUrl);
                if (img.width > MAX_DIMENSIONS || img.height > MAX_DIMENSIONS) {
                    reject(`Image dimensions must be ${MAX_DIMENSIONS}x${MAX_DIMENSIONS}px or less`);
                } else {
                    resolve(true);
                }
            };

            img.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                reject('Error loading image');
            };

            img.src = objectUrl;
        });
    };

    const handleImageChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !session?.user?.email) return;

        try {
            await validateImage(file);
            setImageError('');
            setUploading(true);

            // Traiter l'image
            const processedFile = await cropAndResizeImage(file);

            // Créer une preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(processedFile);

            // Upload l'image
            const storageRef = ref(storage, `profileImages/${session.user.email}`);
            const snapshot = await uploadBytes(storageRef, processedFile);
            const downloadURL = await getDownloadURL(snapshot.ref);

            // Mettre à jour le profil
            const userRef = doc(db, 'users', session.user.email);
            await updateDoc(userRef, {
                profileImage: downloadURL
            });

            setFormData(prev => ({
                ...prev,
                profileImage: downloadURL
            }));
            setMessage('Profile image updated successfully!');
        } catch (error) {
            console.error('Error with image:', error);
            setImageError(typeof error === 'string' ? error : 'Failed to update profile image');
            setImagePreview(null);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-1xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>
            
            {/* Profile Image Uploader with error message */}
            <div className="mb-8 flex items-center gap-4">
                <div className="text-center">
                    <div 
                        onClick={handleImageClick}
                        className="relative w-32 h-32 cursor-pointer group"
                    >
                        <NextImage // Utiliser le composant NextImage renommé
                            src={imagePreview || formData.profileImage || '/placeholder.jpg'}
                            alt="Profile"
                            fill
                            className="rounded-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-sm">Change Photo</span>
                        </div>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept="image/*"
                        className="hidden"
                    />
                </div>
                {imageError && (
                    <p className="text-red-600 text-sm">
                        {imageError}
                    </p>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Nouveaux champs */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">First Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Last Name</label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                        />
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700">Username</label>
                        {usernameError && (
                            <p className="text-red-600 text-sm">
                                {usernameError}
                            </p>
                        )}
                    </div>
                    <input
                        type="text"
                        name="username"
                        value={formData.username || ''}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md shadow-sm focus:ring-black ${
                            usernameError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-black'
                        }`}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Bio</label>
                    <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        rows={4}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                        placeholder="Tell us about yourself..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                        placeholder="e.g., Paris, France"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Website</label>
                    <input
                        type="url"
                        name="personalSite"
                        value={formData.personalSite}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                        placeholder="https://your-website.com"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Instagram</label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                            @
                        </span>
                        <input
                            type="text"
                            name="instagram"
                            value={formData.instagram}
                            onChange={handleChange}
                           // 🔐 On ajoute un pattern pour limiter les caractères autorisés (alphanumériques et underscore)
                             pattern="[A-Za-z0-9_]+"
                             title="Only letters, numbers and underscore"
                             className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 focus:border-black focus:ring-black"
                             placeholder="username"
                        />
                    </div>
                </div>

                {message && !message.includes('taken') && (
                    <div className={`p-4 rounded-md ${message.includes('Failed') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {message}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                        loading ? 'bg-gray-400' : 'bg-black hover:bg-gray-800'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black`}
                >
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </form>
        </div>
    );
}