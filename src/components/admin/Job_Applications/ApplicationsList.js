import React, { useState, useEffect, useCallback, useRef } from 'react';
import { collection, getDocs, query, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import ApplicationsTable from './ApplicationsTable';
import AnswersModal from './AnswersModal';
import PageLoader from '../../ui/PageLoader';

function ApplicationsList() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [selectedApplications, setSelectedApplications] = useState([]);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  const [selectedAnswers, setSelectedAnswers] = useState(null);
  const [isAnswersModalOpen, setIsAnswersModalOpen] = useState(false);

  // Create a stable reference to the db
  const dbRef = useRef(db);
  
  // IMPORTANT: Initialize the ref with a dummy function to ensure it's never undefined
  const stableSaveFeedback = useRef((id, value) => {
    console.log("Initial dummy function called - this should not happen");
    return false;
  });

  // Status configuration for the application statuses
  const statusConfig = {
    pending: { label: 'Pending', class: 'bg-gray-100 text-gray-800' },
    underReview: { label: 'Under Review', class: 'bg-blue-100 text-blue-800' },
    shortlisted: { label: 'Shortlisted', class: 'bg-green-100 text-green-800' },
    onHold: { label: 'On Hold', class: 'bg-yellow-100 text-yellow-800' },
    interview: { label: 'Interview', class: 'bg-purple-100 text-purple-800' },
    selected: { label: 'Selected', class: 'bg-emerald-100 text-emerald-800' },
    rejected: { label: 'Rejected', class: 'bg-red-100 text-red-800' },
  };

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const applicationsCollection = collection(db, 'applications');
        const applicationSnapshot = await getDocs(applicationsCollection);
        const rawApplications = applicationSnapshot.docs.map(doc => ({ 
          id: doc.id, // Make sure this ID is correctly set
          feedback: doc.data().feedback || '', // Initialize feedback
          ...doc.data() 
        }));

        console.log('Raw applications with IDs:', rawApplications.map(app => app.id));
        
        // Transform the fetched data to include screeningAnswers array
        const transformedApplications = rawApplications.map(app => {
          // Get screening answers from the correct field name
          const answers = app.screening_answers || {};
          const formattedAnswers = [];

          // Format answers in a consistent way
          for (const [key, value] of Object.entries(answers)) {
            formattedAnswers.push({
              question: key,
              answer: value
            });
          }

          return {
            ...app,
            feedback: app.feedback || '', // Ensure feedback is initialized
            screening_answers: answers,    // Keep the original
            screeningAnswers: formattedAnswers // Add formatted version
          };
        });

        console.log('Transformed applications:', transformedApplications);

        setApplications(rawApplications);
        setFilteredApplications(transformedApplications);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching applications:", error);
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  // Handler for student profile click
  const handleStudentClick = (student) => {
    // Implement navigation or modal to show student details
    console.log("Student clicked:", student);
  };

  // Handler for status update
  const handleStatusUpdate = async (applicationId, newStatus) => {
    // Implement status update logic
    console.log("Status update:", applicationId, newStatus);
  };

  const handleCloseAnswersModal = () => {
    setIsAnswersModalOpen(false);
    setSelectedAnswers(null);
  };

  // Define handleSaveFeedback using useCallback with proper dependencies
  const handleSaveFeedback = useCallback(async (applicationId, feedbackValue) => {
    console.log("ApplicationsList: handleSaveFeedback called with", applicationId, feedbackValue);
  
    if (!applicationId || typeof feedbackValue !== 'string') {
      console.error('Invalid arguments for handleSaveFeedback');
      return false;
    }
  
    try {
      // Use the ref to ensure stable reference
      const currentDb = dbRef.current;
      const applicationRef = doc(currentDb, 'applications', applicationId);
      
      // Log more details for debugging
      console.log(`Attempting to update application ${applicationId} with feedback: ${feedbackValue}`);
      
      // Perform the update
      await updateDoc(applicationRef, {
        feedback: feedbackValue
      });
      
      // Update local state after successful Firebase update
      setApplications(prevApps => 
        prevApps.map(app => 
          app.id === applicationId ? { ...app, feedback: feedbackValue } : app
        )
      );
      
      setFilteredApplications(prevFiltered => 
        prevFiltered.map(app => 
          app.id === applicationId ? { ...app, feedback: feedbackValue } : app
        )
      );
  
      console.log(`Feedback saved successfully for application ${applicationId}`);
      return true;
  
    } catch (error) {
      console.error(`Error saving feedback for application ${applicationId}:`, error);
      // Log more details about the error
      if (error.code) {
        console.error(`Firebase error code: ${error.code}`);
      }
      return false;
    }
  }, []);

  // Update the ref IMMEDIATELY after defining the function
  // This ensures the ref is updated before the first render
  stableSaveFeedback.current = handleSaveFeedback;
  
  // Also update in useEffect to ensure it stays updated after renders
  useEffect(() => {
    console.log("Updating stableSaveFeedback ref in useEffect");
    stableSaveFeedback.current = handleSaveFeedback;
  }, [handleSaveFeedback]);

  // Add logging here before the return statement
  console.log("ApplicationsList: handleSaveFeedback before rendering table:", stableSaveFeedback.current);
  console.log("ApplicationsList: handleSaveFeedback type before rendering table:", typeof stableSaveFeedback.current);

  // Create a wrapper function that we pass directly as a prop
  // This ensures we're not passing the .current property which might be undefined
  const saveFeedbackWrapper = async (id, value) => {
    console.log("Wrapper function called with", id, value);
    if (typeof stableSaveFeedback.current !== 'function') {
      console.error("stableSaveFeedback.current is not a function in wrapper", stableSaveFeedback.current);
      return false;
    }
    return await stableSaveFeedback.current(id, value);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Job Applications</h1>

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
        handleSaveFeedback={saveFeedbackWrapper} // Use the wrapper function instead of .current
        setSelectedAnswers={setSelectedAnswers}
        setIsAnswersModalOpen={setIsAnswersModalOpen}
        visibleColumns={[
          'name', 'rollNumber', 'department', 'cgpa', 'match', 'status', 'actions', 'resume', 'predict', 
          'question1', 'question2', 'feedback'
        ]} // Add default visible columns
      />

      {isAnswersModalOpen && (
        <AnswersModal
          answers={selectedAnswers}
          onClose={handleCloseAnswersModal}
        />
      )}
    </div>
  );
}

export default ApplicationsList;