import styled from 'styled-components';

export const Container = styled.div`
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
  background: #f4f7fa;
  min-height: 100vh;
`;

export const SubHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

export const HeaderTitle = styled.h1`
  font-size: 32px;
  font-weight: 600;
  text-align: center;
  color: #333;
  margin-bottom: 30px;
`;

export const PathContainer = styled.div`
  display: flex;
  align-items: center;
  font-size: 18px;
  color: #555;
  span {
    margin-right: 10px;
    cursor: pointer;
    color: #007bff;
    &:hover {
      text-decoration: underline;
      color: #0056b3;
    }
  }
`;

export const FolderHandlingContainer = styled.div`
  display: flex;
  align-items: center;
  button {
    margin-left: 10px;
    background-color: #007bff;
    border: none;
    padding: 10px 20px;
    color: #fff;
    font-size: 16px;
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.3s ease;
    &:hover {
      background-color: #0056b3;
      transform: translateY(-2px);
    }
    &:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }
  }
`;

const buttonStyles = `
  border: none;
  color: white;
  padding: 10px 15px;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
  &:hover {
    background-color: darken($color, 10%);
    transform: translateY(-2px);
  }
`;

export const CreateFolderButton = styled.button`
  ${buttonStyles}
  background-color: #28a745;
`;

export const DeleteFolderButton = styled.button`
  ${buttonStyles}
  background-color: #dc3545;
`;

export const RenameFolderButton = styled.button`
  ${buttonStyles}
  background-color: #ffc107;
`;

export const UploadFolderButton = styled.button`
  ${buttonStyles}
  background-color: #007bff;
`;

export const FolderCardContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
`;

export const FolderCard = styled.div`
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s, box-shadow 0.3s;
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }
  .card-body {
    height: 250px;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
    i {
      font-size: 100px;
      color: #f0ad4e;
    }
  }
  .card-footer {
    background: #f8f9fa;
    border-top: 1px solid #ddd;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px;
    h3 {
      margin: 0;
      font-size: 1.25rem;
      color: #333;
      word-break: break-word;
    }
  }
`;

export const ContainerFileImage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f8f9fa;
  height: 100%;
  img {
    height: 200px;
    width: auto;
  }
`;
