// src/components/StudentParcel.jsx
import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import './StudentPages.css';

function StudentParcel() {
  const student = JSON.parse(localStorage.getItem('hostel_student'));
  
  // Form States
  const [parcelType, setParcelType] = useState('Box');
  const [parcelName, setParcelName] = useState('');
  const [senderName, setSenderName] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [myParcels, setMyParcels] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyParcels = async () => {
    try {
      const q = query(collection(db, 'parcels'), where('studentId', '==', student.id));
      const snap = await getDocs(q);
      const parcelsList = [];
      snap.forEach(doc => parcelsList.push({ id: doc.id, ...doc.data() }));
      
      // Sort by latest first manually since compound queries need indexing in Firebase
      parcelsList.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
      setMyParcels(parcelsList);
    } catch (error) {
      console.error("Error fetching parcels:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyParcels();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    try {
      await addDoc(collection(db, 'parcels'), {
        studentId: student.id,
        studentName: student.name,
        pin: student.assignedPin,
        roomNumber: student.roomNumber,
        parcelType,
        parcelName,
        senderName,
        trackingId,
        mobileNumber,
        remarks,
        status: 'Expected', // Default status
        createdAt: new Date(),
        receivedAt: null,
        receivedBy: null
      });
      setMsg({ type: 'success', text: 'Parcel alert submitted successfully!' });
      
      // Reset form
      setParcelName(''); setSenderName(''); setTrackingId(''); setMobileNumber(''); setRemarks('');
      fetchMyParcels(); // Refresh table
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to submit parcel alert.' });
    }
  };

  return (
    <div className="student-wrapper">
      <div className="student-card">
        <div className="student-header">
          <h2>Create Parcel Alert</h2>
          <p>Inform the admin about your incoming parcel (Courier/Post/Hand-delivery).</p>
        </div>

        {msg.text && <div className={`alert-msg alert-${msg.type}`}>{msg.text}</div>}

        <form onSubmit={handleSubmit} className="grid-2">
          <div className="form-field">
            <label>Parcel Type</label>
            <select value={parcelType} onChange={e => setParcelType(e.target.value)} className="form-input">
              <option value="Box">Box / Package</option>
              <option value="Document">Document / Envelope</option>
              <option value="Bag">Bag / Luggage</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="form-field">
            <label>Parcel Name / Items</label>
            <input type="text" value={parcelName} onChange={e => setParcelName(e.target.value)} required placeholder="e.g. Books, Clothes" />
          </div>
          <div className="form-field">
            <label>Sender Name (Parents/Relative/Amazon)</label>
            <input type="text" value={senderName} onChange={e => setSenderName(e.target.value)} required placeholder="e.g. Suresh Sutariya" />
          </div>
          <div className="form-field">
            <label>Tracking ID (Optional)</label>
            <input type="text" value={trackingId} onChange={e => setTrackingId(e.target.value)} placeholder="e.g. AW123456789" />
          </div>
          <div className="form-field">
            <label>Sender Mobile Number</label>
            <input type="tel" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} required placeholder="10-digit number" />
          </div>
          <div className="form-field">
            <label>Remarks / Instructions (Optional)</label>
            <input type="text" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="e.g. Handle with care, Urgent" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <button type="submit" className="btn-primary"><i className="fa-solid fa-paper-plane"></i> Submit Parcel Alert</button>
          </div>
        </form>
      </div>

      {/* Tracking History for Student/Parents */}
      <div className="student-card">
        <div className="student-header">
          <h2>My Parcels Tracking</h2>
          <p>Check the live status of your expected and received parcels.</p>
        </div>
        
        {loading ? <p>Loading history...</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#64748b', fontSize: '13px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px' }}>Parcel Detail</th>
                  <th style={{ padding: '12px' }}>Sender</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px' }}>Received Info</th>
                </tr>
              </thead>
              <tbody>
                {myParcels.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px' }}>
                      <strong>{p.parcelName}</strong> <br/>
                      <small style={{color: '#64748b'}}>Tracking: {p.trackingId || 'N/A'}</small>
                    </td>
                    <td style={{ padding: '12px' }}>{p.senderName}</td>
                    <td style={{ padding: '12px' }}>
                      {p.status === 'Expected' ? 
                        <span style={{ background: '#fef3c7', color: '#d97706', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>Expected</span> : 
                        <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>Delivered to Admin</span>
                      }
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>
                      {p.status === 'Received' ? (
                        <>
                          <div style={{ color: '#0f172a', fontWeight: '600' }}>{p.receivedAt?.toDate().toLocaleString('en-IN')}</div>
                          <div style={{ color: '#64748b' }}>By: {p.receivedBy}</div>
                        </>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>Awaiting Delivery</span>
                      )}
                    </td>
                  </tr>
                ))}
                {myParcels.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No parcels found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentParcel;