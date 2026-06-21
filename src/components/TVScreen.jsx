// src/components/TVScreen.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../firebase';
import './TVScreen.css';

function TVScreen() {
  const [pendingParcelsList, setPendingParcelsList] = useState([]);
  const [collectionTime, setCollectionTime] = useState('Fetching...');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 1. Live Fetch Pending Parcels
  useEffect(() => {
    const expectedParcelsQ = query(collection(db, 'parcels'), where('status', '==', 'Expected'));
    
    const unsubscribeParcels = onSnapshot(expectedParcelsQ, (snapshot) => {
      const parcelsList = [];
      snapshot.forEach(doc => parcelsList.push({ id: doc.id, ...doc.data() }));
      setPendingParcelsList(parcelsList);
    });

    return () => unsubscribeParcels(); 
  }, []);

  // 2. Live Fetch Collection Time from Database
  useEffect(() => {
    const timeDocRef = doc(db, 'settings', 'tvConfig');
    
    const unsubscribeTime = onSnapshot(timeDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setCollectionTime(docSnap.data().collectionTime || 'Today 05:00 PM - 07:00 PM');
      } else {
        setCollectionTime('Today 05:00 PM - 07:00 PM'); // Default
      }
    });

    return () => unsubscribeTime();
  }, []);

  // 3. Track Fullscreen Status
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 4. Toggle Fullscreen Logic
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="tv-mode-overlay fade-in">
      <div className="tv-header">
        <div>
          <h1>📦 PENDING PARCELS LIST</h1>
          <h2 className="tv-collection-time">🕒 COLLECTION TIME: {collectionTime}</h2>
        </div>
        <div className="tv-time-close">
          <span className="live-badge"><div className="pulse-dot-red"></div> LIVE FEED</span>
          {/* Full Screen Toggle Button */}
          <button onClick={toggleFullScreen} className="fs-btn">
            {isFullscreen ? '❌ Exit Full Screen' : '🔲 Full Screen'}
          </button>
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
                    {/* Duplicate list for smooth infinite scrolling if items > 3 */}
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
  );
}

export default TVScreen;