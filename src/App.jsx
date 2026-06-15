// src/App.jsx
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

// Components (Lazy Loaded for Optimization)
const Navigation = lazy(() => import('./components/Navigation'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const Login = lazy(() => import('./components/Login'));
const CreateStudent = lazy(() => import('./components/CreateStudent'));
const StudentList = lazy(() => import('./components/StudentList'));
const PinAllocation = lazy(() => import('./components/PinAllocation'));
const HostelLeave = lazy(() => import('./components/HostelLeave'));
const ManageParcels = lazy(() => import('./components/ManageParcels'));
const ParcelHistory = lazy(() => import('./components/ParcelHistory'));
const CreateUser = lazy(() => import('./components/CreateUser'));
const ManageUsers = lazy(() => import('./components/ManageUsers'));

// Student Components
const StudentNavigation = lazy(() => import('./components/StudentNavigation'));
const StudentHome = lazy(() => import('./components/StudentHome'));
const StudentProfile = lazy(() => import('./components/StudentProfile'));
const StudentParcel = lazy(() => import('./components/StudentParcel'));
const StudentSettings = lazy(() => import('./components/StudentSettings'));

// Public Component
const PublicParcel = lazy(() => import('./components/PublicParcel'));

// ----------------------------------------------------
// AUTH WRAPPER
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

  if (!adminUser && !studentUser) {
    return <Login />;
  }

  if (studentUser) {
    return (
      <div style={{ display: 'flex' }}>
        <StudentNavigation />
        <div style={{ marginLeft: '260px', width: 'calc(100% - 260px)', minHeight: '100vh', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}>
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              <Route path="/" element={<StudentHome />} />
              <Route path="/profile" element={<StudentProfile />} />
              <Route path="/create-parcel" element={<StudentParcel />} />
              <Route path="/settings" element={<StudentSettings />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex' }}>
      <Navigation />
      <div style={{ marginLeft: '260px', width: 'calc(100% - 260px)', minHeight: '100vh', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}>
        <Suspense fallback={<div>Loading...</div>}>
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
        </Suspense>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Suspense fallback={<div>Loading App...</div>}>
        <Routes>
          <Route path="/public-parcel" element={<PublicParcel />} />
          <Route path="/*" element={<AuthWrapper />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;