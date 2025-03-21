'use client';
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth'
import { app, db } from '@/app/db/firebaseConfig'
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'

export default function RegisterForm() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        username: '',
        firstName: '',
        lastName: ''
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false) // État pour la visibilité du mot de passe

    const togglePasswordVisibility = () => {
        setShowPassword(prevState => !prevState)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        // Validation de base
        if (!formData.username.trim()) {
            setError('Username is required')
            setLoading(false)
            return
        }

        try {
            // Vérifier si le username existe déjà
            const usernameQuery = query(
                collection(db, 'users'),
                where('username', '==', formData.username)
            );
            const usernameSnapshot = await getDocs(usernameQuery);
            
            if (!usernameSnapshot.empty) {
                setError('Username already taken')
                setLoading(false)
                return
            }

            // Vérifier si l'email est déjà utilisé dans la collection users
            const emailQuery = query(
                collection(db, 'users'),
                where('email', '==', formData.email)
            );
            const emailSnapshot = await getDocs(emailQuery);
            
            if (!emailSnapshot.empty) {
                setError('Email already registered')
                setLoading(false)
                return
            }

            // Vérification des mots de passe
            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match')
                setLoading(false)
                return
            }

            if (!/(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
                setError('Password must contain at least one uppercase letter and one number')
                setLoading(false)
                return
            }

            // Création de l'utilisateur dans Firebase Auth
            const auth = getAuth(app)
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
            const user = userCredential.user

            // Envoi de l'email de vérification
            await sendEmailVerification(user)

            // Création du document utilisateur dans Firestore
            await setDoc(doc(db, 'users', user.email), {
                email: user.email,
                username: formData.username,
                firstName: formData.firstName,
                lastName: formData.lastName,
                bio: '',
                location: '',
                instagram: '',
                personalSite: '',
                adress: '',
                profileImage: '/default-avatar.webp',
                createdAt: new Date(),
            })

            // Informer l'utilisateur qu'un email de vérification a été envoyé
            alert('A verification email has been sent to your email address. Please verify your email before signing in.')
            router.push('/signin')
        } catch (error) {
            console.error('Registration error:', error)
            
            const errorMessages = {
                'auth/email-already-in-use': 'Email already registered',
                'auth/invalid-email': 'Invalid email address',
                'auth/weak-password': 'Password is too weak',
                'auth/network-request-failed': 'Network error. Please check your connection',
                'auth/too-many-requests': 'Too many attempts. Please try again later'
            };

            setError(errorMessages[error.code] || 'Registration failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded-md shadow-md w-96">
                <h1 className="text-2xl font-bold mb-6 text-center">Create Account</h1>
                
                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Username"
                        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                    <div className="flex gap-4">
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            placeholder="First Name"
                            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            placeholder="Last Name"
                            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Email"
                        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Password"
                            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-600"
                        >
                            {showPassword ? 'Hide' : 'Show'}
                        </button>
                    </div>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm Password"
                            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-600"
                        >
                            {showPassword ? 'Hide' : 'Show'}
                        </button>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full p-2 rounded-md ${
                            loading 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-black hover:bg-gray-800'
                        } text-white transition-colors`}
                    >
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>

                <p className="mt-6 text-center text-gray-600">
                    Already have an account?{' '}
                    <Link 
                        href="/signin" 
                        className="text-blue-500 hover:underline font-medium"
                    >
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    )
}