import React, { useContext } from 'react';
import styled from 'styled-components'
import { AuthContext } from '../Auth/AuthContext';

const Navbar = styled.div`
    display: flex;
    align-items: center;
    background-color: #121F49;
    height: 50px;
    padding: 10px;
    justify-content: space-between;
    color: #ddddf7;
`;

const Logo = styled.span`
    font-weight: bold;
`;

const User = styled.div`
    display: flex;
    // align-items: center;
    gap: 10px;
`;

const ProfileImg = styled.img`
    background-color: #ddddf7;
    height: 24px;
    width: 24px;
    border-radius: 50%;
    object-fit: cover;
`;



const NavbarComponent = () => {
    const { userFullName, userProfilePhotoUrl } = useContext(AuthContext);
  return (
    
    <Navbar>
        <Logo className='logo'>TBIBI Chat</Logo>
        <User className='user'>
            <ProfileImg src={userProfilePhotoUrl} alt=""/>
            <span>{userFullName && userFullName.split(' ')[0] || ''}</span>
        </User>
    </Navbar>
  )
}

export default NavbarComponent