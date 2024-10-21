import styled from 'styled-components';

export const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

export const AppointmentsWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 20px;
  max-width: 1200px;
`;

export const Title = styled.h1`
  font-size: 28px;
  text-align: center;
  margin-bottom: 20px;
`;

export const AppointmentsCard = styled.div`
  width: 450px;
  height: 450px;
  margin: 20px 0;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;
