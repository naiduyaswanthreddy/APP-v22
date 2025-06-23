import React from "react";
import { Routes, Route } from "react-router-dom";
import AuthHandler from "./AuthHandler";
import Admin from './Admin';
import Resources from './components/admin/Resources';
import JobPost from './components/admin/JobPost';
import ManageApplications from './components/admin/ManageApplications';
import Coding from './components/admin/Coding';
import Students from './components/admin/Students';
import Profile from './components/admin/Profile';
import Gallery from './components/admin/Gallery';
import JobApplications from './components/admin/JobApplications';

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
        <Route path="job-applications/:jobId" element={<JobApplications />} />
      </Route>
    </Routes>
  );
}

export default MainRoutes;