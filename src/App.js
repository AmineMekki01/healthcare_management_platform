import React, {useContext, useEffect} from 'react';
import { AuthContext } from './components/Auth/AuthContext';  
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginForm from './components/Auth/LoginForm';
import DoctorRegisterPage from './components/Auth/RegisterDoctor';
import PatientRegisterPage from './components/Auth/RegisterPatient';
import RegisterPage from './components/Auth/RegisterPage';
import AppointmentDashboard from './pages/AppointmentDashboard';
import SearchBar from './components/Search/SearchBar';
import MyNavbar from './components/common/navbar/Navbar'; 
import DoctorProfile from './components/Users/Doctor/DoctorProfile';
import PatientProfile from './components/Users/Patient/PatientProfile';
import FileManager from './pages/FileManager';
import AccountVerified from './pages/AccountVerified';
import './App.css';
import NavigationProvider from './components/Auth/NavigationProvider';
import ChatbotChat from './pages/Chatbot';
import ForgotPasswordForm from './components/Auth/ForgotPasswordForm';
import ResetPasswordForm from './components/Auth/ResetPasswordPage';
import ChatPage from './pages/ChatPage';

function App() {

  return (
      <Router>
        <NavigationProvider>
          <div className="flex">
            <MyNavbar />
            <div className="ml-auto w-full scrollable-div">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginForm />} />
                <Route path="/register" element={<RegisterPage/>} />
                <Route path="/register-doctor" element={<DoctorRegisterPage />} />
                <Route path="/register-patient" element={<PatientRegisterPage />} />
                <Route path="/patient-appointments" element={<AppointmentDashboard />} />
                <Route path="/SearchBar" element={<SearchBar />} />
                <Route path="/DoctorProfile/:doctorId" element={<DoctorProfile/>} />
                <Route path="/PatientProfile/:patientId" element={<PatientProfile/>} />
                <Route path="/MyDocs/*" element={<FileManager/>} />
                <Route path="/activate_account" element={<AccountVerified/>} />
                <Route path="/forgot-password" element={<ForgotPasswordForm/>} />
                <Route path="/reset-password" element={<ResetPasswordForm />} />
                <Route path="/Chatbot" element={<ChatbotChat />} />
                <Route path="/Messages" element={<ChatPage />} />
              </Routes>
            </div>
          </div>
        </NavigationProvider>
      </Router>
  );
}
export default App;
