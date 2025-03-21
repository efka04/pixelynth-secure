// ColorPicker.jsx
import React from 'react';

const colors = [
  { name: 'All Colors', value: 'all', hex: 'linear-gradient(45deg, #FF0000, #FF6600, #FFD700, #00CC00, #0066FF, #8A2BE2)' },
  { name: 'Black & White', value: 'blackwhite', hex: 'linear-gradient(45deg, #000000 50%, #FFFFFF 50%)' },
  { name: 'Red', value: 'red', hex: '#FF0000' },
  { name: 'Blue', value: 'blue', hex: '#0066FF' },
  { name: 'Green', value: 'green', hex: '#00CC00' },
  { name: 'Yellow', value: 'yellow', hex: '#FFD700' },
  { name: 'Purple', value: 'violet', hex: '#8A2BE2' },
  { name: 'Orange', value: 'orange', hex: '#FF6600' },
  { name: 'Pink', value: 'pink', hex: '#FF1493' },
  { name: 'Brown', value: 'brown', hex: '#8B4513' },
];

const ColorPicker = ({ selectedColor, onSelect }) => (
  <div className="flex flex-col gap-1 my-1 md:my-2">
    <h3 className="font-semibold text-xs md:text-sm">Color</h3>
    <div className="flex flex-wrap gap-1">
      {colors.map((color) => (
        <button
          key={color.value}
          onClick={() => onSelect(color.value)}
          className={`w-8 h-8 rounded-full border-2 flex-shrink-0 ${
            selectedColor === color.value ? 'border-black' : 'border-gray-200'
          }`}
          style={{ background: color.hex }}
          title={color.name}
        />
      ))}
    </div>
  </div>
);

export default ColorPicker;
