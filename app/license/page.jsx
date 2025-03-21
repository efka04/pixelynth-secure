'use client';
import { useRouter } from 'next/navigation';

import { BiChevronLeft } from "react-icons/bi"; // Importation spécifique
import { useEffect } from 'react';

const LicensePage = () => {
    const router = useRouter();

    useEffect(() => {
        document.title = 'License - Pixelynth';
    }, []); // Empty dependency array - only runs once

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <button 
                    onClick={() => router.back()} 
                    className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
                >
                    <BiChevronLeft size={25} />
                    <span>Back</span>
                </button>
                <div className="bg-white rounded-md shadow-md p-6 sm:p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
                        License Agreement
                    </h1>
                    <div className="space-y-6 text-gray-600">
                        <p className="leading-relaxed text-center">
                        
Pixelynth visuals are free to use:

                        </p>
                        <ul className="list-disc pl-6 space-y-3">
                            <span className="font-bold text-gray-900">What You Can Do:</span>
                            <li>Download and use all images for free.</li>
                            <li>Use them for both commercial and non-commercial purposes.</li>
                            <li>No permission required (though giving credit is appreciated!)</li>
                            <br/> <br/>
                            <span className="font-bold text-gray-900">What You Can't Do:</span>
                            <li>Sell images without making significant modifications.</li>
                            <li>Compiling images from Pixelynth to replicate a similar or competing service.</li>
                        </ul>
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-6">
                            <p className="text-sm text-blue-700">
                            Attribution isn’t mandatory, but it’s appreciated by Pixelynth contributors as it helps showcase their work and motivates them to keep sharing.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LicensePage;