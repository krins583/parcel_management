// src/components/PinAllocation.jsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import './PinAllocation.css';

function PinAllocation() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [availablePins, setAvailablePins] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Pending', 'Assigned'

  // Selection & Assignment States
  const [selectedStudent, setSelectedStudent] = useState(null); 
  const [pinNumber, setPinNumber] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const qAll = query(collection(db, 'students'), where('status', '==', 'active'));
      const snapAll = await getDocs(qAll);
      const allList = [];
      const assignedPinList = [];

      snapAll.forEach(doc => {
        const data = doc.data();
        allList.push({ id: doc.id, ...data });
        if (data.hasPin && data.assignedPin) {
          assignedPinList.push(String(data.assignedPin));
        }
      });
      setStudents(allList);
      setFilteredStudents(allList);

      // 1 se 1000 tak PINs generate karna aur assigned PINs ko filter out karna
      const all1000Pins = Array.from({ length: 1000 }, (_, i) => String(i + 1));
      const freePins = all1000Pins.filter(pin => !assignedPinList.includes(pin));
      setAvailablePins(freePins);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Live Filter & Search Logic
  useEffect(() => {
    let result = students;

    // Search by Name or PIN
    if (searchQuery.trim() !== '') {
      result = result.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        String(s.assignedPin || '').includes(searchQuery.trim())
      );
    }

    // Filter by Status (Pending/Assigned)
    if (statusFilter === 'Pending') {
      result = result.filter(s => !s.hasPin);
    } else if (statusFilter === 'Assigned') {
      result = result.filter(s => s.hasPin);
    }

    setFilteredStudents(result);
  }, [searchQuery, statusFilter, students]);

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !pinNumber) {
      alert("Please select a student and enter a PIN.");
      return;
    }

    try {
      // Manual entry hone par check karna ki wo PIN free hai ya nahi
      const isPinAssigned = students.some(s => String(s.assignedPin) === String(pinNumber) && s.status === 'active');
      if (isPinAssigned) {
        alert(`PIN ${pinNumber} is already assigned to someone else!`);
        return;
      }

      const studentRef = doc(db, 'students', selectedStudent.id);
      await updateDoc(studentRef, {
        hasPin: true,
        assignedPin: pinNumber,
        pinAssignedAt: new Date(),
        assignedBy: 'Admin'
      });

      alert(`Success! PIN ${pinNumber} assigned to ${selectedStudent.name}.`);
      setPinNumber('');
      setSelectedStudent(null);
      fetchData(); // List update hogi aur dropdown se wo PIN gayab ho jayega
    } catch (error) {
      console.error(error);
      alert("Failed to assign PIN.");
    }
  };

  return (
    <div className="pin-page-wrapper fade-in">
      
      <div className="pin-header-section">
        <div className="pin-titles">
          <div className="pin-icon-box"><i className="fa-solid fa-key"></i></div>
          <div>
            <h2>PIN Allocation System</h2>
            <p>Manage and assign secure PINs to active students</p>
          </div>
        </div>
      </div>

      <div className="pin-control-bar">
        <div className="pin-search-group">
          <i className="fa-solid fa-magnifying-glass search-icon"></i>
          <input 
            type="text" 
            placeholder="Search by Student Name or PIN No..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="pin-filter-group">
          <label><i className="fa-solid fa-filter"></i> Filter:</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="All">All Students</option>
            <option value="Pending">Pending PINs Only</option>
            <option value="Assigned">Assigned PINs Only</option>
          </select>
        </div>
      </div>

      <div className="pin-main-grid">
        
        {/* Left Side: Student List */}
        <div className="pin-list-panel">
          <div className="panel-heading">
            <h3>Student Roster</h3>
            <span className="count-badge">{filteredStudents.length} Records</span>
          </div>

          {loading ? (
            <div className="pin-loading">
              <div className="premium-spinner"></div>
              <p>Loading students...</p>
            </div>
          ) : (
            <div className="pin-table-container">
              <table className="pin-table">
                <thead>
                  <tr>
                    <th width="50" className="text-center">Select</th>
                    <th>Student Details</th>
                    <th className="text-center">PIN Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(student => (
                    <tr 
                      key={student.id} 
                      className={`pin-t-row ${selectedStudent?.id === student.id ? 'row-selected' : ''}`}
                      onClick={() => !student.hasPin && setSelectedStudent(student)}
                    >
                      <td className="text-center">
                        <div className="custom-radio-wrapper">
                          <input 
                            type="radio" 
                            name="studentSelection" 
                            checked={selectedStudent?.id === student.id}
                            onChange={() => setSelectedStudent(student)}
                            disabled={student.hasPin} 
                          />
                          <span className="radio-checkmark"></span>
                        </div>
                      </td>
                      <td>
                        <div className="st-info-cell">
                          <div className="st-avatar">{student.name.charAt(0)}</div>
                          <div>
                            <strong className="st-name">{student.name}</strong>
                            <div className="st-meta">Std: {student.standard || '06'} | Room: {student.roomNumber || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-center">
                        {student.hasPin ? (
                          <div className="status-badge assigned">
                            <span>{student.assignedPin}</span>
                          </div>
                        ) : (
                          <div className="status-badge pending">Pending</div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan="3" className="pin-empty-state">
                        <i className="fa-solid fa-folder-open empty-icon"></i>
                        <p>No students match your search/filter.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Side: Assign Form */}
        <div className="pin-form-panel">
          <div className="assign-card sticky-card">
            <h3><i className="fa-solid fa-lock" style={{marginRight: '8px', color: '#3b82f6'}}></i> Assign New PIN</h3>
            
            <form onSubmit={handleAssign}>
              
              <div className="p-form-group">
                <label>Selected Student</label>
                <div className={`selected-display ${selectedStudent ? 'active-selection' : ''}`}>
                  {selectedStudent ? (
                     <div className="s-display-content">
                       <span className="s-disp-name">{selectedStudent.name}</span>
                       <span className="s-disp-room">Room {selectedStudent.roomNumber}</span>
                     </div>
                  ) : 'Select a pending student from the left'}
                </div>
              </div>

              <div className="p-form-group">
                <label>Available PIN Number (1-1000)</label>
                <div className="select-wrapper">
                  <select 
                    value={pinNumber} 
                    onChange={(e) => setPinNumber(e.target.value)}
                  >
                    <option value="">-- Choose a Free PIN --</option>
                    {availablePins.map(pin => (
                      <option key={pin} value={pin}>PIN: {pin}</option>
                    ))}
                  </select>
                  <i className="fa-solid fa-chevron-down select-icon"></i>
                </div>
                <small className="p-help">Assigned PINs are automatically hidden from this list.</small>
              </div>

              <div className="p-divider"><span>OR</span></div>

              <div className="p-form-group">
                <label>Manual PIN Entry <span className="p-req">*</span></label>
                <input 
                  type="number" 
                  className="p-manual-input"
                  placeholder="Enter a 1 to 3 digit PIN" 
                  value={pinNumber}
                  onChange={(e) => setPinNumber(e.target.value)}
                  min="1"
                  max="1000"
                  required
                />
              </div>

              <button type="submit" className="btn-allocate" disabled={!selectedStudent || !pinNumber}>
                <i className="fa-solid fa-shield-halved"></i> Allocate PIN
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}

export default PinAllocation;