// src/components/StudentList.jsx
import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs, doc, updateDoc, query, where, addDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { db } from '../firebase';
import './StudentList.css';

function StudentList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  
  const fileInputRef = useRef(null);

  const fetchActiveStudents = async () => {
    try {
      const q = query(collection(db, 'students'), where('status', '==', 'active'));
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
    fetchActiveStudents();
  }, []);

  const toggleMenu = (id) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleHostelLeave = async (student) => {
    const confirmLeave = window.confirm(`Are you sure you want to move ${student.name} to Leave History? Their PIN will be released.`);
    
    if (confirmLeave) {
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
        fetchActiveStudents(); 
      } catch (error) {
        console.error("Error updating student status: ", error);
        alert("Failed to update status.");
      }
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

        // Track already assigned PINs to prevent duplicates during upload
        const existingPins = new Set();
        students.forEach(s => {
          if (s.hasPin && s.assignedPin) {
            existingPins.add(String(s.assignedPin));
          }
        });

        const uploadPromises = [];
        let addedCount = 0;
        let skippedPins = 0;

        for (let row of jsonData) {
          const name = row['Name'] || row['name'];
          if (!name) continue; // Skip empty rows

          const standard = String(row['Standard'] || row['standard'] || '6');
          const roomNumber = String(row['Room'] || row['room'] || row['Room Number'] || '');
          const phone = String(row['Phone'] || row['phone'] || '');
          
          let rawPin = row['PIN'] || row['Pin'] || row['pin'];
          let pin = rawPin ? String(rawPin).trim() : null;
          let hasPin = false;

          // Check if PIN is provided, is valid (1-1000), and is not already taken
          if (pin) {
            const pinNum = parseInt(pin);
            if (existingPins.has(pin) || pinNum < 1 || pinNum > 1000) {
              pin = null; // Reject this specific PIN but add the student
              skippedPins++;
            } else {
              hasPin = true;
              existingPins.add(pin); // Reserve this PIN so next rows don't take it
            }
          }

          const studentData = {
            name,
            standard,
            roomNumber,
            phone,
            hasPin,
            assignedPin: pin,
            status: 'active',
            createdAt: new Date(),
            assignedBy: hasPin ? 'Bulk Upload' : null,
            pinAssignedAt: hasPin ? new Date() : null
          };

          uploadPromises.push(addDoc(collection(db, 'students'), studentData));
          addedCount++;
        }

        await Promise.all(uploadPromises);
        
        alert(`Bulk Upload Complete! \n\nSuccessfully added ${addedCount} students.\n${skippedPins > 0 ? `Note: ${skippedPins} PINs were ignored because they were duplicates or out of range (1-1000).` : ''}`);
        
        // Reset and Refresh
        fileInputRef.current.value = ""; 
        fetchActiveStudents();

      } catch (err) {
        console.error(err);
        alert("Error processing file. Please ensure it's a valid Excel or CSV file.");
      } finally {
        setUploading(false);
      }
    };
    
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="premium-page-container fade-in">
      <div className="premium-list-card">
        <div className="list-header-premium">
          <div className="header-text">
            <h2>Active Students</h2>
            <p className="subtitle">Managing {students.length} students in the hostel</p>
          </div>
          
          <div className="header-actions">
            <span className="status-badge">Live System</span>
            
            {/* Hidden File Input & Bulk Upload Button */}
            <input 
              type="file" 
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileUpload} 
            />
            <button 
              className={`premium-btn-upload ${uploading ? 'uploading' : ''}`}
              onClick={() => fileInputRef.current.click()}
              disabled={uploading}
            >
              {uploading ? (
                <><span className="premium-spinner-tiny"></span> Processing...</>
              ) : (
                <><i className="fa-solid fa-cloud-arrow-up"></i> Bulk Upload</>
              )}
            </button>
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
                  <th>Room No.</th>
                  <th>PIN Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.length > 0 ? (
                  students.map((student) => (
                    <tr key={student.id} className="table-row">
                      <td>
                        <div className="student-profile">
                          <div className="avatar">{student.name.charAt(0).toUpperCase()}</div>
                          <div className="profile-info">
                            <span className="font-medium">{student.name}</span>
                            <span className="text-muted">{student.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="std-badge">{student.standard}</span>
                      </td>
                      <td>
                        <span className="room-text">{student.roomNumber}</span>
                      </td>
                      <td>
                        {student.hasPin ? (
                          <div className="badge premium-pin-assigned">
                            <span className="dot assigned-dot"></span>
                            PIN: {student.assignedPin}
                          </div>
                        ) : (
                          <div className="badge premium-pin-pending">
                            <span className="dot pending-dot"></span>
                            Pending
                          </div>
                        )}
                      </td>
                      <td className="action-cell text-right">
                        <div className="action-menu-container">
                          <button 
                            className={`premium-dots-btn ${openMenuId === student.id ? 'active' : ''}`} 
                            onClick={() => toggleMenu(student.id)}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <circle cx="12" cy="12" r="1.5" />
                              <circle cx="12" cy="5" r="1.5" />
                              <circle cx="12" cy="19" r="1.5" />
                            </svg>
                          </button>
                          
                          {openMenuId === student.id && (
                            <div className="premium-dropdown menu-animate">
                              <button onClick={() => handleHostelLeave(student)} className="premium-leave-btn">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Mark Hostel Leave
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="premium-empty-state">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <p>No active students found in the database.</p>
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