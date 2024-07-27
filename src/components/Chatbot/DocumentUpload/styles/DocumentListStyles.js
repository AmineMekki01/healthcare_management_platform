import styled from 'styled-components';

export const DocumentContainer = styled.ul`
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 20px;
    width: 100%;
    @media (max-width: 650px ) {
        flex-direction: column;
    }

`;

export const DocumentElement = styled.li`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 10px;
    margin-bottom: 10px;
    border-left: 1px solid #ccc;
    overflow: hidden;
    white-space: wrap;
    text-overflow: ellipsis;

    &:hover {
        background-color: #f5f5f5;
    }

    
`;