import React, { useState, useContext } from 'react';
import styled from 'styled-components';
import ImgAttachment from '../../assets/images/ChatImages/img-attachment.png';
import Send from '../../assets/images/ChatImages/send.png';
import axios from './../axiosConfig';
import { AuthContext } from '../Auth/AuthContext';
import { ChatContext } from './ChatContext'; 

const InputSection = styled.div`
    background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
    display: flex;
    align-items: center;
    padding: 20px 24px;
    border-top: 1px solid rgba(226, 232, 240, 0.6);
    position: relative;
    
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.3), transparent);
    }
`;

const InputContainer = styled.div`
    flex: 1;
    position: relative;
    background: rgba(248, 250, 252, 0.8);
    backdrop-filter: blur(10px);
    border-radius: 28px;
    border: 2px solid rgba(226, 232, 240, 0.6);
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    
    &:focus-within {
        border-color: #667eea;
        background: rgba(255, 255, 255, 0.95);
        box-shadow: 
            0 0 0 4px rgba(102, 126, 234, 0.1),
            0 4px 16px rgba(0, 0, 0, 0.08);
        transform: translateY(-1px);
    }
`;

const UserTextarea = styled.textarea`
    width: 100%;
    min-height: 44px;
    max-height: 120px;
    border: none;
    padding: 12px ${props => props.hasImage ? '60px' : '20px'} 12px 20px;
    outline: none;  
    color: #1a202c;
    font-size: 15px;
    background: transparent;
    resize: none;
    border-radius: 24px;
    font-family: inherit;
    line-height: 1.5;
    transition: all 0.2s ease;

    &::placeholder {
        color: #a0aec0;
        font-weight: 400;
    }
    
    &:focus {
        color: #2d3748;
    }
`;

const InputOptions = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    margin-left: 16px;
`;

const AttachButton = styled.label`
    height: 48px;
    width: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 50%;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border: 2px solid rgba(226, 232, 240, 0.6);
    transition: all 0.3s ease;
    position: relative;
    
    &::before {
        content: '';
        position: absolute;
        inset: -2px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea, #764ba2);
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: -1;
    }
    
    &:hover {
        border-color: transparent;
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
        
        &::before {
            opacity: 1;
        }
        
        img {
            filter: brightness(0) invert(1);
        }
    }
`;

const InputImg = styled.img`
    height: 18px;
    width: 18px;
    transition: filter 0.3s ease;
`;

const SendButton = styled.button`
    height: 48px;
    width: 48px;
    cursor: pointer;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
    position: relative;
    
    &::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    &:hover:not(:disabled) {
        transform: scale(1.05);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        
        &::before {
            opacity: 1;
        }
    }
    
    &:active:not(:disabled) {
        transform: scale(0.95);
    }
    
    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
        background: #e2e8f0;
        box-shadow: none;
        
        &::before {
            display: none;
        }
    }
    
    img {
        filter: brightness(0) invert(1);
        height: 20px;
        width: 20px;
        position: relative;
        z-index: 1;
    }
`;

const ImagePreviewWrapper = styled.div`
    position: absolute;
    top: -60px;
    left: 16px;
    display: flex;
    align-items: center;
    background: white;
    padding: 8px 12px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
`;

const ImagePreview = styled.img`
    max-height: 40px;
    border-radius: 4px;
`;

const RemovePreviewButton = styled.button`
    background: #e53e3e;
    border: none;
    color: white;
    cursor: pointer;
    font-size: 12px;
    margin-left: 8px;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.2s ease;
    
    &:hover {
        background: #c53030;
    }
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
                        <RemovePreviewButton onClick={removePreview}>×</RemovePreviewButton>
                    </ImagePreviewWrapper>
                )}
                <UserTextarea
                    placeholder="Type your message..."
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
                <AttachButton htmlFor="fileInput">
                    <InputImg src={ImgAttachment} alt="Attach" />
                </AttachButton>
                <SendButton 
                    type="button" 
                    onClick={handleSend}
                    disabled={!inputValue.trim() && !attachedFile}
                >
                    <img src={Send} alt="Send" />
                </SendButton>
            </InputOptions>
        </InputSection>
    );
};

export default InputComponent;
