import styled from 'styled-components';

export const SettingsContainer = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
`;

export const SettingsHeader = styled.div`
  text-align: center;
  margin-bottom: 40px;
  padding: 30px 0;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
`;

export const SettingsTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 10px;
  background: linear-gradient(45deg, #6DC8B7, #4CAF50);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

export const SettingsSubtitle = styled.p`
  font-size: 1.1rem;
  color: #7f8c8d;
  margin: 0;
`;

export const SectionTitle = styled.h2`
  font-size: 28px;
  margin-bottom: 30px;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 15px;
  font-weight: 600;
  
  &::before {
    content: '';
    width: 4px;
    height: 40px;
    background: linear-gradient(45deg, #6DC8B7, #4CAF50);
    border-radius: 2px;
  }
`;

export const NavigationContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 40px;
  gap: 10px;
  flex-wrap: wrap;
`;

export const NavigationButton = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  background: ${props => props.active ? 'linear-gradient(45deg, #6DC8B7, #4CAF50)' : 'rgba(255, 255, 255, 0.9)'};
  color: ${props => props.active ? 'white' : '#2c3e50'};
  border: ${props => props.active ? 'none' : '2px solid #e0e0e0'};
  border-radius: 15px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: ${props => props.active ? '0 8px 25px rgba(109, 200, 183, 0.3)' : '0 4px 15px rgba(0, 0, 0, 0.1)'};
  backdrop-filter: blur(10px);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.active ? '0 12px 35px rgba(109, 200, 183, 0.4)' : '0 8px 25px rgba(0, 0, 0, 0.15)'};
    background: ${props => props.active ? 'linear-gradient(45deg, #5ab3a1, #43a047)' : 'rgba(255, 255, 255, 1)'};
  }
  
  &:active {
    transform: translateY(0);
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

export const ContentContainer = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  margin-bottom: 30px;
`;

export const SectionContainer = styled.div`
  display: flex;
  flex-direction: column;
  button {
    margin-bottom: 10px;
    padding: 10px;
    background-color: #6DC8B7;
    border: none;
    color: white;
    cursor: pointer;
    &:hover {
      background-color: #5ab3a1;
    }
  }
`;

export const Card = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(45deg, #6DC8B7, #4CAF50);
  }

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    background: rgba(255, 255, 255, 1);
  }
`;

export const DoctorCard = styled(Card)`
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  
  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;
  }
`;

export const DoctorInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
`;

export const DoctorName = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const DoctorAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(45deg, #6DC8B7, #4CAF50);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 18px;
  flex-shrink: 0;
`;

export const DoctorSpecialty = styled.div`
  font-size: 14px;
  color: #7f8c8d;
  font-weight: 500;
`;

export const UnfollowButton = styled.button`
  background: linear-gradient(45deg, #ff6b6b, #ff5252);
  border: none;
  color: white;
  padding: 12px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
    background: linear-gradient(45deg, #ff5252, #f44336);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    background: #bdc3c7;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

export const NoDoctorsMessage = styled.div`
  text-align: center;
  padding: 60px 20px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  
  h3 {
    font-size: 24px;
    color: #2c3e50;
    margin-bottom: 12px;
    font-weight: 600;
  }
  
  p {
    font-size: 16px;
    color: #7f8c8d;
    margin-bottom: 24px;
    line-height: 1.6;
  }
`;

export const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 20px;
  
  .spinner {
    width: 50px;
    height: 50px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #6DC8B7;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export const ErrorMessage = styled.div`
  background: linear-gradient(45deg, #ff6b6b, #ff5252);
  color: white;
  padding: 16px 24px;
  border-radius: 12px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

export const SuccessMessage = styled.div`
  background: linear-gradient(45deg, #4CAF50, #45a049);
  color: white;
  padding: 16px 24px;
  border-radius: 12px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

export const ConfirmationDialog = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
`;

export const ConfirmationContent = styled.div`
  background: white;
  padding: 40px;
  border-radius: 20px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
  
  h3 {
    font-size: 24px;
    color: #2c3e50;
    margin-bottom: 16px;
    font-weight: 600;
  }
  
  p {
    font-size: 16px;
    color: #7f8c8d;
    margin-bottom: 32px;
    line-height: 1.6;
  }
`;

export const ConfirmationButtons = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
`;

export const ConfirmButton = styled.button`
  background: linear-gradient(45deg, #ff6b6b, #ff5252);
  border: none;
  color: white;
  padding: 12px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
  }
`;

export const CancelButton = styled.button`
  background: #bdc3c7;
  border: none;
  color: white;
  padding: 12px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  
  &:hover {
    background: #95a5a6;
    transform: translateY(-2px);
  }
`;


export const FormSection = styled.div`
  margin-bottom: 40px;
`;

export const AddButton = styled.button`
  padding: 10px 20px;
  background-color: #6dc8b7;
  border: none;
  color: white;
  font-size: 16px;
  cursor: pointer;
  border-radius: 5px;
  transition: background-color 0.3s ease;
  margin-bottom: 20px;

  &:hover {
    background-color: #5ab3a1;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

export const ItemList = styled.div`
  display: flex;
  flex-direction: column;
`;

export const Item = styled.div`
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
`;

export const RemoveButton = styled.button`
  margin-top: 10px;
  padding: 8px 12px;
  background-color: #ff6b6b;
  border: none;
  color: white;
  font-size: 14px;
  cursor: pointer;
  border-radius: 5px;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #ff4b4b;
  }
`;

export const InputField = styled.input`
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 16px;
  box-sizing: border-box;
`;

export const TextArea = styled.textarea`
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 16px;
  resize: vertical;
  box-sizing: border-box;
`;

export const DateField = styled.input`
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 16px;
  box-sizing: border-box;
`;

const breakpoints = {
  mobile: '480px',
  tablet: '768px',
  desktop: '1024px',
};

export const ResponsiveSettingsContainer = styled(SettingsContainer)`
  padding: 15px;
  
  @media (min-width: ${breakpoints.tablet}) {
    padding: 20px;
  }
  
  @media (min-width: ${breakpoints.desktop}) {
    padding: 30px;
  }
`;

export const MobileNavigationContainer = styled(NavigationContainer)`
  flex-direction: column;
  gap: 8px;
  
  @media (min-width: ${breakpoints.tablet}) {
    flex-direction: row;
    gap: 10px;
  }
`;

export const MobileContentContainer = styled(ContentContainer)`
  padding: 20px;
  margin-bottom: 20px;
  
  @media (min-width: ${breakpoints.tablet}) {
    padding: 30px;
    margin-bottom: 30px;
  }
  
  @media (min-width: ${breakpoints.desktop}) {
    padding: 40px;
  }
`;

export const SkeletonLoader = styled.div`
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 8px;
  height: ${props => props.height || '20px'};
  width: ${props => props.width || '100%'};
  
  @keyframes loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;

export const AccessibleButton = styled(NavigationButton)`
  &:focus {
    outline: 3px solid #6DC8B7;
    outline-offset: 2px;
  }
  
  &:focus:not(:focus-visible) {
    outline: none;
  }
`;

export const FadeIn = styled.div`
  animation: fadeIn 0.5s ease-in-out;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export const SlideIn = styled.div`
  animation: slideIn 0.3s ease-out;
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

export const ThemeAwareContainer = styled.div`
  background: ${props => props.theme === 'dark' ? '#2c3e50' : 'rgba(255, 255, 255, 0.95)'};
  color: ${props => props.theme === 'dark' ? '#ecf0f1' : '#2c3e50'};
  transition: all 0.3s ease;
`;

export const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 24px;
`;

export const SearchInput = styled.input`
  width: 100%;
  padding: 14px 16px 14px 44px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 16px;
  background: rgba(255, 255, 255, 0.9);
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #6DC8B7;
    box-shadow: 0 0 0 3px rgba(109, 200, 183, 0.1);
  }
  
  &::placeholder {
    color: #95a5a6;
  }
`;

export const SearchIcon = styled.div`
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #95a5a6;
  pointer-events: none;
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

export const ToastContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
  
  @media (max-width: ${breakpoints.mobile}) {
    left: 20px;
    right: 20px;
    max-width: none;
  }
`;

export const Toast = styled.div`
  background: ${props => 
    props.type === 'success' ? 'linear-gradient(45deg, #4CAF50, #45a049)' :
    props.type === 'error' ? 'linear-gradient(45deg, #ff6b6b, #ff5252)' :
    props.type === 'warning' ? 'linear-gradient(45deg, #ffa726, #ff9800)' :
    'linear-gradient(45deg, #2196F3, #1976D2)'
  };
  color: white;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 12px;
  animation: slideInRight 0.3s ease-out;
  
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }
`;

export const ValidationMessage = styled.div`
  font-size: 12px;
  color: #ff6b6b;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

export const ValidInput = styled(InputField)`
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
`;

export const InvalidInput = styled(InputField)`
  border-color: #ff6b6b;
  box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.1);
`;

export const Spacer = styled.div`
  height: ${props => props.height || '20px'};
`;

export const Flex = styled.div`
  display: flex;
  align-items: ${props => props.align || 'center'};
  justify-content: ${props => props.justify || 'flex-start'};
  gap: ${props => props.gap || '16px'};
  flex-direction: ${props => props.direction || 'row'};
  flex-wrap: ${props => props.wrap || 'nowrap'};
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: ${props => props.columns || 'repeat(auto-fit, minmax(250px, 1fr))'};
  gap: ${props => props.gap || '20px'};
  
  @media (max-width: ${breakpoints.tablet}) {
    grid-template-columns: 1fr;
  }
`;
