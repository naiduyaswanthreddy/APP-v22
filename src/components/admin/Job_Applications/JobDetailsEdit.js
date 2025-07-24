import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { toast } from "react-toastify";

// Destructure props correctly
const JobDetailsEdit = ({ job, setEditMode, onSaveSuccess }) => {
  // Use local state for form data, initialized from the 'job' prop
  // Update the initial state to include new fields
  const [formData, setFormData] = useState({
    company: '',
    position: '',
    description: '',
    minCGPA: '',
    maxCurrentArrears: '',
    maxHistoryArrears: '',
    eligibleBatch: [],
    eligibleDepartments: [],
    location: '',
    salary: '',
    ctc: '', // New field for full-time compensation
    deadline: '',
    interviewDateTime: '',
    joiningDate: '', // New field for joining date
    genderPreference: 'Any',
    jobTypes: [], // Changed from jobType to jobTypes array
    workMode: '', // New field for work mode
    ppoPportunity: false, // New field for PPO opportunity
    internshipDuration: '', // New field for internship duration
    experience: '',
    instructions: '',
    skills: [],
    rounds: [],
    screeningQuestions: [],
    attachments: []
  });
  
  // Update the useEffect to initialize all fields from job data
  useEffect(() => {
    if (job) {
      setFormData({
        company: job.company || '',
        position: job.position || '',
        description: job.description || '',
        minCGPA: job.minCGPA || '',
        maxCurrentArrears: job.maxCurrentArrears || '',
        maxHistoryArrears: job.maxHistoryArrears || '',
        eligibleBatch: Array.isArray(job.eligibleBatch) ? job.eligibleBatch : [],
        eligibleDepartments: Array.isArray(job.eligibleDepartments) ? job.eligibleDepartments : [],
        location: job.location || '',
        salary: job.salary || '',
        ctc: job.ctc || '',
        deadline: job.deadline ? new Date(job.deadline).toISOString().split('.')[0] : '',
        interviewDateTime: job.interviewDateTime ? new Date(job.interviewDateTime).toISOString().split('.')[0] : '',
        joiningDate: job.joiningDate ? new Date(job.joiningDate).toISOString().split('.')[0] : '',
        genderPreference: job.genderPreference || 'Any',
        jobTypes: Array.isArray(job.jobTypes) ? job.jobTypes : [],
        workMode: job.workMode || '',
        ppoPportunity: job.ppoPportunity || false,
        internshipDuration: job.internshipDuration || '',
        experience: job.experience || '',
        instructions: job.instructions || '',
        skills: Array.isArray(job.skills) ? job.skills : [],
        rounds: Array.isArray(job.rounds) ? job.rounds : [],
        screeningQuestions: Array.isArray(job.screeningQuestions) ? job.screeningQuestions : [],
        attachments: Array.isArray(job.attachments) ? job.attachments : []
      });
    }
  }, [job]); // Re-run effect if the job prop changes

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handler for array inputs (like skills, rounds, etc.)
  const handleArrayInputChange = (name, index, field, value) => {
    const newArray = [...formData[name]];
    newArray[index] = { ...newArray[index], [field]: value };
    setFormData({ ...formData, [name]: newArray });
  };

  // Handler for adding items to arrays
  const handleAddItem = (name, newItem) => {
    setFormData({ ...formData, [name]: [...formData[name], newItem] });
  };

  // Handler for removing items from arrays
  const handleRemoveItem = (name, index) => {
    const newArray = formData[name].filter((_, i) => i !== index);
    setFormData({ ...formData, [name]: newArray });
  };


  const handleUpdateJob = async () => {
    try {
      // Prepare data for Firestore update
      const updateData = {
        company: formData.company,
        position: formData.position,
        description: formData.description,
        // Group eligibility criteria if needed, or save flat
        eligibilityCriteria: {
          cgpa: formData.minCGPA,
          currentArrears: formData.maxCurrentArrears,
          historyArrears: formData.maxHistoryArrears,
          batch: formData.eligibleBatch, // Assuming this should be an array
          department: formData.eligibleDepartments // Assuming this should be an array
        },
        location: formData.location,
        salary: formData.salary,
        genderPreference: formData.genderPreference,
        // Convert date strings back to Date objects or Timestamps if required by Firestore
        deadline: formData.deadline ? new Date(formData.deadline) : null,
        interviewDateTime: formData.interviewDateTime ? new Date(formData.interviewDateTime) : null,
        jobType: formData.jobType, // Assuming single job type for now based on form
        experience: formData.experience,
        instructions: formData.instructions,
        skills: formData.skills,
        rounds: formData.rounds,
        screeningQuestions: formData.screeningQuestions,
        attachments: formData.attachments
      };

      await updateDoc(doc(db, 'jobs', job.id), updateData); // Use job.id from props
      setEditMode(false); // Close modal
      toast.success('Job updated successfully');
      onSaveSuccess(); // Re-fetch data in parent
    } catch (error) {
      console.error('Error updating job:', error);
      toast.error('Failed to update job');
    }
  };

  // If editMode is false, don't render the modal (handled by parent)
  // if (!editMode) return null; // This check is now in the parent

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-5xl w-full m-4 max-h-[90vh] overflow-y-auto">
        {/* Edit Modal Content */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Edit Job Details</h2>
          <button
            onClick={() => setEditMode(false)} // Close button
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            




<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Work Mode</label>
  <select
    name="workMode"
    value={formData.workMode}
    onChange={handleInputChange}
    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
  >
    <option value="">Select Work Mode</option>
    <option value="On-site">On-site</option>
    <option value="Remote">Remote</option>
    <option value="Hybrid">Hybrid</option>
    <option value="Work from Home">Work from Home</option>
  </select>
</div>

<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Eligible Batches</label>
  <div className="flex flex-wrap gap-2 border p-2 rounded-md max-h-32 overflow-y-auto">
    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 3 + i).map(year => (
      <label key={year} className="inline-flex items-center px-3 py-1 border rounded-md text-sm">
        <input
          type="checkbox"
          checked={formData.eligibleBatch.includes(year)}
          onChange={() => {
            const newBatch = formData.eligibleBatch.includes(year)
              ? formData.eligibleBatch.filter(y => y !== year)
              : [...formData.eligibleBatch, year];
            setFormData({...formData, eligibleBatch: newBatch});
          }}
          className="mr-2"
        />
        {year}
      </label>
    ))}
  </div>
</div>

 

            {/* Required Skills */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Required Skills</h3>
              <div className="space-y-4">
                {Array.isArray(formData.skills) && formData.skills.map((skill, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={skill}
                      onChange={(e) => {
                        const newSkills = [...formData.skills];
                        newSkills[index] = e.target.value;
                        setFormData({...formData, skills: newSkills});
                      }}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveItem('skills', index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => handleAddItem('skills', '')}
                  className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Add Skill
                </button>
              </div>
            </div>

             {/* Screening Questions */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Screening Questions</h3>
              <div className="space-y-4">
                {Array.isArray(formData.screeningQuestions) && formData.screeningQuestions.map((q, index) => (
                  <div key={index} className="border p-3 rounded-md space-y-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Question {index + 1}</label>
                       <input
                        type="text"
                        value={q.question || ''}
                        onChange={(e) => handleArrayInputChange('screeningQuestions', index, 'question', e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                     <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                       <select
                        value={q.type || 'Text Input'}
                        onChange={(e) => handleArrayInputChange('screeningQuestions', index, 'type', e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="Text Input">Text Input</option>
                        <option value="Yes/No">Yes/No</option>
                        <option value="Multiple Choice">Multiple Choice</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem('screeningQuestions', index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove Question
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => handleAddItem('screeningQuestions', { question: '', type: 'Text Input' })}
                  className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Add Question
                </button>
              </div>
            </div>

          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Job Details */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Job Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    name="location" // Add name attribute
                    value={formData.location} // Use local state
                    onChange={handleInputChange} // Use local handler
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="e.g., Bangalore, Remote"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Application Deadline</label>
                  <input
                    type="datetime-local" // Use datetime-local for date and time
                    name="deadline" // Add name attribute
                    value={formData.deadline} // Use local state
                    onChange={handleInputChange} // Use local handler
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interview Date & Time</label>
                  <input
                    type="datetime-local" // Use datetime-local for date and time
                    name="interviewDateTime" // Add name attribute
                    value={formData.interviewDateTime} // Use local state
                    onChange={handleInputChange} // Use local handler
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender Preference</label>
                  <select
                    name="genderPreference" // Add name attribute
                    value={formData.genderPreference} // Use local state
                    onChange={handleInputChange} // Use local handler
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="Any">Any</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                  <select
                    name="jobType" // Add name attribute
                    value={formData.jobType} // Use local state
                    onChange={handleInputChange} // Use local handler
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select Job Type</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
                  <input
                    type="text"
                    name="experience" // Add name attribute
                    value={formData.experience} // Use local state
                    onChange={handleInputChange} // Use local handler
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="e.g., 0-2 years, Fresher"
                  />
                </div>
              </div>
            </div>



            <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">CTC (for full-time roles)</label>
  <input
    type="text"
    name="ctc"
    value={formData.ctc}
    onChange={handleInputChange}
    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
    placeholder="e.g., ₹10 LPA"
  />
</div>

<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
  <input
    type="date"
    name="joiningDate"
    value={formData.joiningDate}
    onChange={handleInputChange}
    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
  />
</div>

{formData.jobTypes.includes('Internship') && (
  <>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">PPO Opportunity</label>
      <select
        name="ppoPportunity"
        value={formData.ppoPportunity ? 'true' : 'false'}
        onChange={(e) => setFormData({...formData, ppoPportunity: e.target.value === 'true'})}
        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      >
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Internship Duration</label>
      <input
        type="text"
        name="internshipDuration"
        value={formData.internshipDuration}
        onChange={handleInputChange}
        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        placeholder="e.g., 2 months, Summer 2024"
      />
    </div>
  </>
)}

            {/* Hiring Workflow Rounds */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Hiring Workflow Rounds</h3>
              <div className="space-y-4">
                 {Array.isArray(formData.rounds) && formData.rounds.map((round, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={round.name || round.roundName || ''} // Handle potential different field names
                      onChange={(e) => handleArrayInputChange('rounds', index, 'name', e.target.value)} // Update 'name' field
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder={`Round ${index + 1} Name`}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveItem('rounds', index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => handleAddItem('rounds', { name: '' })} // Add new round with a name field
                  className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Add Round
                </button>
              </div>
            </div>

             {/* File Attachments */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">File Attachments</h3>
              <div className="space-y-4">
                 {Array.isArray(formData.attachments) && formData.attachments.map((file, index) => (
                  <div key={index} className="border p-3 rounded-md space-y-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">File {index + 1} Name</label>
                       <input
                        type="text"
                        value={file.name || ''}
                        onChange={(e) => {
                          const updatedFiles = [...(formData.attachments || [])];
                          updatedFiles[index] = { ...file, name: e.target.value };
                          setFormData({ ...formData, attachments: updatedFiles });
                        }}
                        placeholder="File Name"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    </div>
                    {/* Wrap adjacent inputs and button in a div */}
                    <div className="flex items-center gap-2"> {/* Added this div */}
                      <input
                        type="text"
                        value={file.url || ''}
                        onChange={(e) => {
                          const updatedFiles = [...(formData.attachments || [])];
                          updatedFiles[index] = { ...file, url: e.target.value };
                          setFormData({ ...formData, attachments: updatedFiles });
                        }}
                        placeholder="File URL"
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      {/* The button is now inside this div */}
                    </div>
                    <button
                      onClick={() => {
                        const updatedFiles = formData.attachments.filter((_, i) => i !== index);
                        setFormData({ ...formData, attachments: updatedFiles });
                      }}
                      className="px-2 py-1 text-red-600 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const updatedFiles = [...(formData.attachments || []), { name: '', url: '' }];
                    setFormData({ ...formData, attachments: updatedFiles });
                  }}
                  className="px-4 py-2 text-blue-600 hover:text-blue-700 flex items-center gap-2"
                >
                  + Add File
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleUpdateJob}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobDetailsEdit;
