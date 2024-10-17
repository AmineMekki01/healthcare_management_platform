import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../Auth/AuthContext';
import {
  FolderCardContainer,
  FolderCard
} from './StyledComponents/MyDocsStyles';
import { fileIconMapper } from './Helpers'; 
import axios from "./../axiosConfig";
import styled from 'styled-components';

const PageTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 600;
  color: #4A90E2;
  text-align: center;
  margin-bottom: 2rem;
`;

function ISharedWith() {
  const { userId } = useContext(AuthContext);
  const [sharedItems, setSharedItems] = useState([]);

  const getSharedWith= async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/v1/shared-by-me?userId=${userId}`);

      console.log('response:', response);
      setSharedItems(response.data.items);
    } catch (error) {
      console.error('Error retrieving shared with me docs:', error);
    }
  };

  useEffect(() => {
    if (userId) {
      getSharedWith()   
    }  
  }, [userId]);
  function viewFolder(item) {
    setSharedItems(item.id); 
  };
  return (
    <div>
      <PageTitle>I Shared With</PageTitle>
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

