import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';

const DragDrop = ({ onFilesSelected, accept = 'image/*', multiple = false, maxFiles = 10 }) => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  };

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files);
    processFiles(selectedFiles);
  };

  const processFiles = (newFiles) => {
    const validFiles = newFiles.filter(file => {
      if (accept.includes('image')) {
        return file.type.startsWith('image/');
      }
      return true;
    });

    if (multiple) {
      const updatedFiles = [...files, ...validFiles].slice(0, maxFiles);
      setFiles(updatedFiles);
      onFilesSelected(updatedFiles);
    } else {
      setFiles(validFiles.slice(0, 1));
      onFilesSelected(validFiles.slice(0, 1));
    }
  };

  const removeFile = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFilesSelected(updatedFiles);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <div
        className={`drag-drop-area ${isDragging ? 'dragover' : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <Upload className="mx-auto mb-2 text-gray-400" size={32} />
        <p className="text-gray-600 dark:text-gray-400">
          Drag & drop files here, or click to select
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
          {accept.includes('image') ? 'Images only' : 'Files'} {multiple ? `(Max ${maxFiles})` : ''}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {files.length > 0 && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {files.map((file, index) => (
            <div key={index} className="relative">
              {file.type.startsWith('image/') ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{file.name}</p>
                </div>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DragDrop;

