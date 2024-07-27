import React, {useState} from 'react'
import styled from 'styled-components'
import ImgAttachment from '../../assets/images/ChatImages/img-attachment.png'
import FileAttachment from '../../assets/images/ChatImages/file-attachment.png'
import Send from '../../assets/images/ChatImages/send.png'

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

    const handleSend = () => {
        sendMessage(inputValue);
        setInputValue(""); // Clear the input after sending
        console.log("inputValue : ", inputValue)
    };
  return (
    <InputSection>
        <UserInput type="text" placeholder="Type a message" value={inputValue} onChange={(e) => setInputValue(e.target.value)}/>
        <InputOptions>
            <InputImg src={FileAttachment} alt="File Attachment"/>
            <input type="file" id="file" style={{display: "none"}}/>
            <InputImg src={ImgAttachment} alt="Image Attachment"/>
            <SendButton type="submit" onClick={handleSend}>
                <InputImg src={Send} alt="Send"/>
            </SendButton> 
        </InputOptions>
    </InputSection>
  )
}

export default InputComponent