"use client"
import { useDropzone } from 'react-dropzone';

export default function DragDropZone({ onFilesDrop }) {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: {'image/*': []},
        multiple: true,
        onDrop: onFilesDrop
    });

    return (
        <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-md p-8 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-black bg-gray-50' : 'border-gray-300 hover:border-gray-400'}`}
        >
            <input {...getInputProps()} />
            <p className="text-lg">
                {isDragActive ? 
                    'Drop your images here...' : 
                    'Drag & drop images here, or click to select files'
                }
            </p>
        </div>
    );
}