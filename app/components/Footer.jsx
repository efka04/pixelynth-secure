import Link from 'next/link';
import { FaInstagram, FaPinterest } from 'react-icons/fa';

export default function Footer() {
    return (
        <footer className="w-full py-6 px-4 mt-auto bg-white border-t">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div className="text-sm text-gray-500">
                    © {new Date().getFullYear()} Pixelynth. All rights reserved.
                </div>
                <div className="flex items-center gap-4">
                    <Link 
                        href="https://instagram.com/pixelynth" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-black transition-colors"
                        aria-label="Follow us on Instagram"
                    >
                        <FaInstagram size={24} />
                    </Link>
                    <Link 
                        href="https://pinterest.com/pixelynth" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-black transition-colors"
                        aria-label="Follow us on Pinterest"
                    >
                        <FaPinterest size={24} />
                    </Link>
                </div>
            </div>
        </footer>
    );
}
