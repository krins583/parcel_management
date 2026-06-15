// src/components/StudentSettings.jsx
import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './StudentPages.css';

function StudentSettings() {
  const student = JSON.parse(localStorage.getItem('hostel_student'));
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const currentPass = student.password || '12345';
    
    if (oldPassword !== currentPass) {
      setMsg({ type: 'error', text: 'Current password is incorrect.' });
      return;
    }

    try {
      await updateDoc(doc(db, 'students', student.id), { password: newPassword });
      setMsg({ type: 'success', text: 'Password updated successfully!' });
      setOldPassword(''); setNewPassword('');
      
      const updatedStudent = { ...student, password: newPassword };
      localStorage.setItem('hostel_student', JSON.stringify(updatedStudent));
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to update password.' });
    }
  };

  return (
    <div className="student-wrapper">
      <div className="student-card" style={{ maxWidth: '600px' }}>
        <div className="student-header">
          <h2>Change Password</h2>
          <p>Secure your portal access.</p>
        </div>

        {msg.text && <div className={`alert-msg alert-${msg.type}`}>{msg.text}</div>}

        <form onSubmit={handlePasswordChange}>
          <div className="form-field">
            <label>Current Password</label>
            <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required placeholder="Enter current password" />
          </div>
          <div className="form-field">
            <label>New Password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength="5" placeholder="Enter new password" />
          </div>
          <button type="submit" className="btn-primary" style={{ background: '#10b981' }}><i className="fa-solid fa-floppy-disk"></i> Save New Password</button>
        </form>
      </div>
    </div>
  );
}

export default StudentSettings;