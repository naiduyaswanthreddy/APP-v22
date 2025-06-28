import React, { useState,useRef , useEffect } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore'; // Add these imports
import { db } from '../../../firebase'; // Add this import

// Add this new component for truncated feedback display
const TruncatedFeedback = ({ text }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 150, height: 50 });
  const contentRef = useRef(null);

  const shouldTruncate = text && text.length > 12;
  const collapsedText = `${text.substring(0, 12)}...`;

  useEffect(() => {
    if (contentRef.current && isExpanded) {
      const { scrollHeight } = contentRef.current;
      setDimensions({
        width: 250, // Match `TruncatedAnswer` fixed expanded width
        height: scrollHeight + 2, // Height grows with content
      });
    } else {
      setDimensions({ width: 150, height: 50 });
    }
  }, [isExpanded, text]);

  if (!shouldTruncate) return <span>{text}</span>;

  return (
    <div className="relative">
      <div
        className="transition-all duration-300 ease-in-out rounded p-2 bg-gray-50 border overflow-hidden"
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          whiteSpace: 'normal',
        }}
      >
        <div ref={contentRef}>
          <span>{isExpanded ? text : collapsedText}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="ml-1 text-blue-500 text-xs hover:underline block mt-1"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        </div>
      </div>
    </div>
  );
};



// Add this new component for truncated answer display
const TruncatedAnswer = ({ text }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 150, height: 50 });
  const contentRef = useRef(null);

  const shouldTruncate = text && text.length > 10;
  const collapsedText = `${text.substring(0, 10)}...`;

  useEffect(() => {
    if (contentRef.current && isExpanded) {
      const { scrollWidth, scrollHeight } = contentRef.current;
      setDimensions({
        width: scrollWidth + 20, // +padding or safe space
        height: scrollHeight + 20, // +padding or safe space
      });
    } else if (!isExpanded) {
      setDimensions({ width: 150, height: 50 });
    }
  }, [isExpanded, text]);

  if (!shouldTruncate) return <span>{text}</span>;

  return (
    <div className="relative">
      <div
        className="transition-all duration-300 ease-in-out rounded p-2 bg-gray-50 border overflow-hidden"
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
        }}
      >
        <div ref={contentRef}>
          <span>{isExpanded ? text : collapsedText}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="ml-1 text-blue-500 text-xs hover:underline block mt-1"
          >
            {isExpanded ? 'Read less' : 'Read more'}
          </button>
        </div>
      </div>
    </div>
  );
};




const ApplicationsTable = ({
  loading,
  filteredApplications,
  selectedApplications,
  setSelectedApplications,
  handleStudentClick,
  statusConfig,
  openDropdownId,
  setOpenDropdownId,
  dropdownPosition,
  setDropdownPosition,
  handleStatusUpdate,
  handleSaveFeedback, // Keep this for backward compatibility
  setSelectedAnswers,
  setIsAnswersModalOpen
}) => {
  // Add state to manage feedback editing
  const [editingFeedbackId, setEditingFeedbackId] = useState(null);
  const [editingFeedbackValue, setEditingFeedbackValue] = useState('');
  const [savingFeedback, setSavingFeedback] = useState(false); // Add loading state

  // Add useEffect to log the prop when it changes
  useEffect(() => {
    console.log("ApplicationsTable: handleSaveFeedback prop value:", handleSaveFeedback);
    console.log("ApplicationsTable: handleSaveFeedback prop type:", typeof handleSaveFeedback);
  }, [handleSaveFeedback]); // Dependency array includes handleSaveFeedback

  // Add skill matching function
  const calculateSkillMatch = (studentSkills, jobSkills) => {
    // Early return 0 if either array is empty or not an array
    if (!studentSkills?.length || !jobSkills?.length) {
      return 0;
    }

    // Normalize skills for comparison
    const normalizedJobSkills = jobSkills.map(skill => skill.toLowerCase().trim());
    const normalizedStudentSkills = studentSkills.map(skill => skill.toLowerCase().trim());

    // Count matching skills
    const matchedSkills = normalizedJobSkills.filter(jobSkill =>
      normalizedStudentSkills.some(studentSkill =>
        studentSkill.includes(jobSkill) || jobSkill.includes(studentSkill)
      )
    );

    // Calculate percentage with safeguard against division by zero
    const totalJobSkills = normalizedJobSkills.length;
    return totalJobSkills > 0 ? Math.round((matchedSkills.length / totalJobSkills) * 100) : 0;
  };

  // Get screening questions from the first application's job data
  // Assuming all applications in filteredApplications are for the same job
  // Replace the current screeningQuestions code with this improved version
  // that handles the case when job data might not be available
  const [screeningQuestions, setScreeningQuestions] = useState([]);

  // Add this useEffect to fetch and set screening questions
  useEffect(() => {
    const fetchScreeningQuestions = async () => {
      if (filteredApplications.length > 0) {
        const firstApp = filteredApplications[0];
        
        // If the job data is already available, use it
        if (firstApp.job?.screeningQuestions) {
          setScreeningQuestions(firstApp.job.screeningQuestions);
          return;
        }
        
        // If not, try to fetch the job data
        if (firstApp.job_id) {
          try {
            const jobRef = doc(db, 'jobs', firstApp.job_id);
            const jobSnap = await getDoc(jobRef);
            
            if (jobSnap.exists()) {
              const jobData = jobSnap.data();
              if (jobData.screeningQuestions && jobData.screeningQuestions.length > 0) {
                console.log("Fetched screening questions:", jobData.screeningQuestions);
                setScreeningQuestions(jobData.screeningQuestions);
              }
            }
          } catch (error) {
            console.error("Error fetching job data:", error);
          }
        }
      }
    };
    
    fetchScreeningQuestions();
  }, [filteredApplications]);
  // Add console logs to debug screening questions
  useEffect(() => {
    console.log("Screening Questions:", screeningQuestions);
    console.log("First application:", filteredApplications[0]);
    console.log("First application job:", filteredApplications[0]?.job);
    if (filteredApplications.length > 0) {
      console.log("First application screening_answers:", filteredApplications[0].screening_answers);
    }
  }, [screeningQuestions, filteredApplications]);

  // Handler to start editing feedback
  const handleEditFeedback = (application) => {
    console.log("Starting to edit feedback for:", application.id);
    setEditingFeedbackId(application.id);
    setEditingFeedbackValue(application.feedback || ''); // Initialize with current feedback or empty string
  };

  // Handler to save feedback on blur (keeping for now, but consider removing if not needed)
  const handleBlurSaveFeedback = async (applicationId) => {
    if (editingFeedbackId === applicationId) {
      console.log("Saving feedback on blur:", applicationId, editingFeedbackValue);
      // We'll rely on the button click or Enter key for saving
      // If you need blur save, uncomment and adjust the logic below
      /*
      try {
        if (typeof handleSaveFeedback === 'function') {
          const success = await handleSaveFeedback(applicationId, editingFeedbackValue);
          if (success) {
            console.log("Feedback saved successfully to database on blur");
          } else {
            console.error("Failed to save feedback to database on blur");
          }
        } else {
          console.error("handleSaveFeedback is not a function on blur", handleSaveFeedback);
        }
        setEditingFeedbackId(null);
      } catch (error) {
        console.error("Error saving feedback on blur:", error);
        setEditingFeedbackId(null);
      }
      */
       setEditingFeedbackId(null); // Always reset editing state on blur
    }
  };

  // Handler to save feedback on button click
  // Handler to save feedback on button click
  const handleSaveButtonClick = async (applicationId) => {
    console.log("Save button clicked - ID:", applicationId, "Value:", editingFeedbackValue);
    console.log("Application object:", filteredApplications.find(app => app.id === applicationId));
    
    if (!editingFeedbackValue.trim()) {
      alert("Please enter feedback before saving.");
      return;
    }

    try {
      setSavingFeedback(true); // Set loading state
      
      // Implement direct saving functionality here
      // instead of relying on the passed handleSaveFeedback prop
      const applicationRef = doc(db, 'applications', applicationId);
      
      // Verify the document exists before updating
      const docSnap = await getDoc(applicationRef);
      
      if (!docSnap.exists()) {
        throw new Error(`Application document ${applicationId} does not exist`);
      }
      
      // Perform the update
      await updateDoc(applicationRef, {
        feedback: editingFeedbackValue
      });
      
      // Update the application in the local state
      const updatedApplications = filteredApplications.map(app => 
        app.id === applicationId ? { ...app, feedback: editingFeedbackValue } : app
      );
      
      // If there's a way to update the parent component's state, do it here
      // For now, we'll just update the local UI
      
      setEditingFeedbackId(null);
      setSavingFeedback(false); // Reset loading state
      alert("Feedback saved successfully!"); // Add confirmation for user
      
    } catch (error) {
      console.error("Error in handleSaveButtonClick:", error);
      setSavingFeedback(false); // Reset loading state
      alert(`Failed to save feedback: ${error.message}`);
    }
  };

  // Handler to save feedback on Enter key press
  const handleKeyPressSaveFeedback = async (e, applicationId) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent new line in input/textarea
      console.log("Enter key pressed, calling handleSaveButtonClick");
      await handleSaveButtonClick(applicationId); // Call the main save function
    }
  };


  return (
    <div className="mt-8 flex flex-col h-[calc(100vh-300px)]">
      <div className="overflow-x-auto w-full" style={{ maxWidth: '100%', position: 'relative', zIndex: 1 }}>
        <div className="inline-block min-w-full align-middle">
          <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="w-8 px-4 py-3 bg-teal-100">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      onChange={(e) => {
                        const allIds = filteredApplications.map(app => app.id);
                        setSelectedApplications(e.target.checked ? allIds : []);
                      }}
                      checked={selectedApplications.length === filteredApplications.length}
                    />
                  </th>
                  <th scope="col" className="w-40 px-4 py-3 text-left text-xs font-medium bg-teal-100 uppercase tracking-wider">Name</th>
                  <th scope="col" className="w-32 px-4 py-3 text-left text-xs font-medium bg-teal-100 uppercase tracking-wider">Roll No</th>
                  <th scope="col" className="w-20 px-4 py-3 text-center text-xs font-medium bg-teal-100 uppercase tracking-wider">Dept</th>
                  <th scope="col" className="w-16 px-4 py-3 text-center text-xs font-medium bg-teal-100 uppercase tracking-wider">CGPA</th>
                  <th scope="col" className="w-24 px-4 py-3 text-center text-xs font-medium bg-teal-100 uppercase tracking-wider">Match</th>
                  <th scope="col" className="w-24 px-4 py-3 text-center text-xs font-medium bg-teal-100 uppercase tracking-wider">Status</th>
                  <th scope="col" className="w-20 px-4 py-3 text-center text-xs font-medium bg-teal-100 uppercase tracking-wider">Actions</th>
                  <th scope="col" className="w-20 px-4 py-3 text-center text-xs font-medium bg-teal-100 uppercase tracking-wider">Resume</th>
                  <th scope="col" className="w-24 px-4 py-3 text-center text-xs font-medium bg-teal-100 uppercase tracking-wider">Predict</th>
                  {/* Add headers for screening questions - MOVED BEFORE FEEDBACK */}
                  {screeningQuestions.map((question, index) => {
                    console.log("Rendering question header:", question, index);
                    return (
                      <th key={`q-header-${index}`} scope="col" className="w-48 px-4 py-3 text-left text-xs font-medium bg-teal-100 uppercase tracking-wider">
                        {question.question}
                        <div className="text-xs font-normal normal-case text-gray-500">{question.type}</div>
                      </th>
                    );
                  })}
                  <th scope="col" className="w-32 px-4 py-3 text-left text-xs font-medium bg-teal-100 uppercase tracking-wider">Feedback</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApplications.map((application) => {
                  console.log("Rendering application row:", application.id);
                  console.log("Application screening_answers:", application.screening_answers);
                  return (
                    <tr key={application.id} className="hover:bg-gray-50">
                      {/* Checkbox */}
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                          checked={selectedApplications.includes(application.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            setSelectedApplications(
                              e.target.checked
                                ? [...selectedApplications, application.id]
                                : selectedApplications.filter(id => id !== application.id)
                            );
                          }}
                        />
                      </td>
                      {/* Name */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">

                          <div className="ml-0">
                            <div className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600"
                              onClick={() => handleStudentClick(application.student)}>
                              {application.student.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* Roll No */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-500">{application.student.rollNumber}</div>
                      </td>
                      {/* Department */}
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-900">{application.student.department}</div>
                      </td>
                      {/* CGPA */}
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex text-sm font-medium ${
                          parseFloat(application.student.cgpa) >= 8.0 ? 'text-green-600' :
                          parseFloat(application.student.cgpa) >= 7.0 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {parseFloat(application.student.cgpa).toFixed(1)}
                        </span>
                      </td>
                      {/* Skill Match */}
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        {(() => {
                          const matchPercentage = calculateSkillMatch(
                            application.student?.skills || [],
                            application.job?.requiredSkills || []
                          );
                          return (
                            <>
                              <div className="w-full bg-gray-200 rounded-full h-2.5" style={{ position: 'relative', zIndex: 10, overflow: 'visible' }}>
                                <div
                                  className={`h-2.5 rounded-full ${
                                    matchPercentage >= 70 ? 'bg-green-600' :
                                    matchPercentage >= 40 ? 'bg-yellow-600' :
                                    'bg-red-600'
                                  }`}
                                  style={{ width: `${matchPercentage}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-500 mt-1" style={{ display: 'block', marginTop: '4px' }}>
                                {matchPercentage}%
                              </span>
                            </>
                          );
                        })()}
                      </td>
                      {/* Status */}
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig[application.status]?.class || statusConfig.pending.class}`}>
                          {statusConfig[application.status]?.label || 'Pending'}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-4 whitespace-nowrap text-center relative">
                      <div className="relative inline-block text-left dropdown-container">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setDropdownPosition({
                              top: rect.bottom + window.scrollY,
                              left: rect.left + window.scrollX
                            });
                            setOpenDropdownId(openDropdownId === application.id ? null : application.id);
                          }}
                          className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-3 py-1 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                        >
                          Actions
                        </button>

                        {openDropdownId === application.id && (
                          <div
                            className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none z-50"
                            style={{
                              position: 'fixed',
                              top: `${dropdownPosition.top}px`,
                              left: `${dropdownPosition.left}px`
                            }}
                          >
                            <div className="py-1">
                              {Object.entries(statusConfig).map(([status, config]) => (
                                <button
                                  key={status}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusUpdate(application.id, status);
                                    setOpenDropdownId(null);
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <span className="mr-2">
                                    {status === 'underReview' && ''}
                                    {status === 'shortlisted' && ''}
                                    {status === 'onHold' && ''}
                                    {status === 'interview' && ''}
                                    {status === 'selected' && ''}
                                    {status === 'rejected' && ''}
                                  </span> {config.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                      {/* Resume */}
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        {application.student?.resumeUrl ? (
                          <a
                            href={application.student.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-gray-500">N/A</span>
                        )}
                      </td>

                      {/* Prediction */}
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">High</span>
                      </td>
                      
                      {/* Screening Questions Answers - MOVED BEFORE FEEDBACK */}
                      {screeningQuestions.map((question, index) => {
                        console.log("Rendering answer cell:", index, application.screening_answers?.[index]);
                        return (
                          <td key={`q-answer-${application.id}-${index}`} className="px-4 py-4 whitespace-normal text-sm text-gray-900">
                            {application.screening_answers?.[index] ? (
                              <TruncatedAnswer text={application.screening_answers[index]} />
                            ) : (
                              'N/A'
                            )}
                          </td>
                        );
                      })}
                      
                      {/* Feedback */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {editingFeedbackId === application.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingFeedbackValue}
                              onChange={(e) => setEditingFeedbackValue(e.target.value)}
                              onBlur={() => handleBlurSaveFeedback(application.id)}
                              onKeyPress={(e) => handleKeyPressSaveFeedback(e, application.id)}
                              className="text-sm text-gray-900 border rounded px-2 py-1 flex-1 min-w-[150px]"
                              placeholder="Enter feedback..."
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log("Save button clicked manually");
                                handleSaveButtonClick(application.id);
                              }}
                              className={`px-3 py-1 ${savingFeedback ? 'bg-gray-400' : 'bg-blue-600'} text-white text-xs rounded hover:bg-blue-700`}
                              disabled={savingFeedback}
                            >
                              {savingFeedback ? 'Saving...' : 'Save'}
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => handleEditFeedback(application)}
                            className="text-sm text-gray-500 cursor-pointer hover:text-gray-700"
                          >
                            {application.feedback ? (
                              <TruncatedFeedback text={application.feedback} />
                            ) : (
                              'Add feedback...'
                            )}
                          </div>
                        )}
                        {/* REMOVE THIS ENTIRE BLOCK BELOW */}
                        {/* openDropdownId === application.id && (
                          <div
                            className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none z-50"
                            style={{
                              position: 'fixed',
                              top: `${dropdownPosition.top}px`,
                              left: `${dropdownPosition.left}px`,
                              zIndex: 999 // Increase z-index to ensure visibility
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editingFeedbackValue}
                                onChange={(e) => setEditingFeedbackValue(e.target.value)}
                                onBlur={() => handleBlurSaveFeedback(application.id)}
                                onKeyPress={(e) => handleKeyPressSaveFeedback(e, application.id)}
                                className="text-sm text-gray-900 border rounded px-2 py-1 flex-1 min-w-[150px]"
                                placeholder="Enter feedback..."
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log("Save button clicked manually");
                                  handleSaveButtonClick(application.id);
                                }}
                                className={`px-3 py-1 ${savingFeedback ? 'bg-gray-400' : 'bg-blue-600'} text-white text-xs rounded hover:bg-blue-700`}
                                disabled={savingFeedback}
                              >
                                {savingFeedback ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          </div>
                        ) */}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationsTable;
