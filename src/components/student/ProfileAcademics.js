import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, Link } from "react-router-dom";
import { 
  Check, Target, FileText, 
  Book, Clipboard, 
  Download, Eye, Trash2, PlusCircle
} from "lucide-react";

// Import Chart.js for CGPA trend chart
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ProfileAcademics = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("academics");
  const [userData, setUserData] = useState({
    cgpa: "",
    skills: "",
    academicInfo: "",
    currentArrears: "0",
    historyOfArrears: "0",
    backlogsCleared: "No",
    academicAttendance: "0",
    tpAttendance: "0",
    academicRemarks: "",
    semesterData: [],
    eligibleJobs: 0,
    appliedJobs: 0,
    shortlistedJobs: 0,
    interviewedJobs: 0,
    offersReceived: 0,
  });
  
  const [resumes, setResumes] = useState([]);
  const [isEditingResume, setIsEditingResume] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [applicationTimeline, setApplicationTimeline] = useState([]);
  const [newResume, setNewResume] = useState({ name: "", link: "" });
  const [showResumeForm, setShowResumeForm] = useState(false);
  const [newDocument, setNewDocument] = useState({ type: "", link: "", expiryDate: "" });
  const [showDocumentForm, setShowDocumentForm] = useState(false);

  const getStatusColor = (status) => {
    switch(status) {
      case "applied": return "bg-blue-500";
      case "shortlisted": return "bg-yellow-500";
      case "interviewed": return "bg-purple-500";
      case "offered": return "bg-green-500";
      case "rejected": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case "applied": return "Applied to";
      case "shortlisted": return "Shortlisted by";
      case "interviewed": return "Interview with";
      case "offered": return "Offer from";
      case "rejected": return "Rejected by";
      default: return "";
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchApplicationStats();
  }, []);

  const fetchUserProfile = async () => {
    const user = auth.currentUser;
    if (user) {
      const studentRef = doc(db, "students", user.uid);
      const studentSnap = await getDoc(studentRef);
      
      if (studentSnap.exists()) {
        const data = studentSnap.data();
        setUserData(prev => ({
          ...prev,
          cgpa: data.cgpa || "",
          skills: data.skills || "",
          academicInfo: data.academicInfo || "",
          currentArrears: data.currentArrears || "0",
          historyOfArrears: data.historyOfArrears || "0",
          backlogsCleared: data.backlogsCleared || "No",
          academicAttendance: data.academicAttendance || "0",
          tpAttendance: data.tpAttendance || "0",
          academicRemarks: data.academicRemarks || "",
          semesterData: data.semesterData || [
            { semester: 1, cgpa: 8.5 },
            { semester: 2, cgpa: 8.7 },
            { semester: 3, cgpa: 9.0 },
            { semester: 4, cgpa: 8.8 },
          ],
        }));
        
        setResumes(data.resumes || []);
        setDocuments(data.documents || []);
      }
    }
  };

  const fetchApplicationStats = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const jobsRef = collection(db, "jobs");
        const jobsSnapshot = await getDocs(jobsRef);
        const allJobs = jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const studentRef = doc(db, "students", user.uid);
        const studentSnap = await getDoc(studentRef);
        const studentData = studentSnap.exists() ? studentSnap.data() : {};

        const applicationsRef = collection(db, "applications");
        const q = query(applicationsRef, where("studentId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const applications = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const eligibleJobs = allJobs.filter(job => {
          const meetsMinCGPA = !job.minCGPA || (studentData.cgpa && parseFloat(studentData.cgpa) >= parseFloat(job.minCGPA));
          const meetsArrearCriteria = !job.maxArrears || (studentData.currentArrears && parseInt(studentData.currentArrears) <= parseInt(job.maxArrears));
          return meetsMinCGPA && meetsArrearCriteria;
        });

        const appliedJobIds = applications.map(app => app.jobId);
        const notAppliedJobs = eligibleJobs.filter(job => !appliedJobIds.includes(job.id));

        setUserData(prev => ({
          ...prev,
          eligibleJobs: eligibleJobs.length,
          appliedJobs: applications.length,
          notAppliedJobs: notAppliedJobs.length,
          shortlistedJobs: applications.filter(app => app.status === "shortlisted").length,
          interviewedJobs: applications.filter(app => app.status === "interviewed").length,
          offersReceived: applications.filter(app => app.status === "offered").length,
        }));

        setApplicationTimeline(applications
          .sort((a, b) => b.appliedDate.toDate() - a.appliedDate.toDate())
          .slice(0, 5));
      } catch (error) {
        console.error("Error fetching application stats:", error);
      }
    }
  };

  const handleSaveProfile = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const studentRef = doc(db, "students", user.uid);
        await updateDoc(studentRef, {
          cgpa: userData.cgpa,
          skills: userData.skills,
          academicInfo: userData.academicInfo,
          currentArrears: userData.currentArrears,
          historyOfArrears: userData.historyOfArrears,
          backlogsCleared: userData.backlogsCleared,
          academicAttendance: userData.academicAttendance,
          tpAttendance: userData.tpAttendance,
          academicRemarks: userData.academicRemarks,
          semesterData: userData.semesterData,
          updatedAt: serverTimestamp(),
        });
        toast.success("Academic profile updated successfully!");
        setIsEditing(false);
      } catch (error) {
        console.error("Error updating profile:", error);
        toast.error("Failed to update profile. Please try again.");
      }
    } else {
      toast.error("User not authenticated. Please log in.");
    }
  };

  const handleAddResume = async () => {
    if (newResume.name && newResume.link) {
      const resumeToAdd = {
        id: Date.now(),
        name: newResume.name,
        link: newResume.link,
        isPrimary: resumes.length === 0,
        feedback: ""
      };
      const updatedResumes = [...resumes, resumeToAdd];
      setResumes(updatedResumes);

      const user = auth.currentUser;
      if (user) {
        try {
          const studentRef = doc(db, "students", user.uid);
          await updateDoc(studentRef, { resumes: updatedResumes });
          toast.success("Resume added successfully!");
          setNewResume({ name: "", link: "" });
          setShowResumeForm(false);
        } catch (error) {
          console.error("Error saving resume:", error);
          toast.error("Failed to save resume. Please try again.");
        }
      }
    } else {
      toast.error("Please fill in all fields");
    }
  };

  const handleSetPrimaryResume = async (id) => {
    const updatedResumes = resumes.map(resume => ({
      ...resume,
      isPrimary: resume.id === id
    }));
    setResumes(updatedResumes);

    const user = auth.currentUser;
    if (user) {
      try {
        const studentRef = doc(db, "students", user.uid);
        await updateDoc(studentRef, { resumes: updatedResumes });
        toast.success("Primary resume updated!");
      } catch (error) {
        console.error("Error updating resumes:", error);
        toast.error("Failed to update primary resume.");
      }
    }
  };

  const handleDeleteResume = async (id) => {
    if (window.confirm("Are you sure you want to delete this resume?")) {
      const updatedResumes = resumes.filter(resume => resume.id !== id);
      if (resumes.find(r => r.id === id)?.isPrimary && updatedResumes.length > 0) {
        updatedResumes[0].isPrimary = true;
      }
      setResumes(updatedResumes);

      const user = auth.currentUser;
      if (user) {
        try {
          const studentRef = doc(db, "students", user.uid);
          await updateDoc(studentRef, { resumes: updatedResumes });
          toast.success("Resume deleted successfully!");
        } catch (error) {
          console.error("Error deleting resume:", error);
          toast.error("Failed to delete resume.");
        }
      }
    }
  };

  const handleAddDocument = async () => {
    if (newDocument.type && newDocument.link) {
      const documentToAdd = {
        id: Date.now(),
        type: newDocument.type,
        link: newDocument.link,
        expiryDate: newDocument.expiryDate || null
      };
      const updatedDocuments = [...documents, documentToAdd];
      setDocuments(updatedDocuments);

      const user = auth.currentUser;
      if (user) {
        try {
          const studentRef = doc(db, "students", user.uid);
          await updateDoc(studentRef, { documents: updatedDocuments });
          toast.success("Document added successfully!");
          setNewDocument({ type: "", link: "", expiryDate: "" });
          setShowDocumentForm(false);
        } catch (error) {
          console.error("Error saving document:", error);
          toast.error("Failed to save document. Please try again.");
        }
      }
    } else {
      toast.error("Please fill in all required fields");
    }
  };

  const handleDeleteDocument = async (id) => {
    if (window.confirm("Are you sure you want to delete this document?")) {
      const updatedDocuments = documents.filter(doc => doc.id !== id);
      setDocuments(updatedDocuments);

      const user = auth.currentUser;
      if (user) {
        try {
          const studentRef = doc(db, "students", user.uid);
          await updateDoc(studentRef, { documents: updatedDocuments });
          toast.success("Document deleted successfully!");
        } catch (error) {
          console.error("Error deleting document:", error);
          toast.error("Failed to delete document.");
        }
      }
    }
  };

  const profileTabs = [
    { id: "academics", label: "Academics", icon: <Book size={16} /> },
    { id: "resumes", label: "Resumes", icon: <FileText size={16} /> },
    { id: "documents", label: "Documents", icon: <Clipboard size={16} /> },
    { id: "tracker", label: "Tracker", icon: <Target size={16} /> },
  ];

  const cgpaChartData = {
    labels: userData.semesterData.map(item => `Semester ${item.semester}`),
    datasets: [
      {
        label: 'CGPA',
        data: userData.semesterData.map(item => item.cgpa || 0),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1,
      },
    ],
  };

  const applicationFunnelData = {
    labels: ['Eligible', 'Applied', 'Shortlisted', 'Interviewed', 'Offers'],
    datasets: [
      {
        label: 'Applications',
        data: [
          userData.eligibleJobs || 0,
          userData.appliedJobs || 0,
          userData.shortlistedJobs || 0,
          userData.interviewedJobs || 0,
          userData.offersReceived || 0,
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(153, 102, 255, 0.5)',
          'rgba(255, 99, 132, 0.5)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const renderAcademicsTab = () => {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Academic Details</h3>
            {isEditing ? (
              <button 
                onClick={handleSaveProfile}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Save
              </button>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Edit
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">CGPA</p>
              {isEditing ? (
                <input
                  type="text"
                  value={userData.cgpa}
                  onChange={(e) => setUserData(prev => ({ ...prev, cgpa: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                />
              ) : (
                <p className="text-base">{userData.cgpa || "Not specified"}</p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Current Arrears</p>
              {isEditing ? (
                <input
                  type="number"
                  min="0"
                  value={userData.currentArrears}
                  onChange={(e) => setUserData(prev => ({ ...prev, currentArrears: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                />
              ) : (
                <p className="text-base">{userData.currentArrears}</p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">History of Arrears</p>
              {isEditing ? (
                <input
                  type="number"
                  min="0"
                  value={userData.historyOfArrears}
                  onChange={(e) => setUserData(prev => ({ ...prev, historyOfArrears: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                />
              ) : (
                <p className="text-base">{userData.historyOfArrears}</p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Backlogs Cleared</p>
              {isEditing ? (
                <select
                  value={userData.backlogsCleared}
                  onChange={(e) => setUserData(prev => ({ ...prev, backlogsCleared: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="N/A">N/A</option>
                </select>
              ) : (
                <p className="text-base">{userData.backlogsCleared}</p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Academic Attendance</p>
              {isEditing ? (
                <input
                  type="text"
                  value={userData.academicAttendance}
                  onChange={(e) => setUserData(prev => ({ ...prev, academicAttendance: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g., 85%"
                />
              ) : (
                <p className="text-base">{userData.academicAttendance}%</p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">T&P Attendance</p>
              {isEditing ? (
                <input
                  type="text"
                  value={userData.tpAttendance}
                  onChange={(e) => setUserData(prev => ({ ...prev, tpAttendance: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g., 90%"
                />
              ) : (
                <p className="text-base">{userData.tpAttendance}%</p>
              )}
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <p className="text-sm font-medium text-gray-500">Academic Remarks</p>
              {isEditing ? (
                <textarea
                  value={userData.academicRemarks}
                  onChange={(e) => setUserData(prev => ({ ...prev, academicRemarks: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                  rows="3"
                />
              ) : (
                <p className="text-base">{userData.academicRemarks || "No remarks"}</p>
              )}
            </div>
          </div>
        </div>

        {/* CGPA Trend Chart */}
        {userData.semesterData.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">CGPA Trend</h3>
            <div className="h-64">
              <Line 
                data={cgpaChartData} 
                options={{ 
                  maintainAspectRatio: false,
                  scales: { y: { beginAtZero: true, max: 10 } },
                  plugins: { legend: { position: 'top' } }
                }} 
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderResumesTab = () => {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">My Resumes</h3>
            {!showResumeForm && (
              <button 
                onClick={() => setShowResumeForm(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
              >
                <PlusCircle size={16} />
                Add Resume
              </button>
            )}
          </div>
          
          {showResumeForm && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium mb-3">Add New Resume</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resume Name</label>
                  <input
                    type="text"
                    value={newResume.name}
                    onChange={(e) => setNewResume({ ...newResume, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="e.g., Technical Resume, General Resume"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resume Link</label>
                  <input
                    type="text"
                    value={newResume.link}
                    onChange={(e) => setNewResume({ ...newResume, link: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="https://drive.google.com/file/..."
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleAddResume}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                  >
                    Save Resume
                  </button>
                  <button 
                    onClick={() => {
                      setShowResumeForm(false);
                      setNewResume({ name: "", link: "" });
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {resumes.length > 0 ? (
            <div className="space-y-4">
              {resumes.map((resume) => (
                <div key={resume.id} className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{resume.name}</h4>
                      {resume.isPrimary && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Primary</span>
                      )}
                    </div>
                    {resume.feedback && (
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Feedback:</span> {resume.feedback}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!resume.isPrimary && (
                      <button 
                        onClick={() => handleSetPrimaryResume(resume.id)}
                        className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm flex items-center gap-1"
                      >
                        <Check size={14} />
                        Set as Primary
                      </button>
                    )}
                    <a 
                      href={resume.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm flex items-center gap-1"
                    >
                      <Eye size={14} />
                      View
                    </a>
                    <button 
                      onClick={() => handleDeleteResume(resume.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm flex items-center gap-1"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No resumes added yet. Click "Add Resume" to get started.</p>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Resume Builder</h3>
          <p className="mb-4">Create a professional resume using our built-in resume maker tool.</p>
          <Link 
            to="/student/resume-maker"
            className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 inline-flex items-center gap-2"
          >
            <FileText size={16} />
            Open Resume Builder
          </Link>
        </div>
      </div>
    );
  };

  const renderDocumentsTab = () => {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">My Documents</h3>
            {!showDocumentForm && (
              <button 
                onClick={() => setShowDocumentForm(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
              >
                <PlusCircle size={16} />
                Add Document
              </button>
            )}
          </div>
          
          {showDocumentForm && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium mb-3">Add New Document</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Document Type*</label>
                  <input
                    type="text"
                    value={newDocument.type}
                    onChange={(e) => setNewDocument({ ...newDocument, type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="e.g., Aadhaar, PAN, Passport"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Document Link*</label>
                  <input
                    type="text"
                    value={newDocument.link}
                    onChange={(e) => setNewDocument({ ...newDocument, link: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="https://drive.google.com/file/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date (if applicable)</label>
                  <input
                    type="date"
                    value={newDocument.expiryDate}
                    onChange={(e) => setNewDocument({ ...newDocument, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleAddDocument}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                  >
                    Save Document
                  </button>
                  <button 
                    onClick={() => {
                      setShowDocumentForm(false);
                      setNewDocument({ type: "", link: "", expiryDate: "" });
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {documents.length > 0 ? (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-medium">{doc.type}</h4>
                    {doc.expiryDate && (
                      <p className="text-sm text-gray-600">
                        Expires: {new Date(doc.expiryDate).toLocaleDateString()}
                        {new Date(doc.expiryDate) < new Date() && (
                          <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Expired</span>
                        )}
                        {new Date(doc.expiryDate) > new Date() && new Date(doc.expiryDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) && (
                          <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Expiring Soon</span>
                        )}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a 
                      href={doc.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm flex items-center gap-1"
                    >
                      <Eye size={14} />
                      View
                    </a>
                    <a 
                      href={doc.link} 
                      download
                      className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm flex items-center gap-1"
                    >
                      <Download size={14} />
                      Download
                    </a>
                    <button 
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm flex items-center gap-1"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No documents added yet. Click "Add Document" to get started.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTrackerTab = () => {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Application Funnel</h3>
          <div className="h-64">
            <Line 
              data={applicationFunnelData} 
              options={{ 
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } },
                plugins: { legend: { position: 'top' } }
              }} 
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <p className="text-sm text-gray-600">Eligible</p>
              <p className="text-xl font-bold text-blue-600">{userData.eligibleJobs}</p>
            </div>
            <div className="bg-teal-50 p-3 rounded-lg text-center">
              <p className="text-sm text-gray-600">Applied</p>
              <p className="text-xl font-bold text-teal-600">{userData.appliedJobs}</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg text-center">
              <p className="text-sm text-gray-600">Shortlisted</p>
              <p className="text-xl font-bold text-yellow-600">{userData.shortlistedJobs}</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg text-center">
              <p className="text-sm text-gray-600">Interviewed</p>
              <p className="text-xl font-bold text-purple-600">{userData.interviewedJobs}</p>
            </div>
            <div className="bg-pink-50 p-3 rounded-lg text-center">
              <p className="text-sm text-gray-600">Offers</p>
              <p className="text-xl font-bold text-pink-600">{userData.offersReceived}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Application Timeline</h3>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            <div className="ml-12 space-y-8">
              {applicationTimeline.map((app, index) => (
                <div key={index} className="relative">
                  <div className="absolute -left-12 mt-1.5 h-4 w-4 rounded-full border border-white" style={{ backgroundColor: getStatusColor(app.status) }}></div>
                  <div className="mb-1 flex items-center justify-between">
                    <h4 className="text-md font-semibold">{getStatusText(app.status)} {app.company}</h4>
                    <p className="text-xs text-gray-500">{app.appliedDate ? app.appliedDate.toDate().toLocaleDateString() : "N/A"}</p>
                  </div>
                  <p className="text-sm text-gray-600">{app.position || "N/A"}</p>
                </div>
              ))}
              {applicationTimeline.length === 0 && (
                <p className="text-gray-500 text-center">No recent applications.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <h2 className="text-2xl font-bold mb-6">Academic Profile</h2>
      
      {/* Tab Navigation */}
      <div className="mb-6 flex flex-wrap gap-2 border-b">
        {profileTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 flex items-center gap-2 ${activeTab === tab.id
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      <div className="mb-8">
        {activeTab === "academics" && renderAcademicsTab()}
        {activeTab === "resumes" && renderResumesTab()}
        {activeTab === "documents" && renderDocumentsTab()}
        {activeTab === "tracker" && renderTrackerTab()}
      </div>
    </div>
  );
};

export default ProfileAcademics;