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

  // Modern Stat Card Component
  const StatCard = ({ title, value, icon, colorClass }) => (
    <div className="modern-stat-card fade-in-up">
      <div className={`stat-icon-wrapper ${colorClass}`}>
        {icon}
      </div>
      <p className="stat-title">{title}</p>
      <p className="stat-value">{value}</p>
    </div>
  );

  return (
    <div className="dashboard-container">
      
      {/* ---------- 📺 TRUE FULL SCREEN TV MODE (Unchanged logic) 📺 ---------- */}
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
                  <div className={`tv-scroll-content ${pendingParcelsList.length > 3 ? 'tv-scroll-active' : ''}`}>
                    <table className="tv-table">
                      <tbody>
                        {pendingParcelsList.map((parcel, index) => (
                          <tr key={`first-${index}`} className="tv-row">
                            <td width="45%" className="tv-name">{parcel.studentName}</td>
                            <td width="25%" className="text-center tv-room">{parcel.roomNumber}</td>
                            <td width="30%" className="text-center tv-pin">{parcel.pin}</td>
                          </tr>
                        ))}
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
      {/* ---------------------------------------------------------------------- */}

      {/* DASHBOARD HEADER */}
      <div className="dash-header fade-in">
        <div>
          <h1 className="dash-title">{getGreeting()}, Admin</h1>
          <p className="dash-subtitle">Welcome to SGVP Hostel - Your parcel management system</p>
        </div>
        <button onClick={handleLogout} className="dash-btn-outline">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          Sign Out
        </button>
      </div>

      {loading ? (
        <div className="dash-loading fade-in">
          <div className="dash-spinner"></div>
          <p>Syncing dashboard...</p>
        </div>
      ) : (
        <>
          {/* TOP STATS GRID */}
          <div className="dash-stats-grid">
            <StatCard 
              title="Active Students" 
              value={stats.activeStudents} 
              colorClass="blue-icon"
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>} 
            />
            <StatCard 
              title="Pending Parcels" 
              value={stats.pendingParcels} 
              colorClass="yellow-icon"
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>} 
            />
            <StatCard 
              title="Pending PINs" 
              value={stats.pendingPins} 
              colorClass="red-icon"
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>} 
            />
            <StatCard 
              title="Leave History" 
              value={stats.leftStudents} 
              colorClass="gray-icon"
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>} 
            />
          </div>

          {/* MAIN CONTENT LAYOUT (2 Columns) */}
          <div className="dash-main-grid fade-in-up">
            
            {/* LEFT COLUMN: Recent Pending Parcels */}
            <div className="dash-card col-span-2">
              <div className="card-header-flex">
                <h2>Live Pending Parcels</h2>
                <span className="view-all-text">Real-time Feed</span>
              </div>

              {pendingParcelsList.length > 0 ? (
                <div className="recent-list">
                  {pendingParcelsList.slice(0, 5).map(parcel => (
                    <div key={parcel.id} className="recent-item">
                      <div className="recent-item-left">
                        <p className="item-title">{parcel.parcelName}</p>
                        <p className="item-sub">{parcel.studentName} (Room: {parcel.roomNumber})</p>
                      </div>
                      <div className="recent-item-right">
                        <p className="item-status">Expected</p>
                        <p className="item-sub">PIN: {parcel.pin}</p>
                      </div>
                    </div>
                  ))}
                  {pendingParcelsList.length > 5 && (
                    <div className="more-parcels-note">
                      + {pendingParcelsList.length - 5} more parcels waiting
                    </div>
                  )}
                </div>
              ) : (
                <div className="empty-recent">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                  <p>No parcels waiting currently</p>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Actions & Status */}
            <div className="dash-right-col">
              
              <div className="dash-card highlight-card">
                <h2>Quick Actions</h2>
                <div className="action-buttons">
                  <button onClick={openTVMode} className="btn-primary-action">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>
                    Launch TV Display
                  </button>
                  <button onClick={() => window.location.href='/manage-parcels'} className="btn-secondary-action">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                    Manage Parcels
                  </button>
                </div>
              </div>

              <div className="dash-card">
                <h2>System Status</h2>
                <div className="status-list">
                  <div className="status-row">
                    <span className="status-label">Total Check-ins</span>
                    <span className="status-val">{stats.activeStudents}</span>
                  </div>
                  <div className="status-row">
                    <span className="status-label">Waiting Parcels</span>
                    <span className="status-val text-yellow">{stats.pendingParcels}</span>
                  </div>
                  <div className="status-row">
                    <span className="status-label">Missing PINs</span>
                    <span className="status-val text-red">{stats.pendingPins}</span>
                  </div>
                  <div className="status-footer">
                    Last synced: {new Date().toLocaleTimeString('en-IN')}
                  </div>
                </div>
              </div>

            </div>

          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;