import React, {useContext, useState, useEffect} from 'react';
import { AuthContext } from './AuthContext';  
import { useNavigate } from 'react-router-dom';
import { ContainerLogin, FormWrapper, Title, RadioButtonContainer, RadioButton, Input, Button } from './styles/LoginRegisterFormStyles';

const LoginForm = () => {
    const { setIsLoggedIn, setDoctorId, setPatientId, setUserType, doctorId, patientId } = useContext(AuthContext);

    
    const [localUserType, setLocalUserType] = useState('patient'); 
    const navigate = useNavigate();
    
    useEffect(() => {
    
    }, [localUserType, doctorId, patientId]);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
    
        let email = e.target.elements.email?.value;
        let password = e.target.elements.password?.value;
    
        const url = localUserType === 'doctor' 
        ? 'http://localhost:3001/api/v1/doctors/login' 
        : 'http://localhost:3001/api/v1/patients/login';
 
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, localUserType })  
    });
        const data = await response.json();
        
        if(data.success) {
            localStorage.setItem('token', data.token);
            setUserType(localUserType);   
            localStorage.setItem('userType', localUserType);
            if(localUserType === 'doctor') {
                localStorage.setItem('doctorId', data.doctor_id);
                setDoctorId(data.doctor_id);  
                navigate('/patient-appointments');
            }
            else {
                localStorage.setItem('patientId', data.patient_id);
                setPatientId(data.patient_id);  
                navigate('/patient-appointments');
            }
            setIsLoggedIn(true);
        } else {
            alert('Invalid credentials');
        }
    };


    const handleForgotPassword = () => {
        navigate('/forgot-password'); 
    };

    return (
        <ContainerLogin>
            <FormWrapper>
                <Title>Log in to your account 🔐</Title>
                <form onSubmit={handleFormSubmit}>
                    <RadioButtonContainer>
                        <RadioButton>
                            <input
                                type="radio"
                                name="userType"
                                value="doctor"
                                checked={localUserType === 'doctor'}
                                onChange={() => setLocalUserType('doctor')}
                            />
                            <span></span>
                            I am a Doctor
                        </RadioButton>
                        <RadioButton>
                            <input
                                type="radio"
                                name="userType"
                                value="patient"
                                checked={localUserType === 'patient'}
                                onChange={() => setLocalUserType('patient')}
                            />
                            <span></span>
                            I am a Patient
                        </RadioButton>
                    </RadioButtonContainer>
                    <div>
                        <label htmlFor='email'>Email</label>
                        <Input
                            type='email'
                            id='email'
                            placeholder='Your Email'
                        />
                    </div>
                    <div>
                        <label htmlFor='password'>Password</label>
                        <Input
                            type='password'
                            id='password'
                            placeholder='Your Password'
                        />
                    </div>
                    <div className='flex justify-center items-center mt-6'>
                        <Button>Login</Button>
                        <button type="button" onClick={handleForgotPassword} className='text-blue-600 underline'>
                            Forgot Password ?
                        </button>
                    </div>
                </form>
                <p className='text-center mb-4'>
                    Don't have an account ? <a href="/register" className='text-blue-600 underline'>Sign up !</a>
                </p>
            </FormWrapper>
        </ContainerLogin>
    );
};


export default LoginForm;
