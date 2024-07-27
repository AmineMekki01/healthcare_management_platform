import styled from 'styled-components';
import { Link } from 'react-router-dom';

export const RegisterPageContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f0f0;
`;

export const RegisterContainer = styled.div`
  background-color: white;
  border: 1px solid #ccc;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  width: 300px;
`;

export const RegisterOptionButton = styled(Link)`
  display: block;
  margin: 10px auto;
  padding: 10px 20px;
  border: 1px solid #ccc;
  border-radius: 4px;
  text-decoration: none;
  color: #333;
  font-size: 16px;

  &:hover {
    border-color: #999;
  }
`;