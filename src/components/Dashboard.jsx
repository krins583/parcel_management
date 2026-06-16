// src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import './Dashboard.css';

function Dashboard() {
  const [stats, setStats] = useState({
    activeStudents: 0,
    pendingPins: 0,
    leftStudents: 0,
    pendingParcels: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [isTVMode, setIsTVMode] = useState(false);
  const [pendingParcelsList, setPendingParcelsList] = useState([]);
  const [collectionTime, setCollectionTime] = useState('');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  useEffect(() => {
    const fetchStaticStats = async () => {
      try {
        const activeQ = query(collection(db, 'students'), where('status', '==', 'active'));
        const activeSnap = await getDocs(activeQ);
        
        const pendingPinQ = query(collection(db, 'students'), where('status', '==', 'active'), where('hasPin', '==', false));
        const pendingPinSnap = await getDocs(pendingPinQ);
        
        const leftQ = query(collection(db, 'students'), where('status', '==', 'left'));
        const leftSnap = await getDocs(leftQ);

        setStats(prev => ({
          ...prev,
          activeStudents: activeSnap.size,
          pendingPins: pendingPinSnap.size,
          leftStudents: leftSnap.size
        }));
      } catch (error) {
        console.error("Error fetching static stats: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStaticStats();
  }, []);

  useEffect(() => {
    const expectedParcelsQ = query(collection(db, 'parcels'), where('status', '==', 'Expected'));
    
    const unsubscribe = onSnapshot(expectedParcelsQ, (snapshot) => {
      const parcelsList = [];
      snapshot.forEach(doc => parcelsList.push({ id: doc.id, ...doc.data() }));
      setPendingParcelsList(parcelsList);
      setStats(prev => ({ ...prev, pendingParcels: parcelsList.length }));
    });

    return () => unsubscribe(); 
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsTVMode(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleLogout = async () => {
    const confirmLogout = window.confirm("Are you sure you want to log out securely?");
    if (confirmLogout) {
      try {
        await signOut(auth);
        window.location.href = '/'; 
      } catch (error) {
        console.error("Error logging out: ", error);
        alert("Failed to log out.");
      }
    }
  };

  const openTVMode = () => {
    const timeInput = prompt("Bachhon ko Parcel lene ka time batao (e.g., Today 5:00 PM to 6:00 PM):", "Today 05:00 PM - 07:00 PM");
    
    if (timeInput !== null) {
      setCollectionTime(timeInput);
      setIsTVMode(true);
      
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      }
    }
  };

  const closeTVMode = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
    setIsTVMode(false);
  };

  return (
    <div className="dashboard-wrapper">
      
      {/* ---------- 📺 TRUE FULL SCREEN TV MODE 📺 ---------- */}
      {isTVMode && (
        <div className="tv-mode-overlay fade-in">
          <div className="tv-header">
            <div>
              <h1>📦 PENDING PARCELS LIST</h1>
              <h2 className="tv-collection-time">🕒 COLLECTION TIME: {collectionTime}</h2>
            </div>
            <div className="tv-time-close">
              <span className="live-badge"><div className="pulse-dot-red"></div> LIVE FEED</span>
              <button onClick={closeTVMode} className="close-tv-btn">✕ Exit TV Mode</button>
            </div>
          </div>
          
          <div className="tv-content">
            {pendingParcelsList.length > 0 ? (
              <div className="tv-data-container">
                <table className="tv-table tv-header-fixed">
                  <thead>
                    <tr>
                      <th width="45%">STUDENT NAME</th>
                      <th width="25%" className="text-center">ROOM NO.</th>
                      <th width="30%" className="text-center">PIN NUMBER</th>
                    </tr>
                  </thead>
                </table>
                <div className="tv-scroll-viewport">
                  {/* Yahan Condition strictly 3 par set ki hai */}
                  <div className={`tv-scroll-content ${pendingParcelsList.length > 3 ? 'tv-scroll-active' : ''}`}>
                    <table className="tv-table">
                      <tbody>
                        {/* Pehli original list hamesha dikhegi */}
                        {pendingParcelsList.map((parcel, index) => (
                          <tr key={`first-${index}`} className="tv-row">
                            <td width="45%" className="tv-name">{parcel.studentName}</td>
                            <td width="25%" className="text-center tv-room">{parcel.roomNumber}</td>
                            <td width="30%" className="text-center tv-pin">{parcel.pin}</td>
                          </tr>
                        ))}
                        
                        {/* Dusri (Duplicate) list sirf tabhi aayegi jab items 3 se zyada hon */}
                        {pendingParcelsList.length > 3 && pendingParcelsList.map((parcel, index) => (
                          <tr key={`second-${index}`} className="tv-row">
                            <td width="45%" className="tv-name">{parcel.studentName}</td>
                            <td width="25%" className="text-center tv-room">{parcel.roomNumber}</td>
                            <td width="30%" className="text-center tv-pin">{parcel.pin}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="tv-empty">
                <h2>No Pending Parcels Right Now.</h2>
                <p>All clear!</p>
              </div>
            )}
          </div>
        </div>
      )}
      {/* ---------------------------------------------------- */}

      <header className="premium-header fade-in">
        <div className="header-content">
          <h1>{getGreeting()}, Admin</h1>
          <p>Here's what's happening in your hostel today.</p>
        </div>
        <button onClick={handleLogout} className="premium-logout-btn">
          <svg className="logout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </header>
      
      {loading ? (
        <div className="loading-container fade-in">
          <div className="premium-spinner"></div>
          <p>Syncing data...</p>
        </div>
      ) : (
       <div className="stats-grid fade-in-up">
          
          <div className="premium-card primary-gradient">
            <div className="card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <div className="card-content">
              <h3>Active Students</h3>
              <p className="stat-value">{stats.activeStudents}</p>
              <span className="stat-label">Currently checked in</span>
            </div>
          </div>
          
          <div className="premium-card tv-gradient" onClick={openTVMode} style={{ cursor: 'pointer' }}>
            <div className="card-icon" style={{ animation: 'pulse-glow 2s infinite' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            </div>
            <div className="card-content">
              <h3>Pending Parcels</h3>
              <p className="stat-value">{stats.pendingParcels}</p>
              <span className="stat-label" style={{ fontWeight: 'bold', color: '#fef08a' }}>▶ CLICK TO OPEN TV DISPLAY</span>
            </div>
          </div>

          <div className="premium-card warning-gradient">
            <div className="card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <div className="card-content">
              <h3>Pending PINs</h3>
              <p className="stat-value">{stats.pendingPins}</p>
              <span className="stat-label">Require assignment</span>
            </div>
          </div>

          <div className="premium-card neutral-gradient">
            <div className="card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
            </div>
            <div className="card-content">
              <h3>Leave History</h3>
              <p className="stat-value">{stats.leftStudents}</p>
              <span className="stat-label">Archived records</span>
            </div>
          </div>
          
        </div>
      )}

      <div className="system-overview fade-in-up delay">
        <div className="overview-header">
          <div className="pulse-dot"></div>
          <h3>System Status: Live</h3>
        </div>
        <p>
          Your database is securely synced with Firebase. You currently have <strong>{stats.pendingParcels}</strong> pending parcels waiting to be distributed.
        </p>
      </div>
    </div>
  );
}

export default Dashboard;