
import React, { useState, useRef, useEffect } from 'react';
import { FileUp, X, File, FileText, Image, Film, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { supportsFileUpload, getSelectedProvider } from '@/services/aiProviderService';
import { useLanguage } from '@/i18n/LanguageContext';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
  showUploadButton?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  accept = '.pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.png',
  maxSize = 20, // Increased to 20MB
  className,
  showUploadButton = true
}) => {
  const { t } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [supportsUpload, setSupportsUpload] = useState(supportsFileUpload());
  const [selectedProvider, setSelectedProvider] = useState(getSelectedProvider());
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Update supported file types when the provider changes
  useEffect(() => {
    const provider = getSelectedProvider();
    if (provider !== selectedProvider) {
      setSelectedProvider(provider);
      setSupportsUpload(supportsFileUpload());
    }
  }, [selectedProvider]);

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
    console.log(`Validating file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
    
    // Reset any previous errors
    setUploadError(null);
    setIsProcessing(true);
    
    try {
      // Extract file extension
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      // Check if the extension is in the accepted list
      const acceptedExtensions = accept.split(',').map(type => 
        type.trim().replace('.', '').toLowerCase());
      
      if (!acceptedExtensions.includes(fileExtension || '') && !acceptedExtensions.includes('*')) {
        const errorMsg = `Invalid file type. Please upload ${accept} files.`;
        toast.error(errorMsg);
        setUploadError(errorMsg);
        console.error(`Invalid file type: ${fileExtension}. Accepted types: ${acceptedExtensions.join(', ')}`);
        setIsProcessing(false);
        return;
      }
      
      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        const errorMsg = `File too large. Maximum size is ${maxSize}MB.`;
        toast.error(errorMsg);
        setUploadError(errorMsg);
        console.error(`File too large: ${file.size} bytes. Maximum size: ${maxSize * 1024 * 1024} bytes`);
        setIsProcessing(false);
        return;
      }
      
      // Check if the current provider supports file uploads
      if (!supportsUpload) {
        toast.warning(t('fileUploadNotSupported'));
        console.warn(`Provider ${selectedProvider} does not support direct file uploads`);
        // Still set the file but with a warning
      }
      
      setSelectedFile(file);
      onFileUpload(file);
      toast.success(`${file.name} ${t('selectedFileSuccess')}`);
      console.log(`File selected successfully: ${file.name}`);
    } catch (error) {
      const errorMsg = `Error validating file: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('Error validating file:', error);
      toast.error(errorMsg);
      setUploadError(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setUploadError(null);
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

  // If an error occurred but we still have a file, show both
  return (
    <div className={cn("space-y-4", className)}>
      {uploadError && (
        <div className="border-red-300 bg-red-50 text-red-800 text-sm p-3 rounded-md flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <p>{uploadError}</p>
        </div>
      )}
    
      {!selectedFile ? (
        <div
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-200",
            isDragging 
              ? "border-cat bg-cat/5" 
              : "border-gray-300 hover:border-cat/50 hover:bg-gray-50",
            showUploadButton ? "cursor-pointer" : "",
            className
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={showUploadButton ? () => fileInputRef.current?.click() : undefined}
        >
          <div className="mx-auto w-12 h-12 rounded-full bg-cat/10 flex items-center justify-center mb-4">
            <FileUp className="w-6 h-6 text-cat" />
          </div>
          
          <h3 className="text-lg font-medium mb-2">
            {showUploadButton ? t('dragDropFile') : t('dropFileHere')}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t('supportFor')} {accept.replace(/\./g, '')} {t('files')}.
            <br />{t('maxSize')} {maxSize}MB
          </p>
          
          {showUploadButton && (
            <button 
              type="button" 
              className="cat-button-secondary text-sm py-2"
              disabled={isProcessing}
            >
              {isProcessing ? `${t('processing')}...` : t('selectFromComputer')}
            </button>
          )}
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept={accept}
            className="hidden"
            disabled={isProcessing}
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
              disabled={isProcessing}
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
