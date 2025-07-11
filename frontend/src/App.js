import React, {useContext} from 'react';
import { AuthContext } from './components/Auth/AuthContext';  
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginForm from './components/Auth/LoginForm';
import DoctorRegisterPage from './components/Auth/RegisterDoctor';
import PatientRegisterPage from './components/Auth/RegisterPatient';
import RegisterPage from './components/Auth/RegisterPage';
import AppointmentDashboard from './pages/AppointmentDashboard';
import SearchBar from './components/Search/SearchBar';
import DoctorProfile from './components/Users/Doctor/DoctorProfile';
import PatientProfile from './components/Users/Patient/PatientProfile';
import FileManager from './pages/FileManager';
import AccountVerified from './pages/AccountVerified';
import './App.css';
import NavigationProvider from './components/Auth/NavigationProvider';
import { SidebarProvider } from './contexts/SidebarContext';
import Layout from './components/common/layout/Layout';
import ChatbotChat from './pages/Chatbot';
import ForgotPasswordForm from './components/Auth/ForgotPasswordForm';
import ResetPasswordForm from './components/Auth/ResetPasswordPage';
import ChatPage from './pages/ChatPage';
import Feed from './pages/FeedPage'
import CreatePost from './pages/CreatePost';
import DoctorRoute from './components/ProtectedRoutes/DoctorRoutes';
import PrivateRoute from './components/ProtectedRoutes/PrivateRoute';
import FullPost from './components/FeedBlog/FullPost';  
import DoctorPosts from './components/FeedBlog/DoctorPosts';  
import EditPost from './components/FeedBlog/EditPostPage';  
import Dashboard from './pages/Dashboard';
import DiagnosisPage from './pages/DiagnosisPage';
import SettingsPage from './pages/SettingsPage';
import DoctorReport from './components/Appointments/DoctorReport';  
import DoctorReports from './pages/MyReports';
import ReportDetail from './pages/ReportDetail';

function App() {

  return (
      <Router>
        <NavigationProvider>
          <SidebarProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginForm />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/register-doctor" element={<DoctorRegisterPage />} />
                <Route path="/register-patient" element={<PatientRegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordForm />} />
                <Route path="/reset-password" element={<ResetPasswordForm />} />
                <Route path="/posts/:postId" element={<FullPost />} />
                <Route path="/activate_account" element={<AccountVerified />} />
                <Route
                  path="/patient-appointments"
                  element={
                    <PrivateRoute>
                      <AppointmentDashboard />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/SearchBar"
                  element={
                    <PrivateRoute>
                      <SearchBar />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/DoctorProfile/:doctorId"
                  element={
                    <PrivateRoute>
                      <DoctorProfile />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/PatientProfile/:patientId"
                  element={
                    <PrivateRoute>
                      <PatientProfile />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/MyDocs/*"
                  element={
                    <PrivateRoute>
                      <FileManager />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/Messages"
                  element={
                    <PrivateRoute>
                      <ChatPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/feed"
                  element={
                    <PrivateRoute>
                      <Feed />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/diagnosis/:diagnosisId"
                  element={
                    <PrivateRoute>
                      <DiagnosisPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/settings/:userId"
                  element={
                    <PrivateRoute>
                      <SettingsPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/create-post"
                  element={
                    <DoctorRoute>
                      <CreatePost />
                    </DoctorRoute>
                  }
                />
                <Route
                  path="/ChatBot"
                  element={
                    <DoctorRoute>
                      <ChatbotChat />
                    </DoctorRoute>
                  }
                />
                <Route
                  path="/doctor-posts"
                  element={
                    <DoctorRoute>
                      <DoctorPosts />
                    </DoctorRoute>
                  }
                />
                <Route
                  path="/edit-post/:postId"
                  element={
                    <DoctorRoute>
                      <EditPost />
                    </DoctorRoute>
                  }
                />
                <Route
                  path="/DoctorReport/:appointmentId"
                  element={
                    <DoctorRoute>
                      <DoctorReport />
                    </DoctorRoute>
                  }
                />

                <Route
                  path="/medical-report/:userId"
                  element={
                    <DoctorRoute>
                      <DoctorReports />
                    </DoctorRoute>
                  }
                />

                <Route
                  path="/doctor-report/:reportId"
                  element={
                    <DoctorRoute>
                      <ReportDetail />
                    </DoctorRoute>
                  }
                />
              </Routes>
            </Layout>
          </SidebarProvider>
        </NavigationProvider>
      </Router>
  );
}
export default App;
