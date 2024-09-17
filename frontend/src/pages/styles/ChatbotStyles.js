import styled from 'styled-components';


export const FileContainer = styled.div`
    display: flex;
    flex-direction: ${(props) => (props.isSmallScreen ? 'column' : 'row')};
    justify-content: center;
    height: 100%;
    width: 100%;
    padding: 20px;
`;


export const FileUploadContainer = styled.div`
    display: flex;
    flex-direction: column;
    margin-top: 0; 
    
    @media (max-width: 800px) {
        width: 35%;
    }
    @media (max-width: 650px) {
        width: 100%;
        order: -1; 
    }

`;


export const FilesUploadTitle = styled.h2`
    font-size: 20px;
    margin: 20 ;
    text-align: center;
    
`;


export const ChatContainer = styled.div`

    background-color: #ffffff;
    width: 70%;
    @media (max-width: 650px ) {
        width: 100%;
        max-width: 100%;
        height: 100%;
    }

`;  


export const ToggleButton = styled.button`
  display: none;
  position: absolute;
  top: 10px;
  left: 10px;
  font-size: 24px;
  background: none;
  border: none;
  cursor: pointer;

  @media (max-width: 650px) {
    display: block;
  }
`;