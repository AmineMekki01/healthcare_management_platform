import React from "react";
import { useRef, errRef, useState, useEffect } from "react";
import axios from './../axiosConfig';
import {
    ContainerRegister,
    FormWrapper,
    Title,
    Input,
    Textarea,
    Button,
    SuccessSection,
    SuccessWrapper,
    Note,
    CheckboxContainer,
    CheckboxLabel,
    CheckboxInput,
    CheckboxCustom
} from './styles/LoginRegisterFormStyles';


const USER_REGEX = /^[a-zA-Z][a-zA-Z0-9-_]{3,23}$/;

const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*?[0-9])(?=.*[!@#$%]).{8,24}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^[0-9]{10}$/;  


const DoctorRegisterPage = () => {

    const userRef = useRef();
    const errRef = useRef();

    const [user, setUser] = useState('');
    const [validName, setValidName] = useState(false);
    const [userFocus, setUserFocus] = useState(false);
    const [sex, setSex] = useState('');
    const [pwd, setPwd] = useState('');
    const [validPwd, setValidPwd] = useState(false);
    const [pwdFocus, setPwdFocus] = useState(false);

    const [matchPwd, setMatchPwd] = useState('');
    const [validMatch, setValidMatch] = useState(false);
    const [matchFocus, setMatchFocus] = useState(false);

    const [email, setEmail] = useState('');
    const [validEmail, setValidEmail] = useState(false);
    const [emailFocus, setEmailFocus] = useState(false);

    const [phone, setPhone] = useState('');
    const [validPhone, setValidPhone] = useState(false);
    const [phoneFocus, setPhoneFocus] = useState(false);

    const [errMsg, setErrMsg] = useState('');
    const [success, setSuccess] = useState(false);

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [birthdate, setBirthdate] = useState('');
    const [license, setLicenseNumber] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [state_name, setStateName] = useState('');
    const [zipCode, setZipCode] = useState('');
    const [country_name, setCountryName] = useState('');
    const [bio, setBio] = useState('');
    const [specialty, setSpecialty] = useState('');
    const [experience, setExperience] = useState('');
    
    const [file, setFile] = useState(null);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };
    

    useEffect(() => {
        userRef.current.focus();
    }, [])
    
    useEffect(() => {
        const result = USER_REGEX.test(user);
        setValidName(result);
    }, [user]);
    
    useEffect(() => {
        const result = PWD_REGEX.test(pwd);
        setValidPwd(result);
        const match = pwd === matchPwd;
        setValidMatch(match);
    }, [pwd, matchPwd]);

    useEffect(() => {
        setErrMsg('');
    }, [user, pwd, matchPwd])

    useEffect(() => {
        const result = EMAIL_REGEX.test(email);
        setValidEmail(result);
    }, [email]);
    
    useEffect(() => {
        const result = PHONE_REGEX.test(phone);
        setValidPhone(result);
    }, [phone]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!validName || !validPwd || !validMatch || !validEmail || !validPhone) {
            setErrMsg('Invalid Entry');
            return;
        }
        const formData = new FormData();
        formData.append('file', file);
        formData.append('Username', user);
        formData.append('Password', pwd);
        formData.append('Email', email);
        formData.append('PhoneNumber', phone);
        formData.append('FirstName', firstName);
        formData.append('LastName', lastName);
        formData.append('BirthDate', birthdate);
        formData.append('MedicalLicense', license);
        formData.append('StreetAddress', address);
        formData.append('CityName', city);
        formData.append('StateName', state_name);
        formData.append('ZipCode', zipCode);
        formData.append('CountryName', country_name);
        formData.append('DoctorBio', bio);
        formData.append('Specialty', specialty);
        formData.append('Experience', experience);
        formData.append('Sex', sex);
  
        console.log("form data : ", formData)
        try {
            const response = await axios.post('http://localhost:3001/api/v1/doctors/register', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
            });
            if(response.data.success) {
                setSuccess(true);
            } else {
                setErrMsg('Registration failed');
            }
        } catch (error) {
            setErrMsg('Server error');
        }
    };
  
    return (
        <>
        {success ? (
        <SuccessSection>
            <SuccessWrapper>
                <h5 className="text-2xl font-semibold mb-4 text-center">Success!</h5>
                <p className="text-center text-lg mb-4">You have successfully registered.</p>
                <div className="flex justify-center">
                    <a href="login" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                        Sign In
                    </a>
                </div>
            </SuccessWrapper>
        </SuccessSection>  
        
        ) : (

        
        <ContainerRegister >
            <p ref={errRef} className={errMsg ? "errmsg" : "offscreen"} aria-live="assertive">{errMsg}</p>
            <FormWrapper>
                <Title>
                    Signup to create an account
                </Title>
                
                <p className='text-center mb-4'>
                    Already have an account? <a href="/login" className='text-blue-600 underline'>Login</a>
                </p>

                <form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="file">Profile Picture:</label>
                        <input type="file" id="file" onChange={handleFileChange} />
                    </div>
                    <CheckboxContainer>
                        <CheckboxLabel>
                            <CheckboxInput 
                            type="radio" 
                            name="sex" 
                            value="Male" 
                            onChange={(e) => setSex(e.target.value)}
                            />
                            <CheckboxCustom></CheckboxCustom>
                            Male
                        </CheckboxLabel>
                        <CheckboxLabel>
                            <CheckboxInput 
                            type="radio" 
                            name="sex" 
                            value="Female" 
                            onChange={(e) => setSex(e.target.value)}
                            />
                            <CheckboxCustom></CheckboxCustom>
                            Female
                        </CheckboxLabel>
                    </CheckboxContainer>

                    <div>
                        <label htmlFor='user_name'>
                            Username :
                            <span className={validName ? "valid" : "hide"}></span>
                            <span className={validName || !user ? "hide" : "invalid"}></span>
                        </label>
                        <Input
                            type='text'
                            name='user_name'
                            placeholder='Choose a username'
                            ref={userRef}
                            autoComplete="off"
                            onChange={(e) => setUser(e.target.value)}
                            required
                            aria-invalid={validName ? "false" : "true"}
                            aria-describedby="uidnote"   
                            onFocus={() => setUserFocus(true)}
                            onBlur={() => setUserFocus(false)}
                        />
                        <Note id="uidnote" show={userFocus && user && !validName}>
                            Username must be 4-24 characters long and start with a letter.</Note>
                    </div>
                    <div>
                        <label htmlFor='firstName'>First name</label>
                        <Input
                            type='text'
                            name='firstName'
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder='Your First Name'
                        />
                    </div>
                    <div>
                        <label htmlFor='lastName'>Last name</label>
                        <Input
                            type='text'
                            name='lastName'
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder='Your Last name'
                        />
                    </div>
                    <div>
                        <label htmlFor='email'>Email:
                            <span className={validEmail ? "valid" : "hide"}></span>
                            <span className={validEmail || !email ? "hide" : "invalid"}></span>
    
                        </label>
                        <Input
                            type='email'
                            name='email'
                            placeholder='Your Email'
                            onChange={(e) => setEmail(e.target.value)}
                            onFocus={() => setEmailFocus(true)}
                            onBlur={() => setEmailFocus(false)}
                        />
                        <Note id="emailnote" show={emailFocus && email && !validEmail}>
                            Enter a valid email address.
                        </Note>
                    </div>
                    <div>
                        <label htmlFor='password'>Password : 
                            <span className={validPwd ? "valid" : "hide"}></span>
                            <span className={validPwd || !pwd ? "hide" : "invalid"}></span>
                        </label>
                        <Input
                            type='password'
                            name='password'
                            placeholder='Your Password'
                            onChange={(e) => setPwd(e.target.value)}
                            required
                            aria-invalid={validPwd ? "false" : "true"}
                            aria-describedby="pwdnote"
                            onFocus={() => setPwdFocus(true)}
                            onBlur={() => setPwdFocus(false)}
                        />
                        <Note id="pwdnote" show={pwdFocus && pwd && !validPwd}>
                            8 to 24 characters.<br/>
                            Must include uppercase and lowercase letters, a number and a special character.<br/>
                            Allowed special charac : <span aria-label="exclamation mark">!</span><span aria-label="hashtag">#</span><span aria-label="at symbol">@</span>
                            <span aria-label="dollar sign">$</span><span aria-label="percent">%</span>
                        </Note>
                    </div>
                    <div>
                        <label htmlFor='password'>Confirm Password : 
                            <span className={validMatch && matchPwd ? "valid" : "hide"}></span>
                            <span className={validMatch || !matchPwd ? "hide" : "invalid"}></span>
                        </label>
                        <Input
                            type='password'
                            name='confirm_pwd'
                            placeholder='Your Password'
                            onChange={(e) => setMatchPwd(e.target.value)}
                            required
                            aria-invalid={validPwd ? "false" : "true"}
                            aria-describedby="confirmnote"
                            onFocus={() => setMatchFocus(true)}
                            onBlur={() => setMatchFocus(false)}
                        />
                        <Note id="confirmnote" show={matchFocus && validPwd && !validMatch}>
                            Must match the first password input field
                        </Note>
                    </div>
                    <div>
                        <label htmlFor='birthdate'>Birth Date :</label>
                        <Input
                            type='date'
                            name='birthdate'
                            onChange={(e) => setBirthdate(e.target.value)}
                            placeholder='Your Birth Date'
                        />
                    </div>
                    <div>
                        <label htmlFor='phone'>Phone : 
                            <span className={validPhone ? "valid" : "hide"}></span>
                            <span className={validPhone || !phone ? "hide" : "invalid"}></span>
                        </label>
                        <Input  
                            type='text' 
                            name='phone'
                            placeholder='Your Phone Number'
                            onChange={(e) => setPhone(e.target.value)}
                            onFocus={() => setPhoneFocus(true)}
                            onBlur={() => setPhoneFocus(false)}
                        />
                        <Note id="phonenote" show={phoneFocus && phone && !validPhone}>
                            Enter a valid phone number.
                        </Note>
                    </div>
                    <div>
                        <label htmlFor='license'>License Number : </label>
                        <Input
                            type='text'
                            name='license'
                            onChange={(e) => setLicenseNumber(e.target.value)}
                            placeholder='You license number'
                        />
                    </div>
                    <div>
                        <label htmlFor='specialty'>Specialty : </label>
                        <Input
                            type='text'
                            name='specialty'
                            onChange={(e) => setSpecialty(e.target.value)}
                            placeholder='You specialty '
                        />
                    </div>
                    <div>
                        <label htmlFor='experience'>Experience : </label>
                        <Input
                            type='text'
                            name='experience'
                            onChange={(e) => setExperience(e.target.value)}
                            placeholder='You experience in years'
                        />
                    </div>
                    <div>
                        <label htmlFor='address'>Address : </label>
                        <Input
                            type='text'
                            name='address'
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder='Your Address'
                        />
                    </div>
                    <div>
                        <label htmlFor='city'>City : </label>
                        <Input
                            type='text'
                            name='city'
                            onChange={(e) => setCity(e.target.value)}
                            placeholder='Your City'
                        />
                    </div>
                    <div>
                        <label htmlFor='state_name'>State :</label>
                        <Input
                            type='text'
                            name='state_name'
                            onChange={(e) => setStateName(e.target.value)}
                            placeholder='Your State'
                        />
                    </div>
                    <div>
                        <label htmlFor='zip'>Zip Code :</label>
                        <Input
                            type='text'
                            name='zipCode'   
                            onChange={(e) => setZipCode(e.target.value)} 
                            placeholder="Your zip code"
                        />              
                    </div>
                    <div>
                        <label htmlFor='country'>Country :</label>
                        <Input
                            type='text'
                            name='country_name'
                            onChange={(e) => setCountryName(e.target.value)}
                            placeholder='Your State'
                        />
                    </div>
                    <div>
                        <label htmlFor='bio'>Bio : </label>
                        <Textarea
                            type='text'
                            name='bio'
                            onChange={(e) => setBio(e.target.value)}
                            placeholder='Let your patients know about you !'
                        />
                    </div>
                    <div className='flex justify-center items-center mt-6'>
                        <Button
                            disabled={!validName || !validPwd || !validMatch || !validEmail || !validPhone}
                        >
                            Register
                        </Button>
                    </div>
                    
                    
                </form>
            </FormWrapper>
        </ContainerRegister>
        )}
        </>
    );
};

export default DoctorRegisterPage;




