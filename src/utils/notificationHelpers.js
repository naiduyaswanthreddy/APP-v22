import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Creates a notification in Firestore
 * @param {Object} notificationData - The notification data
 * @param {string} notificationData.title - Notification title
 * @param {string} notificationData.message - Detailed message (optional)
 * @param {string} notificationData.type - One of: job_posting, status_update, announcement, interview, reminder
 * @param {string} notificationData.recipientId - User ID of recipient (null for general notifications)
 * @param {boolean} notificationData.isGeneral - Whether this is a general notification
 * @param {string} notificationData.recipientType - Type of recipient (student, admin, company)
 * @param {string} notificationData.actionLink - Optional link to related content
 * @returns {Promise<string>} - The ID of the created notification
 */
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

/**
 * Creates a job posting notification for a student
 */
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

/**
 * Creates an application status update notification
 */
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

/**
 * Creates an interview notification
 */
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

/**
 * Creates a general announcement for all students
 */
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

/**
 * Creates a reminder notification
 */
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

/**
 * Creates a company action notification for admins
 */
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

/**
 * Creates a job event notification for admins
 */
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

/**
 * Creates a student event notification for admins
 */
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

/**
 * Creates a system alert notification for admins
 */
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

/**
 * Creates a chat message notification for students
 */
export const createChatMessageNotification = async (recipientId, jobData, senderName, message) => {
  return createNotification({
    title: `New message in ${jobData.position} chat`,
    message: `${senderName}: ${message.length > 50 ? message.substring(0, 50) + '...' : message}`,
    type: 'chat_message',
    recipientId: recipientId,
    isGeneral: false,
    recipientType: 'student',
    actionLink: `/student/jobpost` // This will take them to the job posts page
  });
};