import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Notification categories
  const categories = {
    job_monitoring: '🔹 Job Monitoring',
    student_tracking: '🔹 Student Progress',
    round_management: '🔹 Round Management',
    system_alerts: '🔹 System Alerts',
    communication: '🔹 Communication'
  };

  // Icon mapping for different notification types
  const typeIcons = {
    new_applications: '📝',
    no_applicants: '⚠️',
    deadline: '⏰',
    resume_missing: '📄',
    ineligible: '⛔',
    results_pending: '⏳',
    round_scheduled: '📅',
    approval_request: '✋',
    feedback: '📊',
    query: '❓',
    broadcast: '📢'
  };

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      let q = query(
        collection(db, 'notifications'),
        where('recipientType', '==', 'admin'),
        orderBy('timestamp', 'desc')
      );

      if (filter !== 'all') {
        q = query(q, where('category', '==', filter));
      }

      const querySnapshot = await getDocs(q);
      const notificationsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));
      
      setNotifications(notificationsList);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true
      });
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <div className="flex items-center">
          <h2 className="text-2xl font-semibold">Admin Notifications</h2>
          {notifications.filter(n => !n.read).length > 0 && (
            <span className="ml-3 px-2 py-1 bg-blue-500 text-white text-sm rounded-full">
              {notifications.filter(n => !n.read).length}
            </span>
          )}
        </div>
        <div className="mt-4 md:mt-0">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-200"
          >
            <option value="all">All Notifications</option>
            {Object.entries(categories).map(([key, value]) => (
              <option key={key} value={key}>{value}</option>
            ))}
          </select>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No notifications found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg shadow-sm border ${
                notification.read ? 'bg-white' : 'bg-blue-50'
              } hover:shadow-md transition-shadow duration-200`}
            >
              <div className="flex items-start gap-4">
                <div className="text-2xl">
                  {typeIcons[notification.type] || '📌'}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-sm font-medium text-blue-600">
                        {categories[notification.category]}
                      </span>
                      <h3 className="font-medium mt-1">{notification.message}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>{notification.timestamp.toLocaleString()}</span>
                        {notification.priority === 'high' && (
                          <span className="text-red-500">⚡ High Priority</span>
                        )}
                      </div>
                    </div>
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1 rounded 
                          border border-blue-600 hover:border-blue-800"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                  {notification.actionRequired && (
                    <div className="mt-3 p-2 bg-yellow-50 rounded-md text-sm">
                      ⚡ Action Required: {notification.actionRequired}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;