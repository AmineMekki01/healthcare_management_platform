import styled from 'styled-components';

export const Container = styled.div`
    box-shadow: 0px 0px 10px 5px rgba(128, 128, 128, 0.3);
    width : 1200px;
    height : 80vh;
    max-height : 1200px;
    display : flex;
    border-radius : 6px;
    margin: 0 auto;
`

export const RightSection = styled.div`
    flex-basis : 0.6;
    width : 60%;
    padding : 20px 60px;
    display : flex;
    justify-content : space-between;
    align-items : top;
    margin-top : 20px;
    height : fit-content;
    display : flex;
`

export const RightSectionDetails = styled.div`
    flex-basis : 0.6;
    width : 60%;
    padding : 20px 60px;
    margin-top : 20px;
    display : flex;
    flex-direction : column;
`

export const LeftSection = styled.div`
    flex-basis : 0.4;
    width : 40%;
    border-right : 1px solid rgb(191, 188, 187);
    padding : 20px;
`

export const Title = styled.h4`
    color : rgb(138, 136, 132);
    &:last-of-type {
        margin-top : 45px;
    }
`

export const MainTitle = styled.h2`
    color : black;
    font-size : 30px;
    margin-top : -10px;
`

export const MainTitleH3 = styled.h3`
    color : black;
    font-size : 24px;
    margin-top : -10px;
    margin-bottom : 30px;
`

export const Timing = styled.div`
    display : flex;
    align-items : center;
    justify-content : space-between;
    width : 60px;
    color : rgb(138, 136, 132);
    font-weight : bold;
`

export const TimingTitle = styled.div`
    display : flex;
    color : rgb(138, 136, 132);
    font-weight : bold;
    margin-bottom : 10px;
`

export const Span = styled.div`
    margin-left : 16px;
`

export const Cols = styled.div`
    display : flex;
    flex-direction : column;
`

export const Date = styled.h4`
    color : rgb(138, 136, 132);
    margin-top : 25px 0;
    word-spacing : 4px;
`

export const ButtonDate = styled.button`
    width : 210px;
    height : 50px;
    background: transparent;
    border : 1px solid #2196f3;
    color : #2196f3;
    font-weight : bold;
    margin-bottom : 15px;
    outline : none;

    &:first-of-type{
        margin-top : 30px;
    }

    &:hover{
        border : none;
        outline : none;
        color : white;
        background : #2196f3;
    }

`
export const SelectedButton = styled.button`
    width : 100px;
    height : 50px;
    background: #73726e;
    color : white;
    font-weight : bold;
    margin-bottom : 15px;
    outline : none;

`

export const NextButton = styled(SelectedButton)`
  background: #2196f3; 
  margin-left : 10px;
`;


export const Flex = styled.div`
    display : flex;
    align-items : center;
`
export const Flexi = styled.div`
    display : flex;
    align-items : center;
    justify-content : space-between;
    padding : 20px 10px;
`

export const Text = styled.h5`
    font-weight : bold;
    color : black;
    font-size : 15px;
`

