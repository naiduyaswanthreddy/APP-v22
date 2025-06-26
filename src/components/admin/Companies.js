import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building, Plus, List, User } from 'lucide-react';

const Companies = () => {
  const navigate = useNavigate();
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Company Management</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <Plus size={24} />
            </div>
            <h2 className="text-xl font-semibold">Create Company Account</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Create a new company account with custom permissions and job assignments.
          </p>
          <button
            onClick={() => navigate('/admin/companies/create')}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Create New Company
          </button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <List size={24} />
            </div>
            <h2 className="text-xl font-semibold">Monitor Companies</h2>
          </div>
          <p className="text-gray-600 mb-4">
            View and manage existing company accounts, track activity, and monitor job postings.
          </p>
          <button
            onClick={() => navigate('/admin/companies/monitor')}
            className="w-full py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            View All Companies
          </button>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/admin/companies/create')}
            className="p-4 border rounded hover:bg-gray-50 flex flex-col items-center justify-center text-center"
          >
            <Building size={24} className="mb-2 text-blue-600" />
            <span className="font-medium">Create Company</span>
          </button>
          
          <button
            onClick={() => navigate('/admin/companies/monitor')}
            className="p-4 border rounded hover:bg-gray-50 flex flex-col items-center justify-center text-center"
          >
            <List size={24} className="mb-2 text-green-600" />
            <span className="font-medium">View Companies</span>
          </button>
          
          <button
            onClick={() => window.open('/company-login', '_blank')}
            className="p-4 border rounded hover:bg-gray-50 flex flex-col items-center justify-center text-center"
          >
            <User size={24} className="mb-2 text-purple-600" />
            <span className="font-medium">Company Login Page</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Companies;