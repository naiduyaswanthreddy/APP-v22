import React, { useEffect, useState, useMemo } from "react";
import { auth, db } from "../../../firebase";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, Link } from "react-router-dom";
import { 
  User, 
  Briefcase, Award, 
  Book, 
  Download,
  BarChart2, 
  FileText, 
  MessageSquare,
} from "lucide-react";

// Import Chart.js components
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title } from 'chart.js';

// Import the individual profile components
import ProfileBasic from "./ProfileBasic";
import ProfileAcademics from "./ProfileAcademics";
import ProfileCareer from "./ProfileCareer";
import ProfileExcellence from "./ProfileExcellence";
import ProfileAnalytics from "./ProfileAnalytics";
import ProfileApplications from "./ProfileApplications";
import ProfileNotes from "./ProfileNotes";

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title
);

const Profile = ({ studentData, isAdminView }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("basic");
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  
  useEffect(() => {
    if (isAdminView && studentData && !userData) {
      setUserData(studentData);
      calculateCompletionPercentage(studentData);
      setLoading(false);
    } else if (!userData) {
      fetchUserProfile();
    }
  }, [isAdminView, studentData, userData]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (user) {
        const studentRef = doc(db, "students", user.uid);
        const studentSnap = await getDoc(studentRef);
        
        if (studentSnap.exists()) {
          const data = studentSnap.data();
          setUserData(data);
          calculateCompletionPercentage(data);
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletionPercentage = (data) => {
    const requiredFields = {
      basic: ['name', 'email', 'mobile', 'rollNumber', 'batch', 'program', 'department', 'gender', 'birthday', 'address', 'city', 'state', 'pinCode'],
      academics: ['cgpa', 'skills', 'semesterData'],
      career: ['workExperience'],
      excellence: ['technicalSkills', 'softSkills', 'projects']
    };
    
    let filledFields = 0;
    let totalFields = 0;
    
    Object.keys(requiredFields).forEach(section => {
      requiredFields[section].forEach(field => {
        totalFields++;
        if (data[field] && 
            ((Array.isArray(data[field]) && data[field].length > 0) || 
             (typeof data[field] === 'string' && data[field].trim() !== '') ||
             (typeof data[field] === 'number' && !isNaN(data[field])) ||
             (typeof data[field] === 'object' && data[field] !== null && Object.keys(data[field]).length > 0))) {
          filledFields++;
        }
      });
    });
    
    const percentage = Math.round((filledFields / totalFields) * 100);
    setCompletionPercentage(percentage);
  };

  const handleExportPDF = () => {
    if (!userData) return;
    const pdfBlob = generatePDF(userData);
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${userData.name || 'student'}_profile.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const generatePDF = (data) => {
    return new Blob(['PDF content'], { type: 'application/pdf' });
  };

  const memoizedUserData = useMemo(() => userData, [userData]);
  const handleUserDataChange = (newData) => {
    setUserData(newData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex items-center mb-4 sm:mb-0">
          <div className="bg-indigo-100 p-3 rounded-full mr-4">
            <User size={24} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{userData?.name || 'Student Profile'}</h1>
            <p className="text-gray-600">{userData?.rollNumber || 'Roll Number'} • {userData?.program || 'Program'}</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center bg-gray-100 px-3 py-2 rounded-lg">
            <div className="mr-2">
              <svg className="w-10 h-10">
                <circle className="text-gray-300" strokeWidth="5" stroke="currentColor" fill="transparent" r="18" cx="20" cy="20" />
                <circle className="text-indigo-600" strokeWidth="5" strokeDasharray={`${completionPercentage * 1.13}, 113`} strokeLinecap="round" stroke="currentColor" fill="transparent" r="18" cx="20" cy="20" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500">Profile Completion</p>
              <p className="font-semibold">{completionPercentage}%</p>
            </div>
          </div>
          
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <Download size={16} />
            <span>Export PDF</span>
          </button>
        </div>
      </div>
      
      <div className="mb-6">
        <nav className="flex border-b border-gray-200 bg-gray-100 overflow-x-auto">
          <button
            onClick={() => setActiveTab("basic")}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === "basic" ? "bg-white text-blue-600 border-b-2 border-blue-500" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <User size={16} className="mr-2" />
            <span>Basic Info</span>
          </button>
          
          <button
            onClick={() => setActiveTab("academics")}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === "academics" ? "bg-white text-green-600 border-b-2 border-green-500" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Book size={16} className="mr-2" />
            <span>Academics</span>
          </button>
          
          <button
            onClick={() => setActiveTab("career")}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === "career" ? "bg-white text-yellow-600 border-b-2 border-yellow-500" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Briefcase size={16} className="mr-2" />
            <span>Career</span>
          </button>
          
          <button
            onClick={() => setActiveTab("excellence")}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === "excellence" ? "bg-white text-red-600 border-b-2 border-red-500" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Award size={16} className="mr-2" />
            <span>Excellence</span>
          </button>
          
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === "analytics" ? "bg-white text-purple-600 border-b-2 border-purple-500" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <BarChart2 size={16} className="mr-2" />
            <span>Analytics</span>
          </button>
          
          <button
            onClick={() => setActiveTab("applications")}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === "applications" ? "bg-white text-teal-600 border-b-2 border-teal-500" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <FileText size={16} className="mr-2" />
            <span>Applications</span>
          </button>
          
          <button
            onClick={() => setActiveTab("notes")}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === "notes" ? "bg-white text-pink-600 border-b-2 border-pink-500" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <MessageSquare size={16} className="mr-2" />
            <span>Notes</span>
          </button>
        </nav>
      </div>
      
      <div className={`bg-white rounded-lg shadow overflow-hidden p-6 ${activeTab === "basic" ? "border border-blue-500" : ""} ${activeTab === "academics" ? "border border-green-500" : ""} ${activeTab === "career" ? "border border-yellow-500" : ""} ${activeTab === "excellence" ? "border border-red-500" : ""} ${activeTab === "analytics" ? "border border-purple-500" : ""} ${activeTab === "applications" ? "border border-teal-500" : ""} ${activeTab === "notes" ? "border border-pink-500" : ""}`}>
        {activeTab === "basic" && (
          <div>
            <ProfileBasic userData={memoizedUserData} isAdminView={isAdminView} onUserDataChange={handleUserDataChange} />
          </div>
        )}
        
        {activeTab === "academics" && (
          <div>
            <h2 className="text-xl font-bold mb-4">Academic Profile</h2>
            <div className="flex space-x-4 mb-4">
              <button className={`px-2 py-1 text-sm font-medium rounded ${activeTab === "academics" ? "bg-green-100 text-green-600" : "text-gray-500"}`}>Academics</button>
              <button className="px-2 py-1 text-sm font-medium text-gray-500">Resumes</button>
              <button className="px-2 py-1 text-sm font-medium text-gray-500">Documents</button>
              <button className="px-2 py-1 text-sm font-medium text-gray-500">Tracker</button>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <h3 className="text-lg font-semibold">Academic Details</h3>
                <p><strong>CGPA</strong> 9</p>
                <p><strong>Backlogs Cleared</strong> No</p>
                <p><strong>Academic Remarks</strong> No remarks</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Current Arrears</h3>
                <p>1</p>
                <h3 className="text-lg font-semibold mt-4">Academic Attendance</h3>
                <p>0%</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold">History of Arrears</h3>
                <p>0</p>
                <h3 className="text-lg font-semibold mt-4">P&P Attendance</h3>
                <p>0%</p>
              </div>
            </div>
            <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">Edit</button>
          </div>
        )}
        
        {activeTab === "career" && (
          <div>
            <ProfileCareer userData={memoizedUserData} isAdminView={isAdminView} onUserDataChange={handleUserDataChange} />
          </div>
        )}
        
        {activeTab === "excellence" && (
          <div>
            <ProfileExcellence userData={memoizedUserData} isAdminView={isAdminView} onUserDataChange={handleUserDataChange} />
          </div>
        )}
        
        {activeTab === "analytics" && (
          <div>
            <ProfileAnalytics userData={memoizedUserData} isAdminView={isAdminView} onUserDataChange={handleUserDataChange} />
          </div>
        )}
        
        {activeTab === "applications" && (
          <div>
            <ProfileApplications userData={memoizedUserData} isAdminView={isAdminView} onUserDataChange={handleUserDataChange} />
          </div>
        )}
        
        {activeTab === "notes" && (
          <div>
            <ProfileNotes userData={memoizedUserData} isAdminView={isAdminView} onUserDataChange={handleUserDataChange} />
          </div>
        )}
      </div>
      
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 flex justify-around">
        <button onClick={() => setActiveTab("basic")} className={`flex flex-col items-center p-2 ${activeTab === "basic" ? "text-indigo-600" : "text-gray-500"}`}>
          <User size={20} />
          <span className="text-xs mt-1">Basic</span>
        </button>
        <button onClick={() => setActiveTab("academics")} className={`flex flex-col items-center p-2 ${activeTab === "academics" ? "text-indigo-600" : "text-gray-500"}`}>
          <Book size={20} />
          <span className="text-xs mt-1">Academics</span>
        </button>
        <button onClick={() => setActiveTab("career")} className={`flex flex-col items-center p-2 ${activeTab === "career" ? "text-indigo-600" : "text-gray-500"}`}>
          <Briefcase size={20} />
          <span className="text-xs mt-1">Career</span>
        </button>
        <button onClick={() => setActiveTab("excellence")} className={`flex flex-col items-center p-2 ${activeTab === "excellence" ? "text-indigo-600" : "text-gray-500"}`}>
          <Award size={20} />
          <span className="text-xs mt-1">Excellence</span>
        </button>
        <button onClick={() => setActiveTab("analytics")} className={`flex flex-col items-center p-2 ${activeTab === "analytics" ? "text-indigo-600" : "text-gray-500"}`}>
          <BarChart2 size={20} />
          <span className="text-xs mt-1">Analytics</span>
        </button>
        <button onClick={() => setActiveTab("applications")} className={`flex flex-col items-center p-2 ${activeTab === "applications" ? "text-indigo-600" : "text-gray-500"}`}>
          <FileText size={20} />
          <span className="text-xs mt-1">Apps</span>
        </button>
        <button onClick={() => setActiveTab("notes")} className={`flex flex-col items-center p-2 ${activeTab === "notes" ? "text-indigo-600" : "text-gray-500"}`}>
          <MessageSquare size={20} />
          <span className="text-xs mt-1">Notes</span>
        </button>
      </div>
    </div>
  );
};

export default Profile;