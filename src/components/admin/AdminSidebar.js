import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart, 
  BookOpen, 
  Briefcase, 
  FileText, 
  Users, 
  Code, 
  User, 
  Image, 
  Bell,
  Building,
  Calendar // Add Calendar icon import
} from 'lucide-react';

const AdminSidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/admin/analytics', Icon: BarChart, label: 'Analytics' },
    { path: '/admin/resources', Icon: BookOpen, label: 'Resources' },
    { path: '/admin/jobpost', Icon: Briefcase, label: 'Job Posting' },
    { path: '/admin/manage-applications', Icon: FileText, label: 'Manage Applications' },
    { path: '/admin/students', Icon: Users, label: 'Students' },
    { path: '/admin/companies', Icon: Building, label: 'Companies' },
    { path: '/admin/calendar', Icon: Calendar, label: 'Calendar' }, // Add Calendar menu item
    { path: '/admin/coding', Icon: Code, label: 'Coding' },
    { path: '/admin/profile', Icon: User, label: 'Profile' },
    { path: '/admin/gallery', Icon: Image, label: 'Gallery' },
    { path: '/admin/notifications', Icon: Bell, label: 'Notifications' }
  ];

  return (
    <div className="h-screen w-64 bg-gradient-to-b from-indigo-800 via-blue-800 to-teal-700 text-white p-4">
      <div className="mb-8">
        <h2 className="text-xl font-bold">Admin</h2>
        <p className="text-sm opacity-75">AV.EN.U4CSE22100</p>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item) => {
          const IconComponent = item.Icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                ${location.pathname === item.path 
                  ? 'bg-white bg-opacity-10' 
                  : 'hover:bg-white hover:bg-opacity-5'}`}
            >
              <IconComponent size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default AdminSidebar;