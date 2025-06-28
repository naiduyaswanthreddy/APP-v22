import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Profile = () => {
  const [userData, setUserData] = useState({
    name: '',
    rollNumber: '',
    program: '',
    email: '',
    mobile: '',
    batch: '',
    department: '',
    semester: '',
    historyOfArrears: '0',
    backlogsCleared: 'No'
  });
  
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        // Get admin data from Firestore
        const adminRef = doc(db, "admins", user.uid);
        const adminSnap = await getDoc(adminRef);
        
        setUserData(prev => ({
          ...prev,
          name: user.displayName || "Admin",
          email: user.email || "",
          // Get additional data from Firestore document if it exists
          rollNumber: adminSnap.exists() ? adminSnap.data().rollNumber || "" : "",
          program: adminSnap.exists() ? adminSnap.data().program || "" : "",
          mobile: adminSnap.exists() ? adminSnap.data().mobile || "" : "",
          batch: adminSnap.exists() ? adminSnap.data().batch || "" : "",
          department: adminSnap.exists() ? adminSnap.data().department || "" : "",
          semester: adminSnap.exists() ? adminSnap.data().semester || "" : "",
          historyOfArrears: adminSnap.exists() ? adminSnap.data().historyOfArrears || "0" : "0",
          backlogsCleared: adminSnap.exists() ? adminSnap.data().backlogsCleared || "No" : "No"
        }));
      } catch (error) {
        console.error("Error fetching admin profile:", error);
        toast.error("Failed to load profile data");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <ToastContainer />
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-6">
            <div className="h-24 w-24 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-3xl">{userData.name.charAt(0)}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{userData.name}</h1>
              <p className="text-gray-500">{userData.rollNumber}</p>
              <div className="mt-2 flex space-x-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {userData.program}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  {userData.batch}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Personal Information */}
          <div className="col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Department</label>
                  <p className="mt-1 text-gray-900">{userData.department}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Current Semester</label>
                  <p className="mt-1 text-gray-900">{userData.semester}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Email</label>
                  <p className="mt-1 text-gray-900">{userData.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Mobile</label>
                  <p className="mt-1 text-gray-900">{userData.mobile}</p>
                </div>
              </div>
            </div>
          </div>


 
        </div>
      </div>
    </div>
  );
};

export default Profile;