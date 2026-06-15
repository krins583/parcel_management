// src/components/CreateUser.jsx
import React, { useState } from 'react';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import './CreateStudent.css'; // Reusing your premium form styles

function CreateUser() {
  const [username, setUsername] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Check if username already exists
      const q = query(collection(db, 'users'), where('username', '==', username.trim()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setMessage({ type: 'error', text: 'Username already taken!' });
        setLoading(false);
        return;
      }

      // Add user to Firestore 'users' collection
      await addDoc(collection(db, 'users'), {
        username: username.trim(),
        mobileNumber: mobileNumber.trim(),
        password: password,
        status: 'active', // By default active status
        createdAt: new Date()
      });

      setMessage({ type: 'success', text: 'New user account created successfully!' });
      setUsername(''); setMobileNumber(''); setPassword('');
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Failed to create user.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-page-container fade-in">
      <div className="premium-form-card">
        <div className="form-header">
          <div className="header-icon" style={{ background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', color: '#4338ca' }}>
            <i className="fa-solid fa-user-gear" style={{ fontSize: '20px' }}></i>
          </div>
          <div>
            <h2>Create System User</h2>
            <p className="subtitle">Add a new admin/staff account with custom login access.</p>
          </div>
        </div>

        {message.text && <div className={`premium-alert ${message.type}`}>{message.text}</div>}

        <form onSubmit={handleSubmit} className="premium-form">
          <div className="form-group">
            <label>Username</label>
            <div className="input-wrapper">
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} required placeholder="e.g. warden_suresh" />
            </div>
          </div>

          <div className="form-group">
            <label>Mobile Number</label>
            <div className="input-wrapper">
              <input type="tel" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} required placeholder="10-digit number" pattern="[0-9]{10}" />
            </div>
          </div>

          <div className="form-group">
            <label>Login Password</label>
            <div className="input-wrapper">
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" minLength="5" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="premium-submit-btn">
            {loading ? 'Creating...' : 'Register New User'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateUser;