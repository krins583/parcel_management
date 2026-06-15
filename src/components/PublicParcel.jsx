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

  // Parcel Form States
  const [parcelType, setParcelType] = useState('Box');
  const [parcelName, setParcelName] = useState('');
  const [senderName, setSenderName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [remarks, setRemarks] = useState('');

  // === TELEGRAM BOT CONFIGURATION ===
const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;

  useEffect(() => {
    const storedStaff = localStorage.getItem('hostel_staff');
    if (storedStaff) {
      setStaffUser(JSON.parse(storedStaff));
    }
  }, []);

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
    if(window.confirm("Are you sure you want to log out?")) {
      localStorage.removeItem('hostel_staff');
      setStaffUser(null);
      setStudentData(null); 
    }
  };

  const handleSearchStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });
    setStudentData(null);
    setPendingParcels([]);

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
        senderName,
        mobileNumber,
        remarks,
        status: 'Expected', 
        createdAt: new Date(),
        receivedAt: null,
        receivedBy: null,
        entryBy: staffUser.username 
      };
      
      const docRef = await addDoc(collection(db, 'parcels'), newParcelData);
      setMsg({ type: 'success', text: 'Parcel successfully registered!' });
      setPendingParcels([{ id: docRef.id, ...newParcelData }, ...pendingParcels]);
      
      setParcelName(''); setSenderName(''); setMobileNumber(''); setRemarks('');
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: 'Failed to submit parcel.' });
    } finally {
      setLoading(false);
    }
  };

  const sendTelegramNotification = async (parcel, receiveTime, givenBy) => {
    const message = `
📦 *PARCEL DELIVERED TO STUDENT* 📦

👤 *Student:* ${parcel.studentName}
🔢 *PIN:* ${parcel.pin} | *Room:* ${parcel.roomNumber}

📦 *Items:* ${parcel.parcelName} (${parcel.parcelType})
🏢 *Sender:* ${parcel.senderName}

🤝 *Handed Over By:* ${givenBy} (Staff)
🕒 *Time:* ${receiveTime}
✅ *Status:* Successfully collected!
    `;

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message, parse_mode: 'Markdown' })
      });
    } catch (error) {
      console.error("Failed to send Telegram message:", error);
    }
  };

  const handleMarkReceived = async (parcel) => {
    const givenBy = staffUser.username; 

    if(window.confirm(`Confirm handing over this parcel to ${studentData.name}?`)) {
      try {
        const now = new Date();
        const formattedTime = now.toLocaleString('en-IN', { 
          day: '2-digit', month: 'short', year: 'numeric', 
          hour: '2-digit', minute: '2-digit', hour12: true 
        });

        await updateDoc(doc(db, 'parcels', parcel.id), {
          status: 'Received',
          receivedAt: now,
          receivedBy: givenBy 
        });

        await sendTelegramNotification(parcel, formattedTime, givenBy);

        alert("Parcel successfully marked as received!");
        setPendingParcels(prev => prev.filter(p => p.id !== parcel.id));
      } catch (error) {
        console.error(error);
        alert("Failed to update status.");
      }
    }
  };

  // ================= RENDER LOGIN SCREEN (PREMIUM) =================
  if (!staffUser) {
    return (
      <div className="elite-wrapper login-bg">
        <div className="elite-glass-card login-card fade-in">
          
          {/* Logo Integration Here */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <img 
              src="/logo.png" 
              alt="SGVP Parcel Logo" 
              style={{ width: '90px', height: '90px', objectFit: 'contain', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))' }} 
            />
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
                <input 
                  type="tel" 
                  value={loginMobileNumber} 
                  onChange={e => setLoginMobileNumber(e.target.value)} 
                  required 
                  placeholder="10-digit mobile number"
                  pattern="[0-9]{10}"
                />
              </div>
            </div>
            <div className="elite-input-group">
              <label>Password</label>
              <div className="input-with-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                <input 
                  type="password" 
                  value={loginPassword} 
                  onChange={e => setLoginPassword(e.target.value)} 
                  required 
                  placeholder="Enter your password" 
                />
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

  // ================= RENDER MAIN APP (PREMIUM) =================
  return (
    <div className="elite-wrapper app-bg">
      <div className="elite-glass-card main-app-card fade-in">
        
        {/* Elite Top Navigation */}
        <div className="elite-top-nav">
          <div className="nav-profile">
            {/* Logo Integration in Top Nav */}
            <div className="nav-avatar" style={{ background: 'transparent', padding: '0' }}>
              <img 
                src="/logo.png" 
                alt="Logo" 
                style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '8px' }} 
              />
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

        <div className="elite-header text-center" style={{ marginTop: '20px' }}>
          <div className="title-badge">📦 Parcel Operations</div>
          <h2>Search & Manage</h2>
        </div>

        {msg.text && (
          <div className={`elite-alert ${msg.type === 'error' ? 'error-glow' : 'success-glow'} fade-in`}>
            <span>{msg.text}</span>
          </div>
        )}

        {/* Elite Search Bar */}
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
            
            {/* Premium ID Card Style Student Box */}
            <div className="elite-id-card">
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

            {/* Pending Parcels - Ticket Style */}
            <div className="elite-section">
              <div className="section-title-flex">
                <h3>Pending Parcels</h3>
                <span className="count-badge">{pendingParcels.length}</span>
              </div>
              
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
                        <div className="info-row"><span>From:</span> <strong>{p.senderName}</strong></div>
                        {p.remarks && <div className="info-row alert-row"><span>Note:</span> <strong>{p.remarks}</strong></div>}
                      </div>
                      <button onClick={() => handleMarkReceived(p)} className="elite-btn-success">
                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> 
                         Hand Over to Student
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

            <div className="elite-divider"><span>OR</span></div>

            {/* Add New Parcel Form */}
            <form onSubmit={handleParcelSubmit} className="elite-form neumorphic-form">
              <h3 className="section-title">➕ Register Incoming Parcel</h3>
              
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
                
                <div className="elite-input-group">
                  <label>Sender Name</label>
                  <input type="text" value={senderName} onChange={e => setSenderName(e.target.value)} required placeholder="Sender's Full Name" />
                </div>
                
                <div className="elite-input-group">
                  <label>Sender Mobile</label>
                  <input type="tel" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} required placeholder="10-digit number" />
                </div>
              </div>

              <div className="elite-input-group full-width">
                <label>Remarks / Special Instructions</label>
                <input type="text" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="e.g. Fragile, Urgent" />
              </div>

              <button type="submit" disabled={loading} className="elite-btn-primary full-width">
                {loading ? <span className="loader"></span> : <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg> Register & Save</>}
              </button>
            </form>

          </div>
        )}

      </div>
    </div>
  );
}

export default PublicParcel;