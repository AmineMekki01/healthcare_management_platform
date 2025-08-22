import React, { useState, useContext } from 'react';
import styled from 'styled-components';
import { AuthContext } from './../../../features/auth/context/AuthContext';
import { ChatContext } from '../contexts/ChatContext'; 
import chatService from '../services/chatService';

const SearchContainer = styled.div`
  padding: 20px 20px 16px 20px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 20px;
    right: 20px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.3), transparent);
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 14px 20px 14px 48px;
  border: 2px solid rgba(226, 232, 240, 0.6);
  border-radius: 16px;
  background: rgba(248, 250, 252, 0.8);
  backdrop-filter: blur(10px);
  color: #1a202c;
  font-size: 15px;
  outline: none;
  transition: all 0.3s ease;
  font-weight: 400;
  position: relative;
  
  &::placeholder {
    color: #94a3b8;
    font-weight: 400;
  }
  
  &:focus {
    border-color: #667eea;
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 
      0 0 0 4px rgba(102, 126, 234, 0.1),
      0 4px 16px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
  }
  
  &:before {
    content: '🔍';
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 16px;
    opacity: 0.6;
  }
`;

const SearchInputWrapper = styled.div`
  position: relative;
  
  &::before {
    content: '🔍';
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 16px;
    opacity: 0.6;
    z-index: 1;
    pointer-events: none;
  }
`;

const SearchResults = styled.div`
  max-height: 240px;
  overflow-y: auto;
  margin-top: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(226, 232, 240, 0.6);
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(248, 250, 252, 0.5);
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #cbd5e0 0%, #a0aec0 100%);
    border-radius: 2px;
  }
`;

const UserResult = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  cursor: pointer;
  border-radius: 0;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &:first-child {
    border-radius: 12px 12px 0 0;
  }
  
  &:last-child {
    border-radius: 0 0 12px 12px;
  }
  
  &:only-child {
    border-radius: 12px;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover {
    background: rgba(255, 255, 255, 0.9);
    transform: translateY(-1px);
    
    &::before {
      opacity: 1;
    }
  }
  
  > * {
    position: relative;
    z-index: 1;
  }
`;

const UserAvatar = styled.img`
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(226, 232, 240, 0.6);
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  ${UserResult}:hover & {
    transform: scale(1.05);
    border-color: rgba(102, 126, 234, 0.4);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
`;

const UserName = styled.span`
  color: #1a202c;
  font-weight: 600;
  font-size: 15px;
  transition: all 0.3s ease;
`;

const UserType = styled.span`
  color: #64748b;
  font-size: 13px;
  text-transform: capitalize;
  font-weight: 500;
  background: rgba(102, 126, 234, 0.1);
  padding: 2px 8px;
  border-radius: 8px;
  display: inline-block;
  width: fit-content;
  transition: all 0.3s ease;
  
  ${UserResult}:hover & {
    background: rgba(102, 126, 234, 0.15);
    color: #4f46e5;
  }
`;

const ErrorMessage = styled.div`
  color: #dc2626;
  font-size: 13px;
  margin-top: 12px;
  text-align: center;
  padding: 12px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(239, 68, 68, 0.2);
`;

const SearchComponent = ({ onUserSelect, onSelectChat }) => {
  const [username, setUsername] = useState('');
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(false);
  const { userId, userType } = useContext(AuthContext);
  const { state, dispatch } = useContext(ChatContext);

  const handleSearch = async () => {
    if (!username.trim()) {
      setUsers([]);
      return;
    }

    try {
      const users = await chatService.searchUsers(username, userId, userType);
      setUsers(users); 
      setError(false);
    } catch (err) {
      console.error("Search failed:", err);
      setUsers([]);
      setError(true);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setUsername(value);
    
    if (value.trim()) {
      const timeoutId = setTimeout(handleSearch, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setUsers([]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleSelect = (user) => {
    createOrSelectChat(user);
    setUsers([]);
    setUsername('');
  };

  const createOrSelectChat = async (selectedUser) => {
    if (!userId || !selectedUser.userId) {
      console.error("Missing userId or selectedUserId");
      return;
    }

    try {
      const response = await chatService.findOrCreateChat(
        userId,
        selectedUser.userId,
        userType,
        selectedUser.userType
      );
    
      const { chats } = response;
      if (chats && chats.length > 0) {
        const newChat = chats[0];
        onUserSelect(selectedUser, newChat.recipientUserId); 
        onSelectChat(newChat); 
        dispatch({ type: 'ADD_OR_UPDATE_CHAT', payload: newChat });
        dispatch({ type: 'SET_CURRENT_CHAT', payload: newChat });
      } else {
        console.error('No chat ID returned from the server.');
      }
    } catch (error) {
      console.error('Error finding or creating chat:', error);
    }
  };

  return (
    <SearchContainer>
      <SearchInputWrapper>
        <SearchInput
          placeholder="Search for users..."
          value={username}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
        />
      </SearchInputWrapper>
      
      {users.length > 0 && (
        <SearchResults>
          {users.map((user, index) => (
            console.log('Rendering user:', user),
            <UserResult key={user.userId || index} onClick={() => handleSelect(user)}>
              <UserAvatar
                src={user.profile_photo_url || user.profile_photo}
                alt={`${user.firstName} ${user.lastName}`}
              />
              <UserInfo>
                <UserName>
                  {`${user.firstName || ''} ${user.lastName || ''}`}
                </UserName>
                {user.userType && (
                  <UserType>{user.userType}</UserType>
                )}
              </UserInfo>
            </UserResult>
          ))}
        </SearchResults>
      )}

      {error && (
        <ErrorMessage>
          Search failed. Please try again.
        </ErrorMessage>
      )}
    </SearchContainer>
  );
};

export default SearchComponent;

