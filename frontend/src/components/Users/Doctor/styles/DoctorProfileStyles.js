// StyledComponents.js
import styled from 'styled-components';


export const MainContainer = styled.div`
  display: flex;
  flex-direction: column;

`;

export const LeftColumn = styled.div`
  margin-right: 20px;
  padding: 20px;
  background: rgb(226, 226, 226);
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  max-width: 60%;

    @media (max-width: 768px) {
        width: 100%;
        max-width: 100%;
    }
`;

export const RightColumn = styled.div`
  padding: 20px;
  background: rgb(226, 226, 226);
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  max-width: 40%;
  @media (max-width: 768px) {
    width: 100%;
    max-width: 100%;
    }
`;


export const BodyContainer = styled.div`
    display: flex;
    justify-content: center;
    flex-direction: row;
    padding: 20px;
    background-color: white;
    min-height: 100vh;

    @media (max-width: 768px) {
        flex-direction: column;
    }
`;

export const Header = styled.header`
  display: flex;
  flex-direction: column;
  background-color: rgb(226, 226, 226);
  align-items: center;
  width: 100%;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
`;

export const Info = styled.div`
  display: flex;
  background-color: white;
  border-radius: 8px;
  padding: 20px;

  box-shadow: 0 2px 4px rgba(0,0,0,0.1);

  flex-direction: column;
  align-items: center;
  margin-top: 20px;
`;

export const LocationContainer = styled.div`
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-top: 20px;
  width: 100%;
`;
export const LocationInfo = styled.div`
  font-size: 16px;
  color: #666;
  margin-bottom: 10px;
`;

export const LocationLink = styled.a`
  color: #0066cc;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

export const MapImage = styled.img`
  width: 100%;
  height: auto;
  border-radius: 4px;
  margin-top: 10px;
`;

export const Section = styled.section`
  background-color: white;
  padding: 15px;
  margin-top: 10px;
  width: 100%;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
`;

export const Title = styled.h1`
  font-size: 20px;
  margin-bottom: 10px;
`;

export const Subtitle = styled.h2`
  font-size: 18px;
  color: #666;
  margin-top: 20px;
  margin-bottom: 5px;
`;

export const Statistic = styled.div`
  display: flex;
  justify-content: space-around;
  width: 100%;
  flex-wrap: wrap;
`;

export const StatBox = styled.div`
  text-align: center;
  margin: 5px;
`;

export const Text = styled.p`
  font-size: 16px;
  color: #444;
`;

export const List = styled.ul`
  list-style: none;
  padding: 0;
`;

export const ListItem = styled.li`
  font-size: 16px;
  color: #444;
  padding: 5px 0;
`;
export const Badge = styled.span`
  color: white;
  background-color: #0056b3;
  border-radius: 10px;
  padding: 5px 10px;
  font-size: 14px;
  margin-right: 10px;
`;

export const Image = styled.img`
  width: 250px;
  height: 250px;
  border-radius: 50%;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
`;

export const BreakingLine = styled.hr`
    border: 0;
    border-top: 2px solid #ccc;
    width: 100%;
    margin: 20px 0;
    `;