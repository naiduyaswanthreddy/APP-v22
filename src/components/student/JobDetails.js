import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, doc, getDoc, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  ChevronLeft,
  MapPin,
  Briefcase,
  DollarSign,
  
  Save,
  Send,
  CheckCircle,
  Award,
  MessageSquare,
  Building,
  Tag,
  Laptop,
  
  Calendar,
  CalendarClock,
  CalendarCheck,
  Clock,
  
  ShieldCheck,
} from "lucide-react";
import JobChat from './JobChat';
import { LinkIcon } from 'lucide-react';
import Loader from '../../loading'; // Add this import at the top
import { IndianRupee } from "lucide-react";



const JobDetails = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  
  // State declarations
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedJobs, setSavedJobs] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [applicationStatuses, setApplicationStatuses] = useState({});
  const [applicationAnswers, setApplicationAnswers] = useState({});
  const [screeningAnswers, setScreeningAnswers] = useState({});
  const [studentProfile, setStudentProfile] = useState({
    cgpa: 0,
    skills: [],
    batch: '',
  });
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [activeTab, setActiveTab] = useState('details'); // New state for tab navigation
  const [linkVisited, setLinkVisited] = useState({});

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
      fetchStudentProfile();
      fetchSavedJobs();
      fetchAppliedJobs();
    }
  }, [jobId]);

  // Calculate and update countdown timer
  useEffect(() => {
    if (!selectedJob?.deadline) return;

    const deadline = new Date(selectedJob.deadline);
    
    const updateCountdown = () => {
      const now = new Date();
      const difference = deadline - now;
      
      if (difference <= 0) {
        setTimeLeft('Application deadline passed');
        return;
      }
      
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeLeft(`${days}d ${hours}h ${minutes}m remaining`);
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [selectedJob]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const jobRef = doc(db, 'jobs', jobId);
      const jobSnap = await getDoc(jobRef);
      
      if (jobSnap.exists()) {
        const jobData = {
          id: jobSnap.id,
          ...jobSnap.data(),
          deadline: jobSnap.data().deadline ? new Date(jobSnap.data().deadline).toLocaleString() : 'No deadline',
          interviewDateTime: jobSnap.data().interviewDateTime ? new Date(jobSnap.data().interviewDateTime).toLocaleString() : 'Not scheduled'
        };
        setSelectedJob(jobData);

        // Initialize linkVisited state for mandatory links
        const initialLinkVisited = {};
        (jobData.externalLinks || []).forEach(link => {
          if (link.mandatoryBeforeApply) {
            initialLinkVisited[link.url] = false;
          }
        });
        setLinkVisited(initialLinkVisited);
      } else {
        toast.error("Job not found!");
        navigate('/student/jobs');
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      toast.error('Failed to fetch job details');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentProfile = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const studentDoc = await getDoc(doc(db, 'students', user.uid));
      const studentData = studentDoc.data() || {};

      setStudentProfile({
        ...studentData,
        cgpa: studentData.cgpa || 0,
        currentArrears: studentData.currentArrears || 0,
        historyArrears: studentData.historyArrears || 0,
        gender: studentData.gender || '',
        batch: studentData.batch || '',
        skills: Array.isArray(studentData.skills) 
                ? studentData.skills 
                : (typeof studentData.skills === 'string' && studentData.skills) 
                  ? [studentData.skills] 
                  : [],
        academicInfo: studentData.academicInfo || '',
        department: studentData.department || '',
        email: studentData.email || '',
        github: studentData.github || '',
        hackerrank: studentData.hackerrank || '',
        leetcode: studentData.leetcode || '',
        mobile: studentData.mobile || '',
        name: studentData.name || '',
        passoutYear: studentData.passoutYear || '',
        program: studentData.program || '',
        resumeLink: studentData.resumeLink || '',
        rollNumber: studentData.rollNumber || '',
        createdAt: studentData.createdAt,
      });
    } catch (error) {
      console.error('Error fetching student profile:', error);
      toast.error('Failed to fetch profile data');
    }
  };

  const fetchSavedJobs = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const savedJobsRef = collection(db, 'saved_jobs');
        const q = query(savedJobsRef, where('student_id', '==', user.uid));
        const querySnapshot = await getDocs(q);
        setSavedJobs(querySnapshot.docs.map(doc => doc.data().job_id));
      }
    } catch (error) {
      toast.error("Error fetching saved jobs!");
    }
  };

  const fetchAppliedJobs = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const applicationsRef = collection(db, 'applications');
        const q = query(applicationsRef, where('student_id', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        const jobIds = [];
        const statuses = {};
        const answers = {};
        
        querySnapshot.docs.forEach(doc => {
          const data = doc.data();
          jobIds.push(data.job_id);
          statuses[data.job_id] = data.status;
          answers[data.job_id] = data.screening_answers || {};
        });
        
        setAppliedJobs(jobIds);
        setApplicationStatuses(statuses);
        setApplicationAnswers(answers);
      }
    } catch (error) {
      toast.error("Error fetching applications!");
    }
  };

  const handleLinkClick = (url, isMandatory) => {
    if (isMandatory) {
      setLinkVisited(prev => ({ ...prev, [url]: true }));
    }
    window.open(url, '_blank');
  };


  const handleSaveJob = async (jobId) => {
    try {
      const user = auth.currentUser;
      if (user) {
        await addDoc(collection(db, 'saved_jobs'), {
          job_id: jobId,
          student_id: user.uid,
          saved_at: serverTimestamp()
        });
        setSavedJobs([...savedJobs, jobId]);
        toast.success("Job saved successfully!");
      }
    } catch (error) {
      toast.error("Error saving job!");
    }
  };

  const handleAnswerChange = (questionIndex, value) => {
    setScreeningAnswers(prev => ({
      ...prev,
      [questionIndex]: value
    }));
  };

  const handleApply = async (jobId) => {
    try {
      const user = auth.currentUser;
      if (user) {
        if (selectedJob?.screeningQuestions?.length > 0) {
          const unansweredQuestions = selectedJob.screeningQuestions.filter(
            (_, index) => {
              const ans = screeningAnswers[index];
              return ans === undefined || ans === null || String(ans).trim() === '';
            }
          );
          
          if (unansweredQuestions.length > 0) {
            toast.warning("Please answer all screening questions before applying.");
            return;
          }
        }
        
        await addDoc(collection(db, 'applications'), {
          job_id: jobId,
          student_id: user.uid,
          status: 'pending',
          applied_at: serverTimestamp(),
          screening_answers: screeningAnswers
        });
        
        setAppliedJobs([...appliedJobs, selectedJob.id]);
        setScreeningAnswers({});
        toast.success("Application submitted successfully!");
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error("Error submitting application!");
    }
  };

  const checkEligibility = (job) => {
    if (!studentProfile) {
      return false;
    }

    const studentCGPA = parseFloat(studentProfile.cgpa) || 0;
    const requiredCGPA = parseFloat(job.minCGPA) || 0;
    const isCgpaEligible = studentCGPA >= requiredCGPA;

    const studentSkills = studentProfile.skills?.map(skill => skill.toLowerCase()) || [];
    const requiredSkills = job.skills?.map(skill => skill.toLowerCase()) || [];
    const hasRequiredSkills = requiredSkills.length === 0 || 
      requiredSkills.every(skill => studentSkills.includes(skill));

    const studentBatch = String(studentProfile.batch || '').toLowerCase();
    const eligibleBatches = job.eligibleBatch?.map(batch => String(batch)).map(batch => batch.toLowerCase()) || [];
    const isBatchEligible = eligibleBatches.length === 0 || 
      eligibleBatches.some(batch => studentBatch.includes(batch) || batch.includes(studentBatch));

    const studentGender = studentProfile.gender?.toLowerCase() || '';
    const genderPref = job.genderPreference?.toLowerCase() || 'any';
    const isGenderEligible = genderPref === 'any' || genderPref === studentGender;

    const studentCurrentArrears = parseInt(studentProfile.currentArrears || 0);
    const maxCurrentArrears = parseInt(job.maxCurrentArrears || 0);
    const isCurrentArrearsEligible = maxCurrentArrears === 0 || studentCurrentArrears <= maxCurrentArrears;

    const studentHistoryArrears = parseInt(studentProfile.historyArrears || 0);
    const maxHistoryArrears = parseInt(job.maxHistoryArrears || 0);
    const isHistoryArrearsEligible = maxHistoryArrears === 0 || studentHistoryArrears <= maxHistoryArrears;

    return isCgpaEligible && hasRequiredSkills && isBatchEligible && 
           isGenderEligible && isCurrentArrearsEligible && isHistoryArrearsEligible;
  };

  const calculateSkillMatch = (job) => {
    if (!job?.skills || !studentProfile?.skills) {
      return 0;
    }

    const studentSkills = studentProfile.skills.map(skill => skill.toLowerCase());
    const requiredSkills = job.skills.map(skill => skill.toLowerCase());
    
    if (requiredSkills.length === 0) {
      return 100;
    }

    const matchedSkills = requiredSkills.filter(skill => 
      studentSkills.includes(skill)
    );
    return Math.round((matchedSkills.length / requiredSkills.length) * 100);
  };

  const getEligibilityDetails = (job) => {
    const reasons = [];
    
    const studentCGPA = parseFloat(studentProfile.cgpa) || 0;
    const requiredCGPA = parseFloat(job.minCGPA) || 0;
    if (studentCGPA < requiredCGPA) {
      reasons.push(`CGPA requirement not met (Your CGPA: ${studentCGPA}, Required: ${requiredCGPA})`);
    }
  
    const studentSkills = studentProfile.skills?.map(skill => skill.toLowerCase()) || [];
    const requiredSkills = job.skills?.map(skill => skill.toLowerCase()) || [];
    const missingSkills = requiredSkills.filter(skill => !studentSkills.includes(skill));
    if (missingSkills.length > 0) {
      reasons.push(`Missing skills: ${missingSkills.join(', ')}`);
    }
  
    const studentBatch = String(studentProfile.batch || '').toLowerCase();
    const eligibleBatches = job.eligibleBatch?.map(batch => String(batch)).map(batch => batch.toLowerCase()) || [];
    if (eligibleBatches.length > 0 && !eligibleBatches.some(batch => 
      studentBatch.includes(batch) || batch.includes(studentBatch))) {
      reasons.push(`Batch requirement not met (Your batch: ${studentProfile.batch}, Required: ${job.eligibleBatch?.join(', ')})`);
    }

    const studentGender = studentProfile.gender?.toLowerCase() || '';
    const genderPref = job.genderPreference?.toLowerCase() || 'any';
    if (genderPref !== 'any' && genderPref !== studentGender) {
      reasons.push(`Gender preference not met (Your gender: ${studentProfile.gender}, Required: ${job.genderPreference})`);
    }

    const studentCurrentArrears = parseInt(studentProfile.currentArrears || 0);
    const maxCurrentArrears = parseInt(job.maxCurrentArrears || 0);
    if (maxCurrentArrears > 0 && studentCurrentArrears > maxCurrentArrears) {
      reasons.push(`Current arrears limit exceeded (Your arrears: ${studentCurrentArrears}, Maximum allowed: ${maxCurrentArrears})`);
    }

    const studentHistoryArrears = parseInt(studentProfile.historyArrears || 0);
    const maxHistoryArrears = parseInt(job.maxHistoryArrears || 0);
    if (maxHistoryArrears > 0 && studentHistoryArrears > maxHistoryArrears) {
      reasons.push(`History arrears limit exceeded (Your arrears: ${studentHistoryArrears}, Maximum allowed: ${maxHistoryArrears})`);
    }
  
    return reasons;
  };

  const areAllMandatoryLinksVisited = () => {
    const mandatoryLinks = (selectedJob?.externalLinks || []).filter(link => link.mandatoryBeforeApply);
    return mandatoryLinks.every(link => linkVisited[link.url]);
  };






const JobInfoCard = ({ icon, label, value, iconBg, iconColor }) => (
  <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center gap-2 mb-1">
      <div className={`w-6 h-6 ${iconBg} rounded-lg flex items-center justify-center`}>
        <div className={`w-3 h-3 ${iconColor}`}>
          {icon}
        </div>
      </div>
      <span className="text-xs font-medium text-gray-500">{label}</span>
    </div>
    <p className="text-sm text-gray-900 font-semibold">{value}</p>
  </div>
);







  const handleJoinChat = async () => {
    try {
      if (!selectedJob || !auth.currentUser) return;
      
      const applicationsRef = collection(db, "applications");
      const q = query(
        applicationsRef, 
        where("student_id", "==", auth.currentUser.uid),
        where("jobId", "==", selectedJob.id)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const applicationDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, "applications", applicationDoc.id), {
          hasJoinedChat: true,
          lastChatActivity: serverTimestamp()
        });
      }
      
      setShowChatPanel(true);
      
      toast.success("You've joined the discussion!");
    } catch (error) {
      console.error("Error joining chat:", error);
      toast.error("Failed to join discussion. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="fixed top-0 left-0 right-0 bottom-0 bg-gray-100 bg-opacity-0 flex items-center justify-center z-50">
        <Loader />
      </div>
    );
  }

  if (!selectedJob) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg shadow-md">
        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <h3 className="mt-4 text-xl font-medium text-gray-700">Job not found</h3>
        <p className="mt-2 text-gray-500">The job you're looking for doesn't exist or has been removed.</p>
        <button
          onClick={() => navigate('/student/jobs')}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Back to Jobs
        </button>
      </div>
    );
  }

  const isEligible = checkEligibility(selectedJob);
  const isApplied = appliedJobs.includes(selectedJob.id);
  const isSaved = savedJobs.includes(selectedJob.id);
  const eligibilityReasons = !isEligible ? getEligibilityDetails(selectedJob) : [];

  // Render screening question based on type
  const renderScreeningQuestion = (question, index) => {
    switch(question.type?.toLowerCase()) {
      case 'text':
        return (
          <div className="mb-4">
            <input
              type="text"
              placeholder="Your answer"
              value={screeningAnswers[index] || ''}
              onChange={(e) => handleAnswerChange(index, e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
            />
          </div>
        );
      
      case 'number':
        return (
          <div className="mb-4">
            <input
              type="number"
              placeholder="Your answer"
              value={screeningAnswers[index] || ''}
              onChange={(e) => handleAnswerChange(index, e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
            />
          </div>
        );
      
      case 'date':
        return (
          <div className="mb-4">
            <input
              type="date"
              value={screeningAnswers[index] || ''}
              onChange={(e) => handleAnswerChange(index, e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
            />
          </div>
        );
      
      case 'yes/no':
      case 'yesno':
      case 'boolean':
        return (
          <div className="flex gap-4 mb-4">
            <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer transition hover:bg-gray-50 flex-1">
              <input
                type="radio"
                name={`question-${index}`}
                value="yes"
                checked={screeningAnswers[index] === 'yes'}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                className="mr-2 h-4 w-4 text-blue-600"
              />
              <span>Yes</span>
            </label>
            <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer transition hover:bg-gray-50 flex-1">
              <input
                type="radio"
                name={`question-${index}`}
                value="no"
                checked={screeningAnswers[index] === 'no'}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                className="mr-2 h-4 w-4 text-blue-600"
              />
              <span>No</span>
            </label>
          </div>
        );
      
      case 'multiple_choice':
case 'multiple-choice':
  return (
    <div className="space-y-2 mb-4">
      {question.options?.map((option, optIndex) => {
        const isChecked = screeningAnswers[index]?.includes(option);

        const handleCheckboxChange = (e) => {
          let updatedAnswers = screeningAnswers[index] || [];

          if (e.target.checked) {
            // Add the option
            updatedAnswers = [...updatedAnswers, option];
          } else {
            // Remove the option
            updatedAnswers = updatedAnswers.filter((ans) => ans !== option);
          }

          handleAnswerChange(index, updatedAnswers);
        };

        return (
          <label
            key={optIndex}
            className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer transition hover:bg-gray-50 w-full"
          >
            <input
              type="checkbox"
              value={option}
              checked={isChecked}
              onChange={handleCheckboxChange}
              className="mr-2 h-4 w-4 text-blue-600"
            />
            <span>{option}</span>
          </label>
        );
      })}
    </div>
  );

      
      default:
        return (
          <div className="mb-4">
            <input
              type="text"
              placeholder="Your answer"
              value={screeningAnswers[index] || ''}
              onChange={(e) => handleAnswerChange(index, e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
            />
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-0 max-w-6xl">
      <ToastContainer style={{ zIndex: 9999 }} />
      
      {/* Back button */}
      <button
        onClick={() => navigate('/student/jobpost')}
        className="mb-6 flex items-center text-gray-600 hover:text-gray-800 transition-colors"
      >
        <ChevronLeft size={20} className="mr-1" />
        Back to Jobs
      </button>

      {/* Main content card */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        {/* Header section */}
        <div className="relative bg-gradient-to-r from-slate-300 to-slate-400 p-8 text-gray-800">


          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                {(Array.isArray(selectedJob.jobTypes) ? selectedJob.jobTypes : 
                  (typeof selectedJob.jobTypes === 'string' ? [selectedJob.jobTypes] : []))
                  .map((type, index) => (
                  <span key={index} className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium">
                    {type}
                  </span>
                ))}
              </div>
              <h1 className="text-3xl font-bold mb-2">{selectedJob.position}</h1>
              <p className="text-xl opacity-90 mb-4">{selectedJob.company}</p>
              
                    <div className="flex flex-wrap gap-4 mt-4">
                      <div className="flex items-center">
                        <MapPin size={18} className="mr-2 opacity-75" />
                        <span>{selectedJob.location || 'Remote'}</span>
                      </div>

                      <div className="flex items-center">
                        <Briefcase size={18} className="mr-2 opacity-75" />
                        <span>{selectedJob.workMode || 'Not specified'}</span>
                      </div>

                      <div className="flex items-center">
                        <IndianRupee size={18} className="mr-2 opacity-75" />
                        {typeof selectedJob.jobTypes === 'string' && selectedJob.jobTypes.toLowerCase().includes('intern') ? (
                          <span>
                            Stipend:{' '}
                            {selectedJob.minSalary || selectedJob.maxSalary
                              ? `₹${selectedJob.minSalary || '—'} - ₹${selectedJob.maxSalary || '—'}/${selectedJob.salaryUnit?.toLowerCase() === 'monthly' ? 'month' : selectedJob.salaryUnit}`
                              : (selectedJob.salary
                                  ? `₹${selectedJob.salary}/${selectedJob.salaryUnit?.toLowerCase() === 'monthly' ? 'month' : selectedJob.salaryUnit}`
                                  : 'Not specified')}
                          </span>
                        ) : (
                          <span>
                            CTC:{' '}
                            {selectedJob.minCtc || selectedJob.maxCtc
                              ? `₹${selectedJob.minCtc || '—'} - ₹${selectedJob.maxCtc || '—'}/${selectedJob.ctcUnit?.toLowerCase() === 'yearly' ? 'year' : selectedJob.ctcUnit}`
                              : (selectedJob.ctc
                                  ? `₹${selectedJob.ctc}/${selectedJob.ctcUnit?.toLowerCase() === 'yearly' ? 'year' : selectedJob.ctcUnit}`
                                  : 'Not specified')}
                          </span>
                        )}
                      </div>
                    </div>



            </div>
            
            <div className="flex flex-col items-end">
              <div className={`px-4 py-2 rounded-lg text-sm font-medium mb-3 ${isEligible ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                {isEligible ? 'You are eligible' : 'Not eligible'}
              </div>
              {timeLeft && (
                <div className="text-sm font-medium bg-white bg-opacity-20 px-3 py-1 rounded-full flex items-center">
                  <Clock size={16} className="mr-1" />
                  {timeLeft}
                </div>
              )}
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="absolute bottom-0 right-0 transform translate-y-1/2 px-8 flex gap-3">
            <button
              onClick={() => setShowChatPanel(!showChatPanel)}
              className="flex items-center gap-2 px-4 py-3 bg-white text-blue-700 rounded-lg hover:bg-gray-100 transition-colors shadow-md"
            >
              <MessageSquare size={18} />
              Discussion
            </button>
            
            {!isSaved && (
              <button
                onClick={() => handleSaveJob(selectedJob.id)}
                className="flex items-center gap-2 px-4 py-3 bg-white text-blue-700 rounded-lg hover:bg-gray-100 transition-colors shadow-md"
              >
                <Save size={18} />
                Save Job
              </button>
            )}
            
            {!isApplied && isEligible && (
              <button
                onClick={() => {
                  if (areAllMandatoryLinksVisited()) {
                    if (selectedJob?.screeningQuestions?.length > 0) {
                      setActiveTab('apply');
                    } else {
                      handleApply(selectedJob.id);
                    }
                  }
                }}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors shadow-md ${
                  isEligible && areAllMandatoryLinksVisited()
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-400 text-gray-700 cursor-not-allowed'
                }`}
                disabled={!isEligible || !areAllMandatoryLinksVisited()} // Disable if not eligible or mandatory links not visited
              >
                <Send size={18} />
                {isEligible && !areAllMandatoryLinksVisited() ? 'Visit Mandatory Links' : 'Apply Now'}
              </button>
            )}
            
            {isApplied && (
              <button
                disabled
                className="flex items-center gap-2 px-4 py-3 bg-green-100 text-green-800 rounded-lg cursor-not-allowed shadow-md"
              >
                <CheckCircle size={18} />
                Applied
              </button>
            )}
          </div>
        </div>
        
        {/* Chat panel */}
        {showChatPanel && (
          <div className="p-6 border-b border-gray-200">
            <JobChat 
              selectedJob={selectedJob} 
              onClose={() => setShowChatPanel(false)} 
            />
          </div>
        )}
        
        {/* Eligibility warning */}
        {!isEligible && (
          <div className="bg-red-50 p-4 border-l-4 border-red-500 m-6 rounded-md">
            <h3 className="text-lg font-semibold text-red-700 mb-2">You don't meet the eligibility criteria</h3>
            <ul className="list-disc list-inside text-red-600 space-y-1">
              {eligibilityReasons.map((reason, index) => (
                <li key={index}>{reason}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Tab navigation */}
        <div className="border-b border-gray-200 px-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'details' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Job Details
            </button>
            {selectedJob.description && (
              <button
                onClick={() => setActiveTab('description')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'description' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Description
              </button>
            )}
            {selectedJob.screeningQuestions?.length > 0 && !isApplied && (
              <button
                onClick={() => setActiveTab('apply')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'apply' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Apply
              </button>
            )}
            {isApplied && selectedJob.screeningQuestions?.length > 0 && (
              <button
                onClick={() => setActiveTab('answers')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'answers' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Your Answers
              </button>
            )}
          </nav>
        </div>
        
        {/* Tab content */}
        <div className="p-6">
          {/* Job Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-8">





{/* Job Information */}
<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
  <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
    <Briefcase size={20} className="mr-2 text-blue-600" />
    Job Information
  </h3>

  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {/* Example Card */}
    <JobInfoCard
      iconBg="bg-blue-100"
      iconColor="text-blue-600"
      icon={<Briefcase size={12} />}
      label="Job Role"
      value={selectedJob.jobRoles || 'Not specified'}
    />

    <JobInfoCard
      iconBg="bg-green-100"
      iconColor="text-green-600"
      icon={<Building size={12} />}
      label="Company"
      value={selectedJob.company || 'Not specified'}
    />

    <JobInfoCard
      iconBg="bg-yellow-100"
      iconColor="text-yellow-600"
      icon={<Tag size={12} />}
      label="Job Type"
      value={Array.isArray(selectedJob.jobTypes) && selectedJob.jobTypes.length > 0 
        ? selectedJob.jobTypes.join(', ') 
        : (typeof selectedJob.jobTypes === 'string' ? selectedJob.jobTypes : 'Not specified')}
    />

    <JobInfoCard
      iconBg="bg-orange-100"
      iconColor="text-orange-600"
      icon={<Laptop size={12} />}
      label="Work Mode"
      value={selectedJob.workMode || 'Not specified'}
    />

    <JobInfoCard
      iconBg="bg-purple-100"
      iconColor="text-purple-600"
      icon={<MapPin size={12} />}
      label="Location"
      value={selectedJob.location || 'Not specified'}
    />

    <JobInfoCard
      iconBg="bg-red-100"
      iconColor="text-red-600"
      icon={<Calendar size={12} />}
      label="Deadline"
      value={selectedJob.deadline ? new Date(selectedJob.deadline).toLocaleDateString() : 'Not specified'}
    />

    <JobInfoCard
      iconBg="bg-indigo-100"
      iconColor="text-indigo-600"
      icon={<CalendarClock size={12} />}
      label="Interview Date"
      value={selectedJob.interviewDateTime ? new Date(selectedJob.interviewDateTime).toLocaleDateString() : 'Not scheduled'}
    />

    <JobInfoCard
      iconBg="bg-pink-100"
      iconColor="text-pink-600"
      icon={<CalendarCheck size={12} />}
      label="Joining Date"
      value={selectedJob.joiningDate ? new Date(selectedJob.joiningDate).toLocaleDateString() : 'Not specified'}
    />

    {selectedJob.jobTypes?.includes('Internship') && (
      <JobInfoCard
        iconBg="bg-teal-100"
        iconColor="text-teal-600"
        icon={<Clock size={12} />}
        label="Internship Duration"
        value={`${selectedJob.internshipDuration || 'Not specified'} Months`}
      />
    )}

    {/* Salary / Stipend */}
    <JobInfoCard
      iconBg="bg-green-100"
      iconColor="text-green-600"
      icon={<IndianRupee size={12} />}
      label={selectedJob.jobTypes?.includes('Internship') || (typeof selectedJob.jobTypes === 'string' && selectedJob.jobTypes.toLowerCase().includes('intern')) ? 'Stipend' : 'CTC'}
      value={
        selectedJob.jobTypes?.includes('Internship') || (typeof selectedJob.jobTypes === 'string' && selectedJob.jobTypes.toLowerCase().includes('intern'))
          ? (selectedJob.minSalary || selectedJob.maxSalary
              ? `₹${selectedJob.minSalary || '—'} - ₹${selectedJob.maxSalary || '—'}/${selectedJob.salaryUnit?.toLowerCase() === 'monthly' ? 'month' : selectedJob.salaryUnit}`
              : (selectedJob.salary ? `₹${selectedJob.salary}/${selectedJob.salaryUnit}` : 'Not specified'))
          : (selectedJob.minCtc || selectedJob.maxCtc
              ? `₹${selectedJob.minCtc || '—'} - ₹${selectedJob.maxCtc || '—'}/${selectedJob.ctcUnit?.toLowerCase() === 'yearly' ? 'year' : selectedJob.ctcUnit}`
              : (selectedJob.ctc ? `₹${selectedJob.ctc}/${selectedJob.ctcUnit}` : 'Not specified'))
      }
    />

    <JobInfoCard
      iconBg="bg-blue-100"
      iconColor="text-blue-600"
      icon={<ShieldCheck size={12} />}
      label="PPO Opportunity"
      value={selectedJob.ppoPportunity ? 'Yes' : 'No'}
    />
  </div>
</div>

              





              {/* Eligibility Criteria */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                  <CheckCircle size={20} className="mr-2 text-blue-600" />
                  Eligibility Criteria
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Minimum CGPA</p>
                    <p className="font-medium">{selectedJob.minCGPA || 'Not specified'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Gender Preference</p>
                    <p className="font-medium">{selectedJob.genderPreference || 'Any'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Maximum Current Arrears</p>
                    <p className="font-medium">{selectedJob.maxCurrentArrears || 'Not specified'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Maximum History Arrears</p>
                    <p className="font-medium">{selectedJob.maxHistoryArrears || 'Not specified'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Eligible Batches</p>
                    <p className="font-medium">{selectedJob.eligibleBatch && selectedJob.eligibleBatch.length > 0 
                      ? selectedJob.eligibleBatch.join(', ') 
                      : 'All batches'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Eligible Departments</p>
                    <p className="font-medium">{selectedJob.eligibleDepartments && selectedJob.eligibleDepartments.length > 0 
                      ? selectedJob.eligibleDepartments.join(', ') 
                      : 'All departments'}</p>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <p className="text-sm text-gray-500">Required Skills</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedJob.skills && selectedJob.skills.length > 0 ? 
                        selectedJob.skills.map((skill, index) => (
                          <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {skill}
                          </span>
                        )) : 
                        <p className="font-medium">None</p>
                      }
                    </div>
                  </div>
                  {selectedJob.skills && selectedJob.skills.length > 0 && studentProfile.skills && (
                    <div className="space-y-1 md:col-span-2">
                      <p className="text-sm text-gray-500">Your Skill Match</p>
                      <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                        <div 
                          className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${calculateSkillMatch(selectedJob)}%` }}
                        ></div>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{calculateSkillMatch(selectedJob)}% match</div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Hiring Workflow Rounds */}
              {selectedJob.rounds && selectedJob.rounds.length > 0 && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                    <Award size={20} className="mr-2 text-blue-600" />
                    Hiring Workflow
                  </h3>
                  <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-blue-200"></div>
                    
                    <div className="space-y-6 relative">
                      {selectedJob.rounds.map((round, index) => (
                        <div key={index} className="flex items-start ml-2">
                          <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-medium mr-4 z-10">
                            {index + 1}
                          </div>
                          <div className="bg-blue-50 rounded-lg p-4 flex-1">
                            <p className="font-medium text-blue-800">{round.name}</p>
                            {round.description && (
                              <p className="text-sm text-blue-700 mt-1">{round.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* File Attachments */}
              {selectedJob.attachments && selectedJob.attachments.length > 0 && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-xl font-semibold mb-4 text-gray-800">File Attachments</h3>
                  <div className="space-y-3">
                    {selectedJob.attachments.map((attachment, index) => (
                      <a 
                        key={index}
                        href={attachment.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        <span className="text-blue-600 font-medium">{attachment.name || 'Attachment'}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

               {/* External Resources */}
               {selectedJob.externalLinks && selectedJob.externalLinks.length > 0 && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                    <LinkIcon size={20} className="mr-2 text-blue-600" />
                    External Resources
                  </h3>
                  <div className="space-y-3">
                    {selectedJob.externalLinks.map((link, index) => (
                      <div key={index} className="p-3 border border-gray-200 rounded-lg flex items-center justify-between">
                        <div className="flex items-center">
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => handleLinkClick(link.url, link.mandatoryBeforeApply)}
                            className="text-blue-600 hover:underline font-medium flex items-center"
                          >
                            <LinkIcon size={16} className="mr-2" />
                            {link.label || 'External Link'}
                          </a>
                        </div>
                        {link.mandatoryBeforeApply && (
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${linkVisited[link.url] ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {linkVisited[link.url] ? 'Visited (Mandatory)' : 'Mandatory'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}






          
          {/* Description Tab */}
          {activeTab === 'description' && selectedJob.description && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Job Description</h3>
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: selectedJob.description }}
              />

              {selectedJob.instructions && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h4 className="text-lg font-semibold mb-3 text-gray-800">Additional Instructions</h4>
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedJob.instructions }}
                  />
                </div>
              )}
            </div>
          )}

          
          {/* Apply Tab - Screening Questions */}
          {activeTab === 'apply' && selectedJob.screeningQuestions && selectedJob.screeningQuestions.length > 0 && !isApplied && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-xl font-semibold mb-6 text-gray-800">Screening Questions</h3>
              <p className="text-gray-600 mb-6">Please answer all questions below to complete your application.</p>
              
              <div className="space-y-8">
                {selectedJob.screeningQuestions.map((question, index) => (
                  <div key={index} className="bg-gray-50 p-5 rounded-lg">
                    <div className="flex items-start mb-4">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-medium mr-3">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800 mb-1">{question.question}</h4>
                        <p className="text-sm text-gray-500 mb-4">Question Type: {question.type}</p>
                        {renderScreeningQuestion(question, index)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => handleApply(selectedJob.id)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center"
                >
                  <Send size={18} className="mr-2" />
                  Submit Application
                </button>
              </div>
            </div>
          )}
          
          {/* Your Answers Tab */}
          {activeTab === 'answers' && isApplied && selectedJob.screeningQuestions && selectedJob.screeningQuestions.length > 0 && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center mb-6">
                <CheckCircle size={24} className="text-green-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-800">Your Submitted Answers</h3>
              </div>
              
              <div className="space-y-6">
                {selectedJob.screeningQuestions.map((question, index) => (
                  <div key={index} className="bg-gray-50 p-5 rounded-lg">
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-medium mr-3">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 mb-1">{question.question}</h4>
                        <p className="text-sm text-gray-500 mb-3">Question Type: {question.type}</p>
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-500 mb-1">Your Answer:</p>
                          <p className="font-medium">
                            {applicationAnswers[selectedJob.id]?.[String(index)] || 'No answer provided'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-blue-800 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Application Status: <span className="font-medium ml-1">{applicationStatuses[selectedJob.id] || 'Pending'}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDetails;