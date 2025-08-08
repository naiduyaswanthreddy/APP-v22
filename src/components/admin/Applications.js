import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, where, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from 'react-router-dom';
import Loader from '../../loading'; // Add this import at the top


// Add this import at the top of the file

const Coding = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('deadline');

  const handleViewApplications = (jobId) => {
    if (jobId) {
      navigate(`/admin/job-applications/${jobId}`);
    } else {
      toast.error('Invalid job ID');
    }
  };

  const handleDeleteJob = async (jobId) => {
    try {
      if (window.confirm('Are you sure you want to delete this job?')) {
        await deleteDoc(doc(db, 'jobs', jobId));
        toast.success('Job deleted successfully');
        fetchJobs(); // Refresh the jobs list
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error('Failed to delete job');
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
        // Get applications count for this job
        const applicationsRef = collection(db, 'applications');
        const applicationsQuery = query(applicationsRef, where('job_id', '==', jobDoc.id));
        const applicationsSnapshot = await getDocs(applicationsQuery);
        
        const applications = applicationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        jobsData.push({
          id: jobDoc.id,
          ...jobData,
          stats: {
            total: applications.length,
            shortlisted: applications.filter(app => app.status === 'shortlisted').length,
            rejected: applications.filter(app => app.status === 'rejected').length,
            pending: applications.filter(app => ['pending', 'under_review'].includes(app.status)).length
          }
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
        return new Date(a.deadline) - new Date(b.deadline);
      case 'applicants':
        return b.stats.total - a.stats.total;
      case 'shortlisted':
        return b.stats.shortlisted - a.stats.shortlisted;
      default:
        return 0;
    }
  });


  return (
    <div className="p-6">
            <div className="fixed top-0 left-[20%] right-0 bottom-0 bg-gray-200 bg-opacity-10 flex items-center justify-center z-50">
        <Loader />
        </div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Job Applications Management</h1>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="deadline">Sort by Deadline</option>
          <option value="applicants">Sort by Applicants</option>
          <option value="shortlisted">Sort by Shortlisted</option>
        </select>
      </div>

      {loading ? (
              <div className="fixed top-0 left-[20%] right-0 bottom-0 bg-gray-200 bg-opacity-10 flex items-center justify-center z-50">
              <Loader />
              </div>
      ) : sortedJobs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow-sm">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No jobs found</h3>
          <p className="text-gray-500 mb-6">There are currently no jobs available in the system</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applicants
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shortlisted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rejected
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deadline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedJobs.map(job => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{job.position}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{job.company}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{job.stats.total}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-green-600">{job.stats.shortlisted}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-red-600">{job.stats.rejected}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(job.deadline).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                    <button
                      onClick={() => handleViewApplications(job.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      👁 View Applications
                    </button>
                    <button
                      onClick={() => handleDeleteJob(job.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Coding;