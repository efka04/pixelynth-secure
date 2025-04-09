'use client';
import { useState, useRef, useEffect } from 'react';
import { RxHamburgerMenu, RxCross2 } from 'react-icons/rx'; // Ajout de RxCross2 pour une croix plus fine
import { FaInstagram, FaPinterest } from 'react-icons/fa';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react'; // Import de signOut et useSession

export default function BurgerMenu() {
    const { data: session } = useSession(); // Utilisation de useSession pour vérifier l'état de la session
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const navigationLinks = [
        { href: '/blog', label: 'Blog' },
        { href: 'mailto:contact@pixelynth.com', label: 'Contact' }, // Update the contact link to mailto
        { href: '/license', label: 'License' },
        { href: '/privacy', label: 'Privacy' },
    ];

    const socialLinks = [
        { href: 'https://instagram.com/pixelynth', icon: <FaInstagram size={20} />, label: 'Instagram' },
        { href: 'https://pinterest.com/pixelynth', icon: <FaPinterest size={20} />, label: 'Pinterest' },
    ];

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1 py-2 hover:bg-gray-100 rounded-full transition-colors flex items-center gap-2"
                aria-label="Menu"
            >
                <span className="hidden md:inline">Menu</span>
                {isOpen ? 
                    <RxCross2 className="w-4 h-4" /> :
                    <RxHamburgerMenu className="w-4 h-4" />
                }
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full border border-black mt-2 w-48 bg-white shadow-lg rounded-md overflow-hidden z-50">
                    <nav className="py-2">
                        {/* Navigation Links d'abord */}
                        {navigationLinks.map((link) => (
                            <a 
                                key={link.href}
                                href={link.href}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                onClick={() => setIsOpen(false)} // Ferme le menu lors du clic sur un lien
                            >
                                {link.label}
                            </a>
                        ))}

                        {/* Séparateur et liens sociaux en bas */}
                        <div className="border-t border-gray-200 mt-2">
                            <div className="px-4 py-2 flex gap-4">
                                {socialLinks.map((social) => (
                                    <a
                                        key={social.label}
                                        href={social.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-gray-600 hover:text-gray-900"
                                        aria-label={social.label}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        {social.icon}
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Bouton de déconnexion */}
                        {session && (
                            <div className="border-t border-gray-200 mt-2">
                                <button
                                    onClick={() => {
                                        signOut({ callbackUrl: '/' });
                                        setIsOpen(false);
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    Log out
                                </button>
                            </div>
                        )}
                    </nav>
                </div>
            )}
        </div>
    );
}
