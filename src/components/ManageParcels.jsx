// src/components/ManageParcels.jsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import './ManageParcels.css'; // Nayi premium CSS file link ki hai

function ManageParcels() {
  const [parcels, setParcels] = useState([]);
  const [filteredParcels, setFilteredParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search state
  const [searchPin, setSearchPin] = useState('');
  
  // Fast Inline processing state
  const [processingId, setProcessingId] = useState(null);

  const fetchExpectedParcels = async () => {
    try {
      const q = query(collection(db, 'parcels'), where('status', '==', 'Expected'));
      const snap = await getDocs(q);
      const list = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      setParcels(list);
      setFilteredParcels(list);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpectedParcels();
  }, []);

  // Filter Logic (Search by PIN or Name)
  useEffect(() => {
    if (searchPin.trim() !== '') {
      const result = parcels.filter(p => 
        String(p.pin).includes(searchPin.trim()) || 
        p.studentName.toLowerCase().includes(searchPin.toLowerCase())
      );
      setFilteredParcels(result);
    } else {
      setFilteredParcels(parcels);
    }
  }, [searchPin, parcels]);

  // === Naya Email Bhejne ka Function ===
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
          roomNumber: parcel.roomNumber,
          receiveTime: receiveTime,
          handedBy: "Admin Desk" // Fixed bug: Used Admin Desk instead of undefined staffUser
        })
      });

      const data = await response.json();
      if (!data.success) console.error("Email API failed:", data.message);
    } catch (error) {
      console.error("Failed to call Email API:", error);
    }
  };    

  const handleReceiveParcel = async (parcel) => {
    setProcessingId(parcel.id); // Start inline loading
    
    try {
      const now = new Date();
      const formattedTime = now.toLocaleString('en-IN', { 
        day: '2-digit', month: 'short', year: 'numeric', 
        hour: '2-digit', minute: '2-digit', hour12: true 
      });

      // 1. Firebase update
      await updateDoc(doc(db, 'parcels', parcel.id), {
        status: 'Received',
        receivedAt: now,
        receivedBy: 'Admin (Main Desk)' 
      });

      // 2. Background Email (Fire & Forget for speed)
      sendEmailNotification(parcel, formattedTime);

      // 3. Instant UI Update
      setParcels(prev => prev.filter(p => p.id !== parcel.id));
      
    } catch (err) {
      console.error("Error receiving parcel:", err);
      alert("Error updating parcel status.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="manage-page-wrapper fade-in">
      <div className="manage-main-card">
        
        {/* HEADER SECTION */}
        <div className="manage-header">
          <div className="manage-titles">
            <div className="icon-box-primary"><i className="fa-solid fa-boxes-stacked"></i></div>
            <div>
              <h2>Incoming Parcels</h2>
              <p>Manage and distribute expected parcels</p>
            </div>
          </div>
          
          <div className="manage-search">
            <div className="search-group">
              <svg className="filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input 
                type="text" 
                placeholder="Search by PIN or Name..." 
                value={searchPin}
                onChange={(e) => setSearchPin(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* TABLE SECTION */}
        {loading ? (
          <div className="manage-loading">
            <div className="premium-spinner"></div>
            <p>Syncing live parcels...</p>
          </div>
        ) : (
          <div className="manage-table-container">
            <table className="manage-table">
              <thead>
                <tr>
                  <th>Student Profile</th>
                  <th>Parcel Details</th>
                  <th>Remarks / Note</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredParcels.map(p => (
                  <tr key={p.id} className="m-table-row">
                    <td>
                      <div className="student-cell">
                        <div className="s-avatar">{p.studentName.charAt(0)}</div>
                        <div>
                          <strong className="s-name">{p.studentName}</strong>
                          <div className="s-badges">
                            <span className="badge-pin">PIN: {p.pin}</span>
                            <span className="badge-room">Room: {p.roomNumber}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong className="p-item">{p.parcelName}</strong>
                      <span className="p-type-badge">{p.parcelType || 'Box'}</span>
                      {p.trackingId && <p className="p-track">Trk: {p.trackingId}</p>}
                    </td>
                    <td>
                      {p.remarks ? (
                        <span className="remark-text">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                          {p.remarks}
                        </span>
                      ) : (
                        <span className="no-remark">-</span>
                      )}
                    </td>
                    <td className="text-right">
                      <button 
                        onClick={() => handleReceiveParcel(p)} 
                        disabled={processingId === p.id}
                        className={`btn-receive ${processingId === p.id ? 'processing' : ''}`}
                      >
                        {processingId === p.id ? (
                          <span className="btn-spinner"></span>
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
                    <td colSpan="4" className="manage-empty">
                      <div className="empty-icon-wrap">📦</div>
                      <h3>No expected parcels found.</h3>
                      <p>Currently, the reception desk is clear.</p>
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