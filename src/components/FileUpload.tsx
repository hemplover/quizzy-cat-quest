
import React, { useState, useRef } from 'react';
import { FileUp, X, File, FileText, Image, Film, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  accept = '.pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.png',
  maxSize = 10, // 10MB default
  className
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length) {
      validateAndSetFile(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    // Check file type
    const fileType = file.type.split('/')[1];
    const acceptedTypes = accept.split(',').map(type => type.trim().replace('.', ''));
    
    if (!acceptedTypes.includes(fileType) && !acceptedTypes.includes('*')) {
      toast.error(`Invalid file type. Please upload ${accept} files.`);
      return;
    }
    
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File too large. Maximum size is ${maxSize}MB.`);
      return;
    }
    
    setSelectedFile(file);
    onFileUpload(file);
    toast.success(`${file.name} selected successfully!`);
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (file: File) => {
    const type = file.type.split('/')[0];
    const extension = file.name.split('.').pop()?.toLowerCase();

    switch (type) {
      case 'image':
        return <Image className="w-6 h-6 text-blue-500" />;
      case 'video':
        return <Film className="w-6 h-6 text-purple-500" />;
      case 'text':
        return <FileText className="w-6 h-6 text-green-500" />;
      default:
        switch (extension) {
          case 'pdf':
            return <FileText className="w-6 h-6 text-red-500" />;
          case 'doc':
          case 'docx':
            return <FileText className="w-6 h-6 text-blue-600" />;
          case 'xls':
          case 'xlsx':
            return <FileSpreadsheet className="w-6 h-6 text-green-600" />;
          case 'ppt':
          case 'pptx':
            return <FileText className="w-6 h-6 text-orange-500" />;
          default:
            return <File className="w-6 h-6 text-gray-500" />;
        }
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {!selectedFile ? (
        <div
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-200 cursor-pointer",
            isDragging 
              ? "border-cat bg-cat/5" 
              : "border-gray-300 hover:border-cat/50 hover:bg-gray-50",
            className
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="mx-auto w-12 h-12 rounded-full bg-cat/10 flex items-center justify-center mb-4">
            <FileUp className="w-6 h-6 text-cat" />
          </div>
          
          <h3 className="text-lg font-medium mb-2">Drag and drop your file here</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Support for {accept.replace(/\./g, '')} files.
            <br />Max size: {maxSize}MB
          </p>
          
          <button 
            type="button" 
            className="cat-button-secondary text-sm py-2"
          >
            Select from computer
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept={accept}
            className="hidden"
          />
        </div>
      ) : (
        <div className="border rounded-xl p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getFileIcon(selectedFile)}
              <div className="truncate">
                <p className="font-medium truncate" title={selectedFile.name}>
                  {selectedFile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)}MB
                </p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clearSelectedFile();
              }}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
