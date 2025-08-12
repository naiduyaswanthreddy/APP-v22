import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import MobileHeader from './MobileHeader';
import MobileSidebar from './MobileSidebar';
import MobileBottomNav from './MobileBottomNav';

const StudentMobileResponsive = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle user data
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("userRole");
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!userData) return null;

  // Desktop layout
  if (!isMobile) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        {/* Desktop Sidebar */}
        <div className="relative transition-all duration-300 ease-in-out" 
             style={{ width: '16rem' }}>
          <div className="fixed h-full w-64 bg-gradient-to-b from-indigo-900 to-teal-600 flex flex-col justify-between">
            <div>
              <div className="p-4 text-white">
                {/* Profile Section */}
                <div className="mb-8 text-left">
                  <div className="w-12 h-12 bg-white rounded-full mx-auto mb-2">
                    <img
                      src="/api/placeholder/48/48"
                      alt="Profile"
                      className="w-full h-full rounded-full"
                    />
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{userData.name}</div>
                    <div className="text-xs text-gray-300">{userData.rollNumber}</div>
                  </div>
                </div>

                {/* Navigation Menu */}
                <nav className="space-y-2">
                  {[
                    { name: "Notifications", path: "/student/notifications", icon: Bell },
                    { name: "Resources", path: "/student/resources", icon: BookOpen },
                    { name: "Job Posting", path: "/student/jobpost", icon: Briefcase },
                    { name: "Applications", path: "/student/applications", icon: FileText },
                    { name: "Calendar", path: "/student/calendar", icon: Calendar },
                    { name: "Coding", path: "/student/coding", icon: Code },
                    { name: "Profile", path: "/student/profile", icon: User },
                    { name: "Gallery", path: "/student/gallery", icon: Image },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`w-full text-left px-4 py-2 rounded transition-colors flex items-center gap-3
                          ${isActive 
                            ? 'bg-white/20 text-white' 
                            : 'hover:bg-white/10 text-gray-300'}`}
                      >
                        <Icon size={20} />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 rounded text-gray-300 hover:bg-white/10 flex items-center gap-3 mb-4"
            >
              <LogOut size={20} />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 ml-64">
          <Outlet />
        </div>
      </div>
    );
  }

  // Mobile layout
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Mobile Header */}
      <MobileHeader 
        onToggleSidebar={() => setIsSidebarOpen(true)} 
        unreadCount={unreadCount}
      />
      
      {/* Mobile Sidebar */}
      <MobileSidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userData={userData}
        unreadCount={unreadCount}
      />
      
      {/* Main Content */}
      <main className="flex-1 pt-16 pb-20">
        <div className="p-4">
          <Outlet />
        </div>
      </main>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};

export default StudentMobileResponsive;
