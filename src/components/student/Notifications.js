import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where, updateDoc, doc, onSnapshot, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Bell, Briefcase, CheckCircle, AlertCircle, Calendar, FileText, MessageSquare } from 'lucide-react';

// Notification icon component based on notification type
const NotificationIcon = ({ type }) => {
  const iconMap = {
    job_posting: <Briefcase size={20} />,
    status_update: <CheckCircle size={20} />,
    announcement: <MessageSquare size={20} />,
    interview: <Calendar size={20} />,
    reminder: <AlertCircle size={20} />
  };

  const iconClasses = {
    job_posting: "bg-blue-100 text-blue-600",
    status_update: "bg-green-100 text-green-600",
    announcement: "bg-yellow-100 text-yellow-600",
    interview: "bg-purple-100 text-purple-600",
    reminder: "bg-orange-100 text-orange-600"
  };

  return (
    <div className={`p-2 rounded-full ${iconClasses[type] || 'bg-gray-100 text-gray-600'}`}>
      {iconMap[type] || <Bell size={20} />}
    </div>
  );
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    // Set up real-time listener for notifications
    const setupNotificationsListener = () => {
      // Query for user-specific notifications
      const userNotificationsQuery = query(
        collection(db, 'notifications'),
        where('recipientId', '==', userId),
        orderBy('timestamp', 'desc')
      );

      // Query for general student notifications
      const generalNotificationsQuery = query(
        collection(db, 'notifications'),
        where('isGeneral', '==', true),
        where('recipientType', '==', 'student'),
        orderBy('timestamp', 'desc')
      );

      // Set up listeners
      const userUnsubscribe = onSnapshot(userNotificationsQuery, (snapshot) => {
        handleNotificationsUpdate(snapshot, 'user');
      });

      const generalUnsubscribe = onSnapshot(generalNotificationsQuery, (snapshot) => {
        handleNotificationsUpdate(snapshot, 'general');
      });

      return () => {
        userUnsubscribe();
        generalUnsubscribe();
      };
    };

    const handleNotificationsUpdate = (snapshot, source) => {
      // In the handleNotificationsUpdate function
      const newNotifications = snapshot.docs.map(doc => {
        const data = doc.data();
        // Check if this is a new notification
        const isNew = source === 'user' && 
          ((data.isRead === false) || (data.read === false)) && 
          !notifications.some(n => n.id === doc.id);
        
        // Show toast for new notifications
        if (isNew) {
          toast.info(data.title, {
            position: "top-right",
            autoClose: 5000
          });
        }
        
        return {
          id: doc.id,
          ...data,
          // Handle both isRead and read fields
          isRead: data.isRead !== undefined ? data.isRead : (data.read !== undefined ? !data.read : false),
          // Map job type to expected types
          type: data.type === 'job' ? 'job_posting' : data.type,
          timestamp: data.timestamp?.toDate() || new Date()
        };
      });

      // Merge notifications from both sources and sort by timestamp
      if (source === 'user') {
        setNotifications(prevNotifications => {
          const generalNotifications = prevNotifications.filter(n => n.isGeneral);
          return [...newNotifications, ...generalNotifications].sort((a, b) => b.timestamp - a.timestamp);
        });
      } else {
        setNotifications(prevNotifications => {
          const userNotifications = prevNotifications.filter(n => !n.isGeneral);
          return [...userNotifications, ...newNotifications].sort((a, b) => b.timestamp - a.timestamp);
        });
      }
      
      setLoading(false);
    };

    const unsubscribe = setupNotificationsListener();
    return unsubscribe;
  }, []);

  // Update unread count whenever notifications change
  useEffect(() => {
    const count = notifications.filter(notification => !notification.isRead).length;
    setUnreadCount(count);
    
    // Update the count in localStorage for the navbar bell icon
    localStorage.setItem('unreadNotificationsCount', count.toString());
    
    // Dispatch an event so other components can react to the change
    window.dispatchEvent(new CustomEvent('unreadNotificationsUpdated', { detail: { count } }));
  }, [notifications]);

  const getNotificationStyle = (type, isRead) => {
    const baseStyle = isRead ? 'opacity-75 ' : '';
    const styles = {
      job_posting: baseStyle + 'border-blue-200 bg-blue-50',
      status_update: baseStyle + 'border-green-200 bg-green-50',
      announcement: baseStyle + 'border-yellow-200 bg-yellow-50',
      interview: baseStyle + 'border-purple-200 bg-purple-50',
      reminder: baseStyle + 'border-orange-200 bg-orange-50'
    };
    return styles[type] || baseStyle + 'border-gray-200 bg-gray-50';
  };

  const filterButtons = [
    { label: 'All', value: 'all' },
    { label: 'Job Postings', value: 'job_posting' },
    { label: 'Status Updates', value: 'status_update' },
    { label: 'Announcements', value: 'announcement' },
    { label: 'Interviews', value: 'interview' },
    { label: 'Reminders', value: 'reminder' }
  ];

  // Filter notifications based on selected filter
  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === filter);

  // Sort notifications to show unread first
  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    // First sort by read status (unread first)
    if (a.isRead !== b.isRead) {
      return a.isRead ? 1 : -1;
    }
    // Then sort by timestamp (newest first)
    return b.timestamp - a.timestamp;
  });

  const markAsRead = async (notificationId) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { isRead: true });
      
      // Update local state
      setNotifications(notifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true } 
          : notification
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      const unreadNotifications = notifications.filter(n => !n.isRead);
      
      unreadNotifications.forEach(notification => {
        const notificationRef = doc(db, 'notifications', notification.id);
        batch.update(notificationRef, { isRead: true });
      });
      
      await batch.commit();
      
      // Update local state
      setNotifications(notifications.map(notification => ({ ...notification, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <ToastContainer />
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm hover:bg-blue-600 transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {filterButtons.map(button => (
          <button
            key={button.value}
            onClick={() => setFilter(button.value)}
            className={`px-3 py-1 rounded-full text-sm ${
              filter === button.value
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {button.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {sortedNotifications.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No notifications found</p>
        ) : (
          sortedNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg shadow border ${getNotificationStyle(notification.type, notification.isRead)}`}
              onClick={() => !notification.isRead && markAsRead(notification.id)}
            >
              <div className="flex items-start gap-4">
                <NotificationIcon type={notification.type} />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h3 className={`font-medium ${!notification.isRead ? 'font-bold' : ''}`}>
                      {notification.title}
                      {!notification.isRead && (
                        <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {notification.timestamp.toLocaleString()}
                    </p>
                  </div>
                  <p className="text-gray-600 mt-1">{notification.message}</p>
                  {notification.actionLink && (
                    <a 
                      href={notification.actionLink}
                      className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                    >
                      View Details →
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;