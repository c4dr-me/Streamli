// src/components/Modal.jsx

import React from 'react';
import {FaTimes} from 'react-icons/fa';

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <div className="relative bg-gray-900 rounded-lg p-6 w-full max-w-4xl mx-auto max-h-full overflow-auto shadow-lg">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 focus:outline-none flex items-center justify-center"
          aria-label="Close"
          title='close'
        >
          <FaTimes />
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;