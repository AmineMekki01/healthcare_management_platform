import styled from 'styled-components';


export const ChatInterfaceContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    max-width: 600px;
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

export const ChatInterfaceForm = styled.form`
    display: flex; 
    flex-direction: row; 
    justify-content: space-between;
    width: 100%;
    max-width: 650px;
    min-width: 350px;

    padding: 0;
    margin: 0 auto; 

    border-top: 1px solid black;

    @media (max-width: 768px) {
        width: 100%;
        min-width: 250px;
    }

    @media (max-width : 300px) {
        width: 100%;
        min-width: 0px;
    }

`;

export const ChatInterfaceMessageLlm = styled.li`
    display: flex;
    align-items: start;
    justify-content: flex-start;
    width: fit-content;
    padding: 10px;
    margin-bottom: 10px;
    border-radius: 12px;
    background: #EDEDEF;
    margin-right: auto;
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


export const ChatInterfaceInput = styled.input`
    padding: 10px;
    border: 0;
    width: 100%;
    font-size: 20px;
    &:focus {
        outline: none;
    }
`;

export const ChatInterfaceSubmitButton = styled.button`
    background: #121F49;
    color: #fff;
    font-size: 20px;
    padding: 10px;
    width: fit-content;
    border: 0;
    height: 100%;
    display: flex;
    align-items: flex-end;

    // change the content of the span element 
    .span2 {
        display: none;

    }

    @media (max-width: 250px) {
        .span1 {
            display: none;
        }
        .span2 {
            display: flex;
        }
    }

`;





export const FileUploadButton = styled.button`
    background: #121F49;
    color: #fff;
    font-size: 20px;
    padding: 10px;
    width: 120px;
    border: 0;
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