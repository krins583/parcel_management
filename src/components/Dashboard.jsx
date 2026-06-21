// src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, onSnapshot, doc, setDoc } from 'firebase/firestore';
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
  const [pendingParcelsList, setPendingParcelsList] = useState([]);
  
  // Naya State for TV Time
  const [collectionTime, setCollectionTime] = useState('Today 05:00 PM - 07:00 PM');
  const [isUpdatingTime, setIsUpdatingTime] = useState(false);

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

  // Fetch Live Parcels
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

  // Fetch Live Time Settings
  useEffect(() => {
    const unsubscribeTime = onSnapshot(doc(db, 'settings', 'tvConfig'), (docSnap) => {
      if (docSnap.exists()) {
        setCollectionTime(docSnap.data().collectionTime || 'Today 05:00 PM - 07:00 PM');
      }
    });
    return () => unsubscribeTime();
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

  // Update TV Time in Database
  const updateTVTime = async () => {
    setIsUpdatingTime(true);
    try {
      await setDoc(doc(db, 'settings', 'tvConfig'), { collectionTime }, { merge: true });
      alert("✅ TV Screen Time updated successfully!");
    } catch (error) {
      console.error("Error updating time:", error);
      alert("Failed to update time.");
    } finally {
      setIsUpdatingTime(false);
    }
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
                <h2>Public TV Display Setup</h2>
                
                <div style={{marginBottom: '15px'}}>
                  <label style={{display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px'}}>Collection Time (Shows on TV):</label>
                  <div style={{display: 'flex', gap: '10px'}}>
                    <input 
                      type="text" 
                      value={collectionTime}
                      onChange={(e) => setCollectionTime(e.target.value)}
                      style={{flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontFamily: 'inherit'}}
                    />
                    <button onClick={updateTVTime} disabled={isUpdatingTime} style={{padding: '10px 15px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'}}>
                      {isUpdatingTime ? 'Saving...' : 'Update'}
                    </button>
                  </div>
                </div>

                <div className="action-buttons">
                  {/* Ye button ab naye tab mein Public TV link kholega */}
                  <button onClick={() => window.open('/tv', '_blank')} className="btn-primary-action">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>
                    Open Public TV Link
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