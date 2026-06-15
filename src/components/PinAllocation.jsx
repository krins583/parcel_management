// src/components/PinAllocation.jsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import './PinAllocation.css';

function PinAllocation() {
  const [students, setStudents] = useState([]);
  const [availablePins, setAvailablePins] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Naye States for Selection and Auto-fill
  const [selectedStudent, setSelectedStudent] = useState(null); 
  const [pinNumber, setPinNumber] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const now = new Date().toLocaleString('en-IN', { 
    day: '2-digit', month: '2-digit', year: 'numeric', 
    hour: '2-digit', minute: '2-digit', hour12: true 
  });

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
    <div className="allocation-wrapper">
      <div className="top-nav-bar">
        <div className="breadcrumb">
          <span className="page-main">Pin Allocation</span>
          <span className="page-sub">Dashboard — Student List — Pin Allocation</span>
        </div>
        <div className="date-time">{now}</div>
      </div>

      <div className="search-section">
        <div className="search-inputs">
          <div className="input-with-icon">
             <i className="fa-solid fa-magnifying-glass"></i>
             <input type="text" placeholder="Search pin number here" />
          </div>
          <div className="input-with-icon">
             <i className="fa-solid fa-user"></i>
             <input type="text" placeholder="Search student here" />
          </div>
        </div>
        <div className="search-btns">
          <button className="btn-search">Search</button>
          <button className="btn-clear">Clear</button>
          <button className="btn-advanced">Advanced</button>
        </div>
      </div>

      <div className="allocation-grid">
        
        {/* Left Side: Student List */}
        <div className="student-list-panel">
          <div className="panel-header">
            <h3>Student List</h3>
            <span className="count-label">Select a student to assign PIN</span>
          </div>

          <div className="table-responsive">
            <table className="allocation-table">
              <thead>
                <tr>
                  <th width="40" className="text-center">#</th>
                  <th>STUDENT NAME</th>
                  <th>PIN NO.</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr 
                    key={student.id} 
                    className={selectedStudent?.id === student.id ? 'selected-row' : ''}
                    onClick={() => !student.hasPin && setSelectedStudent(student)} // Click row to select
                  >
                    <td className="text-center">
                      <input 
                        type="radio" 
                        name="studentSelection" 
                        checked={selectedStudent?.id === student.id}
                        onChange={() => setSelectedStudent(student)}
                        disabled={student.hasPin} // Jisko PIN mil gaya wo select nahi hoga
                        className="custom-radio"
                      />
                    </td>
                    <td>
                      <div className="st-name-container">
                        <div className="avatar-small">{student.name.charAt(0)}</div>
                        <div>
                          <div className="st-name">{student.name}</div>
                          <div className="st-std">STD: {student.standard || '06'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{student.assignedPin ? <span className="pin-highlight">{student.assignedPin}</span> : '—'}</td>
                    <td>
                      {student.hasPin ? (
                        <span className="badge-assigned"><i className="fa-solid fa-check"></i> Assigned</span>
                      ) : (
                        <span className="badge-pending">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Assign Form */}
        <div className="assign-form-panel">
          <div className="assign-card">
            <h3>Assign Pin Number</h3>
            
            <form onSubmit={handleAssign}>
              
              <div className="form-item">
                <label>Selected Student</label>
                <div className="selected-student-display">
                  {selectedStudent ? selectedStudent.name : 'Please select a student from the list'}
                </div>
              </div>

              <div className="form-item">
                <label>Available Pin Number (1-1000)</label>
                <select 
                  value={pinNumber} 
                  onChange={(e) => setPinNumber(e.target.value)}
                >
                  <option value="">-- Select a Free PIN --</option>
                  {availablePins.map(pin => (
                    <option key={pin} value={pin}>{pin}</option>
                  ))}
                </select>
                <small className="help-text">Assigned PINs are automatically hidden.</small>
              </div>

              <div className="form-item">
                <label>Assign New / Manual Entry <span className="req">*</span></label>
                <input 
                  type="number" 
                  placeholder="Enter or select pin number" 
                  value={pinNumber}
                  onChange={(e) => setPinNumber(e.target.value)}
                  min="1"
                  max="1000"
                  required
                />
              </div>

              <button type="submit" className="btn-assign-main" disabled={!selectedStudent}>
                Assign PIN
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}

export default PinAllocation;