import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ArrowLeft, Briefcase, Users, Calendar, MapPin } from 'lucide-react';

const CompanyJobView = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  
  useEffect(() => {
    const fetchJobAndApplications = async () => {
      try {
        // Verify user is authenticated
        const user = auth.currentUser;
        if (!user) {
          navigate('/company-login');
          return;
        }
        
        // Get company data to verify permissions
        const companiesRef = collection(db, 'companies');
        const q = query(companiesRef, where('uid', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          toast.error('Company data not found');
          navigate('/company-login');
          return;
        }
        
        const companyDoc = querySnapshot.docs[0];
        const companyData = {
          id: companyDoc.id,
          ...companyDoc.data()
        };
        setCompany(companyData);
        
        // Check if this job is assigned to this company
        const jobAssigned = companyData.selectedJobs?.some(job => job.id === jobId);
        if (!jobAssigned) {
          toast.error('You do not have access to this job posting');
          navigate('/company/dashboard');
          return;
        }
        
        // Fetch job details
        const jobRef = doc(db, 'jobs', jobId);
        const jobSnap = await getDoc(jobRef);
        
        if (!jobSnap.exists()) {
          toast.error('Job not found');
          navigate('/company/dashboard');
          return;
        }
        
        setJob({
          id: jobSnap.id,
          ...jobSnap.data()
        });
        
        // Fetch applications if company has permission
        if (companyData.permissions.viewApplicants) {
          const applicationsRef = collection(db, 'applications');
          const applicationsQuery = query(applicationsRef, where('jobId', '==', jobId));
          const applicationsSnap = await getDocs(applicationsQuery);
          
          const applicationsData = [];
          for (const appDoc of applicationsSnap.docs) {
            const appData = appDoc.data();
            
            // Get student details
            const studentRef = doc(db, 'students', appData.studentId);
            const studentSnap = await getDoc(studentRef);
            
            applicationsData.push({
              id: appDoc.id,
              ...appData,
              student: studentSnap.exists() ? {
                id: studentSnap.id,
                ...studentSnap.data()
              } : null
            });
          }
          
          setApplications(applicationsData);
        }
        
      } catch (error) {
        console.error('Error fetching job data:', error);
        toast.error('Error loading job data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchJobAndApplications();
  }, [jobId, navigate]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!job) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-red-600">Job not found</h2>
        <p className="mt-2">The job posting you're looking for doesn't exist or you don't have permission to view it.</p>
        <button
          onClick={() => navigate('/company/dashboard')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <button
        onClick={() => navigate('/company/dashboard')}
        className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        <ArrowLeft size={18} className="mr-1" />
        Back to Dashboard
      </button>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h1 className="text-2xl font-bold mb-2">{job.position}</h1>
        <div className="flex flex-wrap gap-4 text-gray-600 mb-4">
          <div className="flex items-center">
            <Briefcase size={18} className="mr-1" />
            <span>{job.company}</span>
          </div>
          <div className="flex items-center">
            <MapPin size={18} className="mr-1" />
            <span>{job.location}</span>
          </div>
          <div className="flex items-center">
            <Calendar size={18} className="mr-1" />
            <span>Posted: {job.postedDate ? new Date(job.postedDate.seconds * 1000).toLocaleDateString() : 'N/A'}</span>
          </div>
          <div className="flex items-center">
            <Users size={18} className="mr-1" />
            <span>{applications.length} Applications</span>
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Job Description</h2>
          <p className="whitespace-pre-line">{job.description}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Requirements</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Min. CGPA: {job.minCGPA}</li>
              <li>Max Current Arrears: {job.maxCurrentArrears}</li>
              <li>Max History Arrears: {job.maxHistoryArrears}</li>
              <li>Eligible Batch: {job.eligibleBatch?.join(', ')}</li>
              <li>Eligible Departments: {job.eligibleDepartments?.join(', ')}</li>
            </ul>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-2">Skills Required</h2>
            <div className="flex flex-wrap gap-2">
              {job.skills?.map((skill, index) => (
                <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {company?.permissions.viewApplicants ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Applications ({applications.length})</h2>
          
          {applications.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No applications received yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CGPA</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied On</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {applications.map((application) => (
                    <tr key={application.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {application.student?.name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {application.student?.email || 'No email'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{application.student?.department || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{application.student?.cgpa || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {application.status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {application.appliedDate ? new Date(application.appliedDate.seconds * 1000).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500">You don't have permission to view applications for this job.</p>
        </div>
      )}
    </div>
  );
};

export default CompanyJobView;