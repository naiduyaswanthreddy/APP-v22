// First React and Router imports
import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';

// Add new Analytics import
import AdminAnalytics from "./components/admin/Analytics";

// Then Firebase imports
import { auth } from "./firebase";

// Then page components
import Login from "./Login";
import Signup from "./Signup";
import Student from "./Student";
import Admin from "./Admin";

// Then feature components
import StudentResources from "./components/student/Resources";
import StudentJobPost from "./components/student/JobPost";
import StudentCoding from "./components/student/Coding";
import StudentProfile from "./components/student/Profile";
import StudentGallery from "./components/student/Gallery";
import StudentApplications from "./components/student/Applications";

// Admin Components
import AdminResources from "./components/admin/Resources";
import AdminJobPost from "./components/admin/JobPost";
import AdminCoding from "./components/admin/Coding";
import AdminProfile from "./components/admin/Profile";
import AdminGallery from "./components/admin/Gallery";
import ManageApplications from './components/admin/Job_Applications/ManageApplications';
import JobApplications from './components/admin/Job_Applications/JobApplications';
import Students from "./components/admin/Students";

// Add import for Notifications
import AdminNotifications from "./components/admin/Notifications";

// Add import for StudentNotifications
import StudentNotifications from "./components/student/Notifications";

// First add the import for Companies component
import Companies from "./components/admin/Companies";
import CompanyCreate from "./components/admin/CompanyCreate";
import CompanyMonitoring from "./components/admin/CompanyMonitoring";

// Add import for Resume Maker
import ResumeMaker from "./components/student/Resume maker/src/App";

function AuthHandler() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Get role from localStorage
        const storedRole = localStorage.getItem("userRole");
        
        if (storedRole) {
          setUser(user);
          setRole(storedRole);
          
          // Only navigate if we're not already on the correct path
          const currentPath = window.location.pathname;
          const expectedPath = `/${storedRole}`;
          
          if (!currentPath.startsWith(expectedPath)) {
            navigate(expectedPath, { replace: true });
          }
        }
      } else {
        // Clear everything if no user
        setUser(null);
        setRole(null);
        localStorage.removeItem("userRole");
        
        // Only navigate to login if we're not already there or at signup
        if (!['/login', '/signup'].includes(window.location.pathname)) {
          navigate('/login', { replace: true });
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const ProtectedRoute = ({ children, allowedRole }) => {
    if (!user || !role) {
      return <Navigate to="/login" replace />;
    }

    if (role !== allowedRole) {
      return <Navigate to={`/${role}`} replace />;
    }

    return children;
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      
      {/* Admin routes with protection */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRole="admin">
          <Admin />
        </ProtectedRoute>
      }>
        <Route index element={<AdminProfile />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="resources" element={<AdminResources />} />
        <Route path="jobpost" element={<AdminJobPost />} />
        <Route path="manage-applications" element={<ManageApplications />} />
        <Route path="job-applications/:jobId" element={<JobApplications />} />
        <Route path="coding" element={<AdminCoding />} />
        <Route path="students" element={<Students />} />
        <Route path="profile" element={<AdminProfile />} />
        <Route path="gallery" element={<AdminGallery />} />
        <Route path="notifications" element={<AdminNotifications />} />
        
        {/* Add the missing company routes */}
        <Route path="companies" element={<Companies />} />
        <Route path="companies/create" element={<CompanyCreate />} />
        <Route path="companies/monitor" element={<CompanyMonitoring />} />
      </Route>

      {/* Student routes with protection */}
      <Route path="/student" element={
        <ProtectedRoute allowedRole="student">
          <Student />
        </ProtectedRoute>
      }>
        <Route index element={<StudentProfile />} />
        <Route path="resources" element={<StudentResources />} />
        <Route path="jobpost" element={<StudentJobPost />} />
        <Route path="applications" element={<StudentApplications />} />
        <Route path="coding" element={<StudentCoding />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="gallery" element={<StudentGallery />} />
        <Route path="notifications" element={<StudentNotifications />} />
        {/* Add the resume-maker route inside the student routes */}
        <Route path="resume-maker" element={<ResumeMaker />} />
      </Route>
    </Routes>
  );
}

export default AuthHandler;