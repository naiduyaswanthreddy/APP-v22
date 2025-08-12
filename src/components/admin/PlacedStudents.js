import React, { useState, useEffect } from 'react';
import { getDocs, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';

const PlacedStudents = () => {
  const [placedStudents, setPlacedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    batch: 'all',
    company: 'all',
    department: 'all'
  });

  useEffect(() => {
    fetchPlacedStudents();
  }, [filters]);

  const fetchPlacedStudents = async () => {
    try {
      setLoading(true);
      
      // Query for placed students with enhanced data
      // Note: This query requires a composite index in Firestore:
      // Collection: students
      // Fields: placementStatus (ASC), placedAt (DESC)
      // Create at: https://console.firebase.google.com/project/trail-f142f/firestore/indexes
      const studentsQuery = query(
        collection(db, 'students'),
        where('placementStatus', '==', 'placed'),
        orderBy('placedAt', 'desc')
      );
      
      const studentsSnapshot = await getDocs(studentsQuery);
      let students = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Apply filters
      if (filters.batch !== 'all') {
        students = students.filter(student => student.batch === filters.batch);
      }
      if (filters.department !== 'all') {
        students = students.filter(student => student.department === filters.department);
      }
      if (filters.company !== 'all') {
        students = students.filter(student => student.placedCompany === filters.company);
      }

      // Get unique companies for filter
      const companies = [...new Set(students.map(s => s.placedCompany))];
      const departments = [...new Set(students.map(s => s.department))];
      const batches = [...new Set(students.map(s => s.batch))];

      setPlacedStudents(students);
      setCompanies(companies);
      setDepartments(departments);
      setBatches(batches);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching placed students:', error);
      setLoading(false);
    }
  };

  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [batches, setBatches] = useState([]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Placed Students</h1>
        <div className="text-sm text-gray-600">
          Total Placed: {placedStudents.length}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Batch</label>
            <select
              value={filters.batch}
              onChange={(e) => setFilters({...filters, batch: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="all">All Batches</option>
              {batches.map(batch => (
                <option key={batch} value={batch}>{batch}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Company</label>
            <select
              value={filters.company}
              onChange={(e) => setFilters({...filters, company: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="all">All Companies</option>
              {companies.map(company => (
                <option key={company} value={company}>{company}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Department</label>
            <select
              value={filters.department}
              onChange={(e) => setFilters({...filters, department: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CTC/Stipend</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Placed Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {placedStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.rollNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.batch}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.placedJobTitle}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.placedCompany}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.placedPackage}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.placedAt?.toDate().toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlacedStudents;
