// src/components/Login.jsx
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../firebase';
import './Login.css';

function Login() {
  const [loginMode, setLoginMode] = useState('student'); // 'student' or 'admin'
  
  // Admin States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Student States
  const [pin, setPin] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // App.jsx will auto-redirect via onAuthStateChanged
    } catch (err) {
      setError('Invalid admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const q = query(collection(db, 'students'), where('assignedPin', '==', String(pin)), where('status', '==', 'active'));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setError('Invalid PIN or Student is not active.');
        setLoading(false);
        return;
      }

      const studentDoc = snapshot.docs[0];
      const studentData = studentDoc.data();
      
      // Default password logic
      const actualPassword = studentData.password || '12345';

      if (studentPassword === actualPassword) {
        // Save student session in localStorage
        localStorage.setItem('hostel_student', JSON.stringify({ id: studentDoc.id, ...studentData }));
        window.location.href = '/'; // Reload to trigger App.jsx routing
      } else {
        setError('Incorrect password.');
      }
    } catch (err) {
      console.error(err);
      setError('System error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>
      
      <div className="login-card fade-in">
        <div className="brand-header">
          <div className="logo-placeholder">📦</div>
          <h2>Hostel Hub</h2>
          <p className="subtitle">Welcome back to the portal</p>
        </div>

        {/* Login Type Toggle */}
        <div className="login-toggle">
          <button 
            className={`toggle-btn ${loginMode === 'student' ? 'active' : ''}`}
            onClick={() => { setLoginMode('student'); setError(''); }}
          >
            Student Login
          </button>
          <button 
            className={`toggle-btn ${loginMode === 'admin' ? 'active' : ''}`}
            onClick={() => { setLoginMode('admin'); setError(''); }}
          >
            Admin Login
          </button>
        </div>
        
        {error && (
          <div className="error-msg shake">
            <span>{error}</span>
          </div>
        )}
        
        {loginMode === 'student' ? (
          <form onSubmit={handleStudentLogin} className="fade-in">
            <div className="input-group">
              <label>Your PIN Number</label>
              <input type="number" value={pin} onChange={(e) => setPin(e.target.value)} required placeholder="e.g. 105" />
            </div>
            <div className="input-group">
              <label>Password (Default: 12345)</label>
              <input type="password" value={studentPassword} onChange={(e) => setStudentPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className={`login-btn ${loading ? 'loading' : ''}`}>
              {loading ? <span className="spinner"></span> : 'Login to Student Dashboard'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleAdminLogin} className="fade-in">
            <div className="input-group">
              <label>Admin Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="admin@hostel.com" />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className={`login-btn ${loading ? 'loading' : ''}`}>
              {loading ? <span className="spinner"></span> : 'Secure Admin Login'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Login;