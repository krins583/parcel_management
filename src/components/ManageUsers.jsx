// src/components/ManageUsers.jsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query } from 'firebase/firestore';
import { db } from '../firebase';
import './StudentList.css'; // Reusing your clean table structure

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const userList = [];
      querySnapshot.forEach((doc) => {
        userList.push({ id: doc.id, ...doc.data() });
      });
      setUsers(userList);
    } catch (error) {
      console.error("Error fetching users: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Status Toggle Logic (Active <-> Inactive)
  const toggleUserStatus = async (user) => {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    const confirmChange = window.confirm(`Are you sure you want to make ${user.username} ${nextStatus.toUpperCase()}?`);
    
    if (confirmChange) {
      try {
        await updateDoc(doc(db, 'users', user.id), {
          status: nextStatus
        });
        fetchUsers(); // Live reload list
      } catch (error) {
        alert("Failed to update status.");
      }
    }
  };

  return (
    <div className="premium-page-container fade-in">
      <div className="premium-list-card">
        <div className="list-header-premium">
          <div className="header-text">
            <h2>Manage System Users</h2>
            <p className="subtitle">List of all system operators and their live operational status.</p>
          </div>
        </div>

        {loading ? (
          <div className="loading-container-table"><div className="premium-spinner-small"></div></div>
        ) : (
          <div className="table-responsive">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Mobile Number</th>
                  <th>Password</th>
                  <th>Account Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="table-row">
                    <td>
                      <div className="student-profile">
                        <div className="avatar" style={{ background: '#f1f5f9', color: '#475569' }}>👤</div>
                        <span className="font-medium">{user.username}</span>
                      </div>
                    </td>
                    <td><span className="room-text">{user.mobileNumber}</span></td>
                    <td><code style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '13px' }}>{user.password}</code></td>
                    <td>
                      {user.status === 'active' ? (
                        <span className="badge premium-pin-assigned">Active Account</span>
                      ) : (
                        <span className="badge premium-pin-pending" style={{ background: '#fee2e2', color: '#991b1b', borderColor: '#fecaca' }}>Inactive Account</span>
                      )}
                    </td>
                    <td className="text-right">
                      <button 
                        onClick={() => toggleUserStatus(user)} 
                        className="premium-logout-btn" 
                        style={user.status === 'active' ? { color: '#ef4444', borderColor: '#fee2e2' } : { color: '#10b981', borderColor: '#dcfce7' }}
                      >
                        {user.status === 'active' ? 'Block/Deactivate' : 'Unblock/Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td colSpan="5" className="premium-empty-state">No custom users registered yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageUsers;