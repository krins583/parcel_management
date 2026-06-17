// src/components/ManageUsers.jsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './ManageUsers.css';

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);
  
  // Premium Inline Message
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Edit Modal States
  const [editingUser, setEditingUser] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'users'));
      const userList = [];
      querySnapshot.forEach((doc) => {
        userList.push({ id: doc.id, ...doc.data() });
      });
      setUsers(userList);
    } catch (error) {
      console.error("Error fetching users: ", error);
      setMessage({ type: 'error', text: "Failed to load users data." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Auto-hide alert message
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const toggleMenu = (id) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  // --- ACTIONS (NO POPUPS) ---
  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await updateDoc(doc(db, 'users', user.id), { status: nextStatus });
      setOpenMenuId(null);
      setMessage({ type: 'success', text: `${user.username} account is now ${nextStatus.toUpperCase()}!` });
      fetchUsers();
    } catch (error) {
      setMessage({ type: 'error', text: "Failed to update user status." });
    }
  };

  const handleDelete = async (user) => {
    try {
      await deleteDoc(doc(db, 'users', user.id));
      setOpenMenuId(null);
      setMessage({ type: 'success', text: `User ${user.username} deleted permanently.` });
      fetchUsers();
    } catch (error) {
      setMessage({ type: 'error', text: "Failed to delete user." });
    }
  };

  // --- EDIT MODAL HANDLERS ---
  const openEditModal = (user) => {
    setEditingUser({ ...user });
    setOpenMenuId(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await updateDoc(doc(db, 'users', editingUser.id), {
        username: editingUser.username,
        mobileNumber: editingUser.mobileNumber,
        password: editingUser.password,
      });
      setEditingUser(null);
      setMessage({ type: 'success', text: "User profile updated successfully!" });
      fetchUsers();
    } catch (err) {
      setMessage({ type: 'error', text: "Failed to update profile." });
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="premium-page-container fade-in">
      
      {/* --- EDIT MODAL --- */}
      {editingUser && (
        <div className="mu-modal-overlay">
          <div className="mu-modal-content fade-in-up">
            <div className="mu-modal-header">
              <h3>Edit User Details</h3>
              <button onClick={() => setEditingUser(null)} className="mu-close-btn">&times;</button>
            </div>
            <form onSubmit={handleEditSubmit} className="mu-edit-form">
              <div className="mu-form-group">
                <label>Username</label>
                <input 
                  type="text" 
                  value={editingUser.username} 
                  onChange={e => setEditingUser({...editingUser, username: e.target.value})} 
                  required 
                />
              </div>
              <div className="mu-form-group">
                <label>Mobile Number</label>
                <input 
                  type="tel" 
                  value={editingUser.mobileNumber} 
                  onChange={e => setEditingUser({...editingUser, mobileNumber: e.target.value})} 
                  required 
                  pattern="[0-9]{10}"
                />
              </div>
              <div className="mu-form-group">
                <label>Password</label>
                <input 
                  type="text" 
                  value={editingUser.password} 
                  onChange={e => setEditingUser({...editingUser, password: e.target.value})} 
                  required 
                  minLength="5"
                />
              </div>
              <button type="submit" disabled={editLoading} className="mu-btn-save">
                {editLoading ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="premium-list-card">
        
        <div className="list-header-premium">
          <div className="header-text-group">
            <div className="mu-header-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <div>
              <h2>Manage System Users</h2>
              <p className="subtitle">Control access, passwords, and operational status.</p>
            </div>
          </div>
        </div>

        {/* --- PREMIUM INLINE NOTIFICATION BANNER --- */}
        {message.text && (
          <div className={`mu-alert-banner ${message.type} fade-in`}>
            <span className="alert-icon">{message.type === 'success' ? '✅' : '❌'}</span>
            <span className="alert-text">{message.text}</span>
          </div>
        )}

        {loading ? (
          <div className="loading-container-table">
            <div className="premium-spinner-small"></div>
            <p style={{color: '#64748b', marginLeft: '10px', fontWeight: '600'}}>Fetching users...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>User Profile</th>
                  <th>Mobile Number</th>
                  <th>Password</th>
                  <th>Account Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className={`table-row ${user.status !== 'active' ? 'row-inactive' : ''}`}>
                    <td>
                      <div className="user-profile">
                        <div className={`mu-avatar ${user.status !== 'active' ? 'avatar-inactive' : ''}`}>
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{user.username}</span>
                      </div>
                    </td>
                    <td><span className="info-text">{user.mobileNumber}</span></td>
                    <td>
                      <code className="password-badge">{user.password}</code>
                    </td>
                    <td>
                      {user.status === 'active' ? (
                        <div className="status-badge active">
                          <span className="dot active-dot"></span> Active
                        </div>
                      ) : (
                        <div className="status-badge inactive">
                          <span className="dot inactive-dot"></span> Inactive
                        </div>
                      )}
                    </td>
                    <td className="action-cell text-right">
                      <div className="action-menu-container">
                        <button className="mu-dots-btn" onClick={() => toggleMenu(user.id)}>
                          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1.5"></circle><circle cx="12" cy="5" r="1.5"></circle><circle cx="12" cy="19" r="1.5"></circle></svg>
                        </button>
                        
                        {openMenuId === user.id && (
                          <div className="mu-dropdown menu-animate">
                            <button onClick={() => openEditModal(user)} className="mu-dropdown-btn">
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                              Edit Profile
                            </button>
                            
                            <button onClick={() => handleToggleStatus(user)} className="mu-dropdown-btn mu-warn-text">
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path></svg> 
                              {user.status === 'active' ? 'Mark Inactive' : 'Mark Active'}
                            </button>
                            
                            <div className="mu-dropdown-divider"></div>
                            
                            <button onClick={() => handleDelete(user)} className="mu-dropdown-btn mu-danger-text">
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                              Delete User
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="5" className="premium-empty-state">
                      <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                      <p>No system users registered yet.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageUsers;