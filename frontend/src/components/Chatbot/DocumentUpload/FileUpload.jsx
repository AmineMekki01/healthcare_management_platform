import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { 
  UploadContainer, 
  DropZone, 
  HiddenInput, 
  UploadIcon, 
  UploadText, 
  UploadSubtext, 
  FileInfo, 
  FileName, 
  FileSize, 
  RemoveButton,
  UploadButton,
  ButtonGroup
} from './styles/FileUploadStyles';

const FileUpload = forwardRef(({ onFileSelect }, ref) => {
  const [files, setFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef();

  // Expose clearFiles method to parent component via ref
  useImperativeHandle(ref, () => ({
    clearFiles: () => {
      setFiles([]);
    }
  }));

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    setFiles(selectedFiles);
    // Don't automatically call onFileSelect - wait for user to click upload
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    const droppedFiles = Array.from(event.dataTransfer.files);
    setFiles(droppedFiles);
    // Don't automatically call onFileSelect - wait for user to click upload
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const removeFile = (indexToRemove) => {
    const updatedFiles = files.filter((_, index) => index !== indexToRemove);
    setFiles(updatedFiles);
    // Don't automatically call onFileSelect - files are only sent when user clicks upload
  };

  const handleUpload = () => {
    if (files.length > 0) {
      onFileSelect(files);
      setFiles([]); // Clear files after upload
    }
  };

  return (
    <UploadContainer>
      <DropZone
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        isDragOver={isDragOver}
        hasFiles={files.length > 0}
      >
        <HiddenInput 
          type="file"
          onChange={handleFileChange}
          multiple
          ref={fileInputRef}
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
        />
        
        {files.length === 0 ? (
          <>
            <UploadIcon>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="10,9 9,9 8,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </UploadIcon>
            <UploadText>
              {isDragOver ? 'Drop files here' : 'Drag & drop files here'}
            </UploadText>
            <UploadSubtext>or click to browse</UploadSubtext>
          </>
        ) : (
          <div style={{ 
            width: '100%', 
            maxHeight: '120px', 
            overflowY: 'auto',
            paddingRight: '4px'
          }}>
            {files.map((file, index) => (
              <FileInfo key={index}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <FileName title={file.name}>{file.name}</FileName>
                  <FileSize>{formatFileSize(file.size)}</FileSize>
                </div>
                <RemoveButton onClick={(e) => { e.stopPropagation(); removeFile(index); }}>
                  ×
                </RemoveButton>
              </FileInfo>
            ))}
          </div>
        )}
      </DropZone>
      
      {files.length > 0 && (
        <ButtonGroup>
          <UploadButton onClick={handleUpload} primary>
            Upload {files.length} file{files.length > 1 ? 's' : ''}
          </UploadButton>
          <UploadButton onClick={() => setFiles([])}>
            Clear
          </UploadButton>
        </ButtonGroup>
      )}
    </UploadContainer>
  );
});

export default FileUpload;