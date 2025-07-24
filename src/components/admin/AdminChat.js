import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom'; // Keep this for route compatibility
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Send, User, MessageSquare, Pin, Download, Filter, Search, X, Radio } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { CSVLink } from 'react-csv';

// In the AdminChat component, add a prop for onClose if needed
const AdminChat = ({ jobId: propJobId, onClose }) => {
  // Get jobId from either props or URL params
  const { jobId: paramJobId } = useParams();
  const jobId = propJobId || paramJobId;
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);
  // New state variables for enhanced features
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [messageFilter, setMessageFilter] = useState('all'); // 'all', 'admin', 'unread', 'questions'
  const [messageSearch, setMessageSearch] = useState('');
  const [showAllParticipants, setShowAllParticipants] = useState(false);
  const [applications, setApplications] = useState([]);
  const [isBroadcastMode, setIsBroadcastMode] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastMode, setBroadcastMode] = useState(false);

  useEffect(() => {
    console.log('AdminChat mounted with jobId:', jobId);
    if (jobId) {
      fetchStudentsWithChats();
    } else {
      setLoading(false);
      setError('No job ID provided. Please select a job.');
    }
    
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [jobId]); // Add jobId to the dependency array

  const fetchApplications = async () => {
    if (!jobId) return;
    
    try {
      const applicationsRef = collection(db, 'applications');
      const q = query(applicationsRef, where('jobId', '==', jobId));
      const snapshot = await getDocs(q);
      
      const applicationsData = [];
      snapshot.forEach(doc => {
        applicationsData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setApplications(applicationsData);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const fetchPinnedMessages = async () => {
    if (!jobId) return;
    
    try {
      const pinnedRef = collection(db, 'pinnedMessages');
      const q = query(pinnedRef, where('jobId', '==', jobId));
      const snapshot = await getDocs(q);
      
      const pinnedData = [];
      snapshot.forEach(doc => {
        pinnedData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setPinnedMessages(pinnedData);
    } catch (error) {
      console.error('Error fetching pinned messages:', error);
    }
  };

  const fetchStudentsWithChats = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching students with chats for jobId:', jobId);
      
      if (!jobId) {
        throw new Error('No job ID provided');
      }
      
      // First, get all chat messages for the current job
      const messagesRef = collection(db, 'jobChats');
      const q = query(messagesRef, where('jobId', '==', jobId));
      
      const messagesSnapshot = await getDocs(q);
      console.log('Messages snapshot size:', messagesSnapshot.size);
      
      // Create sets to track unique student and job IDs
      const studentIds = new Set();
      const jobIds = new Set();
      
      // Extract unique student and job IDs from messages
      messagesSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.studentId) studentIds.add(data.studentId);
        if (data.jobId) jobIds.add(data.jobId);
      });
      
      console.log('Found student IDs:', Array.from(studentIds));
      console.log('Found job IDs:', Array.from(jobIds));
      
      const studentsData = [];
      const jobsData = new Map();
      
      // If no students found in messages, try to get all students who applied for this job
      if (studentIds.size === 0) {
        console.log('No students found in messages, checking applications...');
        const applicationsRef = collection(db, 'applications');
        const appQuery = query(applicationsRef, where('jobId', '==', jobId));
        const appSnapshot = await getDocs(appQuery);
        
        appSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.studentId) studentIds.add(data.studentId);
        });
        
        console.log('Found student IDs from applications:', Array.from(studentIds));
      }
      
      // Always add the current job ID
      if (jobId) jobIds.add(jobId);
      
      // Fetch student data
      for (const studentId of studentIds) {
        try {
          const studentRef = doc(db, 'students', studentId);
          const studentSnap = await getDoc(studentRef);
          
          if (studentSnap.exists()) {
            const studentData = studentSnap.data();
            
            // Add student with their messages
            studentsData.push({
              id: studentId,
              name: studentData.name || 'Unknown Student',
              email: studentData.email || '',
              rollNumber: studentData.rollNumber || '',
              jobId: jobId, // Use the current jobId
              hasUnreadMessages: false
            });
          } else {
            console.log('Student document does not exist for ID:', studentId);
          }
        } catch (studentError) {
          console.error('Error fetching student data:', studentError);
        }
      }
      
      // Fetch job data
      for (const jobId of jobIds) {
        try {
          const jobRef = doc(db, 'jobs', jobId);
          const jobSnap = await getDoc(jobRef);
          
          if (jobSnap.exists()) {
            const jobData = jobSnap.data();
            
            jobsData.set(jobId, {
              id: jobId,
              ...jobData,
              position: jobData.position || 'Unknown Position',
              company: jobData.company || 'Unknown Company'
            });
          } else {
            console.log('Job document does not exist for ID:', jobId);
            // Add a placeholder job if the actual job doesn't exist
            jobsData.set(jobId, {
              id: jobId,
              position: 'Unknown Position',
              company: 'Unknown Company'
            });
          }
        } catch (jobError) {
          console.error('Error fetching job data:', jobError);
        }
      }
      
      console.log('Setting students:', studentsData);
      console.log('Setting jobs:', Array.from(jobsData.values()));
      
      setStudents(studentsData);
      setJobs(Array.from(jobsData.values()));
      
      if (studentsData.length === 0) {
        setError('No students found with chats for this job.');
      }
    } catch (error) {
      console.error('Error fetching students with chats:', error);
      setError('Failed to load chat data: ' + error.message);
      toast.error('Failed to load chat data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Add the missing selectStudentAndJob function
  const selectStudentAndJob = (student) => {
    // Unsubscribe from previous listener if exists
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }
    
    setSelectedStudent(student);
    const job = jobs.find(j => j.id === student.jobId);
    setSelectedJob(job);
    loadMessages(student.jobId, student.id);
  };

  const loadMessages = (jobId, studentId) => {
    try {
      console.log('Loading messages for jobId:', jobId, 'studentId:', studentId);
      
      if (!jobId || !studentId) {
        console.error('Missing jobId or studentId for loading messages');
        return;
      }
      
      const messagesRef = collection(db, 'jobChats');
      const q = query(
        messagesRef,
        where('jobId', '==', jobId),
        where('studentId', '==', studentId),
        orderBy('timestamp', 'asc')
      );
      
      // Set up real-time listener
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const messagesData = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          console.log('Message data:', data); // Debug log
          messagesData.push({ id: doc.id, ...data });
        });
        console.log('Total messages loaded:', messagesData.length);
        setMessages(messagesData);
        
        // Mark messages as read if needed
        if (selectedStudent && selectedStudent.hasUnreadMessages) {
          updateDoc(doc(db, 'applications', selectedStudent.applicationId), {
            hasUnreadMessages: false
          });
        }
      }, (error) => {
        console.error('Error in messages listener:', error);
        toast.error('Error loading messages: ' + error.message);
      });
      
      // Store the unsubscribe function
      unsubscribeRef.current = unsubscribe;
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages: ' + error.message);
    }
  };

  // Update the sendMessage function to handle broadcast mode
  const sendMessage = async () => {
    if (isBroadcastMode) {
      await sendBroadcastMessage();
      return;
    }
    
    if (!newMessage.trim() || !selectedStudent || !selectedJob) {
      console.log('Cannot send message:', { 
        messageEmpty: !newMessage.trim(), 
        studentMissing: !selectedStudent, 
        jobMissing: !selectedJob 
      });
      return;
    }
    
    try {
      console.log('Sending message to student:', selectedStudent.id, 'for job:', selectedJob.id);
      const messagesRef = collection(db, 'jobChats');
      const messageData = {
        jobId: selectedJob.id,
        studentId: selectedStudent.id,
        senderName: 'Admin',
        senderRole: 'admin',
        message: newMessage.trim(),
        timestamp: serverTimestamp(),
        isRead: false
      };
      console.log('Message data to send:', messageData);
      
      await addDoc(messagesRef, messageData);
      console.log('Message sent successfully');
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message: ' + error.message);
    }
  };

  // Add a new function to send broadcast messages
  const sendBroadcastMessage = async () => {
    if (!newMessage.trim() || !selectedJob) {
      console.log('Cannot send broadcast message:', { 
        messageEmpty: !newMessage.trim(), 
        jobMissing: !selectedJob 
      });
      return;
    }
    
    try {
      console.log('Sending broadcast message for job:', selectedJob.id);
      const messagesRef = collection(db, 'jobChats');
      
      // Get all students who have applied for this job
      const applicationsRef = collection(db, 'applications');
      const q = query(applicationsRef, where('jobId', '==', selectedJob.id));
      const applicationsSnapshot = await getDocs(q);
      
      if (applicationsSnapshot.empty) {
        toast.warning('No students found for this job');
        return;
      }
      
      // Send the message to each student
      const batch = [];
      applicationsSnapshot.forEach((doc) => {
        const application = doc.data();
        const messageData = {
          jobId: selectedJob.id,
          studentId: application.studentId,
          senderName: 'Admin (Broadcast)',
          senderRole: 'admin',
          message: newMessage.trim(),
          timestamp: serverTimestamp(),
          isRead: false,
          isBroadcast: true  // Flag to identify broadcast messages
        };
        batch.push(addDoc(messagesRef, messageData));
        
        // Mark that the student has unread messages
        updateDoc(doc.ref, { hasUnreadMessages: true });
      });
      
      await Promise.all(batch);
      console.log('Broadcast message sent successfully to', batch.length, 'students');
      toast.success(`Broadcast message sent to ${batch.length} students`);
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending broadcast message:', error);
      toast.error('Failed to send broadcast message: ' + error.message);
    }
  };

  // Add the missing filteredStudents variable
  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add a new useEffect to handle URL jobId
  useEffect(() => {
    if (jobId && students.length > 0 && jobs.length > 0) {
      // Find students who have chats for this job
      const studentsForJob = students.filter(student => student.jobId === jobId);
      if (studentsForJob.length > 0) {
        // Select the first student with this job
        selectStudentAndJob(studentsForJob[0]);
      } else {
        console.log('No students found with chats for this job');
        setError(`No students have joined the chat for this job yet.`);
      }
    }
  }, [jobId, students, jobs]);

  return (
    <div className="p-4">
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-4">Job Application Chats</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
          <button 
            onClick={fetchStudentsWithChats}
            className="mt-2 bg-red-500 text-white px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
      )}
      
      <div className="flex h-[calc(100vh-200px)] bg-white rounded-lg shadow-md overflow-hidden">
        {/* Students List */}
        <div className="w-1/3 border-r">
          <div className="p-3 border-b">
            <input
              type="text"
              placeholder="Search students..."
              className="w-full p-2 border rounded"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="overflow-y-auto h-[calc(100%-56px)]">
            {/* Conditional rendering for students list */}
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2">Loading chats for job: {jobId}</p>
                </div>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center p-4 text-gray-500">
                No students with active chats found
              </div>
            ) : (
              filteredStudents.map(student => (
                <div
                  key={`${student.id}-${student.jobId}`}
                  className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                    selectedStudent && selectedStudent.id === student.id && selectedStudent.jobId === student.jobId
                      ? 'bg-blue-50'
                      : ''
                  }`}
                  onClick={() => selectStudentAndJob(student)}
                >
                  <div className="flex items-center">
                    <div className="bg-gray-200 rounded-full p-2 mr-3">
                      <User size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h3 className="font-medium">{student.name}</h3>
                        {student.hasUnreadMessages && (
                          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{student.rollNumber}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {jobs.find(j => j.id === student.jobId)?.position || 'Unknown Position'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedStudent && selectedJob ? (
            <>
              <div className="p-3 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="font-medium">{selectedStudent.name}</h2>
                    <p className="text-sm text-gray-500">
                      {selectedJob.position} at {selectedJob.company}
                    </p>
                  </div>
                  <div className="flex items-center">
                    {/* <button 
                      onClick={() => setIsBroadcastMode(!isBroadcastMode)}
                      className={`flex items-center px-3 py-1 rounded text-sm ${isBroadcastMode ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                      <Radio size={16} className="mr-1" />
                      {isBroadcastMode ? 'Broadcasting' : 'Broadcast Mode'}
                    </button> */}
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <MessageSquare size={48} className="mb-2 opacity-50" />
                    <p>No messages yet</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    console.log('Rendering message:', msg); // Debug log
                    return (
                      <div
                        key={msg.id}
                        className={`mb-4 max-w-[80%] ${
                          msg.senderRole === 'admin'
                            ? msg.isBroadcast 
                              ? 'ml-auto bg-red-500 text-white rounded-tl-lg rounded-tr-lg rounded-bl-lg'
                              : 'ml-auto bg-blue-500 text-white rounded-tl-lg rounded-tr-lg rounded-bl-lg'
                            : 'mr-auto bg-gray-200 text-gray-800 rounded-tl-lg rounded-tr-lg rounded-br-lg'
                        } p-3`}
                      >
                        <div className="text-sm font-medium mb-1">{msg.senderName || 'Unknown'}</div>
                        <div>{msg.message}</div>
                        <div className="text-xs mt-1 opacity-70">
                          {msg.timestamp ? new Date(msg.timestamp.seconds * 1000).toLocaleString() : 'Sending...'}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              
              <div className="p-3 border-t">
                {isBroadcastMode && (
                  <div className="mb-2 bg-red-50 p-2 rounded text-sm text-red-700 flex items-center">
                    <Radio size={16} className="mr-1" />
                    <span>Broadcast Mode: Your message will be sent to all students for this job</span>
                  </div>
                )}
                <div className="flex">
                  <input
                    type="text"
                    placeholder={isBroadcastMode ? "Type a broadcast message..." : "Type a message..."}
                    className={`flex-1 p-2 border rounded-l ${isBroadcastMode ? 'border-red-300 bg-red-50' : ''}`}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <button
                    className={`${isBroadcastMode ? 'bg-red-500' : 'bg-blue-500'} text-white p-2 rounded-r`}
                    onClick={sendMessage}
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <MessageSquare size={64} className="mb-4 opacity-50" />
              <p className="text-xl">Select a student to view the conversation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to get status color
const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'shortlisted':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'withdrawn':
      return 'bg-gray-100 text-gray-800';
    case 'interviewed':
      return 'bg-purple-100 text-purple-800';
    case 'offered':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-yellow-100 text-yellow-800'; // Applied (default)
  }
};

export default AdminChat;