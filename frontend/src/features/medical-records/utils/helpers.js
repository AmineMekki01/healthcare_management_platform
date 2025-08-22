import React from 'react';
import FolderIcon from '@mui/icons-material/Folder';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PhotoSizeSelectActualIcon from '@mui/icons-material/PhotoSizeSelectActual';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import ArticleIcon from '@mui/icons-material/Article';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import styled from 'styled-components';

const iconColors = {
    folder: "#f39c12",
    pdf: "#c0392b",
    audio: "#9b59b6",
    text: "#3498db",
    video: "#2ecc71",
    default: "#95a5a6"
};

export const CardImage = styled.img`
    max-width: 100%;
    max-height: 100%;
    margin: auto;
`;

export const fileIconMapper = (extension, imageUrl) => {
    let color;
    switch (extension) {
    case 'folder':
        color = iconColors.folder;
        return <FolderIcon sx={{ fontSize: 200, color }} />;
    case 'jpeg':
    case 'jpg':
        return <CardImage src={imageUrl} alt="image" />;
    case 'pdf':
        color = iconColors.pdf;
        return <PictureAsPdfIcon sx={{ fontSize: 200, color  }} />;
    case 'mp3':
        color = iconColors.audio;
        return <AudioFileIcon sx={{ fontSize: 200, color  }} />;
    case 'txt':
    case 'docx':
        color = iconColors.text;
        return <ArticleIcon sx={{ fontSize: 200, color  }} />;
    case 'mp4':
    case 'mov':
    case 'avi':
    case 'wmv':
    case 'flv':
    case 'mkv':
    case 'webm':
        color = iconColors.video;
        return <VideoFileIcon sx={{ fontSize: 200, color }} />;

    default:
        color = iconColors.default;
        return <PhotoSizeSelectActualIcon sx={{ fontSize: 200, color }} />;
  }
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getFileTypeColor = (extension) => {
  return iconColors[extension] || iconColors.default;
};

export const isValidFileType = (filename) => {
  const allowedTypes = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'txt', 'mp3', 'mp4', 'mov', 'avi'];
  const extension = filename.split('.').pop().toLowerCase();
  return allowedTypes.includes(extension);
};

export const generateBreadcrumbPath = (breadcrumbs) => {
  return breadcrumbs.map(crumb => crumb.name).join(' > ');
};