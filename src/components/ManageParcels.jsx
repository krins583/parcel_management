// src/components/ManageParcels.jsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import './ManageParcels.css'; 

function ManageParcels() {
  const [parcels, setParcels] = useState([]);
  const [filteredParcels, setFilteredParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Status
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchExpectedParcels = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'parcels'), where('status', '==', 'Expected'));
      const snap = await getDocs(q);
      const list = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      setParcels(list);
      setFilteredParcels(list);
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Failed to load parcels.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpectedParcels();
  }, []);

  // Auto-hide alert message
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Live Search Logic
  useEffect(() => {
    if (searchQuery.trim() !== '') {
      const result = parcels.filter(p => 
        p.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        String(p.pin || '').includes(searchQuery.trim()) ||
        String(p.trackingId || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredParcels(result);
    } else {
      setFilteredParcels(parcels);
    }
  }, [searchQuery, parcels]);

  // Email Notification Function
  const sendEmailNotification = async (parcel, receiveTime) => {
    const studentEmail = parcel.studentEmail || "testemail@gmail.com"; 
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: studentEmail,
          studentName: parcel.studentName,
          parcelName: parcel.parcelName,
          senderName: parcel.senderName,
          roomNumber: parcel.roomNumber,
          receiveTime: receiveTime,
          handedBy: 'Admin Desk'
        })
      });
      const data = await response.json();
      if (!data.success) console.error("Email API failed:", data.message);
    } catch (error) {
      console.error("Failed to call Email API:", error);
    }
  };    

  const handleReceiveParcel = async (parcel) => {
    setProcessingId(parcel.id);
    setMessage({ type: '', text: '' });

    try {
      const now = new Date();
      const formattedTime = now.toLocaleString('en-IN', { 
        day: '2-digit', month: 'short', year: 'numeric', 
        hour: '2-digit', minute: '2-digit', hour12: true 
      });

      await updateDoc(doc(db, 'parcels', parcel.id), {
        status: 'Received',
        receivedAt: now,
        receivedBy: 'Admin (Main Desk)' 
      });

      // Background Email
      sendEmailNotification(parcel, formattedTime);

      setMessage({ type: 'success', text: `Parcel for ${parcel.studentName} marked as received!` });
      fetchExpectedParcels(); 
    } catch (err) {
      console.error("Error receiving parcel:", err);
      setMessage({ type: 'error', text: 'Failed to update parcel status.' });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="premium-page-container fade-in">
      <div className="premium-list-card">
        
        <div className="list-header-premium">
          <div className="header-text-group">
            <div className="mp-header-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            </div>
            <div>
              <h2>Manage Incoming Parcels</h2>
              <p className="subtitle">Alerts created by parents/students waiting to be received.</p>
            </div>
          </div>
        </div>

        {/* Inline Alert Banner */}
        {message.text && (
          <div className={`premium-alert-banner ${message.type} fade-in`}>
            <span className="alert-icon">{message.type === 'success' ? '✅' : '❌'}</span>
            <span className="alert-text">{message.text}</span>
          </div>
        )}

        {/* Search Bar */}
        <div className="mp-controls-bar">
          <div className="mp-search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input 
              type="text" 
              placeholder="Search by Name, PIN or Tracking ID..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading-container-table">
            <div className="premium-spinner-small"></div>
            <p style={{color: '#64748b', marginLeft: '10px', fontWeight: '600'}}>Loading parcels...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Student Info</th>
                  <th>Parcel Details</th>
                  <th>Sender Info</th>
                  <th>Created By</th>
                  <th>Remarks</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredParcels.map(p => (
                  <tr key={p.id} className="table-row">
                    <td>
                      <div className="student-profile">
                        <div className="avatar">
                          {p.studentName.charAt(0).toUpperCase()}
                        </div>
                        <div className="profile-info">
                          <span className="font-medium">{p.studentName}</span>
                          <span className="text-muted">Room: {p.roomNumber} | PIN: {p.pin}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong style={{color: '#0f172a'}}>{p.parcelName}</strong> <span className="item-type-badge">{p.parcelType || 'Box'}</span><br/>
                      <small style={{color: '#64748b', fontWeight: '500'}}>Trk: {p.trackingId || 'N/A'}</small>
                    </td>
                    <td>
                      <span style={{fontWeight: '600', color: '#334155'}}>{p.senderName}</span><br/>
                      <small style={{color: '#64748b'}}>{p.mobileNumber}</small>
                    </td>
                    <td>
                      <span className="staff-badge created-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        {p.createdBy || '-'} {/* Yahan se Public Form ka naam hata diya */}
                      </span>
                    </td>
                    <td style={{ maxWidth: '130px', fontSize: '13px', color: '#ef4444', fontWeight: '500' }}>
                      {p.remarks || '-'}
                    </td>
                    <td className="text-right">
                      <button 
                        onClick={() => handleReceiveParcel(p)} 
                        disabled={processingId === p.id}
                        className="btn-mark-received"
                      >
                        {processingId === p.id ? (
                          <><span className="btn-spinner-small"></span> Processing...</>
                        ) : (
                          <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            Mark Received
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredParcels.length === 0 && (
                  <tr>
                    <td colSpan="6" className="premium-empty-state">
                      <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" style={{marginBottom: '15px'}}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                      <p>No expected parcels found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageParcels;