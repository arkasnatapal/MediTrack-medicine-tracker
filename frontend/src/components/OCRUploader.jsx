import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2, AlertCircle } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

import api from '../api/api';

const OCRUploader = ({ onScanComplete }) => {
  const { notify } = useNotification();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);

  const processImage = async (file) => {
    setScanning(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await api.post('/ocr', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = response.data;

      if (data.success) {
        onScanComplete({
          ai: data.ai
        });
        notify.success('Scan complete!');
      } else {
        throw new Error(data.message || 'Failed to process image');
      }

    } catch (err) {
      console.error('OCR Error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to scan image');
      notify.error('Failed to scan image');
    } finally {
      setScanning(false);
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      processImage(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    multiple: false
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors duration-200 ${
          isDragActive 
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-400' 
            : 'border-gray-300 dark:border-slate-700 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-slate-800'
        }`}
      >
        <input {...getInputProps()} />
        
        {scanning ? (
          <div className="flex flex-col items-center justify-center py-4">
            <Loader2 className="h-10 w-10 text-primary-600 animate-spin mb-4" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">Scanning image...</p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">This may take a few seconds</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-full mb-4">
              <Upload className="h-6 w-6 text-primary-600" />
            </div>
            <p className="text-base font-medium text-gray-900 dark:text-white">
              {isDragActive ? 'Drop the image here' : 'Upload medicine label'}
            </p>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              Drag & drop or click to select
            </p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-4">
              Supports JPG, PNG
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 flex items-center text-sm text-red-600">
          <AlertCircle className="h-4 w-4 mr-2" />
          {error}
        </div>
      )}
    </div>
  );
};

export default OCRUploader;
