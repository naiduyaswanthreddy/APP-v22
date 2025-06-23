import React, { useState, useEffect, useRef } from 'react';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { collection, addDoc, serverTimestamp, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';

const SKILL_SUGGESTIONS = [
  // Programming Languages
  "JavaScript", "TypeScript", "Python", "Java", "C++", "C", "C#", "Go", "Rust", "Kotlin", "Swift", "PHP", "Ruby", "Dart", "Scala", "R",
  // Frontend Technologies
  "HTML", "CSS", "React", "Angular", "Vue.js", "Svelte", "Next.js", "Bootstrap", "Tailwind",
  // Backend Technologies
  "Node.js", "Express", "Django", "Flask", "Spring", "Laravel", "ASP.NET",
  // Databases
  "MongoDB", "MySQL", "PostgreSQL", "SQLite", "Redis", "Oracle", "Firebase",
  // Other Skills
  "Git", "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Linux", "DevOps"
];

// Add this constant for location suggestions
const LOCATION_SUGGESTIONS = [
  "Remote", "Hybrid", "Multiple Locations",
  // Major Indian Cities
  "Bangalore", "Mumbai", "Delhi", "Hyderabad", "Chennai", "Pune", "Kolkata", 
  "Ahmedabad", "Gurgaon", "Noida", "Coimbatore", "Kochi", "Trivandrum"
];

const JobPost = () => {
  const locationInputRef = useRef(null);

  // Add suggestions state
  const [suggestions, setSuggestions] = useState({
    companies: [],
    positions: [],
    rounds: []
  });

  // Add suggestions fetch effect
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const jobsSnapshot = await getDocs(collection(db, 'jobs'));
        const companies = new Set();
        const positions = new Set();
        const rounds = new Set();

        jobsSnapshot.forEach(doc => {
          const data = doc.data();
          companies.add(data.company);
          positions.add(data.position);
          data.rounds.forEach(round => rounds.add(round.name));
        });

        setSuggestions({
          companies: Array.from(companies),
          positions: Array.from(positions),
          rounds: Array.from(rounds)
        });
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    };

    fetchSuggestions();
  }, []);

  useEffect(() => {
    if (window.google && locationInputRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(locationInputRef.current);
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        setJobForm(prev => ({
          ...prev,
          location: place.formatted_address
        }));
      });
    }
  }, []);

  const [jobForm, setJobForm] = useState({
    company: '',
    position: '',
    description: '',
    minCGPA: 0,
    maxCurrentArrears: 0,
    maxHistoryArrears: 0,
    genderPreference: 'any',
    jobTypes: [],
    skills: [],
    newSkill: '',
    eligibleBatch: [],
    location: '',
    salary: '',
    deadline: '',
    interviewDateTime: '',
    instructions: '',
    rounds: [{ name: '' }],
    screeningQuestions: [{ question: '', type: 'text', options: [] }],
    // Add these new fields
    attachments: [],
    newAttachmentName: '',
    newAttachmentLink: ''
  });

  const jobTypeOptions = [
    'Full-time', 'Part-time', 'Internship', 'Remote', 'Hybrid', 
    'Contract', 'Freelance', 'Temporary', 'Work from Home (WFH)', 
    'On-site', 'Apprenticeship', 'Trainee / Graduate Role', 'Volunteer'
  ];

  const handleJobTypeChange = (type) => {
    setJobForm(prev => ({
      ...prev,
      jobTypes: prev.jobTypes.includes(type) 
        ? prev.jobTypes.filter(t => t !== type)
        : [...prev.jobTypes, type]
    }));
  };

  const addRound = () => {
    setJobForm(prev => ({
      ...prev,
      rounds: [...prev.rounds, { name: '' }]
    }));
  };

  const addQuestion = () => {
    setJobForm(prev => ({
      ...prev,
      screeningQuestions: [...prev.screeningQuestions, { question: '', type: 'text', options: [] }]
    }));
  };

  const addSkill = () => {
    if (jobForm.newSkill.trim()) {
      setJobForm(prev => ({
        ...prev,
        skills: [...prev.skills, prev.newSkill.trim()],
        newSkill: ''
      }));
    }
  };

  const createNotificationsForJob = async (jobId, jobData) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user found');
      }

      const notificationData = {
        type: 'job',
        title: `New Job Opening: ${jobData.position} at ${jobData.company}`,
        message: `A new job opportunity is available for ${jobData.position} at ${jobData.company}. 
                Salary: ${jobData.salary}
                Location: ${jobData.location}
                Deadline: ${new Date(jobData.deadline).toLocaleDateString()}`,
        recipientType: 'student',
        isGeneral: true,
        timestamp: serverTimestamp(),
        read: false,
        actionUrl: `/student/jobs/${jobId}`,
        jobId: jobId,
        company: jobData.company,
        position: jobData.position,
        createdAt: serverTimestamp(),
        createdBy: user.uid
      };

      // Create notification
      const notificationRef = await addDoc(collection(db, 'notifications'), notificationData);
      console.log('Notification created:', notificationRef.id, notificationData);
  
      return notificationRef;
    } catch (error) {
      console.error('Error in createNotificationsForJob:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (!jobForm.company || !jobForm.position || !jobForm.description) {
        toast.error('Please fill in all required fields');
        return;
      }

      const jobData = {
        ...jobForm,
        createdAt: serverTimestamp(),
        status: 'active',
        applications: 0,
        createdBy: auth.currentUser?.uid // Add creator ID
      };

      // Remove temporary fields
      delete jobData.newSkill;
      delete jobData.newAttachmentName;
      delete jobData.newAttachmentLink;

      // Create job first
      const docRef = await addDoc(collection(db, 'jobs'), jobData);
      console.log('Job created with ID:', docRef.id);

      // Create notification
      await createNotificationsForJob(docRef.id, jobData);
      
      toast.success('Job posted successfully with notifications!');
      
      // Reset form
      setJobForm({
        company: '',
        position: '',
        description: '',
        maxCurrentArrears: 0,
        maxHistoryArrears: 0,
        genderPreference: 'any',
        jobTypes: [],
        instructions: '',
        rounds: [{ name: '' }],
        screeningQuestions: [{ question: '', type: 'text', options: [] }],
        skills: [],
        newSkill: '',
        eligibleBatch: [],
        location: '',
        salary: '',
        deadline: '',
        interviewDateTime: '',
        attachments: [],
        newAttachmentName: '',
        newAttachmentLink: ''
      });
    } catch (error) {
      console.error('Error posting job:', error);
      toast.error('Failed to post job');
    }
  };

  return (
    <div className="max-w-6.5xl mx-auto p-8 bg-white rounded-lg shadow-lg">
      <ToastContainer />
      <h2 className="text-3xl font-bold text-gray-800 mb-8 border-b pb-4">Post New Job Opportunity</h2>
      
      <div className="space-y-8">
        {/* Basic Info - Card Style */}
        <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold text-gray-700 mb-4 pl-4 border-l-4 border-blue-500 flex items-center">
            Basic Information
          </h3>
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Company Name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                value={jobForm.company}
                onChange={e => setJobForm({...jobForm, company: e.target.value})}
                list="company-suggestions"
              />
              <datalist id="company-suggestions">
                {suggestions.companies.map((company, index) => (
                  <option key={index} value={company} />
                ))}
              </datalist>
            </div>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Position"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                value={jobForm.position}
                onChange={e => setJobForm({...jobForm, position: e.target.value})}
                list="position-suggestions"
              />
              <datalist id="position-suggestions">
                {suggestions.positions.map((position, index) => (
                  <option key={index} value={position} />
                ))}
              </datalist>
            </div>
            
            <textarea
              placeholder="Job Description"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              rows="4"
              value={jobForm.description}
              onChange={e => setJobForm({...jobForm, description: e.target.value})}
            />
          </div>
        </div>
    
        {/* Academic Requirements - Card Style */}
        <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold text-gray-700 mb-4 pl-4 border-l-4 border-blue-500 flex items-center">
        Academic Requirements</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum CGPA</label>
              <input
                type="number"
                min="0"
                max="10"
                step="0.01"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                value={jobForm.minCGPA}
                onChange={e => setJobForm({...jobForm, minCGPA: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Current Arrears</label>
              <input
                type="number"
                min="0"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                value={jobForm.maxCurrentArrears}
                onChange={e => setJobForm({...jobForm, maxCurrentArrears: parseInt(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max History Arrears</label>
              <input
                type="number"
                min="0"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                value={jobForm.maxHistoryArrears}
                onChange={e => setJobForm({...jobForm, maxHistoryArrears: parseInt(e.target.value)})}
              />
            </div>
          </div>
        </div>
    
        {/* Job Details - Card Style */}
        <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold text-gray-700 mb-4 pl-4 border-l-4 border-blue-500 flex items-center">
            Job Details
          </h3>
          
          {/* Location and Salary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  value={jobForm.location}
                  onChange={e => setJobForm({...jobForm, location: e.target.value})}
                  placeholder="e.g., Bangalore, Remote"
                  list="location-suggestions"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">📍</span>
                <datalist id="location-suggestions" className="bg-white w-full border rounded-lg shadow-lg">
                  {LOCATION_SUGGESTIONS.map((location, index) => (
                    <option key={index} value={location} className="p-2 hover:bg-gray-100 cursor-pointer" />
                  ))}
                </datalist>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {['Remote', 'Hybrid', 'On-site'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setJobForm({...jobForm, location: type})}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition"
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salary/Stipend</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                value={jobForm.salary}
                onChange={e => setJobForm({...jobForm, salary: e.target.value})}
                placeholder="e.g., ₹50,000/month"
              />
            </div>
          </div>
    
          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Application Deadline</label>
              <input
                type="datetime-local"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                value={jobForm.deadline}
                onChange={e => setJobForm({...jobForm, deadline: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Interview Date & Time</label>
              <input
                type="datetime-local"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                value={jobForm.interviewDateTime}
                onChange={e => setJobForm({...jobForm, interviewDateTime: e.target.value})}
              />
            </div>
          </div>
    
          {/* Gender Preference */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender Preference</label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              value={jobForm.genderPreference}
              onChange={e => setJobForm({...jobForm, genderPreference: e.target.value})}
            >
              <option value="any">Any</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
    
          {/* Eligible Batch */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Eligible Batch</label>
            <div className="flex flex-wrap gap-3 max-h-48 overflow-y-auto p-2">
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                <label key={year} className="inline-flex items-center px-4 py-2 border rounded-full cursor-pointer transition-colors duration-200 ease-in-out hover:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={jobForm.eligibleBatch.includes(year)}
                    onChange={() => {
                      const newBatch = jobForm.eligibleBatch.includes(year)
                        ? jobForm.eligibleBatch.filter(y => y !== year)
                        : [...jobForm.eligibleBatch, year];
                      setJobForm({...jobForm, eligibleBatch: newBatch});
                    }}
                    className="mr-2 rounded"
                  />
                  <span>{year}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
    
        {/* Job Type - Card Style */}
        <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
           <h3 className="text-xl font-semibold text-gray-700 mb-4 pl-4 border-l-4 border-blue-500 flex items-center">
        Job Type</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {jobTypeOptions.map(type => (
              <label key={type} className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors duration-200 ${jobForm.jobTypes.includes(type) ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-100'}`}>
                <input
                  type="checkbox"
                  checked={jobForm.jobTypes.includes(type)}
                  onChange={() => handleJobTypeChange(type)}
                  className="rounded text-blue-600"
                />
                <span>{type}</span>
              </label>
            ))}
          </div>
        </div>
    
        {/* Skills - Card Style */}
        <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold text-gray-700 mb-4 pl-4 border-l-4 border-blue-500 flex items-center">
        Required Skills</h3>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Add a skill"
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              value={jobForm.newSkill}
              onChange={e => setJobForm({...jobForm, newSkill: e.target.value})}
              list="skill-suggestions"
            />
            <datalist id="skill-suggestions">
              {SKILL_SUGGESTIONS.map((skill, index) => (
                <option key={index} value={skill} />
              ))}
            </datalist>
            <button
              onClick={addSkill}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {jobForm.skills.map((skill, index) => (
              <span key={index} className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full">
                {skill}
                <button 
                  className="ml-2 text-blue-600 hover:text-blue-800"
                  onClick={() => {
                    const newSkills = [...jobForm.skills];
                    newSkills.splice(index, 1);
                    setJobForm({...jobForm, skills: newSkills});
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
    
        {/* Instructions - Card Style */}
        <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold text-gray-700 mb-4 pl-4 border-l-4 border-blue-500 flex items-center">
        Instructions to Applicants</h3>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-gray-300 transition"
            rows="4"
            value={jobForm.instructions}
            onChange={e => setJobForm({...jobForm, instructions: e.target.value})}
            placeholder="Enter instructions for applicants..."
          />
        </div>
    
        {/* Hiring Rounds - Card Style */}
        <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold text-gray-700 mb-4 pl-4 border-l-4 border-blue-500 flex items-center">
        Hiring Workflow Rounds</h3>
          <div className="space-y-3 mb-4">
            {jobForm.rounds.map((round, index) => (
              <div key={index} className="flex gap-2 items-center">
                <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                  {index + 1}
                </div>
                <input
                  type="text"
                  placeholder={`Round ${index + 1} Name`}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  value={round.name}
                  onChange={e => {
                    const newRounds = [...jobForm.rounds];
                    newRounds[index].name = e.target.value;
                    setJobForm({...jobForm, rounds: newRounds});
                  }}
                  list="round-suggestions"
                />
                <datalist id="round-suggestions">
                  {suggestions.rounds.map((roundName, idx) => (
                    <option key={idx} value={roundName} />
                  ))}
                </datalist>
                {index > 0 && (
                  <button
                    onClick={() => {
                      const newRounds = [...jobForm.rounds];
                      newRounds.splice(index, 1);
                      setJobForm({...jobForm, rounds: newRounds});
                    }}
                    className="p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-100"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={addRound}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
          >
            <span>+</span> Add Round
          </button>
        </div>
    
        {/* Screening Questions - Card Style */}
        <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold text-gray-700 mb-4 pl-4 border-l-4 border-blue-500 flex items-center">
        Screening Questions</h3>
          <div className="space-y-4 mb-4">
            {jobForm.screeningQuestions.map((q, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Question {index + 1}</h4>
                  {index > 0 && (
                    <button
                      onClick={() => {
                        const newQuestions = [...jobForm.screeningQuestions];
                        newQuestions.splice(index, 1);
                        setJobForm({...jobForm, screeningQuestions: newQuestions});
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Question"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    value={q.question}
                    onChange={e => {
                      const newQuestions = [...jobForm.screeningQuestions];
                      newQuestions[index].question = e.target.value;
                      setJobForm({...jobForm, screeningQuestions: newQuestions});
                    }}
                  />
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    value={q.type}
                    onChange={e => {
                      const newQuestions = [...jobForm.screeningQuestions];
                      newQuestions[index].type = e.target.value;
                      setJobForm({...jobForm, screeningQuestions: newQuestions});
                    }}
                  >
                    <option value="text">Text Input</option>
                    <option value="yesno">Yes/No</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={addQuestion}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
          >
            <span>+</span> Add Question
          </button>
        </div>
    
        {/* Add this section before the Submit Button */}
        <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold text-gray-700 mb-4 pl-4 border-l-4 border-blue-500 flex items-center">
        File Attachments</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="File Name (e.g., JD Document)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                value={jobForm.newAttachmentName}
                onChange={e => setJobForm({...jobForm, newAttachmentName: e.target.value})}
              />
              <input
                type="text"
                placeholder="File URL"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                value={jobForm.newAttachmentLink}
                onChange={e => setJobForm({...jobForm, newAttachmentLink: e.target.value})}
              />
            </div>
            <button
              onClick={() => {
                if (jobForm.newAttachmentName && jobForm.newAttachmentLink) {
                  setJobForm(prev => ({
                    ...prev,
                    attachments: [...prev.attachments, {
                      name: prev.newAttachmentName.trim(),
                      link: prev.newAttachmentLink.trim()
                    }],
                    newAttachmentName: '',
                    newAttachmentLink: ''
                  }));
                } else {
                  toast.error('Please provide both file name and URL');
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Add File
            </button>
    
            {jobForm.attachments.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Added Files:</h4>
                <div className="space-y-2">
                  {jobForm.attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                      <div className="flex items-center">
                        <span className="text-blue-600 mr-2">📎</span>
                        <a 
                          href={file.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {file.name}
                        </a>
                      </div>
                      <button
                        onClick={() => {
                          const newAttachments = [...jobForm.attachments];
                          newAttachments.splice(index, 1);
                          setJobForm({...jobForm, attachments: newAttachments});
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
    
        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          className="w-full py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition shadow-md"
        >
          Post Job
        </button>
      </div>
    </div>
  );
};

export default JobPost;