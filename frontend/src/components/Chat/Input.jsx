import React, { useState, useContext } from 'react';
import styled from 'styled-components';
import ImgAttachment from '../../assets/images/ChatImages/img-attachment.png';
import FileAttachment from '../../assets/images/ChatImages/file-attachment.png';
import Send from '../../assets/images/ChatImages/send.png';
import axios from './../axiosConfig';
import { AuthContext } from '../Auth/AuthContext';
import { ChatContext } from './ChatContext'; 

const InputSection = styled.div`
    height: 50px;
    background-color: #fff;
    padding: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

const UserInput = styled.input`
    width: calc(100% - 92px);
    border: none;
    outline: none;  
    color: #121F49;
    font-size: 16px;

    &::placeholder {
        color: lightgray;
    }
`;

const InputOptions = styled.div`
    width: fit-content;
    display: flex;
    align-items: center;
    gap: 10px;
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
`;

const ImagePreview = styled.img`
    max-width: 200px;
    max-height: 200px;
    margin-top: 10px;
    border-radius: 8px;
`;

const InputComponent = ({ sendMessage }) => {
    const [inputValue, setInputValue] = useState('');
    const [attachedFile, setAttachedFile] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
    const { userId } = useContext(AuthContext);
    const { state, dispatch } = useContext(ChatContext); 
    const { currentChat } = state;

    const logFormData = (formData) => {
        for (let pair of formData.entries()) {
            console.log(pair[0] + ': ' + pair[1]);
        }
    };

    const handleSend = async () => {
        if (attachedFile) {
            if (!userId) {
                return;
            }
            const formData = new FormData();
            formData.append('file', attachedFile);
            formData.append('userId', userId);
            formData.append('chat_id', currentChat.id)
            logFormData(formData);
            try {
                const response = await axios.post(`http://localhost:3001/api/v1/upload-image`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                console.log("response : ", response)
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

    return (
        <div>
            <InputSection>
                <UserInput
                    type="text"
                    placeholder="Type a message"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                />
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
                    <SendButton type="submit" onClick={handleSend}>
                        <InputImg src={Send} alt="Send" />
                    </SendButton>
                </InputOptions>
            </InputSection>

            {imagePreviewUrl && (
                <ImagePreview src={imagePreviewUrl} alt="Preview" />
            )}
        </div>
    );
};

export default InputComponent;
