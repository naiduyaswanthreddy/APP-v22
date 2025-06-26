import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Building, LogOut, Briefcase, Users, FileText, BarChart, User } from 'lucide-react';

const CompanyView = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  useEffect(() => {
    // Check if user is logged in and is a company
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate('/company-login');
        return;
      }
      
      // Verify if the logged-in user is associated with this company
      try {
        const companyRef = doc(db, 'companies', companyId);
        const companySnap = await getDoc(companyRef);
        
        if (!companySnap.exists() || companySnap.data().uid !== user.uid) {
          // Not authorized for this company
          toast.error('Not authorized to access this company dashboard');
          await signOut(auth);
          navigate('/company-login');
          return;
        }
        
        setCompany({
          id: companySnap.id,
          ...companySnap.data()
        });
        
        // Fetch assigned jobs
        fetchJobs(companySnap.data().selectedJobs || []);
        
      } catch (error) {
        console.error('Error verifying company access:', error);
        toast.error('Error loading company data');
      } finally {
        setLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, [companyId, navigate]);
  
  const fetchJobs = async (jobIds) => {
    if (!jobIds.length) {
      setJobs([]);
      return;
    }
    
    try {
      const jobsList = [];
      
      // Fetch each job by ID
      for (const jobId of jobIds) {
        const jobRef = doc(db, 'jobs', jobId);
        const jobSnap = await getDoc(jobRef);
        
        if (jobSnap.exists()) {
          // Fetch applications count for this job
          const applicationsRef = collection(db, 'applications');
          const q = query(applicationsRef, where('jobId', '==', jobId));
          const applicationsSnap = await getDocs(q);
          
          jobsList.push({
            id: jobSnap.id,
            ...jobSnap.data(),
            applicationsCount: applicationsSnap.size
          });
        }
      }
      
      setJobs(jobsList);
      
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Error loading job data');
    }
  };
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('userRole');
      localStorage.removeItem('companyId');
      navigate('/company-login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error during logout');
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!company) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-100">
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <Building size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Company Not Found</h2>
          <p className="text-gray-600 mb-4">The company dashboard you're trying to access doesn't exist or you don't have permission to view it.</p>
          <button
            onClick={() => navigate('/company-login')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            {company.logo ? (
              <img 
                src={company.logo} 
                alt={company.companyName} 
                className="h-10 w-10 rounded-full mr-3" 
              />
            ) : (
              <Building size={24} className="mr-3 text-blue-600" />
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">{company.companyName}</h1>
              <p className="text-sm text-gray-500">{company.industry}</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <LogOut size={18} className="mr-1" />
            <span>Logout</span>
          </button>
        </div>
      </header>
      
      {/* Navigation Tabs */}
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'dashboard' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Dashboard
            </button>
            
            {company.permissions.viewApplicants && (
              <button
                onClick={() => setActiveTab('applications')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'applications' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Applications
              </button>
            )}
            
            {company.permissions.viewStudentProfiles && (
              <button
                onClick={() => setActiveTab('students')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'students' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Student Profiles
              </button>
            )}
            
            {company.permissions.createJobs && (
              <button
                onClick={() => setActiveTab('jobs')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'jobs' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Job Postings
              </button>
            )}
            
            {company.permissions.viewAnalytics && (
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'analytics' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Analytics
              </button>
            )}
          </nav>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Company Dashboard</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                    <Briefcase size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Assigned Jobs</p>
                    <p className="text-2xl font-semibold">{jobs.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                    <Users size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Applications</p>
                    <p className="text-2xl font-semibold">
                      {jobs.reduce((total, job) => total + (job.applicationsCount || 0), 0)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                    <FileText size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Your Permissions</p>
                    <p className="text-2xl font-semibold">
                      {Object.values(company.permissions).filter(Boolean).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold">Your Job Postings</h3>
              </div>
              
              {jobs.length === 0 ? (
                <div className="p-6 text-center">
                  <Briefcase size={40} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">No job postings have been assigned to your company yet.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {jobs.map(job => (
                    <div key={job.id} className="p-6 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{job.position}</h4>
                          <p className="text-sm text-gray-500">{job.location}</p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {job.applicationsCount} Applications
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-4 text-sm text-gray-500">
                        <p className="line-clamp-2">{job.description}</p>
                      </div>
                      
                      <div className="mt-4 flex justify-between items-center">
                        <div>
                          <span className="text-sm text-gray-500">
                            Posted: {job.postedDate ? new Date(job.postedDate.seconds * 1000).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        
                        {company.permissions.viewApplicants && (
                          <button 
                            className="text-sm text-blue-600 hover:text-blue-800"
                            onClick={() => setActiveTab('applications')}
                          >
                            View Applications
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'applications' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Applications</h2>
            
            {/* Applications content would go here */}
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <FileText size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Applications management interface will be implemented here.</p>
            </div>
          </div>
        )}
        
        {activeTab === 'students' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Student Profiles</h2>
            
            {/* Students content would go here */}
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <User size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Student profiles browsing interface will be implemented here.</p>
            </div>
          </div>
        )}
        
        {activeTab === 'jobs' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Job Postings</h2>
            
            {/* Jobs content would go here */}
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <Briefcase size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Job posting management interface will be implemented here.</p>
            </div>
          </div>
        )}
        
        {activeTab === 'analytics' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Analytics</h2>
            
            {/* Analytics content would go here */}
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <BarChart size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Analytics dashboard will be implemented here.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CompanyView;