import styled from 'styled-components';

export const CalendarContainer = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 2rem;
`;

export const CalendarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
`;

export const WeekNavigator = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

export const NavButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }
  
  svg {
    font-size: 1.5rem;
  }
`;

export const CurrentWeekLabel = styled.div`
  font-size: 1.2rem;
  font-weight: 600;
  min-width: 200px;
  text-align: center;
  
  @media (max-width: 768px) {
    font-size: 1rem;
    min-width: 150px;
  }
`;

export const TodayButton = styled.button`
  background: white;
  color: #667eea;
  border: none;
  padding: 0.6rem 1.5rem;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(255, 255, 255, 0.3);
  }
  
  @media (max-width: 768px) {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }
`;

export const CalendarGrid = styled.div`
  display: flex;
  min-height: 700px;
  overflow-x: auto;
  
  @media (max-width: 768px) {
    min-height: 500px;
  }
`;

export const TimeColumn = styled.div`
  width: 80px;
  flex-shrink: 0;
  border-right: 2px solid #e2e8f0;
  background: #f7fafc;
  
  @media (max-width: 768px) {
    width: 60px;
  }
`;

export const TimeSlot = styled.div`
  height: 60px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  font-size: 0.8rem;
  color: #718096;
  font-weight: 500;
  border-bottom: 1px solid #e2e8f0;
  box-sizing: border-box;
  padding: 0;
  line-height: 1;
  
  /* Position text at the top to align with grid line */
  padding-top: 20px;
  
  @media (max-width: 768px) {
    font-size: 0.7rem;
  }
`;

export const DaysHeader = styled.div`
  display: flex;
  border-bottom: 2px solid #e2e8f0;
  background: #f7fafc;
  height: 78px;
  box-sizing: border-box;
`;

export const DayHeader = styled.div`
  flex: 1;
  padding: 0.8rem;
  text-align: center;
  color: ${props => props.$isToday ? '#667eea' : '#2d3748'};
  background: ${props => props.$isToday ? 'rgba(102, 126, 234, 0.1)' : 'transparent'};
  border-right: 1px solid #e2e8f0;
  font-weight: ${props => props.$isToday ? 700 : 500};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  
  &:last-child {
    border-right: none;
  }
  
  @media (max-width: 768px) {
    padding: 0.5rem;
    font-size: 0.8rem;
  }
`;

export const DayColumn = styled.div`
  flex: 1;
  position: relative;
  min-width: 120px;
  box-sizing: border-box;
  
  & > div {
    box-sizing: border-box;
  }
  
  @media (max-width: 768px) {
    min-width: 100px;
  }
`;

export const AppointmentBlock = styled.div`
  position: absolute;
  left: 4px;
  right: 4px;
  background: ${props => {
    switch(props.$status) {
      case 'active': 
        return 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)';
      case 'canceled': 
        return 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)';
      case 'passed': 
        return 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)';
      default: 
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
  }};
  color: white;
  border-radius: 6px;
  padding: 0.5rem;
  cursor: pointer;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
  z-index: 1;
  
  &:hover {
    transform: scale(1.02);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 2;
  }
  
  @media (max-width: 768px) {
    left: 2px;
    right: 2px;
    padding: 0.3rem;
  }
`;

export const AppointmentContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.75rem;
  
  @media (max-width: 768px) {
    font-size: 0.65rem;
  }
`;

export const AppointmentTitle = styled.div`
  font-weight: 700;
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
  @media (max-width: 768px) {
    font-size: 0.75rem;
  }
`;

export const AppointmentTime = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  opacity: 0.95;
  
  @media (max-width: 768px) {
    font-size: 0.65rem;
  }
`;

export const AppointmentInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.7rem;
  opacity: 0.9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
  @media (max-width: 768px) {
    font-size: 0.6rem;
  }
`;

export const EmptyDayMessage = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #a0aec0;
  font-size: 0.8rem;
  text-align: center;
  pointer-events: none;
  width: 100%;
  padding: 0 0.5rem;
  
  @media (max-width: 768px) {
    font-size: 0.7rem;
  }
`;

export const ViewToggleContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 50px;
  padding: 0.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  margin: 0 auto 2rem auto;
  
  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

export const ViewToggleButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: ${props => props.$active ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent'};
  color: ${props => props.$active ? 'white' : '#4a5568'};
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 50px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.$active ? 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)' : 'rgba(102, 126, 234, 0.1)'};
    transform: translateY(-1px);
  }
  
  svg {
    font-size: 1.2rem;
  }
  
  @media (max-width: 768px) {
    padding: 0.6rem 1rem;
    font-size: 0.85rem;
    
    svg {
      font-size: 1rem;
    }
  }
`;
