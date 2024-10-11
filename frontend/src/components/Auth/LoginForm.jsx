import React, {useContext, useState, useEffect} from 'react';
import { AuthContext } from './AuthContext';  
import { useNavigate } from 'react-router-dom';
import { ContainerLogin, FormWrapper, Title, RadioButtonContainer, RadioButton, Input, Button } from './styles/LoginRegisterFormStyles';
import axios from './../axiosConfig';

const LoginForm = () => {
    const { setIsLoggedIn, setDoctorId, setPatientId, setUserType, doctorId, patientId, userFullName, setUserFullName, userProfilePhotoUrl, setUserProfilePhotoUrl, userId, setUserId, setToken, setRefreshToken} = useContext(AuthContext);

    const [localUserType, setLocalUserType] = useState('patient'); 
    const navigate = useNavigate();
    
    useEffect(() => {
    
    }, [localUserType, doctorId, patientId]);

    const handleFormSubmit = async (e) => {
        e.preventDefault();

        let email = e.target.elements.email?.value;
        let password = e.target.elements.password?.value;

        const url = localUserType === 'doctor' ? 'http://localhost:3001/api/v1/doctors/login' : 'http://localhost:3001/api/v1/patients/login';

    
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password, localUserType })
            });
            const text = await response.text();
            const data = JSON.parse(text);
        
            if(data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('userType', localUserType);
                localStorage.setItem('userProfilePhotoUrl', data.profile_picture_url);
                localStorage.setItem('token', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);

                setUserProfilePhotoUrl(data.profile_picture_url);
                setUserType(localUserType);   
                setToken(data.accessToken);
                setRefreshToken(data.refreshToken);

                if(localUserType === 'doctor') {
                    localStorage.setItem('doctorId', data.doctor_id);
                    localStorage.setItem('userId', data.doctor_id);
                    setDoctorId(data.doctor_id);  
                    setUserId(data.doctor_id);
                    navigate('/patient-appointments');
                }
                else {
                    localStorage.setItem('patientId', data.patient_id);
                    localStorage.setItem('userId', data.patient_id);
                    setPatientId(data.patient_id);
                    setUserId(data.patient_id);
 
                    navigate('/patient-appointments');
    
                }
                setIsLoggedIn(true);
                localStorage.setItem('userFullName', `${data.first_name} ${data.last_name}`);
                setUserFullName(`${data.first_name} ${data.last_name}`);
                
            } else {
                alert('Invalid credentials');
            }
        } catch (error) {
            console.error('Error parsing JSON:', error);
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
                            autoComplete="current-password" 
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
