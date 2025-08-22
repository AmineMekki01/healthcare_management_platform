import React, { useState, useContext, useEffect, useRef } from 'react';
import { AuthContext } from '../../../auth/context/AuthContext';
import remarkGfm from 'remark-gfm';
import { ChatInterfaceContainer, ChatInterfaceMessages, ChatInterfaceMessageLlm, ChatInterfaceMessageUser, ChatInterfaceInput, ChatInterfaceSubmitButton, ChatInterfaceForm, FileUploadButton, FileUploadContainer, FilesUploadTitle, ChatInputContainer, FileUpload, Header, BackButton, ChatTitle} from './ChatInterface.styles';
import ReactMarkdown from 'react-markdown';
import DocumentList from '../DocumentUpload/DocumentList';
import FileUploadComponent from '../DocumentUpload/FileUpload';

const ChatInterface = ({ onFileSelect, documents, chatId, toggleChatHistory, isSmallScreen }) => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef();
  const fileUploadRef = useRef();
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [error, setError] = useState(null);
  const [chats, setChats] = useState([]);
  const { userId } = useContext(AuthContext);

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
  const handleInputChange = (event) => {
    setUserInput(event.target.value);
  };
    
  const chat_id = chatId;

  const handleSelectDocument = (document) => {
    setSelectedDocument(document);
  };

  const handleFileSelect = (selectedFiles) => {
    setFiles(selectedFiles);
    onFileSelect(selectedFiles);
  };

  useEffect(() => {
    setFiles([]);
    if (fileUploadRef.current) {
      fileUploadRef.current.clearFiles();
    }
  }, [chatId]);

  const handleButtonClick = () => {
    fileInputRef.current.click(); 
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!userInput.trim()) return;

    if (!userId || userId === 'null' || userId === null || userId === undefined) {
      alert('Please log in to send messages');
      return;
    }
  
    const userMessage = { agent_role: 'user', user_message: userInput };
    setMessages(prevMessages => [...prevMessages, userMessage]);

    setUserInput('');

    try {
      const response = await fetch('http://localhost:8000/v1/qa-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_message: userInput, userId: userId, chat_id: chat_id }),
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
      if (chatId && userId && userId !== 'null' && userId !== null && userId !== undefined) {
        try {
          const response = await fetch(`http://localhost:8000/v1/chat/${chatId}/messages`);
          if (response.ok) {
            const messagesData = await response.json();
            setMessages(messagesData);
          } else {
            console.error('Failed to fetch messages - Response not ok:', response.status);
          }
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      } else {
        setMessages([]);
      }
    };

    fetchMessages();
  }, [chatId, userId]);
  
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
        <FilesUploadTitle>Documents</FilesUploadTitle>
        <DocumentList documents={documents} onSelectDocument={handleSelectDocument} />
        <div style={{ marginTop: '12px' }}>
          <FileUploadComponent ref={fileUploadRef} onFileSelect={handleFileSelect} />
        </div>
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
        <ChatInterfaceForm onSubmit={handleSendMessage}>
          <ChatInterfaceInput
            type="text"
            value={userInput}
            onChange={handleInputChange}
            placeholder="Type your message..."
          />
          <ChatInterfaceSubmitButton type="submit">
            <span className='span1'>→</span>
          </ChatInterfaceSubmitButton>
        </ChatInterfaceForm>
      </ChatInputContainer>
      
    </ChatInterfaceContainer>
  );
};

export default ChatInterface;
