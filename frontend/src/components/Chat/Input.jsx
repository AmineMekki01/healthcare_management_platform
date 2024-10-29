import React, { useState, useContext } from 'react';
import styled from 'styled-components';
import ImgAttachment from '../../assets/images/ChatImages/img-attachment.png';
import Send from '../../assets/images/ChatImages/send.png';
import axios from './../axiosConfig';
import { AuthContext } from '../Auth/AuthContext';
import { ChatContext } from './ChatContext'; 

const InputSection = styled.div`
    background-color: #fff;
    display: flex;
    align-items: center;
`;

const InputContainer = styled.div`
    flex: 1;
    position: relative;
        height: 50px;

`;

const UserTextarea = styled.textarea`
    width: 100%;
    min-height: 50px;
    max-height: 50px;
    border: None;
    padding: 0;
    padding-left: ${props => props.hasImage ? '60px' : '5px'};
    outline: none;  
    color: #121F49;
    font-size: 16px;
    background-color: #f9f9f9;
    resize: none;

    &::placeholder {
        color: lightgray;
    }
`;

const InputOptions = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    margin-left: 10px;
    padding: 10px;
`;

const InputImg = styled.img`
    height: 24px;
    width: 24px;
    cursor: pointer;
`;

const SendButton = styled.button`
    height: 24px;
    width: 24px;
    cursor: pointer;
    background: none;
    border: none;
`;

const ImagePreviewWrapper = styled.div`
    position: absolute;
    top: 10px;
    left: 10px;
    display: flex;
    align-items: center;
`;

const ImagePreview = styled.img`
    max-height: 30px;
    border-radius: 8px;
`;

const RemovePreviewButton = styled.button`
    background: none;
    border: none;
    color: red;
    cursor: pointer;
    font-size: 16px;
    margin-left: 5px;
`;

const InputComponent = ({ sendMessage }) => {
    const [inputValue, setInputValue] = useState('');
    const [attachedFile, setAttachedFile] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
    const { userId } = useContext(AuthContext);
    const { state } = useContext(ChatContext); 
    const { currentChat } = state;

    const handleSend = async () => {
        if (attachedFile) {
            if (!userId) {
                return;
            }
            const formData = new FormData();
            formData.append('file', attachedFile);
            formData.append('userId', userId);
            formData.append('chat_id', currentChat.id);
            try {
                const response = await axios.post('http://localhost:3001/api/v1/upload-image', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                sendMessage(response.data.presigned_url, response.data.s3_key);
                setImagePreviewUrl(null);
            } catch (error) {
                console.error('Error uploading file:', error);
            }
        } else if (inputValue.trim()) {
            sendMessage(inputValue, null);
        }

        setInputValue('');
        setAttachedFile(null);
        setImagePreviewUrl(null);
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setAttachedFile(file);

            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removePreview = () => {
        setAttachedFile(null);
        setImagePreviewUrl(null);
    };

    return (
        <InputSection>
            <InputContainer>
                {imagePreviewUrl && (
                    <ImagePreviewWrapper>
                        <ImagePreview src={imagePreviewUrl} alt="Preview" />
                        <RemovePreviewButton onClick={removePreview}>✖</RemovePreviewButton>
                    </ImagePreviewWrapper>
                )}
                <UserTextarea
                    placeholder="Type a message"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    hasImage={!!imagePreviewUrl}
                />
            </InputContainer>
            <InputOptions>
                <input
                    type="file"
                    id="fileInput"
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleFileChange}
                />
                <InputImg
                    src={ImgAttachment}
                    alt="Image Attachment"
                    onClick={() => document.getElementById('fileInput').click()}
                />
                <SendButton type="button" onClick={handleSend}>
                    <InputImg src={Send} alt="Send" />
                </SendButton>
            </InputOptions>
        </InputSection>
    );
};

export default InputComponent;
