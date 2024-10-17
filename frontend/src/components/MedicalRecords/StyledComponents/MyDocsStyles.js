import styled from 'styled-components';


const primaryColor = "#4A90E2";
const secondaryColor = "#F5F7FA";
const accentColor = "#FFC107";
const dangerColor = "#E94E77";
const successColor = "#27AE60";
const textColor = "#333";
const hoverEffect = "0 10px 20px rgba(0, 0, 0, 0.2)";


export const Container = styled.div`
  width: 100%;
  padding: 40px;
  box-sizing: border-box;
  background: ${secondaryColor};
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const HeaderTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 600;
  color: ${primaryColor};
  margin-bottom: 30px;
  text-align: center;
`;

export const SubHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 1200px;
  margin-bottom: 20px;
`;


export const PathContainer = styled.div`
  display: flex;
  align-items: center;
  font-size: 1.2rem;
  color: ${textColor};
  span {
    margin-right: 10px;
    cursor: pointer;
    color: ${primaryColor};
    &:hover {
      text-decoration: underline;
    }
  }
`;

export const FolderHandlingContainer = styled.div`
  display: flex;
  align-items: center;

  button {
    margin-left: 15px;
    background-color: ${primaryColor};
    border: none;
    padding: 12px 20px;
    color: white;
    font-size: 1rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    &:hover {
      background-color: darken(${primaryColor}, 10%);
      transform: translateY(-2px);
      box-shadow: ${hoverEffect};
    }
    &:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }
  }
`;

const buttonStyles = `
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${hoverEffect};
  }
`;

export const CreateFolderButton = styled.button`
  ${buttonStyles}
  background-color: ${successColor};
`;

export const DeleteFolderButton = styled.button`
  ${buttonStyles}
  background-color: ${dangerColor};
`;

export const RenameFolderButton = styled.button`
  ${buttonStyles}
  background-color: ${accentColor};
`;

export const UploadFolderButton = styled.button`
  ${buttonStyles}
  background-color: ${primaryColor};
`;

export const FolderCardContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  width: 100%;
  max-width: 1200px;
`;

export const FolderCard = styled.div`
  background: white;
  border-radius: 10px;
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  &:hover {
    transform: translateY(-5px);
    box-shadow: ${hoverEffect};
  }

  .card-body {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 30px;
    font-size: 5rem;
    color: ${accentColor};
  }

  .card-footer {
    background: ${secondaryColor};
    padding: 15px;
    border-top: 1px solid #ddd;
    text-align: center;
    h3 {
      margin: 0;
      font-size: 1.5rem;
      color: ${textColor};
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
