const API_BASE_URL = 'http://localhost:3001';

// Helper function to perform the fetch and handle errors
async function fetchWithErrors(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return response.json();
}

export async function fetchFolders(userId, userType, parentId = null) {
  const url = new URL(`${API_BASE_URL}/folders`);
  const params = { user_id: userId, user_type: userType};
  if (parentId) params.parent_id = parentId;
  url.search = new URLSearchParams(params).toString();

  return fetchWithErrors(url);
}

export async function fetchBreadcrumbs(folderId) {
  const url = `${API_BASE_URL}/folders/${folderId}/breadcrumbs`;
  return fetchWithErrors(url);
}

export async function createFolder(name, userId, userType, parentId = null) {
  const url = `${API_BASE_URL}/create-folder`;
  const body = JSON.stringify({
    name,
    user_id: userId,
    file_type: 'folder',
    user_type: userType,
    parent_id: parentId
  });

  return fetchWithErrors(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body
  });
}

export async function deleteFolder(folderId) {
  const url = `${API_BASE_URL}/delete-files/${folderId}`;
  return fetchWithErrors(url, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folderId })
  });
}


export async function updateFolderName(folderId, name) {
  const url = `${API_BASE_URL}/update-folder/${folderId}`;
  const body = JSON.stringify({ name });

  return fetchWithErrors(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: body
  });
}

export async function downloadFile(fileId) {
  const url = `${API_BASE_URL}/download-file/${fileId}`
  const response = await fetch(url, {
    method: 'GET',
    headers: {
    },
    redirect: 'follow' // This will follow any redirects
  });  console.log([...response.headers]); // Log all response headers

  if (!response.ok) {
    throw new Error('File download failed');
  }

  return response.blob();
}
