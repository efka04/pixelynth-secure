import React from 'react';
import { ImSpinner8 } from 'react-icons/im';

export default function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <ImSpinner8 className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  );
}
