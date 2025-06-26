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
    <div className="p-6">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Add Back Button */}
      <button 
        onClick={() => navigate('/admin/companies')} 
        className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
      >
        <ArrowLeft size={16} className="mr-1" />
        Back to Companies
      </button>
      
      <h1 className="text-2xl font-bold mb-6">Create Company Account</h1>
      
      {createdCompany ? (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-green-600">Company Account Created Successfully!</h2>
            <button 
              onClick={() => setCreatedCompany(null)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Create Another
            </button>
          </div>
          
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold mb-2">Company Login Link:</h3>
            <div className="flex items-center">
              <code className="flex-1 bg-white p-3 rounded border">
                {`${window.location.origin}/company-login?companyId=${createdCompany.id}`}
              </code>
              <button 
                onClick={copyLoginLink}
                className="ml-2 p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                title="Copy to clipboard"
              >
                <Copy size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Share this link with the company to allow them to log in to their account.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Company Details</h3>
              <div className="space-y-2">
                <p><strong>Name:</strong> {createdCompany.companyName}</p>
                <p><strong>Email:</strong> {createdCompany.email}</p>
                <p><strong>Industry:</strong> {createdCompany.industry}</p>
                <p><strong>Website:</strong> {createdCompany.website}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Assigned Permissions</h3>
              <ul className="space-y-1">
                {Object.entries(createdCompany.permissions).map(([key, value]) => (
                  <li key={key} className="flex items-center">
                    <span className={`w-5 h-5 rounded-full mr-2 ${value ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-4">
            <button
              onClick={() => navigate('/admin/companies')}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              View All Companies
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Create Company Account</h1>
          </div>
          
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Building size={20} className="mr-2" />
                Login Credentials
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full p-2 border rounded-md"
                    placeholder="company@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full p-2 border rounded-md"
                    placeholder="Secure password"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold mb-4">Company Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    className="w-full p-2 border rounded-md"
                    placeholder="Company Name"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                    <input
                      type="text"
                      value={formData.industry}
                      onChange={(e) => setFormData({...formData, industry: e.target.value})}
                      className="w-full p-2 border rounded-md"
                      placeholder="e.g. Technology, Finance, Healthcare"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      className="w-full p-2 border rounded-md"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full p-2 border rounded-md"
                    placeholder="Brief description of the company"
                    rows="3"
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL (optional)</label>
                  <input
                    type="url"
                    value={formData.logo}
                    onChange={(e) => setFormData({...formData, logo: e.target.value})}
                    className="w-full p-2 border rounded-md"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold mb-4">Permissions</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.keys(formData.permissions).map(permission => (
                  <div key={permission} className="flex items-center">
                    <input
                      type="checkbox"
                      id={permission}
                      checked={formData.permissions[permission]}
                      onChange={() => handlePermissionChange(permission)}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <label htmlFor={permission} className="ml-2 text-gray-700">
                      {permission.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold mb-4">Assign Job Postings</h2>
              
              {jobs.length === 0 ? (
                <p className="text-gray-500">No job postings available to assign.</p>
              ) : (
                <div className="max-h-60 overflow-y-auto border rounded-md">
                  {jobs.map(job => (
                    <div 
                      key={job.id} 
                      className="flex items-center p-3 hover:bg-gray-50 border-b last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        id={`job-${job.id}`}
                        checked={formData.selectedJobs.includes(job.id)}
                        onChange={() => handleJobSelection(job.id)}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <label htmlFor={`job-${job.id}`} className="ml-2 flex-1">
                        <div className="font-medium">{job.position} at {job.company}</div>
                        <div className="text-sm text-gray-500">{job.location}</div>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-6 flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/admin/companies')}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded mr-4 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <>
                    <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></span>
                    Creating...
                  </>
                ) : 'Create Company Account'}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default CompanyCreate;