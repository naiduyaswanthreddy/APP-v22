[Documentation](https://amritacampusamaravati-my.sharepoint.com/my?id=%2Fpersonal%2Fav%5Fen%5Fu4cse22129%5Fav%5Fstudents%5Famrita%5Fedu%2FDocuments%2FPlacement%5FPortal&ga=1&noAuthRedirect=1)




## Overview
A comprehensive campus placement management system built with React.js that facilitates the interaction between students, administrators, and companies during the placement process.

## Tech Stack
- Frontend Framework : React.js
- UI Components :
  - Material-UI (@mui/material)
  - Tailwind CSS (for styling)
  - Lucide React (for icons)
  - React Icons
- Authentication & Database : Firebase
  - Firebase Authentication
  - Firestore Database
- Routing : React Router DOM v7
- Data Visualization :
  - Chart.js
  - React-Chartjs-2
  - Recharts
- PDF Generation : @react-pdf/renderer
- Date Handling : date-fns
- Notifications : React-Toastify
- Excel Support : xlsx
## Key Features
### Student Features
1. Profile Management
   
   - Personal information management
   - GitHub activity calendar integration
   - Skills and education details
2. Job Applications
   
   - View and apply for job postings
   - Track application status (pending, under_review, shortlisted, etc.)
   - Receive notifications for application updates
3. Coding Progress
   
   - Track coding platform statistics (LeetCode, HackerRank)
   - Progress visualization
4. Resources
   
   - Access learning materials by categories:
     - AI/ML
     - Web Development
     - UI/UX
     - Data Analysis
     - Cloud Computing
     - Programming Languages
   - Bookmark favorite resources
### Admin Features
1. Dashboard
   
   - Overview of placement statistics
   - Analytics and reporting
2. Student Management
   
   - View and manage student profiles
   - Generate student profile PDFs
   - Track student performance and activities
3. Job Management
   
   - Post new job opportunities
   - Manage applications
   - Track application statuses
4. Resource Management
   
   - Upload and manage learning resources
   - Categorize materials
### Company Features
- Dedicated company view portal
- Access to shared student profiles
- Application management interface
## Authentication and Security
- Role-based access control (Student/Admin/Company)
- Secure authentication using Firebase
- Protected routes and authorized access
## Additional Features
1. Notifications System
   
   - Real-time updates for:
     - Job postings
     - Application status changes
     - Deadlines
     - Announcements
2. Data Export
   
   - PDF generation for student profiles
   - Excel support for data export
3. Analytics
   
   - Visual representation of placement statistics
   - Student performance tracking
   - Application success rates
## Getting Started
1. Clone the repository
2. Install dependencies:
```
npm install
```
3. Start the development server:
```
npm start
```
## Environment Setup
Ensure you have the following environment variables configured:

- Firebase configuration
- Supabase configuration
- Any additional API keys
## Browser Support
Optimized for:

- Latest Chrome version
- Latest Firefox version
- Latest Safari version
## Development Mode
Run the app in development mode with hot-reload support using:

```
npm start
```
