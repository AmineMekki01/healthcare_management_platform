import React from 'react';
import styled from 'styled-components';

const WelcomeContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 40px;
  text-align: center;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 30% 30%, rgba(120, 119, 198, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 70% 70%, rgba(255, 119, 198, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 50% 50%, rgba(120, 219, 255, 0.05) 0%, transparent 50%);
    pointer-events: none;
  }
  
  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const WelcomeIcon = styled.div`
  font-size: 80px;
  margin-bottom: 32px;
  opacity: 0.9;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  position: relative;
  z-index: 1;
  animation: float 3s ease-in-out infinite;
  
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
`;

const WelcomeTitle = styled.h2`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 16px;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
`;

const WelcomeSubtitle = styled.p`
  color: #4a5568;
  font-size: 18px;
  margin-bottom: 40px;
  max-width: 450px;
  line-height: 1.6;
  position: relative;
  z-index: 1;
`;

const FeatureList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 380px;
  position: relative;
  z-index: 1;
`;

const Feature = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  color: #2d3748;
  font-size: 15px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  font-weight: 500;
  
  &:hover {
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);
    transform: translateY(-4px);
    border-color: rgba(102, 126, 234, 0.2);
  }
`;

const FeatureIcon = styled.span`
  font-size: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background-color: rgba(102, 126, 234, 0.1);
  backdrop-filter: blur(10px);
`;

const WelcomeScreen = () => {
  return (
    <WelcomeContainer>
      <WelcomeIcon>💬</WelcomeIcon>
      <WelcomeTitle>Welcome to TBIBI Chat</WelcomeTitle>
      <WelcomeSubtitle>
        Connect with healthcare professionals and patients in a secure, user-friendly environment.
      </WelcomeSubtitle>
      
      <FeatureList>
        <Feature>
          <FeatureIcon>🔒</FeatureIcon>
          <span>Secure and private messaging</span>
        </Feature>
        <Feature>
          <FeatureIcon>📱</FeatureIcon>
          <span>Real-time communication</span>
        </Feature>
        <Feature>
          <FeatureIcon>📎</FeatureIcon>
          <span>Share images and files</span>
        </Feature>
        <Feature>
          <FeatureIcon>👥</FeatureIcon>
          <span>Professional healthcare network</span>
        </Feature>
      </FeatureList>
    </WelcomeContainer>
  );
};

export default WelcomeScreen;
