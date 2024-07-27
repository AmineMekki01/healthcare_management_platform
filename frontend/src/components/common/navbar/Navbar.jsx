import React, { useContext } from 'react';
import {
  NavbarContainer,
  LogoContainer,
  MenuList,
  MenuItem,
  LogoutItem,
} from './MyNavbar.styles';
import { AuthContext } from './../../Auth/AuthContext';

const MyNavbar = () => {
  const { isLoggedIn, logout, doctorId, patientId, userType } = useContext(AuthContext); 

  const profileHref = userType === 'doctor'
    ? `/DoctorProfile/${doctorId}`
    : `/PatientProfile/${patientId}`;  

  const menus = isLoggedIn
    ? [
        { title: 'Home', src: 'home', href: '/' },
        { title: 'Search', src: 'Search', href: '/SearchBar' },
        { title: 'DashBoard', src: 'Chart', href: '/DashBoard' },
        {title: 'Profile',src: 'User', href: profileHref},
        { title: 'Appointment', src: 'Calendar', href: '/patient-appointments' },
        { title: 'MyDocs', src: 'Folder', href: '/MyDocs' },
        { title: 'Messages ', src: 'Chat', href: '/Messages' },
        { title: 'ChatBot', src: 'chatbot', href: '/ChatBot' },
      ]
    : [
        { title: 'Home', src: 'home', href: '/' },
        { title: 'Login', src: 'login', href: '/login' },
        { title: 'Register', src: 'register', href: '/register' },
      ];

  return (
    <NavbarContainer>
      <LogoContainer>
        <img
          src={require('./../../../assets/images/logo_doc_app_white.png')}
          alt="logo"
        />
      </LogoContainer>
      <MenuList>
        {menus.map((menu, index) => (
          <MenuItem key={index} gap={menu.gap} firstItem={index === 0}>
            <a href={menu.href}>  
                <img
                    src={require(`./../../../assets/images/menu_images/${menu.src}.png`)}
                    alt={menu.title}
                />
                <span>{menu.title}</span>
            </a>
          </MenuItem>
        ))}
      </MenuList>
      <LogoutItem>
                {isLoggedIn && (
                    <>  
                    <a href="/login" onClick={logout}>
                        <img src={require(`./../../../assets/images/menu_images/Chart.png`)} alt="Logout" />
                        <span>Logout</span>
                    </a>  
                        
                    </>
                )}
            </LogoutItem>
    </NavbarContainer>
  );
};


export default MyNavbar;
