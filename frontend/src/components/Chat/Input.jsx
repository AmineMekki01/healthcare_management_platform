import React, {useState} from 'react'
import styled from 'styled-components'
import ImgAttachment from '../../assets/images/ChatImages/img-attachment.png'
import FileAttachment from '../../assets/images/ChatImages/file-attachment.png'
import Send from '../../assets/images/ChatImages/send.png'
import axios from './../axiosConfig';

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

const InputComponent = ({sendMessage}) => {

    const [inputValue, setInputValue] = useState("");
    const [attachedFile, setAttachedFile] = useState(null);

    const handleSend = async () => {
        if (attachedFile) {
            const formData = new FormData();
            formData.append('file', attachedFile);
            
            try {
                const response = await axios.post(`http://localhost:3001/upload`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                const fileUrl = response.data.fileUrl;
                sendMessage(`[File: ${attachedFile.name}](${fileUrl})`);
            } catch (error) {
                console.error('Error uploading file:', error);
            }
        } else if (inputValue.trim()) {
            sendMessage(inputValue)
        }

        setInputValue('');
        setAttachedFile(null);
    }; 

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setAttachedFile(file);
        }
    };

  return (
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
                onChange={handleFileChange}
            />
            <InputImg
                src={FileAttachment}
                alt="File Attachment"
                onClick={() => document.getElementById('fileInput').click()}
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
  )
}

export default InputComponent