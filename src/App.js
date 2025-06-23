import React from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CompanyView from './components/company/CompanyView';
import AuthHandler from "./AuthHandler";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/*" element={<AuthHandler />} />
        <Route path="/company-view/:shareId" element={<CompanyView />} />
      </Routes>
    </Router>
  );
}

export default App;
