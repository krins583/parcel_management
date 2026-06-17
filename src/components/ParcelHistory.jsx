// src/components/ParcelHistory.jsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // <-- Isko aise update karein
import { db } from '../firebase';
import './ParcelHistory.css'; // Nayi Premium CSS file link ki hai

function ParcelHistory() {
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchPin, setSearchPin] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const q = query(collection(db, 'parcels'), where('status', '==', 'Received'));
        const snap = await getDocs(q);
        const list = [];
        snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
        
        list.sort((a, b) => b.receivedAt.toDate() - a.receivedAt.toDate());
        setHistory(list);
        setFilteredHistory(list);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // Filter Logic
  useEffect(() => {
    let result = history;

    // Filter by PIN
    if (searchPin.trim() !== '') {
      result = result.filter(p => 
        String(p.pin).includes(searchPin.trim()) || 
        p.studentName.toLowerCase().includes(searchPin.toLowerCase())
      );
    }

    // Filter by Date Range
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter(p => p.receivedAt.toDate() >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(p => p.receivedAt.toDate() <= end);
    }

    setFilteredHistory(result);
  }, [searchPin, startDate, endDate, history]);

  const clearFilters = () => {
    setSearchPin('');
    setStartDate('');
    setEndDate('');
  };

  // ================= EXPORT TO EXCEL =================
  const exportToExcel = () => {
    if (filteredHistory.length === 0) return alert("No data to export!");

    const exportData = filteredHistory.map(p => ({
      "Student Name": p.studentName,
      "PIN": p.pin,
      "Room Number": p.roomNumber,
      "Parcel Items": p.parcelName,
      "Received Date & Time": p.receivedAt?.toDate().toLocaleString('en-IN'),
      "Handed Over By": p.receivedBy
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Parcel History");
    XLSX.writeFile(workbook, `Parcel_History_${new Date().getTime()}.xlsx`);
  };

  // ================= EXPORT TO PDF (PREMIUM) =================
  // ================= EXPORT TO PDF (PREMIUM) =================
  const exportToPDF = () => {
    if (filteredHistory.length === 0) return alert("No data to export!");

    const doc = new jsPDF('landscape');
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42);
    doc.text("SGVP Hostel - Parcel History Log", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on: ${new Date().toLocaleString('en-IN')} | Total Records: ${filteredHistory.length}`, 14, 30);

    // Table Data
    const tableColumn = ["Student Name", "PIN", "Room No", "Parcel Items", "Received Date & Time", "Handed Over By"];
    const tableRows = [];

    filteredHistory.forEach(p => {
      const rowData = [
        p.studentName,
        p.pin,
        p.roomNumber || 'N/A',
        p.parcelName,
        p.receivedAt?.toDate().toLocaleString('en-IN'),
        p.receivedBy
      ];
      tableRows.push(rowData);
    });

    // Auto Table Styling (YAHAN CHANGE KIYA HAI)
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 38,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 5 },
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { top: 38 }
    });

    doc.save(`Parcel_History_${new Date().getTime()}.pdf`);
  };

  return (
    <div className="history-page-wrapper fade-in">
      <div className="history-main-card">
        
        {/* HEADER SECTION */}
        <div className="history-header">
          <div className="header-titles">
            <div className="icon-box"><i className="fa-solid fa-clock-rotate-left"></i></div>
            <div>
              <h2>Parcel Distribution Log</h2>
              <p>Permanent records of all handed-over parcels</p>
            </div>
          </div>
          
          <div className="export-buttons">
            <button onClick={exportToExcel} className="btn-export btn-excel">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Excel
            </button>
            <button onClick={exportToPDF} className="btn-export btn-pdf">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              Export PDF
            </button>
          </div>
        </div>

        {/* FILTERS SECTION */}
        <div className="history-filters">
          <div className="filter-group search-group">
            <svg className="filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input 
              type="text" 
              placeholder="Search by PIN or Name..." 
              value={searchPin}
              onChange={(e) => setSearchPin(e.target.value)}
            />
          </div>

          <div className="date-filters">
            <div className="filter-group">
              <span className="filter-label">From:</span>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <span className="filter-label">To:</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            {(searchPin || startDate || endDate) && (
              <button onClick={clearFilters} className="btn-clear-filters">
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* TABLE SECTION */}
        {loading ? (
          <div className="history-loading">
            <div className="premium-spinner"></div>
            <p>Loading records...</p>
          </div>
        ) : (
          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Student Info</th>
                  <th>Parcel Items</th>
                  <th>Received Date & Time</th>
                  <th>Handed By</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map(p => (
                  <tr key={p.id} className="h-table-row">
                    <td>
                      <div className="student-cell">
                        <div className="s-avatar">{p.studentName.charAt(0)}</div>
                        <div>
                          <strong className="s-name">{p.studentName}</strong>
                          <div className="s-badges">
                            <span className="badge-pin">PIN: {p.pin}</span>
                            <span className="badge-room">Room {p.roomNumber || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong className="p-item">{p.parcelName}</strong>
                      {p.remarks && <p className="p-remark">Note: {p.remarks}</p>}
                    </td>
                    <td>
                      <span className="date-cell">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        {p.receivedAt?.toDate().toLocaleString('en-IN', {day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true})}
                      </span>
                    </td>
                    <td>
                      <span className="staff-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        {p.receivedBy}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredHistory.length === 0 && (
                  <tr>
                    <td colSpan="4" className="history-empty">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                      <h3>No Records Found</h3>
                      <p>Try adjusting your search or date filters.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="history-footer">
          Showing {filteredHistory.length} record(s)
        </div>

      </div>
    </div>
  );
}

export default ParcelHistory;