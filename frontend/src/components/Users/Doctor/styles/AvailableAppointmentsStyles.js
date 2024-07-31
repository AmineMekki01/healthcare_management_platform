import styled from 'styled-components';

export const AppointmentContainer = styled.div`
  display: flex;
  flex-direction: column;
  background-color: rgb(226, 226, 226);
  width: 80%;
  height: 100%;
  margin: 0 auto;
  padding: 15px;
  margin-top: 10px;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
`;

export const DatePickerContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 10px;

  .big-calendar .react-datepicker {
    width: 100%;
  }

  .big-calendar .react-datepicker__month-container {
    width: 100%;
  }
`;

export const TimeSlotsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
`;

export const TimeSlot = styled.div`
  background-color: ${({ isSelected }) => (isSelected ? '#007bff' : 'white')};

  border: 1px solid #ccc;
  padding: 10px;
  border-radius: 5px;
  text-align: center;
  cursor: pointer;


`;

export const Button = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  margin: 5px;
  border-radius: 5px;
  cursor: pointer;
  &:hover {
    background-color: #0056b3;
  }
`;

export const Text = styled.p`
    font-size: 16px;
    color: ${({ isSelected }) => (isSelected ? 'white' : '$444')};
`;

export const Title = styled.h1`
  font-size: 20px;
  margin-bottom: 10px;
`;

export const FormContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 20px;
  align-items: start;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;
