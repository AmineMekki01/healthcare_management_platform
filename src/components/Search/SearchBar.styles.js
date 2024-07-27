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
`;

export const SearchInputContainer = styled.div`
    background: #E7E8EA;
    display: flex;
    width: 100%;
    padding: 20px;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
`;

export const SearchInput = styled.input`
    
    width: 80%;
    max-width: 300px;
    max-width: ;
    border: 2px solid #ccc;
    background-color: #fff;
    height: 40px;
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    margin: 0 0.5rem 0.5rem 0.5rem ;
    font-size: 1rem;
    &:focus {
        outline: none;
        border-color: #007bff;
    }
`;

export const UserList = styled.ul`
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
`;