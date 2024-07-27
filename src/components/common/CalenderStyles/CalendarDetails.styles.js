import styled from 'styled-components';



export const SubButton = styled.button`
    width : 150px;
    height : 50px;
    background: #2196f3;
    color : white;
    font-weight : bold;
    margin-bottom : 15px;
    outline : none;
    border-radius : 30px;

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