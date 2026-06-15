// src/components/StudentDashboard.jsx
import React, { useState } from 'react';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import './Dashboard.css'; // Reusing premium dashboard styles

function StudentDashboard({ student }) {
  const [activeTab, setActiveTab] = useState('profile');
  
  // Settings States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [settingsMsg, setSettingsMsg] = useState('');

  // Parcel States
  const [courier, setCourier] = useState('');
  const [tracking, setTracking] = useState('');
  const [parcelMsg, setParcelMsg] = useState('');

  const handleLogout = () => {
    localStorage.removeItem('hostel_student');
    window.location.href = '/';
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const currentPass = student.password || '12345';
    
    if (oldPassword !== currentPass) {
      setSettingsMsg('Error: Old password is incorrect.');
      return;
    }

    try {
      await updateDoc(doc(db, 'students', student.id), { password: newPassword });
      setSettingsMsg('Success: Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      // Update local storage to reflect new password
      const updatedStudent = { ...student, password: newPassword };
      localStorage.setItem('hostel_student', JSON.stringify(updatedStudent));
    } catch (err) {
      setSettingsMsg('Error: Could not update password.');
    }
  };

  const handleParcelSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'parcels'), {
        studentId: student.id,
        studentName: student.name,
        pin: student.assignedPin,
        roomNumber: student.roomNumber,
        courierName: courier,
        trackingNumber: tracking,
        status: 'Expected',
        createdAt: new Date()
      });
      setParcelMsg('Success: Parcel expectation registered! Admin will be notified.');
      setCourier(''); setTracking('');
    } catch (err) {
      setParcelMsg('Error: Failed to register parcel.');
    }
  };

  return (
    <div className="dashboard-wrapper">
      <header className="premium-header fade-in">
        <div className="header-content">
          <h1>Hello, {student.name}</h1>
          <p>PIN: {student.assignedPin} | Room: {student.roomNumber}</p>
        </div>
        <button onClick={handleLogout} className="premium-logout-btn">Sign Out</button>
      </header>

      {/* Modern Tabs */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }} className="fade-in-up">
        <button className={`premium-logout-btn ${activeTab === 'profile' ? 'primary-gradient' : ''}`} style={activeTab !== 'profile' ? { color: '#0f172a', borderColor: '#e2e8f0'} : {color: 'white'}} onClick={() => setActiveTab('profile')}>My Profile</button>
        <button className={`premium-logout-btn ${activeTab === 'parcel' ? 'primary-gradient' : ''}`} style={activeTab !== 'parcel' ? { color: '#0f172a', borderColor: '#e2e8f0'} : {color: 'white'}} onClick={() => setActiveTab('parcel')}>Create Parcel Alert</button>
        <button className={`premium-logout-btn ${activeTab === 'settings' ? 'primary-gradient' : ''}`} style={activeTab !== 'settings' ? { color: '#0f172a', borderColor: '#e2e8f0'} : {color: 'white'}} onClick={() => setActiveTab('settings')}>Change Password</button>
      </div>

      <div className="system-overview fade-in-up delay">
        
        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div>
            <h3><span className="pulse-dot" style={{display:'inline-block', marginRight:'10px'}}></span> Your Profile Data</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px' }}>
                <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Full Name</p>
                <h4 style={{ margin: '5px 0 0', fontSize: '18px' }}>{student.name}</h4>
              </div>
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px' }}>
                <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Standard</p>
                <h4 style={{ margin: '5px 0 0', fontSize: '18px' }}>{student.standard}th</h4>
              </div>
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px' }}>
                <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Allocated PIN</p>
                <h4 style={{ margin: '5px 0 0', fontSize: '18px', color: '#3b82f6' }}>{student.assignedPin}</h4>
              </div>
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px' }}>
                <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Registered Phone</p>
                <h4 style={{ margin: '5px 0 0', fontSize: '18px' }}>{student.phone}</h4>
              </div>
            </div>
          </div>
        )}

        {/* PARCEL TAB */}
        {activeTab === 'parcel' && (
          <div>
            <h3>Expect a Parcel?</h3>
            <p>Let the admin know in advance so they can sort it quickly when it arrives.</p>
            {parcelMsg && <p style={{ color: parcelMsg.includes('Success') ? '#16a34a' : '#ef4444', fontWeight: 'bold' }}>{parcelMsg}</p>}
            
            <form onSubmit={handleParcelSubmit} style={{ marginTop: '20px', maxWidth: '500px' }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize:'14px' }}>Courier Service (e.g., Amazon, BlueDart)</label>
                <input type="text" value={courier} onChange={e => setCourier(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize:'14px' }}>Tracking Number (Optional)</label>
                <input type="text" value={tracking} onChange={e => setTracking(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>
              <button type="submit" className="premium-logout-btn primary-gradient" style={{ color: 'white', border: 'none' }}>Submit Alert</button>
            </form>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div>
            <h3>Security Settings</h3>
            <p>Change your default login password to secure your account.</p>
            {settingsMsg && <p style={{ color: settingsMsg.includes('Success') ? '#16a34a' : '#ef4444', fontWeight: 'bold' }}>{settingsMsg}</p>}
            
            <form onSubmit={handlePasswordChange} style={{ marginTop: '20px', maxWidth: '400px' }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize:'14px' }}>Current Password</label>
                <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize:'14px' }}>New Password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength="5" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>
              <button type="submit" className="premium-logout-btn" style={{ background: '#10b981', color: 'white', border: 'none' }}>Update Password</button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}

export default StudentDashboard;