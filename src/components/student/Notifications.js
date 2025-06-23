import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where, updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '../../firebase'; // Import auth

const NotificationIcon = ({ type }) => {
  const iconClasses = {
    job: "bg-blue-100 text-blue-600",
    application: "bg-green-100 text-green-600",
    deadline: "bg-orange-100 text-orange-600",
    document: "bg-purple-100 text-purple-600",
    announcement: "bg-yellow-100 text-yellow-600"
  };

  return (
    <div className={`p-2 rounded-full ${iconClasses[type] || 'bg-gray-100 text-gray-600'}`}>
      {/* You can add specific icons here if needed */}
    </div>
  );
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        // Query for general notifications (no specific recipient)
        const generalQuery = query(
          collection(db, 'notifications'),
          where('isGeneral', '==', true),
          where('recipientType', '==', 'student'),
          orderBy('timestamp', 'desc')
        );

        // Execute query
        const querySnapshot = await getDocs(generalQuery);
        
        const notificationsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        }));
        
        setNotifications(notificationsList);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const getNotificationStyle = (type) => {
    const styles = {
      job: 'border-blue-200 bg-blue-50',
      application: 'border-green-200 bg-green-50',
      deadline: 'border-orange-200 bg-orange-50',
      document: 'border-purple-200 bg-purple-50',
      announcement: 'border-yellow-200 bg-yellow-50'
    };
    return styles[type] || 'border-gray-200 bg-gray-50';
  };

  const filterButtons = [
    { label: 'All', value: 'all' },
    { label: 'Jobs', value: 'job' },
    { label: 'Applications', value: 'application' },
    { label: 'Deadlines', value: 'deadline' },
    { label: 'Documents', value: 'document' },
    { label: 'Announcements', value: 'announcement' }
  ];

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === filter);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Notifications</h2>
        <div className="flex gap-2">
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
      </div>

      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No notifications found</p>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg shadow border ${getNotificationStyle(notification.type)}`}
            >
              <div className="flex items-start gap-4">
                <NotificationIcon type={notification.type} />
                <div className="flex-1">
                  <h3 className="font-medium">{notification.title}</h3>
                  <p className="text-gray-600 mt-1">{notification.message}</p>
                  {notification.actionUrl && (
                    <a 
                      href={notification.actionUrl}
                      className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
                    >
                      View Details →
                    </a>
                  )}
                  <p className="text-sm text-gray-400 mt-2">
                    {notification.timestamp.toLocaleString()}
                  </p>
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