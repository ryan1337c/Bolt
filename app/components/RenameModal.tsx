"use client";
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

// Define the props the modal will accept
interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newTitle: string) => void;
  currentTitle: string;
  setInputValue: (value: string) => void;
}

export default function RenameModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  currentTitle, 
  setInputValue 
}: RenameModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Automatically focus the input field and select its text when the modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100); // A short delay ensures the element is ready
    }
  }, [isOpen]);

  if (!isOpen) {
    return null; 
  }

  const handleSubmit = () => {
    if (currentTitle.trim()) {
      onSubmit(currentTitle);
    }
  };

  return (
    // Main overlay
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose} // Close modal if user clicks outside the content
    >
      {/* Modal content */}
      <div 
        className="relative bg-white w-full max-w-md rounded-xl shadow-2xl p-6 m-4 animate-fade-in-up-sm"
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside the modal from closing it
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Rename Chat</h2>
          <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {/* Input Field */}
        <div className="text-black">
          <label htmlFor="chat-title" className="text-sm font-medium  sr-only">
            Chat Title
          </label>
          <input
            ref={inputRef}
            id="chat-title"
            type="text"
            value={currentTitle}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-violet-300 focus:border-violet-500 [color-scheme:light]"
            placeholder="Enter a new title"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-violet-600 hover:bg-violet-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}