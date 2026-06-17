// src/components/Login.jsx
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError(''); 
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // App.jsx will auto-redirect via onAuthStateChanged
    } catch (err) {
      setError('Invalid admin credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Animated Background Shapes */}
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>
      <div className="bg-shape shape-3"></div>
      
      <div className="login-card fade-in-up">
        <div className="brand-header">
          <div className="logo-placeholder">
             {/* Yahan aapka logo.png aayega */}
             <img src="/logo.png" alt="SGVP Logo" className="sgvp-logo-login" />
          </div>
          <h2>SGVP Hostel</h2>
          <p className="subtitle">Parcel Management System</p>
        </div>
        
        {error && (
          <div className="error-msg shake">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="error-icon"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleAdminLogin} className="login-form">
          
          <div className="input-group">
            <label>Admin Email</label>
            <div className="input-with-icon">
              <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="admin@sgvp.com" 
              />
            </div>
          </div>

          <div className="input-group">
            <label>Secure Password</label>
            <div className="input-with-icon">
              <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="••••••••" 
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? (
               <><span className="spinner"></span> Authenticating...</>
            ) : (
               <>
                 <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg> 
                 Secure Login
               </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}

export default Login;