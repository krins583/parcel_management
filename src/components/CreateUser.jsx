// src/components/CreateUser.jsx
import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import './CreateUser.css'; // Fixed correct CSS file import

function CreateUser() {
  const [username, setUsername] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Auto-hide alert message after 3 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Check if username already exists
      const q = query(collection(db, 'users'), where('username', '==', username.trim()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setMessage({ type: 'error', text: 'Username already taken! Try another.' });
        setLoading(false);
        return;
      }

      // Add user to Firestore 'users' collection
      await addDoc(collection(db, 'users'), {
        username: username.trim(),
        mobileNumber: mobileNumber.trim(),
        password: password,
        status: 'active',
        createdAt: new Date()
      });

      setMessage({ type: 'success', text: 'New user account created successfully!' });
      setUsername(''); setMobileNumber(''); setPassword('');
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Failed to create user. System error.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-page-container fade-in">
      <div className="premium-form-card fade-in-up">
        
        <div className="form-header">
          <div className="header-icon-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <div className="header-text-content">
            <h2>Create System User</h2>
            <p className="subtitle">Add a new admin/staff account with custom login access.</p>
          </div>
        </div>

        {/* Premium Inline Notification Banner */}
        {message.text && (
          <div className={`premium-alert-banner ${message.type}`}>
            <span className="alert-icon">{message.type === 'success' ? '✅' : '⚠️'}</span>
            <span className="alert-text">{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="premium-form">
          <div className="form-group">
            <label>Username</label>
            <div className="input-with-icon">
              <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} required placeholder="e.g. warden_suresh" />
            </div>
          </div>

          <div className="form-group">
            <label>Mobile Number</label>
            <div className="input-with-icon">
              <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <input type="tel" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} required placeholder="10-digit number" pattern="[0-9]{10}" />
            </div>
          </div>

          <div className="form-group">
            <label>Login Password</label>
            <div className="input-with-icon">
              <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" minLength="5" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="premium-submit-btn">
            {loading ? (
              <span className="btn-loading-content">
                <span className="btn-spinner"></span> Creating Account...
              </span>
            ) : (
              <span className="btn-normal-content">
                Register New User
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </span>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}

export default CreateUser;