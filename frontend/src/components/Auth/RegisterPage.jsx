import React from 'react';
import { Link } from 'react-router-dom';
import {RegisterPageContainer, RegisterContainer, RegisterOptionButton} from './styles/RegisterPageStyles';

const RegisterPage = () => {
  return (
    <RegisterPageContainer>
      <RegisterContainer>
        <h2>Register</h2>
        <div className='register-options'>
          <RegisterOptionButton to='/register-doctor'>
            Register as Doctor
          </RegisterOptionButton>
          <RegisterOptionButton to='/register-patient'>
            Register as Patient
          </RegisterOptionButton>
        </div>
      </RegisterContainer>
    </RegisterPageContainer>
  );
};

export default RegisterPage;