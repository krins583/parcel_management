// src/components/StudentNavigation.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import './StudentNavigation.css';

function StudentNavigation() {
  const handleLogout = () => {
    localStorage.removeItem('hostel_student');
    window.location.href = '/';
  };

  return (
    <div className="premium-sidebar student-sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo student-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
        </div>
        <h2>Student Portal</h2>
      </div>
      
      <div className="nav-scroll-area">
        <nav className="nav-menu">
          <div className="nav-section">
            <p className="section-title">Home</p>
            <NavLink to="/" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <i className="fa-solid fa-house nav-icon"></i> Dashboard
            </NavLink>
            <NavLink to="/profile" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <i className="fa-regular fa-id-card nav-icon"></i> My Profile
            </NavLink>
          </div>
          
          <div className="nav-section">
            <p className="section-title">Services</p>
            <NavLink to="/create-parcel" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <i className="fa-solid fa-box-open nav-icon"></i> Create Parcel Alert
            </NavLink>
          </div>

          <div className="nav-section">
            <p className="section-title">Settings</p>
            <NavLink to="/settings" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <i className="fa-solid fa-lock nav-icon"></i> Change Password
            </NavLink>
          </div>
        </nav>
      </div>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn-nav">
          <i className="fa-solid fa-arrow-right-from-bracket"></i> Secure Logout
        </button>
      </div>
    </div>
  );
}

export default StudentNavigation;