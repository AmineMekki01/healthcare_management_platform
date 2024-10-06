import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../Auth/AuthContext';
import {
  FolderCardContainer,
  FolderCard
} from './StyledComponents/MyDocsStyles';
import { fileIconMapper } from './Helpers';

function SharedWithMe() {
  const { userId } = useContext(AuthContext);
  const [sharedItems, setSharedItems] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:3001/api/v1/shared-with-me?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then((data) => {
      setSharedItems(data);
    })
    .catch((error) => {
      console.error('Error fetching shared items:', error);
    });
  }, [userId]);
  function viewFolder(item) {
    setSharedItems(item.id); 
  };

  return (
      <div>
        <h1>Shared with Me</h1>
        <FolderCardContainer>
        {Array.isArray(sharedItems) && sharedItems?.map((item) => {
          const formattedPath = item.path.replace(/\\/g, '/').replace('uploads/', '');
          const imageUrl = `http://localhost:3001/files/${formattedPath}`;

          return (
          
          <FolderCard key={item.id} className="col-md-4">
            <div className="card">
              <div className="card-body">
                <i className="fa fa-folder-o">
                  {fileIconMapper(item.file_type === 'folder' ? 'folder' : item.extension, imageUrl)}
                </i>
              </div>

              <div className="card-footer">
                  <h3>
                  <a href="#" onClick={() => viewFolder(item)}>
                      {item.name.substring(0, 20)}
                      {item.name.length > 20 ? "..." : ""}
                  </a>
                  </h3>
              </div>
            </div>
          </FolderCard>
          );	
        })}
        </FolderCardContainer>
          
      </div>
  );
}

export default SharedWithMe;
