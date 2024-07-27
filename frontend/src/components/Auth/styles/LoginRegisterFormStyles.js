import styled from 'styled-components';

export const ContainerLogin = styled.div`
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #f0f0f0;
`;

export const ContainerRegister = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #f0f0f0;
    padding-top: 50px;
    padding-bottom: 50px;
`;

export const FormWrapper = styled.div`
    width: 100%;
    max-width: 500px;
    background-color: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
`;

export const Title = styled.h1`
    font-size: 24px;
    margin-bottom: 20px;
    text-align: center;
`;

export const RadioButtonContainer = styled.div`
    display: flex;
    justify-content: space-around;
    margin-bottom: 20px;
`;

export const RadioButton = styled.label`
  position: relative;
  padding-left: 35px;
  margin-right: 15px;
  cursor: pointer;
  font-size: 16px;
  user-select: none;

  input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
  }

  span {
    position: absolute;
    top: 0;
    left: 0;
    height: 25px;
    width: 25px;
    background-color: #ccc;
    border-radius: 50%;
  }

  input:checked ~ span {
    background-color: #2196F3;
  }

  span:after {
    content: "";
    position: absolute;
    display: none;
  }

  input:checked ~ span:after {
    display: block;
  }

  span:after {
    top: 9px;
    left: 9px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: white;
  }
`;


export const Input = styled.input`
    width: 100%;
    padding: 10px;
    margin-bottom: 20px;
    border: 1px solid #ccc;
    border-radius: 4px;
    &:focus {
        outline: none;
    }
`;

export const Button = styled.button`

    background-color: #4CAF50;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    &:hover {
        background-color: #45a049;
    }

    width: fit-content;
    margin: 5px auto;
`;

export const Textarea = styled.textarea`
    width: 100%;
    min-height: 100px;
    padding: 10px;
    margin-bottom: 20px;
    border: 1px solid #ccc;
    border-radius: 4px;
    &:focus {
        outline: none;
    }
`;

export const SuccessSection = styled.section`
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
`;

export const SuccessWrapper = styled.div`
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
    text-align: center;
`;

export const Note = styled.p`
    color: red;
    display: ${props => props.show ? 'block' : 'none'};
`;


export const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  margin: 20px 0;
`;

export const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  margin-right: 20px;
  cursor: pointer;
`;

export const CheckboxInput = styled.input`
  display: none;
`;

export const CheckboxCustom = styled.span`
  width: 20px;
  height: 20px;
  border: 2px solid #ccc;
  border-radius: 50%;
  margin-right: 10px;
  position: relative;

  ${CheckboxInput}:checked + &::before {
    content: "";
    position: absolute;
    width: 12px;
    height: 12px;
    top: 50%;
    left: 50%;
    background-color: #007bff;
    border-radius: 50%;
    transform: translate(-50%, -50%);
  }
`;

export const ContentWrapper = styled.div`
  display : flex;
  flex-direction: column;

  Button {
    width: fit-content;
    margin: auto;
    max-width: 200px;
  }
    
`;