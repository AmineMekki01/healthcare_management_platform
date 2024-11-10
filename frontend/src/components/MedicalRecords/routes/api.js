import axios from "./../../axiosConfig";

export async function fetchFolders(userId, userType, parentId = null, isSharedWithMe = false) {
  const params = { user_id: userId, user_type: userType };
  params.parent_id = parentId;
  params.shared_with_me = isSharedWithMe;

  console.log("params : ", params)
  try {
    const response = await axios.get('/api/v1/folders', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function fetchBreadcrumbs(folderId) {
  try {
    const response = await axios.get(`/api/v1/folders/${folderId}/breadcrumbs`);
    return response.data;
  } catch (error) {
    throw error;
  }
}


export async function createFolder(name, userId, userType, parentId = null) {
  const data = {
    name,
    user_id: userId,
    file_type: 'folder',
    user_type: userType,
    parent_id: parentId
  };
  
  try {
    const response = await axios.post('/api/v1/create-folder', data);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function deleteFolder(folderId) {
  try {
    const response = await axios.delete(`/api/v1/delete-files/${folderId}`, {
      data: { folderId }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function updateFolderName(folderId, name) {
  try {
    const response = await axios.patch(`/api/v1/update-folder/${folderId}`, { name });
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function downloadFile(fileId) {
  try {
    const response = await axios.get(`/api/v1/download-file/${fileId}`, {
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function renameItem(id, name) {
  try {
    const response = await axios.patch('/api/v1/rename-item', { id, name });
    return response.data;
  } catch (error) {
    throw error;
  }
}