// src/components/StudentProfile.jsx
import React from 'react';
import './StudentPages.css';

function StudentProfile() {
  const student = JSON.parse(localStorage.getItem('hostel_student'));

  return (
    <div className="student-wrapper">
      <div className="student-card">
        <div className="student-header">
          <h2>My Profile</h2>
          <p>Your registered details in the Hostel Hub system.</p>
        </div>
        
        <div className="grid-2">
          <div className="info-box">
            <label>Full Name</label>
            <h4>{student.name}</h4>
          </div>
          <div className="info-box">
            <label>Standard</label>
            <h4>{student.standard}th</h4>
          </div>
          <div className="info-box">
            <label>Phone Number</label>
            <h4>{student.phone}</h4>
          </div>
          <div className="info-box">
            <label>Status</label>
            <h4><span style={{color: '#16a34a'}}><i className="fa-solid fa-circle-check"></i> Active</span></h4>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentProfile;