import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
// Styled components

const Navbar = styled.nav`
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: #cccccc;
  position: sticky; // Make navbar sticky
  top: 0; // Stick to the top of the page
  z-index: 1000; // Ensure it's above other content
`;
const NavItem = styled.li`
  list-style: none;
  margin-right: 1rem;
`;

const NavLink = styled.a`
  text-decoration: none;
  color: #000; // Default link color
  &:hover {
    color: #0056b3; // Link hover color
  }
`;

const NavList = styled.ul`
  display: flex;
  margin-left: auto; // This will push the nav list to the right
`;

const NavTitle = styled.a`
  font-size: 1.3rem;
  color: #000;
  text-decoration: none;
  margin-right: 1rem;
  &:hover {
    color: #0056b3;
  }
`;

function FileUploadHeader() {
    return (
      <Navbar>
        <NavTitle to="/MyDocs">File Manager</NavTitle>
        <NavList>
          <NavItem>
            <Link to="/MyDocs">Home</Link>
          </NavItem>
          <NavItem>
            <Link to="/MyDocs/Upload">My Upload</Link>
          </NavItem>
          <NavItem>
            <Link to="/MyDocs/SharedWithMe">Shared with me</Link>
          </NavItem>
          <NavItem>
            <Link to="/MyDocs/ISharedWith">I shared with</Link>
          </NavItem>
        </NavList>
      </Navbar>
    );
  }
  
  export default FileUploadHeader;
