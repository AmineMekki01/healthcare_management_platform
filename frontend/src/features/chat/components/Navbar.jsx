import React, { useContext } from 'react';
import styled from 'styled-components'
import { AuthContext } from './../../../features/auth/context/AuthContext';

const Navbar = styled.div`
    display: flex;
    align-items: center;
    background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
    height: 70px;
    padding: 0 24px;
    justify-content: space-between;
    color: white;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    position: relative;
    
    &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    }
`;

const Logo = styled.span`
    font-weight: 700;
    font-size: 20px;
    color: white;
    cursor: default;
    transition: all 0.3s ease;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    position: relative;
    
    &::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 2px;
        background: rgba(255, 255, 255, 0.8);
        transition: width 0.3s ease;
    }
    
    &:hover {
        transform: scale(1.05);
        text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        
        &::after {
            width: 100%;
        }
    }
`;

const User = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    border-radius: 25px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;
    cursor: pointer;
    
    &:hover {
        background: rgba(255, 255, 255, 0.25);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
`;

const ProfileImg = styled.img`
    height: 36px;
    width: 36px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(255, 255, 255, 0.3);
    transition: all 0.3s ease;
    position: relative;
    
    ${User}:hover & {
        border-color: rgba(255, 255, 255, 0.6);
        transform: scale(1.05);
    }
`;

const ProfileContainer = styled.div`
    position: relative;
    display: flex;
    align-items: center;
`;

const OnlineStatusIndicator = styled.div`
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 12px;
    height: 12px;
    background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
    border: 2px solid rgba(255, 255, 255, 0.8);
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    animation: pulse-online 2s infinite;
    
    @keyframes pulse-online {
        0% {
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        50% {
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2), 0 0 0 4px rgba(16, 185, 129, 0.3);
        }
        100% {
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
    }
`;

const UserName = styled.span`
    font-weight: 600;
    font-size: 15px;
    color: white;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    margin-left: 4px;
`;



const NavbarComponent = () => {
    const { userFullName, userProfilePictureUrl } = useContext(AuthContext);
    return (
        
        <Navbar>
            <Logo className='logo'>TBIBI Chat</Logo>
            <User className='user'>
                <ProfileContainer>
                    <ProfileImg src={userProfilePictureUrl} alt=""/>
                    <OnlineStatusIndicator />
                </ProfileContainer>
                <UserName>{userFullName && userFullName.split(' ')[0] || ''}</UserName>
            </User>
        </Navbar>
    )
}

export default NavbarComponent