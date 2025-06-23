import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from 'xlsx';

const CompanyView = () => {
  const { shareId } = useParams();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [job, setJob] = useState(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [selectedApplications, setSelectedApplications] = useState([]);
  const [filters, setFilters] = useState({
    department: 'all',
    cgpa: '',
    searchTerm: ''
  });

  const statusConfig = {
    pending: { label: '⏳ Under Review', class: 'bg-gray-100 text-gray-800', icon: '⏳' },
    shortlisted: { label: '✅ Shortlisted', class: 'bg-green-100 text-green-800', icon: '✅' },
    waitlisted: { label: '🟡 On Hold / Waitlisted', class: 'bg-yellow-100 text-yellow-800', icon: '🟡' },
    interview_scheduled: { label: '📅 Interview Scheduled', class: 'bg-blue-100 text-blue-800', icon: '📅' },
    selected: { label: '🌟 Selected', class: 'bg-purple-100 text-purple-800', icon: '🌟' },
    rejected: { label: '⚠️ Rejected', class: 'bg-red-100 text-red-800', icon: '⚠️' }
  };

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        // First get the share document
        const shareRef = doc(db, 'companyShares', shareId);
        const shareDoc = await getDoc(shareRef);

        if (!shareDoc.exists()) {
          throw new Error('Invalid share link');
        }

        const shareData = shareDoc.data();
        
        // Check if share link has expired
        if (shareData.expiresAt.toDate() < new Date()) {
          throw new Error('Share link has expired');
        }

        // Get job details
        const jobRef = doc(db, 'jobs', shareData.jobId);
        const jobDoc = await getDoc(jobRef);
        if (jobDoc.exists()) {
          setJob({ id: jobDoc.id, ...jobDoc.data() });
        }

        // Get applications for the specific job
        const applicationsRef = collection(db, 'applications');
        const applicationsQuery = query(
          applicationsRef,
          where('job_id', '==', shareData.jobId)
        );

        const applicationsSnapshot = await getDocs(applicationsQuery);
        const applicationsData = [];

        // Fetch student details for each application
        for (const appDoc of applicationsSnapshot.docs) {
          const appData = appDoc.data();
          const studentDoc = await getDoc(doc(db, 'students', appData.student_id));
          const studentData = studentDoc.exists() ? studentDoc.data() : {};

          applicationsData.push({
            id: appDoc.id,
            ...appData,
            student: {
              id: studentDoc.id,
              name: studentData.name || 'N/A',
              rollNumber: studentData.rollNumber || 'N/A',
              department: studentData.department || 'N/A',
              cgpa: studentData.cgpa || '0',
              email: studentData.email || 'N/A',
              phone: studentData.phone || 'N/A',
              currentArrears: studentData.currentArrears || '0',
              historyArrears: studentData.historyArrears || '0',
              skills: Array.isArray(studentData.skills) ? studentData.skills : []
            }
          });
        }

        setApplications(applicationsData);
        setFilteredApplications(applicationsData);
      } catch (error) {
        console.error('Error:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [shareId]);

  // Filter applications
  useEffect(() => {
    if (!applications.length) return;
    
    let filtered = [...applications];
    
    if (filters.department !== 'all') {
      filtered = filtered.filter(app => app.student.department === filters.department);
    }
    
    if (filters.cgpa) {
      filtered = filtered.filter(app => parseFloat(app.student.cgpa) >= parseFloat(filters.cgpa));
    }
    
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(app => 
        app.student.name.toLowerCase().includes(term) || 
        app.student.rollNumber.toLowerCase().includes(term)
      );
    }
    
    setFilteredApplications(filtered);
  }, [applications, filters]);

  // Export to Excel function
  const exportToExcel = () => {
    if (selectedApplications.length === 0) {
      toast.warning("No applications selected for export");
      return;
    }
    
    const selectedData = applications.filter(app => selectedApplications.includes(app.id));
    const excelData = selectedData.map(app => ({
      'Name': app.student.name,
      'Roll Number': app.student.rollNumber,
      'Department': app.student.department,
      'CGPA': app.student.cgpa,
      'Email': app.student.email,
      'Phone': app.student.phone,
      'Status': statusConfig[app.status]?.label || 'Under Review'
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Applications");
    
    XLSX.writeFile(workbook, `${job?.company}_Applications.xlsx`);
    toast.success("Excel file exported successfully");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 text-center">
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <ToastContainer />
      <div className="space-y-8">
        {/* Header Section with Job Details */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {job?.company} <span className="text-blue-600">- {job?.position}</span>
              </h1>
              <p className="text-lg text-gray-600">
                Application Deadline: {job?.deadline && new Date(job.deadline).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowJobDetails(!showJobDetails)}
                className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
              >
                {showJobDetails ? '🔼 Hide Details' : '🔽 Show Details'}
              </button>
              <button
                onClick={exportToExcel}
                className="px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
                disabled={selectedApplications.length === 0}
              >
                📊 Export to Excel
              </button>
            </div>
          </div>

          {/* Job Details Section */}
          {showJobDetails && (
            <div className="mt-6 bg-gray-50 rounded-lg p-6 border border-gray-200">
              {/* Same job details section as in JobApplications.js */}
              {/* ... Copy the job details section from JobApplications.js ... */}
            </div>
          )}
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={filters.department}
              onChange={(e) => setFilters({...filters, department: e.target.value})}
              className="p-2.5 border border-gray-300 rounded-lg"
            >
              <option value="all">All Departments</option>
              <option value="CSE">CSE</option>
              <option value="IT">IT</option>
              <option value="ECE">ECE</option>
            </select>

            <input
              type="number"
              placeholder="Min CGPA"
              value={filters.cgpa}
              onChange={(e) => setFilters({...filters, cgpa: e.target.value})}
              className="p-2.5 border border-gray-300 rounded-lg"
            />

            <input
              type="text"
              placeholder="🔍 Search by name/roll number"
              value={filters.searchTerm}
              onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
              className="p-2.5 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  <input
                    type="checkbox"
                    checked={selectedApplications.length === filteredApplications.length}
                    onChange={(e) => {
                      setSelectedApplications(
                        e.target.checked ? filteredApplications.map(app => app.id) : []
                      );
                    }}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Student Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  CGPA
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredApplications.map(application => (
                <tr key={application.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedApplications.includes(application.id)}
                      onChange={(e) => {
                        setSelectedApplications(
                          e.target.checked
                            ? [...selectedApplications, application.id]
                            : selectedApplications.filter(id => id !== application.id)
                        );
                      }}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{application.student.name}</div>
                      <div className="text-sm text-gray-500">{application.student.rollNumber}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{application.student.department}</td>
                  <td className="px-6 py-4">{application.student.cgpa}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${statusConfig[application.status]?.class}`}>
                      {statusConfig[application.status]?.label || 'Under Review'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CompanyView;