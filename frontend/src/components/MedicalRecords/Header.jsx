import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const Navbar = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background-color: #ffffff;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
`;

const NavItem = styled.li`
  list-style: none;
  margin-left: 1.5rem;
`;

const NavLink = styled(Link)`
  text-decoration: none;
  color: #333;
  font-size: 1.1rem;
  transition: color 0.3s;
  &:hover {
    color: #4A90E2;
  }
`;

const NavList = styled.ul`
  display: flex;
  margin-left: auto;
`;

const NavTitle = styled(Link)`
  font-size: 1.5rem;
  color: #333;
  text-decoration: none;
  font-weight: 600;
  &:hover {
    color: #4A90E2;
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