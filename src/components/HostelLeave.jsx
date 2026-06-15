// src/components/HostelLeave.jsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import './HostelLeave.css';

function HostelLeave() {
  const [leftStudents, setLeftStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeftStudents = async () => {
      try {
        // Sirf un students ko fetch karo jinka status 'left' hai
        const q = query(collection(db, 'students'), where('status', '==', 'left'));
        const querySnapshot = await getDocs(q);
        const studentsList = [];
        querySnapshot.forEach((doc) => {
          studentsList.push({ id: doc.id, ...doc.data() });
        });
        setLeftStudents(studentsList);
      } catch (error) {
        console.error("Error fetching left students: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeftStudents();
  }, []);

  return (
    <div className="page-container">
      <div className="list-card">
        <div className="list-header">
          <h2>Hostel Leave History</h2>
          <p className="subtitle">Archived Students (PINs released)</p>
        </div>

        {loading ? (
          <div className="loading-spinner">Loading history...</div>
        ) : (
          <div className="table-responsive">
            <table className="student-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Standard</th>
                  <th>Phone</th>
                  <th>Past PIN</th>
                  <th>Leave Date</th>
                </tr>
              </thead>
              <tbody>
                {leftStudents.length > 0 ? (
                  leftStudents.map((student) => (
                    <tr key={student.id} className="archived-row">
                      <td className="font-medium">{student.name}</td>
                      <td>{student.standard}th</td>
                      <td>{student.phone}</td>
                      <td>
                        <span className="badge pin-past">Old PIN: {student.pastPin || 'N/A'}</span>
                      </td>
                      <td>
                        {student.leftAt ? new Date(student.leftAt.toDate()).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="empty-state">
                      No leave history found.
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