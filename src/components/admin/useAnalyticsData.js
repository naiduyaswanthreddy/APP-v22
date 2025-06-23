import { useState, useEffect } from 'react';
import { db } from '../../firebase'; // Assuming firebase.js is in the parent directory
import { collection, getDocs, query, where } from 'firebase/firestore';

// Accept filters as an argument
const useAnalyticsData = (filters) => {
  const [summaryData, setSummaryData] = useState({
    jobOpenings: 0,
    registeredStudents: 0,
    totalApplications: 0,
    placedStudents: 0,
    placementPercentage: 0,
  });

  const [branchData, setBranchData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Total Students',
        data: [],
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
      {
        label: 'Placed Students',
        data: [],
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      }
    ]
  });

  const [companyData, setCompanyData] = useState({
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [],
      borderColor: [],
      borderWidth: 1,
      label: 'Number of Hires'
    }]
  });

  const [companyKPIs, setCompanyKPIs] = useState([]);

  const [funnelData, setFunnelData] = useState({
    labels: ['Eligible', 'Applied', 'Shortlisted', 'Interviewed', 'Offers', 'Accepted'],
    datasets: [{
      label: 'Recruitment Funnel',
      data: [0, 0, 0, 0, 0, 0],
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1
    }]
  });

  const [roundData, setRoundData] = useState([]);

  const [trendData, setTrendData] = useState({});

  const [demographicData, setDemographicData] = useState({
    branch: { labels: [], datasets: [] },
    gender: { labels: [], datasets: [] },
    skills: { labels: [], datasets: [] },
  });

  // Helper function to apply filters to students
  const applyStudentFilters = (students, filters) => {
    return students.filter(student => {
      const batchMatch = !filters.batch || student.batch === filters.batch;
      const departmentMatch = !filters.department || student.department === filters.department;
      // Add other student filters here if needed
      return batchMatch && departmentMatch;
    });
  };

  // Helper function to apply filters to applications
  const applyApplicationFilters = (applications, filters) => {
    return applications.filter(app => {
      // Date range filter
      const appTimestamp = app.timestamp instanceof Date ? app.timestamp : new Date(app.timestamp);
      const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : null;
      const endDate = filters.dateRange.end ? new Date(filters.dateRange.end) : null;

      const dateMatch = (!startDate || appTimestamp >= startDate) && (!endDate || appTimestamp <= endDate);

      // Round filter (This is tricky as round status is nested.
      // For simplicity, let's assume filtering by round means filtering applications
      // that have a specific status in a specific round.
      // A more robust implementation might require filtering based on the *outcome* of a round.)
      // For now, we'll skip filtering by 'round' in applications unless specified how.
      // const roundMatch = !filters.round || (app.rounds && app.rounds[filters.round] !== undefined); // Example: filter if round exists

      return dateMatch; // && roundMatch;
    });
  };

  // Helper function to apply filters to jobs (primarily for KPI calculation)
  const applyJobFilters = (jobs, filters) => {
     return jobs.filter(job => {
         // Jobs don't typically have batch/department directly tied to the job itself,
         // but rather in eligibility criteria. Filtering jobs by batch/department
         // might not be the correct approach. Eligibility is checked per student per job.
         // We'll keep this simple and assume job filters aren't needed based on the current UI filters.
         // return true; // No job-specific filters from the UI currently

         // Apply date range filter to jobs based on a hypothetical 'postedDate' field
         const jobPostedDate = job.postedDate instanceof Date ? job.postedDate : (job.postedDate ? new Date(job.postedDate) : null);
         const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : null;
         const endDate = filters.dateRange.end ? new Date(filters.dateRange.end) : null;

         const dateMatch = (!startDate || (jobPostedDate && jobPostedDate >= startDate)) && (!endDate || (jobPostedDate && jobPostedDate <= endDate));

         // Currently, only date range filter is applied to jobs based on UI filters
         return dateMatch;
     });
  };


  // useEffect for overall summary data
  // Add filters to dependencies
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const jobsSnapshot = await getDocs(collection(db, 'jobs'));
        const allJobs = jobsSnapshot.docs.map(doc => {
             const data = doc.data();
             const eligibility = data.eligibilityCriteria || {};
             return {
                 id: doc.id,
                 ...data,
                 company: data.company?.trim() || 'Unknown Company', // Ensure company exists
                 minCGPA: parseFloat(eligibility.cgpa) || 0,
                 maxArrears: parseInt(eligibility.arrears) || Infinity,
                 batch: eligibility.batch || '',
                 department: Array.isArray(eligibility.department) ? eligibility.department : (eligibility.department ? [eligibility.department] : []),
                 postedDate: data.postedDate?.toDate() || null // Assuming postedDate exists and is a Timestamp
             };
        }).filter(job => job.company !== 'Unknown Company'); // Filter out jobs with no company

        // Apply job filters (though current UI filters don't apply directly to jobs)
        const filteredJobs = applyJobFilters(allJobs, filters);
        console.log('Filtered Jobs:', filteredJobs);

        const companies = new Set(filteredJobs.map(job => job.company));
        console.log('Companies from Filtered Jobs:', Array.from(companies));

        const studentsSnapshot = await getDocs(collection(db, 'students'));
        const allStudents = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Apply student filters
        const filteredStudents = applyStudentFilters(allStudents, filters);
        const registeredStudents = filteredStudents.length;

        const applicationsSnapshot = await getDocs(collection(db, 'applications'));
        const allApplications = applicationsSnapshot.docs.map(doc => ({
             id: doc.id,
             ...doc.data(),
             timestamp: doc.data().timestamp?.toDate() || new Date() // Ensure timestamp is Date object
        }));
        // Apply application filters
        const filteredApplications = applyApplicationFilters(allApplications, filters);
        const totalApplications = filteredApplications.length;

        // Filter placed students from the *filtered* student list
        // This requires knowing which of the filtered students are placed based on filtered applications
        const placedStudentIds = new Set(filteredApplications.filter(app => app.status === 'selected').map(app => app.student_id));
        const placedStudents = filteredStudents.filter(student => placedStudentIds.has(student.id)).length;


        const placementPercentage = registeredStudents > 0
          ? ((placedStudents / registeredStudents) * 100).toFixed(1)
          : 0;

        setSummaryData({
          jobOpenings: filteredJobs.length,  // Changed from totalJobs to filteredJobs.length
          registeredStudents: registeredStudents,
          totalApplications: totalApplications,
          placedStudents: placedStudents,
          placementPercentage,
        });

      } catch (error) {
        console.error('Error fetching analytics data:', error);
      }
    };

    fetchAnalyticsData();
  }, [filters]); // Add filters as a dependency

  // useEffect for branch data
  // Add filters to dependencies
  useEffect(() => {
    const fetchBranchData = async () => {
      try {
        const studentsSnapshot = await getDocs(collection(db, 'students'));
        const allStudents = studentsSnapshot.docs.map(doc => ({
             id: doc.id,
             ...doc.data(),
             department: doc.data().department || 'Unknown'
        }));

        // Apply student filters
        const filteredStudents = applyStudentFilters(allStudents, filters);

        const applicationsSnapshot = await getDocs(collection(db, 'applications'));
         const allApplications = applicationsSnapshot.docs.map(doc => ({
             id: doc.id,
             ...doc.data(),
             timestamp: doc.data().timestamp?.toDate() || new Date() // Ensure timestamp is Date object
         }));
         // Apply application filters
         const filteredApplications = applyApplicationFilters(allApplications, filters);

         // Map filtered applications back to filtered students to check placement status
         const placedStudentIds = new Set(filteredApplications.filter(app => app.status === 'selected').map(app => app.student_id));


        const branchCounts = {};
        const placedCounts = {};

        filteredStudents.forEach((student) => {
          const branch = student.department;
          branchCounts[branch] = (branchCounts[branch] || 0) + 1;
          // Check if this filtered student is in the set of placed students from filtered applications
          if (placedStudentIds.has(student.id)) {
            placedCounts[branch] = (placedCounts[branch] || 0) + 1;
          }
        });

        const branches = Object.keys(branchCounts).sort();

        setBranchData({
          labels: branches,
          datasets: [
            {
              label: 'Total Students',
              data: branches.map(branch => branchCounts[branch]),
              backgroundColor: 'rgba(53, 162, 235, 0.5)',
            },
            {
              label: 'Placed Students',
              data: branches.map(branch => placedCounts[branch] || 0),
              backgroundColor: 'rgba(75, 192, 192, 0.5)',
            }
          ]
        });
      } catch (error) {
        console.error('Error fetching branch data:', error);
      }
    };

    fetchBranchData();
  }, [filters]); // Add filters as a dependency

  // useEffect for company data (Top Recruiting Companies)
  // Add filters to dependencies
  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const applicationsSnapshot = await getDocs(collection(db, 'applications'));
        const allApplications = applicationsSnapshot.docs.map(doc => ({
             id: doc.id,
             ...doc.data(),
             timestamp: doc.data().timestamp?.toDate() || new Date() // Ensure timestamp is Date object
        }));

        // Apply application filters
        const filteredApplications = applyApplicationFilters(allApplications, filters);

        const companyHires = {};

        filteredApplications.forEach((application) => {
          if (application.companyName && application.status === 'selected') {
            companyHires[application.companyName] = (companyHires[application.companyName] || 0) + 1;
          }
        });

        const sortedCompanies = Object.entries(companyHires)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5);

        setCompanyData({
          labels: sortedCompanies.map(([company]) => company),
          datasets: [{
            label: 'Number of Hires',
            data: sortedCompanies.map(([,count]) => count),
            backgroundColor: [
              'rgba(255, 99, 132, 0.5)',
              'rgba(54, 162, 235, 0.5)',
              'rgba(255, 206, 86, 0.5)',
              'rgba(75, 192, 192, 0.5)',
              'rgba(153, 102, 255, 0.5)',
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(153, 102, 255, 1)',
            ],
            borderWidth: 1,
          }]
        });
      } catch (error) {
        console.error('Error fetching company data:', error);
      }
    };

    fetchCompanyData();
  }, [filters]); // Add filters as a dependency

  // useEffect to compute company KPIs
  // Add filters to dependencies
  useEffect(() => {
    const fetchCompanyKPIs = async () => {
      try {
        const jobsSnapshot = await getDocs(collection(db, 'jobs'));
        const allJobs = jobsSnapshot.docs.map(doc => {
             const data = doc.data();
             const eligibility = data.eligibilityCriteria || {};
             return {
                 id: doc.id,
                 ...data,
                 company: data.company?.trim() || 'Unknown Company', // Ensure company exists
                 minCGPA: parseFloat(eligibility.cgpa) || 0,
                 maxArrears: parseInt(eligibility.arrears) || Infinity,
                 batch: eligibility.batch || '',
                 department: Array.isArray(eligibility.department) ? eligibility.department : (eligibility.department ? [eligibility.department] : []),
                 postedDate: data.postedDate?.toDate() || null // Assuming postedDate exists and is a Timestamp
             };
        }).filter(job => job.company !== 'Unknown Company'); // Filter out jobs with no company

        // Apply job filters (though current UI filters don't apply directly to jobs)
        const filteredJobs = applyJobFilters(allJobs, filters);
        console.log('Filtered Jobs:', filteredJobs);

        const companies = new Set(filteredJobs.map(job => job.company));
        console.log('Companies from Filtered Jobs:', Array.from(companies));


        const studentsSnapshot = await getDocs(collection(db, 'students'));
        const allStudents = studentsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            cgpa: parseFloat(data.cgpa) || 0,
            arrears: parseInt(data.arrears) || 0,
            batch: data.batch || '',
            department: data.department || ''
          };
        });

        // Apply student filters
        const filteredStudents = applyStudentFilters(allStudents, filters);
        console.log('Filtered Students:', filteredStudents);


        const applicationsSnapshot = await getDocs(collection(db, 'applications'));
        const allApplications = applicationsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            companyName: data.companyName || data.company,
            status: data.status || 'pending',
            timestamp: data.timestamp?.toDate() || new Date() // Ensure timestamp is Date object
          };
        });

        // Apply application filters
        const filteredApplications = applyApplicationFilters(allApplications, filters);
        console.log('Filtered Applications:', filteredApplications);


        // Calculate KPIs for each company based on *filtered* data
        const kpis = Array.from(companies).map(company => {
          // Get jobs relevant to this company *after* job filters are applied
          const companyJobs = filteredJobs.filter(job => job.company === company);

          // Calculate eligible students from the *filtered* student list
          const eligibleStudents = filteredStudents.filter(student =>
            companyJobs.some(job => {
              const meetsGPA = student.cgpa >= job.minCGPA;
              const meetsArrears = student.arrears <= job.maxArrears;
              const meetsBatch = !job.batch || student.batch === job.batch;
              const meetsDepartment = !job.department || (Array.isArray(job.department) && (!job.department.length || job.department.includes(student.department)));

              // Log eligibility check details for debugging (uncomment if needed)
              // console.log(`Checking eligibility for Student ${student.id} for Job ${job.id} (${job.company}):`);
              // console.log(`  CGPA: ${student.cgpa} >= ${job.minCGPA} (${meetsGPA})`);
              // console.log(`  Arrears: ${student.arrears} <= ${job.maxArrears} (${meetsArrears})`);
              // console.log(`  Batch: ${student.batch} === ${job.batch} (${meetsBatch})`);
              // console.log(`  Department: ${student.department} in ${job.department} (${meetsDepartment})`);
              // console.log(`  Overall Eligible for this job: ${meetsGPA && meetsArrears && meetsBatch && meetsDepartment}`);

              return meetsGPA && meetsArrears && meetsBatch && meetsDepartment;
            })
          );

          // Log eligible students for this company
          console.log(`Eligible Students for ${company}:`, eligibleStudents);


          // Calculate applications and status from the *filtered* application list
          const companyApplications = filteredApplications.filter(app => app.companyName === company);
          const applied = companyApplications.length;
          const eligible = eligibleStudents.length; // <-- This is the count being reported as 0
          const notApplied = Math.max(0, eligible - applied);
          const selected = companyApplications.filter(app => app.status === 'selected').length;
          const rejected = companyApplications.filter(app => app.status === 'rejected').length;

          return {
            company,
            eligible,
            applied,
            notApplied,
            selected,
            rejected,
            appliedPct: eligible > 0 ? ((applied / eligible) * 100).toFixed(1) : '0.0',
            notAppliedPct: eligible > 0 ? ((notApplied / eligible) * 100).toFixed(1) : '0.0',
            selectedPct: applied > 0 ? ((selected / applied) * 100).toFixed(1) : '0.0',
            rejectedPct: applied > 0 ? ((rejected / applied) * 100).toFixed(1) : '0.0',
          };
        });

        setCompanyKPIs(kpis);
      } catch (error) {
        console.error('Error fetching company KPIs:', error);
      }
    };

    fetchCompanyKPIs();
  }, [filters]); // Add filters as a dependency

  // useEffect for funnel and round data
  // Add filters to dependencies
  useEffect(() => {
    const fetchFunnelAndRoundData = async () => {
      try {
        const applicationsSnapshot = await getDocs(collection(db, 'applications'));
        const allApplications = applicationsSnapshot.docs.map(doc => ({
             id: doc.id,
             ...doc.data(),
             timestamp: doc.data().timestamp?.toDate() || new Date() // Ensure timestamp is Date object
        }));

        // Apply application filters
        const filteredApplications = applyApplicationFilters(allApplications, filters);

        const studentsSnapshot = await getDocs(collection(db, 'students'));
        const allStudents = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Apply student filters to get the base population for 'Eligible'
        const filteredStudents = applyStudentFilters(allStudents, filters);
        const totalEligibleStudents = filteredStudents.length;


        const funnelCounts = {
          eligible: totalEligibleStudents, // Eligible count based on filtered students
          applied: filteredApplications.length, // Applied count based on filtered applications
          shortlisted: 0,
          interviewed: 0,
          offers: 0,
          accepted: 0
        };
        const roundStats = {
          'Resume Screening': { started: 0, passed: 0 }, 'Aptitude Test': { started: 0, passed: 0 },
          'Technical Interview': { started: 0, passed: 0 }, 'HR Interview': { started: 0, passed: 0 }
        };

        // Count statuses and rounds based on *filtered* applications
        filteredApplications.forEach(app => {
          if (app.status === 'shortlisted') funnelCounts.shortlisted++;
          if (app.status === 'interviewed') funnelCounts.interviewed++;
          if (app.status === 'offered') funnelCounts.offers++;
          if (app.status === 'accepted') funnelCounts.accepted++;
          Object.entries(app.rounds || {}).forEach(([round, status]) => {
            if (roundStats[round]) {
              roundStats[round].started++;
              if (status === 'passed') roundStats[round].passed++;
            }
          });
        });

        setFunnelData(prev => ({ ...prev, datasets: [{ ...prev.datasets[0], data: Object.values(funnelCounts) }] }));
        setRoundData(Object.entries(roundStats).map(([round, stats]) => ({
          round, started: stats.started, passed: stats.passed, eliminated: stats.started - stats.passed
        })));
      } catch (error) {
        console.error('Error fetching funnel and round data:', error);
      }
    };
    fetchFunnelAndRoundData();
  }, [filters]); // Add filters as a dependency

  // useEffect for Demographic and Skill Breakdowns
  // Add filters to dependencies
  useEffect(() => {
    const fetchDemographicAndSkillData = async () => {
      try {
        const studentsSnapshot = await getDocs(collection(db, 'students'));
        const allStudents = studentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          department: doc.data().department || 'Unknown',
          gender: doc.data().gender || 'Unknown',
          skills: Array.isArray(doc.data().skills) ? doc.data().skills : []
        }));

        // Apply student filters
        const filteredStudents = applyStudentFilters(allStudents, filters);

        const applicationsSnapshot = await getDocs(collection(db, 'applications'));
        const allApplications = applicationsSnapshot.docs.map(doc => ({
             id: doc.id,
             ...doc.data(),
             timestamp: doc.data().timestamp?.toDate() || new Date() // Ensure timestamp is Date object
        }));

        // Apply application filters
        const filteredApplications = applyApplicationFilters(allApplications, filters);

        // Get the set of student IDs who have applications *after* application filters
        const studentIdsWithFilteredApplications = new Set(filteredApplications.map(app => app.student_id));

        // Get the set of student IDs who have *selected* applications *after* application filters
        const studentIdsWithFilteredSelectedApplications = new Set(filteredApplications.filter(app => app.status === 'selected').map(app => app.student_id));


        // --- Branch/Department Distribution (Applicants vs. Selected) ---
        const branchApplicantCounts = {};
        const branchSelectedCounts = {};

        // Count applicants and selected from the *filtered* student list
        // but only include students who have applications *after* application filters
        filteredStudents.filter(student => studentIdsWithFilteredApplications.has(student.id)).forEach(student => {
             const branch = student.department;
             branchApplicantCounts[branch] = (branchApplicantCounts[branch] || 0) + 1;
             // Check if this filtered student is in the set of placed students from filtered applications
             if (studentIdsWithFilteredSelectedApplications.has(student.id)) {
               branchSelectedCounts[branch] = (branchSelectedCounts[branch] || 0) + 1;
             }
        });


        const branches = Object.keys({ ...branchApplicantCounts, ...branchSelectedCounts }).sort();
        const branchDatasets = [
          {
            label: 'Applicants',
            data: branches.map(branch => branchApplicantCounts[branch] || 0),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
          },
          {
            label: 'Selected',
            data: branches.map(branch => branchSelectedCounts[branch] || 0),
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
          }
        ];

        // --- Gender Breakdown ---
        const genderApplicantCounts = {};
        const genderSelectedCounts = {};

        // Count applicants and selected from the *filtered* student list
        // but only include students who have applications *after* application filters
         filteredStudents.filter(student => studentIdsWithFilteredApplications.has(student.id)).forEach(student => {
             const gender = student.gender;
             genderApplicantCounts[gender] = (genderApplicantCounts[gender] || 0) + 1;
             // Check if this filtered student is in the set of placed students from filtered applications
             if (studentIdsWithFilteredSelectedApplications.has(student.id)) {
               genderSelectedCounts[gender] = (genderSelectedCounts[gender] || 0) + 1;
             }
         });


        const genders = Object.keys({ ...genderApplicantCounts, ...genderSelectedCounts }).sort();
        const genderDatasets = [
             {
               label: 'Applicants',
               data: genders.map(gender => genderApplicantCounts[gender] || 0),
               backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966CC'],
             },
             {
               label: 'Selected',
               data: genders.map(gender => genderSelectedCounts[gender] || 0),
               backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966CC'],
             }
           ];

        // --- Top Skills ---
        const skillApplicantCounts = {};
        const skillSelectedCounts = {};

        // Count applicants and selected from the *filtered* student list
        // but only include students who have applications *after* application filters
         filteredStudents.filter(student => studentIdsWithFilteredApplications.has(student.id)).forEach(student => {
             student.skills.forEach(skill => {
                 skillApplicantCounts[skill] = (skillApplicantCounts[skill] || 0) + 1;
             });
         });

         filteredStudents.filter(student => studentIdsWithFilteredSelectedApplications.has(student.id)).forEach(student => {
             student.skills.forEach(skill => {
                 skillSelectedCounts[skill] = (skillSelectedCounts[skill] || 0) + 1;
             });
         });


        const allSkills = Object.keys({ ...skillApplicantCounts, ...skillSelectedCounts });
        const sortedSkills = allSkills.sort((a, b) => (skillApplicantCounts[b] || 0) - (skillApplicantCounts[a] || 0)).slice(0, 10);

        const skillDatasets = [
          {
            label: 'Applicants',
            data: sortedSkills.map(skill => skillApplicantCounts[skill] || 0),
            backgroundColor: 'rgba(153, 102, 255, 0.6)',
          },
          {
            label: 'Selected',
            data: sortedSkills.map(skill => skillSelectedCounts[skill] || 0),
            backgroundColor: 'rgba(255, 159, 64, 0.6)',
          }
        ];

        setDemographicData({
          branch: { labels: branches, datasets: branchDatasets },
          gender: { labels: genders, datasets: genderDatasets },
          skills: { labels: sortedSkills, datasets: skillDatasets },
        });

      } catch (error) {
        console.error('Error fetching demographic and skill data:', error);
      }
    };

    fetchDemographicAndSkillData();
  }, [filters]); // Add filters as a dependency

  // useEffect for trend data
  // Add filters to dependencies
  useEffect(() => {
    const fetchTrendData = async () => {
      try {
        const applicationsSnapshot = await getDocs(collection(db, 'applications'));
        const allApplications = applicationsSnapshot.docs.map(doc => ({
          ...doc.data(), timestamp: doc.data().timestamp?.toDate() || new Date()
        }));

        // Apply application filters
        const filteredApplications = applyApplicationFilters(allApplications, filters);

        const dateGroups = {}; const acceptedGroups = {};
        filteredApplications.forEach(app => {
          const date = app.timestamp.toLocaleDateString();
          dateGroups[date] = (dateGroups[date] || 0) + 1;
          if (app.status === 'accepted') {
            acceptedGroups[date] = (acceptedGroups[date] || 0) + 1;
          }
        });
        const dates = Object.keys(dateGroups).sort();
        setTrendData({
          labels: dates,
          datasets: [
            { label: 'Applications', data: dates.map(date => dateGroups[date]), borderColor: 'rgba(53, 162, 235, 1)', tension: 0.1 },
            { label: 'Offers Accepted', data: dates.map(date => acceptedGroups[date] || 0), borderColor: 'rgba(75, 192, 192, 1)', tension: 0.1 }
          ]
        });
      } catch (error) {
        console.error('Error fetching trend data:', error);
      }
    };
    fetchTrendData();
  }, [filters]); // Add filters as a dependency


  return {
    summaryData,
    branchData,
    companyData,
    companyKPIs,
    funnelData,
    roundData,
    trendData,
    demographicData,
  };
};

export default useAnalyticsData;