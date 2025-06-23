import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff'
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2563eb'
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 20,
    paddingBottom: 5,
    borderBottom: '1 solid #e5e7eb',
    color: '#1f2937'
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8
  },
  label: {
    width: '40%',
    fontWeight: 'bold',
    color: '#4b5563'
  },
  value: {
    width: '60%',
    color: '#1f2937'
  },
  skills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5
  },
  skill: {
    backgroundColor: '#dbeafe',
    padding: '4 8',
    borderRadius: 12,
    margin: '0 5 5 0',
    color: '#1e40af',
    fontSize: 10
  },
  applicationTable: {
    marginTop: 15
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 8,
    fontWeight: 'bold',
    fontSize: 10,
    color: '#4b5563'
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1 solid #e5e7eb',
    fontSize: 10
  },
  col1: { width: '30%' },
  col2: { width: '30%' },
  col3: { width: '20%' },
  col4: { width: '20%' },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#9ca3af'
  }
});

// Create Document Component
const StudentProfilePDF = ({ student }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>{student.name} - Student Profile</Text>
      
      <View style={styles.section}>
        <Text style={styles.subtitle}>Personal Information</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Roll Number:</Text>
          <Text style={styles.value}>{student.rollNumber}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{student.email}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Phone:</Text>
          <Text style={styles.value}>{student.phone}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Department:</Text>
          <Text style={styles.value}>{student.department}</Text>
        </View>
        
        <Text style={styles.subtitle}>Academic Information</Text>
        <View style={styles.row}>
          <Text style={styles.label}>CGPA:</Text>
          <Text style={styles.value}>{student.cgpa}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Current Arrears:</Text>
          <Text style={styles.value}>{student.currentArrears}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>History of Arrears:</Text>
          <Text style={styles.value}>{student.historyArrears}</Text>
        </View>
        
        <Text style={styles.subtitle}>Skills</Text>
        <View style={styles.skills}>
          {student.skills && student.skills.length > 0 ? (
            student.skills.map((skill, index) => (
              <Text key={index} style={styles.skill}>{skill}</Text>
            ))
          ) : (
            <Text>No skills listed</Text>
          )}
        </View>
        
        {student.applications && student.applications.length > 0 && (
          <>
            <Text style={styles.subtitle}>Application Summary</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Total Applications:</Text>
              <Text style={styles.value}>{student.analytics?.totalApplications || student.applications.length}</Text>
            </View>
            {student.analytics?.statusCounts && Object.entries(student.analytics.statusCounts).map(([status, count]) => (
              <View key={status} style={styles.row}>
                <Text style={styles.label}>{status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}:</Text>
                <Text style={styles.value}>{count}</Text>
              </View>
            ))}
            
            <Text style={styles.subtitle}>Recent Applications</Text>
            <View style={styles.applicationTable}>
              <View style={styles.tableHeader}>
                <Text style={styles.col1}>Company</Text>
                <Text style={styles.col2}>Position</Text>
                <Text style={styles.col3}>Status</Text>
                <Text style={styles.col4}>Applied On</Text>
              </View>
              
              {student.applications.slice(0, 5).map((app, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.col1}>{app.job?.company || 'Unknown'}</Text>
                  <Text style={styles.col2}>{app.job?.position || 'Unknown'}</Text>
                  <Text style={styles.col3}>{app.status || 'Pending'}</Text>
                  <Text style={styles.col4}>
                    {app.createdAt ? 
                      (typeof app.createdAt.toDate === 'function' ? 
                        app.createdAt.toDate().toLocaleDateString() : 
                        new Date(app.createdAt).toLocaleDateString()) : 
                      'Unknown'}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>
      
      <Text style={styles.footer}>Generated on {new Date().toLocaleDateString()}</Text>
    </Page>
  </Document>
);

export default StudentProfilePDF;