import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../Auth/AuthContext';
import {
  FolderCardContainer,
  FolderCard
} from './StyledComponents/MyDocsStyles';
import { fileIconMapper } from './Helpers'; 


function ISharedWith() {
  const { userId } = useContext(AuthContext);
  const [sharedItems, setSharedItems] = useState([]);

        
    useEffect(() => {
        const fetchSharedItems = async () => {
          try {
            const response = await fetch(`http://localhost:3001/api/v1/shared-by-me?userId=${userId}`, {
              headers: {
                'Content-Type': 'application/json',
              },
            });
      
            if (!response.ok) {
              const contentType = response.headers.get("content-type");
              if (contentType && contentType.indexOf("application/json") !== -1) {
                const json = await response.json();
                console.log('i share with data : ', json);
                setSharedItems(json);
              } else {
                const errorText = await response.text();
                throw new Error(`Server response: ${errorText}`);
              }
            } else {
              const data = await response.json();
              console.log('i share with data : ', data);
              setSharedItems(data);
            }
          } catch (error) {
            console.error('Error fetching shared items:', error.message);
          }
        };
      
        fetchSharedItems();
      }, [userId]);
      function viewFolder(item) {
        setSharedItems(item.id); 
      };
      return (
        <div>
          <h1>I Shared With</h1>
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
    

export default ISharedWith;

