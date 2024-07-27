import styled from "styled-components";

export const Title = styled.h2`
    margin-top : 20px;
    color : rgb(18, 31, 73);
    text-align : center;
    font-size: 4vw;
    @media (min-width: 1000px) {
        font-size: 40px;
    }
    @media (max-width: 600px) {
        font-size: 20px;
    }
`

export const Container = styled.div`
    height : 70vh;
    
`


export const Flex = styled.div`
    display : flex;
    margin-top: 10px;
    justify-content : space-around;
    justify-items : center;
    font-weight : bold;
    flex-wrap: wrap;
`


export const Line = styled.div`
    width: 80vw;
    height: 1px; /* Adjust the height to change the line thickness */
    background-color: black; /* Adjust the color to change the line color */
    margin : 40px 0;
`