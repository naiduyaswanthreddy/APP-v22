import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../../firebase';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from 'xlsx';
import ApplicationsTable from './ApplicationsTable';
import JobDetailsEdit from './JobDetailsEdit';
import StudentDetailsModal from './StudentDetailsModal';

const JobApplications = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  
  // State declarations
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  
  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdownId && !event.target.closest('.dropdown-container')) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdownId]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [selectedApplications, setSelectedApplications] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editedJob, setEditedJob] = useState(null);
  const [filters, setFilters] = useState({
    eligibility: 'all',
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

  // Define fetchJobAndApplications before using it in useEffect
  const fetchJobAndApplications = useCallback(async () => {
    setLoading(true);
    try {
      const jobRef = doc(db, "jobs", jobId);
      const jobSnap = await getDoc(jobRef);
      
      if (jobSnap.exists()) {
        // Add date validation helper function
        const validateDate = (dateValue) => {
          if (!dateValue) return null;
          const date = new Date(dateValue);
          return isNaN(date.getTime()) ? null : date;
        };

        const jobData = { 
          id: jobSnap.id, 
          ...jobSnap.data(),
          // Map all form fields with their possible alternative names
          company: jobSnap.data().company || jobSnap.data().companyName || '',
          position: jobSnap.data().position || '',
          description: jobSnap.data().description || jobSnap.data().jobDescription || '',
          location: jobSnap.data().location || jobSnap.data().jobLocation || '',
          salary: jobSnap.data().salary || jobSnap.data().salaryStipend || '',
          // Validate dates before assigning
          deadline: validateDate(jobSnap.data().deadline || jobSnap.data().applicationDeadline),
          interviewDateTime: validateDate(jobSnap.data().interviewDateTime || jobSnap.data().interviewDate),
          genderPreference: jobSnap.data().genderPreference || 'Any',
          jobType: jobSnap.data().jobType || (Array.isArray(jobSnap.data().jobTypes) ? jobSnap.data().jobTypes[0] : '') || '',
          experience: jobSnap.data().experience || jobSnap.data().requiredExperience || '',
          instructions: jobSnap.data().instructions || jobSnap.data().applicantInstructions || '',
          // Academic requirements
          minCGPA: jobSnap.data().minCGPA || jobSnap.data().eligibilityCriteria?.cgpa || '',
          maxCurrentArrears: jobSnap.data().maxCurrentArrears || jobSnap.data().eligibilityCriteria?.currentArrears || '',
          maxHistoryArrears: jobSnap.data().maxHistoryArrears || jobSnap.data().eligibilityCriteria?.historyArrears || '',
          // Arrays with fallbacks
          eligibleBatch: Array.isArray(jobSnap.data().eligibleBatch) ? jobSnap.data().eligibleBatch : 
                        (jobSnap.data().eligibilityCriteria?.batch ? [jobSnap.data().eligibilityCriteria.batch] : []),
          eligibleDepartments: Array.isArray(jobSnap.data().eligibleDepartments) ? jobSnap.data().eligibleDepartments :
                              (Array.isArray(jobSnap.data().eligibilityCriteria?.department) ? jobSnap.data().eligibilityCriteria.department : []),
          skills: Array.isArray(jobSnap.data().skills) ? jobSnap.data().skills :
                 (Array.isArray(jobSnap.data().requiredSkills) ? jobSnap.data().requiredSkills : []),
          rounds: Array.isArray(jobSnap.data().rounds) ? jobSnap.data().rounds :
                 (Array.isArray(jobSnap.data().hiringWorkflow) ? jobSnap.data().hiringWorkflow : []),
          screeningQuestions: Array.isArray(jobSnap.data().screeningQuestions) ? jobSnap.data().screeningQuestions : [],
          attachments: Array.isArray(jobSnap.data().attachments) ? jobSnap.data().attachments :
                      (Array.isArray(jobSnap.data().fileAttachments) ? jobSnap.data().fileAttachments : [])
        };
        setJob(jobData);
        setEditedJob(jobData); // This will ensure all fields are available in the edit modal
        
        // Fetch applications for this job
        const applicationsRef = collection(db, "applications");
        // Try both field names to ensure we find applications
        const q1 = query(applicationsRef, where("jobId", "==", jobId));
        const q2 = query(applicationsRef, where("job_id", "==", jobId));
        
        const querySnapshot1 = await getDocs(q1);
        const querySnapshot2 = await getDocs(q2);
        
        // Combine results from both queries
        const combinedDocs = [...querySnapshot1.docs, ...querySnapshot2.docs];
        // Remove duplicates if any (in case an application has both fields)
        const uniqueDocs = combinedDocs.filter((doc, index, self) => 
          index === self.findIndex((d) => d.id === doc.id)
        );
        
        // Fetch all applications and their corresponding student data
        const applicationsData = await Promise.all(
          uniqueDocs.map(async (appDoc) => {
            const appData = { id: appDoc.id, ...appDoc.data() };
            // Fetch student data from students collection
            const studentRef = doc(db, "students", appData.student_id);
            const studentSnap = await getDoc(studentRef);
            
            // In the fetchJobAndApplications function, update the student data handling
            // Around line 57-80
            if (studentSnap.exists()) {
              const studentData = studentSnap.data();
              appData.student = {
                id: studentSnap.id,
                ...studentData,
                // Ensure all required fields have default values
                name: studentData.name || 'N/A',
                rollNumber: studentData.rollNumber || 'N/A',
                department: studentData.department || 'N/A',
                cgpa: studentData.cgpa || '0',
                email: studentData.email || 'N/A',
                phone: studentData.phone || 'N/A',
                currentArrears: studentData.currentArrears || '0',
                historyArrears: studentData.historyArrears || '0',
                skills: Array.isArray(studentData.skills) ? studentData.skills : [] // Ensure skills is always an array
              };
            } else {
              console.warn(`Student data not found for ID: ${appData.student_id}`);
              appData.student = {
                id: appData.student_id,
                name: 'N/A',
                rollNumber: 'N/A',
                department: 'N/A',
                cgpa: '0',
                email: 'N/A',
                phone: 'N/A',
                currentArrears: '0',
                historyArrears: '0',
                skills: [] // Ensure skills is always an array
              };
            }
            return appData;
          })
        );
        
        setApplications(applicationsData);
        setFilteredApplications(applicationsData);
      } else {
        toast.error("Job not found!");
        navigate('/admin/manage-applications');
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Error loading job data");
    } finally {
      setLoading(false);
    }
  }, [jobId, navigate]);

  // Fetch data on mount
  useEffect(() => {
    fetchJobAndApplications();
  }, [fetchJobAndApplications]);

  // Filter applications
  useEffect(() => {
    if (!job) return;
    
    let filtered = [...applications];
    
    if (filters.eligibility !== 'all') {
      const isEligible = filters.eligibility === 'eligible';
      filtered = filtered.filter(app => {
        const student = app.student;
        const meetsGPA = !job.minCGPA || parseFloat(student.cgpa) >= parseFloat(job.minCGPA);
        const meetsCurrentArrears = !job.maxCurrentArrears || parseInt(student.currentArrears) <= parseInt(job.maxCurrentArrears);
        const meetsHistoryArrears = !job.maxHistoryArrears || parseInt(student.historyArrears) <= parseInt(job.maxHistoryArrears);
        return isEligible ? (meetsGPA && meetsCurrentArrears && meetsHistoryArrears) : !(meetsGPA && meetsCurrentArrears && meetsHistoryArrears);
      });
    }
    
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
  }, [applications, filters, job]);

  // Update the handleStudentClick function to ensure skills is always an array
  // Update the handleStudentClick function to fetch student's applications
  const handleStudentClick = async (student) => {
    // Make sure skills is always an array before setting the selected student
    const studentWithValidSkills = {
      ...student,
      skills: Array.isArray(student.skills) ? student.skills : []
    };
    
    try {
      // Fetch all applications for this student
      const applicationsRef = collection(db, "applications");
      const q = query(applicationsRef, where("student_id", "==", student.id));
      const querySnapshot = await getDocs(q);
      
      const studentApplications = [];
      
      // Process each application and get job details
      await Promise.all(querySnapshot.docs.map(async (appDoc) => {
        const appData = { id: appDoc.id, ...appDoc.data() };
        
        // Fetch job details for this application
        try {
          const jobId = appData.jobId || appData.job_id;
          if (jobId) {
            const jobRef = doc(db, "jobs", jobId);
            const jobSnap = await getDoc(jobRef);
            
            if (jobSnap.exists()) {
              appData.job = {
                id: jobSnap.id,
                ...jobSnap.data()
              };
            }
          }
        } catch (error) {
          console.error("Error fetching job details:", error);
        }
        
        studentApplications.push(appData);
      }));
      
      // Add applications data and analytics to student object
      studentWithValidSkills.applications = studentApplications;
      
      // Calculate analytics
      const statusCounts = studentApplications.reduce((acc, app) => {
        const status = app.status || 'pending';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      
      studentWithValidSkills.analytics = {
        totalApplications: studentApplications.length,
        statusCounts
      };
      
      setSelectedStudent(studentWithValidSkills);
    } catch (error) {
      console.error("Error fetching student applications:", error);
      toast.error("Failed to load student application data");
      setSelectedStudent(studentWithValidSkills);
    }
  };

  // REMOVE THIS DUPLICATE FUNCTION - Delete lines 175-243
  
  // Function to delete job
  const handleDeleteJob = async () => {
    try {
      await deleteDoc(doc(db, "jobs", jobId));
      toast.success("Job deleted successfully");
      navigate('/admin/manage-applications');
    } catch (error) {
      console.error("Error deleting job:", error);
      toast.error("Failed to delete job");
    }
  };
  
  // Function to update application status with validation
  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
      // Validate the new status
      if (!Object.keys(statusConfig).includes(newStatus)) {
        toast.error("Invalid status value");
        return;
      }

      // Find the application to update
      const applicationToUpdate = applications.find(app => app.id === applicationId);
      if (!applicationToUpdate) {
        toast.error("Application not found");
        return;
      }

      const applicationRef = doc(db, "applications", applicationId);
      await updateDoc(applicationRef, {
        status: newStatus,
        updatedAt: new Date(),
        lastModifiedBy: 'admin', // Track who made the change
        previousStatus: applicationToUpdate.status, // Track previous status
        // {{ edit_1 }}
        // Add companyName when updating status
        companyName: job?.company // Use the company name from the job details
        // {{ end_edit_1 }}
      });

      // Update local state
      const updatedApplications = applications.map(app =>
        app.id === applicationId ? {
          ...app,
          status: newStatus,
          updatedAt: new Date(),
          lastModifiedBy: 'admin',
          previousStatus: app.status,
          // {{ edit_2 }}
          // Also update companyName in local state
          companyName: job?.company
          // {{ end_edit_2 }}
        } : app
      );
      setApplications(updatedApplications);
      setFilteredApplications(updatedApplications);

      setOpenDropdownId(null); // Close dropdown
      toast.success(`Application status updated from ${applicationToUpdate.status} to ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(`Failed to update application status: ${error.message}`);
    }
  };

  // Function to handle bulk actions with validation
  const handleBulkAction = async (newStatus) => {
    if (selectedApplications.length === 0) {
      toast.warning("No applications selected");
      return;
    }

    // Validate the new status
    if (!Object.keys(statusConfig).includes(newStatus)) {
      toast.error("Invalid status value");
      return;
    }

    try {
      const batch = writeBatch(db);
      const timestamp = new Date();

      // Get current status of all selected applications for tracking changes
      const selectedApps = applications.filter(app => selectedApplications.includes(app.id));

      selectedApps.forEach(app => {
        const appRef = doc(db, "applications", app.id);
        batch.update(appRef, {
          status: newStatus,
          updatedAt: timestamp,
          lastModifiedBy: 'admin',
          previousStatus: app.status,
          bulkUpdateId: timestamp.getTime(), // To track which updates were part of the same bulk action
          // {{ edit_3 }}
          // Add companyName when updating status in bulk
          companyName: job?.company // Use the company name from the job details
          // {{ end_edit_3 }}
        });
      });

      await batch.commit();

      // Update local state with full change tracking
      const updatedApplications = applications.map(app =>
        selectedApplications.includes(app.id) ? {
          ...app,
          status: newStatus,
          updatedAt: timestamp,
          lastModifiedBy: 'admin',
          previousStatus: app.status,
          bulkUpdateId: timestamp.getTime(),
          // {{ edit_4 }}
          // Also update companyName in local state for bulk updates
          companyName: job?.company
          // {{ end_edit_4 }}
        } : app
      );
      setApplications(updatedApplications);
      setFilteredApplications(updatedApplications);

      const statusChanges = selectedApps.map(app => `${app.student.name} (${app.status} → ${newStatus})`).join('\n');
      toast.success(
        `Successfully updated ${selectedApplications.length} applications\n${statusChanges}`,
        { autoClose: 5000 } // Give users more time to read the detailed message
      );
      setSelectedApplications([]); // Clear selection
    } catch (error) {
      console.error("Error in bulk update:", error);
      toast.error(`Failed to update applications: ${error.message}`);
    }
  };

  // Function to export data to Excel
  const exportToExcel = () => {
    if (selectedApplications.length === 0) {
      toast.warning("No applications selected for export");
      return;
    }
    
    // Filter selected applications
    const selectedData = applications.filter(app => selectedApplications.includes(app.id));
    
    // Format data for Excel
    const excelData = selectedData.map(app => ({
      'Name': app.student.name,
      'Roll Number': app.student.rollNumber,
      'Department': app.student.department,
      'CGPA': app.student.cgpa,
      'Email': app.student.email,
      'Phone': app.student.phone,
      'Status': statusConfig[app.status]?.label || 'Under Review'
    }));
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Applications");
    
    // Generate Excel file
    XLSX.writeFile(workbook, `${job?.company}_${job?.position}_Applications.xlsx`);
    toast.success("Excel file exported successfully");
  };
  
  // Function to export data to PDF
  const exportToPDF = () => {
    // This is a placeholder - you would need to implement PDF export
    // using a library like jsPDF or react-pdf
    toast.info("PDF export functionality will be implemented soon");
  };

  return (
      <div className="p-8 max-w-7xl mx-auto">
        <ToastContainer />

        {/* Back Button */}
        <div className="flex items-center -mt-6 mb-2">
          <button onClick={() => navigate('/admin/manage-applications')} className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 mr-4">
            ← Back to All Jobs
          </button>
        </div>

        {/* Main Content */}
        <div className="space-y-8"> {/* Remove overflow-y-auto and height style */}
        {/* Header Section with Job Details */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  {job?.company} <span className="text-blue-600 text-lg">Position: {job?.position}</span>
                </h1>
                <p className="text-lg text-gray-600">
                  <span className="text-blue-600">Deadline: {job?.deadline && new Date(job.deadline).toLocaleDateString()}</span>
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowJobDetails(!showJobDetails)}
                  className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors duration-200 flex items-center gap-2"
                >
                  {showJobDetails ? '🔼 Hide Details' : '🔽 Show Details'}
                </button>
                <button
                  onClick={() => {
                    setEditMode(true);
                    setEditedJob(job);
                  }}
                  className="px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors duration-200 flex items-center gap-2"
                >
                  Edit Job
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this job?')) {
                      handleDeleteJob();
                    }
                  }}
                  className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors duration-200 flex items-center gap-2"
                >
                  Delete Job
                </button>
              </div>
            </div>

            {/* Enhanced Job Details Section */}
            {showJobDetails && (
              <div className="mt-6 bg-gray-50 rounded-lg p-6 border border-gray-200 text-gray-700 space-y-6">
                {/* Basic Information */}
                <div>
                  <h4 className="font-semibold text-lg mb-2 border-b border-gray-300 pb-1">Basic Information</h4>
                  <p><span className="font-semibold">Company Name:</span> {job?.company || job?.companyName || 'N/A'}</p>
                  <p><span className="font-semibold">Position:</span> {job?.position || 'N/A'}</p>
                  <p><span className="font-semibold">Job Description:</span> {job?.description || job?.jobDescription || 'N/A'}</p>
                </div>

                {/* Academic Requirements */}
                <div>
                  <h4 className="font-semibold text-lg mb-2 border-b border-gray-300 pb-1">Academic Requirements</h4>
                  <p><span className="font-semibold">Minimum CGPA:</span> {job?.minCGPA || job?.eligibilityCriteria?.cgpa || 'N/A'}</p>
                  <p><span className="font-semibold">Max Current Arrears:</span> {job?.maxCurrentArrears || job?.eligibilityCriteria?.currentArrears || 'N/A'}</p>
                  <p><span className="font-semibold">Max History Arrears:</span> {job?.maxHistoryArrears || job?.eligibilityCriteria?.historyArrears || 'N/A'}</p>
                  {/* {{ edit_1 }} */}
                  <p><span className="font-semibold">Eligible Batch:</span> {
                    Array.isArray(job?.eligibleBatch) && job.eligibleBatch.length > 0
                      ? job.eligibleBatch.join(', ')
                      : job?.eligibilityCriteria?.batch || 'N/A'
                  }</p>
                  <p><span className="font-semibold">Eligible Department:</span> {
                    Array.isArray(job?.eligibleDepartments) && job.eligibleDepartments.length > 0
                      ? job.eligibleDepartments.join(', ')
                      : Array.isArray(job?.eligibilityCriteria?.department) && job.eligibilityCriteria.department.length > 0
                        ? job.eligibilityCriteria.department.join(', ')
                        : 'N/A' // Based on provided structure, department is not present
                  }</p>
                  {/* {{ end_edit_1 }} */}
                </div>

                {/* Job Details */}
                <div>
                  <h4 className="font-semibold text-lg mb-2 border-b border-gray-300 pb-1">Job Details</h4>
                  <p><span className="font-semibold">Location:</span> {job?.location || job?.jobLocation || 'N/A'}</p>
                  <p><span className="font-semibold">Salary/Stipend:</span> {job?.salary || job?.salaryStipend || 'N/A'}</p>
                  <p><span className="font-semibold">Application Deadline:</span> {
                    job?.deadline
                      ? new Date(job.deadline).toLocaleString()
                      : job?.applicationDeadline
                        ? new Date(job.applicationDeadline).toLocaleString()
                        : 'N/A'
                  }</p>
                  <p><span className="font-semibold">Interview Date & Time:</span> {
                    job?.interviewDateTime
                      ? new Date(job.interviewDateTime).toLocaleString()
                      : job?.interviewDate
                        ? new Date(job.interviewDate).toLocaleString()
                        : 'N/A'
                  }</p>
                  <p><span className="font-semibold">Gender Preference:</span> {job?.genderPreference || 'Any'}</p>
                  {/* {{ edit_2 }} */}
                  <p><span className="font-semibold">Job Type:</span> {
                    Array.isArray(job?.jobTypes) && job.jobTypes.length > 0
                      ? job.jobTypes.join(', ')
                      : job?.jobType || 'N/A'
                  }</p>
                  {/* {{ end_edit_2 }} */}
                  <p><span className="font-semibold">Experience:</span> {job?.experience || job?.requiredExperience || 'N/A'}</p>
                </div>

                {/* Required Skills */}
                <div>
                  <h4 className="font-semibold text-lg mb-2 border-b border-gray-300 pb-1">Required Skills</h4>
                  {/* {{ edit_3 }} */}
                  {Array.isArray(job?.skills) && job.skills.length > 0 ? (
                    <ul className="list-disc list-inside">
                      {job.skills.map((skill, index) => <li key={index}>{skill}</li>)}
                    </ul>
                  ) : Array.isArray(job?.requiredSkills) && job.requiredSkills.length > 0 ? (
                     <ul className="list-disc list-inside">
                      {job.requiredSkills.map((skill, index) => <li key={index}>{skill}</li>)}
                    </ul>
                  ) : (
                    <p>N/A</p>
                  )}
                  {/* {{ end_edit_3 }} */}
                </div>

                {/* Instructions to Applicants */}
                <div>
                  <h4 className="font-semibold text-lg mb-2 border-b border-gray-300 pb-1">Instructions to Applicants</h4>
                  <p className="whitespace-pre-wrap">{job?.instructions || job?.applicantInstructions || 'N/A'}</p>
                </div>

                {/* Hiring Workflow Rounds */}
                <div>
                  <h4 className="font-semibold text-lg mb-2 border-b border-gray-300 pb-1">Hiring Workflow Rounds</h4>
                  {/* {{ edit_4 }} */}
                  {Array.isArray(job?.rounds) && job.rounds.length > 0 ? (
                    <ol className="list-decimal list-inside">
                      {job.rounds.map((round, index) => (
                        <li key={index}>{round.name || round.roundName || `Round ${index + 1}`}</li>
                      ))}
                    </ol>
                  ) : Array.isArray(job?.hiringWorkflow) && job.hiringWorkflow.length > 0 ? (
                     <ol className="list-decimal list-inside">
                      {job.hiringWorkflow.map((round, index) => (
                        <li key={index}>{round.name || round.roundName || `Round ${index + 1}`}</li>
                      ))}
                    </ol>
                  ) : (
                    <p>N/A</p>
                  )}
                  {/* {{ end_edit_4 }} */}
                </div>

                {/* Screening Questions */}
                <div>
                  <h4 className="font-semibold text-lg mb-2 border-b border-gray-300 pb-1">Screening Questions</h4>
                  {Array.isArray(job?.screeningQuestions) && job.screeningQuestions.length > 0 ? (
                    <ul className="list-disc list-inside">
                      {job.screeningQuestions.map((q, index) => (
                        <li key={index}>
                          <span className="font-medium">{q.question || `Question ${index + 1}`}</span> ({q.type || 'Text Input'})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>N/A</p>
                  )}
                </div>

                {/* File Attachments */}
                <div>
                  <h4 className="font-semibold text-lg mb-2 border-b border-gray-300 pb-1">File Attachments</h4>
                  {/* {{ edit_5 }} */}
                  {Array.isArray(job?.attachments) && job.attachments.length > 0 ? (
                    <ul className="list-disc list-inside">
                      {job.attachments.map((file, index) => (
                        <li key={index}>
                          <span className="font-medium">{file.name || `File ${index + 1}`}</span>:
                          <a href={file.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                            {file.link || 'N/A'}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : Array.isArray(job?.fileAttachments) && job.fileAttachments.length > 0 ? (
                     <ul className="list-disc list-inside">
                      {job.fileAttachments.map((file, index) => (
                        <li key={index}>
                          <span className="font-medium">{file.name || `File ${index + 1}`}</span>:
                          <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                            {file.url || 'N/A'}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>N/A</p>
                  )}
                  {/* {{ end_edit_5 }} */}
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Filters Section */}
          <div className="p-0 -mb-8">
            {/* Filter controls and bulk action buttons */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                value={filters.eligibility}
                onChange={(e) => setFilters({...filters, eligibility: e.target.value})}
                className="p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Candidates</option>
                <option value="eligible">Eligible</option>
                <option value="not_eligible">Not Eligible</option>
              </select>

              <select
                value={filters.department}
                onChange={(e) => setFilters({...filters, department: e.target.value})}
                className="p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

              <input
                type="text"
                placeholder="🔍 Search by name/roll number"
                value={filters.searchTerm}
                onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                className="p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {selectedApplications.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-3 justify-end">
                <div className="flex gap-3">
                  <button
                    onClick={exportToExcel}
                    className="px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors duration-200"
                  >
                    📊 Export to Excel
                  </button>
                  <button
                    onClick={exportToPDF}
                    className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors duration-200"
                  >
                    📑 Export to PDF
                  </button>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleBulkAction('shortlisted')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                  >
                    ✅ Shortlist ({selectedApplications.length})
                  </button>
                  <button
                    onClick={() => handleBulkAction('waitlisted')}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors duration-200"
                  >
                    🟡 Waitlist ({selectedApplications.length})
                  </button>
                  <button
                    onClick={() => handleBulkAction('interview_scheduled')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    📅 Schedule ({selectedApplications.length})
                  </button>
                  <button
                    onClick={() => handleBulkAction('rejected')}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                  >
                    ⚠️ Reject ({selectedApplications.length})
                  </button>
                </div>
              </div>
            )}
          </div>
          {/* Remove this extra closing div */}
          {/* </div> */}

          {/* Enhanced Applications Table */}
          <ApplicationsTable
            loading={loading}
            filteredApplications={filteredApplications}
            selectedApplications={selectedApplications}
            setSelectedApplications={setSelectedApplications}
            handleStudentClick={handleStudentClick}
            statusConfig={statusConfig}
            openDropdownId={openDropdownId}
            setOpenDropdownId={setOpenDropdownId}
            dropdownPosition={dropdownPosition}
            setDropdownPosition={setDropdownPosition}
            handleStatusUpdate={handleStatusUpdate}
          />

          {/* Job Details Edit Modal */}
          {editMode && (
            <JobDetailsEdit
              job={editedJob}
              setEditedJob={setEditedJob} // Corrected prop name
              editMode={editMode} // Pass editMode state
              setEditMode={setEditMode} // Pass setEditMode function
              onClose={() => setEditMode(false)} // Keep onClose for clarity if needed, but setEditMode prop is primary
              onSaveSuccess={fetchJobAndApplications} // Re-fetch data after save
            />
          )}

          {/* Student Details Modal */}
          {selectedStudent && (
            <StudentDetailsModal
              student={selectedStudent}
              onClose={() => setSelectedStudent(null)}
              statusConfig={statusConfig}
            />
          )}
        </div>
      </div>
    );
};

export default JobApplications;
