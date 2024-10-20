import styled from 'styled-components';

export const CardContainer = styled.div`
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  width: 300px;
  transition: transform 0.3s ease-in-out;

  &:hover {
    transform: translateY(-5px);
  }
`;

export const CardHeader = styled.div`
  background-color: #4a90e2;
  color: #ffffff;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const CardBody = styled.div`
  padding: 1rem;
`;

export const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  border-top: 1px solid #e0e0e0;
`;

export const IconButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #4a90e2;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    text-decoration: underline;
  }
`;

export const CancelButton = styled.button`
  display: flex;
  border: 2px solid #A741BA;
  color: #A741BA;
  padding: 5px;
  margin-bottom: 10px;
`;

export const CancelButtonContainer = styled.div`
  display: flex;
  justify-content: center; 
`;