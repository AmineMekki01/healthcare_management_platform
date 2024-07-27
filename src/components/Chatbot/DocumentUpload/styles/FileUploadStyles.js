import styled from 'styled-components';

export const UploadFileForm = styled.form`

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0;
`;

export const UploadFileFormInput = styled.input`
    padding: 10px;
    border: 0;
    font-size: 20px;
    &:focus {
        outline: none;
    }
    width: 70%;
    margin: 0 auto;
`;

export const UploadFileFormSubmitButton = styled.button`
    background: #121F49;
    color: #fff;
    font-size: 20px;
    padding: 10px;
    width: 120px;
    border: 0;
`;

export const CustomUploadLabel = styled.label`
    padding: 10px;
    border: 1px solid #ccc;
    display: block;
    width: 70%;
    text-align: center;
    margin: 10px auto;
    cursor: pointer;
`;