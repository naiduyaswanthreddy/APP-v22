import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Building, Users, Calendar, Clock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../ui/LoadingSpinner';

const CompanyMonitoring = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const companiesRef = collection(db, 'companies');
      const q = query(companiesRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setCompanies([]);
        setLoading(false);
        return;
      }
      
      const companiesData = [];
      for (const doc of snapshot.docs) {
        const company = {
          id: doc.id,
          ...doc.data(),
          activityLogs: []
        };
        
        try {
          // Fetch activity logs for each company
          const logsRef = collection(db, 'activityLogs');
          const logsQuery = query(logsRef, where('companyId', '==', company.id), orderBy('timestamp', 'desc'));
          const logsSnapshot = await getDocs(logsQuery);
          
          company.activityLogs = logsSnapshot.docs.map(logDoc => ({
            id: logDoc.id,
            ...logDoc.data()
          }));
        } catch (logError) {
          console.error(`Error fetching logs for company ${company.id}:`, logError);
          company.activityLogs = [];
        }
        
        companiesData.push(company);
      }
      
      setCompanies(companiesData);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast.error('Failed to load companies');
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const getActivitySummary = (logs) => {
    return {
      logins: logs.filter(log => log.activity === 'login').length,
      jobsViewed: logs.filter(log => log.activity === 'view_job').length,
      jobsCreated: logs.filter(log => log.activity === 'create_job').length,
      feedbackSubmitted: logs.filter(log => log.activity === 'submit_feedback').length,
      applicantsReviewed: logs.filter(log => log.activity === 'review_applicant').length
    };
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
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Company Accounts</h1>
        <div className="flex space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded px-3 py-1"
          >
            <option value="all">All Companies</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-screen"><LoadingSpinner size="large" text="Loading companies..." /></div>
      ) : companies.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <Building size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-xl font-medium">No companies found</p>
          <p className="text-gray-500 mt-2">Create your first company account to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {companies.map(company => {
            const activitySummary = getActivitySummary(company.activityLogs);
            
            return (
              <div key={company.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6 border-b">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      {company.logo ? (
                        <img 
                          src={company.logo} 
                          alt={company.companyName} 
                          className="w-12 h-12 rounded-full mr-4 object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                          <Building size={24} className="text-gray-500" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-semibold">{company.companyName}</h3>
                        <p className="text-sm text-gray-500">{company.industry}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-xs rounded-full ${company.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {company.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{company.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Website</p>
                      <a href={company.website} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                        {company.website}
                      </a>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Jobs Posted</p>
                      <p className="font-medium">{company.jobsPosted || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Created On</p>
                      <p className="font-medium">
                        {company.createdAt ? new Date(company.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 bg-gray-50">
                  <h4 className="font-medium mb-3">Activity Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-white p-3 rounded shadow-sm">
                      <p className="text-xs text-gray-500">Logins</p>
                      <p className="font-semibold">{activitySummary.logins}</p>
                    </div>
                    <div className="bg-white p-3 rounded shadow-sm">
                      <p className="text-xs text-gray-500">Jobs Viewed</p>
                      <p className="font-semibold">{activitySummary.jobsViewed}</p>
                    </div>
                    <div className="bg-white p-3 rounded shadow-sm">
                      <p className="text-xs text-gray-500">Jobs Created</p>
                      <p className="font-semibold">{activitySummary.jobsCreated}</p>
                    </div>
                    <div className="bg-white p-3 rounded shadow-sm">
                      <p className="text-xs text-gray-500">Feedback Given</p>
                      <p className="font-semibold">{activitySummary.feedbackSubmitted}</p>
                    </div>
                    <div className="bg-white p-3 rounded shadow-sm">
                      <p className="text-xs text-gray-500">Applicants Reviewed</p>
                      <p className="font-semibold">{activitySummary.applicantsReviewed}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Recent Activity</h4>
                    {company.activityLogs.length > 0 ? (
                      <div className="max-h-40 overflow-y-auto">
                        {company.activityLogs.slice(0, 5).map(log => (
                          <div key={log.id} className="flex items-center py-2 border-b border-gray-100 last:border-0">
                            <Clock size={16} className="text-gray-400 mr-2" />
                            <div>
                              <p className="text-sm">{log.description}</p>
                              <p className="text-xs text-gray-500">
                                {log.timestamp ? new Date(log.timestamp.toDate()).toLocaleString() : 'N/A'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No recent activity</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CompanyMonitoring;
