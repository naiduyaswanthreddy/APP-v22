import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Briefcase, Users, FileText, BarChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';


const CompanyDashboard = () => {
    const navigate = useNavigate();

  const [companyData, setCompanyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    assignedJobs: 0,
    totalApplications: 0,
    pendingReviews: 0
  });
  
  useEffect(() => {
    fetchCompanyData();
  }, []);
  
  const fetchCompanyData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      // Get company data
      const companiesRef = collection(db, 'companies');
      const q = query(companiesRef, where('uid', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('Company data not found');
      }
      
      const companyDoc = querySnapshot.docs[0];
      const company = {
        id: companyDoc.id,
        ...companyDoc.data()
      };
      
      setCompanyData(company);
      
      // Calculate statistics
      let totalApplications = 0;
      let pendingReviews = 0;
      
      // Get applications for assigned jobs
      for (const jobRef of company.selectedJobs) {
        const applicationsRef = collection(db, 'applications');
        const applicationsQuery = query(applicationsRef, where('jobId', '==', jobRef.id));
        const applicationsSnapshot = await getDocs(applicationsQuery);
        
        totalApplications += applicationsSnapshot.size;
        
        // Count pending reviews
        applicationsSnapshot.docs.forEach(doc => {
          const status = doc.data().status;
          if (status === 'pending' || status === 'underReview') {
            pendingReviews++;
          }
        });
      }
      
      setStats({
        assignedJobs: company.selectedJobs.length,
        totalApplications,
        pendingReviews
      });
      
    } catch (error) {
      console.error('Error fetching company data:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!companyData) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-red-600">Error loading company data</h2>
        <p className="mt-2">Please try logging in again or contact support.</p>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{companyData.companyName} Dashboard</h1>
          <p className="text-gray-600">{companyData.industry}</p>
        </div>
        
        {companyData.logo && (
          <img 
            src={companyData.logo} 
            alt={companyData.companyName} 
            className="w-16 h-16 rounded-full object-cover mt-4 md:mt-0" 
          />
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <Briefcase size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Assigned Jobs</p>
              <p className="text-2xl font-semibold">{stats.assignedJobs}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Applications</p>
              <p className="text-2xl font-semibold">{stats.totalApplications}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Reviews</p>
              <p className="text-2xl font-semibold">{stats.pendingReviews}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Your Permissions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(companyData.permissions).map(([permission, isGranted]) => (
            <div key={permission} className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${isGranted ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`text-sm ${isGranted ? 'text-gray-800' : 'text-gray-500'}`}>
                {permission.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Assigned Job Postings</h2>
          {companyData.selectedJobs.length === 0 ? (
            <p className="text-gray-500">No jobs assigned yet</p>
          ) : (
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {companyData.selectedJobs.map((job, index) => (
                <div key={index} className="p-4 border rounded hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">Job #{index + 1}</h3>
                      <p className="text-sm text-gray-600">
                        {job.editable ? 'Can edit' : 'View only'}
                      </p>
                    </div>
                    <button 
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                      onClick={() => navigate(`/company/jobs/${job.id}`)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {companyData.permissions.viewAnalytics && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Analytics Overview</h2>
            <div className="h-64 flex items-center justify-center">
              <BarChart size={48} className="text-gray-300" />
              <p className="ml-4 text-gray-500">Analytics data will appear here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyDashboard;