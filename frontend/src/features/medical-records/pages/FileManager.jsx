import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import FileUploadHeader from '../components/Header';
import MyUploads from '../components/MyUploads';
import SharedWithMe from '../components/SharedWithMe';
import ISharedWith from '../components/ISharedWith';

const FileManager = () => {
  return (
    <>
      <FileUploadHeader />
      <Routes>
        <Route path="/" element={<Navigate to="/MyDocs/Upload" replace />} />
        <Route path="/Upload" element={<MyUploads />} />
        <Route path="/Upload/:folderId" element={<MyUploads />} />
        <Route path="/SharedWithMe" element={<SharedWithMe />} />
        <Route path="/SharedWithMe/:folderId" element={<SharedWithMe />} />
        <Route path="/ISharedWith" element={<ISharedWith />} />
        <Route path="/ISharedWith/:folderId" element={<ISharedWith />} />
      </Routes>
    </>
  );
};

export default FileManager;
