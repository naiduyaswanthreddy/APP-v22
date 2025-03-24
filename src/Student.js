import React, { useState,useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Briefcase, 
  FileText, 
  Code, 
  User, 
  Image, 
  LogOut
} from 'lucide-react';
import { signOut } from "firebase/auth";
import { auth } from "./firebase";

const Student = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState(null);
  

  useEffect(() => {
      const user = auth.currentUser;
      if (user) {
        setUserData({
          name: user.displayName || "User",
          rollNumber: localStorage.getItem("rollNumber"),
      
        });
      }
    }, []);

    if (!userData) return <p>Loading profile...</p>;


  const menuItems = [
    { name: "Resources", path: "/student/resources", icon: <BookOpen size={20} /> },
    { name: "Job Posting", path: "/student/jobpost", icon: <Briefcase size={20} /> },
    { name: "Applications", path: "/student/applications", icon: <FileText size={20} /> },
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
        <div className="fixed h-full transition-all duration-300 ease-in-out bg-gradient-to-b from-indigo-900 to-teal-600"
             style={{ width: isSidebarOpen ? '16rem' : '5rem' }}>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute -right-3 top-4 bg-white rounded-full p-1 shadow-lg z-10 hover:bg-gray-100 transition-colors duration-200"
          >
            {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>

          <div className="p-4 text-white">
            {/* Profile Section */}
            <div className={`mb-8 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'text-left' : 'text-center'  }`}>
            <div className="w-12 h-12 bg-white rounded-full mx-auto mb-2 transition-transform duration-300 ease-in-out">                <img
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
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 rounded text-gray-300 hover:bg-white/10 flex items-center gap-3 mt-8"
              >
                <LogOut size={20} />
                {isSidebarOpen && 'Log Out'}
              </button>
            </nav>
          </div>
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