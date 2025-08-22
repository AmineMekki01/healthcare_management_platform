import styled from 'styled-components';

export const Home = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
  }
`;

export const Container = styled.div`
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  width: 100%;
  max-width: 1400px;
  height: 95vh;
  display: flex;
  overflow: hidden;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  z-index: 1;
  
  @media (max-width: 768px) {
    width: 95%;
    height: 90vh;
    border-radius: 16px;
    margin: 10px;
  }
  
  @media (max-width: 480px) {
    width: 100%;
    height: 100vh;
    border-radius: 0;
    margin: 0;
    backdrop-filter: none;
    background: white;
  }
`;

export const SidebarContainer = styled.div`
  flex: 1;
  min-width: 320px;
  max-width: 400px;
  height: 100%;
  
  @media (max-width: 768px) {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10;
  }
`;