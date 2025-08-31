import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import MyUploads from '../components/MyUploads';
import SharedWithMe from '../components/SharedWithMe';
import ISharedWith from '../components/ISharedWith';
import MedicalRecordsView from '../components/MedicalRecordsView';
import UploadAndShareView from '../components/UploadAndShareView';

function FileManager() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const getCurrentTab = () => {
    const path = location.pathname.split('/');
    const tab = path[path.length - 1];
    return ['my-docs', 'medical-records', 'upload', 'shared-with-me', 'i-shared-with'].includes(tab) 
      ? tab 
      : 'my-docs';
  };

  const activeView = getCurrentTab();

  const handleViewChange = (view) => {
    navigate(view);
  };

  return (
    <div>
      <Header activeView={activeView} onViewChange={handleViewChange} />
      <Routes>
        <Route path="/" element={<MyUploads />} />
        <Route path="/:folderId" element={<MyUploads />} />
        <Route path="medical-records" element={<MedicalRecordsView />} />
        <Route path="upload" element={<UploadAndShareView />} />
        <Route path="shared-with-me/*" element={<SharedWithMe />} />
        <Route path="i-shared-with/*" element={<ISharedWith />} />
      </Routes>
    </div>
  );
}

export default FileManager;
