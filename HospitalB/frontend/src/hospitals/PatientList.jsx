import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';

const PatientList = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/patients')
      .then(res => res.json())
      .then(data => {
        setPatients(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching patients:', err);
        setLoading(false);
      });
  }, []);

  const handleView = (id) => {
    navigate(`/hospitals/patient/${id}`);
  };

  const handleEdit = (id) => {
    navigate(`/hospitals/edit-patient/${id}`);
  };

  return (
    <div className="dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>🧑‍⚕️ Patient Directory</h1>
        <button className="btn-primary" onClick={() => navigate('/hospitals/add-patient')}>
          <span>➕</span> Add Patient
        </button>
      </div>

      {loading ? (
        <div className="stat-card" style={{ padding: '40px' }}>
          <p>Gathering patient records...</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="patient-table">
            <thead>
              <tr>
                <th>System ID</th>
                <th>Full Name</th>
                <th>Age</th>
                <th>Medical Condition</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: '600', color: 'var(--primary)' }}>{p.id}</td>
                  <td style={{ fontWeight: '500' }}>{p.name}</td>
                  <td>{p.age}</td>
                  <td>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      backgroundColor: 'rgba(26, 115, 232, 0.1)',
                      color: 'var(--primary)',
                      fontSize: '0.85rem',
                      fontWeight: '500'
                    }}>
                      {p.condition}
                    </span>
                  </td>
                  <td>
                    <div className="actions-cell" style={{ justifyContent: 'center' }}>
                      <button className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => handleView(p.id)}>
                        👁 View
                      </button>
                      <button className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => handleEdit(p.id)}>
                        ✏️ Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PatientList;
