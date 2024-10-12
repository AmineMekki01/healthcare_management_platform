import styled from 'styled-components';
 
// Color palette
// #fff #E7E8EA
// #F9A11B #FEC47B
// #F05423 #F69963
// #6DC8B7 #AADCD3
// #121F49 #696E8E

export const AppContainer = styled.div`
    margin: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    background-color: #f5f7fa;
    min-height: 100vh;
`;

export const SearchInputContainer = styled.div`
    background: #ffffff;
    display: flex;
    width: 90%;
    max-width: 1200px;
    padding: 30px;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    margin-bottom: 30px;
`;

export const SearchInput = styled.input`
    width: calc(25% - 10px);
    border: 1px solid #e0e0e0;
    background-color: #fff;
    height: 50px;
    padding: 0.5rem 1rem;
    border-radius: 25px;
    margin-bottom: 10px;
    font-size: 1rem;
    transition: all 0.3s ease;

    &:focus {
        outline: none;
        border-color: #6DC8B7;
        box-shadow: 0 0 0 2px rgba(109, 200, 183, 0.2);
    }

    @media (max-width: 768px) {
        width: 100%;
    }
`;

export const AnalyzeButton = styled.button`
    background-color: #6DC8B7;
    color: white;
    border: none;
    height: 50px;
    padding: 0 30px;
    border-radius: 25px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.3s ease;

    &:hover {
        background-color: #5ab3a1;
    }

    @media (max-width: 768px) {
        width: 100%;
        margin-top: 10px;
    }
`;

export const UserList = styled.ul`
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 30px;
    width: 90%;
    max-width: 1200px;
    padding: 0;
    list-style-type: none;
`;