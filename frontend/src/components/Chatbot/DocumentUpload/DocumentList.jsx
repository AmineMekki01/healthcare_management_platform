import React from 'react';

import { DocumentContainer, DocumentElement } from './styles/DocumentListStyles';  


const DocumentList = ({ documents = [], onSelectDocument }) => {
  if (!Array.isArray(documents) || documents.length === 0 || !Array.isArray(documents[0])) {
    return <DocumentElement>No documents available.</DocumentElement>;
  }

  console.log("documents:", documents);

  return (
    <DocumentContainer>
      {documents[0].map((docName, index) => {
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