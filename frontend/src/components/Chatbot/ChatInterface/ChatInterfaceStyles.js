import styled from 'styled-components';


export const ChatInterfaceContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    margin: 0 auto;
    background-color: #ffffff;
    border: 1px solid black;

    @media (max-width: 650px ) {
        width: 90%;        
    }

    @media (max-width: 400px ) {
        width: 100%;        
    }
`;

export const ChatInterfaceMessages = styled.ul`
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 0;
    padding: 20px;
    overflow-y: scroll;
    scrollbar-width: none;

`;



export const ChatInterfaceMessageLlm = styled.li`
    align-items: start;
    justify-content: flex-start;
    width: fit-content;
    max-width: 80%; 
    padding: 15px;
    margin-bottom: 15px;
    border-radius: 15px;
    background: #E4E1E5;
    margin-right: auto;
    color: #333;
    font-size: 18px;
    line-height: 1.5;
`;

export const ChatInterfaceMessageUser = styled.li`
    display: flex;
    align-items: start;
    justify-content: flex-start;
    padding: 10px;
    margin-bottom: 10px;
    border-radius: 12px;
    max-width: 60%;
    width: fit-content;
    background: #775BFD;
    margin-left: auto;
    color: #fff;
`;

export const FilesUploadTitle = styled.div`
 
    padding: 10px;
    border: 0;
    font-size: 20px;
    &:focus {
        outline: none;
    }
    width: 70%;
    margin: 0 auto;
`;

export const FileUploadContainer = styled.div`

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0;
`;

export const ChatInputContainer = styled.div`
    display: flex;
    width: 100%;
`;

export const FileUploadButton = styled.button`
    color: #fff;
`;

export const FileUpload = styled.div`
    width: 10%;
    background: #121F49;
    display: flex;
    justify-content: center;
`;

export const ChatInterfaceForm = styled.form`
    display: flex; 
    width: 90%;
    border-top: 1px solid black;


    @media (max-width : 300px) {
        width: 100%;
        min-width: 0px;
    }

`;

export const ChatInterfaceInput = styled.input`
    padding: 10px;
    border: 0;
    font-size: 20px;
    width: 90%;
    &:focus {
        outline: none;
    }
`;


export const ChatInterfaceSubmitButton = styled.button`
    background: #121F49;
    width: 10%;
    color: #fff;
    font-size: 20px;
    padding: 10px;
`;

export const Header = styled.div`
  display: none;
  align-items: center;
  padding: 10px;
  background-color: #f5f5f5;

  @media (max-width: 650px) {
    display: flex;
  }
`;

export const BackButton = styled.button`
  font-size: 24px;
  background: none;
  border: none;
  cursor: pointer;
`;

export const ChatTitle = styled.h2`
  margin: 0;
  margin-left: 10px;
`;