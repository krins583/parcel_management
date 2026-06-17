// src/components/HostelLeave.jsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import './HostelLeave.css';

function HostelLeave() {
  const [leftStudents, setLeftStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search and Messages
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchLeftStudents = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'students'), where('status', '==', 'left'));
      const querySnapshot = await getDocs(q);
      const studentsList = [];
      querySnapshot.forEach((doc) => {
        studentsList.push({ id: doc.id, ...doc.data() });
      });
      
      // Sort by leave date (newest first)
      studentsList.sort((a, b) => {
        if (!a.leftAt) return 1;
        if (!b.leftAt) return -1;
        return b.leftAt.toDate() - a.leftAt.toDate();
      });

      setLeftStudents(studentsList);
      setFilteredStudents(studentsList);
    } catch (error) {
      console.error("Error fetching left students: ", error);
      setMessage({ type: 'error', text: "Failed to load leave history." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeftStudents();
  }, []);

  // Live Search Logic
  useEffect(() => {
    if (searchQuery.trim() !== '') {
      const result = leftStudents.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        String(s.pastPin || '').includes(searchQuery.trim())
      );
      setFilteredStudents(result);
    } else {
      setFilteredStudents(leftStudents);
    }
  }, [searchQuery, leftStudents]);

  // Auto-hide alert message
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // --- BACK TO HOSTEL LOGIC ---
  const handleReadmit = async (student) => {
    try {
      const studentRef = doc(db, 'students', student.id);
      await updateDoc(studentRef, {
        status: 'active',    // Wapas active kar diya
        hasPin: false,       // PIN hata diya
        assignedPin: null,   // PIN field clear kar di
        readmittedAt: new Date()
      });
      
      setMessage({ type: 'success', text: `Success! ${student.name} is back in hostel. Please assign a new PIN.` });
      fetchLeftStudents(); // List refresh
    } catch (error) {
      console.error("Error reading student: ", error);
      setMessage({ type: 'error', text: "Failed to readmit student." });
    }
  };

  return (
    <div className="premium-page-container fade-in">
      <div className="premium-list-card">
        
        {/* HEADER */}
        <div className="list-header-premium">
          <div className="hl-header-flex">
            <div className="hl-header-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" /></svg>
            </div>
            <div>
              <h2>Hostel Leave History</h2>
              <p className="subtitle">Archived records of students who have left. Their old PINs are released.</p>
            </div>
          </div>
        </div>

        {/* INLINE NOTIFICATION BANNER */}
        {message.text && (
          <div className={`hl-alert-banner ${message.type} fade-in`}>
            <span className="alert-icon">{message.type === 'success' ? '✅' : '❌'}</span>
            <span className="alert-text">{message.text}</span>
          </div>
        )}

        {/* SEARCH BAR */}
        <div className="hl-controls-bar">
          <div className="hl-search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input 
              type="text" 
              placeholder="Search by Name or Old PIN..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* TABLE DATA */}
        {loading ? (
          <div className="loading-container-table">
            <div className="premium-spinner-small"></div>
            <p style={{color: '#64748b', marginLeft: '10px', fontWeight: '600'}}>Loading history...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Student Profile</th>
                  <th>Standard / Contact</th>
                  <th>Past PIN Details</th>
                  <th>Leave Date</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="table-row row-archived">
                      <td>
                        <div className="hl-profile">
                          <div className="hl-avatar">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{student.name}</span>
                        </div>
                      </td>
                      <td>
                        <div className="hl-contact-info">
                          <span className="hl-std">Std: {student.standard || '06'}th</span>
                          <span className="hl-phone">{student.phone || 'No phone'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="past-pin-badge">
                          Old PIN: <span className="strike-pin">{student.pastPin || 'N/A'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="date-text">
                          {student.leftAt ? student.leftAt.toDate().toLocaleString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'}) : 'Unknown'}
                        </span>
                      </td>
                      <td className="text-right">
                        <button onClick={() => handleReadmit(student)} className="btn-readmit">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                          Back to Hostel
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="premium-empty-state">
                      <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" style={{marginBottom: '15px'}}><path d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6"></path></svg>
                      <p>No leave history found matching your search.</p>
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

export default HostelLeave;