import React from 'react';
import FolderIcon from '@mui/icons-material/Folder';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PhotoSizeSelectActualIcon from '@mui/icons-material/PhotoSizeSelectActual';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import ArticleIcon from '@mui/icons-material/Article';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import styled from 'styled-components';

const iconColors = {
    folder: "#f39c12", // example color for folders
    pdf: "#c0392b",    // example color for PDFs
    audio: "#9b59b6",  // example color for audio files
    text: "#3498db",   // example color for text documents
    video: "#2ecc71",  // example color for videos
    default: "#95a5a6" // default color
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