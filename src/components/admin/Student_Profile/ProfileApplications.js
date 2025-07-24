import React, { useState, useEffect } from 'react';

const ProfileApplications = ({ userData, isAdminView }) => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchCompany, setSearchCompany] = useState('');
  const [filteredApplications, setFilteredApplications] = useState([]);

  // Status configuration for consistent styling
  const statusConfig = {
    pending: { label: '⏳ Under Review', class: 'bg-gray-100 text-gray-800', color: 'rgba(156, 163, 175, 0.7)' },
    shortlisted: { label: '✅ Shortlisted', class: 'bg-green-100 text-green-800', color: 'rgba(5, 150, 105, 0.7)' },
    waitlisted: { label: '🟡 On Hold / Waitlisted', class: 'bg-yellow-100 text-yellow-800', color: 'rgba(245, 158, 11, 0.7)' },
    interview_scheduled: { label: '📅 Interview Scheduled', class: 'bg-blue-100 text-blue-800', color: 'rgba(59, 130, 246, 0.7)' },
    selected: { label: '🌟 Selected', class: 'bg-purple-100 text-purple-800', color: 'rgba(139, 92, 246, 0.7)' },
    rejected: { label: '⚠️ Rejected', class: 'bg-red-100 text-red-800', color: 'rgba(239, 68, 68, 0.7)' }
  };

  // Initialize filteredApplications with userData.applications
  useEffect(() => {
    if (userData && userData.applications) {
      setFilteredApplications(userData.applications);
    }
  }, [userData]);

  // Filter applications based on status and company search
  useEffect(() => {
    if (!userData?.applications) return;
    
    let filtered = [...userData.applications];
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(app => app.status === filterStatus);
    }
    
    if (searchCompany.trim()) {
      const search = searchCompany.toLowerCase().trim();
      filtered = filtered.filter(app => 
        (app.job?.company || '').toLowerCase().includes(search)
      );
    }
    
    setFilteredApplications(filtered);
  }, [userData?.applications, filterStatus, searchCompany]);

  return (
    <div className="p-0 bg-white rounded-lg shadow">
      <div className="p-6">
        {/* Filters */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="md:w-1/3">
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Status
            </label>
            <select
              id="status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              {Object.entries(statusConfig).map(([value, { label }]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          
          <div className="md:w-2/3">
            <label htmlFor="company-search" className="block text-sm font-medium text-gray-700 mb-1">
              Search by Company
            </label>
            <input
              type="text"
              id="company-search"
              value={searchCompany}
              onChange={(e) => setSearchCompany(e.target.value)}
              placeholder="Enter company name..."
              className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        
        {/* Applications List */}
        {userData?.applications && filteredApplications.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied On</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApplications.map((app) => (
                  <tr key={app.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {app.job?.company || 'Unknown Company'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {app.job?.position || 'Unknown Position'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        statusConfig[app.status]?.class || 'bg-gray-100 text-gray-800'
                      }`}>
                        {statusConfig[app.status]?.label || '⏳ Under Review'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {app.createdAt ? new Date(app.createdAt.toDate()).toLocaleDateString() : 'Unknown'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : userData?.applications ? (
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No applications match your filters.</p>
          </div>
        ) : (
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No job applications found for this student.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileApplications;