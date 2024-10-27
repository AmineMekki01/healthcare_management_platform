import React, { useContext } from 'react';
import { useLocation } from 'react-router-dom';
import {
  NavbarContainer,
  LogoContainer,
  MenuList,
  MenuItem,
  LogoutMenuItem,
  MenuGroup,
  LowerMenuList,
  UserInfoContainer,
  UserInfoImage,
  UserInfo,
} from './MyNavbar.styles';
import { AuthContext } from './../../Auth/AuthContext';

function capitalizeWords(str) {
  if (!str) return ''; 
  return str.replace(/\b\w/g, char => char.toUpperCase());
}

const MyNavbar = () => {
  const { isLoggedIn, logout, userId, userType, userFullName, userProfilePhotoUrl } = useContext(AuthContext);
  const location = useLocation();

  const profileHref = userType === 'doctor'
    ? `/DoctorProfile/${userId}`
    : `/PatientProfile/${userId}`;

  const commonMenus = [
    { title: 'Home', src: 'home', href: '/' },
    { title: 'Search', src: 'Search', href: '/SearchBar' },
    { title: 'DashBoard', src: 'Chart', href: '/DashBoard' },
    { title: 'Profile', src: 'User', href: profileHref },
    { title: 'Appointment', src: 'Calendar', href: '/patient-appointments' },
    { title: 'MyDocs', src: 'Folder', href: '/MyDocs' },
    { title: 'Messages', src: 'Chat', href: '/Messages' },
    { title: 'Feed', src: 'feed_logo', href: '/feed' },
    { title: 'Setting', src: 'settings', href: `/Settings/${userId}` },
  ];

  const doctorMenus = [
    { title: 'Create Post', src: 'create_post', href: '/create-post' },
    { title: 'ChatBot', src: 'chatbot', href: '/ChatBot' },
    { title: 'My Posts', src: 'doctor_feed', href: '/doctor-posts' },
  ];

  const guestMenus = [
    { title: 'Login', src: 'login', href: '/login' },
    { title: 'Register', src: 'register', href: '/register' },
  ];

  const renderMenuGroup = (menuItems) => (
    <MenuGroup>
      {menuItems.map((menu, index) => (
        <MenuItem key={index}>
          <a href={menu.href} className={location.pathname === menu.href ? 'active' : ''}>
            <img
              src={require(`./../../../assets/images/menu_images/${menu.src}.png`)}
              alt={menu.title}
            />
            <span>{menu.title}</span>
          </a>
        </MenuItem>
      ))}
    </MenuGroup>
  );

  return (
    <NavbarContainer>
      <LogoContainer>
        <img
          src={require('./../../../assets/images/logo_doc_app_white.png')}
          alt="logo"
        />
      </LogoContainer>
      <MenuList>
        {isLoggedIn && renderMenuGroup(commonMenus)}
        {isLoggedIn && userType === 'doctor' && renderMenuGroup(doctorMenus)}
        {!isLoggedIn && renderMenuGroup(guestMenus)}
      </MenuList>

      <LowerMenuList>
        {isLoggedIn && (
          <>
            <LogoutMenuItem>
              <a href="/login" onClick={logout}>
                <img src={require(`./../../../assets/images/menu_images/logout.png`)} alt="Logout" />
                <span>Logout</span>
              </a>
            </LogoutMenuItem>
            <UserInfoContainer>
              <UserInfoImage src={userProfilePhotoUrl} alt="User" />
              <UserInfo>
                <span>{capitalizeWords(userFullName)}</span>
                <small>{capitalizeWords(userType)}</small>
              </UserInfo>
            </UserInfoContainer>
          </>
        )}
      </LowerMenuList>
    </NavbarContainer>
  );
};

export default MyNavbar;