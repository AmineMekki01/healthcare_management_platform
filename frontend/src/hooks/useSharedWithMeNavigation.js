import { useState, useEffect } from 'react';
import axios from './../components/axiosConfig';

export const useSharedWithMeNavigation = (userId, folderId) => {
  const [folders, setFolders] = useState([]);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [currentPath, setCurrentPath] = useState([]);

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const response = await axios.get('/api/v1/folders', {
          params: {
            user_id: userId,
            shared_with_me: 'true',
            parent_id: folderId || '',
          },
        });
        console.log('Fetched shared folders:', response.data);
        setFolders(response.data);

        if (folderId) {
          const breadcrumbResponse = await axios.get(`/api/v1/folders/${folderId}/breadcrumbs`);
          setBreadcrumbs(breadcrumbResponse.data);
        } else {
          setBreadcrumbs([]);
        }
      } catch (error) {
        console.error('Error fetching shared folders:', error);
      }
    };

    if (userId) {
      fetchFolders();
    }
  }, [userId, folderId]);

  useEffect(() => {
    const newPath = [...currentPath.filter((id) => id !== null)];
    if (folderId && !newPath.includes(folderId)) {
      newPath.push(folderId);
    }
    setCurrentPath(newPath);
  }, [folderId]);

  return { folders, setFolders, breadcrumbs, currentPath, setCurrentPath };
};
