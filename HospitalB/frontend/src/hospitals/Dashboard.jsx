import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalPatients: 0, sharedPatients: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching dashboard stats:', err);
        setLoading(false);
      });
  }, []);

  const handlePatientList = () => {
    navigate('/hospitals/patient-list');
  };

  const handleShareData = () => {
    navigate('/hospitals/share-data');
  };

  return (
    <div className="dashboard">
      <h1>Welcome back, Doctor</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.1rem' }}>
        Hospital B Management System Overview
      </p>

      <div className="stats">
        <div className="stat-card">
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👥</div>
          <h2>{loading ? '...' : stats.totalPatients}</h2>
          <p>Total Patients</p>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📡</div>
          <h2>{loading ? '...' : stats.sharedPatients}</h2>
          <p>Shared with MediConnectAI</p>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✅</div>
          <h2>08</h2>
          <p>Recent Appointments</p>
        </div>
      </div>

      <div className="dashboard-buttons">
        <button className="btn-primary" onClick={handlePatientList}>
          <span>📋</span> View Patient List
        </button>
        <button className="btn-outline" onClick={handleShareData}>
          <span>🔄</span> Data Sharing Settings
        </button>
      </div>
    </div>
  );
};

export default Dashboard;

