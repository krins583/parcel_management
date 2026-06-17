// src/components/Navigation.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navigation.css';

function Navigation() {
  return (
    <div className="premium-sidebar">
      
      {/* --- UPDATED BRANDING SECTION --- */}
      <div className="sidebar-brand">
        <div className="brand-logo">
          <img src="/logo.png" alt="SGVP Logo" className="sgvp-logo-img" />
        </div>
        <div className="brand-text">
          <h2>SGVP Hostel</h2>
          <span>Parcel Management</span>
        </div>
      </div>
      
      <div className="nav-scroll-area">
        <nav className="nav-menu">
          
          <div className="nav-section">
            <NavLink to="/" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Dashboard
            </NavLink>
          </div>
          
          <div className="nav-section">
            <NavLink to="/student-list" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Student List
            </NavLink>

            <NavLink to="/create-student" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Create Student
            </NavLink>

            <NavLink to="/pin-allocation" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Pin Allocation
            </NavLink>

            <NavLink to="/hostel-leave" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
              </svg>
              Hostel Leave History
            </NavLink>
          </div>

          <div className="nav-section">
            <NavLink to="/manage-parcels" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              Manage Parcels
            </NavLink>
            <NavLink to="/parcel-history" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              Parcel History
            </NavLink>
          </div>

          <div className="nav-section">
            <NavLink to="/create-user" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Create User
            </NavLink>
            <NavLink to="/manage-users" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Manage Users
            </NavLink>
          </div>

        </nav>
      </div>
    </div>
  );
}

export default Navigation;