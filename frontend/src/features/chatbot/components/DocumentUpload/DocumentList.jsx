import React from 'react';
import { DocumentContainer, DocumentElement, DocumentInfo, DocumentName, DocumentMeta, StorageBadge, DeleteButton } from './DocumentList.styles';  

const DocumentList = ({ documents, onSelectDocument, onDeleteDocument }) => {
  if (!Array.isArray(documents) || documents.length === 0) {
    return (
      <DocumentContainer>
        <DocumentElement>No documents available</DocumentElement>
      </DocumentContainer>
    );
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStorageBadgeColor = (storageType) => {
    switch (storageType) {
      case 'context': return '#4CAF50'; // Green
      case 'temporary': return '#FF9800'; // Orange
      case 'persistent': return '#2196F3'; // Blue
      default: return '#757575'; // Grey
    }
  };

  const formatStorageType = (storageType) => {
    switch (storageType) {
      case 'context': return 'Direct Context';
      case 'temporary': return 'Temp Storage';
      case 'persistent': return 'Persistent';
      default: return storageType;
    }
  };
  
  return (
    <DocumentContainer>
      {documents.map((doc, index) => {
        return (
          <DocumentElement key={doc.id || index}>
            <DocumentInfo onClick={() => onSelectDocument(doc)}>
              <DocumentName title={doc.filename}>{doc.filename}</DocumentName>
              <DocumentMeta>
                <span>{formatFileSize(doc.file_size)}</span>
                {doc.token_count && <span>• {doc.token_count} tokens</span>}
                {doc.created_at && (
                  <span>• {new Date(doc.created_at).toLocaleDateString()}</span>
                )}
              </DocumentMeta>
              {doc.storage_type && (
                <StorageBadge color={getStorageBadgeColor(doc.storage_type)}>
                  {formatStorageType(doc.storage_type)}
                </StorageBadge>
              )}
            </DocumentInfo>
            {onDeleteDocument && (
              <DeleteButton 
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteDocument(doc.id);
                }}
                title="Delete document"
              >
                ×
              </DeleteButton>
            )}
          </DocumentElement>
        );
      })}
    </DocumentContainer>
  );
};

export default DocumentList;
