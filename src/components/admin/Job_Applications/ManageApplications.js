import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, where, deleteDoc, getDoc } from 'firebase/firestore';
// Update the firebase import path
import { db } from '../../../firebase';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from 'react-router-dom';
// Add these imports at the top
import { addDoc, serverTimestamp } from 'firebase/firestore';
import AdminChat from '../AdminChat'; // Import the AdminChat component
import LoadingSpinner from '../../ui/LoadingSpinner';
import NoData from '../../ui/NoData';

// Custom toast component for truncating long messages
const CustomToast = ({ message }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = message.length > 15;
  
  return (
    <div>
      {shouldTruncate && !isExpanded ? (
        <div>
          {message.substring(0, 15)}
          <button 
            onClick={() => setIsExpanded(true)}
            className="ml-2 text-blue-500 underline text-sm"
          >
            Show More
          </button>
        </div>
      ) : (
        message
      )}
    </div>
  );
};

// Custom toast function
const showToast = (message, type = 'success') => {
  toast[type](
    <CustomToast message={message} />,
    { closeButton: true }
  );
};

const ManageApplications = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('deadline');
  const [shareLinks, setShareLinks] = useState({});
  // Add state for chat modal
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);

  // Add the generateShareLink function here
  const generateShareLink = async (jobId, company) => {
    try {
      const shareData = {
        jobId,
        company,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        token: Math.random().toString(36).substring(2) + Date.now().toString(36)
      };

      const shareRef = await addDoc(collection(db, 'companyShares'), shareData);
      // Use window.location.href to get the full base URL
      const baseUrl = window.location.href.split('/admin')[0];
      const shareLink = `${baseUrl}/company-view/${shareRef.id}`;
      
      setShareLinks(prev => ({
        ...prev,
        [jobId]: shareLink
      }));

      showToast('Share link generated successfully!');
      return shareLink;
    } catch (error) {
      console.error('Error generating share link:', error);
      showToast('Failed to generate share link', 'error');
    }
  };

  const handleViewApplications = (jobId) => {
    if (jobId) {
      navigate(`/admin/job-applications/${jobId}`);
    } else {
      showToast('Invalid job ID', 'error');
    }
  };

  // Add function to handle chat button click
  // Modify the handleChatClick function
  const handleChatClick = (jobId) => {
    setSelectedJobId(jobId);
    setShowChatModal(true); // Changed to match the state variable name
  };

  const handleDeleteJob = async (jobId) => {
    try {
      if (window.confirm('Are you sure you want to delete this job?')) {
        await deleteDoc(doc(db, 'jobs', jobId));
        showToast('Job deleted successfully');
        fetchJobs(); // Refresh the jobs list
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      showToast('Failed to delete job', 'error');
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const jobsRef = collection(db, 'jobs');
      const jobsSnapshot = await getDocs(jobsRef);
      const jobsData = [];

      for (const jobDoc of jobsSnapshot.docs) {
        const jobData = jobDoc.data();
        const applicationsRef = collection(db, 'applications');
        const applicationsQuery = query(applicationsRef, where('job_id', '==', jobDoc.id));
        const applicationsSnapshot = await getDocs(applicationsQuery);
        
        const applications = [];
        for (const appDoc of applicationsSnapshot.docs) {
          const appData = appDoc.data();
          const studentDoc = await getDoc(doc(db, 'students', appData.student_id));
          const studentData = studentDoc.exists() ? studentDoc.data() : {};
          
          applications.push({
            id: appDoc.id,
            ...appData,
            student: {
              name: studentData.name || 'N/A',
              rollNumber: studentData.rollNumber || 'N/A',
              department: studentData.department || 'N/A',
            }
          });
        }
  
        // Properly handle the Firestore timestamp
        let deadlineDate = null;
        let deadlineFormatted = 'No Deadline';
        
        if (jobData.deadline) {
          // Check if it's a Firestore timestamp
          if (jobData.deadline.toDate && typeof jobData.deadline.toDate === 'function') {
            deadlineDate = jobData.deadline.toDate();
            deadlineFormatted = deadlineDate.toLocaleDateString();
          } 
          // Check if it's already a Date object
          else if (jobData.deadline instanceof Date) {
            deadlineDate = jobData.deadline;
            deadlineFormatted = deadlineDate.toLocaleDateString();
          }
          // If it's a string that can be parsed as a date
          else if (typeof jobData.deadline === 'string') {
            const parsedDate = new Date(jobData.deadline);
            if (!isNaN(parsedDate.getTime())) {
              deadlineDate = parsedDate;
              deadlineFormatted = deadlineDate.toLocaleDateString();
            }
          }
        }

        jobsData.push({
          id: jobDoc.id,
          ...jobData,
          deadlineDate: deadlineDate, // Store the actual Date object for sorting
          deadline: deadlineFormatted, // Store the formatted string for display
          stats: {
            total: applications.length,
            shortlisted: applications.filter(app => app.status === 'shortlisted').length,
            rejected: applications.filter(app => app.status === 'rejected').length,
            pending: applications.filter(app => ['pending', 'under_review'].includes(app.status)).length
          },
          applications: applications
        });
      }

      setJobs(jobsData);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to fetch jobs data');
    } finally {
      setLoading(false);
    }
  };

  const sortedJobs = [...jobs].sort((a, b) => {
    switch (sortBy) {
      case 'deadline':
        // Use the Date objects directly for comparison
        // If no deadline, put it at the end
        if (!a.deadlineDate) return 1;
        if (!b.deadlineDate) return -1;
        return a.deadlineDate - b.deadlineDate;
      case 'applicants':
        return b.stats.total - a.stats.total;
      case 'shortlisted':
        return b.stats.shortlisted - a.stats.shortlisted;
      default:
        return 0;
    }
  });


  return (
    <div className="p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <ToastContainer />
      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <LoadingSpinner size="large" text="Loading jobs..." />
        </div>
      ) : sortedJobs.length === 0 ? (
        <NoData text="No jobs found." />
      ) : (
        <div className="space-y-0 ">
          {/* Header Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Job Applications Dashboard
                </h1>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg shadow-sm 
                  hover:border-blue-400 focus:border-blue-500 focus:ring focus:ring-blue-200 
                  transition-all duration-200 cursor-pointer"
              >
                <option value="deadline">Sort by Deadline</option>
                <option value="applicants">Sort by Applicants</option>
                <option value="shortlisted">Sort by Shortlisted</option>
              </select>
            </div>
          </div>

          {/* Chat Modal */}
          {showChatModal && selectedJobId && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg w-[70%] h-[88%] overflow-hidden">
                <div className="p-2 flex justify-between items-center border-b">
                  <h2 className="text-lg font-semibold">Chat with Applicants</h2>
                  <button 
                    onClick={() => setShowChatModal(false)}
                    className="p-1 rounded hover:bg-gray-200"
                  >
                    ✕
                  </button>
                </div>
                <AdminChat 
                  jobId={selectedJobId} 
                  onClose={() => setShowChatModal(false)} 
                />
              </div>
            </div>
          )}

          {/* Table Section */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-teal-100">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Position</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600 uppercase tracking-wider">Applications Overview</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Deadline</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedJobs.map(job => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="text-lg font-semibold text-gray-900">{job.company}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600">{job.position}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-4">
                          <div className="text-center">
                            <div className="text-lg font-semibold">{job.stats.total}</div>
                            <div className="text-sm text-gray-500">Total</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-green-600">{job.stats.shortlisted}</div>
                            <div className="text-sm text-gray-500">Shortlisted</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-red-600">{job.stats.rejected}</div>
                            <div className="text-sm text-gray-500">Rejected</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-yellow-600">{job.stats.pending}</div>
                            <div className="text-sm text-gray-500">Pending</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {job.deadline}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleViewApplications(job.id)}
                            className="px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                          >
                            👁 View
                          </button>
                          <button
                            onClick={() => handleChatClick(job.id)}
                            className="px-3 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100"
                          >
                            💬 Chat
                          </button>
                          <button
                            onClick={() => handleDeleteJob(job.id)}
                            className="px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100"
                          >
                            🗑 Delete
                          </button>
                        </div>
                        {shareLinks[job.id] && (
                          <div className="absolute mt-2 p-2 bg-white rounded shadow-lg border border-gray-200">
                            <input
                              type="text"
                              value={shareLinks[job.id]}
                              readOnly
                              className="w-full p-1 border rounded text-sm"
                            />
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(shareLinks[job.id]);
                                toast.success('Link copied!');
                              }}
                              className="mt-1 w-full px-2 py-1 bg-blue-50 text-blue-600 rounded text-sm hover:bg-blue-100"
                            >
                              Copy Link
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageApplications;
