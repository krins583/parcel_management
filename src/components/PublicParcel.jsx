// src/components/PublicParcel.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './PublicParcel.css';

function PublicParcel() {
  // Staff Auth States
  const [staffUser, setStaffUser] = useState(null);
  const [loginMobileNumber, setLoginMobileNumber] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Parcel & Search States
  const [pinSearch, setPinSearch] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [pendingParcels, setPendingParcels] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  
  // UI States
  const [activeTab, setActiveTab] = useState('parcels'); // 'parcels' | 'create'
  const [processingId, setProcessingId] = useState(null); // Fast inline loading

  // Parcel Form States (Sender details removed)
  const [parcelType, setParcelType] = useState('Box');
  const [parcelName, setParcelName] = useState('');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    const storedStaff = localStorage.getItem('hostel_staff');
    if (storedStaff) {
      setStaffUser(JSON.parse(storedStaff));
    }
  }, []);

  // Auto-clear success messages after 3 seconds for professional feel
  useEffect(() => {
    if (msg.type === 'success' && msg.text) {
      const timer = setTimeout(() => setMsg({ type: '', text: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [msg]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const q = query(
        collection(db, 'users'), 
        where('mobileNumber', '==', loginMobileNumber.trim()),
        where('status', '==', 'active')
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        setLoginError('Invalid Mobile Number or Account is inactive.');
        setLoginLoading(false);
        return;
      }

      const userData = snap.docs[0].data();
      if (userData.password === loginPassword) {
        const staffObj = { id: snap.docs[0].id, ...userData };
        localStorage.setItem('hostel_staff', JSON.stringify(staffObj)); 
        setStaffUser(staffObj);
      } else {
        setLoginError('Incorrect password.');
      }
    } catch (err) {
      console.error(err);
      setLoginError('System error. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('hostel_staff');
    setStaffUser(null);
    setStudentData(null); 
  };

  const handleSearchStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });
    setStudentData(null);
    setPendingParcels([]);
    setActiveTab('parcels'); // Reset to parcels tab on new search

    try {
      const q = query(collection(db, 'students'), where('assignedPin', '==', String(pinSearch)), where('status', '==', 'active'));
      const snap = await getDocs(q);

      if (snap.empty) {
        setMsg({ type: 'error', text: 'Invalid PIN or Student is not active.' });
      } else {
        const docSnap = snap.docs[0];
        const student = { id: docSnap.id, ...docSnap.data() };
        setStudentData(student);

        const parcelQ = query(collection(db, 'parcels'), where('pin', '==', student.assignedPin), where('status', '==', 'Expected'));
        const parcelSnap = await getDocs(parcelQ);
        const pList = [];
        parcelSnap.forEach(d => pList.push({ id: d.id, ...d.data() }));
        setPendingParcels(pList);
      }
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: 'Something went wrong. Try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleParcelSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newParcelData = {
        studentId: studentData.id,
        studentName: studentData.name,
        pin: studentData.assignedPin,
        roomNumber: studentData.roomNumber,
        parcelType,
        parcelName,
        senderName: "Not Provided", // Backend email template ke liye default
        mobileNumber: "N/A",
        remarks,
        status: 'Expected', 
        createdAt: new Date(),
        receivedAt: null,
        receivedBy: null,
        entryBy: staffUser.username 
      };
      
      const docRef = await addDoc(collection(db, 'parcels'), newParcelData);
      setPendingParcels([{ id: docRef.id, ...newParcelData }, ...pendingParcels]);
      
      // Reset form & instantly show success and switch tab
      setParcelName(''); setRemarks('');
      setMsg({ type: 'success', text: 'Parcel successfully registered!' });
      setActiveTab('parcels');
      
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: 'Failed to submit parcel.' });
    } finally {
      setLoading(false);
    }
  };

  const sendEmailNotification = async (parcel, receiveTime) => {
    const studentEmail = studentData?.email || parcel.studentEmail || "testemail@gmail.com";
    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: studentEmail,
          studentName: parcel.studentName,
          parcelName: parcel.parcelName,
          senderName: parcel.senderName,
          roomNumber: parcel.roomNumber,
          receiveTime: receiveTime
        })
      });
    } catch (error) {
      console.error("Email fail:", error);
    }
  };

  const handleMarkReceived = async (parcel) => {
    setProcessingId(parcel.id);
    const givenBy = staffUser.username; 

    try {
      const now = new Date();
      const formattedTime = now.toLocaleString('en-IN', { 
        day: '2-digit', month: 'short', year: 'numeric', 
        hour: '2-digit', minute: '2-digit', hour12: true 
      });

      // Update DB
      await updateDoc(doc(db, 'parcels', parcel.id), {
        status: 'Received',
        receivedAt: now,
        receivedBy: givenBy 
      });

      // Fire and forget email (Background execution for speed)
      sendEmailNotification(parcel, formattedTime);

      // Instant UI update
      setPendingParcels(prev => prev.filter(p => p.id !== parcel.id));
      setMsg({ type: 'success', text: `Parcel delivered successfully!` });
      
    } catch (error) {
      console.error(error);
      setMsg({ type: 'error', text: 'Failed to update status.' });
    } finally {
      setProcessingId(null);
    }
  };

  // ================= RENDER LOGIN SCREEN =================
  if (!staffUser) {
    return (
      <div className="elite-wrapper login-bg">
        <div className="elite-glass-card login-card fade-in">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <img src="/logo.png" alt="SGVP Parcel Logo" style={{ width: '90px', height: '90px', objectFit: 'contain', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))' }} />
          </div>
          <div className="elite-header text-center">
            <h2>Staff Portal</h2>
            <p>Secure access for Hostel Management</p>
          </div>
          {loginError && <div className="elite-alert error-glow shake">{loginError}</div>}
          <form onSubmit={handleLogin} className="elite-form">
            <div className="elite-input-group">
              <label>Mobile Number</label>
              <div className="input-with-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                <input type="tel" value={loginMobileNumber} onChange={e => setLoginMobileNumber(e.target.value)} required placeholder="10-digit mobile number" pattern="[0-9]{10}" />
              </div>
            </div>
            <div className="elite-input-group">
              <label>Password</label>
              <div className="input-with-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required placeholder="Enter your password" />
              </div>
            </div>
            <button type="submit" disabled={loginLoading} className="elite-btn-primary elite-btn-glow">
              {loginLoading ? <span className="loader"></span> : 'Authenticate & Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ================= RENDER MAIN APP =================
  return (
    <div className="elite-wrapper app-bg">
      <div className="elite-glass-card main-app-card fade-in">
        
        <div className="elite-top-nav">
          <div className="nav-profile">
            <div className="nav-avatar" style={{ background: 'transparent', padding: '0' }}>
              <img src="/logo.png" alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '8px' }} />
            </div>
            <div className="nav-info">
              <span className="nav-greeting">Welcome back,</span>
              <strong className="nav-name">{staffUser.username}</strong>
            </div>
          </div>
          <button onClick={handleLogout} className="elite-btn-logout" title="Secure Logout">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            <span>Logout</span>
          </button>
        </div>

        {msg.text && (
          <div className={`elite-alert ${msg.type === 'error' ? 'error-glow' : 'success-glow'} fade-in`} style={{marginBottom: '15px'}}>
            <span>{msg.text}</span>
          </div>
        )}

        <form onSubmit={handleSearchStudent} className="elite-search-form">
          <div className="search-bar-wrapper">
            <svg className="search-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input 
              type="number" 
              value={pinSearch} 
              onChange={e => setPinSearch(e.target.value)} 
              required 
              placeholder="Enter Student PIN..." 
              className="elite-search-input"
            />
            <button type="submit" disabled={loading} className="elite-search-btn">
              {loading ? <span className="loader-small"></span> : 'Search'}
            </button>
          </div>
        </form>

        {studentData && (
          <div className="elite-data-section fade-in-up">
            
            <div className="elite-id-card" style={{marginTop: '20px', marginBottom: '20px'}}>
              <div className="id-card-bg"></div>
              <div className="id-content">
                <div className="id-avatar">{studentData.name.charAt(0)}</div>
                <div className="id-details">
                  <h3>{studentData.name}</h3>
                  <div className="id-badges">
                    <span className="badge-room">🚪 Room {studentData.roomNumber}</span>
                    <span className="badge-pin">🔑 PIN: {studentData.assignedPin}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CUSTOM TABS / SLIDE BAR */}
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '14px', padding: '6px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
              <button
                type="button"
                onClick={() => setActiveTab('parcels')}
                style={{ 
                  flex: 1, padding: '12px', border: 'none', borderRadius: '10px', fontSize: '14px',
                  background: activeTab === 'parcels' ? '#fff' : 'transparent', 
                  color: activeTab === 'parcels' ? '#0f172a' : '#64748b', 
                  fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s ease',
                  boxShadow: activeTab === 'parcels' ? '0 4px 10px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                📦 Existing Parcels ({pendingParcels.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                style={{ 
                  flex: 1, padding: '12px', border: 'none', borderRadius: '10px', fontSize: '14px',
                  background: activeTab === 'create' ? '#fff' : 'transparent', 
                  color: activeTab === 'create' ? '#0f172a' : '#64748b', 
                  fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s ease',
                  boxShadow: activeTab === 'create' ? '0 4px 10px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                ➕ Create Parcel
              </button>
            </div>

            {/* TAB CONTENT: PENDING PARCELS */}
            {activeTab === 'parcels' && (
              <div className="elite-section fade-in">
                {pendingParcels.length > 0 ? (
                  <div className="elite-parcel-grid">
                    {pendingParcels.map(p => (
                      <div key={p.id} className="elite-ticket-card">
                        <div className="ticket-header">
                          <div className="ticket-icon">📦</div>
                          <div className="ticket-title">
                            <h4>{p.parcelName}</h4>
                            <span className="status-dot">Expected</span>
                          </div>
                        </div>
                        <div className="ticket-body">
                          <div className="info-row"><span>Type:</span> <strong>{p.parcelType}</strong></div>
                          {p.remarks && <div className="info-row alert-row"><span>Note:</span> <strong>{p.remarks}</strong></div>}
                        </div>
                        <button 
                          onClick={() => handleMarkReceived(p)} 
                          disabled={processingId === p.id}
                          className="elite-btn-success"
                          style={{ opacity: processingId === p.id ? 0.7 : 1 }}
                        >
                           {processingId === p.id ? (
                             <span className="loader-small"></span>
                           ) : (
                             <>
                               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> 
                               Mark Received
                             </>
                           )}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="elite-empty-state">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" style={{marginBottom: '10px'}}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                    <p>No pending parcels found.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: CREATE PARCEL */}
            {activeTab === 'create' && (
              <form onSubmit={handleParcelSubmit} className="elite-form neumorphic-form fade-in">
                <div className="elite-grid-2">
                  <div className="elite-input-group">
                    <label>Parcel Type</label>
                    <select value={parcelType} onChange={e => setParcelType(e.target.value)} required>
                      <option value="Box">Box / Package</option>
                      <option value="Document">Document / Envelope</option>
                      <option value="Bag">Bag / Luggage</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div className="elite-input-group">
                    <label>Parcel Items</label>
                    <input type="text" value={parcelName} onChange={e => setParcelName(e.target.value)} required placeholder="e.g. Clothes, Books" />
                  </div>
                </div>

                <div className="elite-input-group full-width">
                  <label>Remarks / Special Instructions (Optional)</label>
                  <input type="text" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="e.g. Fragile, Urgent" />
                </div>

                <button type="submit" disabled={loading} className="elite-btn-primary full-width">
                  {loading ? <span className="loader"></span> : <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg> Create Parcel</>}
                </button>
              </form>
            )}

          </div>
        )}

      </div>
    </div>
  );
}

export default PublicParcel;