import React, { useState, useEffect } from 'react';
import { 
  Users, Briefcase, FileText, CheckCircle, 
  TrendingUp, Building, Clock, Download, Filter 
} from 'lucide-react';
// Remove firebase imports as they are now in the hook
// import { db } from '../../firebase';
// import { collection, getDocs, query, where } from 'firebase/firestore';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
// {{ edit_1 }}
// Import the new custom hook
import useAnalyticsData from './useAnalyticsData';
// {{ end_edit_1 }}


ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement
);

const Analytics = () => {
  // Keep state variables related to UI interaction (filters, selected companies)
  const [filters, setFilters] = useState({
    batch: '',
    department: '',
    round: '',
    dateRange: { start: '', end: '' }
  });

  const [selectedCompanies, setSelectedCompanies] = useState([]);

  // {{ edit_2 }}
  // Use the custom hook and pass the filters state
  const {
    summaryData,
    branchData,
    companyData,
    companyKPIs,
    funnelData,
    roundData,
    trendData,
    demographicData,
  } = useAnalyticsData(filters); // Pass filters here
  // {{ end_edit_2 }}

  // Remove all useEffect hooks for data fetching
  // useEffect for overall summary data
  // useEffect(() => { ... }, []);
  // useEffect for branch data
  // useEffect(() => { ... }, []);
  // useEffect for company data (Top Recruiting Companies)
  // useEffect(() => { ... }, []);
  // useEffect to compute company KPIs
  // useEffect(() => { ... }, []);
  // useEffect for funnel and round data
  // useEffect(() => { ... }, []);
  // useEffect for Demographic and Skill Breakdowns
  // useEffect(() => { ... }, []);
  // useEffect for trend data
  // useEffect(() => { ... }, []);


  // Add export functionality
  // Update the handleExport function
  const handleExport = () => {
    const dataToExport = selectedCompanies.length > 0
      ? companyKPIs.filter(kpi => selectedCompanies.includes(kpi.company))
      : companyKPIs;

    if (!dataToExport || dataToExport.length === 0) {
      alert('No data available to export');
      return;
    }

    try {
      const headers = [
        'Company',
        'Eligible Students',
        'Applied',
        'Applied %',
        'Not Applied',
        'Not Applied %',
        'Selected',
        'Selected %',
        'Rejected',
        'Rejected %'
      ];

      const csvData = [
        headers.join(','),
        ...dataToExport.map(kpi => [
          kpi.company,
          kpi.eligible,
          kpi.applied,
          `${kpi.appliedPct}%`,
          kpi.notApplied,
          `${kpi.notAppliedPct}%`,
          kpi.selected,
          `${kpi.selectedPct}%`,
          kpi.rejected,
          `${kpi.rejectedPct}%`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `placement_stats_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  // Update the handleFilterChange function
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setSelectedCompanies([]); // Reset selections when filter changes
  };

  // Update the handleCompanySelect function
  const handleCompanySelect = (companyName) => {
    setSelectedCompanies(prev => {
      const isSelected = prev.includes(companyName);
      return isSelected
        ? prev.filter(name => name !== companyName)
        : [...prev, companyName];
    });
  };

  // Handler for date range filter changes
  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [name]: value
      }
    }));
  };

  const filteredCompanyKPIs = selectedCompanies.length > 0
    ? companyKPIs.filter(kpi => selectedCompanies.includes(kpi.company))
    : companyKPIs;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false, // Titles are handled by h3 tags
        text: '',
      },
    },
    maintainAspectRatio: false, // Allow height to be controlled by parent div
  };

  const demographicBranchChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        display: true,
        text: 'Branch/Department Distribution',
      },
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        beginAtZero: true,
      },
    },
  };

  const companyChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        display: true,
        text: 'Top Recruiting Companies',
      },
    },
  };

  const funnelChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        display: true,
        text: 'Application Funnel',
      },
    },
    scales: {
      x: {
        beginAtZero: true,
      },
      y: {
        beginAtZero: true,
      },
    },
  };

  const skillChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        display: true,
        text: 'Top Skills',
      },
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        beginAtZero: true,
      },
    },
  };


  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h1>

      {/* Actionable Filters */}
      <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
          <Filter size={20} className="mr-2" /> Filters
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Batch Filter */}
          <div>
            <label htmlFor="batch" className="block text-sm font-medium text-gray-700">Batch</label>
            <select
              id="batch"
              name="batch"
              value={filters.batch}
              onChange={handleFilterChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="">All Batches</option>
              {/* TODO: Populate with actual batch options */}
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department</label>
            <select
              id="department"
              name="department"
              value={filters.department}
              onChange={handleFilterChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="">All Departments</option>
              <option value="CSE">CSE</option>
              <option value="AIE">AIE</option>
              <option value="CCE">CCE</option>
              <option value="ECE">ECE</option>
            </select>
          </div>

          {/* Round Filter */}
          <div>
            <label htmlFor="round" className="block text-sm font-medium text-gray-700">Round</label>
            <select
              id="round"
              name="round"
              value={filters.round}
              onChange={handleFilterChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="">All Rounds</option>
              {/* TODO: Populate with actual round options */}
              <option value="Resume Screening">Resume Screening</option>
              <option value="Aptitude Test">Aptitude Test</option>
              <option value="Technical Interview">Technical Interview</option>
              <option value="HR Interview">HR Interview</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700">Date Range</label>
            <div className="flex space-x-2 mt-1">
              <input
                type="date"
                name="start"
                value={filters.dateRange.start}
                onChange={handleDateRangeChange}
                className="block w-1/2 pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              />
              <input
                type="date"
                name="end"
                value={filters.dateRange.end}
                onChange={handleDateRangeChange}
                className="block w-1/2 pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              />
            </div>
          </div>
        </div>
      </section>


      {/* Overall Placement Summary */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-700">🎯 Overall Placement Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Job Openings</p>
                <p className="text-2xl font-bold text-gray-800">{summaryData.jobOpenings}</p>
              </div>
              <Briefcase className="text-blue-500" size={24} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Registered Students</p>
                <p className="text-2xl font-bold text-gray-800">{summaryData.registeredStudents}</p>
              </div>
              <Users className="text-green-500" size={24} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Applications</p>
                <p className="text-2xl font-bold text-gray-800">{summaryData.totalApplications}</p>
              </div>
              <FileText className="text-purple-500" size={24} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Placement Rate</p>
                <p className="text-2xl font-bold text-gray-800">{summaryData.placementPercentage}%</p>
              </div>
              <TrendingUp className="text-teal-500" size={24} />
            </div>
          </div>
        </div>
      </section>

      {/* Student Analytics */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branch/Department Distribution (Applicants vs. Selected) */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">🏢 Branch/Department Distribution (Applicants vs. Selected)</h3>
          <div className="h-64">
            {demographicData.branch.labels.length > 0 ? (
              <Bar options={demographicBranchChartOptions} data={demographicData.branch} />
            ) : (
              <p className="text-gray-500">No branch distribution data available.</p>
            )}
          </div>
        </div>

        {/* Top Recruiting Companies Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">💼 Top Recruiting Companies</h3>
          <div className="h-64">
            {companyData.labels.length > 0 ? (
              <Pie options={companyChartOptions} data={companyData} />
            ) : (
              <p className="text-gray-500">No company data available.</p>
            )}
          </div>
        </div>
      </section>

      {/* Application Funnel */}
      <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">📊 Application Funnel</h3>
        <div className="h-64">
          {funnelData.datasets[0].data.some(d => d > 0) ? (
            <Bar options={funnelChartOptions} data={funnelData} />
          ) : (
            <p className="text-gray-500">No funnel data available.</p>
          )}
        </div>
      </section>

      {/* Demographic and Skill Breakdowns */}
    

      {/* Company Metrics Table with Export Button */}
      <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">🎯 Company-wise Recruitment Status</h3>
          <button
            onClick={handleExport}
            // {{ edit_3 }}
            // Disable export if no data is available after filtering
            disabled={!filteredCompanyKPIs || filteredCompanyKPIs.length === 0}
            className={`flex items-center px-4 py-2 rounded-lg ${
              filteredCompanyKPIs && filteredCompanyKPIs.length > 0
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            title={filteredCompanyKPIs && filteredCompanyKPIs.length > 0 ? 'Export data to CSV' : 'No data available to export'}
            // {{ end_edit_3 }}
          >
            <Download size={16} className="mr-2" />
            Export Data
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {/* {{ edit_4 }} */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Select
                </th>
                {/* {{ end_edit_4 }} */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Eligible</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Not Applied</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selected</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rejected</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* {{ edit_5 }} */}
              {filteredCompanyKPIs && filteredCompanyKPIs.map(kpi => (
                <tr key={kpi.company}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <input
                      type="checkbox"
                      checked={selectedCompanies.includes(kpi.company)}
                      onChange={() => handleCompanySelect(kpi.company)}
                      className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                    />
                  </td>
                  {/* {{ end_edit_5 }} */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{kpi.company}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{kpi.eligible}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {kpi.applied} ({kpi.appliedPct}%)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {kpi.notApplied} ({kpi.notAppliedPct}%)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {kpi.selected} ({kpi.selectedPct}%)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {kpi.rejected} ({kpi.rejectedPct}%)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>





      </div>
    );
};

export default Analytics;
