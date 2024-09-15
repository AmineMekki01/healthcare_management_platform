import styled from 'styled-components';


export const Container = styled.div`
    display: flex;
    flex-direction: column;
    height: 100vh;
    align-items: center;
    width: 100%;
    @media (max-width: 650px ) {
        flex-direction: column;
    }
`;


export const FileContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    height: 100%;
    width: 100%;
    padding: 20px;
    
    @media (max-width: 650px) {
        flex-direction: column;
        align-items: flex-start;
        padding-top: 0; 
    }
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