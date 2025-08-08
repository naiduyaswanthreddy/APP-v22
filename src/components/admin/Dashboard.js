import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Loader from '../../loading'; // Add this import at the top

const Dashboard = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {loading ? (
              <div className="fixed top-0 left-[20%] right-0 bottom-0 bg-gray-200 bg-opacity-10 flex items-center justify-center z-50">
              <Loader />
              </div>
      ) : (
        <div className="p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Add company management section */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Company Management</h2>
              <Link
                to="/admin/companies/create"
                className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded hover:bg-blue-700 mb-2"
              >
                Create Company Account
              </Link>
              <Link
                to="/admin/companies"
                className="block w-full bg-gray-600 text-white text-center py-2 px-4 rounded hover:bg-gray-700"
              >
                View All Companies
              </Link>
            </div>
            {/* Existing dashboard widgets */}
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;