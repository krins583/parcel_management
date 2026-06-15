// src/components/StudentHome.jsx
import React from 'react';
import './StudentPages.css';

function StudentHome() {
  const student = JSON.parse(localStorage.getItem('hostel_student'));

  return (
    <div className="student-wrapper">
      <div className="student-card">
        <div className="student-header">
          <h2>Welcome back, {student.name}! 👋</h2>
          <p>Here is your current hostel status.</p>
        </div>
        
        <div className="grid-2">
          <div className="info-box highlight">
            <label>Your Allocated PIN</label>
            <h4>{student.assignedPin}</h4>
          </div>
          <div className="info-box highlight">
            <label>Room Number</label>
            <h4>{student.roomNumber}</h4>
          </div>
        </div>

        <div style={{ marginTop: '30px', padding: '20px', background: '#eff6ff', borderRadius: '12px', border: '1px dashed #bfdbfe' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#1e3a8a' }}>Important Notice</h4>
          <p style={{ margin: 0, color: '#1e40af', fontSize: '14px' }}>If you are expecting a parcel today, please use the "Create Parcel Alert" menu to notify the administration.</p>
        </div>
      </div>
    </div>
  );
}

export default StudentHome;