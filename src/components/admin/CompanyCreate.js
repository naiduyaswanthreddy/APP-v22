import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, getDocs, serverTimestamp, query, where } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from 'react-router-dom';
import { Building, Copy, ArrowLeft } from 'lucide-react';

const CompanyCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [createdCompany, setCreatedCompany] = useState(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    companyName: '',
    description: '',
    website: '',
    industry: '',
    logo: '',
    selectedJobs: [],
    permissions: {
      viewApplicants: false,
      createJobs: false,
      editJobs: false,
      viewAnalytics: false,
      viewStudentProfiles: false
    }
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const jobsRef = collection(db, 'jobs');
      const querySnapshot = await getDocs(jobsRef);
      const jobsList = [];
      querySnapshot.forEach((doc) => {
        jobsList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setJobs(jobsList);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.companyName) {
      toast.error('Email, password and company name are required');
      return;
    }
    
    try {
      setLoading(true);
      
      // Check if email is already in use
      const companiesRef = collection(db, 'companies');
      const q = query(companiesRef, where('email', '==', formData.email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        throw new Error('Email is already in use');
      }
      
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      
      // Store company data in Firestore
      const companyData = {
        uid: userCredential.user.uid,
        email: formData.email,
        companyName: formData.companyName,
        description: formData.description,
        website: formData.website,
        industry: formData.industry,
        logo: formData.logo,
        permissions: formData.permissions,
        selectedJobs: formData.selectedJobs,
        role: 'company',
        createdAt: serverTimestamp(),
        jobsPosted: 0,
        applicationsReceived: 0,
        lastLogin: null
      };
      
      const docRef = await addDoc(companiesRef, companyData);
      
      // Set created company with ID
      setCreatedCompany({
        id: docRef.id,
        ...companyData
      });
      
      toast.success('Company account created successfully!');
      
      // Reset form
      setFormData({
        email: '',
        password: '',
        companyName: '',
        description: '',
        website: '',
        industry: '',
        logo: '',
        selectedJobs: [],
        permissions: {
          viewApplicants: false,
          createJobs: false,
          editJobs: false,
          viewAnalytics: false,
          viewStudentProfiles: false
        }
      });
      
    } catch (error) {
      console.error('Error creating company account:', error);
      toast.error(`Error creating company account: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (permission) => {
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [permission]: !formData.permissions[permission]
      }
    });
  };

  const handleJobSelection = (jobId) => {
    const updatedJobs = formData.selectedJobs.includes(jobId)
      ? formData.selectedJobs.filter(id => id !== jobId)
      : [...formData.selectedJobs, jobId];
    
    setFormData({
      ...formData,
      selectedJobs: updatedJobs
    });
  };

  const copyLoginLink = () => {
    const loginUrl = `${window.location.origin}/company-login?companyId=${createdCompany.id}`;
    navigator.clipboard.writeText(loginUrl);
    toast.success('Login link copied to clipboard');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header and Back Button */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <button
            onClick={() => navigate('/admin/companies')}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200"
          >
            <ArrowLeft size={20} className="mr-2" />
            <span className="font-medium">Back to Companies</span>
          </button>
          <h1 className="text-3xl font-extrabold text-gray-800">Create Company Account</h1>
        </div>

        {createdCompany ? (
          <div className="p-8">
            <div className="bg-green-50 border border-green-200 text-green-800 p-5 rounded-lg mb-8 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Company Account Created Successfully!
              </h2>
              <button
                onClick={() => setCreatedCompany(null)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Create Another Company
              </button>
            </div>

            <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
                <Copy size={18} className="mr-2" />
                Company Login Link:
              </h3>
              <div className="flex items-center bg-white rounded-md border border-gray-300 pr-2">
                <code className="flex-1 p-3 text-sm text-gray-700 overflow-auto whitespace-nowrap">
                  {`${window.location.origin}/company-login?companyId=${createdCompany.id}`}
                </code>
                <button
                  onClick={copyLoginLink}
                  className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
                  title="Copy to clipboard"
                >
                  <Copy size={18} />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-3">
                Share this link with the company to allow them to log in to their account.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="font-bold text-gray-700 mb-4 text-lg">Company Details</h3>
                <div className="space-y-3 text-gray-700">
                  <p><strong className="text-gray-900">Name:</strong> {createdCompany.companyName}</p>
                  <p><strong className="text-gray-900">Email:</strong> {createdCompany.email}</p>
                  <p><strong className="text-gray-900">Industry:</strong> {createdCompany.industry}</p>
                  <p><strong className="text-gray-900">Website:</strong> {createdCompany.website}</p>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-700 mb-4 text-lg">Assigned Permissions</h3>
                <ul className="space-y-2">
                  {Object.entries(createdCompany.permissions).map(([key, value]) => (
                    <li key={key} className="flex items-center text-gray-700">
                      <span className={`w-4 h-4 rounded-full mr-3 flex-shrink-0 ${value ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => navigate('/admin/companies')}
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-semibold"
              >
                View All Companies
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Login Credentials */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <Building size={24} className="mr-3 text-blue-600" />
                Login Credentials
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                    placeholder="company@example.com"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    id="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                    placeholder="Secure password"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Company Details */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Company Details</h2>
              <div className="space-y-6">
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                  <input
                    type="text"
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                    placeholder="Acme Corporation"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                    <input
                      type="text"
                      id="industry"
                      value={formData.industry}
                      onChange={(e) => setFormData({...formData, industry: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                      placeholder="e.g. Technology, Finance, Healthcare"
                    />
                  </div>
                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                    <input
                      type="url"
                      id="website"
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                      placeholder="https://www.example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                    placeholder="Brief description of the company and its mission."
                    rows="4"
                  ></textarea>
                </div>

                <div>
                  <label htmlFor="logo" className="block text-sm font-medium text-gray-700 mb-2">Logo URL (optional)</label>
                  <input
                    type="url"
                    id="logo"
                    value={formData.logo}
                    onChange={(e) => setFormData({...formData, logo: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                    placeholder="https://www.example.com/logo.png"
                  />
                </div>
              </div>
            </div>

            {/* Permissions */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Permissions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.keys(formData.permissions).map(permission => (
                  <div key={permission} className="flex items-center p-3 bg-gray-50 rounded-md border border-gray-200">
                    <input
                      type="checkbox"
                      id={permission}
                      checked={formData.permissions[permission]}
                      onChange={() => handlePermissionChange(permission)}
                      className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor={permission} className="ml-3 text-gray-800 font-medium cursor-pointer">
                      {permission.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Assign Job Postings */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Assign Job Postings</h2>
              {jobs.length === 0 ? (
                <p className="text-gray-500 italic">No job postings available to assign.</p>
              ) : (
                <div className="max-h-80 overflow-y-auto border border-gray-300 rounded-md">
                  {jobs.map(job => (
                    <div
                      key={job.id}
                      className="flex items-center p-4 hover:bg-gray-50 border-b last:border-b-0 transition-colors duration-200"
                    >
                      <input
                        type="checkbox"
                        id={`job-${job.id}`}
                        checked={formData.selectedJobs.includes(job.id)}
                        onChange={() => handleJobSelection(job.id)}
                        className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                      />
                      <label htmlFor={`job-${job.id}`} className="ml-4 flex-1 cursor-pointer">
                        <div className="font-semibold text-gray-800">{job.position} at {job.company}</div>
                        <div className="text-sm text-gray-600">{job.location}</div>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/admin/companies')}
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold flex items-center justify-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <>
                    <span className="animate-spin h-5 w-5 mr-3 border-t-2 border-b-2 border-white rounded-full"></span>
                    Creating...
                  </>
                ) : 'Create Company Account'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CompanyCreate;