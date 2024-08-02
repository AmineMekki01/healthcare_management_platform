import React , {useState, useContext, useEffect} from 'react'
import styled from 'styled-components'
import { AuthContext } from '../Auth/AuthContext';
import { ChatContext } from './ChatContext'; 

const Search = styled.div`
    border-bottom : 1px solid #f6f6f6;
`; 

const SearchForm = styled.div`
    padding: 10px;
`; 

const Input = styled.input`
    background-color: transparent;
    border: none;
    color: white;
    outline: none;
    width: 100%;
    &::placeholder {
        color: lightgray;
    }
`; 

const UserChat = styled.div`
    padding: 10px;
    display: flex;
    align-items: center;
    gap: 10px;
    color: white;
    cursor: pointer;

    &:hover {
        background-color: #121F49;
    }
`; 

const UserChatImg = styled.img`
    width: 50px;
    height: 50px;
    border-radius: 50%;
    object-fit: cover;
`;

const UserChatInfo = styled.div`
 
`; 
const UserList = styled.div`
    max-height: 300px;
    overflow-y: auto;
    overflow-x: hidden;
    background: #1A233A;
    border-top: 1px solid #f6f6f6; 
`;
const SearchComponent = ({onUserSelect, onSelectChat }) => {

    const [username, setUsername] = useState('')
    const [users, setUsers] = useState([])
    const [error, setError] = useState(false)
    const { patientId, doctorId, userType } = useContext(AuthContext);
    const userId = userType === 'doctor' ? doctorId : patientId;
    const { state, dispatch } = useContext(ChatContext);


    const handleSearch = () => {
        console.log("Starting search for:", username);
        fetch(`http://localhost:3001/api/v1/search/${username}/${userId}`)
        .then(res => res.json())
        .then(data => {
            console.log("Search results:", data.users);
            setUsers(data.users); 
            setError(false)
        })
        .catch(err => {
            console.error("Search failed:", err);
            setUsers([])
            setError(true)
        })
    }

    const handleKey = (e) => {
        if (e.code === "Enter") {
            console.log("Enter key pressed, initiating search");
            handleSearch();
        }
    }

    const handleSelect = (user) => {
        console.log("User selected from search:", user);
        createOrSelectChat(user);
        setUsers([]);
      };

    const createOrSelectChat = (selectedUser) => {
        if (!userId || !selectedUser.user_id) {
            console.error("Missing userId or selectedUserId");
            return;
        }
        console.log("Creating or selecting chat for user ID:", selectedUser.user_id);
        fetch(`http://localhost:3001/api/findOrCreateChat?currentUserId=${userId}&selectedUserId=${selectedUser.user_id}`)

            .then(response => response.json())
            .then(data => {
                if(data) {
                    const newChat = data.chats[0];
                    console.log("Chat found or created:", newChat);
                    onUserSelect(selectedUser, data.recipient_user_id); 
                    onSelectChat(newChat); 
                    dispatch({ type: 'SET_CURRENT_CHAT', payload: newChat });
                    
                    } else {
                    console.error('No chat ID returned from the server.');
                }
            })
            .catch(error => console.error('Error finding or creating chat:', error));
    };

  return (
    <Search>
        <SearchForm>
            <Input type="text" placeholder="Find a user : " onKeyDown={handleKey} onChange={e=>setUsername(e.target.value)}/>
        </SearchForm>
        <UserList>
            {users && users.map((user, index) => (
                <UserChat key={index} onClick={() => handleSelect(user)}>
                <UserChatImg src="https://images.pexels.com/photos/15835264/pexels-photo-15835264/free-photo-of-woman-wearing-a-hat.jpeg?auto=compress&cs=tinysrgb&w=600&lazy=load" alt=""/>
                    <UserChatInfo>  
                        <span>{`${user.first_name} ${user.last_name}`}</span>
                    </UserChatInfo>
                </UserChat>
            
            ))}
        </UserList>
    
    </Search>
  )
}

export default SearchComponent

