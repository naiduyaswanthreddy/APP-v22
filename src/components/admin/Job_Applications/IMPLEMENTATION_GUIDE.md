# Student Selection and Offer Management Implementation Guide

## Overview
This implementation provides a complete workflow for managing student selection and offer acceptance/rejection in the placement portal.

## Components Created

### 1. SelectionWorkflow.js
- Handles final round selection marking students as "Selected"
- Provides offer decision panel for Accept/Reject actions
- Manages notifications and audit logging
- Updates student placement status and company statistics

### 2. Updated PlacedStudents.js
- Enhanced with filtering capabilities (Batch, Company, Department)
- Displays comprehensive placement data
- Shows real-time placement statistics

### 3. Integration Points

## Database Schema Updates Required

### Students Collection
```javascript
{
  placementStatus: "placed", // or "not_placed"
  placedCompany: "Company Name",
  placedPackage: "Package Value",
  placedJobTitle: "Job Title",
  placedAt: Timestamp,
  rejectedOffersCount: 0,
  updatedAt: Timestamp
}
```

### Applications Collection
```javascript
{
  status: "selected" | "Accepted" | "Rejected Offer" | "shortlisted" | "rejected",
  updatedAt: Timestamp,
  lastModifiedBy: "admin",
  companyName: "Company Name"
}
```

### Notifications Collection
```javascript
{
  studentId: "student_id",
  message: "Notification message",
  type: "selection",
  createdAt: Timestamp,
  read: false,
  jobId: "job_id",
  jobTitle: "Job Title",
  companyName: "Company Name"
}
```

### Audit Logs Collection
```javascript
{
  applicationId: "application_id",
  eventType: "selected" | "accepted" | "rejected",
  timestamp: Timestamp,
  createdBy: "admin",
  jobId: "job_id",
  companyName: "Company Name"
}
```

### Placed Students Collection
```javascript
{
  studentId: "student_id",
  jobId: "job_id",
  companyName: "Company Name",
  package: "Package Value",
  placedAt: Timestamp,
  status: "placed"
}
```

## Usage Instructions

### 1. Import SelectionWorkflow in JobApplications.js
```javascript
import SelectionWorkflow from './SelectionWorkflow';

// Add to render method
<SelectionWorkflow 
  application={application} 
  job={job} 
  onStatusUpdate={handleStatusUpdate} 
/>
```

### 2. Workflow Steps

#### Admin Actions:
1. **Final Round Selection**: When admin marks student as shortlisted in final round
   - Click "Mark as Selected" button
   - Application status changes to "selected"
   - Student receives notification

2. **Student Decision**: Student can Accept or Reject the offer
   - Accept: Updates placement status to "placed"
   - Reject: Increments rejected offers count

#### Student Actions:
1. **View Selection**: Student sees "Selected" status badge
2. **Make Decision**: Accept or Reject offer with confirmation
3. **Receive Confirmation**: Notification sent upon decision

### 3. Analytics Integration
- PlacedStudents component shows real-time data
- Filters available for Batch, Company, Department
- Statistics updated automatically

### 4. Notifications
- Selection notifications sent to students
- Confirmation notifications for accept/reject
- Real-time updates via toast notifications

## Testing Checklist

- [ ] Final round selection updates status to "selected"
- [ ] Notifications sent to students upon selection
- [ ] Accept offer updates student placement status
- [ ] Reject offer increments rejected count
- [ ] PlacedStudents list updates correctly
- [ ] Filters work correctly
- [ ] Audit logs created for all actions
- [ ] Company statistics updated

## Error Handling
- All operations include try-catch blocks
- Toast notifications for success/failure
- Console logging for debugging
- Graceful degradation if services unavailable
