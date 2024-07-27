import styled from 'styled-components';

export const TimeSlot = styled.div`
  display : flex;
  flex-direction : column; 
  width: fit-content;
  background-color: ${({ $isSelected }) => ($isSelected ? 'rgb(247, 244, 237)' : 'white')};
  padding: 20px;
  border: 2px solid ${props => (props.isSelected ? 'blue' : 'gray')};
  border-radius: 8px;
  margin: 5px;

`;

export const BookAppointmentBlock = styled.div`
  display : flex;
  flex-direction : column; 
  justify-content: center;
  align-items: center;

`;

export const TimeSlotContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  padding: 10px;
  justify-content: center;
`;

export const BookingButton = styled.button`
  padding: 10px;
  border: 2px solid gray;
  border-radius: 4px;

  &:hover {
    text-decoration: underline;
    cursor: pointer;
  }
`;
