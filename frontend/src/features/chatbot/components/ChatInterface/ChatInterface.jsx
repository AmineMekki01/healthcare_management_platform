import React, { useState, useContext, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../../auth/context/AuthContext';
import remarkGfm from 'remark-gfm';
import { ChatInterfaceContainer, ChatInterfaceMessages, ChatInterfaceMessageLlm, ChatInterfaceMessageUser, ChatInterfaceInput, ChatInterfaceSubmitButton, ChatInterfaceForm, FileUploadContainer, FilesUploadTitle, ChatInputContainer, Header, BackButton, ChatTitle} from './ChatInterface.styles';
import ReactMarkdown from 'react-markdown';
import DocumentList from '../DocumentUpload/DocumentList';
import FileUploadComponent from '../DocumentUpload/FileUpload';
import { PatientMention } from '../PatientMention';
import { messageService } from '../../services';

const ChatInterface = ({ onFileSelect, onDeleteDocument, documents, chatId, toggleChatHistory, isSmallScreen }) => {
  const { t } = useTranslation(['chatbot', 'common']);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [mentionedPatients, setMentionedPatients] = useState(new Map());
  const [cursorPosition, setCursorPosition] = useState(0);
  const [chats, setChats] = useState([]);
  const fileUploadRef = useRef();
  const inputRef = useRef();

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

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm(t('chatbot:interface.confirmDelete'))) {
      return;
    }

    try {
      await messageService.deleteMessage(messageId, userId);
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
      alert(t('chatbot:interface.deleteError', { error: error.message || t('chatbot:interface.unknownError') }));
    }
  };
  const handleInputChange = (event) => {
    const newValue = event.target.value;
    const newCursorPos = event.target.selectionStart;
      
    setUserInput(newValue);
    setCursorPosition(newCursorPos);
  };

  const handlePatientSelect = (patient, newValue, newCursorPos) => {
    setUserInput(newValue);
    setMentionedPatients(prev => {
      const updated = new Map(prev);
      updated.set(patient.full_name, patient);
      return updated;
    });
    
    if (inputRef.current) {
      inputRef.current.focus();
      setTimeout(() => {
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  const extractMentionedPatients = (message) => {
    return messageService.extractMentionedPatients(message, mentionedPatients);
  };
    

  const handleSelectDocument = (document) => {
    console.log('Selected document:', document);
  };

  const handleFileSelect = (selectedFiles) => {
    onFileSelect(selectedFiles);
  };

  useEffect(() => {
    if (fileUploadRef.current) {
      fileUploadRef.current.clearFiles();
    }
  }, [chatId]);



  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!userInput.trim()) return;

    if (!userId || userId === 'null' || userId === null || userId === undefined) {
      alert(t('chatbot:interface.loginRequired'));
      return;
    }

    const mentionedPatientsList = extractMentionedPatients(userInput);
    console.log('Mentioned patients list:', mentionedPatientsList);
    const patientId = mentionedPatientsList.length > 0 ? mentionedPatientsList[0].patient_id : null;

  
    const userMessage = { role: 'user', content: userInput, created_at: new Date().toISOString() };
    setMessages(prevMessages => [...prevMessages, userMessage]);

    const originalInput = userInput;
    setUserInput('');

    try {
      const aiMessage = await messageService.sendMessage({
        content: originalInput,
        chatId,
        userId,
        patientId
      });
      
      const normalizedAiMessage = { ...aiMessage, role: aiMessage.role }; 
      setMessages(prevMessages => [
        ...prevMessages.filter(msg => msg.content !== originalInput), 
        userMessage,
        normalizedAiMessage
      ]);
      
      updateChatHistory(chatId, new Date().toISOString());
    } catch (error) {
      console.error('Error during chat interaction:', error);
      alert(t('chatbot:interface.sendError'));
    }
  };

  useEffect(() => {
    const fetchMessages = async () => {
      if (chatId && userId && userId !== 'null' && userId !== null && userId !== undefined) {
        try {
          const messages = await messageService.getChatMessages(chatId, userId);
          setMessages(messages);
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
          <ChatTitle>{t('chatbot:interface.chatTitle')}</ChatTitle>
        </Header>
      )}
      <FileUploadContainer>
        <FilesUploadTitle>{t('chatbot:documentManagement.title')}</FilesUploadTitle>
        <DocumentList 
          documents={documents} 
          onSelectDocument={handleSelectDocument}
          onDeleteDocument={onDeleteDocument}
        />
        <div style={{ marginTop: '12px' }}>
          <FileUploadComponent ref={fileUploadRef} onFileSelect={handleFileSelect} />
        </div>
      </FileUploadContainer>
      <ChatInterfaceMessages>
        {messages.length === 0 && (
          <div style={{ color: '#888', fontSize: '14px', margin: '8px 0' }}>
            {t('chatbot:interface.noMessages')}
          </div>
        )}
        {messages.map((msg, index) => {
          const displayRole = msg.role || msg.role || 'assistant';
          if (!msg.role && !msg.role) {
            console.warn('Message without role encountered, defaulting to assistant:', msg);
          }
          return (
          <div key={msg.id || index} style={{ position: 'relative', marginBottom: '16px' }}>
            {displayRole === 'user' && (
              <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <ChatInterfaceMessageUser style={{ flex: 1 }}>
                  {msg.content}
                </ChatInterfaceMessageUser>
                <button
                  onClick={() => handleDeleteMessage(msg.id)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.8)',
                    border: 'none',
                    color: 'white',
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '4px',
                    opacity: 0.7,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { e.target.style.opacity = '1'; e.target.style.transform = 'scale(1.1)'; }}
                  onMouseLeave={(e) => { e.target.style.opacity = '0.7'; e.target.style.transform = 'scale(1)'; }}
                  title={t('chatbot:interface.deleteMessage')}
                >
                  ×
                </button>
              </div>
            )}
            {displayRole === 'assistant' && (
              <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <ChatInterfaceMessageLlm style={{ flex: 1 }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content}
                 </ReactMarkdown>
                </ChatInterfaceMessageLlm>
                <button
                  onClick={() => handleDeleteMessage(msg.id)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.8)',
                    border: 'none',
                    color: 'white',
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '4px',
                    opacity: 0.7,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { e.target.style.opacity = '1'; e.target.style.transform = 'scale(1.1)'; }}
                  onMouseLeave={(e) => { e.target.style.opacity = '0.7'; e.target.style.transform = 'scale(1)'; }}
                  title={t('chatbot:interface.deleteMessage')}
                >
                  ×
                </button>
              </div>
            )}
          </div>
          );
        })}
      </ChatInterfaceMessages>

      
      <ChatInputContainer>
        <ChatInterfaceForm onSubmit={handleSendMessage}>
          <ChatInterfaceInput
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={handleInputChange}
            onSelect={(e) => setCursorPosition(e.target.selectionStart)}
            placeholder={t('chatbot:interface.messagePlaceholder')}
          />
          <ChatInterfaceSubmitButton type="submit">
            <span className='span1'>→</span>
          </ChatInterfaceSubmitButton>
        </ChatInterfaceForm>
        <PatientMention
          inputValue={userInput}
          cursorPosition={cursorPosition}
          onPatientSelect={handlePatientSelect}
          onClose={() => {}}
          inputRef={inputRef}
        />
      </ChatInputContainer>
      
    </ChatInterfaceContainer>
  );
};

export default ChatInterface;
