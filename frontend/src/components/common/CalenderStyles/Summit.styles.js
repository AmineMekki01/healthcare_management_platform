import styled from 'styled-components';

export const Container = styled.div`
    box-shadow: 0px 0px 10px 5px rgba(128, 128, 128, 0.3);
    width : 900px;
    height : 60vh;
    max-height : 1000px;
    display : flex;
    border-radius : 6px;
    display : flex;
    justify-content : start;
    align-items : center;
    flex-direction : column;
    margin: 0 auto;

`

export const Line = styled.div`
    width: 90%;
    height: 1px; /* Adjust the height to change the line thickness */
    background-color: gray; /* Adjust the color to change the line color */
    margin : 0 auto;
`

export const Title = styled.h2`
    color : black;
    display : flex;
    align-items : center;
`

export const TitleM = styled.h4`
    color : black;
    display : flex;
    align-items : center;
    margin-bottom : 12px;
`

export const Detail = styled.p`
    color : #868a86;
    margin-top: -10px;
`

export const Infos = styled.div`
    width : 50%;
    height : 36%;
    border : 1px solid #868a86;
    border-radius : 5px;
    padding :10px 20px;
    margin-bottom : 50px;
`

export const Flex = styled.div`
    display : flex;
    color : #868a86;
    font-weight : bold;
    margin-bottom : 8px;
`



