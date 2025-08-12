import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

// Existing createNotification function (unchanged)
export const createNotification = async (notificationData) => {
  try {
    const notification = {
      ...notificationData,
      isRead: false,
      timestamp: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'notifications'), notification);
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// New sendSelectionNotification function
export const sendSelectionNotification = async (studentId, jobId, jobPosition, companyName) => {
  return createNotification({
    title: 'Congratulations! You have been selected!',
    message: `You have been selected for ${jobPosition} at ${companyName}. Please accept or reject your offer.`,
    type: 'job_selection',
    recipientId: studentId,
    isGeneral: false,
    recipientType: 'student',
    actionLink: `/student/applications`,
    jobId: jobId // Include jobId for context in student applications
  });
};

export const sendOfferAcceptedNotification = async (studentId, jobPosition, companyName) => {
  return createNotification({
    title: 'Offer Accepted!',
    message: `You have successfully accepted the offer for ${jobPosition} at ${companyName}. Congratulations on your placement!`,
    type: 'offer_accepted',
    recipientId: studentId,
    isGeneral: false,
    recipientType: 'student',
    actionLink: '/student/applications'
  });
};

export const sendOfferRejectedNotification = async (studentId, jobPosition, companyName) => {
  return createNotification({
    title: 'Offer Rejected',
    message: `You have rejected the offer for ${jobPosition} at ${companyName}. You may continue applying for other opportunities.`,
    type: 'offer_rejected',
    recipientId: studentId,
    isGeneral: false,
    recipientType: 'student',
    actionLink: '/student/applications'
  });
};

// New createEventNotification function
export const createEventNotification = async (studentId, title, message, actionLink = null) => {
  return createNotification({
    title,
    message,
    type: 'event',
    recipientId: studentId,
    isGeneral: false,
    recipientType: 'student',
    actionLink: actionLink || '/student/calendar'
  });
};

// Existing notification functions (unchanged)
export const createJobPostingNotification = async (studentId, jobData) => {
  return createNotification({
    title: `New Job Posting: ${jobData.position} at ${jobData.company}`,
    message: `A new job opportunity matching your skills is available. Salary: ${jobData.salary || 'Not specified'}`,
    type: 'job_posting',
    recipientId: studentId,
    isGeneral: false,
    recipientType: 'student',
    actionLink: `/student/jobpost`
  });
};

export const createStatusUpdateNotification = async (studentId, applicationData) => {
  const statusMessages = {
    under_review: 'Your application is now under review.',
    shortlisted: 'Congratulations! You have been shortlisted.',
    interview_scheduled: 'You have been scheduled for an interview.',
    selected: 'Congratulations! You have been selected for the position.',
    rejected: 'We regret to inform you that your application was not selected.',
    waitlisted: 'You have been waitlisted for the position.'
  };

  return createNotification({
    title: `Application Status Update: ${applicationData.job.position}`,
    message: statusMessages[applicationData.status] || 'Your application status has been updated.',
    type: 'status_update',
    recipientId: studentId,
    isGeneral: false,
    recipientType: 'student',
    actionLink: `/student/applications`
  });
};

export const createInterviewNotification = async (studentId, interviewData) => {
  return createNotification({
    title: `Interview Scheduled: ${interviewData.job.position}`,
    message: `Your interview has been scheduled for ${new Date(interviewData.interviewDateTime).toLocaleString()}. Please be prepared.`,
    type: 'interview',
    recipientId: studentId,
    isGeneral: false,
    recipientType: 'student',
    actionLink: `/student/applications`
  });
};

export const createAnnouncementNotification = async (title, message, actionLink = null) => {
  return createNotification({
    title,
    message,
    type: 'announcement',
    recipientId: null,
    isGeneral: true,
    recipientType: 'student',
    actionLink
  });
};

export const createReminderNotification = async (studentId, title, message, actionLink = null) => {
  return createNotification({
    title,
    message,
    type: 'reminder',
    recipientId: studentId,
    isGeneral: false,
    recipientType: 'student',
    actionLink
  });
};

export const createCompanyActionNotification = async (title, message, actionLink = null) => {
  return createNotification({
    title,
    message,
    type: 'company_action',
    recipientId: null,
    isGeneral: true,
    recipientType: 'admin',
    actionLink
  });
};

export const createJobEventNotification = async (title, message, actionLink = null) => {
  return createNotification({
    title,
    message,
    type: 'job_event',
    recipientId: null,
    isGeneral: true,
    recipientType: 'admin',
    actionLink
  });
};

export const createStudentEventNotification = async (title, message, actionLink = null) => {
  return createNotification({
    title,
    message,
    type: 'student_event',
    recipientId: null,
    isGeneral: true,
    recipientType: 'admin',
    actionLink
  });
};

export const createSystemAlertNotification = async (title, message, actionLink = null) => {
  return createNotification({
    title,
    message,
    type: 'system_alert',
    recipientId: null,
    isGeneral: true,
    recipientType: 'admin',
    actionLink
  });
};

export const createChatMessageNotification = async (recipientId, jobData, senderName, message) => {
  return createNotification({
    title: `New message in ${jobData.position} chat`,
    message: `${senderName}: ${message.length > 50 ? message.substring(0, 50) + '...' : message}`,
    type: 'chat_message',
    recipientId: recipientId,
    isGeneral: false,
    recipientType: 'student',
    actionLink: `/student/jobpost`
  });
};