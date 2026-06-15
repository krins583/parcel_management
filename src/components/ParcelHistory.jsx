// src/components/ParcelHistory.jsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import './StudentList.css'; 

function ParcelHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const q = query(collection(db, 'parcels'), where('status', '==', 'Received'));
        const snap = await getDocs(q);
        const list = [];
        snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
        // Manually sorting by date received (newest first)
        list.sort((a, b) => b.receivedAt.toDate() - a.receivedAt.toDate());
        setHistory(list);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="premium-page-container fade-in">
      <div className="premium-list-card">
        <div className="list-header-premium">
          <div className="header-text">
            <h2>Received Parcel History</h2>
            <p className="subtitle">Permanent log of all parcels successfully handed over.</p>
          </div>
        </div>

        {loading ? <div className="loading-container-table"><div className="premium-spinner-small"></div></div> : (
          <div className="table-responsive">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Student Info</th>
                  <th>Parcel Info</th>
                  <th>Sender</th>
                  <th>Received Date & Time</th>
                  <th>Received By</th>
                </tr>
              </thead>
              <tbody>
                {history.map(p => (
                  <tr key={p.id} className="table-row">
                    <td>
                      <strong style={{color: '#0f172a'}}>{p.studentName}</strong><br/>
                      <span className="std-badge">PIN: {p.pin}</span>
                    </td>
                    <td>
                      <strong>{p.parcelName}</strong><br/>
                      <small style={{color: '#64748b'}}>{p.trackingId || 'No Tracking'}</small>
                    </td>
                    <td>{p.senderName}</td>
                    <td style={{ color: '#0f172a', fontWeight: '500' }}>
                      {p.receivedAt?.toDate().toLocaleString('en-IN')}
                    </td>
                    <td><span className="badge premium-pin-assigned">{p.receivedBy}</span></td>
                  </tr>
                ))}
                {history.length === 0 && <tr><td colSpan="5" className="premium-empty-state">History is empty.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ParcelHistory;