import React, { useState } from 'react';

const Profile = () => {
  const [userData, setUserData] = useState({
    name: 'Paxton',
    rollNumber: 'AV.EN.U4CSE22100',
    program: 'BTech',
    email: 'paxton@gmail.com',
    mobile: '+91 9063553559',
    batch: 'AV22UCSEB',
    department: 'Computer Science',
    semester: '4',
    historyOfArrears: '0',
    backlogsCleared: 'No'
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
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

          {/* Academic Status */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Academic Status</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">History of Arrears</label>
                  <input
                    type="number"
                    value={userData.historyOfArrears}
                    onChange={(e) => setUserData({ ...userData, historyOfArrears: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    min="0"
                  />
                </div>

                {Number(userData.historyOfArrears) > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Backlogs Cleared</label>
                    <select
                      value={userData.backlogsCleared}
                      onChange={(e) => setUserData({ ...userData, backlogsCleared: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="col-span-3">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="flex space-x-4">
                <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                  Edit Profile
                </button>
                <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
                  Download Resume
                </button>
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  View Applications
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;