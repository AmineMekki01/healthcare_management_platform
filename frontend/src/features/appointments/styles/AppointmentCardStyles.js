import styled from 'styled-components';
import { Typography} from '@mui/material';

export const CardContainer = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  width: 100%;
  max-width: 380px;
  min-height: 320px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%);
    z-index: -1;
  }

  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(102, 126, 234, 0.3);
  }
  
  @media (max-width: 768px) {
    max-width: 100%;
    min-height: 280px;
  }
`;

export const CardHeader = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 80px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 100%;
    height: 200%;
    background: rgba(255, 255, 255, 0.1);
    transform: rotate(45deg);
    transition: all 0.3s ease;
  }
  
  &:hover::before {
    right: -30%;
  }
`;

export const TitleText = styled(Typography)`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
  font-weight: 600 !important;
  font-size: 1.1rem !important;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1;
  position: relative;
`;

export const CardBody = styled.div`
  padding: 1.5rem;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  
  .MuiTypography-root {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    color: #4a5568;
    font-weight: 500;
    
    .MuiSvgIcon-root {
      color: #667eea;
      font-size: 1.2rem;
    }
  }
`;

export const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(226, 232, 240, 0.8);
  background: rgba(248, 250, 252, 0.8);
  gap: 0.5rem;
  
  @media (max-width: 768px) {
    flex-wrap: wrap;
    gap: 0.8rem;
  }
`;

export const IconButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  color: white;
  font-size: 0.85rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
  }
  
  .MuiSvgIcon-root {
    font-size: 1rem;
  }
  
  @media (max-width: 768px) {
    font-size: 0.8rem;
    padding: 0.5rem 0.8rem;
  }
`;

export const CancelButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  border: none;
  border-radius: 12px;
  color: white;
  padding: 0.8rem 1.5rem;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(255, 107, 107, 0.4);
    background: linear-gradient(135deg, #ff5252 0%, #d63031 100%);
  }
  
  .MuiSvgIcon-root {
    font-size: 1.1rem;
  }
`;

export const CancelButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  padding: 0 1.5rem 1.5rem;
`;

export const StatusChip = styled.div`
  background: ${props => {
    switch(props.status) {
      case 'active': return 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)';
      case 'passed': return 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)';
      case 'canceled': return 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)';
      default: return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
  }};
  color: white;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
`;

export const CreateReportButton = styled.button`
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  border: none;
  border-radius: 12px;
  color: white;
  padding: 0.8rem 1.5rem;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 1.5rem 1.5rem;
  width: calc(100% - 3rem);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(72, 187, 120, 0.4);
    background: linear-gradient(135deg, #38a169 0%, #2f855a 100%);
  }
`;