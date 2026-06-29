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

  // App Modes & Data
  const [mainMode, setMainMode] = useState('search_create'); 
  const [allStudents, setAllStudents] = useState([]);
  const [allPendingParcels, setAllPendingParcels] = useState([]); 
  const [pendingSearchPin, setPendingSearchPin] = useState(''); 

  // Individual Search & Create States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [studentData, setStudentData] = useState(null);
  const [pendingParcels, setPendingParcels] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  
  // UI States
  const [activeTab, setActiveTab] = useState('parcels');
  const [processingId, setProcessingId] = useState(null);
  const [viewImageUrl, setViewImageUrl] = useState(null); 

  // Parcel Form States
  const [parcelType, setParcelType] = useState('Box');
  const [parcelName, setParcelName] = useState('');
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    const storedStaff = localStorage.getItem('hostel_staff');
    if (storedStaff) {
      setStaffUser(JSON.parse(storedStaff));
    }
  }, []);

  useEffect(() => {
    if (staffUser) {
      const fetchAllActive = async () => {
        const q = query(collection(db, 'students'), where('status', '==', 'active'));
        const snap = await getDocs(q);
        const list = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        setAllStudents(list);
      };
      fetchAllActive();
    }
  }, [staffUser]);

  const fetchAllPendingParcels = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'parcels'), where('status', '==', 'Expected'));
      const snap = await getDocs(q);
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setAllPendingParcels(list);
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: 'Failed to load all pending parcels.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mainMode === 'all_pending') {
      fetchAllPendingParcels();
    }
  }, [mainMode]);

  useEffect(() => {
    if (msg.text) {
      const timer = setTimeout(() => setMsg({ type: '', text: '' }), 4000);
      return () => clearTimeout(timer);
    }
  }, [msg]);

  // LOGIN LOGIC
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
    setSearchResults([]);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    setStudentData(null);
    
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const term = searchQuery.toLowerCase().trim();
    const results = allStudents.filter(s => 
      s.name.toLowerCase().includes(term) || 
      String(s.assignedPin || '').includes(term)
    );

    if (results.length === 0) {
      setMsg({ type: 'error', text: 'No student found with this Name or PIN.' });
    }
    setSearchResults(results);
  };

  const selectStudent = async (student) => {
    setLoading(true);
    setStudentData(student);
    setSearchResults([]);
    setActiveTab('parcels');

    try {
      const parcelQ = query(collection(db, 'parcels'), where('pin', '==', student.assignedPin), where('status', '==', 'Expected'));
      const parcelSnap = await getDocs(parcelQ);
      const pList = [];
      parcelSnap.forEach(d => pList.push({ id: d.id, ...d.data() }));
      setPendingParcels(pList);
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: 'Failed to load parcels.' });
    } finally {
      setLoading(false);
    }
  };

  const handleParcelSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let uploadedImageUrl = '';
      
      if (imageFile) {
        const compressedFile = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(imageFile);
          reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_WIDTH = 800; 
              const scaleSize = MAX_WIDTH / img.width;
              canvas.width = MAX_WIDTH;
              canvas.height = img.height * scaleSize;
              
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              
              canvas.toBlob((blob) => {
                resolve(new File([blob], imageFile.name, { type: 'image/jpeg' }));
              }, 'image/jpeg', 0.7); 
            };
          };
        });

        const formData = new FormData();
        formData.append('image', compressedFile); 
        const IMGBB_API_KEY = "5c8a9e24ee14dfcf633871c8d058df40"; 
        
        const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
          method: 'POST',
          body: formData
        });
        
        const imgbbData = await imgbbRes.json();
        if (imgbbData.success) {
          uploadedImageUrl = imgbbData.data.url;
        } else {
          throw new Error('Image upload failed');
        }
      }

      const newParcelData = {
        studentId: studentData.id,
        studentName: studentData.name,
        pin: studentData.assignedPin,
        roomNumber: studentData.roomNumber,
        studentEmail: studentData.email || "", // 🚀 FIX 1: Naya parcel banate waqt email save kar rahe hain
        parcelType,
        parcelName,
        senderName: "Not Provided", 
        mobileNumber: "N/A",
        imageUrl: uploadedImageUrl,
        status: 'Expected', 
        createdAt: new Date(),
        receivedAt: null,
        receivedBy: null,
        createdBy: staffUser.username 
      };
      
      const docRef = await addDoc(collection(db, 'parcels'), newParcelData);
      setPendingParcels([{ id: docRef.id, ...newParcelData }, ...pendingParcels]);
      
      setParcelName(''); setImageFile(null);
      setMsg({ type: 'success', text: 'Parcel successfully registered!' });
      setActiveTab('parcels');
      
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: 'Failed to submit parcel or upload image.' });
    } finally {
      setLoading(false);
    }
  };

  const sendEmailNotification = async (parcel, receiveTime) => {
    // 🚀 FIX 2: Agar purana parcel hai jisme email nahi hai, toh allStudents list mein se uska email nikal lenge
    const foundStudent = allStudents.find(s => s.id === parcel.studentId || s.assignedPin === parcel.pin);
    
    // Yahan pehle specific search data, fir parcel ka apna data, fir background list ka data check hoga
    const finalEmail = studentData?.email || parcel.studentEmail || foundStudent?.email;

    if (!finalEmail) {
      console.error("Student email not found. Cannot send email.");
      return; // Agar email mila hi nahi toh test email par bhejne ki bajay cancel kar denge
    }

    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: finalEmail,
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

      await updateDoc(doc(db, 'parcels', parcel.id), {
        status: 'Received',
        receivedAt: now,
        receivedBy: givenBy 
      });

      sendEmailNotification(parcel, formattedTime);

      setPendingParcels(prev => prev.filter(p => p.id !== parcel.id));
      setAllPendingParcels(prev => prev.filter(p => p.id !== parcel.id));
      
      setMsg({ type: 'success', text: `Parcel delivered successfully!` });
    } catch (error) {
      console.error(error);
      setMsg({ type: 'error', text: 'Failed to update status.' });
    } finally {
      setProcessingId(null);
    }
  };

  const filteredAllPending = allPendingParcels.filter(p => 
    String(p.pin).includes(pendingSearchPin.trim()) || 
    p.studentName.toLowerCase().includes(pendingSearchPin.toLowerCase())
  );

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

  return (
    <div className="elite-wrapper app-bg">
      {viewImageUrl && (
        <div className="image-modal-overlay fade-in" onClick={() => setViewImageUrl(null)}>
          <div className="image-modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setViewImageUrl(null)}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> 
              Close Photo
            </button>
            <img src={viewImageUrl} alt="Parcel Proof" className="modal-img" />
          </div>
        </div>
      )}

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

        <div className="main-mode-toggle fade-in">
          <button 
            className={mainMode === 'search_create' ? 'active' : ''} 
            onClick={() => setMainMode('search_create')}
          >
            🔍 Search & Create
          </button>
          <button 
            className={mainMode === 'all_pending' ? 'active' : ''} 
            onClick={() => setMainMode('all_pending')}
          >
            📦 All Pending Parcels
          </button>
        </div>

        {msg.text && (
          <div className={`elite-alert ${msg.type === 'error' ? 'error-glow' : 'success-glow'} fade-in`} style={{marginBottom: '15px'}}>
            <span>{msg.text}</span>
          </div>
        )}

        {mainMode === 'search_create' && (
          <div className="fade-in-up">
            {!studentData && (
              <form onSubmit={handleSearchSubmit} className="elite-search-form">
                <div className="search-bar-wrapper">
                  <svg className="search-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  <input 
                    type="text" 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                    required 
                    placeholder="Search Student by Name or PIN..." 
                    className="elite-search-input"
                  />
                  <button type="submit" className="elite-search-btn">Search</button>
                </div>
              </form>
            )}

            {searchResults.length > 0 && !studentData && (
              <div className="search-results-container fade-in-up">
                <h4 style={{ color: '#64748b', marginBottom: '10px', fontSize: '13px', textTransform: 'uppercase' }}>Select Student ({searchResults.length} found)</h4>
                <div className="results-grid">
                  {searchResults.map(s => (
                    <div key={s.id} className="result-card" onClick={() => selectStudent(s)}>
                      <div className="res-avatar">{s.name.charAt(0)}</div>
                      <div className="res-info">
                        <strong className="res-name">{s.name}</strong>
                        <div className="res-badges">
                          <span className="res-pin">PIN: {s.assignedPin || 'N/A'}</span>
                          <span className="res-room">Room {s.roomNumber || 'N/A'}</span>
                        </div>
                      </div>
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#94a3b8" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {studentData && (
              <div className="elite-data-section fade-in-up">
                <div className="back-btn-wrapper">
                  <button onClick={() => setStudentData(null)} className="btn-back-search">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> Back to Search
                  </button>
                </div>

                <div className="elite-id-card" style={{ marginBottom: '20px'}}>
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

                <div className="tabs-container">
                  <button type="button" onClick={() => setActiveTab('parcels')} className={`tab-btn ${activeTab === 'parcels' ? 'active' : ''}`}>
                    📦 Existing Parcels ({pendingParcels.length})
                  </button>
                  <button type="button" onClick={() => setActiveTab('create')} className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}>
                    ➕ Create Parcel
                  </button>
                </div>

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
                            </div>
                            
                            <div className="ticket-actions">
                              {p.imageUrl && (
                                <button onClick={() => setViewImageUrl(p.imageUrl)} className="btn-view-photo">
                                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg> View Photo
                                </button>
                              )}
                              <button onClick={() => handleMarkReceived(p)} disabled={processingId === p.id} className="elite-btn-success" style={{ opacity: processingId === p.id ? 0.7 : 1 }}>
                                 {processingId === p.id ? <span className="loader-small"></span> : <> <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Mark Received </>}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="elite-empty-state">
                        <p>No pending parcels for this student.</p>
                      </div>
                    )}
                  </div>
                )}

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
                    
                    {/* 🚀 UNIVERSAL UPLOAD BUTTON (FIXES WEBVIEW CAMERA BUG) */}
                    <div className="elite-input-group full-width">
                      <label>Attach Parcel Photo</label>
                      
                      <label htmlFor="universal-upload" className="upload-btn-split" style={{ padding: '16px', fontSize: '15px', marginBottom: '10px' }}>
                        📸 Click Photo / 🖼️ Select from Gallery
                      </label>
                      <input 
                        id="universal-upload"
                        type="file" 
                        accept="image/*" 
                        /* 🚀 MAGIC FIX: Yahan se 'capture="camera"' HATA DIYA HAI taaki Android khud handle kare */
                        onChange={e => setImageFile(e.target.files[0])} 
                        className="hidden-file-safe"
                      />
                      
                      {/* FILE SELECTED CONFIRMATION */}
                      {imageFile && (
                        <div className="selected-file-badge fade-in">
                          ✅ Selected: {imageFile.name}
                        </div>
                      )}
                    </div>

                    <button type="submit" disabled={loading} className="elite-btn-primary full-width">
                      {loading ? <span className="loader"></span> : <>Create Parcel</>}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {mainMode === 'all_pending' && (
          <div className="fade-in-up">
            <div className="search-bar-wrapper" style={{ marginBottom: '15px' }}>
              <svg className="search-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input 
                type="text" 
                value={pendingSearchPin} 
                onChange={e => setPendingSearchPin(e.target.value)} 
                placeholder="Filter by Student PIN or Name..." 
                className="elite-search-input"
              />
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}><span className="loader" style={{ borderColor: '#6366f1', borderTopColor: 'transparent', margin: '0 auto' }}></span></div>
            ) : (
              <div className="elite-section">
                {filteredAllPending.length > 0 ? (
                  <div className="elite-parcel-grid" style={{ gap: '10px' }}> 
                    {filteredAllPending.map(p => (
                      <div key={p.id} className="elite-ticket-card" style={{ padding: '12px' }}> 
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                          <div className="res-avatar" style={{ width: '30px', height: '30px', fontSize: '13px', borderRadius: '8px' }}>{p.studentName.charAt(0)}</div>
                          <div style={{ flex: 1 }}>
                            <strong style={{ display: 'block', color: '#0f172a', fontSize: '14px', lineHeight: '1.2' }}>{p.studentName}</strong>
                            <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: '800' }}>PIN: {p.pin} • Room: {p.roomNumber}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <div className="ticket-header" style={{ margin: 0, alignItems: 'center' }}>
                            <div className="ticket-icon" style={{ width: '26px', height: '26px', fontSize: '12px', borderRadius: '6px' }}>📦</div>
                            <div className="ticket-title">
                              <h4 style={{ fontSize: '13px', margin: '0 0 2px 0' }}>{p.parcelName}</h4>
                              <span className="status-dot" style={{ fontSize: '10px' }}>{p.parcelType}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="ticket-actions" style={{ display: 'flex', gap: '8px' }}>
                          {p.imageUrl && (
                            <button onClick={() => setViewImageUrl(p.imageUrl)} className="btn-view-photo" style={{ margin: 0, flex: 1, padding: '8px', fontSize: '12px', height: '34px' }}>
                              📸 Photo
                            </button>
                          )}
                          <button onClick={() => handleMarkReceived(p)} disabled={processingId === p.id} className="elite-btn-success" style={{ margin: 0, flex: p.imageUrl ? 1 : 2, padding: '8px', fontSize: '12px', height: '34px', opacity: processingId === p.id ? 0.7 : 1 }}>
                             {processingId === p.id ? <span className="loader-small" style={{width: '14px', height: '14px'}}></span> : <>✅ Receive</>}
                          </button>
                        </div>

                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="elite-empty-state">
                    <p>No pending parcels found in the system.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default PublicParcel;