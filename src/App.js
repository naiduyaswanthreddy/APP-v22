import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CompanyView from './components/company/CompanyView';
import AuthHandler from "./AuthHandler";
import CompanyLogin from './components/company/CompanyLogin';
import CompanyDashboard from './components/company/CompanyDashboard';
// Import new components
import CompanyJobView from './components/company/CompanyJobView';
import CompanyJobCreate from './components/company/CompanyJobCreate';

function App() {
  // Add this effect to check for company role on app load
  useEffect(() => {
    // Check if we're at the root or login page
    const isRootOrLogin = ["/", "/login"].includes(window.location.pathname);
    
    if (isRootOrLogin) {
      // Check if userRole is company
      const userRole = localStorage.getItem("userRole");
      if (userRole === "company") {
        // Clear the userRole to prevent redirect loops
        localStorage.removeItem("userRole");
        // Force reload to ensure clean state
        window.location.reload();
      }
    }
  }, []);

  return (
    <Router>
      <Routes>
        {/* Add explicit root path redirect to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Company specific routes with exact paths */}
        <Route path="/company-view/:shareId" element={<CompanyView />} />
        <Route path="/company-login" element={<CompanyLogin />} />
        <Route path="/company/dashboard" element={<CompanyDashboard />} />
        <Route path="/company/jobs/:jobId" element={<CompanyJobView />} />
        <Route path="/company/jobs/create" element={<CompanyJobCreate />} />
        
        {/* AuthHandler for all other routes */}
        <Route path="/*" element={<AuthHandler />} />
      </Routes>
    </Router>
  );
}

export default App;

