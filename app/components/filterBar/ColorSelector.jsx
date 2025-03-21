"use client"
import { useColor } from '../../context/ColorContext'
import { useState, useEffect } from 'react'

const colors = [
    { name: 'Select', value: '', bgClass: 'bg-gradient-to-r from-yellow-500 via-pink-500 to-blue-500' },
    { name: 'All', value: 'all', bgClass: 'bg-gradient-to-r from-yellow-500 via-pink-500 to-blue-500' },
    { name: 'Black & White', value: 'blackwhite', bgClass: 'bg-gradient-to-r from-black to-white' },
    { name: 'Blue', value: 'blue', bgClass: 'bg-gradient-to-r from-blue-400 to-blue-600' },
    { name: 'Red', value: 'red', bgClass: 'bg-gradient-to-r from-red-400 to-red-600' },
    { name: 'Green', value: 'green', bgClass: 'bg-gradient-to-r from-green-400 to-green-600' },
    { name: 'Yellow', value: 'yellow', bgClass: 'bg-gradient-to-r from-yellow-300 to-yellow-500' },
    { name: 'Orange', value: 'orange', bgClass: 'bg-gradient-to-r from-orange-400 to-orange-600' },
    { name: 'Violet', value: 'violet', bgClass: 'bg-gradient-to-r from-violet-400 to-violet-600' },
    { name: 'Pink', value: 'pink', bgClass: 'bg-gradient-to-r from-pink-400 to-pink-600' },
    { name: 'Brown', value: 'brown', bgClass: 'bg-gradient-to-r from-amber-700 to-amber-900' }
]

export default function ColorSelector() {
    const { selectedColor, setSelectedColor } = useColor()
    const [isDeployed, setIsDeployed] = useState(false)
    const [mainColor, setMainColor] = useState(colors[0].bgClass)
    const [lastSelectedColor, setLastSelectedColor] = useState(null)

    const handleColorClick = (color) => {
        if (color.value === '') {
            // Just toggle deployment without changing colors when clicking Select circle
            setIsDeployed(!isDeployed)
            return
        }
        
        if (color.value === 'all') {
            setSelectedColor('')  // Show all items
            setMainColor(colors[1].bgClass)
            setIsDeployed(false)
            return
        }

        setMainColor(color.bgClass)
        setSelectedColor(color.value)
        setLastSelectedColor(null)
        setIsDeployed(false)
    }

    // Add this effect to handle external changes to selectedColor
    useEffect(() => {
        if (!selectedColor) {
            setMainColor(colors[1].bgClass); // Reset to 'All' color
        }
    }, [selectedColor]);

    return (
        <div className="relative translate-y-[5px] mr-2">
            <button
                onClick={() => handleColorClick(colors[0])}
                className="relative z-10"
                title="Toggle color selector"
            >
                <div className={`
                    w-8 h-8 rounded-full 
                    ${mainColor}
                    ring-1 ring-offset-1 ring-black
                    transition-all duration-200
                `} />
            </button>

            <div className={`
                absolute left-1/2 -translate-x-1/2 top-[0px]  
                flex flex-col items-center gap-2  
                bg-white p-2  /* Increased padding */
          bg-white rounded-md shadow-lg border border-black
                z-40
                transition-all duration-300 origin-top
                ${isDeployed ? 'translate-y-10 opacity-100' : 'translate-y-0 opacity-0 pointer-events-none'}
            `}>
                {colors.slice(1).map((color) => (
                    <button
                        key={color.value}
                        onClick={() => handleColorClick(color)}
                        className="flex items-center justify-center w-8 h-8 hover:scale-110 transition-transform" /* Added hover effect */
                        title={color.name}
                    >
                        <div className={`
                            w-8 h-8 rounded-full  /* Match main circle size */
                            ${color.bgClass}
                            hover:ring-2 hover:ring-offset-2 hover:ring-gray-400  /* Enhanced hover effect */
                            transition-all duration-200
                        `} />
                    </button>
                ))}
            </div>
        </div>
    )
}