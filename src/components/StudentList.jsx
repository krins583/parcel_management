// src/components/StudentList.jsx
import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, addDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { db } from '../firebase';
import './StudentList.css';

function StudentList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  
  // Search, Filter & Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active'); // 'active', 'inactive', 'left', 'all'
  const [sortConfig, setSortConfig] = useState({ key: 'pin', direction: 'asc' }); 
  
  // Edit Modal States
  const [editingStudent, setEditingStudent] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  // Professional Inline Message State (No Popups)
  const [message, setMessage] = useState({ type: '', text: '' });

  const fileInputRef = useRef(null);

  const fetchAllStudents = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'students'));
      const querySnapshot = await getDocs(q);
      const studentsList = [];
      querySnapshot.forEach((doc) => {
        studentsList.push({ id: doc.id, ...doc.data() });
      });
      setStudents(studentsList);
    } catch (error) {
      console.error("Error fetching students: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllStudents();
  }, []);

  // Auto-hide professional message after 3 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // --- FILTER, SEARCH & SORT LOGIC ---
  const getProcessedStudents = () => {
    let processed = [...students];

    if (statusFilter !== 'all') {
      processed = processed.filter(s => s.status === statusFilter);
    }

    if (searchQuery.trim() !== '') {
      processed = processed.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        String(s.assignedPin || '').includes(searchQuery.trim())
      );
    }

    processed.sort((a, b) => {
      if (sortConfig.key === 'pin') {
        const valA = a.hasPin && a.assignedPin ? parseInt(a.assignedPin) : 999999;
        const valB = b.hasPin && b.assignedPin ? parseInt(b.assignedPin) : 999999;
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      } else if (sortConfig.key === 'room') {
        const valA = String(a.roomNumber || '').toLowerCase();
        const valB = String(b.roomNumber || '').toLowerCase();
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      }
      return 0;
    });

    return processed;
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // --- ACTION MENU HANDLERS (No Confirm Popups - Instant Action) ---
  const toggleMenu = (id) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleToggleActiveInactive = async (student) => {
    const newStatus = student.status === 'active' ? 'inactive' : 'active';
    try {
      const studentRef = doc(db, 'students', student.id);
      await updateDoc(studentRef, { status: newStatus });
      setOpenMenuId(null);
      setMessage({ type: 'success', text: `${student.name} marked as ${newStatus.toUpperCase()} successfully!` });
      fetchAllStudents(); 
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: "Failed to update status." });
    }
  };

  const handleHostelLeave = async (student) => {
    try {
      const studentRef = doc(db, 'students', student.id);
      await updateDoc(studentRef, {
        status: 'left',
        pastPin: student.assignedPin,
        assignedPin: null,
        hasPin: false,
        leftAt: new Date()
      });
      setOpenMenuId(null);
      setMessage({ type: 'success', text: `${student.name} processed for Hostel Leave. PIN released.` });
      fetchAllStudents(); 
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: "Failed to process hostel leave." });
    }
  };

  const handleDelete = async (student) => {
    try {
      await deleteDoc(doc(db, 'students', student.id));
      setOpenMenuId(null);
      setMessage({ type: 'success', text: `${student.name} permanently deleted from database.` });
      fetchAllStudents();
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: "Failed to delete student." });
    }
  };

  // --- EDIT MODAL HANDLERS ---
  const openEditModal = (student) => {
    setEditingStudent({ ...student });
    setOpenMenuId(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const studentRef = doc(db, 'students', editingStudent.id);
      await updateDoc(studentRef, {
        name: editingStudent.name,
        phone: editingStudent.phone,
        email: editingStudent.email,
        roomNumber: editingStudent.roomNumber,
        standard: editingStudent.standard,
        updatedAt: new Date()
      });
      setEditingStudent(null);
      setMessage({ type: 'success', text: "Student profile updated successfully!" });
      fetchAllStudents();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: "Failed to update profile." });
    } finally {
      setEditLoading(false);
    }
  };

  // --- BULK UPLOAD LOGIC ---
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const existingPinsMap = new Map();
        students.forEach(s => {
          if (s.hasPin && s.assignedPin) {
            existingPinsMap.set(String(s.assignedPin), s.id);
          }
        });

        const uploadPromises = [];
        let addedCount = 0;
        let updatedCount = 0;

        for (let row of jsonData) {
          const name = row['Name'] || row['name'];
          if (!name) continue;

          const standard = String(row['Standard'] || row['standard'] || '6');
          const roomNumber = String(row['Room'] || row['room'] || row['Room Number'] || '');
          const phone = String(row['Phone'] || row['phone'] || '');
          const email = String(row['Email'] || row['email'] || '');
          
          let rawPin = row['PIN'] || row['Pin'] || row['pin'];
          let pin = rawPin ? String(rawPin).trim() : null;
          let hasPin = false;

          if (pin) {
              const pinNum = parseInt(pin);
              if (pinNum >= 1 && pinNum <= 1000) {
                 hasPin = true;
              } else {
                 pin = null;
              }
          }

          const studentData = { name, standard, roomNumber, phone, email, hasPin, assignedPin: pin, status: 'active' };

          if (pin && existingPinsMap.has(pin)) {
              const docId = existingPinsMap.get(pin);
              studentData.updatedAt = new Date();
              studentData.updatedBy = 'Bulk Upload';
              uploadPromises.push(updateDoc(doc(db, 'students', docId), studentData));
              updatedCount++;
          } else {
               studentData.createdAt = new Date();
               studentData.assignedBy = hasPin ? 'Bulk Upload' : null;
               studentData.pinAssignedAt = hasPin ? new Date() : null;
               uploadPromises.push(addDoc(collection(db, 'students'), studentData));
               if (pin) existingPinsMap.set(pin, 'pending'); 
               addedCount++;
          }
        }

        await Promise.all(uploadPromises);
        setMessage({ type: 'success', text: `Bulk Upload Done! Added: ${addedCount} | Updated: ${updatedCount}` });
        fileInputRef.current.value = ""; 
        fetchAllStudents();

      } catch (err) {
        console.error(err);
        setMessage({ type: 'error', text: "Error processing Excel/CSV file." });
      } finally {
        setUploading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const processedList = getProcessedStudents();

  return (
    <div className="premium-page-container fade-in">
      
      {/* EDIT MODAL */}
      {editingStudent && (
        <div className="sl-modal-overlay">
          <div className="sl-modal-content fade-in-up">
            <div className="sl-modal-header">
              <h3>Edit Student Profile</h3>
              <button onClick={() => setEditingStudent(null)} className="sl-close-btn">&times;</button>
            </div>
            <form onSubmit={handleEditSubmit} className="sl-edit-form">
              <div className="sl-form-row">
                <div className="sl-form-group">
                  <label>Full Name</label>
                  <input type="text" value={editingStudent.name} onChange={e => setEditingStudent({...editingStudent, name: e.target.value})} required />
                </div>
                <div className="sl-form-group">
                  <label>Room Number</label>
                  <input type="text" value={editingStudent.roomNumber} onChange={e => setEditingStudent({...editingStudent, roomNumber: e.target.value})} required />
                </div>
              </div>
              <div className="sl-form-row">
                <div className="sl-form-group">
                  <label>Phone Number</label>
                  <input type="text" value={editingStudent.phone} onChange={e => setEditingStudent({...editingStudent, phone: e.target.value})} />
                </div>
                <div className="sl-form-group">
                  <label>Standard</label>
                  <input type="text" value={editingStudent.standard} onChange={e => setEditingStudent({...editingStudent, standard: e.target.value})} />
                </div>
              </div>
              <div className="sl-form-group">
                <label>Email Address</label>
                <input type="email" value={editingStudent.email || ''} onChange={e => setEditingStudent({...editingStudent, email: e.target.value})} />
              </div>
              <button type="submit" disabled={editLoading} className="sl-btn-save">
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="premium-list-card">
        
        <div className="list-header-premium">
          <div className="header-text">
            <h2>Student Directory</h2>
            <p className="subtitle">Managing total {processedList.length} students</p>
          </div>
          
          <div className="header-actions">
            <input type="file" accept=".csv, .xlsx" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
            <button className={`premium-btn-upload ${uploading ? 'uploading' : ''}`} onClick={() => fileInputRef.current.click()} disabled={uploading}>
              {uploading ? (
                <><span className="premium-spinner-tiny"></span> Processing...</>
              ) : (
                <><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg> Bulk Upload</>
              )}
            </button>
          </div>
        </div>

        {/* PREMIUM INLINE NOTIFICATION BANNER */}
        {message.text && (
          <div style={{
            margin: '15px 30px', padding: '12px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: '600',
            background: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
            color: message.type === 'success' ? '#059669' : '#dc2626',
            border: message.type === 'success' ? '1px solid #a7f3d0' : '1px solid #fecaca',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '10px'
          }} className="fade-in">
            <span>{message.type === 'success' ? '✅' : '❌'}</span>
            <span>{message.text}</span>
          </div>
        )}

        {/* SEARCH & FILTERS BAR */}
        <div className="sl-controls-bar">
          <div className="sl-search-box">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input 
              type="text" 
              placeholder="Search by Name or PIN..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="sl-filter-box">
            <label>Status:</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Students</option>
              <option value="active">Active (In Hostel)</option>
              <option value="inactive">Inactive (Temporary)</option>
              <option value="left">Left (Hostel Leave)</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-container-table">
            <div className="premium-spinner-small"></div>
            <p>Loading student records...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Student Profile</th>
                  <th>Standard</th>
                  <th className="sl-sortable-th" onClick={() => requestSort('room')}>
                    Room No. {sortConfig.key === 'room' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Contact Info</th>
                  <th className="sl-sortable-th" onClick={() => requestSort('pin')}>
                    PIN Status {sortConfig.key === 'pin' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {processedList.length > 0 ? (
                  processedList.map((student) => (
                    <tr key={student.id} className={`table-row ${student.status === 'left' ? 'row-inactive' : ''}`}>
                      <td>
                        <div className="student-profile">
                          <div className={`avatar ${student.status === 'left' ? 'avatar-inactive' : ''}`}>
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="profile-info">
                            <span className="font-medium">{student.name}</span>
                            <span className="text-muted">{student.phone || 'No phone'}</span>
                          </div>
                        </div>
                      </td>
                      <td><span className="std-badge">{student.standard}</span></td>
                      <td><span className="room-text">{student.roomNumber || 'N/A'}</span></td>
                      <td><span className="text-muted">{student.email || 'N/A'}</span></td>
                      <td>
                        {student.hasPin ? (
                          <div className="badge premium-pin-assigned">
                            <span className="dot assigned-dot"></span> PIN: {student.assignedPin}
                          </div>
                        ) : (
                          <div className="badge premium-pin-pending">
                            <span className="dot pending-dot"></span> Pending
                          </div>
                        )}
                      </td>
                      <td>
                        {student.status === 'active' && <span className="sl-badge-active">Active</span>}
                        {student.status === 'inactive' && <span className="sl-badge-inactive">Inactive</span>}
                        {student.status === 'left' && <span className="sl-badge-left">Left</span>}
                      </td>
                      <td className="action-cell text-right">
                        <div className="action-menu-container">
                          <button className="premium-dots-btn" onClick={() => toggleMenu(student.id)}>
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1.5"></circle><circle cx="12" cy="5" r="1.5"></circle><circle cx="12" cy="19" r="1.5"></circle></svg>
                          </button>
                          
                          {openMenuId === student.id && (
                            <div className="premium-dropdown menu-animate">
                              <button onClick={() => openEditModal(student)} className="sl-dropdown-btn">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                Edit Profile
                              </button>
                              
                              <button onClick={() => handleToggleActiveInactive(student)} className="sl-dropdown-btn sl-warn-text" style={{ color: '#0284c7' }}>
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path></svg> 
                                {student.status === 'active' ? 'Mark Inactive' : 'Mark Active'}
                              </button>

                              {student.status !== 'left' && (
                                <button onClick={() => handleHostelLeave(student)} className="sl-dropdown-btn sl-warn-text">
                                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg> 
                                  Hostel Leave
                                </button>
                              )}
                              
                              <div className="sl-dropdown-divider"></div>
                              
                              <button onClick={() => handleDelete(student)} className="sl-dropdown-btn sl-danger-text">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                Delete Student
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="premium-empty-state">
                      <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" style={{marginBottom: '15px'}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      <p>No students match your criteria.</p>
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

export default StudentList;