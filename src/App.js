import React from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CompanyView from './components/company/CompanyView';
import AuthHandler from "./AuthHandler";
import CompanyLogin from './components/company/CompanyLogin';
import CompanyDashboard from './components/company/CompanyDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/*" element={<AuthHandler />} />
        <Route path="/company-view/:shareId" element={<CompanyView />} />
        <Route path="/company-login" element={<CompanyLogin />} />
        <Route path="/company/dashboard" element={<CompanyDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
