import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Briefcase, 
  FileText, 
  Code, 
  User, 
  Image, 
  Bell,
  LogOut,
  Calendar // Add Calendar icon import
} from 'lucide-react';
import LoadingSpinner from './components/ui/LoadingSpinner';
import Loader from './loading'; // Add this import at the top

const Student = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUserData({
        name: user.displayName || "User",
        rollNumber: localStorage.getItem("rollNumber"),
      });
    }

    // Get initial unread count from localStorage
    const storedCount = localStorage.getItem('unreadNotificationsCount');
    if (storedCount) {
      setUnreadCount(parseInt(storedCount, 10));
    }

    // Listen for updates to unread count
    const handleUnreadCountUpdate = (event) => {
      setUnreadCount(event.detail.count);
    };

    window.addEventListener('unreadNotificationsUpdated', handleUnreadCountUpdate);

    return () => {
      window.removeEventListener('unreadNotificationsUpdated', handleUnreadCountUpdate);
    };
  }, []);

  if (!userData) return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <Loader />
    </div>
  );

  const menuItems = [
    { 
      name: "Notifications", 
      path: "/student/notifications", 
      icon: (
        <div className="relative">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      ) 
    },
    { name: "Resources", path: "/student/resources", icon: <BookOpen size={20} /> },
    { name: "Job Posting", path: "/student/jobpost", icon: <Briefcase size={20} /> },
    { name: "Applications", path: "/student/applications", icon: <FileText size={20} /> },
    { name: "Calendar", path: "/student/calendar", icon: <Calendar size={20} /> }, // Add Calendar menu item
    { name: "Coding", path: "/student/coding", icon: <Code size={20} /> },
    { name: "Profile", path: "/student/profile", icon: <User size={20} /> },
    { name: "Gallery", path: "/student/gallery", icon: <Image size={20} /> },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("userRole");
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="relative transition-all duration-300 ease-in-out" 
           style={{ width: isSidebarOpen ? '16rem' : '5rem' }}>
        <div className="fixed h-full transition-all duration-300 ease-in-out bg-gradient-to-b from-indigo-900 to-teal-600 flex flex-col justify-between"
             style={{ width: isSidebarOpen ? '16rem' : '5rem' }}>
          <div>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="absolute -right-3 top-4 bg-white rounded-full p-1 shadow-lg z-10 hover:bg-gray-100 transition-colors duration-200"
            >
              {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>

            <div className="p-4 text-white">
              {/* Profile Section */}
              <div className={`mb-8 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'text-left' : 'text-center'  }`}>
                <div className="w-12 h-12 bg-white rounded-full mx-auto mb-2 transition-transform duration-300 ease-in-out">
                  <img
                    src="/api/placeholder/48/48"
                    alt="Profile"
                    className="w-full h-full rounded-full"
                  />
                </div>
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  isSidebarOpen ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0'
                }`}>
                  <div className="font-semibold whitespace-nowrap">{userData.name}</div>
                  <div className="text-xs text-gray-300 whitespace-nowrap">{userData.rollNumber}</div>
                </div>
              </div>

              {/* Navigation Menu */}
              <nav className="space-y-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`w-full text-left px-4 py-2 rounded transition-colors flex items-center gap-3
                      ${location.pathname === item.path
                        ? 'bg-white/20 text-white' 
                        : 'hover:bg-white/10 text-gray-300'}`}
                  >
                    {item.icon}
                    {isSidebarOpen && <span>{item.name}</span>}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 rounded text-gray-300 hover:bg-white/10 flex items-center gap-3 mb-4"
          >
            <LogOut size={20} />
            {isSidebarOpen && 'Log Out'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 p-6 ${isSidebarOpen ? 'ml-180' : 'ml-200'}`}>
        <Outlet />
      </div>
    </div>
  );
};

export default Student;