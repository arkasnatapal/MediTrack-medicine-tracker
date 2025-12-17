import React from 'react';
import { X } from 'lucide-react';

const DropzonePreview = ({ file, onRemove }) => {
  if (!file) return null;

  return (
    <div className="relative mt-4 inline-block">
      <img
        src={URL.createObjectURL(file)}
        alt="Preview"
        className="h-24 w-24 object-cover rounded-lg border border-gray-200"
        onLoad={() => { URL.revokeObjectURL(file.preview) }}
      />
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md border border-gray-200 hover:bg-gray-50"
      >
        <X className="h-3 w-3 text-gray-500" />
      </button>
    </div>
  );
};

export default DropzonePreview;
