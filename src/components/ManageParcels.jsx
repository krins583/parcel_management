// src/components/ManageParcels.jsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import './StudentList.css'; 

function ManageParcels() {
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);

  // === TELEGRAM BOT CONFIGURATION ===
  // Note: Yahan apna actual Bot Token aur Chat ID (Group ya User) replace karna hoga
const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;

  const fetchExpectedParcels = async () => {
    try {
      const q = query(collection(db, 'parcels'), where('status', '==', 'Expected'));
      const snap = await getDocs(q);
      const list = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      setParcels(list);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpectedParcels();
  }, []);

  // Telegram Message Bhejne ka Function
  // Telegram Message Bhejne ka Function
  const sendTelegramNotification = async (parcel, receiveTime) => {
    const message = `
📦 *PARCEL DELIVERED TO STUDENT* 📦

👤 *Student Name:* ${parcel.studentName}
🔢 *PIN:* ${parcel.pin} | *Room:* ${parcel.roomNumber}
📱 *Reg. Mobile:* ${parcel.mobileNumber}

📦 *Parcel Details:* ${parcel.parcelName} (${parcel.parcelType})
🏢 *Sender:* ${parcel.senderName}
🔍 *Tracking:* ${parcel.trackingId || 'N/A'}

🕒 *Handed Over At:* ${receiveTime}
✅ *Status:* Successfully received by the student!
    `;

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'Markdown'
        })
      });
      console.log("Telegram notification sent successfully!");
    } catch (error) {
      console.error("Failed to send Telegram message:", error);
    }
  };    

  const handleReceiveParcel = async (parcel) => {
    if(window.confirm(`Mark parcel for ${parcel.studentName} as received? A Telegram notification will be sent.`)) {
      try {
        const now = new Date();
        const formattedTime = now.toLocaleString('en-IN', { 
          day: '2-digit', month: 'short', year: 'numeric', 
          hour: '2-digit', minute: '2-digit', hour12: true 
        });

        // 1. Firebase mein status update karna
        await updateDoc(doc(db, 'parcels', parcel.id), {
          status: 'Received',
          receivedAt: now,
          receivedBy: 'Admin (Main Desk)' 
        });

        // 2. Telegram Notification Bhejna
        await sendTelegramNotification(parcel, formattedTime);

        alert("Parcel marked as received and notification sent!");
        fetchExpectedParcels(); // List se hatakar History mein bhej dega
      } catch (err) {
        console.error("Error receiving parcel:", err);
        alert("Error updating parcel status.");
      }
    }
  };

  return (
    <div className="premium-page-container fade-in">
      <div className="premium-list-card">
        <div className="list-header-premium">
          <div className="header-text">
            <h2>Manage Incoming Parcels</h2>
            <p className="subtitle">Alerts created by parents/students waiting to be received.</p>
          </div>
        </div>

        {loading ? <div className="loading-container-table"><div className="premium-spinner-small"></div></div> : (
          <div className="table-responsive">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Student Info</th>
                  <th>Parcel Details</th>
                  <th>Sender & Contact</th>
                  <th>Remarks</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {parcels.map(p => (
                  <tr key={p.id} className="table-row">
                    <td>
                      <strong style={{color: '#0f172a'}}>{p.studentName}</strong><br/>
                      <span className="std-badge">PIN: {p.pin}</span> | Room: {p.roomNumber}
                    </td>
                    <td>
                      <strong>{p.parcelName}</strong> ({p.parcelType})<br/>
                      <small style={{color: '#64748b'}}>Trk: {p.trackingId || 'N/A'}</small>
                    </td>
                    <td>
                      {p.senderName}<br/>
                      <small style={{color: '#64748b'}}>{p.mobileNumber}</small>
                    </td>
                    <td style={{ maxWidth: '150px', fontSize: '13px', color: '#ef4444' }}>
                      {p.remarks || '-'}
                    </td>
                    <td className="text-right">
                      {/* Bhejne ke liye poora 'p' object pass kar rahe hain */}
                      <button onClick={() => handleReceiveParcel(p)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                        Mark Received
                      </button>
                    </td>
                  </tr>
                ))}
                {parcels.length === 0 && <tr><td colSpan="5" className="premium-empty-state">No expected parcels at the moment.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageParcels;