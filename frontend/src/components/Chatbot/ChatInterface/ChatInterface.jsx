import React, { useState, useContext, useEffect, useRef } from 'react';
import { AuthContext } from './../../Auth/AuthContext';
import remarkGfm from 'remark-gfm';
import { ChatInterfaceContainer, ChatInterfaceMessages, ChatInterfaceMessageLlm, ChatInterfaceMessageUser, ChatInterfaceInput, ChatInterfaceSubmitButton, ChatInterfaceForm, FileUploadButton, FileUploadContainer, FilesUploadTitle, ChatInputContainer, FileUpload, Header, BackButton, ChatTitle} from './ChatInterfaceStyles';
import ReactMarkdown from 'react-markdown';

import DocumentList from '../DocumentUpload/DocumentList';

const ChatInterface = ({ onFileSelect, documents, chatId, toggleChatHistory, isSmallScreen }) => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [file, setFile] = useState(null);
  const fileInputRef = useRef();
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [error, setError] = useState(null);
  const { doctorId, patientId, userType } = useContext(AuthContext);
  const [chats, setChats] = useState([]);

  const updateChatHistory = (chatId, lastMessageDate) => {
    setChats(prevChats => {
      const updatedChats = prevChats.map(chat => {
        if (chat.id === chatId) {
          return { ...chat, last_message_date: lastMessageDate };
        }
        return chat;
      });
      return updatedChats.sort((a, b) => new Date(b.last_message_date) - new Date(a.last_message_date));
    });
  };
  let userIdStr = userType === 'doctor' ? doctorId : patientId;
  const handleInputChange = (event) => {
    setUserInput(event.target.value);
  };
    
  const chat_id = chatId;

  const handleSelectDocument = (document) => {
    
    setSelectedDocument(document);
  };

  const handleFileSelect = (event) => {
    const selectedFiles = event.target.files;
    if (selectedFiles.length) {
      setFile(selectedFiles[0]);
      onFileSelect(selectedFiles);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current.click(); 
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!userInput.trim()) return;
  
    const userMessage = { agent_role: 'user', user_message: userInput };
    setMessages(prevMessages => [...prevMessages, userMessage]);

    setUserInput('');

    try {
      const response = await fetch('http://localhost:8000/v1/qa-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_message: userInput, userId: userIdStr, chat_id: chat_id }),
      });
  
      if (response.ok) {
        const data = await response.json();
        const now = new Date().toISOString();
        setMessages(prevMessages => [
          ...prevMessages.filter(msg => msg.user_message !== userInput), 
          userMessage,
          { agent_role: 'assistant', answer: data.answer }
        ]);
        
        updateChatHistory(chat_id, now);
        
      } else {
        console.error('Failed to get the answer');
      }
    } catch (error) {
      console.error('Error during chat interaction:', error);
    }
  
    setUserInput(''); 
  };

  useEffect(() => {
    const fetchMessages = async () => {
      if (chatId) {
        try {
          const response = await fetch(`http://localhost:8000/v1/chat/${chatId}/messages`);
          if (response.ok) {
            const messagesData = await response.json();
            setMessages(messagesData);
          } else {
            console.error('Failed to fetch messages');
          }
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      }
    };

    setMessages([]);
    fetchMessages();
  }, [chatId]); 
  
  return (
    <ChatInterfaceContainer>
      {isSmallScreen && (
        <Header>
          <BackButton onClick={toggleChatHistory}>
            &#8592;
          </BackButton>
          <ChatTitle>Chat</ChatTitle>
        </Header>
      )}
      <FileUploadContainer>
                <FilesUploadTitle></FilesUploadTitle>
                <DocumentList documents={documents} onSelectDocument={handleSelectDocument} />
      </FileUploadContainer>
      <ChatInterfaceMessages>
        {messages.map((msg, index) => (
          <div key={index}>
            {msg.user_message && (
              <ChatInterfaceMessageUser>
                {msg.user_message}
              </ChatInterfaceMessageUser>
            )}
            {msg.answer && (
              <ChatInterfaceMessageLlm>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {msg.answer}
               </ReactMarkdown>
                
              </ChatInterfaceMessageLlm>
            )}
          </div>
        ))}
      </ChatInterfaceMessages>

      
      <ChatInputContainer>
        <FileUpload htmlFor="file-upload">
          <FileUploadButton onClick={handleButtonClick}>+</FileUploadButton>
          <input 
          type="file" 
          onChange={handleFileSelect}
          multiple 
          ref={fileInputRef}
          style={{ display: 'none' }} 
          id="file-upload" 
        />
        </FileUpload>
       

        <ChatInterfaceForm onSubmit={handleSendMessage}>
          <ChatInterfaceInput
            type="text"
            value={userInput}
            onChange={handleInputChange}
            placeholder="Type your message..."
            
          />
          <ChatInterfaceSubmitButton type="submit"><span className='span1'>{'>'}</span></ChatInterfaceSubmitButton>
        </ChatInterfaceForm>
      </ChatInputContainer>
      
    </ChatInterfaceContainer>
  );
};

export default ChatInterface;