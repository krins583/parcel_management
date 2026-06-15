// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

// Components
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import CreateStudent from './components/CreateStudent';
import StudentList from './components/StudentList';
import PinAllocation from './components/PinAllocation';
import HostelLeave from './components/HostelLeave';
import ManageParcels from './components/ManageParcels';
import ParcelHistory from './components/ParcelHistory';
import CreateUser from './components/CreateUser';
import ManageUsers from './components/ManageUsers';

// Student Components
import StudentNavigation from './components/StudentNavigation';
import StudentHome from './components/StudentHome';
import StudentProfile from './components/StudentProfile';
import StudentParcel from './components/StudentParcel';
import StudentSettings from './components/StudentSettings';

// Public Component (New)
import PublicParcel from './components/PublicParcel';

// ----------------------------------------------------
// AUTH WRAPPER: Handles Admin, Student & Login screens
// ----------------------------------------------------
function AuthWrapper() {
  const [adminUser, setAdminUser] = useState(null);
  const [studentUser, setStudentUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setAdminUser(currentUser);
      setIsCheckingAuth(false);
    });

    const storedStudent = localStorage.getItem('hostel_student');
    if (storedStudent) {
      setStudentUser(JSON.parse(storedStudent));
    }

    return () => unsubscribe();
  }, []);

  if (isCheckingAuth) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><h2>Loading Secure Portal...</h2></div>;
  }

  // Agar koi login nahi hai
  if (!adminUser && !studentUser) {
    return <Login />;
  }

  // STUDENT VIEW
  if (studentUser) {
    return (
      <div style={{ display: 'flex' }}>
        <StudentNavigation />
        <div style={{ marginLeft: '260px', width: 'calc(100% - 260px)', minHeight: '100vh', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}>
          <Routes>
            <Route path="/" element={<StudentHome />} />
            <Route path="/profile" element={<StudentProfile />} />
            <Route path="/create-parcel" element={<StudentParcel />} />
            <Route path="/settings" element={<StudentSettings />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    );
  }

  // ADMIN VIEW
  return (
    <div style={{ display: 'flex' }}>
      <Navigation />
      <div style={{ marginLeft: '260px', width: 'calc(100% - 260px)', minHeight: '100vh', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/create-student" element={<CreateStudent />} />
          <Route path="/student-list" element={<StudentList />} />
          <Route path="/pin-allocation" element={<PinAllocation />} />
          <Route path="/hostel-leave" element={<HostelLeave />} />
          <Route path="/manage-parcels" element={<ManageParcels />} />
          <Route path="/parcel-history" element={<ParcelHistory />} />
          <Route path="/create-user" element={<CreateUser />} />
<Route path="/manage-users" element={<ManageUsers />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// MAIN APP ROUTER: Contains Public Route & Auth Routes
// ----------------------------------------------------
function App() {
  return (
    <Router>
      <Routes>
        {/* PUBLIC ROUTE - accessible by anyone without login */}
        <Route path="/public-parcel" element={<PublicParcel />} />
        
        {/* PROTECTED ROUTES - handled by AuthWrapper */}
        <Route path="/*" element={<AuthWrapper />} />
      </Routes>
    </Router>
  );
}

export default App;