// src/components/CreateStudent.jsx
import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase'; 
import './CreateStudent.css';

function CreateStudent() {
  const [formData, setFormData] = useState({
    name: '',
    standard: '6',
    roomNumber: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await addDoc(collection(db, 'students'), {
        ...formData,
        hasPin: false,
        assignedPin: null,
        status: 'active',
        createdAt: new Date()
      });

      setMessage({ type: 'success', text: 'Student profile successfully created!' });
      
      setFormData({ name: '', standard: '6', roomNumber: '', phone: '' });
      
      // Auto-hide success message after 4 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);

    } catch (error) {
      console.error("Error adding document: ", error);
      setMessage({ type: 'error', text: 'Failed to add student. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-page-container fade-in">
      <div className="premium-form-card">
        
        <div className="form-header">
          <div className="header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <div>
            <h2>Register New Student</h2>
            <p className="subtitle">Enter details to add a student to the hostel system.</p>
          </div>
        </div>

        {message.text && (
          <div className={`premium-alert ${message.type} fade-in`}>
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="premium-form">
          <div className="form-group">
            <label>Student Full Name</label>
            <div className="input-wrapper">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                required 
                placeholder="e.g. Krins Sutariya"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group half-width">
              <label>Standard</label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                </svg>
                <select 
                  name="standard" 
                  value={formData.standard} 
                  onChange={handleChange}
                  required
                >
                  {[6, 7, 8, 9, 10, 11, 12].map(std => (
                    <option key={std} value={std}>{std}th Standard</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group half-width">
              <label>Room Number</label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <input 
                  type="text" 
                  name="roomNumber" 
                  value={formData.roomNumber} 
                  onChange={handleChange} 
                  required 
                  placeholder="e.g. 101A"
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Contact Number (International Allowed)</label>
            <div className="input-wrapper">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <input 
                type="tel" 
                name="phone" 
                value={formData.phone} 
                onChange={handleChange} 
                required 
                placeholder="e.g. +91 9876543210"
                pattern="^\+?[0-9\s\-]{9,15}$"
                title="Phone number can include a '+' and must be 9 to 15 digits long."
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading} className="premium-submit-btn">
              {loading ? 'Processing...' : 'Create Student Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateStudent;