import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { useTranslation } from 'react-i18next';

import NavigationProvider from './features/auth/context/NavigationProvider';
import { SidebarProvider } from './contexts/SidebarContext';
import { createRTLTheme } from './utils/rtl';

import './i18n';

import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';
import {
  RegisterDoctorPage,
  RegisterPatientPage,
  RegisterReceptionistPage
} from './features/auth';

import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from './features/auth/pages/ResetPasswordPage';
import AccountVerified from './features/auth/pages/AccountVerified';

import DoctorRoutes from './features/auth/guards/DoctorRoutes';
import PrivateRoute from './features/auth/guards/PrivateRoute';
import ReceptionistProtectedRoute from './features/auth/guards/ReceptionistProtectedRoute';
import ReceptionistAssignedRoute from './features/auth/guards/ReceptionistAssignedRoute';

import HomePage from './pages/HomePage';

import AppointmentDashboard from './features/appointments/pages/AppointmentDashboard';

import SearchBar from './features/search/components/SearchBar';
import Layout from './components/common/layout/Layout';

import DoctorProfilePage from './features/user-management/pages/DoctorProfilePage';
import PatientProfilePage from './features/user-management/pages/PatientProfilePage';
import ReceptionistProfilePage from './features/user-management/pages/ReceptionistProfilePage';

import FileManager from './features/medical-records/pages/FileManager';
import './App.css';

import { ChatbotPage } from './features/chatbot';
import ChatPage from './features/chat/pages/ChatPage';

import Feed from './features/feed/pages/FeedPage';
import CreatePost from './features/feed/pages/CreatePostPage';
import FullPost from './features/feed/components/FullPost';  
import DoctorPosts from './features/feed/components/DoctorPosts';  
import EditPost from './features/feed/components/EditPostPage';  

import SettingsPage from './features/settings/pages/SettingsPage';

import { 
  MyReportsPage, 
  ReportDetailPage, 
  CreateMedicalReportPage, 
  EditMedicalReportPage 
} from './features/reports';


import PatientSearchPage from './features/receptionist/pages/PatientSearchPage';
import PatientDetailsPage from './features/receptionist/pages/PatientDetailsPage';
import CreatePatientPage from './features/receptionist/pages/CreatePatientPage';
import CreateAppointmentPage from './features/receptionist/pages/CreateAppointmentPage';
import ReceptionistDashboard from './features/receptionist/pages/ReceptionistDashboard';
import JobOffersPage from './features/receptionist/pages/JobOffersPage';

import { ReceptionistTalentPoolPage, StaffManagementPage, ReceptionistHistoryPage } from './features/staff-management/pages';


function App() {
  const { i18n } = useTranslation();
  const theme = createRTLTheme(i18n.language);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <NavigationProvider>
          <SidebarProvider>
            <Layout>
              <Routes>
                {/* Auth Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/register-doctor" element={<RegisterDoctorPage />} />
                <Route path="/register-patient" element={<RegisterPatientPage />} />
                <Route path="/register-receptionist" element={<RegisterReceptionistPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/posts/:postId" element={<FullPost />} />
                <Route path="/activate_account" element={<AccountVerified />} />
                

                {/* Receptionist Patient Management */}
                <Route
                  path="/patient-search"
                  element={
                    <ReceptionistAssignedRoute>
                      <PatientSearchPage />
                    </ReceptionistAssignedRoute>
                  }
                />
                <Route
                  path="/receptionist-dashboard"
                  element={
                    <ReceptionistAssignedRoute>
                      <ReceptionistDashboard />
                    </ReceptionistAssignedRoute>
                  }
                />
                <Route
                  path="/receptionist/job-offers"
                  element={
                    <ReceptionistProtectedRoute>
                      <JobOffersPage />
                    </ReceptionistProtectedRoute>
                  }
                />
                <Route
                  path="/receptionist/patients"
                  element={
                    <ReceptionistAssignedRoute>
                      <PatientSearchPage />
                    </ReceptionistAssignedRoute>
                  }
                />
                <Route
                  path="/receptionist/patients/:patientId"
                  element={
                    <ReceptionistAssignedRoute>
                      <PatientDetailsPage />
                    </ReceptionistAssignedRoute>
                  }
                />
                <Route
                  path="/receptionist/create-patient"
                  element={
                    <ReceptionistAssignedRoute>
                      <CreatePatientPage />
                    </ReceptionistAssignedRoute>
                  }
                />
                <Route
                  path="/receptionist/create-appointment"
                  element={
                    <ReceptionistAssignedRoute>
                      <CreateAppointmentPage />
                    </ReceptionistAssignedRoute>
                  }
                />

                {/* Existing Patient Routes */}
                <Route
                  path="/appointments"
                  element={
                    <PrivateRoute>
                      <AppointmentDashboard />
                    </PrivateRoute>
                  }
                />
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
                  path="/doctor-profile/:doctorId"
                  element={
                    <PrivateRoute>
                      <DoctorProfilePage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/patient-profile/:patientId"
                  element={
                    <PrivateRoute>
                      <PatientProfilePage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/receptionist-profile/:receptionistId"
                  element={
                    <PrivateRoute>
                      <ReceptionistProfilePage />
                    </PrivateRoute>
                  }
                />                
                <Route
                  path="/records/*"
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
                    <DoctorRoutes>
                      <CreatePost />
                    </DoctorRoutes>
                  }
                />
                <Route
                  path="/ChatBot"
                  element={
                    <DoctorRoutes>
                      <ChatbotPage />
                    </DoctorRoutes>
                  }
                />
                <Route
                  path="/chatbot/:chatId"
                  element={
                    <DoctorRoutes>
                      <ChatbotPage />
                    </DoctorRoutes>
                  }
                />
                <Route
                  path="/doctor-posts"
                  element={
                    <DoctorRoutes>
                      <DoctorPosts />
                    </DoctorRoutes>
                  }
                />
                <Route
                  path="/edit-post/:postId"
                  element={
                    <DoctorRoutes>
                      <EditPost />
                    </DoctorRoutes>
                  }
                />

                <Route
                  path="/doctor-report/:reportId"
                  element={
                    <DoctorRoutes>
                      <ReportDetailPage />
                    </DoctorRoutes>
                  }
                />

                {/* Medical Reports Routes */}
                <Route
                  path="/medical-report/:userId"
                  element={
                    <DoctorRoutes>
                      <MyReportsPage />
                    </DoctorRoutes>
                  }
                />
                <Route
                  path="/create-medical-report/:appointmentId"
                  element={
                    <DoctorRoutes>
                      <CreateMedicalReportPage />
                    </DoctorRoutes>
                  }
                />
                <Route
                  path="/edit-medical-report/:reportId"
                  element={
                    <DoctorRoutes>
                      <EditMedicalReportPage />
                    </DoctorRoutes>
                  }
                />

                <Route
                  path="/receptionist-talent-pool"
                  element={
                    <DoctorRoutes>
                      <ReceptionistTalentPoolPage />
                    </DoctorRoutes>
                  }
                />

                <Route
                  path="/staff-management"
                  element={
                    <DoctorRoutes>
                      <StaffManagementPage />
                    </DoctorRoutes>
                  }
                />

                <Route
                  path="/staff-management/history"
                  element={
                    <DoctorRoutes>
                      <ReceptionistHistoryPage />
                    </DoctorRoutes>
                  }
                />
              </Routes>
            </Layout>
          </SidebarProvider>
        </NavigationProvider>
      </Router>
    </ThemeProvider>
  );
}
export default App;
