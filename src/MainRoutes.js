import React from "react";
import { Routes, Route } from "react-router-dom";
import AuthHandler from "./AuthHandler";
import Admin from './Admin';
import Resources from './components/admin/Resources';
import JobPost from './components/admin/JobPost';
import ManageApplications from './components/admin/Job_Applications/ManageApplications';
import Coding from './components/admin/Coding';
import Students from './components/admin/Students';
import Profile from './components/admin/Profile';
import Gallery from './components/admin/Gallery';
import JobApplications from './components/admin/JobApplications';
import AdminChat from './components/admin/AdminChat';
import AdminCalendar from './components/admin/Calendar'; // Import AdminCalendar
import StudentCalendar from './components/student/Calendar'; // Import StudentCalendar

// Import company-related components
import Companies from './components/admin/Companies';
import CompanyCreate from './components/admin/CompanyCreate';
import CompanyMonitoring from './components/admin/CompanyMonitoring';
import CompanyLogin from './components/company/CompanyLogin';
import CompanyDashboard from './components/company/CompanyDashboard';

function MainRoutes() {
  return (
    <Routes>
      <Route path="/*" element={<AuthHandler />} />
      <Route path="/admin" element={<Admin />}>
        <Route index element={<Profile />} />
        <Route path="resources" element={<Resources />} />
        <Route path="jobpost" element={<JobPost />} />
        <Route path="manage-applications" element={<ManageApplications />} />
        <Route path="coding" element={<Coding />} />
        <Route path="students" element={<Students />} />
        <Route path="profile" element={<Profile />} />
        <Route path="gallery" element={<Gallery />} />
        <Route path="calendar" element={<AdminCalendar />} /> {/* AdminCalendar route */}
        <Route path="job-applications/:jobId" element={<JobApplications />} />
        <Route path="job-chat/:jobId" element={<AdminChat />} />
        
        {/* Company routes */}
        <Route path="companies" element={<Companies />} />
        <Route path="companies/create" element={<CompanyCreate />} />
        <Route path="companies/monitor" element={<CompanyMonitoring />} />
      </Route>
      
      {/* Company routes */}
      <Route path="/company-login" element={<CompanyLogin />} />
      <Route path="/company/dashboard" element={<CompanyDashboard />} />
    </Routes>
  );
}

export default MainRoutes;