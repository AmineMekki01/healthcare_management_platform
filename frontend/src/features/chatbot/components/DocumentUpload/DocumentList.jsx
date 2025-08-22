import React from 'react';
import { DocumentContainer, DocumentElement } from './DocumentList.styles';  

const DocumentList = ({ documents, onSelectDocument }) => {
  if (!Array.isArray(documents) || documents.length === 0) {
    return (
      <DocumentContainer>
        <DocumentElement>No documents available</DocumentElement>
      </DocumentContainer>
    );
  }
  
  return (
    <DocumentContainer>
      {documents.map((docName, index) => {
        console.log('Document in List:', docName);
        return (
          <DocumentElement key={index} onClick={() => onSelectDocument(docName)}>
            {docName}
          </DocumentElement>
        );
      })}
    </DocumentContainer>
  );
};

export default DocumentList;
