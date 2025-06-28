import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore'; // Added updateDoc
import { db, auth } from '../../firebase';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createStatusUpdateNotification } from '../../utils/notificationHelpers';

const STATUS_COLORS = {
  'pending': 'bg-yellow-100 text-yellow-800',
  'under_review': 'bg-blue-100 text-blue-800',
  'shortlisted': 'bg-green-100 text-green-800',
  'not_shortlisted': 'bg-red-100 text-red-800',
  'waitlisted': 'bg-orange-100 text-orange-800',
  'interview_scheduled': 'bg-purple-100 text-purple-800',
  'selected': 'bg-emerald-100 text-emerald-800',
  'rejected': 'bg-red-100 text-red-800'
};

const STATUS_LABELS = {
  'pending': '⏳ Applied',
  'under_review': '⏳ Under Review',
  'shortlisted': '✅ Shortlisted',
  'not_shortlisted': '❌ Not Shortlisted',
  'waitlisted': '🟡 Waitlisted',
  'interview_scheduled': '📅 Interview Scheduled',
  'selected': '🎉 Selected',
  'rejected': '⚠️ Rejected'
};

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // First, get the student's skills
      const studentDoc = await getDoc(doc(db, 'student_academics', user.uid));
      const studentSkills = studentDoc.data()?.skills || [];

      const applicationsRef = collection(db, 'applications');
      const q = query(applicationsRef, where('student_id', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      const applicationsData = [];
      for (const docSnapshot of querySnapshot.docs) {
        const applicationData = docSnapshot.data();
        const jobRef = doc(db, 'jobs', applicationData.job_id);
        const jobDoc = await getDoc(jobRef);
        
        if (jobDoc.exists()) {
          const jobData = jobDoc.data();
          // Calculate skill match percentage
          const requiredSkills = jobData.eligibilityCriteria?.skills || [];
          const matchedSkills = requiredSkills.filter(skill => 
            studentSkills.map(s => s.toLowerCase()).includes(skill.toLowerCase())
          );
          const skillMatch = requiredSkills.length > 0 
            ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
            : 0;

          applicationsData.push({
            id: docSnapshot.id,
            ...applicationData,
            job: jobData,
            skillMatch: skillMatch
          });
        }
      }

      console.log('Fetched applications with skill match:', applicationsData);
      setApplications(applicationsData);
      
      // Check for any status updates since last fetch
      const lastFetchTime = localStorage.getItem('lastApplicationsFetchTime');
      if (lastFetchTime) {
        const lastFetchDate = new Date(parseInt(lastFetchTime, 10));
        applicationsData.forEach(app => {
          // If the status was updated after the last fetch, create a notification
          if (app.statusUpdatedAt && app.statusUpdatedAt.toDate() > lastFetchDate) {
            createStatusUpdateNotification(user.uid, app);
          }
        });
      }
      
      // Update the last fetch time
      localStorage.setItem('lastApplicationsFetchTime', Date.now().toString());
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const getStatusProgressPoints = (status) => {
    const stages = ['pending', 'under_review', 'shortlisted', 'interview_scheduled', 'selected'];
    const currentIndex = stages.indexOf(status);
    return stages.map((stage, index) => ({
      completed: index <= currentIndex,
      stageName: stage, // Add stage name for tooltip
    }));
  };

  const getStatusProgress = (status) => {
    const stages = ['pending', 'under_review', 'shortlisted', 'interview_scheduled', 'selected'];
    const currentIndex = stages.indexOf(status);
    // Calculate width to stop at the center of the current dot
    return (currentIndex / (stages.length - 1)) * 100;
  };

  const filteredApplications = applications
    .filter(app => filter === 'all' ? true : app.status === filter)
    .sort((a, b) => {
      if (sortBy === 'newest') return b.applied_at - a.applied_at;
      if (sortBy === 'oldest') return a.applied_at - b.applied_at;
      if (sortBy === 'company') return a.job.company.localeCompare(b.job.company);
      return 0;
    });

  const handleWithdraw = async (applicationId) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const applicationRef = doc(db, 'applications', applicationId);
        await updateDoc(applicationRef, {
          status: 'withdrawn'
        });
        setApplications(applications.map(app => 
          app.id === applicationId ? { ...app, status: 'withdrawn' } : app
        ));
        toast.success("Application withdrawn successfully!");
      }
    } catch (error) {
      toast.error("Error withdrawing application!");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <ToastContainer />
      
      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select 
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="all">All Applications</option>
          {Object.keys(STATUS_LABELS).map(status => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>

        <select 
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="company">Company Name</option>
        </select>
      </div>

      {/* Applications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredApplications.map(application => (
          <div key={application.id} className="bg-white rounded-lg shadow-sm p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-medium">{application.job.position}</h3>
                <p className="text-gray-600">{application.job.company}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm ${STATUS_COLORS[application.status]}`}>
                {STATUS_LABELS[application.status]}
              </div>
            </div>

            {/* Status Progress Bar with Dots */}
            <div className="mb-4 relative">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-pink-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${getStatusProgress(application.status)}%` }}
                ></div>
              </div>
              <div className="absolute top-1/2 transform -translate-y-1/2 left-0 w-full flex justify-between items-center">
                {getStatusProgressPoints(application.status).map((point, index) => (
                  <div
                    key={index}
                    className={`w-4 h-4 rounded-full ${point.completed ? 'bg-pink-500' : 'bg-gray-300'}`}
                    title={STATUS_LABELS[point.stageName]} // Use title attribute for tooltip
                  ></div>
                ))}
              </div>
            </div>

            {/* Application Details */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Applied on</p>
                <p className="font-medium">
                  {application.applied_at?.toDate().toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Application Deadline</p>
                <p className="font-medium">
                  {new Date(application.job.deadline).toLocaleDateString()}
                </p>
              </div>
            </div>

        

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
              {application.job.jdFile && (
                <button className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded">
                  📄 Download JD
                </button>
              )}
              
              {application.status === 'interview_scheduled' && (
                <button className="px-4 py-2 text-purple-600 hover:bg-purple-50 rounded">
                  📅 Add to Calendar
                </button>
              )}

              {['pending', 'under_review'].includes(application.status) && (
                <button 
                  onClick={() => handleWithdraw(application.id)} // Add onClick handler
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded"
                >
                  ❌ Withdraw
                </button>
              )}
            </div>

            {/* Admin Notes */}
            {application.adminNotes && (
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <p className="text-sm font-medium text-blue-800">Admin Note:</p>
                <p className="text-sm text-blue-700">{application.adminNotes}</p>
              </div>
            )}
          </div>
        ))}

        {filteredApplications.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg col-span-2">
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3 className="mt-4 text-xl font-medium text-gray-700">
              No applications found
            </h3>
            <p className="mt-2 text-gray-500">
              {filter !== 'all' ? 'Try changing your filter settings' : 'You haven\'t applied to any jobs yet'}
            </p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                View All Applications
              </button>
            )}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 col-span-2">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading applications...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Applications;