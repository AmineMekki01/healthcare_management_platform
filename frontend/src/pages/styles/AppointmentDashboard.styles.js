import styled from "styled-components";

export const Title = styled.h2`
    color: #121f49;
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 2rem;
`

export const Container = styled.div`
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
`

export const Flex = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;
    justify-content: center;
`

export const FilterContainer = styled.div`
    margin-bottom: 2rem;
`

export const FilterInput = styled.input`
    width: 100%;
    padding: 0.75rem;
    font-size: 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    &:focus {
        outline: none;
        border-color: #4a90e2;
    }
`

export const Line = styled.div`
    width: 80vw;
    height: 1px; /* Adjust the height to change the line thickness */
    background-color: black; /* Adjust the color to change the line color */
    margin : 40px 0;
`

export const SectionTitle = styled.h2`
  font-size: 1.5em;
  margin-top: 20px;
  margin-bottom: 10px;
`;