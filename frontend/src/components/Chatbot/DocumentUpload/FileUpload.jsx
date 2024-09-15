import React, { useState, useRef } from 'react';
import { UploadFileForm, UploadFileFormInput, UploadFileFormSubmitButton, CustomUploadLabel } from './styles/FileUploadStyles';

const FileUpload = ({ onFileSelect }) => {
  const [file, setFile] = useState(null);
  const fileInputRef = useRef();

  const handleFileChange = (event) => {
      const selectedFiles = event.target.files;
      if (selectedFiles.length) {
        setFile(selectedFiles[0]); 
        onFileSelect(selectedFiles);
      }
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <UploadFileForm>
      <UploadFileFormInput 
        type="file"
        onChange={handleFileChange}
        multiple
        value=''
        ref={fileInputRef}
        style={{ display: 'none' }}
      />
      <CustomUploadLabel onClick={handleButtonClick}>
        Choose a file...
      </CustomUploadLabel>
      <UploadFileFormSubmitButton type="submit">Upload</UploadFileFormSubmitButton>
    </UploadFileForm>
  );
};

export default FileUpload;