import React from 'react';
import { Pie, Line } from 'react-chartjs-2';

const ProfileAnalytics = ({ userData, isAdminView }) => {
  // Status configuration for consistent styling
  const statusConfig = {
    pending: { label: '⏳ Under Review', class: 'bg-gray-100 text-gray-800', color: 'rgba(156, 163, 175, 0.7)' },
    shortlisted: { label: '✅ Shortlisted', class: 'bg-green-100 text-green-800', color: 'rgba(5, 150, 105, 0.7)' },
    waitlisted: { label: '🟡 On Hold / Waitlisted', class: 'bg-yellow-100 text-yellow-800', color: 'rgba(245, 158, 11, 0.7)' },
    interview_scheduled: { label: '📅 Interview Scheduled', class: 'bg-blue-100 text-blue-800', color: 'rgba(59, 130, 246, 0.7)' },
    selected: { label: '🌟 Selected', class: 'bg-purple-100 text-purple-800', color: 'rgba(139, 92, 246, 0.7)' },
    rejected: { label: '⚠️ Rejected', class: 'bg-red-100 text-red-800', color: 'rgba(239, 68, 68, 0.7)' }
  };

  // Prepare data for pie chart
  const prepareStatusPieData = () => {
    if (!userData?.analytics?.statusCounts) return null;
    
    const labels = [];
    const data = [];
    const backgroundColor = [];
    
    Object.entries(userData.analytics.statusCounts).forEach(([status, count]) => {
      labels.push(statusConfig[status]?.label || status);
      data.push(count);
      backgroundColor.push(statusConfig[status]?.color || 'rgba(156, 163, 175, 0.7)');
    });
    
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor,
          borderWidth: 1,
        },
      ],
    };
  };

  // Prepare data for applications over time chart
  const prepareApplicationsTimelineData = () => {
    if (!userData?.applications || userData.applications.length === 0) return null;
    
    // Group applications by month
    const applicationsByMonth = {};
    
    userData.applications.forEach(app => {
      if (!app.createdAt) return;
      
      let date;
      try {
        // Handle both Firestore timestamp and string date formats
        date = app.createdAt.toDate ? app.createdAt.toDate() : new Date(app.createdAt);
      } catch (e) {
        return;
      }
      
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      applicationsByMonth[monthYear] = (applicationsByMonth[monthYear] || 0) + 1;
    });
    
    // Sort by date
    const sortedMonths = Object.keys(applicationsByMonth).sort((a, b) => {
      const [aMonth, aYear] = a.split('/').map(Number);
      const [bMonth, bYear] = b.split('/').map(Number);
      return aYear === bYear ? aMonth - bMonth : aYear - bYear;
    });
    
    return {
      labels: sortedMonths,
      datasets: [
        {
          label: 'Applications',
          data: sortedMonths.map(month => applicationsByMonth[month]),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
        },
      ],
    };
  };

  // Calculate offer rate
  const calculateOfferRate = () => {
    if (!userData?.analytics?.statusCounts) return 0;
    
    const offersReceived = userData.analytics.statusCounts.selected || 0;
    const totalApplications = userData.analytics.totalApplications || 0;
    
    return totalApplications > 0 ? Math.round((offersReceived / totalApplications) * 100) : 0;
  };

  return (
    <div className="p-0 bg-white rounded-lg shadow">
      <div className="space-y-8 p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-800 mb-1">Total Applications</h4>
            <p className="text-3xl font-bold text-blue-900">{userData?.analytics?.totalApplications || 0}</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="text-sm font-medium text-purple-800 mb-1">Interviews Scheduled</h4>
            <p className="text-3xl font-bold text-purple-900">{userData?.analytics?.statusCounts?.interview_scheduled || 0}</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="text-sm font-medium text-green-800 mb-1">Offers Received</h4>
            <p className="text-3xl font-bold text-green-900">{userData?.analytics?.statusCounts?.selected || 0}</p>
          </div>
        </div>
        
        {/* Pie Chart: Application Status */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">📊 Application Status Breakdown</h3>
          <div className="h-64 flex justify-center">
            {prepareStatusPieData() ? (
              <Pie data={prepareStatusPieData()} options={{ maintainAspectRatio: false }} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No application data available
              </div>
            )}
          </div>
        </div>
        
        {/* Line Chart: Applications Over Time */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">📈 Applications Over Time</h3>
          <div className="h-64">
            {prepareApplicationsTimelineData() ? (
              <Line 
                data={prepareApplicationsTimelineData()} 
                options={{ 
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        precision: 0
                      }
                    }
                  }
                }} 
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No timeline data available
              </div>
            )}
          </div>
        </div>
        
        {/* Offer Rate */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Offer vs. Application Ratio</h3>
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-4xl font-bold text-blue-600">{calculateOfferRate()}%</p>
                  <p className="text-sm text-gray-500">Offer Rate</p>
                </div>
              </div>
              <svg viewBox="0 0 36 36" className="w-full h-full">
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#eee"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  strokeDasharray={`${calculateOfferRate()}, 100`}
                />
              </svg>
            </div>
          </div>
          <div className="text-center mt-4 text-sm text-gray-600">
            {userData?.analytics?.statusCounts?.selected || 0} offers out of {userData?.analytics?.totalApplications || 0} applications
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileAnalytics;