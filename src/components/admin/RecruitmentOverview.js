import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';
import {
    WorkOutline as WorkOutlineIcon,
    CheckCircleOutline as CheckCircleOutlineIcon,
    AttachMoney as AttachMoneyIcon,
    CalendarToday as CalendarTodayIcon,
    HourglassEmpty as HourglassEmptyIcon,
    People as PeopleIcon,
    TrendingUp as TrendingUpIcon
} from '@mui/icons-material';

const RecruitmentOverview = ({ companyId, companyName, applications = [], jobs = [] }) => {
    const [stats, setStats] = useState({
        totalJobsPosted: 0,
        openPositions: 0,
        highestCTCOffered: 'N/A',
        internshipStipendRange: 'N/A',
        applicationDeadlinesSoon: 0,
        totalApplications: 0,
        selectedStudentsCount: 0,
        pendingApplications: 0,
        shortlistedApplications: 0,
        rejectedApplications: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRecruitmentData = async () => {
            setLoading(true);
            setError(null);
            try {
                let totalJobs = 0;
                let openPositionsCount = 0;
                let maxCTC = 0;
                let minStipend = Infinity;
                let maxStipend = 0;
                let deadlinesSoonCount = 0;

                const today = new Date();
                const sevenDaysFromNow = new Date();
                sevenDaysFromNow.setDate(today.getDate() + 7);

                // Use provided jobs or fetch from Firestore
                let companyJobs = jobs;
                if (jobs.length === 0 && companyName) {
                    const jobsRef = collection(db, 'jobs');
                    const q = query(jobsRef, where('companyName', '==', companyName));
                    const querySnapshot = await getDocs(q);
                    companyJobs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                }

                // Process jobs data
                companyJobs.forEach((job) => {
                    totalJobs++;
                    if (job.status === 'open' || job.jobStatus === 'Open for Applications') {
                        openPositionsCount++;
                    }

                    if (job.ctc && typeof job.ctc === 'number') {
                        if (job.ctc > maxCTC) {
                            maxCTC = job.ctc;
                        }
                    }

                    if (job.salary && typeof job.salary === 'number') {
                        if (job.salary > maxCTC) {
                            maxCTC = job.salary;
                        }
                    }

                    if (job.stipend && typeof job.stipend === 'number') {
                        if (job.stipend < minStipend) {
                            minStipend = job.stipend;
                        }
                        if (job.stipend > maxStipend) {
                            maxStipend = job.stipend;
                        }
                    }

                    if (job.applicationDeadline) {
                        const deadline = new Date(job.applicationDeadline.seconds ? 
                            job.applicationDeadline.seconds * 1000 : job.applicationDeadline);
                        if (deadline > today && deadline <= sevenDaysFromNow) {
                            deadlinesSoonCount++;
                        }
                    }
                });

                // Use provided applications or calculate from jobs
                let companyApplications = applications;
                if (applications.length === 0 && companyJobs.length > 0) {
                    const jobIds = companyJobs.map(job => job.id);
                    const applicationsRef = collection(db, 'applications');
                    let allApplications = [];

                    for (const jobId of jobIds) {
                        const applicationsQuery1 = query(applicationsRef, where('jobId', '==', jobId));
                        const applicationsQuery2 = query(applicationsRef, where('job_id', '==', jobId));
                        
                        const [snapshot1, snapshot2] = await Promise.all([
                            getDocs(applicationsQuery1),
                            getDocs(applicationsQuery2)
                        ]);
                        
                        const applications = [
                            ...snapshot1.docs.map(doc => ({ id: doc.id, ...doc.data() })),
                            ...snapshot2.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                        ];
                        
                        const uniqueApplications = applications.filter((app, index, self) => 
                            index === self.findIndex(a => a.id === app.id)
                        );
                        
                        allApplications = [...allApplications, ...uniqueApplications];
                    }
                    companyApplications = allApplications;
                }

                // Calculate application statistics
                const totalApplications = companyApplications.length;
                const selectedStudentsCount = companyApplications.filter(app => app.status === 'selected').length;
                const pendingApplications = companyApplications.filter(app => !app.status || app.status === 'pending').length;
                const rejectedApplications = companyApplications.filter(app => app.status === 'rejected').length;
                const shortlistedApplications = companyApplications.filter(app => app.status === 'shortlisted').length;

                setStats({
                    totalJobsPosted: totalJobs,
                    openPositions: openPositionsCount,
                    highestCTCOffered: maxCTC > 0 ? `${maxCTC} LPA` : 'N/A',
                    internshipStipendRange: (minStipend !== Infinity && maxStipend > 0) ?
                        `${minStipend} - ${maxStipend} /month` : 'N/A',
                    applicationDeadlinesSoon: deadlinesSoonCount,
                    totalApplications: totalApplications,
                    selectedStudentsCount: selectedStudentsCount,
                    pendingApplications: pendingApplications,
                    rejectedApplications: rejectedApplications,
                    shortlistedApplications: shortlistedApplications
                });

            } catch (err) {
                console.error("Error fetching recruitment data:", err);
                setError("Failed to load recruitment data.");
            } finally {
                setLoading(false);
            }
        };

        if (companyId || companyName) {
            fetchRecruitmentData();
        }
    }, [companyId, companyName, applications, jobs]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }

    const statCards = [
        {
            title: "Total Jobs Posted",
            value: stats.totalJobsPosted,
            icon: <WorkOutlineIcon color="primary" />,
        },
        {
            title: "Open Positions",
            value: stats.openPositions,
            icon: <CheckCircleOutlineIcon color="success" />,
        },
        {
            title: "Total Applications",
            value: stats.totalApplications,
            icon: <PeopleIcon color="info" />,
        },
        {
            title: "Selected Students",
            value: stats.selectedStudentsCount,
            icon: <TrendingUpIcon color="success" />,
        },
        {
            title: "Pending Applications",
            value: stats.pendingApplications,
            icon: <HourglassEmptyIcon color="warning" />,
        },
        {
            title: "Highest CTC Offered",
            value: stats.highestCTCOffered,
            icon: <AttachMoneyIcon color="action" />,
        },
        {
            title: "Shortlisted",
            value: stats.shortlistedApplications,
            icon: <CheckCircleOutlineIcon color="info" />,
        },
        {
            title: "Rejected",
            value: stats.rejectedApplications,
            icon: <HourglassEmptyIcon color="error" />,
        },
    ];

    return (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mt: 2 }}>
            {statCards.map((card, index) => (
                <Card key={index} raised>
                    <CardContent>
                        <Box display="flex" alignItems="center" mb={1}>
                            {card.icon}
                            <Typography variant="h6" component="div" sx={{ ml: 1 }}>
                                {card.title}
                            </Typography>
                        </Box>
                        <Typography variant="h4" color="text.secondary">
                            {card.value}
                        </Typography>
                    </CardContent>
                </Card>
            ))}
        </Box>
    );
};

export default RecruitmentOverview;
