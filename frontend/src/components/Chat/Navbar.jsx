import React from 'react'
import styled from 'styled-components'

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
  return (
    <Navbar>
        <Logo className='logo'>TBIBI Chat</Logo>
        <User className='user'>
            <ProfileImg src="https://images.pexels.com/photos/15031666/pexels-photo-15031666/free-photo-of-portrait-of-a-girl.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" alt=""/>
            <span>MK</span>
        </User>
    </Navbar>
  )
}

export default NavbarComponent